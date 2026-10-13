import { useState } from 'react';
import { Check, ClipboardCheck, RotateCcw, Users, X } from 'lucide-react';

/** "Verification or validation?" card sorter with instant feedback per card. */

type Answer = 'verification' | 'validation';

const cards: { text: string; answer: Answer; why: string }[] = [
  {
    text: 'Reading the user story for bank transfers and noticing the acceptance criteria never say what happens above the daily limit.',
    answer: 'verification',
    why: 'You are reviewing a work product (the story) for gaps and contradictions before any code exists. That is static testing, a form of verification.',
  },
  {
    text: 'Running test case TC-014: "Coupon SAVE10 reduces the subtotal by 10%" and comparing the result with the acceptance criteria.',
    answer: 'verification',
    why: 'You are checking the built product against what the spec says. The question is "did we build it as specified?".',
  },
  {
    text: 'Watching five real customers try to reorder their last meal, and noting where they hesitate or give up.',
    answer: 'validation',
    why: 'This is usability testing with real people. It answers "does this actually work for our users?", whatever the spec says.',
  },
  {
    text: 'A design walkthrough: the tester, designer and developer step through the checkout mock-ups and compare them with the requirements.',
    answer: 'verification',
    why: 'A walkthrough is a review technique. You check that the design matches the requirements, before building it.',
  },
  {
    text: 'The bank\'s branch staff try the new standing-order feature with their everyday customer cases during user acceptance testing (UAT).',
    answer: 'validation',
    why: 'UAT asks the people the product is for to confirm it meets their real needs. That is validation.',
  },
  {
    text: 'A beta build goes to 200 runners. Many ask for a "pause workout" button that nobody had written in any requirement.',
    answer: 'validation',
    why: 'Beta feedback shows whether the product fits real use. Here it reveals a missing need: the spec itself was incomplete.',
  },
  {
    text: 'A developer reviews a colleague\'s code change for the delivery-fee calculation before it is merged.',
    answer: 'verification',
    why: 'A code review is static testing: checking a work product against rules and the design without running the app.',
  },
  {
    text: 'Checking that the password field rejects "abc12" because the acceptance criteria say "at least 8 characters".',
    answer: 'verification',
    why: 'The pass/fail rule comes straight from the specification. You are verifying the product does what was written.',
  },
  {
    text: 'Two weeks after launch, reading app-store reviews and support tickets to see whether "Split the bill" really solves the problem it was built for.',
    answer: 'validation',
    why: 'You are checking whether the feature meets real users\' needs in real life, not whether it matches the spec.',
  },
  {
    text: 'At the sprint review, the product owner tries the new "Favorites" screen and asks: "Is this what our customers asked for?"',
    answer: 'validation',
    why: 'The question is about the right product for the customer, not about matching a document line by line.',
  },
];

export default function VVSorter() {
  const [picks, setPicks] = useState<(Answer | null)[]>(() => cards.map(() => null));
  const answered = picks.filter(Boolean).length;
  const score = picks.filter((p, i) => p === cards[i].answer).length;

  const pick = (i: number, a: Answer) => setPicks((prev) => (prev[i] ? prev : prev.map((p, n) => (n === i ? a : p))));

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">Verification or validation?</p>
        <p className="text-sm text-muted">Sort each activity. Ask yourself: is it checked against a spec, or against what real users need?</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line bg-subtle px-5 py-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <ClipboardCheck size={14} className="text-info" aria-hidden="true" /> <strong className="text-fg">Verification:</strong> built right?
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-ok" aria-hidden="true" /> <strong className="text-fg">Validation:</strong> right product?
        </span>
        <span className="ml-auto font-semibold" aria-live="polite">
          {answered} / {cards.length} sorted · {score} correct
        </span>
      </div>
      <ol className="space-y-2.5 p-4 sm:p-5">
        {cards.map((c, i) => {
          const p = picks[i];
          const ok = p === c.answer;
          return (
            <li key={i} className={`rounded-2xl border p-3.5 ${p ? (ok ? 'border-ok/50' : 'border-danger/50') : 'border-line'}`}>
              <p className="text-sm text-fg">
                <span className="mr-1.5 font-semibold text-faint">{i + 1}.</span>
                {c.text}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2" role="group" aria-label={`Activity ${i + 1}`}>
                {(['verification', 'validation'] as Answer[]).map((a) => {
                  const isPick = p === a;
                  const isRight = a === c.answer;
                  let cls = 'border-line bg-surface text-fg hover:border-line-strong';
                  if (p && isRight) cls = 'border-ok bg-ok-soft text-fg';
                  else if (p && isPick) cls = 'border-danger bg-danger-soft text-fg';
                  else if (p) cls = 'border-line bg-surface text-faint';
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={isPick}
                      aria-disabled={!!p}
                      onClick={() => pick(i, a)}
                      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-sm font-semibold capitalize transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${p ? 'cursor-default' : ''} ${cls}`}
                    >
                      {a === 'verification' ? <ClipboardCheck size={15} aria-hidden="true" /> : <Users size={15} aria-hidden="true" />}
                      {a}
                    </button>
                  );
                })}
              </div>
              {p && (
                <p className="mt-2.5 flex gap-1.5 text-sm leading-relaxed text-fg">
                  {ok ? <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <X size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
                  <span className="min-w-0">
                    <span className="sr-only">{ok ? 'Correct. ' : 'Not quite. '}</span>
                    <strong className="capitalize">{c.answer}.</strong> {c.why}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered === cards.length && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-5 py-4">
          <p className="text-sm font-semibold text-fg">
            {score} of {cards.length} correct.{' '}
            <span className="font-normal text-muted">
              {score === cards.length ? 'Spot on.' : 'Tip: if the pass/fail rule comes from a document, it is verification. If it comes from people\'s needs, it is validation.'}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setPicks(cards.map(() => null))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
