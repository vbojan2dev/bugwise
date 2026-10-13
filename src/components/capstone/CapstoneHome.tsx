import { useState } from 'react';
import { ArrowRight, Check, Clock, RotateCcw, Trophy } from 'lucide-react';
import { resetCapstone } from '@/lib/capstone';
import { href } from '@/lib/url';
import { PHASES, RESULTS_PATH } from './phases';
import { fmtDate, useCapstone } from './useCapstone';

/** Overview island: phase cards with saved status, Start/Continue and Reset. */
export default function CapstoneHome() {
  const state = useCapstone();
  const [flash, setFlash] = useState('');
  const started = !!state && (!!state.startedAt || Object.keys(state.phases).length > 0);
  const doneCount = state ? PHASES.filter((p) => state.phases[p.id]).length : 0;
  const next = state ? PHASES.find((p) => !state.phases[p.id]) : PHASES[0];
  const cta = !started
    ? { label: 'Start the capstone', to: PHASES[0].path }
    : next
      ? { label: `Continue: ${next.title}`, to: next.path }
      : { label: 'See your results', to: RESULTS_PATH };

  const reset = () => {
    if (confirm('Reset the capstone? Your test plan, test cases, bug reports, final report and certificate name will be deleted from this browser. This cannot be undone.')) {
      resetCapstone();
      setFlash('Capstone reset. You can start fresh.');
      setTimeout(() => setFlash(''), 4000);
    }
  };

  return (
    <div className="not-prose space-y-6">
      <ol className="grid grid-cols-1 gap-3">
        {PHASES.map((p) => {
          const at = state?.phases[p.id];
          const isNext = started && next?.id === p.id;
          return (
            <li key={p.id} className="min-w-0">
              <a
                href={href(p.path)}
                className={[
                  'card group flex min-w-0 items-start gap-4 p-4 transition-colors hover:border-line-strong sm:p-5',
                  isNext ? 'ring-2 ring-brand/40' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold',
                    at ? 'bg-ok text-white' : isNext ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted ring-1 ring-line',
                  ].join(' ')}
                >
                  {at ? <Check size={18} strokeWidth={3} aria-hidden /> : p.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold group-hover:text-brand">
                      {p.n}. {p.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-faint">
                      <Clock size={12} aria-hidden /> {p.minutes}
                    </span>
                    {at && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">Done {fmtDate(at)}</span>}
                    {isNext && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Up next</span>}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{p.summary}</span>
                </span>
                <ArrowRight size={18} className="mt-2 hidden shrink-0 text-faint group-hover:text-brand sm:block" aria-hidden />
              </a>
            </li>
          );
        })}
        <li>
          <a href={href(RESULTS_PATH)} className="card group flex items-start gap-4 p-4 hover:border-line-strong sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
              <Trophy size={18} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold group-hover:text-brand">Results and certificate</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">Your scorecard: bugs found by category, how well you rated them, hints for what you missed, and a printable certificate.</span>
            </span>
          </a>
        </li>
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href={href(cta.to)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg shadow-soft hover:opacity-90">
          {cta.label} <ArrowRight size={18} aria-hidden />
        </a>
        {started && (
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium text-muted hover:border-danger hover:text-danger">
            <RotateCcw size={16} aria-hidden /> Reset capstone
          </button>
        )}
        <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
          {flash ||
            (state && started
              ? `${doneCount} of ${PHASES.length} phases done · ${state.reports.length} bug report${state.reports.length === 1 ? '' : 's'} filed`
              : 'Saved in this browser only. No sign-up.')}
        </p>
      </div>
    </div>
  );
}
