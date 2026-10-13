import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, CreditCard, Eye, EyeOff, KeyRound, Leaf, Loader2, LogOut, MapPin, Package, RotateCcw, Smartphone } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken login + sign up flow for a grocery delivery app. Bugs (don't spoil them for learners!):
 *  1. Login looks the email up exactly as typed: uppercase letters or a leading/trailing space = "no account".
 *  2. Account enumeration: "No account found with this email" vs "Incorrect password".
 *  3. Login is sent as GET with the password in the URL query string (visible in the server log).
 *  4. "Log in" is not disabled while the request is in flight: double tap = two sessions.
 *  5. Sign up accepts passwords of 4+ characters although the rule says 8.
 *  6. Log out pushes the login screen on top of the history instead of resetting it,
 *     and the cached profile is not cleared: "Swipe back" shows the account screen again.
 *
 * Working on purpose (so learners can compare): lockout after 5 failed attempts, generic
 * password-reset message, sign up button disabled while loading, show/hide password.
 */

type Screen = 'login' | 'signup' | 'forgot' | 'home';
interface Details {
  orders: string;
  address: string;
  card: string;
}
interface Account {
  name: string;
  password: string;
  details: Details;
}
interface LogEntry {
  id: number;
  method: 'GET' | 'POST';
  path: string;
  status?: number;
  note?: string;
}
interface Profile {
  name: string;
  email: string;
  details: Details;
}

const LATENCY = 1100;
const GREEN = '#15803d';
const seedAccounts = () => new Map<string, Account>([['anna@test.com', { name: 'Anna Novak', password: 'Secret123!', details: { orders: '3 recent', address: '21 Baker St', card: 'Visa •••• 4242' } }]]);
const newServer = () => ({ accounts: seedAccounts(), failed: new Map<string, number>(), sessions: [] as string[] });
const sub = 'rgba(60,60,67,.6)';
const emptyDetails: Details = { orders: 'None yet', address: 'Add address', card: 'Add card' };

function Field({ label, id, children, help }: { label: string; id: string; children: ReactNode; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium" style={{ color: sub }}>
        {label}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="mt-1 text-[11px]" style={{ color: sub }}>
          {help}
        </p>
      )}
    </div>
  );
}

const inputCls = 'h-10 w-full rounded-xl border border-transparent bg-[#f2f2f7] px-3 text-[14px] text-black outline-none placeholder:text-[#3c3c43]/40 focus:border-[#15803d] focus:bg-white';

