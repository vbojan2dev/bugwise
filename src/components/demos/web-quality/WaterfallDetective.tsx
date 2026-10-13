import { useMemo, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { MetricTile, niceStep, typeColor } from './PageLoadLab';
import { fmtBytes, fmtMs, rate, type ReqType } from './perf-sim';

/*
 * A recorded (static) waterfall of a slow product page, for the bug hunt.
 * Culprits (don't spoil them for learners!):
 *  1. hero-sneakers.jpg is 4.2 MB and is the LCP element.
 *  2. app.bundle.js (1.1 MB) is render-blocking: <script> in <head> without defer.
 *  3. /api/recommendations waits 3.1 s for the server (TTFB).
 *  4. promo-banner.js inserts a banner late, causing a 0.19 layout shift.
 *  5. /api/cart/count is requested 20 times on one page load.
 */

interface Row {
  name: string;
  host?: string;
  type: ReqType;
  size: number;
  start: number;
  wait: number; // ms waiting for the first byte (TTFB)
  dl: number; // ms content download
  initiator: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low';
  blocking?: string;
  status?: number;
}

const base: Row[] = [
  { name: 'product/sneakers-x2', type: 'doc', size: 32_000, start: 0, wait: 360, dl: 40, initiator: 'Other (navigation)', priority: 'Highest', status: 200 },
  { name: 'styles.css', type: 'css', size: 58_000, start: 410, wait: 90, dl: 110, initiator: 'product/sneakers-x2 (parser)', priority: 'Highest', blocking: 'Yes: stylesheet in <head>' },
  { name: 'app.bundle.js', type: 'js', size: 1_100_000, start: 410, wait: 95, dl: 1380, initiator: 'product/sneakers-x2 (parser)', priority: 'High', blocking: 'Yes: <script src> in <head> without defer or async' },
  { name: 'logo.svg', type: 'img', size: 3_000, start: 420, wait: 85, dl: 15, initiator: 'product/sneakers-x2 (parser)', priority: 'Low' },
  { name: 'hero-sneakers.jpg', type: 'img', size: 4_200_000, start: 420, wait: 90, dl: 4390, initiator: 'product/sneakers-x2 (parser)', priority: 'High' },
  { name: 'inter.woff2', type: 'font', size: 46_000, start: 620, wait: 85, dl: 60, initiator: 'styles.css', priority: 'Highest' },
  { name: 'analytics.js', host: 'stats.example.net', type: 'js', size: 24_000, start: 2300, wait: 170, dl: 60, initiator: 'app.bundle.js', priority: 'Low', blocking: 'No (async)' },
  { name: 'promo-banner.js', host: 'cdn.adsnet.example', type: 'js', size: 42_000, start: 2310, wait: 240, dl: 90, initiator: 'app.bundle.js', priority: 'Low', blocking: 'No (async)' },
  { name: 'api/recommendations', type: 'fetch', size: 18_000, start: 2330, wait: 3080, dl: 30, initiator: 'app.bundle.js › loadRecommendations()', priority: 'High', status: 200 },
];
const cartCalls: Row[] = Array.from({ length: 20 }, (_, i) => ({
  name: 'api/cart/count',
  type: 'fetch' as const,
  size: 400,
  start: 2340 + i * 95,
  wait: 110 + (i % 3) * 20,
  dl: 4,
  initiator: 'app.bundle.js › CartBadge.render()',
  priority: 'High' as const,
  status: 200,
}));
const productImgs: Row[] = [1, 2, 3, 4].map((i) => ({
  name: `product-${i}.webp`,
  type: 'img' as const,
  size: 36_000 + i * 1500,
  start: 5450 + i * 10,
  wait: 90,
  dl: 120,
  initiator: 'app.bundle.js › renderRecommendations()',
  priority: 'Low' as const,
}));
const rows: Row[] = [...base, ...cartCalls, ...productImgs];
const TOTAL = 6400;
const metrics = { fcp: 2350, lcp: 4950, cls: 0.19, inp: 340 };
const shiftAt = 5700;

const filters: { id: 'all' | ReqType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doc', label: 'Doc' },
  { id: 'css', label: 'CSS' },
  { id: 'js', label: 'JS' },
  { id: 'img', label: 'Img' },
  { id: 'fetch', label: 'Fetch/XHR' },
];

export default function WaterfallDetective() {
  const [filter, setFilter] = useState<'all' | ReqType>('all');
  const [sort, setSort] = useState<'start' | 'size' | 'time'>('start');
  const [sel, setSel] = useState<number | null>(null);

  const shown = useMemo(() => {
    const list = rows.map((r, i) => ({ r, i })).filter(({ r }) => filter === 'all' || r.type === filter);
    if (sort === 'size') list.sort((a, b) => b.r.size - a.r.size);
    if (sort === 'time') list.sort((a, b) => b.r.wait + b.r.dl - (a.r.wait + a.r.dl));
    return list;
  }, [filter, sort]);

  const step = niceStep(TOTAL);
  const ticks = Array.from({ length: Math.floor(TOTAL / step) + 1 }, (_, i) => i * step);
  const pct = (ms: number) => `${Math.min(100, (ms / TOTAL) * 100)}%`;
  const s = sel !== null ? rows[sel] : null;
  const totalBytes = rows.reduce((a, r) => a + r.size, 0);

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="rounded-2xl border border-line bg-surface p-3">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Lighthouse-style summary · Fast 4G, 4× CPU</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MetricTile label="LCP" value={fmtMs(metrics.lcp)} rating={rate('lcp', metrics.lcp)} />
          <MetricTile label="CLS" value={metrics.cls.toFixed(2)} rating={rate('cls', metrics.cls)} />
          <MetricTile label="FCP" value={fmtMs(metrics.fcp)} rating={rate('fcp', metrics.fcp)} />
          <MetricTile label="Requests" value={String(rows.length)} sub={`${fmtBytes(totalBytes)} transferred`} />
        </div>
        <p className="mt-2 text-[11px] text-muted">
          LCP element: <code className="font-mono text-fg">img.hero</code>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] text-[#c9cde0]">
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-2 py-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${filter === f.id ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1 text-[11px] text-white/55">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-white">
              <option value="start">Waterfall</option>
              <option value="size">Size</option>
              <option value="time">Time</option>
            </select>
          </label>
        </div>
        <div className="px-2 py-2 font-mono text-[10.5px]">
          <div className="flex items-end gap-2 pb-1 text-white/40">
            <span className="w-28 shrink-0">Name</span>
            <span className="w-11 shrink-0 text-right">Size</span>
            <span className="relative h-3 min-w-0 flex-1">
              {ticks.map((tk, i) => (
                <span key={tk} className={`absolute whitespace-nowrap ${i === 0 ? '' : '-translate-x-1/2'} ${i % 2 || i === ticks.length - 1 ? 'hidden' : ''}`} style={{ left: pct(tk) }}>
                  {tk === 0 ? '0' : fmtMs(tk)}
                </span>
              ))}
            </span>
          </div>
          <ul className="max-h-80 space-y-px overflow-y-auto" aria-label={`${shown.length} requests`}>
            {shown.map(({ r, i }) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSel((x) => (x === i ? null : i))}
                  aria-pressed={sel === i}
                  className={`flex w-full items-center gap-2 rounded px-0.5 py-px text-left ${sel === i ? 'bg-[#2b3a67]' : 'hover:bg-white/5'}`}
                >
                  <span className="flex w-28 shrink-0 items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-sm" style={{ background: typeColor[r.type] }} />
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="w-11 shrink-0 text-right text-white/50">{fmtBytes(r.size).replace(' ', '')}</span>
                  <span className="relative h-2.5 min-w-0 flex-1">
                    <span className="absolute inset-y-0.5 bg-white/25" style={{ left: pct(r.start), width: `calc(${pct(r.wait)} + 1px)` }} />
                    <span className="absolute inset-y-0 rounded-sm" style={{ left: pct(r.start + r.wait), width: `calc(${pct(r.dl)} + 2px)`, background: typeColor[r.type] }} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
            <span className="w-28 shrink-0 font-sans text-[10px] font-semibold text-white/50 uppercase">Layout shifts</span>
            <span className="w-11 shrink-0" />
            <span className="relative h-4 min-w-0 flex-1">
              <span className="absolute top-0 grid h-4 -translate-x-1/2 place-items-center rounded bg-[#e5484d] px-1 text-[9px] font-bold text-white" style={{ left: pct(shiftAt) }} title="Layout shift">
                ⚡
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-3 text-xs" aria-live="polite">
        {s ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt className="text-faint">Request</dt>
            <dd className="font-mono break-all text-fg">
              {s.host ?? 'shop.example.com'}/{s.name}
            </dd>
            <dt className="text-faint">Type</dt>
            <dd className="text-fg">{s.type === 'fetch' ? 'fetch (XHR)' : s.type}{s.status ? ` · ${s.status}` : ''}</dd>
            <dt className="text-faint">Size</dt>
            <dd className="text-fg">{fmtBytes(s.size)}</dd>
            <dt className="text-faint">Waiting (TTFB)</dt>
            <dd className={s.wait > 1000 ? 'font-semibold text-danger' : 'text-fg'}>{fmtMs(s.wait)}</dd>
            <dt className="text-faint">Download</dt>
            <dd className={s.dl > 1000 ? 'font-semibold text-danger' : 'text-fg'}>{fmtMs(s.dl)}</dd>
            <dt className="text-faint">Priority</dt>
            <dd className="text-fg">{s.priority}</dd>
            <dt className="text-faint">Render-blocking</dt>
            <dd className={s.blocking?.startsWith('Yes') && s.type === 'js' ? 'font-semibold text-danger' : 'text-fg'}>{s.blocking ?? 'No'}</dd>
            <dt className="text-faint">Initiator</dt>
            <dd className="font-mono break-all text-fg">{s.initiator}</dd>
          </dl>
        ) : (
          <p className="flex items-center gap-2 text-muted">
            <MousePointerClick size={14} aria-hidden="true" /> Click a request to see its details, like the Headers and Timing tabs in DevTools. The ⚡ marker on the bottom track is a layout shift.
          </p>
        )}
      </div>
      <ShiftDetails />
    </div>
  );
}

function ShiftDetails() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 text-xs">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between font-semibold text-fg">
        <span>⚡ Layout shift at {fmtMs(shiftAt)} (Performance panel)</span>
        <span className="text-muted">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1 text-muted">
          <p>
            Score: <strong className="text-fg">0.19</strong> · Moved: <code className="font-mono text-fg">main.product</code>, <code className="font-mono text-fg">footer</code> by 120 px down
          </p>
          <p>
            Likely cause: a new <code className="font-mono text-fg">div.promo-banner</code> was inserted above them by a script.
          </p>
        </div>
      )}
    </div>
  );
}
