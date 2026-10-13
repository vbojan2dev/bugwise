import { useState } from 'react';
import { Check, X, RotateCcw, Ruler, CloudFog } from 'lucide-react';

/** Quick sorter: is this acceptance criterion testable as written? Feedback includes a measurable rewrite. */

interface Item {
  text: string;
  testable: boolean;
  why: string;
  rewrite?: string;
}

const items: Item[] = [
  {
    text: 'The checkout page should be user-friendly.',
    testable: false,
    why: '“User-friendly” means something different to everyone. Ask what friction the team wants to remove.',
    rewrite: 'Checkout has at most 3 screens, every field has a visible label, and errors appear next to the field that caused them.',
  },
  {
    text: 'Password must be 8 to 64 characters long.',
    testable: true,
    why: 'Clear limits. You can test 7, 8, 64 and 65 characters and every tester gets the same verdict.',
  },
  {
    text: 'The map should load quickly.',
    testable: false,
    why: '“Quickly” has no number and no conditions.',
    rewrite: 'On a 4G connection, map tiles for the current area are visible within 3 seconds of opening the Map tab.',
  },
  {
    text: 'If a transfer fails, the app shows “Transfer failed. No money was taken.” and the balance is unchanged.',
    testable: true,
    why: 'A specific trigger, the exact message and a checkable side effect (the balance).',
  },
  {
    text: 'Errors should be handled gracefully.',
    testable: false,
    why: 'Which errors? What does “gracefully” look like? You can’t fail it, so you can’t pass it.',
    rewrite: 'When the server is unreachable, the app shows “You’re offline. We’ll retry when you’re back online.” and keeps the user’s input.',
  },
  {
    text: 'A profile photo can be a JPG or PNG up to 5 MB.',
    testable: true,
    why: 'Formats and a size limit: test a 5 MB PNG, a 5.1 MB JPG and a GIF.',
  },
  {
    text: 'The app should work on all devices.',
    testable: false,
    why: '“All devices” is thousands of models. Nobody can ever finish testing it.',
    rewrite: 'Supported: iOS 17+ and Android 10+, phone screens from 360 dp wide. The device list for testing is in the test plan.',
  },
  {
    text: 'Tapping Pause stops the workout timer within 1 second.',
    testable: true,
    why: 'An action, an observable result and a time limit.',
  },
  {
    text: 'The new design should look modern.',
    testable: false,
    why: 'Taste, not a rule. Point to the approved design file instead.',
    rewrite: 'Screens match the approved Figma designs (v3) for spacing, colors and fonts on a 390 pt wide iPhone.',
  },
  {
    text: 'Only the account owner can see the Delete account button; family members can’t.',
    testable: true,
    why: 'A clear permission rule you can test with two accounts.',
  },
];

export default function TestableSorter() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => items.map(() => null));
  const score = answers.filter((a, i) => a === items[i].testable).length;
  const done = answers.every((a) => a !== null);

  const pick = (i: number, v: boolean) => setAnswers((prev) => (prev[i] !== null ? prev : prev.map((a, n) => (n === i ? v : a))));

  const btn = (i: number, v: boolean) => {
    const a = answers[i];
    const answered = a !== null;
    const right = items[i].testable === v;
    let cls = 'border-line text-fg hover:border-line-strong';
    if (answered && right) cls = 'border-ok bg-ok-soft text-fg';
    else if (answered && a === v) cls = 'border-danger bg-danger-soft text-fg';
    else if (answered) cls = 'border-line text-faint';
    return (
      <button
        type="button"
        aria-pressed={a === v}
        aria-disabled={answered}
        onClick={() => pick(i, v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${answered ? 'cursor-default' : ''} ${cls}`}
      >
        {v ? <Ruler size={13} aria-hidden="true" /> : <CloudFog size={13} aria-hidden="true" />}
        {v ? 'Testable' : 'Not testable'}
      </button>
    );
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Testable or not?</p>
          <p className="text-sm text-muted">Could two testers check this and always agree on Pass or Fail?</p>
        </div>
        <p className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-muted" aria-live="polite">
          Score {score} / {items.length}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {items.map((it, i) => {
          const a = answers[i];
          const answered = a !== null;
          const right = a === it.testable;
          return (
            <li key={it.text} className="space-y-2 px-5 py-3.5">
              <p className="text-sm font-medium text-fg">“{it.text}”</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Criterion ${i + 1}`}>
                {btn(i, true)}
                {btn(i, false)}
              </div>
              <div aria-live="polite">
                {answered && (
                  <div className="rounded-xl bg-subtle p-3 text-sm">
                    <p className={`flex items-center gap-1.5 font-semibold ${right ? 'text-ok' : 'text-danger'}`}>
                      {right ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
                      {right ? 'Correct' : 'Not quite'}: {it.testable ? 'testable' : 'not testable'}
                    </p>
                    <p className="mt-1 text-muted">{it.why}</p>
                    {it.rewrite && (
                      <p className="mt-1.5 text-fg">
                        <span className="font-semibold text-brand">Measurable rewrite: </span>
                        {it.rewrite}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {done && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
          <p className="min-w-0 flex-1 text-sm text-fg">
            {score === items.length ? 'Perfect. You can spot fog words like a pro.' : score >= 7 ? 'Nice work. Re-read the ones you missed.' : 'Watch for fog words: fast, easy, modern, gracefully, all.'}
          </p>
          <button
            type="button"
            onClick={() => setAnswers(items.map(() => null))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} aria-hidden="true" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}
