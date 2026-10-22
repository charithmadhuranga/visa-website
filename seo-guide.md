# LGA Visa — Source-Code-Level SEO Optimization Guide

**Website:** https://www.lgavisa.com/  
**Repository:** https://github.com/charithmadhuranga/visa-website  
**Deployment:** GitHub Pages  
**Technology:** HTML5, CSS3, JavaScript, Tailwind CSS CDN  
**Business:** Lanka Global Access (LGA Visa)  
**Primary market:** Sri Lankan students and families seeking overseas education and student visa assistance

## 1. Objectives

Implement technical and content SEO improvements so the website has the best possible opportunity to rank for:

### Brand searches
- LGA
- LGA Visa
- LGA Visa Sri Lanka
- Lanka Global Access
- Lanka Global Access Consultancy
- Lanka Global Access student visa

### Non-brand searches
- Student visa consultants in Sri Lanka
- Study abroad consultants in Sri Lanka
- Overseas education consultants Sri Lanka
- Student visa application assistance Sri Lanka
- Study in Australia from Sri Lanka
- Study in the UK from Sri Lanka
- Study in Canada from Sri Lanka
- Study in New Zealand from Sri Lanka
- Study in the USA from Sri Lanka

### Supporting searches
- Student visa requirements for Sri Lankan applicants
- University admissions for Sri Lankan students
- Study abroad costs and scholarships
- IELTS and PTE preparation
- Student visa documentation and application guidance

These are target keyword groups, not confirmed search-volume estimates.

**Success criteria:** improve crawlability, indexing, relevant impressions, organic clicks, branded visibility and qualified enquiries. No source-code implementation can guarantee a particular Google ranking.

---

## 2. Existing architecture and initial audit

The repository README documents a static multipage website deployed on GitHub Pages. It already includes country pages, student visa services, university directories, blog resources, an XML sitemap and `robots.txt`.

Relevant files:

| File | Responsibility |
|---|---|
| `index.html` | Homepage and primary brand landing page |
| `services/student-visa.html` | Main student visa service |
| `study-abroad/index.html` | Study destination overview |
| `study-abroad/australia.html` | Australia destination page |
| `study-abroad/canada.html` | Canada destination page |
| `study-abroad/uk.html` | UK destination page |
| `study-abroad/new-zealand.html` | New Zealand destination page |
| `study-abroad/usa.html` | USA destination page |
| `universities/` | University directories and detail pages |
| `resources/` | Blog and FAQ pages |
| `assets/js/components.js` | Shared header/footer components |
| `assets/js/data/blog.js` | Blog data |
| `assets/js/blog-post.js` | Client-side blog rendering |
| `assets/js/data/universities.js` | University data |
| `assets/js/university-detail.js` | Client-side university detail rendering |
| `robots.txt` | Crawler directives |
| `sitemap.xml` | XML URL inventory |
| `CNAME` | Custom domain configuration |

Repository reference: https://github.com/charithmadhuranga/visa-website

### Audit findings

**A. Homepage metadata**

The homepage currently has a title and meta description, but the title could more explicitly target the brand and Sri Lankan student visa market. The inspected `<head>` does not include a canonical URL, Open Graph tags or JSON-LD structured data.

**B. Country pages**

Country pages already have individual titles, descriptions and useful visible content. For example, the Australia page has a dedicated title and a description that references Sri Lankan students. Preserve this structure and improve the accuracy, completeness and uniqueness of each page.

**C. Dynamic blog and university details**

The following files generate content in JavaScript:

- `resources/post.html?id=<slug>`
- `universities/university.html?id=<slug>`

The JavaScript renderers set the document title and meta description after loading the requested record. However, the initial HTML uses a shared template, and the article/university body is injected by JavaScript.

Google can render JavaScript, but static, crawlable pages with unique content and metadata in the original HTML are a more robust approach, particularly for a small website deployed on GitHub Pages.

**D. Sitemap**

