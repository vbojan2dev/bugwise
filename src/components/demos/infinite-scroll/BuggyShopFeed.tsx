import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { product, type Product } from './data';

/*
 * A deliberately broken web shop with infinite scroll. Bugs (don't spoil them for learners!):
 *  1. No "already loading" guard: scroll events near the end are only throttled to one load per 0.5 s.
 *     A request takes 1.3 s, so if the user keeps scrolling at the bottom while it loads, the same
 *     cursor is requested again -> the same 12 products appear twice (or more).
 *  2. Opening a product unmounts the list; Back rebuilds it from page 1 and scrollTop 0.
 *  3. When the API says there is no next page (Sale has 7 products), the loading row stays forever.
 *  4. A failed request sets a "failed" flag: the loading row disappears, nothing is shown and
 *     loading never starts again (until switching category or restarting).
 *  5. The footer (Contact, Imprint, Returns) sits below an endless list: every time you get near it,
 *     12 more products push it away.
 *  6. After each successful load, focus is moved (without scrolling) to the "All products" heading,
 *     so keyboard users' next Tab jumps back to the first product at the top.
 */

const PAGE = 12;
const TOTAL = { all: 250, sale: 7 } as const;
type Cat = keyof typeof TOTAL;
const ZONE = 40;
const THROTTLE = 500; // BUG 1: a throttle is not an in-flight guard
const LATENCY = 1300;

type Item = Product & { uid: number };

interface Log {
  id: number;
  path: string;
  status: 'pending' | number;
  note?: string;
}

