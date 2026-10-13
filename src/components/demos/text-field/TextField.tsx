import { useId, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert, CircleX, Eye, EyeOff, type LucideIcon } from 'lucide-react';

export type TFVariant = 'ios' | 'filled' | 'outlined' | 'web';

/** Count characters the way people do (👩‍💻 or 🇭🇷 is one character, not 5 or 2). */
export function graphemes(s: string): number {
  try {
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<unknown> } }).Segmenter;
    if (Seg) return [...new Seg(undefined, { granularity: 'grapheme' }).segment(s)].length;
  } catch {
    /* fall through */
  }
  return [...s].length;
}

interface Props {
  label: string;
  /** Controlled value. Leave undefined to let the field manage its own state. */
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  variant?: TFVariant;
  dark?: boolean;
  type?: 'text' | 'email' | 'tel' | 'password' | 'search' | 'url' | 'number';
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  autoCapitalize?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  /** Shows a character counter. Counts graphemes, and allows going over (with an error) so pasted text is never cut silently. */
  maxChars?: number;
  icon?: LucideIcon;
  clearable?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Visually hide the label (it is still announced by screen readers). */
  hideLabel?: boolean;
  /** Background color behind the field (used for the outlined label cut-out). */
  surface?: string;
  /** Force the focused look (for static illustrations). */
  forceFocus?: boolean;
  className?: string;
  style?: CSSProperties;
}

const colors = (variant: TFVariant, dark: boolean) => {
  if (variant === 'ios')
    return { accent: dark ? '#0a84ff' : '#007aff', error: dark ? '#ff453a' : '#ff3b30', text: dark ? '#fff' : '#000', sub: dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)', field: dark ? '#1c1c1e' : '#fff', line: 'transparent' };
  if (variant === 'web')
    return { accent: dark ? '#60a5fa' : '#2563eb', error: dark ? '#f87171' : '#dc2626', text: dark ? '#f4f4f5' : '#18181b', sub: dark ? '#a1a1aa' : '#52525b', field: dark ? '#18181b' : '#fff', line: dark ? '#3f3f46' : '#d0d5dd' };
  return {
    accent: dark ? '#d0bcff' : '#6750a4',
    error: dark ? '#f2b8b5' : '#b3261e',
    text: dark ? '#e6e0e9' : '#1d1b20',
    sub: dark ? '#cac4d0' : '#49454f',
    field: variant === 'filled' ? (dark ? '#36343b' : '#e6e0e9') : 'transparent',
    line: dark ? '#938f99' : '#79747e',
  };
};

