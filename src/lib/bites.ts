/**
 * Bites: a short-card review feed.
 *
 * Card state lives in this browser only (localStorage), like the rest of the progress.
 * Scheduling is a small Leitner system: "Got it" moves a card up a box (seen again later),
 * "Again" sends it back to box 0 (seen again soon, even in the same session).
 */

import { load as loadProgress } from './progress';

// ---------- Catalog (built at compile time, served as /bites.json) ----------

export type CardBody =
  | { type: 'quiz'; q: string; options: string[]; answer: number; explain: string }
  | { type: 'truefalse'; statement: string; answer: boolean; explain: string }
  | { type: 'thisorthat'; prompt: string; left: string; right: string; answer: 'left' | 'right'; explain: string }
  | { type: 'spotbug'; screen: string[]; question: string; bug: string; explain: string }
  | { type: 'flip'; front: string; back: string }
  | { type: 'tip'; title: string; text: string }
  | { type: 'term'; term: string; short: string; example?: string; termId: string; category: string }
  | { type: 'interview'; question: string; short: string; questionId: string; level: 'junior' | 'mid' | 'senior' }
  | { type: 'teaser'; teaser: string; minutes?: number };

export interface BiteCard {
  id: string;
  /** Page this card belongs to (progress key), or null for general cards (glossary, interview). */
  page: string | null;
  body: CardBody;
}

export interface BitePage {
  key: string;
  title: string;
  href: string;
  section: string;
  sectionTitle: string;
  accent: string;
  teaser?: string;
  minutes?: number;
}

export interface BitesCatalog {
  /** Pages in roadmap order. */
  pages: BitePage[];
  cards: BiteCard[];
}

// ---------- Card state ----------

const STORAGE_KEY = 'bugwise:bites:v1';
const DAY = 24 * 60 * 60 * 1000;
/** Days until a card is due again, by Leitner box. */
const INTERVALS = [0, 1, 3, 7, 16, 35];

export interface CardState {
  box: number;
  due: number;
  seen: number;
  last: number;
}
export interface BitesState {
  cards: Record<string, CardState>;
  /** Cards answered per day, "YYYY-MM-DD" → count. */
  days: Record<string, number>;
}

const emptyState = (): BitesState => ({ cards: {}, days: {} });

export function loadState(): BitesState {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (s && typeof s === 'object') return { ...emptyState(), ...s };
  } catch {}
  return emptyState();
}

