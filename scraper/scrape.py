"""ApplyBoard course & university scraper (collection stage).

Reads the authenticated /api/content/search/v2/search endpoint using the
operator's live Chromium session (see browser.py) and collects English-taught
Bachelor's, Master's and MBA programs for USA / Canada / UK / Australia.

This stage only *collects*: it runs one server-side-filtered query per
(country, level bucket), pages through the results and writes every qualifying
program to data/raw/programs.json. Choosing which courses go on the website —
cleaning, de-duplication, per-university caps and an even country/level spread
— is done afterwards, deterministically, by organize.py:

    .venv/bin/python scrape.py            # ~3-5 min, needs a logged-in Chromium
    .venv/bin/python organize.py          # writes processed data + website file

Endpoint facts (verified with probes, Nov 2026):
  * filter[levels]=<comma list>  server-side level filter
      (bachelors = 4-year, 3_year_bachelors, masters_degree, ...)
  * filter[q]=<text>              keyword search
  * page[size] max is 100
  * New Zealand (nz) returns no programs, so it is not queried.
"""

from __future__ import annotations

import argparse
import json
import re
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

API = "https://app.applyboard.com/api/content/search/v2/search"
PAGE_SIZE = 100  # the endpoint rejects anything larger

# Non-restrictive defaults from the operator's saved search ("f" = do not
# restrict). The saved search's "no English test" filter is deliberately left
# out — it cut supply from 8,163 programs to 149.
BASE_FILTERS = [
    "filter[conditional_offer]=f",
    "filter[free_application_only]=f",
    "filter[exclude_visa_cap_programs]=f",
    "filter[pgwp_available]=f",
    "filter[ignore_availability]=f",
    "filter[unpublished]=f",
    "filter[include_pathways]=t",
    "filter[include_ab_app_creation_disabled_programs]=f",
    "sort=-success_score",
]

# (site key, ApplyBoard country code, API location value)
COUNTRIES = [
    ("usa", "US", "us"),
    ("canada", "CA", "ca"),
    ("uk", "GB", "gb"),
    ("australia", "AU", "au"),
]
COUNTRY_TO_SITE = {code: site for site, code, _ in COUNTRIES}

# One query per bucket. MBA gets its own keyword query because MBAs are a
# small slice of masters_degree and would otherwise be crowded out.
QUERIES = [
    ("Bachelor's", ["filter[levels]=bachelors,3_year_bachelors"]),
    ("Master's", ["filter[levels]=masters_degree"]),
    ("MBA", ["filter[levels]=masters_degree", "filter[q]=MBA"]),
]

BACHELORS_LEVELS = {"bachelors", "3_year_bachelors"}
MASTERS_LEVELS = {"masters_degree"}
MBA_RE = re.compile(r"(?:\bmba\b|master of business administration|\bemba\b)", re.I)

FETCH_JS = """
async (url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const r = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (r.status === 429) { await new Promise(res => setTimeout(res, 2500 * (attempt + 1))); continue; }
      return { status: r.status, body: r.ok ? await r.json() : null };
    } catch (e) {
      if (attempt === 2) return { status: 0, error: String(e) };
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  return { status: 429, body: null };
}
"""


def build_url(location: str, page_no: int, extra: list[str] | None = None,
              size: int = PAGE_SIZE, student_id: str | None = None) -> str:
    params = list(BASE_FILTERS) + list(extra or [])
    if student_id:
        params.append(f"filter[student_id]={student_id}")
    params += [f"filter[locations]={location}", f"page[number]={page_no}", f"page[size]={size}"]
    return f"{API}?" + "&".join(quote(p, safe="[]=&,") for p in params)


def classify(program_level: str | None, name: str) -> str | None:
    """Map a program onto Bachelor's / Master's / MBA, or None to drop it."""
    if program_level in MASTERS_LEVELS and MBA_RE.search(name or ""):
        return "MBA"
    if program_level in BACHELORS_LEVELS:
        return "Bachelor's"
    if program_level in MASTERS_LEVELS:
        return "Master's"
    return None


def normalize(item: dict) -> dict | None:
    attrs = item.get("attributes") or {}
    school = attrs.get("school") or {}
    country_code = school.get("countryCode")
    if country_code not in COUNTRY_TO_SITE:
        return None
    # The site serves Sri Lankan students, so only English-taught programs apply.
    if (attrs.get("languageOfInstructionCode") or "eng") != "eng":
        return None
    level = classify(attrs.get("programLevel"), attrs.get("name", ""))
    if level is None:
        return None

    intakes = [
        {"startDate": i.get("startDate"), "deadline": i.get("submissionDeadline")}
        for i in attrs.get("programIntakes") or []
    ]
    intakes.sort(key=lambda i: (i.get("startDate") or "", i.get("deadline") or ""))

    tuition = attrs.get("tuition")
    return {
        "programId": attrs.get("id"),
        "name": (attrs.get("name") or "").strip(),
        "shortName": (attrs.get("shortName") or "").strip(),
        "level": level,
        "programLevel": attrs.get("programLevel"),
        "currency": attrs.get("currency"),
        "tuitionPerYear": tuition if isinstance(tuition, (int, float)) else None,
        "durationMonths": [attrs.get("minLength"), attrs.get("maxLength")],
        "languageOfInstruction": attrs.get("languageOfInstructionCode"),
        "applicationFee": attrs.get("applicationFee"),
        "tags": attrs.get("tags") or [],
        "successScore": (attrs.get("successScore") or {}).get("label"),
        "intakes": intakes,
        "school": {
            "schoolId": school.get("id"),
            "name": (school.get("name") or "").strip(),
            "slug": school.get("slug"),
            "city": (school.get("city") or "").strip(),
            "province": (school.get("province") or "").strip(),
            "countryCode": country_code,
            "country": COUNTRY_TO_SITE[country_code],
            "logoUrl": school.get("logoThumbnailUrl"),
        },
    }


