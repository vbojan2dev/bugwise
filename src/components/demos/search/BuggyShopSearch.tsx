import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Star, RotateCcw, CookingPot, Sofa, Tent, Headphones, Loader2, SlidersHorizontal } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken shop search page. Bugs (don't spoil them for learners!):
 *  1. Race condition: no debounce, every keystroke sends a request, and short queries are slower,
 *     so an older response ("m") can arrive last and overwrite the newest one ("mug").
 *  2. Search does not ignore diacritics: "cafe" does not find "Café…" and "café" does not find "Cafe…".
 *  3. The results count ignores the "4★ & up" filter, so it doesn't match the items shown.
 *  4. "Clear all" resets the chips (UI) but not the filters that are actually applied to the results.
 *  5. Sorting by price compares prices as text: $100 comes before $12.50 and $8.99 is near the end.
 *  6. No empty state: when nothing matches, a spinner ("Searching…") spins forever.
 * Everything else (case-insensitive matching, rating/newest sort, highlighting, clear button,
 * Enter key, chips toggling, network log) works as intended.
 */

type Category = 'Kitchen' | 'Home' | 'Outdoor' | 'Tech';

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  category: Category;
  inStock: boolean;
  /** Days since the product was added (smaller = newer). */
  added: number;
}

const products: Product[] = [
  { id: 1, name: 'Stoneware Coffee Mug', price: 12.5, rating: 4.6, category: 'Kitchen', inStock: true, added: 40 },
  { id: 2, name: 'Café Espresso Beans 1 kg', price: 24.99, rating: 4.8, category: 'Kitchen', inStock: true, added: 12 },
  { id: 3, name: 'Cafe Bistro Chair', price: 129, rating: 4.1, category: 'Home', inStock: true, added: 75 },
  { id: 4, name: 'Travel Mug with Lid', price: 19, rating: 4.3, category: 'Outdoor', inStock: false, added: 8 },
  { id: 5, name: 'Linen Table Lamp', price: 64, rating: 3.9, category: 'Home', inStock: true, added: 30 },
  { id: 6, name: 'Camping Lantern', price: 39, rating: 4.5, category: 'Outdoor', inStock: true, added: 21 },
  { id: 7, name: 'Wireless Earbuds', price: 89, rating: 4.2, category: 'Tech', inStock: true, added: 3 },
  { id: 8, name: 'Crème Brûlée Torch', price: 32, rating: 4.0, category: 'Kitchen', inStock: true, added: 55 },
  { id: 9, name: 'Wool Throw Blanket', price: 45, rating: 4.7, category: 'Home', inStock: true, added: 15 },
  { id: 10, name: 'Two-Person Tent', price: 249, rating: 4.4, category: 'Outdoor', inStock: true, added: 90 },
  { id: 11, name: 'USB-C Charging Cable', price: 9.99, rating: 3.6, category: 'Tech', inStock: true, added: 60 },
  { id: 12, name: 'Ceramic Mug Set (4)', price: 100, rating: 4.9, category: 'Kitchen', inStock: true, added: 5 },
  { id: 13, name: 'Scented Candle', price: 8.99, rating: 4.1, category: 'Home', inStock: false, added: 25 },
  { id: 14, name: 'Bluetooth Speaker', price: 110, rating: 4.6, category: 'Tech', inStock: true, added: 18 },
  { id: 15, name: 'Insulated Water Bottle', price: 18, rating: 4.4, category: 'Outdoor', inStock: true, added: 33 },
  { id: 16, name: 'Silicone Spatula', price: 5.49, rating: 3.8, category: 'Kitchen', inStock: true, added: 70 },
  { id: 17, name: 'Desk Lamp with USB Port', price: 15, rating: 4.0, category: 'Tech', inStock: true, added: 10 },
  { id: 18, name: 'Pour-Over Coffee Maker', price: 7.5, rating: 4.3, category: 'Kitchen', inStock: true, added: 48 },
];

const categories: { name: Category; icon: typeof CookingPot; tint: string; fg: string }[] = [
  { name: 'Kitchen', icon: CookingPot, tint: '#fff1e6', fg: '#c2410c' },
  { name: 'Home', icon: Sofa, tint: '#eef2ff', fg: '#4338ca' },
  { name: 'Outdoor', icon: Tent, tint: '#e9f8ef', fg: '#15803d' },
  { name: 'Tech', icon: Headphones, tint: '#e8f4fd', fg: '#0369a1' },
];

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

