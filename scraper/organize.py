"""Clean, de-duplicate and select the scraped catalogue for the website.

    .venv/bin/python organize.py [--limit 3000]

Input : data/raw/programs.json             (from scrape.py)
        data/raw/schools/*.json            (from details.py — optional but recommended)
Output: data/processed/courses.json        cleaned selection, with program summaries and universityId
        data/processed/universities.json   one record per institution, linked to its courses
        data/processed/summary.json        coverage statistics
        ../assets/js/data/courses.js       compact browser global for courses.html
        ../assets/js/data/summaries/<universityId>.json   program summaries, loaded on demand by the course dialog

University pages are generated from universities.json by `npm run build`.

Selection is deterministic: each country gets an equal quota, split across
Bachelor's / Master's / MBA; within a bucket, universities are taken in
round-robin so no single school floods the list, and any shortfall in one
bucket is handed to the others.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enrich  # noqa: E402

HERE = Path(__file__).parent
SITE_ROOT = HERE.parent

LEVELS = ["Bachelor's", "Master's", "MBA"]
LEVEL_SHARE = {"Bachelor's": 0.45, "Master's": 0.35, "MBA": 0.20}
COUNTRY_ORDER = ["australia", "canada", "uk", "usa", "new-zealand"]

# Indicative conversion to USD, used only to let visitors compare and filter
# fees across currencies. Update alongside each scrape.
FX_TO_USD = {"USD": 1.0, "CAD": 0.72, "AUD": 0.66, "GBP": 1.30, "NZD": 0.60}
FX_DATE = "2026-11"

# Public-facing labels for the source's tags; commercial/internal tags
# (fast_loa, prime, incentive, instant_*) are dropped on purpose.
TAG_LABELS = {
    "scholarships_available": "scholarship",
    "high_job_availability": "jobs",
    "top_programs": "top",
    "popular_programs": "popular",
    "loan_available": "loan",
}

FIELD_RULES = [
    ("Business & Management", r"\b(mba|business administration)\b"),
    ("Health & Nursing", r"\b(nurs\w*|midwif\w*|health\w*|medic\w*|pharma\w*|paramedic\w*|physiotherap\w*|"
                         r"occupational therapy|public health|dental|dentist\w*|biomedical|nutrition|dietetic\w*|"
                         r"kinesiology|exercise|sport\w* science|optometry|radiograph\w*|speech pathology|"
                         r"veterinar\w*|neuroscience|speech|audiolog\w*|chiropractic|osteopath\w*|clinical|"
                         r"disorders|sexology)\b"),
    ("Computing & IT", r"\b(comput\w*|information technology|software|cyber\s?security|cyber|data science|"
                       r"artificial intelligence|applied ai|ai|machine learning|information systems|it|networking|"
                       r"game\w*|web|cloud|informatics|bioinformatics|robotics|ict|geocomputing|"
                       r"information and communications? technology|digital technolog\w*)\b"),
    ("Data & Analytics", r"\b(analytics|data|statistic\w*|actuarial)\b"),
    ("Engineering & Construction", r"\b(engineer\w*|mechatronic\w*|construction|architect\w*|surveying|"
                                   r"built environment|urban|planning|aviation|aerospace|manufacturing|materials)\b"),
    ("Law & Criminology", r"\b(law|laws|llb|llm|legal|juris|criminolog\w*|criminal|justice|policing|public safety|paralegal|"
                          r"crime|terrorism)\b"),
    ("Education & Teaching", r"\b(education|teaching|teacher|early childhood|tesol|e-?learning|pedagog\w*)\b"),
    ("Hospitality & Tourism", r"\b(hospitality|tourism|hotel|culinary|event\w*|travel)\b"),
    ("Arts, Media & Design", r"\b(design|art|arts|media|film\w*|curat\w*|content creation|music|journalism|communication\w*|"
                             r"animation|fashion|photograph\w*|creative|theatre|drama|acting|performance|dance|"
                             r"audio|advertising|public relations|english|writing|literature|interior)\b"),
    ("Social Sciences & Psychology", r"\b(psycholog\w*|social work|sociolog\w*|politic\w*|international relations|"
                                     r"policy|human services|counsel\w*|anthropolog\w*|history|philosoph\w*|"
                                     r"development|humanities|community|child|youth|family|theolog\w*|divinity|ministry|"
                                     r"religio\w*|languages?|linguistic\w*|liberal|international studies|studies|"
                                     r"archaeolog\w*|classic\w*|gender|peace|conflict|children|young people|famil\w*|"
                                     r"thanatolog\w*|french|spanish|german|japanese|chinese|korean|italian|indigenous|"
                                     r"geopolitic\w*|behaviou?r\w*|autism|disabilit\w*|disaster|emergency management)\b"),
    ("Science & Environment", r"\b(science|sciences|biolog\w*|chemi\w*|physic\w*|environment\w*|"
                              r"agricultur\w*|food|marine|geolog\w*|geograph\w*|biotechnolog\w*|"
                              r"mathematic\w*|sustainab\w*|ecolog\w*|bioscience\w*|zoolog\w*|forensic\w*|"
                              r"natural resource\w*|climate|energy|astronom\w*|horticultur\w*)\b"),
    ("Business & Management", r"\b(business|commerce|account\w*|financ\w*|econom\w*|marketing|management|"
                               r"banking|human resource\w*|supply chain|logistic\w*|entrepreneur\w*|"
                               r"project management|administration|leadership|trade|property|real estate|"
                               r"valuation)\b"),
]
FIELD_RES = [(field, re.compile(pattern, re.I)) for field, pattern in FIELD_RULES]

# "(074611E)", "(N122)", "(5158)", "(1514C)", "(X0G:1)" — catalogue/UCAS/CRICOS codes.
CODE_RE = re.compile(r"\(\s*[A-Z0-9:\-]*\d[A-Z0-9:\-]*\s*\)")
# All-caps parentheticals such as "(RAV)", "(DBMD)", "(MC-AGFOOD)" are internal
# program codes too — unless they are a recognised degree/subject acronym or
# simply abbreviate the words right before them ("Master of Business (MB)").
ACRONYM_RE = re.compile(r"\(\s*([A-Z][A-Z\-]{1,11})\s*\)")
KEEP_ACRONYMS = {
    "MBA", "EMBA", "LLB", "LLM", "JD", "STEM", "BBA", "BSBA", "BCOM", "BSC", "MSC", "MA", "BA", "BS", "MS",
    "MPH", "MSW", "BSN", "MSN", "MED", "IT", "ICT", "AI", "HR", "UX", "MENG", "BENG", "MPA", "MIB", "MPM",
    "MIT", "CFA", "ACCA", "CPA", "CIMA", "IIB", "TESOL", "PGCE", "MRES", "MPHIL", "MFA", "BFA", "BED",
    "IB", "MQP", "SCM", "PR", "ESL",
}
# Foundation / pathway / qualifying programmes bundled with the degree.
PATHWAY_RE = re.compile(r"foundation|pathway|qualifying program|accelerator|international year|"
                        r"incorporated bachelor|pre-?master|pre-?sessional|\+\s*(bachelor|master)", re.I)
# Generic degree titles say nothing about the subject ("Bachelor of Arts").
GENERIC_DEGREE_RE = re.compile(r"\b(bachelor|master|associate|doctor)s?('s)?\s+(of|in)\s+"
                               r"(applied\s+)?(arts?|science|sciences)\b(\s+in\b)?", re.I)
TRAILING_JUNK_RE = re.compile(r"[\s\-–—,/]+$")


def _strip_acronym(match: re.Match) -> str:
    acronym = match.group(1)
    if acronym.replace("-", "") in KEEP_ACRONYMS:
        return match.group(0)
    before = re.findall(r"[A-Za-z]+", match.string[:match.start()])
    letters = acronym.replace("-", "")
    initials = "".join(w[0] for w in before if w.lower() not in {"of", "and", "in", "the", "for"})
    if initials.upper().endswith(letters):
        return match.group(0)
    return ""


def clean_text(value: str) -> str:
    value = re.sub(r"(\w)\(", r"\1 (", value or "")
    value = CODE_RE.sub("", value)
    value = ACRONYM_RE.sub(_strip_acronym, value)
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([),])", r"\1", value)
    value = re.sub(r"\(\s+", "(", value)
    value = re.sub(r"\s[-–—]\s", " – ", value)
    return TRAILING_JUNK_RE.sub("", value).strip()


# ApplyBoard school names that belong to a university already profiled on the
# site under another name: (pattern on the base name, canonical name, keep
# the school name as the "campus" label).
CANONICAL_UNIVERSITIES = [
    (re.compile(r"^Royal Melbourne Institute of Technology \(RMIT\)$"), "RMIT University", False),
    (re.compile(r"^Harvard (College|Business School|Graduate School of Arts and Sciences)$"), "Harvard University", True),
]


def split_school(name: str) -> tuple[str, str]:
    """'Charles Sturt University -  Sydney' -> ('Charles Sturt University', 'Sydney')."""
    name = re.sub(r"\s+", " ", name or "").strip()
    parts = re.split(r"\s[-–—]\s", name, maxsplit=1)
    base, campus = (parts[0].strip(), parts[1].strip()) if len(parts) == 2 and parts[1] else (name, "")
    for pattern, canonical, school_as_campus in CANONICAL_UNIVERSITIES:
        if pattern.match(base):
            return canonical, (base if school_as_campus else campus)
    return base, campus


def institution_type(name: str) -> str:
    n = name.lower()
    # Pathway colleges run on/with a university campus ("Bangor University
    # International College", "Into University of …", "… Pathway College").
    if re.search(r"international college|international study cent|pathway|\binto\b|polytechnic|tafe", n):
        return "College & Institute"
    if "university" in n or "école" in n:
        return "University"
    if any(k in n for k in ("college", "polytechnic", "tafe", "institute", "school", "academy")):
        return "College & Institute"
    return "University"


def classify_field(name: str, subject: str) -> str:
    text = GENERIC_DEGREE_RE.sub(" ", f"{subject} {name}")
    subject = GENERIC_DEGREE_RE.sub(" ", subject or "")
    for field, pattern in FIELD_RES:
        if pattern.search(subject or ""):
            return field
    for field, pattern in FIELD_RES:
        if pattern.search(text):
            return field
    return "Other"


def duration_text(months: list) -> str:
    lo, hi = (months + [None, None])[:2]
    lo = lo or hi
    hi = hi or lo
    if not lo:
        return ""

    def fmt(m: int, unit: bool = True) -> str:
        if m % 12 == 0:
            y = m // 12
            return f"{y} year{'s' if y != 1 else ''}" if unit else str(y)
        return f"{m} months" if unit else str(m)

    if lo == hi:
        return fmt(lo)
    if lo % 6 == 0 and hi % 6 == 0 and hi >= 24:
        def yrs(m: int) -> str:
            return str(m // 12) if m % 12 == 0 else f"{m / 12:.1f}"
        return f"{yrs(lo)}–{yrs(hi)} years"
    return f"{lo}–{hi} months"


def tuition_ok(value) -> bool:
    return isinstance(value, (int, float)) and 1000 <= value <= 150_000


ONLINE_RE = re.compile(r"\bonline\b|distance learning|\bremote\b", re.I)


def clean_program(p: dict, today: str) -> dict | None:
    # Online / distance delivery does not lead to a student visa.
    if ONLINE_RE.search(p["name"]) or ONLINE_RE.search(p.get("shortName") or ""):
        return None
    name = clean_text(p["name"])
    if not name:
        return None
    subject = clean_text(p.get("shortName") or "") or name
    university, campus = split_school(p["school"]["name"])
    intakes = [
        {"start": i["startDate"], "deadline": i.get("deadline")}
        for i in p.get("intakes") or []
        if i.get("startDate") and i["startDate"] >= today
    ]
    tags = sorted({TAG_LABELS[t] for t in p.get("tags") or [] if t in TAG_LABELS})
    if PATHWAY_RE.search(p["name"]):
        tags.append("pathway")
    if re.search(r"\bco-?op\b|work placement|placement year|industrial placement", p["name"], re.I):
        tags.append("coop")
    fee = p.get("applicationFee")
    months = [m for m in (p.get("durationMonths") or []) if isinstance(m, int) and m > 0]
    tuition = p.get("tuitionPerYear") if tuition_ok(p.get("tuitionPerYear")) else None
    return {
        "id": p["programId"],
        "name": name,
        "subject": subject,
        "level": p["level"],
        "field": classify_field(name, subject),
        "university": university,
        "institutionType": institution_type(university),
        "campuses": [campus] if campus else [],
        "city": p["school"]["city"],
        "province": p["school"]["province"],
        "country": p["school"]["country"],
        "currency": p.get("currency"),
        "tuitionPerYear": round(tuition) if tuition else None,
        "applicationFee": round(fee, 2) if isinstance(fee, (int, float)) else None,
        "durationMonths": [min(months), max(months)] if months else [],
        "duration": duration_text([min(months), max(months)] if months else []),
        "intakes": intakes[:6],
        "tags": sorted(set(tags)),
        "_rank": {"High": 0, "Medium": 1, "Low": 2}.get(p.get("successScore") or "", 3),
        "_schoolId": p["school"]["schoolId"],
        "sourceUrl": p.get("sourceRef") if p.get("source") == "official-site" else None,
        "_schoolIds": [p["school"]["schoolId"]],
        "_programIds": [p["programId"]],
    }


def merge_campuses(courses: list[dict]) -> list[dict]:
    """The same program at several campuses of one university becomes one entry."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for c in courses:
        groups[(c["university"].lower(), c["name"].lower(), c["level"])].append(c)
    merged = []
    for items in groups.values():
        items.sort(key=lambda c: (c["_rank"], -len(c["intakes"]), c["tuitionPerYear"] or 10**9))
        best = dict(items[0])
        campuses, cities = [], []
        for c in items:
            for campus in c["campuses"] or [c["city"]]:
                if campus and campus not in campuses:
                    campuses.append(campus)
            if c["city"] and c["city"] not in cities:
                cities.append(c["city"])
        best["campuses"] = campuses if len(items) > 1 or best["campuses"] else []
        best["cities"] = cities
        fees = [c["tuitionPerYear"] for c in items if c["tuitionPerYear"]]
        best["tuitionPerYear"] = min(fees) if fees else None
        best["tags"] = sorted({t for c in items for t in c["tags"]})
        best["_schoolIds"] = sorted({sid for c in items for sid in c["_schoolIds"]})
        best["_programIds"] = [pid for c in items for pid in c["_programIds"]]
        starts = {}
        for c in items:
            for i in c["intakes"]:
                starts.setdefault(i["start"], i)
        best["intakes"] = [starts[k] for k in sorted(starts)][:6]
        merged.append(best)
    return merged


