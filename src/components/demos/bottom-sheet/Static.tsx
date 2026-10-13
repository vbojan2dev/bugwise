import type { ReactNode } from 'react';

/** A small static phone screen with a sheet at the bottom, for Do / Don't illustrations. */
export function StaticSheet({ label, title, left, right, children, height = 230, sheetHeight = 62, scrim = true }: { label: string; title: string; left?: string; right?: string; children: ReactNode; height?: number; sheetHeight?: number; scrim?: boolean }) {
  return (
    <div role="img" aria-label={label} className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[18px] border border-black/10 bg-[#f2f2f7] text-black" style={{ height, colorScheme: 'light' }}>
      <div aria-hidden="true" className="space-y-2 p-3">
        <div className="h-3 w-24 rounded bg-black/15" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded-lg bg-white" />
        ))}
      </div>
      {scrim && <div aria-hidden="true" className="absolute inset-0 bg-black/25" />}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-[14px] bg-white shadow-[0_-2px_12px_rgba(0,0,0,.12)]" style={{ height: `${sheetHeight}%` }}>
        <div className="flex justify-center pt-1.5 pb-1">
          <span className="h-[4px] w-8 rounded-full bg-black/25" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pb-1.5 text-[12px]">
          <span className="justify-self-start text-[#007aff]">{left}</span>
          <span className="font-semibold">{title}</span>
          <span className="justify-self-end font-semibold text-[#007aff]">{right}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 text-[11px]">{children}</div>
      </div>
    </div>
  );
}

export function Rows({ items, checked }: { items: string[]; checked?: number }) {
  return (
    <div className="divide-y divide-black/10 overflow-hidden rounded-lg bg-[#f2f2f7]">
      {items.map((t, i) => (
        <div key={t} className="flex items-center justify-between px-2 py-1.5">
          {t}
          {i === checked && <span className="text-[#007aff]">✓</span>}
        </div>
      ))}
    </div>
  );
}

export function Field({ label }: { label: string }) {
  return <div className="mb-1.5 rounded-md border border-black/15 bg-white px-2 py-1.5 text-black/45">{label}</div>;
}
