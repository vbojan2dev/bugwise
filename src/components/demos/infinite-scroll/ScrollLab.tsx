import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, Clock, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { recipe, type Recipe } from './data';

/*
 * Scroll lab: a CORRECT infinite scroll on a recipes feed (iOS look).
 * - Next page loads when the sentinel (after the last row) comes within the prefetch distance.
 *   Real apps use IntersectionObserver (web) or "last row appeared" callbacks (iOS/Android);
 *   this demo measures the same distance on scroll so the number can be shown live.
 * - One request at a time, cursor-based (?after=r20), page size adjustable.
 * - Loading row at the bottom; inline error row with Retry (auto-loading pauses after an error);
 *   end-of-list message, then the footer.
 * - "Load more" button mode as the alternative for keyboard and screen reader users.
 * - Virtualization renders only the rows near the viewport (fixed 60 px rows).
 * - Opening a recipe and going Back keeps all loaded rows and the scroll position.
 * - New rows are announced in a polite live region.
 */

type Prefetch = '0' | '300' | 'screen';
type Net = 'fast' | 'slow' | 'fail';
type Total = '45' | '1000';
const ROW = 60;
const LAT: Record<Net, number> = { fast: 400, slow: 2000, fail: 900 };

interface Log {
  id: number;
  text: string;
  status: 'pending' | 'ok' | 'error';
  note?: string;
}

