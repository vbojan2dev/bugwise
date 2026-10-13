import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

/*
 * Interactive explainer: an authenticator app shows a new 6-digit code every 30 seconds.
 * The server computes the same codes from the shared secret and the current time, and (typically)
 * accepts one step before and after to tolerate small clock differences.
 * The "phone clock offset" slider shows what clock skew does. Codes are a simplified stand-in for real TOTP.
 */

const STEP = 30;

function codeFor(step: number) {
  let h = Math.imul(step ^ 0x5bd1e995, 2654435761) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return String(h % 1000000).padStart(6, '0');
}
const spaced = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;

export default function TotpClockDemo() {
  const [now, setNow] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const t = now ?? 0;
  const phoneT = t + offset;
  const phoneStep = Math.floor(phoneT / STEP);
  const serverStep = Math.floor(t / STEP);
  const left = STEP - (phoneT % STEP);
  const diff = phoneStep - serverStep;
  const accepted = Math.abs(diff) <= 1;
  const phoneCode = codeFor(phoneStep);
  const r = 15;
  const circ = 2 * Math.PI * r;

  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl bg-[#f2f2f7] p-3 text-black" style={{ colorScheme: 'light' }}>
          <p className="px-1 text-[12px] font-semibold tracking-wide text-[#3c3c43]/60 uppercase">Authenticator app</p>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1d4ed8] text-white">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-[#3c3c43]/70">Northbank · leo@test.com</p>
              <p className="font-mono text-[26px] font-semibold tracking-[.12em] text-[#1d4ed8]" aria-live="off">
                {now === null ? '––– –––' : spaced(phoneCode)}
              </p>
            </div>
            <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0" aria-label={`${left} seconds left`} role="img">
              <circle cx="20" cy="20" r={r} fill="none" stroke="#e5e5ea" strokeWidth="4" />
              <circle cx="20" cy="20" r={r} fill="none" stroke={left <= 5 ? '#d70015' : '#1d4ed8'} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ * (1 - left / STEP)} transform="rotate(-90 20 20)" strokeLinecap="round" />
              <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3c3c43">
                {now === null ? '' : left}
              </text>
            </svg>
          </div>
          <label htmlFor="totp-offset" className="mt-4 block px-1 text-[13px] font-medium">
            Phone clock offset: <span className="font-mono">{offset > 0 ? '+' : ''}{offset} s</span>
          </label>
          <input id="totp-offset" type="range" min={-120} max={120} step={15} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="mt-1 w-full accent-[#1d4ed8]" />
          <div className="flex justify-between px-1 text-[11px] text-[#3c3c43]/60">
            <span>2 min slow</span>
            <span>correct</span>
            <span>2 min fast</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">Server accepts</p>
          <p className="text-xs text-muted">Same secret + server time. One step either side is a common tolerance.</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {[-1, 0, 1].map((d) => {
              const c = codeFor(serverStep + d);
              const match = now !== null && d === diff;
              return (
                <li key={d} className={`rounded-xl border px-1 py-2 text-center ${match ? 'border-ok bg-ok-soft' : 'border-line bg-subtle'}`}>
                  <p className="text-[11px] text-faint">{d === -1 ? 'previous' : d === 0 ? 'current' : 'next'}</p>
                  <p className="font-mono text-sm font-semibold text-fg">{now === null ? '––––––' : c}</p>
                </li>
              );
            })}
          </ul>
          <div role="status" className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${accepted ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
            {accepted ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />}
            <span className="text-fg">
              {accepted
                ? diff === 0
                  ? 'Accepted: phone and server are in the same 30-second step.'
                  : 'Accepted, but only thanks to the tolerance window. A little more drift and it fails.'
                : `Rejected: the phone's code belongs to a step ${Math.abs(diff)} away. The user sees "Invalid code" although they typed it correctly.`}
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">
        Move the slider: a phone clock that is set manually and drifts a minute or two is a real cause of "my codes never work" tickets. (Codes here are simplified, not real TOTP.)
      </figcaption>
    </figure>
  );
}
