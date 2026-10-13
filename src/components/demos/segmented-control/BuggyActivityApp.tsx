import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Footprints, Bike, PersonStanding, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { SegmentedControl } from './SegmentedControl';

/*
 * A deliberately broken "Activity" screen. Bugs (don't spoil them for learners!):
 *  1. Nothing is selected on first load, although Week data is shown.
 *  2. Race condition: responses are not canceled, so a slow older response overwrites a newer one.
 *  3. Tapping the already-selected segment reloads data again.
 *  4. Selection resets to "Day" after opening details and going back.
 *  5. With large text the labels are clipped (no ellipsis, no wrapping).
 *  6. In dark mode the selected segment is invisible.
 */

const ranges = ['Day', 'Week', 'Month', 'Year'] as const;
const delays = [400, 900, 700, 1800];
const data = [
  { title: 'Steps today', total: '6,482', bars: [10, 25, 60, 30, 80, 45, 20] },
  { title: 'Steps this week', total: '48,210', bars: [40, 65, 52, 80, 58, 92, 70] },
  { title: 'Steps this month', total: '201,904', bars: [70, 55, 85, 60, 75, 90, 66] },
  { title: 'Steps this year', total: '2,318,440', bars: [50, 60, 72, 68, 88, 95, 80] },
];
const activities = [
  { icon: PersonStanding, name: 'Morning walk', meta: '2.1 km · 28 min' },
  { icon: Footprints, name: 'Evening run', meta: '5.2 km · 31 min' },
  { icon: Bike, name: 'Cycling', meta: '12.4 km · 45 min' },
];

interface LogEntry {
  id: number;
  range: string;
  ms: number;
  done: boolean;
}

export function BuggyActivityApp() {
  const [selected, setSelected] = useState(-1); // BUG 1
  const [shown, setShown] = useState(1);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<'list' | 'details'>('list');
  const [largeText, setLargeText] = useState(false);
  const [dark, setDark] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const pending = useRef(0);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = (i: number) => {
    const id = nextId.current++;
    pending.current++;
    setLoading(true);
    setLog((l) => [{ id, range: ranges[i].toLowerCase(), ms: delays[i], done: false }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        setShown(i); // BUG 2: no check that this is still the latest request
        pending.current--;
        if (pending.current === 0) setLoading(false);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, done: true } : e)));
      }, delays[i]),
    );
  };

  const onSelect = (i: number) => {
    setSelected(i);
    load(i); // BUG 3: reloads even when i is already selected
  };

  const back = () => {
    setScreen('list');
    setSelected(0); // BUG 4
    load(0);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    pending.current = 0;
    setSelected(-1);
    setShown(1);
    setLoading(false);
    setScreen('list');
    setLog([]);
  };

  const d = data[shown];
  const fg = dark ? '#fff' : '#000';
  const sub = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';
  const card = dark ? '#1c1c1e' : '#f2f2f7';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame dark={dark} width={290}>
        {screen === 'list' ? (
          <div className="flex h-full flex-col px-4 pt-6" style={{ color: fg }}>
            <p className="text-[26px] font-bold tracking-tight">Activity</p>
            <div className="mt-3">
              <SegmentedControl
                options={ranges.map((r) => ({ label: r }))}
                value={selected}
                onChange={(v) => onSelect(v as number)}
                dark={dark}
                overflow="clip" /* BUG 5 */
                textScale={largeText ? 1.75 : 1}
                lowContrast={dark} /* BUG 6 */
                ariaLabel="Time range"
              />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-[12px] font-medium" style={{ color: sub }}>
                {d.title}
              </p>
              {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />}
            </div>
            <p className="text-[28px] font-bold tracking-tight tabular-nums" style={{ fontSize: largeText ? 34 : 28 }}>
              {d.total}
            </p>
            <div className={`mt-3 flex h-24 items-end gap-2 transition-opacity ${loading ? 'opacity-40' : ''}`}>
              {d.bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-md transition-all duration-500" style={{ height: `${h}%`, background: i === 5 ? '#5b4bff' : dark ? '#2c2a4a' : '#e3e1ff' }} />
              ))}
            </div>
            <p className="mt-5 mb-2 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
              Recent
            </p>
            <div className="space-y-2">
              {activities.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setScreen('details')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                  style={{ background: card }}
                >
                  <a.icon size={18} className="text-[#5b4bff]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">{a.name}</span>
                    <span className="block text-[11px]" style={{ color: sub }}>
                      {a.meta}
                    </span>
                  </span>
                  <ChevronRight size={16} style={{ color: sub }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col px-4 pt-4" style={{ color: fg }}>
            <button type="button" onClick={back} className="-ml-1 flex items-center text-[15px] text-[#007aff]">
              <ChevronLeft size={22} /> Activity
            </button>
            <p className="mt-3 text-[24px] font-bold tracking-tight">Morning walk</p>
            <p className="text-[13px]" style={{ color: sub }}>
              Today, 07:12
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                ['Distance', '2.1 km'],
                ['Duration', '28 min'],
                ['Steps', '2,904'],
                ['Calories', '142'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: card }}>
                  <p className="text-[11px]" style={{ color: sub }}>
                    {k}
                  </p>
                  <p className="text-[17px] font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-28 rounded-xl" style={{ background: `linear-gradient(135deg, ${dark ? '#1f2a1f' : '#dff3e4'}, ${dark ? '#1c1c1e' : '#eef6ff'})` }} />
            <p className="mt-2 text-center text-[11px]" style={{ color: sub }}>
              Route map
            </p>
          </div>
        )}
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
            Large text
            <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
            Dark mode
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Tap a segment to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">/api/steps?range={e.range}</span>
              {e.done ? <span className="text-[#34d399]">200 · {(e.ms / 1000).toFixed(1)}s</span> : <span className="text-[#fbbf24]">pending…</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
