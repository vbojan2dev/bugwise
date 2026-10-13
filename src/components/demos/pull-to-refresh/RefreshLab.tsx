import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { RefreshCw, RotateCcw, WifiOff, AlertCircle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { IosSpinner, M3Indicator } from './Indicators';

/*
 * Refresh lab: a correct pull-to-refresh on a news feed.
 * - Pull only starts when the gesture STARTS at the top of the list.
 * - Threshold + resistance are adjustable; the gauge shows how far you are.
 * - Exactly one request at a time: pulls during a refresh are ignored (and logged).
 * - Errors stop the spinner and show an inline message + Retry; offline answers immediately.
 * - New items go to the top, are highlighted, and "Updated" changes.
 * - A visible Refresh button gives a non-gesture way to do the same thing.
 * Pointer Events: works with a mouse (drag) and a finger. The mouse wheel scrolls too.
 */

interface Story {
  id: number;
  title: string;
  source: string;
  time: string;
}

const seed: Story[] = [
  { id: 1, title: 'City council approves new bike lanes on the river road', source: 'Metro Desk', time: '8:10' },
  { id: 2, title: 'Rail strike called off after late-night talks', source: 'Transport', time: '7:55' },
  { id: 3, title: 'Heatwave warning for the weekend: what to know', source: 'Weather', time: '7:30' },
  { id: 4, title: 'Local bakery wins national sourdough award', source: 'Food', time: '7:02' },
  { id: 5, title: 'New ferry timetable starts on Monday', source: 'Transport', time: '6:45' },
  { id: 6, title: 'Library extends opening hours during exams', source: 'Education', time: '6:20' },
  { id: 7, title: 'Stadium concert: road closures and parking tips', source: 'Metro Desk', time: '6:05' },
  { id: 8, title: 'Startup week brings 40 free workshops to town', source: 'Business', time: '5:50' },
];

const batches: Omit<Story, 'id'>[][] = [
  [
    { title: 'Breaking: main bridge reopens two days early', source: 'Metro Desk', time: '9:40' },
    { title: 'Airport adds direct flights to Lisbon', source: 'Travel', time: '9:38' },
  ],
  [
    { title: 'Football: City sign young striker on loan', source: 'Sport', time: '9:41' },
    { title: 'Farmers market moves to Saturdays', source: 'Food', time: '9:41' },
    { title: 'Power cut in the old town fixed', source: 'Metro Desk', time: '9:41' },
  ],
  [{ title: 'Museum night: free entry this Friday', source: 'Culture', time: '9:41' }],
];

type Platform = 'ios' | 'android';
type Net = 'fast' | 'slow' | 'error' | 'offline';
type Res = 'none' | 'normal' | 'strong';

const RES: Record<Res, number> = { none: 1, normal: 0.5, strong: 0.3 };
const THRESH = { low: 30, medium: 70, high: 110 } as const;
type Th = keyof typeof THRESH;

interface Log {
  id: number;
  text: string;
  status: 'pending' | 'ok' | 'error' | 'ignored' | 'offline';
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
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
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${value === o.v ? 'bg-brand text-white ring-brand' : 'bg-surface text-muted ring-line hover:text-fg'}`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RefreshLab() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [th, setTh] = useState<Th>('medium');
  const [res, setRes] = useState<Res>('normal');
  const [net, setNet] = useState<Net>('fast');

  const [items, setItems] = useState<Story[]>(seed);
  const [fresh, setFresh] = useState<number[]>([]);
  const [pull, setPullState] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState(false);
  const [updated, setUpdated] = useState('8:15');
  const [banner, setBanner] = useState<'error' | 'offline' | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const [buzz, setBuzz] = useState(false);

  const list = useRef<HTMLDivElement>(null);
  const g = useRef<{ pid: number; y: number; start: number; atTop: boolean; armed: boolean } | null>(null);
  const pullRef = useRef(0);
  const loading = useRef(false);
  const cursor = useRef(0);
  const nextId = useRef(100);
  const logId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const setPull = (v: number) => {
    pullRef.current = v;
    setPullState(v);
  };
  const addLog = (text: string, status: Log['status']) => {
    const id = ++logId.current;
    setLog((l) => [{ id, text, status }, ...l].slice(0, 6));
    return id;
  };

  const threshold = THRESH[th];

  const refresh = (source: 'pull' | 'button' | 'retry') => {
    if (loading.current) {
      addLog(`${source}: ignored, a refresh is already running`, 'ignored');
      return;
    }
    if (net === 'offline') {
      setBanner('offline');
      addLog(`${source}: no request, device is offline`, 'offline');
      return;
    }
    loading.current = true;
    setRefreshing(true);
    setBanner(null);
    const id = addLog('GET /api/headlines?since=latest', 'pending');
    const failing = net === 'error';
    later(
      () => {
        loading.current = false;
        setRefreshing(false);
        if (failing) {
          setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'error' } : e)));
          setBanner('error');
          return;
        }
        const batch = batches[cursor.current] ?? [];
        cursor.current++;
        const added = batch.map((b) => ({ ...b, id: nextId.current++ }));
        setItems((xs) => [...added, ...xs]);
        setFresh(added.map((a) => a.id));
        setUpdated('just now');
        setLog((l) => l.map((e) => (e.id === id ? { ...e, text: `${e.text} · ${added.length} new`, status: 'ok' } : e)));
        setDone(true);
        if (list.current) list.current.scrollTop = 0;
        later(() => setDone(false), 900);
        later(() => setFresh([]), 3500);
      },
      net === 'slow' ? 3000 : 900,
    );
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (g.current) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const start = list.current?.scrollTop ?? 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    g.current = { pid: e.pointerId, y: e.clientY, start, atTop: start <= 0, armed: false };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid || !list.current) return;
    const dy = e.clientY - cur.y;
    if (cur.atTop && dy > 0) {
      const p = Math.min(160, dy * RES[res]);
      setPull(p);
      list.current.scrollTop = 0;
      const armed = p >= threshold;
      if (armed !== cur.armed) {
        cur.armed = armed;
        if (armed) {
          setBuzz(true);
          later(() => setBuzz(false), 400);
        }
      }
    } else {
      if (pullRef.current) setPull(0);
      list.current.scrollTop = cur.start - dy;
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    g.current = null;
    if (e.type !== 'pointercancel' && pullRef.current >= threshold) refresh('pull');
    setPull(0);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    loading.current = false;
    cursor.current = 0;
    g.current = null;
    setItems(seed);
    setFresh([]);
    setPull(0);
    setRefreshing(false);
    setDone(false);
    setUpdated('8:15');
    setBanner(null);
    setLog([]);
  };

  const progress = Math.min(1, pull / threshold);
  const state = refreshing ? 'Refreshing' : done ? 'Done' : pull > 0 ? (pull >= threshold ? 'Armed' : 'Pulling') : banner === 'error' ? 'Error' : 'Idle';
  const ios = platform === 'ios';
  const gap = ios ? (refreshing || done ? 52 : pull) : 0;
  const sub = ios ? 'rgba(60,60,67,.6)' : '#49454f';

  const feed = (
    <div
      ref={list}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="relative min-h-0 flex-1 overflow-y-auto select-none"
      style={{ touchAction: 'none', overscrollBehavior: 'contain', WebkitUserSelect: 'none' }}
    >
      {ios && (
        <div className="flex flex-col items-center justify-end overflow-hidden" style={{ height: gap, transition: g.current ? 'none' : 'height 200ms ease' }}>
          {gap > 8 && (
            <>
              <IosSpinner progress={progress} spinning={refreshing} done={done} size={22} />
              <span className="mt-1 mb-1.5 text-[11px]" style={{ color: sub }}>
                {refreshing ? 'Checking for stories…' : done ? 'Updated just now' : pull >= threshold ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      )}
      {banner && (
        <div role="alert" className={`mx-3 my-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] ${banner === 'error' ? 'bg-[#fdecea] text-[#8c1d18]' : 'bg-[#eef0f6] text-[#3a3a3c]'}`}>
          {banner === 'error' ? <AlertCircle size={15} className="mt-px shrink-0" /> : <WifiOff size={15} className="mt-px shrink-0" />}
          <span className="min-w-0 flex-1">{banner === 'error' ? 'Couldn’t load new stories.' : 'You’re offline. Showing saved stories.'}</span>
          {banner === 'error' && (
            <button type="button" onClick={() => refresh('retry')} className="shrink-0 font-semibold underline">
              Retry
            </button>
          )}
        </div>
      )}
      <ul>
        {items.map((s) => (
          <li key={s.id} className="border-b px-4 py-2.5" style={{ borderColor: ios ? '#e5e5ea' : '#e7e0ec', background: fresh.includes(s.id) ? (ios ? '#e8f1ff' : '#eaddff') : undefined, transition: 'background 600ms' }}>
            <p className="text-[14px] leading-snug font-semibold">{s.title}</p>
            <p className="mt-0.5 text-[11px]" style={{ color: sub }}>
              {s.source} · {s.time}
              {fresh.includes(s.id) && <span className="ml-1.5 rounded px-1 text-[10px] font-semibold" style={{ background: ios ? '#007aff' : '#6750a4', color: '#fff' }}>New</span>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 justify-center bg-subtle p-4 sm:p-6" style={{ colorScheme: 'light' }}>
          <PhoneFrame width={290} os={platform}>
            {ios ? (
              <div className="flex h-full flex-col bg-white text-black">
                <div className="flex shrink-0 items-end justify-between px-4 pt-2 pb-1">
                  <div>
                    <p className="text-[26px] leading-none font-bold tracking-tight">Headlines</p>
                    <p className="mt-1 text-[11px]" style={{ color: sub }}>
                      Updated {updated}
                    </p>
                  </div>
                  <button type="button" aria-label="Refresh headlines" onClick={() => refresh('button')} disabled={refreshing} className="grid size-9 place-items-center rounded-full text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff] disabled:opacity-40">
                    <RefreshCw size={19} />
                  </button>
                </div>
                {feed}
              </div>
            ) : (
              <div className="relative flex h-full flex-col bg-[#fef7ff] text-[#1d1b20]">
                <div className="flex h-14 shrink-0 items-center gap-2 px-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[19px] leading-tight">Headlines</p>
                    <p className="text-[11px]" style={{ color: sub }}>
                      Updated {updated}
                    </p>
                  </div>
                  <button type="button" aria-label="Refresh headlines" onClick={() => refresh('button')} disabled={refreshing} className="grid size-10 place-items-center rounded-full text-[#49454f] hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4] disabled:opacity-40">
                    <RefreshCw size={20} />
                  </button>
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {feed}
                  {(pull > 0 || refreshing || done) && (
                    <span
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
                      style={{ top: refreshing || done ? threshold * 0.6 : Math.min(pull, threshold * 1.4) * 0.6 - 20, transform: `translateX(-50%) scale(${done ? 0.85 : 1})`, transition: g.current ? 'none' : 'top 200ms ease, transform 200ms ease' }}
                    >
                      <M3Indicator progress={progress} spinning={refreshing} done={done} size={36} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 border-t border-line p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Seg<Platform> label="Platform" value={platform} onChange={setPlatform} options={[{ v: 'ios', t: 'iOS' }, { v: 'android', t: 'Android' }]} />
            <Seg<Th> label="Threshold" value={th} onChange={setTh} options={[{ v: 'low', t: 'Low 30' }, { v: 'medium', t: 'Medium 70' }, { v: 'high', t: 'High 110' }]} />
            <Seg<Res> label="Resistance" value={res} onChange={setRes} options={[{ v: 'none', t: 'None' }, { v: 'normal', t: 'Normal' }, { v: 'strong', t: 'Strong' }]} />
            <Seg<Net> label="Network" value={net} onChange={setNet} options={[{ v: 'fast', t: 'Fast' }, { v: 'slow', t: 'Slow 3 s' }, { v: 'error', t: 'Server error' }, { v: 'offline', t: 'Offline' }]} />
          </div>

          <div className="rounded-xl border border-line bg-subtle p-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">
                State: <strong className="text-fg">{state}</strong>
              </span>
              <span className={`text-xs ${buzz ? 'font-semibold text-brand' : 'text-faint'}`}>{buzz ? 'Bzz! haptic' : 'haptic'}</span>
            </div>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (pull / 160) * 100)}%` }} />
              <span className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${(threshold / 160) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-faint">
              Pull: {Math.round(pull)} px of {threshold} px needed. The red line is the threshold.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
              <button type="button" onClick={reset} className="flex items-center gap-1 font-sans text-xs font-medium text-white/60 hover:text-white">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <ul className="min-h-[6rem] space-y-1 px-3 py-2" aria-live="polite">
              {log.length === 0 && <li className="text-white/35">Pull down from the top of the list…</li>}
              {log.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{e.text}</span>
                  {e.status === 'pending' && <span className="shrink-0 text-[#fbbf24]">pending…</span>}
                  {e.status === 'ok' && <span className="shrink-0 text-[#34d399]">200</span>}
                  {e.status === 'error' && <span className="shrink-0 text-[#f87171]">500</span>}
                  {e.status === 'ignored' && <span className="shrink-0 text-white/40">skipped</span>}
                  {e.status === 'offline' && <span className="shrink-0 text-white/40">offline</span>}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-faint">
            Try: pull during a slow refresh. Scroll down, then drag back up to the top in one go (it should not refresh). Switch to Server error and Offline. Use the refresh button with the keyboard.
          </p>
        </div>
      </div>
    </div>
  );
}