The existing sitemap lists the main static pages, but its `lastmod` dates are August 2026. The sitemap should be updated to reflect actual significant content changes. Individual blog and university records also need an explicit indexing strategy.

**E. Robots file**

The existing `robots.txt` allows crawling and declares the sitemap. This is a reasonable starting point. Do not introduce broad crawl restrictions that accidentally block important website resources.

These findings are based on the publicly visible repository files; they are not a substitute for Google Search Console or a complete live crawl.

---

## 3. Phase 1 — Homepage metadata

### File: `index.html`

Replace the current homepage metadata with a carefully selected title and description. Retain your existing favicon declarations.

Recommended metadata:

```html
<title>LGA Visa | Student Visa & Study Abroad Consultants Sri Lanka</title>

<meta
  name="description"
  content="Lanka Global Access (LGA Visa) helps Sri Lankan students explore overseas education, university admissions and student visa application requirements for Australia, the UK, Canada, New Zealand and the USA."
/>

<meta name="robots" content="index, follow" />

<link rel="canonical" href="https://www.lgavisa.com/" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Lanka Global Access" />
<meta
  property="og:title"
  content="LGA Visa | Student Visa & Study Abroad Consultants Sri Lanka"
/>
<meta
  property="og:description"
  content="Explore overseas study options, university admissions and student visa guidance with Lanka Global Access."
/>
<meta property="og:url" content="https://www.lgavisa.com/" />
<meta
  property="og:image"
  content="https://www.lgavisa.com/images/og/lga-homepage.jpg"
/>

<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:title"
  content="LGA Visa | Study Abroad from Sri Lanka"
/>
<meta
  name="twitter:description"
  content="Explore overseas study options and student visa guidance with Lanka Global Access."
/>
<meta
  name="twitter:image"
  content="https://www.lgavisa.com/images/og/lga-homepage.jpg"
/>
```

Implementation notes:

- Create the Open Graph image before deploying this snippet. Do not leave a nonexistent image URL.
- Use an image that represents LGA and its actual services.
- Keep one canonical declaration per page.
- If a page is intentionally non-indexable, do not apply `index, follow` blindly.
- Social sharing tags primarily improve how shared links appear; they are not a direct ranking boost.
- Google may generate its own title and snippet.

### Homepage H1 and body content

The homepage should communicate the brand and service clearly in its visible HTML.

Recommended H1:

```html
<h1>
  Study Abroad from Sri Lanka with Lanka Global Access
</h1>
```

Recommended introduction:

```html
<p>
  Lanka Global Access (LGA Visa) supports students in Sri Lanka
  who are exploring international education opportunities. Our
  services include university selection, admissions guidance,
  student visa documentation and application preparation for
  selected study destinations.
</p>
```

Adapt the wording to the services actually provided. Do not claim official government affiliation, guaranteed visa approval or university partnerships unless those claims are accurate and verifiable.

### Improve the hero slideshow

Your homepage uses a hero slideshow. Ensure the primary heading and explanatory text are present in the original HTML rather than only appearing after a JavaScript event or on a later slide.

Recommended:

- One clear primary H1.
- Visible service description.
- Crawlable links to student visa services and destination pages.
- A prominent consultation/contact link.
- Meaningful image `alt` attributes for informative images.
- No essential service information hidden exclusively in background images.

---

## 4. Phase 2 — Add organization structured data

### File: `index.html`

