import { useEffect, useState } from 'react';
import { Check, Flag, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { useArtifact, useCapstone } from './useCapstone';
import { inputCls } from './ui';
import FinishTesting from './FinishTesting';

interface Session {
  charter: number | null;
  done: number[];
  runningSince: number | null;
  elapsed: number;
  notes: string;
}
const blank = (): Session => ({ charter: null, done: [], runningSince: null, elapsed: 0, notes: '' });
const BOX_MIN = 45;

export const CHARTERS = [
  { area: 'Checkout', text: 'Explore checkout with tricky addresses and delivery times to discover orders that can be placed but never delivered.' },
  { area: 'Cart', text: `Explore the cart with coupons and totals around €${SPEC.freeDeliveryFrom} to discover pricing and discount errors.` },
  { area: 'Login', text: 'Explore login with input phones really produce (capital letters, spaces, typos) to discover sign-in and security problems.' },
  { area: 'Search', text: 'Explore search and filters with accents, long names and combinations to discover wrong or missing results.' },
  { area: 'Languages', text: `Explore the full order flow in ${SPEC.languages[1]} and ${SPEC.languages[2]} to discover translation, layout and number format problems.` },
  { area: 'Display', text: 'Explore every screen in dark mode and with large text to discover readability problems.' },
  { area: 'Screen reader', text: 'Explore ordering with the screen reader to discover controls and information blind users cannot use.' },
  { area: 'Interruptions', text: 'Explore rotation, background, offline and notifications during ordering and tracking to discover lost data and stale screens.' },
  { area: 'Privacy', text: 'Explore profile, notification settings and logout to discover ignored choices and exposed personal data.' },
];

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Charters, a session timer and notes for the exploratory session. */
export default function ExploreSession() {
  const state = useCapstone();
  const [s, setS, loaded] = useArtifact<Session>('explore', blank);
  const [now, setNow] = useState(() => Date.now());
  const running = s.runningSince != null;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const elapsed = s.elapsed + (running && s.runningSince ? Math.max(0, now - s.runningSince) : 0);
  const pct = Math.min(100, (elapsed / (BOX_MIN * 60000)) * 100);
  const over = elapsed >= BOX_MIN * 60000;

  const start = () => setS((p) => (p.runningSince != null ? p : { ...p, runningSince: Date.now() }));
  const pause = () => setS((p) => (p.runningSince == null ? p : { ...p, elapsed: p.elapsed + (Date.now() - p.runningSince), runningSince: null }));
  const reset = () => {
    if (elapsed === 0 || confirm('Reset the session timer to 00:00?')) setS((p) => ({ ...p, elapsed: 0, runningSince: null }));
  };
  const toggleDone = (i: number) => setS((p) => ({ ...p, done: p.done.includes(i) ? p.done.filter((x) => x !== i) : [...p.done, i] }));

  const reports = state?.reports.length ?? 0;

  return (
    <div className="not-prose grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="card min-w-0 p-5" aria-labelledby="charters-h">
        <h2 id="charters-h" className="flex items-center gap-2 font-semibold">
          <Flag size={18} className="text-brand" aria-hidden /> Pick a charter
        </h2>
        <p className="mt-1 text-sm text-muted">
          One mission at a time. Pick one, set the timer, and stay on it. When you're done, tick it off and pick the next. Nine charters cover the whole release; you don't
          have to do them all.
        </p>
        <ul className="mt-4 space-y-2">
          {CHARTERS.map((c, i) => {
            const active = s.charter === i;
            const isDone = s.done.includes(i);
            return (
              <li key={c.area} className={['flex min-w-0 items-start gap-2 rounded-xl border p-2.5', active ? 'border-brand bg-brand-soft' : 'border-line'].join(' ')}>
                <button
                  type="button"
                  onClick={() => toggleDone(i)}
                  aria-pressed={isDone}
                  aria-label={`Mark charter "${c.area}" as done`}
                  className={['mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border', isDone ? 'border-ok bg-ok text-white' : 'border-line-strong bg-surface'].join(' ')}
                >
                  {isDone && <Check size={14} strokeWidth={3} aria-hidden />}
                </button>
                <button type="button" onClick={() => setS((p) => ({ ...p, charter: p.charter === i ? null : i }))} aria-pressed={active} className="min-w-0 flex-1 text-left">
                  <span className={['block text-xs font-semibold', active ? 'text-brand' : 'text-faint'].join(' ')}>
                    {c.area}
                    {active && ' · current charter'}
                  </span>
                  <span className={['block text-sm leading-snug', isDone ? 'text-muted line-through decoration-faint' : ''].join(' ')}>{c.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="min-w-0 space-y-5">
        <section className="card p-5" aria-labelledby="timer-h">
          <h2 id="timer-h" className="flex items-center gap-2 font-semibold">
            <Timer size={18} className="text-brand" aria-hidden /> Session timer
          </h2>
          <p className={['mt-3 font-mono text-4xl font-bold tabular-nums', over ? 'text-warn' : ''].join(' ')} aria-live="off">
            {loaded ? fmt(elapsed) : '00:00'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle ring-1 ring-line" aria-hidden>
            <div className={['h-full rounded-full', over ? 'bg-warn' : 'bg-brand'].join(' ')} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">{over ? 'Time box reached. Wrap up your notes and reports.' : `Time box: ${BOX_MIN} minutes. Keeps going if you reload.`}</p>
          <div className="mt-3 flex gap-2">
            {running ? (
              <button type="button" onClick={pause} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-brand">
                <Pause size={15} aria-hidden /> Pause
              </button>
            ) : (
              <button type="button" onClick={start} disabled={!loaded} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg hover:opacity-90">
                <Play size={15} aria-hidden /> {elapsed > 0 ? 'Resume' : 'Start'}
              </button>
            )}
            <button type="button" onClick={reset} aria-label="Reset timer" className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:border-danger hover:text-danger">
              <RotateCcw size={15} aria-hidden />
            </button>
          </div>
        </section>

        <section className="card p-5">
          <label htmlFor="session-notes" className="font-semibold">
            Session notes
          </label>
          <p className="mt-0.5 text-xs text-muted">What you tried, questions, ideas for later. Bugs go in the app's bug report.</p>
          <textarea id="session-notes" rows={5} value={s.notes} onChange={(e) => setS((p) => ({ ...p, notes: e.target.value }))} className={inputCls + ' mt-2 resize-y'} placeholder="18:20 Cart: tried WELCOME10 twice…" />
          <p className="mt-3 text-sm text-muted">
            Bug reports filed: <strong className="text-fg tabular-nums">{reports}</strong>
          </p>
          <div className="mt-3">
            <FinishTesting compact />
          </div>
        </section>
      </div>
    </div>
  );
}

