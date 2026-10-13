import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Copy, Eye, EyeOff, Landmark, RotateCcw } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { StrengthMeter, naiveStrength } from './PasswordField';

/*
 * A deliberately broken online-banking login + sign-up. Bugs (don't spoil them for learners!):
 *  1. The show/hide eye is an icon-only button with no accessible name and no state: screen readers say "button".
 *  2. Paste is blocked in both password fields (onPaste preventDefault), so copying from a password manager fails.
 *  3. The login password field has maxLength=16, sign-up has none: a 20-character password is saved at sign-up,
 *     but login silently cuts it to 16 characters and always fails.
 *  4. The strength meter only counts character types: "Password1!" is "Strong" and is accepted.
 *  5. Sign-up rules are hidden until the first failed attempt.
 *  6. Toggling show/hide re-creates the input and puts the cursor at the start: the next typed characters
 *     land in front of the password.
 * Everything else works: email check (case-insensitive), generic login error, account creation, network log.
 */

const SAVED_PW = 'Blue-Kettle-Sings-42';
const initialAccounts = { 'anna@example.com': SAVED_PW } as Record<string, string>;

interface LogEntry {
  id: number;
  text: string;
  status: number;
}

/** The team's shared password input (with BUGS 1, 2 and 6). */
function BuggyPassword({ id, label, value, onChange, maxLength, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; maxLength?: number; autoComplete: string }) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const refocus = useRef(false);
  useLayoutEffect(() => {
    if (refocus.current && ref.current) {
      refocus.current = false;
      ref.current.focus();
      ref.current.setSelectionRange(0, 0); // BUG 6: cursor jumps to the start
    }
  }, [shown]);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium">
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-[#d1d5db] bg-white focus-within:border-[#0f766e] focus-within:ring-2 focus-within:ring-[#0f766e]/30">
        <input
          key={shown ? 'text' : 'password'} /* BUG 6: a new element every toggle */
          ref={ref}
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          maxLength={maxLength} /* BUG 3 (login only) */
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => e.preventDefault()} /* BUG 2 */
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-11 w-0 min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none"
        />
        <button
          type="button" /* BUG 1: no aria-label, no aria-pressed */
          onClick={() => {
            refocus.current = true;
            setShown((s) => !s);
          }}
          className="mr-0.5 grid size-11 shrink-0 place-items-center rounded-full text-[#6b7280] outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50"
        >
          {shown ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

export function BuggyBankLogin() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [accounts, setAccounts] = useState<Record<string, string>>(initialAccounts);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [banner, setBanner] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [suEmail, setSuEmail] = useState('');
  const [suPw, setSuPw] = useState('');
  const [suError, setSuError] = useState('');
  const [rulesShown, setRulesShown] = useState(false); // BUG 5
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [sr, setSr] = useState(false);
  const [spoken, setSpoken] = useState('VoiceOver on. Tab to an element to hear it.');
  const [copied, setCopied] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addLog = (text: string, status: number) => setLog((l) => [{ id: nextId.current++, text, status }, ...l].slice(0, 5));
  const later = (fn: () => void, ms = 450) => {
    setBusy(true);
    timers.current.push(
      window.setTimeout(() => {
        setBusy(false);
        fn();
      }, ms),
    );
  };

  const login = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const em = email.trim().toLowerCase();
    if (!em || !pw) {
      setLoginError('Enter your email and password.');
      return;
    }
    setLoginError('');
    setBanner('');
    later(() => {
      const ok = accounts[em] !== undefined && accounts[em] === pw;
      addLog(`POST /api/login {"email":"${em}","password":"•••" (${pw.length} chars)}`, ok ? 200 : 401);
      if (ok) setUser(em);
      else setLoginError('Email or password is incorrect.');
    });
  };

  const rules = [
    { text: 'At least 10 characters', ok: suPw.length >= 10 },
    { text: 'At least one number', ok: /\d/.test(suPw) },
  ];

  const signup = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const em = suEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setSuError('Enter a valid email address.');
      return;
    }
    if (rules.some((r) => !r.ok)) {
      setRulesShown(true);
      setSuError('Your password doesn’t meet the requirements.');
      return;
    }
    if (suPw.length > 64) {
      setSuError('Use 64 characters or fewer.');
      return;
    }
    setSuError('');
    later(() => {
      if (accounts[em] !== undefined) {
        addLog(`POST /api/signup {"email":"${em}"}`, 409);
        setSuError('An account with this email already exists. Log in instead.');
        return;
      }
      addLog(`POST /api/signup {"email":"${em}","password":"•••" (${suPw.length} chars)}`, 201);
      setAccounts((a) => ({ ...a, [em]: suPw }));
      setTab('login');
      setEmail(em);
      setPw('');
      setLoginError('');
      setBanner('Account created. Log in with your new password.');
      setSuEmail('');
      setSuPw('');
      setRulesShown(false);
    });
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTab('login');
    setAccounts(initialAccounts);
    setEmail('');
    setPw('');
    setLoginError('');
    setBanner('');
    setUser(null);
    setSuEmail('');
    setSuPw('');
    setSuError('');
    setRulesShown(false);
    setLog([]);
    setBusy(false);
    setCopied('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SAVED_PW);
      setCopied('Copied. Now paste it into the password field (Ctrl/⌘ + V, or long-press › Paste).');
    } catch {
      setCopied('Your browser blocked the clipboard here. Select the password above and copy it by hand.');
    }
  };

  // Simulated VoiceOver: describe whatever gets focus inside the app.
  const announce = (el: HTMLElement) => {
    if (el.tagName === 'INPUT') {
      const input = el as HTMLInputElement;
      const name = input.labels?.[0]?.textContent?.trim() ?? '';
      const kind = input.type === 'password' ? 'secure text field' : 'text field';
      setSpoken(`${name}, ${kind}${input.type === 'password' && input.value ? `, ${input.value.length} characters` : ''}`);
    } else if (el.tagName === 'BUTTON') {
      const name = el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';
      const pressed = el.getAttribute('aria-pressed');
      setSpoken(`${name ? `${name}, ` : ''}button${pressed ? (pressed === 'true' ? ', selected' : '') : ''}`);
    }
  };

  const tabBtn = (t: 'login' | 'signup', text: string) => (
    <button
      type="button"
      aria-pressed={tab === t}
      onClick={() => {
        setTab(t);
        setBanner('');
      }}
      className={`flex-1 rounded-md py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50 ${tab === t ? 'bg-white text-[#0f766e] shadow-sm' : 'text-[#4b5563]'}`}
    >
      {text}
    </button>
  );

  return (
    <div className="flex w-full max-w-[440px] min-w-0 flex-col gap-4">
      <BrowserFrame url="bank.example.com">
        <div ref={box} onFocus={(e) => sr && announce(e.target as HTMLElement)} className="relative min-h-[440px] bg-[#f8fafc] px-4 py-4 text-[14px] text-[#111827] sm:px-6" style={{ colorScheme: 'light' }}>
          <p className="mb-4 flex items-center gap-2 font-bold text-[#0f766e]">
            <Landmark size={18} aria-hidden="true" /> Harbor Bank
          </p>

          {user ? (
            <div className="rounded-xl bg-white p-5 text-center shadow-sm">
              <p className="text-[17px] font-bold">Welcome back</p>
              <p className="mt-1 text-[13px] text-[#4b5563]">{user}</p>
              <p className="mt-4 text-[13px]">Current account</p>
              <p className="text-[24px] font-bold tabular-nums">€2,418.30</p>
              <button type="button" onClick={() => { setUser(null); setPw(''); }} className="mt-4 rounded-lg border border-[#d1d5db] px-3 py-1.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50">
                Log out
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-4 flex gap-1 rounded-lg bg-[#f1f5f9] p-1">
                {tabBtn('login', 'Log in')}
                {tabBtn('signup', 'Create account')}
              </div>

              {tab === 'login' ? (
                <form onSubmit={login} noValidate className="space-y-3">
                  {banner && <p className="rounded-lg bg-[#ecfdf5] px-3 py-2 text-[12px] text-[#065f46]" role="status">{banner}</p>}
                  <div>
                    <label htmlFor="bb-email" className="mb-1 block text-[13px] font-medium">
                      Email
                    </label>
                    <input id="bb-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-[15px] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/30" />
                  </div>
                  <BuggyPassword id="bb-pw" label="Password" value={pw} onChange={setPw} maxLength={16} autoComplete="current-password" />
                  {loginError && (
                    <p role="alert" className="text-[12px] text-[#dc2626]">
                      {loginError}
                    </p>
                  )}
                  <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-[#0f766e] font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#0f766e]/30 disabled:opacity-60">
                    {busy ? 'Logging in…' : 'Log in'}
                  </button>
                </form>
              ) : (
                <form onSubmit={signup} noValidate className="space-y-3">
                  <div>
                    <label htmlFor="bb-su-email" className="mb-1 block text-[13px] font-medium">
                      Email
                    </label>
                    <input id="bb-su-email" type="email" autoComplete="username" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-[15px] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/30" />
                  </div>
                  <BuggyPassword id="bb-su-pw" label="Create a password" value={suPw} onChange={setSuPw} autoComplete="new-password" />
                  {suPw && <StrengthMeter s={naiveStrength(suPw)} /> /* BUG 4 */}
                  {rulesShown && ( /* BUG 5 */
                    <ul className="space-y-0.5 text-[12px]">
                      {rules.map((r) => (
                        <li key={r.text} className={r.ok ? 'text-[#15803d]' : 'text-[#dc2626]'}>
                          {r.ok ? '✓' : '✗'} {r.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {suError && (
                    <p role="alert" className="text-[12px] text-[#dc2626]">
                      {suError}
                    </p>
                  )}
                  <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-[#0f766e] font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#0f766e]/30 disabled:opacity-60">
                    {busy ? 'Creating…' : 'Create account'}
                  </button>
                </form>
              )}
            </div>
          )}

          {sr && (
            <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-black/85 px-3 py-2 text-[12px] leading-snug text-white" aria-live="off">
              <span className="mr-1 font-semibold text-[#64d2ff]">VoiceOver:</span>
              {spoken}
            </div>
          )}
        </div>
      </BrowserFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm">
          <p className="font-medium">Password manager · saved login</p>
          <p className="mt-0.5 text-[13px] text-muted">
            anna@example.com · <span className="font-mono text-fg select-all">{SAVED_PW}</span>
          </p>
          <button type="button" onClick={copy} className="mt-1.5 flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium hover:bg-subtle">
            <Copy size={12} /> Copy password
          </button>
          {copied && <p className="mt-1 text-xs text-muted">{copied}</p>}
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm">
          Screen reader (VoiceOver captions)
          <input
            type="checkbox"
            checked={sr}
            onChange={(e) => {
              setSr(e.target.checked);
              setSpoken('VoiceOver on. Tab to an element to hear it.');
            }}
            className="accent-[var(--brand)]"
          />
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</div>
        <ul className="min-h-[5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Log in or create an account to see requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-start gap-2">
              <span className="min-w-0 flex-1 break-all">{e.text}</span>
              <span className={e.status < 300 ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
