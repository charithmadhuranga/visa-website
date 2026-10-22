/* Lanka Global Access — Google Analytics 4 (gtag.js)
 *
 * ─────────────────────────────────────────────────────────────
 *  TO ACTIVATE: replace MEASUREMENT_ID below with your GA4 ID.
 *  It looks like: G-XXXXXXXXXX  (find it in GA4 → Admin → Data Streams)
 *  While it is still the placeholder, this script does nothing —
 *  no errors, no requests, no broken tags.
 * ─────────────────────────────────────────────────────────────
 */
(function () {
    var MEASUREMENT_ID = 'G-VXYS903B91'; // <-- PUT YOUR GA4 MEASUREMENT ID HERE

    if (!/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) {
        // Still the placeholder (or invalid) — skip silently.
        return;
    }

    // Load gtag.js
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(s);

    // Initialise
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, { send_page_view: true });

    // Track outbound contact actions as conversions (uncomment to use):
    // document.addEventListener('click', function (e) {
    //     var a = e.target.closest && e.target.closest('a');
    //     if (!a) return;
    //     if (a.href && a.href.indexOf('wa.me') > -1) gtag('event', 'whatsapp_click');
    //     if (a.href && a.href.indexOf('tel:') === 0) gtag('event', 'phone_click');
    // });
})();
