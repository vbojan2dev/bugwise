import { getCollection } from 'astro:content';
import { getNav, getLessons } from '@/lib/content';
import { getSection } from '@/data/site';
import type { BiteCard, BitePage, BitesCatalog } from '@/lib/bites';

/** The Bites catalog, generated at build time and fetched by the feed. */
export async function GET() {
  const nav = await getNav();
  const [cardFiles, glossary, interview, lessons] = await Promise.all([
    getCollection('cards'),
    getCollection('glossary'),
    getCollection('interview'),
    getLessons(),
  ]);
  const files = new Map(cardFiles.map((f) => [f.id, f.data]));
  const lessonMinutes = new Map(lessons.map((l) => [l.id, l.data.minutes.short]));

  const pages: BitePage[] = nav.flatMap((g) =>
    g.items.map((i) => {
      const key = i.href.slice(1);
      const section = getSection(g.id);
      return {
        key,
        title: i.title,
        href: i.href,
        section: g.id,
        sectionTitle: section.short,
        accent: section.accent,
        teaser: files.get(key)?.teaser,
        minutes: lessonMinutes.get(key),
      };
    }),
  );

  const cards: BiteCard[] = [];
  for (const p of pages) {
    const file = files.get(p.key);
    if (!file) continue;
    if (file.teaser) cards.push({ id: `${p.key}#teaser`, page: p.key, body: { type: 'teaser', teaser: file.teaser, minutes: p.minutes } });
    file.cards.forEach((c, i) => cards.push({ id: `${p.key}#${i}`, page: p.key, body: c as BiteCard['body'] }));
  }
  for (const t of glossary) {
    cards.push({
      id: `term:${t.id}`,
      page: null,
      body: { type: 'term', term: t.data.term, short: t.data.short, example: t.data.example, termId: t.id, category: t.data.category },
    });
  }
  for (const q of interview) {
    cards.push({ id: `iv:${q.id}`, page: null, body: { type: 'interview', question: q.data.question, short: q.data.short, questionId: q.id, level: q.data.level } });
  }

  const catalog: BitesCatalog = { pages, cards };
  return new Response(JSON.stringify(catalog), { headers: { 'Content-Type': 'application/json' } });
}
