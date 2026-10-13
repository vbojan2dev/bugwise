import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { levelLabels, levelOrder, type LevelId } from './levels';

/** "Which level is this test?" classifier: 10 realistic test descriptions with instant feedback. */

type Item = { text: string; level: LevelId; why: string };

const items: Item[] = [
  {
    text: 'On the staging build, you log in to the food delivery app, add two pizzas, apply a coupon, pay with a test card and get the order confirmation.',
    level: 'system',
    why: 'The whole app, fully assembled, tested end to end the way a user would use it. That is system testing, and it is where most manual testers spend their day.',
  },
  {
    text: 'A developer checks that the function calculateDiscount(40.00, "SAVE10") returns 4.00. No database, no network, no screen.',
    level: 'unit',
    why: 'One small piece of code, tested on its own, in milliseconds. That is a unit test, usually written by the developer.',
  },
  {
    text: 'You send "apply coupon SAVE10" to the cart API in Postman and check the response contains the new total and a discount line.',
    level: 'integration',
    why: 'You are checking that two parts (the cart service and the coupon logic behind its API) work together correctly through their interface, without the app screen.',
  },
  {
    text: "The restaurant chain's marketing manager tries the new \"happy hour\" discount on a pre-release build and confirms it matches how their promotions really work.",
    level: 'acceptance',
    why: 'The business (the customer of the software) is deciding whether the product meets its needs. That is user acceptance testing (UAT).',
  },
  {
    text: 'You test the fitness app on an iPhone and an Android phone: sign up, log a run, force-close the app, reopen it and check the run is still in your history.',
    level: 'system',
    why: 'A complete user journey on the real, complete app across devices. Tests that need the whole system working are system tests.',
  },
  {
    text: "The travel app's backend calls an external currency service. A test checks the service's response still has the agreed field names and types.",
    level: 'integration',
    why: 'This is a contract test: it checks the agreement between two services. Contract and API tests are a form of integration testing.',
  },
  {
    text: 'Before go-live, the operations team checks that the banking app can be restored from backup, that alerts fire when a server goes down and that the support team can look up a customer.',
    level: 'acceptance',
    why: 'This is operational acceptance testing: is the product ready to be run and supported in the real world? It is acceptance, done by operations rather than end users.',
  },
  {
    text: 'After the payment service and the order service are deployed together, a test checks that one successful payment creates exactly one order.',
    level: 'integration',
    why: 'The focus is on the handover between two services. If the payment succeeds but the order is created twice (or not at all), the bug lives in the integration.',
  },
  {
    text: 'On the full staging build, you check that search results in the shopping site appear within 2 seconds on a throttled 4G connection.',
    level: 'system',
    why: 'Speed is a non-functional requirement, but it is still checked on the whole, assembled system. Non-functional tests can happen at any level, most often at system level.',
  },
  {
    text: 'Two weeks before launch, 300 employees use the new grocery app for their real weekly shopping and report anything that feels wrong.',
    level: 'acceptance',
    why: "Real users (here: the company's own staff) trying the product before release is alpha testing, a kind of acceptance testing. Outside users doing the same would be beta testing.",
  },
];

type State = { i: number; answer: LevelId | null; score: number; log: boolean[] };
const initial: State = { i: 0, answer: null, score: 0, log: [] };

export default function LevelsClassifier() {
  const [state, setState] = useState<State>(initial);
  const { i, answer, score, log } = state;
  const done = i >= items.length;
  const item = items[Math.min(i, items.length - 1)];

  const choose = (level: LevelId) =>
    setState((prev) => {
      if (prev.answer !== null || prev.i >= items.length) return prev;
      const ok = items[prev.i].level === level;
      return { ...prev, answer: level, score: prev.score + (ok ? 1 : 0), log: [...prev.log, ok] };
    });

  const next = () => setState((prev) => (prev.answer === null ? prev : { ...prev, i: prev.i + 1, answer: null }));
  const reset = () => setState(initial);

  const correct = answer !== null && answer === item.level;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">Which level is this test?</p>
        <p className="text-sm text-muted">Read each test and pick its level. You get an explanation either way.</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex gap-1" aria-hidden="true">
          {items.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                n < log.length ? (log[n] ? 'bg-ok' : 'bg-danger') : n === i ? 'bg-brand' : 'bg-subtle'
              }`}
            />
          ))}
        </div>

        {!done ? (
          <>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                Test {i + 1} of {items.length}
              </span>
              <span>Score: {score}</span>
            </div>
            <blockquote className="rounded-2xl border border-line bg-subtle p-4 text-base text-fg">{item.text}</blockquote>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Test level">
              {levelOrder.map((l) => {
                const isRight = answer !== null && l === item.level;
                const isPicked = answer === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => choose(l)}
                    disabled={answer !== null && !isRight && !isPicked}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isRight
                        ? 'border-ok/40 bg-ok-soft text-fg'
                        : isPicked
                          ? 'border-danger/40 bg-danger-soft text-fg'
                          : answer !== null
                            ? 'border-line bg-surface text-faint'
                            : 'border-line bg-surface text-fg hover:shadow-[0_0_0_1px_var(--line-strong)]'
                    }`}
                  >
                    {levelLabels[l]}
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              {answer !== null ? (
                <div className={`rounded-xl border p-3 text-sm text-fg ${correct ? 'border-ok/40 bg-ok-soft' : 'border-danger/40 bg-danger-soft'}`}>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {correct ? <Check size={16} className="text-ok" aria-hidden="true" /> : <X size={16} className="text-danger" aria-hidden="true" />}
                    {correct ? `Correct: ${levelLabels[item.level]} testing` : `It's ${levelLabels[item.level].toLowerCase()} testing`}
                  </p>
                  <p className="mt-1">{item.why}</p>
                  <button
                    type="button"
                    onClick={next}
                    className="mt-3 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {i === items.length - 1 ? 'See my score' : 'Next test'}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <p className="rounded-xl border border-ok/40 bg-ok-soft p-3 text-sm text-fg">
              <strong>
                {score} / {items.length}
              </strong>{' '}
              {score >= 9
                ? 'Excellent. You can tell the levels apart.'
                : score >= 6
                  ? 'Good work. Here are the ones you missed:'
                  : 'Keep going. Here are the ones you missed:'}
            </p>
            {log.some((ok) => !ok) ? (
              <ul className="space-y-2 text-sm">
                {items.map((it, n) =>
                  log[n] ? null : (
                    <li key={n} className="rounded-xl border border-line bg-subtle p-3 text-fg">
                      <span className="font-semibold">{levelLabels[it.level]}:</span> <span className="text-muted">{it.text}</span>
                    </li>
                  ),
                )}
              </ul>
            ) : null}
            <p className="text-sm text-muted">
              Quick rule of thumb: <strong className="text-fg">one piece of code</strong> = unit.{' '}
              <strong className="text-fg">The connection between pieces</strong> = integration.{' '}
              <strong className="text-fg">The whole app, end to end</strong> = system.{' '}
              <strong className="text-fg">"Is this what we need?" decided by the business or users</strong> = acceptance.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
