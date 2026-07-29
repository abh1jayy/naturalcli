/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0F19',
        slate900: '#111827',
        slate700: '#1F2937',
        accent: '#00FF9D',
        accentBlue: '#00C2FF',
        accentPurple: '#7C3AED',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 40px rgba(0, 194, 255, 0.15)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseSoft: 'pulseSoft 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
