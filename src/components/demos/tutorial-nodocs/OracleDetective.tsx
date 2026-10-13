import { useState } from 'react';
import { CircleCheck, CircleHelp, CircleX, Coffee, Gift, House, RotateCcw, Search, Star } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/**
 * "Oracle detective" exercise.
 * A small, undocumented Rewards feature in a coffee app (Brewly). There is no spec, only the app
 * itself and its App Store listing. For each numbered observation the learner decides:
 *   1. Is it a bug, not a bug, or a question to confirm first?
 *   2. Which oracle (source of "expected") justifies that decision?
 *
 * Observations:
 *  1 Home shows 112 beans, Rewards shows 120            -> bug, consistency within the product
 *  2 Free drink "Small only" vs listing "any size"        -> bug, claims (marketing text)
 *  3 Refund ADDS +4 beans                                 -> bug, user expectations (comparable also ok)
 *  4 Redeem is a tiny text link (~20 pt tall)             -> bug, platform guidelines (44x44 pt)
 *  5 "30 beans expire soon" with no date                  -> bug (usability), comparable products (user also ok)
 *  6 $4.20 earned 4 beans, $4.50 earned 5                 -> ask first, claims ("every $1" is ambiguous)
 *  7 Free drink shows "Ready to redeem" at 100+ beans     -> not a bug, claims
 */

type Verdict = 'bug' | 'ok' | 'ask';
type Oracle = 'product' | 'comparable' | 'user' | 'claims' | 'platform';

const verdicts: { id: Verdict; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'ok', label: 'Not a bug' },
  { id: 'ask', label: 'Ask first' },
];

const oracles: { id: Oracle; label: string }[] = [
  { id: 'product', label: 'Consistency within the product' },
  { id: 'comparable', label: 'Comparable products' },
  { id: 'user', label: 'User expectations' },
  { id: 'claims', label: 'Claims (marketing text)' },
  { id: 'platform', label: 'Platform guidelines' },
];

const oracleName = (o: Oracle) => oracles.find((x) => x.id === o)!.label;

type Finding = {
  n: number;
  title: string;
  observation: string;
  verdict: Verdict;
  /** Accepted oracles. The first one is the strongest. */
  oracles: Oracle[];
  explain: string;
  /** How the "Expected" line of a bug report (or the question) could read. */
  expected: string;
};

