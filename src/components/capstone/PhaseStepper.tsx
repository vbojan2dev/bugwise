import { Check } from 'lucide-react';
import type { PhaseId } from '@/lib/capstone';
import { href } from '@/lib/url';
import { PHASES } from './phases';
import { useCapstone } from './useCapstone';

/** The 5-phase stepper shown on every capstone page, with a gentle nudge when earlier phases are open. */
export default function PhaseStepper({ current }: { current?: PhaseId | 'results' }) {
  const state = useCapstone();
  const done = (id: PhaseId) => !!state?.phases[id];
  const idx = PHASES.findIndex((p) => p.id === current);
  const missing = idx > 0 && state ? PHASES.slice(0, idx).filter((p) => !done(p.id)) : [];
  const completed = state ? PHASES.filter((p) => done(p.id)).length : 0;

  return (
    <nav aria-label="Capstone phases" className="not-prose">
      <ol className="grid grid-cols-5 gap-1 sm:gap-2">
        {PHASES.map((p) => {
          const isDone = done(p.id);
          const isCurrent = p.id === current;
          return (
            <li key={p.id} className="min-w-0">
              <a
                href={href(p.path)}
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'group flex h-full flex-col items-center gap-1.5 rounded-xl border px-1 py-2 text-center transition-colors sm:flex-row sm:gap-2.5 sm:px-3 sm:text-left',
                  isCurrent ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-line-strong',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                    isDone ? 'bg-ok text-white' : isCurrent ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted ring-1 ring-line',
                  ].join(' ')}
                >
                  {isDone ? <Check size={15} strokeWidth={3} aria-hidden /> : p.n}
                </span>
                <span className="min-w-0">
                  <span className={['block truncate text-[11px] font-semibold sm:text-sm', isCurrent ? 'text-brand' : 'text-fg'].join(' ')}>{p.short}</span>
                  <span className="hidden text-xs text-faint sm:block">{isDone ? 'Done' : isCurrent ? 'You are here' : p.minutes}</span>
                </span>
                <span className="sr-only">{isDone ? ' (done)' : ' (not done yet)'}</span>
              </a>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle ring-1 ring-line" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-[width] duration-500" style={{ width: `${(completed / PHASES.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted tabular-nums">
          {completed}/{PHASES.length} phases done
        </span>
      </div>
      {missing.length > 0 && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-fg">
          <strong>Tip:</strong> you haven't finished{' '}
          {missing.map((p, i) => (
            <span key={p.id}>
              {i > 0 && (i === missing.length - 1 ? ' and ' : ', ')}
              <a className="font-medium text-brand underline" href={href(p.path)}>
                {p.title.toLowerCase()}
              </a>
            </span>
          ))}{' '}
          yet. You can carry on here, but real testers work in this order for a reason: each step feeds the next.
        </p>
      )}
    </nav>
  );
}
