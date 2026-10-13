import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, RotateCcw, Share, XCircle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { ProgressKeyframes, IosSpinner, IosBar } from './Indicators';

/*
 * Timing lab: a CORRECT "Export album" flow in an iOS photos app, with knobs for the timing rules.
 * - Operation: 100 ms, 2 s, 30 s, never finishes (stalls), fails at 62%.
 * - Delay before show (400 ms): fast work never shows an indicator at all.
 * - Minimum display (500 ms): once shown, the indicator stays long enough to be read (no flash).
 * - Determinate bar vs indeterminate spinner.
 * - Cancel button: really stops the work.
 * Always correct: the Export button is blocked while working (even before the indicator shows),
 * no progress for 4 s shows "taking longer", no progress for 8 s times out into an error with Retry,
 * failures stop the bar where it was, and the result is announced (see "VoiceOver hears").
 * The timeline under the controls records the last run so the effect of each toggle is visible.
 */

type Op = 'instant' | 'short' | 'long' | 'never' | 'fail';
type Phase = 'idle' | 'working' | 'success' | 'error' | 'timeout' | 'canceled';

const OPS: { v: Op; t: string }[] = [
  { v: 'instant', t: '100 ms' },
  { v: 'short', t: '2 s' },
  { v: 'long', t: '30 s' },
  { v: 'never', t: 'Never finishes' },
  { v: 'fail', t: 'Fails' },
];
const DURATION: Partial<Record<Op, number>> = { instant: 100, short: 2000, long: 30000 };
const FAIL_AT = 3000;
const FAIL_P = 0.62;
const STALL_P = 0.35;
const SHOW_DELAY = 400;
const MIN_SHOW = 500;
const STALL_WARN = 4000;
const STALL_TIMEOUT = 8000;
const PHOTOS = 24;

interface Rec {
  op: Op;
  workEnd?: number;
  shownAt?: number;
  hiddenAt?: number;
  outcome?: Phase;
  determinate: boolean;
  cancel: boolean;
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
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${value === o.v ? 'bg-brand text-white ring-brand' : 'bg-surface text-muted ring-line hover:text-fg'}`}
          >
            {o.t}
          </button>
        ))}
      </div>
      {hint && <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p>}
    </div>
  );
}

const fmt = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s` : `${Math.round(ms)} ms`);

const tiles = ['#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#8ab17d', '#5e60ce', '#ff8fab', '#48cae4'];

