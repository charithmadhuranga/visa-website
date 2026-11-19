/**
 * Phase 1: Apply SEO metadata (title, description, canonical, robots,
 * keywords, Open Graph, Twitter Card) to every static HTML page.
 *
 * Idempotent: re-running replaces the previously injected block and
 * rewrites <title> / meta description in place.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.lgavisa.com';
const BRAND = 'LGA Visa';

/** Absolute canonical URL for each page (relative to repo root). */
const PAGES = {
  'index.html': {
    title: 'LGA Visa – Lanka Global Access | Student Visa Sri Lanka',
    description:
      'LGA Visa (Lanka Global Access) supports Sri Lankan students with overseas university admissions and student visa applications.',
    keywords:
      'student visa consultants Sri Lanka, study abroad consultants Sri Lanka, overseas education Sri Lanka, LGA Visa, Lanka Global Access',
    canonical: '/',
  },
  'services/student-visa.html': {
    title: 'Student Visa Assistance Sri Lanka | LGA Visa',
    description:
      'Student visa support for Sri Lankan students: university selection, applications, financial documents and interview preparation for five destinations.',
    keywords:
      'student visa assistance Sri Lanka, student visa consultants Colombo, student visa application help, student visa documents Sri Lanka',
    canonical: '/services/student-visa.html',
  },
  'services/ielts-pte.html': {
    title: 'IELTS & PTE Preparation Sri Lanka | LGA Visa',
    description:
      'LGA provides in-house IELTS and PTE preparation classes in Nugegoda and online, with guided practice and mock tests for your target score.',
    keywords:
      'IELTS classes Sri Lanka, PTE preparation Colombo, IELTS coaching Nugegoda, PTE training online Sri Lanka',
    canonical: '/services/ielts-pte.html',
  },
  'study-abroad/index.html': {
    title: 'Study Abroad from Sri Lanka | LGA Visa',
    description:
      'Compare destinations, costs, intakes and application guidance for students in Sri Lanka considering Australia, Canada, UK, New Zealand or USA.',
    keywords:
      'study abroad Sri Lanka, study abroad consultants, overseas education guidance, best countries to study',
    canonical: '/study-abroad/',
  },
  'study-abroad/australia.html': {
    title: 'Study in Australia: Student Visa Guide for Sri Lankans | LGA Visa',
    description:
      'Study in Australia from Sri Lanka: Subclass 500 visa information, universities, intakes, costs and application guidance from LGA Visa.',
    keywords:
      'study in Australia from Sri Lanka, Australia student visa Sri Lanka, Subclass 500 visa, Australian universities',
    canonical: '/study-abroad/australia.html',
  },
  'study-abroad/canada.html': {
    title: 'Canada Study Permit & Study Guide for Sri Lankan Students | LGA Visa',
    description:
      'Everything Sri Lankan students need to study in Canada — study permit process, PGWP, top universities, costs and step-by-step application guidance from LGA Visa.',
    keywords:
      'study in Canada from Sri Lanka, Canada study permit Sri Lanka, PGWP Canada, Canadian universities',
    canonical: '/study-abroad/canada.html',
  },
  'study-abroad/uk.html': {
    title: 'UK Student Visa & Study Guide for Sri Lankan Students | LGA Visa',
    description:
      'Study in the UK from Sri Lanka — current Student visa guidance, universities, course options and application support from LGA Visa.',
    keywords:
      'study in UK from Sri Lanka, UK student visa Sri Lanka, UK universities Sri Lankan students',
    canonical: '/study-abroad/uk.html',
  },
  'study-abroad/new-zealand.html': {
    title: 'New Zealand Student Visa & Study Guide | LGA Visa',
    description:
      'Study in New Zealand from Sri Lanka: student visa guidance, universities, intakes, costs and application information from LGA Visa.',
    keywords:
      'study in New Zealand from Sri Lanka, New Zealand student visa, NZ universities Sri Lankan students',
    canonical: '/study-abroad/new-zealand.html',
  },
  'study-abroad/usa.html': {
    title: 'USA Student Visa & Study Guide for Sri Lankan Students | LGA Visa',
    description:
      'Study in the USA from Sri Lanka: F-1 visa guidance, university options, scholarships and application support from LGA Visa.',
    keywords:
      'study in USA from Sri Lanka, F-1 student visa Sri Lanka, US universities Sri Lankan students, OPT work visa',
    canonical: '/study-abroad/usa.html',
  },
  'universities/index.html': {
    title: 'Universities Abroad for Sri Lankan Students | LGA Visa',
    description:
      'Browse universities in Australia, Canada, the UK, New Zealand and the USA, with course and admissions information for Sri Lankan students.',
    keywords:
      'universities for Sri Lankan students, best universities abroad, partner universities, study abroad institutions',
    canonical: '/universities/',
  },
  'universities/australia.html': {
    title: 'Universities in Australia for Sri Lankan Students | LGA Visa',
    description:
      'Explore universities and colleges in Australia partnered with Lanka Global Access — browse institutions, rankings and the courses available to Sri Lankan students.',
    keywords: 'universities in Australia, Australian universities Sri Lankan students',
    canonical: '/universities/australia.html',
  },
  'universities/canada.html': {
    title: 'Universities in Canada for Sri Lankan Students | LGA Visa',
    description:
      'Explore universities and colleges in Canada partnered with Lanka Global Access — browse institutions, programs and admissions pathways for Sri Lankan students.',
    keywords: 'universities in Canada, Canadian colleges Sri Lankan students',
    canonical: '/universities/canada.html',
  },
  'universities/uk.html': {
    title: 'Universities in United Kingdom for Sri Lankan Students | LGA Visa',
    description:
      'Explore universities and colleges in the United Kingdom partnered with Lanka Global Access — browse institutions, rankings and courses for Sri Lankan students.',
    keywords: 'universities in UK, UK universities Sri Lankan students',
    canonical: '/universities/uk.html',
  },
  'universities/new-zealand.html': {
    title: 'Universities in New Zealand for Sri Lankan Students | LGA Visa',
    description:
      'Explore universities and colleges in New Zealand partnered with Lanka Global Access — browse institutions and the courses open to Sri Lankan students.',
    keywords: 'universities in New Zealand, NZ universities Sri Lankan students',
    canonical: '/universities/new-zealand.html',
  },
  'universities/usa.html': {
    title: 'Universities in USA for Sri Lankan Students | LGA Visa',
    description:
      'Explore universities and colleges in the USA partnered with Lanka Global Access — browse institutions, programs and admissions support for Sri Lankan students.',
    keywords: 'universities in USA, US universities Sri Lankan students',
    canonical: '/universities/usa.html',
  },
  'resources/blog.html': {
    title: 'Study Abroad Guides & Visa Tips Sri Lanka | LGA Visa Blog',
    description:
      'Study abroad and student visa guides for Sri Lankan students, covering applications, SOP writing, IELTS/PTE, finances and destinations.',
    keywords: 'study abroad blog Sri Lanka, student visa guides, visa tips Sri Lanka',
    canonical: '/resources/blog.html',
  },
  'resources/post.html': {
    title: 'Study Abroad & Student Visa Guides | LGA Visa Blog',
    description:
      'Read expert study abroad and student visa guides written for Sri Lankan students by Lanka Global Access counsellors.',
    keywords: 'student visa guides Sri Lanka, study abroad articles',
    canonical: '/resources/blog.html',
    robots: 'noindex, follow',
  },
  'resources/faq.html': {
    title: 'Student Visa FAQ Sri Lanka | Lanka Global Access',
    description:
      'Answers to the most common questions about studying abroad, student visas, IELTS/PTE and LGA Visa\'s process — from Sri Lanka\'s trusted student visa consultants.',
    keywords: 'student visa FAQ Sri Lanka, study abroad questions, visa questions answered',
    canonical: '/resources/faq.html',
  },
  'about/index.html': {
    title: 'About LGA Visa | Lanka Global Access Sri Lanka',
    description:
      'Learn about LGA Visa (Lanka Global Access), a Sri Lankan consultancy supporting overseas university admissions and student visa applications.',
    keywords: 'about Lanka Global Access, LGA Visa about, student visa consultancy Sri Lanka',
    canonical: '/about/',
  },
  'about/mission-vision.html': {
    title: 'Mission & Vision | Lanka Global Access',
    description:
      'Our mission and vision — guiding Sri Lankan students to world-class universities with honest, expert student visa and study abroad consultancy.',
    keywords: 'LGA Visa mission, Lanka Global Access vision',
    canonical: '/about/mission-vision.html',
  },
  'about/why-choose-us.html': {
    title: 'Why Choose LGA Visa | Student Visa Experts Sri Lanka',
    description:
      'Learn how LGA Visa supports Sri Lankan students with transparent advice, experienced counsellors and guidance from course selection through visa application.',
    keywords: 'best student visa consultant Sri Lanka, why LGA Visa',
    canonical: '/about/why-choose-us.html',
  },
  'about/testimonials.html': {
    title: 'Student Success Stories & Reviews | Lanka Global Access',
    description:
      'Real success stories from Sri Lankan students who reached Australia, UK, Canada, New Zealand and the USA with Lanka Global Access student visa guidance.',
    keywords: 'student visa testimonials Sri Lanka, study abroad success stories',
    canonical: '/about/testimonials.html',
  },
  'contact.html': {
    title: 'Contact LGA Visa | Student Visa Consultancy Nugegoda, Sri Lanka',
    description:
      'Contact LGA Visa in Nugegoda, Sri Lanka to discuss student visa and study-abroad plans for Australia, Canada, the UK, New Zealand or USA.',
    keywords: 'contact student visa consultant Sri Lanka, LGA Visa Nugegoda',
    canonical: '/contact.html',
  },
  'sitemap.html': {
    title: 'Site Map | Lanka Global Access',
    description:
      'Complete list of Lanka Global Access pages — student visa services, study abroad destinations, universities, guides and resources.',
    keywords: 'site map Lanka Global Access',
    canonical: '/sitemap.html',
    robots: 'noindex, follow',
  },
};

