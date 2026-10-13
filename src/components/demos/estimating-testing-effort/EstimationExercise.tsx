import { useId, useState } from 'react';
import { Calculator, CircleCheck, CircleX, Plus, RotateCcw, Sparkles, TriangleAlert, X } from 'lucide-react';

/**
 * Estimation exercise for the FoodDash "Scheduled orders" feature.
 * 1. The learner gives an optimistic (O), most likely (M) and pessimistic (P) number of hours per task,
 *    and can add their own tasks. The PERT expected value (O + 4M + P) / 6 and the O..P range update live.
 * 2. "Reality check" looks for the commonly forgotten tasks among the learner's own tasks (by keyword),
 *    then compares the estimate with how an illustrative project actually went.
 * 3. "Add what I missed" appends the forgotten tasks with example numbers, so the learner can re-estimate.
 * All numbers are made up for teaching. State lives only in this component.
 */

type Row = { id: string; name: string; o: string; m: string; p: string; kind: 'starter' | 'custom' | 'added'; key?: string };

type Forgotten = {
  key: string;
  name: string;
  detail: string;
  match: RegExp;
  example: [number, number, number];
  actual: number;
};

const HOURS_PER_DAY = 6;

const STARTERS: { key: string; name: string; example: [number, number, number]; actual: number }[] = [
  { key: 'understand', name: 'Read the story, ask questions in refinement', example: [2, 3, 5], actual: 3 },
  { key: 'design', name: 'Design scenarios and test cases', example: [4, 6, 10], actual: 7 },
  { key: 'ios', name: 'Run the tests on iPhone 15 · iOS 18', example: [5, 7, 12], actual: 9 },
  { key: 'android', name: 'Run the tests on Pixel 8 · Android 15', example: [4, 6, 10], actual: 7 },
  { key: 'summary', name: 'Test summary and sign-off', example: [1, 2, 3], actual: 2 },
];

const FORGOTTEN: Forgotten[] = [
  {
    key: 'data',
    name: 'Test data and environment setup',
    detail: 'Accounts with saved addresses, restaurants with different opening hours, the scheduling switch turned on in staging.',
    match: /data|account|set ?up|environment|staging|config|seed|fixture/i,
    example: [2, 3, 6],
    actual: 5,
  },
  {
    key: 'devices',
    name: 'Extra devices, OS versions and screen sizes',
    detail: 'An older iPhone on iOS 17, a budget Android phone, large text. The two main phones are not the whole device matrix.',
    match: /device|tablet|older|samsung|iphone se|os version|matrix|browser|screen size|large text/i,
    example: [2, 4, 6],
    actual: 4,
  },
  {
    key: 'bugs',
    name: 'Writing bug reports and talking to developers',
    detail: 'Every bug needs reproducing, evidence and a clear report, plus questions back and forth.',
    match: /bug|report|defect|triage|jira|ticket/i,
    example: [2, 3, 6],
    actual: 5,
  },
  {
    key: 'retest',
    name: 'Retesting fixes on new builds',
    detail: 'Fixes arrive in new builds. Each one is installed and checked again, often in two or three rounds.',
    match: /retest|re-test|verif|fix/i,
    example: [2, 4, 8],
    actual: 6,
  },
  {
    key: 'regression',
    name: 'Regression around checkout, cart and tracking',
    detail: 'Scheduling touches checkout and order tracking. Something there can break even if the new screen works.',
    match: /regression|smoke|sanity/i,
    example: [3, 4, 6],
    actual: 5,
  },
  {
    key: 'buffer',
    name: 'Buffer for blockers and waiting',
    detail: 'The build reached staging half a day late, and the payment sandbox was down one morning.',
    match: /buffer|block|wait|contingency|delay|risk|slack|reserve/i,
    example: [2, 4, 8],
    actual: 4,
  },
];