function Seg<T extends string>({ label, value, options, onChange, hint }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${value === o.v ? 'bg-brand text-brand-fg ring-brand' : 'bg-surface text-muted ring-line hover:text-fg'}`}
          >
            {o.t}
          </button>
        ))}
      </div>
      {hint && <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p>}
    </div>
  );
}

export default function ScrollLab() {
  const [prefetch, setPrefetch] = useState<Prefetch>('0');
  const [size, setSize] = useState<'10' | '20'>('10');
  const [net, setNet] = useState<Net>('slow');
  const [total, setTotal] = useState<Total>('45');
  const [mode, setMode] = useState<'auto' | 'button'>('auto');
  const [virt, setVirt] = useState<'off' | 'on'>('off');
  const [debug, setDebug] = useState<'off' | 'on'>('on');

  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const [live, setLive] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [dist, setDist] = useState(0);
  const [viewH, setViewH] = useState(480);

  const box = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const count = useRef(0);
  const logId = useRef(0);
  const timers = useRef<number[]>([]);
  const gen = useRef(0);
  const cfg = useRef({ prefetch, size, net, total, mode });
  cfg.current = { prefetch, size, net, total, mode };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const max = Number(total);
  const hasMore = items.length < max;

  const load = useCallback(() => {
    if (busy.current) return; // one request at a time
    const c = cfg.current;
    const start = count.current;
    if (start >= Number(c.total)) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    const limit = Number(c.size);
    const after = start ? `&after=r${start}` : '';
    const id = ++logId.current;
    setLog((l) => [{ id, text: `GET /recipes?limit=${limit}${after}`, status: 'pending' as const }, ...l].slice(0, 6));
    const g = gen.current;
    timers.current.push(
      window.setTimeout(() => {
        if (g !== gen.current) return;
        busy.current = false;
        setLoading(false);
        if (c.net === 'fail') {
          setError(true);
          setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'error' } : e)));
          setLive('Couldn’t load more recipes.');
          return;
        }
        const end = Math.min(Number(c.total), start + limit);
        const add = Array.from({ length: end - start }, (_, k) => recipe(start + k));
        count.current = end;
        setItems((xs) => [...xs, ...add]);
        const last = end >= Number(c.total);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'ok', note: `${add.length} items · ${last ? 'end' : `next=r${end}`}` } : e)));
        setLive(last ? `${add.length} more recipes loaded. That’s all ${c.total} recipes.` : `${add.length} more recipes loaded.`);
      }, LAT[c.net]),
    );
  }, []);

  // Measure and maybe load. Runs on scroll and after anything that changes the list.
  const check = useCallback(() => {
    const el = box.current;
    const s = sentinel.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setViewH(el.clientHeight);
    if (!s) return;
    const d = s.offsetTop - (el.scrollTop + el.clientHeight);
    setDist(Math.round(d));
    const c = cfg.current;
    const pf = c.prefetch === 'screen' ? el.clientHeight : Number(c.prefetch);
    if (c.mode === 'auto' && d <= pf && !busy.current) load();
  }, [load]);

  const errRef = useRef(error);
  errRef.current = error;
  const guardedCheck = useCallback(() => {
    // After an error, auto-loading pauses until the user taps Retry (no silent retry loops).
    if (errRef.current) {
      const el = box.current;
      if (el) {
        setScrollTop(el.scrollTop);
        if (sentinel.current) setDist(Math.round(sentinel.current.offsetTop - (el.scrollTop + el.clientHeight)));
      }
      return;
    }
    check();
  }, [check]);

  const restart = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    gen.current++;
    busy.current = false;
    count.current = 0;
    setItems([]);
    setLoading(false);
    setError(false);
    setOpen(null);
    setLog([]);
    setLive('');
    if (box.current) box.current.scrollTop = 0;
  }, []);

  // Start (and restart when the catalog changes).
  useEffect(() => {
    restart();
    const t = window.setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [total, restart, load]);

  useLayoutEffect(() => {
    guardedCheck();
  }, [items, loading, error, virt, mode, prefetch, open, guardedCheck]);

  const retry = () => {
    setError(false);
    errRef.current = false;
    load();
  };

  // Virtualization window
  const n = items.length;
  let from = 0;
  let to = n;
  if (virt === 'on') {
    from = Math.max(0, Math.floor(scrollTop / ROW) - 3);
    to = Math.min(n, Math.ceil((scrollTop + viewH) / ROW) + 3);
  }
  const pfPx = prefetch === 'screen' ? viewH : Number(prefetch);
  const domRows = to - from;
  const sub = 'rgba(60,60,67,.6)';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 justify-center bg-subtle p-4 sm:p-6" style={{ colorScheme: 'light' }}>
          <PhoneFrame width={290}>
            <div className="relative flex h-full flex-col bg-white text-black">
              <div className="shrink-0 border-b border-[#e5e5ea] px-4 pt-2 pb-2">
                <p className="text-[26px] leading-none font-bold tracking-tight">Recipes</p>
                <p className="mt-1 text-[11px]" style={{ color: sub }}>
                  {n} of {max === 1000 ? '1,000' : max} loaded
                </p>
              </div>
              <div ref={box} onScroll={guardedCheck} className="relative min-h-0 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                <div role="feed" aria-busy={loading} aria-label="Recipes">
                  {virt === 'on' && <div style={{ height: from * ROW }} aria-hidden="true" />}
                  {items.slice(from, to).map((r) => (
                    <article key={r.id} data-row aria-posinset={r.n} aria-setsize={max} aria-label={r.title} className="border-b border-[#e5e5ea]" style={{ height: ROW }}>
                      <button type="button" onClick={() => setOpen(r)} className="flex h-full w-full items-center gap-3 px-4 text-left focus-visible:bg-[#e8f1ff] focus-visible:outline-none">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white" style={{ background: r.color }}>
                          {r.n}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{r.title}</span>
                          <span className="block text-[11px]" style={{ color: sub }}>
                            {r.meta}
                          </span>
                        </span>
                      </button>
                    </article>
                  ))}
                  {virt === 'on' && <div style={{ height: (n - to) * ROW }} aria-hidden="true" />}
                </div>
                {debug === 'on' && mode === 'auto' && hasMore && n > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 h-0 border-t-2 border-dashed border-[#2f6bff]" style={{ top: Math.max(0, n * ROW - pfPx) }} aria-hidden="true">
                    <span className="absolute top-0.5 left-2 rounded bg-[#2f6bff] px-1 text-[9px] font-semibold text-white">next page loads when this line scrolls into view</span>
                  </div>
                )}
                <div ref={sentinel} className={debug === 'on' ? 'relative h-0 border-t-2 border-dashed border-[#d92d20]' : 'h-px'} aria-hidden="true">
                  {debug === 'on' && <span className="absolute -top-4 right-2 rounded bg-[#d92d20] px-1 text-[9px] font-semibold text-white">sentinel</span>}
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-4 text-[12px]" style={{ color: sub }}>
                    <span className="size-4 animate-spin rounded-full border-2 border-[#d1d1d6] border-t-[#8e8e93]" aria-hidden="true" /> Loading more recipes…
                  </div>
                )}
                {error && (
                  <div className="mx-3 my-3 flex items-center gap-2 rounded-xl bg-[#fdecea] px-3 py-2.5 text-[12px] text-[#8c1d18]">
                    <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1">Couldn’t load more recipes.</span>
                    <button type="button" onClick={retry} className="shrink-0 rounded px-1 font-semibold underline focus-visible:ring-2 focus-visible:ring-[#8c1d18]">
                      Retry
                    </button>
                  </div>
                )}
                {mode === 'button' && hasMore && !loading && !error && n > 0 && (
                  <div className="px-4 py-3">
                    <button type="button" onClick={load} className="h-11 w-full rounded-xl bg-[#f2f2f7] text-[14px] font-semibold text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]">
                      Load more recipes
                    </button>
                  </div>
                )}
                {!hasMore && n > 0 && (
                  <>
                    <p className="py-4 text-center text-[12px]" style={{ color: sub }}>
                      You’ve seen all {max === 1000 ? '1,000' : max} recipes
                    </p>
                    <div className="bg-[#f2f2f7] px-4 py-4 text-[11px]" style={{ color: sub }}>
                      <p className="font-semibold text-[#3a3a3c]">Recipe Box</p>
                      <p className="mt-1">About · Help · Contact · Privacy</p>
                    </div>
                  </>
                )}
              </div>
              {open && (
                <div className="absolute inset-0 z-20 flex flex-col bg-white">
                  <div className="shrink-0 px-2 pt-1">
                    <button type="button" onClick={() => setOpen(null)} className="flex items-center rounded-md px-1 py-1 text-[15px] text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]">
                      <ChevronLeft size={20} /> Recipes
                    </button>
                  </div>
                  <div className="h-28 shrink-0" style={{ background: open.color }} aria-hidden="true" />
                  <div className="p-4">
                    <p className="text-[20px] leading-tight font-bold">{open.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: sub }}>
                      <Clock size={12} /> {open.meta} · recipe #{open.n}
                    </p>
                    <p className="mt-3 text-[13px] text-[#3a3a3c]">Go Back: the list should be exactly where you left it, with all {n} recipes still loaded.</p>
                  </div>
                </div>
              )}
              <p className="sr-only" role="status" aria-live="polite">
                {live}
              </p>
            </div>
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 border-t border-line p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Seg label="Prefetch distance" value={prefetch} onChange={setPrefetch} options={[{ v: '0', t: '0 px' }, { v: '300', t: '300 px' }, { v: 'screen', t: '1 screen' }]} hint="With a slow network, 0 px means waiting at the bottom; 1 screen loads before you get there." />
            <Seg label="Page size" value={size} onChange={setSize} options={[{ v: '10', t: '10' }, { v: '20', t: '20' }]} hint="Items per request: see limit= in the log." />
            <Seg label="Network" value={net} onChange={setNet} options={[{ v: 'fast', t: 'Fast' }, { v: 'slow', t: 'Slow 2 s' }, { v: 'fail', t: 'Fails' }]} />
            <Seg label="Catalog size" value={total} onChange={setTotal} options={[{ v: '45', t: '45' }, { v: '1000', t: '1,000' }]} hint="Restarts the feed. 45 reaches the end quickly." />
            <Seg label="Loading" value={mode} onChange={setMode} options={[{ v: 'auto', t: 'On scroll' }, { v: 'button', t: 'Load more button' }]} />
            <Seg label="Virtualize rows" value={virt} onChange={setVirt} options={[{ v: 'off', t: 'Off' }, { v: 'on', t: 'On' }]} hint="Watch “Rows in the DOM” below, best with 1,000 and a few loads." />
            <Seg label="Debug overlay" value={debug} onChange={setDebug} options={[{ v: 'on', t: 'Show' }, { v: 'off', t: 'Hide' }]} />
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-subtle p-3 text-center">
            <div className="min-w-0">
              <p className="text-[11px] text-faint">Loaded</p>
              <p className="font-semibold tabular-nums">{n}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-faint">Rows in the DOM</p>
              <p className="font-semibold tabular-nums">{domRows}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-faint">Sentinel distance</p>
              <p className={`font-semibold tabular-nums ${mode === 'auto' && dist <= pfPx && hasMore ? 'text-brand' : ''}`}>{hasMore ? `${dist} px` : 'end'}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
              <button type="button" onClick={() => { restart(); window.setTimeout(load, 0); }} className="flex items-center gap-1 font-sans text-xs font-medium text-white/60 hover:text-white">
                <RotateCcw size={12} /> Restart
              </button>
            </div>
            <ul className="min-h-[6rem] space-y-1 px-3 py-2">
              {log.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{e.text}</span>
                  {e.status === 'pending' && <span className="shrink-0 text-[#fbbf24]">pending…</span>}
                  {e.status === 'ok' && <span className="shrink-0 text-[#34d399]">200 · {e.note}</span>}
                  {e.status === 'error' && <span className="shrink-0 text-[#f87171]">503</span>}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-faint">
            Try: scroll to the bottom with “0 px” and then with “1 screen”. Switch the network to Fails, then back to Fast and tap Retry. Open a recipe far down and go Back.
          </p>
        </div>
      </div>
    </div>
  );
}
