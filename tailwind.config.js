/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 50px rgba(3, 4, 94, 0.12)',
        lift: '0 16px 0 rgba(3, 4, 94, 1), 0 28px 48px rgba(3, 4, 94, 0.22)',
      },
      colors: {
        ortho: {
          navy: '#03045e',
          sky: '#00b4d8',
          teal: '#008080',
          ice: '#caf0f8',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