function PasswordInput({ id, value, onChange, show, onToggle, describedBy }: { id: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; describedBy?: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        aria-describedby={describedBy}
        className={`${inputCls} pr-10`}
        placeholder="Password"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute top-0 right-0 grid h-10 w-10 place-items-center rounded-xl text-[#3c3c43]/60 focus-visible:outline-2 focus-visible:outline-[#15803d]"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function BuggyLoginApp() {
  const server = useRef(newServer());
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  const [stack, setStack] = useState<Screen[]>(['login']);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState('');

  // Log in form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pending, setPending] = useState(0);

  // Sign up form
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suShow, setSuShow] = useState(false);
  const [suError, setSuError] = useState('');
  const [suLoading, setSuLoading] = useState(false);

  // Forgot password
  const [fpEmail, setFpEmail] = useState('');
  const [fpMessage, setFpMessage] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms = LATENCY) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (method: LogEntry['method'], path: string, status?: number, note?: string) => {
    const id = nextId.current++;
    setLog((l) => [{ id, method, path, status, note }, ...l].slice(0, 8));
    return id;
  };
  const finish = (id: number, status: number, note: string) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status, note } : e)));
  const flash = (msg: string) => {
    setToast(msg);
    later(() => setToast(''), 2200);
  };

  const screen = stack[stack.length - 1];
  const switchTab = (s: 'login' | 'signup') => setStack((st) => [...st.slice(0, -1), s]);
  const push = (s: Screen) => setStack((st) => [...st, s]);
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));

  const startSession = (p: Profile) => {
    const token = `sess_${Math.random().toString(36).slice(2, 6)}`;
    server.current.sessions.push(token);
    setSessions([...server.current.sessions]);
    setProfile(p);
    setStack(['home']); // correct: login resets history
    return token;
  };

  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Enter your email and password.');
      return;
    }
    // BUG 4: no "already submitting" guard, and the button is never disabled.
    setLoginError('');
    const em = email;
    const pw = password;
    // BUG 3: credentials travel in the URL of a GET request.
    const id = addLog('GET', `/api/login?email=${encodeURIComponent(em)}&password=${encodeURIComponent(pw)}&remember=${remember}`);
    setPending((p) => p + 1);
    later(() => {
      setPending((p) => p - 1);
      const s = server.current;
      const fails = s.failed.get(em) ?? 0;
      if (fails >= 5) {
        finish(id, 423, 'account_locked');
        setLoginError('Too many failed attempts. Try again in 15 minutes.');
        return;
      }
      const acc = s.accounts.get(em); // BUG 1: no trim(), no toLowerCase()
      if (!acc || acc.password !== pw) {
        s.failed.set(em, fails + 1);
        if (fails + 1 >= 5) {
          finish(id, 423, 'account_locked');
          setLoginError('Too many failed attempts. Try again in 15 minutes.');
          return;
        }
        // BUG 2: different messages tell an attacker which emails are registered.
        finish(id, 401, acc ? 'wrong_password' : 'user_not_found');
        setLoginError(acc ? 'Incorrect password. Please try again.' : 'No account found with this email.');
        return;
      }
      s.failed.delete(em);
      const token = startSession({ name: acc.name, email: em, details: acc.details });
      finish(id, 200, `session ${token}`);
      setPassword('');
      setShowPw(false);
    });
  };

  const submitSignup = (e: FormEvent) => {
    e.preventDefault();
    if (suLoading) return;
    const em = suEmail.trim();
    if (!suName.trim()) return setSuError('Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setSuError('Enter a valid email address.');
    if (suPassword.length < 4) return setSuError('Password must be at least 8 characters.'); // BUG 5: checks 4, not 8
    setSuError('');
    setSuLoading(true);
    const id = addLog('POST', '/api/signup', undefined, undefined);
    const name = suName.trim();
    const pw = suPassword;
    later(() => {
      setSuLoading(false);
      const s = server.current;
      if (s.accounts.has(em)) {
        finish(id, 409, 'email_taken');
        setSuError('An account with this email already exists. Try logging in.');
        return;
      }
      s.accounts.set(em, { name, password: pw, details: emptyDetails }); // server accepts it too
      const token = startSession({ name, email: em, details: emptyDetails });
      finish(id, 201, `user created · session ${token}`);
      setSuName('');
      setSuEmail('');
      setSuPassword('');
      setSuShow(false);
    });
  };

  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    if (fpLoading) return;
    if (!fpEmail.trim()) return setFpMessage('');
    setFpLoading(true);
    setFpMessage('');
    const id = addLog('POST', '/api/password-reset');
    const em = fpEmail.trim();
    later(() => {
      setFpLoading(false);
      finish(id, 202, 'accepted');
      setFpMessage(`If an account exists for ${em}, we've sent a link to reset your password.`);
    });
  };

  const logout = () => {
    const s = server.current;
    const token = s.sessions.pop();
    setSessions([...s.sessions]);
    addLog('POST', '/api/logout', 204, token ? `ended ${token}` : 'no session');
    setLoginError('');
    // BUG 6: pushes Log in on top of Home instead of resetting the history, and keeps the cached profile.
    push('login');
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    server.current = newServer();
    setStack(['login']);
    setProfile(null);
    setSessions([]);
    setLog([]);
    setToast('');
    setEmail('');
    setPassword('');
    setShowPw(false);
    setRemember(false);
    setLoginError('');
    setPending(0);
    setSuName('');
    setSuEmail('');
    setSuPassword('');
    setSuShow(false);
    setSuError('');
    setSuLoading(false);
    setFpEmail('');
    setFpMessage('');
    setFpLoading(false);
  };

  const tabs = (
    <div role="tablist" aria-label="Account" className="mt-4 flex rounded-[10px] p-[3px] text-[13px]" style={{ background: 'rgba(118,118,128,.12)' }}>
      {(['login', 'signup'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={screen === t}
          onClick={() => switchTab(t)}
          className={`flex-1 rounded-[8px] py-1.5 font-semibold transition focus-visible:outline-2 focus-visible:outline-[#15803d] ${screen === t ? 'bg-white text-black shadow-[0_3px_8px_rgba(0,0,0,.12)]' : 'text-[#3c3c43]/70'}`}
        >
          {t === 'login' ? 'Log in' : 'Sign up'}
        </button>
      ))}
    </div>
  );

  const header = (title: string, subtitle: string) => (
    <div className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: GREEN }}>
        <Leaf size={20} />
      </span>
      <div>
        <p className="text-[20px] leading-tight font-bold tracking-tight">{title}</p>
        <p className="text-[12px]" style={{ color: sub }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  const errorBox = (msg: string) =>
    msg ? (
      <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">
        {msg}
      </p>
    ) : null;

  let body: ReactNode;
  if (screen === 'login') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-5 pb-8">
        {header('FreshCart', 'Groceries in 30 minutes')}
        {tabs}
        <form onSubmit={submitLogin} noValidate className="mt-4 space-y-3">
          <Field label="Email" id="bl-email">
            <input
              id="bl-email"
              type="text"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" id="bl-password">
            <PasswordInput id="bl-password" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw((v) => !v)} />
          </Field>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px]">
              <button
                type="button"
                role="switch"
                aria-checked={remember}
                aria-label="Remember me"
                onClick={() => setRemember((v) => !v)}
                className="relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803d]"
                style={{ background: remember ? '#34c759' : 'rgba(120,120,128,.24)' }}
              >
                <span className="absolute top-[2px] left-[2px] size-4 rounded-full bg-white shadow transition-transform" style={{ transform: remember ? 'translateX(14px)' : 'none' }} />
              </button>
              Remember me
            </label>
            <button
              type="button"
              onClick={() => {
                setFpMessage('');
                push('forgot');
              }}
              className="text-[12px] font-semibold"
              style={{ color: GREEN }}
            >
              Forgot password?
            </button>
          </div>
          {errorBox(loginError)}
          <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white active:opacity-80" style={{ background: GREEN }}>
            {pending > 0 && <Loader2 size={16} className="animate-spin" />}
            {pending > 0 ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div className="my-3 flex items-center gap-2 text-[11px]" style={{ color: sub }}>
          <span className="h-px flex-1 bg-black/10" /> or <span className="h-px flex-1 bg-black/10" />
        </div>
        <div className="space-y-2">
          <button type="button" onClick={() => flash('Sign in with Apple is not available in this demo.')} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-black text-[14px] font-semibold text-white">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
            </svg>
            Sign in with Apple
          </button>
          <button type="button" onClick={() => flash('Sign in with Google is not available in this demo.')} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white text-[14px] font-semibold text-black">
            <span className="text-[15px] font-bold" style={{ color: '#4285f4' }} aria-hidden="true">
              G
            </span>
            Sign in with Google
          </button>
        </div>
        <p className="mt-4 text-center text-[12px]" style={{ color: sub }}>
          New to FreshCart?{' '}
          <button type="button" onClick={() => switchTab('signup')} className="font-semibold" style={{ color: GREEN }}>
            Create an account
          </button>
        </p>
      </div>
    );
  } else if (screen === 'signup') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-5 pb-8">
        {header('Create account', 'It takes less than a minute')}
        {tabs}
        <form onSubmit={submitSignup} noValidate className="mt-4 space-y-3">
          <Field label="Full name" id="bs-name">
            <input id="bs-name" type="text" autoComplete="off" value={suName} onChange={(e) => setSuName(e.target.value)} className={inputCls} placeholder="Anna Novak" />
          </Field>
          <Field label="Email" id="bs-email">
            <input id="bs-email" type="text" inputMode="email" autoComplete="off" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          <Field label="Password" id="bs-password" help="At least 8 characters.">
            <PasswordInput id="bs-password" value={suPassword} onChange={setSuPassword} show={suShow} onToggle={() => setSuShow((v) => !v)} describedBy="bs-password-help" />
          </Field>
          {errorBox(suError)}
          <button
            type="submit"
            disabled={suLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60"
            style={{ background: GREEN }}
          >
            {suLoading && <Loader2 size={16} className="animate-spin" />}
            {suLoading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-[11px] leading-snug" style={{ color: sub }}>
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </form>
        <p className="mt-4 text-center text-[12px]" style={{ color: sub }}>
          Already have an account?{' '}
          <button type="button" onClick={() => switchTab('login')} className="font-semibold" style={{ color: GREEN }}>
            Log in
          </button>
        </p>
      </div>
    );
  } else if (screen === 'forgot') {
    body = (
      <div className="flex h-full flex-col px-5 pt-3">
        <button type="button" onClick={back} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: GREEN }}>
          <ChevronLeft size={22} /> Log in
        </button>
        <span className="mt-4 grid size-11 place-items-center rounded-xl bg-[#e8f5ec]" style={{ color: GREEN }}>
          <KeyRound size={22} />
        </span>
        <p className="mt-3 text-[22px] font-bold tracking-tight">Reset password</p>
        <p className="mt-1 text-[13px]" style={{ color: sub }}>
          Enter your email and we'll send you a link to choose a new password.
        </p>
        <form onSubmit={submitForgot} noValidate className="mt-4 space-y-3">
          <Field label="Email" id="bf-email">
            <input id="bf-email" type="text" inputMode="email" autoComplete="off" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          {fpMessage && (
            <p role="status" className="rounded-lg bg-[#e8f5ec] px-3 py-2 text-[12px] font-medium text-[#14532d]">
              {fpMessage}
            </p>
          )}
          <button type="submit" disabled={fpLoading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60" style={{ background: GREEN }}>
            {fpLoading && <Loader2 size={16} className="animate-spin" />}
            Send reset link
          </button>
        </form>
      </div>
    );
  } else {
    const p = profile ?? { name: 'Guest', email: '', details: emptyDetails };
    const initials = p.name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
    body = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-4 pb-8">
        <p className="text-[26px] font-bold tracking-tight">Account</p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: GREEN }}>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">Hi, {p.name.split(' ')[0]}</p>
            <p className="truncate text-[12px]" style={{ color: sub }}>
              {p.email}
            </p>
          </div>
        </div>
        <div className="mt-3 divide-y divide-black/[.06] overflow-hidden rounded-2xl bg-white text-[13px]">
          {[
            { icon: Package, k: 'Orders', v: p.details.orders },
            { icon: MapPin, k: 'Address', v: p.details.address },
            { icon: CreditCard, k: 'Payment', v: p.details.card },
          ].map((r) => (
            <div key={r.k} className="flex items-center gap-3 px-3 py-2.5">
              <r.icon size={16} style={{ color: GREEN }} />
              <span className="flex-1">{r.k}</span>
              <span style={{ color: sub }}>{r.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 mb-1.5 px-1 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
          Active sessions ({sessions.length})
        </p>
        <div className="divide-y divide-black/[.06] overflow-hidden rounded-2xl bg-white text-[13px]">
          {sessions.length === 0 && (
            <p className="px-3 py-2.5" style={{ color: sub }}>
              No active sessions
            </p>
          )}
          {sessions.map((t) => (
            <div key={t} className="flex items-center gap-3 px-3 py-2.5">
              <Smartphone size={16} style={{ color: sub }} />
              <span className="flex-1">iPhone</span>
              <span className="font-mono text-[11px]" style={{ color: sub }}>
                {t}
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={logout} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-[#d70015]">
          <LogOut size={16} /> Log out
        </button>
      </div>
    );
  }

  const statusColor = (s?: number) => (s === undefined ? '#fbbf24' : s < 300 ? '#34d399' : s === 423 ? '#fbbf24' : '#f87171');

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black">
          {body}
          {toast && (
            <div role="status" className="absolute inset-x-4 bottom-6 rounded-xl bg-black/85 px-3 py-2 text-center text-[12px] text-white">
              {toast}
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
        <button type="button" onClick={back} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 text-sm font-medium text-fg hover:bg-brand-soft">
          <ArrowLeft size={15} /> Swipe back
        </button>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-sm">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">Test account</p>
        <p className="mt-1 font-mono text-[13px] text-fg">anna@test.com / Secret123!</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          From the spec: passwords need at least 8 characters, the account locks after 5 failed attempts, and error messages must not reveal whether an email is registered.
        </p>
        <p className="mt-1.5 text-xs text-muted">Locked yourself out? Tap <strong className="text-fg">Restart app</strong>.</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Server log</p>
        <ul className="min-h-[5.5rem] space-y-1.5 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Log in or sign up to see requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="leading-snug">
              <span className="text-[#7dd3fc]">{e.method}</span> <span className="break-all">{e.path}</span>
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
