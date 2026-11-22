"""Probe 2: find the API's page-size ceiling and the programLevel vocabulary.

Runs fetch() inside the authenticated page so cookies + AWS WAF token are
handled by the browser itself.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from browser import SEARCH_URL, launch  # noqa: E402

OUT = Path(__file__).parent / "data" / "raw"

BASE = {
    "filter[english_score][type]": "no_test",
    "filter[english_score][no_test]": "dont_have",
    "filter[conditional_offer]": "f",
    "filter[locations]": "us,ca,gb,au",
    "filter[free_application_only]": "f",
    "filter[exclude_visa_cap_programs]": "f",
    "filter[pgwp_available]": "f",
    "filter[ignore_availability]": "f",
    "filter[unpublished]": "f",
    "filter[include_pathways]": "t",
    "filter[include_ab_app_creation_disabled_programs]": "f",
    "sort": "-success_score",
    "meta[rnd]": "abc123rnd",
    "meta[query_id]": "probequeryid0001",
    "meta[session_id]": "probesessionid001",
}


def qs(extra: dict) -> str:
    params = {**BASE, **extra}
    return "&".join(f"{k}={v}" for k, v in params.items())


FETCH = """
async (url) => {
  const r = await fetch(url, { credentials: 'include', headers: { 'Accept': 'application/json' } });
  if (!r.ok) return { error: r.status };
  return await r.json();
}
"""


def main() -> None:
    pw, context = launch(headless=True)
    page = context.pages[0] if context.pages else context.new_page()
    page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=90_000)
    page.wait_for_timeout(5000)

    results = {}

    # 1. Does page[size] accept 200?
    for size in (200, 100, 50, 12):
        url = f"/api/content/search/v2/search?{qs({'page[number]': '1', 'page[size]': str(size) })}"
        body = page.evaluate(FETCH, url)
        n = len(body.get("data", [])) if isinstance(body, dict) and "data" in body else None
        results[f"size_{size}"] = {"returned": n, "total": (body or {}).get("meta", {})}
        print(f"page[size]={size} -> returned {n}", flush=True)
        if n and n >= 12:
            break

    # 2. Vocabulary of programLevel across a broad sweep.
    levels: dict[str, int] = {}
    countries: dict[str, int] = {}
    sample_body = None
    for page_no in range(1, 6):
        url = f"/api/content/search/v2/search?{qs({'page[number]': str(page_no), 'page[size]': '50' })}"
        body = page.evaluate(FETCH, url)
        data = (body or {}).get("data", [])
        if not data:
            break
        if sample_body is None:
            sample_body = data[0]
        for item in data:
            a = item.get("attributes", {})
            lvl = a.get("programLevel", "?")
            levels[lvl] = levels.get(lvl, 0) + 1
            cc = (a.get("school") or {}).get("countryCode", "?")
            countries[cc] = countries.get(cc, 0) + 1

    results["program_levels"] = dict(sorted(levels.items(), key=lambda kv: -kv[1]))
    results["countries"] = dict(sorted(countries.items(), key=lambda kv: -kv[1]))
    print("programLevel values:", json.dumps(results["program_levels"], indent=1), flush=True)
    print("countries:", json.dumps(results["countries"], indent=1), flush=True)

    (OUT / "probe2.json").write_text(json.dumps(results, indent=2, default=str))
    context.close()
    pw.stop()


if __name__ == "__main__":
    main()
