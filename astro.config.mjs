// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBaseLinks } from './src/lib/rehype-base-links.mjs';

// Cloudflare sets SITE_URL at build time; BASE_PATH is only for builds under a sub-path. Defaults: production URL, root path.
const site = process.env.SITE_URL || 'https://bugwise.kairoom.dev';
const rawBase = process.env.BASE_PATH || '/';
const base = rawBase.endsWith('.github.io') ? '/' : rawBase;

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/subscribed') && !page.includes('/offline') })],
  markdown: {
    rehypePlugins: [[rehypeBaseLinks, { base }]],
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
