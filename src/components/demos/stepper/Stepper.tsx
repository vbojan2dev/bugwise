import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

/*
 * A correct, accessible stepper (+/−) used by the gallery and labs.
 * - Buttons are named ("Decrease quantity of Oat milk") and use aria-disabled at the limits, so focus isn't lost.
 * - Optional editable value: role="spinbutton" text field with aria-valuenow/min/max/valuetext,
 *   ↑/↓ (step), Page Up/Down (5 steps), Home/End; digits only, validated and clamped on blur/Enter.
 * - Optional long-press repeat (starts after 450 ms, speeds up).
 * - Optional "remove at min": at the minimum, − becomes a trash icon (onRemove).
 * - Changes are announced in a polite live region.
 */

export type StepperVariant = 'ios' | 'cart' | 'material' | 'web';

export interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  variant?: StepperVariant;
  editable?: boolean;
  repeat?: boolean;
  onRemove?: () => void;
  valueText?: (v: number) => string;
  dark?: boolean;
  maxHint?: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  variant = 'cart',
  editable = false,
  repeat = true,
  onRemove,
  valueText = (v) => String(v),
  dark = false,
  maxHint,
}: StepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<number | undefined>(undefined);
  const repeated = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const set = (v: number) => {
    const next = clamp(Math.round(v / step) * step, min, max);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
      setSaid(`${label}: ${valueText(next)}${next === max ? ', maximum' : ''}`);
    }
  };
  const atMin = value <= min;
  const atMax = value >= max;
  const trash = !!onRemove && atMin;

  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  const startRepeat = (dir: 1 | -1) => {
    if (!repeat) return;
    repeated.current = false;
    let delay = 140;
    const tick = () => {
      const v = valueRef.current;
      if ((dir > 0 && v >= max) || (dir < 0 && v <= min)) return stop();
      repeated.current = true;
      set(v + dir * step);
      delay = Math.max(50, delay * 0.85);
      timer.current = window.setTimeout(tick, delay);
    };
    stop();
    timer.current = window.setTimeout(tick, 450);
  };

  const press = (dir: 1 | -1) => {
    if (repeated.current) {
      repeated.current = false;
      return;
    }
    if (dir < 0 && trash) return onRemove?.();
    if ((dir > 0 && atMax) || (dir < 0 && atMin)) {
      setSaid(dir > 0 ? `${label}: maximum ${valueText(max)} reached` : `${label}: minimum ${valueText(min)}`);
      return;
    }
    set(value + dir * step);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const t = draft.trim();
    if (/^\d+$/.test(t)) set(parseInt(t, 10));
    else setSaid(`${label}: invalid number, kept ${valueText(value)}`);
    setDraft(null);
  };

  const ios = variant === 'ios';
  const c = dark
    ? { text: '#fff', fill: 'rgba(118,118,128,.24)', line: '#48484a', accent: '#0a84ff', off: 'rgba(235,235,245,.3)', bg: '#1c1c1e' }
    : { text: '#000', fill: 'rgba(118,118,128,.12)', line: variant === 'material' ? '#79747e' : '#c7c7cc', accent: variant === 'material' ? '#6750a4' : variant === 'web' ? '#1d4ed8' : '#007aff', off: 'rgba(60,60,67,.3)', bg: '#fff' };
  const focus = 'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]';

  const btn = (dir: 1 | -1) => {
    const disabled = dir > 0 ? atMax : atMin && !trash;
    const Icon = dir > 0 ? Plus : trash ? Trash2 : Minus;
    const name = dir > 0 ? `Increase ${label.toLowerCase()}` : trash ? `Remove ${label.replace(/^Quantity of /i, '')}` : `Decrease ${label.toLowerCase()}`;
    const shape =
      variant === 'ios'
        ? 'h-8 w-[47px]'
        : variant === 'material'
          ? 'size-10 rounded-full'
          : variant === 'web'
            ? 'h-10 w-10'
            : 'size-9 rounded-full';
    return (
      <button
        type="button"
        aria-label={name}
        aria-disabled={disabled || undefined}
        title={dir > 0 && atMax && maxHint ? maxHint : undefined}
        onClick={() => !disabled && press(dir)}
        onPointerDown={(e) => {
          if (disabled || (dir < 0 && trash) || e.button !== 0) return;
          startRepeat(dir);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        className={`grid shrink-0 touch-manipulation place-items-center select-none ${shape} ${focus} ${disabled ? 'cursor-not-allowed' : 'active:opacity-60'}`}
        style={{
          color: disabled ? c.off : trash && dir < 0 ? '#d70015' : ios ? c.text : c.accent,
          boxShadow: variant === 'material' ? `inset 0 0 0 1px ${disabled ? c.off : c.line}` : undefined,
        }}
      >
        <Icon size={ios ? 18 : 18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    );
  };

  const display = editable ? (
    <input
      role="spinbutton"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText(value)}
      inputMode="numeric"
      autoComplete="off"
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
      onBlur={commitDraft}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => {
        const k = e.key;
        if (k === 'Enter') {
          e.preventDefault();
          commitDraft();
        } else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown' || k === 'Home' || k === 'End') {
          e.preventDefault();
          setDraft(null);
          const big = step * 5;
          if (k === 'ArrowUp') set(value + step);
          if (k === 'ArrowDown') set(value - step);
          if (k === 'PageUp') set(value + big);
          if (k === 'PageDown') set(value - big);
          if (k === 'Home') set(min);
          if (k === 'End') set(max);
        } else if (k === 'Escape') {
          setDraft(null);
        }
      }}
      className={`h-9 w-11 min-w-0 bg-transparent text-center text-[16px] font-semibold tabular-nums ${focus} rounded-md`}
      style={{ color: c.text }}
    />
  ) : (
    <span className="min-w-8 text-center text-[16px] font-semibold tabular-nums" style={{ color: c.text }} aria-hidden={ios ? true : undefined}>
      {value}
    </span>
  );

  const live = (
    <span className="sr-only" aria-live="polite">
      {said}
    </span>
  );

  if (ios) {
    return (
      <span className="relative inline-flex items-center rounded-[8px]" style={{ background: c.fill }} role="group" aria-label={`${label}, ${valueText(value)}`}>
        {btn(-1)}
        <span className="h-[18px] w-px" style={{ background: dark ? '#636366' : '#c6c6c8' }} />
        {btn(1)}
        {live}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex items-center ${variant === 'web' ? 'overflow-hidden rounded-md border' : variant === 'cart' ? 'gap-0.5 rounded-full border p-0.5' : 'gap-2'}`}
      style={{ borderColor: c.line, background: variant === 'material' ? 'transparent' : c.bg }}
      role="group"
      aria-label={label}
    >
      {btn(-1)}
      {variant === 'web' && <span className="h-6 w-px" style={{ background: c.line }} />}
      {display}
      {variant === 'web' && <span className="h-6 w-px" style={{ background: c.line }} />}
      {btn(1)}
      {live}
    </span>
  );
}
