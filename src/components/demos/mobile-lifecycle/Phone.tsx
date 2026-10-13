import type { ReactNode } from 'react';

/**
 * Phone mockup for the lifecycle/interruption demos. Same look as shared/PhoneFrame,
 * plus a configurable clock and battery (level + Low Power Mode color).
 */
export function Phone({
  children,
  width = 280,
  time = '9:41',
  battery = 0.75,
  lowPower = false,
  darkStatus = false,
  screenBg = '#fff',
}: {
  children: ReactNode;
  width?: number;
  time?: string;
  battery?: number;
  lowPower?: boolean;
  /** White status bar text (for dark screens such as calls or the lock screen). */
  darkStatus?: boolean;
  screenBg?: string;
}) {
  const fill = lowPower ? '#ffcc00' : battery <= 0.2 ? '#ff3b30' : 'currentColor';
  return (
    <div
      className="relative max-w-full bg-[#0c0d12] p-[10px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]"
      style={{ width: width + 20, borderRadius: 46 }}
    >
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ aspectRatio: '9 / 19', borderRadius: 37, background: screenBg, color: darkStatus ? '#fff' : '#000' }}
      >
        <div className="absolute top-2.5 left-1/2 z-50 h-[25px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
        <div
          className="relative z-40 flex shrink-0 items-center justify-between px-7 pt-3 pb-1 text-[12px] font-semibold"
          style={{ color: darkStatus ? '#fff' : '#000' }}
          aria-hidden="true"
        >
          <span className="tabular-nums">{time}</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className="w-[3px] rounded-[1px] bg-current" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]">
              <span className="block h-full rounded-[1px]" style={{ width: `${Math.max(8, battery * 100)}%`, background: fill }} />
            </span>
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <div
          className="pointer-events-none absolute bottom-1.5 left-1/2 z-50 h-[4px] w-[110px] -translate-x-1/2 rounded-full opacity-80"
          style={{ background: darkStatus ? '#fff' : '#000' }}
        />
      </div>
    </div>
  );
}

/** Format seconds as m:ss. */
export function mmss(total: number) {
  const s = Math.max(0, Math.floor(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
