import { Archive, ChevronRight, Flag, MailOpen, Package, ShoppingBag, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

const parts = [
  { n: 1, name: 'Leading content', text: 'An avatar, thumbnail, icon or checkbox. Helps people scan the list.' },
  { n: 2, name: 'Primary text', text: 'The one thing that identifies the row: a name, a product, a subject. One line, truncated with an ellipsis.' },
  { n: 3, name: 'Secondary text', text: 'Supporting detail: a preview, a status, an address. Usually one or two lines in a lighter color.' },
  { n: 4, name: 'Trailing content', text: 'Metadata (time, price, badge) or a control (switch, checkbox).' },
  { n: 5, name: 'Chevron', text: 'Means "tap opens a detail screen" on iOS. Android and web rows rarely show it.' },
  { n: 6, name: 'Trailing actions', text: 'Revealed by swiping toward the leading edge (left in English). Usually Delete, Archive, More. Destructive goes outermost.' },
  { n: 7, name: 'Leading action', text: 'Revealed by swiping the other way. Usually something positive and reversible: Mark as read, Pin, Add to cart.' },
];

function M({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`absolute z-10 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-2 ring-white ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

function Thumb({ children, bg }: { children: ReactNode; bg: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ background: bg }}>
      {children}
    </span>
  );
}

export default function Anatomy() {
  const sub = 'rgba(60,60,67,.6)';
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-3 py-8 sm:px-6" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="Three iOS list rows from a shopping app. The first row shows a thumbnail, product name, order status, price and chevron. The second row is swiped left and shows Flag and Delete buttons. The third row is swiped right and shows a Mark as read button."
          className="mx-auto max-w-[20rem] overflow-hidden rounded-xl bg-white text-black shadow-sm"
        >
          {/* Normal row */}
          <div className="flex items-center gap-3 border-b border-[#e5e5ea] py-2.5 pr-2 pl-3">
            <span className="relative">
              <Thumb bg="#e8f0ff">
                <ShoppingBag size={18} color="#007aff" />
              </Thumb>
              <M n={1} className="-top-2 -left-2" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="relative block">
                <span className="block truncate text-[15px] font-semibold">Trail runner 2</span>
                <M n={2} className="-top-2.5 right-6" />
              </span>
              <span className="relative block">
                <span className="block truncate text-[13px]" style={{ color: sub }}>
                  Arrives Thursday
                </span>
                <M n={3} className="-bottom-2 right-10" />
              </span>
            </span>
            <span className="relative shrink-0 text-[14px]" style={{ color: sub }}>
              €89
              <M n={4} className="-top-4 -left-1" />
            </span>
            <span className="relative shrink-0">
              <ChevronRight size={18} color="#c4c4c7" />
              <M n={5} className="-top-4 -right-1" />
            </span>
          </div>
          {/* Swiped left: trailing actions */}
          <div className="relative flex h-[62px] overflow-hidden border-b border-[#e5e5ea]">
            <div className="flex min-w-0 flex-1 -translate-x-0 items-center gap-3 pl-3" style={{ marginLeft: -120 }}>
              <Thumb bg="#fff1e5">
                <Package size={18} color="#ff9500" />
              </Thumb>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">Coffee grinder</span>
                <span className="block truncate text-[13px]" style={{ color: sub }}>
                  Delivered Monday
                </span>
              </span>
              <span className="shrink-0 pr-2 text-[14px]" style={{ color: sub }}>
                €45
              </span>
            </div>
            <span className="relative flex w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 bg-[#ff9500] text-[11px] font-medium text-white">
              <Flag size={16} /> Flag
            </span>
            <span className="relative flex w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 bg-[#ff3b30] text-[11px] font-medium text-white">
              <Trash2 size={16} /> Delete
            </span>
            <M n={6} className="top-1 right-[52px]" />
          </div>
          {/* Swiped right: leading action */}
          <div className="relative flex h-[62px] overflow-hidden">
            <span className="relative flex w-[72px] shrink-0 flex-col items-center justify-center gap-0.5 bg-[#007aff] text-[11px] font-medium text-white">
              <MailOpen size={16} /> Read
            </span>
            <M n={7} className="top-1 left-[60px]" />
            <div className="flex min-w-0 flex-1 items-center gap-3 pl-3" style={{ marginRight: -72 }}>
              <Thumb bg="#e9f8ee">
                <Archive size={18} color="#34c759" />
              </Thumb>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">Return label ready</span>
                <span className="block truncate text-[13px]" style={{ color: sub }}>
                  Print it or show the QR code
                </span>
              </span>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-[#5a5f70]">iOS list rows: at rest, swiped left, swiped right</p>
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
