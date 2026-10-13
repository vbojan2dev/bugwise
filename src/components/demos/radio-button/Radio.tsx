import type { CSSProperties, ReactNode } from 'react';
import { Check } from 'lucide-react';

export type RadioPlatform = 'material' | 'web';

interface Palette {
  on: string;
  off: string;
  text: string;
  sub: string;
  err: string;
  layer: string;
}

export const radioPalettes: Record<RadioPlatform, { light: Palette; dark: Palette }> = {
  material: {
    light: { on: '#6750a4', off: '#49454f', text: '#1d1b20', sub: '#49454f', err: '#b3261e', layer: 'rgba(103,80,164,.12)' },
    dark: { on: '#d0bcff', off: '#cac4d0', text: '#e6e0e9', sub: '#cac4d0', err: '#f2b8b5', layer: 'rgba(208,188,255,.14)' },
  },
  web: {
    light: { on: '#2563eb', off: '#6b7280', text: '#111827', sub: '#6b7280', err: '#dc2626', layer: 'rgba(37,99,235,.10)' },
    dark: { on: '#3b82f6', off: '#9ca3af', text: '#f3f4f6', sub: '#9ca3af', err: '#f87171', layer: 'rgba(96,165,250,.16)' },
  },
};

/** The visual circle only (no behavior). */
export function RadioDot({
  selected,
  platform = 'material',
  dark = false,
  disabled = false,
  error = false,
  size = 20,
  focused = false,
}: {
  selected: boolean;
  platform?: RadioPlatform;
  dark?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: number;
  focused?: boolean;
}) {
  const t = radioPalettes[platform][dark ? 'dark' : 'light'];
  const color = disabled ? t.off : error ? t.err : selected ? t.on : t.off;
  const style: CSSProperties = {
    width: size,
    height: size,
    border: `2px solid ${color}`,
    opacity: disabled ? 0.38 : 1,
    boxShadow: focused ? `0 0 0 2px ${dark ? '#000' : '#fff'}, 0 0 0 4px ${t.on}` : undefined,
  };
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full" style={style}>
      {selected && <span className="rounded-full" style={{ width: size / 2, height: size / 2, background: color }} />}
    </span>
  );
}

interface RadioProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  label: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  platform?: RadioPlatform;
  dark?: boolean;
  disabled?: boolean;
  error?: boolean;
  describedBy?: string;
  className?: string;
}

/**
 * An accessible radio button: a real <input type="radio"> (so arrow keys, grouping by name and screen readers work)
 * with a platform-styled circle. The whole label row is the hit area.
 */
export function Radio({ name, value, checked, onSelect, label, sub, trailing, platform = 'material', dark = false, disabled = false, error = false, describedBy, className = '' }: RadioProps) {
  const t = radioPalettes[platform][dark ? 'dark' : 'light'];
  return (
    <label className={`flex items-start gap-1.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`} style={{ color: t.text }}>
      <span className="relative grid size-10 shrink-0 place-items-center">
        <input
          type="radio"
          name={name}
          value={value}
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] appearance-none opacity-0"
          checked={checked}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          onChange={() => onSelect(value)}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--rb-ring)] peer-disabled:hidden"
          style={{ background: t.layer, ['--rb-ring' as string]: t.on } as CSSProperties}
        />
        <span className="pointer-events-none">
          <RadioDot selected={checked} platform={platform} dark={dark} disabled={disabled} error={error} />
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
      {trailing && (
        <span className="shrink-0 py-[9px] text-[14px] font-medium" style={{ opacity: disabled ? 0.38 : 1 }}>
          {trailing}
        </span>
      )}
    </label>
  );
}

/**
 * iOS single-choice list (Settings › Display & Brightness › Auto-Lock style): a checkmark on the selected row.
 * Built on a visually hidden native radio, so arrow keys and screen readers still work.
 */
export function IosChoiceRow({ name, value, label, checked, onSelect, dark = false, divider = false }: { name: string; value: string; label: string; checked: boolean; onSelect: (v: string) => void; dark?: boolean; divider?: boolean }) {
  return (
    <label className="relative flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 has-[:focus-visible]:bg-[#007aff]/10" style={{ color: dark ? '#fff' : '#000' }}>
      {divider && <span aria-hidden="true" className="absolute top-0 right-0 left-4 h-px" style={{ background: dark ? 'rgba(84,84,88,.65)' : 'rgba(60,60,67,.18)' }} />}
      <input type="radio" name={name} value={value} className="sr-only" checked={checked} onChange={() => onSelect(value)} />
      <span className="min-w-0 flex-1 text-[15px]">{label}</span>
      <Check size={18} strokeWidth={2.75} aria-hidden="true" color={dark ? '#0a84ff' : '#007aff'} style={{ opacity: checked ? 1 : 0 }} />
    </label>
  );
}
