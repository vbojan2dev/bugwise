import type { ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const parts = [
  { n: 1, name: 'Result summary', text: '“Showing 81–100 of 312”. Tells users where they are. Must be right on the last page too.' },
  { n: 2, name: 'Previous', text: 'Goes one page back. Disabled (or hidden) on page 1.' },
  { n: 3, name: 'Page number', text: 'Jumps to that page. A link or button, at least 44×44 pt on touch screens.' },
  { n: 4, name: 'Current page', text: 'Highlighted and marked with aria-current="page". Not just a color change.' },
  { n: 5, name: 'Ellipsis (…)', text: 'Shows that pages are skipped. Not clickable, hidden from screen readers.' },
  { n: 6, name: 'Last page', text: 'Lets users jump to the end. Its number must match the real number of pages.' },
  { n: 7, name: 'Next', text: 'Goes one page forward. Disabled on the last page.' },
  { n: 8, name: 'Page size selector', text: '“Per page: 20 / 50 / 100”. Changing it must land on a page that exists.' },
];

function M({ n, children, className = '' }: { n: number; children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-grid ${className}`}>
      {children}
      <span className="absolute -top-7 left-1/2 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-[3px] ring-[#5b4bff]/20" aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

const cell = 'grid h-[26px] min-w-[26px] place-items-center rounded-md px-1 text-[12px] font-medium';

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-2 py-8 sm:px-5" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="Web pagination: 'Showing 81 to 100 of 312' above a row with Previous, page 1, an ellipsis, pages 4, 5 (current, highlighted) and 6, another ellipsis, page 16 and Next. Below it a 'Per page: 20' selector."
          className="mx-auto max-w-[19rem] rounded-xl bg-white px-2 pt-10 pb-4 text-[#0e1120] shadow-sm"
        >
          <p className="text-center text-[12px] text-black/60">
            <M n={1}>
              <span>
                Showing <strong className="text-black">81–100</strong> of 312
              </span>
            </M>
          </p>
          <div className="mt-9 flex items-center justify-center gap-[3px]">
            <M n={2}>
              <span className={cell}>
                <ChevronLeft size={15} />
              </span>
            </M>
            <span className={cell}>1</span>
            <M n={5}>
              <span className={`${cell} text-black/45`}>…</span>
            </M>
            <M n={3}>
              <span className={cell}>4</span>
            </M>
            <M n={4}>
              <span className={`${cell} bg-[#2f6bff] text-white`}>5</span>
            </M>
            <span className={cell}>6</span>
            <span className={`${cell} text-black/45`}>…</span>
            <M n={6}>
              <span className={cell}>16</span>
            </M>
            <M n={7}>
              <span className={cell}>
                <ChevronRight size={15} />
              </span>
            </M>
          </div>
          <div className="mt-9 flex justify-center">
            <M n={8}>
              <span className="flex items-center gap-1 rounded-md border border-black/15 px-2 py-1 text-[12px]">
                Per page: <strong>20</strong> <ChevronDown size={13} />
              </span>
            </M>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">Numbered pagination on a web shop, page 5 of 16</p>
      </div>
      <ol className="min-w-0 space-y-3">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{p.n}</span>
            <div className="min-w-0">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
