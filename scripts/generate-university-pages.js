/**
 * University profile pages + university directory data.
 *
 * Sources
 *   scraper/data/processed/universities.json  catalogue institutions (scraper/organize.py)
 *   scraper/data/processed/courses.json       catalogue courses, linked by universityId
 *   assets/js/data/universities.js            hand-curated profiles (rankings, websites…)
 *
 * A curated profile and a catalogue institution with the same name are merged
 * into one page (the curated URL is kept). Every institution gets
 *   universities/<country>/<id>.html
 * and the compact directory used by listing pages and study-abroad guides is
 * written to assets/js/data/university-directory.js.
 *
 * Fees and other money information are intentionally not published.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';
const SITE_NAME = 'LGA Visa';
const OG_IMAGE = `${SITE}/images/og/lga-og.png`;
const MARKER = '<!-- generated:university-profile -->';
const LEVELS = ["Bachelor's", "Master's", 'MBA'];
const COURSE_SOURCES = {
  cricos: 'CRICOS, the Australian Government register of courses for international students',
  'college-scorecard': 'College Scorecard, U.S. Department of Education',
  'official-site': "the university's official course pages",
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COUNTRY = {
  australia: { name: 'Australia', icon: 'fa-earth-oceania', color: '#B45309', tint: '#FEF3C7' },
  canada: { name: 'Canada', icon: 'fa-leaf', color: '#B91C1C', tint: '#FEE2E2' },
  uk: { name: 'United Kingdom', icon: 'fa-crown', color: '#1D4ED8', tint: '#DBEAFE' },
  usa: { name: 'USA', icon: 'fa-flag-usa', color: '#0B1F3A', tint: '#E0E7F1' },
  'new-zealand': { name: 'New Zealand', icon: 'fa-mountain-sun', color: '#047857', tint: '#D1FAE5' },
};

/* ------------------------------------------------------------------ utils */
const esc = (s = '') =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/[\s,;:–-]+\S*$/, '')}…`);
const norm = (s) => String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/^the /, '').trim();
const fmtMonth = (iso) => { if (!iso) return ''; const [y, m] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const fmtDay = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
function initials(name) {
  const words = name.replace(/[()]/g, '').split(/\s+/).filter((w) => w && !/^(of|the|and|at|in|for|&|-|–)$/i.test(w));
  return (words.length === 1 ? words[0].slice(0, 2) : words.slice(0, 2).map((w) => w[0]).join('')).toUpperCase();
}
function durationText(range) {
  const [lo, hi] = range || [];
  if (!hi) return '';
  const unit = (m) => (m % 12 === 0 ? `${m / 12} year${m === 12 ? '' : 's'}` : m % 6 === 0 && m > 12 ? `${(m / 12).toFixed(1)} years` : `${m} months`);
  return lo && lo !== hi ? `${unit(lo)} – ${unit(hi)}` : unit(hi);
}
function readJson(rel, fallback) {
  const file = path.join(ROOT, rel);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}
function loadCurated() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/data/universities.js'), 'utf8');
  return new Function(`${src}\nreturn { LGA_COUNTRIES, LGA_UNIVERSITIES };`)();
}

/* ------------------------------------------------------------- merge data */
function buildRecords() {
  const { LGA_UNIVERSITIES } = loadCurated();
  const catalogue = readJson('scraper/data/processed/universities.json', { universities: [] }).universities;
  const courseData = readJson('scraper/data/processed/courses.json', { courses: [] });
  const today = new Date().toISOString().slice(0, 10);

  const coursesByUni = new Map();
  for (const c of courseData.courses) {
    if (!c.universityId) continue;
    if (!coursesByUni.has(c.universityId)) coursesByUni.set(c.universityId, []);
    coursesByUni.get(c.universityId).push({
      key: c.key,
      name: c.name,
      level: c.level,
      field: c.field,
      duration: durationText(c.durationMonths) || c.duration || '',
      intakes: (c.intakes || []).filter((i) => i.start >= today),
      summaryHtml: c.summaryHtml || '',
      sourceUrl: c.sourceUrl || '',
      campuses: c.campuses || [],
    });
  }

  const curatedById = new Map(LGA_UNIVERSITIES.map((u) => [u.id, u]));
  const curatedByName = new Map(LGA_UNIVERSITIES.map((u) => [norm(u.name), u]));
  const records = [];
  const usedCurated = new Set();

  for (const u of catalogue) {
    const cur = curatedById.get(u.id) || curatedByName.get(norm(u.name));
    if (cur) usedCurated.add(cur.id);
    const courses = (coursesByUni.get(u.id) || []).sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.name.localeCompare(b.name));
    records.push({
      id: cur ? cur.id : u.id,
      name: cur ? cur.name : u.name,
      country: cur ? cur.country : u.country,
      city: u.location.city || (cur && cur.city) || '',
      province: u.location.province || '',
      address: u.location.address || '',
      latitude: u.location.latitude,
      longitude: u.location.longitude,
      category: u.category || 'University',
      type: u.type || (cur && cur.type) || '',
      founded: u.founded || (cur && cur.founded) || '',
      ranking: cur ? cur.ranking : '',
      students: (cur && cur.students) || (u.students ? `${Number(u.students).toLocaleString('en-US')}+` : ''),
      website: (cur && cur.website) || u.website || '',
      aboutSource: u.aboutSource || null,
      courseSource: u.courseSource || null,
      logoUrl: u.logoUrl || '',
      photos: u.photos || [],
      aboutHtml: u.aboutHtml || (cur ? `<p>${esc(cur.about)}</p>` : ''),
      aboutText: u.aboutText || (cur ? cur.about : ''),
      campuses: u.campuses || [],
      programLevels: u.programLevels || [],
      topDisciplines: u.topDisciplines || [],
      typicalDuration: u.typicalDuration || [],
      canWorkAndStudy: u.canWorkAndStudy,
      coopParticipating: u.coopParticipating,
      onCampusHousing: u.onCampusHousing,
      accommodationHtml: u.accommodationHtml || '',
      catalogueCourses: courses,
      curatedCourses: cur && !courses.length ? cur.courses : [],
      fields: u.fields || {},
      catalogue: true,
      curated: !!cur,
    });
  }

  for (const cur of LGA_UNIVERSITIES) {
    if (usedCurated.has(cur.id)) continue;
    records.push({
      id: cur.id, name: cur.name, country: cur.country, city: cur.city, province: '', address: '',
      category: 'University', type: cur.type, founded: cur.founded, ranking: cur.ranking, students: cur.students,
      website: cur.website, logoUrl: '', photos: [], aboutHtml: `<p>${esc(cur.about)}</p>`, aboutText: cur.about,
      campuses: [], programLevels: [], topDisciplines: [], typicalDuration: [], accommodationHtml: '',
      catalogueCourses: [], curatedCourses: cur.courses || [], fields: {}, catalogue: false, curated: true,
    });
  }

  // Unique slugs per country folder.
  const seen = new Set();
  for (const r of records) {
    let slug = r.id;
    for (let n = 2; seen.has(`${r.country}/${slug}`); n += 1) slug = `${r.id}-${n}`;
    r.id = slug;
    seen.add(`${r.country}/${slug}`);
    r.courseCount = r.catalogueCourses.length || r.curatedCourses.length;
  }
  return records.sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ page */
function logoHtml(r, size, textSize) {
  const meta = COUNTRY[r.country] || COUNTRY.usa;
  const fallback = `<span class="flex h-full w-full items-center justify-center font-extrabold ${textSize}" style="background:${meta.tint};color:${meta.color}">${esc(initials(r.name))}</span>`;
  if (!r.logoUrl) return `<span class="flex ${size} shrink-0 overflow-hidden rounded-2xl" aria-hidden="true">${fallback}</span>`;
  return `<span class="flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                        <img src="${esc(r.logoUrl)}" alt="${esc(r.name)} logo" class="max-h-full max-w-full object-contain" referrerpolicy="no-referrer" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'font-extrabold ${textSize}',style:'color:${meta.color}',textContent:'${esc(initials(r.name))}'}))">
                    </span>`;
}

function bars(items, color) {
  return items.slice(0, 6).map((i) => `
                        <div>
                            <div class="mb-1 flex justify-between gap-3 text-xs"><span class="text-gray-600">${esc(i.label)}</span><span class="font-bold text-[#0B1F3A]">${i.percent}%</span></div>
                            <div class="h-1.5 overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full" style="width:${Math.max(2, i.percent)}%;background:${color}"></div></div>
                        </div>`).join('');
}

function courseItem(c, r) {
  const next = c.intakes[0];
  const deadline = c.intakes.map((i) => i.deadline).find(Boolean);
  return `
                        <details class="up-course group rounded-2xl border border-gray-100 bg-white transition open:border-[#C9A45C]/50 open:shadow-md" data-level="${esc(c.level)}" data-search="${esc(`${c.name} ${c.field} ${c.level}`.toLowerCase())}">
                            <summary class="flex min-w-0 cursor-pointer list-none items-start gap-3 p-4 sm:p-5">
                                <div class="min-w-0 flex-1">
                                    <p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#A9813F]">${esc(c.level)} <span class="text-gray-300">·</span> <span class="text-gray-500">${esc(c.field)}</span></p>
                                    <h3 class="font-bold leading-snug text-[#0B1F3A]">${esc(c.name)}</h3>
                                    <p class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        ${c.duration ? `<span><i class="fas fa-hourglass-half mr-1 text-[#A9813F]" aria-hidden="true"></i>${esc(c.duration)}</span>` : ''}
                                        <span><i class="fas fa-calendar-check mr-1 text-[#A9813F]" aria-hidden="true"></i>Next intake: ${next ? esc(fmtMonth(next.start)) : 'TBC'}</span>
                                        ${deadline ? `<span><i class="fas fa-clock mr-1 text-[#A9813F]" aria-hidden="true"></i>Apply by ${esc(fmtDay(deadline))}</span>` : ''}
                                    </p>
                                </div>
                                <i class="fas fa-chevron-down mt-1 text-xs text-gray-400 transition group-open:rotate-180" aria-hidden="true"></i>
                            </summary>
                            <div class="border-t border-gray-100 px-4 pb-5 pt-4 sm:px-5">
                                ${c.summaryHtml ? `<div class="up-prose">${c.summaryHtml}</div>` : '<p class="text-sm text-gray-600">Ask our counsellors for the full course outline, modules and entry requirements.</p>'}
                                ${c.intakes.length ? `<p class="mt-3 text-xs text-gray-500"><strong class="text-gray-700">Upcoming intakes:</strong> ${c.intakes.map((i) => esc(fmtMonth(i.start))).join(' · ')}</p>` : ''}
                                <div class="mt-4 flex flex-wrap gap-2">
                                    <a href="../../courses.html?course=${encodeURIComponent(c.key)}" class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-[#0B1F3A] transition hover:border-[#0B1F3A]">Open in course finder</a>
                                    ${c.sourceUrl ? `<a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener" class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-[#8A6A32] transition hover:border-[#C9A45C]">Official course page <i class="fas fa-arrow-up-right-from-square ml-1 text-xs" aria-hidden="true"></i></a>` : ''}
                                    <a href="../../contact.html?${esc(new URLSearchParams({ course: c.name, university: r.name, country: r.country, level: c.level }).toString())}" class="rounded-xl bg-[#0B1F3A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16305A]">Enquire</a>
                                </div>
                            </div>
                        </details>`;
}

function page(r, related) {
  const meta = COUNTRY[r.country] || { name: r.country, icon: 'fa-globe', color: '#0B1F3A', tint: '#E0E7F1' };
  const canonicalPath = `/universities/${r.country}/${r.id}.html`;
  const place = [r.city, meta.name].filter(Boolean).join(', ');
  let title = `${r.name}: Courses & Admissions | ${SITE_NAME}`;
  if (title.length > 70) title = `${r.name} | ${SITE_NAME}`;
  if (title.length > 70) title = `${clip(r.name, 56)} | ${SITE_NAME}`;
  const description = clip(
    `${r.name}${place ? ` in ${place}` : ''}: ${r.courseCount ? `${r.courseCount} courses, ` : ''}intakes, campus information and admission support for Sri Lankan students.`,
    160,
  );
  const enquire = `../../contact.html?${esc(new URLSearchParams({ course: 'General enquiry', university: r.name, country: r.country }).toString())}`;
  const levels = LEVELS.filter((l) => r.catalogueCourses.some((c) => c.level === l));
  const cover = r.photos[0];

  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Universities', item: `${SITE}/universities/` },
        { '@type': 'ListItem', position: 3, name: meta.name, item: `${SITE}/universities/${r.country}.html` },
        { '@type': 'ListItem', position: 4, name: r.name, item: `${SITE}${canonicalPath}` },
      ],
    },
    Object.fromEntries(Object.entries({
      '@type': 'CollegeOrUniversity',
      name: r.name,
      url: `${SITE}${canonicalPath}`,
      sameAs: r.website || undefined,
      logo: r.logoUrl || undefined,
      description: clip(stripTags(r.aboutText || ''), 300) || undefined,
      foundingDate: r.founded ? String(r.founded) : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: r.address || undefined,
        addressLocality: r.city || undefined,
        addressRegion: r.province || undefined,
        addressCountry: meta.name,
      },
      geo: r.latitude && r.longitude ? { '@type': 'GeoCoordinates', latitude: r.latitude, longitude: r.longitude } : undefined,
    }).filter(([, v]) => v !== undefined)),
  ];

  const facts = [
    ['fa-location-dot', 'Location', [r.city, r.province].filter(Boolean).join(', ') || meta.name],
    ['fa-building-columns', 'Institution', [r.type, r.category].filter(Boolean).join(' ') || 'Institution'],
    r.founded ? ['fa-calendar-days', 'Founded', String(r.founded)] : null,
    r.campuses.length > 1 ? ['fa-map-location-dot', 'Campuses', String(r.campuses.length)] : null,
    r.courseCount ? ['fa-graduation-cap', 'Courses listed', String(r.courseCount)] : null,
    r.ranking ? ['fa-ranking-star', 'Ranking', r.ranking] : null,
    r.students ? ['fa-user-graduate', 'Students', r.students] : null,
  ].filter(Boolean);

  const studentLife = [
    r.canWorkAndStudy != null ? ['fa-briefcase', 'Work while studying', r.canWorkAndStudy ? 'International students can work part-time alongside their studies (subject to visa conditions).' : 'Check work rights for this institution with our team.'] : null,
    r.coopParticipating != null ? ['fa-handshake', 'Co-op & placements', r.coopParticipating ? 'Offers co-op or work-placement options in selected programs.' : 'Co-op options are limited — ask us about placement-friendly alternatives.'] : null,
    r.onCampusHousing != null ? ['fa-house', 'On-campus housing', r.onCampusHousing ? 'On-campus residence is available.' : 'Students typically arrange off-campus or homestay accommodation.'] : null,
  ].filter(Boolean);

  const coursesSection = r.catalogueCourses.length ? `
                <section id="courses" class="scroll-mt-28">
                    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-widest text-[#A9813F]">Programs</p>
                            <h2 class="text-2xl font-extrabold text-[#0B1F3A]">Courses at ${esc(r.name)}</h2>
                        </div>
                        <a href="../../courses.html?uni=${encodeURIComponent(r.id)}" class="text-sm font-bold text-[#8A6A32] hover:underline">Compare in course finder <i class="fas fa-arrow-right ml-1" aria-hidden="true"></i></a>
                    </div>
                    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label class="relative flex-1"><span class="sr-only">Search courses at ${esc(r.name)}</span>
                            <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                            <input id="up-course-search" type="search" placeholder="Search ${r.catalogueCourses.length} courses" class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#C9A45C] focus:ring-2 focus:ring-[#C9A45C]/20">
                        </label>
                        ${levels.length > 1 ? `<div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by study level">
                            <button type="button" data-up-level="" aria-pressed="true" class="up-level rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold">All</button>
                            ${levels.map((l) => `<button type="button" data-up-level="${esc(l)}" aria-pressed="false" class="up-level rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold">${esc(l)}</button>`).join('')}
                        </div>` : ''}
                    </div>
                    <div id="up-course-list" class="space-y-3">${r.catalogueCourses.map((c) => courseItem(c, r)).join('')}
                    </div>
                    ${COURSE_SOURCES[r.courseSource] ? `<p class="mt-3 text-xs text-gray-500">Course list: ${COURSE_SOURCES[r.courseSource]}. A selection of programs is shown — ask us about any course not listed.</p>` : ''}
                    <p id="up-course-empty" class="hidden rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">No courses match your search.</p>
                </section>` : r.curatedCourses.length ? `
                <section id="courses" class="scroll-mt-28">
                    <h2 class="mb-4 text-2xl font-extrabold text-[#0B1F3A]">Popular courses</h2>
                    <div class="space-y-3">${r.curatedCourses.map((c) => `
                        <div class="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
                            <p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#A9813F]">${esc(c.level)}</p>
                            <h3 class="font-bold text-[#0B1F3A]">${esc(c.name)}</h3>
                            <p class="mt-1 text-xs text-gray-500">${esc(c.duration)}${c.intakes && c.intakes.length ? ` · Intakes: ${c.intakes.map(esc).join(', ')}` : ''}</p>
                        </div>`).join('')}
                    </div>
                </section>` : '';

  const body = `
    ${MARKER}
    <main>
        <section class="relative overflow-hidden bg-[#0B1F3A] text-white">
            ${cover ? `<img src="${esc(cover)}" alt="${esc(r.name)} campus" class="absolute inset-0 h-full w-full object-cover opacity-30" referrerpolicy="no-referrer" fetchpriority="high" onerror="this.remove()">` : ''}
            <div class="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A]/90 to-[#0B1F3A]/60" aria-hidden="true"></div>
            <div class="container relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
                <nav class="mb-6 flex flex-wrap items-center gap-x-2 text-sm text-blue-100" aria-label="Breadcrumb">
                    <a href="../../index.html" class="hover:text-[#E3C88A]">Home</a><i class="fas fa-chevron-right text-[10px]" aria-hidden="true"></i>
                    <a href="../index.html" class="hover:text-[#E3C88A]">Universities</a><i class="fas fa-chevron-right text-[10px]" aria-hidden="true"></i>
                    <a href="../${r.country}.html" class="hover:text-[#E3C88A]">${esc(meta.name)}</a><i class="fas fa-chevron-right text-[10px]" aria-hidden="true"></i>
                    <span aria-current="page" class="truncate">${esc(r.name)}</span>
                </nav>
                <div class="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:gap-6">
                    ${logoHtml(r, 'h-20 w-20 md:h-24 md:w-24', 'text-2xl')}
                    <div class="min-w-0 flex-1">
                        <p class="mb-2 text-sm font-semibold text-[#E3C88A]"><i class="fas ${meta.icon} mr-1.5" aria-hidden="true"></i>${esc(place)}${r.type ? ` · ${esc(r.type)} ${esc(r.category.toLowerCase())}` : ''}</p>
                        <h1 class="break-words text-[1.65rem] font-extrabold leading-tight sm:text-3xl md:text-5xl">${esc(r.name)}</h1>
                        ${r.ranking ? `<p class="mt-2 text-blue-100">${esc(r.ranking)}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-2 sm:flex-row md:flex-col">
                        ${r.courseCount ? `<a href="#courses" class="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9A45C] px-6 py-3 font-bold text-[#0B1F3A] transition hover:bg-[#E3C88A]">View ${r.courseCount} courses</a>` : ''}
                        <a href="${enquire}" class="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 font-bold transition hover:bg-white/10">Enquire with LGA</a>
                    </div>
                </div>
            </div>
        </section>

        <section class="border-b border-gray-200 bg-white">
            <dl class="container mx-auto grid max-w-7xl grid-cols-2 gap-px bg-gray-100 px-0 sm:grid-cols-3 lg:grid-cols-${Math.min(6, facts.length)} [&>div]:min-w-0 [&_dd]:break-words">
                ${facts.map(([icon, label, value]) => `<div class="bg-white px-4 py-4 sm:px-6"><dt class="text-[11px] font-semibold uppercase tracking-wider text-gray-400"><i class="fas ${icon} mr-1 text-[#A9813F]" aria-hidden="true"></i>${esc(label)}</dt><dd class="mt-1 text-sm font-bold text-[#0B1F3A]">${esc(value)}</dd></div>`).join('')}
            </dl>
        </section>

        <div class="bg-[#F5F6F8] py-10 md:py-14">
            <div class="container mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div class="min-w-0 space-y-10">
                ${r.aboutHtml ? `<section>
                    <p class="text-xs font-bold uppercase tracking-widest text-[#A9813F]">Overview</p>
                    <h2 class="mb-4 text-2xl font-extrabold text-[#0B1F3A]">About ${esc(r.name)}</h2>
                    <div class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                        <div class="up-about" data-collapsed="true"><div class="up-prose">${r.aboutHtml}</div></div>
                        <button type="button" id="up-about-toggle" class="mt-3 hidden text-sm font-bold text-[#8A6A32] hover:underline">Read more</button>
                        ${r.aboutSource && r.aboutSource.url ? `<p class="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">Text adapted from <a href="${esc(r.aboutSource.url)}" target="_blank" rel="noopener" class="underline hover:text-[#8A6A32]">${esc(r.aboutSource.name)}</a>, available under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener" class="underline hover:text-[#8A6A32]">${esc(r.aboutSource.license || 'CC BY-SA 4.0')}</a>.</p>` : ''}
                    </div>
                </section>` : ''}

                ${r.photos.length > 1 ? `<section aria-label="Campus photos">
                    <h2 class="mb-4 text-xl font-extrabold text-[#0B1F3A]">Campus life</h2>
                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        ${r.photos.slice(0, 6).map((p, i) => `<img src="${esc(p)}" alt="${esc(r.name)} campus photo ${i + 1}" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="aspect-[4/3] w-full rounded-2xl object-cover" onerror="this.remove()">`).join('')}
                    </div>
                </section>` : ''}

                ${coursesSection}

                ${studentLife.length || r.accommodationHtml ? `<section>
                    <h2 class="mb-4 text-2xl font-extrabold text-[#0B1F3A]">Student life &amp; support</h2>
                    <div class="grid gap-3 sm:grid-cols-3">
                        ${studentLife.map(([icon, label, text]) => `<div class="rounded-2xl border border-gray-100 bg-white p-5"><span class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F2E8] text-[#A9813F]"><i class="fas ${icon}" aria-hidden="true"></i></span><h3 class="mb-1 font-bold text-[#0B1F3A]">${esc(label)}</h3><p class="text-sm text-gray-600">${esc(text)}</p></div>`).join('')}
                    </div>
                    ${r.accommodationHtml ? `<details class="group mt-3 rounded-2xl border border-gray-100 bg-white p-5"><summary class="flex cursor-pointer list-none items-center justify-between font-bold text-[#0B1F3A]">Accommodation options<i class="fas fa-chevron-down text-xs text-gray-400 transition group-open:rotate-180" aria-hidden="true"></i></summary><div class="up-prose mt-3">${r.accommodationHtml}</div></details>` : ''}
                </section>` : ''}

                ${r.campuses.length ? `<section>
                    <h2 class="mb-4 text-2xl font-extrabold text-[#0B1F3A]">${r.campuses.length > 1 ? 'Campuses' : 'Campus location'}</h2>
                    <div class="grid gap-3 sm:grid-cols-2">
                        ${r.campuses.map((c) => `<div class="rounded-2xl border border-gray-100 bg-white p-5">
                            <h3 class="font-bold text-[#0B1F3A]"><i class="fas fa-location-dot mr-2 text-[#C9A45C]" aria-hidden="true"></i>${esc(c.name || c.city || r.name)}</h3>
                            <p class="mt-1 text-sm text-gray-600">${esc([c.address, c.city, c.province].filter(Boolean).join(', '))}</p>
                            ${c.latitude && c.longitude ? `<a href="https://www.google.com/maps/search/?api=1&amp;query=${c.latitude},${c.longitude}" target="_blank" rel="noopener" class="mt-2 inline-block text-sm font-semibold text-[#8A6A32] hover:underline">View on map <i class="fas fa-arrow-up-right-from-square ml-1 text-xs" aria-hidden="true"></i></a>` : ''}
                        </div>`).join('')}
                    </div>
                </section>` : ''}
            </div>

            <aside class="space-y-5 lg:sticky lg:top-28 lg:self-start">
                ${r.programLevels.length || r.topDisciplines.length ? `<div class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    ${r.topDisciplines.length ? `<h2 class="mb-3 font-bold text-[#0B1F3A]"><i class="fas fa-book-open mr-2 text-[#C9A45C]" aria-hidden="true"></i>Top disciplines</h2><div class="mb-6 space-y-3">${bars(r.topDisciplines, meta.color)}</div>` : ''}
                    ${r.programLevels.length ? `<h2 class="mb-3 font-bold text-[#0B1F3A]"><i class="fas fa-layer-group mr-2 text-[#C9A45C]" aria-hidden="true"></i>Program levels</h2><div class="space-y-3">${bars(r.programLevels, '#C9A45C')}</div>` : ''}
                    ${r.typicalDuration.length ? `<dl class="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 text-sm">${r.typicalDuration.map((d) => `<div><dt class="text-xs text-gray-500">${esc(d.label.replace(/^Average /, 'Typical '))}</dt><dd class="font-bold text-[#0B1F3A]">${esc(d.value)}</dd></div>`).join('')}</dl>` : ''}
                </div>` : ''}

                <div class="rounded-3xl bg-[#0B1F3A] p-6 text-white">
                    <h2 class="mb-2 text-lg font-extrabold">Apply to ${esc(r.name)} with LGA</h2>
                    <p class="mb-5 text-sm text-blue-100">We check your eligibility, prepare your application and guide your ${esc(meta.name)} student visa — from our office in Nugegoda.</p>
                    <a href="${enquire}" class="mb-2 block rounded-full bg-[#C9A45C] px-5 py-3 text-center font-bold text-[#0B1F3A] transition hover:bg-[#E3C88A]">Book a free consultation</a>
                    <a href="https://wa.me/94717225223?text=${encodeURIComponent(`Hi LGA Visa, I'd like to know more about studying at ${r.name}.`)}" target="_blank" rel="noopener" class="block rounded-full border border-white/30 px-5 py-3 text-center font-bold transition hover:bg-white/10"><i class="fab fa-whatsapp mr-1" aria-hidden="true"></i>WhatsApp us</a>
                </div>

                <div class="rounded-3xl border border-gray-100 bg-white p-6">
                    <h2 class="mb-3 font-bold text-[#0B1F3A]">Plan your move</h2>
                    <ul class="space-y-2 text-sm">
                        <li><a href="../../study-abroad/${r.country}.html" class="font-semibold text-[#8A6A32] hover:underline"><i class="fas ${meta.icon} mr-2 w-4" aria-hidden="true"></i>Study in ${esc(meta.name)} guide</a></li>
                        <li><a href="../../courses.html?country=${encodeURIComponent(r.country)}" class="font-semibold text-[#8A6A32] hover:underline"><i class="fas fa-magnifying-glass mr-2 w-4" aria-hidden="true"></i>All courses in ${esc(meta.name)}</a></li>
                        <li><a href="../${r.country}.html" class="font-semibold text-[#8A6A32] hover:underline"><i class="fas fa-building-columns mr-2 w-4" aria-hidden="true"></i>All universities in ${esc(meta.name)}</a></li>
                        ${r.website ? `<li><a href="${esc(r.website)}" target="_blank" rel="noopener" class="font-semibold text-[#8A6A32] hover:underline"><i class="fas fa-globe mr-2 w-4" aria-hidden="true"></i>Official website</a></li>` : ''}
                    </ul>
                </div>

                ${related.length ? `<div class="rounded-3xl border border-gray-100 bg-white p-6">
                    <h2 class="mb-3 font-bold text-[#0B1F3A]">Also in ${esc(meta.name)}</h2>
                    <div class="space-y-2">
                        ${related.map((u) => `<a href="${esc(u.id)}.html" class="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-[#F5F6F8]">
                            ${logoHtml(u, 'h-10 w-10', 'text-xs')}
                            <span class="min-w-0"><span class="block truncate text-sm font-bold text-[#0B1F3A]">${esc(u.name)}</span><span class="block text-xs text-gray-500">${esc(u.city)}${u.courseCount ? ` · ${u.courseCount} courses` : ''}</span></span>
                        </a>`).join('')}
                    </div>
                </div>` : ''}
            </aside>
            </div>
        </div>
    </main>`;

  return { canonicalPath, html: shell({ title, description, canonicalPath, graph, body, name: r.name, country: meta.name }) };
}

function shell({ title, description, canonicalPath, graph, body, name, country }) {
  const canonical = `${SITE}${canonicalPath}`;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/<\//g, '<\\/');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="keywords" content="${esc(`${name}, study at ${name}, ${country} universities for Sri Lankan students, ${name} courses`)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:locale" content="en_LK" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />

    <link rel="shortcut icon" href="../../images/ico/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="../../images/ico/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="../../images/ico/favicon-48x48.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../../images/ico/apple-touch-icon.png">
    <link rel="stylesheet" href="../../assets/css/site.css" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="../../assets/js/analytics.js"></script>
    <script type="application/ld+json">
${ld}
    </script>
    <style>
        .up-prose { font-size: .925rem; line-height: 1.7; color: #4B5563; overflow-wrap: anywhere; }
        @media (max-width: 480px) { .up-prose { font-size: .9rem; line-height: 1.65; } }
        main h2, main h3, .up-course summary h3 { overflow-wrap: anywhere; }
        img { max-width: 100%; }
        .up-prose p { margin: 0 0 .85rem; }
        .up-prose h4 { margin: 1.1rem 0 .4rem; font-weight: 700; color: #0B1F3A; }
        .up-prose ul, .up-prose ol { margin: 0 0 .85rem 1.15rem; }
        .up-prose ul { list-style: disc; } .up-prose ol { list-style: decimal; }
        .up-prose li { margin: .25rem 0; }
        .up-prose strong { color: #1F2937; }
        .up-about { position: relative; }
        .up-about[data-collapsed="true"] { max-height: 340px; overflow: hidden; }
        .up-about[data-collapsed="true"]::after { content: ""; position: absolute; inset: auto 0 0; height: 80px; background: linear-gradient(rgba(255,255,255,0), #fff); }
        .up-level[aria-pressed="true"] { background: #0B1F3A; border-color: #0B1F3A; color: #fff; }
        .up-course summary::-webkit-details-marker { display: none; }
    </style>
    <link rel="stylesheet" href="../../assets/css/tailwind.css" />
</head>
<body class="bg-[#F5F6F8] pt-[88px]">
    <div id="site-header"></div>
${body}
    <div id="site-footer"></div>
    <script>window.SITE_ROOT = '../../';</script>
    <script src="../../assets/js/components.js?v=13"></script>
    <script src="../../assets/js/site.js?v=3"></script>
    <script src="../../assets/js/university-profile.js?v=1"></script>
</body>
</html>
`;
}

/* -------------------------------------------------------------- directory */
function writeDirectory(records) {
  const rows = records.map((r) => {
    const fields = Object.entries(r.fields || {}).filter(([f]) => f !== 'Other').slice(0, 3).map(([f]) => f);
    const levels = {};
    for (const c of r.catalogueCourses) levels[c.level] = (levels[c.level] || 0) + 1;
    return {
      id: r.id, n: r.name, c: r.country, ci: r.city, p: r.province, cat: r.category, t: r.type || '',
      f: r.founded ? String(r.founded) : '', lg: r.logoUrl || '', cc: r.courseCount, lv: levels, tf: fields,
      cp: r.campuses.length, rk: r.ranking || '', cur: r.curated ? 1 : 0,
    };
  });
  const out = `/* Lanka Global Access — university directory (generated by scripts/generate-university-pages.js; do not edit). */\nwindow.LGA_UNI_DIRECTORY = ${JSON.stringify(rows)};\n`;
  fs.writeFileSync(path.join(ROOT, 'assets/js/data/university-directory.js'), out);
  return rows.length;
}

/* ---------------------------------------------------------------- generate */
function generateUniversityPages() {
  const records = buildRecords();
  const urls = [];
  const written = new Set();
  for (const r of records) {
    const related = records
      .filter((u) => u.country === r.country && u.id !== r.id && u.courseCount)
      .sort((a, b) => {
        const shared = (u) => Object.keys(u.fields || {}).filter((f) => r.fields && r.fields[f]).length;
        return shared(b) - shared(a) || b.courseCount - a.courseCount || a.name.localeCompare(b.name);
      })
      .slice(0, 5);
    const { canonicalPath, html } = page(r, related);
    const file = path.join(ROOT, canonicalPath.replace(/^\//, ''));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    written.add(path.normalize(file));
    urls.push({ loc: canonicalPath, lastmod: new Date().toISOString().slice(0, 10), priority: r.courseCount ? '0.60' : '0.50', changefreq: 'monthly' });
  }
  // Remove profiles generated earlier that no longer exist in the data.
  let removed = 0;
  for (const country of Object.keys(COUNTRY)) {
    const dir = path.join(ROOT, 'universities', country);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const full = path.normalize(path.join(dir, f));
      if (f.endsWith('.html') && !written.has(full) && fs.readFileSync(full, 'utf8').includes(MARKER)) {
        fs.unlinkSync(full);
        removed += 1;
      }
    }
  }
  const n = writeDirectory(records);
  fs.writeFileSync(path.join(__dirname, 'university-urls.json'), JSON.stringify(urls, null, 1));
  console.log(`  ✓ universities: ${records.length} profile pages (${records.filter((r) => r.catalogue).length} from the catalogue, ${records.filter((r) => r.curated).length} curated), directory ${n} rows${removed ? `, ${removed} stale removed` : ''}`);
  return urls;
}

module.exports = { generateUniversityPages, buildRecords };

if (require.main === module) generateUniversityPages();
