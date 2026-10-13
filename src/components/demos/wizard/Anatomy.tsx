import type { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const parts = [
  { n: 1, name: 'Step indicator', text: 'Shows all steps, in order. A <nav> or list, with the current step marked aria-current="step".' },
  { n: 2, name: 'Completed step', text: 'A check mark (not only a color). Usually clickable, so users can go back and change it.' },
  { n: 3, name: 'Current step', text: 'Highlighted number and bold label. Must always match the form on screen.' },
  { n: 4, name: 'Upcoming step', text: 'Outlined and muted. In a linear wizard it is not clickable yet.' },
  { n: 5, name: 'Step title + progress text', text: '"Step 2 of 4: Shipping". The same text screen readers should hear when the step opens.' },
  { n: 6, name: 'Step content', text: 'Only the fields for this step. Validated when the user continues.' },
  { n: 7, name: 'Back', text: 'Goes to the previous step and keeps everything the user entered.' },
  { n: 8, name: 'Primary action', text: 'Says where it leads: "Continue to payment". On the last step: "Place order".' },
];

function M({ n, children, className = '' }: { n: number; children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      <span className="absolute -top-6 left-1/2 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-[3px] ring-[#5b4bff]/20" aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

function Dot({ state, n }: { state: 'done' | 'current' | 'next'; n: number }) {
  return (
    <span
      className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
        state === 'done' ? 'bg-[#4338ca]/15 text-[#4338ca]' : state === 'current' ? 'bg-[#4338ca] text-white ring-4 ring-[#4338ca]/15' : 'border-2 border-black/20 text-black/45'
      }`}
    >
      {state === 'done' ? <Check size={12} strokeWidth={3} /> : n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-2 py-8 sm:px-5" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="A checkout wizard. At the top, four numbered steps joined by lines: Contact with a check mark (completed), Shipping highlighted (current), Payment and Review outlined (upcoming). Below, the heading 'Step 2 of 4: Shipping', address fields, a Back link and a 'Continue to payment' button."
          className="mx-auto max-w-[20rem] rounded-xl bg-white px-3 pt-12 pb-4 text-[#0e1120] shadow-sm"
        >
          <div className="relative">
            <span className="absolute -top-2 right-2 z-10 bg-white px-1 font-mono text-[9px] leading-none text-[#5b4bff]">
              <M n={1}>
                <span>nav · ol</span>
              </M>
            </span>
            <div className="flex items-start justify-between rounded-lg border border-dashed border-[#5b4bff]/40 px-1 pt-5 pb-1.5">
              {[
                ['done', 'Contact', 2],
                ['current', 'Shipping', 3],
                ['next', 'Payment', 4],
                ['next', 'Review', 0],
              ].map(([state, label, marker], i) => {
                const dot = <Dot state={state as 'done' | 'current' | 'next'} n={i + 1} />;
                return (
                  <div key={label as string} className="flex min-w-0 flex-1 flex-col items-center">
                    {marker ? <M n={marker as number}>{dot}</M> : dot}
                    <span className={`mt-1 truncate text-[10px] ${state === 'current' ? 'font-bold' : 'text-black/55'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8">
            <M n={5}>
              <span className="text-[14px] font-bold">Step 2 of 4: Shipping</span>
            </M>
          </div>
          <div className="mt-7">
            <M n={6} className="w-full">
              <span className="block w-full space-y-2">
                <span className="block h-8 rounded-md border border-black/20" />
                <span className="flex gap-2">
                  <span className="block h-8 flex-1 rounded-md border border-black/20" />
                  <span className="block h-8 w-16 rounded-md border border-black/20" />
                </span>
              </span>
            </M>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <M n={7}>
              <span className="flex items-center gap-1 text-[12px] font-semibold text-[#4338ca]">
                <ArrowLeft size={13} /> Back
              </span>
            </M>
            <M n={8}>
              <span className="rounded-lg bg-[#4338ca] px-3 py-2 text-[12px] font-semibold text-white">Continue to payment</span>
            </M>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">Step 2 of a 4-step checkout wizard</p>
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
