"""Courses from universities' official websites (for curated universities that
are on neither ApplyBoard nor an open national course dataset).

    .venv/bin/python official.py                     # all configured universities
    .venv/bin/python official.py --only university-of-glasgow
    .venv/bin/python official.py --per-university 60

Rules this crawler follows:
  * robots.txt is read (in the browser) and respected; disallowed listing or
    course URLs are skipped — e.g. Oxford's undergraduate course listing.
  * a plain headless Chromium is used, with no automation-masking flags; a
    site that answers with a block page / bot challenge is skipped, not
    worked around (Victoria University of Wellington).
  * one page at a time, with a pause between requests.

For each university: listing pages are opened ("show more" / "load more"
buttons are clicked), course links are collected by URL pattern, then up to
`--per-university` course pages are read for the official title, a short
summary (meta description + opening paragraphs), duration and level.
Doctoral, certificate and diploma programmes are dropped.

Writes course records into data/raw/programs.json (source "official-site")
and their summaries into the university's data/raw/schools/<id>.json
(created by external.py). Run organize.py and `npm run build` afterwards.
"""

from __future__ import annotations

import argparse
import html as htmllib
import json
import re
import sys
import time
import urllib.robotparser
from collections import defaultdict
from pathlib import Path
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from external import COUNTRY_CODE, stable_id  # noqa: E402

HERE = Path(__file__).parent
RAW = HERE / "data" / "raw"
SCHOOLS = RAW / "schools"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

