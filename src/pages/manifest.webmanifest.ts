import type { APIRoute } from 'astro';
import { site } from '@/data/site';

/** Web app manifest: makes the site installable (PWA). Paths respect the base path. */
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const manifest = {
    id: `${base}/`,
    name: `${site.name}: ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#0a0b11',
    theme_color: '#5b4bff',
    lang: 'en',
    categories: ['education', 'productivity'],
    icons: [
      { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}/icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${base}/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Bites: quick review', url: `${base}/bites/`, icons: [{ src: `${base}/icon-192.png`, sizes: '192x192' }] },
      { name: 'Your progress', url: `${base}/progress/`, icons: [{ src: `${base}/icon-192.png`, sizes: '192x192' }] },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
};
