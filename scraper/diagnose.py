"""Diagnostic: measure how many qualifying programs each country actually has.

Scans the full result set with the broad (no keyword) query and reports the
supply of English-taught Bachelor's / Master's / MBA programs, so quotas and
per-university caps can be set against reality instead of guesses.
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from browser import SEARCH_URL, launch  # noqa: E402
from scrape import FETCH_JS, classify, normalize  # noqa: E402

COUNTRIES = [("usa", "US"), ("canada", "CA"), ("australia", "AU"), ("uk", "GB")]


def build_url(country_code: str, page_no: int, size: int = 100) -> str:
    from scrape import build_url as _b
    return _b(country_code.lower(), page_no, size=size)


def main() -> None:
    pw, context = launch(headless=True)
    try:
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=90_000)
        page.wait_for_timeout(6000)

        for site, code in COUNTRIES:
            levels: Counter = Counter()
            unis: Counter = Counter()
            total = None
            for page_no in range(1, 40):
                result = page.evaluate(FETCH_JS, build_url(code, page_no))
                body = result.get("body") or {}
                if result.get("status") != 200:
                    print(f"  [{site}] HTTP {result.get('status')} at p{page_no}", flush=True)
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
            print(
                f"{site:10s} endpoint total={total!s:>6}  qualifying={sum(levels.values()):4}  "
                f"universities={len(unis):3}  levels={dict(levels.most_common())}",
                flush=True,
            )
            if len(unis) <= 40:
                for name, n in unis.most_common():
                    print(f"      {n:3d}  {name}", flush=True)
    finally:
        context.close()
        pw.stop()


if __name__ == "__main__":
    main()