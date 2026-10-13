import { RadioDot } from './Radio';

const parts = [
  { n: 1, name: 'Group label (question)', text: 'Says what you are choosing. On the web it is the <legend> of a <fieldset>. Without it, "Standard" and "Express" mean nothing to a screen reader user.' },
  { n: 2, name: 'Selected indicator', text: 'An outer ring with a filled inner dot. Only one option in the group can have it.' },
  { n: 3, name: 'Unselected circle', text: 'An empty ring. Round, never square: the shape tells users "pick one".' },
  { n: 4, name: 'Label', text: 'The option itself. Tapping it must select the option too.' },
  { n: 5, name: 'Supporting text (optional)', text: 'Details that help the user decide: delivery dates, a price, a fee.' },
  { n: 6, name: 'Touch target', text: 'The tappable area: ideally the whole row, at least 44×44 pt (iOS) or 48×48 dp (Android).' },
];

function Marker({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-2 ring-white ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#fef7ff] px-3 py-8 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto max-w-[19rem] rounded-2xl bg-white px-3 pt-4 pb-2 text-[#1d1b20] shadow-sm" role="img" aria-label="Anatomy of a radio button group with numbered parts">
          <p className="relative inline-block pl-1 text-[13px] font-medium text-[#6750a4]">
            Delivery speed
            <Marker n={1} className="-top-2 -right-6" />
          </p>
          <div className="relative mt-1 flex items-start gap-1.5 rounded-xl outline-1 outline-[#6750a4]/60 outline-dashed">
            <span className="relative grid size-10 shrink-0 place-items-center">
              <RadioDot selected />
              <Marker n={2} className="-top-2.5 -left-2.5" />
            </span>
            <span className="min-w-0 flex-1 py-[9px]">
              <span className="relative inline-block text-[15px] leading-snug">
                Standard
                <Marker n={4} className="-top-2.5 -right-6" />
              </span>
              <span className="relative block pr-5 text-[12px] text-[#49454f]">
                Arrives Tue–Thu
                <Marker n={5} className="top-0 right-0" />
              </span>
            </span>
            <span className="py-[9px] pr-2 text-[14px] font-medium">Free</span>
            <Marker n={6} className="-bottom-2.5 -right-2.5" />
          </div>
          <div className="mt-2 flex items-start gap-1.5">
            <span className="relative grid size-10 shrink-0 place-items-center">
              <RadioDot selected={false} />
              <Marker n={3} className="-top-1 -left-2.5" />
            </span>
            <span className="min-w-0 flex-1 py-[9px]">
              <span className="block text-[15px] leading-snug">Express</span>
              <span className="block text-[12px] text-[#49454f]">Arrives tomorrow</span>
            </span>
            <span className="py-[9px] pr-2 text-[14px] font-medium">€6.99</span>
          </div>
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
