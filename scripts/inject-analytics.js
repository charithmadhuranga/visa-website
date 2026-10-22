/**
 * Inject the GA4 analytics snippet into every static HTML page's <head>,
 * using the correct relative path based on the file's depth.
 * Idempotent: skips pages that already reference analytics.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let added = 0;
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('assets/js/analytics.js')) continue; // already injected

  const rel = path.relative(ROOT, file);
  const depth = rel.split(path.sep).length - 1;
  const prefix = '../'.repeat(depth);
  const tag = `    <script src="${prefix}assets/js/analytics.js"></script>\n`;

  if (!/<\/head>/.test(html)) continue;
  html = html.replace(/(\s*)<\/head>/, `\n${tag}</head>`);
  fs.writeFileSync(file, html);
  added++;
  console.log(`✓ ${rel}`);
}
console.log(`\nInjected analytics snippet into ${added} files.`);
