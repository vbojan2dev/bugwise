import { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

/**
 * "Find the gap": each requirement is laid out as a full decision table.
 * For every column the learner decides: covered by a rule, impossible, a gap (no rule says what happens)
 * or a conflict (two rules say different things). Teaches that decision tables expose requirement holes.
 */

type Verdict = 'covered' | 'impossible' | 'gap' | 'conflict';

const VERDICTS: { id: Verdict; label: string }[] = [
  { id: 'covered', label: 'Covered' },
  { id: 'impossible', label: 'Impossible' },
  { id: 'gap', label: 'Gap!' },
  { id: 'conflict', label: 'Conflict!' },
];

type Round = {
  title: string;
  rules: string[];
  conds: string[];
  cols: { vals: boolean[]; answer: Verdict; explain: string }[];
  lesson: string;
};

const ROUNDS: Round[] = [
  {
    title: 'Food delivery: canceling an order',
    rules: ['R1. Customers can cancel for free while the restaurant hasn’t accepted the order.', 'R2. If the restaurant has accepted the order but the courier hasn’t picked it up yet, canceling costs a €2.00 fee.'],
    conds: ['Restaurant accepted?', 'Courier picked up?'],
    cols: [
      {
        vals: [true, true],
        answer: 'gap',
        explain: 'The food is already on its way. Can the customer still cancel? Do they pay the full price? No rule says. Ask the product owner before anyone codes a guess.',
      },
      { vals: [true, false], answer: 'covered', explain: 'R2: accepted but not picked up, so canceling costs €2.00.' },
      {
        vals: [false, true],
        answer: 'impossible',
        explain: 'A courier can’t pick up an order the restaurant never accepted. No test case needed from the spec (though it’s fair to ask what happens if the data ever gets out of sync).',
      },
      { vals: [false, false], answer: 'covered', explain: 'R1: not accepted yet, so canceling is free.' },
    ],
    lesson: 'Writing out every combination made the missing case impossible to overlook. Most people reading R1 and R2 never notice that “after pickup” is not described.',
  },
  {
    title: 'Banking: sending a transfer',
    rules: [
      'R1. If the amount is within your balance and Face ID succeeds, the transfer is sent.',
      'R2. If the amount is more than your balance, show “Insufficient funds”.',
      'R3. If Face ID fails, ask for the PIN instead.',
    ],
    conds: ['Amount ≤ balance?', 'Face ID OK?'],
    cols: [
      { vals: [true, true], answer: 'covered', explain: 'R1: enough money and Face ID worked, so the transfer is sent.' },
      { vals: [true, false], answer: 'covered', explain: 'R3: Face ID failed, so ask for the PIN.' },
      { vals: [false, true], answer: 'covered', explain: 'R2: not enough money, so show “Insufficient funds”.' },
      {
        vals: [false, false],
        answer: 'conflict',
        explain: 'Both R2 (“Insufficient funds”) and R3 (“ask for the PIN”) apply, and they say different things. Which comes first? Asking for a PIN only to then say “no money” is annoying, but checking the balance first may leak information before authentication. The team must decide.',
      },
    ],
    lesson: 'A conflict is two rules that both match the same column but prescribe different actions. Developers will each pick their own order, and iOS and Android may end up behaving differently.',
  },
  {
    title: 'Fitness app: booking a class',
    rules: [
      'R1. Members can book a class that has free spots, up to 2 hours before it starts.',
      'R2. If the class is full, members can join the waitlist.',
      'R3. Non-members see “Join FitHub to book classes”.',
    ],
    conds: ['Member?', 'Free spots?', '2h+ before start?'],
    cols: [
      { vals: [true, true, true], answer: 'covered', explain: 'R1: a member, free spots, more than 2 hours to go: booking works.' },
      {
        vals: [true, true, false],
        answer: 'gap',
        explain: 'R1 hints that booking closes 2 hours before, but what does the member see? A disabled button? An error? Can they join the waitlist instead? Nothing is specified, so every platform will invent its own answer.',
      },
      { vals: [true, false, true], answer: 'covered', explain: 'R2: the class is full, so the member can join the waitlist.' },
      { vals: [true, false, false], answer: 'covered', explain: 'R2 has no time limit, so the member can still join the waitlist. (Worth a quick question, but the rule as written covers it.)' },
      { vals: [false, true, true], answer: 'covered', explain: 'R3: non-members always see “Join FitHub to book classes”.' },
      { vals: [false, true, false], answer: 'covered', explain: 'R3 applies to every non-member, whatever the spots or time.' },
      { vals: [false, false, true], answer: 'covered', explain: 'R3 applies to every non-member.' },
      { vals: [false, false, false], answer: 'covered', explain: 'R3 applies to every non-member.' },
    ],
    lesson: 'Gaps often hide behind words like “up to” or “only if”: the rule says when something is allowed, but not what happens otherwise.',
  },
];

export default function FindTheGap() {
  const [r, setR] = useState(0);
  const round = ROUNDS[r];
  const [picks, setPicks] = useState<(Verdict | null)[]>(() => ROUNDS[0].cols.map(() => null));
  const [checked, setChecked] = useState(false);

  const goTo = (i: number) => {
    setR(i);
    setPicks(ROUNDS[i].cols.map(() => null));
    setChecked(false);
  };

  const score = picks.filter((p, i) => p === round.cols[i].answer).length;
  const perfect = checked && score === round.cols.length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">🔍 Find the gap</p>
        <p className="text-sm text-muted">
          Each requirement is laid out as a full decision table. For every column, decide: is it covered by a rule, impossible, a <strong>gap</strong> (no rule says what
          happens) or a <strong>conflict</strong> (two rules disagree)?
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Round">
          {ROUNDS.map((x, i) => (
            <button
              key={x.title}
              type="button"
              aria-pressed={i === r}
              onClick={() => goTo(i)}
              className={`rounded-full border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                i === r ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'
              }`}
            >
              Round {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl border-l-4 border-brand bg-subtle p-3">
          <p className="mb-1 text-sm font-semibold text-fg">{round.title}</p>
          <ul className="space-y-1 text-sm text-fg">
            {round.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <ol className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {round.cols.map((col, i) => {
            const pick = picks[i];
            const right = pick === col.answer;
            return (
              <li
                key={i}
                className={`min-w-0 rounded-xl border p-2.5 sm:p-3 ${checked ? (right ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : 'border-line bg-surface'}`}
              >
                <p className="mb-2 text-xs font-semibold text-faint">Column {i + 1}</p>
                <dl className="mb-3 space-y-1 text-xs">
                  {round.conds.map((c, k) => (
                    <div key={c} className="flex items-center justify-between gap-2">
                      <dt className="min-w-0 text-muted">{c}</dt>
                      <dd className={`shrink-0 rounded px-1.5 font-mono font-bold ${col.vals[k] ? 'text-ok' : 'text-danger'}`}>{col.vals[k] ? 'Y' : 'N'}</dd>
                    </div>
                  ))}
                </dl>
                <div className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2" role="group" aria-label={`Verdict for column ${i + 1}`}>
                  {VERDICTS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={pick === v.id}
                      onClick={() => {
                        setChecked(false);
                        setPicks((prev) => prev.map((p, j) => (j === i ? v.id : p)));
                      }}
                      className={`min-w-0 truncate rounded-md border px-0.5 py-1 text-[10.5px] font-semibold sm:text-[11px] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        pick === v.id ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-fg'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                {checked && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-fg">
                    {right ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
                    <span>
                      {!right && <strong>{VERDICTS.find((v) => v.id === col.answer)!.label.replace('!', '')}. </strong>}
                      {col.explain}
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={picks.some((p) => p === null)}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            Check
          </button>
          <button
            type="button"
            onClick={() => goTo(r)}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={13} aria-hidden="true" /> Reset
          </button>
          {checked && r < ROUNDS.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(r + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-ok px-3 py-2 text-sm font-semibold text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              Next round <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
          {picks.some((p) => p === null) && <span className="text-xs text-faint">Give every column a verdict to check.</span>}
        </div>

        {checked && (
          <p className={`rounded-xl p-3 text-sm text-fg ${perfect ? 'bg-ok-soft' : 'bg-subtle'}`} role="status">
            <strong>
              {score}/{round.cols.length} correct.
            </strong>{' '}
            {round.lesson}
          </p>
        )}
      </div>
    </div>
  );
}
