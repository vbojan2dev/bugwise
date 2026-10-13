import { ChevronDown } from 'lucide-react';

const parts = [
  { n: 1, name: 'Container', text: 'Groups related sections, like the questions of one FAQ. Usually a list with dividers or separate cards.' },
  { n: 2, name: 'Header (trigger)', text: 'The whole row is one button. Tapping anywhere on it opens or closes the section, not just the arrow.' },
  { n: 3, name: 'Title', text: 'Names the section in a few words. On the web it sits inside a heading, so screen reader users can jump between sections.' },
  { n: 4, name: 'Summary (optional)', text: 'A short preview of what is inside, e.g. “Delivered 6 Oct”. Saves a tap for the most common question.' },
  { n: 5, name: 'Chevron (state indicator)', text: 'Points down when closed and up when open (or right → down). It must always match the real state.' },
  { n: 6, name: 'Panel (content)', text: 'Shown only while the section is open. Can hold text, lists, links and buttons.' },
  { n: 7, name: 'Divider', text: 'Separates sections so users can see where one ends and the next begins.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

function Row({ title, sub, open }: { title: string; sub?: string; open?: boolean }) {
  return (
    <div className="flex h-14 items-center gap-3 px-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold">{title}</p>
        {sub && <p className="truncate text-[11px] text-[#5a5f70]">{sub}</p>}
      </div>
      <ChevronDown size={18} className="shrink-0 text-[#5a5f70]" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
    </div>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-10 py-12 sm:px-12">
        <div
          role="img"
          aria-label="An accordion with three sections. Delivery is open: its header shows the title, a summary 'Delivered 6 Oct' and an upward chevron, and its panel shows delivery details. Payment and Returns are closed with downward chevrons."
          className="relative mx-auto max-w-[17rem]"
        >
          <div className="overflow-hidden rounded-xl bg-white text-[#0e1120] shadow-sm">
            <Row title="Delivery" sub="Delivered 6 Oct" open />
            <div className="h-[72px] space-y-1.5 px-4 pt-1">
              <div className="h-2 w-5/6 rounded bg-black/10" />
              <div className="h-2 w-full rounded bg-black/10" />
              <div className="h-2 w-2/3 rounded bg-black/10" />
              <div className="mt-2 h-2 w-1/3 rounded bg-[#2f6bff]/40" />
            </div>
            <div className="h-px bg-black/10" />
            <Row title="Payment" />
            <div className="h-px bg-black/10" />
            <Row title="Returns" />
          </div>
          {/* 1 container */}
          <Marker n={1} className="-bottom-10 left-[46%]" />
          <span className="absolute -bottom-4 left-[50%] h-4 w-px bg-[#5b4bff]" />
          {/* 2 header */}
          <Marker n={2} className="top-[16px] -left-9" />
          <span className="absolute top-[28px] -left-3 h-px w-3 bg-[#5b4bff]" />
          {/* 3 title */}
          <Marker n={3} className="-top-9 left-[8%]" />
          <span className="absolute -top-3 left-[12.5%] h-6 w-px bg-[#5b4bff]" />
          {/* 4 summary */}
          <Marker n={4} className="-top-9 left-[40%]" />
          <span className="absolute -top-3 left-[44.5%] h-[50px] w-px bg-[#5b4bff]" />
          {/* 5 chevron */}
          <Marker n={5} className="top-[16px] -right-9" />
          <span className="absolute top-[28px] -right-3 h-px w-5 bg-[#5b4bff]" />
          {/* 6 panel */}
          <Marker n={6} className="top-[80px] -left-9" />
          <span className="absolute top-[92px] -left-3 h-px w-5 bg-[#5b4bff]" />
          {/* 7 divider */}
          <Marker n={7} className="top-[116px] -right-9" />
          <span className="absolute top-[128px] -right-3 h-px w-5 bg-[#5b4bff]" />
        </div>
        <p className="mt-12 text-center text-[11px] text-[#5a5f70]">A web accordion: one section open</p>
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
