#!/usr/bin/env node
/* Propagates the phone number from scripts/site-config.js into every file
 * that displays or links it.
 *
 * Rather than tracking a hardcoded list of locations, it normalises the
 * three shapes the site actually uses, so a new occurrence added anywhere
 * is caught automatically:
 *
 *   +94 XX XXX XXXX     display text
 *   +94XXXXXXXXX        tel: href and JSON-LD "telephone" (E.164)
 *   wa.me/94XXXXXXXXX   WhatsApp link
 *
 * The three patterns are mutually exclusive, so replacement order cannot
 * affect the result. Idempotent: a second run changes nothing.
 *
 * scripts/ is deliberately skipped: the only live number there is the
 * imported PHONE_E164 in apply-structured-data.js, and skipping it stops
 * this script from rewriting its own documentation examples.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./site-config.js');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.opencode', 'scripts']);

const RULES = [
    [/\+94 \d{2} \d{3} \d{4}/g, C.PHONE_DISPLAY],
    [/\+94\d{9}/g, C.PHONE_E164],
    [/wa\.me\/94\d{9}/g, 'wa.me/' + C.WHATSAPP_DIGITS],
];

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(html|js|json|xml|txt)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const changed = [];
for (const file of walk(ROOT)) {
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    for (const [pattern, replacement] of RULES) after = after.replace(pattern, replacement);
    if (after !== before) {
        fs.writeFileSync(file, after, 'utf8');
        changed.push(path.relative(ROOT, file));
    }
}

if (changed.length) {
    console.log('Contact details synced into:');
    changed.forEach((f) => console.log('  - ' + f));
} else {
    console.log('Contact details already in sync.');
}
