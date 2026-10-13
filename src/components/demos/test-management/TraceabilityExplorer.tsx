import { useState } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, GitBranch, RotateCcw, Sparkles } from 'lucide-react';
import { STATUS_META, type Status } from './data';
import { BUGS, IMPACT, IMPACT_CHANGE, REQS, TESTS, VERDICTS, type Verdict } from './rtm';

/**
 * RTM coverage explorer for the FoodDash 2.0 release.
 * Forward view: requirement → tests (with run status) → bugs. The learner labels each requirement
 * (passing, failing, not verified, no tests) and checks the answer.
 * Backward view: bug → test → requirement, and tests without a requirement.
 * Impact analysis: a requirement changes; the learner picks what needs attention.
 */

type View = 'forward' | 'backward';

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-brand-fg hover:opacity-90`;
const btnGhost = `${btn} border border-line bg-surface font-medium text-muted hover:text-fg`;

function TestChip({ id }: { id: string }) {
  const t = TESTS.find((x) => x.id === id)!;
  const m = STATUS_META[t.status as Status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs text-fg ${m.soft}`} title={`${t.title}: ${m.label}`}>
      <span className={`size-2 rounded-full ${m.dot}`} aria-hidden="true" />
      {id}
      <span className="sr-only">: {m.label}</span>
    </span>
  );
}

