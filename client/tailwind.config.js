/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-base': '#0B1329',
        'navy-surface': '#172554',
        'navy-highlight': '#1E3A8A',
        'gold-primary': '#FACC15',
        'gold-light': '#FEF08A',
        'gold-dark': '#CA8A04',
        'sky-tech': '#38BDF8',
        'ice-blue': '#93C5FD'
      }
    },
  },
  plugins: [],
}
