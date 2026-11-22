"""Probe: confirm the live session authenticates and map how search results load.

Dumps every JSON/XHR response the search page makes so we can find the real
data endpoint instead of scraping rendered HTML.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from browser import SEARCH_URL, launch  # noqa: E402

OUT = Path(__file__).parent / "data" / "raw"
OUT.mkdir(parents=True, exist_ok=True)


def main() -> None:
    pw, context = launch(headless=True)
    page = context.pages[0] if context.pages else context.new_page()

    captured: list[dict] = []

    def on_response(response):
        url = response.url
        if not re.search(r"applyboard", url):
            return
        ctype = (response.headers or {}).get("content-type", "")
        if "json" not in ctype:
            return
        try:
            body = response.json()
        except Exception:
            return
        captured.append({"url": url, "status": response.status, "body": body})

    page.on("response", on_response)

    print("navigating…", flush=True)
    page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=90_000)
    page.wait_for_timeout(8000)

    title = page.title()
    print("title:", title, flush=True)

    # Are we logged in, or bounced to the identity provider?
    print("url now:", page.url, flush=True)
    logged_in = "app.applyboard.com" in page.url and "id.applyboard" not in page.url
    print("logged_in:", logged_in, flush=True)

    # Rough DOM signal of how many result cards rendered.
    for sel in ["[data-testid*='result']", ".program-card", "article", "li[class*='card']"]:
        n = page.locator(sel).count()
        if n:
            print(f"  selector {sel!r} -> {n}", flush=True)

    page.screenshot(path=str(OUT / "probe-search.png"), full_page=False)
    (OUT / "probe-responses.json").write_text(json.dumps(captured, indent=2, default=str))
    print(f"captured {len(captured)} json responses -> data/raw/probe-responses.json", flush=True)
    for c in captured[:40]:
        print("  ", c["status"], c["url"][:160], flush=True)

    context.close()
    pw.stop()


if __name__ == "__main__":
    main()
