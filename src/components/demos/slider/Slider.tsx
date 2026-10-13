import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

export type SliderVariant = 'ios' | 'material' | 'web';
export type SliderValue = number | [number, number];

export interface SliderProps {
  /** A number for a single slider, a [low, high] tuple for a range slider. */
  value: SliderValue;
  /** Fires on every movement (each pointer move or key press). */
  onChange?: (value: SliderValue) => void;
  /** Fires once when the user lets go (pointer up) or after a key press. */
  onCommit?: (value: SliderValue) => void;
  min?: number;
  max?: number;
  /** 0 = continuous. */
  step?: number;
  variant?: SliderVariant;
  /** Accessible name (single slider). */
  label?: string;
  /** Accessible names for the two thumbs of a range slider. */
  labels?: [string, string];
  /** Text for the visible value bubble. */
  format?: (v: number) => string;
  /** Text for aria-valuetext, e.g. "€40". Omit to let screen readers read the raw number. */
  valueText?: (v: number) => string;
  /** When the value bubble above the thumb is visible. */
  showValue?: 'never' | 'active' | 'always';
  ticks?: boolean;
  dark?: boolean;
  rtl?: boolean;
  /** Size of the invisible touch area around each thumb, in px. */
  hitSize?: number;
  /** Shows the touch area as a dashed outline. */
  showHitArea?: boolean;
  /** Background color behind the slider (used for the Material handle gap). */
  surface?: string;
  /** Part of the track that is already loaded (seek bars), 0–100. */
  buffered?: number;
  disabled?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Like a native <input type="range">: values snap to the last full step, so max may be unreachable. */
  lastStepOnly?: boolean;
  // ---- deliberate bugs, used by the bug hunt ----
  /** Range thumbs may pass each other (min > max). */
  allowCross?: boolean;
  /** false = arrow keys, Page Up/Down, Home and End do nothing. */
  keyboard?: boolean;
  /** Snap with plain floating-point math (0.1 * 3 = 0.30000000000000004). */
  naiveMath?: boolean;
  className?: string;
}

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

interface Look {
  trackH: number;
  pad: number;
  hit: number;
  track: string;
  active: string;
  thumb: string;
  ring: string;
  tickOn: string;
  tickOff: string;
  bubbleBg: string;
  bubbleFg: string;
}

function look(variant: SliderVariant, dark: boolean): Look {
  if (variant === 'material')
    return dark
      ? { trackH: 16, pad: 8, hit: 48, track: '#4a4458', active: '#d0bcff', thumb: '#d0bcff', ring: 'rgba(208,188,255,.55)', tickOn: '#381e72', tickOff: '#d0bcff', bubbleBg: '#e6e0e9', bubbleFg: '#322f35' }
      : { trackH: 16, pad: 8, hit: 48, track: '#e8def8', active: '#6750a4', thumb: '#6750a4', ring: 'rgba(103,80,164,.4)', tickOn: '#ffffff', tickOff: '#6750a4', bubbleBg: '#322f35', bubbleFg: '#f5eff7' };
  if (variant === 'web')
    return dark
      ? { trackH: 6, pad: 10, hit: 24, track: '#374151', active: '#60a5fa', thumb: '#60a5fa', ring: 'rgba(96,165,250,.5)', tickOn: '#1e3a8a', tickOff: '#6b7280', bubbleBg: '#f3f4f6', bubbleFg: '#111827' }
      : { trackH: 6, pad: 10, hit: 24, track: '#d1d5db', active: '#2563eb', thumb: '#2563eb', ring: 'rgba(37,99,235,.4)', tickOn: '#bfdbfe', tickOff: '#9ca3af', bubbleBg: '#111827', bubbleFg: '#ffffff' };
  return dark
    ? { trackH: 4, pad: 14, hit: 44, track: '#3a3a3c', active: '#0a84ff', thumb: '#ffffff', ring: 'rgba(10,132,255,.6)', tickOn: '#0a84ff', tickOff: '#636366', bubbleBg: '#f2f2f7', bubbleFg: '#000' }
    : { trackH: 4, pad: 14, hit: 44, track: '#e5e5ea', active: '#007aff', thumb: '#ffffff', ring: 'rgba(0,122,255,.4)', tickOn: '#007aff', tickOff: '#c7c7cc', bubbleBg: '#1c1c1e', bubbleFg: '#fff' };
}

