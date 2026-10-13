import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, RotateCcw, Scissors, X, XCircle } from 'lucide-react';

/**
 * Equivalence partitioning trainer.
 * The learner splits a number line into partitions, labels each one, picks a
 * representative value, and ticks the "off the line" partitions (empty, letters...).
 */

type Extra = { text: string; correct: boolean; explain: string };
type Scenario = {
  id: string;
  tab: string;
  app: string;
  requirement: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  money?: boolean;
  labels: string[];
  model: { cuts: number[]; labels: number[] };
  /** Why a split is needed at this value. */
  cutWhy: Record<string, string>;
  /** Why each model segment has its label. */
  segWhy: string[];
  extras: Extra[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 'age',
    tab: 'Age 18–60',
    app: 'Fitness app · sign-up form',
    requirement: 'The "Age" field accepts whole years from 18 to 60. Anything else shows an error.',
    unit: 'years',
    min: 0,
    max: 80,
    step: 1,
    labels: ['Valid', 'Invalid'],
    model: { cuts: [18, 61], labels: [1, 0, 1] },
    cutWhy: {
      '18': '18 is the first age the app accepts, so behavior changes there.',
      '61': '61 is the first age that is rejected again, so a new partition starts at 61.',
    },
    segWhy: ['Under 18: too young, rejected.', '18 to 60: accepted.', '61 and above: too old, rejected.'],
    extras: [
      { text: 'Empty field', correct: true, explain: 'Leaving the field blank is its own invalid partition: the app must show "Enter your age", not crash or accept it.' },
      { text: 'Letters, e.g. "abc"', correct: true, explain: 'Non-numeric input is an invalid partition. Pasted text or an API call can bypass a numeric keyboard.' },
      { text: 'Decimals, e.g. 25.5', correct: true, explain: 'The rule says whole years, so decimals are an invalid partition of their own.' },
      { text: 'Ages 30–40 vs 41–50', correct: false, explain: 'All valid ages behave the same here. Splitting the valid range without a rule that treats them differently only adds duplicate tests.' },
    ],
  },
  {
    id: 'qty',
    tab: 'Quantity 1–10',
    app: 'Shop · cart line item',
    requirement: 'You can order 1 to 10 of the same item. 0 or less removes nothing and shows an error; more than 10 shows "Max 10 per order".',
    unit: 'items',
    min: -5,
    max: 15,
    step: 1,
    labels: ['Valid', 'Invalid'],
    model: { cuts: [1, 11], labels: [1, 0, 1] },
    cutWhy: {
      '1': '1 is the smallest quantity allowed, so 0 and below behave differently.',
      '11': '11 is the first quantity over the limit of 10.',
    },
    segWhy: ['0 or less: rejected.', '1 to 10: accepted.', '11 or more: "Max 10 per order".'],
    extras: [
      { text: 'Empty field', correct: true, explain: 'Deleting the number and tapping away is a classic bug source: does the cart show NaN, 0, or keep the old value?' },
      { text: 'Decimals, e.g. 2.5', correct: true, explain: 'You cannot buy half a T-shirt. Decimals are an invalid partition.' },
      { text: 'Letters, e.g. "two"', correct: true, explain: 'Non-numeric input is an invalid partition, even if the field usually shows a number pad.' },
      { text: 'Even vs odd quantities', correct: false, explain: 'Nothing in the rule treats even and odd numbers differently, so they belong to the same partition.' },
    ],
  },
  {
    id: 'promo',
    tab: 'Promo code length',
    app: 'Food delivery · checkout',
    requirement:
      'The promo code field is optional. If filled in, the code must be 6 to 10 characters long. Shorter or longer codes show "Invalid code format".',
    unit: 'characters',
    min: 0,
    max: 15,
    step: 1,
    labels: ['Valid', 'Invalid'],
    model: { cuts: [1, 6, 11], labels: [0, 1, 0, 1] },
    cutWhy: {
      '1': 'The field is optional: 0 characters (empty) means "no code" and is fine, but 1 character is a too-short code. Behavior changes at 1.',
      '6': '6 characters is the shortest valid code.',
      '11': '11 characters is the first length that is too long.',
    },
    segWhy: [
      'Empty (0 characters): valid, because the field is optional.',
      '1 to 5 characters: too short.',
      '6 to 10 characters: valid format.',
      '11 or more characters: too long.',
    ],
    extras: [
      { text: 'Special characters, e.g. "SAVE-10!"', correct: true, explain: 'Codes are usually letters and digits. Symbols are a separate format partition worth one test.' },
      { text: 'Lowercase "save10" vs uppercase "SAVE10"', correct: true, explain: 'Many shops treat codes as case-insensitive. If the spec does not say, it is a separate partition and a great question for the product owner.' },
      { text: 'Negative length', correct: false, explain: 'A text cannot have fewer than 0 characters, so this partition does not exist.' },
    ],
  },
  {
    id: 'ship',
    tab: 'Shipping (output)',
    app: 'Shop · shipping cost by order total',
    requirement:
      'Shipping costs €4.99 for orders under €20.00, €2.99 from €20.00 up to €49.99, and is free from €50.00. (The cart cannot be empty, so the total is always above €0.)',
    unit: '€',
    min: 0,
    max: 80,
    step: 0.01,
    money: true,
    labels: ['€4.99 shipping', '€2.99 shipping', 'Free shipping'],
    model: { cuts: [20, 50], labels: [0, 1, 2] },
    cutWhy: {
      '20': 'At €20.00 the shipping price drops from €4.99 to €2.99.',
      '50': 'At €50.00 shipping becomes free.',
    },
    segWhy: ['Under €20.00: €4.99.', '€20.00 to €49.99: €2.99.', '€50.00 and above: free.'],
    extras: [
      { text: 'Totals with more than 2 decimals, e.g. 19.999', correct: false, explain: 'Shoppers never type the total; the app calculates it. Rounding is worth a look, but it is not an input partition of this rule.' },
      { text: 'Total after a discount drops below €50', correct: true, explain: 'Outputs depend on the final total. A €55 cart with a €10 coupon lands in the €2.99 partition: test it!' },
    ],
  },
];

