import type { ReactNode } from 'react';
import { Wifi, WifiOff, Plane } from 'lucide-react';

export type Network = 'wifi' | '5g' | 'lte' | '3g' | 'offline';

/**
 * Android phone mockup with a status bar that reflects battery, network and recording state.
 * Used by the simulator/emulator and adb lessons (the shared PhoneFrame has a fixed status bar).
 */
export function AndroidFrame({
  children,
  dark = false,
  width = 250,
  battery = 85,
  charging = false,
  network = 'wifi',
  recording = false,
  time = '14:02',
  label,
}: {
  children: ReactNode;
  dark?: boolean;
  width?: number;
  battery?: number;
  charging?: boolean;
  network?: Network;
  recording?: boolean;
  time?: string;
  label?: string;
}) {
  const low = battery <= 15 && !charging;
  return (
    <div
      className="relative mx-auto max-w-full bg-[#0c0d12] p-[9px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]"
      style={{ width: width + 18, borderRadius: 34 }}
      aria-label={label}
      role={label ? 'group' : undefined}
    >
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ aspectRatio: '9 / 19', borderRadius: 26, background: dark ? '#111318' : '#fdfbff', color: dark ? '#e3e2e9' : '#1a1b20' }}
      >
        <div className="absolute top-2.5 left-1/2 z-30 size-3 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative z-20 flex shrink-0 items-center justify-between px-5 pt-2 pb-1 text-[11px] font-medium">
          <span className="flex items-center gap-1.5">
            {time}
            {recording && <span className="size-2 animate-pulse rounded-full bg-[#e5484d]" aria-label="Screen recording" />}
          </span>
          <span className="flex items-center gap-1">
            {network === 'wifi' && <Wifi size={12} strokeWidth={2.5} />}
            {network === 'offline' && <Plane size={11} strokeWidth={2.5} />}
            {network !== 'wifi' && network !== 'offline' && (
              <span className="flex items-center gap-[2px]">
                <span className="text-[9px] font-bold">{network === '5g' ? '5G' : network === 'lte' ? 'LTE' : '3G'}</span>
                <span className="flex items-end gap-[1.5px]">
                  {[3, 5, 7, 9].map((h, i) => (
                    <span key={h} className="w-[2.5px] rounded-[1px] bg-current" style={{ height: h, opacity: network === '3g' && i > 1 ? 0.3 : 1 }} />
                  ))}
                </span>
              </span>
            )}
            {network === 'offline' && <WifiOff size={11} strokeWidth={2.5} className="opacity-50" />}
            <span className="ml-0.5 flex items-center gap-[1px]">
              <span className="relative h-[9px] w-[17px] rounded-[2.5px] border border-current p-[1px]">
                <span className="block h-full rounded-[1px]" style={{ width: `${Math.max(4, battery)}%`, background: low ? '#e5484d' : charging ? '#30a46c' : 'currentColor' }} />
              </span>
              <span className="h-[4px] w-[1.5px] rounded-r bg-current" />
            </span>
            <span className="tabular-nums" style={{ color: low ? '#e5484d' : undefined }}>
              {battery}%{charging ? '⚡' : ''}
            </span>
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <div className="absolute bottom-1.5 left-1/2 z-30 h-[4px] w-[90px] -translate-x-1/2 rounded-full bg-current opacity-70" />
      </div>
    </div>
  );
}
