import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// GitHub Pages project site lives at https://pixeljoy1.github.io/pixelPhoto2026_/
export default defineConfig({
  site: 'https://pixeljoy1.github.io',
  base: '/pixelPhoto2026_',
  trailingSlash: 'ignore',
  integrations: [tailwind({ applyBaseStyles: false })],
  build: {
    inlineStylesheets: 'auto',
  },
});
