import { useState } from 'react';
import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react';
import { completePhase, SPEC } from '@/lib/capstone';
import { href } from '@/lib/url';
import { useArtifact, useCapstone } from './useCapstone';
import { Field, inputCls, Rubric, TextArea } from './ui';

const PRIORITIES = ['High', 'Medium', 'Low'] as const;
const TYPES = ['Positive', 'Negative', 'Edge', 'Non-functional'] as const;

interface Case {
  title: string;
  pre: string;
  steps: string;
  data: string;
  expected: string;
  priority: (typeof PRIORITIES)[number];
  type: (typeof TYPES)[number];
}
interface Cases {
  items: Case[];
  submittedAt?: string;
  rubric: Record<string, boolean>;
}
const emptyCase = (): Case => ({ title: '', pre: '', steps: '', data: '', expected: '', priority: 'High', type: 'Positive' });
const blank = (): Cases => ({ items: Array.from({ length: 5 }, emptyCase), rubric: {} });

const filled = (c: Case) => !!(c.title.trim() && c.steps.trim() && c.expected.trim());
const stepLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const VAGUE = /\b(works?|working|correct(ly)?|properly|fine|ok(ay)?|as expected|good|normal(ly)?)\b/i;
const MEASURABLE = /[0-9€"“'«]|\b(shows?|displays?|disabled|enabled|error|message|opens?|appears?|not (shown|offered|visible)|only|exactly|one)\b/i;

/** Quick, automatic hints for one case. Not a grade, just things a reviewer would point at. */
function lint(c: Case) {
  const out: { ok: boolean; text: string }[] = [];
  const steps = stepLines(c.steps);
  out.push(steps.length >= 2 ? { ok: true, text: `${steps.length} concrete steps` } : { ok: false, text: 'Steps: write each action on its own line (at least 2)' });
  if (/\b(test|check|verify)\b.*\b(it|everything|all)\b/i.test(c.steps)) out.push({ ok: false, text: 'Steps sound vague ("check it", "test everything")' });
  if (!c.expected.trim()) out.push({ ok: false, text: 'No expected result' });
  else if (VAGUE.test(c.expected) && !MEASURABLE.test(c.expected)) out.push({ ok: false, text: 'Expected result is not measurable ("works", "correct")' });
  else if (c.expected.trim().length < 15) out.push({ ok: false, text: 'Expected result is very short; say exactly what you see' });
  else out.push({ ok: true, text: 'Expected result is observable' });
  const ands = (c.expected.match(/\band\b|;/gi) ?? []).length;
  if (ands >= 2 || stepLines(c.expected).length > 2) out.push({ ok: false, text: 'Expected result checks several things; consider splitting the case' });
  if (!c.data.trim() && /coupon|code|€|price|total|address|slot|quantit/i.test(c.title + c.steps)) out.push({ ok: false, text: 'Test data is empty but the case needs specific values' });
  return out;
}

const MODELS: { id: string; title: string; pre: string; steps: string[]; data: string; expected: string; priority: string; type: string; why: string }[] = [
  {
    id: 'TC-01', title: `Apply ${SPEC.coupon.code} to a cart`, type: 'Positive', priority: 'High',
    pre: 'Logged in as the test account; cart: 1 Diavola (€11.90) + 1 Quattro formaggi (€12.40) from Pizzeria Napoli; no coupon applied.',
    steps: ['Open the cart', `Enter ${SPEC.coupon.code} in the coupon field`, 'Tap Apply'],
    data: `${SPEC.coupon.code}; items €24.30`,
    expected: `Discount line shows −€2.43 and the items total becomes €21.87.`,
    why: 'Happy path first, with numbers you can check on a calculator.',
  },
  {
    id: 'TC-02', title: 'Applying the same coupon twice is rejected', type: 'Negative', priority: 'High',
    pre: `TC-01 done: ${SPEC.coupon.code} is applied, items total €21.87.`,
    steps: [`Enter ${SPEC.coupon.code} again`, 'Tap Apply'],
    data: SPEC.coupon.code,
    expected: 'A message says the code is already applied; the items total stays €21.87.',
    why: 'Negative case straight from US-04 AC2. Money lost here is lost on every order.',
  },
  {
    id: 'TC-03', title: 'Delivery fee applies when the discounted total is just under €20', type: 'Edge', priority: 'High',
    pre: 'Logged in; empty cart.',
    steps: ['Add 1 Margherita (€9.50) and 1 Diavola (€11.90)', 'Open the cart', `Apply ${SPEC.coupon.code}`, 'Read the delivery line and total'],
    data: `Items €21.40 → €19.26 after ${SPEC.coupon.percent}%`,
    expected: `Delivery fee €${SPEC.deliveryFee.toFixed(2)} is charged; total €${(19.26 + SPEC.deliveryFee).toFixed(2)}.`,
    why: 'Boundary value analysis on "after discounts" (US-05). The before/after confusion is a classic.',
  },
  {
    id: 'TC-04', title: 'Totals always show two decimals', type: 'Edge', priority: 'Medium',
    pre: 'Logged in; empty cart.',
    steps: ['Add 3 Tiramisù (€5.90 each)', 'Open the cart'],
    data: '3 × €5.90',
    expected: 'Items total shows €17.70 (exactly two decimals).',
    why: 'In JavaScript 3 × 5.9 is 17.700000000000003: decimals are where floating-point rounding errors appear.',
  },
  {
    id: 'TC-05', title: 'Only future delivery slots are offered', type: 'Edge', priority: 'High',
    pre: `App clock at ${SPEC.now.slice(11, 16)}; cart with items; on Checkout.`,
    steps: ['Open the delivery time picker', 'Read the earliest slots offered for today'],
    data: `Clock ${SPEC.now.slice(11, 16)}`,
    expected: `No slot that has already started is listed; the first slot starts after ${SPEC.now.slice(11, 16)}.`,
    why: 'Time is input too. Test around "now", like any other boundary.',
  },
  {
    id: 'TC-06', title: 'Order cannot be placed with an address that was not selected', type: 'Negative', priority: 'High',
    pre: 'On Checkout with a valid cart and slot.',
    steps: ['Type "Kastanienallee" in the address field', 'Do not pick a suggestion', 'Tap Place order'],
    data: 'Partial address "Kastanienallee" (no number)',
    expected: 'No order is created; an error next to the address field asks to choose an address.',
    why: 'Negative case from US-07 AC2. Bad addresses mean failed deliveries.',
  },
  {
    id: 'TC-07', title: 'Double tap on Place order creates one order', type: 'Negative', priority: 'High',
    pre: 'On Checkout with a valid cart, slot and selected address; slow network.',
    steps: ['Tap Place order twice quickly', 'Wait for the confirmation', 'Open Orders'],
    data: 'Network: slow / "3G"',
    expected: 'Exactly one new order and one payment exist.',
    why: 'Real users tap twice when an app feels slow. Critical: money.',
  },
  {
    id: 'TC-08', title: 'Checkout keeps typed data after rotation', type: 'Non-functional', priority: 'Medium',
    pre: 'On Checkout in portrait.',
    steps: ['Select an address and a slot', 'Rotate the phone to landscape', 'Rotate back to portrait'],
    data: 'Any selected address and slot',
    expected: 'The address and slot are still filled in after each rotation.',
    why: 'Mobile-specific: rotation recreates the screen on Android and often loses state.',
  },
];

const RUBRIC = [
  { id: 'specific', text: <>Steps are specific: another tester could follow them without asking you anything.</> },
  { id: 'one', text: <>Each case checks one thing, so a failure points to one problem.</> },
  { id: 'measurable', text: <>Every expected result is measurable (a value, a message, a state), never "works correctly".</> },
  { id: 'negative', text: <>At least one negative case (invalid or repeated input) and one edge case (a boundary).</> },
  { id: 'data', text: <>Preconditions and test data are written down, including exact amounts.</> },
  { id: 'priority', text: <>Priority follows risk: money and checkout blockers are High.</> },
  { id: 'oracle', text: <>Each expected result comes from the brief (a user story AC), not from what the app happens to do.</> },
];

export default function CasesForm() {
  const state = useCapstone();
  const [data, setData, loaded] = useArtifact<Cases>('cases', blank);
  const [active, setActive] = useState(0);
  const [problem, setProblem] = useState('');
  const c = data.items[active] ?? emptyCase();
  const setCase = (patch: Partial<Case>) => setData((d) => ({ ...d, items: d.items.map((x, i) => (i === active ? { ...x, ...patch } : x)) }));
  const submitted = !!data.submittedAt;
  const nFilled = data.items.filter(filled).length;
  const types = new Set(data.items.filter(filled).map((x) => x.type));

  const submit = (force = false) => {
    if (nFilled < 5 && !force) {
      setProblem(`${nFilled} of 5 cases have a title, steps and an expected result.`);
      return;
    }
    setProblem('');
    setData((d) => ({ ...d, submittedAt: d.submittedAt ?? new Date().toISOString() }));
    completePhase('cases');
    setTimeout(() => document.getElementById('model-cases')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-subtle" />;

  return (
    <div className="not-prose space-y-8">
      <form
        className="card p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Your test cases: cart and checkout</h2>
          <span className="text-xs text-faint">{nFilled} / 5 complete · saved automatically</span>
        </div>

        <div role="tablist" aria-label="Test cases" className="mt-4 grid grid-cols-5 gap-1.5">
          {data.items.map((x, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              id={`tc-tab-${i}`}
              aria-selected={i === active}
              aria-controls="tc-panel"
              onClick={() => setActive(i)}
              className={[
                'min-w-0 rounded-lg border px-1 py-2 text-xs font-semibold sm:text-sm',
                i === active ? 'border-brand bg-brand-soft text-brand' : 'border-line hover:border-line-strong',
              ].join(' ')}
            >
              <span className="flex items-center justify-center gap-1">
                {filled(x) && <CircleCheck size={14} className="shrink-0 text-ok" aria-label="complete" />}
                <span className="truncate">TC-{i + 1}</span>
              </span>
            </button>
          ))}
        </div>

        <div id="tc-panel" role="tabpanel" aria-labelledby={`tc-tab-${active}`} className="mt-5 space-y-5">
          <Field label="Title" hint="What behavior does this case check? One behavior.">
            {(id) => <input id={id} value={c.title} onChange={(e) => setCase({ title: e.target.value })} className={inputCls} placeholder="e.g. Applying the same coupon twice is rejected" />}
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextArea label="Preconditions" hint="State before step 1: logged in? what's in the cart?" value={c.pre} onChange={(v) => setCase({ pre: v })} rows={3} />
            <TextArea label="Test data" hint="Exact values: codes, amounts, addresses, times." value={c.data} onChange={(v) => setCase({ data: v })} rows={3} />
          </div>
          <TextArea label="Steps" hint="One action per line." value={c.steps} onChange={(v) => setCase({ steps: v })} rows={4} placeholder={'Open the cart\nEnter the code\nTap Apply'} />
          <TextArea label="Expected result" hint="What exactly do you see if the app is right? Use values." value={c.expected} onChange={(v) => setCase({ expected: v })} rows={2} />
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <Field label="Priority">
              {(id) => (
                <select id={id} value={c.priority} onChange={(e) => setCase({ priority: e.target.value as Case['priority'] })} className={inputCls}>
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              )}
            </Field>
            <Field label="Type">
              {(id) => (
                <select id={id} value={c.type} onChange={(e) => setCase({ type: e.target.value as Case['type'] })} className={inputCls}>
                  {TYPES.map((p) => <option key={p}>{p}</option>)}
                </select>
              )}
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={active === 0} onClick={() => setActive((a) => Math.max(0, a - 1))} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand disabled:opacity-40">
              ← Previous case
            </button>
            <button type="button" disabled={active === 4} onClick={() => setActive((a) => Math.min(4, a + 1))} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand disabled:opacity-40">
              Next case →
            </button>
          </div>
        </div>

        {problem && (
          <div role="alert" className="mt-5 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
            <p>
              <strong>Not quite done:</strong> {problem}
            </p>
            <button type="button" onClick={() => submit(true)} className="mt-2 font-medium text-brand underline">
              Compare with the model anyway
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
            {submitted ? 'Update and compare again' : 'Submit cases and compare'}
          </button>
          {state?.phases.cases && (
            <a href={href('/capstone/test')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold hover:border-brand hover:text-brand">
              Next: test the app <ArrowRight size={18} aria-hidden />
            </a>
          )}
        </div>
      </form>

      {submitted && (
        <section id="model-cases" className="scroll-mt-24 space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-ok uppercase">Cases submitted</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Review: your cases, then the model set</h2>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold">Automatic review of your cases</h3>
            <p className="mt-1 text-sm text-muted">
              A quick reviewer's pass. It's only a heuristic, so use it as a prompt, not a grade.
              {!types.has('Negative') && ' You have no negative case yet.'}
              {!types.has('Edge') && ' You have no edge (boundary) case yet.'}
            </p>
            <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.items.map((x, i) => (
                <li key={i} className="min-w-0 rounded-xl border border-line bg-subtle p-3">
                  <p className="truncate text-sm font-semibold">
                    TC-{i + 1}: {x.title || <span className="text-faint">(no title)</span>}
                  </p>
                  <p className="text-xs text-faint">
                    {x.type} · {x.priority}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {lint(x).map((l) => (
                      <li key={l.text} className={['flex items-start gap-1.5 text-xs', l.ok ? 'text-ok' : 'text-warn'].join(' ')}>
                        {l.ok ? <CircleCheck size={14} className="mt-px shrink-0" aria-hidden /> : <CircleAlert size={14} className="mt-px shrink-0" aria-hidden />}
                        <span className={l.ok ? '' : 'text-fg'}>{l.text}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-3">
              <h3 className="font-semibold">Eight model test cases</h3>
              {MODELS.map((m) => (
                <details key={m.id} className="card group min-w-0 p-4">
                  <summary className="flex cursor-pointer list-none items-start gap-3">
                    <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 font-mono text-xs font-semibold text-brand">{m.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{m.title}</span>
                      <span className="text-xs text-faint">
                        {m.type} · {m.priority}
                      </span>
                    </span>
                    <span className="text-faint transition-transform group-open:rotate-90" aria-hidden>
                      ›
                    </span>
                  </summary>
                  <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm leading-relaxed">
                    <div><dt className="text-xs font-semibold text-faint">Preconditions</dt><dd>{m.pre}</dd></div>
                    <div><dt className="text-xs font-semibold text-faint">Test data</dt><dd>{m.data}</dd></div>
                    <div>
                      <dt className="text-xs font-semibold text-faint">Steps</dt>
                      <dd><ol className="list-decimal pl-5">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol></dd>
                    </div>
                    <div><dt className="text-xs font-semibold text-faint">Expected result</dt><dd>{m.expected}</dd></div>
                    <div className="rounded-lg bg-subtle p-2 text-muted"><dt className="sr-only">Why this case</dt><dd><strong className="text-fg">Why:</strong> {m.why}</dd></div>
                  </dl>
                </details>
              ))}
            </div>
            <div className="min-w-0 space-y-4">
              <Rubric items={RUBRIC} checked={data.rubric} onToggle={(id) => setData((d) => ({ ...d, rubric: { ...d.rubric, [id]: !d.rubric[id] } }))} />
              <p className="text-sm text-muted">
                Keep your cases handy during the session: running them is a great way to start exploring. Refresher:{' '}
                <a className="text-brand underline" href={href('/tutorials/writing-test-cases')}>Writing test cases</a>.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
