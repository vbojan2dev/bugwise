import { Check, X } from 'lucide-react';

const parts = [
  { n: 1, name: 'Container', text: 'A compact rounded shape, usually 32 dp / pt tall. Outlined when off, filled when selected.' },
  { n: 2, name: 'Leading icon or checkmark', text: 'Optional icon. Selected filter chips show a checkmark so the state never depends on color alone.' },
  { n: 3, name: 'Label', text: 'One or two words: a filter, a value or an action. Long labels should truncate, not wrap.' },
  { n: 4, name: 'Count badge', text: 'Optional number of results or items behind the chip. Must update when filters change.' },
  { n: 5, name: 'Remove button (×)', text: 'Only on input chips. A separate button with its own name, like "Remove Italian".' },
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
      <div className="min-w-0 rounded-2xl px-4 py-14" style={{ background: '#fef7ff', colorScheme: 'light' }}>
        <div className="mx-auto flex w-fit flex-col items-start gap-12">
          {/* Selected filter chip with count */}
          <div className="relative">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg pr-3 pl-2 text-[14px] font-medium" style={{ background: '#e8def8', color: '#1d192b' }}>
              <Check size={16} strokeWidth={2.6} />
              Vegan
              <span className="min-w-5 rounded-full bg-white px-1.5 text-center text-[11px] leading-[18px] font-semibold">12</span>
            </span>
            <Marker n={1} className="-top-9 -left-3" />
            <span className="absolute -top-3 left-0 h-3 w-px bg-[#5b4bff]" />
            <Marker n={2} className="-bottom-10 left-0.5" />
            <span className="absolute -bottom-4 left-3.5 h-4 w-px bg-[#5b4bff]" />
            <Marker n={3} className="-top-9 left-[42%]" />
            <span className="absolute -top-3 left-[50%] h-3 w-px bg-[#5b4bff]" />
            <Marker n={4} className="-right-2 -bottom-10" />
            <span className="absolute right-4 -bottom-4 h-4 w-px bg-[#5b4bff]" />
          </div>
          {/* Input chip */}
          <div className="relative">
            <span className="inline-flex h-8 items-center gap-1 rounded-lg pr-1 pl-3 text-[14px] font-medium" style={{ color: '#49454f', boxShadow: 'inset 0 0 0 1px #79747e' }}>
              Italian
              <span className="grid size-6 place-items-center rounded-full">
                <X size={14} strokeWidth={2.4} />
              </span>
            </span>
            <Marker n={5} className="-right-2 -bottom-10" />
            <span className="absolute right-3.5 -bottom-4 h-4 w-px bg-[#5b4bff]" />
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