interface Filters {
  cats: Category[];
  inStock: boolean;
  topRated: boolean;
}
const noFilters: Filters = { cats: [], inStock: false, topRated: false };

interface LogEntry {
  id: number;
  q: string;
  ms: number;
  done: boolean;
  count: number;
}

/** "Server" search: case-insensitive, but BUG 2: no diacritics folding (no normalize/NFD). */
const serverSearch = (q: string) => {
  const term = q.trim().toLowerCase();
  return term ? products.filter((p) => p.name.toLowerCase().includes(term)) : products;
};

/** BUG 1: shorter queries are slower, which makes out-of-order responses easy to trigger. */
const latencyFor = (q: string) => (q.trim().length === 0 ? 300 : Math.max(250, 1300 - 280 * q.trim().length));

const money = (n: number) => `$${n.toFixed(2)}`;

function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim().toLowerCase();
  const i = t ? text.toLowerCase().indexOf(t) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-[#fde68a] px-0.5 text-inherit">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
}

export function BuggyShopSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>(products);
  const [resultsFor, setResultsFor] = useState('');
  const [pending, setPending] = useState(0);
  const [chips, setChips] = useState<Filters>(noFilters); // what the UI shows
  const [applied, setApplied] = useState<Filters>(noFilters); // what is actually applied
  const [sort, setSort] = useState<SortKey>('relevance');
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const search = (q: string) => {
    const id = nextId.current++;
    const ms = latencyFor(q);
    const found = serverSearch(q);
    setPending((n) => n + 1);
    setLog((l) => [{ id, q: q.trim(), ms, done: false, count: found.length }, ...l].slice(0, 7));
    timers.current.push(
      window.setTimeout(() => {
        // BUG 1: no check that this response belongs to the latest request
        setResults(found);
        setResultsFor(q);
        setPending((n) => n - 1);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, done: true } : e)));
      }, ms),
    );
  };

  const onType = (v: string) => {
    setQuery(v);
    search(v); // BUG 1: no debounce
  };

  const update = (fn: (f: Filters) => Filters) => {
    const next = fn(chips);
    setChips(next);
    setApplied(next);
  };
  const toggleCat = (c: Category) => update((f) => ({ ...f, cats: f.cats.includes(c) ? f.cats.filter((x) => x !== c) : [...f.cats, c] }));
  const clearAll = () => setChips(noFilters); // BUG 4: `applied` is left untouched

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setQuery('');
    setResults(products);
    setResultsFor('');
    setPending(0);
    setChips(noFilters);
    setApplied(noFilters);
    setSort('relevance');
    setLog([]);
  };

  const { shown, countBase } = useMemo(() => {
    const base = results.filter((p) => (applied.cats.length === 0 || applied.cats.includes(p.category)) && (!applied.inStock || p.inStock));
    const filtered = base.filter((p) => !applied.topRated || p.rating >= 4);
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => String(a.price).localeCompare(String(b.price))); // BUG 5
    if (sort === 'price-desc') sorted.sort((a, b) => String(b.price).localeCompare(String(a.price))); // BUG 5
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') sorted.sort((a, b) => a.added - b.added);
    return { shown: sorted, countBase: base }; // BUG 3: count uses `base` (before the rating filter)
  }, [results, applied, sort]);

  const activeCount = chips.cats.length + (chips.inStock ? 1 : 0) + (chips.topRated ? 1 : 0);
  const loading = pending > 0;
  const url = (() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (chips.cats.length) p.set('cat', chips.cats.join(',').toLowerCase());
    if (chips.inStock) p.set('stock', '1');
    if (chips.topRated) p.set('rating', '4');
    if (sort !== 'relevance') p.set('sort', sort);
    const s = p.toString();
    return `nookandco.shop/search${s ? `?${s}` : ''}`;
  })();

  const chipCls = (on: boolean) =>
    `inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb] ${
      on ? 'border-[#1e293b] bg-[#1e293b] text-white' : 'border-[#d4d7e1] bg-white text-[#334155] hover:bg-[#f1f5f9]'
    }`;

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-4 [contain:inline-size]">
      <BrowserFrame url={url}>
        <div className="bg-white px-3 pt-3 pb-2 text-[#0f172a] sm:px-4">
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-bold tracking-tight">
              Nook <span className="text-[#c2410c]">&amp;</span> Co.
            </p>
            <span className="text-[11px] text-[#64748b]">Home goods &amp; more</span>
          </div>

          <form
            role="search"
            className="relative mt-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              search(query);
            }}
          >
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={query}
              onChange={(e) => onType(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              autoComplete="off"
              enterKeyHint="search"
              className="h-10 w-full rounded-xl border border-[#d4d7e1] bg-[#f8fafc] pr-9 pl-9 text-[14px] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onType('')}
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-[#cbd5e1] text-white hover:bg-[#94a3b8]"
              >
                <X size={13} strokeWidth={3} />
              </button>
            )}
          </form>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filters">
            <span className="mr-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#334155]">
              <SlidersHorizontal size={13} /> Filters
              {activeCount > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#c2410c] px-1 text-[10px] text-white">{activeCount}</span>}
            </span>
            {categories.map((c) => (
              <button key={c.name} type="button" aria-pressed={chips.cats.includes(c.name)} onClick={() => toggleCat(c.name)} className={chipCls(chips.cats.includes(c.name))}>
                {c.name}
              </button>
            ))}
            <button type="button" aria-pressed={chips.inStock} onClick={() => update((f) => ({ ...f, inStock: !f.inStock }))} className={chipCls(chips.inStock)}>
              In stock
            </button>
            <button type="button" aria-pressed={chips.topRated} onClick={() => update((f) => ({ ...f, topRated: !f.topRated }))} className={chipCls(chips.topRated)}>
              4<Star size={11} className="-mx-0.5" fill="currentColor" /> &amp; up
            </button>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="h-8 px-1.5 text-[12px] font-semibold text-[#2563eb] underline-offset-2 hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#eef0f4] pt-2">
            <p className="min-w-0 truncate text-[12px] text-[#475569]" aria-live="polite">
              <strong className="text-[#0f172a]">{countBase.length}</strong> {countBase.length === 1 ? 'result' : 'results'}
              {query.trim() && <> for &ldquo;{query.trim()}&rdquo;</>}
            </p>
            <label className="flex shrink-0 items-center gap-1 text-[12px] text-[#475569]">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-8 rounded-lg border border-[#d4d7e1] bg-white px-1.5 text-[12px] text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>

        <div className="h-[300px] overflow-y-auto border-t border-[#eef0f4] bg-[#f8fafc] px-3 py-2 sm:px-4">
          {shown.length === 0 ? (
            // BUG 6: no empty state, just an endless spinner
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#94a3b8]">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-[12px]">Searching…</span>
            </div>
          ) : (
            <ul className={`space-y-1.5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
              {shown.map((p) => {
                const cat = categories.find((c) => c.name === p.category)!;
                return (
                  <li key={p.id} className="flex items-center gap-2.5 rounded-xl border border-[#eef0f4] bg-white px-2.5 py-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: cat.tint, color: cat.fg }}>
                      <cat.icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13px] leading-snug font-semibold text-[#0f172a]">
                        <Highlight text={p.name} term={resultsFor} />
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                        <span className="inline-flex items-center gap-0.5">
                          <Star size={11} className="text-[#f59e0b]" fill="currentColor" />
                          {p.rating.toFixed(1)}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{p.category}</span>
                        {!p.inStock && <span className="rounded bg-[#fee2e2] px-1 text-[10px] whitespace-nowrap font-medium text-[#b91c1c]">Out of stock</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-bold text-[#0f172a] tabular-nums">{money(p.price)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </BrowserFrame>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <p className="font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
          <button type="button" onClick={reset} className="flex items-center gap-1 font-sans text-xs font-medium text-white/60 hover:text-white">
            <RotateCcw size={12} /> Reload page
          </button>
        </div>
        <ul className="min-h-[8.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Type in the search box to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">/api/search?q={encodeURIComponent(e.q)}</span>
              {e.done ? (
                <span className="shrink-0 text-[#34d399]">
                  200 · {e.count} items · {(e.ms / 1000).toFixed(1)}s
                </span>
              ) : (
                <span className="shrink-0 text-[#fbbf24]">pending…</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