const findings: Finding[] = [
  {
    n: 1,
    title: 'Two different balances',
    observation: 'The Home tab says you have 112 beans. The Rewards tab says 120 beans. Same account, seconds apart.',
    verdict: 'bug',
    oracles: ['product'],
    explain:
      'You do not need a spec to know that one account cannot have two balances. The product contradicts itself, so at least one of the screens is wrong. That is the "consistency within the product" oracle.',
    expected: 'Expected (consistency with the Home tab): both screens show the same bean balance.',
  },
  {
    n: 2,
    title: 'Free drink: small only',
    observation: 'The App Store listing promises "100 beans = a free drink of any size". The reward card says "Free drink · Small only".',
    verdict: 'bug',
    oracles: ['claims'],
    explain:
      'The product breaks a promise the company made publicly. Either the app or the listing is wrong, and you cannot tell which, but the mismatch itself is the problem. Report it, quote the listing, and let the product owner decide which side changes.',
    expected: 'Expected (App Store listing claim): the free drink can be any size, or the listing is corrected.',
  },
  {
    n: 3,
    title: 'Refund adds beans',
    observation: 'Recent activity shows "Refund · Cappuccino $3.80 · +4 beans". The refund gave you beans instead of taking them back.',
    verdict: 'bug',
    oracles: ['user', 'comparable'],
    explain:
      'Any customer would expect a refunded purchase to take its beans back, not add more. Users could even farm free drinks by ordering and refunding. Comparable loyalty apps also reverse points on refunds, so that oracle works too.',
    expected: 'Expected (user expectation, matches comparable loyalty apps): a refund takes back the beans the original order earned.',
  },
  {
    n: 4,
    title: 'Tiny Redeem link',
    observation: 'The only way to redeem is a small "Redeem" text link, about 20 pt tall and 50 pt wide.',
    verdict: 'bug',
    oracles: ['platform'],
    explain:
      "Apple's Human Interface Guidelines ask for touch targets of at least 44×44 pt (Material Design: 48×48 dp). A primary action this small is easy to miss, especially for people with motor impairments. Standards and guidelines are a strong oracle.",
    expected: 'Expected (Apple HIG, min. 44×44 pt touch target): the Redeem control is at least 44 pt tall.',
  },
  {
    n: 5,
    title: 'Expire soon... when?',
    observation: 'A banner says "30 beans expire soon". There is no date, and tapping it does nothing.',
    verdict: 'bug',
    oracles: ['comparable', 'user'],
    explain:
      'Airline, hotel and coffee loyalty apps typically show the exact expiry date. Without it, users cannot act and will feel cheated when beans disappear. It is a usability bug (often Minor), justified by comparable products and by user expectations.',
    expected: 'Expected (comparable loyalty apps show a date): the banner shows when the 30 beans expire.',
  },
  {
    n: 6,
    title: 'Rounding of partial dollars',
    observation: 'Flat white $4.20 earned +4 beans. Latte $4.50 earned +5 beans.',
    verdict: 'ask',
    oracles: ['claims', 'product'],
    explain:
      'The listing says "1 bean for every $1", which suggests rounding down ($4.50 → 4). But the app seems to round to the nearest dollar, and that might be a deliberate, generous choice. There is no oracle that settles it, so write it down as an assumption and ask the product owner before filing anything.',
    expected: 'Question for the PO: "The listing says 1 bean per $1. Should $4.50 earn 4 beans (round down) or 5 (round to nearest)?"',
  },
  {
    n: 7,
    title: 'Free drink is ready',
    observation: 'With more than 100 beans, the free drink card says "Ready to redeem".',
    verdict: 'ok',
    oracles: ['claims'],
    explain:
      'This matches the claim "100 beans = a free drink". Oracles do not only find bugs; they also tell you when behavior is right. Whichever balance is correct (112 or 120), both are above 100.',
    expected: 'No report needed. Note it as checked in your session notes.',
  },
];

type Answer = { verdict?: Verdict; oracle?: Oracle; checked?: boolean };

/* ---------- Mock app ---------- */

const ink = '#2b1a10';
const brand = '#6b3f1d';
const cream = '#faf6f1';

function Marker({ n, active, onSelect, done }: { n: number; active: boolean; onSelect: (n: number) => void; done: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(n)}
      aria-label={`Observation ${n}`}
      aria-pressed={active}
      className={`ml-1 inline-grid size-[18px] shrink-0 place-items-center rounded-full align-middle text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#3b6cf6] focus-visible:ring-offset-1 ${
        active ? 'bg-[#3b6cf6] text-white ring-2 ring-[#3b6cf6]/40' : done ? 'bg-[#1f8a4c] text-white' : 'bg-[#f5b301] text-[#3a2a00]'
      }`}
    >
      {n}
    </button>
  );
}