Add JSON-LD inside the homepage `<head>`. Replace example values with verified business details.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.lgavisa.com/#organization",
  "name": "Lanka Global Access",
  "alternateName": "LGA Visa",
  "url": "https://www.lgavisa.com/",
  "logo": "https://www.lgavisa.com/images/ico/favicon-48x48.png",
  "email": "admin@lgavisa.com"
}
</script>
```

Use a proper, high-resolution logo URL if one exists; the favicon is only a placeholder in this example.

If LGA operates a genuine customer-facing office, consider an appropriate `LocalBusiness` subtype after verifying the address, telephone number and other required details. Use only one coherent business identity across the site.

Do not invent opening hours, addresses, reviews, ratings or social media profiles.

Structured data helps search engines understand the organization. It does not guarantee a ranking improvement or special search-result display.

Validation:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/

---

## 5. Phase 3 — Build a reusable SEO standard for every page

For each indexable HTML page, implement:

1. A unique title.
2. A unique meta description.
3. An absolute canonical URL.
4. A meaningful visible H1.
5. Useful, unique page content.
6. Crawlable internal links.
7. Relevant Open Graph metadata.
8. Appropriate structured data, where useful.
9. A meaningful image alt attribute.
10. Inclusion in the sitemap when the page should be indexed.

### Example: Australia page

File: `study-abroad/australia.html`

```html
<title>
  Australia Student Visa & Study Guide for Sri Lankan Students | LGA Visa
</title>

<meta
  name="description"
  content="Explore studying in Australia from Sri Lanka, including university admissions, student visa requirements, financial documentation and application guidance from LGA Visa."
/>

<link
  rel="canonical"
  href="https://www.lgavisa.com/study-abroad/australia.html"
/>
```

Use a similar pattern for other destinations, but write unique metadata and content for each.

### Suggested title patterns

| Page | Title pattern |
|---|---|
| Homepage | LGA Visa \| Student Visa & Study Abroad Consultants Sri Lanka |
| Student visa services | Student Visa Assistance Sri Lanka \| LGA Visa |
| Study abroad hub | Study Abroad from Sri Lanka \| Lanka Global Access |
| Australia | Australia Student Visa & Study Guide for Sri Lankan Students \| LGA Visa |
| UK | UK Student Visa & Study Guide for Sri Lankan Students \| LGA Visa |
| Canada | Canada Study Permit & Study Guide for Sri Lankan Students \| LGA Visa |
| New Zealand | New Zealand Student Visa & Study Guide \| LGA Visa |
| USA | USA Student Visa & Study Guide for Sri Lankan Students \| LGA Visa |
| University directory | Universities Abroad for Sri Lankan Students \| LGA Visa |
| Contact | Contact Lanka Global Access \| LGA Visa Sri Lanka |

These are starting patterns, not mandatory strings. Keep titles readable and accurate.

---

## 6. Phase 4 — Improve the student visa service page

### File: `services/student-visa.html`

This should be the primary landing page for non-branded searches such as “student visa consultants in Sri Lanka”.

Recommended title:

```html
<title>Student Visa Assistance Sri Lanka | LGA Visa</title>
```

Recommended description:

```html
<meta
  name="description"
  content="Explore overseas education and student visa application support for Sri Lankan students. Learn about documentation, university admissions and destination-specific requirements with LGA Visa."
/>
```

Recommended content structure:

```html
<h1>Student Visa Assistance for Sri Lankan Students</h1>

<h2>How Our Student Visa Support Works</h2>

<h2>Choose Your Study Destination</h2>

<h2>University Selection and Admissions</h2>

<h2>Student Visa Documents and Preparation</h2>

<h2>Understanding Financial Requirements</h2>

<h2>Application Preparation and Next Steps</h2>

<h2>Frequently Asked Questions</h2>

