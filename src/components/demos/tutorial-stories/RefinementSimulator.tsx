import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, MessageCircleQuestion, RotateCcw, X, Users, ClipboardCheck } from 'lucide-react';

/**
 * Refinement simulator. The learner joins a "three amigos" meeting for a promo-code story:
 *  1. picks up to 4 clarifying questions (each rated high / medium / low value with feedback),
 *  2. hears the product owner's answers,
 *  3. chooses the best Given/When/Then rewrite for each weak criterion,
 *  4. sees the final, refined story.
 */

type Value = 'high' | 'medium' | 'low';

interface Question {
  q: string;
  value: Value;
  why: string;
  answer?: string;
}

const questions: Question[] = [
  {
    q: 'What should happen if the code has expired, is used up, or doesn’t apply to the items in the cart? One message or different ones?',
    value: 'high',
    why: 'Error paths. “Invalid codes show an error” hides at least three different situations, and users need to know which one they hit.',
    answer: 'Three messages: “This code has expired”, “This code has already been used” and “This code can’t be used with the items in your cart”. The total never changes on an error.',
  },
  {
    q: 'Is the discount taken before or after shipping? Can the total ever go below €0?',
    value: 'high',
    why: 'Limits and money. Calculation order changes every expected total you will write.',
    answer: 'The discount applies to the item subtotal only. Shipping is always charged. The item subtotal can’t go below €0.00.',
  },
  {
    q: 'If I remove items and the cart drops below the minimum spend, what happens to the applied code?',
    value: 'high',
    why: 'State changes after the happy path. This is a classic place for wrong totals at checkout.',
    answer: 'The code is removed automatically and the shopper sees “Promo removed: spend €30 to use SAVE10”.',
  },
  {
    q: 'Can a shopper use two codes at once, or a code on items already on sale?',
    value: 'high',
    why: 'Business rules and limits. Developers often assume “one code” but never write it down.',
    answer: 'One code per order. Codes don’t apply to sale items; the discount is calculated on full-price items only.',
  },
  {
    q: 'Are codes case-sensitive? Do we trim spaces when people paste a code from an email?',
    value: 'high',
    why: 'Input handling. Pasted codes with a trailing space are one of the most common real-world failures.',
    answer: 'Not case-sensitive, and leading or trailing spaces are trimmed. “ save10 ” works.',
  },
  {
    q: 'Is there a limit on wrong attempts, so nobody can guess codes with a script?',
    value: 'medium',
    why: 'Good security thinking. It may belong to a separate story, but asking now makes sure someone owns it.',
    answer: 'Good catch. After 5 wrong codes in 10 minutes, Apply is disabled for 10 minutes. We’ll make it its own story.',
  },
  {
    q: 'What does a screen reader announce when the discount is applied or an error appears?',
    value: 'medium',
    why: 'Accessibility. Errors that only change color or appear silently are easy to miss. Worth asking, often a short answer.',
    answer: 'The new total and any error are announced (live region). The error text is linked to the field.',
  },
  {
    q: 'What color should the Apply button be?',
    value: 'low',
    why: 'The design mockup already answers this. It doesn’t change behavior, so it wastes everyone’s meeting time.',
  },
  {
    q: 'Will you build this with a new microservice or in the existing checkout service?',
    value: 'low',
    why: 'An implementation detail for the developers. It doesn’t change what the user sees or what you test from the outside.',
  },
  {
    q: 'Will it work?',
    value: 'low',
    why: 'Not a clarifying question. It can’t be answered and doesn’t reveal any missing rule.',
  },
];

interface Rewrite {
  weak: string;
  options: { text: string; why: string }[];
  answer: number;
}