export function saveState(s: BitesState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export const today = () => new Date().toLocaleDateString('en-CA');

/** Records an answer and returns the new state. */
export function grade(state: BitesState, id: string, knewIt: boolean): BitesState {
  const prev = state.cards[id];
  const box = knewIt ? Math.min((prev?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
  const now = Date.now();
  const next: BitesState = {
    cards: { ...state.cards, [id]: { box, due: now + INTERVALS[box] * DAY, seen: (prev?.seen ?? 0) + 1, last: now } },
    days: { ...state.days, [today()]: (state.days[today()] ?? 0) + 1 },
  };
  saveState(next);
  return next;
}

/** Consecutive days (ending today or yesterday) with at least one answered card. */
export function streak(state: BitesState) {
  let n = 0;
  const d = new Date();
  if (!state.days[today()]) d.setDate(d.getDate() - 1);
  while (state.days[d.toLocaleDateString('en-CA')]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- Deck building ----------

export type Mode = 'mix' | 'mine' | 'terms' | 'interview';

/** Glossary categories that make sense for someone who hasn't started yet. */
const BEGINNER_TERM_CATEGORIES = new Set(['process', 'types', 'bugs', 'techniques', 'ui']);

interface Pools {
  review: BiteCard[];
  discover: BiteCard[];
  general: BiteCard[];
}

export function buildPools(catalog: BitesCatalog, mode: Mode): Pools {
  const completed = loadProgress().completed;
  const done = new Set(catalog.pages.filter((p) => completed[p.key]).map((p) => p.key));
  const pageCards = catalog.cards.filter((c) => c.page);
  const terms = catalog.cards.filter((c) => c.body.type === 'term');
  const interview = catalog.cards.filter((c) => c.body.type === 'interview');

  if (mode === 'terms') return { review: [], discover: [], general: terms };
  if (mode === 'interview') return { review: [], discover: [], general: interview };

  const review = pageCards.filter((c) => done.has(c.page!) && c.body.type !== 'teaser');
  if (mode === 'mine') return { review, discover: [], general: [] };

  // Discover: a teaser plus the first two cards of the next pages on the roadmap.
  const hasCards = new Set(pageCards.map((c) => c.page));
  const upcoming = catalog.pages.filter((p) => !done.has(p.key) && hasCards.has(p.key)).slice(0, 4);
  const discover = upcoming.flatMap((p) => {
    const own = shuffle(pageCards.filter((c) => c.page === p.key && c.body.type !== 'teaser'));
    const teaser = pageCards.find((c) => c.page === p.key && c.body.type === 'teaser');
    // Two sample cards of different types give a better taste than the first two (usually flashcards).
    const first = own[0];
    const second = own.find((c) => c.body.type !== first?.body.type);
    return [...(teaser ? [teaser] : []), ...[first, second].filter(Boolean)] as BiteCard[];
  });

  const general =
    done.size === 0
      ? [
          ...terms.filter((c) => c.body.type === 'term' && BEGINNER_TERM_CATEGORIES.has(c.body.category)),
          ...interview.filter((c) => c.body.type === 'interview' && c.body.level === 'junior'),
        ]
      : [...terms, ...interview];

  return { review, discover, general };
}

/** How much of each pool to use, depending on how far the learner is. */
export function poolWeights(completedCount: number, mode: Mode) {
  if (mode !== 'mix') return { review: 1, discover: 1, general: 1 };
  if (completedCount === 0) return { review: 0, discover: 0.5, general: 0.5 };
  if (completedCount < 5) return { review: 0.5, discover: 0.25, general: 0.25 };
  return { review: 0.7, discover: 0.1, general: 0.2 };
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lower is more urgent: due "Again" cards, then unseen cards, then cards that are due, then the rest. */
function urgency(c: BiteCard, state: BitesState, now: number) {
  const s = state.cards[c.id];
  if (c.body.type === 'teaser') return 2 + Math.random();
  if (!s) return 2 + Math.random();
  if (s.box === 0) return 0 + Math.random() * 0.5;
  if (s.due <= now) return 1.5 + Math.random();
  return 10 + (s.due - now) / DAY + Math.random();
}

/**
 * Picks the next batch of cards. Avoids cards already in this session (`exclude`),
 * two cards from the same page in a row, and three cards of the same type in a row.
 */
export function nextBatch(pools: Pools, weights: ReturnType<typeof poolWeights>, state: BitesState, exclude: Set<string>, size = 12, lastPage?: string | null) {
  const now = Date.now();
  const sorted = (Object.keys(pools) as (keyof Pools)[]).map((k) => ({
    key: k,
    weight: weights[k],
    queue: pools[k].filter((c) => !exclude.has(c.id)).sort((a, b) => urgency(a, state, now) - urgency(b, state, now)),
  }));
  const out: BiteCard[] = [];
  let prevPage = lastPage ?? null;
  const recentTypes: string[] = [];
  /** Teasers are signposts, not content: at most 2 per batch and never back to back. */
  let teasers = 0;
  const MAX_TEASERS = 2;

  for (let guard = 0; out.length < size && guard < size * 20; guard++) {
    const available = sorted.filter((p) => p.queue.length && p.weight > 0);
    if (!available.length) break;
    // Weighted random choice of a pool.
    const total = available.reduce((a, p) => a + p.weight, 0);
    let r = Math.random() * total;
    const pool = available.find((p) => (r -= p.weight) <= 0) ?? available[0];

    // First card in this pool that doesn't repeat the page or the type too much.
    const teaserOk = (c: BiteCard) => c.body.type !== 'teaser' || (teasers < MAX_TEASERS && recentTypes.at(-1) !== 'teaser');
    const idx = pool.queue.findIndex(
      (c) =>
        teaserOk(c) &&
        (!c.page || c.page !== prevPage) &&
        c.body.type !== recentTypes.at(-1),
    );
    // Fall back to any card that isn't an excess teaser; if only teasers are left, stop.
    const fallback = pool.queue.findIndex(teaserOk);
    const pick = idx >= 0 ? idx : fallback;
    if (pick < 0) {
      pool.queue.length = 0;
      continue;
    }
    const card = pool.queue.splice(pick, 1)[0];
    if (card.body.type === 'teaser') teasers++;
    out.push(card);
    prevPage = card.page;
    recentTypes.push(card.body.type);
  }
  return out;
}

export function cardsDueCount(catalog: BitesCatalog, state: BitesState) {
  const completed = loadProgress().completed;
  const now = Date.now();
  return catalog.cards.filter(
    (c) => c.page && completed[c.page] && c.body.type !== 'teaser' && (!state.cards[c.id] || state.cards[c.id].due <= now),
  ).length;
}
