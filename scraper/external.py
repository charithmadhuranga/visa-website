"""Profiles and courses for curated universities that are not on ApplyBoard.

    .venv/bin/python external.py            # then organize.py and npm run build

Sources (all public, documented, open data):

  * Wikipedia (MediaWiki API) and Wikidata
      about text (CC BY-SA 4.0, attributed on the site), logo, campus image,
      founding year, coordinates, official website, student numbers
  * CRICOS — Australian Government register of courses for overseas students
      https://data.gov.au/data/dataset/cricos  (course name, level, duration)
  * College Scorecard — U.S. Department of Education
      https://collegescorecard.ed.gov/data/api  (fields of study by credential)

Universities whose official course catalogues are not available as open data
(UK, Canada, New Zealand) get a full profile here and keep their hand-curated
course list on the site.

Writes:
  data/raw/schools/<schoolId>.json   same shape as details.py (profile + course descriptions)
  data/raw/programs.json             course records merged into the pool
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape import classify  # noqa: E402

HERE = Path(__file__).parent
RAW = HERE / "data" / "raw"
SCHOOLS = RAW / "schools"
CACHE = RAW / "external"
UA = "lga-catalogue-builder/1.0 (open-data aggregation; python-urllib)"

CRICOS_COURSES = ("https://data.gov.au/data/dataset/e5ae7059-bfa8-4fa4-a5c0-c13cf3520193/resource/"
                  "48cacf69-2082-415e-9595-f17d0c3a4af0/download/cricos-courses.csv")
SCORECARD = "https://api.data.gov/ed/collegescorecard/v1/schools"

# id = the curated id in assets/js/data/universities.js
UNIVERSITIES = [
    # Australia — courses from CRICOS
    {"id": "university-of-melbourne", "name": "University of Melbourne", "country": "australia", "wiki": "University of Melbourne", "cricos": "00116K"},
    {"id": "australian-national-university", "name": "Australian National University", "country": "australia", "wiki": "Australian National University", "cricos": "00120C"},
    {"id": "university-of-sydney", "name": "University of Sydney", "country": "australia", "wiki": "University of Sydney", "cricos": "00026A"},
    {"id": "monash-university", "name": "Monash University", "country": "australia", "wiki": "Monash University", "cricos": "00008C"},
    {"id": "university-of-queensland", "name": "University of Queensland", "country": "australia", "wiki": "University of Queensland", "cricos": "00025B"},
    # USA — courses from College Scorecard
    {"id": "stanford-university", "name": "Stanford University", "country": "usa", "wiki": "Stanford University", "scorecard": 243744},
    {"id": "uc-berkeley", "name": "University of California, Berkeley", "country": "usa", "wiki": "University of California, Berkeley", "scorecard": 110635},
    {"id": "uiuc", "name": "University of Illinois Urbana-Champaign", "country": "usa", "wiki": "University of Illinois Urbana-Champaign", "scorecard": 145637},
    # Profiles only (no open course dataset) — curated course lists are kept
    {"id": "university-of-toronto", "name": "University of Toronto", "country": "canada", "wiki": "University of Toronto"},
    {"id": "university-of-british-columbia", "name": "University of British Columbia", "country": "canada", "wiki": "University of British Columbia"},
    {"id": "mcgill-university", "name": "McGill University", "country": "canada", "wiki": "McGill University"},
    {"id": "mcmaster-university", "name": "McMaster University", "country": "canada", "wiki": "McMaster University"},
    {"id": "university-of-oxford", "name": "University of Oxford", "country": "uk", "wiki": "University of Oxford"},
    {"id": "imperial-college-london", "name": "Imperial College London", "country": "uk", "wiki": "Imperial College London"},
    {"id": "university-of-manchester", "name": "University of Manchester", "country": "uk", "wiki": "University of Manchester"},
    {"id": "kings-college-london", "name": "King's College London", "country": "uk", "wiki": "King's College London"},
    {"id": "university-of-glasgow", "name": "University of Glasgow", "country": "uk", "wiki": "University of Glasgow"},
    {"id": "university-of-auckland", "name": "University of Auckland", "country": "new-zealand", "wiki": "University of Auckland"},
    {"id": "university-of-otago", "name": "University of Otago", "country": "new-zealand", "wiki": "University of Otago"},
    {"id": "victoria-university-wellington", "name": "Victoria University of Wellington", "country": "new-zealand", "wiki": "Victoria University of Wellington"},
    {"id": "university-of-canterbury", "name": "University of Canterbury", "country": "new-zealand", "wiki": "University of Canterbury"},
    {"id": "massey-university", "name": "Massey University", "country": "new-zealand", "wiki": "Massey University"},
    {"id": "auckland-university-of-technology", "name": "Auckland University of Technology", "country": "new-zealand", "wiki": "Auckland University of Technology"},
]

COUNTRY_CODE = {"australia": "AU", "usa": "US", "canada": "CA", "uk": "GB", "new-zealand": "NZ"}
PUBLIC_Q = {"Q875538", "Q23002054", "Q62078547"}    # public university / public research university / public educational institution
PRIVATE_Q = {"Q902104", "Q23002042", "Q2385804"}     # private university / private not-for-profit / educational institution (private)


def get(url: str, accept: str = "application/json", retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:  # noqa: BLE001
            time.sleep(2 * (attempt + 1))
    return None


def stable_id(*parts) -> int:
    """Synthetic ids well above ApplyBoard's numeric range."""
    return 1_000_000_000 + int(hashlib.sha1("|".join(map(str, parts)).encode()).hexdigest()[:8], 16) % 900_000_000