def candidate_key(c: dict):
    return (c["_rank"], 0 if c["intakes"] else 1, 0 if c["tuitionPerYear"] else 1, c["name"])


def select_curated(courses: list[dict], curated_names: set[str], cap: int) -> list[dict]:
    """Universities already profiled on the site get up to `cap` courses each,
    spread across study levels and fields, chosen before the balanced pool."""
    by_uni: dict[str, list[dict]] = defaultdict(list)
    for c in courses:
        if enrich.norm_name(c["university"]) in curated_names:
            by_uni[c["university"]].append(c)
    chosen = []
    for uni, items in by_uni.items():
        lanes: dict[tuple, list[dict]] = defaultdict(list)
        for c in sorted(items, key=lambda c: (candidate_key(c), c["name"])):
            lanes[(c["level"], c["field"])].append(c)
        order = sorted(lanes, key=lambda k: (LEVELS.index(k[0]), -len(lanes[k]), k[1]))
        picked, depth = [], 0
        while len(picked) < min(cap, len(items)):
            for key in order:
                if depth < len(lanes[key]) and len(picked) < cap:
                    picked.append(lanes[key][depth])
            depth += 1
        chosen += picked
    return chosen


def select(courses: list[dict], limit: int, per_uni: int) -> list[dict]:
    buckets: dict[tuple, list[dict]] = defaultdict(list)
    for c in courses:
        buckets[(c["country"], c["level"])].append(c)
    countries = [c for c in COUNTRY_ORDER if any(k[0] == c for k in buckets)]

    # Target per bucket, then redistribute shortfalls (within country first).
    target = {}
    for country in countries:
        quota = limit // len(countries)
        for level in LEVELS:
            target[(country, level)] = int(round(quota * LEVEL_SHARE[level]))
    for _ in range(4):
        slack = 0
        for key, want in target.items():
            have = len(buckets.get(key, []))
            if have < want:
                slack += want - have
                target[key] = have
        open_keys = [k for k in target if len(buckets.get(k, [])) > target[k]]
        if not slack or not open_keys:
            break
        for i, key in enumerate(open_keys):
            target[key] += slack // len(open_keys) + (1 if i < slack % len(open_keys) else 0)

    # A university may contribute at most `per_uni` courses in total and at
    # most per_uni // 2 per level, so Bachelor's listings cannot use up a
    # school's allowance before its Master's / MBA programs are considered.
    per_level = max(2, per_uni // 2)
    per_uni_count: Counter = Counter()
    per_uni_level: Counter = Counter()
    chosen: list[dict] = []
    chosen_ids: set = set()

    def take(c: dict) -> None:
        chosen.append(c)
        chosen_ids.add(id(c))
        per_uni_count[c["university"]] += 1
        per_uni_level[(c["university"], c["level"])] += 1

    def round_robin(pool: list[dict], quota: int, level_cap: int | None) -> int:
        by_uni: dict[str, list[dict]] = defaultdict(list)
        for c in sorted(pool, key=candidate_key):
            if id(c) not in chosen_ids:
                by_uni[c["university"]].append(c)
        order = sorted(by_uni, key=lambda u: (candidate_key(by_uni[u][0]), u))
        taken, depth = 0, 0
        deepest = max((len(v) for v in by_uni.values()), default=0)
        while taken < quota and depth < deepest:
            for uni in order:
                if taken >= quota:
                    break
                if depth >= len(by_uni[uni]) or per_uni_count[uni] >= per_uni:
                    continue
                c = by_uni[uni][depth]
                if level_cap is not None and per_uni_level[(uni, c["level"])] >= level_cap:
                    continue
                take(c)
                taken += 1
            depth += 1
        return taken

    for key in sorted(target, key=lambda k: (countries.index(k[0]), LEVELS.index(k[1]))):
        round_robin(buckets.get(key, []), target[key], per_level)

    # Fill pass: if caps left the catalogue short, top up evenly across
    # countries with whatever is left (still respecting the total cap).
    for country in countries:
        short = limit - len(chosen)
        if short <= 0:
            break
        share = -(-short // (len(countries) - countries.index(country)))
        pool = [c for (ctry, _), items in buckets.items() if ctry == country for c in items]
        round_robin(pool, share, None)
    return chosen


def compact(courses: list[dict], universities: list[dict], generated_at: str) -> dict:
    """Browser payload: universities table + short-keyed course rows.

    Fees, application fees and promotional tags are intentionally not
    published to the site (they remain in data/processed/courses.json)."""
    uni_index = {u["id"]: i for i, u in enumerate(universities)}
    unis = [{
        "id": u["id"],
        "n": u["name"],
        "c": u["country"],
        "t": u["category"],
        "p": u["location"]["province"],
        "ci": sorted({c["city"] for c in u["campuses"] if c.get("city")}) or [u["location"]["city"]],
        "lg": u["logoUrl"],
    } for u in universities]
    rows = []
    for c in courses:
        row = {
            "k": c["key"],
            "u": uni_index[c["universityId"]],
            "n": c["name"],
            "s": c["subject"],
            "l": LEVELS.index(c["level"]),
            "f": c["field"],
            "ci": c["city"],
            "d": c["durationMonths"],
            "i": [[i["start"], i["deadline"]] for i in c["intakes"]],
        }
        if c.get("summaryText"):
            row["x"] = 1  # a full summary exists in course-summaries.json
        if len(c["campuses"]) > 1:
            row["cp"] = c["campuses"]
        if c.get("sourceUrl"):
            row["o"] = c["sourceUrl"]  # official course page
        rows.append(row)
    return {"generatedAt": generated_at, "levels": LEVELS, "universities": unis, "courses": rows}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--in", dest="inp", default=str(HERE / "data" / "raw" / "programs.json"))
    parser.add_argument("--limit", type=int, default=3000, help="courses to publish")
    parser.add_argument("--per-university", type=int, default=20,
                        help="max courses from one university (all campuses)")
    parser.add_argument("--curated-cap", type=int, default=60,
                        help="courses per university for universities profiled by hand on the site "
                             "(added on top of --limit)")
    parser.add_argument("--site-file", default=str(SITE_ROOT / "assets" / "js" / "data" / "courses.js"))
    args = parser.parse_args()

    raw = json.loads(Path(args.inp).read_text())
    generated_at = raw.get("generatedAt") or datetime.now().isoformat()
    today = generated_at[:10] if raw.get("generatedAt") else date.today().isoformat()

    cleaned = [c for c in (clean_program(p, today) for p in raw["programs"]) if c]
    merged = merge_campuses(cleaned)
    curated_names = {k for k in enrich.load_curated()}  # normalised names and ids
    curated_courses = select_curated(merged, curated_names, args.curated_cap)
    taken = {id(c) for c in curated_courses}
    rest = [c for c in merged if id(c) not in taken and enrich.norm_name(c["university"]) not in curated_names]
    chosen = curated_courses + select(rest, args.limit, args.per_university)
    chosen.sort(key=lambda c: (COUNTRY_ORDER.index(c["country"]), LEVELS.index(c["level"]),
                               c["university"], c["name"]))

    for c in chosen:
        c["key"] = enrich.course_key(c["id"])
    schools = enrich.load_schools()
    with_summary = enrich.attach_summaries(chosen, schools)
    universities = enrich.build_universities(chosen, cleaned, schools)

    public = [{k: v for k, v in c.items() if not k.startswith("_")} for c in chosen]
    out_dir = HERE / "data" / "processed"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "courses.json").write_text(json.dumps(
        {"generatedAt": generated_at, "fxToUsd": FX_TO_USD, "fxDate": FX_DATE, "courses": public},
        indent=1, ensure_ascii=False))
    (out_dir / "universities.json").write_text(json.dumps(
        {"generatedAt": generated_at, "universities": universities}, indent=1, ensure_ascii=False))

    summary = {
        "generatedAt": generated_at,
        "rawPrograms": len(raw["programs"]),
        "afterCleaning": len(cleaned),
        "afterCampusMerge": len(merged),
        "published": len(public),
        "universities": len(universities),
        "byCountry": dict(Counter(c["country"] for c in public)),
        "byLevel": dict(Counter(c["level"] for c in public)),
        "byCountryLevel": {f"{k[0]}/{k[1]}": v for k, v in
                           sorted(Counter((c["country"], c["level"]) for c in public).items())},
        "byField": dict(Counter(c["field"] for c in public).most_common()),
        "withUpcomingIntake": sum(1 for c in public if c["intakes"]),
        "withSummary": with_summary,
        "schoolsWithDetails": len(schools),
        "universitiesWithAbout": sum(1 for u in universities if u["aboutHtml"]),
        "universitiesWithLogo": sum(1 for u in universities if u["logoUrl"]),
        "universitiesMatchedToCurated": sum(1 for u in universities if u["curated"]),
        "maxPerUniversity": max(Counter(c["university"] for c in public).values(), default=0),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=1))

    payload = json.dumps(compact(public, universities, generated_at), ensure_ascii=False, separators=(",", ":"))
    Path(args.site_file).write_text(
        "/* Lanka Global Access — course catalogue (generated by scraper/organize.py; do not edit by hand). */\n"
        f"window.LGA_COURSE_DATA = {payload};\n"
    )
    # Program summaries: one small file per university, fetched by the course
    # dialog only when a course from that university is opened.
    summaries_dir = Path(args.site_file).with_name("summaries")
    summaries_dir.mkdir(exist_ok=True)
    for old in summaries_dir.glob("*.json"):
        old.unlink()
    per_uni: dict[str, dict] = defaultdict(dict)
    for c in public:
        if c.get("summaryHtml"):
            per_uni[c["universityId"]][c["key"]] = c["summaryHtml"]
    for uni_id, items in per_uni.items():
        (summaries_dir / f"{uni_id}.json").write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")))
    legacy = Path(args.site_file).with_name("course-summaries.json")
    if legacy.exists():
        legacy.unlink()
    summaries_file = summaries_dir

    print(json.dumps(summary, indent=1))
    for f in (Path(args.site_file), out_dir / "universities.json", out_dir / "courses.json"):
        print(f"wrote {f} ({f.stat().st_size / 1024:.0f} KB)")
    print(f"wrote {len(per_uni)} summary files -> {summaries_file}")


if __name__ == "__main__":
    main()
