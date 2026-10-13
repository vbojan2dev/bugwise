import { ArrowRight, CircleCheckBig } from 'lucide-react';
import { completePhase } from '@/lib/capstone';
import { href } from '@/lib/url';
import { useCapstone } from './useCapstone';

/** "Finish testing" → completes the explore phase and links to the report. */
export default function FinishTesting({ compact = false }: { compact?: boolean }) {
  const state = useCapstone();
  const done = !!state?.phases.explore;
  const n = state?.reports.length ?? 0;

  if (done)
    return (
      <div className={compact ? '' : 'not-prose card flex flex-col gap-4 p-5 sm:flex-row sm:items-center'}>
        {!compact && (
          <p className="min-w-0 flex-1 text-sm text-muted">
            <strong className="text-fg">Session finished.</strong> You can keep testing and filing reports; they all count. When you're ready, write the summary.
          </p>
        )}
        <a href={href('/capstone/report')} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90 sm:w-auto">
          Write the summary report <ArrowRight size={18} aria-hidden />
        </a>
      </div>
    );

  const finish = () => {
    if (n === 0 && !confirm("You haven't filed any bug reports yet. Finish testing anyway?")) return;
    completePhase('explore');
  };

  return (
    <div className={compact ? '' : 'not-prose card flex flex-col gap-4 p-5 sm:flex-row sm:items-center'}>
      {!compact && (
        <p className="min-w-0 flex-1 text-sm text-muted">
          <strong className="text-fg">Done exploring?</strong> Finish the session to move on to your summary report. You can still come back and file more bugs later.
        </p>
      )}
      <button
        type="button"
        onClick={finish}
        disabled={!state}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand px-5 py-3 font-semibold text-brand hover:bg-brand-soft disabled:opacity-50 sm:w-auto"
      >
        <CircleCheckBig size={18} aria-hidden /> Finish testing
      </button>
    </div>
  );
}
