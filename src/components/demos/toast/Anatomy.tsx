import { Home, Inbox, Pencil, Search, User } from 'lucide-react';

const parts = [
  { n: 1, name: 'Container', text: 'A small dark (or light) surface with rounded corners. It floats above the content but does not block it.' },
  { n: 2, name: 'Message', text: 'One short sentence about what just happened: "Conversation archived". Max two lines.' },
  { n: 3, name: 'Action (optional)', text: 'One short text button, usually Undo, Retry or View. Never "OK" or "Dismiss".' },
  { n: 4, name: 'Close icon (optional)', text: 'Lets the user dismiss it early. Common on web toasts and long snackbars.' },
  { n: 5, name: 'Placement', text: 'Above the bottom navigation and the floating button, never on top of them. Web: a corner or top/bottom center.' },
  { n: 6, name: 'Timer (invisible)', text: 'Hides it automatically after a few seconds. Longer when there is an action.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/25 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#e9ebf2] px-4 py-6">
        <div
          role="img"
          aria-label="A mail app screen with a snackbar reading 'Conversation archived' and an Undo action, sitting above the floating compose button and bottom navigation, with numbered markers"
          className="relative mx-auto h-[300px] max-w-[17rem] overflow-hidden rounded-[22px] border border-black/10 bg-[#fef7ff] text-[#1d1b20]"
        >
          <div aria-hidden="true" className="space-y-2 p-3">
            <div className="flex h-9 items-center gap-2 rounded-full bg-[#ece6f0] px-3 text-[12px] text-[#49454f]">
              <Search size={14} /> Search in mail
            </div>
            {['Lisbon trip itinerary', 'Your order has shipped', 'Team lunch on Friday?'].map((t) => (
              <div key={t} className="flex items-center gap-2 px-1 py-1">
                <span className="size-7 rounded-full bg-[#eaddff]" />
                <span className="flex-1 truncate text-[12px] font-medium">{t}</span>
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="absolute right-3 bottom-[124px] grid size-12 place-items-center rounded-2xl bg-[#eaddff] text-[#21005d] shadow-md">
            <Pencil size={18} />
          </div>
          <div aria-hidden="true" className="absolute inset-x-2 bottom-[62px]">
            <div className="relative flex min-h-11 items-center gap-1 rounded-[4px] bg-[#322f35] py-1 pr-1 pl-3 text-[#f5eff7] shadow-lg">
              <span className="relative flex-1 text-[12px]">
                Conversation archived
                <Marker n={2} className="-top-6 left-6" />
              </span>
              <span className="relative px-2 text-[12px] font-medium text-[#d0bcff]">
                Undo
                <Marker n={3} className="-top-6 left-1/2 -translate-x-1/2" />
              </span>
              <span className="relative grid size-7 place-items-center">
                ✕
                <Marker n={4} className="-top-6 -right-1" />
              </span>
              <Marker n={1} className="-bottom-3 -left-1" />
            </div>
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-14 items-center justify-around bg-[#f3edf7] text-[10px]">
            {[Inbox, Home, User].map((I, i) => (
              <span key={i} className={`grid h-7 w-12 place-items-center rounded-full ${i === 0 ? 'bg-[#e8def8]' : ''}`}>
                <I size={16} />
              </span>
            ))}
          </div>
          <Marker n={5} className="right-2 bottom-[18px]" />
          <Marker n={6} className="top-2 right-2" />
        </div>
      </div>
      <ol className="space-y-3">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{p.n}</span>
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