<h2>Request a Consultation</h2>
```

The actual page must answer the questions implied by these headings.

Include:

- What LGA actually does.
- What prospective students should prepare.
- How university selection and admission work.
- The distinction between university admission and visa approval.
- Official government resources for each destination.
- The role and limitations of LGA's assistance.
- A clear enquiry or consultation CTA.

Do not publish a generic page that merely repeats “student visa Sri Lanka”. Explain the process and help students make informed decisions.

---

## 7. Phase 5 — Improve country-specific SEO

Keep the existing destination pages:

- `study-abroad/australia.html`
- `study-abroad/canada.html`
- `study-abroad/uk.html`
- `study-abroad/new-zealand.html`
- `study-abroad/usa.html`

Each page should be a useful resource in its own right.

### Recommended country-page template

1. Country-specific H1 and introduction.
2. Why students from Sri Lanka consider the destination.
3. Available education levels and relevant courses.
4. University selection and admissions process.
5. Current student visa or study permit requirements.
6. Financial evidence and estimated costs, with clear dates and sources.
7. English-language requirements, where applicable.
8. Application checklist.
9. Common questions.
10. Official government links.
11. Related universities and resources.
12. Consultation CTA.

### Content accuracy requirements

Visa rules, application fees, financial thresholds, work permissions and processing times change. Review these facts before publication and show a “last reviewed” date when appropriate.

For Australia, use official Australian Department of Home Affairs sources. For the UK, use GOV.UK. For Canada, use the official Government of Canada immigration website. Use the relevant official government sources for New Zealand and the USA as well.

Avoid presenting fixed processing times or work entitlements as universal guarantees.

---

## 8. Phase 6 — Resolve dynamic blog and university URLs

This is one of the most important technical improvements in this repository.

### Current blog implementation

File: `assets/js/blog-post.js`

The renderer reads a query parameter:

```javascript
const id = new URLSearchParams(window.location.search).get('id');
```

It then inserts article content and changes the title and description.

The university renderer follows a similar approach in:

`assets/js/university-detail.js`

These implementations are functional, but each detail page shares a template URL with different query parameters.

### Recommended solution: generate static detail pages

Because the site is hosted on GitHub Pages and the content is stored in JavaScript data files, add a build-time generation script.

Suggested structure:

```text
scripts/
  generate-seo-pages.mjs

assets/js/data/
  blog.js
  universities.js

resources/
  blog/
    australia-student-visa-guide.html
    ...
  
universities/
  university-name.html
  ...
```

The generator should:

1. Read the existing blog and university data.
2. Generate one HTML file for each publishable record.
3. Write a unique title and description into the original HTML `<head>`.
4. Write the canonical URL into the original HTML.
5. Render the record's actual content into the generated HTML.
6. Add internal links to related articles or universities.
7. Generate or update the XML sitemap.
8. Fail the build if duplicate slugs or missing required metadata are found.

Preserve the current design system and shared navigation while implementing the generator.

### Example of a generated blog page

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <title>
    Australia Student Visa Checklist for Sri Lankan Students | LGA Visa
  </title>

  <meta
    name="description"
    content="Review the documents, admissions steps and official resources relevant to Sri Lankan students preparing to study in Australia."
  />

  <link
    rel="canonical"
    href="https://www.lgavisa.com/resources/blog/australia-student-visa-checklist.html"
  />
</head>
```

This is a generated-page example. The article must contain its actual substantive content in the HTML.

### URL migration

Do not simply delete the existing query-parameter pages.

- Identify the URLs already receiving impressions, links or traffic.
- Create the replacement static page.
- Add a permanent redirect where the hosting setup supports it.
- If GitHub Pages cannot provide the required redirect behavior for a URL, select a migration strategy that preserves the old URL or provides a clear replacement.
- Update internal links and the sitemap.
- Inspect the old and new URLs in Search Console after deployment.

Do not rely on `rel="canonical"` alone to redirect visitors.

### Alternative if a build generator cannot be implemented immediately

Keep the existing templates temporarily, ensure their rendered content and metadata are unique, test them with Google's URL Inspection Tool, and prioritize the migration of your most useful articles first.

Google can process JavaScript, but unique content in the original HTML is generally more robust.

---

## 9. Phase 7 — Improve university directory SEO

The current university detail renderer uses:

`universities/university.html?id=<slug>`

The data-driven approach is useful for maintaining content, but individual universities should have stable, meaningful URLs if their pages are intended to attract organic traffic.

Example URL:

```text
https://www.lgavisa.com/universities/australia/example-university.html
```

Only use this example after substituting a real institution and its correct slug.

