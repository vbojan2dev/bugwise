/*
 * Estimates lesson times from the BUILT site. Paste into the browser console on any page of a
 * local preview (npm run build && npm run preview), then copy the printed JSON.
 *
 * Model: reading at 180 words per minute (beginners studying, often in a second language),
 * plus time for interactive parts: Bug Hunt 3 min + 1.5 min per bug, quiz 0.5 min per question,
 * checklist 1 min, galleries 1 min, other demos 2 min, SqlPlayground 15, TestRunSimulator 8.
 * Rounded to whole minutes up to 15, then to the nearest 5.
 * Put the result in the `minutes` frontmatter (lessons: { short, long }; components: a number).
 */
(async () => {
  const W = { SqlPlayground: 15, TestRunSimulator: 8, VariantsGallery: 1, Examples: 1, ChecklistIsland: 1 };
  const round = (m) => (m <= 15 ? Math.max(3, Math.round(m)) : Math.round(m / 5) * 5);
  const base = (document.querySelector('link[rel=sitemap]')?.getAttribute('href') ?? '/sitemap-index.xml').replace(/sitemap-index\.xml$/, '');
  const sm = await (await fetch(base + 'sitemap-0.xml')).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => /\/(fundamentals|tutorials|features|mobile|web|career|components)\/[^/]+\/?$/.test(p));
  const out = {};
  await Promise.all(
    urls.map(async (u) => {
      const doc = new DOMParser().parseFromString(await (await fetch(u)).text(), 'text/html');
      const art = doc.querySelector('article[data-pagefind-body]');
      if (!art) return;
      const calc = (mode) => {
        const a = art.cloneNode(true);
        a.querySelectorAll(mode === 'short' ? '.mode-long' : '.mode-short').forEach((e) => e.remove());
        let inter = 0;
        a.querySelectorAll('[data-bughunt]').forEach((b) => {
          inter += 3 + 1.5 * +(b.querySelector('[data-found]')?.textContent ?? '0/0').split('/')[1];
        });
        a.querySelectorAll('astro-island').forEach((i) => {
          if (i.closest('[data-bughunt]')) return;
          const c = (i.getAttribute('component-url') ?? '').split('/').pop().split('.')[0];
          if (c === 'NewsletterForm') return;
          inter += c === 'QuizIsland' ? 0.5 * ((i.getAttribute('props') ?? '').match(/"q":/g) ?? []).length : (W[c] ?? 2);
        });
        a.querySelectorAll('astro-island,[data-bughunt],.term-tip,script,style,nav,[data-pagefind-ignore],button').forEach((e) => e.remove());
        return round((a.textContent.match(/\S+/g) ?? []).length / 180 + inter);
      };
      out[u] = art.querySelector('.mode-short') ? { short: calc('short'), long: calc('long') } : { single: calc('long') };
    }),
  );
  console.log(JSON.stringify(out, null, 1));
})();
