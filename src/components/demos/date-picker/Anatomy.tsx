import { ChevronDown, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

const parts = [
  { n: 1, name: 'Headline (selected value)', text: 'Shows the chosen date in words, e.g. "Tue, Oct 20". It must update with every tap.' },
  { n: 2, name: 'Input mode toggle', text: 'Switches between picking on the calendar and typing the date. Material shows a pencil, iOS lets you tap the field.' },
  { n: 3, name: 'Month / year header + navigation', text: 'Tap the title to jump to another year, or use the arrows to move one month.' },
  { n: 4, name: 'Weekday row', text: 'Starts on Sunday or Monday depending on the locale. Labels must line up with the dates below.' },
  { n: 5, name: 'Today marker', text: 'An outline (or colored text on iOS) so users know where "now" is.' },
  { n: 6, name: 'Selected day', text: 'Filled circle. Past or unavailable days look disabled and cannot be picked.' },
  { n: 7, name: 'Actions', text: 'Cancel / OK in modal pickers. Inline pickers apply the value immediately.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const lead = 4; // Oct 1, 2026 is a Thursday (Sunday-first grid)

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#f2f2f7] px-6 py-8 sm:px-10">
        <div className="relative mx-auto w-full max-w-[17.5rem] rounded-[28px] bg-[#ece6f0] pb-3 text-[#1d1b20] shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          <div className="relative px-5 pt-4 pb-3">
            <p className="text-[12px] font-medium text-[#49454f]">Select date</p>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[28px] leading-none">Tue, Oct 20</p>
              <Pencil size={18} className="text-[#49454f]" />
            </div>
            <Marker n={1} className="-left-3 top-[3.2rem]" />
            <Marker n={2} className="-right-3 top-[3.2rem]" />
          </div>
          <div className="h-px bg-[#cac4d0]" />
          <div className="relative flex items-center justify-between px-4 pt-2">
            <span className="flex items-center gap-1 text-[13px] font-medium text-[#49454f]">
              October 2026 <ChevronDown size={14} />
            </span>
            <span className="flex gap-3 text-[#49454f]">
              <ChevronLeft size={18} />
              <ChevronRight size={18} />
            </span>
            <Marker n={3} className="-right-3 top-1.5" />
          </div>
          <div className="relative mt-1 grid grid-cols-7 px-3 text-center text-[11px] font-medium">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
            <Marker n={4} className="-left-3 top-0" />
          </div>
          <div className="relative grid grid-cols-7 gap-y-0.5 px-3 text-center text-[12px]">
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((d) => (
              <span key={d} className="grid h-7 place-items-center">
                <span
                  className={`grid size-7 place-items-center rounded-full ${d === 12 ? 'border border-[#6750a4] font-semibold text-[#6750a4]' : ''} ${d === 20 ? 'bg-[#6750a4] font-semibold text-white' : ''} ${d < 12 ? 'text-[#1d1b20]/40' : ''}`}
                >
                  {d}
                </span>
              </span>
            ))}
            <Marker n={5} className="-left-3 top-[3.85rem]" />
            <Marker n={6} className="-right-3 top-[5.7rem]" />
          </div>
          <div className="relative mt-2 flex justify-end gap-5 px-6 text-[13px] font-medium text-[#6750a4]">
            <span>Cancel</span>
            <span>OK</span>
            <Marker n={7} className="-left-3 -top-0.5" />
          </div>
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
