import { useEffect, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Slider, type SliderValue } from './Slider';

/*
 * A deliberately broken "Running shoes" filter screen. Bugs (don't spoil them for learners!):
 *  1. Max price unreachable: range 0–249 with step 10 snaps to the last full step (240), so the €249 shoe
 *     can never be shown again once the max thumb has been touched.
 *  2. The two price thumbs can cross (min > max): label shows "€200 – €90" and the list is empty.
 *  3. Rating label uses naive floating-point math: "★ 3.5000000000000004+", and a 4.8★ shoe is hidden at "4.8".
 *  4. Price thumbs can be focused but ignore the keyboard (arrows, Page Up/Down, Home/End).
 *  5. The price slider sends a request on every movement (network log floods) instead of on release.
 *  6. Price thumbs have no aria-valuetext, so the screen reader says "40" instead of "€40".
 * Everything else (rating slider keyboard + commit on release, results list, empty state, reset) works.
 */

const PRICE_MAX = 249;

const shoes = [
  { id: 1, name: 'Pace Runner 2', price: 39, rating: 3.6, tint: '#fde68a' },
  { id: 2, name: 'Daily Trainer', price: 49, rating: 4.1, tint: '#bfdbfe' },
  { id: 3, name: 'Trail Grip Lite', price: 59, rating: 3.9, tint: '#bbf7d0' },
  { id: 4, name: 'City Jogger', price: 65, rating: 3.2, tint: '#fecaca' },
  { id: 5, name: 'Cloud Step', price: 79, rating: 4.4, tint: '#ddd6fe' },
  { id: 6, name: 'Tempo Fly', price: 89, rating: 4.8, tint: '#fbcfe8' },
  { id: 7, name: 'Marathon Max', price: 99, rating: 4.5, tint: '#a5f3fc' },
  { id: 8, name: 'Road Racer 3', price: 119, rating: 4.2, tint: '#fed7aa' },
  { id: 9, name: 'Ultra Cushion', price: 129, rating: 4.6, tint: '#c7d2fe' },
  { id: 10, name: 'Carbon Sprint', price: 149, rating: 4.3, tint: '#d9f99d' },
  { id: 11, name: 'Summit Trail GTX', price: 189, rating: 4.7, tint: '#e9d5ff' },
  { id: 12, name: 'Elite Carbon Pro', price: 249, rating: 4.9, tint: '#99f6e4' },
];

interface Filters {
  price: [number, number];
  rating: number;
}
interface LogEntry {
  id: number;
  url: string;
  done: boolean;
}
const initial: Filters = { price: [0, PRICE_MAX], rating: 0 };

