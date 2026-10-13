import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type Platform = 'ios' | 'material' | 'web';
export type Emphasis = 'filled' | 'tonal' | 'outlined' | 'text' | 'destructive';
export type ButtonState = 'default' | 'hover' | 'pressed' | 'focused' | 'disabled' | 'loading';
export type Size = 'sm' | 'md' | 'lg';

interface Props {
  label?: string;
  icon?: LucideIcon;
  /** Icon-only button. `a11y` becomes the accessible name. */
  iconOnly?: boolean;
  a11y?: string;
  platform?: Platform;
  emphasis?: Emphasis;
  size?: Size;
  dark?: boolean;
  /** Freeze the button in one visual state (used by the states explorer). */
  state?: ButtonState;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  textScale?: number;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Colors {
  bg: string;
  fg: string;
  border?: string;
  disBg: string;
  disFg: string;
  ring: string;
}

export function colors(platform: Platform, emphasis: Emphasis, dark: boolean): Colors {
  if (platform === 'ios') {
    const tint = dark ? '#0a84ff' : '#007aff';
    const red = dark ? '#ff453a' : '#ff3b30';
    const disBg = dark ? 'rgba(120,120,128,.32)' : 'rgba(120,120,128,.16)';
    const disFg = dark ? 'rgba(235,235,245,.3)' : 'rgba(60,60,67,.3)';
    const base = { disBg, disFg, ring: tint };
    switch (emphasis) {
      case 'filled':
        return { ...base, bg: tint, fg: '#fff' };
      case 'tonal':
        return { ...base, bg: dark ? 'rgba(10,132,255,.22)' : 'rgba(0,122,255,.13)', fg: tint };
      case 'outlined':
        return { ...base, bg: 'transparent', fg: tint, border: tint, disBg: 'transparent' };
      case 'text':
        return { ...base, bg: 'transparent', fg: tint, disBg: 'transparent' };
      case 'destructive':
        return { ...base, bg: red, fg: '#fff' };
    }
  }
  if (platform === 'material') {
    const p = dark
      ? { primary: '#d0bcff', onPrimary: '#381e72', sec: '#4a4458', onSec: '#e8def8', outline: '#938f99', error: '#f2b8b5', onError: '#601410', on: '230,224,233', ring: '#ccc2dc' }
      : { primary: '#6750a4', onPrimary: '#ffffff', sec: '#e8def8', onSec: '#1d192b', outline: '#79747e', error: '#b3261e', onError: '#ffffff', on: '29,27,32', ring: '#625b71' };
    const base = { disBg: `rgba(${p.on},.12)`, disFg: `rgba(${p.on},.38)`, ring: p.ring };
    switch (emphasis) {
      case 'filled':
        return { ...base, bg: p.primary, fg: p.onPrimary };
      case 'tonal':
        return { ...base, bg: p.sec, fg: p.onSec };
      case 'outlined':
        return { ...base, bg: 'transparent', fg: p.primary, border: p.outline, disBg: 'transparent' };
      case 'text':
        return { ...base, bg: 'transparent', fg: p.primary, disBg: 'transparent' };
      case 'destructive':
        return { ...base, bg: p.error, fg: p.onError };
    }
  }
  const w = dark
    ? { blue: '#3b82f6', tonalBg: 'rgba(59,130,246,.18)', tonalFg: '#93c5fd', border: '#4b5563', fg: '#f3f4f6', link: '#60a5fa', red: '#ef4444', ring: '#60a5fa' }
    : { blue: '#2563eb', tonalBg: '#dbeafe', tonalFg: '#1e40af', border: '#d1d5db', fg: '#111827', link: '#2563eb', red: '#dc2626', ring: '#2563eb' };
  const base = { disBg: dark ? '#374151' : '#e5e7eb', disFg: dark ? '#6b7280' : '#9ca3af', ring: w.ring };
  switch (emphasis) {
    case 'filled':
      return { ...base, bg: w.blue, fg: '#fff' };
    case 'tonal':
      return { ...base, bg: w.tonalBg, fg: w.tonalFg };
    case 'outlined':
      return { ...base, bg: dark ? 'transparent' : '#fff', fg: w.fg, border: w.border, disBg: 'transparent' };
    case 'text':
      return { ...base, bg: 'transparent', fg: w.link, disBg: 'transparent' };
    case 'destructive':
      return { ...base, bg: w.red, fg: '#fff' };
  }
}

const heights: Record<Platform, Record<Size, number>> = {
  ios: { sm: 34, md: 44, lg: 50 },
  material: { sm: 32, md: 40, lg: 56 },
  web: { sm: 32, md: 40, lg: 48 },
};
const fonts: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

function radius(platform: Platform, h: number, iconOnly: boolean) {
  if (iconOnly || platform === 'material') return 999;
  if (platform === 'ios') return h >= 50 ? 14 : h >= 44 ? 12 : 999;
  return 8;
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

const layer: Record<ButtonState, number> = { default: 0, hover: 0.08, pressed: 0.14, focused: 0.1, disabled: 0, loading: 0 };

export function Button({
  label,
  icon: Icon,
  iconOnly = false,
  a11y,
  platform = 'ios',
  emphasis = 'filled',
  size = 'md',
  dark = false,
  state,
  disabled = false,
  loading = false,
  fullWidth = false,
  textScale = 1,
  onClick,
  type = 'button',
  className = '',
  style,
  children,
}: Props) {
  const c = colors(platform, emphasis, dark);
  const isDisabled = disabled || state === 'disabled';
  const isLoading = loading || state === 'loading';
  const inert = isDisabled || isLoading;
  const h = heights[platform][size];
  const r = radius(platform, h, iconOnly);
  const fs = fonts[size] * textScale;
  const webDisabled = platform === 'web' && isDisabled;
  const bg = isDisabled && !webDisabled ? c.disBg : c.bg;
  const fg = isDisabled && !webDisabled ? c.disFg : c.fg;
  const forced = state && state !== 'default';
  const iosPressed = platform === 'ios' && state === 'pressed';

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isLoading || undefined}
      aria-busy={isLoading || undefined}
      aria-label={iconOnly ? a11y : undefined}
      onClick={(e) => {
        if (inert) return;
        onClick?.(e);
      }}
      className={`group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden font-semibold whitespace-nowrap transition-[opacity,box-shadow] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring) ${
        platform === 'ios' && !inert ? 'active:opacity-60' : ''
      } ${webDisabled ? 'cursor-not-allowed opacity-50' : inert ? 'cursor-default' : 'cursor-pointer'} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={
        {
          '--ring': c.ring,
          height: Math.max(h, fs * 1.6 + 12),
          minWidth: iconOnly ? h : undefined,
          width: iconOnly ? h : undefined,
          padding: iconOnly ? 0 : `0 ${emphasis === 'text' && platform !== 'web' ? 12 : size === 'sm' ? 14 : platform === 'material' ? 24 : 20}px`,
          borderRadius: r,
          background: bg,
          color: fg,
          fontSize: fs,
          fontWeight: platform === 'material' ? 500 : 600,
          letterSpacing: platform === 'material' ? '0.01em' : undefined,
          border: c.border ? `1px solid ${isDisabled && !webDisabled ? c.disFg : c.border}` : undefined,
          outline: state === 'focused' ? `${platform === 'material' ? 3 : 2}px solid ${c.ring}` : undefined,
          outlineOffset: state === 'focused' ? 2 : undefined,
          opacity: iosPressed ? 0.6 : undefined,
          ...style,
        } as CSSProperties
      }
    >
      {/* State layer: hover / focus / pressed tint, like Material's overlay. */}
      {platform !== 'ios' || emphasis === 'text' || emphasis === 'outlined' ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-current ${
            forced || inert ? '' : 'opacity-0 group-hover:opacity-[.08] group-focus-visible:opacity-[.1] group-active:opacity-[.14]'
          }`}
          style={forced ? { opacity: platform === 'ios' ? layer[state] * 0.6 : layer[state] } : inert ? { opacity: 0 } : undefined}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-white ${forced || inert ? '' : 'opacity-0 group-hover:opacity-[.12]'}`}
          style={forced ? { opacity: state === 'hover' ? 0.12 : 0 } : inert ? { opacity: 0 } : undefined}
        />
      )}
      <span className={`relative inline-flex min-w-0 items-center gap-2 ${isLoading ? 'invisible' : ''}`}>
        {Icon && <Icon size={Math.round(fs * (iconOnly ? 1.4 : 1.15))} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />}
        {!iconOnly && (label || children) && <span className="truncate">{label ?? children}</span>}
      </span>
      {isLoading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={Math.round(fs * 1.15)} />
          <span className="sr-only">Loading</span>
        </span>
      )}
    </button>
  );
}
