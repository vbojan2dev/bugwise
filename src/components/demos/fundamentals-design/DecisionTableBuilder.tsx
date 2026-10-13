import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Combine, Lightbulb, RotateCcw, Undo2, XCircle } from 'lucide-react';

/**
 * Decision-table builder in four steps:
 * 1. pick the conditions from the requirement (actions and noise are distractors),
 * 2. fill in the expected action for every combination (with checking),
 * 3. collapse columns that differ in one condition but share the action ("–" = don't care),
 * 4. read off the generated test cases.
 */

type Chip = { text: string; kind: 'condition' | 'action' | 'noise'; cond?: number };
type Cond = { label: string; yes: string; no: string };
type Action = { id: string; short: string; full: string };
type Scenario = {
  id: string;
  label: string;
  requirement: string;
  chips: Chip[];
  conds: Cond[];
  actions: Action[];
  decide: (v: boolean[]) => string;
  why: (v: boolean[]) => string;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'login',
    label: 'Login with 2FA',
    requirement:
      'Users log in with email and password. If the email or password is wrong, show “Incorrect email or password”. If both are correct and the user has two-factor authentication (2FA) turned on, ask for the 6-digit code. If 2FA is off, log the user straight in.',
    chips: [
      { text: 'The email is registered', kind: 'condition', cond: 0 },
      { text: 'Show “Incorrect email or password”', kind: 'action' },
      { text: 'The password is correct', kind: 'condition', cond: 1 },
      { text: 'The phone is in dark mode', kind: 'noise' },
      { text: '2FA is turned on for the account', kind: 'condition', cond: 2 },
      { text: 'Ask for the 6-digit code', kind: 'action' },
    ],
    conds: [
      { label: 'Email registered?', yes: 'registered email (anna@test.com)', no: 'unregistered email (nobody@test.com)' },
      { label: 'Password correct?', yes: 'correct password', no: 'wrong password' },
      { label: '2FA on?', yes: 'account with 2FA on', no: 'account with 2FA off' },
    ],
    actions: [
      { id: 'err', short: 'Error', full: 'Shows “Incorrect email or password”; user stays on the login screen' },
      { id: 'code', short: 'Ask code', full: 'Asks for the 6-digit 2FA code' },
      { id: 'in', short: 'Log in', full: 'Logs the user in and opens Home' },
    ],
    decide: ([e, p, t]) => (!e || !p ? 'err' : t ? 'code' : 'in'),
    why: ([e, p, t]) =>
      !e || !p
        ? `The ${!e ? 'email' : 'password'} is wrong, so the rule says: show the error. Whether 2FA is on doesn’t matter yet.`
        : t
          ? 'Email and password are right and 2FA is on, so the app must ask for the code.'
          : 'Email and password are right and 2FA is off, so the user is logged straight in.',
  },
  {
    id: 'delivery',
    label: 'Delivery fee',
    requirement:
      'Delivery normally costs €3.99. PizzaGo+ members get free delivery on orders of €30 or more, and pay €1.99 on smaller orders. On rainy days, a €1.00 surcharge is added to every order.',
    chips: [
      { text: 'Restaurant rating is 4.5★ or higher', kind: 'noise' },
      { text: 'Customer is a PizzaGo+ member', kind: 'condition', cond: 0 },
      { text: 'Show the delivery fee at checkout', kind: 'action' },
      { text: 'Order total is €30 or more', kind: 'condition', cond: 1 },
      { text: 'Customer pays by card', kind: 'noise' },
      { text: 'Rainy-day mode is on', kind: 'condition', cond: 2 },
    ],
    conds: [
      { label: 'Member?', yes: 'PizzaGo+ member', no: 'regular customer' },
      { label: 'Order ≥ €30?', yes: '€30.00 basket', no: '€29.99 basket' },
      { label: 'Rainy day?', yes: 'rainy-day mode on', no: 'rainy-day mode off' },
    ],
    actions: [
      { id: '0', short: '€0.00', full: 'Delivery fee €0.00 (free)' },
      { id: '1', short: '€1.00', full: 'Delivery fee €1.00' },
      { id: '1.99', short: '€1.99', full: 'Delivery fee €1.99' },
      { id: '2.99', short: '€2.99', full: 'Delivery fee €2.99' },
      { id: '3.99', short: '€3.99', full: 'Delivery fee €3.99' },
      { id: '4.99', short: '€4.99', full: 'Delivery fee €4.99' },
    ],
    decide: ([m, o, r]) => {
      const base = m ? (o ? 0 : 1.99) : 3.99;
      const fee = Math.round((base + (r ? 1 : 0)) * 100) / 100;
      return fee === 0 ? '0' : fee === 1 ? '1' : String(fee);
    },
    why: ([m, o, r]) => {
      const base = m ? (o ? 0 : 1.99) : 3.99;
      const reason = m ? (o ? 'members get free delivery from €30' : 'members pay €1.99 under €30') : 'non-members always pay €3.99, whatever the order size';
      return `Base fee €${base.toFixed(2)} because ${reason}${r ? ', plus the €1.00 rainy-day surcharge (the spec says “every order”, so even free delivery gets it)' : ', no surcharge'}: €${(base + (r ? 1 : 0)).toFixed(2)}.`;
    },
  },
  {
    id: 'card',
    label: 'Credit card approval',
    requirement:
      'Applicants under 18 are always rejected. Adults with a credit score of 650 or higher are approved instantly. Adults with a lower score go to manual review if they have a regular income, and are rejected if they don’t.',
    chips: [
      { text: 'Applicant is 18 or older', kind: 'condition', cond: 0 },
      { text: 'Chosen card color', kind: 'noise' },
      { text: 'Credit score is 650 or higher', kind: 'condition', cond: 1 },
      { text: 'Send the application to manual review', kind: 'action' },
      { text: 'Applicant has a regular income', kind: 'condition', cond: 2 },
      { text: 'Applicant uses the Android app', kind: 'noise' },
    ],
    conds: [
      { label: '18 or older?', yes: 'age 30', no: 'age 17' },
      { label: 'Score ≥ 650?', yes: 'score 650', no: 'score 649' },
      { label: 'Regular income?', yes: 'salary €2,500/month', no: 'no regular income' },
    ],
    actions: [
      { id: 'ok', short: 'Approve', full: 'Approved instantly' },
      { id: 'rev', short: 'Review', full: 'Sent to manual review' },
      { id: 'no', short: 'Reject', full: 'Rejected' },
    ],
    decide: ([a, s, i]) => (!a ? 'no' : s ? 'ok' : i ? 'rev' : 'no'),
    why: ([a, s, i]) =>
      !a
        ? 'Under 18 is always rejected. Score and income don’t matter.'
        : s
          ? 'An adult with a score of 650+ is approved instantly, whatever the income.'
          : i
            ? 'An adult with a low score but a regular income goes to manual review.'
            : 'An adult with a low score and no regular income is rejected.',
  },
];