# level hint per listing: "ug" / "pg" / None (detect from the course page)
SITES = {
    "university-of-toronto": {"country": "canada", "name": "University of Toronto", "listings": [
        ("https://future.utoronto.ca/undergraduate-programs", "ug"),
        ("https://www.sgs.utoronto.ca/programs/", "pg")],
        "link": r"^https://(future\.utoronto\.ca/programs?/[^/#?]+/?|www\.sgs\.utoronto\.ca/programs/[^/#?]+/)$"},
    "university-of-british-columbia": {"country": "canada", "name": "University of British Columbia", "listings": [
        ("https://you.ubc.ca/programs/", "ug"),
        ("https://www.grad.ubc.ca/prospective-students/graduate-degree-programs", "pg")],
        "link": r"^https://(you\.ubc\.ca/programs/[^/#?]+/|www\.grad\.ubc\.ca/prospective-students/graduate-degree-programs/[^/#?]+)$"},
    "mcmaster-university": {"country": "canada", "name": "McMaster University", "listings": [
        ("https://future.mcmaster.ca/programs/", "ug"),
        ("https://gs.mcmaster.ca/programs/", "pg")],
        "link": r"^https://(future\.mcmaster\.ca/programs/[^/#?]+/|gs\.mcmaster\.ca/program/[^/#?]+/?)$"},
    "university-of-oxford": {"country": "uk", "name": "University of Oxford", "listings": [
        ("https://www.ox.ac.uk/admissions/graduate/courses/courses-a-z-listing", "pg")],
        "link": r"^https://www\.ox\.ac\.uk/admissions/graduate/courses/(msc|mphil|mst|mba|emba|mfa|mjur|bcl|mpp|mbiochem|msc-by-research)-[^/#?]+$"},
    "imperial-college-london": {"country": "uk", "name": "Imperial College London", "listings": [
        ("https://www.imperial.ac.uk/study/courses/?courseType=undergraduate", "ug"),
        ("https://www.imperial.ac.uk/study/courses/?courseType=postgraduate+taught", "pg")],
        "link": r"^https://www\.imperial\.ac\.uk/study/courses/(undergraduate|postgraduate-taught)/20\d\d/[^/#?]+/?$"},
    "university-of-manchester": {"country": "uk", "name": "University of Manchester", "listings": [
        ("https://www.manchester.ac.uk/study/undergraduate/courses/2026/", "ug"),
        ("https://www.manchester.ac.uk/study/masters/courses/list/", "pg")],
        "link": r"^https://www\.manchester\.ac\.uk/study/(undergraduate/courses/20\d\d|masters/courses/list)/\d+/[^/#?]+/?$"},
    "kings-college-london": {"country": "uk", "name": "King's College London", "listings": [
        ("https://www.kcl.ac.uk/study/undergraduate/courses", "ug"),
        ("https://www.kcl.ac.uk/study/postgraduate-taught/courses", "pg")],
        "link": r"^https://www\.kcl\.ac\.uk/study/(undergraduate|postgraduate-taught)/courses/[^/#?]+$"},
    "university-of-glasgow": {"country": "uk", "name": "University of Glasgow", "listings": [
        ("https://www.gla.ac.uk/undergraduate/degrees/", "ug"),
        ("https://www.gla.ac.uk/postgraduate/taught/", "pg")],
        "link": r"^https://www\.gla\.ac\.uk/(undergraduate/degrees|postgraduate/taught)/[a-z0-9-]+/$"},
    "university-of-auckland": {"country": "new-zealand", "name": "University of Auckland", "listings": [
        ("https://www.auckland.ac.nz/en/study/study-options/find-a-study-option.html", None)],
        "link": r"^https://www\.auckland\.ac\.nz/en/study/study-options/find-a-study-option/[^/#?]+\.html$",
        "text": r"\b(Bachelor|Master)\b"},
    "university-of-otago": {"country": "new-zealand", "name": "University of Otago", "listings": [
        ("https://www.otago.ac.nz/courses/qualifications", None)],
        "link": r"^https://www\.otago\.ac\.nz/courses/qualifications/[^/#?]+$",
        "text": r"\b(Bachelor|Master)\b"},
    "university-of-canterbury": {"country": "new-zealand", "name": "University of Canterbury", "listings": [
        ("https://www.canterbury.ac.nz/study/getting-started/about-our-qualifications/bachelors-degrees", "ug"),
        ("https://www.canterbury.ac.nz/study/getting-started/about-our-qualifications/masters-degrees", "pg")],
        "link": r"^https://www\.canterbury\.ac\.nz/study/academic-study/qualifications/[^/#?]+$"},
    "massey-university": {"country": "new-zealand", "name": "Massey University", "listings": [
        ("https://www.massey.ac.nz/study/all-qualifications-and-degrees/", None)],
        "link": r"^https://www\.massey\.ac\.nz/study/all-qualifications-and-degrees/[^/#?]+/?$",
        "text": r"\b(Bachelor|Master)\b"},
    "auckland-university-of-technology": {"country": "new-zealand", "name": "Auckland University of Technology", "listings": [
        ("https://www.aut.ac.nz/study/study-options/compare-aut-degrees", "ug"),
        ("https://www.aut.ac.nz/study/study-options", None)],
        "link": r"^https://www\.aut\.ac\.nz/courses/[^/#?]+$",
        "text": r"\b(Bachelor|Master)\b"},
    "mcgill-university": {"country": "canada", "name": "McGill University", "listings": [
        ("https://www.mcgill.ca/undergraduate-admissions/programs", "ug"),
        ("https://www.mcgill.ca/gradapplicants/programs", "pg")],
        "link": r"^https://www\.mcgill\.ca/(undergraduate-admissions/program|gradapplicants/programs?)/[^/#?]+$"},
}
SKIPPED = {
    "victoria-university-wellington": "the site answers automated browsers with a bot challenge (HTTP 403)",
}

BLOCK_RE = re.compile(r"just a moment|verify you are human|access denied|request blocked|unusual traffic|captcha", re.I)
DOCTORAL = re.compile(r"\b(doctor of|doctoral|ph\.?d|dphil|edd|dba)\b", re.I)
NON_DEGREE = re.compile(r"\b(certificate|diploma|foundation|pathway|summer school|short course|cpd|non-degree)\b", re.I)
MBA = re.compile(r"\b(mba|master of business administration|executive mba|emba)\b", re.I)
MASTER = re.compile(r"\b(master|masters|msc|ma|mres|mphil|mst|meng|llm|mfa|mpa|mph|med|march|mlitt|mmus|mpp|macc|mfin|mdes|mtech|bcl|mjur|m\.sc|m\.a)\b", re.I)
BACHELOR = re.compile(r"\b(bachelor|bsc|ba|beng|bcom|llb|bmus|bfa|bba|bdes|bed|honours|hons|mbchb|mbbs|b\.sc|b\.a)\b", re.I)


def esc(s: str) -> str:
    return htmllib.escape(s or "", quote=False)


