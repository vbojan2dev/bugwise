import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff } from 'lucide-react';

/*
 * A GreenBasket sign-up page in two versions.
 *  - good:   labeled fields, visible focus, errors in text, named icon button, native checkbox.
 *  - broken: the bug hunt version. Bugs (don't spoil them for learners!):
 *     1. "Full name" is a plain <div>, not a <label>: the input has no accessible name ("edit text").
 *     2. The password hint is light grey on white (about 2:1 contrast).
 *     3. All focus outlines are removed (outline: none), so keyboard users can't see where they are.
 *     4. Validation errors are shown only as a red border: no text, no icon, no aria-invalid.
 *     5. The show/hide password button is an icon with no accessible name ("button").
 *     6. The terms checkbox is a <div> with onClick: not focusable, not operable with the keyboard,
 *        and screen readers don't know it is a checkbox. Keyboard users can never sign up.
 */

const logo =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#1f7a4d"/><path d="M11 17h18l-2 12H13z" fill="#fff"/><path d="M15 17c0-4 2-7 5-7s5 3 5 7" stroke="#fff" stroke-width="2.4" fill="none"/></svg>`,
  );

type Errors = Partial<Record<'name' | 'email' | 'password' | 'agree', string>>;

function validate(name: string, email: string, password: string, agree: boolean): Errors {
  const e: Errors = {};
  if (!name.trim()) e.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter an email address like anna@example.com.';
  if (password.length < 8 || !/\d/.test(password)) e.password = 'Use at least 8 characters, including a number.';
  if (!agree) e.agree = 'Accept the Terms to continue.';
  return e;
}

const css = `
.gb-page { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.gb-good :focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; border-radius: 6px; }
.gb-broken *:focus, .gb-broken *:focus-visible { outline: none !important; box-shadow: none; }
`;

