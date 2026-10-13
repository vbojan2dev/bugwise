import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowBigUp, Check, Eye, EyeOff, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Password helpers shared by the demos                                */
/* ------------------------------------------------------------------ */

/** A tiny sample of the most common passwords. Real apps check against lists with millions of entries. */
const COMMON = new Set([
  'password',
  'password1',
  'password1!',
  'password123',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword1',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'welcome1',
  'welcome123',
  'letmein',
  'admin123',
  'summer2024',
  'summer2025',
  'abc123',
  '111111',
  'football1',
  'monkey123',
]);
const COMMON_WORDS = ['password', 'passw0rd', 'qwerty', 'welcome', 'letmein', 'iloveyou', 'summer', 'winter', 'admin', 'monkey', 'dragon', 'football'];

/** Number of characters as a user counts them (an emoji is one). */
export const charCount = (s: string) => Array.from(s).length;

/** True for passwords that are on a "common passwords" list, or a common word with a few digits/symbols bolted on. */
export function isCommon(pw: string) {
  const p = pw.toLowerCase().trim();
  if (COMMON.has(p)) return true;
  const core = p.replace(/[^a-z0-9@]+$/g, '').replace(/[0-9]+$/g, '').replace(/[^a-z0-9@]+$/g, '');
  return COMMON_WORDS.includes(core);
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; note: string };

/**
 * The naive meter many apps ship: one point each for length ≥ 8, lowercase, uppercase, digit, symbol.
 * "Password1!" gets full marks, a long passphrase gets "Weak".
 */
export function naiveStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: 'Too short', note: '' };
  let pts = 0;
  if (pw.length >= 8) pts++;
  if (/[a-z]/.test(pw)) pts++;
  if (/[A-Z]/.test(pw)) pts++;
  if (/[0-9]/.test(pw)) pts++;
  if (/[!@#$%^&*?_\-+=.~]/.test(pw)) pts++;
  const score = Math.max(0, pts - 1) as Strength['score'];
  const label = ['Very weak', 'Weak', 'Medium', 'Good', 'Strong'][score];
  return { score, label, note: 'Counts character types only.' };
}

/** A better (still simplified) estimate: blocklist first, then mostly length, with a penalty for repetition. */
export function betterStrength(pw: string): Strength {
  const n = charCount(pw);
  if (!pw) return { score: 0, label: 'Too short', note: '' };
  if (isCommon(pw)) return { score: 0, label: 'Very weak', note: 'This is one of the most common passwords. Attackers try it first.' };
  const unique = new Set(Array.from(pw.toLowerCase())).size;
  if (unique <= 3) return { score: 0, label: 'Very weak', note: 'Repeated characters are guessed instantly.' };
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pw) && n < 14) return { score: 1, label: 'Weak', note: 'Keyboard and number sequences are among the first guesses.' };
  if (n < 8) return { score: 0, label: 'Too short', note: 'Use at least 8 characters, longer is better.' };
  if (n < 12) return { score: 1, label: 'Weak', note: 'Add a few more words or characters.' };
  if (n < 16) return { score: 2, label: 'Fair', note: 'Good start. A few more characters make it much harder to guess.' };
  if (n < 20) return { score: 3, label: 'Good', note: 'Long and not on any common list.' };
  return { score: 4, label: 'Strong', note: 'Long passphrases are strong and easy to remember.' };
}

/** Rules for the demo shop, shown up front as a live checklist. */
export function rulesFor(pw: string, email = '') {
  const name = email.split('@')[0]?.toLowerCase() ?? '';
  return [
    { id: 'len', text: 'At least 12 characters', ok: charCount(pw) >= 12 },
    { id: 'common', text: 'Not a commonly used password', ok: pw.length > 0 && !isCommon(pw) },
    { id: 'email', text: 'Doesn’t contain your email name', ok: pw.length > 0 && (name.length < 3 || !pw.toLowerCase().includes(name)) },
  ];
}

const meterColors = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#15803d'];

export function StrengthMeter({ s, id }: { s: Strength; id?: string }) {
  return (
    <div id={id}>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < Math.max(1, s.score) ? meterColors[s.score] : '#e5e7eb' }} />
        ))}
      </div>
      <p className="mt-1 text-[12px] text-[#4b5563]">
        Strength: <strong style={{ color: meterColors[s.score] }}>{s.label}</strong>
        {s.note && <span> · {s.note}</span>}
      </p>
    </div>
  );
}

