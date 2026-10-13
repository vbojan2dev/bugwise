import { useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, ArrowRight, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { completePhase, SPEC } from '@/lib/capstone';
import { href } from '@/lib/url';
import { useArtifact, useCapstone } from './useCapstone';
import { appendLine, Field, inputCls, Rubric, Suggestions, TextArea } from './ui';

interface Risk {
  id: string;
  text: string;
  l: number;
  i: number;
}
interface Plan {
  scopeIn: string;
  scopeOut: string;
  risks: Risk[];
  devices: string[];
  devicesNote: string;
  data: string;
  entry: string;
  exit: string;
  submittedAt?: string;
  rubric: Record<string, boolean>;
}

const newRisk = (): Risk => ({ id: Math.random().toString(36).slice(2, 9), text: '', l: 2, i: 2 });
const blank = (): Plan => ({ scopeIn: '', scopeOut: '', risks: [newRisk(), newRisk(), newRisk()], devices: [], devicesNote: '', data: '', entry: '', exit: '', rubric: {} });

const DEVICES = [
  { id: 'se', label: 'iPhone SE (3rd gen), iOS 17' },
  { id: 'ip15', label: 'iPhone 15, iOS 18' },
  { id: 'ip16pm', label: 'iPhone 16 Pro Max, iOS 18' },
  { id: 'a15', label: 'Galaxy A15, Android 14' },
  { id: 'px8', label: 'Pixel 8, Android 15' },
  { id: 's24', label: 'Galaxy S24, Android 14' },
  { id: 'ipad', label: 'iPad Air, iPadOS 18' },
  { id: 'web', label: 'Website, Chrome desktop' },
];
const UNSUPPORTED = ['ipad', 'web'];

const IN_IDEAS = ['Redesigned checkout (slots, address, Place order)', 'Cart: coupon, delivery fee, totals', 'Login', 'Search and filters', 'Menu quantity limit', 'Tracking and push notifications', 'Notification settings and logout', 'Deutsch and Srpski', 'Dark mode and accessibility', 'Rotation, background, offline', 'Regression of the core order flow'];
const OUT_IDEAS = ['Real payments (simulated on staging, KI-2)', 'Tablets and website (not supported)', 'Load and performance testing', 'Backend APIs directly'];
const DATA_IDEAS = [`Test account ${SPEC.testAccount.email}`, `${SPEC.coupon.code} plus invalid and lowercase codes`, `Carts just below / at / above €${SPEC.freeDeliveryFrom} after discount`, `Quantities ${SPEC.maxPerDish - 1}, ${SPEC.maxPerDish}, ${SPEC.maxPerDish + 1} of one dish`, 'Names with accents (Ćevapi, Crème brûlée)', 'Partial vs selected addresses'];
const ENTRY_IDEAS = [`Build ${SPEC.build} installed on staging`, 'Smoke test passes: login → order → tracking', 'Test account and coupon work'];
const EXIT_IDEAS = ['All high-risk areas tested on must-have devices', 'No open Critical bugs', 'Every open Major bug has a decision', 'Summary report delivered by Thursday'];

const RUBRIC = [
  { id: 'out', text: <>Scope <strong>out</strong> names at least two things, each with a reason.</> },
  { id: 'scored', text: <>Every risk has a likelihood and an impact, and the highest scores are tested first.</> },
  { id: 'money', text: <>Money (double charges, wrong totals) and personal data risks are at or near the top.</> },
  { id: 'devices', text: <>Devices cover both platforms and the smallest supported screen, and skip unsupported ones (tablets, web).</> },
  { id: 'data', text: <>Test data includes boundaries (€{SPEC.freeDeliveryFrom} after discount, {SPEC.maxPerDish} per dish) and invalid values.</> },
  { id: 'criteria', text: <>Entry and exit criteria are measurable: someone else could say "yes, met" or "no, not met".</> },
  { id: 'questions', text: <>The brief's open questions show up as risks or questions, not silent assumptions.</> },
  { id: 'short', text: <>It fits on one page and a developer could read it in two minutes.</> },
];

const MODEL_RISKS: [string, number, number, string][] = [
  ['Customer charged twice / duplicate orders', 2, 3, 'Double tap, slow network, Back during placing'],
  ['Wrong total: coupon, delivery fee, rounding', 3, 3, 'Boundary carts around €20 after discount; reapply coupon'],
  ['Undeliverable orders: past slot, bad address', 2, 3, 'Slots around the frozen clock; partial addresses'],
  ['Personal data visible after logout', 2, 3, 'Logout → Back; app switcher'],
  ["Users can't log in on phones", 2, 3, 'Auto-capitalized email, spaces, wrong password'],
  ['Blind / low-vision users blocked', 2, 2, 'Screen reader through ordering; large text; color-only info'],
  ['DE / SR text and prices broken', 3, 1, 'Main flow in each language'],
];

export default function PlanForm() {
  const state = useCapstone();
  const [plan, setPlan, loaded] = useArtifact<Plan>('plan', blank);
  const [problems, setProblems] = useState<string[]>([]);
  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => setPlan((p) => ({ ...p, [k]: v }));
  const setRisk = (id: string, patch: Partial<Risk>) => setPlan((p) => ({ ...p, risks: p.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const sortRisks = () => setPlan((p) => ({ ...p, risks: [...p.risks].sort((a, b) => b.l * b.i - a.l * a.i) }));
  const submitted = !!plan.submittedAt;
  const unsupported = plan.devices.filter((d) => UNSUPPORTED.includes(d));

  const check = () => {
    const out: string[] = [];
    if (!plan.scopeIn.trim()) out.push('Scope in is empty.');
    if (!plan.scopeOut.trim()) out.push('Scope out is empty. Saying what you will NOT test is half the value of a plan.');
    if (plan.risks.filter((r) => r.text.trim()).length < 3) out.push('Add at least three risks.');
    if (plan.devices.length < 2) out.push('Pick at least two devices.');
    if (!plan.data.trim()) out.push('Test data is empty.');
    if (!plan.entry.trim() || !plan.exit.trim()) out.push('Entry and exit criteria are both needed.');
    return out;
  };

  const submit = (force = false) => {
    const out = check();
    if (out.length && !force) {
      setProblems(out);
      return;
    }
    setProblems([]);
    setPlan((p) => ({ ...p, submittedAt: p.submittedAt ?? new Date().toISOString() }));
    completePhase('plan');
    setTimeout(() => document.getElementById('model-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-subtle" />;

  return (
    <div className="not-prose space-y-8">
      <form
        className="card space-y-7 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Test plan: {SPEC.app} {SPEC.version}</h2>
          <span className="text-xs text-faint">Saved automatically in this browser</span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-w-0">
            <TextArea label="1. Scope: in" hint="Which features and behaviors you will test." value={plan.scopeIn} onChange={(v) => set('scopeIn', v)} rows={6} placeholder="- Redesigned checkout…" />
            <Suggestions items={IN_IDEAS} value={plan.scopeIn} onAdd={(l) => set('scopeIn', appendLine(plan.scopeIn, l))} />
          </div>
          <div className="min-w-0">
            <TextArea label="2. Scope: out" hint="What you deliberately won't test, and why." value={plan.scopeOut} onChange={(v) => set('scopeOut', v)} rows={6} placeholder="- Real payments, because…" />
            <Suggestions items={OUT_IDEAS} value={plan.scopeOut} onAdd={(l) => set('scopeOut', appendLine(plan.scopeOut, l))} />
          </div>
        </div>

        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">3. Risks</legend>
          <p className="mt-0.5 text-xs text-muted">
            What could go wrong for users or the business? Rate likelihood (L) and impact (I) from 1 (low) to 3 (high). Score = L × I; test the highest first.
          </p>
          <ul className="mt-3 space-y-2">
            {plan.risks.map((r, n) => {
              const score = r.l * r.i;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-subtle p-2 sm:flex-nowrap">
                  <input
                    aria-label={`Risk ${n + 1}`}
                    value={r.text}
                    onChange={(e) => setRisk(r.id, { text: e.target.value })}
                    placeholder="e.g. Customer is charged twice"
                    className={inputCls + ' w-full sm:w-0 sm:flex-1'}
                  />
                  <label className="flex items-center gap-1 text-xs text-muted">
                    L
                    <select aria-label={`Likelihood of risk ${n + 1}`} value={r.l} onChange={(e) => setRisk(r.id, { l: +e.target.value })} className={inputCls + ' w-14 px-2'}>
                      {[1, 2, 3].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted">
                    I
                    <select aria-label={`Impact of risk ${n + 1}`} value={r.i} onChange={(e) => setRisk(r.id, { i: +e.target.value })} className={inputCls + ' w-14 px-2'}>
                      {[1, 2, 3].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                  <span
                    className={['w-10 rounded-md px-1.5 py-1 text-center text-xs font-bold tabular-nums', score >= 6 ? 'bg-danger-soft text-danger' : score >= 3 ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'].join(' ')}
                    aria-label={`Score ${score}`}
                  >
                    {score}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlan((p) => ({ ...p, risks: p.risks.filter((x) => x.id !== r.id) }))}
                    disabled={plan.risks.length <= 1}
                    aria-label={`Remove risk ${n + 1}`}
                    className="grid size-9 place-items-center rounded-lg text-faint hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlan((p) => ({ ...p, risks: [...p.risks, newRisk()] }))}
              disabled={plan.risks.length >= 8}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand disabled:opacity-40"
            >
              <Plus size={15} aria-hidden /> Add risk
            </button>
            <button type="button" onClick={sortRisks} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
              <ArrowDownWideNarrow size={15} aria-hidden /> Sort by score
            </button>
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">4. Devices and environments</legend>
          <p className="mt-0.5 text-xs text-muted">Pick the devices you would test on. Check the brief's supported devices first.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEVICES.map((d) => (
              <label key={d.id} className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-[var(--brand)]"
                  checked={plan.devices.includes(d.id)}
                  onChange={() => setPlan((p) => ({ ...p, devices: p.devices.includes(d.id) ? p.devices.filter((x) => x !== d.id) : [...p.devices, d.id] }))}
                />
                <span className="min-w-0">{d.label}</span>
              </label>
            ))}
          </div>
          {unsupported.length > 0 && (
            <p className="mt-2 flex items-start gap-2 text-sm text-warn">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> Check the brief: is everything you picked actually supported in 2.0?
            </p>
          )}
          <div className="mt-3">
            <Field label="Settings to cover" hint="Languages, dark mode, large text, screen readers, network…">
              {(id) => <input id={id} value={plan.devicesNote} onChange={(e) => set('devicesNote', e.target.value)} className={inputCls} placeholder="e.g. Deutsch on the smallest phone, dark mode on Android, VoiceOver…" />}
            </Field>
          </div>
        </fieldset>

        <div className="min-w-0">
          <TextArea label="5. Test data" hint="Accounts, codes and values you need, especially boundaries and invalid ones." value={plan.data} onChange={(v) => set('data', v)} rows={5} />
          <Suggestions items={DATA_IDEAS} value={plan.data} onAdd={(l) => set('data', appendLine(plan.data, l))} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-w-0">
            <TextArea label="6. Entry criteria" hint="When can testing start?" value={plan.entry} onChange={(v) => set('entry', v)} rows={4} />
            <Suggestions items={ENTRY_IDEAS} value={plan.entry} onAdd={(l) => set('entry', appendLine(plan.entry, l))} />
          </div>
          <div className="min-w-0">
            <TextArea label="7. Exit criteria" hint="When is testing done enough to recommend go or no-go?" value={plan.exit} onChange={(v) => set('exit', v)} rows={4} />
            <Suggestions items={EXIT_IDEAS} value={plan.exit} onAdd={(l) => set('exit', appendLine(plan.exit, l))} />
          </div>
        </div>

        {problems.length > 0 && (
          <div role="alert" className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
            <p className="font-semibold">Almost there. Your plan is missing:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <button type="button" onClick={() => submit(true)} className="mt-3 text-sm font-medium text-brand underline">
              Compare with the model anyway
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
            {submitted ? 'Update and compare again' : 'Submit plan and compare'}
          </button>
          {state?.phases.plan && (
            <a href={href('/capstone/cases')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold hover:border-brand hover:text-brand">
              Next: write test cases <ArrowRight size={18} aria-hidden />
            </a>
          )}
        </div>
      </form>

      {submitted && (
        <section id="model-plan" className="scroll-mt-24 space-y-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-ok uppercase">Plan submitted</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Compare with a model plan</h2>
            <p className="mt-2 max-w-3xl text-muted">
              This is how an experienced tester might fill in the same page. Yours doesn't need to match word for word; look for the <em>thinking</em> you missed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <article className="card min-w-0 space-y-5 p-5 text-sm leading-relaxed sm:p-6">
              <ModelBlock title="Scope: in">
                Redesigned checkout (slots, address autocomplete, Place order); cart with coupon, delivery fee and totals; login; search and filters; menu limits; tracking and push
                notifications; notification settings and logout; Deutsch and Srpski; dark mode and accessibility; rotation, background and offline; a short regression of the
                core order flow (login → menu → cart → checkout → tracking).
              </ModelBlock>
              <ModelBlock title="Scope: out">
                Real payments (simulated on staging, KI-2: covered by the payments team's sandbox tests). Tablets and website (not supported in 2.0). Load testing (platform team).
                Calling backend APIs directly (no access this sprint).
              </ModelBlock>
              <div>
                <h3 className="font-semibold">Risks (highest first)</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[30rem] text-left text-sm">
                    <thead className="text-xs text-faint">
                      <tr>
                        <th className="py-1 pr-2 font-medium">Risk</th>
                        <th className="py-1 pr-2 font-medium">L × I</th>
                        <th className="py-1 font-medium">How we test it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...MODEL_RISKS].sort((a, b) => b[1] * b[2] - a[1] * a[2]).map(([r, l, i, m]) => (
                        <tr key={r} className="border-t border-line align-top">
                          <td className="py-1.5 pr-2">{r}</td>
                          <td className="py-1.5 pr-2 whitespace-nowrap tabular-nums">
                            {l} × {i} = <strong>{l * i}</strong>
                          </td>
                          <td className="py-1.5 text-muted">{m}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-muted">
                  Plus project risks: OQ-1 (who may use {SPEC.coupon.code}) and OQ-2 (minimum order) are undecided. Raise them with Product on day one; don't block on them.
                </p>
              </div>
              <ModelBlock title="Devices and settings">
                iPhone SE 3rd gen with iOS 17 (smallest screen, oldest OS), iPhone 16 Pro Max with large text, Galaxy A15 with Android 14 (most common, low-end), Pixel 8 with
                TalkBack. Each language on the smallest phone; dark mode on one device per platform; airplane mode and a slow network once per flow.
              </ModelBlock>
              <ModelBlock title="Test data">
                Test account {SPEC.testAccount.email} (also typed with a capital letter and a trailing space); {SPEC.coupon.code}, "welcome10", an invalid code; carts of €21.40
                (€19.26 after discount) and €24.30 (€21.87), plus carts without a coupon just under and over €20; quantities {SPEC.maxPerDish - 1}, {SPEC.maxPerDish} and {SPEC.maxPerDish + 1}; searches with and
                without accents; a very long restaurant name; partial and selected addresses; slots around the frozen clock ({SPEC.now.slice(11, 16)}).
              </ModelBlock>
              <ModelBlock title="Entry criteria">
                Build {SPEC.build} on staging; smoke test passes (log in, order, see tracking); test account and coupon work; brief reviewed with Product.
              </ModelBlock>
              <ModelBlock title="Exit criteria">
                Every risk scored 6 or more tested on the must-have devices; no open Critical bugs; every open Major bug has a fix or an agreed decision; summary report with a
                recommendation sent by Thursday 17:00.
              </ModelBlock>
            </article>
            <div className="min-w-0 space-y-4">
              <Rubric items={RUBRIC} checked={plan.rubric} onToggle={(id) => setPlan((p) => ({ ...p, rubric: { ...p.rubric, [id]: !p.rubric[id] } }))} />
              <p className="text-sm text-muted">
                Want the full method? Read <a className="text-brand underline" href={href('/tutorials/writing-a-test-plan')}>Writing a test plan</a>.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ModelBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-muted">{children}</p>
    </div>
  );
}
