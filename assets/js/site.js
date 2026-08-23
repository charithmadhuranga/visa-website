/* Lanka Global Access — shared page behaviors */

(function () {
    /* AOS */
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 80 });
    }

    /* GSAP + ScrollTrigger extras */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Generic reveal animation
        gsap.utils.toArray('[data-animate]').forEach(el => {
            const delay = parseFloat(el.getAttribute('data-delay')) || 0;
            gsap.from(el, {
                duration: 0.9,
                y: 40,
                opacity: 0,
                delay,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%' }
            });
        });

        // Stat counters (.stat-number[data-target])
        document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            ScrollTrigger.create({
                trigger: counter,
                start: 'top 85%',
                onEnter: () => {
                    let current = 0;
                    const step = target / 60;
                    const suffix = counter.getAttribute('data-suffix') || '';
                    const tick = () => {
                        if (current < target) {
                            current = Math.min(current + step, target);
                            counter.textContent = Math.floor(current) + suffix;
                            requestAnimationFrame(tick);
                        } else {
                            counter.textContent = target + suffix;
                        }
                    };
                    tick();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        /* Loader */
        const loader = document.getElementById('loader');
        if (loader) {
            window.addEventListener('load', () =>
                setTimeout(() => loader.classList.add('hidden'), 300)
            );
            // Safety net: never trap the user behind the loader
            setTimeout(() => loader.classList.add('hidden'), 4000);
        }

        /* Header scrolled state */
        const header = document.getElementById('header');
        const onScroll = () => {
            if (header) header.classList.toggle('scrolled', window.scrollY > 60);
        };
        window.addEventListener('scroll', onScroll);
        onScroll();

        /* Mobile menu */
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        const closeBtn = document.getElementById('close-menu');

        if (btn && menu && closeBtn) {
            const open = () => { menu.classList.remove('translate-x-full'); document.body.style.overflow = 'hidden'; };
            const close = () => { menu.classList.add('translate-x-full'); document.body.style.overflow = ''; };
            btn.addEventListener('click', open);
            closeBtn.addEventListener('click', close);
            menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1280) close();
            });
        }

        /* Mobile accordion submenus */
        document.querySelectorAll('.mobile-accordion-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const target = document.getElementById(toggle.dataset.target);
                if (!target) return;
                const isOpen = target.classList.contains('open');
                document.querySelectorAll('.mobile-submenu.open').forEach(t => t.classList.remove('open'));
                document.querySelectorAll('.mobile-accordion-toggle.open').forEach(t => t.classList.remove('open'));
                if (!isOpen) {
                    target.classList.add('open');
                    toggle.classList.add('open');
                }
            });
        });

        /* Smooth scroll for same-page anchors */
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', e => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
})();
