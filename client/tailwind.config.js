/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Dark Mode (Deep Cobalt & Crisp Gold)
        'navy-base': '#0B1329',
        'navy-surface': '#172554',
        'navy-highlight': '#1E3A8A',
        'gold-primary': '#FACC15',
        'gold-light': '#FEF08A',
        'gold-dark': '#CA8A04',
        'sky-tech': '#38BDF8',
        'ice-blue': '#93C5FD',

        // Paleta Light Mode (Modo Claro Armónico - Hielo & Blanco Perlado)
        'light-base': '#F1F5F9', // Tono hielo / slate descansado para la vista
        'light-surface': '#FFFFFF', // Blanco perlado cálido para tarjetas y modales
        'light-surface-soft': '#F8FAFC', // Slate 50 para fondos sutiles
        'light-border': '#CBD5E1', // Bordes cobalto tenues / slate 300
        'light-border-soft': '#E2E8F0', // Slate 200
        'light-text-primary': '#0F172A', // Slate 900 / cobalto profundo de alto contraste (WCAG AAA)
        'light-text-secondary': '#334155', // Slate 700 para roles y subtítulos
        'light-text-muted': '#64748B', // Slate 500 para timestamps y metadatos
        'light-brand-accent': '#B45309', // Dorado ámbar cálido de alto contraste en modo claro
        'light-brand-gold': '#D97706', // Ámbar 600
        'light-brand-tech': '#0284C7', // Azul técnico nítido para modo claro
      }
    },
  },
  plugins: [],
}
