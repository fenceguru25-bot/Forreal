/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          night: '#070b1a',
          velvet: '#16122f',
          royal: '#271552',
          gold: '#d6a64c',
          mint: '#37d6b5',
        },
      },
      boxShadow: {
        glow: '0 0 30px rgba(214, 166, 76, 0.15)',
      },
      backgroundImage: {
        'casino-radial': 'radial-gradient(circle at top, rgba(39,21,82,0.85), rgba(7,11,26,1) 55%)',
      },
    },
  },
  plugins: [],
};
