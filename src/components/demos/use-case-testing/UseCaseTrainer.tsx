import { useState } from 'react';
import { CheckCircle2, Circle, RotateCcw, XCircle } from 'lucide-react';
import UseCaseDoc, { REORDER } from './UseCaseDoc';

/**
 * Use case trainer for "Reorder a previous order".
 * Step 1: sort the product owner's notes into precondition / main step / alternative / exception / postcondition.
 * Step 2: pick test scenarios; the coverage panel shows which flows are covered and which alternative
 * and exception flows were missed, plus redundant and out-of-scope picks.
 */

type Kind = 'pre' | 'main' | 'alt' | 'exc' | 'post';
const KINDS: { id: Kind; label: string }[] = [
  { id: 'pre', label: 'Precondition' },
  { id: 'main', label: 'Main step' },
  { id: 'alt', label: 'Alternative' },
  { id: 'exc', label: 'Exception' },
  { id: 'post', label: 'Postcondition' },
];

const NOTES: { text: string; answer: Kind; why: string }[] = [
  { text: 'The customer is logged in and has at least one completed order.', answer: 'pre', why: 'It must already be true before the use case can start. Tests set it up; they don’t check it.' },
  { text: 'The customer opens Orders and taps Reorder on a past order.', answer: 'main', why: 'Step 1 of the happy path.' },
  { text: 'If the cart already has items from another restaurant, the app asks whether to replace them.', answer: 'alt', why: 'A different route that can still reach the goal (after Replace). Extension 1a.' },
  { text: 'If some dishes are sold out, the available ones are added and the missing ones are listed.', answer: 'alt', why: 'The customer still gets an order, just a smaller one. Extension 2a.' },
  { text: 'If the restaurant is closed, the app says when it opens and adds nothing.', answer: 'exc', why: 'The goal can’t be reached right now: the use case ends. Extension 2c.' },
  { text: 'The app adds the dishes to the cart at today’s prices and opens the cart.', answer: 'main', why: 'Step 3 of the happy path.' },
  { text: 'If prices changed since the original order, the cart shows a “Prices updated” notice.', answer: 'alt', why: 'A variation on the way to the same goal. Extension 3a.' },
  { text: 'If the card is declined, the app keeps the cart and asks for another payment method.', answer: 'exc', why: 'An error the system has to handle. The customer may recover, but the original path failed. Extension 5a.' },
  { text: 'The customer is charged once, and the original order is unchanged in the history.', answer: 'post', why: 'What must be true after success. Your tests should check it, not just the confirmation screen.' },
];

type Flow = { id: string; label: string; kind: 'main' | 'alt' | 'exc' | 'post' };
const FLOWS: Flow[] = [
  { id: 'MSS', label: 'Main success scenario', kind: 'main' },
  { id: '1a', label: '1a Cart has another restaurant’s items', kind: 'alt' },
  { id: '2a', label: '2a Some dishes sold out', kind: 'alt' },
  { id: '2b', label: '2b Every dish sold out', kind: 'exc' },
  { id: '2c', label: '2c Restaurant closed', kind: 'exc' },
  { id: '3a', label: '3a Prices changed', kind: 'alt' },
  { id: '5a', label: '5a Payment declined', kind: 'exc' },
  { id: 'POST', label: 'Postconditions checked (charged once, history unchanged)', kind: 'post' },
];

const SCENARIOS: { id: string; text: string; covers: string[]; note: string }[] = [
  { id: 'S1', text: 'Reorder a past order where everything is available and pay by card', covers: ['MSS'], note: 'The happy path, end to end.' },
  { id: 'S2', text: 'Same as above, but pay with Apple Pay', covers: ['MSS'], note: 'Only a data variation of the main flow. Useful if payment methods are risky, but it adds no new flow.' },
  { id: 'S3', text: 'Reorder while the cart holds a drink from another restaurant, choose Replace', covers: ['1a'], note: 'Covers extension 1a. Choosing Cancel would be a good extra test of the same extension.' },
  { id: 'S4', text: 'Reorder when 1 of 3 dishes is sold out, then place the order', covers: ['2a', 'MSS'], note: 'Covers 2a and finishes through the main flow.' },
  { id: 'S5', text: 'Reorder when every dish is sold out', covers: ['2b'], note: 'Covers exception 2b: nothing can be added, the cart stays as it was.' },
  { id: 'S6', text: 'Reorder from a restaurant that is closed right now', covers: ['2c'], note: 'Covers exception 2c.' },
  { id: 'S7', text: 'Reorder an order from last year after menu prices went up', covers: ['3a'], note: 'Covers 3a: the “Prices updated” notice and the new total.' },
  { id: 'S8', text: 'Reorder, pay with a card that is declined, then pay with another card', covers: ['5a', 'MSS'], note: 'Covers exception 5a and the recovery back into the main flow.' },
  { id: 'S9', text: 'After a successful reorder, check the bank statement and the original order in Orders', covers: ['POST'], note: 'Checks the postconditions: charged once, original order untouched.' },
  { id: 'S10', text: 'Change the profile photo', covers: [], note: 'Not part of this use case at all.' },
  { id: 'S11', text: 'Search the menu for a new dish and add it to the cart', covers: [], note: 'A different use case (“Order food”). It doesn’t exercise Reorder.' },
];

