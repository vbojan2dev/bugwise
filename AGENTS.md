## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project notes

- Content formats and the MDX components available without imports: see `CONTENT_GUIDE.md`.
- Internal links in `.astro`/`.tsx` must go through `href()` from `src/lib/url.ts` (the site can be built under a base path via `BASE_PATH`; production is https://bugwise.kairoom.dev on Cloudflare, see README). Root-relative links in Markdown/MDX are prefixed automatically.
- `<Term id>` must exist in `src/content/glossary.yaml`, otherwise the build fails.
- Every glossary term has its own page (`/glossary/<id>`, `src/pages/glossary/[id].astro`) and so does every interview question (`/interview/<id>`). Link to those pages, not to `#anchors` on the list pages.
- SEO: pass structured data to `BaseLayout` via `jsonLd` (helpers in `src/lib/seo.ts`); meta descriptions are trimmed to ~160 characters automatically. Utility pages that shouldn't be in search use `noindex`.
- Interactive React components used from MDX via the global map need an `.astro` wrapper with a `client:*` directive (see `src/components/mdx/Quiz.astro`).
- Learning progress is client-side only (`src/lib/progress.ts`, key `bugwise:progress:v1`). Page keys are paths without the base and slashes (e.g. `components/button`). Static markup opts in with `data-progress-key` / `data-progress-keys`; `ProgressMarks.astro` fills them in.
- Bites feed: cards in `src/content/cards/<page-key>.yaml`, catalog built by `src/pages/bites.json.ts`, scheduling and deck logic in `src/lib/bites.ts` (localStorage key `bugwise:bites:v1`, included in progress export/import), UI in `src/components/islands/BitesFeed.tsx`. Every new page should get a card file.
- Lesson times (`minutes` in frontmatter) are measured, not guessed: run `scripts/estimate-minutes.js` in the browser console on a local preview and copy the values (180 words/min plus time for quizzes, demos and Bug Hunts).
- Developer-only background (framework/API names like UISearchBar, SwiftUI modifiers, `imeOptions`, HTML attributes) goes in `<DevNote>…</DevNote>` (or `<DevNote title="…">` for a longer block; `<Callout type="dev">` renders the same). It shows as a small collapsed "Dev note" chip. Keep the tester-facing sentence outside it: what the user sees and what to check.
- PWA: `src/pages/manifest.webmanifest.ts` and `src/pages/sw.js.ts` (service worker: pages network-first with offline fallback to `/offline/`, `/_astro/` cache-first, the rest stale-while-revalidate; the cache name changes every build). Registered in `BaseLayout.astro` in production builds only. Install button: `src/components/islands/InstallApp.tsx`. Icons come from `scripts/make-brand-images.mjs`.