type V = 'Y' | 'N' | '-';
type Col = { vals: V[]; action: string };

const STEPS = ['Conditions', 'Rules', 'Collapse', 'Test cases'];

function allCombos(n: number): boolean[][] {
  const out: boolean[][] = [];
  for (let i = 0; i < 2 ** n; i++) out.push(Array.from({ length: n }, (_, c) => ((i >> (n - 1 - c)) & 1) === 0));
  return out;
}

function mergeCheck(a: Col, b: Col): { ok: true; at: number } | { ok: false; reason: string } {
  if (a.action !== b.action) return { ok: false, reason: 'These columns lead to different actions, so the difference between them matters. Only merge columns with the same action.' };
  const diffs = a.vals.map((v, i) => (v !== b.vals[i] ? i : -1)).filter((i) => i >= 0);
  if (diffs.length !== 1) return { ok: false, reason: `These columns differ in ${diffs.length} conditions. You can only merge two columns that differ in exactly one condition.` };
  if (a.vals[diffs[0]] === '-' || b.vals[diffs[0]] === '-')
    return { ok: false, reason: 'One of them already says “–” where the other has a value. Merge columns whose other conditions line up exactly.' };
  return { ok: true, at: diffs[0] };
}

function mergeAt(cols: Col[], i: number, j: number, at: number): Col[] {
  const merged: Col = { vals: cols[i].vals.map((v, k) => (k === at ? '-' : v)), action: cols[i].action };
  return cols.flatMap((c, k) => (k === i ? [merged] : k === j ? [] : [c]));
}

