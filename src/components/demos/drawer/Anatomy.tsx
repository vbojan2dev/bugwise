import type { ReactNode } from 'react';
import { Inbox, Menu, Search, Send, Star, Tag, Trash2 } from 'lucide-react';
import { MD } from './Drawer';

const parts = [
  { n: 1, name: 'Menu button (hamburger)', text: 'Opens the drawer. Needs a name (“Menu”) and, on the web, aria-expanded that changes.' },
  { n: 2, name: 'Scrim', text: 'Dims the page behind a modal drawer. Tapping it closes the drawer.' },
  { n: 3, name: 'Drawer sheet', text: 'Slides in from the start edge. Gets focus when it opens and keeps it inside.' },
  { n: 4, name: 'Headline', text: 'Optional title or account switcher at the top.' },
  { n: 5, name: 'Destination', text: 'Icon plus label. Selecting one navigates and closes a modal drawer.' },
  { n: 6, name: 'Active indicator', text: 'Marks the current page. Must match where you really are.' },
  { n: 7, name: 'Badge', text: 'Unread count, e.g. 24 in Inbox. Must stay current.' },
  { n: 8, name: 'Divider & section label', text: 'Groups secondary destinations like labels, Settings and Help.' },
];

function Marker({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-[3px] ring-[#5b4bff]/25 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

function Mail({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-[290px] w-[122px] shrink-0 overflow-hidden rounded-[20px] border-[4px] border-[#0c0d12] text-[#1d1b20]" style={{ background: MD.surface }}>
      <div className="flex h-9 items-center gap-1.5 px-2">
        <span className="relative">
          <Menu size={15} />
          {!children && <Marker n={1} className="-top-1 left-4" />}
        </span>
        <span className="flex-1 text-[11px]">Inbox</span>
        <Search size={13} />
      </div>
      <div className="space-y-2 px-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="size-4 shrink-0 rounded-full" style={{ background: ['#d0bcff', '#ffd8e4', '#c8e6c9'][i % 3] }} />
            <span className="h-1.5 flex-1 rounded bg-black/15" />
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

export default function Anatomy() {
  const rows = [
    { l: 'Inbox', I: Inbox, sel: true, badge: 24 },
    { l: 'Starred', I: Star },
    { l: 'Sent', I: Send },
    { l: 'Trash', I: Trash2 },
  ];
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-3 py-6" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="Two phone screens of a mail app. Closed: a menu button at the top left. Open: a dim scrim over the inbox and a drawer with the headline Mail, Inbox selected with 24 unread, Starred, Sent, Trash, a divider and a Labels section."
          className="flex justify-center gap-2"
        >
          <Mail />
          <Mail>
            <div className="absolute inset-0 bg-black/30" />
            <Marker n={2} className="right-1.5 bottom-16" />
            <div className="absolute inset-y-0 left-0 w-[86%] rounded-r-xl pt-2" style={{ background: MD.drawer }}>
              <Marker n={3} className="right-1 bottom-3" />
              <p className="relative px-2.5 pb-1.5 text-[10px] font-medium" style={{ color: MD.variant }}>
                Mail
                <Marker n={4} className="-top-1 left-9" />
              </p>
              {rows.map((r, i) => (
                <div key={r.l} className="relative mx-1 flex h-6 items-center gap-1.5 rounded-full px-2 text-[9px] font-medium" style={{ background: r.sel ? MD.indicator : undefined, color: r.sel ? MD.onIndicator : MD.variant }}>
                  <r.I size={11} />
                  <span className="flex-1">{r.l}</span>
                  {r.badge && (
                    <span className="relative">
                      {r.badge}
                      <Marker n={7} className="-top-5 -right-1" />
                    </span>
                  )}
                  {i === 0 && <Marker n={6} className="-bottom-3 left-0" />}
                  {i === 2 && <Marker n={5} className="top-0.5 right-1" />}
                </div>
              ))}
              <div className="relative mx-2 my-1.5 h-px" style={{ background: MD.outline }}>
                <Marker n={8} className="-top-2.5 right-0" />
              </div>
              <p className="px-2.5 pb-1 text-[8px] font-medium" style={{ color: MD.variant }}>
                Labels
              </p>
              {['Travel', 'Receipts'].map((l) => (
                <div key={l} className="mx-1 flex h-6 items-center gap-1.5 px-2 text-[9px] font-medium" style={{ color: MD.variant }}>
                  <Tag size={11} />
                  {l}
                </div>
              ))}
            </div>
          </Mail>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">Material 3 modal navigation drawer: closed and open</p>
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
