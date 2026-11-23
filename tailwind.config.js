/* Tailwind build for the whole site (replaces the cdn.tailwindcss.com runtime).
 * `npm run css` scans every page and script for class names and writes
 * assets/css/tailwind.css. Classes built dynamically in JS must appear as
 * complete strings somewhere in the scanned files. */
module.exports = {
  content: [
    './*.html',
    './{about,resources,services,study-abroad,universities}/**/*.html',
    './assets/js/**/*.js',
    '!./assets/js/data/**',
    './scripts/generate-*.js',
  ],
  theme: {
    // `container` keeps growing on large screens instead of stopping at 1536px.
    container: {
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px', '3xl': '1760px', '4xl': '2000px' },
    },
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F3A', 700: '#16305A', 900: '#081527' },
        gold: { DEFAULT: '#C9A45C', light: '#E3C88A', dark: '#A9813F', deep: '#8A6A32' },
        mist: '#F5F6F8',
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
