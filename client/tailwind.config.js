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
        // Paleta Dark Mode: Plata y Plomo sobre Fondo Azul
        'navy-base': '#091024', // Fondo azul noche profundo (preservado para contraste y futuras imágenes)
        'navy-surface': '#161C24', // Gris plomo profundo (gunmetal) para tarjetas, columnas y modales
        'navy-highlight': '#262F3D', // Gris plomo intermedio para hovers, bordes y separadores
        'gold-primary': '#E2E8F0', // Gris plata platino brillante (reemplazo del amarillo oro)
        'gold-light': '#FFFFFF', // Plata pulida resplandeciente para hovers
        'gold-dark': '#94A3B8', // Plata grafito satinado para contrastes
        'sky-tech': '#38BDF8', // Se mantiene (tags técnicos / radar)
        'ice-blue': '#93C5FD', // Se mantiene

        // Mapeo armonizado de escala de acento (antes ámbar) a gama plata/plomo
        amber: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // Plata plomo de acento
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // Paleta Light Mode (Blanco Puro & Gris Plomo Ejecutivo)
        'light-base': '#F8FAFC',
        'light-surface': '#FFFFFF',
        'light-surface-soft': '#F1F5F9',
        'light-border': '#E2E8F0',
        'light-border-soft': '#F1F5F9',
        'light-text-primary': '#0F172A',
        'light-text-secondary': '#334155',
        'light-text-muted': '#64748B',
        'light-brand-accent': '#475569',
        'light-brand-gold': '#64748B',
        'light-brand-tech': '#0284C7',
      }
    },
  },
  plugins: [],
}