function BrewlyApp({ active, onSelect, checked }: { active: number | null; onSelect: (n: number) => void; checked: (n: number) => boolean }) {
  const [tab, setTab] = useState<'home' | 'rewards'>('home');
  const m = (n: number) => <Marker n={n} active={active === n} onSelect={onSelect} done={checked(n)} />;

  return (
    <div className="flex h-full flex-col" style={{ background: cream, color: ink }}>
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-3">
        {tab === 'home' ? (
          <div>
            <p className="text-[12px] text-[#8a6f5c]">Good morning,</p>
            <p className="text-[22px] leading-tight font-bold">Sam</p>
            <div className="mt-3 rounded-2xl p-3.5 text-white" style={{ background: brand }}>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase opacity-80">
                <Star size={12} aria-hidden="true" /> Brewly Rewards
              </p>
              <p className="mt-1 flex items-center text-[24px] leading-none font-bold">
                112 <span className="ml-1 text-[13px] font-medium opacity-90">beans</span>
                {m(1)}
              </p>
              <p className="mt-1.5 text-[11px] opacity-85">A free drink is waiting for you</p>
            </div>
            <p className="mt-4 mb-1.5 text-[13px] font-semibold">Order again</p>
            <ul className="divide-y divide-[#eadfd4] rounded-2xl bg-white text-[13px]">
              {[
                ['Flat white', '$4.20'],
                ['Latte', '$4.50'],
                ['Blueberry muffin', '$3.10'],
              ].map(([name, price]) => (
                <li key={name} className="flex items-center gap-2 px-3 py-2.5">
                  <span className="grid size-7 place-items-center rounded-full bg-[#f1e6da]" aria-hidden="true">
                    <Coffee size={14} color={brand} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="text-[#8a6f5c]">{price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-[11px] text-[#8a6f5c]">Tip: open the Rewards tab to see your beans.</p>
          </div>
        ) : (
          <div>
            <p className="text-[22px] leading-tight font-bold">Rewards</p>
            <p className="mt-2 flex items-center text-[30px] leading-none font-bold" style={{ color: brand }}>
              120 <span className="ml-1 text-[14px] font-medium text-[#8a6f5c]">beans</span>
              {m(1)}
            </p>
            <p className="mt-1 text-[11px] text-[#8a6f5c]">Earn 1 bean for every $1 you spend</p>

            <div className="mt-3 rounded-2xl bg-white p-3">
              <div className="flex items-start gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f1e6da]" aria-hidden="true">
                  <Gift size={17} color={brand} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center text-[13px] font-semibold">
                    Free drink · Small only {m(2)}
                  </p>
                  <p className="text-[11px] text-[#8a6f5c]">100 beans</p>
                  <p className="mt-0.5 flex items-center text-[11px] text-[#1f7a43]">
                    Ready to redeem {m(7)}
                  </p>
                  <p className="mt-0.5 flex items-center">
                    <span className="text-[10px] leading-[20px] font-semibold underline" style={{ color: brand }}>
                      Redeem
                    </span>
                    {m(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-[#fff4d6] px-3 py-2 text-[11px] text-[#6b4d00]">
              <span className="min-w-0 flex-1">30 beans expire soon</span>
              {m(5)}
            </div>

            <p className="mt-4 mb-1.5 text-[13px] font-semibold">Recent activity</p>
            <ul className="divide-y divide-[#eadfd4] rounded-2xl bg-white text-[12px]">
              <li className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block">Latte</span>
                  <span className="block text-[11px] text-[#8a6f5c]">$4.50 · Today</span>
                </span>
                <span className="font-semibold text-[#1f7a43]">+5</span>
                {m(6)}
              </li>
              <li className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block">Refund · Cappuccino</span>
                  <span className="block text-[11px] text-[#8a6f5c]">$3.80 · Yesterday</span>
                </span>
                <span className="font-semibold text-[#1f7a43]">+4</span>
                {m(3)}
              </li>
              <li className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block">Flat white</span>
                  <span className="block text-[11px] text-[#8a6f5c]">$4.20 · Mon</span>
                </span>
                <span className="font-semibold text-[#1f7a43]">+4</span>
                <span className="w-[22px]" aria-hidden="true" />
              </li>
              <li className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block">Welcome bonus</span>
                  <span className="block text-[11px] text-[#8a6f5c]">Sep 30</span>
                </span>
                <span className="font-semibold text-[#1f7a43]">+50</span>
                <span className="w-[22px]" aria-hidden="true" />
              </li>
            </ul>
          </div>
        )}
      </div>

      <nav className="grid shrink-0 grid-cols-2 border-t border-[#eadfd4] bg-white pt-1.5 pb-5" aria-label="Brewly tabs">
        {(
          [
            ['home', 'Home', House],
            ['rewards', 'Rewards', Star],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#3b6cf6]"
            style={{ color: tab === id ? brand : '#a8968a' }}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ---------- Exercise ---------- */

function Chip<T extends string>({
  name,
  value,
  current,
  label,
  onChange,
  disabled,
}: {
  name: string;
  value: T;
  current?: T;
  label: string;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const on = current === value;
  return (
    <label
      className={`inline-flex cursor-pointer items-center rounded-lg border px-2.5 py-1.5 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
        on ? 'border-brand bg-brand font-semibold text-brand-fg' : 'border-line bg-surface text-muted hover:bg-subtle'
      } ${disabled ? 'cursor-default opacity-80' : ''}`}
    >
      <input type="radio" className="sr-only" name={name} value={value} checked={on} disabled={disabled} onChange={() => onChange(value)} />
      {label}
    </label>
  );
}

export default function OracleDetective() {
  const [active, setActive] = useState<number | null>(1);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  const set = (n: number, patch: Partial<Answer>) => setAnswers((prev) => ({ ...prev, [n]: { ...prev[n], ...patch } }));

  const isRight = (f: Finding, a?: Answer) => !!a && a.verdict === f.verdict && !!a.oracle && f.oracles.includes(a.oracle);
  const checkedCount = findings.filter((f) => answers[f.n]?.checked).length;
  const rightCount = findings.filter((f) => answers[f.n]?.checked && isRight(f, answers[f.n])).length;

  const select = (n: number) => setActive((prev) => (prev === n ? prev : n));
  const next = (n: number) => {
    const nxt = findings.find((f) => f.n > n && !answers[f.n]?.checked) ?? findings.find((f) => !answers[f.n]?.checked && f.n !== n);
    setActive(nxt ? nxt.n : null);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Search size={17} className="text-brand" aria-hidden="true" /> Oracle detective
        </p>
        <p className="text-sm text-muted">
          Brewly's new Rewards feature has no spec. Explore both tabs, tap the numbered markers, and decide for each observation: is it a bug, and which oracle tells you so?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-center gap-4 p-4" style={{ background: '#f2f2f7', colorScheme: 'light' }}>
          <PhoneFrame width={260}>
            <BrewlyApp active={active} onSelect={select} checked={(n) => !!answers[n]?.checked} />
          </PhoneFrame>
          <div className="w-full max-w-[280px] rounded-2xl border border-[#e2e4ea] bg-white p-3.5 text-[#1c1f2a]">
            <p className="text-[10px] font-semibold tracking-wide text-[#6b7180] uppercase">App Store listing (excerpt)</p>
            <p className="mt-1 text-[13px] font-semibold">Brewly: Order ahead &amp; earn</p>
            <p className="mt-1 text-[12px] leading-snug text-[#3d4352]">
              Skip the line and earn as you sip. Earn 1 bean for every $1 you spend. 100 beans = a free drink of any size.
            </p>
          </div>
        </div>

        <div className="min-w-0 border-t border-line p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div aria-live="polite" className="mb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <p className="font-semibold text-fg">
                {checkedCount} of {findings.length} checked
              </p>
              <p className="text-muted">{rightCount} fully right</p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(checkedCount / findings.length) * 100}%` }} />
            </div>
          </div>

          <ul className="space-y-2">
            {findings.map((f) => {
              const a = answers[f.n] ?? {};
              const open = active === f.n;
              const right = isRight(f, a);
              const verdictOk = a.verdict === f.verdict;
              const oracleOk = !!a.oracle && f.oracles.includes(a.oracle);
              return (
                <li key={f.n} className={`rounded-2xl border ${open ? 'border-brand' : 'border-line'} bg-surface`}>
                  <button
                    type="button"
                    onClick={() => setActive((prev) => (prev === f.n ? null : f.n))}
                    aria-expanded={open}
                    aria-controls={`od-${f.n}`}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        a.checked ? (right ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn') : 'bg-subtle text-fg'
                      }`}
                      aria-hidden="true"
                    >
                      {f.n}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-fg">{f.title}</span>
                    {a.checked ? (
                      right ? (
                        <CircleCheck size={17} className="shrink-0 text-ok" aria-label="Correct" />
                      ) : (
                        <CircleX size={17} className="shrink-0 text-warn" aria-label="Not quite" />
                      )
                    ) : null}
                  </button>

                  {open ? (
                    <div id={`od-${f.n}`} className="space-y-3 border-t border-line px-3.5 pt-3 pb-3.5">
                      <p className="text-sm text-fg">{f.observation}</p>

                      <fieldset>
                        <legend className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Your verdict</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {verdicts.map((v) => (
                            <Chip
                              key={v.id}
                              name={`od-${f.n}-verdict`}
                              value={v.id}
                              current={a.verdict}
                              label={v.label}
                              disabled={a.checked}
                              onChange={(val) => set(f.n, { verdict: val })}
                            />
                          ))}
                        </div>
                      </fieldset>

                      <fieldset>
                        <legend className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Which oracle justifies it?</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {oracles.map((o) => (
                            <Chip
                              key={o.id}
                              name={`od-${f.n}-oracle`}
                              value={o.id}
                              current={a.oracle}
                              label={o.label}
                              disabled={a.checked}
                              onChange={(val) => set(f.n, { oracle: val })}
                            />
                          ))}
                        </div>
                      </fieldset>

                      {!a.checked ? (
                        <button
                          type="button"
                          disabled={!a.verdict || !a.oracle}
                          onClick={() => set(f.n, { checked: true })}
                          className="rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Check my answer
                        </button>
                      ) : (
                        <div className={`rounded-xl border p-3 text-sm ${right ? 'border-ok/40 bg-ok-soft' : 'border-warn/40 bg-warn-soft'}`}>
                          <p className="font-semibold text-fg">{right ? 'Spot on.' : verdictOk ? 'Right verdict, different oracle.' : oracleOk ? 'Right oracle, different verdict.' : 'Not quite.'}</p>
                          <p className="mt-1 text-fg">
                            <strong>Answer:</strong> {verdicts.find((v) => v.id === f.verdict)!.label}, because of{' '}
                            {f.oracles.map((o, i) => (
                              <span key={o}>
                                {i > 0 ? ' (or ' : ''}
                                <em>{oracleName(o).toLowerCase()}</em>
                                {i > 0 ? ')' : ''}
                              </span>
                            ))}
                            .
                          </p>
                          <p className="mt-1.5 text-muted">{f.explain}</p>
                          <p className="mt-2 rounded-lg bg-surface px-2.5 py-2 font-mono text-[12px] text-fg">{f.expected}</p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => set(f.n, { checked: false })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                            >
                              <RotateCcw size={13} aria-hidden="true" /> Try again
                            </button>
                            {checkedCount < findings.length ? (
                              <button
                                type="button"
                                onClick={() => next(f.n)}
                                className="rounded-lg bg-brand px-2.5 py-1.5 text-[13px] font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                              >
                                Next observation
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {checkedCount === findings.length ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-subtle p-3.5 text-sm text-fg">
              <CircleHelp size={17} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <p>
                <strong>
                  {rightCount} of {findings.length} fully right.
                </strong>{' '}
                Notice the pattern: five bugs, one question for the product owner and one correct behavior. Every verdict names its oracle, and that oracle becomes the "Expected" line of your report.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setActive(1);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} aria-hidden="true" /> Start over
          </button>
        </div>
      </div>
    </div>
  );
}
