"""Drive a Playwright browser that carries the user's live Chromium session.

Rather than re-implementing Chromium's cookie encryption, we launch against a
*copy* of the real profile so Chromium decrypts its own cookies via the GNOME
keyring. The copy means the running browser is never disturbed and its
SingletonLock never blocks us.

Only what the session needs is copied (cookies, local storage, preferences);
history, saved passwords, autofill and caches are skipped. The copy is always
deleted when the `session()` context manager exits — earlier versions leaked a
~250 MB profile copy per run.
"""

from __future__ import annotations

import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path

CHROMIUM_PROFILE = Path.home() / ".config" / "chromium"
CHROMIUM_BIN = "/usr/bin/chromium"
SEARCH_URL = "https://app.applyboard.com/search?filter[locations]=us,ca,gb,au&sort=-success_score"

# Files/dirs inside Default/ that the session does not need. Several of them
# hold private data (passwords, autofill, history), so leaving them out is a
# privacy measure as well as a speed one.
_SKIP = shutil.ignore_patterns(
    "Singleton*", "Cache", "Code Cache", "GPUCache", "DawnCache", "DawnGraphiteCache",
    "DawnWebGPUCache", "Service Worker", "IndexedDB", "Shared Dictionary",
    "History*", "Sessions*", "Login Data*", "Web Data*", "Top Sites*", "Favicons*",
    "Visited Links", "Extensions", "Extension State", "Web Applications",
    "Platform Notifications", "Network Action Predictor*", "DIPS*", "Shortcuts*",
    "Media History*", "Affiliation Database*", "File System", "blob_storage",
)


def _profile_copy() -> Path:
    root = Path(tempfile.mkdtemp(prefix="ab-profile-"))
    target = root / "chromium"
    target.mkdir()
    shutil.copy2(CHROMIUM_PROFILE / "Local State", target / "Local State")
    shutil.copytree(CHROMIUM_PROFILE / "Default", target / "Default", ignore=_SKIP)
    return root


@contextmanager
def session(headless: bool = True, timeout_ms: int = 60_000):
    """Yield an authenticated Playwright page; always cleans up the copy."""
    from playwright.sync_api import sync_playwright

    root = _profile_copy()
    pw = sync_playwright().start()
    context = None
    try:
        context = pw.chromium.launch_persistent_context(
            user_data_dir=str(root / "chromium"),
            executable_path=CHROMIUM_BIN,
            headless=headless,
            viewport={"width": 1440, "height": 1000},
            args=["--no-first-run", "--no-default-browser-check",
                  "--disable-blink-features=AutomationControlled"],
            timeout=timeout_ms,
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=90_000)
        page.wait_for_timeout(6000)  # let the WAF token / auth settle
        yield page
    finally:
        if context is not None:
            context.close()
        pw.stop()
        shutil.rmtree(root, ignore_errors=True)


def launch(headless: bool = True, timeout_ms: int = 60_000):
    """Legacy (pw, context) API used by the probe/diagnose scripts.

    Prefer `session()`. The profile copy is removed at interpreter exit even
    if the caller forgets to clean up.
    """
    import atexit
    from playwright.sync_api import sync_playwright

    root = _profile_copy()
    atexit.register(shutil.rmtree, root, True)
    pw = sync_playwright().start()
    context = pw.chromium.launch_persistent_context(
        user_data_dir=str(root / "chromium"),
        executable_path=CHROMIUM_BIN,
        headless=headless,
        viewport={"width": 1440, "height": 1000},
        args=["--no-first-run", "--no-default-browser-check",
              "--disable-blink-features=AutomationControlled"],
        timeout=timeout_ms,
    )
    return pw, context
