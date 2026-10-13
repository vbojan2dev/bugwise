import { ArrowRight, Check } from 'lucide-react';
import { completePhase } from '@/lib/capstone';
import { href } from '@/lib/url';
import { fmtDate, useCapstone } from './useCapstone';

/** "I've read the brief" button. */
export default function BriefDone() {
  const state = useCapstone();
  const at = state?.phases.brief;
  return (
    <div className="not-prose card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{at ? 'Brief read. Nice.' : 'Done reading?'}</p>
        <p className="mt-1 text-sm text-muted">
          {at
            ? `Marked as read on ${fmtDate(at)}. Keep this page open in another tab while you test: the acceptance criteria are your oracle.`
            : 'Mark the brief as read and move on to your test plan. You can come back here any time.'}
        </p>
      </div>
      {at ? (
        <a href={href('/capstone/plan')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
          Write the test plan <ArrowRight size={18} aria-hidden />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => completePhase('brief')}
          disabled={!state}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90 disabled:opacity-50"
        >
          <Check size={18} aria-hidden /> I've read the brief
        </button>
      )}
    </div>
  );
}
