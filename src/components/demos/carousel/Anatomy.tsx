import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { PROMOS, SlideArt } from './SlideArt';

const parts = [
  { n: 1, name: 'Carousel region', text: 'The container. Announced as “carousel” with a label like “Featured offers”.' },
  { n: 2, name: 'Slide', text: 'One item: a banner, photo or card. Only the visible slide can be focused or read.' },
  { n: 3, name: 'Pause / play', text: 'Required when slides move by themselves for more than 5 seconds (WCAG 2.2.2).' },
  { n: 4, name: 'Previous / next arrows', text: 'For mouse and keyboard users. At least 44×44 pt; hidden or disabled at the ends if it does not loop.' },
  { n: 5, name: 'Slide counter', text: '“2 / 5”. Must match the slide shown, every time.' },
  { n: 6, name: 'Dots (slide picker)', text: 'Show the position and jump to a slide. The dot can be small; its tap area must not be.' },
];

function M({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

function Wrap({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`relative ${className}`}>{children}</div>;
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-6 py-10" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="Hero carousel: a summer sale banner showing slide 2 of 5, with a pause button bottom left, previous and next arrows on the sides, a counter '2 / 5' top right and five dots below, the second one active."
          className="relative mx-auto max-w-[17rem]"
        >
          <Wrap className="rounded-2xl bg-white p-2 shadow-sm">
            <M n={1} className="-top-4 -left-4" />
            <Wrap className="overflow-hidden rounded-xl" >
              <div className="aspect-[16/9]">
                <SlideArt promo={PROMOS[1]} id="anat" />
              </div>
              <span className="absolute bottom-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white">
                <Pause size={12} fill="currentColor" />
              </span>
              <span className="absolute top-1/2 left-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#0e1120]">
                <ChevronLeft size={14} />
              </span>
              <span className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#0e1120]">
                <ChevronRight size={14} />
              </span>
              <span className="absolute top-1.5 right-1.5 rounded-full bg-black/55 px-1.5 text-[10px] font-medium text-white">2 / 5</span>
            </Wrap>
            <div className="flex justify-center gap-1.5 py-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="block h-1.5 rounded-full" style={{ width: i === 1 ? 14 : 6, background: i === 1 ? '#1d4ed8' : '#9ca3af' }} />
              ))}
            </div>
          </Wrap>
          <M n={2} className="top-[64%] left-[46%]" />
          <M n={3} className="top-[60%] -left-5" />
          <M n={4} className="top-[44%] -right-5" />
          <M n={5} className="-top-4 right-[18%]" />
          <M n={6} className="-bottom-5 left-[58%]" />
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
