import { Check, ChevronUp } from 'lucide-react';

const parts = [
  { n: 1, name: 'Label', text: 'Says what you are choosing. Stays visible after a value is picked.' },
  { n: 2, name: 'Trigger (field)', text: 'Shows the current value, or a placeholder like "Select…" when nothing is chosen.' },
  { n: 3, name: 'Indicator (chevron)', text: 'Signals that a list opens. Often flips when the menu is open.' },
  { n: 4, name: 'Menu (listbox)', text: 'The floating list of options. Scrolls when there are many.' },
  { n: 5, name: 'Option', text: 'One choice. Can be disabled (dimmed, not selectable).' },
  { n: 6, name: 'Selected option', text: 'The current value, marked with a checkmark or a tint.' },
  { n: 7, name: 'Highlighted option', text: 'Where the mouse or keyboard focus is right now. Not the same as selected!' },
  { n: 8, name: 'Helper text', text: 'Extra guidance, replaced by an error message when needed.' },
];

function M({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-[3px] ring-[#5b4bff]/25 ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#f2f2f7] px-6 py-7 text-[#18181b] sm:px-8" role="img" aria-label="An open dropdown with its parts numbered 1 to 8">
        <div className="mx-auto max-w-[17rem]">
          <p className="relative mb-1.5 inline-block text-sm font-medium">
            Delivery country
            <M n={1} className="top-1/2 -right-7 -translate-y-1/2" />
          </p>
          <div className="relative flex h-[42px] items-center rounded-lg border border-[#2563eb] bg-white px-3 text-[15px] shadow-[0_0_0_3px_#2563eb33]">
            <span className="flex-1">Croatia</span>
            <span className="relative">
              <ChevronUp size={18} className="text-[#52525b]" />
              <M n={3} className="-top-6 -right-1" />
            </span>
            <M n={2} className="top-1/2 -left-7 -translate-y-1/2" />
          </div>
          <div className="relative mt-1 rounded-[10px] bg-white py-1 text-[14px] shadow-[0_12px_32px_-8px_rgba(16,24,40,.25),0_0_0_1px_rgba(16,24,40,.08)]">
            <M n={4} className="-top-2 -right-3" />
            <div className="mx-1 flex h-9 items-center rounded-md px-3">Austria</div>
            <div className="relative mx-1 flex h-9 items-center rounded-md px-3 font-semibold">
              <span className="flex-1">Croatia</span>
              <Check size={16} className="text-[#2563eb]" />
              <M n={6} className="top-1/2 -right-7 -translate-y-1/2" />
            </div>
            <div className="relative mx-1 flex h-9 items-center rounded-md bg-[#eff6ff] px-3 outline-2 -outline-offset-2 outline-[#2563eb]/35">
              Czechia
              <M n={7} className="top-1/2 -right-7 -translate-y-1/2" />
            </div>
            <div className="relative mx-1 flex h-9 items-center rounded-md px-3">
              Germany
              <M n={5} className="top-1/2 -left-6 -translate-y-1/2" />
            </div>
            <div className="mx-1 flex h-9 items-center rounded-md px-3 opacity-40">Hungary (unavailable)</div>
          </div>
          <p className="relative mt-2 inline-block text-[13px] text-[#52525b]">
            We currently ship to the EU only.
            <M n={8} className="top-1/2 -right-7 -translate-y-1/2" />
          </p>
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
