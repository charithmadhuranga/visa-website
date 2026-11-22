/**
 * Phase 6: Build-time static page generator + sitemap generator.
 *
 * Reads the browser-global data files:
 *   assets/js/data/blog.js         → LGA_BLOG_POSTS
 *   assets/js/data/universities.js → LGA_COUNTRIES, LGA_UNIVERSITIES
 *
 * Generates crawlable static HTML pages (unique title/description/canonical/
 * OG/JSON-LD/content) at:
 *   resources/blog/<slug>.html
 *   universities/<country>/<slug>.html
 *
 * Also regenerates sitemap.xml (with accurate lastmod) and sitemap.xml.gz.
 * Fails the build on duplicate slugs or missing required metadata.
 *
 * Usage: node scripts/generate-seo-pages.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';
const SITE_NAME = 'LGA Visa';
const OG_IMAGE = `${SITE}/images/og/lga-og.png`;

/* ---------------------------------------------------------------- load data */
function loadData(rel, exportsList) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const fn = new Function(`${src}\nreturn { ${exportsList.join(', ')} };`);
  return fn();
}

const { LGA_BLOG_POSTS } = loadData('assets/js/data/blog.js', ['LGA_BLOG_POSTS']);
const { LGA_COUNTRIES, LGA_UNIVERSITIES } = loadData('assets/js/data/universities.js', [
  'LGA_COUNTRIES',
  'LGA_UNIVERSITIES',
]);

/* --------------------------------------------------------------- utilities */
const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const slugOk = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

function validate(records, kind, titleField) {
  const errors = [];
  const seen = new Set();
  for (const r of records) {
    if (!r.id) errors.push(`${kind}: record missing id`);
    else if (!slugOk(r.id)) errors.push(`${kind}: invalid slug "${r.id}"`);
    if (r.id && seen.has(r.id)) errors.push(`${kind}: duplicate slug "${r.id}"`);
    seen.add(r.id);
    if (!r[titleField]) errors.push(`${kind}: ${r.id} missing ${titleField}`);
    if (!r.excerpt && !r.about) errors.push(`${kind}: ${r.id} missing excerpt/about`);
    if (r[titleField] && r[titleField].length > 70) console.warn(`  ! review long title: ${r.id}`);
  }
  return errors;
}

const problems = [
  ...validate(LGA_BLOG_POSTS, 'blog', 'title'),
  ...validate(LGA_UNIVERSITIES, 'university', 'name'),
];
if (problems.length) {
  console.error('VALIDATION FAILED — build aborted:');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}

/* ----------------------------------------------------------- shared blocks */
function headBlock({ title, description, keywords, canonicalPath, ogType = 'website' }) {
  const canonical = `${SITE}${canonicalPath}`;
  return `    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="keywords" content="${esc(keywords)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />

    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:locale" content="en_LK" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />`;
}