function buildHeadBlock(cfg, canonicalUrl, ogImage) {
  const esc = (s) => s.replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;');
  const t = esc(cfg.title);
  const d = esc(cfg.description);
  return `<!-- SEO:BEGIN -->
    <meta name="robots" content="${cfg.robots || 'index, follow'}" />
    <meta name="keywords" content="${esc(cfg.keywords)}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${BRAND}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:locale" content="en_LK" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${ogImage}" />
    <!-- SEO:END -->`;
}

const OG_IMAGE = `${SITE}/images/og/lga-og.png`;

let applied = 0;
const problems = [];

for (const [rel, cfg] of Object.entries(PAGES)) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    problems.push(`MISSING FILE: ${rel}`);
    continue;
  }
  let html = fs.readFileSync(file, 'utf8');

  // 1. Rewrite <title>
  if (/<title>[\s\S]*?<\/title>/.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${cfg.title}</title>`);
  } else {
    problems.push(`${rel}: no <title> found`);
  }

  // 2. Rewrite or add meta description
  const descTag = `<meta name="description" content="${cfg.description.replace(/&/g, '&amp;')}" />`;
  if (/<meta\s+name="description"[^>]*\/?>/i.test(html)) {
    html = html.replace(/<meta\s+name="description"[^>]*\/?>/i, descTag);
  } else {
    html = html.replace(/(<meta charset=["']utf-8["']\s*\/?>)/i, `$1\n    ${descTag}`);
  }

  // 3. Remove any previously injected SEO block, then inject fresh before </head>
  html = html.replace(/<!-- SEO:BEGIN -->[\s\S]*?<!-- SEO:END -->\s*/g, '');
  const canonicalUrl = `${SITE}${cfg.canonical}`;
  const block = buildHeadBlock(cfg, canonicalUrl, OG_IMAGE);
  if (/<\/head>/.test(html)) {
    html = html.replace(/(\s*)<\/head>/, `\n\n    ${block}\n</head>`);
  } else {
    problems.push(`${rel}: no </head> found`);
    continue;
  }

  fs.writeFileSync(file, html);
  applied++;
}

console.log(`Applied SEO metadata to ${applied}/${Object.keys(PAGES).length} pages.`);
if (problems.length) {
  console.log('Problems:');
  problems.forEach((p) => console.log('  - ' + p));
  process.exitCode = 1;
}
