import { IosSpinner, M3Indicator } from './Indicators';

const states = [
  { n: 1, name: 'Pulling', text: 'The list follows your finger, with resistance. The indicator fills up to show how far is enough.', progress: 0.45 },
  { n: 2, name: 'Armed', text: 'You passed the threshold. Letting go now will refresh. Often a haptic tick and "Release to refresh".', progress: 1 },
  { n: 3, name: 'Refreshing', text: 'One request is running. The indicator spins and stays visible until it finishes.', progress: 1, spinning: true },
  { n: 4, name: 'Done', text: 'New items appear at the top, "Updated" time changes, and the indicator goes away. Or an error is shown.', progress: 1, done: true },
];

function Lines({ offset }: { offset: number }) {
  return (
    <div className="space-y-1.5 px-2.5" style={{ transform: `translateY(${offset}px)` }}>
      {[80, 64, 72, 56].map((w, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-4 shrink-0 rounded-full bg-black/10" />
          <span className="h-1.5 rounded bg-black/10" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function States() {
  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {states.map((s) => {
          const iosH = s.n === 1 ? 26 : s.n === 4 ? 0 : 40;
          return (
            <li key={s.n} className="min-w-0">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#e9ebf2] p-2.5" style={{ colorScheme: 'light' }}>
                <div className="h-[118px] overflow-hidden rounded-xl bg-white" role="img" aria-label={`iOS: ${s.name}`}>
                  <p className="px-2.5 pt-1.5 text-[9px] font-semibold text-black/50">iOS</p>
                  <div className="flex items-center justify-center" style={{ height: iosH }}>
                    {s.n !== 4 && <IosSpinner size={s.n === 1 ? 16 : 20} progress={s.progress} spinning={s.spinning} />}
                  </div>
                  {s.n === 4 && <p className="mx-2.5 mb-1.5 rounded bg-[#e8f1ff] px-1.5 py-1 text-[8px] font-medium text-[#007aff]">2 new stories</p>}
                  <Lines offset={0} />
                </div>
                <div className="relative h-[118px] overflow-hidden rounded-xl bg-[#fef7ff]" role="img" aria-label={`Android: ${s.name}`}>
                  <p className="px-2.5 pt-1.5 text-[9px] font-semibold text-black/50">Android</p>
                  <div className="pt-2">
                    <Lines offset={0} />
                  </div>
                  <span className="absolute left-1/2 -translate-x-1/2" style={{ top: s.n === 1 ? 16 : 30, opacity: s.n === 4 ? 0.9 : 1 }}>
                    <M3Indicator size={28} progress={s.progress} spinning={s.spinning} done={s.done} />
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{s.n}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted">{s.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-faint">On iOS the list itself moves down and the spinner sits in the gap. On Android the list stays still and a small disc slides down over it.</p>
    </div>
  );
}
