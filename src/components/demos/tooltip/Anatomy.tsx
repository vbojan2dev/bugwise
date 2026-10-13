import { Archive, MailOpen, Trash2 } from 'lucide-react';

const parts = [
  { n: 1, name: 'Trigger', text: 'The element the tooltip explains, often an icon button. It must be focusable and have its own accessible name.' },
  { n: 2, name: 'Container', text: 'A small bubble, usually dark with light text. It floats above the page and never pushes content around.' },
  { n: 3, name: 'Text', text: 'A short, plain-text hint: a few words, no links, no buttons. If it needs more, it is a popover.' },
  { n: 4, name: 'Arrow (caret)', text: 'Optional. Points at the trigger, so it stays clear what the hint belongs to, even after shifting at screen edges.' },
  { n: 5, name: 'Offset', text: 'The small gap to the trigger. The pointer must be able to cross it without the tooltip disappearing.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-8 py-12 sm:px-12">
        <div
          role="img"
          aria-label="A mail app toolbar with three icon buttons. The Archive button has keyboard focus, and a dark tooltip above it reads 'Archive (E)', with a small arrow pointing down at the button."
          className="relative mx-auto w-[15rem] max-w-full"
        >
          <div className="relative h-[76px]">
            <div className="absolute bottom-0 left-[14px] rounded-md bg-[#1f2330] px-2.5 py-1.5 text-[12px] whitespace-nowrap text-white shadow-lg">
              Archive (E)
              <span className="absolute -bottom-1 left-[18px] size-2 rotate-45 bg-[#1f2330]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 rounded-xl bg-white p-1.5 text-[#3c4150] shadow-sm">
            <span className="grid size-10 place-items-center rounded-lg ring-2 ring-[#2f6bff]">
              <Archive size={18} />
            </span>
            <span className="grid size-10 place-items-center rounded-lg">
              <Trash2 size={18} />
            </span>
            <span className="grid size-10 place-items-center rounded-lg">
              <MailOpen size={18} />
            </span>
            <span className="ml-2 h-2 flex-1 rounded bg-black/10" />
          </div>
          {/* 1 trigger */}
          <Marker n={1} className="-bottom-10 left-[14px]" />
          <span className="absolute -bottom-4 left-[26px] h-4 w-px bg-[#5b4bff]" />
          {/* 2 container */}
          <Marker n={2} className="top-[50px] -left-8" />
          <span className="absolute top-[62px] -left-2 h-px w-[16px] bg-[#5b4bff]" />
          {/* 3 text */}
          <Marker n={3} className="top-[4px] left-[42px]" />
          <span className="absolute top-[28px] left-[54px] h-[22px] w-px bg-[#5b4bff]" />
          {/* 4 arrow */}
          <Marker n={4} className="top-[70px] left-[112px]" />
          <span className="absolute top-[82px] left-[40px] h-px w-[72px] bg-[#5b4bff]" />
          {/* 5 offset */}
          <Marker n={5} className="top-[66px] -right-3" />
          <span className="absolute top-[78px] right-[12px] left-[146px] h-px border-t border-dashed border-[#5b4bff]" />
        </div>
        <p className="mt-12 text-center text-[11px] text-[#5a5f70]">A web tooltip on a focused icon button</p>
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
