import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zola: {
          ink: '#1f2933',
          panel: '#f7f8f5',
          line: '#d8d8cf',
          accent: '#006f8f',
        },
      },
      boxShadow: {
        mapPanel: '0 10px 28px rgb(31 41 51 / 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
