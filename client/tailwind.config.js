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
        // Paleta Dark Mode (Executive Slate & Warm Champagne Gold - Calma, Orden y Contraste Profesional)
        'navy-base': '#0B1120', // Midnight slate profundo, suave a la vista
        'navy-surface': '#1E293B', // Slate 800 elegante para tarjetas y modales
        'navy-highlight': '#334155', // Slate 700 para hovers y bordes interactivos
        'gold-primary': '#F59E0B', // Ámbar dorado cálido (elegante, sin estridencias)
        'gold-light': '#FDE68A', // Ámbar pastel 200
        'gold-dark': '#D97706', // Ámbar profundo 600
        'sky-tech': '#38BDF8', // Sky 400 técnico
        'ice-blue': '#93C5FD', // Ice blue suave

        // Paleta Light Mode (Modo Claro Ejecutivo - Blanco Puro & Slate Suave)
        'light-base': '#F8FAFC', // Slate 50 descansado para el fondo
        'light-surface': '#FFFFFF', // Blanco puro para tarjetas
        'light-surface-soft': '#F1F5F9', // Slate 100 para contenedores secundarios
        'light-border': '#E2E8F0', // Slate 200 para bordes nítidos
        'light-border-soft': '#F1F5F9', // Slate 100 suave
        'light-text-primary': '#0F172A', // Slate 900 de alto contraste
        'light-text-secondary': '#334155', // Slate 700 para subtítulos
        'light-text-muted': '#64748B', // Slate 500 para metadatos
        'light-brand-accent': '#D97706', // Ámbar cálido de alto contraste
        'light-brand-gold': '#F59E0B', // Ámbar dorado 500
        'light-brand-tech': '#0284C7', // Azul cielo 600 nítido
      }
    },
  },
  plugins: [],
}
