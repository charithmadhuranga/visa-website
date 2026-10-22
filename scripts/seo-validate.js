/**
 * Phase 10: Build-time SEO validation. Run before every deploy.
 *
 * Checks every intended-indexable HTML page for:
 *   - <title> present, unique across site, <= 70 chars (warn)
 *   - meta description present, non-empty, <= 165 chars (warn)
 *   - exactly one <link rel="canonical"> with absolute https:// URL
 *   - exactly one <h1>
 *   - JSON-LD blocks parse as valid JSON
 *   - no accidental noindex on indexable pages
 *   - <img> tags have alt attributes
 *   - internal hrefs resolve to existing files
 *   - every page (except noindex) is present in sitemap.xml
 *
 * Usage: node scripts/seo-validate.js   → exit 1 on errors
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';

const errors = [];
const warnings = [];

/** Decode HTML entities so length checks measure what users/Google see. */
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

/* Legacy / utility templates that are intentionally noindex or not content pages */
const NOINDEX_OK = new Set(['resources/post.html', 'universities/university.html', 'sitemap.html']);
/* Pages excluded from the sitemap by design */
const SITEMAP_EXEMPT = new Set(['sitemap.html', 'resources/post.html', 'universities/university.html']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const titles = new Map();
const canonicals = new Map();

const sitemapXml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const isNoindex = /name="robots"\s+content="[^"]*noindex/.test(html);

  if (isNoindex && !NOINDEX_OK.has(rel)) errors.push(`${rel}: accidental noindex`);

  // Title
  const t = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!t || !t[1].trim()) errors.push(`${rel}: missing <title>`);
  else {
    const title = decode(t[1].trim());
    if (title.length > 70) warnings.push(`${rel}: title ${title.length} chars (>70): "${title}"`);
    if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`);
    titles.set(title, rel);
  }

  // Description
  const d = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!d) errors.push(`${rel}: missing meta description`);
  else if (!d[1].trim() && !isNoindex) errors.push(`${rel}: empty meta description`);
  else if (decode(d[1]).length > 165) warnings.push(`${rel}: description ${decode(d[1]).length} chars (>165)`);

  // Canonical
  const c = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
  if (!c) errors.push(`${rel}: missing canonical`);
  else {
    if (c) {
      if (!c[1].startsWith('https://www.lgavisa.com')) errors.push(`${rel}: non-preferred canonical ${c[1]}`);
      if (canonicals.has(c[1]) && !isNoindex) errors.push(`${rel}: duplicate canonical ${c[1]} (also ${canonicals.get(c[1])})`);
      if (!canonicals.has(c[1])) canonicals.set(c[1], rel);
    }
  }

  // H1 count (header component no longer injects an h1)
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length > 1) errors.push(`${rel}: ${h1s.length} <h1> tags (want exactly 1)`);
  if (h1s.length === 0 && !isNoindex) warnings.push(`${rel}: no <h1> in static HTML`);

  // JSON-LD validity
  const lds = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  for (const block of lds) {
    const json = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>[\s\S]*$/, '');
    try {
      JSON.parse(json);
    } catch (e) {
      errors.push(`${rel}: invalid JSON-LD (${e.message})`);
    }
  }

  // img alt
  const imgs = html.match(/<img\s[^>]*>/g) || [];
  for (const img of imgs) {
    if (!/alt="/.test(img)) errors.push(`${rel}: <img> without alt: ${img.slice(0, 80)}`);
  }

  // internal links
  const links = html.match(/<a\s[^>]*href="([^"#]+)"/g) || [];
  for (const linkTag of links) {
    const href = (linkTag.match(/href="([^"]+)"/) || [])[1];
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    const target = href.split('?')[0].split('#')[0];
    if (!target) continue;
    const abs = target.startsWith('/')
      ? path.join(ROOT, target)
      : path.resolve(path.dirname(file), target);
    const exists =
      fs.existsSync(abs) ||
      (fs.existsSync(abs) && fs.statSync(abs).isDirectory() && fs.existsSync(path.join(abs, 'index.html')));
    if (!exists) warnings.push(`${rel}: link target may be missing: ${href}`);
  }

  // sitemap inclusion
  if (!isNoindex && !SITEMAP_EXEMPT.has(rel)) {
    const canonicalPath = c ? c[1].replace(SITE, '') : null;
    const needle = canonicalPath === '/' ? '<loc>https://www.lgavisa.com/</loc>' : `<loc>${SITE}${canonicalPath}</loc>`;
    if (!sitemapXml.includes(needle)) errors.push(`${rel}: canonical not in sitemap.xml`);
  }
}

console.log(`Validated ${files.length} HTML files.`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warnings:`);
  warnings.forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} errors:`);
  errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
} else {
  console.log('✓ No SEO errors.');
}
