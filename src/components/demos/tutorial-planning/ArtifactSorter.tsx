import { useState } from 'react';
import { Check, ClipboardList, FileText, ListChecks, RotateCcw, X } from 'lucide-react';

/**
 * Exercise for "Test Scenarios vs Test Cases vs Checklists".
 * Part 1: sort a mixed pile of items for FoodDash "Reorder" into scenario / test case / checklist item.
 * Part 2: pick the artifact that fits five workplace situations.
 */

type Kind = 'scenario' | 'case' | 'check';

const kinds: { key: Kind; label: string; icon: typeof FileText }[] = [
  { key: 'scenario', label: 'Scenario', icon: FileText },
  { key: 'case', label: 'Test case', icon: ClipboardList },
  { key: 'check', label: 'Checklist item', icon: ListChecks },
];
const labelOf = (k: Kind) => kinds.find((x) => x.key === k)!.label;

const items: { text: string; answer: Kind; why: string }[] = [
  {
    text: 'Reorder when the restaurant is closed',
    answer: 'scenario',
    why: 'A one-line situation worth testing. It says what to test, not how, and will turn into a few test cases.',
  },
  {
    text: 'Precondition: order #1042 delivered 3 days ago (Margherita, no olives). Steps: 1. Open Orders 2. Tap Reorder on #1042. Expected: cart opens with 1 × Margherita (no olives) at today\'s price.',
    answer: 'case',
    why: 'It has a precondition, exact data, numbered steps and an expected result you can pass or fail.',
  },
  {
    text: 'Reorder button is readable in dark mode',
    answer: 'check',
    why: 'A short check you tick off. No steps, no data: an experienced tester knows how to switch to dark mode and look.',
  },
  {
    text: 'Customer reorders while the cart already has items from another restaurant',
    answer: 'scenario',
    why: 'A situation (a user journey with a twist). Several cases follow: tap Cancel, tap Start new, same restaurant.',
  },
  {
    text: 'Steps: 1. Add a burger from Burger Bros 2. Open Orders 3. Tap Reorder on a Sushi Go order. Expected: dialog "Start a new cart?" with Cancel and Start new. Cancel keeps the burger.',
    answer: 'case',
    why: 'Concrete steps and a precise expected result, including what Cancel must do.',
  },
  {
    text: 'Extras and notes (e.g. "no onions") are kept after reorder',
    answer: 'check',
    why: 'A short statement you verify as you go. It could also become a test case, but as written it is a checklist line.',
  },
  {
    text: 'Reorder an order where every item is sold out',
    answer: 'scenario',
    why: 'An edge situation to explore. It names what to test and leaves the how to the test cases.',
  },
  {
    text: 'Reorder button is at least 44 × 44 pt on iOS',
    answer: 'check',
    why: 'A quick property check (Apple\'s minimum touch target). Perfect for a UI checklist.',
  },
  {
    text: 'Data: order #2210 delivered 90 days ago, order #2211 delivered 91 days ago. Steps: open Orders and scroll to both. Expected: Reorder shows on #2210 only.',
    answer: 'case',
    why: 'Exact boundary data (90 vs 91 days), steps and an unambiguous expected result.',
  },
  {
    text: 'Cart badge shows the new item count',
    answer: 'check',
    why: 'A one-line check with an obvious answer once you are on the screen. Typical checklist material.',
  },
];

const situations: { text: string; answer: Kind; why: Record<Kind, string> }[] = [
  {
    text: 'Banking app. Auditors want proof of exactly what was tested for the new daily transfer limit, step by step, with results.',
    answer: 'case',
    why: {
      case: 'Right. Regulated work needs repeatable steps, exact data and a recorded result for every check.',
      scenario: 'Scenarios show what you meant to test, but not how or what happened. Auditors need detail.',
      check: 'Ticked boxes without steps or expected results are rarely enough evidence for an audit.',
    },
  },
  {
    text: 'Refinement meeting tomorrow. The product owner wants to agree what will be covered for the new Reorder story before anyone writes detailed tests.',
    answer: 'scenario',
    why: {
      scenario: 'Right. A one-page list of scenarios is fast to read and easy to argue about. Details come after you agree.',
      case: 'Too early and too slow. If the story changes in the meeting, your detailed cases are wasted.',
      check: 'A checklist helps you run tests, but it is not the best tool to agree on coverage with a product owner.',
    },
  },
  {
    text: 'Startup, two releases a week. An experienced tester does a 10-minute check of the settings screen on every build.',
    answer: 'check',
    why: {
      check: 'Right. The tester knows the app, so a list of things to look at is enough and quick to keep current.',
      case: 'Writing and updating full cases for a 10-minute check that runs twice a week costs more than it saves.',
      scenario: 'Scenarios are too vague for a repeatable check. You want a concrete list to tick.',
    },
  },
  {
    text: 'A new tester joins next week and must run the release regression of the payment flow alone.',
    answer: 'case',
    why: {
      case: 'Right. Someone new does not know where things are or what "correct" looks like. Detailed cases teach and guide them.',
      check: 'A checklist assumes you already know the app. A new person would guess, and different guesses mean different results.',
      scenario: 'One-liners leave a newcomer with too many open questions in a risky flow.',
    },
  },
  {
    text: 'You are about to explore Reorder for 60 minutes and want reminders like rotation, interruptions, slow network and dark mode.',
    answer: 'check',
    why: {
      check: 'Right. A heuristics checklist is a memory aid for exploratory testing. It keeps you curious without scripting you.',
      case: 'Scripted steps would turn exploration into following a recipe. That is not the goal of this session.',
      scenario: 'Scenarios could set the mission, but the reminders themselves are a checklist.',
    },
  },
];