def commons_file(name: str | None, width: int) -> str | None:
    if not name:
        return None
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(name.replace(' ', '_'))}?width={width}"


# ------------------------------------------------------------------ profile
def infobox_logo(title: str) -> str | None:
    """Logo / seal / crest named in the article infobox (may be a non-free file on en.wikipedia)."""
    q = urllib.parse.urlencode({"action": "parse", "format": "json", "page": title, "prop": "wikitext",
                                "section": 0, "redirects": 1})
    raw = get(f"https://en.wikipedia.org/w/api.php?{q}")
    if not raw:
        return None
    text = (json.loads(raw).get("parse") or {}).get("wikitext", {}).get("*", "")
    for key in ("logo", "image_name", "image", "seal", "crest"):
        m = re.search(r"\|\s*%s\s*=\s*(?:\[\[)?(?:File:|Image:)?([^\n|\]{}<]+\.(?:svg|png|jpg|jpeg|gif))" % key, text, re.I)
        if not m:
            continue
        fname = m.group(1).strip()
        q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": f"File:{fname}",
                                    "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 320})
        info = get(f"https://en.wikipedia.org/w/api.php?{q}")
        if info:
            page = next(iter(json.loads(info)["query"]["pages"].values()))
            ii = (page.get("imageinfo") or [{}])[0]
            if ii.get("thumburl") or ii.get("url"):
                return ii.get("thumburl") or ii.get("url")
    return None


