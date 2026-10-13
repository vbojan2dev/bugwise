import { useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw } from 'lucide-react';
import { ShopPreview } from './ShopPreview';
import { cpus, fmtBytes, fmtMs, nets, rate, simulate, type NetId, type Opts, type Rating, type ReqType } from './perf-sim';

const fixes: { key: 'compress' | 'lazy' | 'defer' | 'reserve' | 'cache'; label: string; desc: string }[] = [
  { key: 'compress', label: 'Compress images', desc: 'WebP at the right size: hero 2.5 MB → 110 KB' },
  { key: 'lazy', label: 'Lazy-load below the fold', desc: 'loading="lazy" on products 3–6' },
  { key: 'defer', label: 'Defer & split JavaScript', desc: 'defer + ship less code: 480 → 140 KB' },
  { key: 'reserve', label: 'Reserve space', desc: 'width/height on images, min-height for the banner' },
  { key: 'cache', label: 'Repeat visit (cache)', desc: 'static files come from the browser cache' },
];

export const typeColor: Record<ReqType, string> = {
  doc: '#3b82f6',
  css: '#a855f7',
  js: '#f59e0b',
  font: '#ec4899',
  img: '#10b981',
  fetch: '#06b6d4',
};

const ratingCls: Record<Rating, string> = {
  good: 'bg-ok-soft text-ok',
  ni: 'bg-warn-soft text-warn',
  poor: 'bg-danger-soft text-danger',
};
const ratingLabel: Record<Rating, string> = { good: 'Good', ni: 'Needs improvement', poor: 'Poor' };

export function MetricTile({ label, value, rating, sub }: { label: string; value: string; rating?: Rating; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2">
      <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">{label}</p>
      <p className="text-lg leading-tight font-bold tabular-nums text-fg">{value}</p>
      {rating ? (
        <span className={`mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold ${ratingCls[rating]}`}>{ratingLabel[rating]}</span>
      ) : (
        <p className="text-[10px] text-muted">{sub}</p>
      )}
    </div>
  );
}

export function niceStep(total: number) {
  const steps = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
  return steps.find((s) => total / s <= 6) ?? 100000;
}

