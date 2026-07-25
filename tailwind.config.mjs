/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        earth: {
          950: '#101713',
          900: '#16211a',
          800: '#203126',
          700: '#2b4431',
          500: '#75a84b',
          300: '#b8d88c'
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(184, 216, 140, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(184, 216, 140, .06) 1px, transparent 1px)'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        moveearth: {
          primary: '#9bc86a',
          'primary-content': '#172016',
          secondary: '#d8a84e',
          accent: '#7cc5b3',
          neutral: '#243127',
          'base-100': '#101713',
          'base-200': '#16211a',
          'base-300': '#203126',
          'base-content': '#eef5e7'
        }
      }
    ]
  }
};
