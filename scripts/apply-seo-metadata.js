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
    title: 'LGA Visa | Student Visa & Study Abroad Consultants Sri Lanka',
    description:
      'LGA Visa (Lanka Global Access) is a student visa and study abroad consultancy in Sri Lanka, helping students with admissions and visa applications.',
    keywords:
      'student visa consultants Sri Lanka, study abroad consultants Sri Lanka, student visa consultancy Nugegoda, overseas education Sri Lanka, LGA Visa',
    canonical: '/',
  },
  'services/student-visa.html': {
    title: 'Student Visa Consultants in Sri Lanka | LGA Visa',
    description:
      'Looking for student visa consultants in Sri Lanka? LGA Visa guides course selection, overseas university applications and visa document preparation.',
    keywords:
      'student visa consultants Sri Lanka, student visa consultancy Nugegoda, student visa application Sri Lanka, study visa consultants Sri Lanka',
    canonical: '/services/student-visa.html',
  },
  'services/ielts-pte.html': {
    title: 'IELTS & PTE Preparation Sri Lanka | LGA Visa',
    description:
      'LGA provides in-house IELTS and PTE preparation classes in Nugegoda and online, with guided practice and mock tests for your target score.',
    keywords:
      'IELTS classes Sri Lanka, PTE preparation Nugegoda, IELTS coaching Nugegoda, PTE training online Sri Lanka',
    canonical: '/services/ielts-pte.html',
  },
  'study-abroad/index.html': {
    title: 'Study Abroad Consultants in Sri Lanka | LGA Visa',
    description:
      'LGA Visa helps Sri Lankan students plan to study abroad. Compare Australia, Canada, UK, New Zealand and USA universities and application steps.',
    keywords:
      'study abroad consultants Sri Lanka, study overseas from Sri Lanka, overseas education consultants Nugegoda, study abroad guidance',
    canonical: '/study-abroad/',
  },
  'study-abroad/australia.html': {
    title: 'Study in Australia from Sri Lanka | Student Visa Guide',
    description:
      'Plan to study in Australia from Sri Lanka? Explore Subclass 500 student visa guidance, universities, course options and application steps with LGA Visa.',
    keywords:
      'study in Australia from Sri Lanka, Australia student visa Sri Lanka, Subclass 500 visa, Australian universities',
    canonical: '/study-abroad/australia.html',
  },
  'study-abroad/canada.html': {
    title: 'Study in Canada from Sri Lanka | Study Permit Guide',
    description:
      'Explore how to study in Canada from Sri Lanka, including study permit guidance, university options, costs and application steps with LGA Visa.',
    keywords:
      'study in Canada from Sri Lanka, Canada study permit Sri Lanka, PGWP Canada, Canadian universities',
    canonical: '/study-abroad/canada.html',
  },
  'study-abroad/uk.html': {
    title: 'Study in the UK from Sri Lanka | Student Visa Guide',
    description:
      'Plan to study in the UK from Sri Lanka? Explore Student visa guidance, university choices and application steps with LGA Visa.',
    keywords:
      'study in UK from Sri Lanka, UK student visa Sri Lanka, UK universities Sri Lankan students',
    canonical: '/study-abroad/uk.html',
  },
  'study-abroad/new-zealand.html': {
    title: 'Study in New Zealand from Sri Lanka | Visa Guide',
    description:
      'Plan to study in New Zealand from Sri Lanka? Explore student visa guidance, universities, costs and application steps with LGA Visa.',
    keywords:
      'study in New Zealand from Sri Lanka, New Zealand student visa, NZ universities Sri Lankan students',
    canonical: '/study-abroad/new-zealand.html',
  },
  'study-abroad/usa.html': {
    title: 'Study in the USA from Sri Lanka | F-1 Visa Guide',
    description:
      'Plan to study in the USA from Sri Lanka? Explore F-1 student visa guidance, university options and application steps with LGA Visa.',
    keywords:
      'study in USA from Sri Lanka, F-1 student visa Sri Lanka, US universities Sri Lankan students, OPT work visa',
    canonical: '/study-abroad/usa.html',
  },
  'courses.html': {
    title: 'Course Finder: Study Abroad Courses & Fees | LGA Visa',
    description:
      "Search 4,000+ bachelor's, master's and MBA courses in Australia, Canada, the UK and USA. Compare programs, duration and intakes for Sri Lankan students.",
    keywords:
      'courses abroad for Sri Lankan students, study abroad course finder, overseas university programs, bachelor master MBA abroad, university intakes 2027',
    canonical: '/courses.html',
  },
  'universities/index.html': {
    title: 'Overseas Universities for Sri Lankan Students | LGA Visa',
    description:
      'Explore overseas universities for Sri Lankan students, with course and admissions information for Australia, Canada, the UK, New Zealand and USA.',
    keywords:
      'overseas universities for Sri Lankan students, universities abroad from Sri Lanka, study abroad courses, international university admissions',
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
    title: 'Study Abroad & Student Visa Guides Sri Lanka | LGA Visa',
    description:
      'Practical study abroad and student visa guides for Sri Lankan students, covering applications, IELTS/PTE, finances and destination planning.',
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
      'Contact LGA Visa, a student visa consultancy in Nugegoda, Sri Lanka, for guidance on overseas study and student visa applications.',
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
