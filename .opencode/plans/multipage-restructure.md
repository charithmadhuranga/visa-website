# Multipage Website Restructure — Lanka Global Access

**Goal:** Transform the 2-page static site into a full multipage website with dedicated
pages per section, a shared component system, and data-driven university/blog pages.

## Constraints & Architecture Decisions

- **Hosting:** GitHub Pages, no build system → pure HTML/CSS/JS only.
- **Shared components:** `assets/js/components.js` injects header (with dropdown nav),
  footer, and WhatsApp button into every page. Single point of maintenance for nav/contact info.
- **Design system:** extracted from current inline styles into `assets/css/site.css`
  (tokens: `--primary #1e40af`, accent amber, Poppins + Playfair Display).
- **Shared behavior:** `assets/js/site.js` (loader, scrolled header, mobile menu,
  AOS/GSAP init, reveal animations).
- **Data-driven pages:** universities and blog posts live in plain-JS data files
  (`assets/js/data/*.js`) rendered by one template page each via `?id=` query param —
  avoids hand-maintaining dozens of near-identical HTML files.
- **Path handling:** every page sets `window.SITE_ROOT` inline *before* loading
  components.js so asset/logo/nav links resolve at any folder depth.
- **SEO:** real HTML pages for all main sections; dynamic pages included in sitemap.xml;
  unique title + meta description on every page.

## Target URL Map

```
/                                Home
/contact.html                    Contact Us

/about/index.html                Who We Are → About Us
/about/mission-vision.html       Mission & Vision
/about/why-choose-us.html        Why Choose Us
/about/testimonials.html         Testimonials

/study-abroad/index.html         Study Abroad overview (country cards)
/study-abroad/australia.html
/study-abroad/canada.html
/study-abroad/uk.html
/study-abroad/new-zealand.html
/study-abroad/usa.html

/universities/index.html         Universities by country (grid)
/universities/{australia|canada|uk|new-zealand|usa}.html   University lists
/universities/university.html?id=<slug>                    Details + courses offered

/services/student-visa.html      Student Visa Services
/services/ielts-pte.html         IELTS/PTE Services

/resources/blog.html             Blog listing
/resources/post.html?id=<slug>   Blog post detail
/resources/faq.html              FAQ
```

Navigation: Home · Who We Are ▾ · Study Abroad ▾ · Universities ▾ · Student Services ▾ · Resources ▾ · Contact · [Get Started]

## Phases

### Phase 1 — Foundation & shared components ✅ acceptance: contact.html renders fully from components
- [ ] Folder skeleton: `about/ study-abroad/ universities/ services/ resources/ assets/{css,js/data}`
- [ ] `assets/css/site.css` — tokens, base, header/nav/dropdowns, buttons, cards, section titles, loader, utilities
- [ ] `assets/js/components.js` — SITE config + NAV tree; renders header, mobile menu, footer, WhatsApp float
- [ ] `assets/js/site.js` — shared behaviors (loader hide, header scroll, mobile menu, AOS/GSAP init, counters)
- [ ] Refactor `contact.html` to use shared components (keep its Formspree logic)

### Phase 2 — Who We Are (4 pages)
- [ ] about/index.html — story, values, stats, CTA
- [ ] about/mission-vision.html
- [ ] about/why-choose-us.html
- [ ] about/testimonials.html

### Phase 3 — Study Abroad (6 pages)
- [ ] study-abroad/index.html overview
- [ ] Country pages ×5 (requirements, costs, intake, work rights, universities teaser → cross-link)

### Phase 4 — Universities
- [ ] `assets/js/data/universities.js` (~30 universities / 5 countries with courses)
- [ ] universities/index.html (country grid) + country pages ×5 (rendered from data)
- [ ] university.html?id= template — profile + course table + apply CTA

### Phase 5 — Student Services (2 pages)
- [ ] services/student-visa.html — process timeline, doc checklist, sub-services
- [ ] services/ielts-pte.html — exam comparison, prep support, class format

### Phase 6 — Resources
- [ ] `assets/js/data/blog.js` + blog.html listing + post.html?id= reader
- [ ] resources/faq.html — categorized accordion

### Phase 7 — Homepage rework & Contact polish
- [ ] Rework index.html sections to route into new pages (About, Countries→Study Abroad,
      Universities preview, Services, Testimonials teaser); swap in shared header/footer
- [ ] contact.html: map/hours/info refresh consistent with new structure

### Phase 8 — SEO & QA
- [ ] Regenerate sitemap.xml (+ keep .gz updated or drop), robots.txt check
- [ ] Internal-link audit script (all hrefs resolve), meta/title audit
- [ ] README update

## Verification
Per phase: serve locally (`python3 -m http.server`), confirm pages load without console
errors, links resolve. Phase 8 runs a repo-wide link/meta audit script.
