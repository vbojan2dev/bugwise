import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

const parts = [
  { n: 1, name: 'Landmark', text: 'A <nav> labelled "Breadcrumb", so screen reader users can jump to it and know what it is.' },
  { n: 2, name: 'Root (Home)', text: 'The first level. Usually "Home" or the site name, linking to the start page.' },
  { n: 3, name: 'Ancestor links', text: 'One link per level above the current page, in order. Each must open a page that exists.' },
  { n: 4, name: 'Separator', text: 'A › or / between levels. Pure decoration: drawn with CSS or hidden from screen readers.' },
  { n: 5, name: 'Current page', text: 'The last item. Plain text (not a link) with aria-current="page". Can be shortened if very long.' },
  { n: 6, name: 'Ordered list', text: 'The levels sit in an <ol>, so screen readers say "list, 4 items" and users know how deep they are.' },
];

function M({ n, children, className = '', below = false }: { n: number; children: ReactNode; className?: string; below?: boolean }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      <span className={`absolute ${below ? '-bottom-7' : '-top-7'} left-1/2 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-[3px] ring-[#5b4bff]/20`} aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

const sep = <ChevronRight size={11} className="shrink-0 text-black/35" />;

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-2 py-8 sm:px-3" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="A web shop page. Above the title, a breadcrumb trail reads Home, Camping, Tents, then the current page Trailhead 2P in bold, separated by small chevrons. The whole trail is inside a navigation landmark labelled Breadcrumb."
          className="mx-auto max-w-[20rem] rounded-xl bg-white px-2 pt-4 pb-5 text-[#0e1120] shadow-sm"
        >
          <p className="font-mono text-[10px] break-all text-black/40">shop.example.com/c/camping/tents/trailhead-2p</p>
          <div className="relative mt-10 rounded-lg border border-dashed border-[#5b4bff]/50 px-1.5 pt-3 pb-2">
            <span className="absolute -top-2.5 left-2 bg-white px-1 font-mono text-[9px] text-[#5b4bff]">
              <M n={1}>
                <span>nav aria-label="Breadcrumb"</span>
              </M>
            </span>
            <span className="absolute -top-2.5 right-2 bg-white px-1 font-mono text-[9px] text-[#5b4bff]">
              <M n={6}>
                <span>ol</span>
              </M>
            </span>
            <div className="mt-6 mb-5 flex flex-wrap items-center text-[11px]">
              <M n={2}>
                <span className="text-[#1d4ed8] underline underline-offset-2">Home</span>
              </M>
              <M n={4} below>
                {sep}
              </M>
              <M n={3}>
                <span className="text-[#1d4ed8] underline underline-offset-2">Camping</span>
              </M>
              {sep}
              <span className="text-[#1d4ed8] underline underline-offset-2">Tents</span>
              {sep}
              <M n={5}>
                <span className="font-semibold">Trailhead 2P</span>
              </M>
            </div>
          </div>
          <p className="mt-4 text-[17px] font-bold">Trailhead 2P</p>
          <div className="mt-2 h-20 rounded-lg bg-[#2f6b4f]/80" />
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">A location-based breadcrumb on a product page</p>
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