const ACTUAL_TOTAL = STARTERS.reduce((s, t) => s + t.actual, 0) + FORGOTTEN.reduce((s, t) => s + t.actual, 0);

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-brand-fg hover:opacity-90`;
const btnGhost = `${btn} border border-line bg-surface font-medium text-muted hover:text-fg`;
const numInput =
  'w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-right text-sm text-fg tabular-nums focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none aria-[invalid=true]:border-danger';

let nextId = 1;
const newId = () => `row-${nextId++}`;

function starterRows(): Row[] {
  return STARTERS.map((s) => ({ id: newId(), name: s.name, o: '', m: '', p: '', kind: 'starter', key: s.key }));
}

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type Parsed = { o: number; m: number; p: number; e: number } | null;

function parse(r: Row): Parsed {
  const o = num(r.o);
  const m = num(r.m);
  const p = num(r.p);
  if (o === null || m === null || p === null) return null;
  if (!(o <= m && m <= p)) return null;
  return { o, m, p, e: (o + 4 * m + p) / 6 };
}

function orderProblem(r: Row): boolean {
  const o = num(r.o);
  const m = num(r.m);
  const p = num(r.p);
  if (o === null || m === null || p === null) return false;
  return !(o <= m && m <= p);
}

/** Round to the nearest half hour: anything more precise would be fake precision. */
const half = (n: number) => Math.round(n * 2) / 2;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const days = (h: number) => fmt(half(h / HOURS_PER_DAY));

export default function EstimationExercise() {
  const uid = useId();
  const [rows, setRows] = useState<Row[]>(starterRows);
  const [newName, setNewName] = useState('');
  const [checked, setChecked] = useState(false);

  const parsed = rows.map(parse);
  const complete = parsed.every(Boolean);
  const filled = parsed.filter(Boolean) as NonNullable<Parsed>[];
  const sumO = filled.reduce((s, r) => s + r.o, 0);
  const sumP = filled.reduce((s, r) => s + r.p, 0);
  const sumE = filled.reduce((s, r) => s + r.e, 0);

  const update = (id: string, field: 'o' | 'm' | 'p' | 'name', value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const addCustom = () => {
    const name = newName.trim();
    if (!name) return;
    setRows((prev) => [...prev, { id: newId(), name, o: '', m: '', p: '', kind: 'custom' }]);
    setNewName('');
  };

  const fillExample = () =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.kind !== 'starter' || (r.o && r.m && r.p)) return r;
        const s = STARTERS.find((x) => x.key === r.key)!;
        return { ...r, o: String(s.example[0]), m: String(s.example[1]), p: String(s.example[2]) };
      }),
    );

  const reset = () => {
    setRows(starterRows());
    setNewName('');
    setChecked(false);
  };

  // Which forgotten tasks did the learner already cover with their own rows?
  const ownRows = rows.filter((r) => r.kind !== 'starter');
  const coverage = FORGOTTEN.map((f) => {
    const hit = ownRows.find((r) => (r.kind === 'added' ? r.key === f.key : f.match.test(r.name)));
    return { f, hit };
  });
  const missed = coverage.filter((c) => !c.hit);

  const addMissed = () =>
    setRows((prev) => [
      ...prev,
      ...missed.map(({ f }) => ({
        id: newId(),
        name: f.name,
        o: String(f.example[0]),
        m: String(f.example[1]),
        p: String(f.example[2]),
        kind: 'added' as const,
        key: f.key,
      })),
    ]);

  // Comparison bar
  const scaleMax = Math.max(sumP, ACTUAL_TOTAL) * 1.1 || 1;
  const pct = (h: number) => `${Math.min(100, (h / scaleMax) * 100)}%`;
  let verdict: { tone: 'ok' | 'warn' | 'danger'; text: string };
  if (ACTUAL_TOTAL > sumP) {
    verdict = {
      tone: 'danger',
      text: 'The actual effort was above even your worst case. That is rarely because each number was too low. It is almost always because whole tasks were missing from the list.',
    };
  } else if (ACTUAL_TOTAL > sumE * 1.25) {
    verdict = {
      tone: 'warn',
      text: 'The actual effort fell inside your range, but well above the expected value. A range was the honest answer here: a single number would have looked like a broken promise.',
    };
  } else {
    verdict = {
      tone: 'ok',
      text: 'Your expected value was close to what happened. Remember this is one made-up project: on a real one, keep comparing estimates with actuals so the next estimate gets better.',
    };
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Brief */}
      <div className="border-b border-line bg-subtle p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">FoodDash 2.1 · Story FD-350</p>
        <p className="mt-1 text-lg font-semibold text-fg">Scheduled orders</p>
        <p className="mt-1 text-sm text-muted">
          As a customer, I want to schedule an order for later today or tomorrow, so the food arrives when I'm home. Customers pick a 30-minute
          delivery slot when the restaurant is open, can change or cancel the order until the restaurant starts preparing it, and get a push
          notification when it's on its way. iOS and Android apps.
        </p>
        <p className="mt-2 text-sm text-fg">
          <strong>Your PM asks:</strong> "How long will testing take?" Fill in three numbers of hours per task. Add any tasks you think are
          missing.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Header row (wide screens) */}
        <div className="hidden grid-cols-[minmax(0,1fr)_repeat(3,4rem)_4rem_2rem] items-end gap-2 px-1 text-xs font-semibold text-muted sm:grid">
          <span>Task</span>
          <span className="text-right">Best (O)</span>
          <span className="text-right">Likely (M)</span>
          <span className="text-right">Worst (P)</span>
          <span className="text-right">PERT</span>
          <span />
        </div>

        <ul className="space-y-2">
          {rows.map((r, i) => {
            const p = parsed[i];
            const bad = orderProblem(r);
            return (
              <li
                key={r.id}
                className={`rounded-xl border p-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_repeat(3,4rem)_4rem_2rem] sm:items-center sm:gap-2 sm:p-1.5 sm:pl-2.5 ${
                  r.kind === 'added' ? 'border-info/40 bg-info-soft/40' : 'border-line'
                }`}
              >
                <div className="min-w-0">
                  {r.kind === 'custom' ? (
                    <input
                      value={r.name}
                      onChange={(e) => update(r.id, 'name', e.target.value)}
                      aria-label="Task name"
                      className="w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    />
                  ) : (
                    <p className="text-sm text-fg">
                      {r.name}
                      {r.kind === 'added' && <span className="ml-1.5 rounded bg-info-soft px-1 text-[11px] font-semibold text-info">added</span>}
                    </p>
                  )}
                  {bad && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" /> Best ≤ likely ≤ worst
                    </p>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1fr)_2rem] items-end gap-2 sm:contents">
                  {(['o', 'm', 'p'] as const).map((f) => (
                    <label key={f} className="min-w-0">
                      <span className="mb-0.5 block text-[11px] font-semibold text-faint sm:sr-only">
                        {f === 'o' ? 'Best' : f === 'm' ? 'Likely' : 'Worst'}
                      </span>
                      <span className="sr-only">
                        {r.name || 'Task'}: {f === 'o' ? 'optimistic' : f === 'm' ? 'most likely' : 'pessimistic'} hours
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        value={r[f]}
                        placeholder="h"
                        aria-invalid={bad || undefined}
                        onChange={(e) => update(r.id, f, e.target.value)}
                        className={numInput}
                      />
                    </label>
                  ))}
                  <div className="min-w-0 text-right">
                    <span className="mb-0.5 block text-[11px] font-semibold text-faint sm:hidden">PERT</span>
                    <span className="block py-1.5 text-sm font-semibold text-fg tabular-nums">{p ? `${fmt(half(p.e))} h` : '–'}</span>
                  </div>
                  <div className="flex justify-end">
                    {r.kind !== 'starter' ? (
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        aria-label={`Remove ${r.name || 'task'}`}
                        className="grid size-8 place-items-center rounded-full text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Add a task */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <label htmlFor={`${uid}-new`} className="sr-only">
            New task name
          </label>
          <input
            id={`${uid}-new`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a task you think is missing…"
            className="w-0 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg placeholder:text-faint focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          />
          <button type="submit" className={btnGhost} disabled={!newName.trim()}>
            <Plus className="size-4" aria-hidden="true" /> Add
          </button>
        </form>

        {/* Totals */}
        <div className="rounded-xl border border-line bg-subtle p-3" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <Calculator className="size-4 text-brand" aria-hidden="true" /> Your estimate
            </p>
            <p className="text-xs text-muted">
              {filled.length} of {rows.length} tasks filled in
            </p>
          </div>
          {filled.length ? (
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <p className="min-w-0">
                <span className="block text-xs text-muted">Expected (PERT)</span>
                <span className="text-lg font-semibold text-fg tabular-nums">about {fmt(half(sumE))} h</span>
                <span className="block text-xs text-muted">≈ {days(sumE)} days</span>
              </p>
              <p className="min-w-0">
                <span className="block text-xs text-muted">Best case (sum of O)</span>
                <span className="font-semibold text-fg tabular-nums">{fmt(sumO)} h</span>
                <span className="block text-xs text-muted">≈ {days(sumO)} days</span>
              </p>
              <p className="min-w-0">
                <span className="block text-xs text-muted">Worst case (sum of P)</span>
                <span className="font-semibold text-fg tabular-nums">{fmt(sumP)} h</span>
                <span className="block text-xs text-muted">≈ {days(sumP)} days</span>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Fill in best, likely and worst hours for a task to see the totals.</p>
          )}
          <p className="mt-2 text-xs text-muted">
            Days assume {HOURS_PER_DAY} focused testing hours a day (meetings eat the rest). That is an assumption: say it out loud when you give
            the number.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={!complete} onClick={() => setChecked(true)}>
            <Sparkles className="size-4" aria-hidden="true" /> Reality check
          </button>
          <button type="button" className={btnGhost} onClick={fillExample}>
            Fill empty starter rows with example numbers
          </button>
          <button type="button" className={btnGhost} onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" /> Start over
          </button>
        </div>
        {!complete && (
          <p className="text-xs text-muted">
            The reality check unlocks when every row has three numbers in the right order (best ≤ likely ≤ worst).
          </p>
        )}

        {checked && complete && (
          <section aria-label="Reality check" className="space-y-4 rounded-xl border border-line p-3 sm:p-4">
            <div>
              <p className="text-sm font-semibold text-fg">1 · Commonly forgotten tasks</p>
              <ul className="mt-2 space-y-2">
                {coverage.map(({ f, hit }) => (
                  <li key={f.key} className="flex gap-2 text-sm">
                    {hit ? (
                      <>
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                        <span className="sr-only">Covered:</span>
                      </>
                    ) : (
                      <>
                        <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                        <span className="sr-only">Missing:</span>
                      </>
                    )}
                    <span className="min-w-0">
                      <span className="font-semibold text-fg">{f.name}</span>
                      <span className="text-muted">
                        {hit ? (hit.kind === 'added' ? ' · added after the check.' : ` · covered by "${hit.name}".`) : ` · ${f.detail}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {missed.length > 0 ? (
                <button type="button" className={`${btnPrimary} mt-3`} onClick={addMissed}>
                  <Plus className="size-4" aria-hidden="true" /> Add the {missed.length} missing task{missed.length > 1 ? 's' : ''} and re-estimate
                </button>
              ) : (
                <p className="mt-2 text-sm text-ok">Every commonly forgotten task is on your list. Adjust their numbers if you disagree with ours.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-fg">2 · How the (made-up) project actually went</p>
              <div className="relative mt-3 h-14" aria-hidden="true">
                <div className="absolute inset-x-0 top-5 h-3 rounded-full bg-subtle" />
                <div className="absolute top-5 h-3 rounded-full bg-brand/30" style={{ left: pct(sumO), width: `calc(${pct(sumP)} - ${pct(sumO)})` }} />
                <div className="absolute top-3.5 h-6 w-1 -translate-x-1/2 rounded bg-brand" style={{ left: pct(sumE) }} />
                <div className="absolute top-3.5 h-6 w-1 -translate-x-1/2 rounded bg-danger" style={{ left: pct(ACTUAL_TOTAL) }} />
                <span className="absolute top-0 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-danger" style={{ left: `min(max(${pct(ACTUAL_TOTAL)}, 2.5rem), calc(100% - 2.5rem))` }}>
                  actual {ACTUAL_TOTAL} h
                </span>
                <span className="absolute top-10 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-brand" style={{ left: `min(max(${pct(sumE)}, 2.5rem), calc(100% - 2.5rem))` }}>
                  PERT {fmt(half(sumE))} h
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Shaded band: your range from best case ({fmt(sumO)} h) to worst case ({fmt(sumP)} h).
              </p>
              <p className="sr-only">
                Your range is {fmt(sumO)} to {fmt(sumP)} hours, expected {fmt(half(sumE))} hours. The project actually took {ACTUAL_TOTAL} hours.
              </p>
              <p
                className={`mt-3 rounded-lg p-3 text-sm text-fg ${
                  verdict.tone === 'ok' ? 'bg-ok-soft' : verdict.tone === 'warn' ? 'bg-warn-soft' : 'bg-danger-soft'
                }`}
              >
                {verdict.text}
              </p>

              <div className="mt-3 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Where the time actually went</caption>
                  <thead className="bg-subtle text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-2.5 py-1.5 font-semibold">
                        Where the time went
                      </th>
                      <th scope="col" className="px-2.5 py-1.5 text-right font-semibold">
                        Actual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {STARTERS.map((s) => (
                      <tr key={s.key}>
                        <td className="px-2.5 py-1.5 text-fg">{s.name}</td>
                        <td className="px-2.5 py-1.5 text-right text-fg tabular-nums">{s.actual} h</td>
                      </tr>
                    ))}
                    {FORGOTTEN.map((f) => {
                      const hit = coverage.find((c) => c.f.key === f.key)?.hit;
                      return (
                        <tr key={f.key} className={hit ? '' : 'bg-danger-soft/50'}>
                          <td className="px-2.5 py-1.5 text-fg">
                            {f.name}
                            {!hit && <span className="ml-1.5 text-xs font-semibold text-danger">not in your estimate</span>}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-fg tabular-nums">{f.actual} h</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-subtle font-semibold">
                      <td className="px-2.5 py-1.5 text-fg">Total</td>
                      <td className="px-2.5 py-1.5 text-right text-fg tabular-nums">{ACTUAL_TOTAL} h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">
                These numbers are invented for this exercise, to show a typical pattern. Your team's real actuals are the only numbers that tell
                you how good your estimates are.
              </p>
            </div>

            <div className="rounded-lg bg-brand-soft p-3 text-sm text-fg">
              <p className="font-semibold">3 · Say it out loud</p>
              <p className="mt-1">
                "Testing Scheduled orders is about {days(sumE)} days of effort, somewhere between {days(sumO)} and {days(sumP)}. That assumes the
                build is on staging by Monday, test accounts are ready, and we test on {coverage.some((c) => c.f.key === 'devices' && c.hit) ? 'the agreed device list' : 'two phones only'}. I'll update you after the first day of testing."
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
