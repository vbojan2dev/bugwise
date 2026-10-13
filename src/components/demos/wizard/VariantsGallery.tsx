import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft } from 'lucide-react';

const LABELS = ['Contact', 'Shipping', 'Payment', 'Review'];
const ACCENT = '#4338ca';

function Card({ title, platform, note, chips, children, step, setStep }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; step: number; setStep: (f: (s: number) => number) => void }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="px-3 py-5" style={{ background: '#e9ebf2', colorScheme: 'light' }}>
        <div className="mx-auto min-h-[190px] w-full max-w-[300px] min-w-0 overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">{children}</div>
        <div className="mx-auto mt-3 flex max-w-[300px] justify-between gap-2">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-[#0e1120] shadow-sm disabled:opacity-40">
            Back
          </button>
          <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step === 3} className="rounded-md px-3 py-1 text-[12px] font-semibold text-white shadow-sm disabled:opacity-40" style={{ background: ACCENT }}>
            Next step
          </button>
        </div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function Circle({ i, step, size = 24 }: { i: number; step: number; size?: number }) {
  const done = i < step;
  const cur = i === step;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-[11px] font-bold"
      style={{
        width: size,
        height: size,
        background: done || cur ? ACCENT : 'transparent',
        color: done || cur ? '#fff' : 'rgba(0,0,0,.45)',
        border: done || cur ? 'none' : '2px solid rgba(0,0,0,.2)',
      }}
    >
      {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : i + 1}
    </span>
  );
}

function Lines({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-6 rounded-md border border-black/15" style={{ width: `${100 - i * 18}%` }} />
      ))}
    </div>
  );
}

function Horizontal({ step }: { step: number }) {
  return (
    <div className="p-3">
      <ol className="flex items-start">
        {LABELS.map((l, i) => (
          <li key={l} className="flex min-w-0 flex-1 items-center gap-1" aria-current={i === step ? 'step' : undefined}>
            <span className="flex min-w-0 flex-col items-center">
              <Circle i={i} step={step} />
              <span className={`mt-1 max-w-full truncate text-[10px] ${i === step ? 'font-bold' : 'text-black/55'}`}>{l}</span>
            </span>
            {i < 3 && <span className="mb-4 h-px min-w-1 flex-1" style={{ background: i < step ? ACCENT : 'rgba(0,0,0,.15)' }} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className="mt-3 mb-2 text-[13px] font-bold">{LABELS[step]}</p>
      <Lines />
    </div>
  );
}

function Vertical({ step }: { step: number }) {
  return (
    <ol className="p-3">
      {LABELS.map((l, i) => (
        <li key={l} className="flex gap-2" aria-current={i === step ? 'step' : undefined}>
          <span className="flex flex-col items-center">
            <Circle i={i} step={step} size={22} />
            {i < 3 && <span className="my-0.5 w-px flex-1" style={{ minHeight: 10, background: i < step ? ACCENT : 'rgba(0,0,0,.15)' }} aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1 pb-2">
            <p className={`text-[12px] leading-[22px] ${i === step ? 'font-bold' : 'text-black/55'}`}>
              {l}
              {i < step && <span className="ml-1 font-normal text-black/40">· edit</span>}
            </p>
            {i === step && <Lines n={2} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Compact({ step }: { step: number }) {
  return (
    <div className="bg-[#f2f2f7]">
      <div className="flex items-center justify-between bg-white px-2 py-2">
        <span className="flex items-center text-[13px] text-[#007aff]">
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
          {step === 0 ? 'Cart' : LABELS[step - 1]}
        </span>
        <span className="text-[13px] font-semibold">Checkout</span>
        <span className="w-12" />
      </div>
      <div className="h-1 bg-black/10" aria-hidden="true">
        <div className="h-full transition-[width]" style={{ width: `${((step + 1) / 4) * 100}%`, background: ACCENT }} />
      </div>
      <div className="p-3">
        <p className="text-[11px] font-semibold text-black/50 uppercase">
          Step {step + 1} of 4
        </p>
        <p className="mb-2 text-[16px] font-bold">{LABELS[step]}</p>
        <div className="space-y-1.5">
          <div className="h-8 rounded-lg bg-white" />
          <div className="h-8 rounded-lg bg-white" />
        </div>
      </div>
    </div>
  );
}

function Chevrons({ step }: { step: number }) {
  const labels = ['Cart', 'Shipping', 'Payment', 'Review'];
  return (
    <div className="p-3">
      <ol className="flex text-[10px] font-semibold">
        {labels.map((l, i) => (
          <li
            key={l}
            aria-current={i === step ? 'step' : undefined}
            className="min-w-0 flex-1 truncate py-1.5 pr-1 pl-2.5 text-center"
            style={{
              clipPath: i === 0 ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)' : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)',
              background: i < step ? '#c7d2fe' : i === step ? ACCENT : '#eceef3',
              color: i === step ? '#fff' : i < step ? '#312e81' : 'rgba(0,0,0,.5)',
              marginLeft: i === 0 ? 0 : -4,
            }}
          >
            {l}
          </li>
        ))}
      </ol>
      <p className="mt-3 mb-2 text-[13px] font-bold">{labels[step]}</p>
      <Lines />
    </div>
  );
}

function useStep() {
  const [step, setStep] = useState(1);
  return { step, setStep };
}

export default function VariantsGallery() {
  const a = useStep();
  const b = useStep();
  const c = useStep();
  const d = useStep();
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        {...a}
        title="Horizontal stepper"
        platform="Web (desktop)"
        note="Numbered circles with labels and connecting lines, as in MUI or Angular Material. Needs room: with 5+ steps or long labels, it won't fit a phone."
        chips={['Most common', 'Labels visible']}
      >
        <Horizontal step={a.step} />
      </Card>
      <Card
        {...b}
        title="Vertical stepper"
        platform="Web / mobile web"
        note="Steps stacked top to bottom with the current step's fields opened under its label. Fits narrow screens and long labels."
        chips={['Narrow screens', 'Long forms']}
      >
        <Vertical step={b.step} />
      </Card>
      <Card
        {...c}
        title="Compact progress"
        platform="iOS / Android"
        note="Native apps rarely show a full stepper. Typical: one screen per step, a thin progress bar, “Step 2 of 4”, and the navigation bar's back button."
        chips={['Small screens', 'Back button']}
      >
        <Compact step={c.step} />
      </Card>
      <Card
        {...d}
        title="Checkout chevrons"
        platform="Web shops"
        note="A custom arrow-shaped bar. It looks like breadcrumbs but shows steps in a process. Check it's clear which steps are done and which are clickable."
        chips={['Custom', 'Checkout']}
      >
        <Chevrons step={d.step} />
      </Card>
    </div>
  );
}
