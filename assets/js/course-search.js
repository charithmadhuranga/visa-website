/* Course finder for the curated university catalogue. */
(function () {
    const FIELD_RULES = [
        ['Engineering & Technology', /\b(engineer|engineering|bioengineering)\b/i],
        ['Computing & Data', /\b(computer|computing|information technology|data science|cyber|software|artificial intelligence|machine learning|applied computing)\b/i],
        ['Health & Medicine', /\b(health|medicine|nurs|pharma|neuroscience|veterinary)\b/i],
        ['Science & Environment', /\b(science|environment|biology|chemistry|physics)\b/i],
        ['Arts, Design & Architecture', /\b(design|architecture|culinary arts)\b/i],
        ['Hospitality & Aviation', /\b(hospitality|aviation|pilot)\b/i],
        ['Social Sciences & Law', /\b(policy|law|relations|politics)\b/i],
        ['Business & Commerce', /\b(business|commerce|account|finance|econom|mba|marketing|banking|management)\b/i],
    ];

    const FIELD_ICONS = {
        'Engineering & Technology': 'fa-gears',
        'Computing & Data': 'fa-laptop-code',
        'Health & Medicine': 'fa-heart-pulse',
        'Science & Environment': 'fa-flask',
        'Arts, Design & Architecture': 'fa-palette',
        'Hospitality & Aviation': 'fa-plane',
        'Social Sciences & Law': 'fa-scale-balanced',
        'Business & Commerce': 'fa-briefcase',
        'Other': 'fa-graduation-cap',
    };

    function courseField(name) {
        const match = FIELD_RULES.find(([, pattern]) => pattern.test(name));
        return match ? match[0] : 'Other';
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        })[character]);
    }

    function initialize() {
        const grid = document.getElementById('course-grid');
        if (!grid) return;
        if (typeof LGA_UNIVERSITIES === 'undefined' || typeof LGA_COUNTRIES === 'undefined') {
            grid.innerHTML = '<p class="col-span-full rounded-2xl bg-white p-8 text-center text-red-700">The course catalogue could not be loaded. Please refresh the page or contact LGA Visa for assistance.</p>';
            document.getElementById('course-count').textContent = 'Catalogue unavailable';
            return;
        }

        const courses = LGA_UNIVERSITIES.flatMap(university =>
            university.courses.map(course => ({
                ...course,
                university,
                field: courseField(course.name),
            }))
        );

        const searchInput = document.getElementById('course-search');
        const fieldFilter = document.getElementById('course-field');
        const countryFilter = document.getElementById('course-country');
        const levelFilter = document.getElementById('course-level');
        const intakeFilter = document.getElementById('course-intake');
        const count = document.getElementById('course-count');
        const empty = document.getElementById('course-empty');

        const fields = [...new Set(courses.map(course => course.field))].sort();
        fields.forEach(field => fieldFilter.add(new Option(field, field)));

        Object.entries(LGA_COUNTRIES).forEach(([key, country]) => {
            countryFilter.add(new Option(country.name, key));
        });

        [...new Set(courses.map(course => course.level))].sort((a, b) => a.localeCompare(b))
            .forEach(level => levelFilter.add(new Option(level, level)));
        [...new Set(courses.flatMap(course => course.intakes || []))]
            .sort((a, b) => a.localeCompare(b))
            .forEach(intake => intakeFilter.add(new Option(intake, intake)));

        function render() {
            const query = searchInput.value.trim().toLocaleLowerCase();
            const selectedField = fieldFilter.value;
            const selectedCountry = countryFilter.value;
            const selectedLevel = levelFilter.value;
            const selectedIntake = intakeFilter.value;

            const filtered = courses.filter(course => {
                const searchable = [
                    course.name,
                    course.field,
                    course.university.name,
                    course.university.city,
                    LGA_COUNTRIES[course.university.country]?.name || course.university.country,
                ].join(' ').toLocaleLowerCase();

                return (!query || searchable.includes(query))
                    && (!selectedField || course.field === selectedField)
                    && (!selectedCountry || course.university.country === selectedCountry)
                    && (!selectedLevel || course.level === selectedLevel)
                    && (!selectedIntake || (course.intakes || []).includes(selectedIntake));
            });

            count.textContent = `${filtered.length} ${filtered.length === 1 ? 'course' : 'courses'} found`;
            empty.classList.toggle('hidden', filtered.length > 0);
            grid.classList.toggle('hidden', filtered.length === 0);

            grid.innerHTML = filtered.map(course => {
                const university = course.university;
                const country = LGA_COUNTRIES[university.country]?.name || university.country;
                const intakes = (course.intakes || []).map(intake =>
                    `<span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">${escapeHtml(intake)}</span>`
                ).join('');
                return `
                    <article class="group flex min-h-[260px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#C9A45C]/50 hover:shadow-lg">
                        <div class="mb-4 flex items-start justify-between gap-3">
                            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7F2E8] text-lg text-[#A9813F]"><i class="fas ${FIELD_ICONS[course.field] || FIELD_ICONS.Other}" aria-hidden="true"></i></span>
                            <span class="rounded-full bg-[#F5F6F8] px-3 py-1 text-xs font-semibold text-gray-600">${escapeHtml(course.field)}</span>
                        </div>
                        <h3 class="mb-2 text-lg font-bold leading-snug text-[#0B1F3A]">${escapeHtml(course.name)}</h3>
                        <p class="mb-4 text-sm text-gray-600">${escapeHtml(university.name)}</p>
                        <div class="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span><i class="fas fa-location-dot mr-1 text-[#A9813F]" aria-hidden="true"></i>${escapeHtml(university.city)}, ${escapeHtml(country)}</span>
                            <span><i class="fas fa-user-graduate mr-1 text-[#A9813F]" aria-hidden="true"></i>${escapeHtml(course.level)}</span>
                            <span><i class="fas fa-clock mr-1 text-[#A9813F]" aria-hidden="true"></i>${escapeHtml(course.duration)}</span>
                        </div>
                        ${intakes ? `<div class="mb-5 flex flex-wrap items-center gap-2"><span class="text-xs font-semibold text-gray-500">Listed intakes:</span>${intakes}</div>` : ''}
                        <a href="universities/${encodeURIComponent(university.country)}/${encodeURIComponent(university.id)}.html" class="mt-auto inline-flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-bold text-[#8A6A32] group-hover:text-[#0B1F3A]">
                            University details <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
                        </a>
                    </article>`;
            }).join('');
        }

        function clearFilters() {
            searchInput.value = '';
            fieldFilter.value = '';
            countryFilter.value = '';
            levelFilter.value = '';
            intakeFilter.value = '';
            render();
            searchInput.focus();
        }

        searchInput.addEventListener('input', render);
        [fieldFilter, countryFilter, levelFilter, intakeFilter].forEach(filter => filter.addEventListener('change', render));
        document.getElementById('clear-course-filters').addEventListener('click', clearFilters);
        document.getElementById('empty-clear-filters').addEventListener('click', clearFilters);
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
