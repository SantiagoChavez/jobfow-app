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
        // Paleta Dark Mode: Cyber Cyan / Neón Eléctrico (Estilo OpenAI / Docker)
        'navy-base': '#060C1B', // Azul medianoche espacial profundo
        'navy-surface': '#0E172A', // Slate 900 con matiz azul noche para tarjetas y modales
        'navy-highlight': '#1E2B45', // Azul noche intermedio para hovers y bordes de acento
        'gold-primary': '#00E5FF', // Cian Neón hiperbrillante y vibrante (reemplazo del amarillo)
        'gold-light': '#67E8F9', // Cian eléctrico luminoso para hovers
        'gold-dark': '#0284C7', // Azul cian oceánico profundo
        'sky-tech': '#38BDF8', // Celeste técnico
        'ice-blue': '#93C5FD', // Azul hielo suave

        // Mapeo armonizado de escala de acento a gama Cian Neón eléctrico
        amber: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4', // Cian vibrante
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },

        // Paleta Light Mode (Blanco Puro & Azul Eléctrico)
        'light-base': '#F8FAFC',
        'light-surface': '#FFFFFF',
        'light-surface-soft': '#F0F9FF',
        'light-border': '#E2E8F0',
        'light-border-soft': '#F1F5F9',
        'light-text-primary': '#0F172A',
        'light-text-secondary': '#334155',
        'light-text-muted': '#64748B',
        'light-brand-accent': '#0284C7',
        'light-brand-gold': '#0EA5E9',
        'light-brand-tech': '#0284C7',
      }
    },
  },
  plugins: [],
}
