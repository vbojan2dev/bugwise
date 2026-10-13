import { useState } from 'react';
import { CircleAlert, CircleCheck, FileText, RotateCcw } from 'lucide-react';
import { CLAIMS } from './rtm';

/**
 * "Fair or misleading?": sentences from draft test summary reports for FoodDash 2.0.
 * The learner judges each one and gets an explanation with a better wording.
 */

export default function ReportClaimCheck() {
  const [picks, setPicks] = useState<Record<number, boolean>>({});
  const done = Object.keys(picks).length;
  const score = CLAIMS.filter((c, i) => picks[i] === c.fair).length;

  return (
    <div className="not-prose my-8 overflow-clip rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <FileText size={17} className="text-brand" aria-hidden="true" /> Fair or misleading?
        </p>
        <p className="text-sm text-muted">Sentences from draft summary reports for the FoodDash 2.0 run above (11 cases: 7 passed, 3 failed, 1 blocked). Would you sign each one?</p>
      </div>
      <ol className="divide-y divide-line">
        {CLAIMS.map((c, i) => {
          const pick = picks[i];
          const answered = pick !== undefined;
          const right = answered && pick === c.fair;
          return (
            <li key={c.text} className="p-4 sm:px-5">
              <p className="text-sm break-words text-fg">“{c.text}”</p>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`Claim ${i + 1}`}>
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={pick === v}
                    onClick={() => setPicks((prev) => ({ ...prev, [i]: v }))}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                      pick === v ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'
                    }`}
                  >
                    {v ? 'Fair' : 'Misleading'}
                  </button>
                ))}
              </div>
              {answered && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted" role="status">
                  {right ? <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-label="Correct" /> : <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" aria-label="Not quite" />}
                  <span>
                    <strong className="text-fg">{c.fair ? 'Fair. ' : 'Misleading. '}</strong>
                    {c.why}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-subtle px-5 py-3 text-sm">
        <span className="text-fg tabular-nums" aria-live="polite">
          {done} / {CLAIMS.length} judged{done ? ` · ${score} right` : ''}
        </span>
        {done > 0 && (
          <button
            type="button"
            onClick={() => setPicks({})}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={12} aria-hidden="true" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