export function SignUpForm({ broken = false }: { broken?: boolean }) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [focusReq, setFocusReq] = useState(0);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    agree: useRef<HTMLInputElement>(null),
  };
  const summaryRef = useRef<HTMLDivElement>(null);

  // Good version: after a failed submit, move focus to the first invalid field.
  useEffect(() => {
    if (!focusReq || broken) return;
    const first = (['name', 'email', 'password', 'agree'] as const).find((k) => errors[k]);
    if (first) refs[first].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReq]);

  // Re-validate while typing once the user has tried to submit.
  const live = (n = name, e = email, p = password, a = agree) => {
    if (tried) setErrors(validate(n, e, p, a));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(name, email, password, agree);
    setErrors(e);
    setTried(true);
    if (Object.keys(e).length === 0) setDone(true);
    else setFocusReq((x) => x + 1);
  };

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setAgree(false);
    setShowPw(false);
    setErrors({});
    setTried(false);
    setDone(false);
  };

  const errCount = Object.keys(errors).length;
  const border = (k: keyof Errors) => (errors[k] ? (broken ? '#e5484d' : '#b42318') : '#7c8290');
  const inputCls = 'block h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-[15px] text-[#1a1d26]';
  const labelCls = 'mb-1 block text-[14px] font-semibold text-[#1a1d26]';

  const ErrorText = ({ k }: { k: keyof Errors }) =>
    !broken && errors[k] ? (
      <p id={id(`${k}-err`)} className="mt-1 flex items-start gap-1 text-[13px] text-[#b42318]">
        <AlertCircle size={15} aria-hidden="true" className="mt-px shrink-0" />
        <span>{errors[k]}</span>
      </p>
    ) : null;

  const describedBy = (k: keyof Errors, hint?: string) => (broken ? undefined : [hint, errors[k] ? id(`${k}-err`) : ''].filter(Boolean).join(' ') || undefined);

  return (
    <div className={`gb-page ${broken ? 'gb-broken' : 'gb-good'} bg-white px-5 py-6 text-[#1a1d26]`}>
      <style>{css}</style>
      <div className="flex flex-wrap items-center gap-2.5">
        <img src={logo} alt="GreenBasket" width={32} height={32} className="size-8" />
        <span className="min-w-0 text-[15px] font-bold tracking-tight break-words" aria-hidden="true">
          GreenBasket
        </span>
      </div>

      {done ? (
        <div role="status" className="mt-6 rounded-xl bg-[#e8f5ee] p-4 text-[#14532d]">
          <p className="flex items-center gap-2 text-[16px] font-semibold">
            <CheckCircle2 size={18} aria-hidden="true" /> Account created
          </p>
          <p className="mt-1 text-[14px]">Welcome aboard, {name.trim().split(' ')[0]}! Your first delivery is free.</p>
          <button type="button" onClick={reset} className="mt-3 rounded-lg border border-[#14532d] px-3 py-1.5 text-[13px] font-semibold">
            Start over
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="mt-5">
          <h1 className="text-[22px] leading-tight font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-[14px] text-[#4b5160]">Fresh groceries at your door in 30 minutes.</p>

          {!broken && tried && errCount > 0 && (
            <div ref={summaryRef} role="alert" className="mt-4 rounded-lg border border-[#b42318] bg-[#fef3f2] px-3 py-2 text-[13px] text-[#912018]">
              <strong>
                Please fix {errCount} {errCount === 1 ? 'error' : 'errors'}
              </strong>{' '}
              <span>before continuing.</span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {/* Full name */}
            <div>
              {broken ? (
                <div className={labelCls}>Full name</div>
              ) : (
                <label htmlFor={id('name')} className={labelCls}>
                  Full name
                </label>
              )}
              <input
                ref={refs.name}
                id={broken ? undefined : id('name')}
                autoComplete="name"
                required={!broken}
                aria-invalid={!broken && errors.name ? true : undefined}
                aria-describedby={describedBy('name')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  live(e.target.value);
                }}
                className={inputCls}
                style={{ borderColor: border('name') }}
              />
              <ErrorText k="name" />
            </div>

            {/* Email */}
            <div>
              <label htmlFor={id('email')} className={labelCls}>
                Email
              </label>
              <input
                ref={refs.email}
                id={id('email')}
                type="email"
                autoComplete="email"
                required={!broken}
                aria-invalid={!broken && errors.email ? true : undefined}
                aria-describedby={describedBy('email')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  live(undefined, e.target.value);
                }}
                className={inputCls}
                style={{ borderColor: border('email') }}
              />
              <ErrorText k="email" />
            </div>

            {/* Password */}
            <div>
              <label htmlFor={id('password')} className={labelCls}>
                Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={refs.password}
                  id={id('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required={!broken}
                  aria-invalid={!broken && errors.password ? true : undefined}
                  aria-describedby={describedBy('password', id('pw-hint'))}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    live(undefined, undefined, e.target.value);
                  }}
                  className={`${inputCls} w-0 flex-1`}
                  style={{ borderColor: border('password') }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={broken ? undefined : 'Show password'}
                  aria-pressed={broken ? undefined : showPw}
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#7c8290] text-[#3b4150]"
                >
                  {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              <p id={id('pw-hint')} className="mt-1 text-[13px]" style={{ color: broken ? '#b4b9c3' : '#5b6170' }}>
                At least 8 characters, including a number.
              </p>
              <ErrorText k="password" />
            </div>

            {/* Terms */}
            <div>
              {broken ? (
                <div onClick={() => setAgree((a) => !a)} className="flex cursor-pointer items-center gap-2.5 text-[14px] select-none">
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-[5px] border-2"
                    style={{ borderColor: errors.agree ? '#e5484d' : '#7c8290', background: agree ? '#1f7a4d' : '#fff' }}
                  >
                    {agree && <Check size={14} strokeWidth={3} className="text-white" />}
                  </span>
                  <span>I agree to the Terms of Service</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <input
                    ref={refs.agree}
                    id={id('agree')}
                    type="checkbox"
                    required
                    checked={agree}
                    aria-invalid={errors.agree ? true : undefined}
                    aria-describedby={errors.agree ? id('agree-err') : undefined}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      live(undefined, undefined, undefined, e.target.checked);
                    }}
                    className="size-5 shrink-0 accent-[#1f7a4d]"
                  />
                  <label htmlFor={id('agree')} className="text-[14px]">
                    I agree to the Terms of Service
                  </label>
                </div>
              )}
              <ErrorText k="agree" />
            </div>
          </div>

          <button type="submit" className="mt-5 h-11 w-full rounded-lg bg-[#1f7a4d] text-[15px] font-semibold text-white">
            Create account
          </button>
          <p className="mt-3 text-center text-[13px] text-[#4b5160]">
            Already have an account?{' '}
            <a href="#login" onClick={(e) => e.preventDefault()} className="font-semibold text-[#1f5fbf] underline">
              Log in
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