const flowColor = { main: 'text-ok', alt: 'text-info', exc: 'text-danger', post: 'text-brand' };

export default function UseCaseTrainer() {
  const [picks, setPicks] = useState<(Kind | null)[]>(() => NOTES.map(() => null));
  const [checked1, setChecked1] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [checked2, setChecked2] = useState(false);

  const score1 = picks.filter((p, i) => p === NOTES[i].answer).length;

  const coveredBy = (flow: string) => chosen.filter((id) => SCENARIOS.find((s) => s.id === id)!.covers.includes(flow));
  const coveredFlows = FLOWS.filter((f) => coveredBy(f.id).length > 0);
  const missed = FLOWS.filter((f) => coveredBy(f.id).length === 0);
  const flowsOnly = FLOWS.filter((f) => f.kind !== 'post');
  const flowCovered = flowsOnly.filter((f) => coveredBy(f.id).length > 0).length;

  // A pick is redundant when every flow it covers is also covered by an earlier pick.
  const redundant = chosen.filter((id, idx) => {
    const s = SCENARIOS.find((x) => x.id === id)!;
    if (!s.covers.length) return false;
    const earlier = chosen.slice(0, idx).flatMap((e) => SCENARIOS.find((x) => x.id === e)!.covers);
    return s.covers.every((c) => earlier.includes(c));
  });
  const outOfScope = chosen.filter((id) => SCENARIOS.find((s) => s.id === id)!.covers.length === 0);

  const toggleScenario = (id: string) => {
    setChecked2(false);
    setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <p className="font-semibold text-fg">🧭 Use case workshop: “Reorder a previous order”</p>
        <p className="text-sm text-muted">
          The product owner of a food delivery app sent you loose notes. First sort them into the parts of a use case, then choose test scenarios and see which flows you covered.
        </p>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        {/* Part 1 */}
        <section aria-labelledby="uc-part1">
          <h3 id="uc-part1" className="mb-1 text-sm font-semibold text-fg">
            Step 1 · Sort the notes
          </h3>
          <p className="mb-3 text-xs text-muted">Alternative = a different route that can still reach the goal. Exception = an error or condition that stops the normal path.</p>
          <ol className="space-y-2">
            {NOTES.map((n, i) => {
              const pick = picks[i];
              const right = pick === n.answer;
              return (
                <li
                  key={n.text}
                  className={`rounded-xl border p-3 ${checked1 ? (right ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : 'border-line'}`}
                >
                  <p className="text-sm text-fg">{n.text}</p>
                  <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={`Classify note ${i + 1}`}>
                    {KINDS.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        aria-pressed={pick === k.id}
                        onClick={() => {
                          setChecked1(false);
                          setPicks((prev) => prev.map((p, j) => (j === i ? k.id : p)));
                        }}
                        className={`rounded-md border px-2 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                          pick === k.id ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-fg'
                        }`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                  {checked1 && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-fg">
                      {right ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
                      <span>
                        {!right && <strong>{KINDS.find((k) => k.id === n.answer)!.label}. </strong>}
                        {n.why}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChecked1(true)}
              disabled={picks.some((p) => p === null)}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
            >
              Check
            </button>
            <button
              type="button"
              onClick={() => {
                setPicks(NOTES.map(() => null));
                setChecked1(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
            {picks.some((p) => p === null) ? (
              <span className="text-xs text-faint">Classify every note to check.</span>
            ) : (
              checked1 && (
                <span className="text-sm font-semibold text-fg" role="status">
                  {score1}/{NOTES.length} correct
                </span>
              )
            )}
          </div>
          {checked1 && (
            <div className="mt-3">
              <p className="text-sm text-fg">Here is the full use case the notes came from. Keep it in view for step 2.</p>
              <UseCaseDoc uc={REORDER} />
            </div>
          )}
        </section>

        {/* Part 2 */}
        <section aria-labelledby="uc-part2">
          <h3 id="uc-part2" className="mb-1 text-sm font-semibold text-fg">
            Step 2 · Build your test scenarios
          </h3>
          <p className="mb-3 text-xs text-muted">Pick the scenarios you would run. Aim to cover every flow and the postconditions without wasting tests.</p>
          <ul className="space-y-1.5">
            {SCENARIOS.map((s) => {
              const on = chosen.includes(s.id);
              const isRed = checked2 && redundant.includes(s.id);
              const isOut = checked2 && outOfScope.includes(s.id);
              return (
                <li key={s.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-sm ${
                      isOut ? 'border-danger bg-danger-soft' : isRed ? 'border-warn bg-warn-soft' : on ? 'border-brand bg-brand-soft' : 'border-line'
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleScenario(s.id)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
                    <span className="min-w-0">
                      <span className="text-fg">
                        <span className="font-mono text-xs text-faint">{s.id}</span> {s.text}
                      </span>
                      {checked2 && on && (
                        <span className="mt-0.5 block text-xs text-muted">
                          {isOut ? 'Out of scope. ' : isRed ? 'Redundant for flow coverage. ' : ''}
                          {s.note}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChecked2(true)}
              disabled={chosen.length === 0}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
            >
              Check coverage
            </button>
            <button
              type="button"
              onClick={() => {
                setChosen([]);
                setChecked2(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
            <span className="text-xs text-faint">{chosen.length} selected</span>
          </div>

          {checked2 && (
            <div className="mt-3 space-y-3" role="status">
              <div className="rounded-xl border border-line p-3">
                <p className="text-sm font-semibold text-fg">
                  Flow coverage: {flowCovered} of {flowsOnly.length} flows ({Math.round((flowCovered / flowsOnly.length) * 100)}%)
                </p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(flowCovered / flowsOnly.length) * 100}%` }} />
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {FLOWS.map((f) => {
                    const by = coveredBy(f.id);
                    return (
                      <li key={f.id} className="flex min-w-0 items-start gap-1.5 text-xs text-fg">
                        {by.length ? (
                          <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${flowColor[f.kind]}`} aria-hidden="true" />
                        ) : (
                          <Circle size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          {f.label}
                          <span className="text-faint"> {by.length ? `(${by.join(', ')})` : '(not covered)'}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {missed.length > 0 ? (
                <div className="rounded-xl bg-danger-soft p-3 text-sm text-fg">
                  <p className="font-semibold">You missed:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {missed.map((f) => (
                      <li key={f.id}>
                        {f.kind === 'alt' ? 'Alternative flow ' : f.kind === 'exc' ? 'Exception flow ' : ''}
                        {f.label}
                        {f.kind === 'exc' && ' (exception flows are where error handling bugs hide)'}
                        {f.kind === 'post' && ': a confirmation screen alone doesn’t prove the customer was charged once'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-xl bg-ok-soft p-3 text-sm text-fg">
                  <strong>Full flow coverage.</strong> Every flow and the postconditions are tested
                  {redundant.length + outOfScope.length === 0 ? ' with no wasted picks. ' : '. '}
                  The smallest complete set here is 7 scenarios: S3, S4, S5, S6, S7, S8 and S9 (S4 and S8 already pass through the main flow).
                </p>
              )}
              {(redundant.length > 0 || outOfScope.length > 0) && (
                <p className="rounded-xl bg-warn-soft p-3 text-sm text-fg">
                  {redundant.length > 0 && (
                    <>
                      <strong>{redundant.join(', ')}</strong> add no new flow. That’s fine for important data variations, but don’t confuse more tests with more coverage.{' '}
                    </>
                  )}
                  {outOfScope.length > 0 && (
                    <>
                      <strong>{outOfScope.join(', ')}</strong> {outOfScope.length === 1 ? 'belongs' : 'belong'} to other use cases.
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