const memo = new Map<string, number>();
/** Smallest number of columns reachable from this table by further merges (tables are tiny, so brute force is fine). */
function minReachable(cols: Col[]): number {
  const key = cols
    .map((c) => c.vals.join('') + c.action)
    .sort()
    .join('|');
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  let best = cols.length;
  for (let i = 0; i < cols.length; i++)
    for (let j = i + 1; j < cols.length; j++) {
      const r = mergeCheck(cols[i], cols[j]);
      if (r.ok) best = Math.min(best, minReachable(mergeAt(cols, i, j, r.at)));
    }
  memo.set(key, best);
  return best;
}

/** A mergeable pair that still allows the smallest possible table (falls back to any mergeable pair). */
function findMergeable(cols: Col[]): [number, number] | null {
  const target = minReachable(cols);
  let any: [number, number] | null = null;
  for (let i = 0; i < cols.length; i++)
    for (let j = i + 1; j < cols.length; j++) {
      const r = mergeCheck(cols[i], cols[j]);
      if (!r.ok) continue;
      any ??= [i, j];
      if (minReachable(mergeAt(cols, i, j, r.at)) === target) return [i, j];
    }
  return any;
}

const cellBase = 'h-9 min-w-[3.5rem] px-1 text-center text-xs';

export default function DecisionTableBuilder() {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const sc = SCENARIOS.find((s) => s.id === sid)!;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [condChecked, setCondChecked] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [ruleChecked, setRuleChecked] = useState(false);
  const [cols, setCols] = useState<Col[]>([]);
  const [history, setHistory] = useState<Col[][]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [mergeMsg, setMergeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const combos = useMemo(() => allCombos(sc.conds.length), [sc]);

  const reset = (id = sid) => {
    setSid(id);
    setStep(0);
    setPicked([]);
    setCondChecked(false);
    setAnswers([]);
    setRuleChecked(false);
    setCols([]);
    setHistory([]);
    setSel([]);
    setMergeMsg(null);
  };

  // ---- Step 1: conditions
  const togglePick = (i: number) => {
    setCondChecked(false);
    setPicked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };
  const pickedConds = picked.filter((i) => sc.chips[i].kind === 'condition').length;
  const condsCorrect = pickedConds === sc.conds.length && picked.length === sc.conds.length;
  const n = picked.length;

  const goRules = () => {
    setAnswers(combos.map(() => null));
    setRuleChecked(false);
    setStep(1);
  };

  // ---- Step 2: rules
  const cycle = (c: number) => {
    setRuleChecked(false);
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== c) return a;
        const idx = sc.actions.findIndex((x) => x.id === a);
        return sc.actions[(idx + 1) % sc.actions.length].id;
      }),
    );
  };
  const wrong = combos.map((v, i) => answers[i] !== sc.decide(v));
  const allRight = answers.length > 0 && !wrong.some(Boolean);

  const goCollapse = () => {
    setCols(combos.map((v) => ({ vals: v.map((b) => (b ? 'Y' : 'N')), action: sc.decide(v) })));
    setHistory([]);
    setSel([]);
    setMergeMsg(null);
    setStep(2);
  };

  // ---- Step 3: collapse
  const toggleSel = (i: number) => {
    setMergeMsg(null);
    setSel((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].slice(-2)));
  };
  const merge = () => {
    if (sel.length !== 2) return;
    const [i, j] = [...sel].sort((a, b) => a - b);
    const res = mergeCheck(cols[i], cols[j]);
    if (!res.ok) {
      setMergeMsg({ ok: false, text: res.reason });
      return;
    }
    setHistory((h) => [...h, cols]);
    setCols(mergeAt(cols, i, j, res.at));
    setSel([]);
    setMergeMsg({ ok: true, text: `Merged. “${sc.conds[res.at].label}” doesn’t change the result here, so it becomes “–” (don’t care).` });
  };
  const undo = () => {
    if (!history.length) return;
    setCols(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setSel([]);
    setMergeMsg(null);
  };
  const hintPair = useMemo(() => findMergeable(cols), [cols]);
  // Smallest table reachable from the full table (not from the current state, which may be a dead end).
  const best = useMemo(() => minReachable(combos.map((v) => ({ vals: v.map((b) => (b ? 'Y' : 'N') as V), action: sc.decide(v) }))), [combos, sc]);

  const actionOf = (id: string | null) => sc.actions.find((a) => a.id === id);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">🧮 Decision-table builder</p>
        <p className="text-sm text-muted">Turn a business rule into a table, and the table into test cases, in four steps.</p>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Requirement">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === sid}
              onClick={() => reset(s.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                s.id === sid ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex border-b border-line text-[11px] font-semibold sm:text-xs" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="min-w-0 flex-1">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`flex w-full min-w-0 items-center justify-center gap-1 px-1 py-2.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-inset ${
                i === step ? 'border-b-2 border-brand text-fg' : i < step ? 'text-muted hover:text-fg' : 'text-faint'
              }`}
            >
              <span className={`grid size-5 shrink-0 place-items-center rounded-full ${i < step ? 'bg-ok text-white' : i === step ? 'bg-brand text-brand-fg' : 'bg-subtle'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="space-y-4 p-5">
        <blockquote className="rounded-xl border-l-4 border-brand bg-subtle p-3 text-sm text-fg">
          <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Requirement</span>
          {sc.requirement}
        </blockquote>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              <strong>Step 1.</strong> Which of these are <em>conditions</em> (inputs that can be true or false and change the outcome)? Leave out actions (what the system does) and
              things that don’t matter.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sc.chips.map((c, i) => {
                const on = picked.includes(i);
                const bad = condChecked && on !== (c.kind === 'condition');
                return (
                  <button
                    key={c.text}
                    type="button"
                    aria-pressed={on}
                    onClick={() => togglePick(i)}
                    className={`flex min-w-0 items-start gap-2 rounded-xl border p-2.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                      bad ? 'border-danger bg-danger-soft' : on ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] ${on ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'}`}>
                      {on ? '✓' : ''}
                    </span>
                    <span className="min-w-0 text-fg">
                      {c.text}
                      {condChecked && bad && (
                        <span className="mt-0.5 block text-xs text-muted">
                          {c.kind === 'condition'
                            ? 'This one changes the outcome, so it is a condition.'
                            : c.kind === 'action'
                              ? 'This is an action: something the system does as a result.'
                              : 'The requirement never mentions it, so it doesn’t change the result.'}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl bg-subtle p-3 text-sm text-fg" aria-live="polite">
              {n} condition{n === 1 ? '' : 's'} selected → 2<sup>{n}</sup> = <strong>{2 ** n}</strong> combination{2 ** n === 1 ? '' : 's'} (columns).
              {n > 3 && <span className="text-muted"> Every extra yes/no condition doubles the table.</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCondChecked(true)}
                disabled={!picked.length}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
              >
                Check
              </button>
              {condChecked && condsCorrect && (
                <button type="button" onClick={goRules} className="inline-flex items-center gap-1 rounded-lg border border-ok px-3 py-2 text-sm font-semibold text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                  Build the table <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
              {condChecked && (
                <span className={`flex items-center gap-1 text-sm ${condsCorrect ? 'text-ok' : 'text-danger'}`} role="status">
                  {condsCorrect ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
                  {condsCorrect
                    ? 'Right: three conditions, so 2³ = 8 rules.'
                    : pickedConds < sc.conds.length
                      ? `Not yet. There are ${sc.conds.length} conditions in this requirement.`
                      : 'Not yet. Some selections are not conditions.'}
                </span>
              )}
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="space-y-3">
            {step === 1 ? (
              <p className="text-sm text-fg">
                <strong>Step 2.</strong> Here are all {combos.length} combinations (Y = yes, N = no). Tap each <em>Action</em> cell to choose what the system should do, then check.
              </p>
            ) : (
              <p className="text-sm text-fg">
                <strong>Step 3.</strong> Select two columns (tap their headers) that have the <em>same action</em> and differ in <em>exactly one</em> condition, then merge them.
                That condition becomes “–” (don’t care).
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-subtle">
                    <th scope="col" className="sticky left-0 z-10 min-w-[8rem] bg-subtle px-3 py-2 text-left text-xs font-semibold text-faint">
                      {step === 1 ? 'Rule' : 'Column'}
                    </th>
                    {(step === 1 ? combos : cols).map((_, c) => (
                      <th key={c} scope="col" className="border-l border-line p-1">
                        {step === 2 ? (
                          <button
                            type="button"
                            aria-pressed={sel.includes(c)}
                            aria-label={`Select column ${c + 1}`}
                            onClick={() => toggleSel(c)}
                            className={`h-7 w-full min-w-[3rem] rounded-md text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                              sel.includes(c) ? 'bg-brand text-brand-fg' : 'bg-surface text-muted hover:text-fg'
                            }`}
                          >
                            R{c + 1}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-muted">R{c + 1}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sc.conds.map((cond, r) => (
                    <tr key={cond.label} className="border-t border-line">
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-3 text-left text-xs font-medium text-fg">
                        {cond.label}
                      </th>
                      {(step === 1 ? combos.map((v) => v.map((b) => (b ? 'Y' : 'N') as V)) : cols.map((c) => c.vals)).map((vals, c) => (
                        <td key={c} className={`${cellBase} border-l border-line font-mono font-semibold ${vals[r] === 'Y' ? 'text-ok' : vals[r] === 'N' ? 'text-danger' : 'text-faint'} ${sel.includes(c) && step === 2 ? 'bg-brand-soft' : ''}`}>
                          {vals[r] === '-' ? '–' : vals[r]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-line-strong">
                    <th scope="row" className="sticky left-0 z-10 bg-surface px-3 text-left text-xs font-semibold text-fg">
                      Action
                    </th>
                    {step === 1
                      ? combos.map((_, c) => {
                          const a = actionOf(answers[c]);
                          const bad = ruleChecked && wrong[c];
                          const good = ruleChecked && !wrong[c];
                          return (
                            <td key={c} className="border-l border-line p-1">
                              <button
                                type="button"
                                onClick={() => cycle(c)}
                                aria-label={`Rule ${c + 1} action: ${a ? a.short : 'not set'}. Activate to change.`}
                                className={`h-9 w-full min-w-[3.5rem] rounded-md border px-1 text-[11px] font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                                  bad ? 'border-danger bg-danger-soft text-fg' : good ? 'border-ok bg-ok-soft text-fg' : a ? 'border-line bg-subtle text-fg' : 'border-dashed border-line-strong text-faint'
                                }`}
                              >
                                {a ? a.short : '?'}
                              </button>
                            </td>
                          );
                        })
                      : cols.map((col, c) => (
                          <td key={c} className={`${cellBase} border-l border-line font-semibold whitespace-nowrap text-fg ${sel.includes(c) ? 'bg-brand-soft' : ''}`}>
                            {actionOf(col.action)?.short}
                          </td>
                        ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {step === 1 && (
              <>
                <p className="text-xs text-muted">
                  Options: {sc.actions.map((a) => a.short).join(' · ')}. Each tap moves to the next option.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleChecked(true)}
                    disabled={answers.some((a) => a === null)}
                    className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
                  >
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers(combos.map((v) => sc.decide(v)));
                      setRuleChecked(true);
                    }}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    Show answer
                  </button>
                  {ruleChecked && allRight && (
                    <button type="button" onClick={goCollapse} className="inline-flex items-center gap-1 rounded-lg border border-ok px-3 py-2 text-sm font-semibold text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                      Collapse the table <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                  {answers.some((a) => a === null) && <span className="text-xs text-faint">Fill every column to check.</span>}
                </div>
                {ruleChecked && (
                  <div className="space-y-1.5" role="status">
                    {allRight ? (
                      <p className="flex items-start gap-2 text-sm text-fg">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> All {combos.length} rules are right. Notice how many columns share the same action:
                        that is what we’ll collapse next.
                      </p>
                    ) : (
                      combos.map((v, c) =>
                        wrong[c] ? (
                          <p key={c} className="flex items-start gap-2 text-sm text-fg">
                            <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                            <span>
                              <strong>R{c + 1}</strong> ({v.map((b, k) => `${sc.conds[k].label.replace('?', '')} ${b ? 'Y' : 'N'}`).join(', ')}): {sc.why(v)}
                            </span>
                          </p>
                        ) : null,
                      )
                    )}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={merge}
                    disabled={sel.length !== 2}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
                  >
                    <Combine size={14} aria-hidden="true" /> Merge selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (hintPair) {
                        setSel(hintPair);
                        setMergeMsg({ ok: true, text: `Try R${hintPair[0] + 1} and R${hintPair[1] + 1}: same action, and they differ in just one condition.` });
                      }
                    }}
                    disabled={!hintPair}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
                  >
                    <Lightbulb size={14} aria-hidden="true" /> Hint
                  </button>
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!history.length}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
                  >
                    <Undo2 size={14} aria-hidden="true" /> Undo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${hintPair ? 'border-line' : 'border-ok'}`}
                  >
                    Generate test cases <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
                {mergeMsg && (
                  <p className={`flex items-start gap-2 text-sm ${mergeMsg.ok ? 'text-fg' : 'text-danger'}`} role="status">
                    {mergeMsg.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
                    {mergeMsg.text}
                  </p>
                )}
                <p className={`rounded-xl p-3 text-sm text-fg ${!hintPair && best === cols.length ? 'bg-ok-soft' : 'bg-subtle'}`} aria-live="polite">
                  {hintPair
                      ? `${cols.length} columns. Some can still be merged.`
                      : best < cols.length
                        ? `Stuck at ${cols.length} columns: no two remaining columns can be merged, but this table can shrink to ${best}. The order of merges matters. Undo a step and try a different pair.`
                        : `Fully collapsed: ${combos.length} rules became ${cols.length} columns. No two remaining columns can be merged.`}
                </p>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              <strong>Step 4.</strong> Each column is now one test case: {cols.length} tests instead of {combos.length}
              {cols.length === combos.length ? ' (go back to step 3 to collapse the table first)' : ''}. A “–” means any value works, so pick one, ideally the riskier one.
            </p>
            <ol className="space-y-2">
              {cols.map((col, c) => (
                <li key={c} className="rounded-xl border border-line p-3">
                  <p className="mb-1.5 text-sm font-semibold text-fg">
                    <span className="mr-2 rounded bg-subtle px-1.5 py-0.5 font-mono text-xs text-muted">TC-{String(c + 1).padStart(2, '0')}</span>
                    {actionOf(col.action)?.full}
                  </p>
                  <ul className="space-y-0.5 text-xs text-muted">
                    {sc.conds.map((cond, r) => (
                      <li key={cond.label}>
                        <span className="font-medium text-fg">{cond.label}</span>{' '}
                        {col.vals[r] === 'Y' ? `Yes, ${cond.yes}` : col.vals[r] === 'N' ? `No, ${cond.no}` : <em>Don’t care (any value, e.g. {cond.yes})</em>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={13} aria-hidden="true" /> Start this requirement again
        </button>
      </div>
    </div>
  );
}