def collect(page, location: str, extra: list[str], max_pages: int, delay: float,
            student_id: str | None, stats: Counter) -> tuple[list[dict], int | None]:
    """Page through one query; return qualifying programs and the API total."""
    found: list[dict] = []
    total = None
    for page_no in range(1, max_pages + 1):
        result = page.evaluate(FETCH_JS, build_url(location, page_no, extra, student_id=student_id))
        stats["apiCalls"] += 1
        status, body = result.get("status"), result.get("body")
        if status != 200 or not body:
            print(f"    page {page_no}: HTTP {status} {result.get('error', '')} — stopping query", flush=True)
            stats["failedCalls"] += 1
            break
        total = (body.get("meta") or {}).get("counts", {}).get("total", total)
        items = body.get("data") or []
        for item in items:
            if item.get("type") != "program":
                continue
            stats["recordsScanned"] += 1
            program = normalize(item)
            if program:
                found.append(program)
        if len(items) < PAGE_SIZE:
            break
        time.sleep(delay)
    return found, total


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--max-pages", type=int, default=15,
                        help="pages (of 100) scanned per country/level query")
    parser.add_argument("--delay", type=float, default=0.6, help="seconds between API calls")
    parser.add_argument("--student-id", default=None,
                        help="optional ApplyBoard student id to tailor results to one profile "
                             "(off by default: the website catalogue should not depend on one student)")
    parser.add_argument("--headed", action="store_true", help="show the browser window")
    parser.add_argument("--countries", default="usa,canada,uk,australia",
                        help="comma list of countries to scrape (usa,canada,uk,australia)")
    parser.add_argument("--merge", action="store_true",
                        help="add to the existing output file instead of replacing it "
                             "(e.g. a deeper re-scan of one country)")
    parser.add_argument("--out", default=str(Path(__file__).parent / "data" / "raw" / "programs.json"))
    args = parser.parse_args()

    from browser import session  # imported late so --help works without Playwright

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    wanted = {c.strip() for c in args.countries.split(",") if c.strip()}
    unknown = wanted - {site for site, _, _ in COUNTRIES}
    if unknown:
        parser.error(f"unknown countries: {', '.join(sorted(unknown))}")

    pool: dict[int, dict] = {}
    stats: Counter = Counter()
    query_log = []
    if args.merge and out_path.exists():
        previous = json.loads(out_path.read_text())
        pool = {p["programId"]: p for p in previous.get("programs", [])}
        query_log = previous.get("queries", [])
        print(f"merging into {len(pool)} existing programs", flush=True)

    with session(headless=not args.headed) as page:
        for site, _code, location in COUNTRIES:
            if site not in wanted:
                continue
            print(f"\n=== {site} ===", flush=True)
            for bucket, extra in QUERIES:
                programs, total = collect(page, location, extra, args.max_pages, args.delay,
                                          args.student_id, stats)
                fresh = 0
                for program in programs:
                    if program["programId"] not in pool:
                        pool[program["programId"]] = program
                        fresh += 1
                levels = Counter(p["level"] for p in programs)
                query_log.append({"country": site, "bucket": bucket, "apiTotal": total,
                                  "qualifying": len(programs), "new": fresh, "levels": dict(levels)})
                print(f"  {bucket:<11} api total {total!s:>6}  qualifying {len(programs):>5}  new {fresh:>5}  "
                      f"{dict(levels)}", flush=True)

    programs = sorted(pool.values(), key=lambda p: (p["school"]["country"], p["level"],
                                                    p["school"]["name"], p["name"]))
    payload = {
        "source": "applyboard",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "apiCalls": stats["apiCalls"],
        "failedCalls": stats["failedCalls"],
        "recordsScanned": stats["recordsScanned"],
        "recordsKept": len(programs),
        "maxPagesPerQuery": args.max_pages,
        "queries": query_log,
        "programs": programs,
    }
    out_path.write_text(json.dumps(payload, indent=1, ensure_ascii=False))

    print(f"\nScanned {stats['recordsScanned']} records over {stats['apiCalls']} API calls "
          f"({stats['failedCalls']} failed)")
    print(f"Pool: {len(programs)} unique qualifying programs -> {out_path}")
    print("By country:", dict(Counter(p["school"]["country"] for p in programs)))
    print("By level  :", dict(Counter(p["level"] for p in programs)))
    print("Schools   :", len({p["school"]["schoolId"] for p in programs}))


if __name__ == "__main__":
    main()
