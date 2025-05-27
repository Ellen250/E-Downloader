/**  @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
        },
        dark: {
          600: 'var(--dark-600)',
          700: 'var(--dark-700)',
          800: 'var(--dark-800)',
        },
      },
    },
  },
  plugins: [],
};
  