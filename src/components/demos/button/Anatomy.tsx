import { ShoppingBag } from 'lucide-react';

const parts = [
  { n: 1, name: 'Container', text: 'The shape and fill. Its color and style signal how important the action is.' },
  { n: 2, name: 'Label', text: 'A short verb that says exactly what happens: "Add to basket", not "OK".' },
  { n: 3, name: 'Icon (optional)', text: 'Helps scanning. Never the only cue unless the icon is universally understood.' },
  { n: 4, name: 'Touch target', text: 'The tappable area. It can be larger than the visible shape: at least 44×44 pt (iOS) or 48×48 dp (Android).' },
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
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#f2f2f7] px-6 py-16">
        <div className="relative mx-auto w-fit">
          {/* Touch target outline */}
          <span className="absolute -inset-x-3 -inset-y-2 rounded-2xl border-2 border-dashed border-[#5b4bff]/60" />
          <span className="relative flex h-11 items-center gap-2 rounded-xl bg-[#007aff] px-5 text-[15px] font-semibold text-white">
            <ShoppingBag size={17} strokeWidth={2.2} aria-hidden="true" />
            Add to basket
          </span>
          <Marker n={1} className="-top-11 right-6" />
          <span className="absolute -top-5 right-9 h-5 w-px bg-[#5b4bff]" />
          <Marker n={2} className="-bottom-12 left-[55%]" />
          <span className="absolute -bottom-6 left-[calc(55%+12px)] h-6 w-px bg-[#5b4bff]" />
          <Marker n={3} className="-top-11 left-3" />
          <span className="absolute -top-5 left-6 h-5 w-px bg-[#5b4bff]" />
          <Marker n={4} className="-right-12 top-1/2 -translate-y-1/2" />
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
