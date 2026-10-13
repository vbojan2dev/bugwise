import type { ReactNode } from 'react';
import { ProgressKeyframes, M3Linear, IosSpinner } from './Indicators';

const parts = [
  { n: 1, name: 'Label', text: 'Says what is happening: “Uploading 3 of 8 photos”, not just “Loading”. Screen readers need it too.' },
  { n: 2, name: 'Active indicator', text: 'The filled part. In a determinate bar its length matches the real progress and only ever grows.' },
  { n: 3, name: 'Track', text: 'The full length, so people can judge how much is left. Needs 3:1 contrast against the background.' },
  { n: 4, name: 'Stop indicator', text: 'Material 3 adds a small dot at the end of the track so the end stays visible.' },
  { n: 5, name: 'Value and time left', text: '“38% · about 2 min left”. Optional, but very welcome for anything longer than ~10 seconds.' },
  { n: 6, name: 'Cancel', text: 'A way out of long work. Cancel must really stop the work, not just hide the bar.' },
  { n: 7, name: 'Spinner', text: 'Indeterminate: “working, no idea how long”. Fine for a few seconds, never on its own for minutes.' },
];

function M({ n, children, className = '' }: { n: number; children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-grid ${className}`}>
      {children}
      <span className="absolute -top-6 left-1/2 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-[3px] ring-[#5b4bff]/20" aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <ProgressKeyframes />
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-3 py-8 sm:px-5" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="An Android upload card: the label 'Uploading 3 of 8 photos', a progress bar 38 percent filled with a gap, the rest of the track and a small dot at its end, then '38% · about 2 min left' and a Cancel button. Below it, a small spinner with 'Preparing album…'."
          className="mx-auto max-w-[19rem] rounded-2xl bg-[#fef7ff] px-4 pt-9 pb-4 text-[#1d1b20] shadow-sm"
        >
          <M n={1}>
            <span className="text-[14px] font-medium">Uploading 3 of 8 photos</span>
          </M>
          <div className="relative mt-8 flex items-center">
            <M n={2} className="absolute left-[14%]">
              <span className="block h-1 w-1" />
            </M>
            <M n={3} className="absolute left-[66%]">
              <span className="block h-1 w-1" />
            </M>
            <M n={4} className="absolute right-0">
              <span className="block h-1 w-1" />
            </M>
            <M3Linear value={0.38} />
          </div>
          <div className="mt-8 flex items-center justify-between gap-2">
            <M n={5}>
              <span className="text-[12px] text-[#49454f]">38% · about 2 min left</span>
            </M>
            <M n={6}>
              <span className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#6750a4]">Cancel</span>
            </M>
          </div>
          <div className="mt-8 flex items-center gap-2 border-t border-[#e7e0ec] pt-4">
            <M n={7}>
              <IosSpinner size={18} animating={false} />
            </M>
            <span className="text-[12px] text-[#49454f]">Preparing album…</span>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">A determinate bar with label, value and Cancel, and an indeterminate spinner</p>
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
