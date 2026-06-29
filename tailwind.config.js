/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1C1C1E',
          secondary: '#2C2C2E',
          divider: '#3A3A3C',
          text: '#FFFFFF',
          'text-secondary': '#8E8E93',
        },
        brand: {
          purple: '#7B61FF',
          'purple-alt': '#6C47FF',
        },
        status: {
          success: '#30D158',
          cancelled: '#636366',
          interactive: '#0A84FF',
        },
      },
      backgroundColor: {
        dark: '#1C1C1E',
        'dark-secondary': '#2C2C2E',
      },
      textColor: {
        dark: '#FFFFFF',
        'dark-secondary': '#8E8E93',
      },
      borderRadius: {
        card: '12px',
        pill: '6px',
      },
    },
  },
  plugins: [],
};
