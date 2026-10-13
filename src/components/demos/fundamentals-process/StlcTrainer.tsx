import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

/**
 * STLC trainer, two click-based exercises:
 * 1. Put the six STLC phases in order (instant feedback on every click).
 * 2. Match each deliverable to the phase that produces it.
 */

type PhaseId = 'analysis' | 'planning' | 'design' | 'env' | 'execution' | 'closure';

const phases: { id: PhaseId; label: string; short: string; needs: string; entry: string; exit: string }[] = [
  {
    id: 'analysis',
    label: 'Requirement analysis',
    short: 'Analysis',
    needs: 'is the starting point: you have to understand what to test first',
    entry: 'Requirements or user stories are available to read.',
    exit: 'Questions are answered and you know what is testable.',
  },
  {
    id: 'planning',
    label: 'Test planning',
    short: 'Planning',
    needs: 'needs you to understand the requirements first, otherwise you are planning blind',
    entry: 'Requirements are understood and open questions are answered.',
    exit: 'The test plan (scope, approach, schedule, risks) is agreed.',
  },
  {
    id: 'design',
    label: 'Test case design',
    short: 'Design',
    needs: 'needs an agreed plan first, so you know what is in scope and how deep to go',
    entry: 'The test plan is approved; requirements are stable enough.',
    exit: 'Test cases and test data are written and reviewed.',
  },
  {
    id: 'env',
    label: 'Environment setup',
    short: 'Environment',
    needs: 'comes after design: you only know which devices, accounts and data you need once the tests are designed (in practice it often runs in parallel with design)',
    entry: 'You know which devices, builds, accounts and data the tests need.',
    exit: 'The build is installed and a smoke test passes on the test environment.',
  },
  {
    id: 'execution',
    label: 'Test execution',
    short: 'Execution',
    needs: 'needs test cases and a working test environment before it can start',
    entry: 'Test cases are ready and the environment passed a smoke test.',
    exit: 'Planned tests are run, critical bugs are fixed and retested.',
  },
  {
    id: 'closure',
    label: 'Test closure',
    short: 'Closure',
    needs: 'is the very last step: you can only sum up once testing is done',
    entry: 'Execution exit criteria are met (or the team decides to stop).',
    exit: 'Summary report is shared, lessons learned are recorded.',
  },
];

const byId = (id: PhaseId) => phases.find((p) => p.id === id)!;
const shuffled: PhaseId[] = ['execution', 'planning', 'closure', 'analysis', 'env', 'design'];

type OrderState = { placed: PhaseId[]; mistakes: number; msg: { ok: boolean; text: string } | null };
const initialOrder: OrderState = { placed: [], mistakes: 0, msg: null };

