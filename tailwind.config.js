// tailwind.config.js

const forms = require('@tailwindcss/forms');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        light: '#FFFCF2',        // page/card highlights
        dark: '#000022',         // primary background
        primary: '#2978A0',      // blue accent (active icons, links)
        secondary: '#720026',    // red accent (buttons, errors)
        accent: '#A28F9D',       // muted highlight
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #000022 0%, #2978A0 100%)',
      },
      backdropBlur: { DEFAULT: '8px', lg: '16px' },
      borderRadius: { xl: '1rem' },
    },
  },
  plugins: [forms()],
};
