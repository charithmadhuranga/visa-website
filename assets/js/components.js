/* Lanka Global Access — shared components
 * Usage on any page:
 *   <script>window.SITE_ROOT = './';</script>   ('../' from subfolders)
 *   <div id="site-header"></div>  where the header should appear
 *   <div id="site-footer"></div>  where the footer should appear
 *   <script src="ROOT/assets/js/components.js"></script>
 *   <script src="ROOT/assets/js/site.js"></script>
 */

(function () {
    const ROOT = window.SITE_ROOT || './';

    const SITE = {
        name: 'Lanka Global Access',
        tagline: 'Visa & Immigration Experts',
        phone: '+94 726338989',
        phoneHref: 'tel:+94726338989',
        whatsapp: 'https://wa.me/94726338989?text=Hi%20LankaGlobalAccess%2C%20I%20have%20a%20question%20about%20your%20Visa',
        email: 'admin@lgavisa.com',
        address: '19A Thalapathpitiya Road, Nugegoda, Sri Lanka',
        hours: 'Monday – Sunday: 8:30 AM – 5:30 PM',
    };

    const NAV = [
        { label: 'Home', href: 'index.html' },
        {
            label: 'Who We Are',
            href: 'about/index.html',
            children: [
                { label: 'About Us', href: 'about/index.html', icon: 'fa-user-group' },
                { label: 'Mission & Vision', href: 'about/mission-vision.html', icon: 'fa-bullseye' },
                { label: 'Why Choose Us', href: 'about/why-choose-us.html', icon: 'fa-award' },
                { label: 'Testimonials', href: 'about/testimonials.html', icon: 'fa-quote-left' },
            ],
        },
        {
            label: 'Study Abroad',
            href: 'study-abroad/index.html',
            children: [
                { label: 'Study in Australia', href: 'study-abroad/australia.html', icon: 'fa-earth-oceania' },
                { label: 'Study in Canada', href: 'study-abroad/canada.html', icon: 'fa-leaf' },
                { label: 'Study in UK', href: 'study-abroad/uk.html', icon: 'fa-crown' },
                { label: 'Study in New Zealand', href: 'study-abroad/new-zealand.html', icon: 'fa-mountain-sun' },
                { label: 'Study in USA', href: 'study-abroad/usa.html', icon: 'fa-flag-usa' },
            ],
        },
        {
            label: 'Universities',
            href: 'universities/index.html',
            children: [
                { label: 'All Countries', href: 'universities/index.html', icon: 'fa-globe' },
                { label: 'Australia', href: 'universities/australia.html', icon: 'fa-earth-oceania' },
                { label: 'Canada', href: 'universities/canada.html', icon: 'fa-leaf' },
                { label: 'United Kingdom', href: 'universities/uk.html', icon: 'fa-crown' },
                { label: 'New Zealand', href: 'universities/new-zealand.html', icon: 'fa-mountain-sun' },
                { label: 'USA', href: 'universities/usa.html', icon: 'fa-flag-usa' },
            ],
        },
        {
            label: 'Student Services',
            href: 'services/student-visa.html',
            children: [
                { label: 'Student Visa Services', href: 'services/student-visa.html', icon: 'fa-passport' },
                { label: 'IELTS / PTE Services', href: 'services/ielts-pte.html', icon: 'fa-language' },
            ],
        },
        {
            label: 'Resources',
            href: 'resources/blog.html',
            children: [
                { label: 'Blog', href: 'resources/blog.html', icon: 'fa-newspaper' },
                { label: 'FAQ', href: 'resources/faq.html', icon: 'fa-circle-question' },
            ],
        },
        { label: 'Contact', href: 'contact.html' },
    ];

    function navHref(href) { return ROOT + href; }

    /* ---------- Header ---------- */
    function renderHeader() {
        const mount = document.getElementById('site-header');
        if (!mount) return;

        const here = window.location.pathname.split('/').pop() || 'index.html';

        const desktopNav = NAV.map(item => {
            if (!item.children) {
                return `<a href="${navHref(item.href)}" class="nav-link text-gray-700 hover:text-blue-600 font-medium${item.href === here ? ' active' : ''}">${item.label}</a>`;
            }
            const items = item.children.map(c =>
                `<a href="${navHref(c.href)}"><i class="fas ${c.icon}"></i>${c.label}</a>`
            ).join('');
            return `
                <div class="nav-item">
                    <a href="${navHref(item.href)}" class="nav-link text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                        ${item.label}<i class="fas fa-chevron-down text-[10px] opacity-60"></i>
                    </a>
                    <div class="dropdown-menu">${items}</div>
                </div>`;
        }).join('');

        const mobileNav = NAV.map((item, idx) => {
            if (!item.children) {
                return `<a href="${navHref(item.href)}" class="block text-gray-800 hover:text-blue-600 font-medium text-lg py-3 border-b border-gray-100">${item.label}</a>`;
            }
            const subs = item.children.map(c =>
                `<a href="${navHref(c.href)}" class="block text-gray-600 hover:text-blue-600 text-base py-2 border-b border-gray-50">${c.label}</a>`
            ).join('');
            return `
                <div class="border-b border-gray-100 py-3">
                    <button type="button" class="mobile-accordion-toggle w-full flex items-center justify-between text-gray-800 font-medium text-lg" data-target="msub-${idx}">
                        <span>${item.label}</span><i class="fas fa-chevron-down text-sm opacity-60"></i>
                    </button>
                    <div class="mobile-submenu" id="msub-${idx}">${subs}</div>
                </div>`;
        }).join('');

        mount.innerHTML = `
        <header class="header fixed top-0 left-0 w-full z-50" id="header">
            <nav class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <a href="${navHref('index.html')}" class="flex items-center">
                        <img src="${ROOT}images/logo.png" alt="${SITE.name}" class="h-12 md:h-14" loading="eager">
                        <div class="ml-3">
                            <h1 class="text-xl md:text-2xl font-bold text-gray-800">${SITE.name}</h1>
                            <p class="text-sm text-gray-600">${SITE.tagline}</p>
                        </div>
                    </a>
                    <div class="hidden lg:flex items-center space-x-7">${desktopNav}
                        <a href="${navHref('contact.html')}" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105">Get Started</a>
                    </div>
                    <button class="lg:hidden text-gray-700" id="mobile-menu-btn" aria-label="Open menu">
                        <i class="fas fa-bars text-2xl"></i>
                    </button>
                </div>
            </nav>
            <div class="lg:hidden fixed top-0 left-0 w-full h-screen bg-white shadow-2xl translate-x-full transition-transform duration-300 z-50 overflow-y-auto" id="mobile-menu">
                <div class="flex justify-between items-center p-6 border-b bg-white sticky top-0">
                    <img src="${ROOT}images/logo.png" alt="${SITE.name}" class="h-10">
                    <button id="close-menu" class="text-gray-700 hover:text-blue-600 transition-colors" aria-label="Close menu">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div class="p-6">${mobileNav}
                    <a href="${navHref('contact.html')}" class="block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-full font-medium text-center mt-8">Get Started</a>
                </div>
            </div>
        </header>`;
    }

    /* ---------- Footer ---------- */
    function renderFooter() {
        const mount = document.getElementById('site-footer');
        if (!mount) return;

        mount.innerHTML = `
        <footer class="bg-gray-800 text-white pt-12 pb-8">
            <div class="container mx-auto px-6">
                <div class="grid md:grid-cols-4 gap-8">
                    <div class="md:col-span-1">
                        <div class="flex items-center mb-4">
                            <img src="${ROOT}images/logo.png" alt="${SITE.name}" class="h-10 mr-3 bg-white rounded p-1" loading="lazy">
                            <div>
                                <h3 class="text-xl font-bold">${SITE.name}</h3>
                                <p class="text-gray-400">${SITE.tagline}</p>
                            </div>
                        </div>
                        <p class="text-gray-400 mb-4 text-sm">Your trusted partner in visa and immigration services. We make your global dreams a reality.</p>
                        <div class="flex space-x-3">
                            <a href="#" aria-label="Facebook" class="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" aria-label="Twitter" class="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"><i class="fab fa-twitter"></i></a>
                            <a href="#" aria-label="YouTube" class="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"><i class="fab fa-youtube"></i></a>
                            <a href="#" aria-label="LinkedIn" class="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"><i class="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="${navHref('about/index.html')}" class="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="${navHref('study-abroad/index.html')}" class="hover:text-white transition-colors">Study Abroad</a></li>
                            <li><a href="${navHref('universities/index.html')}" class="hover:text-white transition-colors">Universities</a></li>
                            <li><a href="${navHref('resources/blog.html')}" class="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="${navHref('resources/faq.html')}" class="hover:text-white transition-colors">FAQ</a></li>
                            <li><a href="${navHref('contact.html')}" class="hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="text-lg font-semibold mb-4">Our Services</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="${navHref('services/student-visa.html')}" class="hover:text-white transition-colors">Student Visa Services</a></li>
                            <li><a href="${navHref('services/ielts-pte.html')}" class="hover:text-white transition-colors">IELTS / PTE Preparation</a></li>
                            <li><a href="${navHref('services/student-visa.html')}" class="hover:text-white transition-colors">Visa Consultations</a></li>
                            <li><a href="${navHref('services/student-visa.html')}" class="hover:text-white transition-colors">Application Support</a></li>
                            <li><a href="${navHref('services/ielts-pte.html')}" class="hover:text-white transition-colors">English Test Training</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="text-lg font-semibold mb-4">Contact Info</h4>
                        <ul class="space-y-3 text-gray-400 text-sm">
                            <li class="flex items-start gap-3"><i class="fas fa-map-marker-alt mt-1 text-blue-400"></i><span>${SITE.address}</span></li>
                            <li class="flex items-center gap-3"><i class="fas fa-phone text-blue-400"></i><a href="${SITE.phoneHref}" class="hover:text-white transition-colors">${SITE.phone}</a></li>
                            <li class="flex items-center gap-3"><i class="fas fa-envelope text-blue-400"></i><a href="mailto:${SITE.email}" class="hover:text-white transition-colors">${SITE.email}</a></li>
                            <li class="flex items-center gap-3"><i class="fas fa-clock text-blue-400"></i><span>${SITE.hours}</span></li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-700 mt-8 pt-8 text-center">
                    <p class="text-gray-400">&copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</p>
                </div>
            </div>
        </footer>
        <a href="${SITE.whatsapp}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
            <i class="fab fa-whatsapp text-white text-2xl"></i>
        </a>`;
    }

    renderHeader();
    renderFooter();

    // Expose for site.js / pages
    window.LGA_SITE = SITE;
})();
