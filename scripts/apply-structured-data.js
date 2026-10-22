/**
 * Phase 2: Inject JSON-LD structured data.
 *
 * - index.html      → Organization + LocalBusiness (EducationalOrganization)
 * - inner pages     → BreadcrumbList matching the visible breadcrumb
 * - resources/faq.html → FAQPage (generated from its <details> markup)
 *
 * Idempotent: replaces any previously injected <!-- LD:BEGIN --> block.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';

const ORG = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['LocalBusiness', 'EducationalOrganization'],
      '@id': `${SITE}/#organization`,
      name: 'Lanka Global Access',
      alternateName: 'LGA Visa',
      url: `${SITE}/`,
      logo: `${SITE}/images/og/lga-og.png`,
      image: `${SITE}/images/og/lga-og.png`,
      email: 'admin@lgavisa.com',
      telephone: '+94726338989',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '19A Thalapathpitiya Road',
        addressLocality: 'Nugegoda',
        addressRegion: 'Western Province',
        addressCountry: 'LK',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 6.8721, longitude: 79.8836 },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
        ],
        opens: '08:30',
        closes: '17:30',
      },
      areaServed: { '@type': 'Country', name: 'Sri Lanka' },
      // TODO: add verified social profile URLs to sameAs[] when available — do not invent.
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Lanka Global Access',
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en',
    },
  ],
};

/** Visible breadcrumb → JSON-LD per page (path relative to root). */
const BREADCRUMBS = {
  'index.html': [['Home', '/']],
  'services/student-visa.html': [['Home', '/'], ['Student Visa Services', '/services/student-visa.html']],
  'services/ielts-pte.html': [['Home', '/'], ['IELTS & PTE', '/services/ielts-pte.html']],
  'study-abroad/index.html': [['Home', '/'], ['Study Abroad', '/study-abroad/']],
  'study-abroad/australia.html': [['Home', '/'], ['Study Abroad', '/study-abroad/'], ['Australia', '/study-abroad/australia.html']],
  'study-abroad/canada.html': [['Home', '/'], ['Study Abroad', '/study-abroad/'], ['Canada', '/study-abroad/canada.html']],
  'study-abroad/uk.html': [['Home', '/'], ['Study Abroad', '/study-abroad/'], ['UK', '/study-abroad/uk.html']],
  'study-abroad/new-zealand.html': [['Home', '/'], ['Study Abroad', '/study-abroad/'], ['New Zealand', '/study-abroad/new-zealand.html']],
  'study-abroad/usa.html': [['Home', '/'], ['Study Abroad', '/study-abroad/'], ['USA', '/study-abroad/usa.html']],
  'universities/index.html': [['Home', '/'], ['Universities', '/universities/']],
  'universities/australia.html': [['Home', '/'], ['Universities', '/universities/'], ['Australia', '/universities/australia.html']],
  'universities/canada.html': [['Home', '/'], ['Universities', '/universities/'], ['Canada', '/universities/canada.html']],
  'universities/uk.html': [['Home', '/'], ['Universities', '/universities/'], ['UK', '/universities/uk.html']],
  'universities/new-zealand.html': [['Home', '/'], ['Universities', '/universities/'], ['New Zealand', '/universities/new-zealand.html']],
  'universities/usa.html': [['Home', '/'], ['Universities', '/universities/'], ['USA', '/universities/usa.html']],
  'resources/blog.html': [['Home', '/'], ['Blog', '/resources/blog.html']],
  'resources/faq.html': [['Home', '/'], ['FAQ', '/resources/faq.html']],
  'about/index.html': [['Home', '/'], ['About Us', '/about/']],
  'about/mission-vision.html': [['Home', '/'], ['About Us', '/about/'], ['Mission & Vision', '/about/mission-vision.html']],
  'about/why-choose-us.html': [['Home', '/'], ['About Us', '/about/'], ['Why Choose Us', '/about/why-choose-us.html']],
  'about/testimonials.html': [['Home', '/'], ['About Us', '/about/'], ['Testimonials', '/about/testimonials.html']],
  'contact.html': [['Home', '/'], ['Contact', '/contact.html']],
};

function breadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE}${url === '/' ? '/' : url}`,
    })),
  };
}

/** Extract Q/A pairs from resources/faq.html <details class="faq-item"> blocks. */
function extractFaq(fileHtml) {
  const faqs = [];
  const re = /<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(fileHtml)) !== null) {
    const clean = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    faqs.push({ q: clean(m[1]), a: clean(m[2]) });
  }
  return faqs;
}

function injectLd(file, ldObj) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- LD:BEGIN -->[\s\S]*?<!-- LD:END -->\s*/g, '');
  const json = JSON.stringify(ldObj, null, 2).replace(/<\//g, '<\\/');
  const block = `\n    <!-- LD:BEGIN -->\n    <script type="application/ld+json">\n${json}\n    </script>\n    <!-- LD:END -->\n`;
  html = html.replace(/(\s*)<\/head>/, `${block}</head>`);
  fs.writeFileSync(file, html);
}

// 1. Organization + WebSite on homepage
injectLd(path.join(ROOT, 'index.html'), ORG);
console.log('✓ index.html: Organization + WebSite + LocalBusiness');

// 2. BreadcrumbList on all inner pages
for (const [rel, trail] of Object.entries(BREADCRUMBS)) {
  if (rel === 'index.html') continue;
  injectLd(path.join(ROOT, rel), breadcrumbJsonLd(trail));
  console.log(`✓ ${rel}: BreadcrumbList`);
}

// 3. FAQPage on resources/faq.html (merge with its breadcrumb)
const faqFile = path.join(ROOT, 'resources/faq.html');
const faqHtml = fs.readFileSync(faqFile, 'utf8');
const faqs = extractFaq(faqHtml);
if (faqs.length) {
  let html = faqFile && fs.readFileSync(faqFile, 'utf8');
  html = html.replace(/<!-- LD:BEGIN -->[\s\S]*?<!-- LD:END -->\s*/g, '');
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd(BREADCRUMBS['resources/faq.html']),
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
  const json = JSON.stringify(ld, null, 2).replace(/<\//g, '<\\/');
  html = html.replace(/(\s*)<\/head>/, `\n    <!-- LD:BEGIN -->\n    <script type="application/ld+json">\n${json}\n    </script>\n    <!-- LD:END -->\n</head>`);
  fs.writeFileSync(faqFile, html);
  console.log(`✓ resources/faq.html: BreadcrumbList + FAQPage (${faqs.length} questions)`);
}