const rewrites: Rewrite[] = [
  {
    weak: 'A valid code gives a discount.',
    options: [
      {
        text: 'Given my cart has €40 of full-price items and SAVE10 gives 10% off orders over €30, When I apply SAVE10, Then the summary shows “Discount −€4.00” And the total drops by €4.00',
        why: 'Concrete data, one action and an outcome anyone can check. Two testers would agree on Pass or Fail.',
      },
      {
        text: 'Given I have a code, When I apply it, Then the discount works correctly',
        why: '“Works correctly” is the exact vagueness we wanted to remove. Which code? What discount? Shown where?',
      },
      {
        text: 'Given PromoService returns 200, When /apply is called, Then the discount column is updated in the database',
        why: 'This describes the implementation, not what the shopper experiences. Criteria should be written from the user’s point of view.',
      },
    ],
    answer: 0,
  },
  {
    weak: 'Invalid codes show an error.',
    options: [
      { text: 'Given I enter a wrong code, When I tap Apply, Then an error appears', why: 'Which error? Where? And what happens to the total? Still too vague to test.' },
      { text: 'Then all errors are handled gracefully', why: '“Gracefully” is untestable. There is no Given or When, and no observable result.' },
      {
        text: 'Given SUMMER23 expired on 31 August, When I apply it, Then I see “This code has expired” under the field And the total does not change',
        why: 'Uses the product owner’s answer: a specific situation, the exact message and a check that no money changed. Repeat the pattern for “used up” and “not valid for these items”.',
      },
    ],
    answer: 2,
  },
  {
    weak: 'It should be fast.',
    options: [
      { text: 'Then the app feels snappy when applying a code', why: '“Feels snappy” is an opinion. You can’t fail it, so you can’t pass it either.' },
      {
        text: 'Given I am on a normal 4G connection, When I tap Apply, Then a loading indicator appears And the new total or an error is shown within 2 seconds',
        why: 'Measurable: a condition, a number and what the user sees while waiting. The 2-second target is agreed with the team, not invented by the tester.',
      },
      { text: 'Then it is fast on all devices and all networks', why: '“Fast” has no number, and “all devices and all networks” can never be fully tested.' },
    ],
    answer: 1,
  },
];

const valueStyle: Record<Value, string> = {
  high: 'bg-ok-soft text-ok',
  medium: 'bg-warn-soft text-warn',
  low: 'bg-danger-soft text-danger',
};

const MAX = 4;