Every university page should include:

- Institution name and verified official website.
- Country and city.
- Accurate course information.
- Admission requirements where available.
- Tuition information only when verified and dated.
- Source links for university information.
- Unique page title and description.
- Links to the relevant country page.
- A consultation link.

Avoid thin pages containing only a university name and a few generic course rows. If there is insufficient unique information for a useful page, keep the university discoverable through the country directory instead of automatically indexing a low-value page.

---

## 10. Phase 8 — Repair and automate the sitemap

### File: `sitemap.xml`

The current sitemap uses the correct XML sitemap namespace and declares absolute URLs under `https://www.lgavisa.com/`.

The existing `lastmod` dates should be reviewed. Update them when the corresponding page's content changes materially, rather than changing every date during every build.

### Sitemap rules

Include:

- Homepage.
- Main service pages.
- Study destination pages.
- Useful university directory pages.
- Publishable, indexable blog articles.
- Other substantive pages intended to appear in search.

Exclude:

- Redirect destinations' obsolete source URLs.
- Pages blocked from indexing.
- Duplicate URLs.
- Search or filter result URLs that are not intended to be indexed.
- Error pages and non-content utility pages.

Do not add query-based university or blog records to the sitemap until the URL strategy has been deliberately defined.

### Automated sitemap generation

Use the same build-time script that generates static pages to generate the sitemap. This prevents the HTML pages and sitemap from drifting apart.

Every `<loc>` must match the page's preferred canonical URL.

Keep `robots.txt` configured to reference:

```text
Sitemap: https://www.lgavisa.com/sitemap.xml
```

Submit that sitemap in Google Search Console after deployment.

The XML sitemap is for crawlers; `sitemap.html` is a separate human-readable navigation page.

---

## 11. Phase 9 — Canonical URLs and GitHub Pages

The repository's `CNAME` file identifies the `www.lgavisa.com` custom domain. Use one consistent preferred host across the site.

Recommended preferred homepage:

```text
https://www.lgavisa.com/
```

Check all of the following:

- HTTP redirects to HTTPS.
- The apex domain redirects to the preferred `www` host, if that is your chosen configuration.
- All internal links use the preferred host where absolute URLs are needed.
- Canonical tags use the preferred host.
- The sitemap uses the preferred host.
- Open Graph URLs use the preferred host.
- No page points its canonical URL at an unrelated page.
- Slash and `.html` variations do not create unintended duplicate pages.

GitHub Pages has hosting-specific limitations around redirects and server-side behavior. Test the actual deployed responses before selecting a redirect strategy.

---

## 12. Phase 10 — Internal linking and crawlability

### File: `assets/js/components.js`

Review the shared header and footer components.

Important links should be present as ordinary HTML anchors with real `href` attributes:

```html
<a href="/services/student-visa.html">
  Student Visa Services
</a>

<a href="/study-abroad/australia.html">
  Study in Australia
</a>

<a href="/study-abroad/uk.html">
  Study in the UK
</a>
```

Use paths that match the actual deployed URLs.

Avoid navigation links that depend exclusively on click handlers, non-link elements or JavaScript fragments.

### Recommended linking model

- Homepage → student visa services.
- Homepage → each destination page.
- Student visa services → each relevant destination page.
- Destination page → relevant university directory.
- Destination page → related blog guides.
- Blog article → relevant service and destination pages.
- University page → its country directory and relevant admission resources.
- Footer → About, Contact, Services and main destination pages.

Use meaningful anchor text. Avoid repeating exactly the same keyword-rich anchor on every link.

---

## 13. Phase 11 — Images and performance

### Images

For informative images:

```html
<img
  src="/images/students/study-abroad-consultation.webp"
  alt="Student discussing overseas university options with an adviser"
/>
```

The filename and alt text must describe the actual image. Do not stuff keywords into alt attributes.

Use:

