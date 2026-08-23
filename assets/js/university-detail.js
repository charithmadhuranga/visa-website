/* Lanka Global Access — university detail renderer (university.html?id=slug)
 * Requires: assets/js/data/universities.js loaded first.
 * Target element: <div id="university-detail">
 */

(function () {
    function courseRow(c) {
        return `
        <tr class="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
            <td class="py-4 px-4 font-medium text-gray-800">${c.name}</td>
            <td class="py-4 px-4"><span class="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">${c.level}</span></td>
            <td class="py-4 px-4 text-gray-600 text-sm">${c.duration}</td>
            <td class="py-4 px-4 text-gray-600 text-sm">${c.intakes.join(' · ')}</td>
        </tr>`;
    }

    function relatedCard(u) {
        return `
        <a href="university.html?id=${u.id}" class="block p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
            <div class="font-semibold text-gray-800 text-sm leading-snug">${u.name}</div>
            <div class="text-xs text-gray-500 mt-1"><i class="fas fa-location-dot mr-1"></i>${u.city} · ${u.courses.length} courses</div>
        </a>`;
    }

    window.renderUniversityDetail = function () {
        const mount = document.getElementById('university-detail');
        if (!mount || typeof lgaUniById !== 'function') return;

        const id = new URLSearchParams(window.location.search).get('id');
        const uni = lgaUniById(id);

        if (!uni) {
            mount.innerHTML = `
            <div class="text-center py-24">
                <i class="fas fa-circle-question text-6xl text-blue-300 mb-6"></i>
                <h2 class="font-display text-3xl font-bold text-gray-800 mb-4">University Not Found</h2>
                <p class="text-gray-600 mb-8">The institution you're looking for isn't in our list yet.</p>
                <a href="index.html" class="btn-primary">Browse All Universities</a>
            </div>`;
            document.title = 'University Not Found | Lanka Global Access';
            return;
        }

        document.title = `${uni.name} — Courses & Details | Lanka Global Access`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', `${uni.name} (${uni.city}) — courses, intakes and admission details for international students.`);

        const countryMeta = LGA_COUNTRIES[uni.country] || { name: uni.country, icon: 'fa-globe' };
        const related = lgaUnisByCountry(uni.country).filter(u => u.id !== uni.id).slice(0, 4);

        mount.innerHTML = `
        <!-- Detail Hero -->
        <section class="page-hero">
            <div class="container mx-auto px-6" data-aos="fade-up">
                <figure class="relative max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl mb-8 bg-gradient-to-br from-blue-900 to-blue-700">
                    <img src="../images/universities/${uni.id}.jpg?v=2" alt="${uni.name} campus" width="1280" height="720" class="w-full h-64 md:h-96 object-cover" decoding="async" referrerpolicy="no-referrer" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src=this.src.split('?')[0]+'?r='+Date.now()}else{this.style.display='none'}">
                    <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 md:p-8">
                        <span class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full mb-2 border border-white/25"><i class="fas ${countryMeta.icon}"></i>${countryMeta.name}</span>
                        <h1 class="font-display text-2xl md:text-4xl font-bold text-white leading-snug drop-shadow">${uni.name}</h1>
                    </figcaption>
                </figure>
                <p class="text-center opacity-90 max-w-2xl mx-auto">${uni.ranking}</p>
                <nav class="breadcrumb text-center mt-5">
                    <a href="../index.html">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
                    <a href="index.html">Universities</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
                    <a href="${uni.country}.html">${countryMeta.name}</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
                    ${uni.name}
                </nav>
            </div>
        </section>

        <section class="py-16 bg-white">
            <div class="container mx-auto px-6 grid lg:grid-cols-3 gap-10">
                <!-- Main column -->
                <div class="lg:col-span-2">
                    <h2 class="font-display text-2xl font-bold text-gray-800 mb-4">About the Institution</h2>
                    <p class="text-gray-600 mb-10 leading-relaxed">${uni.about}</p>

                    <h2 class="font-display text-2xl font-bold text-gray-800 mb-6">Courses Offered</h2>
                    <div class="overflow-x-auto rounded-2xl border border-gray-100 shadow-md bg-white">
                        <table class="w-full text-left min-w-[640px]">
                            <thead>
                                <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <th class="py-4 px-4 font-semibold">Course</th>
                                    <th class="py-4 px-4 font-semibold">Level</th>
                                    <th class="py-4 px-4 font-semibold">Duration</th>
                                    <th class="py-4 px-4 font-semibold">Intakes</th>
                                </tr>
                            </thead>
                            <tbody>${uni.courses.map(courseRow).join('')}</tbody>
                        </table>
                    </div>

                    <div class="mt-8 p-6 bg-blue-50 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <p class="text-gray-700 text-sm"><i class="fas fa-circle-info text-blue-600 mr-2"></i>Ask us about scholarships and admission requirements for this university.</p>
                        <a href="../contact.html?interest=${encodeURIComponent(uni.name)}" class="btn-primary !py-3 !px-6 text-sm whitespace-nowrap self-start sm:self-auto">Apply via LGA</a>
                    </div>
                </div>

                <!-- Sidebar -->
                <aside class="space-y-6">
                    <div class="bg-gray-50 rounded-2xl shadow-md p-7">
                        <h3 class="font-bold text-gray-800 mb-5 flex items-center gap-2"><i class="fas fa-circle-info text-blue-600"></i>Quick Facts</h3>
                        <ul class="space-y-4 text-sm">
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-location-dot text-blue-500 w-5 mt-0.5"></i>${uni.city}, ${countryMeta.name}</li>
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-building-columns text-blue-500 w-5 mt-0.5"></i>${uni.type}</li>
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-calendar-days text-blue-500 w-5 mt-0.5"></i>Established ${uni.founded}</li>
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-user-graduate text-blue-500 w-5 mt-0.5"></i>${uni.students} students</li>
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-ranking-star text-amber-500 w-5 mt-0.5"></i>${uni.ranking}</li>
                            <li class="flex items-start gap-3 text-gray-600"><i class="fas fa-globe text-blue-500 w-5 mt-0.5"></i><a href="${uni.website}" target="_blank" rel="noopener" class="text-blue-600 hover:underline break-all">${uni.website.replace('https://', '')}</a></li>
                        </ul>
                    </div>

                    <div class="bg-white rounded-2xl shadow-md border border-gray-100 p-7">
                        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-diagram-project text-blue-600"></i>Also in ${countryMeta.name}</h3>
                        <div class="space-y-3">${related.map(relatedCard).join('')}</div>
                        <a href="${uni.country}.html" class="block text-center text-blue-600 text-sm font-medium mt-4 hover:underline">View all ${countryMeta.name} universities →</a>
                    </div>
                </aside>
            </div>
        </section>`;
    };
})();
