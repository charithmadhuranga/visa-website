/* Lanka Global Access — blog post renderer (post.html?id=slug)
 * Requires: assets/js/data/blog.js loaded first.
 * Target: <div id="post-detail">
 */

(function () {
    window.renderBlogPost = function () {
        const mount = document.getElementById('post-detail');
        if (!mount || typeof LGA_BLOG_POSTS === 'undefined') return;

        const id = new URLSearchParams(window.location.search).get('id');
        const post = lgaPostById(id);

        if (!post) {
            mount.innerHTML = `
            <div class="text-center py-24">
                <i class="fas fa-file-circle-question text-6xl text-blue-300 mb-6"></i>
                <h2 class="font-display text-3xl font-bold text-gray-800 mb-4">Article Not Found</h2>
                <p class="text-gray-600 mb-8">This article may have been moved or removed.</p>
                <a href="blog.html" class="btn-primary">Back to Blog</a>
            </div>`;
            document.title = 'Article Not Found | Lanka Global Access';
            return;
        }

        document.title = `${post.title} | Lanka Global Access Blog`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', post.excerpt);

        const recent = [...LGA_BLOG_POSTS].filter(p => p.id !== post.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

        mount.innerHTML = `
        <!-- Post Hero -->
        <section class="page-hero">
            <div class="container mx-auto px-6 max-w-4xl" data-aos="fade-up">
                <nav class="breadcrumb mb-6">
                    <a href="../index.html">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
                    <a href="blog.html">Blog</a> <i class="fas fa-chevron-right text-xs mx-2"></i> ${post.category}
                </nav>
                <span class="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">${post.category}</span>
                <h1 class="font-display text-3xl md:text-4xl font-bold leading-tight mb-5">${post.title}</h1>
                <div class="flex flex-wrap gap-5 opacity-85 text-sm">
                    <span><i class="far fa-calendar mr-2"></i>${lgaFormatDate(post.date)}</span>
                    <span><i class="far fa-user mr-2"></i>${post.author}</span>
                    <span><i class="far fa-clock mr-2"></i>${post.readTime} read</span>
                </div>
            </div>
        </section>

        <section class="py-16 bg-white">
            <div class="container mx-auto px-6 max-w-6xl grid lg:grid-cols-3 gap-12">
                <article class="lg:col-span-2 prose prose-blue max-w-none
                    [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-8 [&_h3]:mb-3
                    [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-gray-600 [&_ul]:space-y-2 [&_ul]:mb-4
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-gray-600 [&_ol]:space-y-2 [&_ol]:mb-4
                    [&_strong]:text-gray-800">
                    ${post.content}
                </article>

                <aside class="space-y-8">
                    <div class="rounded-2xl p-7 text-white" style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
                        <h3 class="font-bold text-lg mb-2">Need Help Applying?</h3>
                        <p class="text-sm opacity-90 mb-4">Free counselling for study abroad and visa services.</p>
                        <a href="../contact.html" class="block text-center bg-white text-blue-700 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all">Book Consultation</a>
                    </div>

                    <div class="bg-gray-50 rounded-2xl shadow-md p-7">
                        <h3 class="font-bold text-gray-800 mb-4">Recent Articles</h3>
                        <div class="space-y-4">
                            ${recent.map(p => `
                            <a href="post.html?id=${p.id}" class="block group">
                                <div class="text-xs text-gray-400 mb-0.5"><i class="far fa-calendar mr-1"></i>${lgaFormatDate(p.date)}</div>
                                <div class="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors leading-snug">${p.title}</div>
                            </a>`).join('')}
                        </div>
                        <a href="blog.html" class="block text-center text-blue-600 text-sm font-medium mt-5 hover:underline">← All articles</a>
                    </div>
                </aside>
            </div>
        </section>`;
    };
})();
