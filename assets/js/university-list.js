/* Lanka Global Access — country university listing renderer
 * Requires: assets/js/data/universities.js loaded first.
 * Target element: <div id="university-grid">
 */

(function () {
    const COUNTRY_GRADIENTS = {
        australia: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)',
        canada: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
        uk: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
        'new-zealand': 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        usa: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
    };

    function uniCard(u) {
        return `
        <div class="bg-white rounded-2xl shadow-md card-hover overflow-hidden flex flex-col" data-aos="fade-up">
            <div class="h-2" style="background:${COUNTRY_GRADIENTS[u.country] || '#2563eb'}"></div>
            <div class="p-6 flex flex-col flex-1">
                <h3 class="text-lg font-bold text-gray-800 mb-2 leading-snug">${u.name}</h3>
                <div class="flex flex-wrap gap-2 text-xs mb-3">
                    <span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"><i class="fas fa-location-dot mr-1"></i>${u.city}</span>
                    <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"><i class="fas fa-building-columns mr-1"></i>${u.type}</span>
                </div>
                <p class="text-sm text-gray-500 mb-3"><i class="fas fa-ranking-star text-amber-500 mr-2"></i>${u.ranking}</p>
                <div class="text-xs text-gray-600 mt-auto">
                    <div class="bg-gray-50 rounded-lg p-2.5"><i class="fas fa-user-graduate text-blue-500 mr-1"></i>${u.students}</div>
                </div>
                <a href="university.html?id=${u.id}" class="mt-5 block text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-full font-medium hover:shadow-lg transition-all duration-300 text-sm">
                    View Details &amp; Courses
                </a>
            </div>
        </div>`;
    }

    window.renderUniversityCountryPage = function (countryKey) {
        const grid = document.getElementById('university-grid');
        if (!grid || typeof lgaUnisByCountry !== 'function') return;

        const unis = lgaUnisByCountry(countryKey);
        const count = document.getElementById('uni-count');
        if (count) count.textContent = unis.length;
        grid.innerHTML = unis.map(uniCard).join('');
    };
})();
