import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { Check, type LucideIcon } from 'lucide-react';

export type Variant = 'ios' | 'material' | 'web';

export interface SegOption {
  label?: string;
  icon?: LucideIcon;
  badge?: number;
  disabled?: boolean;
  /** Accessible name for icon-only segments. */
  a11y?: string;
}

interface Props {
  options: SegOption[];
  /** Selected index, or indexes when `multiple` (Material only). -1 = nothing selected. */
  value: number | number[];
  onChange?: (value: number | number[]) => void;
  variant?: Variant;
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  multiple?: boolean;
  /** How long labels behave. 'clip' reproduces a common bug. */
  overflow?: 'ellipsis' | 'clip' | 'wrap';
  ariaLabel?: string;
  /** Font scale, to simulate the OS text-size setting. */
  textScale?: number;
  /** Disable accessibility semantics (used by the buggy demo). */
  noA11y?: boolean;
  /** Make the selected thumb the same color as the track (used by the buggy demo). */
  lowContrast?: boolean;
  className?: string;
  style?: CSSProperties;
}

const fontSize = { sm: 12, md: 13, lg: 15 };
const height = { sm: 28, md: 32, lg: 40 };

export function SegmentedControl({
  options,
  value,
  onChange,
  variant = 'ios',
  dark = false,
  size = 'md',
  fullWidth = true,
  multiple = false,
  overflow = 'ellipsis',
  ariaLabel = 'Options',
  textScale = 1,
  noA11y = false,
  lowContrast = false,
  className = '',
  style,
}: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Array.isArray(value) ? value : [value];
  const single = Array.isArray(value) ? value[0] ?? -1 : value;
  const isSel = (i: number) => selected.includes(i);
  const n = options.length;

  const select = (i: number) => {
    if (options[i].disabled) return;
    if (multiple) {
      onChange?.(isSel(i) ? selected.filter((s) => s !== i) : [...selected, i].sort());
    } else {
      onChange?.(i);
    }
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    if (noA11y || multiple) return;
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    let j = i;
    do j = (j + dir + n) % n;
    while (options[j].disabled && j !== i);
    refs.current[j]?.focus();
    select(j);
  };

  const fs = fontSize[size] * textScale;
  const labelStyle: CSSProperties =
    overflow === 'wrap'
      ? { whiteSpace: 'normal', lineHeight: 1.15 }
      : overflow === 'clip'
        ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip' }
        : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  const content = (o: SegOption, sel: boolean) => (
    <>
      {variant === 'material' && sel && <Check size={fs + 2} strokeWidth={2.5} className="shrink-0" />}
      {o.icon && <o.icon size={fs + 3} strokeWidth={2} className="shrink-0" aria-hidden />}
      {o.label && (
        <span className="min-w-0" style={labelStyle}>
          {o.label}
        </span>
      )}
      {o.badge !== undefined && (
        <span
          className="grid shrink-0 place-items-center rounded-full px-1.5 font-semibold tabular-nums"
          style={{
            fontSize: fs - 2,
            minWidth: fs + 5,
            height: fs + 5,
            background: sel ? (dark ? '#0a84ff' : '#007aff') : dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)',
            color: sel ? '#fff' : 'inherit',
          }}
        >
          {o.badge}
        </span>
      )}
    </>
  );

  const groupProps = noA11y ? {} : { role: multiple ? 'group' : 'radiogroup', 'aria-label': ariaLabel };
  const itemProps = (i: number) =>
    noA11y
      ? { tabIndex: -1 }
      : multiple
        ? { 'aria-pressed': isSel(i) }
        : { role: 'radio', 'aria-checked': isSel(i), tabIndex: isSel(i) || (single === -1 && i === 0) ? 0 : -1 };

  if (variant === 'ios') {
    const track = dark ? 'rgba(118,118,128,.24)' : 'rgba(118,118,128,.12)';
    const thumb = lowContrast ? track : dark ? '#636366' : '#ffffff';
    return (
      <div
        {...groupProps}
        className={`relative flex select-none ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
        style={{ background: track, borderRadius: 9, padding: 2, minHeight: height[size] * Math.max(1, textScale * 0.9), ...style }}
      >
        {single >= 0 && !multiple && (
          <span
            aria-hidden
            className="absolute top-[2px] bottom-[2px] left-[2px] transition-transform duration-300 ease-[cubic-bezier(.3,.7,.2,1)]"
            style={{
              width: `calc((100% - 4px) / ${n})`,
              transform: `translateX(${single * 100}%)`,
              background: thumb,
              borderRadius: 7,
              boxShadow: lowContrast ? 'none' : '0 3px 8px rgba(0,0,0,.12), 0 3px 1px rgba(0,0,0,.04)',
              border: dark || lowContrast ? 'none' : '0.5px solid rgba(0,0,0,.04)',
            }}
          />
        )}
        {options.map((o, i) => {
          const sel = isSel(i);
          return (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              {...itemProps(i)}
              disabled={o.disabled}
              aria-label={!o.label && !noA11y ? o.a11y ?? `Option ${i + 1}` : undefined}
              onClick={() => select(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="relative z-10 flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff] disabled:opacity-35"
              style={{
                fontSize: fs,
                fontWeight: sel ? 600 : 500,
                color: dark ? '#fff' : '#000',
                borderRadius: 7,
                borderLeft: i > 0 && !sel && !isSel(i - 1) ? `1px solid ${dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)'}` : '1px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              {content(o, sel)}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'material') {
    const outline = dark ? '#938f99' : '#79747e';
    return (
      <div
        {...groupProps}
        className={`flex select-none overflow-hidden ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
        style={{ border: `1px solid ${outline}`, borderRadius: 999, minHeight: height[size] + 8, ...style }}
      >
        {options.map((o, i) => {
          const sel = isSel(i);
          return (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              {...itemProps(i)}
              disabled={o.disabled}
              aria-label={!o.label && !noA11y ? o.a11y ?? `Option ${i + 1}` : undefined}
              onClick={() => select(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 px-3 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#6750a4] disabled:opacity-40"
              style={{
                fontSize: fs + 1,
                fontWeight: 500,
                letterSpacing: '0.01em',
                borderLeft: i > 0 ? `1px solid ${outline}` : 'none',
                background: sel ? (dark ? '#4a4458' : '#e8def8') : 'transparent',
                color: sel ? (dark ? '#e8def8' : '#1d192b') : dark ? '#e6e0e9' : '#1d1b20',
              }}
            >
              {content(o, sel)}
            </button>
          );
        })}
      </div>
    );
  }

  // Web button group
  return (
    <div
      {...groupProps}
      className={`flex select-none ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
      style={{ borderRadius: 10, boxShadow: `0 0 0 1px ${dark ? '#323748' : '#d3d6e2'}`, ...style }}
    >
      {options.map((o, i) => {
        const sel = isSel(i);
        return (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            {...itemProps(i)}
            disabled={o.disabled}
            aria-label={!o.label && !noA11y ? o.a11y ?? `Option ${i + 1}` : undefined}
            onClick={() => select(i)}
            onKeyDown={(e) => onKey(e, i)}
            className="flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 px-3 transition-colors first:rounded-l-[10px] last:rounded-r-[10px] hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b4bff] disabled:opacity-40"
            style={{
              minHeight: height[size] + 4,
              fontSize: fs + 1,
              fontWeight: 500,
              borderLeft: i > 0 ? `1px solid ${dark ? '#323748' : '#d3d6e2'}` : 'none',
              background: sel ? '#5b4bff' : dark ? '#13151f' : '#ffffff',
              color: sel ? '#ffffff' : dark ? '#eceef6' : '#0e1120',
            }}
          >
            {content(o, sel)}
          </button>
        );
      })}
    </div>
  );
}
