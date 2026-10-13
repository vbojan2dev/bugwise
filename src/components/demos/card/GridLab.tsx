import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ProductCard, ProductSkeleton, products } from './Cards';

/** Stress-test a product grid: long titles, missing images, mixed aspect ratios, equal heights, loading and dark mode. */

const grid = products.slice(0, 4);

type Opts = {
  long: boolean;
  clamp: boolean;
  missing: boolean;
  fixedRatio: boolean;
  equal: boolean;
  dark: boolean;
};

const defaults: Opts = { long: true, clamp: true, missing: false, fixedRatio: true, equal: true, dark: false };

const toggles: { key: keyof Opts; label: string; hint: string }[] = [
  { key: 'long', label: 'Long product names', hint: 'Real catalogs mix short names with ones like "Ridge Mid Gore-Tex Waterproof Hiking Boots for Rocky Trails and Muddy Paths, Wide Fit".' },
  { key: 'clamp', label: 'Clamp titles to 2 lines', hint: 'Without a clamp, long names push the price and button down and the grid gets ragged.' },
  { key: 'missing', label: 'Missing image', hint: 'The backpack has no photo. A good card keeps its shape and shows a neutral placeholder.' },
  { key: 'fixedRatio', label: 'Fixed image ratio (1:1)', hint: 'Without it, every photo keeps its own shape and the cards jump around.' },
  { key: 'equal', label: 'Equal card heights', hint: 'Cards in a row stretch to the same height and the buttons line up at the bottom.' },
  { key: 'dark', label: 'Dark mode', hint: 'Shadows vanish on dark backgrounds, so dark cards need a lighter surface or a subtle border.' },
];

/** Some toggles only show a difference in combination with others; say so instead of looking broken. */
function noEffectNote(key: keyof Opts, o: Opts): string | null {
  if (key === 'clamp' && !o.long) return 'Short names fit in 2 lines anyway. Turn on "Long product names" to see the clamp.';
  if (key === 'equal' && !o.long && o.fixedRatio)
    return 'With short names and a fixed image ratio, all cards are already the same height. Turn on "Long product names" or turn off the fixed ratio to see the difference.';
  return null;
}

export default function GridLab() {
  const [o, setO] = useState<Opts>(defaults);
  const [cols, setCols] = useState(2);
  const [loading, setLoading] = useState(false);
  const [fav, setFav] = useState<number[]>([]);
  const [status, setStatus] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const reload = () => {
    setLoading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLoading(false), 1800);
  };

  const set = (k: keyof Opts) => setO((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 p-3 sm:p-5" style={{ background: o.dark ? '#0b0c10' : '#f2f2f7', colorScheme: o.dark ? 'dark' : 'light' }}>
          <div className="mb-3 flex items-center justify-between gap-2 text-[13px]" style={{ color: o.dark ? '#eceef6' : '#14161f' }}>
            <span className="font-semibold">Hiking gear · {grid.length} items</span>
            <span role="status" className="truncate text-[11px] opacity-70">
              {loading ? 'Loading products…' : status}
            </span>
          </div>
          <div className={`grid gap-2.5 ${o.equal ? 'items-stretch' : 'items-start'}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {grid.map((p) =>
              loading ? (
                <ProductSkeleton key={p.id} dark={o.dark} ratio={o.fixedRatio ? 1 : p.natural} />
              ) : (
                <ProductCard
                  key={p.id}
                  p={p}
                  dark={o.dark}
                  long={o.long}
                  clamp={o.clamp}
                  ratio={o.fixedRatio ? 1 : p.natural}
                  missingImage={o.missing && p.id === 2}
                  stretch={o.equal}
                  fav={fav.includes(p.id)}
                  onFav={() => setFav((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))}
                  onOpen={() => setStatus(`Opened: ${p.name}`)}
                  onAdd={() => setStatus(`Added: ${p.name}`)}
                />
              ),
            )}
          </div>
        </div>
        <div className="space-y-3 border-t border-line p-4 lg:border-t-0 lg:border-l">
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Columns</p>
            <div role="radiogroup" aria-label="Columns" className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={cols === n}
                  onClick={() => setCols(n)}
                  className={`h-8 flex-1 rounded-lg text-sm font-medium ${cols === n ? 'bg-brand text-white' : 'bg-subtle text-muted hover:text-fg'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-1.5">
            {toggles.map((t) => (
              <li key={t.key}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-subtle px-3 py-2 text-sm">
                  <input type="checkbox" checked={o[t.key]} onChange={() => set(t.key)} className="mt-1 accent-[var(--brand)]" />
                  <span className="min-w-0">
                    <span className="font-medium">{t.label}</span>
                    <span className="block text-xs leading-snug text-muted">{t.hint}</span>
                    {noEffectNote(t.key, o) && (
                      <span className="mt-1 block text-xs leading-snug font-medium text-warn">{noEffectNote(t.key, o)}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={reload} disabled={loading} className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Loading…' : 'Reload (skeleton)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setO(defaults);
                setCols(2);
                setStatus('');
              }}
              className="flex items-center gap-1 rounded-lg bg-subtle px-3 py-2 text-sm font-medium text-muted hover:text-fg"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