- WebP or AVIF where supported.
- Correct image dimensions.
- Responsive image sizes where useful.
- Explicit width and height to reduce layout shifts.
- Lazy loading for below-the-fold images.
- Eager loading for the genuine primary hero image when appropriate.

Decorative images should use empty alt text.

### JavaScript and CSS

The homepage loads Tailwind from its CDN, animation libraries, icons, fonts and other scripts. Measure the real performance impact before making changes.

Recommended order:

1. Test the deployed homepage and destination pages in PageSpeed Insights.
2. Measure mobile performance.
3. Identify the largest contentful paint element.
4. Reduce unnecessary JavaScript and render-blocking resources.
5. Optimize hero images and font loading.
6. Reduce layout shifts.
7. Consider generating a local production CSS file rather than loading the full Tailwind CDN runtime, provided the build and deployment workflow supports it.
8. Ensure essential content remains accessible when animation libraries fail.

Do not remove a dependency just because it exists. Use measurements to identify actual bottlenecks.

---

## 14. Phase 12 — Location-focused SEO for Sri Lanka

Do not create fake branch pages for cities where LGA has no office.

Instead, create genuinely useful resources for Sri Lankan applicants, using relevant local context.

Examples:

- Study in Australia from Sri Lanka.
- UK student visa guidance for Sri Lankan applicants.
- Comparing overseas university costs for Sri Lankan families.
- Documents to prepare before applying to an overseas university.
- Study abroad options after A/Ls.
- Understanding proof of funds and sponsor documentation.

If the company genuinely serves applicants throughout Sri Lanka, say so accurately on the site.

If LGA has a verified physical office, maintain consistent real-world name, address and telephone information across the website and Google Business Profile.

Consider carefully reviewed Sinhala and Tamil content if LGA can maintain accurate translations. Each language version should have its own useful content and appropriate language annotations when implementing multilingual URLs.

---

## 15. Phase 13 — Trust and accuracy

Visa and immigration guidance can affect important financial and educational decisions.

Add or improve:

- A transparent About page.
- Genuine adviser identities and qualifications.
- Clear descriptions of consultancy services.
- Authentic student testimonials published with permission.
- Verifiable success statistics, if used.
- Dates on time-sensitive guidance.
- Official government source links.
- A clear privacy policy for contact forms.
- Accurate contact details and enquiry handling.

Never claim guaranteed visa approval. Avoid fabricated testimonials, fake ratings, false partnerships or unverified success rates.

Content accuracy and credibility are essential to a sustainable strategy.

---

## 16. Phase 14 — Build-time quality checks

Add automated checks to prevent regressions.

Recommended checks for every intended indexable HTML page:

- HTML file exists.
- `<title>` exists and is not duplicated unintentionally.
- Meta description exists.
- Exactly one appropriate canonical URL exists.
- Canonical URL matches the preferred page URL.
- Exactly one primary H1 exists as a project convention.
- Internal links point to valid routes.
- Image assets exist.
- No accidental `noindex` directive exists.
- Sitemap includes the page when required.
- Sitemap excludes redirected or intentionally non-indexable pages.
- Structured data parses as valid JSON.
- No duplicate content slugs exist.

The H1 count is a project-quality convention, not a special Google ranking rule.

### Suggested generator validation

```javascript
function validateSeoRecord(record) {
  const errors = [];

  if (!record.slug) errors.push("Missing slug");
  if (!record.title) errors.push("Missing SEO title");
  if (!record.description) errors.push("Missing description");
  if (!record.content) errors.push("Missing page content");

  if (record.title && record.title.length > 70) {
    console.warn(`Review long title: ${record.slug}`);
  }

  if (record.description && record.description.length > 180) {
    console.warn(`Review long description: ${record.slug}`);
  }

  return errors;
}
```

The title and description lengths above are review thresholds, not Google-imposed limits. Judge the final text for clarity and usefulness.

Run validation before the build succeeds. Use an HTML parser for production checks rather than relying exclusively on regular expressions.

