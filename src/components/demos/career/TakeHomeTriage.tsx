import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

/**
 * Exercise for "Take-Home Assignments": a candidate's raw notes from a 48-hour take-home on a
 * FoodDash web ordering site. Decide how each finding goes into the submission:
 * a full report at some severity, a one-line "other observations" entry, or not at all (ethics/scope).
 * The findings are invented for this exercise and are NOT the Capstone bugs.
 */

type Pick = 'critical' | 'major' | 'minor' | 'list' | 'drop';

const options: { key: Pick; label: string }[] = [
  { key: 'critical', label: 'Critical' },
  { key: 'major', label: 'Major' },
  { key: 'minor', label: 'Minor' },
  { key: 'list', label: 'One-liner' },
  { key: 'drop', label: 'Leave out' },
];
const labelOf = (p: Pick) => options.find((o) => o.key === p)!.label;

const findings: { note: string; answer: Pick; close?: Pick[]; why: string }[] = [
  {
    note: 'Paid with the test card, page said "Payment failed". Tapped Retry. Two charges in the test payment dashboard, one order.',
    answer: 'critical',
    why: 'Money taken twice is the classic Critical bug. It goes first in your summary, with exact steps, the test card used and a screenshot of both charges.',
  },
  {
    note: 'Search "pizza" (lowercase) finds 0 restaurants. "Pizza" finds 6.',
    answer: 'major',
    close: ['critical'],
    why: 'A core flow fails for most real users, who type in lowercase on phones. Major is the common call; there is a workaround (capital P) nobody would guess.',
  },
  {
    note: 'At 360 px width the cookie banner covers the Place order button and has no close button.',
    answer: 'major',
    close: ['critical'],
    why: 'Mobile visitors cannot finish an order. Report it with the viewport size, browser and a screenshot. Some teams would even call it Critical.',
  },
  {
    note: 'Order history shows dates as 10/03/2026 in the German version (expected 03.10.2026).',
    answer: 'minor',
    close: ['list'],
    why: 'Confusing, and on the 3rd of October it is genuinely ambiguous, but nothing is blocked. A short full report is fine; so is a clear one-liner.',
  },
  {
    note: 'Footer: "Delivey times may vary". Also "Privacy" link color slightly different from other links.',
    answer: 'list',
    close: ['minor'],
    why: 'Real but trivial. List them in an "Other observations" section, one line each. Ten full reports like this bury your important bugs.',
  },
  {
    note: 'Found /admin by guessing URLs. Tried admin/admin and a few common passwords. Did not get in.',
    answer: 'drop',
    why: 'This was not in scope, and guessing passwords is an attack, even on a test site. Do not do it. If you notice an exposed admin page without trying to log in, you may mention it neutrally as a question.',
  },
  {
    note: 'Wrote a script that sent 5,000 orders in a minute to check performance. Site was slow for an hour.',
    answer: 'drop',
    why: 'Load testing someone else\'s system without permission can hurt real users and their business. Never do it in a take-home unless the instructions ask for it, and then only on the environment they give you.',
  },
  {
    note: 'Profile photo upload accepts a 40 MB image; it takes about 30 seconds and then works.',
    answer: 'minor',
    close: ['list', 'major'],
    why: 'Slow and probably unintended (there may be no size limit), but it works. A short report with the file size and timing, marked Minor, is a good call.',
  },
];

const btnBase =
  'inline-flex min-w-0 items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

export default function TakeHomeTriage() {
  const [picks, setPicks] = useState<(Pick | null)[]>(() => findings.map(() => null));
  const answered = picks.filter(Boolean).length;
  const exact = picks.filter((p, i) => p === findings[i].answer).length;
  const near = picks.filter((p, i) => p && p !== findings[i].answer && findings[i].close?.includes(p)).length;
  const done = answered === findings.length;

  const order = findings
    .map((f, i) => ({ ...f, i }))
    .filter((f) => f.answer !== 'drop')
    .sort((a, b) => ['critical', 'major', 'minor', 'list'].indexOf(a.answer) - ['critical', 'major', 'minor', 'list'].indexOf(b.answer));

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Triage your take-home notes</p>
          <p className="text-sm text-muted">
            Raw notes from a 48-hour take-home on a FoodDash web ordering site. For each one: a full report (with a severity), a one-line mention, or leave it out?
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPicks(findings.map(() => null))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>
      <ol className="space-y-2.5 p-5">
        {findings.map((f, i) => {
          const pick = picks[i];
          const ok = pick === f.answer;
          const isNear = !!pick && !ok && !!f.close?.includes(pick);
          return (
            <li key={i} className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
              <p className="font-mono text-[13px] leading-relaxed break-words text-fg">
                <span className="font-sans font-semibold">Note {i + 1}.</span> {f.note}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5" role="group" aria-label={`Note ${i + 1}: how to report it`}>
                {options.map((o) => {
                  const isPick = pick === o.key;
                  let cls = 'border-line bg-surface text-muted hover:text-fg';
                  if (pick && o.key === f.answer) cls = 'border-ok bg-ok-soft text-fg';
                  else if (isPick && isNear) cls = 'border-warn bg-warn-soft text-fg';
                  else if (isPick) cls = 'border-danger bg-danger-soft text-fg';
                  return (
                    <button
                      key={o.key}
                      type="button"
                      aria-pressed={isPick}
                      onClick={() => setPicks((prev) => prev.map((p, n) => (n === i ? o.key : p)))}
                      className={`${btnBase} ${cls}`}
                    >
                      <span className="truncate">{o.label}</span>
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {pick && (
                  <p className="mt-2 flex gap-1.5 text-sm text-fg">
                    {ok || isNear ? (
                      <Check size={16} className={`mt-0.5 shrink-0 ${ok ? 'text-ok' : 'text-warn'}`} aria-label={ok ? 'Correct' : 'Close'} />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Not the best call" />
                    )}
                    <span className="min-w-0">
                      {ok && <strong>Good call. </strong>}
                      {isNear && <strong>Defensible. Most reviewers would pick {labelOf(f.answer)}. </strong>}
                      {!ok && !isNear && <strong>Better: {labelOf(f.answer)}. </strong>}
                      {f.why}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="border-t border-line px-5 py-4" aria-live="polite">
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              <strong>
                {exact} of {findings.length} match the model answer
                {near > 0 ? `, ${near} more are defensible` : ''}.
              </strong>{' '}
              Severity is a judgment call, so being one step off is normal. Leaving out the two attacks is the part that really matters.
            </p>
            <div className="rounded-2xl border border-line bg-subtle p-3">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Order in your submission</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-fg">
                {order.map((f) => (
                  <li key={f.i} className="min-w-0 break-words">
                    <span className="font-semibold">{labelOf(f.answer)}:</span> note {f.i + 1}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-sm text-muted">Most severe first, trivial ones grouped at the end, the out-of-bounds actions nowhere.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {answered} / {findings.length} decided. "One-liner" means a single line in an "Other observations" list instead of a full report.
          </p>
        )}
      </div>
    </div>
  );
}
