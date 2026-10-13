import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';

export type CheckState = boolean | 'mixed';
export type CheckPlatform = 'material' | 'web';

interface Palette {
  on: string;
  off: string;
  onFg: string;
  text: string;
  sub: string;
  err: string;
  layer: string;
}

export const checkPalettes: Record<CheckPlatform, { light: Palette; dark: Palette }> = {
  material: {
    light: { on: '#6750a4', off: '#49454f', onFg: '#ffffff', text: '#1d1b20', sub: '#49454f', err: '#b3261e', layer: 'rgba(103,80,164,.12)' },
    dark: { on: '#d0bcff', off: '#cac4d0', onFg: '#381e72', text: '#e6e0e9', sub: '#cac4d0', err: '#f2b8b5', layer: 'rgba(208,188,255,.14)' },
  },
  web: {
    light: { on: '#2563eb', off: '#6b7280', onFg: '#ffffff', text: '#111827', sub: '#6b7280', err: '#dc2626', layer: 'rgba(37,99,235,.10)' },
    dark: { on: '#3b82f6', off: '#9ca3af', onFg: '#ffffff', text: '#f3f4f6', sub: '#9ca3af', err: '#f87171', layer: 'rgba(96,165,250,.16)' },
  },
};

/** The visual box only (no behavior). Use it for static pictures. */
export function CheckBox({
  state,
  platform = 'material',
  dark = false,
  disabled = false,
  error = false,
  size = 18,
  focused = false,
}: {
  state: CheckState;
  platform?: CheckPlatform;
  dark?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: number;
  focused?: boolean;
}) {
  const t = checkPalettes[platform][dark ? 'dark' : 'light'];
  const filled = state !== false;
  const color = disabled ? t.off : error ? t.err : filled ? t.on : t.off;
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: platform === 'material' ? 2 : 4,
    border: filled ? `2px solid ${color}` : `2px solid ${color}`,
    background: filled ? color : 'transparent',
    opacity: disabled ? 0.38 : 1,
    boxShadow: focused ? `0 0 0 2px ${dark ? '#000' : '#fff'}, 0 0 0 4px ${t.on}` : undefined,
  };
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center" style={style}>
      {state === true && <Check size={size - 4} strokeWidth={3.5} color={t.onFg} />}
      {state === 'mixed' && <Minus size={size - 4} strokeWidth={3.5} color={t.onFg} />}
    </span>
  );
}

interface CheckboxProps {
  checked: CheckState;
  onChange?: (value: boolean) => void;
  label: ReactNode;
  sub?: ReactNode;
  platform?: CheckPlatform;
  dark?: boolean;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  describedBy?: string;
  className?: string;
}

/**
 * An accessible checkbox: a real <input type="checkbox"> (so Space, screen readers and forms work)
 * with a platform-styled box. The whole label row is the hit area.
 */
export function Checkbox({ checked, onChange, label, sub, platform = 'material', dark = false, disabled = false, error = false, required, describedBy, className = '' }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === 'mixed';
  }, [checked]);
  const t = checkPalettes[platform][dark ? 'dark' : 'light'];
  return (
    <label className={`flex items-start gap-1.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`} style={{ color: t.text }}>
      <span className="relative grid size-10 shrink-0 place-items-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] appearance-none opacity-0"
          checked={checked === true}
          disabled={disabled}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--cb-ring)] peer-disabled:hidden"
          style={{ background: t.layer, ['--cb-ring' as string]: t.on } as CSSProperties}
        />
        <span className="pointer-events-none">
          <CheckBox state={checked} platform={platform} dark={dark} disabled={disabled} error={error} />
        </span>
      </span>
      <span className="min-w-0 flex-1 py-[9px]" style={{ opacity: disabled ? 0.38 : 1 }}>
        <span className="block text-[15px] leading-snug">{label}</span>
        {sub && (
          <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: t.sub }}>
            {sub}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * iOS has no checkbox control. Multi-select lists show a blue checkmark on the right instead.
 * Built on a visually hidden native checkbox so it stays keyboard and screen-reader friendly.
 */
export function IosCheckRow({ label, checked, onChange, dark = false, divider = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; dark?: boolean; divider?: boolean }) {
  return (
    <label className="relative flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 has-[:focus-visible]:bg-[#007aff]/10" style={{ color: dark ? '#fff' : '#000' }}>
      {divider && <span aria-hidden="true" className="absolute top-0 right-0 left-4 h-px" style={{ background: dark ? 'rgba(84,84,88,.65)' : 'rgba(60,60,67,.18)' }} />}
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0 flex-1 text-[15px]">{label}</span>
      <Check size={18} strokeWidth={2.75} aria-hidden="true" color={dark ? '#0a84ff' : '#007aff'} style={{ opacity: checked ? 1 : 0 }} />
    </label>
  );
}
