import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, Clock, Copy, Landmark, Loader2, MessageSquare, RotateCcw, ShieldCheck } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken SMS one-time-code screen for a banking app. Bugs (don't spoil them for learners!):
 *  1. Resending does not cancel older codes: any unused, unexpired code works.
 *  2. The app converts the code to a number before sending it, so codes with a leading zero
 *     ("042917" -> 42917) are always rejected.
 *  3. The field has maxLength=6 and doesn't strip spaces: pasting "318 452" becomes "318 45" and fails.
 *  4. No lockout: unlimited wrong codes are accepted for checking (spec: 5 attempts).
 *  5. "Resend code" has no cooldown (spec: 30 s): every tap sends another SMS.
 *  6. Auto-submit fires twice (onChange handler + effect): the second request gets 409 "already used"
 *     and an error alert pops up although the user was signed in.
 *
 * Working on purpose: codes expire after 5 minutes, a used code is rejected (no replay),
 * iOS-style "From Messages" autofill, numeric keyboard hint, Verify disabled until 6 digits.
 */

type Screen = 'start' | 'otp' | 'home';
interface Code {
  code: string;
  issued: number;
  used: boolean;
}
interface Sms {
  id: number;
  code: string;
  time: number;
}
interface LogEntry {
  id: number;
  line: string;
  status?: number;
  note?: string;
}

const BLUE = '#1d4ed8';
const sub = 'rgba(60,60,67,.6)';
const LATENCY = 700;
const CODES = ['318452', '042917', '905163', '077340', '264809', '530071', '019388', '846215'];
const START = 9 * 3600 + 41 * 60;
const spaced = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;
const fmt = (s: number) => {
  const d = ((s % 86400) + 86400) % 86400;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(d / 3600))}:${p(Math.floor((d % 3600) / 60))}:${p(d % 60)}`;
};
const newServer = () => ({ codes: [] as Code[], next: 0, failed: 0 });

export function BuggyOtpApp() {
  const server = useRef(newServer());
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);
  const nowRef = useRef(START);

  const [now, setNow] = useState(START);
  const [screen, setScreen] = useState<Screen>('start');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const [sms, setSms] = useState<Sms[]>([]);
  const [clip, setClip] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => {
      nowRef.current += 1;
      setNow(nowRef.current);
    }, 1000);
    return () => {
      clearInterval(id);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const later = (fn: () => void, ms = LATENCY) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (line: string, status?: number, note?: string) => {
    const id = nextId.current++;
    setLog((l) => [{ id, line, status, note }, ...l].slice(0, 7));
    return id;
  };
  const finish = (id: number, status: number, note: string) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status, note } : e)));

  const sendCode = () => {
    const s = server.current;
    const c = CODES[s.next % CODES.length];
    s.next += 1;
    s.codes.push({ code: c, issued: nowRef.current, used: false });
    addLog('POST /api/2fa/send', 200, 'sms → •••• 0187');
    later(() => {
      const id = nextId.current++;
      setSms((list) => [{ id, code: c, time: nowRef.current }, ...list].slice(0, 6));
    }, 1400);
  };

  const verify = (raw: string) => {
    // BUG 2: the code is turned into a number, so leading zeros disappear.
    const payload = Number(raw);
    const id = addLog(`POST /api/2fa/verify {"code":${payload}}`);
    setPending((p) => p + 1);
    later(() => {
      setPending((p) => p - 1);
      const s = server.current;
      const sent = String(payload);
      // BUG 1: any issued code is accepted, not only the newest one.
      const match = s.codes.find((c) => c.code === sent);
      // BUG 4: s.failed is counted but never enforced.
      if (!match) {
        s.failed += 1;
        finish(id, 401, `invalid_code (failed: ${s.failed})`);
        setError("That code isn't right. Check the SMS and try again.");
        return;
      }
      if (match.used) {
        finish(id, 409, 'code_already_used');
        // BUG 6 shows up here: the duplicate auto-submit lands after the successful one.
        setAlertMsg('This code has already been used. Please request a new code.');
        return;
      }
      if (nowRef.current - match.issued > 300) {
        finish(id, 401, 'code_expired');
        setError('This code has expired. Tap "Resend code" to get a new one.');
        return;
      }
      match.used = true;
      s.failed = 0;
      finish(id, 200, 'verified · session started');
      setCode('');
      setError('');
      setScreen('home');
    });
  };

  const setValue = (v: string) => {
    setCode(v);
    if (/\D/.test(v)) {
      setError('Enter the 6 digits only.');
      return;
    }
    setError('');
    // BUG 6 (part 1): auto-submit from the change handler…
    if (v.length === 6) verify(v);
  };

  // BUG 6 (part 2): …and again from an effect that was added later "to support autofill".
  useEffect(() => {
    if (screen === 'otp' && /^\d{6}$/.test(code)) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const copy = (text: string) => {
    setClip(text);
    try {
      navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      /* clipboard not available: the in-demo Paste button still works */
    }
  };

  const advance = (secs: number) => {
    nowRef.current += secs;
    setNow(nowRef.current);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    server.current = newServer();
    nowRef.current = START;
    setNow(START);
    setScreen('start');
    setCode('');
    setError('');
    setPending(0);
    setSms([]);
    setClip('');
    setLog([]);
    setAlertMsg('');
  };

  const latest = sms[0];
  let body: ReactNode;
  if (screen === 'start') {
    body = (
      <div className="flex h-full flex-col px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: BLUE }}>
            <Landmark size={20} />
          </span>
          <p className="text-[20px] font-bold tracking-tight">Northbank</p>
        </div>
        <div className="mt-6 space-y-2 text-[14px]">
          <div className="rounded-xl bg-[#f2f2f7] px-3 py-2.5">leo@test.com</div>
          <div className="rounded-xl bg-[#f2f2f7] px-3 py-2.5 tracking-widest">••••••••••</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCode('');
            setError('');
            setScreen('otp');
            sendCode();
          }}
          className="mt-4 h-11 w-full rounded-xl text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
          style={{ background: BLUE }}
        >
          Log in
        </button>
        <p className="mt-3 text-center text-[12px]" style={{ color: sub }}>
          Password is already filled in. Step 2 is the SMS code.
        </p>
      </div>
    );
  } else if (screen === 'otp') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-3 pb-8">
        <button type="button" onClick={() => setScreen('start')} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: BLUE }}>
          <ChevronLeft size={22} /> Back
        </button>
        <span className="mt-3 grid size-11 place-items-center rounded-xl bg-[#e8eefc]" style={{ color: BLUE }}>
          <ShieldCheck size={22} />
        </span>
        <p className="mt-3 text-[21px] font-bold tracking-tight">Enter the code</p>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: sub }}>
          We sent a 6-digit code to •••• 0187. It expires in 5 minutes.
        </p>
        <label htmlFor="otp-code" className="mt-4 mb-1 text-[12px] font-medium" style={{ color: sub }}>
          Verification code
        </label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'otp-error' : undefined}
          className="h-12 w-full rounded-xl border border-transparent bg-[#f2f2f7] px-3 text-center font-mono text-[22px] tracking-[.4em] text-black outline-none focus:border-[#1d4ed8] focus:bg-white"
          placeholder="••••••"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {latest && (
            <button type="button" onClick={() => setValue(latest.code)} className="rounded-lg bg-[#e5e5ea] px-2.5 py-1.5 text-[12px] text-black">
              From Messages <strong className="font-mono">{latest.code}</strong>
            </button>
          )}
          {clip && (
            <button type="button" onClick={() => setValue(clip.slice(0, 6))} className="rounded-lg bg-[#e5e5ea] px-2.5 py-1.5 text-[12px] text-black">
              Paste
            </button>
          )}
        </div>
        {error && (
          <p id="otp-error" role="alert" className="mt-2 rounded-lg bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={!/^\d{6}$/.test(code)}
          onClick={() => verify(code)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white disabled:opacity-40"
          style={{ background: BLUE }}
        >
          {pending > 0 && <Loader2 size={16} className="animate-spin" />}
          {pending > 0 ? 'Checking…' : 'Verify'}
        </button>
        {/* BUG 5: always enabled, no 30-second cooldown */}
        <button type="button" onClick={sendCode} className="mt-3 self-center text-[13px] font-semibold" style={{ color: BLUE }}>
          Resend code
        </button>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col bg-[#f2f2f7] px-4 pt-5 pb-8">
        <p className="text-[26px] font-bold tracking-tight">Hi, Leo</p>
        <div className="mt-3 rounded-2xl p-4 text-white" style={{ background: BLUE }}>
          <p className="text-[12px] opacity-85">Current account</p>
          <p className="text-[24px] font-semibold">€2,481.30</p>
        </div>
        <button type="button" onClick={() => setScreen('start')} className="mt-4 h-11 w-full rounded-2xl bg-white text-[15px] font-semibold text-[#d70015]">
          Log out
        </button>
      </div>
    );
  }

  const statusColor = (s?: number) => (s === undefined ? '#fbbf24' : s < 300 ? '#34d399' : s === 409 ? '#fbbf24' : '#f87171');
  const ago = (t: number) => {
    const d = now - t;
    return d < 60 ? 'now' : `${Math.floor(d / 60)} min ago`;
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {body}
          {alertMsg && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/30 px-8">
              <div role="alertdialog" aria-labelledby="otp-alert-title" aria-describedby="otp-alert-msg" className="w-full overflow-hidden rounded-2xl bg-[#f2f2f2]/95 text-center">
                <p id="otp-alert-title" className="px-4 pt-4 text-[15px] font-semibold">
                  Verification failed
                </p>
                <p id="otp-alert-msg" className="px-4 pt-1 pb-4 text-[13px]">
                  {alertMsg}
                </p>
                <button type="button" onClick={() => setAlertMsg('')} className="h-11 w-full border-t border-black/15 text-[15px] font-semibold" style={{ color: BLUE }}>
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Clock size={13} /> Clock
          </p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-semibold text-fg">{fmt(now)}</span>
          <span className="flex-1" />
          <button type="button" onClick={() => advance(30)} className="rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-brand-soft">
            +30 s
          </button>
          <button type="button" onClick={() => advance(300)} className="rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-brand-soft">
            +5 min
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white text-black" style={{ colorScheme: 'light' }}>
        <p className="flex items-center gap-1.5 border-b border-black/10 bg-[#f7f7f9] px-3 py-2 text-xs font-semibold tracking-wide uppercase" style={{ color: sub }}>
          <MessageSquare size={13} /> Messages · Northbank
        </p>
        <div className="space-y-2 px-3 py-3">
          {sms.length === 0 && (
            <p className="text-[13px]" style={{ color: sub }}>
              No messages yet. Tap Log in on the phone.
            </p>
          )}
          {sms.map((m) => (
            <div key={m.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1 rounded-2xl rounded-bl-md bg-[#e9e9eb] px-3 py-2 text-[13px] leading-snug">
                Northbank: <strong>{spaced(m.code)}</strong> is your verification code. It expires in 5 minutes. Never share it with anyone.
                <span className="mt-0.5 block text-[11px]" style={{ color: sub }}>
                  {ago(m.time)}
                </span>
              </div>
              <button type="button" onClick={() => copy(spaced(m.code))} aria-label={`Copy code ${spaced(m.code)}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[#3c3c43] hover:bg-[#e5e5ea] focus-visible:outline-2 focus-visible:outline-[#1d4ed8]">
                <Copy size={15} />
              </button>
            </div>
          ))}
          {clip && (
            <p className="text-[11px]" style={{ color: sub }}>
              Copied "{clip}". Use Paste on the phone, or paste into the field.
            </p>
          )}
        </div>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-sm">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted">
          <li>A code expires after 5 minutes and works once.</li>
          <li>Only the newest code is valid; resending cancels older codes.</li>
          <li>"Resend code" is available 30 seconds after the last SMS.</li>
          <li>After 5 wrong codes, the user must log in again.</li>
          <li>Pasting a code with spaces works; codes can start with 0.</li>
        </ul>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Server log</p>
        <ul className="min-h-[5.5rem] space-y-1.5 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Requests appear here…</li>}
          {log.map((e) => (
            <li key={e.id} className="leading-snug">
              <span className="break-all">{e.line}</span>
              <span className="block" style={{ color: statusColor(e.status) }}>
                {e.status === undefined ? '  pending…' : `  ${e.status}${e.note ? ` · ${e.note}` : ''}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