export function Slider({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  variant = 'ios',
  label = 'Value',
  labels,
  format = (v) => String(v),
  valueText,
  showValue = 'never',
  ticks = false,
  dark = false,
  rtl = false,
  hitSize,
  showHitArea = false,
  surface,
  buffered,
  disabled = false,
  startIcon,
  endIcon,
  lastStepOnly = false,
  allowCross = false,
  keyboard = true,
  naiveMath = false,
  className = '',
}: SliderProps) {
  const isRange = Array.isArray(value);
  const vals: number[] = isRange ? [value[0], value[1]] : [value];
  const rail = useRef<HTMLSpanElement>(null);
  const thumbs = useRef<(HTMLSpanElement | null)[]>([]);
  const latest = useRef(vals);
  latest.current = vals;
  const dragging = useRef<number | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [focusVisible, setFocusVisible] = useState<number | null>(null);

  const L = look(variant, dark);
  const hit = hitSize ?? L.hit;
  const bg = surface ?? (dark ? '#000' : '#fff');
  const dec = decimals(step);
  const lastStep = step ? +(min + Math.floor((max - min) / step + 1e-9) * step).toFixed(dec) : max;
  const top = lastStepOnly ? lastStep : max;

  const clamp = (v: number) => Math.min(top, Math.max(min, v));
  const snap = (raw: number) => {
    if (!step) return clamp(raw);
    const n = Math.round((raw - min) / step);
    return clamp(naiveMath ? n * step + min : +(min + n * step).toFixed(dec));
  };

  const out = (arr: number[]): SliderValue => (isRange ? [arr[0], arr[1]] : arr[0]);

  const emit = (i: number, v: number, commit = false) => {
    const cur = latest.current;
    let nv = v;
    if (isRange && !allowCross) nv = i === 0 ? Math.min(nv, cur[1]) : Math.max(nv, cur[0]);
    const next = cur.slice();
    next[i] = nv;
    latest.current = next;
    if (nv !== cur[i]) onChange?.(out(next));
    if (commit) onCommit?.(out(next));
  };

  const fromPointer = (clientX: number) => {
    const r = rail.current?.getBoundingClientRect();
    if (!r || r.width === 0) return latest.current[0];
    let ratio = (clientX - r.left) / r.width;
    if (rtl) ratio = 1 - ratio;
    ratio = Math.min(1, Math.max(0, ratio));
    return snap(min + ratio * (max - min));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const v = fromPointer(e.clientX);
    const cur = latest.current;
    let i = 0;
    if (isRange) {
      const d0 = Math.abs(v - cur[0]);
      const d1 = Math.abs(v - cur[1]);
      i = d0 < d1 ? 0 : d1 < d0 ? 1 : v < cur[0] ? 0 : 1;
    }
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
    dragging.current = i;
    setDrag(i);
    thumbs.current[i]?.focus({ preventScroll: true });
    emit(i, v);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === null) return;
    emit(dragging.current, fromPointer(e.clientX));
  };
  const endDrag = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    setDrag(null);
    onCommit?.(out(latest.current));
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!keyboard || disabled) return;
    const k = step || (max - min) / 100;
    const big = step ? Math.max(step, Math.round((max - min) / 10 / step) * step) : (max - min) / 10;
    const cur = latest.current[i];
    const inc = rtl ? 'ArrowLeft' : 'ArrowRight';
    const decKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    let v: number | null = null;
    if (e.key === 'ArrowUp' || e.key === inc) v = cur + k;
    else if (e.key === 'ArrowDown' || e.key === decKey) v = cur - k;
    else if (e.key === 'PageUp') v = cur + big;
    else if (e.key === 'PageDown') v = cur - big;
    else if (e.key === 'Home') v = min;
    else if (e.key === 'End') v = top;
    if (v === null) return;
    e.preventDefault();
    emit(i, naiveMath ? clamp(v) : snap(v), true);
  };

  const pct = (v: number) => (max === min ? 0 : ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100);
  const p = vals.map(pct);
  const lo = isRange ? Math.min(p[0], p[1]) : 0;
  const hi = isRange ? Math.max(p[0], p[1]) : p[0];

  const tickValues: number[] = [];
  if (ticks && step && (max - min) / step <= 60) {
    for (let n = 0; ; n++) {
      const v = +(min + n * step).toFixed(dec);
      if (v > max + 1e-9) break;
      tickValues.push(v);
    }
  }

  const height = Math.max(hit, variant === 'material' ? 44 : 28);
  const pos = (percent: number) => ({ insetInlineStart: `${percent}%` });
  const shift = rtl ? 'translateX(50%)' : 'translateX(-50%)';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className={`flex w-full min-w-0 items-center gap-2 ${disabled ? 'opacity-40' : ''} ${className}`}>
      {startIcon}
      <div
        className="relative min-w-0 flex-1 select-none"
        style={{ height, touchAction: 'pan-y', cursor: disabled ? 'default' : 'pointer' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <span ref={rail} className="absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: L.pad, insetInlineEnd: L.pad, height: L.trackH }}>
          {/* inactive track */}
          <span className="absolute inset-0 rounded-full" style={{ background: L.track, marginInline: variant === 'material' ? -L.pad : 0 }} />
          {buffered !== undefined && <span className="absolute inset-y-0 rounded-full" style={{ ...pos(0), width: `${buffered}%`, background: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.18)' }} />}
          {/* active track */}
          <span
            className="absolute inset-y-0 rounded-full"
            style={{
              ...pos(lo),
              width: `${hi - lo}%`,
              background: L.active,
              marginInlineStart: variant === 'material' && !isRange ? -L.pad : 0,
              paddingInlineStart: variant === 'material' && !isRange ? L.pad : 0,
              boxSizing: 'content-box',
            }}
          />
          {tickValues.map((t) => {
            const tp = pct(t);
            const on = tp >= lo - 1e-6 && tp <= hi + 1e-6;
            return variant === 'material' ? (
              <span key={t} className="absolute top-1/2 size-1 -translate-y-1/2 rounded-full" style={{ ...pos(tp), transform: `${shift} translateY(-50%)`, background: on ? L.tickOn : L.tickOff }} />
            ) : (
              <span key={t} className="absolute w-px" style={{ ...pos(tp), top: L.trackH + 6, height: 6, background: on ? L.tickOn : L.tickOff }} />
            );
          })}
          {vals.map((v, i) => {
            const active = drag === i || focusVisible === i;
            const bubble = showValue === 'always' || (showValue === 'active' && active);
            const name = isRange ? (labels?.[i] ?? `${label} ${i === 0 ? 'minimum' : 'maximum'}`) : label;
            const minAttr = isRange && i === 1 && !allowCross ? vals[0] : min;
            const maxAttr = isRange && i === 0 && !allowCross ? vals[1] : top;
            const ring = focusVisible === i ? `0 0 0 4px ${L.ring}` : '';
            let visual: ReactNode;
            if (variant === 'material') {
              visual = (
                <span
                  className="block rounded-full transition-[width] duration-100"
                  style={{ width: drag === i ? 2 : 4, height: 44, background: L.thumb, boxShadow: [`0 0 0 6px ${bg}`, focusVisible === i ? `0 0 0 9px ${L.ring}` : ''].filter(Boolean).join(', ') }}
                />
              );
            } else if (variant === 'web') {
              visual = (
                <span
                  className="block size-5 rounded-full"
                  style={{ background: L.thumb, border: `3px solid ${dark ? '#13151f' : '#fff'}`, boxShadow: [`0 1px 3px rgba(0,0,0,.35)`, ring].filter(Boolean).join(', ') }}
                />
              );
            } else {
              visual = (
                <span
                  className="block size-7 rounded-full transition-transform duration-100"
                  style={{
                    background: L.thumb,
                    transform: drag === i ? 'scale(1.06)' : undefined,
                    boxShadow: ['0 0.5px 4px rgba(0,0,0,.12)', '0 6px 13px rgba(0,0,0,.12)', ring].filter(Boolean).join(', '),
                  }}
                />
              );
            }
            return (
              <span
                key={i}
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={name}
                aria-valuemin={minAttr}
                aria-valuemax={maxAttr}
                aria-valuenow={v}
                aria-valuetext={valueText ? valueText(v) : undefined}
                aria-orientation="horizontal"
                aria-disabled={disabled || undefined}
                onKeyDown={onKeyDown(i)}
                onFocus={(e) => {
                  let fv = true;
                  try {
                    fv = e.currentTarget.matches(':focus-visible');
                  } catch {
                    /* old browser */
                  }
                  if (fv) setFocusVisible(i);
                }}
                onBlur={() => setFocusVisible((f) => (f === i ? null : f))}
                className="absolute top-1/2 z-10 grid place-items-center outline-none"
                style={{
                  ...pos(p[i]),
                  width: hit,
                  height: hit,
                  transform: `${shift} translateY(-50%)`,
                  zIndex: drag === i ? 20 : 10,
                  outline: showHitArea ? `1.5px dashed ${dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)'}` : undefined,
                  borderRadius: showHitArea ? 8 : undefined,
                }}
              >
                {visual}
                {bubble && (
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap tabular-nums"
                    style={{ background: L.bubbleBg, color: L.bubbleFg, marginBottom: variant === 'material' ? 0 : -4 }}
                    aria-hidden="true"
                  >
                    {format(v)}
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </div>
      {endIcon}
    </div>
  );
}
