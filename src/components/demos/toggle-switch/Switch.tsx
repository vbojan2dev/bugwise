import type { CSSProperties } from 'react';
import { Check, X } from 'lucide-react';

export type SwitchPlatform = 'ios' | 'material' | 'web';

interface Props {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  platform?: SwitchPlatform;
  dark?: boolean;
  disabled?: boolean;
  /** Material 3: show check / close icons inside the handle. */
  icons?: boolean;
  /** Accessible name when there is no visible <label>. */
  ariaLabel?: string;
  /** id of the visible label element. */
  labelledBy?: string;
  id?: string;
  /** Visual only (no button element), for static illustrations inside other controls. */
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}

function looks(platform: SwitchPlatform, dark: boolean) {
  if (platform === 'ios')
    return {
      w: 51,
      h: 31,
      on: dark ? '#30d158' : '#34c759',
      off: dark ? 'rgba(120,120,128,.32)' : 'rgba(120,120,128,.16)',
      ring: dark ? '#0a84ff' : '#007aff',
    };
  if (platform === 'material')
    return dark
      ? { w: 52, h: 32, on: '#d0bcff', off: '#36343b', outline: '#938f99', thumbOn: '#381e72', thumbOff: '#938f99', iconOn: '#eaddff', iconOff: '#36343b', ring: '#ccc2dc' }
      : { w: 52, h: 32, on: '#6750a4', off: '#e6e0e9', outline: '#79747e', thumbOn: '#ffffff', thumbOff: '#79747e', iconOn: '#21005d', iconOff: '#e6e0e9', ring: '#625b71' };
  return { w: 44, h: 24, on: dark ? '#3b82f6' : '#2563eb', off: dark ? '#4b5563' : '#d1d5db', ring: dark ? '#60a5fa' : '#2563eb' };
}

export function Switch({ checked, onChange, platform = 'ios', dark = false, disabled = false, icons = false, ariaLabel, labelledBy, id, decorative = false, className = '', style }: Props) {
  const l = looks(platform, dark);
  const m = platform === 'material';

  let thumb: number;
  let x: number;
  if (m) {
    thumb = checked || icons ? 24 : 16;
    x = checked ? l.w - thumb - 4 : icons ? 4 : 8;
  } else {
    thumb = l.h - 4;
    x = checked ? l.w - thumb - 2 : 2;
  }
  const thumbBg = m ? (checked ? (l as { thumbOn: string }).thumbOn : (l as { thumbOff: string }).thumbOff) : '#fff';
  const disabledOpacity = m ? 0.38 : 0.5;

  const inner = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{
          background: checked ? l.on : l.off,
          border: m && !checked ? `2px solid ${(l as { outline: string }).outline}` : undefined,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 grid place-items-center rounded-full transition-all duration-200 ease-out"
        style={{
          width: thumb,
          height: thumb,
          left: x,
          transform: 'translateY(-50%)',
          background: thumbBg,
          boxShadow: m ? undefined : '0 3px 8px rgba(0,0,0,.15), 0 1px 1px rgba(0,0,0,.16)',
        }}
      >
        {m && icons && (checked ? <Check size={16} strokeWidth={3} color={(l as { iconOn: string }).iconOn} /> : <X size={16} strokeWidth={3} color={(l as { iconOff: string }).iconOff} />)}
      </span>
    </>
  );

  const box: CSSProperties = { width: l.w, height: l.h, opacity: disabled ? disabledOpacity : undefined, ...style };

  if (decorative) {
    return (
      <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`} style={box}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-block shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{ ...box, outlineColor: l.ring }}
    >
      {inner}
    </button>
  );
}
