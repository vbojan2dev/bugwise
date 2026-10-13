import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, Eye, EyeOff, KeyRound, Link2Off, Loader2, Mail, Monitor, RotateCcw, Tablet } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken "Forgot password" flow for a fitness app. Bugs (don't spoil them for learners!):
 *  1. Account enumeration: a registered email gets "We sent a link to maya@test.com",
 *     an unknown email gets "No PulseFit account uses this email".
 *  2. Requesting a new link does not cancel older ones: every unused link keeps working.
 *  3. Expiry is checked against 24 hours instead of 30 minutes (the email promises 30 minutes).
 *  4. The link in the email points to the staging environment (staging.pulsefit-dev.net), not app.pulsefit.com.
 *  5. Resetting the password does not sign out the user's other devices (iPad, Chrome on Mac).
 *  6. The new password check uses 4 instead of 8 characters: "abcd" is accepted.
 *
 * Working on purpose (so learners can compare): a used link can't be used again, the new password must
 * differ from the current one, rate limit of 5 requests per 15 minutes, email is trimmed and case-insensitive,
 * login shows a generic error, the "password changed" email is correct and contains no password.
 */

type Screen = 'login' | 'forgot' | 'reset' | 'linkError' | 'done' | 'home';
interface Token {
  id: string;
  created: number;
  used: boolean;
}
interface Email {
  id: number;
  kind: 'reset' | 'changed';
  time: number;
  tokenId?: string;
}

const LATENCY = 900;
const ORANGE = '#c2410c';
const sub = 'rgba(60,60,67,.6)';
const START = 9 * 60 + 41;
const EMAIL = 'maya@test.com';
const fmt = (m: number) => {
  const d = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
};
const randomToken = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
const newServer = () => ({ password: 'Morning5k!', tokens: [] as Token[], requests: [] as { key: string; time: number }[] });

const inputCls = 'h-10 w-0 min-w-0 flex-1 rounded-xl border border-transparent bg-[#f2f2f7] px-3 text-[14px] text-black outline-none placeholder:text-[#3c3c43]/40 focus:border-[#c2410c] focus:bg-white';

function Field({ label, id, help, children }: { label: string; id: string; help?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium" style={{ color: sub }}>
        {label}
      </label>
      <div className="flex">{children}</div>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-[11px] leading-snug" style={{ color: sub }}>
          {help}
        </p>
      )}
    </div>
  );
}