export default function TimingLab() {
  const [op, setOp] = useState<Op>('short');
  const [delay, setDelay] = useState<'off' | 'on'>('off');
  const [minShow, setMinShow] = useState<'off' | 'on'>('off');
  const [kind, setKind] = useState<'indeterminate' | 'determinate'>('indeterminate');
  const [cancel, setCancel] = useState<'on' | 'off'>('on');

  const [phase, setPhase] = useState<Phase>('idle');
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stalled, setStalled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [said, setSaid] = useState<{ id: number; text: string }[]>([]);
  const [live, setLive] = useState('');
  const [rec, setRec] = useState<Rec | null>(null);

  const timers = useRef<number[]>([]);
  const tick = useRef<number | null>(null);
  const run = useRef(0);
  const t0 = useRef(0);
  const shownAt = useRef<number | null>(null);
  const finished = useRef(true);
  const lastP = useRef({ p: 0, at: 0 });
  const lastSaid = useRef(0);
  const lastPct = useRef(0);
  const sayId = useRef(0);
  const cfg = useRef({ op, delay, minShow, kind, cancel });

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  };
  useEffect(() => clearAll, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const now = () => performance.now() - t0.current;
  const say = (text: string) => {
    const id = ++sayId.current;
    lastSaid.current = now();
    setSaid((s) => [{ id, text }, ...s].slice(0, 5));
    setLive(text);
  };

  const finish = (outcome: Phase, p: number) => {
    if (finished.current) return;
    finished.current = true;
    const myRun = run.current;
    const end = now();
    clearAll();
    if (outcome === 'success') setProgress(1);
    else setProgress(p);
    const messages: Record<string, string> = {
      success: `Album exported. ${PHOTOS} photos saved to Files.`,
      error: `Export failed at photo ${Math.round(p * PHOTOS)} of ${PHOTOS}.`,
      timeout: 'Export timed out. Nothing was saved.',
      canceled: 'Export canceled.',
    };
    const apply = () => {
      if (run.current !== myRun) return;
      const hiddenAt = shownAt.current !== null ? now() : undefined;
      setShown(false);
      setStalled(false);
      setPhase(outcome);
      say(messages[outcome]);
      setRec((r) => (r ? { ...r, workEnd: end, hiddenAt, outcome } : r));
    };
    const s = shownAt.current;
    if (outcome !== 'canceled' && s !== null && cfg.current.minShow === 'on' && end - s < MIN_SHOW) {
      later(apply, MIN_SHOW - (end - s));
    } else apply();
  };

  const start = () => {
    if (!finished.current) return; // one export at a time
    clearAll();
    const c = { op, delay, minShow, kind, cancel };
    cfg.current = c;
    run.current++;
    t0.current = performance.now();
    shownAt.current = null;
    finished.current = false;
    lastP.current = { p: 0, at: 0 };
    lastSaid.current = -99999;
    lastPct.current = 0;
    setPhase('working');
    setShown(false);
    setProgress(0);
    setStalled(false);
    setElapsed(0);
    setRec({ op: c.op, determinate: c.kind === 'determinate', cancel: c.cancel === 'on' });

    const show = () => {
      if (finished.current) return;
      shownAt.current = now();
      setShown(true);
      say(c.kind === 'determinate' ? 'Exporting album, progress 0 percent' : 'Exporting album');
      setRec((r) => (r ? { ...r, shownAt: shownAt.current ?? undefined } : r));
    };
    if (c.delay === 'on') later(show, SHOW_DELAY);
    else show();

    const d = DURATION[c.op];
    if (d !== undefined) later(() => finish('success', 1), d);
    if (c.op === 'fail') later(() => finish('error', FAIL_P), FAIL_AT);

    tick.current = window.setInterval(() => {
      const e = now();
      let p: number;
      if (d !== undefined) p = Math.min(1, e / d);
      else if (c.op === 'fail') p = Math.min(FAIL_P, (e / FAIL_AT) * FAIL_P);
      else p = Math.min(STALL_P, (e / 2500) * STALL_P);
      if (p > lastP.current.p + 0.0001) lastP.current = { p, at: e };
      setProgress(p);
      setElapsed(e);
      const quiet = e - lastP.current.at;
      setStalled(quiet > STALL_WARN);
      // Milestones, at most one announcement every 5 s, and only while the bar is visible.
      if (c.kind === 'determinate' && shownAt.current !== null && e - lastSaid.current > 5000 && p < 1) {
        const pct = Math.floor(p * 4) * 25;
        if (pct > lastPct.current) {
          lastPct.current = pct;
          say(`${pct} percent`);
        }
      }
      if (quiet > STALL_TIMEOUT) finish('timeout', p);
    }, 100);
  };

  const reset = () => {
    clearAll();
    run.current++;
    finished.current = true;
    shownAt.current = null;
    setPhase('idle');
    setShown(false);
    setProgress(0);
    setStalled(false);
    setSaid([]);
    setLive('');
    setRec(null);
  };

  const working = phase === 'working';
  const pct = Math.round(progress * 100);
  const done = Math.round(progress * PHOTOS);
  const left = op === 'long' && working ? Math.max(1, Math.ceil((30000 - elapsed) / 1000)) : null;

  // ----- timeline verdicts -----
  let verdict: { tone: 'ok' | 'warn' | 'danger'; text: string }[] = [];
  if (rec && rec.outcome) {
    const vis = rec.shownAt !== undefined && rec.hiddenAt !== undefined ? rec.hiddenAt - rec.shownAt : null;
    if (vis === null) verdict.push({ tone: 'ok', text: `No indicator at all: the work took ${fmt(rec.workEnd ?? 0)}, faster than the ${SHOW_DELAY} ms delay. Nothing flashed.` });
    else if (vis < 300) verdict.push({ tone: 'danger', text: `Flash! The indicator was on screen for only ${fmt(vis)}. Turn on the delay or the minimum display.` });
    else verdict.push({ tone: 'ok', text: `Indicator on screen for ${fmt(vis)}: long enough to read, no flash.` });
    if ((rec.workEnd ?? 0) > 10000 && !rec.determinate) verdict.push({ tone: 'warn', text: 'More than 10 s with a spinner only: people can’t tell how long is left. Use a determinate bar.' });
    if ((rec.workEnd ?? 0) > 2500 && !rec.cancel) verdict.push({ tone: 'warn', text: 'Long wait with no Cancel: the user was stuck until it ended.' });
    if (rec.outcome === 'timeout') verdict.push({ tone: 'ok', text: `No progress for ${STALL_TIMEOUT / 1000} s, so the app gave up and offered Retry instead of spinning forever.` });
    if (rec.outcome === 'error') verdict.push({ tone: 'ok', text: 'The bar stopped where the work stopped and turned into an error with Retry.' });
    if (rec.outcome === 'canceled') verdict.push({ tone: 'ok', text: 'Canceled right away: no minimum display for a Cancel.' });
  }
  const scale = rec?.outcome ? Math.max(rec.workEnd ?? 0, rec.hiddenAt ?? 0, 600) : 1;
  const pos = (ms: number) => `${Math.min(100, (ms / scale) * 100)}%`;

  const sub = 'rgba(60,60,67,.6)';
  const resultBox =
    phase === 'success'
      ? { icon: CheckCircle2, color: '#248a3d', bg: '#e8f6ec', title: 'Album exported', text: `${PHOTOS} photos saved to Files.` }
      : phase === 'error'
        ? { icon: AlertCircle, color: '#c4291c', bg: '#fdecea', title: 'Export failed', text: `Stopped at photo ${done} of ${PHOTOS}. Check your storage and try again.` }
        : phase === 'timeout'
          ? { icon: Clock, color: '#c4291c', bg: '#fdecea', title: 'Export timed out', text: 'No progress for 8 seconds. Nothing was saved.' }
          : phase === 'canceled'
            ? { icon: XCircle, color: '#3a3a3c', bg: '#eef0f6', title: 'Export canceled', text: 'No files were saved.' }
            : null;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <ProgressKeyframes />
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 justify-center bg-subtle p-4 sm:p-6" style={{ colorScheme: 'light' }}>
          <PhoneFrame width={290}>
            <div className="relative flex h-full flex-col bg-white text-black">
              <div className="shrink-0 px-4 pt-2 pb-2">
                <p className="text-[13px] text-[#007aff]">‹ Albums</p>
                <p className="mt-1 text-[26px] leading-none font-bold tracking-tight">Lisbon, May</p>
                <p className="mt-1 text-[12px]" style={{ color: sub }}>
                  {PHOTOS} photos · 186 MB
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-4 gap-0.5 px-0.5" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="aspect-square" style={{ background: `linear-gradient(135deg, ${tiles[i % tiles.length]}, ${tiles[(i + 3) % tiles.length]})` }} />
                ))}
              </div>
              <div className="min-h-0 flex-1 space-y-3 px-4 pt-4">
                <button
                  type="button"
                  onClick={start}
                  disabled={working}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007aff] text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  <Share size={17} /> Export album
                </button>

                {working && shown && (
                  <div className="rounded-xl bg-[#f2f2f7] p-3">
                    {kind === 'determinate' ? (
                      <>
                        <p id="tl-label" className="text-[14px] font-medium">
                          Exporting {done} of {PHOTOS} photos
                        </p>
                        <div className="mt-2" role="progressbar" aria-labelledby="tl-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${done} of ${PHOTOS} photos`}>
                          <IosBar value={progress} />
                        </div>
                        <p className="mt-1.5 text-[12px]" style={{ color: sub }}>
                          {pct}%{left !== null ? ` · about ${left} s left` : ''}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <IosSpinner size={20} />
                        <p className="text-[14px] font-medium">Exporting album…</p>
                      </div>
                    )}
                    {stalled && <p className="mt-2 text-[12px] text-[#a05a00]">This is taking longer than usual…</p>}
                    {cancel === 'on' && (
                      <button
                        type="button"
                        onClick={() => finish('canceled', progress)}
                        className="mt-2 -ml-1 rounded-md px-1 py-1 text-[15px] text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {resultBox && (
                  <div className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: resultBox.bg }}>
                    <resultBox.icon size={18} className="mt-0.5 shrink-0" style={{ color: resultBox.color }} aria-hidden="true" />
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="font-semibold" style={{ color: resultBox.color }}>
                        {resultBox.title}
                      </p>
                      <p className="text-[#3a3a3c]">{resultBox.text}</p>
                      {(phase === 'error' || phase === 'timeout') && (
                        <>
                          {kind === 'determinate' && (
                            <div className="mt-2">
                              <IosBar value={progress} color="#c4291c" />
                            </div>
                          )}
                          <button type="button" onClick={start} className="mt-2 font-semibold text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]">
                            Try again
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {live}
              </p>
            </div>
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 border-t border-line p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <Seg<Op> label="How long the export takes" value={op} onChange={setOp} options={OPS} hint="Change it, then tap Export album." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Seg label="Delay before showing" value={delay} onChange={setDelay} options={[{ v: 'off', t: 'Off' }, { v: 'on', t: '400 ms' }]} hint="Easiest to see with 100 ms: the indicator never appears." />
            <Seg label="Minimum display" value={minShow} onChange={setMinShow} options={[{ v: 'off', t: 'Off' }, { v: 'on', t: '500 ms' }]} hint="Matters for fast work: try 100 ms with the delay off." />
            <Seg label="Indicator" value={kind} onChange={setKind} options={[{ v: 'indeterminate', t: 'Spinner' }, { v: 'determinate', t: 'Progress bar' }]} />
            <Seg label="Cancel button" value={cancel} onChange={setCancel} options={[{ v: 'on', t: 'Show' }, { v: 'off', t: 'Hide' }]} />
          </div>

          <div className="rounded-xl border border-line bg-subtle p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Last run</p>
              <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            {!rec && <p className="mt-2 text-sm text-faint">Tap Export album to record a timeline.</p>}
            {rec && !rec.outcome && <p className="mt-2 text-sm text-muted">Running… {fmt(elapsed)}</p>}
            {rec && rec.outcome && (
              <div className="mt-2 space-y-2 text-xs">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2">
                  <span className="text-muted">Work</span>
                  <span className="relative h-3 rounded bg-line">
                    <span className="absolute inset-y-0 left-0 rounded bg-fg/60" style={{ width: pos(rec.workEnd ?? 0) }} />
                  </span>
                  <span className="text-muted">Indicator</span>
                  <span className="relative h-3 rounded bg-line">
                    {rec.shownAt !== undefined && rec.hiddenAt !== undefined && (
                      <span className="absolute inset-y-0 rounded bg-brand" style={{ left: pos(rec.shownAt), width: `max(3px, ${pos(rec.hiddenAt - rec.shownAt)})` }} />
                    )}
                  </span>
                </div>
                <p className="text-faint">
                  Work: 0–{fmt(rec.workEnd ?? 0)} ·{' '}
                  {rec.shownAt !== undefined && rec.hiddenAt !== undefined ? `indicator: ${fmt(rec.shownAt)}–${fmt(rec.hiddenAt)}` : 'indicator: never shown'}
                </p>
                <ul className="space-y-1">
                  {verdict.map((v, i) => (
                    <li key={i} className={v.tone === 'ok' ? 'text-ok' : v.tone === 'warn' ? 'text-warn' : 'font-semibold text-danger'}>
                      {v.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] text-[12px] text-[#c9cde0]">
            <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold tracking-wide text-white/50 uppercase">VoiceOver hears</p>
            <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
              {said.length === 0 && <li className="text-white/35">Announcements appear here…</li>}
              {said.map((s, i) => (
                <li key={s.id} className={i === 0 ? 'text-white' : 'text-white/45'}>
                  “{s.text}”
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