export function BuggyShopFeed() {
  const [cat, setCat] = useState<Cat>('all');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<{ kind: 'list' } | { kind: 'product'; p: Product } | { kind: 'page'; name: string }>({ kind: 'list' });
  const [serverError, setServerError] = useState(false);
  const [log, setLog] = useState<Log[]>([]);

  const box = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cursor = useRef(0);
  const lastFire = useRef(-1e9);
  const failedRef = useRef(false);
  const errRef = useRef(serverError);
  errRef.current = serverError;
  const catRef = useRef(cat);
  catRef.current = cat;
  const uid = useRef(0);
  const logId = useRef(0);
  const gen = useRef(0);
  const timers = useRef<number[]>([]);
  const focusAfter = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = () => {
    // BUG 1: no in-flight check
    if (failedRef.current) return; // BUG 4: once failed, never again
    const c = catRef.current;
    const from = cursor.current;
    if (from >= TOTAL[c]) return; // nothing requested at the end... (but see BUG 3)
    const id = ++logId.current;
    const g = gen.current;
    const fails = errRef.current;
    setLoading(true);
    setLog((l) => [{ id, path: `/api/products?cat=${c}&limit=${PAGE}${from ? `&cursor=${c[0]}${from}` : ''}`, status: 'pending' as const }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        if (g !== gen.current) return;
        if (fails) {
          setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 500 } : e)));
          failedRef.current = true;
          setFailed(true);
          setLoading(false);
          return; // no message, no retry
        }
        const to = Math.min(TOTAL[c], from + PAGE);
        const batch = Array.from({ length: to - from }, (_, k) => ({ ...product(from + k, c === 'sale'), uid: ++uid.current }));
        cursor.current = to; // a duplicate request with the same cursor returns the same products
        const end = to >= TOTAL[c];
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 200, note: `${batch.length} items${end ? ' · next: null' : ''}` } : e)));
        setItems((xs) => [...xs, ...batch]);
        if (!end) setLoading(false); // BUG 3: at the end the loading row is never removed
        focusAfter.current = true;
      }, LATENCY),
    );
  };

  const check = () => {
    const el = box.current;
    const s = sentinel.current;
    if (!el || !s) return;
    const d = s.offsetTop - (el.scrollTop + el.clientHeight);
    const t = performance.now();
    if (d <= ZONE && t - lastFire.current > THROTTLE) {
      lastFire.current = t;
      load();
    }
  };

  const reset = (c: Cat) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    gen.current++;
    cursor.current = 0;
    lastFire.current = -1e9;
    failedRef.current = false;
    catRef.current = c;
    setCat(c);
    setItems([]);
    setFailed(false);
    setLoading(false);
    setView({ kind: 'list' });
    if (box.current) box.current.scrollTop = 0;
    // The layout effect below sees the empty list, finds the sentinel on screen and loads page 1.
  };

  useLayoutEffect(() => {
    if (view.kind !== 'list') return;
    check();
    if (focusAfter.current) {
      focusAfter.current = false;
      // BUG 6: "helpful" focus move after every load
      if (box.current?.contains(document.activeElement)) heading.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading, view]);

  const openProduct = (p: Item) => setView({ kind: 'product', p });
  const back = () => {
    // BUG 2: the list is rebuilt from scratch
    reset(catRef.current);
  };

  const tab = (c: Cat, label: string) => (
    <button
      type="button"
      onClick={() => reset(c)}
      aria-pressed={cat === c}
      className={`rounded-full px-3 py-1.5 text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-1 ${cat === c ? 'bg-[#0e1120] text-white' : 'bg-[#eef0f5] text-[#3a3f52]'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <BrowserFrame url={view.kind === 'product' ? `shop.example.com/p/${view.p.id}` : 'shop.example.com/gear'}>
        <div ref={box} onScroll={view.kind === 'list' ? check : undefined} className="relative h-[460px] overflow-y-auto bg-white text-[#0e1120]" style={{ colorScheme: 'light', overscrollBehavior: 'contain' }}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#e5e7ef] bg-white/95 px-4 py-2.5">
            <span className="text-[15px] font-bold tracking-tight">Trailhead</span>
            <span className="text-[12px] text-[#5a5f70]">Cart (0)</span>
          </div>

          {view.kind === 'product' && (
            <div className="p-4">
              <button type="button" onClick={back} className="flex items-center gap-0.5 rounded text-[13px] font-medium text-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
                <ChevronLeft size={16} /> Back to products
              </button>
              <div className="mt-3 h-40 rounded-xl" style={{ background: view.p.color }} aria-hidden="true" />
              <p className="mt-3 text-[12px] text-[#5a5f70]">{view.p.brand}</p>
              <h4 className="text-[18px] leading-snug font-semibold">{view.p.name}</h4>
              <p className="mt-1 text-[16px] font-semibold">{view.p.price}</p>
              <p className="mt-2 text-[12px] text-[#5a5f70]">Product #{view.p.n} in the list.</p>
            </div>
          )}

          {view.kind === 'page' && (
            <div className="p-4">
              <button type="button" onClick={() => setView({ kind: 'list' })} className="flex items-center gap-0.5 rounded text-[13px] font-medium text-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
                <ChevronLeft size={16} /> Back
              </button>
              <h4 className="mt-3 text-[18px] font-semibold">{view.name}</h4>
              <p className="mt-1 text-[13px] text-[#5a5f70]">You made it to the {view.name} page.</p>
            </div>
          )}

          {view.kind === 'list' && (
            <>
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {tab('all', 'All products')}
                {tab('sale', 'Sale')}
              </div>
              <h4 ref={heading} tabIndex={-1} className="px-4 pt-3 pb-2 text-[18px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
                {cat === 'all' ? 'All products' : 'Sale'}
              </h4>
              <ul className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
                {items.map((p) => (
                  <li key={p.uid} className="min-w-0">
                    <button type="button" onClick={() => openProduct(p)} className="block w-full rounded-xl text-left focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2">
                      <span className="block aspect-[4/3] rounded-xl" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)` }} aria-hidden="true" />
                      <span className="mt-1.5 block text-[11px] text-[#5a5f70]">{p.brand}</span>
                      <span className="line-clamp-2 block text-[13px] leading-snug font-medium">{p.name}</span>
                      <span className="block text-[13px] font-semibold">{p.price}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-5 text-[13px] text-[#5a5f70]">
                  <span className="size-4 animate-spin rounded-full border-2 border-[#d1d5e0] border-t-[#5a5f70]" aria-hidden="true" /> Loading more products…
                </div>
              )}
              <div ref={sentinel} className="h-px" aria-hidden="true" />
              <footer className="mt-6 border-t border-[#e5e7ef] bg-[#f6f7fb] px-4 py-5 text-[12px] text-[#5a5f70]">
                <p className="font-semibold text-[#0e1120]">Trailhead Outdoor GmbH</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {['Contact', 'Returns', 'Shipping', 'Imprint', 'Privacy'].map((name) => (
                    <button key={name} type="button" onClick={() => setView({ kind: 'page', name })} className="rounded underline focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
                      {name}
                    </button>
                  ))}
                </div>
              </footer>
            </>
          )}
        </div>
      </BrowserFrame>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Test setup</p>
            <button type="button" onClick={() => { setLog([]); reset('all'); }} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCcw size={12} /> Reload page
            </button>
          </div>
          <label className="mt-2 flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted">Server returns errors (500)</span>
            <input type="checkbox" checked={serverError} onChange={(e) => setServerError(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
          <p className="mt-3 text-[12px] leading-relaxed text-faint">Scroll inside the page with the mouse wheel, trackpad or finger. Keyboard: click “All products”, then use Tab. Each request takes about 1.3 s.</p>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
          <ul className="min-h-[5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Scroll to see API requests…</li>}
            {log.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className="text-[#7dd3fc]">GET</span>
                <span className="min-w-0 flex-1 truncate">{e.path}</span>
                {e.status === 'pending' ? (
                  <span className="shrink-0 text-[#fbbf24]">pending…</span>
                ) : (
                  <span className={`shrink-0 ${e.status >= 400 ? 'text-[#f87171]' : 'text-[#34d399]'}`}>
                    {e.status}
                    {e.note ? ` · ${e.note}` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
