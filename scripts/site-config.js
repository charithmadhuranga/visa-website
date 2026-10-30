/* Lanka Global Access — single source of truth for site-wide contact details.
 * ──────────────────────────────────────────────────────────────────────────
 * The phone number used to be hardcoded in five separate files, and the
 * structured-data script silently reverted it to the old value if re-run.
 * It is now declared exactly once, in PHONE_LOCAL below.
 *
 * To change the number:
 *   1. Edit PHONE_LOCAL below.
 *   2. Run:  npm run build
 *      (sync-contact.js propagates it into every page and script, and the
 *       SEO validator then confirms the site is still clean.)
 */
'use strict';

const PHONE_LOCAL = '0717225223'; // Sri Lanka local format: 07X XXX XXXX
const DIAL_CODE = '94';

// ── Derived formats — do not edit by hand ─────────────────────────────────
const national = PHONE_LOCAL.replace(/^0/, ''); // e.g. 7XXXXXXXX
const e164 = '+' + DIAL_CODE + national; //        e.g. +947XXXXXXXX

module.exports = {
    PHONE_LOCAL,
    PHONE_E164: e164,
    // "+94 XX XXX XXXX" — grouped for display; matches what the contact
    // form's own phone formatter produces, so input and display agree.
    PHONE_DISPLAY:
        '+94 ' + national.slice(0, 2) + ' ' + national.slice(2, 5) + ' ' + national.slice(5),
    PHONE_TEL_HREF: 'tel:' + e164,
    WHATSAPP_DIGITS: DIAL_CODE + national, //       e.g. 947XXXXXXXX
    WHATSAPP_URL:
        'https://wa.me/' +
        DIAL_CODE +
        national +
        '?text=Hi%20LankaGlobalAccess%2C%20I%20have%20a%20question%20about%20your%20Visa',
};
