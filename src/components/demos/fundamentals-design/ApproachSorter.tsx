import { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

/** "Which approach is this?" classifier: black box, grey box, white box or experience-based. */

type Kind = 'black' | 'grey' | 'white' | 'experience';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'black', label: 'Black box' },
  { id: 'grey', label: 'Grey box' },
  { id: 'white', label: 'White box' },
  { id: 'experience', label: 'Experience-based' },
];

const ITEMS: { text: string; answer: Kind; explain: string }[] = [
  {
    text: 'Using only the spec, you try order totals of €49.99, €50.00 and €50.01 to see exactly where the SAVE10 code starts working.',
    answer: 'black',
    explain: 'You only use the requirement and the visible result. This is boundary value analysis, a classic black-box technique.',
  },
  {
    text: 'After tapping Pay, you open the Network tab in DevTools and check that the request sends the amount in cents (4999) and not as 49.99.',
    answer: 'grey',
    explain: 'You test through the UI, but you use inside knowledge (the API request) to check what happens behind it. That is grey box.',
  },
  {
    text: 'A developer writes unit tests so that both the “if” and the “else” of the late-payment fee rule run at least once.',
    answer: 'white',
    explain: 'The tests are designed from the code structure, aiming at branch coverage. That is white box, usually done by developers.',
  },
  {
    text: 'Without a script, you spend 45 minutes on the new in-app chat: emojis, a 5,000-character message, airplane mode mid-send, rotating the phone.',
    answer: 'experience',
    explain: 'This is exploratory testing: you design and run tests on the fly, guided by curiosity and experience.',
  },
  {
    text: 'From the requirements, you list every combination of “member?”, “order ≥ €30?” and “rainy day?” and test each one.',
    answer: 'black',
    explain: 'A decision table built from the requirements. You never look inside the system, so it is black box.',
  },
  {
    text: 'Because apps often trip over apostrophes, you sign up as “Seán O’Brien” and check the name on the receipt.',
    answer: 'experience',
    explain: 'Error guessing: you use knowledge of typical mistakes developers make to choose a likely-to-fail input.',
  },
  {
    text: 'You cancel an order in the app, then query the test database to confirm the order’s status changed to CANCELED and the refund row was created.',
    answer: 'grey',
    explain: 'You act as a user but verify inside the system (the database). Partial inside knowledge = grey box.',
  },
  {
    text: 'Reading a pull request, you notice a new branch for “country == UK” that none of the existing tests execute, and design an input for it.',
    answer: 'white',
    explain: 'You chose the test because of a branch in the code that was not covered. That is white-box thinking, even when a tester does it.',
  },
  {
    text: 'Knowing the product list is cached for 5 minutes, you change a price in the admin panel and time how long the old price stays visible in the app.',
    answer: 'grey',
    explain: 'Knowledge of the architecture (a cache) shaped this test, but you still test from the outside. Grey box.',
  },
];

export default function ApproachSorter() {
  const [picks, setPicks] = useState<(Kind | null)[]>(() => ITEMS.map(() => null));
  const answered = picks.filter((p) => p !== null).length;
  const correct = picks.filter((p, i) => p === ITEMS[i].answer).length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Which approach is this?</p>
          <p className="text-sm text-muted">Pick the best fit for each test. You get instant feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-fg" aria-live="polite">
            {correct}/{ITEMS.length} correct
          </span>
          <button
            type="button"
            onClick={() => setPicks(ITEMS.map(() => null))}
            disabled={!answered}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
          >
            <RotateCcw size={12} aria-hidden="true" /> Reset
          </button>
        </div>
      </div>

      <ol className="divide-y divide-line">
        {ITEMS.map((item, i) => {
          const pick = picks[i];
          const right = pick === item.answer;
          return (
            <li key={i} className="space-y-2.5 px-5 py-4">
              <p className="text-sm text-fg">
                <span className="mr-1.5 font-mono text-xs text-faint">{i + 1}.</span>
                {item.text}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label={`Approach for test ${i + 1}`}>
                {KINDS.map((k) => {
                  const chosen = pick === k.id;
                  const isAnswer = pick !== null && k.id === item.answer;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => setPicks((prev) => prev.map((p, j) => (j === i ? k.id : p)))}
                      className={`min-w-0 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        isAnswer
                          ? 'border-ok bg-ok-soft text-fg'
                          : chosen
                            ? 'border-danger bg-danger-soft text-fg'
                            : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg'
                      }`}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
              {pick !== null && (
                <p className="flex items-start gap-2 text-sm text-muted" role="status">
                  {right ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
                  <span>
                    <strong className="text-fg">{right ? 'Correct.' : `Not quite, it’s ${KINDS.find((k) => k.id === item.answer)!.label.toLowerCase()}.`}</strong> {item.explain}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered === ITEMS.length && (
        <p className="border-t border-line bg-subtle px-5 py-3 text-sm text-fg">
          {correct === ITEMS.length
            ? 'Perfect score. The quick rule: where did the test idea come from? Requirements → black box. Code → white box. Inside knowledge used while testing from outside → grey box. Experience and intuition → experience-based.'
            : 'Tip: ask “where did this test idea come from?” Requirements → black box. Code → white box. Inside knowledge used while testing from outside → grey box. Experience and intuition → experience-based.'}
        </p>
      )}
    </div>
  );
}
