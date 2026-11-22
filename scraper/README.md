# Course and university catalogue

This folder builds the data behind the course finder (`courses.html`), the university profile pages (`universities/<country>/<id>.html`), the country university lists and the "Courses & universities" sections in the Study Abroad guides.

## Refreshing the catalogue

You need Chromium with an active ApplyBoard login for step 1. Step 2 uses public pages and needs no login.

```bash
cd scraper
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time only

.venv/bin/python scrape.py        # 1. search results -> data/raw/programs.json             (~3 min)
.venv/bin/python details.py       # 2. school pages and program descriptions -> data/raw/schools/ (~50 min, resumable)
.venv/bin/python scrape_schools.py  # 2b. MIT / Harvard: public ApplyBoard pages not in the search (no login)
.venv/bin/python external.py      # 2c. hand-curated universities not on ApplyBoard: open data (see below)
.venv/bin/python official.py      # 2d. UK / Canada / NZ curated universities: official course pages (~30 min)
.venv/bin/python organize.py      # 3. clean, select and merge -> data/processed/ and the site data files
cd .. && npm run build            # 4. university pages, directory, sitemap, SEO checks
```

`details.py` caches one file per school. Re-running it fetches only schools that are missing; use `--refresh` to fetch everything again.

## Outputs

| File | What it is |
|---|---|
| `data/processed/courses.json` | The 3,000 published courses. Each has a `key`, a `universityId` (the link to universities.json), a sanitised `summaryHtml` / `summaryText`, intakes and duration. |
| `data/processed/universities.json` | One record per institution, with campuses grouped. Includes about, type, founding year, logo, photos, location and campuses (with coordinates), program-level and discipline mix, typical durations, work/co-op/housing information and `courseIds`. |
| `data/processed/summary.json` | Statistics on how much of the data was found |
| `../assets/js/data/courses.js` | Compact course data for the course finder. Contains no fees or tags. |
| `../assets/js/data/summaries/<universityId>.json` | Program overviews, fetched only when a course's details are opened |
| `../assets/js/data/university-directory.js` | Written by `npm run build`. A compact list of every institution, used by the listing pages and guides. |

Fees remain in `data/processed/courses.json` for reference, but they are never published to the site.

## Files

- `browser.py`: starts headless Chromium from a temporary copy of your profile. Only cookies, local storage and preferences are copied, and the copy is deleted when the run ends.
- `scrape.py`: makes one query per country and level on the server and collects the English-taught Bachelor's, Master's and MBA programs.
- `details.py`: reads the public school pages (embedded Next.js data, parsed by `rsc.py`) and the public school-programs API.
- `organize.py`: cleans and selects the courses (removing online-only programs and catalogue codes, merging campuses, sorting into fields, balancing by country, level and university).
- `enrich.py`: sanitises the HTML (allowing only `p`, `h4`, `ul`/`ol`/`li`, `strong` and `em`, and removing text that promotes the source platform), attaches program summaries, builds university records and matches them to the hand-curated profiles in `assets/js/data/universities.js`.
- `diagnose*.py`, `probe*.py`: one-off scripts used to explore the API. `session.py` is an older approach that nothing uses.

## Universities profiled by hand on the site

The 30 universities in `assets/js/data/universities.js` always appear on the site, with up to 60 courses each (`organize.py --curated-cap`) added on top of the balanced 3,000-course pool.

| Source | Used for |
|---|---|
| ApplyBoard | RMIT, MIT, Harvard, Waterloo, Edinburgh, Arizona State |
| CRICOS, the Australian Government's register of courses for international students (data.gov.au, open data) | Courses at Melbourne, ANU, Sydney, Monash and UQ |
| College Scorecard, the U.S. Department of Education's open API | Fields of study at Stanford, Berkeley and UIUC |
| Wikipedia and Wikidata (CC BY-SA, credited on each page) | About text, logo, campus image, founding year, coordinates, website and student numbers for every university not on ApplyBoard |

| Official university websites (`official.py`) | Courses at UK, Canadian and New Zealand universities that have no open course dataset (Toronto, UBC, McGill, McMaster, Oxford graduate courses, Imperial, Manchester, King's, Glasgow, Auckland, Otago, Canterbury, Massey, AUT) |

`official.py` reads each site's `robots.txt` in the browser and follows it; Oxford's undergraduate listing is disallowed, so only Oxford's graduate courses are used. It uses a plain headless Chromium with no automation-hiding flags, loads one page at a time with a pause between pages, and skips any site that serves a bot challenge (Victoria University of Wellington). For each course it takes the official title, a short summary (meta description and opening paragraphs, with a link to the source), the duration and the level. Doctoral, certificate, diploma and online-only programmes are dropped.

`organize.py` maps ApplyBoard's school names onto the site's names (`CANONICAL_UNIVERSITIES`). For example, "Royal Melbourne Institute of Technology (RMIT)" becomes RMIT University, and Harvard College, Harvard Business School and Harvard GSAS become Harvard University.

## Notes

- Logos and campus photos are linked from the source's image host, not copied into this repo. If an image fails to load, the pages show the institution's initials instead.
- When a curated university (for example `university-of-waterloo`) matches a catalogue institution, the two are merged into one page and the curated URL and ranking are kept.
