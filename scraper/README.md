# Course and university catalogue

This folder builds the data behind the course finder (`courses.html`), the university profile pages (`universities/<country>/<id>.html`), the country university lists and the "Courses & universities" sections in the Study Abroad guides.

## Refreshing the catalogue

You need Chromium with an active ApplyBoard login for step 1. Step 2 uses public pages and needs no login.

```bash
cd scraper
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time only

.venv/bin/python scrape.py        # 1. search results -> data/raw/programs.json             (~3 min)
.venv/bin/python details.py       # 2. school pages and program descriptions -> data/raw/schools/ (~50 min, resumable)
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

## Notes

- Logos and campus photos are linked from the source's image host, not copied into this repo. If an image fails to load, the pages show the institution's initials instead.
- When a curated university (for example `university-of-waterloo`) matches a catalogue institution, the two are merged into one page and the curated URL and ranking are kept.
