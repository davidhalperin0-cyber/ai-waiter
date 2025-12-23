import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bar: {
          bg: '#050816',
          accent: '#facc15',
        },
        pizza: {
          bg: '#fff7ed',
          accent: '#ea580c',
        },
        sushi: {
          bg: '#e0f2fe',
          accent: '#0ea5e9',
        },
      },
    },
  },
  plugins: [],
};

export default config;