const fmt = (s: Scenario, n: number) => (s.money ? `€${n.toFixed(2)}` : String(n));
const roundStep = (s: Scenario, n: number) => (s.step === 1 ? Math.round(n) : Math.round(n * 100) / 100);

type Seg = { lo: number | null; hi: number | null; key: string };

function segmentsOf(s: Scenario, cuts: number[]): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i <= cuts.length; i++) {
    const lo = i === 0 ? null : cuts[i - 1];
    const hi = i === cuts.length ? null : roundStep(s, cuts[i] - s.step);
    out.push({ lo, hi, key: lo === null ? 'start' : String(lo) });
  }
  return out;
}

function rangeText(s: Scenario, g: Seg) {
  if (g.lo === null && g.hi === null) return 'All values';
  if (g.lo === null) return g.hi! <= s.min ? fmt(s, s.min) : s.money ? `under ${fmt(s, g.hi! + s.step)}` : `≤ ${fmt(s, g.hi!)}`;
  if (g.hi === null) return `≥ ${fmt(s, g.lo)}`;
  if (g.lo === g.hi) return fmt(s, g.lo);
  return `${fmt(s, g.lo)} – ${fmt(s, g.hi)}`;
}

function inSeg(g: Seg, v: number) {
  return (g.lo === null || v >= g.lo) && (g.hi === null || v <= g.hi + 1e-9);
}