export function BuggyPriceFilter() {
  const [price, setPrice] = useState<[number, number]>(initial.price);
  const [rating, setRating] = useState(0);
  const [applied, setApplied] = useState<Filters>(initial);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sr, setSr] = useState(false);
  const [spoken, setSpoken] = useState('VoiceOver on. Tab to an element to hear it.');
  const box = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const pending = useRef(0);
  const nextId = useRef(1);
  const filtersRef = useRef<Filters>(initial);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const request = (f: Filters) => {
    filtersRef.current = f;
    const id = nextId.current++;
    const url = `/api/shoes?min=${f.price[0]}&max=${f.price[1]}${f.rating ? `&rating=${f.rating}` : ''}`;
    pending.current++;
    setLoading(true);
    setTotal((t) => t + 1);
    setLog((l) => [{ id, url, done: false }, ...l].slice(0, 5));
    timers.current.push(
      window.setTimeout(() => {
        setApplied(f);
        pending.current--;
        if (pending.current === 0) setLoading(false);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, done: true } : e)));
      }, 350),
    );
  };

  // Simulated VoiceOver: read the focused element after every change.
  const announce = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !box.current?.contains(el)) return;
    if (el.getAttribute('role') === 'slider') {
      const valueText = el.getAttribute('aria-valuetext') ?? el.getAttribute('aria-valuenow');
      setSpoken(`${el.getAttribute('aria-label')}, ${valueText}, adjustable`);
    } else if (el.tagName === 'BUTTON') {
      setSpoken(`${el.getAttribute('aria-label') ?? el.textContent?.trim()}, button`);
    }
  };
  useEffect(() => {
    if (sr) announce();
  }, [price, rating, sr]);

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    pending.current = 0;
    filtersRef.current = initial;
    setPrice(initial.price);
    setRating(0);
    setApplied(initial);
    setLog([]);
    setTotal(0);
    setLoading(false);
  };

  const resetFilters = () => {
    setPrice(initial.price);
    setRating(0);
    request(initial);
  };

  const [lo, hi] = applied.price;
  const results = shoes.filter((s) => s.price >= lo && s.price <= hi && s.rating >= applied.rating);

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div ref={box} onFocus={() => sr && announce()} className="flex h-full flex-col bg-[#f2f2f7] text-black" style={{ colorScheme: 'light' }}>
          <div className="px-4 pt-5 pb-2">
            <p className="text-[24px] font-bold tracking-tight">Running shoes</p>
            <p className="text-[12px] text-[rgba(60,60,67,.6)]">{shoes.length} products · prices from €39 to €249</p>
          </div>

          <div className="mx-3 rounded-xl bg-white px-3 pt-2.5 pb-1">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <SlidersHorizontal size={14} className="text-[#007aff]" /> Filters
              </p>
              <button type="button" onClick={resetFilters} className="rounded text-[13px] text-[#007aff] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/40">
                Reset
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between text-[13px]">
              <span>Price</span>
              <span className="font-semibold tabular-nums">
                €{price[0]} – €{price[1]}
              </span>
            </div>
            <Slider
              value={price}
              min={0}
              max={PRICE_MAX}
              step={10}
              lastStepOnly /* BUG 1 */
              allowCross /* BUG 2 */
              keyboard={false} /* BUG 4 */
              labels={['Minimum price', 'Maximum price']} /* BUG 6: no valueText */
              onChange={(v: SliderValue) => {
                const p = v as [number, number];
                setPrice(p);
                request({ price: p, rating: filtersRef.current.rating }); // BUG 5: on every move
              }}
            />
            <div className="-mt-1 flex justify-between text-[10px] text-[rgba(60,60,67,.6)]">
              <span>€0</span>
              <span>€{PRICE_MAX}</span>
            </div>

            <div className="mt-2 flex items-baseline justify-between text-[13px]">
              <span>Min. rating</span>
              <span className="flex items-center gap-0.5 font-semibold tabular-nums">
                {rating === 0 ? (
                  'Any'
                ) : (
                  <>
                    <Star size={12} className="fill-[#ff9500] text-[#ff9500]" /> {rating}+ {/* BUG 3: not rounded */}
                  </>
                )}
              </span>
            </div>
            <Slider
              value={rating}
              min={0}
              max={5}
              step={0.1}
              naiveMath /* BUG 3 */
              label="Minimum rating"
              valueText={(v) => (v === 0 ? 'Any rating' : `${v.toFixed(1)} stars and up`)}
              onChange={(v) => setRating(v as number)}
              onCommit={(v) => request({ price: filtersRef.current.price, rating: v as number })}
            />
          </div>

          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <p className="text-[12px] font-semibold tracking-wide text-[rgba(60,60,67,.6)] uppercase">
              Showing {results.length} of {shoes.length}
            </p>
            {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-[#8e8e93] border-t-transparent" />}
          </div>
          <div className={`relative min-h-0 flex-1 overflow-y-auto px-3 pb-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {results.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-[15px] font-semibold">No shoes match your filters</p>
                <p className="mt-1 text-[12px] text-[rgba(60,60,67,.6)]">Try a wider price range or a lower rating.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {results.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white p-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg text-[18px]" style={{ background: s.tint }} aria-hidden="true">
                      👟
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{s.name}</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-[rgba(60,60,67,.6)]">
                        <Star size={10} className="fill-[#ff9500] text-[#ff9500]" /> {s.rating.toFixed(1)}
                      </span>
                    </span>
                    <span className="text-[14px] font-semibold tabular-nums">€{s.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {sr && (
            <div className="absolute inset-x-2 bottom-5 z-20 rounded-xl bg-black/85 px-3 py-2 text-[12px] leading-snug text-white" aria-live="off">
              <span className="mr-1 font-semibold text-[#64d2ff]">VoiceOver:</span>
              {spoken}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm">
          Screen reader (VoiceOver captions)
          <input
            type="checkbox"
            checked={sr}
            onChange={(e) => {
              setSr(e.target.checked);
              setSpoken('VoiceOver on. Tab to an element to hear it.');
            }}
            className="accent-[var(--brand)]"
          />
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network log</span>
          <span className="tabular-nums normal-case">{total} requests</span>
        </div>
        <ul className="min-h-[6.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Change a filter to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">{e.url}</span>
              {e.done ? <span className="text-[#34d399]">200</span> : <span className="text-[#fbbf24]">…</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