function ldBlock(graph) {
  const json = JSON.stringify(graph, null, 2).replace(/<\//g, '<\\/');
  return `    <script type="application/ld+json">\n${json}\n    </script>`;
}

const pageShell = ({ head, ld, body, siteRoot }) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${head}

    <link rel="shortcut icon" href="${siteRoot}images/ico/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="${siteRoot}images/ico/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="${siteRoot}images/ico/favicon-48x48.png">
    <link rel="apple-touch-icon" sizes="180x180" href="${siteRoot}images/ico/apple-touch-icon.png">

    <link rel="stylesheet" href="${siteRoot}assets/css/site.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="${siteRoot}assets/js/analytics.js"></script>
${ld}
</head>

<body class="pt-[88px]">
    <div id="site-header"></div>
${body}

    <div id="site-footer"></div>

    <script>window.SITE_ROOT = '${siteRoot}';</script>
    <script src="${siteRoot}assets/js/components.js?v=12"></script>
    <script src="${siteRoot}assets/js/site.js?v=3"></script>
    <script>if (typeof AOS !== 'undefined') AOS.init();</script>
</body>
</html>
`;

/* ------------------------------------------------------------ blog pages */
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return iso; }
};

function generateBlogPages() {
  const outDir = path.join(ROOT, 'resources', 'blog');
  fs.mkdirSync(outDir, { recursive: true });
  const urls = [];

  for (const post of LGA_BLOG_POSTS) {
    const canonicalPath = `/resources/blog/${post.id}.html`;
    let title = `${post.title} | LGA Visa Blog`;
    if (title.length > 70) title = post.title;
    const description = stripTags(post.excerpt).slice(0, 155);
    const related = LGA_BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

    const graph = [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/resources/blog.html` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}${canonicalPath}` },
        ],
      },
      {
        '@type': 'Article',
        headline: post.title,
        description,
        image: OG_IMAGE,
        datePublished: post.date,
        dateModified: post.modified || post.date,
        inLanguage: 'en',
        author: { '@type': 'Person', name: post.author },
        publisher: { '@id': `${SITE}/#organization` },
        mainEntityOfPage: `${SITE}${canonicalPath}`,
      },
    ];

    const body = `
    <section class="page-hero text-center">
        <div class="container mx-auto px-6 max-w-4xl" data-aos="fade-up">
            <span class="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">${esc(post.category)}</span>
            <h1 class="text-3xl md:text-4xl font-bold mb-5">${esc(post.title)}</h1>
            <div class="flex flex-wrap justify-center gap-5 opacity-85 text-sm mb-6">
                <span><i class="far fa-calendar mr-2"></i>${fmtDate(post.date)}</span>
                <span><i class="far fa-user mr-2"></i>${esc(post.author)}</span>
                <span><i class="far fa-clock mr-2"></i>${esc(post.readTime)} read</span>
            </div>
            <nav class="breadcrumb">
                <a href="../../index.html">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
                <a href="../blog.html">Blog</a> <i class="fas fa-chevron-right text-xs mx-2"></i> ${esc(post.category)}
            </nav>
        </div>
    </section>

    <section class="py-16 bg-white">
        <div class="container mx-auto px-6 max-w-6xl grid lg:grid-cols-3 gap-12">
            <article class="lg:col-span-2 prose prose-blue max-w-none
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-8 [&_h3]:mb-3
                [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-gray-600 [&_ul]:space-y-2 [&_ul]:mb-4
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-gray-600 [&_ol]:space-y-2 [&_ol]:mb-4
                [&_strong]:text-gray-800">
                ${post.content}
                <p class="text-xs text-gray-400 mt-10">Last reviewed: ${fmtDate(post.modified || post.date)}. Rules and requirements change — confirm current details on official government websites.</p>
            </article>

            <aside class="space-y-8">
                <div class="rounded-2xl p-7 text-white" style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
                    <h2 class="font-bold text-lg mb-2">Need Help Applying?</h2>
                    <p class="text-sm opacity-90 mb-4">Free counselling for study abroad and student visa services in Sri Lanka.</p>
                    <a href="../../contact.html" class="block text-center bg-white text-[#C9A45C] py-2.5 rounded-full font-semibold hover:shadow-lg transition-all">Book Consultation</a>
                </div>

                <div class="bg-gray-50 rounded-2xl shadow-md p-7">
                    <h2 class="font-bold text-gray-800 mb-4">More Guides</h2>
                    <div class="space-y-4">
                        ${related.map((p) => `
                        <a href="${p.id}.html" class="block group">
                            <div class="text-xs text-gray-400 mb-0.5"><i class="far fa-calendar mr-1"></i>${fmtDate(p.date)}</div>
                            <div class="text-sm font-medium text-gray-700 group-hover:text-[#C9A45C] transition-colors leading-snug">${esc(p.title)}</div>
                        </a>`).join('')}
                    </div>
                    <a href="../blog.html" class="block text-center text-[#C9A45C] text-sm font-medium mt-5 hover:underline">&larr; All articles</a>
                </div>

                <div class="bg-white rounded-2xl shadow-md border border-gray-100 p-7">
                    <h2 class="font-bold text-gray-800 mb-4">Student Visa Services</h2>
                    <div class="space-y-3 text-sm">
                        <a href="../../services/student-visa.html" class="block text-gray-600 hover:text-[#C9A45C] transition-colors">Student Visa Assistance &rarr;</a>
                        <a href="../../study-abroad/australia.html" class="block text-gray-600 hover:text-[#C9A45C] transition-colors">Study in Australia &rarr;</a>
                        <a href="../../study-abroad/uk.html" class="block text-gray-600 hover:text-[#C9A45C] transition-colors">Study in the UK &rarr;</a>
                        <a href="../../study-abroad/canada.html" class="block text-gray-600 hover:text-[#C9A45C] transition-colors">Study in Canada &rarr;</a>
                    </div>
                </div>
            </aside>
        </div>
    </section>`;

    const html = pageShell({
      head: headBlock({ title, description, keywords: `${post.title}, study abroad Sri Lanka, student visa guide`, canonicalPath, ogType: 'article' }),
      ld: ldBlock(graph),
      body,
      siteRoot: '../../',
    });
    fs.writeFileSync(path.join(outDir, `${post.id}.html`), html);
    urls.push({ loc: canonicalPath, lastmod: post.modified || post.date, priority: '0.70', changefreq: 'monthly' });
    console.log(`  ✓ blog: ${canonicalPath}`);
  }
  return urls;
}

/* ----------------------------------------------------- university pages */
// University profiles are built from the course catalogue + curated data.
const { generateUniversityPages } = require('./generate-university-pages');

module.exports = { generateBlogPages, generateUniversityPages, SITE };

/* Run directly */
if (require.main === module) {
  console.log('Generating static SEO pages…');
  const urls = [...generateBlogPages(), ...generateUniversityPages()];
  fs.writeFileSync(path.join(__dirname, 'generated-urls.json'), JSON.stringify(urls, null, 2));
  console.log(`\nDone. ${urls.length} pages generated. Metadata list → scripts/generated-urls.json`);
}
