import { useEffect, useRef, type KeyboardEvent } from 'react';

const H = 34; // row height in px

interface Props {
  items: string[];
  value: number;
  onChange: (index: number) => void;
  label: string;
  /** Items that exist in the list but can't be chosen right now (e.g. Feb 30). */
  isDisabled?: (index: number) => boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

/**
 * One column of an iOS-style wheel picker. Scroll (or swipe) it, or focus it and use the arrow keys.
 * Exposed to assistive tech as an adjustable spin button, like UIPickerView.
 */
export function WheelColumn({ items, value, onChange, label, isDisabled, align = 'center', width = '100%' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(value);
  latest.current = value;
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = value * H;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target, behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / H)));
      if (i !== latest.current) onChange(i);
      else if (Math.abs(el.scrollTop - i * H) > 1) el.scrollTo({ top: i * H, behavior: 'smooth' });
    }, 120);
  };

  const onKey = (e: KeyboardEvent) => {
    let next = value;
    if (e.key === 'ArrowUp') next = value - 1;
    else if (e.key === 'ArrowDown') next = value + 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(items.length - 1, next)));
  };

  return (
    <div
      ref={ref}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-valuetext={items[value]}
      onScroll={onScroll}
      onKeyDown={onKey}
      className="relative snap-y snap-mandatory overflow-y-scroll rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[#007aff] [&::-webkit-scrollbar]:hidden"
      style={{ height: H * 5, width }}
    >
      <div style={{ height: H * 2 }} />
      {items.map((it, i) => {
        const dist = Math.abs(i - value);
        const off = isDisabled?.(i);
        return (
          <div
            key={it + i}
            aria-hidden="true"
            onClick={() => onChange(i)}
            className="flex cursor-pointer snap-center items-center px-2 tabular-nums"
            style={{
              height: H,
              justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
              fontSize: dist === 0 ? 20 : 18,
              color: off ? 'rgba(60,60,67,.25)' : dist === 0 ? '#000' : 'rgba(60,60,67,.55)',
              opacity: dist > 2 ? 0.35 : 1,
            }}
          >
            {it}
          </div>
        );
      })}
      <div style={{ height: H * 2 }} />
    </div>
  );
}

/** Grey selection band + fades shown behind/above a row of wheel columns. */
export function WheelFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-stretch justify-center gap-1 overflow-hidden rounded-xl bg-white px-2">
      <div className="pointer-events-none absolute inset-x-2 top-1/2 h-[34px] -translate-y-1/2 rounded-lg bg-[rgba(118,118,128,.12)]" />
      {children}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
