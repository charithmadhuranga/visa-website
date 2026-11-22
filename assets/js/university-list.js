/* Lanka Global Access — country university listing (universities/<country>.html)
 * Requires: assets/js/data/university-directory.js (window.LGA_UNI_DIRECTORY)
 * Renders a searchable, filterable grid of every institution in the country,
 * linking to its profile page and to its courses in the course finder.
 */
(function () {
    'use strict';

    const COUNTRY = {
        australia: { name: 'Australia', color: '#B45309', tint: '#FEF3C7' },
        canada: { name: 'Canada', color: '#B91C1C', tint: '#FEE2E2' },
        uk: { name: 'United Kingdom', color: '#1D4ED8', tint: '#DBEAFE' },
        usa: { name: 'USA', color: '#0B1F3A', tint: '#E0E7F1' },
        'new-zealand': { name: 'New Zealand', color: '#047857', tint: '#D1FAE5' },
    };
    const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
    const initials = name => {
        const w = name.replace(/[()]/g, '').split(/\s+/).filter(x => x && !/^(of|the|and|at|in|for|&|-|–)$/i.test(x));
        return (w.length === 1 ? w[0].slice(0, 2) : w.slice(0, 2).map(x => x[0]).join('')).toUpperCase();
    };

    function logo(u) {
        const m = COUNTRY[u.c] || COUNTRY.usa;
        const mono = `<span class="flex h-full w-full items-center justify-center text-base font-extrabold" style="background:${m.tint};color:${m.color}">${esc(initials(u.n))}</span>`;
        if (!u.lg) return `<span class="flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl">${mono}</span>`;
        return `<span class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5">
            <img src="${esc(u.lg)}" alt="${esc(u.n)} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" data-mono="${esc(initials(u.n))}" data-color="${m.color}" data-tint="${m.tint}">
        </span>`;
    }

    document.addEventListener('error', e => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || !img.dataset.mono) return;
        const box = img.parentElement;
        box.className = 'flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl';
        box.innerHTML = `<span class="flex h-full w-full items-center justify-center text-base font-extrabold" style="background:${img.dataset.tint};color:${img.dataset.color}">${esc(img.dataset.mono)}</span>`;
    }, true);

    function card(u) {
        const levels = Object.entries(u.lv || {}).map(([l, n]) => `${n} ${l}`).join(' · ');
        const facts = [u.t && u.cat ? `${u.t} ${u.cat.toLowerCase()}` : u.cat, u.f ? `Est. ${u.f}` : '', u.cp > 1 ? `${u.cp} campuses` : ''].filter(Boolean);
        return `
        <article class="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A45C]/50 hover:shadow-lg">
            <div class="mb-4 flex items-start gap-3">
                ${logo(u)}
                <div class="min-w-0 flex-1">
                    <h2 class="font-bold leading-snug text-[#0B1F3A]"><a href="${esc(u.c)}/${esc(u.id)}.html" class="hover:text-[#8A6A32] hover:underline">${esc(u.n)}</a></h2>
                    <p class="mt-0.5 truncate text-xs text-gray-500"><i class="fas fa-location-dot mr-1 text-[#A9813F]" aria-hidden="true"></i>${esc([u.ci, u.p].filter(Boolean).join(', '))}</p>
                </div>
            </div>
            ${facts.length ? `<p class="mb-2 text-xs font-semibold text-gray-600">${facts.map(esc).join(' · ')}</p>` : ''}
            ${u.rk ? `<p class="mb-2 text-xs text-gray-500"><i class="fas fa-ranking-star mr-1 text-amber-500" aria-hidden="true"></i>${esc(u.rk)}</p>` : ''}
            ${u.tf && u.tf.length ? `<p class="mb-3 text-xs text-gray-500">Strong in <span class="font-semibold text-gray-700">${u.tf.map(esc).join(', ')}</span></p>` : ''}
            <div class="mt-auto border-t border-gray-100 pt-4">
                <p class="mb-3 text-sm"><strong class="text-[#0B1F3A]">${u.cc || 0}</strong> <span class="text-gray-500">courses listed${levels ? ` <span class="text-gray-400">(${esc(levels)})</span>` : ''}</span></p>
                <div class="flex gap-2">
                    <a href="${esc(u.c)}/${esc(u.id)}.html" class="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-bold text-[#0B1F3A] transition hover:border-[#0B1F3A]">View profile</a>
                    ${u.cc && Object.keys(u.lv || {}).length ? `<a href="../courses.html?uni=${encodeURIComponent(u.id)}" class="flex-1 rounded-xl bg-[#0B1F3A] px-3 py-2 text-center text-sm font-bold text-white transition hover:bg-[#16305A]">Courses</a>` : ''}
                </div>
            </div>
        </article>`;
    }

    window.renderUniversityCountryPage = function (countryKey) {
        const grid = document.getElementById('university-grid');
        if (!grid) return;
        const all = (window.LGA_UNI_DIRECTORY || []).filter(u => u.c === countryKey);
        const count = document.getElementById('uni-count');
        if (count) count.textContent = all.length.toLocaleString('en-US');
        const search = document.getElementById('uni-search');
        const type = document.getElementById('uni-type');
        const sort = document.getElementById('uni-sort');
        const shown = document.getElementById('uni-shown');
        const more = document.getElementById('uni-more');
        let limit = 24;

        if (type) {
            [...new Set(all.map(u => u.cat).filter(Boolean))].sort().forEach(t => type.add(new Option(t, t)));
        }

        function render(reset) {
            if (reset) limit = 24;
            const terms = (search?.value || '').toLowerCase().split(/\s+/).filter(Boolean);
            const list = all.filter(u => {
                const hay = `${u.n} ${u.ci} ${u.p} ${(u.tf || []).join(' ')}`.toLowerCase();
                return (!type?.value || u.cat === type.value) && terms.every(t => hay.includes(t));
            });
            const by = sort?.value || 'courses';
            list.sort((a, b) => by === 'name' ? a.n.localeCompare(b.n)
                : by === 'founded' ? (Number(a.f) || 9999) - (Number(b.f) || 9999) || a.n.localeCompare(b.n)
                    : (b.cur - a.cur) || (b.cc - a.cc) || a.n.localeCompare(b.n));
            grid.innerHTML = list.slice(0, limit).map(card).join('') ||
                '<p class="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No institutions match your search.</p>';
            if (shown) shown.textContent = `${Math.min(limit, list.length)} of ${list.length} institutions`;
            if (more) more.classList.toggle('hidden', list.length <= limit);
        }
        search?.addEventListener('input', () => render(true));
        type?.addEventListener('change', () => render(true));
        sort?.addEventListener('change', () => render(true));
        more?.addEventListener('click', () => { limit += 24; render(false); });
        render(true);
    };
})();
