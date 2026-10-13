import { CheckBox } from './Checkbox';

const parts = [
  { n: 1, name: 'Group label (optional)', text: 'Says what the set of checkboxes is about. On the web it is a <legend> inside a <fieldset>.' },
  { n: 2, name: 'Box (container)', text: 'Empty when unchecked, filled when checked. A dash means "mixed": some, but not all, items below are checked.' },
  { n: 3, name: 'Checkmark', text: 'Shows the checked state with a shape, not only a color.' },
  { n: 4, name: 'Label', text: 'Says what you agree to or pick. Tapping it must toggle the box too.' },
  { n: 5, name: 'Touch target', text: 'The tappable area. The box is only about 18 px, but the target must be at least 44×44 pt (iOS) or 48×48 dp (Android).' },
  { n: 6, name: 'Helper or error text', text: 'Extra info, or the error when a required box was left unchecked ("You need to accept the Terms").' },
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
        <div className="mx-auto max-w-[19rem] rounded-2xl bg-white px-3 pt-4 pb-3 text-[#1d1b20] shadow-sm" role="img" aria-label="Anatomy of a checkbox group with numbered parts">
          <p className="relative inline-block pl-1 text-[13px] font-medium text-[#6750a4]">
            Email me about
            <Marker n={1} className="-top-2 -right-6" />
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#6750a4]/10 outline-1 outline-[#6750a4]/60 outline-dashed">
              <CheckBox state={true} />
              <Marker n={2} className="-top-2.5 -left-2.5" />
              <Marker n={3} className="-top-2.5 -right-2.5" />
              <Marker n={5} className="-bottom-2.5 -left-2.5" />
            </span>
            <span className="relative text-[15px]">
              Order updates
              <Marker n={4} className="-top-2.5 -right-6" />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-10 shrink-0 place-items-center">
              <CheckBox state={false} />
            </span>
            <span className="text-[15px]">Travel deals and offers</span>
          </div>
          <p className="relative ml-[46px] inline-block pr-6 text-[12px] text-[#49454f]">
            You can change this any time in Settings.
            <Marker n={6} className="-top-1 right-0" />
          </p>
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
