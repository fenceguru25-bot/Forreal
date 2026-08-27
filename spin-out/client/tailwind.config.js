/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        violet: '#8B5CF6',
        gold: '#F5C518',
        background: '#0F0F1A',
        card: '#1A1A2E',
        surface: '#16213E'
      },
      boxShadow: {
        glow: '0 0 30px rgba(245, 197, 24, 0.25)'
      }
    }
  },
  plugins: []
};