def wiki_profile(title: str) -> dict:
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "redirects": 1, "titles": title,
        "prop": "extracts|pageprops|pageimages|info", "exintro": 1, "piprop": "original", "inprop": "url",
    })
    page = {}
    for attempt in range(4):
        raw = get(f"https://en.wikipedia.org/w/api.php?{q}")
        page = next(iter(json.loads(raw)["query"]["pages"].values())) if raw else {}
        if page.get("extract"):
            break
        time.sleep(3 * (attempt + 1))
    qid = (page.get("pageprops") or {}).get("wikibase_item")
    claims = {}
    if qid:
        ent = get(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
        if ent:
            claims = json.loads(ent)["entities"][qid]["claims"]

    def val(prop):
        for c in claims.get(prop, []):
            v = (c.get("mainsnak") or {}).get("datavalue", {}).get("value")
            if v is not None and c.get("rank") != "deprecated":
                return v
        return None

    def vals(prop):
        return [(c.get("mainsnak") or {}).get("datavalue", {}).get("value") for c in claims.get(prop, [])]

    inception = val("P571")
    coords = val("P625") or {}
    students = val("P2196")
    kinds = {v.get("id") for v in vals("P31") if isinstance(v, dict)}
    images = [v for v in vals("P18") if isinstance(v, str)] + [v for v in vals("P8592") if isinstance(v, str)]
    logo = (commons_file(val("P154"), 320) or infobox_logo(title) or commons_file(val("P158"), 320)
            or commons_file(val("P94"), 320) or (page.get("original") or {}).get("source"))
    return {
        "qid": qid,
        "url": page.get("fullurl") or f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
        "extractHtml": page.get("extract") or "",
        "founded": inception["time"][1:5] if isinstance(inception, dict) and inception.get("time") else None,
        "latitude": coords.get("latitude"),
        "longitude": coords.get("longitude"),
        "website": val("P856"),
        "students": int(float(students["amount"])) if isinstance(students, dict) else None,
        "type": "Public" if kinds & PUBLIC_Q else "Private" if kinds & PRIVATE_Q else None,
        "logoUrl": logo,
        "photos": [commons_file(f, 1280) for f in images[:4]],
    }


# ------------------------------------------------------------------ courses
def cricos_rows() -> list[dict]:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / "cricos-courses.csv"
    if not path.exists() or (time.time() - path.stat().st_mtime) > 7 * 86400:
        data = get(CRICOS_COURSES, "text/csv")
        if not data:
            raise SystemExit("could not download CRICOS courses")
        path.write_bytes(data)
    rows = list(csv.reader(io.StringIO(path.read_text(encoding="utf-8-sig", errors="replace"))))
    hi = next(i for i, r in enumerate(rows) if "CRICOS Course Code" in r)
    head = rows[hi]
    return [dict(zip(head, r)) for r in rows[hi + 1:] if len(r) == len(head)]


def cricos_courses(provider: str, rows: list[dict]) -> list[dict]:
    out = []
    for r in rows:
        if r["CRICOS Provider Code"] != provider or r.get("Expired") == "Yes":
            continue
        if (r.get("Course Language") or "English").strip().lower() != "english":
            continue
        level = r["Course Level"]
        name = re.sub(r"\s+", " ", r["Course Name"]).strip()
        if level == "Bachelor Degree":
            code = "bachelors"
        elif level == "Masters Degree (Coursework)":
            code = "masters_degree"
        else:
            continue
        weeks = int(r["Duration (Weeks)"]) if (r.get("Duration (Weeks)") or "").isdigit() else None
        months = int(round(weeks / 52 * 12 / 6) * 6) if weeks else None
        fields = [r.get("Field of Education 1 Narrow Field"), r.get("Field of Education 2 Narrow Field")]
        fields = [re.sub(r"^\d+\s*-\s*", "", f).strip() for f in fields if f]
        out.append({
            "code": code, "name": name, "months": months or None, "weeks": weeks,
            "ref": r["CRICOS Course Code"],
            "summary": (f"<p>{htmlesc(name)} is registered on CRICOS, the Australian Government register of courses "
                        f"for international students (CRICOS course code {htmlesc(r['CRICOS Course Code'])}).</p>"
                        f"<ul><li><strong>Field of education:</strong> {htmlesc(' / '.join(fields) or 'General')}</li>"
                        + (f"<li><strong>Duration:</strong> {weeks} weeks full-time</li>" if weeks else "")
                        + "</ul>"),
        })
    return out


def scorecard_courses(unit_id: int, api_key: str) -> list[dict]:
    q = urllib.parse.urlencode({"api_key": api_key, "id": unit_id, "fields": "id,school.name,latest.programs.cip_4_digit"})
    raw = get(f"{SCORECARD}?{q}")
    results = json.loads(raw).get("results") if raw else []
    programs = (results[0] if results else {}).get("latest.programs.cip_4_digit") or []
    out = []
    for p in programs:
        level = (p.get("credential") or {}).get("level")
        if level not in (3, 5):
            continue
        title = (p.get("title") or "").strip().rstrip(".")
        if not title or re.search(r"\b(other|general)\b$", title, re.I) and len(title) < 12:
            continue
        counts = p.get("counts") or {}
        awards = (counts.get("ipeds_awards1") or 0) + (counts.get("ipeds_awards2") or 0)
        if awards == 0:
            continue  # not actively awarded
        degree = "Bachelor's" if level == 3 else "Master's"
        code = "bachelors" if level == 3 else "masters_degree"
        name = f"{'Bachelor' if level == 3 else 'Master'}'s degree – {title}"
        if level == 5 and re.search(r"business administration", title, re.I):
            name = f"Master of Business Administration (MBA) – {title}"
        cip = p.get("code") or ""
        out.append({
            "code": code, "name": name, "months": 48 if level == 3 else None, "ref": f"CIP {cip[:2]}.{cip[2:]}",
            "summary": (f"<p>{htmlesc(degree)} study in {htmlesc(title)} is listed for this university in College Scorecard, "
                        f"the U.S. Department of Education's official data on programs and outcomes "
                        f"(field of study code CIP {htmlesc(cip[:2])}.{htmlesc(cip[2:])}).</p>"
                        f"<p>{awards} degrees were awarded in this field in the most recent reporting years.</p>"),
        })
    return out


def htmlesc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# --------------------------------------------------------------------- main
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scorecard-key", default="DEMO_KEY", help="api.data.gov key (DEMO_KEY works for small runs)")
    args = parser.parse_args()

    SCHOOLS.mkdir(parents=True, exist_ok=True)
    pool_path = RAW / "programs.json"
    payload = json.loads(pool_path.read_text())
    pool = {p["programId"]: p for p in payload["programs"]}
    # drop records from earlier runs of this script
    pool = {k: v for k, v in pool.items() if v.get("source") not in ("cricos", "college-scorecard")}
    cricos = None
    added = 0

    for u in UNIVERSITIES:
        prof = wiki_profile(u["wiki"])
        school_id = stable_id("school", u["id"])
        courses = []
        source = None
        if u.get("cricos"):
            cricos = cricos if cricos is not None else cricos_rows()
            courses, source = cricos_courses(u["cricos"], cricos), "cricos"
        elif u.get("scorecard"):
            courses, source = scorecard_courses(u["scorecard"], args.scorecard_key), "college-scorecard"

        school = {
            "schoolId": school_id, "name": u["name"], "slug": None,
            "city": "", "province": "", "countryCode": COUNTRY_CODE[u["country"]], "country": u["country"],
            "logoUrl": prof["logoUrl"],
        }
        descriptions = {}
        for c in courses:
            level = classify(c["code"], c["name"])
            if not level:
                continue
            pid = stable_id(source, u["id"], c["ref"], c["name"])
            pool[pid] = {
                "programId": pid, "name": c["name"],
                "shortName": c["name"].split(" – ", 1)[-1].split(" of ", 1)[-1] if " – " in c["name"] else c["name"],
                "level": level, "programLevel": c["code"], "currency": None, "tuitionPerYear": None,
                "durationMonths": [c["months"], c["months"]] if c["months"] else [None, None],
                "languageOfInstruction": "eng", "applicationFee": None, "tags": [], "successScore": None,
                "intakes": [], "school": school, "source": source, "sourceRef": c["ref"],
            }
            descriptions[str(pid)] = {"name": c["name"], "descriptionHtml": c["summary"]}
            added += 1

        cache = {
            "schoolId": school_id, "slug": None, "name": u["name"], "country": u["country"],
            "fetchedAt": datetime.now(timezone.utc).isoformat(), "ok": True, "external": True,
            "curatedId": u["id"],
            "aboutHtml": prof["extractHtml"],
            "aboutSource": {"name": "Wikipedia", "url": prof["url"], "license": "CC BY-SA 4.0"},
            "metaDescription": None,
            "location": {"address": None, "city": None, "province": None, "country": None,
                         "latitude": prof["latitude"], "longitude": prof["longitude"], "name": u["name"]},
            "institutionType": prof["type"], "founded": prof["founded"],
            "website": prof["website"], "students": prof["students"],
            "programLevels": [], "topDisciplines": [], "typicalDuration": [],
            "logoUrl": prof["logoUrl"], "photos": [p for p in prof["photos"] if p],
            "canWorkAndStudy": None, "coopParticipating": None, "conditionalAcceptance": None,
            "accommodationHtml": None, "onCampusHousing": None,
            "programs": descriptions, "programsTotal": len(descriptions), "courseSource": source,
        }
        (SCHOOLS / f"{school_id}.json").write_text(json.dumps(cache, ensure_ascii=False, indent=1))
        print(f"{u['name']:<44} about={len(prof['extractHtml']):>5}  logo={'y' if prof['logoUrl'] else 'n'}  "
              f"photos={len(cache['photos'])}  founded={prof['founded']}  courses={len(descriptions):>4}"
              f"{'  (' + source + ')' if source else ''}", flush=True)
        time.sleep(0.5)

    payload["programs"] = sorted(pool.values(), key=lambda p: (p["school"]["country"], p["level"], p["school"]["name"], p["name"]))
    payload["recordsKept"] = len(payload["programs"])
    pool_path.write_text(json.dumps(payload, indent=1, ensure_ascii=False))
    print(f"\nadded {added} courses from open data -> {pool_path}")


if __name__ == "__main__":
    main()
