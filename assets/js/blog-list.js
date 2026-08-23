/* Lanka Global Access — blog listing renderer
 * Requires: assets/js/data/blog.js loaded first.
 * Target: <div id="blog-grid">
 */

(function () {
    const CAT_STYLES = {
        'Visas':        ['bg-blue-100', 'text-blue-700'],
        'English Tests': ['bg-emerald-100', 'text-emerald-700'],
        'Applications': ['bg-purple-100', 'text-purple-700'],
        'Finances':     ['bg-amber-100', 'text-amber-700'],
        'Destinations': ['bg-rose-100', 'text-rose-700'],
    };

    window.renderBlogListing = function () {
        const grid = document.getElementById('blog-grid');
        if (!grid || typeof LGA_BLOG_POSTS === 'undefined') return;

        grid.innerHTML = [...LGA_BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date)).map((p, i) => {
            const [bg, fg] = CAT_STYLES[p.category] || ['bg-gray-100', 'text-gray-600'];
            return `
            <article class="bg-white rounded-2xl shadow-md card-hover overflow-hidden flex flex-col" data-aos="fade-up" data-aos-delay="${(i % 3) * 60}">
                <div class="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div class="p-7 flex flex-col flex-1">
                    <div class="flex items-center gap-3 text-xs mb-4">
                        <span class="${bg} ${fg} font-semibold px-3 py-1 rounded-full">${p.category}</span>
                        <span class="text-gray-400"><i class="far fa-calendar mr-1"></i>${lgaFormatDate(p.date)}</span>
                    </div>
                    <h2 class="text-lg font-bold text-gray-800 leading-snug mb-3">
                        <a href="post.html?id=${p.id}" class="hover:text-blue-600 transition-colors">${p.title}</a>
                    </h2>
                    <p class="text-sm text-gray-600 mb-5 flex-1">${p.excerpt}</p>
                    <div class="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4">
                        <span><i class="far fa-user mr-1"></i>${p.author}</span>
                        <span><i class="far fa-clock mr-1"></i>${p.readTime} read</span>
                    </div>
                    <a href="post.html?id=${p.id}" class="mt-4 block text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-full font-medium hover:shadow-lg transition-all duration-300 text-sm">Read Article</a>
                </div>
            </article>`;
        }).join('');
    };
})();