function OrderExercise() {
  const [state, setState] = useState<OrderState>(initialOrder);
  const { placed, mistakes, msg } = state;

  const pick = (id: PhaseId) => {
    setState((prev) => {
      const expected = phases[prev.placed.length]?.id;
      if (!expected || prev.placed.includes(id)) return prev;
      if (id === expected) {
        return { ...prev, placed: [...prev.placed, id], msg: { ok: true, text: `Yes! ${byId(id).label}. Exit criteria: ${byId(id).exit}` } };
      }
      const last = prev.placed[prev.placed.length - 1];
      const after = last ? ` What has to happen right after ${byId(last).label.toLowerCase()}?` : '';
      return { ...prev, mistakes: prev.mistakes + 1, msg: { ok: false, text: `Not yet. ${byId(id).label} ${byId(id).needs}.${after}` } };
    });
  };

  const reset = () => setState(initialOrder);

  const done = placed.length === phases.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Click the phases in the order a test team works through them.</p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Phases to place">
        {shuffled.map((id) => {
          const used = placed.includes(id);
          return (
            <button
              key={id}
              type="button"
              disabled={used}
              onClick={() => pick(id)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${
                used ? 'border-line bg-subtle text-faint line-through' : 'border-line bg-surface text-fg hover:shadow-[0_0_0_1px_var(--line-strong)]'
              }`}
            >
              {byId(id).label}
            </button>
          );
        })}
      </div>

      <ol className="space-y-2">
        {phases.map((p, i) => {
          const filled = placed[i];
          return (
            <li
              key={p.id}
              className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                filled ? 'border-ok/40 bg-ok-soft text-fg' : 'border-dashed border-line text-faint'
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${filled ? 'bg-ok text-white' : 'bg-subtle text-muted'}`}
              >
                {i + 1}
              </span>
              {filled ? (
                <span className="min-w-0">
                  <span className="font-semibold">{byId(filled).label}</span>
                  {done ? (
                    <span className="mt-1 block text-xs text-muted">
                      <strong className="font-semibold text-fg">Entry:</strong> {byId(filled).entry}{' '}
                      <strong className="font-semibold text-fg">Exit:</strong> {byId(filled).exit}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="pt-0.5">Empty slot</span>
              )}
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">
        {done ? (
          <p className="rounded-xl border border-ok/40 bg-ok-soft p-3 text-sm text-fg">
            <strong>All six in order</strong> with {mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'}. Read the entry and exit criteria above:
            each phase's exit is roughly the next phase's entry.
          </p>
        ) : msg ? (
          <p
            className={`flex gap-2 rounded-xl border p-3 text-sm text-fg ${msg.ok ? 'border-ok/40 bg-ok-soft' : 'border-danger/40 bg-danger-soft'}`}
          >
            {msg.ok ? (
              <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
            ) : (
              <X size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
            )}
            <span>{msg.text}</span>
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <RotateCcw size={14} aria-hidden="true" /> Start over
      </button>
    </div>
  );
}

type Deliverable = { name: string; accept: PhaseId[]; why: string };

const deliverables: Deliverable[] = [
  { name: 'A list of questions about unclear requirements', accept: ['analysis'], why: 'Questions come out of reading the requirements. Asking them before any code exists is the cheapest bug-prevention there is.' },
  { name: 'Test plan: scope, approach, schedule, risks', accept: ['planning'], why: 'The test plan is the main output of test planning. It says what will (and will not) be tested, how, by whom and when.' },
  { name: 'Traceability matrix (requirement to test links)', accept: ['analysis', 'design'], why: 'It is usually started during requirement analysis (listing the requirements) and filled in during test case design (linking each requirement to its tests). Both answers are fine.' },
  { name: 'Effort estimate: "testing needs about 4 days"', accept: ['planning'], why: 'Estimating effort and booking people and devices is part of test planning.' },
  { name: 'Test cases with steps and expected results', accept: ['design'], why: 'Writing (and reviewing) test cases is what test case design is all about.' },
  { name: 'Test data: accounts, coupon codes, test cards', accept: ['design', 'env'], why: 'You decide what data you need while designing tests; it is often created while setting up the environment. Both answers are fine.' },
  { name: 'Smoke test result on the fresh test build', accept: ['env'], why: 'A quick smoke test proves the environment and build are usable. It is the exit criterion of environment setup and the entry to execution.' },
  { name: 'Bug reports', accept: ['execution'], why: 'Bugs are found and reported while running the tests.' },
  { name: 'Daily status: 42 passed, 3 failed, 5 blocked', accept: ['execution'], why: 'Execution status and test logs are produced while tests are being run.' },
  { name: 'Test summary report', accept: ['closure'], why: 'At closure you sum up what was tested, what passed, open bugs and risks, so the team can decide whether to release.' },
  { name: 'Lessons learned for next time', accept: ['closure'], why: 'Closure is when the team looks back and records what to improve, like getting builds earlier.' },
];

type MatchState = { i: number; answer: PhaseId | null; score: number; results: Record<PhaseId, string[]> };
const initialMatch: MatchState = {
  i: 0,
  answer: null,
  score: 0,
  results: { analysis: [], planning: [], design: [], env: [], execution: [], closure: [] },
};

function MatchExercise() {
  const [state, setState] = useState<MatchState>(initialMatch);
  const { i, answer, score, results } = state;

  const done = i >= deliverables.length;
  const d = deliverables[Math.min(i, deliverables.length - 1)];
  const correct = answer !== null && d.accept.includes(answer);

  const choose = (id: PhaseId) => {
    setState((prev) => {
      if (prev.answer !== null || prev.i >= deliverables.length) return prev;
      const cur = deliverables[prev.i];
      const ok = cur.accept.includes(id);
      const bucket = ok ? id : cur.accept[0];
      return {
        ...prev,
        answer: id,
        score: prev.score + (ok ? 1 : 0),
        results: { ...prev.results, [bucket]: [...prev.results[bucket], cur.name] },
      };
    });
  };

  const next = () => setState((prev) => (prev.answer === null ? prev : { ...prev, answer: null, i: prev.i + 1 }));

  const reset = () => setState(initialMatch);

  return (
    <div className="space-y-4">
      {!done ? (
        <>
          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span>
              Deliverable {i + 1} of {deliverables.length}
            </span>
            <span>Score: {score}</span>
          </div>
          <div className="rounded-2xl border border-line bg-subtle p-4">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Which phase produces this?</p>
            <p className="mt-1 text-base font-semibold text-fg">{d.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="STLC phases">
            {phases.map((p) => {
              const isPicked = answer === p.id;
              const isRight = answer !== null && d.accept.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choose(p.id)}
                  disabled={answer !== null && !isPicked && !isRight}
                  className={`min-w-0 rounded-xl border px-3 py-2 text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isRight
                      ? 'border-ok/40 bg-ok-soft text-fg'
                      : isPicked
                        ? 'border-danger/40 bg-danger-soft text-fg'
                        : answer !== null
                          ? 'border-line bg-surface text-faint'
                          : 'border-line bg-surface text-fg hover:shadow-[0_0_0_1px_var(--line-strong)]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div aria-live="polite">
            {answer !== null ? (
              <div className={`rounded-xl border p-3 text-sm text-fg ${correct ? 'border-ok/40 bg-ok-soft' : 'border-danger/40 bg-danger-soft'}`}>
                <p className="flex items-center gap-1.5 font-semibold">
                  {correct ? <Check size={16} className="text-ok" aria-hidden="true" /> : <X size={16} className="text-danger" aria-hidden="true" />}
                  {correct ? 'Correct' : `Not quite: it belongs to ${d.accept.map((a) => byId(a).label).join(' or ')}`}
                </p>
                <p className="mt-1">{d.why}</p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {i === deliverables.length - 1 ? 'See results' : 'Next deliverable'}
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="space-y-3" aria-live="polite">
          <p className="rounded-xl border border-ok/40 bg-ok-soft p-3 text-sm text-fg">
            <strong>
              {score} / {deliverables.length} correct.
            </strong>{' '}
            Here is what each phase produced:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {phases.map((p, n) => (
              <div key={p.id} className="min-w-0 rounded-xl border border-line bg-subtle p-3 text-sm">
                <p className="font-semibold text-fg">
                  {n + 1}. {p.label}
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                  {results[p.id].map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
  );
}

export default function StlcTrainer() {
  const [tab, setTab] = useState<'order' | 'match'>('order');
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">STLC trainer</p>
        <p className="text-sm text-muted">Two quick exercises. No dragging needed, just click.</p>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-subtle p-1" role="group" aria-label="Exercise">
          {(
            [
              ['order', '1. Order the phases'],
              ['match', '2. Match the deliverable'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex-auto rounded-xl px-3 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                tab === id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'order' ? <OrderExercise /> : <MatchExercise />}
      </div>
    </div>
  );
}