const btnBase =
  'inline-flex min-w-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

export default function ArtifactSorter() {
  const [sorted, setSorted] = useState<(Kind | null)[]>(() => items.map(() => null));
  const [checked, setChecked] = useState(false);
  const [picks, setPicks] = useState<(Kind | null)[]>(() => situations.map(() => null));

  const sortScore = sorted.filter((s, i) => s === items[i].answer).length;
  const allSorted = sorted.every((s) => s !== null);
  const sitScore = picks.filter((p, i) => p === situations[i].answer).length;
  const sitDone = picks.every((p) => p !== null);

  const reset = () => {
    setSorted(items.map(() => null));
    setChecked(false);
    setPicks(situations.map(() => null));
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Sort the Reorder pile</p>
          <p className="text-sm text-muted">A teammate dumped everything for FoodDash "Reorder" into one document. Sort it out.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>

      {/* Part 1 */}
      <section className="space-y-3 p-5" aria-labelledby="sorter-p1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="sorter-p1" className="text-base font-semibold text-fg">
            Part 1 · Scenario, test case or checklist item?
          </h3>
          <p className="text-xs text-muted">
            {sorted.filter(Boolean).length} / {items.length} sorted
          </p>
        </div>
        <ol className="space-y-2.5">
          {items.map((it, i) => {
            const pick = sorted[i];
            const right = pick === it.answer;
            return (
              <li
                key={i}
                className={`min-w-0 rounded-2xl border p-3 ${
                  checked && pick ? (right ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : 'border-line bg-subtle'
                }`}
              >
                <p className="text-sm break-words text-fg">{it.text}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label={`Item ${i + 1}: choose a type`}>
                  {kinds.map((k) => {
                    const on = pick === k.key;
                    const Icon = k.icon;
                    return (
                      <button
                        key={k.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setChecked(false);
                          setSorted((prev) => prev.map((p, n) => (n === i ? k.key : p)));
                        }}
                        className={`${btnBase} ${on ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-surface text-muted hover:text-fg'}`}
                      >
                        <Icon size={13} aria-hidden="true" className="hidden shrink-0 sm:block" />
                        <span className="truncate">{k.label}</span>
                      </button>
                    );
                  })}
                </div>
                {checked && pick && (
                  <p className="mt-2 text-sm text-fg">
                    <strong className={right ? 'text-ok' : 'text-danger'}>{right ? 'Correct.' : `It's a ${labelOf(it.answer).toLowerCase()}.`}</strong> {it.why}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={!allSorted}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Check size={15} aria-hidden="true" /> Check my sorting
          </button>
          <p className="text-sm text-muted" aria-live="polite">
            {checked
              ? `${sortScore} of ${items.length} right. ${
                  sortScore === items.length
                    ? 'Spot on: you can tell them apart by their shape.'
                    : 'Tip: look at the shape. Steps + data + expected = test case. A situation = scenario. A short statement to tick = checklist item.'
                }`
              : allSorted
                ? 'All sorted. Check when ready.'
                : 'Sort every item to check your answers.'}
          </p>
        </div>
      </section>

      {/* Part 2 */}
      <section className="space-y-3 border-t border-line p-5" aria-labelledby="sorter-p2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="sorter-p2" className="text-base font-semibold text-fg">
            Part 2 · Which artifact fits?
          </h3>
          <p className="text-xs text-muted" aria-live="polite">
            {sitDone ? `${sitScore} of ${situations.length} right` : `${picks.filter(Boolean).length} / ${situations.length} answered`}
          </p>
        </div>
        <ol className="space-y-2.5">
          {situations.map((s, i) => {
            const pick = picks[i];
            return (
              <li key={i} className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
                <p className="text-sm text-fg">
                  <span className="font-semibold">{i + 1}.</span> {s.text}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label={`Situation ${i + 1}: choose an artifact`}>
                  {kinds.map((k) => {
                    const isAnswer = k.key === s.answer;
                    const isPick = k.key === pick;
                    let cls = 'border-line bg-surface text-muted hover:text-fg';
                    if (pick && isAnswer) cls = 'border-ok bg-ok-soft text-fg';
                    else if (pick && isPick) cls = 'border-danger bg-danger-soft text-fg';
                    return (
                      <button
                        key={k.key}
                        type="button"
                        aria-pressed={isPick}
                        onClick={() => setPicks((prev) => prev.map((p, n) => (n === i ? k.key : p)))}
                        className={`${btnBase} ${cls}`}
                      >
                        <span className="truncate">{k.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div aria-live="polite">
                  {pick && (
                    <p className="mt-2 flex gap-1.5 text-sm text-fg">
                      {pick === s.answer ? (
                        <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Correct" />
                      ) : (
                        <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Not the best fit" />
                      )}
                      <span className="min-w-0">
                        {pick !== s.answer && <strong>Best fit: {labelOf(s.answer)}. </strong>}
                        {s.why[pick]}
                      </span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
