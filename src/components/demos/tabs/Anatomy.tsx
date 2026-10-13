import { Info, ListChecks, Star } from 'lucide-react';

const parts = [
  { n: 1, name: 'Tab bar (container)', text: 'Holds all tabs in one row, usually right under the top app bar.' },
  { n: 2, name: 'Tab', text: 'One destination. The whole area is tappable, at least 48 dp tall on Android.' },
  { n: 3, name: 'Icon (optional)', text: 'Supports the label. Icon-only tabs still need an accessible name.' },
  { n: 4, name: 'Label', text: 'One or two words naming the section. Must survive long translations.' },
  { n: 5, name: 'Active indicator', text: 'The line under the selected tab. It must always match the content shown.' },
  { n: 6, name: 'Badge', text: 'A dot or count for new items in that tab. Must update when the count changes.' },
  { n: 7, name: 'Content panel', text: 'The section the selected tab shows. Each panel keeps its own scroll and state.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  const tabs = [
    { label: 'Overview', icon: Info, active: true },
    { label: 'Specs', icon: ListChecks },
    { label: 'Reviews', icon: Star, badge: 12 },
  ];
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-4 py-12 sm:px-6">
        <div
          role="img"
          aria-label="Material tabs: Overview (selected, with indicator line), Specs, and Reviews with a badge showing 12. Below is the content panel."
          className="relative mx-auto max-w-[19rem]"
        >
          <div className="overflow-hidden rounded-xl bg-[#fef7ff] text-[#1d1b20] shadow-sm">
            <div className="flex border-b border-[#cac4d0]">
              {tabs.map((t) => (
                <div key={t.label} className="relative flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium" style={{ color: t.active ? '#6750a4' : '#49454f' }}>
                  <span className="relative">
                    <t.icon size={20} />
                    {t.badge && <span className="absolute -top-1.5 left-3 grid h-4 min-w-4 place-items-center rounded-full bg-[#b3261e] px-1 text-[10px] text-white">{t.badge}</span>}
                  </span>
                  {t.label}
                  {t.active && <span className="absolute bottom-0 left-1/2 h-[3px] w-14 -translate-x-1/2 rounded-t-[3px] bg-[#6750a4]" />}
                </div>
              ))}
            </div>
            <div className="space-y-1.5 p-3">
              <div className="h-2.5 w-3/4 rounded bg-black/15" />
              <div className="h-2 w-full rounded bg-black/10" />
              <div className="h-2 w-5/6 rounded bg-black/10" />
            </div>
          </div>
          <Marker n={1} className="-top-9 -right-1" />
          <span className="absolute -top-3 right-2 h-3 w-px bg-[#5b4bff]" />
          <Marker n={2} className="-top-9 left-[45%]" />
          <span className="absolute -top-3 left-[49.5%] h-3 w-px bg-[#5b4bff]" />
          <Marker n={3} className="-top-9 left-[12%]" />
          <span className="absolute -top-3 left-[16.5%] h-6 w-px bg-[#5b4bff]" />
          <Marker n={6} className="-top-9 left-[78%]" />
          <span className="absolute -top-3 left-[82.5%] h-4 w-px bg-[#5b4bff]" />
          <Marker n={4} className="top-[30px] -left-8" />
          <span className="absolute top-[42px] -left-2 h-px w-3 bg-[#5b4bff]" />
          <Marker n={5} className="top-[58px] -left-8" />
          <span className="absolute top-[63px] -left-2 h-px w-8 bg-[#5b4bff]" />
          <Marker n={7} className="-bottom-10 left-[46%]" />
          <span className="absolute -bottom-4 left-[50%] h-6 w-px bg-[#5b4bff]" />
        </div>
        <p className="mt-12 text-center text-[11px] text-[#5a5f70]">Material 3 primary tabs with icons</p>
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