export function BuggyResetApp() {
  const server = useRef(newServer());
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  const [now, setNow] = useState(START);
  const nowRef = useRef(START);
  const [screen, setScreen] = useState<Screen>('login');
  const [inbox, setInbox] = useState<Email[]>([]);
  const [openMail, setOpenMail] = useState<number | null>(null);
  // BUG 5: nothing ever signs these out.
  const [devices] = useState([
    { id: 'ipad', icon: Tablet, name: "Maya's iPad", where: 'PulseFit app' },
    { id: 'web', icon: Monitor, name: 'Chrome on Mac', where: 'pulsefit.com' },
  ]);

  // login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // forgot
  const [fpEmail, setFpEmail] = useState('');
  const [fpMsg, setFpMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [fpLoading, setFpLoading] = useState(false);
  // reset
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms = LATENCY) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const advance = (mins: number) => {
    nowRef.current += mins;
    setNow(nowRef.current);
  };
  const deliver = (kind: Email['kind'], tokenId?: string) => {
    later(() => {
      const id = nextId.current++;
      setInbox((list) => [{ id, kind, time: nowRef.current, tokenId }, ...list]);
      setOpenMail(id);
    }, 1200);
  };

  /** Returns an error message, or '' when the link may be used. */
  const checkToken = (id: string) => {
    const t = server.current.tokens.find((x) => x.id === id);
    if (!t) return 'This link is not valid.';
    if (t.used) return 'This link has already been used. Request a new one if you still need to reset your password.';
    // BUG 3: 24 hours instead of 30 minutes.
    if (nowRef.current - t.created > 24 * 60) return 'This link has expired. Request a new one.';
    // BUG 2: no check that this is the newest link for the account.
    return '';
  };

  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    if (!email.trim() || !password) return setLoginError('Enter your email and password.');
    setLoginError('');
    setLoginLoading(true);
    const em = email.trim().toLowerCase();
    const pw = password;
    later(() => {
      setLoginLoading(false);
      if (em === EMAIL && pw === server.current.password) {
        setPassword('');
        setScreen('home');
      } else {
        setLoginError('Email or password is incorrect.');
      }
    });
  };

  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    if (fpLoading) return;
    const key = fpEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return setFpMsg({ tone: 'err', text: 'Enter a valid email address.' });
    setFpMsg(null);
    setFpLoading(true);
    later(() => {
      setFpLoading(false);
      const s = server.current;
      const t = nowRef.current;
      const recent = s.requests.filter((r) => r.key === key && t - r.time < 15);
      if (recent.length >= 5) {
        setFpMsg({ tone: 'err', text: 'Too many requests. Please wait a few minutes and try again.' });
        return;
      }
      s.requests.push({ key, time: t });
      if (key !== EMAIL) {
        // BUG 1: tells the user (or an attacker) that this email has no account.
        setFpMsg({ tone: 'err', text: 'No PulseFit account uses this email. Check the spelling or sign up.' });
        return;
      }
      const token: Token = { id: randomToken(), created: t, used: false };
      s.tokens.push(token);
      deliver('reset', token.id);
      setFpMsg({ tone: 'ok', text: `Check your inbox! We sent a reset link to ${key}.` });
    });
  };

  const openLink = (id: string) => {
    const err = checkToken(id);
    setNewPw('');
    setConfirmPw('');
    setShowPw(false);
    setResetError('');
    if (err) {
      setLinkError(err);
      setScreen('linkError');
      return;
    }
    setTokenId(id);
    setScreen('reset');
  };

  const submitReset = (e: FormEvent) => {
    e.preventDefault();
    if (resetLoading || !tokenId) return;
    // BUG 6: the rule says 8, the code checks 4.
    if (newPw.length < 4) return setResetError('Password must be at least 8 characters.');
    if (newPw !== confirmPw) return setResetError("Passwords don't match.");
    setResetError('');
    setResetLoading(true);
    const id = tokenId;
    const pw = newPw;
    later(() => {
      setResetLoading(false);
      const err = checkToken(id);
      if (err) {
        setLinkError(err);
        setScreen('linkError');
        return;
      }
      const s = server.current;
      if (pw === s.password) {
        setResetError('Your new password must be different from your current password.');
        return;
      }
      s.password = pw;
      const t = s.tokens.find((x) => x.id === id);
      if (t) t.used = true;
      // BUG 5: other sessions are not revoked here.
      deliver('changed');
      setNewPw('');
      setConfirmPw('');
      setScreen('done');
    });
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    server.current = newServer();
    nowRef.current = START;
    setNow(START);
    setScreen('login');
    setInbox([]);
    setOpenMail(null);
    setEmail('');
    setPassword('');
    setLoginError('');
    setLoginLoading(false);
    setFpEmail('');
    setFpMsg(null);
    setFpLoading(false);
    setTokenId(null);
    setLinkError('');
    setNewPw('');
    setConfirmPw('');
    setShowPw(false);
    setResetError('');
    setResetLoading(false);
  };

  const primaryBtn = (label: string, loading: boolean) => (
    <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c] disabled:opacity-60" style={{ background: ORANGE }}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {label}
    </button>
  );
  const backBtn = (label: string, to: Screen) => (
    <button type="button" onClick={() => setScreen(to)} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: ORANGE }}>
      <ChevronLeft size={22} /> {label}
    </button>
  );
  const alert = (text: string) => (
    <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">
      {text}
    </p>
  );

  let body: ReactNode;
  if (screen === 'login') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: ORANGE }}>
            <Dumbbell size={20} />
          </span>
          <div>
            <p className="text-[20px] leading-tight font-bold tracking-tight">PulseFit</p>
            <p className="text-[12px]" style={{ color: sub }}>
              Train smarter every day
            </p>
          </div>
        </div>
        <form onSubmit={submitLogin} noValidate className="mt-6 space-y-3">
          <Field label="Email" id="pr-email">
            <input id="pr-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          <Field label="Password" id="pr-password">
            <input id="pr-password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Password" />
          </Field>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFpMsg(null);
                setFpEmail(email);
                setScreen('forgot');
              }}
              className="text-[12px] font-semibold"
              style={{ color: ORANGE }}
            >
              Forgot password?
            </button>
          </div>
          {loginError && alert(loginError)}
          {primaryBtn(loginLoading ? 'Logging in…' : 'Log in', loginLoading)}
        </form>
      </div>
    );
  } else if (screen === 'forgot') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-3 pb-8">
        {backBtn('Log in', 'login')}
        <span className="mt-4 grid size-11 place-items-center rounded-xl bg-[#fff1e8]" style={{ color: ORANGE }}>
          <KeyRound size={22} />
        </span>
        <p className="mt-3 text-[22px] font-bold tracking-tight">Forgot password?</p>
        <p className="mt-1 text-[13px]" style={{ color: sub }}>
          Enter your email and we'll send you a link to choose a new password.
        </p>
        <form onSubmit={submitForgot} noValidate className="mt-4 space-y-3">
          <Field label="Email" id="pr-fp-email">
            <input id="pr-fp-email" type="email" autoComplete="off" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          {fpMsg &&
            (fpMsg.tone === 'ok' ? (
              <p role="status" className="rounded-lg bg-[#e8f5ec] px-3 py-2 text-[12px] font-medium text-[#14532d]">
                {fpMsg.text}
              </p>
            ) : (
              alert(fpMsg.text)
            ))}
          {primaryBtn('Send reset link', fpLoading)}
        </form>
      </div>
    );
  } else if (screen === 'reset') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto px-5 pt-3 pb-8">
        {backBtn('Log in', 'login')}
        <p className="mt-4 text-[22px] font-bold tracking-tight">Choose a new password</p>
        <p className="mt-1 text-[13px]" style={{ color: sub }}>
          For {EMAIL}
        </p>
        <form onSubmit={submitReset} noValidate className="mt-4 space-y-3">
          <Field label="New password" id="pr-new" help="At least 8 characters, different from your current password.">
            <input id="pr-new" type={showPw ? 'text' : 'password'} autoComplete="off" aria-describedby="pr-new-help" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide passwords' : 'Show passwords'} aria-pressed={showPw} className="ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#3c3c43]/60 focus-visible:outline-2 focus-visible:outline-[#c2410c]">
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </Field>
          <Field label="Confirm new password" id="pr-confirm">
            <input id="pr-confirm" type={showPw ? 'text' : 'password'} autoComplete="off" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} />
          </Field>
          {resetError && alert(resetError)}
          {primaryBtn('Save new password', resetLoading)}
        </form>
      </div>
    );
  } else if (screen === 'linkError') {
    body = (
      <div className="flex h-full flex-col items-center px-6 pt-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[#fdecec] text-[#b42318]">
          <Link2Off size={26} />
        </span>
        <p className="mt-4 text-[19px] font-bold tracking-tight">Link can't be used</p>
        <p className="mt-2 text-[13px] leading-snug" style={{ color: sub }}>
          {linkError}
        </p>
        <button
          type="button"
          onClick={() => {
            setFpMsg(null);
            setScreen('forgot');
          }}
          className="mt-6 h-11 w-full rounded-xl text-[15px] font-semibold text-white"
          style={{ background: ORANGE }}
        >
          Request a new link
        </button>
      </div>
    );
  } else if (screen === 'done') {
    body = (
      <div className="flex h-full flex-col items-center px-6 pt-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[#e8f5ec] text-[#15803d]">
          <CheckCircle2 size={28} />
        </span>
        <p className="mt-4 text-[19px] font-bold tracking-tight">Password updated</p>
        <p className="mt-2 text-[13px] leading-snug" style={{ color: sub }}>
          You can now log in with your new password. For your security, we've signed you out on your other devices.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail(EMAIL);
            setPassword('');
            setLoginError('');
            setScreen('login');
          }}
          className="mt-6 h-11 w-full rounded-xl text-[15px] font-semibold text-white"
          style={{ background: ORANGE }}
        >
          Log in
        </button>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-5 pb-8">
        <p className="text-[13px]" style={{ color: sub }}>
          Good morning
        </p>
        <p className="text-[26px] font-bold tracking-tight">Maya</p>
        <div className="mt-3 rounded-2xl p-4 text-white" style={{ background: ORANGE }}>
          <p className="text-[12px] opacity-85">Today's plan</p>
          <p className="text-[17px] font-semibold">5 km easy run</p>
          <p className="mt-1 text-[12px] opacity-85">Streak: 12 days</p>
        </div>
        <button type="button" onClick={() => setScreen('login')} className="mt-4 h-11 w-full rounded-2xl bg-white text-[15px] font-semibold text-[#d70015]">
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {body}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Clock size={13} /> Server clock
          </p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-lg font-semibold text-fg" aria-live="polite">
            {fmt(now)}
          </span>
          <span className="flex-1" />
          <button type="button" onClick={() => advance(10)} className="rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-brand-soft">
            +10 min
          </button>
          <button type="button" onClick={() => advance(60)} className="rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-brand-soft">
            +1 hour
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white text-black" style={{ colorScheme: 'light' }}>
        <p className="flex items-center gap-1.5 border-b border-black/10 bg-[#f7f7f9] px-3 py-2 text-xs font-semibold tracking-wide uppercase" style={{ color: sub }}>
          <Mail size={13} /> Inbox · {EMAIL}
        </p>
        {inbox.length === 0 && (
          <p className="px-3 py-4 text-[13px]" style={{ color: sub }}>
            No emails yet.
          </p>
        )}
        <ul className="divide-y divide-black/[.07]">
          {inbox.map((m) => {
            const open = openMail === m.id;
            const subject = m.kind === 'reset' ? 'Reset your PulseFit password' : 'Your PulseFit password was changed';
            return (
              <li key={m.id}>
                <button type="button" aria-expanded={open} onClick={() => setOpenMail((o) => (o === m.id ? null : m.id))} className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-black/[.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2563eb]">
                  <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: open ? 'transparent' : '#2563eb' }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-[13px] font-semibold">
                      <span className="truncate">PulseFit</span>
                      <span className="shrink-0 font-normal" style={{ color: sub }}>
                        {fmt(m.time)}
                      </span>
                    </span>
                    <span className="block truncate text-[13px]">{subject}</span>
                  </span>
                </button>
                {open && (
                  <div className="space-y-2 px-3 pb-3 pl-7 text-[13px] leading-snug">
                    {m.kind === 'reset' && m.tokenId ? (
                      <>
                        <p>Hi Maya,</p>
                        <p>We received a request to reset your password. Tap the button below to choose a new one. This link expires in 30 minutes and can be used once.</p>
                        <button type="button" onClick={() => openLink(m.tokenId!)} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]" style={{ background: ORANGE }}>
                          Reset password
                        </button>
                        <p className="text-[11px]" style={{ color: sub }}>
                          Or open this link:{' '}
                          {/* BUG 4: staging domain in a production email */}
                          <span className="break-all text-[#2563eb]">https://staging.pulsefit-dev.net/reset?t={m.tokenId}</span>
                        </p>
                        <p className="text-[11px]" style={{ color: sub }}>
                          Didn't ask for this? You can ignore this email. Your password won't change.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Hi Maya,</p>
                        <p>The password for your PulseFit account was changed at {fmt(m.time)}.</p>
                        <p>
                          If this wasn't you, secure your account at <span className="break-all text-[#2563eb]">https://app.pulsefit.com/security</span>.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Maya's other devices</p>
        <ul className="mt-2 space-y-1.5">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 rounded-lg bg-subtle px-2.5 py-2 text-sm">
              <d.icon size={16} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{d.name}</span>
                <span className="block truncate text-xs text-muted">{d.where}</span>
              </span>
              <span className="shrink-0 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">Signed in</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-sm">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">Test account & spec</p>
        <p className="mt-1 font-mono text-[13px] text-fg">maya@test.com / Morning5k!</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted">
          <li>Messages must not reveal whether an email is registered.</li>
          <li>A link expires after 30 minutes and works once. Requesting a new link cancels older ones.</li>
          <li>Links point to app.pulsefit.com.</li>
          <li>New password: at least 8 characters, different from the current one.</li>
          <li>A reset signs the user out on all other devices.</li>
          <li>Max 5 reset requests per 15 minutes.</li>
        </ul>
      </div>
    </div>
  );
}