def level_of(title: str, url: str, hint: str | None) -> str | None:
    text = f"{title} {urlparse(url).path.replace('-', ' ')}"
    if DOCTORAL.search(title) and not MASTER.search(title):
        return None
    if NON_DEGREE.search(title) and not (MASTER.search(title) or BACHELOR.search(title)):
        return None
    if MBA.search(text):
        return "MBA"
    if re.search(r"\b(undergraduate)\b", url) or re.search(r"/(undergraduate|undergraduate-programs?)/", url):
        hint = hint or "ug"
    if re.search(r"undergraduate", url, re.I) and (BACHELOR.search(title) or re.search(r"\bMSci\b", title)):
        return "Bachelor's"  # integrated undergraduate degrees, e.g. BEng/MEng, MSci
    if MASTER.search(title):
        return "Master's"
    if BACHELOR.search(title):
        return "Bachelor's"
    if hint == "ug":
        return "Bachelor's"
    if hint == "pg":
        return "Master's" if MASTER.search(text) else None
    return None


def duration_months(text: str) -> int | None:
    patterns = [
        r"(?:duration|course length|length of (?:the )?(?:course|programme|program)|program length|study length)\W{0,20}"
        r"(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(?:\d+(?:\.\d+)?)?\s*(years?|yrs?|months?)",
        r"(\d+(?:\.\d+)?)\s*(years?|months?)\s*(?:of\s+)?full[\s-]?time",
        r"full[\s-]?time\W{0,10}(\d+(?:\.\d+)?)\s*(years?|months?)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            n = float(m.group(1))
            unit = m.group(2).lower()
            months = n * 12 if unit.startswith("y") else n
            if 6 <= months <= 84:
                return int(round(months))
    return None


class Crawler:
    def __init__(self, page, delay: float):
        self.page = page
        self.delay = delay
        self.robots: dict[str, urllib.robotparser.RobotFileParser] = {}

    def allowed(self, url: str) -> bool:
        host = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        if host not in self.robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                resp = self.page.goto(host + "/robots.txt", wait_until="domcontentloaded", timeout=30000)
                text = self.page.inner_text("body") if resp and resp.status == 200 else ""
            except Exception:  # noqa: BLE001
                text = ""
            rp.parse(text.splitlines())
            self.robots[host] = rp
        return self.robots[host].can_fetch(UA, url)

    def open(self, url: str, scroll: bool = False) -> bool:
        resp = self.page.goto(url, wait_until="domcontentloaded", timeout=60000)
        self.page.wait_for_timeout(2500)
        title = self.page.title()
        if (resp and resp.status >= 400) or BLOCK_RE.search(title):
            return False
        if scroll:
            for _ in range(40):
                clicked = False
                for label in ("Load more", "Show more", "View more", "More results", "Show all"):
                    btn = self.page.get_by_role("button", name=re.compile(label, re.I))
                    if btn.count() and btn.first.is_visible():
                        try:
                            btn.first.click(timeout=3000)
                            self.page.wait_for_timeout(1200)
                            clicked = True
                            break
                        except Exception:  # noqa: BLE001
                            pass
                self.page.mouse.wheel(0, 6000)
                self.page.wait_for_timeout(400)
                if not clicked and _ > 6:
                    break
        time.sleep(self.delay)
        return True

    def links(self) -> list[tuple[str, str]]:
        return self.page.eval_on_selector_all(
            "a[href]", "els => els.map(e => [e.innerText.trim().replace(/\\s+/g, ' '), e.href.split('#')[0]])")

    def course(self, url: str) -> dict | None:
        if not self.open(url):
            return None
        data = self.page.evaluate("""() => {
            const meta = n => (document.querySelector(`meta[name="${n}"]`) || document.querySelector(`meta[property="${n}"]`) || {}).content || '';
            const h1 = (document.querySelector('h1') || {}).innerText || '';
            const main = document.querySelector('main, [role=main], #main, #main-content, article') || document.body;
            const paras = [...main.querySelectorAll('p')].map(p => p.innerText.trim().replace(/\\s+/g, ' '))
                .filter(t => t.length > 90 && !/cookie|javascript|privacy policy|©/i.test(t)).slice(0, 4);
            return { h1: h1.trim().replace(/\\s+/g, ' '), title: document.title, desc: meta('description') || meta('og:description'),
                     paras, text: main.innerText.slice(0, 20000) };
        }""")
        return data


GENERIC_H1 = re.compile(r"^(undergraduate|postgraduate|postgraduate taught|graduate|courses?|programmes?|programs?|study|"
                        r"course details|overview|find a course|future students|graduate studies|"
                        r"school of graduate studies)$", re.I)
SLUG_DEGREE = {"bsc": "BSc", "msci": "MSci", "meng": "MEng", "beng": "BEng", "ba": "BA", "ma": "MA", "msc": "MSc",
               "mres": "MRes", "llb": "LLB", "llm": "LLM", "mba": "MBA", "bmus": "BMus", "mbbs": "MBBS"}
ONLINE = re.compile(r"\bonline\b|distance learning", re.I)
KEEP_CASE = re.compile(r"^(?:[A-Z][a-z]+[A-Z][A-Za-z]*|[A-Z]{2,5}|[A-Z][a-z]?[A-Z]?)$")


def smart_title(name: str) -> str:
    """'ACCOUNTANCY & FINANCE BAcc' -> 'Accountancy & Finance BAcc' (degree abbreviations kept)."""
    small = {"and", "of", "in", "with", "for", "the", "&", "to", "a", "an", "on"}
    words = []
    for i, w in enumerate(name.split()):
        if w.isupper() and len(w) > 3 or (w.isupper() and w.lower() in small):
            w = w.lower() if (i and w.lower() in small) else w.capitalize()
        words.append(w)
    return " ".join(words)


def clean_name(h1: str, link_text: str, title: str) -> str:
    h1 = (h1 or "").strip()
    candidates = [h1] if h1 and not GENERIC_H1.match(h1) else []
    candidates += [link_text, re.split(r"\s[|–-]\s", title or "")[0]]
    for c in candidates:
        c = re.sub(r"\s+", " ", (c or "")).strip(" -|")
        c = re.sub(r"\s*\|.*$", "", c)
        doubled = re.fullmatch(r"(.+?)\s+\1", c)
        if doubled:
            c = doubled.group(1)  # listing cards that repeat the title, e.g. "Business Business"
        if len(c) >= 4 and not GENERIC_H1.match(c):
            letters = [ch for ch in c if ch.isalpha()]
            if letters and sum(ch.isupper() for ch in letters) / len(letters) > 0.7:
                c = smart_title(c)
            return c
    return ""


def summary_html(desc: str, paras: list[str], url: str) -> str:
    blocks, seen = [], set()
    for t in [desc] + paras:
        t = (t or "").strip()
        key = t[:60].lower()
        if len(t) < 40 or key in seen:
            continue
        seen.add(key)
        blocks.append(f"<p>{esc(t)}</p>")
        if sum(len(b) for b in blocks) > 900:
            break
    blocks.append(f'<p><em>Source: the university\'s official course page ({esc(urlparse(url).netloc)}).</em></p>')
    return "".join(blocks)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", default="", help="comma-separated university ids")
    parser.add_argument("--per-university", type=int, default=60)
    parser.add_argument("--delay", type=float, default=1.0)
    args = parser.parse_args()

    from playwright.sync_api import sync_playwright

    only = {s.strip() for s in args.only.split(",") if s.strip()}
    pool_path = RAW / "programs.json"
    payload = json.loads(pool_path.read_text())
    report = {}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/usr/bin/chromium", headless=True)
        ctx = browser.new_context(user_agent=UA, viewport={"width": 1366, "height": 900}, locale="en-GB")
        page = ctx.new_page()
        crawler = Crawler(page, args.delay)

        for uid, cfg in SITES.items():
            if only and uid not in only:
                continue
            link_re = re.compile(cfg["link"])
            text_re = re.compile(cfg["text"], re.I) if cfg.get("text") else None
            found: dict[str, tuple[str, str | None]] = {}
            for listing, hint in cfg["listings"]:
                if not crawler.allowed(listing):
                    print(f"  {uid}: robots.txt disallows {listing} — skipped", flush=True)
                    continue
                try:
                    ok = crawler.open(listing, scroll=True)
                except Exception as exc:  # noqa: BLE001
                    print(f"  {uid}: {listing} failed ({exc!s:.60})", flush=True)
                    continue
                if not ok:
                    print(f"  {uid}: {listing} blocked or unavailable — skipped", flush=True)
                    continue
                for text, href in crawler.links():
                    if link_re.match(href) and href not in found and (not text_re or text_re.search(text) or text_re.search(href)):
                        found[href] = (text, hint)
            # Balance undergraduate / postgraduate candidates; visit a few extra to allow for drop-outs.
            lanes = defaultdict(list)
            for href, (text, hint) in found.items():
                lanes[hint or "any"].append((href, text, hint))
            order, depth = [], 0
            while len(order) < len(found):
                for lane in lanes.values():
                    if depth < len(lane):
                        order.append(lane[depth])
                depth += 1
            budget = int(args.per_university * 1.6)
            courses, visited = [], 0
            for href, text, hint in order:
                if len(courses) >= args.per_university or visited >= budget:
                    break
                if not crawler.allowed(href):
                    continue
                visited += 1
                try:
                    data = crawler.course(href)
                except Exception:  # noqa: BLE001
                    data = None
                if not data:
                    continue
                name = clean_name(data["h1"], text, data["title"])
                if not name or len(name) > 160 or ONLINE.search(name):
                    continue
                slug_deg = SLUG_DEGREE.get(urlparse(href).path.rstrip("/").rsplit("-", 1)[-1].lower())
                if slug_deg and not re.search(rf"\b{slug_deg}\b", name, re.I):
                    name = f"{name} {slug_deg}"  # e.g. Imperial 'Biochemistry' -> 'Biochemistry MSci'
                level = level_of(f"{name} {text}", href, hint)
                if not level:
                    continue
                courses.append({
                    "name": name, "level": level, "url": href,
                    "months": duration_months(data["text"]),
                    "summary": summary_html(data["desc"], data["paras"], href),
                })
            report[uid] = {"links": len(found), "visited": visited, "kept": len(courses)}
            by_level = {lv: sum(1 for c in courses if c["level"] == lv) for lv in ("Bachelor's", "Master's", "MBA")}
            print(f"{cfg['name']:<40} listing links {len(found):>4}  visited {visited:>3}  kept {len(courses):>3}  {by_level}",
                  flush=True)

            if not courses:
                continue
            school_id = stable_id("school", uid)
            cache_file = SCHOOLS / f"{school_id}.json"
            cache = json.loads(cache_file.read_text()) if cache_file.exists() else {
                "schoolId": school_id, "name": cfg["name"], "country": cfg["country"], "ok": True, "external": True,
                "curatedId": uid, "programs": {}}
            school = {"schoolId": school_id, "name": cfg["name"], "slug": None, "city": "", "province": "",
                      "countryCode": COUNTRY_CODE[cfg["country"]], "country": cfg["country"],
                      "logoUrl": cache.get("logoUrl")}
            programs = {p["programId"]: p for p in payload["programs"]
                        if not (p.get("source") == "official-site" and p["school"]["schoolId"] == school_id)}
            descriptions = {}
            for c in courses:
                pid = stable_id("official", uid, c["url"])
                code = "masters_degree" if c["level"] in ("Master's", "MBA") else "bachelors"
                programs[pid] = {
                    "programId": pid, "name": c["name"],
                    "shortName": re.sub(r"^(Bachelor|Master)\w*\s+of\s+", "", c["name"]),
                    "level": c["level"], "programLevel": code, "currency": None, "tuitionPerYear": None,
                    "durationMonths": [c["months"], c["months"]] if c["months"] else [None, None],
                    "languageOfInstruction": "eng", "applicationFee": None, "tags": [], "successScore": None,
                    "intakes": [], "school": school, "source": "official-site", "sourceRef": c["url"],
                }
                descriptions[str(pid)] = {"name": c["name"], "descriptionHtml": c["summary"]}
            payload["programs"] = list(programs.values())
            cache["programs"] = descriptions
            cache["programsTotal"] = len(descriptions)
            cache["courseSource"] = "official-site"
            cache_file.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
            pool_path.write_text(json.dumps(payload, indent=1, ensure_ascii=False))  # save progress per university

        browser.close()

    for uid, why in SKIPPED.items():
        print(f"{uid:<40} skipped: {why}")
    (RAW / "official-report.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
