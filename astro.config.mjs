import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// GitHub Pages project site lives at https://pixeljoy1.github.io/pixelphoto2026_/
// (GitHub lowercases the repo segment in Pages URLs — do not use mixed case here.)
export default defineConfig({
  site: 'https://pixeljoy1.github.io',
  base: '/pixelphoto2026_',
  trailingSlash: 'ignore',
  integrations: [tailwind({ applyBaseStyles: false })],
  build: {
    inlineStylesheets: 'auto',
  },
});
