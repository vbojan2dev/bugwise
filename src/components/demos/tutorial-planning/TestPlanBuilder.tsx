import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw, TriangleAlert, X } from 'lucide-react';

/**
 * Test plan builder for "Apple Pay & Google Pay at checkout" in the ShopFast apps.
 * The learner fills four sections (scope, risks, devices, exit criteria), gets feedback on each,
 * and ends with a one-page plan in Markdown they can copy.
 */

type InOut = 'in' | 'out';

const scopeItems: { text: string; answer: InOut; why: string }[] = [
  { text: 'Paying with Apple Pay in the iOS app', answer: 'in', why: 'This is the feature itself.' },
  { text: 'Paying with Google Pay in the Android app', answer: 'in', why: 'This is the feature itself.' },
  { text: 'Canceling the wallet sheet and returning to checkout', answer: 'in', why: 'Users cancel all the time. The cart and checkout must survive it.' },
  { text: 'Wallet button hidden or offering setup when the wallet is unavailable', answer: 'in', why: 'Part of the feature: a wallet button that cannot work is a dead end.' },
  { text: 'Order confirmation and email show the wallet as payment method', answer: 'in', why: 'New data flows into existing screens, so they belong to the feature.' },
  { text: 'Regression: card and PayPal payments still work', answer: 'in', why: 'They are "not changed", but the checkout screen around them was. A light regression check is in scope.' },
  { text: 'Apple Pay and Google Pay on the web shop', answer: 'out', why: 'The brief says the web shop gets wallets next quarter. Say so explicitly, so nobody assumes it was tested.' },
  { text: 'Express "Buy with Apple Pay" button on product pages', answer: 'out', why: 'Not part of this release. Listing it as out avoids a surprise question at the release meeting.' },
  { text: 'Load testing PayCo’s payment servers', answer: 'out', why: 'The payment provider is responsible for its own capacity. Your team tests its integration, not their servers.' },
];

const risks: { id: string; text: string; l: number; i: number; note: string }[] = [
  { id: 'R1', text: 'Customer is charged twice (double tap, retry on slow network)', l: 2, i: 3, note: 'Impact is high: real money and angry customers. Double taps on slow networks are common.' },
  { id: 'R2', text: 'Amount in the wallet sheet differs from the cart total (coupon, shipping, tax)', l: 2, i: 3, note: 'Impact is high: charging the wrong amount is a legal and trust problem. Coupons make it likely.' },
  { id: 'R3', text: 'Payment succeeds but no order is created (app killed, network drop)', l: 1, i: 3, note: 'Rare, but the customer pays and gets nothing. Impact is high even if likelihood is low.' },
  { id: 'R4', text: 'Wallet button shown on devices that cannot use it', l: 3, i: 2, note: 'Likely: many users have no card in their wallet, and some Android phones lack Google Play services.' },
  { id: 'R5', text: 'Canceling the wallet sheet leaves a spinner or locked checkout', l: 3, i: 2, note: 'Likely: cancel paths are often forgotten by developers. The user can usually restart the app, so impact is medium.' },
  { id: 'R6', text: 'Shipping address from the wallet is incomplete (no apartment number)', l: 2, i: 2, note: 'Medium both ways: wallet addresses vary in format, and a wrong address means a failed delivery.' },
  { id: 'R7', text: 'Wallet button style breaks the brand guidelines in dark mode', l: 2, i: 1, note: 'Low impact for customers, though store reviewers can flag it. Check it, but last.' },
];

