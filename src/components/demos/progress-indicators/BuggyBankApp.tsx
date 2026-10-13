import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, RefreshCw, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { ProgressKeyframes, IosBar, IosSpinner } from './Indicators';

/*
 * A deliberately broken banking app (iOS). Bugs (don't spoil them for learners!):
 *  1. Opening a statement shows a full-screen "Loading" overlay for ~60 ms on every tap: a flash.
 *     (No delay before showing, no minimum display.)
 *  2. The export percentage goes backwards (46% -> 31%) because it is bytes-so-far / bytes-known-so-far,
 *     and the total grows when the app discovers the big annual summary PDF.
 *  3. The export takes about 2 minutes (time runs 8x faster here) and there is no Cancel; the sheet blocks the app.
 *  4. The bar is faked: it runs to 99% on a timer and waits for the server. If the final request fails,
 *     nothing handles it: "99% · Almost done…" forever.
 *  5. Refreshing the balance with server errors on: the spinner never stops, no message.
 *  6. When the export finishes, the screen shows a check mark but nothing is announced to VoiceOver
 *     (no live region / accessibility announcement). Visible in the VoiceOver caption panel.
 */

const statements = [
  { id: '2025-10', name: 'October 2025', lines: [['Grocery Market', '−54.20'], ['Salary', '+2,950.00'], ['Rent', '−1,100.00'], ['Coffee Corner', '−3.80']] },
  { id: '2025-09', name: 'September 2025', lines: [['Train pass', '−89.00'], ['Salary', '+2,950.00'], ['Rent', '−1,100.00'], ['Bookshop', '−24.90']] },
  { id: '2025-08', name: 'August 2025', lines: [['Hotel Lisboa', '−412.00'], ['Salary', '+2,950.00'], ['Rent', '−1,100.00'], ['Gym', '−39.00']] },
  { id: '2025-07', name: 'July 2025', lines: [['Electricity', '−71.35'], ['Salary', '+2,950.00'], ['Rent', '−1,100.00'], ['Pharmacy', '−12.60']] },
];

const SPEED = 8; // demo time runs 8x faster than the "real" app
const EXPORT_HOLD = 13000; // reaches 99% here (real ms)
const EXPORT_DONE = 15000;

/** BUG 2 + 4: the percentage the app shows at time t (ms). */
function fakePercent(t: number) {
  if (t < 6000) return Math.floor((46 * t) / 6000);
  if (t < EXPORT_HOLD) return Math.floor(31 + ((99 - 31) * (t - 6000)) / (EXPORT_HOLD - 6000));
  return 99;
}

interface Log {
  id: number;
  method: string;
  path: string;
  status: 'pending' | number;
  note?: string;
}

