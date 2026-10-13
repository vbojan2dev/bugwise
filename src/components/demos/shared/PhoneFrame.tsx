import type { ReactNode } from 'react';

/** Lightweight phone mockup for React demos. */
export function PhoneFrame({ children, dark = false, width = 300, os = 'ios' }: { children: ReactNode; dark?: boolean; width?: number; os?: 'ios' | 'android' }) {
  return (
    <div className="relative bg-[#0c0d12] p-[10px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]" style={{ width: width + 20, borderRadius: os === 'ios' ? 46 : 34 }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ aspectRatio: '9 / 19', borderRadius: os === 'ios' ? 37 : 25, background: dark ? '#000' : '#fff', color: dark ? '#fff' : '#000' }}
      >
        {os === 'ios' ? (
          <div className="absolute top-2.5 left-1/2 z-30 h-[25px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
        ) : (
          <div className="absolute top-3 left-1/2 z-30 size-3 -translate-x-1/2 rounded-full bg-black" />
        )}
        <div className="flex shrink-0 items-center justify-between px-7 pt-3 pb-1 text-[12px] font-semibold">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className="w-[3px] rounded-[1px] bg-current" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-current" />
            </span>
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <div className="absolute bottom-1.5 left-1/2 h-[4px] w-[110px] -translate-x-1/2 rounded-full bg-current opacity-80" />
      </div>
    </div>
  );
}
