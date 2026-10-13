import { MessageCircle } from 'lucide-react';
import { CountBadge, DotBadge, StatusPill } from './Badge';

const parts = [
  { n: 1, name: 'Anchor', text: 'The icon, tab, avatar or card the badge belongs to. The badge sits on its corner and must never hide it.' },
  { n: 2, name: 'Count badge', text: 'A number: unread messages, items in the cart. Capped ("99+") and hidden at zero.' },
  { n: 3, name: 'Dot badge', text: 'No number, just "something new here". Also used for presence (online) on avatars.' },
  { n: 4, name: 'Status label (pill)', text: '"Sale −20%", "Sold out", "In transit". A word that describes the item, not a count. The text carries the meaning, color only supports it.' },
  { n: 5, name: 'Separator ring', text: 'A thin outline in the background color, so the badge stays readable on top of the icon or photo.' },
  { n: 6, name: 'Accessible name', text: 'Not visible, but essential: the screen reader must hear the count with the anchor, e.g. "Messages, 3 unread".' },
];

function Marker({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-2 ring-white ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-3 py-8 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto flex max-w-[19rem] flex-col gap-6 text-black" role="img" aria-label="Anatomy of badges: a count badge on a tab icon, a dot on an avatar and a status label on a product">
          <div className="flex items-end justify-around rounded-2xl bg-white px-3 pt-5 pb-3 shadow-sm">
            <div className="relative flex flex-col items-center text-[#007aff]">
              <span className="relative">
                <MessageCircle size={28} className="fill-[#007aff]/10" />
                <Marker n={1} className="top-1 -left-7" />
                <span className="absolute -top-2 left-4">
                  <CountBadge label="3" ring="#fff" />
                  <Marker n={2} className="-top-5 -left-1" />
                  <Marker n={5} className="top-1 left-6" />
                </span>
              </span>
              <span className="mt-0.5 text-[11px] font-medium">Messages</span>
            </div>
            <div className="relative flex flex-col items-center">
              <span className="relative grid size-11 place-items-center rounded-full bg-[#ffd8a8] text-[15px] font-semibold text-[#7c2d12]">
                AN
                <span className="absolute right-0 bottom-0">
                  <DotBadge size={12} color="#34c759" ring="#fff" />
                </span>
                <Marker n={3} className="-right-7 bottom-3" />
              </span>
              <span className="mt-0.5 text-[11px] text-[#3c3c43]">Ana · online</span>
            </div>
          </div>
          <div className="relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#c7d2fe] to-[#fbcfe8]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">Trail runner 2</span>
              <span className="text-[12px] text-[#3c3c43]">
                €79.20 <s className="text-[#8e8e93]">€99.00</s>
              </span>
            </span>
            <span className="relative">
              <StatusPill kind="sale" />
              <Marker n={4} className="-top-4 -right-2" />
            </span>
          </div>
          <div className="relative rounded-xl border border-dashed border-[#5b4bff]/60 bg-white/70 px-3 py-2 font-mono text-[11px] text-[#3c3c43]">
            VoiceOver: "Messages, 3 unread, tab, 1 of 4"
            <Marker n={6} className="-top-2.5 -right-2.5" />
          </div>
        </div>
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
