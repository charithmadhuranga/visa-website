"""Measure qualifying-program supply under progressively relaxed filters.

The operator's saved search is very restrictive (no-English-test, no
conditional offer, tied to a specific student profile), which leaves only
~149 English-taught Bachelor's / Master's / MBA programs. This shows what each
filter costs so the trade-off can be chosen deliberately.
"""

from __future__ import annotations

import os
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).parent))
from browser import SEARCH_URL, launch  # noqa: E402
from scrape import FETCH_JS, normalize  # noqa: E402

BASE = {
    "filter[english_score][type]": "no_test",
    "filter[english_score][no_test]": "dont_have",
    "filter[conditional_offer]": "f",
    "filter[locations]": "",  # filled per country
    "filter[free_application_only]": "f",
    "filter[exclude_visa_cap_programs]": "f",
    "filter[pgwp_available]": "f",
    "filter[ignore_availability]": "f",
    "filter[unpublished]": "f",
    "filter[include_pathways]": "t",
    "filter[include_ab_app_creation_disabled_programs]": "f",
    "filter[student_id]": os.environ.get("AB_STUDENT_ID", ""),  # optional; never commit a real id
    "sort": "-success_score",
}

VARIANTS = {
    "saved (as given)": [],
    "no student_id": ["filter[student_id]"],
    "no english_score": ["filter[english_score][type]", "filter[english_score][no_test]"],
    "student + english": ["filter[student_id]", "filter[english_score][type]",
                          "filter[english_score][no_test]"],
    "only locations": list(BASE.keys()),
}

COUNTRIES = ["US", "CA", "GB", "AU"]


def build_url(filters: dict, page_no: int, size: int = 100) -> str:
    params = [f"{k}={v}" for k, v in filters.items() if v]
    params += [f"page[number]={page_no}", f"page[size]={size}"]
    return "https://app.applyboard.com/api/content/search/v2/search?" + "&".join(
        quote(p, safe="[]=&") for p in params
    )


def scan(page, site_code: str, filters: dict, max_pages: int = 25):
    levels: Counter = Counter()
    unis: Counter = Counter()
    total = None
    params = dict(filters)
    params["filter[locations]"] = site_code
    for page_no in range(1, max_pages + 1):
        result = page.evaluate(FETCH_JS, build_url(params, page_no))
        body = result.get("body") or {}
        if result.get("status") != 200:
            break
        total = (body.get("meta") or {}).get("counts", {}).get("total") or total
        items = body.get("data") or []
        if not items:
            break
        for item in items:
            if item.get("type") != "program":
                continue
            program = normalize(item)
            if program:
                levels[program["level"]] += 1
                unis[program["school"]["name"]] += 1
        if len(items) < 100:
            break
    return levels, unis, total


def main() -> None:
    pw, context = launch(headless=True)
    try:
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=90_000)
        page.wait_for_timeout(6000)

        for label, dropped in VARIANTS.items():
            filters = {k: v for k, v in BASE.items() if k not in dropped}
            grand, grand_unis = Counter(), Counter()
            parts = []
            for code in COUNTRIES:
                levels, unis, total = scan(page, code, filters)
                grand += levels
                grand_unis += unis
                parts.append(f"{code}={sum(levels.values())}/{len(unis)}uni")
            print(
                f"{label:22s} total_qualifying={sum(grand.values()):5}  "
                f"universities={len(grand_unis):4}  levels={dict(grand.most_common())}",
                flush=True,
            )
            print(f"{'':22s} per-country (qualifying/universities): {'  '.join(parts)}", flush=True)
    finally:
        context.close()
        pw.stop()


if __name__ == "__main__":
    main()