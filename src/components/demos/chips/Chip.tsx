import type { ReactNode } from 'react';
import { Check, X, type LucideIcon } from 'lucide-react';

/*
 * Correct, accessible chip primitives used by the gallery and the playground.
 * - Filter chip: a toggle button (aria-pressed) with a checkmark when selected.
 * - Input chip: a label plus its own remove button ("Remove Italian").
 * - Assist / suggestion chip: a plain button.
 * - Tag: a non-interactive label.
 */

export type ChipLook = 'material' | 'ios';

export function chipPalette(dark = false) {
  return dark
    ? {
        surface: '#141218',
        text: '#e6e0e9',
        muted: '#cac4d0',
        outline: '#938f99',
        selBg: '#4a4458',
        selText: '#e8def8',
        iosFill: 'rgba(118,118,128,.24)',
        iosSel: '#0a84ff',
        iosText: '#fff',
        focus: 'focus-visible:outline-[#d0bcff]',
      }
    : {
        surface: '#fef7ff',
        text: '#1d1b20',
        muted: '#49454f',
        outline: '#79747e',
        selBg: '#e8def8',
        selText: '#1d192b',
        iosFill: 'rgba(118,118,128,.12)',
        iosSel: '#007aff',
        iosText: '#000',
        focus: 'focus-visible:outline-[#6750a4]',
      };
}

const base =
  'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap select-none outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';

export function FilterChip({
  label,
  selected,
  onToggle,
  icon: Icon,
  count,
  checkmark = true,
  look = 'material',
  dark = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  icon?: LucideIcon;
  count?: number;
  checkmark?: boolean;
  look?: ChipLook;
  dark?: boolean;
}) {
  const p = chipPalette(dark);
  const ios = look === 'ios';
  const style = ios
    ? { background: selected ? p.iosSel : p.iosFill, color: selected ? '#fff' : p.iosText }
    : { background: selected ? p.selBg : 'transparent', color: selected ? p.selText : p.muted, boxShadow: selected ? 'none' : `inset 0 0 0 1px ${p.outline}` };
  const showCheck = selected && checkmark;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`${base} ${p.focus} h-8 text-[14px] font-medium ${ios ? 'rounded-full px-3.5' : `rounded-lg ${showCheck || Icon ? 'pl-2' : 'pl-4'} pr-4`}`}
      style={style}
    >
      {showCheck ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {label}
      {count != null && (
        <>
          <span
            aria-hidden="true"
            className="min-w-5 rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold tabular-nums"
            style={{ background: selected ? (ios ? 'rgba(255,255,255,.25)' : dark ? '#625b71' : '#fff') : ios ? 'rgba(0,0,0,.08)' : dark ? '#36343b' : '#ece6f0' }}
          >
            {count > 99 ? '99+' : count}
          </span>
          <span className="sr-only">, {count} results</span>
        </>
      )}
    </button>
  );
}

export function InputChip({ label, onRemove, avatar, error, dark = false }: { label: string; onRemove: () => void; avatar?: string; error?: boolean; dark?: boolean }) {
  const p = chipPalette(dark);
  return (
    <span
      className={`inline-flex h-8 max-w-full min-w-0 shrink-0 items-center gap-1 rounded-lg text-[14px] font-medium ${avatar ? 'pl-1' : 'pl-3'} pr-1`}
      style={{
        color: error ? '#b3261e' : p.muted,
        boxShadow: `inset 0 0 0 1px ${error ? '#b3261e' : p.outline}`,
        background: error ? (dark ? '#3a1d1b' : '#fff8f7') : 'transparent',
      }}
    >
      {avatar && (
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: '#7d5260' }}>
          {avatar}
        </span>
      )}
      <span className="min-w-0 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className={`grid size-6 shrink-0 place-items-center rounded-full outline-none hover:bg-black/10 focus-visible:outline-2 ${p.focus}`}
      >
        <X size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </span>
  );
}

export function ActionChip({
  label,
  icon: Icon,
  onClick,
  elevated,
  dark = false,
  iconColor,
}: {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  elevated?: boolean;
  dark?: boolean;
  iconColor?: string;
}) {
  const p = chipPalette(dark);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${p.focus} h-8 rounded-lg ${Icon ? 'pl-2' : 'pl-4'} pr-4 text-[14px] font-medium hover:brightness-95`}
      style={{
        color: p.text,
        background: elevated ? (dark ? '#2b2930' : '#f7f2fa') : 'transparent',
        boxShadow: elevated ? '0 1px 3px rgba(0,0,0,.25)' : `inset 0 0 0 1px ${p.outline}`,
      }}
    >
      {Icon && <Icon size={16} aria-hidden="true" style={{ color: iconColor ?? (dark ? '#d0bcff' : '#6750a4') }} />}
      {label}
    </button>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'red' | 'blue' }) {
  const tones = {
    neutral: { background: '#eceef2', color: '#3c4150' },
    green: { background: '#dcf5e3', color: '#16632f' },
    red: { background: '#fde2e1', color: '#a3241c' },
    blue: { background: '#dfeafe', color: '#1d4fb8' },
  } as const;
  return (
    <span className="inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold" style={tones[tone]}>
      {children}
    </span>
  );
}
