"""Reuse the logged-in Chromium session for app.applyboard.com.

Chromium on Linux stores cookies in Default/Cookies as AES-128-CBC with a key
derived (PBKDF2-HMAC-SHA1, 1 iteration, salt "saltysalt") from a password kept
in the GNOME keyring under "Chromium Safe Storage" (application=chromium).
The v11 prefix on each value marks that the keyring (not the "peanuts"
fallback) supplied the password.

This module decrypts just the cookies we need and hands them to Playwright, so
the scraper runs authenticated without touching or restarting the browser.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import sqlite3
import tempfile
from pathlib import Path

CHROMIUM_PROFILE = Path.home() / ".config" / "chromium" / "Default"
COOKIE_DB = CHROMIUM_PROFILE / "Cookies"
APPLYBOARD_HOSTS = (".applyboard.com", "app.applyboard.com", "id.applyboard.com",
                    "accounts.applyboard.com")


def _keyring_password() -> bytes:
    """Read the Chromium Safe Storage password from the GNOME keyring."""
    import secretstorage

    bus = secretstorage.dbus_init()
    collection = secretstorage.get_default_collection(bus)
    if collection.is_locked():
        raise RuntimeError("Keyring is locked — unlock it and retry.")
    for item in collection.get_all_items():
        attrs = item.get_attributes() or {}
        if attrs.get("application") == "chromium":
            secret = item.get_secret()
            return secret if isinstance(secret, bytes) else secret.encode("utf-8")
    raise RuntimeError("No 'Chromium Safe Storage' entry for application=chromium.")


def _decrypt(value: bytes, password: bytes) -> bytes | None:
    """Decrypt a Chromium v10/v11 cookie payload."""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    if len(value) < 3 or value[:3] not in (b"v10", b"v11"):
        return None
    body = value[3:]
    key = hashlib.pbkdf2_hmac("sha1", password, b"saltysalt", 1, dklen=16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(b" " * 16))
    decryptor = cipher.decryptor()
    plain = decryptor.update(body) + decryptor.finalize()
    # PKCS7 padding; Chromium sometimes stores unpadded data.
    pad = plain[-1]
    if 1 <= pad <= 16 and plain[-pad:] == bytes([pad]) * pad:
        plain = plain[:-pad]
    return plain


def _copy_cookie_db() -> str:
    """Copy the live Cookies DB so Chromium's own lock never blocks us."""
    tmp = tempfile.mktemp(prefix="cookies-", suffix=".db")
    shutil.copy2(COOKIE_DB, tmp)
    for suffix in ("-wal", "-shm"):
        side = Path(str(COOKIE_DB) + suffix)
        if side.exists():
            shutil.copy2(side, tmp + suffix)
    return tmp


def applyboard_cookies() -> dict[str, str]:
    """Return {name: value} for every ApplyBoard cookie, decrypted."""
    password = _keyring_password()
    tmp = _copy_cookie_db()
    try:
        conn = sqlite3.connect(tmp)
        rows = conn.execute(
            "SELECT name, host_key, encrypted_value, value FROM cookies "
            "WHERE host_key LIKE '%applyboard%'"
        ).fetchall()
        conn.close()
    finally:
        for path in (tmp, tmp + "-wal", tmp + "-shm"):
            if os.path.exists(path):
                os.unlink(path)

    cookies: dict[str, str] = {}
    for name, host, enc, plain in rows:
        if plain:
            cookies[name] = plain
            continue
        if not enc:
            continue
        try:
            out = _decrypt(bytes(enc), password)
        except Exception:  # noqa: BLE001 - a single bad cookie must not abort
            out = None
        if out is not None:
            cookies[name] = out.decode("utf-8", "replace")
    if "_applyboard_session" not in cookies and "abjwt_access_token" not in cookies:
        raise RuntimeError(
            "No ApplyBoard auth cookies found — are you still logged in?"
        )
    return cookies


def playwright_context_args() -> dict:
    """Playwright launch_persistent_context kwargs carrying the live session."""
    cookies = applyboard_cookies()
    return {
        "storage_state": {
            "cookies": [
                {
                    "name": name,
                    "value": value,
                    "domain": ".applyboard.com" if name != "JSESSIONID" else ".applyboard.com",
                    "path": "/",
                }
                for name, value in cookies.items()
            ]
        }
    }
