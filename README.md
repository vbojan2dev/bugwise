# Bugwise

A modern learning site for aspiring **manual QA testers**, focused on mobile apps and websites:
testing fundamentals, interactive UI component guides with bug hunts, tutorials with quick and detailed versions,
a glossary with tooltips everywhere, and interview prep with flashcards.

Built with [Astro](https://astro.build) + MDX, React (for interactive demos), Tailwind CSS and [Pagefind](https://pagefind.app) (search).

## Run it locally

Requires Node.js 22.12+.

```bash
npm install
npm run dev        # http://localhost:4321, live reload
```

Search only works on a production build:

```bash
npm run build && npm run preview
```

## Deployment (Cloudflare Workers)

The live site is **https://bugwise.kairoom.dev**.

- Cloudflare builds and deploys on every push to `main`: build command `npm run build`, deploy command `npx wrangler deploy` (config in `wrangler.jsonc`, which serves `dist/` with the site's 404 page).
- Build variables in Cloudflare (**Workers & Pages → bugwise → Settings → Build**): `SITE_URL=https://bugwise.kairoom.dev` and `NODE_VERSION=22`. `SITE_URL` drives canonical links, the sitemap, robots.txt and social previews; after changing it, redeploy.
- Rollback: **Deployments** → pick an earlier version.
- The site can also run under a base path (`BASE_PATH=/something`), which is why internal links go through `href()`.

## Adding content

See **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)** for formats and every available MDX component,
and `templates/` for copy-paste starters.

| What | Where |
| --- | --- |
| Lessons | `src/content/lessons/<section>/*.mdx` |
| UI components | `src/content/components/*.mdx` + demos in `src/components/demos/<name>/` |
| Glossary | `src/content/glossary.yaml` |
| Interview questions | `src/content/interview/*.md` |
| Sections, planned topics, site name | `src/data/site.ts` |

## Learning progress

Progress is saved **in the visitor's browser** (`localStorage`), so there are no accounts and no backend.
Pages are marked complete with the button at the bottom of each lesson, or automatically when a quiz is passed (≥ 60%).
Bug hunt findings and checklists are remembered too. The **/progress** page shows an overview and lets visitors
export their progress (file or `BW1.…` code) and import it on another device. Logic lives in `src/lib/progress.ts`.

## Project structure

```
src/
  components/
    demos/        interactive React demos (per component) + shared PhoneFrame
    islands/      reusable React islands: Checklist, Quiz, Flashcards
    layout/       Header, Sidebar, TOC, Search, Footer, lesson mode toggle
    mdx/          components available in every MDX file (Callout, Term, TestCases…)
    ui/           Icon and page-building pieces
  content/        all content (see above)
  data/site.ts    site name, sections, planned topics
  layouts/        BaseLayout (page shell), DocsLayout (3-column lesson layout)
  lib/            content helpers, base-aware URLs, rehype plugin
  pages/          routes
  styles/         design tokens, prose and global styles
```

## License

- **Content** (lessons, components pages, glossary, interview questions, cards and the exercises in demos): [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Share and adapt with credit, not for commercial use.
- **Code**: MIT.

See [LICENSE](LICENSE) for details.
