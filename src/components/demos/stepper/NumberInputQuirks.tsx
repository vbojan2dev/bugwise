import { useRef, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

/* A real <input type="number"> with a live readout of what the browser (and a careless app) makes of it. */

interface Read {
  value: string;
  asNumber: number;
  badInput: boolean;
  overflow: boolean;
  underflow: boolean;
  stepMismatch: boolean;
}

const samples = [
  { t: '05', what: 'value "05". Number() gives 5, but an app that keeps the string shows "05" and may even do "05" + 1 = "051".' },
  { t: '1e2', what: 'Valid scientific notation: value "1e2", which is 100. parseInt("1e2") gives 1. Two parts of the app can disagree.' },
  { t: 'e', what: 'Allowed to type, but not a number: value is "" (empty) and badInput is true. The app sees an empty field.' },
  { t: '2.5', what: 'Valid number, but stepMismatch is true for step="1". Does the app round, reject or send 2.5 items?' },
  { t: '-3', what: 'Below min="1": rangeUnderflow. The browser only flags it; nothing stops the app from sending it.' },
  { t: '99', what: 'Above max="10": rangeOverflow. Same story: min/max are hints until a form is validated.' },
];

export default function NumberInputQuirks() {
  const ref = useRef<HTMLInputElement>(null);
  const lastWheel = useRef(0);
  const [r, setR] = useState<Read>({ value: '1', asNumber: 1, badInput: false, overflow: false, underflow: false, stepMismatch: false });
  const [wheelChanges, setWheelChanges] = useState(0);

  const read = (el: HTMLInputElement) => {
    setR({
      value: el.value,
      asNumber: el.valueAsNumber,
      badInput: el.validity.badInput,
      overflow: el.validity.rangeOverflow,
      underflow: el.validity.rangeUnderflow,
      stepMismatch: el.validity.stepMismatch,
    });
  };

  const flags = [r.badInput && 'badInput', r.underflow && 'rangeUnderflow', r.overflow && 'rangeOverflow', r.stepMismatch && 'stepMismatch'].filter(Boolean) as string[];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🔢 Native number input, under the microscope</p>
        <p className="text-sm text-muted">
          This is a real <code className="text-[13px]">&lt;input type="number" min="1" max="10" step="1"&gt;</code>. Type the samples below and watch what the browser reports.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-line p-5 md:border-r md:border-b-0" style={{ background: '#fff', color: '#0e1120', colorScheme: 'light' }}>
          <label className="block text-[14px] font-semibold" htmlFor="nq-input">
            Tickets
          </label>
          <input
            id="nq-input"
            ref={ref}
            type="number"
            min={1}
            max={10}
            step={1}
            defaultValue={1}
            onInput={(e) => {
              read(e.currentTarget);
              if (Date.now() - lastWheel.current < 150) setWheelChanges((n) => n + 1);
            }}
            onWheel={() => {
              lastWheel.current = Date.now();
            }}
            className="mt-1.5 h-11 w-full max-w-[12rem] rounded-lg border border-[#c7c7cc] px-3 text-[17px] outline-none focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
          />
          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono text-[12px]">
            <dt className="text-[#5b6070]">value</dt>
            <dd className="break-all">"{r.value}"</dd>
            <dt className="text-[#5b6070]">valueAsNumber</dt>
            <dd>{String(r.asNumber)}</dd>
            <dt className="text-[#5b6070]">Number(value)</dt>
            <dd>{String(Number(r.value))}</dd>
            <dt className="text-[#5b6070]">parseInt(value)</dt>
            <dd>{String(parseInt(r.value, 10))}</dd>
            <dt className="text-[#5b6070]">validity</dt>
            <dd className={flags.length ? 'text-[#b42318]' : 'text-[#067647]'}>{flags.length ? flags.join(', ') : 'valid'}</dd>
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#f6f7fb] p-2.5 text-[12px] text-[#3c4150]">
            <MousePointer2 size={14} className="mt-0.5 shrink-0" />
            <span>
              Click into the field, then scroll the mouse wheel over it. Value changes caused by the wheel: <strong className="tabular-nums">{wheelChanges}</strong>
              <span className="block text-[#5b6070]">Chromium browsers change a focused number input on wheel; others may not. Try several browsers.</span>
            </span>
          </p>
        </div>
        <ul className="min-w-0 divide-y divide-line">
          {samples.map((s) => (
            <li key={s.t} className="px-5 py-2.5 text-sm">
              <code className="mr-2 rounded bg-subtle px-1.5 py-0.5 font-semibold">{s.t}</code>
              <span className="text-muted">{s.what}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