---

## 17. Phase 15 — Search Console and analytics

Create or verify a Google Search Console property for the preferred domain.

After deployment:

1. Submit the sitemap.
2. Inspect the homepage.
3. Inspect the student visa service page.
4. Inspect each main destination page.
5. Check the rendered HTML for the expected content.
6. Review indexing errors and selected canonical URLs.
7. Request indexing for important updated pages when appropriate.
8. Monitor search queries, clicks, impressions and average position.
9. Track consultation submissions and other genuine leads in analytics.

Do not submit every URL repeatedly. Google decides when to crawl and whether to index a page.

### Monthly KPI report

| KPI | Purpose |
|---|---|
| Indexed landing pages | Confirm important pages are discoverable |
| Brand query impressions | Measure LGA brand visibility |
| Non-brand impressions | Measure visibility for new student searches |
| Organic clicks | Measure search traffic |
| CTR | Find opportunities to improve titles and snippets |
| Landing-page conversions | Measure qualified enquiries |
| Local profile interactions | Measure local discovery |
| Mobile Core Web Vitals | Monitor real-world user experience |

Separate branded and non-branded queries in Search Console reports. This helps determine whether LGA is growing brand recognition or acquiring new students from general student visa searches.

---

## 18. Recommended implementation order

### Priority 1 — Immediate

- [ ] Update homepage title and description.
- [ ] Add canonical and social sharing metadata.
- [ ] Add accurate organization structured data.
- [ ] Review metadata on all main service and country pages.
- [ ] Verify canonical host and redirects.
- [ ] Validate sitemap and submit it to Search Console.

### Priority 2 — High impact

- [ ] Improve `services/student-visa.html`.
- [ ] Improve all five destination pages.
- [ ] Strengthen homepage and footer internal links.
- [ ] Improve the About and Contact pages.
- [ ] Review accuracy of country-specific claims.
- [ ] Test mobile performance and core page rendering.

### Priority 3 — Architecture

- [ ] Build a static-page generator for blog posts.
- [ ] Build a static-page generator for university details worth indexing.
- [ ] Create stable descriptive URLs.
- [ ] Update internal links and sitemap generation.
- [ ] Plan redirects or URL preservation for existing query-based pages.
- [ ] Add build-time SEO validation.

### Priority 4 — Growth

- [ ] Publish accurate country-specific guides.
- [ ] Add useful student FAQs.
- [ ] Earn genuine relevant links and mentions.
- [ ] Improve Google Business Profile.
- [ ] Publish real student experiences with permission.
- [ ] Review organic queries and conversions monthly.

---

## 19. Acceptance criteria

The SEO implementation should be considered technically complete when:

1. Every primary landing page has unique, appropriate metadata.
2. Every intended indexable page has a correct canonical URL.
3. Important page content is present in the original HTML or demonstrably accessible to Google.
4. Blog and university detail URLs have a deliberate, tested indexing strategy.
5. The XML sitemap contains valid preferred URLs and accurate modification dates.
6. Robots directives do not block important content.
7. Internal links work and the main service pages are reachable through ordinary anchors.
8. Structured data validates and matches the real business.
9. No material migration issue has been introduced.
10. Search Console and analytics are configured to measure outcomes.

Ranking improvements must then be measured over time. Google may take weeks or longer to reflect changes, and competitive searches can take substantially longer.

## 20. Official references

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google JavaScript SEO Basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google developer SEO guide: https://developers.google.com/search/docs/fundamentals/get-started-developers
- Google structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search Console: https://search.google.com/search-console/
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Google Rich Results Test: https://search.google.com/test/rich-results

**Final recommendation:** keep the existing static website and improve it incrementally. Prioritize unique metadata, the student visa landing page, country-specific content, crawlable detail pages and a reliable sitemap. These are the strongest source-code foundations for growing LGA Visa's visibility in Sri Lanka without introducing the cost and complexity of a framework migration.