export function BuggyBankApp() {
  const [screen, setScreen] = useState<'home' | string>('home');
  const [flash, setFlash] = useState(false);
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [updated, setUpdated] = useState('9:12');
  const [exp, setExp] = useState<{ state: 'off' | 'running' | 'done'; t: number }>({ state: 'off', t: 0 });
  const [serverError, setServerError] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [spoken, setSpoken] = useState<{ id: number; text: string }[]>([]);
  const [log, setLog] = useState<Log[]>([]);

  const timers = useRef<number[]>([]);
  const tick = useRef<number | null>(null);
  const logId = useRef(0);
  const sayId = useRef(0);
  const errRef = useRef(serverError);
  errRef.current = serverError;

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

  const say = (text: string) => {
    const id = ++sayId.current;
    setSpoken((s) => [{ id, text }, ...s].slice(0, 4));
  };
  const addLog = (method: string, path: string) => {
    const id = ++logId.current;
    setLog((l) => [{ id, method, path, status: 'pending' as const }, ...l].slice(0, 5));
    return id;
  };
  const endLog = (id: number, status: number, note?: string) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status, note } : e)));

  const openStatement = (id: string, name: string) => {
    // BUG 1: overlay shown immediately and hidden as soon as the (fast) response arrives
    setFlash(true);
    const req = addLog('GET', `/api/statements/${id}`);
    later(() => {
      setFlash(false);
      setScreen(id);
      endLog(req, 200, '58 ms');
      say(`${name} statement, heading`);
    }, 60);
  };

  const refreshBalance = () => {
    if (balanceBusy) return;
    setBalanceBusy(true);
    say('Refreshing balance');
    const req = addLog('GET', '/api/accounts/balance');
    const fails = errRef.current;
    later(() => {
      if (fails) {
        endLog(req, 500);
        return; // BUG 5: busy state never cleared, no message
      }
      endLog(req, 200);
      setBalanceBusy(false);
      setUpdated('just now');
      say('Balance updated');
    }, 1200);
  };

  const startExport = () => {
    if (exp.state === 'running') return;
    const fails = errRef.current;
    const req = addLog('POST', '/api/exports?year=2025');
    later(() => endLog(req, 202, 'processing'), 400);
    setExp({ state: 'running', t: 0 });
    say('Exporting statements. Progress bar, 0 percent');
    const started = performance.now();
    let lastSay = 0;
    let poll: number | null = null;
    tick.current = window.setInterval(() => {
      const t = performance.now() - started;
      setExp((e) => (e.state === 'running' ? { ...e, t } : e));
      if (t - lastSay > 4000) {
        lastSay = t;
        say(`${fakePercent(t)} percent`);
      }
      if (poll === null && t > EXPORT_HOLD + 500) poll = addLog('GET', '/api/exports/88');
      if (t > EXPORT_DONE) {
        if (fails) {
          // BUG 4: the error is ignored; the bar sits at 99% forever
          if (poll !== null) endLog(poll, 500);
          if (tick.current) clearInterval(tick.current);
          tick.current = null;
          setExp((e) => ({ ...e, t: EXPORT_HOLD }));
          return;
        }
        if (poll !== null) endLog(poll, 200, 'ready');
        if (tick.current) clearInterval(tick.current);
        tick.current = null;
        setExp({ state: 'done', t });
        // BUG 6: no announcement of the result
      }
    }, 100);
  };

  const restart = () => {
    clearAll();
    setScreen('home');
    setFlash(false);
    setBalanceBusy(false);
    setUpdated('9:12');
    setExp({ state: 'off', t: 0 });
    setSpoken([]);
    setLog([]);
  };

  const sub = 'rgba(60,60,67,.6)';
  const st = statements.find((s) => s.id === screen);
  const pct = exp.state === 'done' ? 100 : fakePercent(exp.t);
  const count = Math.min(12, Math.floor((12 * exp.t) / EXPORT_HOLD) + 1);
  const leftReal = Math.max(0, ((EXPORT_HOLD - exp.t) * SPEED) / 1000);
  const leftText = exp.t >= EXPORT_HOLD ? 'Almost done…' : leftReal > 90 ? 'About 2 min left' : leftReal > 45 ? 'About 1 min left' : `About ${Math.max(5, Math.round(leftReal / 5) * 5)} s left`;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <ProgressKeyframes />
      <PhoneFrame width={290}>
        <div className="relative flex h-full flex-col bg-[#f2f2f7] text-black">
          {st ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 px-2 pt-1">
                <button type="button" onClick={() => setScreen('home')} className="flex items-center rounded-md px-1 py-1 text-[15px] text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]">
                  <ChevronLeft size={20} /> Accounts
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
                <h4 className="mt-1 text-[24px] leading-tight font-bold">{st.name}</h4>
                <p className="text-[12px]" style={{ color: sub }}>
                  Everyday account · statement
                </p>
                <ul className="mt-3 divide-y divide-[#e5e5ea] rounded-xl bg-white">
                  {st.lines.map(([who, amt]) => (
                    <li key={who} className="flex items-center justify-between gap-2 px-3 py-2.5 text-[14px]">
                      <span className="min-w-0 truncate">{who}</span>
                      <span className={`shrink-0 tabular-nums ${amt.startsWith('+') ? 'text-[#248a3d]' : ''}`}>€{amt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <p className="pt-1 text-[28px] leading-none font-bold tracking-tight">Accounts</p>
              <div className="mt-3 rounded-2xl bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px]" style={{ color: sub }}>
                      Everyday account
                    </p>
                    <p className="text-[26px] font-semibold tabular-nums">€2,481.36</p>
                    <p className="text-[11px]" style={{ color: sub }}>
                      Updated {updated}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshBalance}
                    aria-label={balanceBusy ? 'Refreshing balance' : 'Refresh balance'}
                    className="grid size-10 shrink-0 place-items-center rounded-full text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]"
                  >
                    {balanceBusy ? <IosSpinner size={20} /> : <RefreshCw size={19} />}
                  </button>
                </div>
              </div>

              <p className="mt-5 mb-1.5 px-1 text-[12px] font-medium tracking-wide uppercase" style={{ color: sub }}>
                Statements
              </p>
              <ul className="divide-y divide-[#e5e5ea] overflow-hidden rounded-xl bg-white">
                {statements.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => openStatement(s.id, s.name)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[15px] focus-visible:bg-[#e8f1ff] focus-visible:outline-none">
                      <FileText size={17} className="shrink-0 text-[#007aff]" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <ChevronRight size={16} className="shrink-0 text-[#c7c7cc]" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={startExport} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-semibold text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]">
                <Download size={17} /> Export 2025 (12 PDFs)
              </button>
            </div>
          )}

          {flash && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/35">
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/95 px-6 py-4">
                <IosSpinner size={30} />
                <span className="text-[13px]">Loading</span>
              </div>
            </div>
          )}

          {exp.state !== 'off' && (
            <div className="absolute inset-0 z-20 flex items-end bg-black/30">
              <div className="w-full rounded-t-2xl bg-white px-5 pt-5 pb-10">
                {exp.state === 'running' ? (
                  <>
                    <p className="text-[17px] font-semibold">Exporting statements</p>
                    <p className="mt-1 text-[13px]" style={{ color: sub }}>
                      Saving statement {count} of 12
                    </p>
                    <div className="mt-4" role="progressbar" aria-label="Export progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                      <IosBar value={pct / 100} />
                    </div>
                    <div className="mt-2 flex justify-between gap-2 text-[13px]">
                      <span className="font-semibold tabular-nums">{pct}%</span>
                      <span style={{ color: sub }}>{leftText}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <CheckCircle2 size={40} className="mx-auto text-[#34c759]" aria-hidden="true" />
                    <p className="mt-2 text-[17px] font-semibold">Exported</p>
                    <p className="text-[13px]" style={{ color: sub }}>
                      12 PDFs saved to Files
                    </p>
                    <button type="button" onClick={() => setExp({ state: 'off', t: 0 })} className="mt-4 h-11 w-full rounded-xl bg-[#007aff] text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2">
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {captions && (
            <div className="absolute inset-x-2 bottom-5 z-30 rounded-lg bg-black/85 px-3 py-2 text-[11px] text-white" aria-hidden="true">
              <p className="text-[10px] text-white/50">VoiceOver caption panel</p>
              {spoken.length === 0 ? <p className="text-white/50">…</p> : <p>{spoken[0].text}</p>}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 space-y-2 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">Server returns errors (500)</span>
            <input type="checkbox" checked={serverError} onChange={(e) => setServerError(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">VoiceOver caption panel</span>
            <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-faint">Time runs 8× faster in this demo: the export takes about 2 minutes in the real app, about 15 seconds here. The caption panel shows the last thing VoiceOver said.</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Use the app to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">{e.method}</span>
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
  );
}
