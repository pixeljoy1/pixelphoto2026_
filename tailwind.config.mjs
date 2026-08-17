/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        paper: 'var(--paper)',
        rule: 'var(--rule)',
        muted: 'var(--muted)',
        signal: 'var(--signal)',
      },
      fontFamily: {
        display: ['"Sora Variable"', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        menu: 'var(--t-menu)',
        h1: 'var(--t-h1)',
        h2: 'var(--t-h2)',
        meta: 'var(--t-meta)',
      },
      letterSpacing: {
        menu: '-0.03em',
        meta: '0.06em',
      },
    },
  },
  plugins: [],
};
