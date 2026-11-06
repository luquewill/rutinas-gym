/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        card: '#161616',
        line: '#2A2A2A',
        mute: '#A3A3A3',
        accent: '#FF6B00',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