function BugChip({ k }: { k: string }) {
  const b = BUGS.find((x) => x.key === k)!;
  const closed = b.state === 'Closed';
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs ${closed ? 'border-line text-faint line-through' : 'border-danger/40 text-danger'}`} title={`${b.title} (${b.severity}, ${b.state})`}>
      {k}
      <span className="sr-only">
        : {b.severity}, {b.state}
      </span>
    </span>
  );
}

export default function TraceabilityExplorer() {
  const [view, setView] = useState<View>('forward');
  const [answers, setAnswers] = useState<Record<string, Verdict | ''>>({});
  const [checked, setChecked] = useState(false);
  const [impact, setImpact] = useState<string[]>([]);
  const [impactChecked, setImpactChecked] = useState(false);

  const answered = REQS.filter((r) => answers[r.id]).length;
  const correct = REQS.filter((r) => answers[r.id] === r.answer).length;
  const withTests = REQS.filter((r) => r.tests.length > 0).length;
  const passing = REQS.filter((r) => r.answer === 'pass').length;

  function choose(id: string, v: Verdict | '') {
    setChecked(false);
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }

  return (
    <div className="not-prose my-8 overflow-clip rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <GitBranch size={17} className="text-brand" aria-hidden="true" /> Traceability explorer: FoodDash 2.0
        </p>
        <p className="text-sm text-muted">Ten user stories, the test run on build 412 (iPhone) and the bugs it produced. Where are the gaps?</p>
        <div className="mt-3 inline-flex rounded-full border border-line bg-subtle p-0.5" role="group" aria-label="Direction">
          {(['forward', 'backward'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${view === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {v === 'forward' ? (
                <>
                  Forward <ArrowRight size={12} aria-hidden="true" />
                </>
              ) : (
                <>
                  <ArrowLeft size={12} aria-hidden="true" /> Backward
                </>
              )}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {view === 'forward' ? 'Requirement → test cases → run result → bugs. Answers "is every requirement tested, and how did it go?"' : 'Bug → test case → requirement. Answers "why does this test or bug exist, and which story does it hurt?"'}
        </p>
      </div>

      {view === 'forward' ? (
        <div className="p-4 sm:p-5">
          <div className="mb-2 hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_10rem] gap-3 px-3 text-xs font-semibold tracking-wide text-faint uppercase md:grid">
            <span>Requirement</span>
            <span>Tests (run result)</span>
            <span>Bugs</span>
            <span>Your verdict</span>
          </div>
          <ul className="space-y-2">
            {REQS.map((r) => {
              const a = answers[r.id] ?? '';
              const bugs = r.tests.flatMap((t) => TESTS.find((x) => x.id === t)!.bugs);
              const ok = checked && a === r.answer;
              const bad = checked && a !== '' && a !== r.answer;
              return (
                <li key={r.id} className={`rounded-xl border p-3 ${ok ? 'border-ok/60' : bad ? 'border-danger/60' : 'border-line'}`}>
                  <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_10rem] md:gap-3">
                    <p className="min-w-0 text-sm">
                      <span className="font-mono text-xs text-faint">{r.id}</span> <span className="break-words text-fg">{r.title}</span>
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      <span className="text-xs text-faint md:hidden">Tests:</span>
                      {r.tests.length ? r.tests.map((t) => <TestChip key={t} id={t} />) : <span className="text-xs text-muted italic">none</span>}
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      <span className="text-xs text-faint md:hidden">Bugs:</span>
                      {bugs.length ? bugs.map((b) => <BugChip key={b} k={b} />) : <span className="text-xs text-faint">–</span>}
                    </div>
                    <select
                      aria-label={`Verdict for ${r.id}`}
                      value={a}
                      onChange={(e) => choose(r.id, e.target.value as Verdict | '')}
                      className="w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      <option value="">Choose…</option>
                      {VERDICTS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {checked && a !== '' && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                      {ok ? <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-label="Correct" /> : <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" aria-label="Not quite" />}
                      <span>
                        {!ok && <strong className="text-fg">{VERDICTS.find((v) => v.id === r.answer)!.label}. </strong>}
                        {r.why}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-label="Legend">
            {(['passed', 'failed', 'blocked'] as Status[]).map((s) => (
              <li key={s} className="inline-flex items-center gap-1">
                <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} aria-hidden="true" /> {STATUS_META[s].label}
              </li>
            ))}
            <li>
              <span className="font-mono line-through">FD-118</span> closed bug
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={btnPrimary} disabled={answered === 0} onClick={() => setChecked(true)}>
              Check my verdicts
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setAnswers(Object.fromEntries(REQS.map((r) => [r.id, r.answer])));
                setChecked(true);
              }}
            >
              <Sparkles size={14} aria-hidden="true" /> Show answers
            </button>
            <button
              type="button"
              aria-label="Reset verdicts"
              className={`${btnGhost} px-2.5`}
              onClick={() => {
                setAnswers({});
                setChecked(false);
              }}
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>
            <span className="text-xs text-muted tabular-nums">{answered} / {REQS.length} labeled</span>
          </div>
          {checked && (
            <div className="mt-3 rounded-xl border border-line bg-subtle p-3 text-sm text-fg" role="status">
              <p className="font-semibold">
                {correct} of {REQS.length} right{answered < REQS.length ? ` (${REQS.length - answered} not labeled yet)` : ''}.
              </p>
              <p className="mt-1 text-muted">
                Requirement coverage: {withTests} of {REQS.length} stories have at least one test, but only {passing} are tested and passing. Two have no tests, one is blocked and three are failing. That sentence is worth more in a report than any pass percentage.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-fg">Bugs, traced back</p>
            <ul className="space-y-2">
              {BUGS.map((b) => {
                const t = b.test ? TESTS.find((x) => x.id === b.test)! : null;
                const r = t?.req ? REQS.find((x) => x.id === t.req)! : null;
                return (
                  <li key={b.key} className="rounded-xl border border-line p-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <BugChip k={b.key} />
                      <span className="text-xs text-muted">
                        {b.severity} · {b.state}
                      </span>
                    </p>
                    <p className="mt-1 break-words text-fg">{b.title}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted">
                      {t ? (
                        <>
                          <ArrowLeft size={12} aria-hidden="true" />
                          <TestChip id={t.id} /> <ArrowLeft size={12} aria-hidden="true" /> <span className="font-mono">{r!.id}</span> {r!.title}
                        </>
                      ) : (
                        <span className="text-warn">Found while running C401, but no test case covers it. Add a case for restaurant logos in the Orders list so a regression would be caught.</span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-fg">Test cases, traced back</p>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {TESTS.map((t) => (
                <li key={t.id} className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm ${t.req ? '' : 'bg-warn-soft'}`}>
                  <TestChip id={t.id} />
                  <span className="min-w-0 flex-1 break-words text-fg">{t.title}</span>
                  <span className={`font-mono text-xs ${t.req ? 'text-muted' : 'font-semibold text-warn'}`}>{t.req ?? 'no requirement'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">
              C601 traces to nothing: gift cards were cut from 2.0. A test without a requirement is either testing something nobody asked for or pointing at a missing story. Ask, then archive or relink it.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-line bg-subtle p-4 sm:p-5">
        <p className="text-sm font-semibold text-fg">Impact analysis</p>
        <p className="mt-0.5 text-sm text-muted">{IMPACT_CHANGE} Which of these need attention?</p>
        <ul className="mt-2 space-y-1.5">
          {IMPACT.map((i) => {
            const on = impact.includes(i.id);
            const right = on === i.affected;
            return (
              <li key={i.id}>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                    checked={on}
                    onChange={() => {
                      setImpactChecked(false);
                      setImpact((prev) => (prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id]));
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="break-words">{i.label}</span>
                    {impactChecked && (
                      <span className={`mt-0.5 block text-xs ${right ? 'text-ok' : 'text-danger'}`}>
                        {right ? 'Right. ' : i.affected ? 'Affected. ' : 'Not affected. '}
                        <span className="text-muted">{i.why}</span>
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setImpactChecked(true)}>
          Check impact
        </button>
      </div>
    </div>
  );
}