const devices: { text: string; need: 'must' | 'good' | 'skip'; why: string }[] = [
  { text: 'iPhone 16 · iOS 18 · Face ID · cards in Wallet', need: 'must', why: 'The main Apple Pay path on a current iPhone.' },
  { text: 'iPhone SE · iOS 17 (oldest supported) · Touch ID', need: 'good', why: 'Different authentication (Touch ID) and the oldest OS you support.' },
  { text: 'iPhone with no cards in Wallet', need: 'must', why: 'Checks the "wallet unavailable" path (risk R4).' },
  { text: 'Pixel 9 · Android 15 · Google Wallet set up', need: 'must', why: 'The main Google Pay path on a current Android phone.' },
  { text: 'Samsung Galaxy A-series · Android 13 (oldest, popular)', need: 'good', why: 'A very common budget phone with the vendor’s own skin and the oldest supported Android.' },
  { text: 'Android phone without Google Play services', need: 'good', why: 'Google Pay cannot work here. The button must not appear (risk R4).' },
  { text: 'Windows laptop · Chrome', need: 'skip', why: 'The web shop is out of scope for this release.' },
  { text: 'Every Android phone in the office (14 devices)', need: 'skip', why: 'Expensive and not risk-based. Pick representative devices instead.' },
];

const exits: { text: string; good: boolean; why: string }[] = [
  { text: 'All high-priority test cases run on every "must" device', good: true, why: 'Measurable and tied to the riskiest paths.' },
  { text: 'No open Critical or Major bugs in checkout', good: true, why: 'Clear quality bar. Minor bugs can ship with a known-issues note.' },
  { text: 'Every risk scored 6 or higher is tested and its result reported', good: true, why: 'Connects the exit to your risk analysis.' },
  { text: 'Card and PayPal regression checklist passed', good: true, why: 'Proves the old payment methods were not broken by the change.' },
  { text: 'Testing stops when the release date arrives', good: false, why: 'A date is a deadline, not a quality signal. If time runs out, report what is left and let the team decide.' },
  { text: 'Zero open bugs of any severity', good: false, why: 'Unrealistic. Almost every release ships with some known minor bugs.' },
  { text: 'The testers feel confident', good: false, why: 'Not measurable. Two people would disagree on whether it is met.' },
];

const steps = ['Scope', 'Risks', 'Devices', 'Exit criteria', 'Your plan'];
const lvl = ['', 'Low', 'Medium', 'High'];

function cellTone(score: number) {
  if (score >= 6) return 'bg-danger-soft';
  if (score >= 3) return 'bg-warn-soft';
  return 'bg-ok-soft';
}

