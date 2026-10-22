/**
 * Phase 7: Regenerate sitemap.xml (+ .gz) from the full URL inventory.
 *
 * Sources:
 *  - All hand-authored static HTML pages (with per-page priority/changefreq)
 *  - Generated blog pages   (resources/blog/*.html)   — lastmod from post date
 *  - Generated university pages (universities/<country>/*.html)
 *
 * Excludes: legacy ?id= templates (post.html, university.html), sitemap.html.
 * Usage: node scripts/generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';

/** Static pages: path → { priority, changefreq, lastmod } */
const STATIC_PAGES = [
  ['/', '1.00', 'weekly', '2026-10-22'],
  ['/services/student-visa.html', '0.90', 'weekly', '2026-10-22'],
  ['/services/ielts-pte.html', '0.80', 'monthly', '2026-10-22'],
  ['/study-abroad/', '0.90', 'weekly', '2026-10-22'],
  ['/study-abroad/australia.html', '0.85', 'monthly', '2026-10-22'],
  ['/study-abroad/canada.html', '0.85', 'monthly', '2026-10-22'],
  ['/study-abroad/uk.html', '0.85', 'monthly', '2026-10-22'],
  ['/study-abroad/new-zealand.html', '0.85', 'monthly', '2026-10-22'],
  ['/study-abroad/usa.html', '0.85', 'monthly', '2026-10-22'],
  ['/universities/', '0.85', 'weekly', '2026-10-22'],
  ['/universities/australia.html', '0.70', 'monthly', '2026-10-22'],
  ['/universities/canada.html', '0.70', 'monthly', '2026-10-22'],
  ['/universities/uk.html', '0.70', 'monthly', '2026-10-22'],
  ['/universities/new-zealand.html', '0.70', 'monthly', '2026-10-22'],
  ['/universities/usa.html', '0.70', 'monthly', '2026-10-22'],
  ['/resources/blog.html', '0.70', 'weekly', '2026-10-22'],
  ['/resources/faq.html', '0.70', 'monthly', '2026-10-22'],
  ['/about/', '0.70', 'monthly', '2026-10-22'],
  ['/about/mission-vision.html', '0.60', 'yearly', '2026-10-22'],
  ['/about/why-choose-us.html', '0.70', 'monthly', '2026-10-22'],
  ['/about/testimonials.html', '0.70', 'monthly', '2026-10-22'],
  ['/contact.html', '0.80', 'monthly', '2026-10-22'],
];

/* Load data for generated pages */
function loadData(rel, exportsList) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return new Function(`${src}\nreturn { ${exportsList.join(', ')} };`)();
}
const { LGA_BLOG_POSTS } = loadData('assets/js/data/blog.js', ['LGA_BLOG_POSTS']);
const { LGA_UNIVERSITIES } = loadData('assets/js/data/universities.js', ['LGA_UNIVERSITIES']);

const urls = [...STATIC_PAGES.map(([loc, priority, changefreq, lastmod]) => ({ loc, priority, changefreq, lastmod }))];

for (const p of LGA_BLOG_POSTS) {
  urls.push({ loc: `/resources/blog/${p.id}.html`, priority: '0.70', changefreq: 'monthly', lastmod: p.date });
}
for (const u of LGA_UNIVERSITIES) {
  urls.push({ loc: `/universities/${u.country}/${u.id}.html`, priority: '0.60', changefreq: 'monthly', lastmod: '2026-10-22' });
}

/* Guard: every generated file must exist on disk */
let missing = 0;
for (const { loc } of urls) {
  const file = loc === '/' ? 'index.html' : loc.replace(/^\//, '').replace(/\/$/, '/index.html');
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`MISSING FILE for sitemap entry: ${loc} → ${file}`);
    missing++;
  }
}
if (missing) {
  console.error(`\nAborting: ${missing} sitemap entries have no backing file.`);
  process.exit(1);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `<url>
  <loc>${SITE}${u.loc}</loc>
  <lastmod>${u.lastmod}</lastmod>
  <changefreq>${u.changefreq}</changefreq>
  <priority>${u.priority}</priority>
</url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml.gz'), zlib.gzipSync(xml));
console.log(`✓ sitemap.xml + sitemap.xml.gz regenerated with ${urls.length} URLs.`);

/* ----------------------------------------------------- sitemap.html (human) */
const LINKS = [
  ['Home', '/', 1],
  ['Student Visa Services', '/services/student-visa.html', 2],
  ['IELTS / PTE Preparation', '/services/ielts-pte.html', 2],
  ['Study Abroad Destinations', '/study-abroad/', 2],
  ['Study in Australia', '/study-abroad/australia.html', 3],
  ['Study in Canada', '/study-abroad/canada.html', 3],
  ['Study in the UK', '/study-abroad/uk.html', 3],
  ['Study in New Zealand', '/study-abroad/new-zealand.html', 3],
  ['Study in the USA', '/study-abroad/usa.html', 3],
  ['Universities Directory', '/universities/', 2],
  ['Universities in Australia', '/universities/australia.html', 3],
  ['Universities in Canada', '/universities/canada.html', 3],
  ['Universities in the UK', '/universities/uk.html', 3],
  ['Universities in New Zealand', '/universities/new-zealand.html', 3],
  ['Universities in the USA', '/universities/usa.html', 3],
  ['Blog & Guides', '/resources/blog.html', 2],
  ['Student Visa FAQ', '/resources/faq.html', 2],
  ['About Us', '/about/', 2],
  ['Mission & Vision', '/about/mission-vision.html', 3],
  ['Why Choose Us', '/about/why-choose-us.html', 3],
  ['Testimonials', '/about/testimonials.html', 3],
  ['Contact', '/contact.html', 2],
];

const items = LINKS.map(([label, loc, depth]) => {
  const indent = '  '.repeat(depth - 1);
  return `${indent}<li><a href="${loc}">${label}</a></li>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Site Map | Lanka Global Access</title>
    <meta name="description" content="Complete list of Lanka Global Access pages — student visa services, study abroad destinations, universities, guides and resources." />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="https://www.lgavisa.com/sitemap.html" />
    <link rel="shortcut icon" href="images/ico/favicon.ico" />
    <link rel="stylesheet" href="assets/css/site.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap" rel="stylesheet">
    <script src="assets/js/analytics.js"></script>
</head>
<body class="pt-[88px]">
    <div id="site-header"></div>

    <section class="page-hero text-center">
        <div class="container mx-auto px-6">
            <h1 class="text-4xl md:text-5xl font-bold mb-4">Site Map</h1>
            <p class="text-lg opacity-90 max-w-2xl mx-auto mb-6">Every page on www.lgavisa.com — ${urls.length + 1} pages. Last updated 22 October 2026.</p>
            <nav class="breadcrumb"><a href="index.html">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i> Site Map</nav>
        </div>
    </section>

    <section class="py-20 bg-white">
        <div class="container mx-auto px-6 max-w-3xl">
            <ul class="space-y-2 text-gray-700">
${items}
            </ul>
        </div>
    </section>

    <div id="site-footer"></div>
    <script>window.SITE_ROOT = './';</script>
    <script src="assets/js/components.js?v=12"></script>
    <script src="assets/js/site.js?v=3"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.html'), html);
console.log('✓ sitemap.html regenerated.');
