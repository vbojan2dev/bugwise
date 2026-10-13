import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Eye, EyeOff, ImageOff, Leaf, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { MobileKeyboard, type KeyboardKind } from './MobileKeyboard';

/*
 * A deliberately broken sign-up screen. Bugs (don't spoil them for learners!):
 *  1. The email error is set on blur but only cleared on submit, so it stays after the user fixes the value.
 *  2. The email is validated without trimming, so a trailing/leading space makes a valid address invalid.
 *  3. The display name counter uses String.length (code units), so emoji count as 2-11 characters.
 *  4. The phone field has maxLength=10, so "+385 91 234 5678" is cut to "+385 91 23" silently.
 *  5. Year of birth is a plain text field: letters keyboard, accepts "19ab", no range check.
 *  6. The profile card renders the display name as HTML (simulated safely here; no real script runs).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
type FieldId = 'name' | 'email' | 'phone' | 'year' | 'password';
const keyboards: Record<FieldId, KeyboardKind> = { name: 'default', email: 'email', phone: 'phone', year: 'default', password: 'password' };

/** Simulates what innerHTML would do with a few common tags. Nothing is ever executed. */
function renderAsHtml(s: string): { nodes: ReactNode[]; alert: string | null } {
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  const open: string[] = [];
  const nodes: ReactNode[] = [];
  let alert: string | null = null;
  let last = 0;
  let k = 0;
  const pushText = (t: string) => {
    if (!t || open.includes('script') || open.includes('style')) return;
    const st: CSSProperties = {};
    for (const tag of open) {
      if (tag === 'b' || tag === 'strong') st.fontWeight = 800;
      if (tag === 'i' || tag === 'em') st.fontStyle = 'italic';
      if (tag === 'u') st.textDecoration = 'underline';
      if (tag === 's' || tag === 'del' || tag === 'strike') st.textDecoration = 'line-through';
      if (tag === 'mark') st.background = '#fde047';
      if (tag === 'h1') Object.assign(st, { fontSize: 26, fontWeight: 800 });
      if (tag === 'big') st.fontSize = '1.4em';
      if (tag === 'small') st.fontSize = '0.75em';
      if (tag === 'font' || tag === 'span') st.color = '#e11d48';
    }
    nodes.push(
      <span key={k++} style={st}>
        {t}
      </span>,
    );
  };
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    pushText(s.slice(last, m.index));
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (tag === 'img') {
      nodes.push(
        <span key={k++} className="mx-0.5 inline-grid size-5 place-items-center rounded border border-dashed border-current align-middle opacity-60">
          <ImageOff size={11} />
        </span>,
      );
      const handler = attrs.match(/on\w+\s*=\s*["']?([^"'>]+)/i);
      if (handler) alert = handler[1].match(/alert\((.*)\)/)?.[1]?.replace(/["']/g, '') ?? handler[1];
    } else if (tag === 'br') {
      nodes.push(<br key={k++} />);
    } else if (close) {
      const i = open.lastIndexOf(tag);
      if (i >= 0) open.splice(i, 1);
    } else {
      open.push(tag);
    }
    last = re.lastIndex;
  }
  pushText(s.slice(last));
  return { nodes, alert };
}

function Field({ label, error, children, right }: { label: string; error?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-end justify-between px-1 text-[11px]" style={{ color: 'rgba(60,60,67,.6)' }}>
        <span>{label}</span>
        {right}
      </div>
      <div className="flex h-9 items-center gap-1 rounded-[9px] bg-white px-2.5 focus-within:ring-2 focus-within:ring-[#007aff]/40" style={{ border: `1px solid ${error ? '#ff3b30' : 'transparent'}` }}>
        {children}
      </div>
      {error && <p className="mt-1 px-1 text-[11px] text-[#ff3b30]">{error}</p>}
    </div>
  );
}

const inputCls = 'h-full w-0 min-w-0 flex-1 bg-transparent text-[14px] text-black outline-none placeholder:text-[rgba(60,60,67,.3)]';

export function BuggySignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'year' | 'password', string>>>({});
  const [focused, setFocused] = useState<FieldId | null>(null);
  const [done, setDone] = useState(false);
  const [payload, setPayload] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the focused field visible above the simulated keyboard.
  useEffect(() => {
    if (!focused) return;
    const el = document.activeElement as HTMLElement | null;
    if (el && scroller.current?.contains(el)) el.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const focusProps = (id: FieldId) => ({ onFocus: () => setFocused(id), onBlur: () => setFocused((f) => (f === id ? null : f)) });
  const clear = (key: 'name' | 'phone' | 'year' | 'password') => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter a display name';
    if (!phone.trim()) next.phone = 'Enter your phone number';
    if (!year.trim()) next.year = 'Enter your year of birth'; // BUG 5: no digits / range check
    if (password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    const emailMsg = !email ? 'Enter your email address' : EMAIL.test(email) ? '' : 'Enter a valid email address'; // BUG 2: no trim
    setEmailError(emailMsg);
    if (Object.keys(next).length || emailMsg) return;
    setPayload(JSON.stringify({ displayName: name, email, phone, yearOfBirth: year, password: '••••••••' }, null, 2));
    setDone(true);
  };

  const restart = () => {
    setName('');
    setEmail('');
    setPhone('');
    setYear('');
    setPassword('');
    setShowPw(false);
    setEmailError('');
    setErrors({});
    setDone(false);
    setPayload(null);
    setDismissed(null);
  };

  const preview = renderAsHtml(name || 'there'); // BUG 6
  const showAlert = preview.alert !== null && dismissed !== name;
  const kb = focused ? keyboards[focused] : null;

  return (
    <div className="flex w-full max-w-[340px] min-w-0 flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="absolute inset-0 flex flex-col bg-[#f2f2f7] text-black">
          {done ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#34c759] text-white">
                <Leaf size={26} />
              </span>
              <p className="mt-4 text-[22px] leading-tight font-bold break-words">Welcome, {preview.nodes}!</p>
              <p className="mt-2 text-[13px]" style={{ color: 'rgba(60,60,67,.6)' }}>
                Your Bloom account is ready.
              </p>
              <button type="button" onClick={restart} className="mt-6 rounded-full bg-[#007aff] px-5 py-2 text-[14px] font-semibold text-white">
                Start over
              </button>
            </div>
          ) : (
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pt-3" style={{ paddingBottom: kb ? 190 : 24 }}>
              <p className="text-[24px] font-bold tracking-tight">Create account</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f8ec] text-[#34c759]">
                  <Leaf size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'rgba(60,60,67,.6)' }}>
                    Profile preview
                  </p>
                  <p className="text-[14px] font-semibold break-words">Hi, {preview.nodes}!</p>
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                <Field label="Display name" error={errors.name} right={<span className="tabular-nums">{name.length}/30</span> /* BUG 3 */}>
                  <input
                    aria-label="Display name"
                    className={inputCls}
                    value={name}
                    maxLength={30}
                    autoCapitalize="words"
                    placeholder="e.g. Anna"
                    onChange={(e) => {
                      setName(e.target.value);
                      clear('name');
                    }}
                    {...focusProps('name')}
                  />
                </Field>
                <Field label="Email" error={emailError}>
                  <input
                    aria-label="Email"
                    className={inputCls}
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    placeholder="name@example.com"
                    onChange={(e) => setEmail(e.target.value) /* BUG 1: error is not re-checked here */}
                    onFocus={() => setFocused('email')}
                    onBlur={() => {
                      setFocused((f) => (f === 'email' ? null : f));
                      if (email && !EMAIL.test(email)) setEmailError('Enter a valid email address'); // BUG 2: no trim
                    }}
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input
                    aria-label="Phone"
                    className={inputCls}
                    type="tel"
                    autoComplete="tel"
                    maxLength={10} /* BUG 4 */
                    value={phone}
                    placeholder="+385 91 234 5678"
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clear('phone');
                    }}
                    {...focusProps('phone')}
                  />
                </Field>
                <Field label="Year of birth" error={errors.year}>
                  <input
                    aria-label="Year of birth"
                    className={inputCls}
                    type="text" /* BUG 5 */
                    value={year}
                    placeholder="e.g. 1994"
                    onChange={(e) => {
                      setYear(e.target.value);
                      clear('year');
                    }}
                    {...focusProps('year')}
                  />
                </Field>
                <Field
                  label="Password"
                  error={errors.password}
                >
                  <input
                    aria-label="Password"
                    className={inputCls}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    placeholder="At least 8 characters"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clear('password');
                    }}
                    {...focusProps('password')}
                  />
                  <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="grid size-7 place-items-center rounded-full text-[#8e8e93]">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </Field>
              </div>
              <button type="button" onClick={submit} className="mt-4 h-10 w-full rounded-[10px] bg-[#007aff] text-[15px] font-semibold text-white active:opacity-80">
                Create account
              </button>
            </div>
          )}

          {kb && !done && (
            <div className="absolute inset-x-0 bottom-0 z-20" onMouseDown={(e) => e.preventDefault()}>
              <MobileKeyboard kind={kb} compact capsHint={focused === 'name' && name.length === 0} />
            </div>
          )}

          {showAlert && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-black/30 px-8" role="alertdialog" aria-label="Page alert">
              <div className="w-full overflow-hidden rounded-2xl bg-[#f2f2f7]/95 text-center shadow-xl backdrop-blur">
                <div className="px-4 pt-4 pb-3">
                  <p className="text-[14px] font-semibold">bloom.example says</p>
                  <p className="mt-1 text-[13px] break-words">{preview.alert}</p>
                </div>
                <button type="button" onClick={() => setDismissed(name)} className="h-10 w-full border-t border-black/10 text-[15px] font-semibold text-[#007aff]">
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-3 py-2.5">
        <p className="text-xs text-muted">Tip: the keyboard shows which type each field opens.</p>
        <button type="button" onClick={restart} className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Restart app
        </button>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <div className="min-h-[4.5rem] px-3 py-2">
          {payload ? (
            <>
              <p>
                <span className="text-[#7dd3fc]">POST</span> /api/signup <span className="text-[#34d399]">201</span>
              </p>
              <pre className="mt-1 break-all whitespace-pre-wrap text-[#e2e8f0]">{payload}</pre>
            </>
          ) : (
            <p className="text-white/35">Create an account to see the request body…</p>
          )}
        </div>
      </div>
    </div>
  );
}
