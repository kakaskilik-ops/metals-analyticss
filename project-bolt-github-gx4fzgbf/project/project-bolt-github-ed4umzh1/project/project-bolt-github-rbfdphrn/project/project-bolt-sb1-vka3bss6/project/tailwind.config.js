/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#090B0E',
          900: '#11151A',
          850: '#161B22',
          800: '#1C222B',
          700: '#27303B',
          600: '#3A4453',
          500: '#5B6675',
          400: '#8A94A3',
          300: '#B4BCC7',
          200: '#D6DBE2',
          100: '#EEF1F5',
        },
        brand: {
          400: '#33D69B',
          500: '#00C781',
          600: '#00A76E',
        },
        loss: {
          400: '#F57A84',
          500: '#F04452',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease-out both',
        'fade-in': 'fadeIn 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
