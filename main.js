// Modern JavaScript for Lanka Global Access Website
// Advanced animations, smooth scrolling, and interactive features

class LankaGlobalAccess {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupScrollEffects();
        this.setupMobileMenu();
        this.setupCounters();
        this.setupParallax();
        this.setupSmoothScrolling();
        this.setupLoadingScreen();
    }

    setupEventListeners() {
        // Header scroll effect
        window.addEventListener('scroll', () => this.handleHeaderScroll());
        
        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });
    }

    initializeAnimations() {
        // Initialize AOS (Animate On Scroll)
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100,
                easing: 'ease-out-cubic'
            });
        }

        // GSAP Animations
        this.setupGSAPAnimations();
    }

    setupGSAPAnimations() {
        // Register GSAP plugins
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);

            // Hero section animations
            this.animateHeroSection();
            
            // Service cards stagger animation
            this.animateServiceCards();
            
            // Stats counter animation
            this.animateStats();
            
            // Floating shapes animation
            this.animateFloatingShapes();
        }
    }

    animateHeroSection() {
        const tl = gsap.timeline();
        
        tl.from('.hero-title', {
            duration: 1.5,
            y: 100,
            opacity: 0,
            ease: "power2.out"
        })
        .from('.hero-subtitle', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: "power2.out"
        }, "-=0.5")
        .from('.hero-buttons', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: "power2.out"
        }, "-=0.5");
    }

    animateServiceCards() {
        gsap.from('.service-card', {
            duration: 1,
            y: 50,
            opacity: 0,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '#services',
                start: "top 80%"
            }
        });
    }

    animateStats() {
        const counters = document.querySelectorAll('.stat-card .text-4xl');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            const increment = target / 100;
            
            ScrollTrigger.create({
                trigger: counter,
                start: "top 80%",
                onEnter: () => {
                    let current = 0;
                    const updateCounter = () => {
                        if (current < target) {
                            current += increment;
                            counter.textContent = Math.ceil(current) + 
                                (counter.textContent.includes('+') ? '+' : '') + 
                                (counter.textContent.includes('%') ? '%' : '') + 
                                (counter.textContent.includes('/') ? '/7' : '');
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target + 
                                (counter.textContent.includes('+') ? '+' : '') + 
                                (counter.textContent.includes('%') ? '%' : '') + 
                                (counter.textContent.includes('/') ? '/7' : '');
                        }
                    };
                    updateCounter();
                }
            });
        });
    }

    animateFloatingShapes() {
        gsap.from('.floating-shapes .shape', {
            duration: 2,
            scale: 0,
            opacity: 0,
            stagger: 0.2,
            ease: "back.out(1.7)"
        });
    }

    setupScrollEffects() {
        // Parallax effect for hero section
        gsap.to('.floating-shapes', {
            yPercent: -50,
            ease: "none",
            scrollTrigger: {
                trigger: '.hero-section',
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });

        // Header background effect
        ScrollTrigger.create({
            trigger: "body",
            start: "top top",
            onEnter: () => document.getElementById('header').classList.add('scrolled'),
            onLeaveBack: () => document.getElementById('header').classList.remove('scrolled'),
            toggleActions: "play none none reverse"
        });
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeMenu = document.getElementById('close-menu');

        if (mobileMenuBtn && mobileMenu && closeMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('translate-x-full');
                document.body.style.overflow = 'hidden';
            });

            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
                document.body.style.overflow = 'auto';
            });

            // Close menu when clicking on links
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('translate-x-full');
                    document.body.style.overflow = 'auto';
                });
            });
        }
    }

    setupCounters() {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.counter').forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    }

    setupParallax() {
        // Parallax effect for background elements
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax');
            
            parallaxElements.forEach(element => {
                const speed = element.getAttribute('data-speed') || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    setupSmoothScrolling() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(window, {
                            duration: 1,
                            scrollTo: target,
                            ease: "power2.inOut"
                        });
                    } else {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    setupLoadingScreen() {
        // Hide loading screen when page is fully loaded
        window.addEventListener('load', () => {
            const loader = document.getElementById('loader');
            if (loader) {
                setTimeout(() => {
                    loader.classList.add('hidden');
                    // Trigger initial animations after loading
                    this.triggerInitialAnimations();
                }, 500);
            }
        });
    }

    triggerInitialAnimations() {
        // Add visible class to elements for initial animations
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(element => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(element);
        });
    }

    handleHeaderScroll() {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    handleResize() {
        // Handle responsive behavior
        this.updateMobileMenu();
        this.updateParallax();
    }

    updateMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (window.innerWidth > 1024 && mobileMenu) {
            mobileMenu.classList.add('translate-x-full');
            document.body.style.overflow = 'auto';
        }
    }

    updateParallax() {
        // Update parallax elements on resize
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            element.style.transform = 'translateY(0px)';
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        // Add loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Simulate form submission (replace with actual form handling)
        setTimeout(() => {
            submitBtn.textContent = 'Sent Successfully!';
            submitBtn.style.background = '#10b981';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
                e.target.reset();
            }, 2000);
        }, 1500);
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LankaGlobalAccess();
});

// Additional utility functions
const Utils = {
    // Smooth scroll to element
    scrollToElement: (element, duration = 1000) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(window, {
                duration: duration / 1000,
                scrollTo: element,
                ease: "power2.inOut"
            });
        } else {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    // Format numbers with commas
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Check if element is in viewport
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Add loading state to button
    addLoadingState: (button, text = 'Loading...') => {
        const originalText = button.textContent;
        button.textContent = text;
        button.disabled = true;
        return () => {
            button.textContent = originalText;
            button.disabled = false;
        };
    },

    // Show notification
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LankaGlobalAccess, Utils };
}