export default function PartitionBuilder() {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const s = SCENARIOS.find((x) => x.id === sid)!;
  const [cuts, setCuts] = useState<number[]>([]);
  const [labels, setLabels] = useState<Record<string, number | undefined>>({});
  const [reps, setReps] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [draft, setDraft] = useState('');
  const line = useRef<HTMLDivElement>(null);

  const segs = useMemo(() => segmentsOf(s, cuts), [s, cuts]);

  const reset = (id = sid) => {
    setSid(id);
    setCuts([]);
    setLabels({});
    setReps({});
    setExtras({});
    setChecked(false);
    setDraft('');
  };

  const toggleCut = (v: number) => {
    const val = roundStep(s, v);
    if (val <= s.min || val > s.max) return;
    setCuts((prev) => (prev.some((c) => Math.abs(c - val) < 1e-9) ? prev.filter((c) => Math.abs(c - val) >= 1e-9) : [...prev, val].sort((a, b) => a - b)));
  };
  const nudge = (c: number, d: number) => {
    const next = roundStep(s, c + d);
    setCuts((prev) => {
      if (next <= s.min || next > s.max || prev.some((x) => Math.abs(x - next) < 1e-9)) return prev;
      return prev.map((x) => (Math.abs(x - c) < 1e-9 ? next : x)).sort((a, b) => a - b);
    });
  };

  const onLineClick = (e: React.MouseEvent) => {
    const r = line.current?.getBoundingClientRect();
    if (!r) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    toggleCut(Math.round(s.min + ratio * (s.max - s.min)));
  };

  const addDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(draft.replace(',', '.'));
    if (draft.trim() !== '' && Number.isFinite(n)) toggleCut(n);
    setDraft('');
  };

  const showAnswer = () => {
    const m = segmentsOf(s, s.model.cuts);
    setCuts(s.model.cuts);
    const l: Record<string, number> = {};
    const r: Record<string, string> = {};
    m.forEach((g, i) => {
      l[g.key] = s.model.labels[i];
      const v = g.lo === null ? (g.hi! - s.min > 5 ? g.hi! - 5 : g.hi!) : g.hi === null ? g.lo + (s.money ? 15 : 7) : (g.lo + g.hi) / 2;
      r[g.key] = s.money ? (Math.max(v, 0.01)).toFixed(2) : String(Math.round(v));
    });
    setLabels(l);
    setReps(r);
    setExtras(Object.fromEntries(s.extras.map((x, i) => [i, x.correct])));
    setChecked(true);
  };

  // ---------- Feedback ----------
  const feedback = useMemo(() => {
    const items: { ok: boolean; text: string }[] = [];
    const missing = s.model.cuts.filter((m) => !cuts.some((c) => Math.abs(c - m) < 1e-9));
    const extra = cuts.filter((c) => !s.model.cuts.some((m) => Math.abs(c - m) < 1e-9));
    const nearMiss = new Set<number>();
    extra.forEach((c) => {
      const m = missing.find((x) => Math.abs(x - c) <= 1 + 1e-9 && !nearMiss.has(x));
      if (m !== undefined) {
        nearMiss.add(m);
        items.push({ ok: false, text: `Off by one! Move the split from ${fmt(s, c)} to ${fmt(s, m)}. ${s.cutWhy[String(m)]}` });
      } else {
        items.push({ ok: false, text: `The split at ${fmt(s, c)} is not needed: values just below and just above it are treated exactly the same, so they belong to one partition.` });
      }
    });
    missing.filter((m) => !nearMiss.has(m)).forEach((m) => items.push({ ok: false, text: `Missing a split at ${fmt(s, m)}. ${s.cutWhy[String(m)]}` }));
    const cutsOk = !missing.length && !extra.length;
    if (cutsOk) items.push({ ok: true, text: `Splits are right: ${segs.length} partitions on the line.` });

    segs.forEach((g, i) => {
      const name = rangeText(s, g);
      const lab = labels[g.key];
      if (cutsOk) {
        if (lab === undefined) items.push({ ok: false, text: `${name}: choose a label.` });
        else if (lab !== s.model.labels[i]) items.push({ ok: false, text: `${name}: should be "${s.labels[s.model.labels[i]]}". ${s.segWhy[i]}` });
      }
      const raw = (reps[g.key] ?? '').trim().replace(',', '.');
      const v = Number(raw);
      if (!raw) items.push({ ok: false, text: `${name}: pick a representative value to test.` });
      else if (!Number.isFinite(v)) items.push({ ok: false, text: `${name}: "${raw}" is not a number. Non-numeric input is a partition of its own (see the checkboxes below).` });
      else if (s.step === 1 && !Number.isInteger(v)) items.push({ ok: false, text: `${name}: ${raw} is a decimal, which is a different (invalid) partition. Pick a whole number.` });
      else if (!inSeg(g, v)) items.push({ ok: false, text: `${name}: ${raw} is not inside this partition.` });
    });
    if (cutsOk && segs.every((g, i) => labels[g.key] === s.model.labels[i])) items.push({ ok: true, text: 'Every partition has the right label.' });

    const badExtras = s.extras.filter((x, i) => !!extras[i] !== x.correct);
    badExtras.forEach((x) => items.push({ ok: false, text: `"${x.text}": ${x.correct ? 'this IS a partition worth testing. ' : 'not a separate partition. '}${x.explain}` }));
    if (!badExtras.length) items.push({ ok: true, text: 'You spotted the partitions that live outside the number line.' });

    const allOk = items.every((x) => x.ok);
    return { items, allOk, total: segs.length + s.extras.filter((x) => x.correct).length };
  }, [s, cuts, segs, labels, reps, extras]);

  const pct = (v: number) => ((v - s.min) / (s.max - s.min)) * 100;
  const ticks = useMemo(() => {
    const span = s.max - s.min;
    const step = span <= 20 ? 1 : span <= 40 ? 5 : 10;
    const out: number[] = [];
    for (let v = Math.ceil(s.min / step) * step; v <= s.max; v += step) out.push(v);
    return out;
  }, [s]);

  const segColor = (i: number) => {
    const lab = labels[segs[i].key];
    if (lab === undefined) return 'var(--subtle)';
    if (s.labels.length === 2) return lab === 0 ? 'var(--ok-soft)' : 'var(--danger-soft)';
    return ['var(--warn-soft)', 'var(--info-soft)', 'var(--ok-soft)'][lab];
  };

  return (
    <div className="not-prose relative my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧩 Partition builder</p>
        <p className="text-sm text-muted">Split the line into partitions, label each one, pick a value to test from each, then check your work.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-subtle px-4 py-2.5" role="tablist" aria-label="Requirement">
        {SCENARIOS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === sid}
            onClick={() => reset(x.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
              x.id === sid ? 'bg-brand text-brand-fg' : 'bg-surface text-muted ring-1 ring-line hover:text-fg'
            }`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">{s.app}</p>
          <p className="mt-1 text-sm text-fg">{s.requirement}</p>
        </div>

        {/* Step 1: number line */}
        <section>
          <p className="mb-1 text-sm font-semibold">1. Split the line where the behavior changes</p>
          <p className="mb-3 text-xs text-muted">
            Click the line to add (or remove) a split. A split at <em>X</em> means "a new partition starts at X". Unit: {s.unit}.
          </p>
          <div className="px-2">
            <div
              ref={line}
              onClick={onLineClick}
              className="relative h-12 cursor-crosshair overflow-hidden rounded-xl border border-line"
              aria-hidden="true"
            >
              {segs.map((g, i) => {
                const from = g.lo === null ? 0 : pct(g.lo);
                const to = i === segs.length - 1 ? 100 : pct(cuts[i]);
                return (
                  <div key={g.key} className="absolute inset-y-0 transition-colors" style={{ left: `${from}%`, width: `${to - from}%`, background: segColor(i) }} />
                );
              })}
              {cuts.map((c) => (
                <div key={c} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-brand" style={{ left: `${pct(c)}%` }}>
                  <Scissors size={12} className="absolute top-1 left-1/2 -translate-x-1/2 rotate-90 rounded bg-brand p-px text-brand-fg" />
                </div>
              ))}
            </div>
            <div className="relative mt-1 h-5 text-[11px] text-faint" aria-hidden="true">
              {ticks.map((t) => (
                <span key={t} className="absolute -translate-x-1/2 font-mono" style={{ left: `${pct(t)}%` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form onSubmit={addDraft} className="flex min-w-0 items-center gap-2">
              <label className="sr-only" htmlFor={`cut-${s.id}`}>
                Add a split at value
              </label>
              <input
                id={`cut-${s.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                inputMode="decimal"
                placeholder={s.money ? 'e.g. 20' : 'e.g. 18'}
                className="h-9 w-24 min-w-0 rounded-lg border border-line bg-surface px-2 text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              />
              <button type="submit" className="h-9 rounded-lg bg-subtle px-3 text-sm font-medium ring-1 ring-line hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                Add split
              </button>
            </form>
            {cuts.map((c) => (
              <span key={c} className="flex items-center gap-0.5 rounded-full bg-brand-soft py-0.5 pr-1 pl-1 text-sm text-brand">
                <button type="button" aria-label={`Move split at ${fmt(s, c)} down`} onClick={() => nudge(c, -1)} className="rounded-full p-0.5 hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono font-semibold">{fmt(s, c)}</span>
                <button type="button" aria-label={`Move split at ${fmt(s, c)} up`} onClick={() => nudge(c, 1)} className="rounded-full p-0.5 hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                  <ChevronRight size={14} />
                </button>
                <button type="button" aria-label={`Remove split at ${fmt(s, c)}`} onClick={() => toggleCut(c)} className="rounded-full p-0.5 hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Step 2: label + representative */}
        <section>
          <p className="mb-3 text-sm font-semibold">2. Label each partition and pick one value to test</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {segs.map((g, i) => (
              <li key={g.key} className="min-w-0 rounded-xl border border-line p-3" style={{ background: segColor(i) }}>
                <p className="font-mono text-sm font-semibold text-fg">{rangeText(s, g)}</p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Label for {rangeText(s, g)}</span>
                    <select
                      value={labels[g.key] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLabels((p) => ({ ...p, [g.key]: v === '' ? undefined : Number(v) }));
                      }}
                      className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
                    >
                      <option value="">Label…</option>
                      {s.labels.map((l, li) => (
                        <option key={l} value={li}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex w-28 min-w-0 items-center gap-1">
                    <span className="sr-only">Representative value for {rangeText(s, g)}</span>
                    <input
                      value={reps[g.key] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setReps((p) => ({ ...p, [g.key]: v }));
                      }}
                      inputMode="decimal"
                      placeholder="Test value"
                      className="h-9 w-0 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Step 3: off-the-line partitions */}
        <section>
          <p className="mb-1 text-sm font-semibold">3. Which partitions can't be drawn on the line?</p>
          <p className="mb-3 text-xs text-muted">Tick the ones that are real, separate partitions for this requirement.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.extras.map((x, i) => (
              <label key={x.text} className="flex min-w-0 cursor-pointer items-start gap-2 rounded-xl border border-line bg-subtle p-3 text-sm">
                <input
                  type="checkbox"
                  checked={!!extras[i]}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setExtras((p) => ({ ...p, [i]: v }));
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                />
                <span className="min-w-0">{x.text}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Check my partitions
          </button>
          <button type="button" onClick={showAnswer} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
            <Lightbulb size={15} /> Show model answer
          </button>
          <button type="button" onClick={() => reset()} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        <div aria-live="polite">
          {checked && (
            <div className={`rounded-2xl border p-4 ${feedback.allOk ? 'border-ok/40 bg-ok-soft' : 'border-line bg-subtle'}`}>
              {feedback.allOk && (
                <p className="mb-3 font-semibold text-ok">
                  Spot on! That's {feedback.total} partitions, so EP gives you at least {feedback.total} tests for this one rule.
                </p>
              )}
              <ul className="space-y-2">
                {feedback.items.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-fg">
                    {f.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />}
                    <span className="min-w-0">{f.text}</span>
                  </li>
                ))}
              </ul>
              {feedback.allOk && (
                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                  {s.extras.filter((x) => x.correct).map((x) => (
                    <li key={x.text}>
                      <strong className="text-fg">{x.text}:</strong> {x.explain}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
