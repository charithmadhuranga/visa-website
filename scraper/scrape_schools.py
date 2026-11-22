"""Add specific schools to the raw pool from public ApplyBoard data (no login).

    .venv/bin/python scrape_schools.py                       # the default list below
    .venv/bin/python scrape_schools.py --slugs harvard-college,another-school

Some institutions are listed on ApplyBoard's public site but do not appear in
the authenticated program search that scrape.py uses (e.g. MIT, Harvard).
For those, this script builds the same program records as scrape.normalize()
from public sources:

  * school page       www.applyboard.com/schools/<slug>       id, name, location, logo
  * programs API      /api/public-website/school-programs     names, earliest intake
  * program pages     www.applyboard.com/schools/<slug>/programs/<program-slug>
                      program level and typical length

Only Bachelor's, Master's and MBA programs are kept. Records are merged into
data/raw/programs.json (existing programs with the same id are replaced).
Run details.py and organize.py afterwards.

School slugs come from https://www.applyboard.com/schools_sitemap.xml.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import details  # noqa: E402
import rsc  # noqa: E402
from scrape import COUNTRY_TO_SITE, classify  # noqa: E402

HERE = Path(__file__).parent
PROGRAM_URL = "https://www.applyboard.com/schools/{school}/programs/{program}"

# Hand-curated universities on the site that ApplyBoard lists publicly but not
# in its program search. Keep in sync with enrich.CANONICAL_UNIVERSITIES.
DEFAULT_SLUGS = [
    "massachusetts-institute-of-technology-mit",
    "harvard-college",
    "harvard-business-school",
    "harvard-graduate-school-of-arts-and-sciences",
]

COUNTRY_CODES = {"USA": "US", "United States": "US", "Canada": "CA", "United Kingdom": "GB", "UK": "GB",
                 "Australia": "AU", "New Zealand": "NZ"}
DEGREE_RE = re.compile(r"^(bachelor|master|mba\b)|master of business administration", re.I)


def school_meta(slug: str) -> dict | None:
    html = details.fetch(details.SCHOOL_URL.format(slug=slug), "text/html")
    if not html:
        return None
    parsed = details.parse_school_page(html)
    recs = rsc.records(rsc.payload(html))
    tree = rsc.resolve(list(recs.values()), recs)
    cards = details._cards(tree)
    rows = dict(details._rows(cards["Institution Details"])) if cards.get("Institution Details") else {}
    school_id = rows.get("School ID")
    loc = parsed.get("location") or {}
    country_code = COUNTRY_CODES.get(loc.get("country") or "", None)
    if not school_id or country_code not in COUNTRY_TO_SITE:
        return None
    return {
        "schoolId": int(school_id),
        "name": parsed.get("name") or slug,
        "slug": slug,
        "city": (loc.get("city") or "").strip(),
        "province": (loc.get("province") or "").strip(),
        "countryCode": country_code,
        "country": COUNTRY_TO_SITE[country_code],
        "logoUrl": parsed.get("logoUrl"),
    }


def program_level_and_length(school_slug: str, program_slug: str) -> tuple[str | None, int | None]:
    html = details.fetch(PROGRAM_URL.format(school=school_slug, program=program_slug), "text/html")
    if not html:
        return None, None
    recs = rsc.records(rsc.payload(html))
    tree = rsc.resolve(list(recs.values()), recs)
    card = details._cards(tree).get("Cost and Duration")
    level_text, months = None, None
    for label, _ in details._rows(card) if card else []:
        if label.endswith("Program Level"):
            level_text = label[: -len("Program Level")].strip()
        m = re.match(r"(\d+(?:\.\d+)?)\s*(Year|Month)s?\b", label)
        if m and months is None:
            n = float(m.group(1))
            months = int(round(n * 12)) if m.group(2) == "Year" else int(n)
    return level_text, months


def level_code(level_text: str | None, name: str) -> str | None:
    text = f"{level_text or ''} {name}".lower()
    if "doctor" in text or "phd" in text:
        return None
    if "master" in text or "mba" in text:
        return "masters_degree"
    if "bachelor" in text:
        return "3_year_bachelors" if "3-year" in text or "3 year" in text else "bachelors"
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--slugs", default=",".join(DEFAULT_SLUGS), help="comma-separated ApplyBoard school slugs")
    parser.add_argument("--out", default=str(HERE / "data" / "raw" / "programs.json"))
    parser.add_argument("--delay", type=float, default=0.6)
    args = parser.parse_args()

    out_path = Path(args.out)
    payload = json.loads(out_path.read_text())
    pool = {p["programId"]: p for p in payload["programs"]}
    added = 0

    for slug in [s.strip() for s in args.slugs.split(",") if s.strip()]:
        school = school_meta(slug)
        if not school:
            print(f"{slug}: school page unavailable or outside the supported countries — skipped", flush=True)
            continue
        api_items = []
        for page in range(1, 10):
            body = details.fetch(details.PROGRAMS_API.format(id=school["schoolId"], page=page), "application/json")
            items = (json.loads(body).get("data") or []) if body else []
            api_items += items
            if len(items) < 100:
                break
        kept = 0
        for item in api_items:
            a = item.get("attributes") or {}
            name = (a.get("name") or "").strip()
            if not DEGREE_RE.search(name):
                continue
            level_text, months = program_level_and_length(slug, a.get("slug") or "")
            time.sleep(args.delay)
            code = level_code(level_text, name)
            level = classify(code, name)
            if not level:
                continue
            intake = a.get("earliestIntake") or {}
            tuition = a.get("tuition")
            try:
                tuition = float(tuition) if tuition is not None else None
            except ValueError:
                tuition = None
            fee = a.get("applicationFee")
            try:
                fee = float(fee) if fee is not None else None
            except ValueError:
                fee = None
            pool[a["id"]] = {
                "programId": a["id"],
                "name": name,
                "shortName": name.split(" - ", 1)[1].strip() if " - " in name else name,
                "level": level,
                "programLevel": code,
                "currency": "USD" if school["countryCode"] == "US" else None,
                "tuitionPerYear": tuition,
                "durationMonths": [months, months] if months else [None, None],
                "languageOfInstruction": "eng",
                "applicationFee": fee,
                "tags": [],
                "successScore": None,
                "intakes": [{"startDate": intake.get("startDate"), "deadline": intake.get("submissionDeadline")}]
                if intake.get("startDate") else [],
                "school": school,
                "source": "public-school-page",
            }
            kept += 1
        added += kept
        print(f"{school['name']} (#{school['schoolId']}): {len(api_items)} listed, {kept} Bachelor's/Master's/MBA added",
              flush=True)

    payload["programs"] = sorted(pool.values(), key=lambda p: (p["school"]["country"], p["level"],
                                                               p["school"]["name"], p["name"]))
    payload["recordsKept"] = len(payload["programs"])
    payload.setdefault("supplements", []).append({"slugs": args.slugs, "added": added})
    out_path.write_text(json.dumps(payload, indent=1, ensure_ascii=False))
    print(f"\nmerged {added} programs -> {out_path} (pool now {len(payload['programs'])})")


if __name__ == "__main__":
    main()
