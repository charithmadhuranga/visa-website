"""Merge school details (details.py cache) into the selected catalogue.

Used by organize.py. Produces:
  * per-course program summaries (sanitised HTML + short plain text)
  * one university record per institution (campuses grouped), linked to
    its courses by id — the basis of universities.json and the site's
    university pages.
"""

from __future__ import annotations

import html as htmllib
import json
import re
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).parent
SCHOOLS_DIR = HERE / "data" / "raw" / "schools"
CURATED_JS = HERE.parent / "assets" / "js" / "data" / "universities.js"

# Sentences/blocks we never republish: the source platform's own promotion.
DROP_BLOCK_RE = re.compile(r"applyboard|apply board|\bABX\b", re.I)


# --------------------------------------------------------------------- HTML
class _Sanitizer(HTMLParser):
    """Rebuild arbitrary CMS HTML as a small, safe subset:
    <p>, <h4>, <ul>/<ol>/<li>, <strong>, <em>. No attributes, no links."""

    BLOCK = {"p", "div", "section", "article", "blockquote", "table", "tr", "td", "th", "center", "header", "footer"}
    HEAD = {"h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[str] = []
        self.buf: list[str] = []
        self.lists: list[tuple[str, list[str]]] = []
        self.in_li = False
        self.heading = False
        self.skip = 0  # inside <script>/<style>

    # inline buffer -------------------------------------------------------
    def _text(self) -> str:
        text = "".join(self.buf)
        text = re.sub(r"[ \t\r\n ]+", " ", text)
        text = re.sub(r"<(strong|em)>\s*</\1>", "", text)
        text = re.sub(r"\s+(</(?:strong|em)>)", r"\1 ", text)
        self.buf = []
        return text.strip()

    def _flush(self) -> None:
        text = self._text()
        if not text:
            return
        if self.in_li and self.lists:
            self.lists[-1][1].append(text)
            return
        if self.heading:
            self.blocks.append(f"<h4>{text}</h4>")
            return
        plain = re.sub(r"<[^>]+>", "", text)
        # A short line that is entirely bold reads as a sub-heading.
        if re.fullmatch(r"<strong>[^<]{2,90}</strong>:?", text) and len(plain) <= 90:
            self.blocks.append(f"<h4>{plain.rstrip(':')}</h4>")
        else:
            self.blocks.append(f"<p>{text}</p>")

    # parser hooks --------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        elif tag in self.BLOCK or tag == "br":
            self._flush()
        elif tag in self.HEAD:
            self._flush()
            self.heading = True
        elif tag in ("ul", "ol"):
            self._flush()
            self.lists.append((tag, []))
        elif tag == "li":
            self._flush()
            self.in_li = True
        elif tag in ("strong", "b"):
            self.buf.append("<strong>")
        elif tag in ("em", "i"):
            self.buf.append("<em>")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        elif tag in self.BLOCK:
            self._flush()
        elif tag in self.HEAD:
            self._flush()
            self.heading = False
        elif tag == "li":
            self._flush()
            self.in_li = False
        elif tag in ("ul", "ol") and self.lists:
            self._flush()
            kind, items = self.lists.pop()
            items = [i for i in items if i]
            if items:
                self.blocks.append(f"<{kind}>" + "".join(f"<li>{i}</li>" for i in items) + f"</{kind}>")
        elif tag in ("strong", "b"):
            self.buf.append("</strong>")
        elif tag in ("em", "i"):
            self.buf.append("</em>")

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(htmllib.escape(data, quote=False))

    def result(self) -> list[str]:
        self._flush()
        while self.lists:
            kind, items = self.lists.pop()
            if items:
                self.blocks.append(f"<{kind}>" + "".join(f"<li>{i}</li>" for i in items) + f"</{kind}>")
        return self.blocks


def _balance(block: str) -> str:
    for tag in ("strong", "em"):
        opened, closed = block.count(f"<{tag}>"), block.count(f"</{tag}>")
        if opened > closed:
            block = re.sub(r"(</(?:p|h4|li|ul|ol)>)$", f"</{tag}>" * (opened - closed) + r"\1", block)
        elif closed > opened:
            block = block.replace(f"</{tag}>", "", closed - opened)
    return block


def sanitize(raw: str | None, max_blocks: int = 40) -> str:
    if not raw or not isinstance(raw, str):
        return ""
    parser = _Sanitizer()
    try:
        parser.feed(raw)
        parser.close()
    except Exception:  # noqa: BLE001 - fall back to plain text
        return f"<p>{htmllib.escape(re.sub(r'<[^>]+>', ' ', raw)).strip()}</p>"
    blocks = [_balance(b) for b in parser.result() if not DROP_BLOCK_RE.search(b)]
    # Drop a trailing heading with nothing under it.
    while blocks and blocks[-1].startswith("<h4>"):
        blocks.pop()
    return "".join(blocks[:max_blocks])


def plain(html_text: str, limit: int | None = None) -> str:
    text = re.sub(r"</(p|h4|li)>", " ", html_text or "")
    text = htmllib.unescape(re.sub(r"<[^>]+>", "", text))
    text = re.sub(r"\s+", " ", text).strip()
    if limit and len(text) > limit:
        cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:–-")
        text = cut + "…"
    return text


# ------------------------------------------------------------------ helpers
def slugify(name: str) -> str:
    s = htmllib.unescape(name).lower()
    s = s.replace("&", " and ").replace("'", "").replace("’", "")
    s = re.sub(r"\([^)]*\)", " ", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "institution"


def norm_name(name: str) -> str:
    s = slugify(name)
    s = re.sub(r"^the-", "", s)
    return s


def course_key(program_id: int) -> str:
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    n, out = int(program_id), ""
    while True:
        n, r = divmod(n, 36)
        out = digits[r] + out
        if not n:
            return out


def load_curated() -> dict[str, dict]:
    """Hand-curated universities already on the site: normalised name -> {id, country}."""
    if not CURATED_JS.exists():
        return {}
    src = CURATED_JS.read_text()
    out = {}
    pattern = (r"id:\s*['\"]([^'\"]+)['\"],\s*name:\s*(?:'((?:[^'\\]|\\.)+)'|\"((?:[^\"\\]|\\.)+)\"),"
               r"\s*country:\s*['\"]([^'\"]+)['\"]")
    for m in re.finditer(pattern, src):
        cid, name, country = m.group(1), (m.group(2) or m.group(3)).replace("\\'", "'"), m.group(4)
        out[norm_name(name)] = {"id": cid, "country": country}
        out.setdefault(cid, {"id": cid, "country": country})
    return out


def load_schools() -> dict[int, dict]:
    schools = {}
    if SCHOOLS_DIR.exists():
        for f in SCHOOLS_DIR.glob("*.json"):
            try:
                d = json.loads(f.read_text())
                schools[int(d["schoolId"])] = d
            except (ValueError, KeyError):
                continue
    return schools


def _type_from_meta(meta: str | None) -> str | None:
    m = re.search(r"\bis an? (public|private)\b", meta or "", re.I)
    return m.group(1).title() if m else None


def _founded_from_meta(meta: str | None) -> str | None:
    m = re.search(r"founded in (\d{4})", meta or "", re.I)
    return m.group(1) if m else None


# ----------------------------------------------------------------- building
def attach_summaries(courses: list[dict], schools: dict[int, dict]) -> int:
    descriptions: dict[str, str] = {}
    for s in schools.values():
        for pid, p in (s.get("programs") or {}).items():
            if p.get("descriptionHtml"):
                descriptions[str(pid)] = p["descriptionHtml"]
    found = 0
    for c in courses:
        html_text = ""
        for pid in c.get("_programIds") or [c["id"]]:
            html_text = sanitize(descriptions.get(str(pid)), max_blocks=20)
            if html_text:
                break
        c["summaryHtml"] = html_text
        c["summaryText"] = plain(html_text, 280)
        found += bool(html_text)
    return found


def build_universities(courses: list[dict], cleaned: list[dict], schools: dict[int, dict]) -> list[dict]:
    """One record per institution; courses get `universityId`."""
    curated = load_curated()
    campus_ids: dict[str, set] = defaultdict(set)
    for c in cleaned:
        campus_ids[c["university"]].add(c["_schoolId"])

    by_uni: dict[str, list[dict]] = defaultdict(list)
    for c in courses:
        by_uni[c["university"]].append(c)

    used_slugs: set[str] = set()
    universities = []
    for name in sorted(by_uni):
        items = by_uni[name]
        country = Counter(c["country"] for c in items).most_common(1)[0][0]
        ids = sorted(campus_ids.get(name) or {c["_schoolId"] for c in items})
        details = [schools[i] for i in ids if i in schools]
        course_schools = Counter(sid for c in items for sid in c.get("_schoolIds") or [c["_schoolId"]])

        def primary_key(s: dict):
            exact = (s.get("name") or "").strip().lower() == name.lower()
            return (not s.get("aboutHtml"), not exact, -course_schools.get(s["schoolId"], 0), s["schoolId"])

        details.sort(key=primary_key)
        primary = details[0] if details else {}

        match = curated.get(norm_name(name))
        slug = match["id"] if match else slugify(name)
        if not match and slug in used_slugs:
            slug = f"{slug}-{country}"
        used_slugs.add(slug)
        site_country = match["country"] if match else country

        campuses = []
        for s in details:
            loc = s.get("location") or {}
            campus = (s.get("name") or "").split(" - ", 1)[1].strip() if " - " in (s.get("name") or "") else ""
            campuses.append({
                "name": campus or loc.get("city") or "",
                "address": loc.get("address"),
                "city": loc.get("city"),
                "province": loc.get("province"),
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude"),
            })
        seen = set()
        campuses = [c for c in campuses if not (c["name"], c["city"]) in seen and not seen.add((c["name"], c["city"]))]

        about = sanitize(primary.get("aboutHtml"))
        meta = primary.get("metaDescription")
        logo = next((s.get("logoUrl") for s in details if s.get("logoUrl")), None)
        photos = []
        for s in details:
            for p in s.get("photos") or []:
                if p not in photos:
                    photos.append(p)
        loc = primary.get("location") or {}
        uni = {
            "id": slug,
            "name": name,
            "country": site_country,
            "category": items[0]["institutionType"],
            "type": primary.get("institutionType") or _type_from_meta(meta),
            "founded": primary.get("founded") or _founded_from_meta(meta),
            "logoUrl": logo,
            "photos": photos[:8],
            "aboutHtml": about,
            "aboutText": plain(about, 320),
            "location": {
                "address": loc.get("address"),
                "city": loc.get("city") or items[0]["city"],
                "province": loc.get("province") or items[0]["province"],
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude"),
            },
            "campuses": campuses,
            "programLevels": primary.get("programLevels") or [],
            "topDisciplines": primary.get("topDisciplines") or [],
            "typicalDuration": primary.get("typicalDuration") or [],
            "canWorkAndStudy": primary.get("canWorkAndStudy"),
            "coopParticipating": primary.get("coopParticipating"),
            "onCampusHousing": primary.get("onCampusHousing"),
            "accommodationHtml": sanitize(primary.get("accommodationHtml"), max_blocks=12),
            "curated": bool(match),
            "aboutSource": primary.get("aboutSource"),
            "website": primary.get("website"),
            "students": primary.get("students"),
            "courseSource": primary.get("courseSource") or "applyboard",
            "courseCount": len(items),
            "levels": dict(Counter(c["level"] for c in items)),
            "fields": dict(Counter(c["field"] for c in items).most_common()),
            "courseIds": [],
        }
        for c in items:
            c["universityId"] = slug
            c["universityCountry"] = site_country
            uni["courseIds"].append(c["key"])
        universities.append(uni)

    # Profiles gathered from open data for curated universities that have no
    # published courses (e.g. UK / Canada / New Zealand): profile-only records.
    built = {u["id"] for u in universities}
    for s in schools.values():
        if not s.get("external"):
            continue
        match = curated.get(norm_name(s["name"])) or curated.get(s.get("curatedId") or "")
        slug = match["id"] if match else slugify(s["name"])
        if slug in built:
            continue
        loc = s.get("location") or {}
        about = sanitize(s.get("aboutHtml"))
        universities.append({
            "id": slug, "name": s["name"], "country": match["country"] if match else s["country"],
            "category": "University", "type": s.get("institutionType"), "founded": s.get("founded"),
            "logoUrl": s.get("logoUrl"), "photos": s.get("photos") or [],
            "aboutHtml": about, "aboutText": plain(about, 320),
            "location": {"address": None, "city": loc.get("city"), "province": loc.get("province"),
                         "latitude": loc.get("latitude"), "longitude": loc.get("longitude")},
            "campuses": [{"name": "Main campus", "address": None, "city": loc.get("city"), "province": None,
                          "latitude": loc.get("latitude"), "longitude": loc.get("longitude")}]
            if loc.get("latitude") else [],
            "programLevels": [], "topDisciplines": [], "typicalDuration": [],
            "canWorkAndStudy": None, "coopParticipating": None, "onCampusHousing": None, "accommodationHtml": "",
            "curated": bool(match), "aboutSource": s.get("aboutSource"), "website": s.get("website"),
            "students": s.get("students"), "courseSource": None,
            "courseCount": 0, "levels": {}, "fields": {}, "courseIds": [],
        })
        built.add(slug)
    return universities
