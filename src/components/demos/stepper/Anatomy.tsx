import { Minus, Plus } from 'lucide-react';

const parts = [
  { n: 1, name: 'Label', text: 'What is being counted: "Quantity", "Guests", "Adults". Also the accessible name.' },
  { n: 2, name: 'Decrease button (−)', text: 'Lowers the value by one step. Disabled at the minimum, or turns into a trash icon in carts.' },
  { n: 3, name: 'Value', text: 'The current number. Sometimes editable, so users can type 12 instead of tapping 11 times.' },
  { n: 4, name: 'Increase button (+)', text: 'Raises the value by one step. Disabled at the maximum (stock limit, max tickets).' },
  { n: 5, name: 'Limit hint', text: 'Explains why + stopped working: "Only 4 left", "Max 8 guests".' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-4 py-14 text-black" style={{ colorScheme: 'light' }}>
        <div className="relative mx-auto flex max-w-[17rem] items-center justify-between gap-3 rounded-xl bg-white px-3 py-3">
          <div className="relative min-w-0">
            <p className="text-[15px] font-semibold">Oat milk 1 L</p>
            <p className="relative text-[12px] text-[#c2410c]">Only 4 left</p>
            <Marker n={1} className="-top-10 left-2" />
            <span className="absolute -top-4 left-5 h-4 w-px bg-[#5b4bff]" />
            <Marker n={5} className="-bottom-12 left-2" />
            <span className="absolute -bottom-6 left-5 h-5 w-px bg-[#5b4bff]" />
          </div>
          <div className="relative flex shrink-0 items-center gap-0.5 rounded-full border border-[#c7c7cc] p-0.5">
            <span className="grid size-8 place-items-center text-[#007aff]">
              <Minus size={17} />
            </span>
            <span className="w-6 text-center text-[16px] font-semibold">4</span>
            <span className="grid size-8 place-items-center text-[rgba(60,60,67,.3)]">
              <Plus size={17} />
            </span>
            <Marker n={2} className="-top-10 left-1.5" />
            <span className="absolute -top-4 left-[18px] h-4 w-px bg-[#5b4bff]" />
            <Marker n={3} className="-bottom-12 left-[38%]" />
            <span className="absolute -bottom-6 left-1/2 h-5 w-px bg-[#5b4bff]" />
            <Marker n={4} className="-top-10 right-1.5" />
            <span className="absolute -top-4 right-[18px] h-4 w-px bg-[#5b4bff]" />
          </div>
        </div>
      </div>
      <ol className="space-y-3">
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
