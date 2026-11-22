/* Lanka Global Access — catalogue widgets shared by the Universities hub and
 * the Study Abroad guides. Requires assets/js/data/university-directory.js.
 *
 *   <span data-uni-count="canada"></span>          institution count
 *   <span data-course-count="canada"></span>       course count
 *   <div data-lga-showcase="canada"></div>         "Courses & universities in Canada" block
 *   <div data-lga-uni-search></div>                search across every institution
 *
 * Links use window.SITE_ROOT ('./', '../').
 */
(function () {
    'use strict';

    const ROOT = window.SITE_ROOT || './';
    const COUNTRY = {
        australia: { name: 'Australia', icon: 'fa-earth-oceania', color: '#B45309', tint: '#FEF3C7' },
        canada: { name: 'Canada', icon: 'fa-leaf', color: '#B91C1C', tint: '#FEE2E2' },
        uk: { name: 'the UK', short: 'UK', icon: 'fa-crown', color: '#1D4ED8', tint: '#DBEAFE' },
        usa: { name: 'the USA', short: 'USA', icon: 'fa-flag-usa', color: '#0B1F3A', tint: '#E0E7F1' },
        'new-zealand': { name: 'New Zealand', icon: 'fa-mountain-sun', color: '#047857', tint: '#D1FAE5' },
    };
    const LEVELS = ["Bachelor's", "Master's", 'MBA'];
    const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
    const fmt = n => Number(n).toLocaleString('en-US');
    const initials = name => {
        const w = name.replace(/[()]/g, '').split(/\s+/).filter(x => x && !/^(of|the|and|at|in|for|&|-|–)$/i.test(x));
        return (w.length === 1 ? w[0].slice(0, 2) : w.slice(0, 2).map(x => x[0]).join('')).toUpperCase();
    };
    const profile = u => `${ROOT}universities/${encodeURIComponent(u.c)}/${encodeURIComponent(u.id)}.html`;

    function logo(u, size = 'h-12 w-12') {
        const m = COUNTRY[u.c] || COUNTRY.usa;
        const mono = `<span class="flex h-full w-full items-center justify-center text-sm font-extrabold" style="background:${m.tint};color:${m.color}">${esc(initials(u.n))}</span>`;
        if (!u.lg) return `<span class="flex ${size} shrink-0 overflow-hidden rounded-xl">${mono}</span>`;
        return `<span class="flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-1">
            <img src="${esc(u.lg)}" alt="${esc(u.n)} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" data-mono="${esc(initials(u.n))}" data-color="${m.color}" data-tint="${m.tint}">
        </span>`;
    }
    document.addEventListener('error', e => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || !img.dataset.mono) return;
        const box = img.parentElement;
        box.classList.remove('border', 'border-gray-100', 'bg-white', 'p-1');
        box.innerHTML = `<span class="flex h-full w-full items-center justify-center text-sm font-extrabold" style="background:${img.dataset.tint};color:${img.dataset.color}">${esc(img.dataset.mono)}</span>`;
    }, true);

    function stats(country) {
        const unis = (window.LGA_UNI_DIRECTORY || []).filter(u => country === 'all' || u.c === country);
        const levels = Object.fromEntries(LEVELS.map(l => [l, 0]));
        const fields = new Map();
        const cities = new Map();
        unis.forEach(u => {
            Object.entries(u.lv || {}).forEach(([l, n]) => { levels[l] = (levels[l] || 0) + n; });
            (u.tf || []).forEach(f => fields.set(f, (fields.get(f) || 0) + (u.cc || 1)));
            if (u.ci) cities.set(u.ci, (cities.get(u.ci) || 0) + 1);
        });
        const courses = Object.values(levels).reduce((a, b) => a + b, 0);
        return {
            unis, courses, levels,
            fields: [...fields].sort((a, b) => b[1] - a[1]).map(([f]) => f),
            cities: [...cities].sort((a, b) => b[1] - a[1]).map(([c]) => c),
        };
    }

    function counts() {
        document.querySelectorAll('[data-uni-count]').forEach(el => { el.textContent = fmt(stats(el.dataset.uniCount).unis.length); });
        document.querySelectorAll('[data-course-count]').forEach(el => { el.textContent = fmt(stats(el.dataset.courseCount).courses); });
    }

    function showcase(el) {
        const key = el.dataset.lgaShowcase;
        const m = COUNTRY[key];
        const s = stats(key);
        if (!m || !s.unis.length) { el.remove(); return; }
        const featured = [...s.unis].sort((a, b) => (b.cur - a.cur) || (b.cc - a.cc) || a.n.localeCompare(b.n)).slice(0, 8);
        const hasCourses = s.courses > 0;
        el.innerHTML = `
        <section class="bg-[#F5F6F8] py-16 md:py-20" aria-labelledby="showcase-${esc(key)}">
            <div class="container mx-auto max-w-7xl px-4 sm:px-6">
                <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-widest text-[#A9813F]">Explore our catalogue</p>
                        <h2 id="showcase-${esc(key)}" class="text-3xl font-extrabold text-[#0B1F3A] md:text-4xl">Courses &amp; universities in ${esc(m.name)}</h2>
                        <p class="mt-2 max-w-2xl text-gray-600">${hasCourses ? `${fmt(s.courses)} bachelor's, master's and MBA courses at ${fmt(s.unis.length)} institutions` : `${fmt(s.unis.length)} institutions`} — with program overviews, upcoming intakes and campus details.</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${hasCourses ? `<a href="${ROOT}courses.html?country=${encodeURIComponent(key)}" class="inline-flex items-center gap-2 rounded-full bg-[#0B1F3A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#16305A]"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>Find courses</a>` : ''}
                        <a href="${ROOT}universities/${encodeURIComponent(key)}.html" class="inline-flex items-center gap-2 rounded-full border border-[#0B1F3A] px-6 py-3 text-sm font-bold text-[#0B1F3A] transition hover:bg-[#0B1F3A] hover:text-white">All universities</a>
                    </div>
                </div>

                ${hasCourses ? `<div class="mb-8 grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
                    ${LEVELS.map(l => `<a href="${ROOT}courses.html?country=${encodeURIComponent(key)}&amp;level=${encodeURIComponent(l)}" class="group rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-[#C9A45C]/60 hover:shadow-md">
                        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">${esc(l)}</p>
                        <p class="mt-1 text-3xl font-extrabold text-[#0B1F3A]">${fmt(s.levels[l] || 0)}</p>
                        <p class="mt-1 text-xs font-semibold text-[#8A6A32] group-hover:underline">Browse courses →</p>
                    </a>`).join('')}
                    <div class="rounded-2xl border border-gray-100 bg-white p-5">
                        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Popular fields</p>
                        <ul class="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
                            ${s.fields.slice(0, 6).map(f => `<li><a href="${ROOT}courses.html?country=${encodeURIComponent(key)}&amp;field=${encodeURIComponent(f)}" class="font-semibold text-[#0B1F3A] underline decoration-[#C9A45C]/40 underline-offset-4 hover:text-[#8A6A32]">${esc(f)}</a></li>`).join('')}
                        </ul>
                    </div>
                </div>` : ''}

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    ${featured.map(u => `<a href="${profile(u)}" class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#C9A45C]/60 hover:shadow-md">
                        ${logo(u)}
                        <span class="min-w-0"><span class="block truncate text-sm font-bold text-[#0B1F3A]">${esc(u.n)}</span><span class="block truncate text-xs text-gray-500">${esc(u.ci || '')}${u.cc ? ` · ${u.cc} courses` : ''}</span></span>
                    </a>`).join('')}
                </div>
                ${s.cities.length ? `<p class="mt-6 text-sm text-gray-500">Study cities include <span class="font-semibold text-gray-700">${s.cities.slice(0, 8).map(esc).join(', ')}</span>.</p>` : ''}
            </div>
        </section>`;
    }

    function uniSearch(el) {
        const all = window.LGA_UNI_DIRECTORY || [];
        el.innerHTML = `
            <label class="relative block"><span class="sr-only">Search all universities</span>
                <i class="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                <input type="search" autocomplete="off" placeholder="Search ${fmt(all.length)} universities and colleges by name or city" class="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-[15px] shadow-sm outline-none focus:border-[#C9A45C] focus:ring-2 focus:ring-[#C9A45C]/20">
            </label>
            <div class="mt-3 grid gap-2 sm:grid-cols-2" data-results aria-live="polite"></div>`;
        const input = el.querySelector('input');
        const out = el.querySelector('[data-results]');
        input.addEventListener('input', () => {
            const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
            if (!terms.length) { out.innerHTML = ''; return; }
            const hits = all.filter(u => terms.every(t => `${u.n} ${u.ci} ${u.p} ${COUNTRY[u.c]?.short || COUNTRY[u.c]?.name || ''}`.toLowerCase().includes(t)))
                .sort((a, b) => b.cc - a.cc).slice(0, 10);
            out.innerHTML = hits.length ? hits.map(u => `<a href="${profile(u)}" class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition hover:border-[#C9A45C]/60 hover:shadow-md">
                ${logo(u, 'h-10 w-10')}
                <span class="min-w-0"><span class="block truncate text-sm font-bold text-[#0B1F3A]">${esc(u.n)}</span><span class="block truncate text-xs text-gray-500">${esc([u.ci, (COUNTRY[u.c]?.short || COUNTRY[u.c]?.name || '')].filter(Boolean).join(', '))}${u.cc ? ` · ${u.cc} courses` : ''}</span></span>
            </a>`).join('') : '<p class="col-span-full rounded-2xl bg-white p-4 text-sm text-gray-500">No institutions found — try another name or city.</p>';
        });
    }

    function init() {
        if (!window.LGA_UNI_DIRECTORY) return;
        counts();
        document.querySelectorAll('[data-lga-showcase]').forEach(showcase);
        document.querySelectorAll('[data-lga-uni-search]').forEach(uniSearch);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
