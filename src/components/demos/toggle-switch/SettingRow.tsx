import { useId } from 'react';
import { Switch, type SwitchPlatform } from './Switch';

interface Props {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  platform?: SwitchPlatform;
  dark?: boolean;
  disabled?: boolean;
  icons?: boolean;
  /** Whole row toggles the switch (Android lists, web labels). iOS Settings rows don't. */
  rowTap?: boolean;
  /** Put the switch before the label (common on the web). */
  switchFirst?: boolean;
  divider?: boolean;
}

/** A settings row in the native style of each platform. */
export function SettingRow({ label, sub, checked, onChange, platform = 'ios', dark = false, disabled = false, icons, rowTap, switchFirst = false, divider = false }: Props) {
  const id = useId();
  const labelId = `${id}-label`;
  const tap = rowTap ?? platform !== 'ios';
  const fg = dark ? (platform === 'material' ? '#e6e0e9' : '#fff') : platform === 'material' ? '#1d1b20' : '#000';
  const subC = dark ? (platform === 'material' ? '#cac4d0' : 'rgba(235,235,245,.6)') : platform === 'material' ? '#49454f' : 'rgba(60,60,67,.6)';
  const sw = (
    <span onClick={(e) => e.stopPropagation()} className="flex shrink-0">
      <Switch id={id} platform={platform} dark={dark} checked={checked} onChange={onChange} disabled={disabled} icons={icons} labelledBy={labelId} />
    </span>
  );
  const text = (
    <span className="min-w-0 flex-1" style={{ opacity: disabled ? 0.45 : 1 }}>
      {platform === 'web' ? (
        <label id={labelId} htmlFor={id} className={`block text-[14px] font-medium ${disabled ? '' : 'cursor-pointer'}`} style={{ color: fg }} onClick={(e) => e.stopPropagation()}>
          {label}
        </label>
      ) : (
        <span id={labelId} className="block" style={{ color: fg, fontSize: platform === 'ios' ? 15 : 16 }}>
          {label}
        </span>
      )}
      {sub && (
        <span className="block text-[12px] leading-snug" style={{ color: subC }}>
          {sub}
        </span>
      )}
    </span>
  );
  return (
    <div
      onClick={tap && !disabled && platform !== 'web' ? () => onChange(!checked) : undefined}
      className={`flex items-center gap-3 ${platform === 'ios' ? 'min-h-11 px-4 py-1.5' : platform === 'material' ? 'min-h-14 px-4 py-2' : 'py-2'} ${tap && !disabled && platform !== 'web' ? 'cursor-pointer' : ''}`}
      style={{ borderTop: divider ? `0.5px solid ${dark ? 'rgba(84,84,88,.65)' : 'rgba(60,60,67,.18)'}` : undefined }}
    >
      {switchFirst ? (
        <>
          {sw}
          {text}
        </>
      ) : (
        <>
          {text}
          {sw}
        </>
      )}
    </div>
  );
}