export function RuleList({ rules, id, live = true }: { rules: { id: string; text: string; ok: boolean }[]; id?: string; live?: boolean }) {
  return (
    <ul id={id} className="space-y-0.5 text-[12px]">
      {rules.map((r) => (
        <li key={r.id} className={`flex items-center gap-1.5 ${live && r.ok ? 'text-[#15803d]' : 'text-[#4b5563]'}`}>
          {live && r.ok ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <X size={13} strokeWidth={2.5} aria-hidden="true" className="text-[#9ca3af]" />}
          <span>
            {r.text}
            {live && <span className="sr-only">{r.ok ? ', done' : ', not yet'}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* The (correct) password input                                        */
/* ------------------------------------------------------------------ */

/**
 * Show/hide that keeps focus and the cursor position. The type switch can reset the selection in
 * some browsers, so we remember it and put it back.
 */
export function useReveal() {
  const ref = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(false);
  const sel = useRef<[number, number] | null>(null);
  const toggle = () => {
    const el = ref.current;
    sel.current = el && document.activeElement === el ? [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length] : null;
    setShown((s) => !s);
  };
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && sel.current) {
      el.setSelectionRange(sel.current[0], sel.current[1]);
      sel.current = null;
    }
  }, [shown]);
  return { ref, shown, toggle };
}

export type PwVariant = 'ios' | 'material' | 'web';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  variant?: PwVariant;
  autoComplete?: string;
  placeholder?: string;
  /** Text or element shown below the field and linked with aria-describedby. */
  below?: ReactNode;
  error?: string;
  /** Show the Caps Lock warning (web). Pass `forceCaps` to simulate it on touch devices. */
  capsWarning?: boolean;
  forceCaps?: boolean;
  /** Toggle style: icon button with a changing label, or a text button "Show"/"Hide". */
  toggleStyle?: 'icon' | 'text';
  surface?: string;
  onFocus?: () => void;
}

export function PasswordField({
  label,
  value,
  onChange,
  variant = 'web',
  autoComplete = 'current-password',
  placeholder,
  below,
  error,
  capsWarning = false,
  forceCaps = false,
  toggleStyle = 'icon',
  surface = '#fff',
  onFocus,
}: Props) {
  const id = useId();
  const { ref, shown, toggle } = useReveal();
  const [caps, setCaps] = useState(false);
  const [focused, setFocused] = useState(false);
  const capsOn = capsWarning && (caps || forceCaps);
  const describedBy = [error ? `${id}-err` : '', capsOn ? `${id}-caps` : '', below ? `${id}-below` : ''].filter(Boolean).join(' ') || undefined;

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setCaps(e.getModifierState('CapsLock'));
  };

  const accent = variant === 'ios' ? '#007aff' : variant === 'material' ? '#6750a4' : '#2563eb';
  const toggleLabel = shown ? 'Hide password' : 'Show password';
  const toggleBtn =
    toggleStyle === 'text' ? (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
        aria-label={toggleLabel}
        className="mr-1 h-9 min-w-11 shrink-0 rounded-md px-2 text-[13px] font-semibold outline-none focus-visible:ring-2"
        style={{ color: accent, ['--tw-ring-color' as string]: `${accent}66` }}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    ) : (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
        aria-label={toggleLabel}
        className="mr-0.5 grid size-11 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2"
        style={{ color: variant === 'material' ? '#49454f' : '#6b7280', ['--tw-ring-color' as string]: `${accent}66` }}
      >
        {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    );

  const input = (
    <input
      ref={ref}
      id={id}
      type={shown ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={keys}
      onKeyUp={keys}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className="h-11 w-0 min-w-0 flex-1 bg-transparent px-3 text-[16px] outline-none placeholder:text-[#9ca3af]"
    />
  );

  const helpers = (
    <>
      {capsOn && (
        <p id={`${id}-caps`} className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#b45309]">
          <ArrowBigUp size={14} aria-hidden="true" /> Caps Lock is on
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[12px] text-[#dc2626]">
          {error}
        </p>
      )}
      {below && (
        <div id={`${id}-below`} className="mt-1.5">
          {below}
        </div>
      )}
    </>
  );

  if (variant === 'material') {
    const floated = focused || value.length > 0;
    return (
      <div className="text-[#1d1b20]">
        <div className={`relative flex items-center rounded-[4px] border ${error ? 'border-[#b3261e]' : focused ? 'border-[#6750a4]' : 'border-[#79747e]'}`} style={{ boxShadow: focused ? `inset 0 0 0 1px ${error ? '#b3261e' : '#6750a4'}` : undefined }}>
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-3 px-1 transition-all ${floated ? '-top-2.5 text-[12px]' : 'top-1/2 -translate-y-1/2 text-[16px]'}`}
            style={{ background: surface, color: error ? '#b3261e' : focused ? '#6750a4' : '#49454f' }}
          >
            {label}
          </label>
          <span className="flex h-14 min-w-0 flex-1 items-center pl-1">{input}</span>
          {toggleBtn}
        </div>
        <div className="px-4 text-[#49454f]">{helpers}</div>
      </div>
    );
  }

  if (variant === 'ios') {
    return (
      <div className="text-black">
        <label htmlFor={id} className="mb-1 block px-1 text-[13px] text-[rgba(60,60,67,.6)]">
          {label}
        </label>
        <div className={`flex items-center rounded-[10px] bg-white ${error ? 'ring-1 ring-[#ff3b30]' : ''}`}>
          {input}
          {toggleBtn}
        </div>
        <div className="px-1">{helpers}</div>
      </div>
    );
  }

  return (
    <div className="text-[#111827]">
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium">
        {label}
      </label>
      <div className={`flex items-center rounded-lg border bg-white focus-within:ring-2 ${error ? 'border-[#dc2626] focus-within:ring-[#dc2626]/30' : 'border-[#d1d5db] focus-within:border-[#2563eb] focus-within:ring-[#2563eb]/30'}`}>
        {input}
        {toggleBtn}
      </div>
      {helpers}
    </div>
  );
}