export default function TestPlanBuilder() {
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<(InOut | null)[]>(() => scopeItems.map(() => null));
  const [scores, setScores] = useState(() => risks.map(() => ({ l: 2, i: 2 })));
  const [showRiskModel, setShowRiskModel] = useState(false);
  const [picked, setPicked] = useState<boolean[]>(() => devices.map(() => false));
  const [devChecked, setDevChecked] = useState(false);
  const [exitPicked, setExitPicked] = useState<boolean[]>(() => exits.map(() => false));
  const [exitChecked, setExitChecked] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const area = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const moved = useRef(false);
  // Move focus to the panel after navigating, so keyboard and screen reader users land on the new section.
  useEffect(() => {
    if (moved.current) panel.current?.focus();
  }, [step]);

  const goTo = (n: number) => {
    moved.current = true;
    setStep(n);
    setCopied('idle');
  };

  const ordered = useMemo(
    () =>
      risks
        .map((r, n) => ({ ...r, ul: scores[n].l, ui: scores[n].i, score: scores[n].l * scores[n].i }))
        .sort((a, b) => b.score - a.score || b.ui - a.ui),
    [scores],
  );

  const scopeWrong = scope.filter((s, n) => s !== null && s !== scopeItems[n].answer).length;
  const scopeOpen = scope.filter((s) => s === null).length;
  const riskOff = risks.filter((r, n) => Math.abs(scores[n].l - r.l) > 1 || Math.abs(scores[n].i - r.i) > 1 || (r.i === 3 && scores[n].i < 3)).length;
  const missingMust = devices.filter((d, n) => d.need === 'must' && !picked[n]);
  const pickedSkip = devices.filter((d, n) => d.need === 'skip' && picked[n]);
  const badExits = exits.filter((e, n) => !e.good && exitPicked[n]);
  const goodExitCount = exits.filter((e, n) => e.good && exitPicked[n]).length;

  const flags: string[] = [];
  if (scopeOpen) flags.push(`${scopeOpen} scope item(s) not decided`);
  if (scopeWrong) flags.push(`${scopeWrong} scope item(s) on the wrong side`);
  if (riskOff) flags.push(`${riskOff} risk(s) scored far from the model answer`);
  if (missingMust.length) flags.push(`${missingMust.length} must-have device(s) missing`);
  if (pickedSkip.length) flags.push(`${pickedSkip.length} device pick(s) that add cost without reducing risk`);
  if (badExits.length) flags.push(`${badExits.length} exit criterion/criteria that can't be measured or met`);
  if (goodExitCount === 0) flags.push('no measurable exit criteria');

  const markdown = useMemo(() => {
    const ins = scopeItems.filter((_, n) => scope[n] === 'in').map((s) => `- ${s.text}`);
    const outs = scopeItems.filter((_, n) => scope[n] === 'out').map((s) => `- ${s.text}`);
    const devs = devices.filter((_, n) => picked[n]).map((d) => `- ${d.text}`);
    const ex = exits.filter((_, n) => exitPicked[n]).map((e) => `- ${e.text}`);
    const rows = ordered.map((r, n) => `| ${n + 1} | ${r.id} ${r.text} | ${lvl[r.ul]} | ${lvl[r.ui]} | ${r.score} |`);
    return [
      '# Test plan: Apple Pay & Google Pay at checkout',
      '',
      'ShopFast iOS & Android 5.2 · Sprint 14 · Owner: QA · Reviewed with: dev lead, product owner',
      '',
      '## Scope',
      '**In scope**',
      ...(ins.length ? ins : ['- (none chosen yet)']),
      '',
      '**Out of scope**',
      ...(outs.length ? outs : ['- (none chosen yet)']),
      '',
      '## Objectives',
      '- Customers can pay with Apple Pay (iOS) and Google Pay (Android) and receive a correct order.',
      '- Nobody is charged twice or charged the wrong amount.',
      '- Existing payment methods keep working.',
      '',
      '## Approach',
      '- Risk-based: test in the risk order below, highest score first.',
      '- Scripted test cases for payment, amount and order creation.',
      '- Two 60-minute exploratory sessions: wallet sheet + interruptions, slow network.',
      '- Regression checklist for card and PayPal payments.',
      '',
      '## Risks (testing priority)',
      '| # | Risk | Likelihood | Impact | Score |',
      '| - | ---- | ---------- | ------ | ----- |',
      ...rows,
      '',
      '## Devices',
      ...(devs.length ? devs : ['- (none chosen yet)']),
      '',
      '## Environment & test data',
      '- Staging build with PayCo sandbox keys (no real money moves).',
      '- Apple Pay: sandbox tester account with Apple test cards in Wallet.',
      '- Google Pay: TEST environment (returns test tokens, no real charge).',
      '- Accounts: one with saved address, one new; a coupon code; an item with free and paid shipping.',
      '',
      '## Entry criteria',
      '- Both wallets work end to end on staging (smoke test passed).',
      '- Sandbox accounts and test cards are ready.',
      '- Acceptance criteria agreed with the product owner.',
      '',
      '## Exit criteria',
      ...(ex.length ? ex : ['- (none chosen yet)']),
      '',
      '## Schedule & people',
      '- Days 1-2: test cases and data. Days 3-7: execution. Day 8: regression. Day 9: summary.',
      '- QA: Ana (iOS), Ben (Android). Dev contact: Chris. Decision on release: product owner.',
      '',
      '## Deliverables',
      '- Test cases linked to the user story, bug reports in Jira, a short test summary report.',
    ].join('\n');
  }, [scope, picked, exitPicked, ordered]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied('ok');
    } catch {
      area.current?.focus();
      area.current?.select();
      setCopied('fail');
    }
  };

  const reset = () => {
    setScope(scopeItems.map(() => null));
    setScores(risks.map(() => ({ l: 2, i: 2 })));
    setShowRiskModel(false);
    setPicked(devices.map(() => false));
    setDevChecked(false);
    setExitPicked(exits.map(() => false));
    setExitChecked(false);
    setCopied('idle');
    goTo(0);
  };

  const btn = 'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Test plan builder</p>
          <p className="text-sm text-muted">ShopFast apps · Apple Pay & Google Pay at checkout</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={`inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg ${btn}`}
        >
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>

      <nav aria-label="Plan sections" className="border-b border-line px-5 py-3">
        <ol className="flex flex-wrap gap-1.5">
          {steps.map((s, n) => (
            <li key={s}>
              <button
                type="button"
                aria-current={n === step ? 'step' : undefined}
                onClick={() => goTo(n)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${btn} ${n === step ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted hover:text-fg'}`}
              >
                {n + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div ref={panel} tabIndex={-1} className="space-y-4 p-5 focus:outline-none">
        {step === 0 && (
          <>
            <div className="rounded-2xl border border-line bg-subtle p-3.5 text-sm text-fg">
              <p className="font-semibold">Feature brief</p>
              <p className="mt-1 text-muted">
                Add Apple Pay (iOS app) and Google Pay (Android app) as payment options on the checkout screen, using our existing payment provider PayCo.
                Card and PayPal flows are not changed. The web shop gets wallets next quarter. Express checkout from product pages is a later project.
              </p>
            </div>
            <p className="text-sm text-muted">Mark each item as in or out of scope for this release.</p>
            <ul className="space-y-2">
              {scopeItems.map((s, n) => {
                const pick = scope[n];
                const right = pick === s.answer;
                return (
                  <li key={s.text} className="min-w-0 rounded-xl border border-line p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 text-sm text-fg">{s.text}</p>
                      <div className="flex shrink-0 gap-1.5" role="group" aria-label={`${s.text}: in or out of scope`}>
                        {(['in', 'out'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            aria-pressed={pick === v}
                            onClick={() => setScope((prev) => prev.map((p, k) => (k === n ? v : p)))}
                            className={`w-14 rounded-lg border py-1 text-xs font-semibold ${btn} ${
                              pick === v ? (right ? 'border-ok bg-ok-soft text-fg' : 'border-danger bg-danger-soft text-fg') : 'border-line text-muted hover:text-fg'
                            }`}
                          >
                            {v === 'in' ? 'In' : 'Out'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div aria-live="polite">
                      {pick && (
                        <p className="mt-1.5 text-xs text-muted">
                          <strong className={right ? 'text-ok' : 'text-danger'}>{right ? 'Good call.' : `Better: ${s.answer === 'in' ? 'in' : 'out of'} scope.`}</strong> {s.why}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-muted">
              Rate how <strong className="text-fg">likely</strong> each risk is and how bad the <strong className="text-fg">impact</strong> would be. Score = likelihood × impact.
              The highest scores get tested first.
            </p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ul className="min-w-0 space-y-3">
                {risks.map((r, n) => {
                  const s = scores[n];
                  const off = Math.abs(s.l - r.l) > 1 || Math.abs(s.i - r.i) > 1 || (r.i === 3 && s.i < 3);
                  return (
                    <li key={r.id} className="min-w-0 rounded-xl border border-line p-3">
                      <p className="text-sm text-fg">
                        <span className="mr-1 rounded bg-subtle px-1.5 py-0.5 text-xs font-bold">{r.id}</span>
                        {r.text}
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(['l', 'i'] as const).map((k) => (
                          <label key={k} className="min-w-0 text-xs text-muted">
                            <span className="flex justify-between">
                              <span>{k === 'l' ? 'Likelihood' : 'Impact'}</span>
                              <span className="font-semibold text-fg">{lvl[s[k]]}</span>
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={1}
                              value={s[k]}
                              aria-valuetext={lvl[s[k]]}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setScores((prev) => prev.map((p, m) => (m === n ? { ...p, [k]: v } : p)));
                              }}
                              className="mt-1 w-full accent-[var(--color-brand)]"
                            />
                          </label>
                        ))}
                      </div>
                      {showRiskModel && (
                        <p className={`mt-1.5 text-xs ${off ? 'text-danger' : 'text-muted'}`}>
                          <strong className={off ? 'text-danger' : 'text-ok'}>
                            {off ? 'Rethink: ' : 'Close enough. '}
                            Model: {lvl[r.l]} × {lvl[r.i]} = {r.l * r.i}.
                          </strong>{' '}
                          <span className="text-muted">{r.note}</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="min-w-0 space-y-4">
                <figure>
                  <figcaption className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Your risk matrix</figcaption>
                  <div className="flex gap-2">
                    <div className="flex w-4 shrink-0 items-center justify-center" aria-hidden="true">
                      <span className="rotate-180 text-xs whitespace-nowrap text-muted [writing-mode:vertical-rl]">Impact →</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-3 gap-1" role="list" aria-label="Risk matrix: impact rows from high to low, likelihood columns from low to high">
                        {[3, 2, 1].map((imp) =>
                          [1, 2, 3].map((lik) => {
                            const here = ordered.filter((r) => r.ui === imp && r.ul === lik);
                            return (
                              <div
                                key={`${imp}-${lik}`}
                                role="listitem"
                                className={`flex min-h-14 flex-wrap content-start gap-1 rounded-lg p-1.5 ${cellTone(imp * lik)}`}
                              >
                                <span className="sr-only">
                                  Impact {lvl[imp]}, likelihood {lvl[lik]}, score {imp * lik}: {here.length ? here.map((r) => r.id).join(', ') : 'empty'}
                                </span>
                                <span className="w-full text-[10px] text-muted" aria-hidden="true">
                                  {imp * lik}
                                </span>
                                {here.map((r) => (
                                  <span key={r.id} className="rounded bg-surface px-1 text-[11px] font-bold text-fg" aria-hidden="true">
                                    {r.id}
                                  </span>
                                ))}
                              </div>
                            );
                          }),
                        )}
                      </div>
                      <p className="mt-1 text-center text-xs text-muted">Likelihood →</p>
                    </div>
                  </div>
                </figure>

                <div>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Testing order</p>
                  <ol className="space-y-1 text-sm" aria-live="polite">
                    {ordered.map((r, n) => (
                      <li key={r.id} className="flex gap-2">
                        <span className={`w-6 shrink-0 rounded text-center text-xs leading-5 font-bold ${cellTone(r.score)} text-fg`}>{r.score}</span>
                        <span className="min-w-0 text-fg">
                          <span className="sr-only">Priority {n + 1}, score {r.score}: </span>
                          {r.id} {r.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  aria-pressed={showRiskModel}
                  onClick={() => setShowRiskModel((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-fg hover:bg-subtle ${btn}`}
                >
                  <Check size={15} aria-hidden="true" /> {showRiskModel ? 'Hide model answer' : 'Compare with model answer'}
                </button>
                {showRiskModel && (
                  <p className="text-sm text-muted" aria-live="polite">
                    {riskOff === 0
                      ? 'Your scores are close to the model. Notice how the money risks (R1 to R3) rise to the top.'
                      : `${riskOff} risk(s) need another look. Anything that loses money or orders deserves High impact, even if it is rare.`}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted">Pick the devices for your matrix. Aim for the smallest set that covers the risks.</p>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {devices.map((d, n) => {
                const on = picked[n];
                const verdict = devChecked && (on ? (d.need === 'skip' ? 'bad' : 'good') : d.need === 'must' ? 'missing' : null);
                return (
                  <li key={d.text} className="min-w-0">
                    <label
                      className={`flex h-full cursor-pointer gap-2.5 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-brand ${
                        verdict === 'good' ? 'border-ok bg-ok-soft' : verdict === 'bad' || verdict === 'missing' ? 'border-danger bg-danger-soft' : on ? 'border-brand bg-brand-soft' : 'border-line'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          setDevChecked(false);
                          setPicked((prev) => prev.map((p, m) => (m === n ? !p : p)));
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                      />
                      <span className="min-w-0">
                        <span className="text-fg">{d.text}</span>
                        {devChecked && (on || d.need === 'must') && (
                          <span className="mt-1 block text-xs text-muted">
                            <strong className="text-fg">{d.need === 'must' ? 'Must have. ' : d.need === 'good' ? 'Good pick. ' : 'Skip. '}</strong>
                            {d.why}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDevChecked(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 ${btn} focus-visible:ring-offset-2`}
              >
                <Check size={15} aria-hidden="true" /> Check my matrix
              </button>
              <p className="min-w-0 text-sm text-muted" aria-live="polite">
                {devChecked &&
                  (missingMust.length === 0 && pickedSkip.length === 0
                    ? `Solid matrix: ${picked.filter(Boolean).length} devices, every must-have covered.`
                    : [missingMust.length ? `Missing ${missingMust.length} must-have device(s).` : '', pickedSkip.length ? `${pickedSkip.length} pick(s) add cost but not coverage.` : '']
                        .filter(Boolean)
                        .join(' '))}
              </p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted">
              Exit criteria say when testing is "done enough" to report a recommendation. Pick the ones you would put in the plan.
            </p>
            <ul className="space-y-2">
              {exits.map((e, n) => {
                const on = exitPicked[n];
                const show = exitChecked && (on || e.good);
                const ok = on === e.good;
                return (
                  <li key={e.text} className="min-w-0">
                    <label
                      className={`flex cursor-pointer gap-2.5 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-brand ${
                        show ? (ok ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : on ? 'border-brand bg-brand-soft' : 'border-line'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          setExitChecked(false);
                          setExitPicked((prev) => prev.map((p, m) => (m === n ? !p : p)));
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                      />
                      <span className="min-w-0">
                        <span className="text-fg">{e.text}</span>
                        {show && (
                          <span className="mt-1 flex gap-1 text-xs text-muted">
                            {ok ? <Check size={13} className="mt-px shrink-0 text-ok" aria-hidden="true" /> : <X size={13} className="mt-px shrink-0 text-danger" aria-hidden="true" />}
                            <span className="min-w-0">
                              <strong className="text-fg">{e.good ? (on ? 'Good. ' : 'You missed this one. ') : 'Avoid. '}</strong>
                              {e.why}
                            </span>
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setExitChecked(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 ${btn} focus-visible:ring-offset-2`}
              >
                <Check size={15} aria-hidden="true" /> Check my exit criteria
              </button>
              <p className="min-w-0 text-sm text-muted" aria-live="polite">
                {exitChecked &&
                  (badExits.length === 0 && goodExitCount === exits.filter((e) => e.good).length
                    ? 'All measurable, all useful.'
                    : `${goodExitCount} good pick(s), ${badExits.length} to avoid.`)}
              </p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {flags.length > 0 ? (
              <div className="flex gap-2 rounded-2xl border border-warn bg-warn-soft p-3.5 text-sm text-fg">
                <TriangleAlert size={17} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold">Before you share it, look again at:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {flags.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 rounded-2xl border border-ok bg-ok-soft p-3.5 text-sm text-fg">
                <Check size={17} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                <p className="min-w-0">
                  <strong>Ready for review.</strong> Short, risk-based and measurable. Next step: walk the team through it in 10 minutes.
                </p>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">Your one-page plan (Markdown)</span>
              <textarea
                ref={area}
                readOnly
                value={markdown}
                rows={18}
                spellCheck={false}
                className="w-full resize-y rounded-xl border border-line bg-subtle p-3 font-mono text-xs leading-relaxed text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copy}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 ${btn} focus-visible:ring-offset-2`}
              >
                <Copy size={15} aria-hidden="true" /> Copy as Markdown
              </button>
              <p className="text-sm text-muted" aria-live="polite">
                {copied === 'ok' ? 'Copied. Paste it into your wiki or ticket.' : copied === 'fail' ? 'Copying is blocked here. The text is selected: press Ctrl+C or Cmd+C.' : ''}
              </p>
            </div>
          </>
        )}

        <div className="flex justify-between gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-fg hover:bg-subtle disabled:opacity-40 ${btn}`}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back
          </button>
          {step < steps.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className={`inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 ${btn} focus-visible:ring-offset-2`}
            >
              Next: {steps[step + 1]} <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
