"""Fetch university details and program summaries (details stage).

    .venv/bin/python details.py                 # all schools in data/raw/programs.json
    .venv/bin/python details.py --limit 5       # quick test
    .venv/bin/python details.py --refresh       # ignore the cache and re-fetch

For every school (campus) in the scraped pool this reads two public sources,
which need no login:

  * the public school page  https://www.applyboard.com/schools/<slug>
      about text, institution type, founding year, location + coordinates,
      logo, campus photos, program-level / discipline mix, typical program
      length, work-while-studying / co-op / accommodation information
  * the public programs API  /api/public-website/school-programs
      the description ("about this program") of every program at the school

Each school is cached as data/raw/schools/<schoolId>.json, so an interrupted
run resumes where it stopped. organize.py merges these files into
universities.json and the course summaries.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rsc  # noqa: E402

HERE = Path(__file__).parent
CACHE = HERE / "data" / "raw" / "schools"
SCHOOL_URL = "https://www.applyboard.com/schools/{slug}"
PROGRAMS_API = ("https://app.applyboard.com/api/public-website/school-programs"
                "?filter%5Bschool%5D%5Bid%5D={id}&page%5Bnumber%5D={page}&page%5Bsize%5D=100")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/130.0 Safari/537.36",
    "Accept-Language": "en",
}

LOGO_RE = re.compile(r"https://photos\.applyboard\.com/schools/[0-9/]+/logos/(?:small|medium|large|original)/[^\"\\\s<>]+")
PHOTO_RE = re.compile(r"https://photos\.applyboard\.com/school_photos/[0-9/]+/photos/optimized/[^\"\\\s<>&%]+")
META_RE = re.compile(r'<meta name="description" content="([^"]*)"')
# Rows on the page that are about money are deliberately not collected.
MONEY_RE = re.compile(r"tuition|cost|fee|\$|£|€|usd|cad|aud|gbp", re.I)


def fetch(url: str, accept: str, retries: int = 4) -> str | None:
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={**HEADERS, "Accept": accept})
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(4 * (attempt + 1))
                continue
            return None
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(3 * (attempt + 1))
    return None


def _node_class(node) -> str:
    if isinstance(node, list) and len(node) == 4 and node[0] == "$" and isinstance(node[3], dict):
        return str(node[3].get("className") or "")
    return ""


def _cards(tree) -> dict[str, list]:
    """Map card heading -> the card node, for 'ui-card' sections."""
    cards = {}
    for node in rsc.walk(tree):
        if "ui-card" in _node_class(node) and "ui-card" == _node_class(node).split()[0]:
            heading = next((rsc.text_of(n) for n in rsc.walk(node)
                            if isinstance(n, list) and len(n) == 4 and n[0] == "$" and n[1] in ("h2", "h3")), "")
            if heading and heading not in cards:
                cards[heading] = node
    return cards


def _in_order(node):
    """Depth-first, document-order traversal of rendered React nodes."""
    yield node
    if isinstance(node, list):
        if len(node) == 4 and node[0] == "$" and isinstance(node[3], dict):
            yield from _in_order(node[3].get("children"))
        else:
            for child in node:
                yield from _in_order(child)
    elif isinstance(node, dict):
        yield from _in_order(node.get("children"))


def _rows(card) -> list[tuple[str, str]]:
    """(label, value) pairs from Row-style children of a card, in page order."""
    out = []
    for node in _in_order(card):
        if "Row" not in _node_class(node):
            continue
        dts = [rsc.text_of(n) for n in _in_order(node) if isinstance(n, list) and len(n) == 4 and n[0] == "$" and n[1] == "dt"]
        dds = [rsc.text_of(n) for n in _in_order(node) if isinstance(n, list) and len(n) == 4 and n[0] == "$" and n[1] == "dd"]
        if dts and dds:
            out.append((dts[0].strip(), dds[0].strip()))
        else:
            whole = rsc.text_of(node).strip()
            if whole:
                out.append((whole, ""))
    seen, uniq = set(), []
    for pair in out:
        if pair not in seen:
            seen.add(pair)
            uniq.append(pair)
    return uniq


def _pct_rows(card) -> list[dict]:
    out = []
    for label, value in _rows(card):
        text = f"{label}{value}"
        m = re.search(r"(\d{1,3})%", text)
        if not m:
            continue
        name = re.sub(r"\s*\d{1,3}%\s*", "", text).strip()
        if name and not MONEY_RE.search(name):
            out.append({"label": name, "percent": int(m.group(1))})
    return out


def parse_school_page(html: str) -> dict:
    recs = rsc.records(rsc.payload(html))
    tree = rsc.resolve(list(recs.values()), recs)

    props = next((n for n in rsc.walk(tree)
                  if isinstance(n, dict) and "about" in n and "features" in n and "location" in n), {}) or {}
    features = props.get("features") or {}
    accommodation = features.get("accommodation") or {}
    cards = _cards(tree)

    details = {}
    for label, value in _rows(cards.get("Institution Details")) if cards.get("Institution Details") else []:
        if label and value and label != "School ID":
            details[label] = value

    durations = []
    if cards.get("Cost and Duration"):
        for label, value in _rows(cards["Cost and Duration"]):
            text = f"{label} {value}".strip()
            if MONEY_RE.search(text):
                continue
            joined = f"{label} {value}".strip()
            m = re.match(r"(.+?(?:Years?|Months?))\s*(Average .+)$", joined) or \
                re.match(r"(Average .+?)\s+(.+?(?:Years?|Months?))$", joined)
            if m:
                a, b = m.group(1).strip(), m.group(2).strip()
                value_, label_ = (a, b) if b.startswith("Average") else (b, a)
                durations.append({"label": label_, "value": value_})

    logos = LOGO_RE.findall(html)
    photos = list(dict.fromkeys(PHOTO_RE.findall(html)))
    meta = META_RE.search(html)

    return {
        "name": props.get("name"),
        "aboutHtml": props.get("about") if isinstance(props.get("about"), str) else None,
        "metaDescription": meta.group(1) if meta else None,
        "location": props.get("location"),
        "institutionType": details.get("Institution Type"),
        "founded": details.get("Founded"),
        "programLevels": _pct_rows(cards["Program Levels"]) if cards.get("Program Levels") else [],
        "topDisciplines": _pct_rows(cards["Top Disciplines"]) if cards.get("Top Disciplines") else [],
        "typicalDuration": durations,
        "logoUrl": logos[0] if logos else None,
        "photos": photos[:8],
        "canWorkAndStudy": features.get("canWorkAndStudy"),
        "coopParticipating": features.get("coopParticipating"),
        "conditionalAcceptance": features.get("conditionalAcceptance"),
        "accommodationHtml": accommodation.get("description"),
        "onCampusHousing": accommodation.get("onCampusHousingAvailable"),
    }


def fetch_program_descriptions(school_id: int) -> tuple[dict, int | None]:
    descriptions: dict[str, dict] = {}
    total = None
    for page in range(1, 30):
        body = fetch(PROGRAMS_API.format(id=school_id, page=page), "application/json")
        if not body:
            break
        try:
            data = json.loads(body)
        except ValueError:
            break
        total = (data.get("meta") or {}).get("totalCount", total)
        items = data.get("data") or []
        for item in items:
            attrs = item.get("attributes") or {}
            descriptions[str(attrs.get("id") or item.get("id"))] = {
                "name": attrs.get("name"),
                "descriptionHtml": attrs.get("description"),
            }
        if len(items) < 100 or (total is not None and len(descriptions) >= total):
            break
        time.sleep(0.4)
    return descriptions, total


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--in", dest="inp", default=str(HERE / "data" / "raw" / "programs.json"))
    parser.add_argument("--delay", type=float, default=0.8, help="seconds between schools")
    parser.add_argument("--limit", type=int, default=0, help="only process this many schools (testing)")
    parser.add_argument("--refresh", action="store_true", help="re-fetch schools that are already cached")
    args = parser.parse_args()

    CACHE.mkdir(parents=True, exist_ok=True)
    pool = json.loads(Path(args.inp).read_text())["programs"]
    schools: dict[int, dict] = {}
    for p in pool:
        s = p["school"]
        schools.setdefault(s["schoolId"], {"schoolId": s["schoolId"], "slug": s.get("slug"),
                                           "name": s["name"], "country": s["country"]})
    todo = sorted(schools.values(), key=lambda s: s["schoolId"])
    if args.limit:
        todo = todo[:args.limit]

    done = failed = skipped = 0
    started = time.time()
    for i, school in enumerate(todo, 1):
        out = CACHE / f"{school['schoolId']}.json"
        if out.exists() and not args.refresh:
            skipped += 1
            continue
        record = {**school, "fetchedAt": datetime.now(timezone.utc).isoformat(), "ok": False}
        html = fetch(SCHOOL_URL.format(slug=school["slug"]), "text/html") if school.get("slug") else None
        if html:
            try:
                record.update(parse_school_page(html))
                record["ok"] = True
            except Exception as exc:  # noqa: BLE001 - one bad page must not stop the run
                record["error"] = f"parse: {exc}"
        else:
            record["error"] = "school page unavailable"
        descriptions, total = fetch_program_descriptions(school["schoolId"])
        record["programs"] = descriptions
        record["programsTotal"] = total
        out.write_text(json.dumps(record, ensure_ascii=False, indent=1))
        done += 1
        failed += 0 if record["ok"] else 1
        rate = (time.time() - started) / max(done, 1)
        print(f"[{i}/{len(todo)}] {school['name'][:48]:<48} about={'y' if record.get('aboutHtml') else 'n'} "
              f"logo={'y' if record.get('logoUrl') else 'n'} programs={len(descriptions):>3}"
              f"{'  ERROR ' + record.get('error', '') if not record['ok'] else ''}  (~{rate * (len(todo) - i) / 60:.0f} min left)",
              flush=True)
        time.sleep(args.delay)

    print(f"\nfetched {done}, cached/skipped {skipped}, failed {failed} -> {CACHE}")
    sys.exit(0)


if __name__ == "__main__":
    main()
