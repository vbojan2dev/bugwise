// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBaseLinks } from './src/lib/rehype-base-links.mjs';

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/.
// The deploy workflow sets SITE_URL and BASE_PATH; locally both fall back to root.
const site = process.env.SITE_URL || 'http://localhost:4321';
const rawBase = process.env.BASE_PATH || '/';
const base = rawBase.endsWith('.github.io') ? '/' : rawBase;

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/subscribed') })],
  markdown: {
    rehypePlugins: [[rehypeBaseLinks, { base }]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
