import type { APIRoute } from 'astro';

/**
 * Service worker (PWA). Strategy:
 * - pages: network first, so content is always fresh online; the cached copy (or /offline/) when offline;
 * - /_astro/ files: cache first (their names change with every build, so they never go stale);
 * - everything else on this origin (search index, images, wasm, JSON): stale-while-revalidate.
 * The cache name includes the build time, so each deploy starts clean and old caches are removed.
 */
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const version = `bugwise-${Date.now()}`;
  const js = `const BASE = ${JSON.stringify(base)};
const VERSION = ${JSON.stringify(version)};
const PAGES = VERSION + '-pages';
const ASSETS = VERSION + '-assets';
const MAX_PAGES = 200;
const PRECACHE = [BASE + '/', BASE + '/offline/', BASE + '/manifest.webmanifest', BASE + '/favicon.svg', BASE + '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bugwise-') && !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match(BASE + '/offline/')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit || Response.error());
  return hit || update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE + '/')) return;
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else if (url.pathname.startsWith(BASE + '/_astro/')) event.respondWith(cacheFirst(request));
  else event.respondWith(staleWhileRevalidate(request));
});
`;
  return new Response(js, { headers: { 'Content-Type': 'text/javascript' } });
};