export function TextField({
  label,
  value,
  defaultValue = '',
  onChange,
  onBlur,
  onFocus,
  variant = 'web',
  dark = false,
  type = 'text',
  inputMode,
  autoComplete,
  autoCapitalize,
  placeholder,
  helper,
  error,
  maxChars,
  icon: Icon,
  clearable = false,
  multiline = false,
  rows = 3,
  disabled = false,
  readOnly = false,
  required = false,
  hideLabel = false,
  surface,
  forceFocus = false,
  className = '',
  style,
}: Props) {
  const id = useId();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [focusedState, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const v = value ?? inner;
  const focused = focusedState || forceFocus;
  const set = (x: string) => {
    if (value === undefined) setInner(x);
    onChange?.(x);
  };

  const c = colors(variant, dark);
  const count = graphemes(v);
  const over = maxChars !== undefined && count > maxChars ? count - maxChars : 0;
  const err = error ?? (over ? `${over} character${over === 1 ? '' : 's'} too many` : undefined);
  const supportId = `${id}-support`;
  const isPassword = type === 'password';
  const inputType = isPassword && show ? 'text' : type;
  const material = variant === 'filled' || variant === 'outlined';
  const floated = focused || v.length > 0 || multiline;
  const showClear = clearable && v.length > 0 && !disabled && !readOnly;
  const tone = err ? c.error : focused ? c.accent : c.sub;

  const common = {
    id,
    ref,
    value: v,
    disabled,
    readOnly,
    required,
    autoComplete,
    autoCapitalize,
    spellCheck: type === 'email' || isPassword ? false : undefined,
    placeholder: material && !floated ? '' : placeholder,
    'aria-invalid': err ? true : undefined,
    'aria-describedby': helper || err || maxChars !== undefined ? supportId : undefined,
    onFocus: () => {
      setFocused(true);
      onFocus?.();
    },
    onBlur: () => {
      setFocused(false);
      onBlur?.();
    },
    className: 'w-full min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-[var(--ph)] placeholder:opacity-100 disabled:cursor-not-allowed',
  };
  const fontSize = variant === 'ios' ? 17 : variant === 'web' ? 15 : 16;
  const placeholderColor = { ['--ph' as string]: variant === 'ios' ? (dark ? 'rgba(235,235,245,.3)' : 'rgba(60,60,67,.3)') : c.sub };

  const control = multiline ? (
    <textarea {...common} rows={rows} onChange={(e) => set(e.target.value)} style={{ fontSize, color: c.text, lineHeight: 1.4 }} />
  ) : (
    <input {...common} type={inputType} inputMode={inputMode} onChange={(e) => set(e.target.value)} style={{ fontSize, color: c.text }} />
  );

  const trailing: ReactNode = (
    <>
      {showClear && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={() => {
            set('');
            ref.current?.focus();
          }}
          className="-m-1.5 grid shrink-0 place-items-center rounded-full p-1.5"
          style={{ color: variant === 'ios' ? (dark ? '#8e8e93' : '#c7c7cc') : c.sub }}
        >
          <CircleX size={variant === 'ios' ? 18 : 20} fill="currentColor" stroke={c.field === 'transparent' ? (surface ?? '#fff') : c.field} />
        </button>
      )}
      {isPassword && !disabled && (
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          className="-m-1.5 grid shrink-0 place-items-center rounded-full p-1.5"
          style={{ color: c.sub }}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      {material && err && !showClear && !isPassword && <CircleAlert size={20} className="shrink-0" style={{ color: c.error }} aria-hidden />}
    </>
  );

  const counter =
    maxChars !== undefined ? (
      <span className="ml-auto shrink-0 tabular-nums" style={{ color: over ? c.error : c.sub }}>
        {count}/{maxChars}
      </span>
    ) : null;

  const support =
    helper || err || counter ? (
      <div id={supportId} aria-live="polite" className="mt-1.5 flex items-start gap-3" style={{ fontSize: variant === 'web' ? 13 : 12.5, paddingInline: variant === 'web' ? 0 : variant === 'ios' ? 4 : 16 }}>
        {err ? (
          <span className="flex items-start gap-1" style={{ color: c.error }}>
            {variant !== 'filled' && variant !== 'outlined' && <CircleAlert size={14} className="mt-[1px] shrink-0" aria-hidden />}
            <span>{err}</span>
          </span>
        ) : helper ? (
          <span style={{ color: c.sub }}>{helper}</span>
        ) : null}
        {counter}
      </div>
    ) : null;

  const labelText = (
    <>
      {label}
      {required && material && ' *'}
    </>
  );
  const wrapStyle: CSSProperties = { opacity: disabled ? 0.45 : 1, ...placeholderColor, ...style };

  if (variant === 'ios' || variant === 'web') {
    const ios = variant === 'ios';
    return (
      <div className={`tf ${className}`} style={wrapStyle}>
        <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1.5 block'} style={{ fontSize: ios ? 13 : 14, fontWeight: ios ? 400 : 500, color: ios ? c.sub : c.text, paddingInline: ios ? 4 : 0 }}>
          {label}
          {required && !ios && <span style={{ color: c.error }}> *</span>}
        </label>
        <div
          className={`flex gap-2 px-3 transition-shadow ${multiline ? 'items-start py-2.5' : 'items-center'}`}
          style={{
            minHeight: ios ? 44 : 42,
            background: readOnly && !ios ? (dark ? '#27272a' : '#f4f4f5') : c.field,
            borderRadius: ios ? 10 : 8,
            border: `1px solid ${err ? c.error : focused && !ios ? c.accent : c.line}`,
            boxShadow: focused ? `0 0 0 ${ios ? 2 : 3}px ${(err ? c.error : c.accent) + (ios ? '55' : '33')}` : undefined,
          }}
        >
          {Icon && <Icon size={18} className="shrink-0" style={{ color: ios ? '#8e8e93' : c.sub }} aria-hidden />}
          {control}
          {trailing}
        </div>
        {support}
      </div>
    );
  }

  // Material 3: filled or outlined, with a floating label.
  const filled = variant === 'filled';
  const labelLeft = Icon ? 48 : 16;
  return (
    <div className={`tf ${className}`} style={wrapStyle}>
      <div
        className={`relative flex gap-3 px-4 ${multiline ? 'items-start' : 'items-center'}`}
        style={{
          minHeight: 56,
          background: c.field,
          borderRadius: filled ? '4px 4px 0 0' : 4,
          border: filled ? 'none' : `1px solid ${err ? c.error : focused ? c.accent : c.line}`,
          borderBottom: filled ? `${focused || err ? 2 : 1}px solid ${err ? c.error : focused ? c.accent : c.sub}` : undefined,
          boxShadow: !filled && focused ? `inset 0 0 0 1px ${err ? c.error : c.accent}` : undefined,
          paddingLeft: Icon ? 12 : 16,
        }}
      >
        <label
          htmlFor={id}
          className="pointer-events-none absolute origin-left whitespace-nowrap transition-all duration-150"
          style={
            floated
              ? filled
                ? { left: labelLeft, top: 7, fontSize: 12, color: tone }
                : { left: Icon ? 44 : 12, top: 0, transform: 'translateY(-50%)', fontSize: 12, color: tone, background: surface ?? '#fff', paddingInline: 4 }
              : { left: labelLeft, top: 16, fontSize: 16, color: err ? c.error : c.sub }
          }
        >
          {labelText}
        </label>
        {Icon && <Icon size={22} className={`shrink-0 ${multiline ? 'mt-4' : ''}`} style={{ color: c.sub }} aria-hidden />}
        <div className={`flex min-w-0 flex-1 ${filled ? 'pt-6 pb-2' : multiline ? 'py-4' : 'py-4'}`}>{control}</div>
        {trailing}
      </div>
      {support}
    </div>
  );
}
