import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://rusklabo.github.io/moveearth-web',
  base: '/moveearth-web'
});
