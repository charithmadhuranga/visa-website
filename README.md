# Lanka Global Access - Visa & Immigration Website

A professional website for Lanka Global Access Consultancy, providing visa and immigration consulting services.

## Features

- **Multipage Website** - About, Study Abroad, Universities, Services, Resources and Contact sections
- **Modern Landing Page** - Hero slideshow, services, study destinations, and contact info
- **University Directory** - 30+ universities across 5 countries with courses (data-driven)
- **Blog & FAQ** - Data-driven blog with detail pages and categorized FAQs
- **Contact Form** - Formspree integration for client inquiries
- **Responsive Design** - Works on all devices
- **Animations** - GSAP and AOS scroll animations
- **WhatsApp Integration** - Floating chat button
- **Shared Components** - Header/footer injected via `assets/js/components.js`

## File Structure

```
visa-website/
├── index.html                  # Homepage
├── contact.html                # Contact form page
├── about/
│   ├── index.html              # About Us
│   ├── mission-vision.html     # Mission & Vision
│   ├── why-choose-us.html      # Why Choose Us
│   └── testimonials.html       # Student Testimonials
├── study-abroad/
│   ├── index.html              # Destinations overview
│   ├── australia.html          # Australia guide
│   ├── canada.html             # Canada guide
│   ├── uk.html                 # UK guide
│   ├── new-zealand.html        # New Zealand guide
│   └── usa.html                # USA guide
├── universities/
│   ├── index.html              # Universities hub (by country)
│   ├── australia.html          # Universities in Australia
│   ├── canada.html             # Universities in Canada
│   ├── uk.html                 # Universities in the UK
│   ├── new-zealand.html        # Universities in New Zealand
│   ├── usa.html                # Universities in the USA
│   └── university.html         # University detail (?id=<slug>)
├── services/
│   ├── student-visa.html       # Student visa services
│   └── ielts-pte.html          # IELTS & PTE preparation
├── resources/
│   ├── blog.html               # Blog listing
│   ├── post.html               # Blog post detail (?id=<slug>)
│   └── faq.html                # Frequently asked questions
├── assets/
│   ├── css/site.css            # Shared design system
│   └── js/
│       ├── components.js       # Header/footer/WhatsApp injection
│       ├── site.js             # Shared behaviors (menu, AOS, GSAP)
│       ├── university-list.js  # Country university listings
│       ├── university-detail.js# University detail renderer
│       ├── blog-list.js        # Blog listing renderer
│       ├── blog-post.js        # Blog post renderer
│       └── data/
│           ├── universities.js # University + country data
│           └── blog.js         # Blog posts data
├── README.md                   # This file
├── CNAME                       # Custom domain (www.lgavisa.com)
├── robots.txt                  # SEO robots file
├── sitemap.xml                 # XML sitemap
├── sitemap.html                # HTML sitemap
└── images/                     # Website images and assets
```

### Adding content

- **Universities**: append to `LGA_UNIVERSITIES` in `assets/js/data/universities.js`; they appear automatically on country pages.
- **Blog posts**: append to `LGA_BLOG_POSTS` in `assets/js/data/blog.js`.

## Deployment

This site is deployed on **GitHub Pages** at [www.lgavisa.com](https://www.lgavisa.com).

```bash
# Push changes to deploy
git add .
git commit -m "Update site"
git push origin main
```

## Tech Stack

- HTML5, CSS3, JavaScript
- Tailwind CSS (CDN)
- GSAP + ScrollTrigger (animations)
- AOS (Animate On Scroll)
- Font Awesome (icons)
- Formspree (contact form)

## Contact

- **Email**: admin@lgavisa.com

## Image attribution

- Victoria University of Wellington campus image: "Victoria University, Wellington, New Zealand, July 2008" by Phillip Capper, licensed under [CC BY 3.0 NZ](https://creativecommons.org/licenses/by/3.0/nz/), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Victoria_University,_Wellington,_New_Zealand,_July_2008.jpg).
