import type { ReactNode } from 'react';

/** Lightweight browser window mockup for React web demos. */
export function BrowserFrame({ children, url = 'example.com', dark = false }: { children: ReactNode; url?: string; dark?: boolean }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line-strong shadow-[0_24px_48px_-16px_rgba(16,18,35,.25)]" style={{ background: dark ? '#13151f' : '#fff', color: dark ? '#eceef6' : '#0e1120' }}>
      <div className="flex items-center gap-3 border-b px-4 py-2.5" style={{ borderColor: dark ? '#242836' : '#e5e7ef', background: dark ? '#10121a' : '#f6f7fb' }}>
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div
          className="mx-auto max-w-xs min-w-0 flex-1 truncate rounded-lg border px-3 py-1 text-center font-mono text-xs opacity-70"
          style={{ borderColor: dark ? '#242836' : '#e5e7ef', background: dark ? '#13151f' : '#fff' }}
        >
          {url}
        </div>
        <span className="w-[46px]" />
      </div>
      <div>{children}</div>
    </div>
  );
}
