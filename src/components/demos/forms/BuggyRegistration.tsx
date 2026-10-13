import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, RotateCcw, Server, ShoppingBasket, UserRound } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken registration form for a grocery delivery app (Larder). Bugs (don't spoil them for learners!):
 *  1. Email is validated on every keystroke from the first character ("shouting while typing").
 *  2. The email pattern does not allow "+", so plus addresses (maya+food@mail.com) are rejected.
 *  3. The name pattern only allows A-Z letters, spaces and hyphens: O'Brien, Đorđe, Zoë are rejected.
 *  4. The phone pattern only allows digits with an optional "+": "+44 7700 900123" (as in the hint) is rejected.
 *  5. The postcode is always checked as 5 digits, whatever the country: UK "SW1A 1AA" and NL "1012 AB" fail.
 *  6. The postcode field has autocomplete="address-level2" (city), so AutoFill puts "Berlin" into it.
 *  7. Age check is off by one: on the 18th birthday (14 May 2008 with the demo date) the user is "under 18".
 *  8. An empty or impossible date of birth only turns the boxes red: no text, no aria-invalid, not in the summary.
 *  9. Links in the error summary do nothing (preventDefault without moving focus).
 * 10. A server error (500) clears every field instead of keeping what the user typed.
 *
 * Working on purpose: labels, hints, trimming of leading/trailing spaces, on-blur validation for the other fields,
 * errors that clear as soon as the value is fixed, password rule and show/hide, Terms checkbox enforced,
 * marketing opt-in unticked by default, focus moves to the error summary, submit button disabled while sending
 * (Enter can't send twice either), one request per submit.
 */

type FieldId = 'name' | 'email' | 'phone' | 'dob' | 'password' | 'country' | 'street' | 'city' | 'postcode' | 'terms';
type TextKey = 'name' | 'email' | 'phone' | 'day' | 'month' | 'year' | 'password' | 'country' | 'street' | 'city' | 'postcode';
type Values = Record<TextKey, string> & { terms: boolean; marketing: boolean };

const EMPTY: Values = { name: '', email: '', phone: '', day: '', month: '', year: '', password: '', country: '', street: '', city: '', postcode: '', terms: false, marketing: false };

/** The demo's "today", so the age check behaves the same for everyone. */
const TODAY = { y: 2026, m: 5, d: 14 };
const LATENCY = 1200;

const RED = '#c81e1e';
const ACCENT = '#1f7a4d';
const sub = 'rgba(60,60,67,.66)';

const COUNTRIES = [
  { code: 'HR', name: 'Croatia', hint: 'For example 10000' },
  { code: 'DE', name: 'Germany', hint: 'For example 10115' },
  { code: 'NL', name: 'Netherlands', hint: 'For example 1012 AB' },
  { code: 'GB', name: 'United Kingdom', hint: 'For example SW1A 1AA' },
];

/** The saved contact that AutoFill offers, keyed by autocomplete token. */
const CONTACT: Record<string, string> = {
  name: 'Tom Becker',
  email: 'tom.becker@mail.de',
  tel: '+4915112345678',
  country: 'DE',
  'street-address': 'Invalidenstraße 12',
  'address-level2': 'Berlin',
  'postal-code': '10115',
};

/** autocomplete token of each autofillable field. */
const AC: Partial<Record<TextKey, string>> = {
  name: 'name',
  email: 'email',
  phone: 'tel',
  country: 'country',
  street: 'street-address',
  city: 'address-level2',
  postcode: 'address-level2', // BUG 6: should be "postal-code"
};

const NAME_RE = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/; // BUG 3
const EMAIL_RE = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/; // BUG 2: no "+"
const PHONE_RE = /^\+?\d{7,15}$/; // BUG 4: no spaces
const POSTCODE_RE = /^\d{5}$/; // BUG 5: same rule for every country

interface Check {
  errors: Partial<Record<FieldId, string>>;
  dobRed: boolean;
}

function dobState(v: Values): 'ok' | 'invalid' | 'under18' {
  const [d, m, y] = [v.day.trim(), v.month.trim(), v.year.trim()];
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return 'invalid';
  const dd = Number(d);
  const mm = Number(m);
  const yy = Number(y);
  const date = new Date(yy, mm - 1, dd);
  if (yy < 1900 || date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return 'invalid';
  const future = yy > TODAY.y || (yy === TODAY.y && (mm > TODAY.m || (mm === TODAY.m && dd > TODAY.d)));
  if (future) return 'invalid';
  let age = TODAY.y - yy;
  if (TODAY.m < mm || (TODAY.m === mm && TODAY.d <= dd)) age--; // BUG 7: should be TODAY.d < dd
  return age >= 18 ? 'ok' : 'under18';
}

function check(v: Values): Check {
  const e: Check['errors'] = {};
  const t = (s: string) => s.trim();
  if (!t(v.name)) e.name = 'Enter your full name';
  else if (!NAME_RE.test(t(v.name))) e.name = 'Name can only contain letters';
  if (!t(v.email)) e.email = 'Enter your email address';
  else if (!EMAIL_RE.test(t(v.email))) e.email = 'Enter an email address like name@example.com';
  if (!t(v.phone)) e.phone = 'Enter your mobile number';
  else if (!PHONE_RE.test(t(v.phone))) e.phone = 'Enter a valid mobile number';
  const dob = dobState(v);
  if (dob === 'under18') e.dob = 'You must be 18 or older to join Larder';
  if (!v.password) e.password = 'Create a password';
  else if (v.password.length < 8) e.password = 'Use at least 8 characters';
  if (!v.country) e.country = 'Choose your country';
  if (!t(v.street)) e.street = 'Enter your street and house number';
  if (!t(v.city)) e.city = 'Enter your town or city';
  if (!t(v.postcode)) e.postcode = 'Enter your postcode';
  else if (!POSTCODE_RE.test(t(v.postcode))) e.postcode = 'Enter a 5-digit postcode';
  if (!v.terms) e.terms = 'Accept the Terms and Privacy Policy to continue';
  return { errors: e, dobRed: dob === 'invalid' }; // BUG 8: "invalid" gets no message
}

const ORDER: FieldId[] = ['name', 'email', 'phone', 'dob', 'password', 'country', 'street', 'city', 'postcode', 'terms'];
const FIRST_INPUT: Record<FieldId, string> = {
  name: 'reg-name', email: 'reg-email', phone: 'reg-phone', dob: 'reg-day', password: 'reg-password', country: 'reg-country', street: 'reg-street', city: 'reg-city', postcode: 'reg-postcode', terms: 'reg-terms',
};

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 flex items-start gap-1 text-[12px] leading-snug font-medium" style={{ color: RED }}>
      <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function boxStyle(error: boolean, autofilled: boolean) {
  return {
    borderColor: error ? RED : 'rgba(60,60,67,.22)',
    boxShadow: error ? `inset 0 0 0 1px ${RED}` : undefined,
    background: autofilled ? '#fdf6d8' : '#fff',
  };
}
const boxCls = 'h-10 w-full min-w-0 rounded-[10px] border px-3 text-[14px] text-black outline-none placeholder:text-[#3c3c43]/35 focus-visible:ring-2 focus-visible:ring-[#1f7a4d]/50';

interface LogEntry {
  id: number;
  status: 201 | 500;
  body: string;
}

export function BuggyRegistration() {
  const [v, setV] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [autofilled, setAutofilled] = useState<Partial<Record<TextKey, boolean>>>({});
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverMode, setServerMode] = useState<'ok' | 'error'>('ok');
  const [banner, setBanner] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [focusSummary, setFocusSummary] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sending = useRef(false);
  const logId = useRef(0);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const { errors, dobRed } = check(v);
  const visible = (f: FieldId) => (attempted || touched[f] ? errors[f] : undefined);
  const dobShowRed = (attempted || touched.dob) && dobRed;
  const summary = attempted ? ORDER.filter((f) => errors[f]).map((f) => ({ f, msg: errors[f]! })) : [];

  // After a failed submit, move focus to the error summary (this part works).
  useEffect(() => {
    if (!focusSummary) return;
    scroller.current?.scrollTo({ top: 0 });
    summaryRef.current?.focus({ preventScroll: true });
  }, [focusSummary]);

  const set = (k: TextKey, value: string) => {
    setV((p) => ({ ...p, [k]: value }));
    setAutofilled((a) => (a[k] ? { ...a, [k]: false } : a));
  };
  const touch = (f: FieldId) => setTouched((t) => (t[f] ? t : { ...t, [f]: true }));

  const autofill = () => {
    setV((p) => {
      const next = { ...p };
      for (const [k, token] of Object.entries(AC) as [TextKey, string][]) {
        if (CONTACT[token] !== undefined) next[k] = CONTACT[token];
      }
      return next;
    });
    const filled: Partial<Record<TextKey, boolean>> = {};
    for (const [k, token] of Object.entries(AC) as [TextKey, string][]) if (CONTACT[token] !== undefined) filled[k] = true;
    setAutofilled(filled);
  };

  const restart = () => {
    if (timer.current) clearTimeout(timer.current);
    sending.current = false;
    setV(EMPTY);
    setTouched({});
    setAttempted(false);
    setAutofilled({});
    setShowPw(false);
    setStatus('idle');
    setBanner(null);
    setLog([]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    setBanner(null);
    const result = check(v);
    const hasErrors = Object.keys(result.errors).length > 0 || result.dobRed;
    setAttempted(true);
    if (hasErrors) {
      if (Object.keys(result.errors).length > 0) setFocusSummary((n) => n + 1);
      return;
    }
    sending.current = true;
    setStatus('sending');
    const country = COUNTRIES.find((c) => c.code === v.country)?.code ?? '';
    const body = JSON.stringify(
      {
        name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        dateOfBirth: `${v.year.trim()}-${v.month.trim().padStart(2, '0')}-${v.day.trim().padStart(2, '0')}`,
        password: '••••••••',
        address: { country, street: v.street.trim(), city: v.city.trim(), postcode: v.postcode.trim() },
        acceptedTerms: v.terms,
        marketingEmails: v.marketing,
      },
      null,
      2,
    );
    const mode = serverMode;
    timer.current = setTimeout(() => {
      sending.current = false;
      const id = ++logId.current;
      if (mode === 'error') {
        setLog((l) => [{ id, status: 500 as const, body }, ...l].slice(0, 3));
        // BUG 10: the whole form is reset after a server error.
        setV(EMPTY);
        setTouched({});
        setAttempted(false);
        setAutofilled({});
        setStatus('idle');
        setBanner('Something went wrong on our side. Please try again.');
        scroller.current?.scrollTo({ top: 0 });
        setTimeout(() => bannerRef.current?.focus({ preventScroll: true }), 0);
      } else {
        setLog((l) => [{ id, status: 201 as const, body }, ...l].slice(0, 3));
        setStatus('done');
      }
    }, LATENCY);
  };

  const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;
  const country = COUNTRIES.find((c) => c.code === v.country);
  const firstName = v.name.trim().split(/\s+/)[0] || 'there';

  const textField = (k: Exclude<TextKey, 'day' | 'month' | 'year' | 'country'>, f: FieldId, label: string, opts: { type?: string; inputMode?: 'text' | 'email' | 'tel' | 'numeric'; autoComplete: string; hint?: string; autoCapitalize?: string; onChangeTouch?: boolean; right?: ReactNode }) => {
    const err = visible(f);
    const id = `reg-${k}`;
    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-black">
          {label}
        </label>
        {opts.hint && (
          <p id={`${id}-hint`} className="-mt-0.5 mb-1 text-[12px] leading-snug" style={{ color: sub }}>
            {opts.hint}
          </p>
        )}
        <div className="relative">
          <input
            id={id}
            className={boxCls + (opts.right ? ' pr-11' : '')}
            style={boxStyle(!!err, !!autofilled[k])}
            type={opts.type ?? 'text'}
            inputMode={opts.inputMode}
            autoComplete={opts.autoComplete}
            autoCapitalize={opts.autoCapitalize}
            spellCheck={false}
            value={v[k]}
            aria-invalid={err ? true : undefined}
            aria-describedby={describedBy(opts.hint && `${id}-hint`, err && `${id}-error`)}
            onChange={(e) => {
              set(k, e.target.value);
              if (opts.onChangeTouch) touch(f);
            }}
            onBlur={() => touch(f)}
          />
          {opts.right}
        </div>
        {err && <ErrorText id={`${id}-error`}>{err}</ErrorText>}
      </div>
    );
  };

  const dayErr = visible('dob');
  const dobBorder = (k: TextKey) => boxStyle(!!dayErr || dobShowRed, !!autofilled[k]);

  let screen: ReactNode;
  if (status === 'done') {
    screen = (
      <div className="flex h-full flex-col items-center justify-center bg-[#f6f6f2] px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full text-white" style={{ background: ACCENT }}>
          <CheckCircle2 size={28} />
        </span>
        <p className="mt-4 text-[21px] leading-tight font-bold break-words">Welcome to Larder, {firstName}!</p>
        <p className="mt-2 text-[13px] break-words" style={{ color: sub }}>
          We sent a confirmation email to {v.email.trim()}.
        </p>
        <button type="button" onClick={restart} className="mt-6 h-10 rounded-full px-5 text-[14px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7a4d]" style={{ background: ACCENT }}>
          Start over
        </button>
      </div>
    );
  } else {
    screen = (
      <div className="flex h-full flex-col bg-[#f6f6f2]">
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[.08] bg-white px-4 py-2.5">
          <span className="grid size-7 place-items-center rounded-lg text-white" style={{ background: ACCENT }}>
            <ShoppingBasket size={15} aria-hidden="true" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">Larder</span>
          <span className="ml-auto text-[12px]" style={{ color: sub }}>
            Sign up
          </span>
        </div>

        <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-20">
          <h3 className="text-[22px] leading-tight font-bold tracking-tight">Create your account</h3>
          <p className="mt-1 text-[12px]" style={{ color: sub }}>
            All fields are required unless marked (optional).
          </p>

          {banner && (
            <div ref={bannerRef} tabIndex={-1} role="alert" className="mt-3 rounded-xl border px-3 py-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#c81e1e]/40" style={{ borderColor: RED, background: '#fff5f5', color: '#7a1010' }}>
              <p className="flex items-start gap-1.5 font-semibold">
                <AlertCircle size={15} className="mt-px shrink-0" aria-hidden="true" /> {banner}
              </p>
            </div>
          )}

          {summary.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="group" aria-labelledby="reg-summary-title" className="mt-3 rounded-xl border-2 bg-white px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#c81e1e]/40" style={{ borderColor: RED }}>
              <p id="reg-summary-title" className="text-[14px] font-bold text-black">
                {summary.length === 1 ? 'There is 1 problem' : `There are ${summary.length} problems`}
              </p>
              <ul className="mt-1.5 space-y-1">
                {summary.map(({ f, msg }) => (
                  <li key={f}>
                    {/* BUG 9: the link neither moves focus nor scrolls. */}
                    <a href={`#${FIRST_INPUT[f]}`} onClick={(e) => e.preventDefault()} className="text-[13px] font-medium underline underline-offset-2" style={{ color: RED }}>
                      {msg}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form noValidate onSubmit={submit} className="mt-3 space-y-4" aria-label="Create your Larder account">
            <fieldset className="space-y-3 rounded-2xl bg-white p-3">
              <legend className="float-left mb-1 flex w-full items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                <UserRound size={12} aria-hidden="true" /> About you
              </legend>
              <div className="clear-both space-y-3">
                {textField('name', 'name', 'Full name', { autoComplete: AC.name!, autoCapitalize: 'words' })}
                {textField('email', 'email', 'Email', { type: 'email', inputMode: 'email', autoComplete: AC.email!, autoCapitalize: 'none', hint: "We'll send your receipts here.", onChangeTouch: true /* BUG 1 */ })}
                {textField('phone', 'phone', 'Mobile number', { type: 'tel', inputMode: 'tel', autoComplete: AC.phone!, hint: 'Include the country code, for example +44 7700 900123.' })}

                <fieldset
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) touch('dob');
                  }}
                  aria-describedby={describedBy('reg-dob-hint', dayErr && 'reg-dob-error')}
                >
                  <legend className="mb-1 flex items-center gap-1 text-[13px] font-semibold text-black">
                    <CalendarDays size={13} aria-hidden="true" /> Date of birth
                  </legend>
                  <p id="reg-dob-hint" className="-mt-0.5 mb-1 text-[12px] leading-snug" style={{ color: sub }}>
                    For example 27 3 1995. You must be 18 or older (we deliver beer and wine).
                  </p>
                  <div className="flex items-end gap-2">
                    {(
                      [
                        ['day', 'Day', 2, 'bday-day', 'w-12'],
                        ['month', 'Month', 2, 'bday-month', 'w-12'],
                        ['year', 'Year', 4, 'bday-year', 'w-[4.5rem]'],
                      ] as const
                    ).map(([k, label, max, ac, w]) => (
                      <div key={k} className={w}>
                        <label htmlFor={`reg-${k}`} className="mb-0.5 block text-[11px]" style={{ color: sub }}>
                          {label}
                        </label>
                        <input
                          id={`reg-${k}`}
                          className={boxCls + ' px-2 text-center tabular-nums'}
                          style={dobBorder(k)}
                          inputMode="numeric"
                          maxLength={max}
                          autoComplete={ac}
                          value={v[k]}
                          aria-invalid={dayErr ? true : undefined}
                          onChange={(e) => set(k, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  {dayErr && <ErrorText id="reg-dob-error">{dayErr}</ErrorText>}
                </fieldset>

                {textField('password', 'password', 'Password', {
                  type: showPw ? 'text' : 'password',
                  autoComplete: 'new-password',
                  autoCapitalize: 'none',
                  hint: 'At least 8 characters.',
                  right: (
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      aria-pressed={showPw}
                      className="absolute top-0 right-0 grid h-10 w-10 place-items-center rounded-r-[10px] text-[#3c3c43]/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1f7a4d]"
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  ),
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-2xl bg-white p-3">
              <legend className="float-left mb-1 flex w-full items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                <ShoppingBasket size={12} aria-hidden="true" /> Delivery address
              </legend>
              <div className="clear-both space-y-3">
                <div>
                  <label htmlFor="reg-country" className="mb-1 block text-[13px] font-semibold text-black">
                    Country
                  </label>
                  <select
                    id="reg-country"
                    className={boxCls + ' appearance-auto pr-2'}
                    style={boxStyle(!!visible('country'), !!autofilled.country)}
                    autoComplete={AC.country}
                    value={v.country}
                    aria-invalid={visible('country') ? true : undefined}
                    aria-describedby={visible('country') ? 'reg-country-error' : undefined}
                    onChange={(e) => {
                      set('country', e.target.value);
                      touch('country');
                    }}
                    onBlur={() => touch('country')}
                  >
                    <option value="">Choose…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {visible('country') && <ErrorText id="reg-country-error">{visible('country')}</ErrorText>}
                </div>
                {textField('street', 'street', 'Street and house number', { autoComplete: AC.street!, autoCapitalize: 'words' })}
                {textField('city', 'city', 'Town or city', { autoComplete: AC.city!, autoCapitalize: 'words' })}
                {textField('postcode', 'postcode', 'Postcode', { autoComplete: AC.postcode!, autoCapitalize: 'characters', hint: country ? country.hint : 'Choose your country first to see the format.' })}
              </div>
            </fieldset>

            <div className="space-y-3 rounded-2xl bg-white p-3">
              <div>
                <label className="flex items-start gap-2.5 text-[13px] leading-snug text-black">
                  <input
                    id="reg-terms"
                    type="checkbox"
                    className="mt-0.5 size-5 shrink-0"
                    style={{ accentColor: ACCENT, outline: visible('terms') ? `2px solid ${RED}` : undefined, outlineOffset: 1 }}
                    checked={v.terms}
                    aria-invalid={visible('terms') ? true : undefined}
                    aria-describedby={visible('terms') ? 'reg-terms-error' : undefined}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setV((p) => ({ ...p, terms: checked }));
                    }}
                  />
                  <span>
                    I accept the <span className="font-semibold underline" style={{ color: ACCENT }}>Terms</span> and <span className="font-semibold underline" style={{ color: ACCENT }}>Privacy Policy</span>
                  </span>
                </label>
                {visible('terms') && <ErrorText id="reg-terms-error">{visible('terms')}</ErrorText>}
              </div>
              <label className="flex items-start gap-2.5 text-[13px] leading-snug text-black">
                <input type="checkbox" className="mt-0.5 size-5 shrink-0" style={{ accentColor: ACCENT }} checked={v.marketing} onChange={(e) => {
                  const checked = e.target.checked;
                  setV((p) => ({ ...p, marketing: checked }));
                }} />
                <span>Email me weekly offers (optional)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7a4d] disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-black/10 bg-[#d1d3d9]/95 px-2 pt-1.5 pb-4 backdrop-blur">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={autofill}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white/80 px-2 text-[12px] text-black focus-visible:outline-2 focus-visible:outline-[#1f7a4d]"
          >
            <KeyRound size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">
              AutoFill contact: <strong>Tom Becker</strong>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[340px] min-w-0 flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {screen}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Server size={13} aria-hidden="true" /> Next server response
          </p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} aria-hidden="true" /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1" role="group" aria-label="Next server response">
          {(
            [
              ['ok', '201 Created'],
              ['error', '500 Server error'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={serverMode === mode}
              onClick={() => setServerMode(mode)}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${serverMode === mode ? (mode === 'ok' ? 'bg-surface text-ok shadow-sm' : 'bg-surface text-danger shadow-sm') : 'text-muted hover:text-fg'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Today in this demo: <strong className="text-fg">Thursday, 14 May 2026</strong>
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <div className="min-h-[4.5rem] space-y-3 px-3 py-2" aria-live="polite">
          {log.length === 0 ? (
            <p className="text-white/40">Submit the form to see the request…</p>
          ) : (
            log.map((entry) => (
              <div key={entry.id}>
                <p>
                  <span className="text-[#7dd3fc]">POST</span> /api/accounts <span className={entry.status === 201 ? 'text-[#34d399]' : 'text-[#f87171]'}>{entry.status}</span>
                </p>
                <pre className="mt-1 break-all whitespace-pre-wrap text-[#e2e8f0]">{entry.body}</pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