export default function PageLoadLab() {
  const [opts, setOpts] = useState<Opts>({ compress: false, lazy: false, defer: false, reserve: false, cache: false, net: 'fast4g', cpu: 4 });
  const sim = useMemo(() => simulate(opts), [opts]);
  const [t, setT] = useState(() => sim.load);
  const [playing, setPlaying] = useState(false);
  const [cart, setCart] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lastInp, setLastInp] = useState<number | null>(null);
  const raf = useRef(0);
  const busyTimer = useRef(0);

  // Show the finished page whenever the settings change.
  useEffect(() => {
    setPlaying(false);
    setT(sim.load);
    setLastInp(null);
  }, [sim]);

  // Replay: the whole load plays in about 5 seconds.
  useEffect(() => {
    if (!playing) return;
    const total = sim.load;
    let startReal = 0;
    const startT = t >= total ? 0 : t;
    const step = (now: number) => {
      if (!startReal) startReal = now;
      const next = startT + ((now - startReal) / 5000) * total;
      if (next >= total) {
        setT(total);
        setPlaying(false);
        return;
      }
      setT(next);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sim]);

  useEffect(() => () => clearTimeout(busyTimer.current), []);

  const addToCart = () => {
    if (busy) return;
    setBusy(true);
    const delay = sim.inp;
    busyTimer.current = window.setTimeout(() => {
      setCart((c) => c + 1);
      setBusy(false);
      setLastInp(delay);
    }, delay);
  };

  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const total = sim.load;
  const step = niceStep(total);
  const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => i * step);
  const pct = (ms: number) => `${Math.min(100, (ms / total) * 100)}%`;
  const frames = Array.from({ length: 6 }, (_, i) => Math.round(((i + 1) / 6) * total));

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold">
          <Gauge size={18} className="text-brand" aria-hidden="true" /> Page load lab
        </p>
        <p className="text-sm text-muted">A simulated load of a shop page. Throttle the network and CPU like in DevTools, switch fixes on, and watch the waterfall and Core Web Vitals react.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Controls */}
        <div className="space-y-4 border-b border-line p-4 sm:p-5 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-faint uppercase">Network</span>
              <select value={opts.net} onChange={(e) => set('net', e.target.value as NetId)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm">
                {(Object.keys(nets) as NetId[]).map((k) => (
                  <option key={k} value={k}>
                    {nets[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-faint uppercase">CPU</span>
              <select value={opts.cpu} onChange={(e) => set('cpu', +e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm">
                {cpus.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Fixes</legend>
            {fixes.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-subtle px-3 py-2">
                <input type="checkbox" checked={opts[f.key]} onChange={(e) => set(f.key, e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{f.label}</span>
                  <span className="block text-[11px] leading-snug text-muted">{f.desc}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            onClick={() => setOpts((o) => ({ ...o, compress: false, lazy: false, defer: false, reserve: false, cache: false }))}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" /> Turn all fixes off
          </button>
        </div>

        {/* Results */}
        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <MetricTile label="LCP" value={fmtMs(sim.lcp)} rating={rate('lcp', sim.lcp)} />
            <MetricTile label="INP (Add tap)" value={fmtMs(sim.inp)} rating={rate('inp', sim.inp)} />
            <MetricTile label="CLS" value={sim.cls.toFixed(2)} rating={rate('cls', sim.cls)} />
            <MetricTile label="FCP" value={fmtMs(sim.fcp)} rating={rate('fcp', sim.fcp)} />
            <MetricTile label="Requests" value={String(sim.reqs.length)} sub="on first load" />
            <MetricTile label="Transferred" value={fmtBytes(sim.bytes)} sub={opts.cache ? 'most files from cache' : 'over the network'} />
          </div>

          {/* Waterfall */}
          <div className="overflow-hidden rounded-xl border border-line bg-[#0e1120] text-[#c9cde0]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Network waterfall</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/60">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-0.5 bg-[#34d399]" /> FCP
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-0.5 bg-[#60a5fa]" /> LCP
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-0.5 bg-[#f87171]" /> Fully loaded
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-3 rounded-sm bg-white/25" /> waiting
                </span>
              </div>
            </div>
            <div className="px-3 py-2 font-mono text-[10.5px]">
              <div className="flex items-end gap-2 pb-1 text-white/40">
                <span className="w-[6.5rem] shrink-0 sm:w-36">Name</span>
                <span className="w-12 shrink-0 text-right">Size</span>
                <span className="relative h-3 min-w-0 flex-1">
                  {ticks.map((tk, i) => (
                    <span key={tk} className={`absolute whitespace-nowrap ${i === 0 ? '' : '-translate-x-1/2'} ${i % 2 ? 'hidden sm:inline' : ''} ${i === ticks.length - 1 && i > 0 ? 'hidden' : ''}`} style={{ left: pct(tk) }}>
                      {tk === 0 ? '0' : fmtMs(tk)}
                    </span>
                  ))}
                </span>
              </div>
              <ul className="space-y-[3px]">
                {sim.reqs.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex w-[6.5rem] shrink-0 items-center gap-1.5 truncate sm:w-36" title={r.name}>
                      <span className="size-2 shrink-0 rounded-sm" style={{ background: typeColor[r.type] }} />
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="w-12 shrink-0 text-right text-white/50">{r.cached ? 'cache' : fmtBytes(r.size)}</span>
                    <span className="relative h-3 min-w-0 flex-1 rounded-sm bg-white/[0.03]">
                      <span className="absolute inset-y-0.5 rounded-l-sm bg-white/25" style={{ left: pct(r.start), width: `calc(${pct(r.waitEnd - r.start)} + 1px)` }} />
                      <span className="absolute inset-y-0 rounded-sm" style={{ left: pct(r.waitEnd), width: `calc(${pct(Math.max(0, r.end - r.waitEnd))} + 2px)`, background: typeColor[r.type] }} />
                      {r.blocking && <span className="absolute -top-0.5 text-[8px] font-bold text-[#fbbf24]" style={{ left: `calc(${pct(r.end)} + 4px)` }}>blocking</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {/* markers */}
              <div className="relative mt-1 flex gap-2">
                <span className="w-[6.5rem] shrink-0 sm:w-36" />
                <span className="w-12 shrink-0" />
                <span className="relative h-4 min-w-0 flex-1">
                  {(
                    [
                      [sim.fcp, '#34d399'],
                      [sim.lcp, '#60a5fa'],
                      [total, '#f87171'],
                    ] as const
                  ).map(([ms, c], i) => (
                    <span key={i} className="absolute top-0 h-4 w-0.5" style={{ left: pct(ms), background: c }} />
                  ))}
                  <span className="absolute top-0 h-4 w-px bg-white" style={{ left: pct(t) }} />
                </span>
              </div>
            </div>
          </div>

          {/* Preview + filmstrip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-2">
              <ShopPreview sim={sim} opts={opts} t={t} cart={cart} busy={busy} onAdd={addToCart} />
              <p className="text-center text-[11px] text-muted" aria-live="polite">
                {busy ? 'Waiting for the page to respond…' : lastInp !== null ? `Last “Add” tap took ${fmtMs(lastInp)} to show in the cart` : 'When products appear, tap “Add” and feel the delay'}
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg"
                >
                  {playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {playing ? 'Pause' : 'Replay load'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.round(total)}
                  value={Math.round(t)}
                  aria-label="Time in the page load"
                  onChange={(e) => {
                    setPlaying(false);
                    setT(+e.target.value);
                  }}
                  className="w-0 min-w-0 flex-1 accent-[var(--brand)]"
                />
                <span className="w-14 shrink-0 text-right font-mono text-xs text-fg tabular-nums">{fmtMs(t)}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Filmstrip</p>
                <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                  {frames.map((ft, i) => {
                    const prev = i === 0 ? 0 : frames[i - 1];
                    const shifted = sim.shifts.some((s) => s.t > prev && s.t <= ft);
                    return (
                      <button key={i} type="button" tabIndex={-1} onClick={() => { setPlaying(false); setT(ft); }} className="flex min-w-0 flex-col items-center gap-1">
                        <ShopPreview sim={sim} opts={opts} t={ft} scale={0.3} cart={cart} />
                        <span className={`font-mono text-[10px] ${shifted ? 'font-bold text-danger' : 'text-muted'}`}>
                          {fmtMs(ft)}
                          {shifted ? ' ⚡shift' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {sim.shifts.length > 0 ? (
                <ul className="space-y-1 text-xs text-muted">
                  {sim.shifts.map((s) => (
                    <li key={s.what} className="flex gap-2">
                      <span className="shrink-0 font-mono text-danger">+{s.value.toFixed(2)}</span>
                      <span>
                        at {fmtMs(s.t)}: {s.what}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ok">No layout shifts: space was reserved for everything that loads late.</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-faint">Simplified model for learning: real browsers prioritize requests and calculate CLS in time windows, but the cause and effect is the same.</p>
        </div>
      </div>
    </div>
  );
}