export default function RefinementSimulator() {
  const [step, setStep] = useState(0); // 0 = questions, 1 = answers, 2..4 = rewrites, 5 = summary
  const [picked, setPicked] = useState<number[]>([]);
  const [choices, setChoices] = useState<(number | null)[]>(() => rewrites.map(() => null));
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  const go = (n: number) => {
    moved.current = true;
    setStep(n);
  };

  const toggle = (i: number) =>
    setPicked((prev) => (prev.includes(i) ? prev.filter((p) => p !== i) : prev.length >= MAX ? prev : [...prev, i]));

  const restart = () => {
    setPicked([]);
    setChoices(rewrites.map(() => null));
    go(0);
  };

  const qScore = picked.reduce((s, i) => s + (questions[i].value === 'high' ? 2 : questions[i].value === 'medium' ? 1 : 0), 0);
  const rScore = choices.filter((c, i) => c === rewrites[i].answer).length;
  const stepLabels = ['Ask', 'Listen', 'Rewrite', 'Result'];
  const stage = step === 0 ? 0 : step === 1 ? 1 : step < 5 ? 2 : 3;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Users size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-fg">Refinement simulator</p>
            <p className="text-sm text-muted">You’re the tester in a three amigos meeting. Make the story testable.</p>
          </div>
        </div>
        <ol className="flex gap-1 text-xs font-semibold" aria-label="Progress">
          {stepLabels.map((l, i) => (
            <li
              key={l}
              aria-current={i === stage ? 'step' : undefined}
              className={`rounded-full px-2.5 py-1 ${i === stage ? 'bg-brand text-brand-fg' : i < stage ? 'bg-brand-soft text-brand' : 'bg-subtle text-muted'}`}
            >
              {l}
            </li>
          ))}
        </ol>
      </div>

      {/* The story card stays visible while the learner works */}
      {step < 5 && (
        <div className="border-b border-line bg-subtle px-5 py-4 text-sm">
          <p className="font-mono text-xs font-semibold text-faint">SHOP-219 · Apply a promo code</p>
          <p className="mt-1 text-fg">
            <strong>As a</strong> shopper, <strong>I want</strong> to apply a promo code at checkout <strong>so that</strong> I pay less for my order.
          </p>
          <p className="mt-2 text-xs font-semibold tracking-wide text-faint uppercase">Acceptance criteria (first draft)</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
            <li>The user can enter a promo code.</li>
            <li>A valid code gives a discount.</li>
            <li>Invalid codes show an error.</li>
            <li>It should be fast.</li>
          </ul>
        </div>
      )}

      <div className="p-5">
        {step === 0 && (
          <div className="space-y-4">
            <h4 ref={heading} tabIndex={-1} className="text-base font-semibold text-fg focus:outline-none">
              Step 1: The meeting has 15 minutes. Pick the {MAX} questions you’d ask.
            </h4>
            <p className="text-sm text-muted">
              Good questions uncover missing rules: errors, limits, state changes, permissions, accessibility. Selected: {picked.length}/{MAX}
            </p>
            <div className="grid grid-cols-1 gap-2" role="group" aria-label="Clarifying questions">
              {questions.map((q, i) => {
                const on = picked.includes(i);
                const full = !on && picked.length >= MAX;
                return (
                  <button
                    key={q.q}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={full}
                    onClick={() => toggle(i)}
                    className={`flex min-w-0 items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                      on ? 'border-brand bg-brand-soft text-fg' : full ? 'cursor-not-allowed border-line text-faint' : 'border-line text-fg hover:border-line-strong'
                    }`}
                  >
                    <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${on ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'}`}>
                      {on && <Check size={12} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">{q.q}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={() => go(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
            >
              <MessageCircleQuestion size={15} aria-hidden="true" /> Ask the product owner
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h4 ref={heading} tabIndex={-1} className="text-base font-semibold text-fg focus:outline-none">
              Step 2: The answers (and how valuable your questions were)
            </h4>
            <p className="text-sm text-muted">
              Question score: <strong className="text-fg">{qScore}</strong> / {MAX * 2} (high = 2, medium = 1, low = 0)
            </p>
            <ul className="space-y-2.5">
              {picked.map((i) => {
                const q = questions[i];
                return (
                  <li key={q.q} className="rounded-2xl border border-line bg-subtle p-3.5 text-sm">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${valueStyle[q.value]}`}>{q.value} value</span>
                      <p className="min-w-0 flex-1 font-semibold text-fg">{q.q}</p>
                    </div>
                    {q.answer && (
                      <p className="mt-2 text-fg">
                        <span className="font-semibold text-brand">Product owner:</span> {q.answer}
                      </p>
                    )}
                    <p className="mt-1.5 text-muted">
                      <span className="font-semibold text-fg">Why: </span>
                      {q.why}
                    </p>
                  </li>
                );
              })}
            </ul>
            {questions.some((q, i) => q.value === 'high' && !picked.includes(i)) && (
              <details className="rounded-2xl border border-line p-3.5 text-sm">
                <summary className="cursor-pointer font-semibold text-fg">High-value questions you didn’t ask</summary>
                <ul className="mt-2 space-y-2">
                  {questions.map((q, i) =>
                    q.value === 'high' && !picked.includes(i) ? (
                      <li key={q.q} className="text-muted">
                        <strong className="text-fg">{q.q}</strong> {q.answer}
                      </li>
                    ) : null,
                  )}
                </ul>
              </details>
            )}
            <button
              type="button"
              onClick={() => go(2)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Rewrite the criteria <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {step >= 2 && step < 5 && (() => {
          const idx = step - 2;
          const r = rewrites[idx];
          const pick = choices[idx];
          const answered = pick !== null;
          return (
            <div className="space-y-4">
              <h4 ref={heading} tabIndex={-1} className="text-base font-semibold text-fg focus:outline-none">
                Step 3 ({idx + 1}/{rewrites.length}): Pick the best rewrite of “{r.weak}”
              </h4>
              <div className="grid grid-cols-1 gap-2" role="group" aria-label="Rewrite options">
                {r.options.map((o, i) => {
                  const isAnswer = i === r.answer;
                  const isPick = i === pick;
                  let cls = 'border-line bg-surface text-fg hover:border-line-strong';
                  if (answered && isAnswer) cls = 'border-ok bg-ok-soft text-fg';
                  else if (answered && isPick) cls = 'border-danger bg-danger-soft text-fg';
                  else if (answered) cls = 'border-line bg-surface text-muted';
                  return (
                    <button
                      key={o.text}
                      type="button"
                      aria-pressed={isPick}
                      aria-disabled={answered}
                      onClick={() => setChoices((prev) => (prev[idx] !== null ? prev : prev.map((c, n) => (n === idx ? i : c))))}
                      className={`min-w-0 rounded-xl border px-3.5 py-2.5 text-left font-mono text-[13px] leading-relaxed transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${answered ? 'cursor-default' : ''} ${cls}`}
                    >
                      {o.text}
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {answered && (
                  <div className="space-y-3">
                    <p className={`flex items-center gap-1.5 font-semibold ${pick === r.answer ? 'text-ok' : 'text-danger'}`}>
                      {pick === r.answer ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
                      {pick === r.answer ? 'Correct' : 'Not quite'}
                    </p>
                    <ul className="space-y-1.5 rounded-2xl border border-line bg-subtle p-3.5 text-sm">
                      {r.options.map((o, i) => (
                        <li key={o.text} className={i === r.answer ? 'text-fg' : 'text-muted'}>
                          <strong className={i === r.answer ? 'text-ok' : 'text-fg'}>Option {String.fromCharCode(65 + i)}:</strong> {o.why}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => go(step + 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {idx === rewrites.length - 1 ? 'See the refined story' : 'Next criterion'} <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {step === 5 && (
          <div className="space-y-4">
            <h4 ref={heading} tabIndex={-1} className="flex items-center gap-2 text-base font-semibold text-fg focus:outline-none">
              <ClipboardCheck size={18} className="text-ok" aria-hidden="true" /> The refined story
            </h4>
            <p className="text-sm text-muted">
              Questions: <strong className="text-fg">{qScore}/{MAX * 2}</strong> · Rewrites: <strong className="text-fg">{rScore}/{rewrites.length}</strong>.{' '}
              {qScore >= 7 && rScore === 3
                ? 'Excellent refinement. This story is ready to build and test.'
                : 'Compare your choices with the model answer below, then try again.'}
            </p>
            <div className="rounded-2xl border border-line bg-subtle p-4 text-sm">
              <p className="font-mono text-xs font-semibold text-faint">SHOP-219 · Apply a promo code</p>
              <p className="mt-1 text-fg">
                <strong>As a</strong> shopper, <strong>I want</strong> to apply a promo code at checkout <strong>so that</strong> I pay less for my order.
              </p>
              <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Rules</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-fg">
                <li>One code per order. Codes are not case-sensitive; spaces are trimmed.</li>
                <li>The discount applies to full-price items only, never to shipping. The item subtotal can’t go below €0.00.</li>
                <li>If the cart drops below the code’s minimum spend, the code is removed with a message.</li>
              </ul>
              <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Scenarios</p>
              <div className="mt-1 space-y-2 font-mono text-[12.5px] leading-relaxed text-fg">
                {rewrites.map((r) => (
                  <p key={r.weak} className="rounded-xl border border-line bg-surface p-2.5">
                    {r.options[r.answer].text}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Split off: “Limit wrong promo code attempts” (new story SHOP-231).</p>
            </div>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={15} aria-hidden="true" /> Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
