import { useState, type FormEvent } from 'react';
import { Calculator, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface Scenario {
  name: string;
  lines: { label: string; price: number; qty: number }[];
  rules: string[];
  breakdown: [string, string][];
  total: number;
  trap: string;
}

const scenarios: Scenario[] = [
  {
    name: 'Coupon + free shipping',
    lines: [
      { label: 'T-shirt', price: 14.5, qty: 2 },
      { label: 'Baseball cap', price: 22, qty: 1 },
    ],
    rules: ['Coupon SAVE10: 10% off the items', 'Shipping $4.99, free when the total after discounts is $50 or more', 'Prices include tax'],
    breakdown: [
      ['Subtotal (2 × 14.50 + 22.00)', '$51.00'],
      ['SAVE10 (10% of 51.00)', '−$5.10'],
      ['After discount', '$45.90'],
      ['Shipping (45.90 is under $50)', '$4.99'],
    ],
    total: 50.89,
    trap: 'The subtotal is over $50, but the discounted amount is not. If the app shows free shipping here, the threshold uses the wrong number.',
  },
  {
    name: 'Sales tax',
    lines: [{ label: 'Notebook', price: 9.99, qty: 3 }],
    rules: ['Coupon FREESHIP applied', 'Sales tax 8.25% on the items, rounded to the nearest cent'],
    breakdown: [
      ['Subtotal (3 × 9.99)', '$29.97'],
      ['Shipping (FREESHIP)', '$0.00'],
      ['Tax (8.25% of 29.97 = 2.4725…)', '$2.47'],
    ],
    total: 32.44,
    trap: 'Tax must be rounded to cents once. A total of $32.4425 or $32.45 on screen means the rounding is wrong.',
  },
  {
    name: 'Fixed amount coupon',
    lines: [
      { label: 'Running shoes', price: 45, qty: 1 },
      { label: 'Sports socks', price: 7.49, qty: 1 },
    ],
    rules: ['Coupon RUN5: $5 off orders of $50 or more', 'Shipping $4.99, free when the total after discounts is $50 or more', 'Prices include tax'],
    breakdown: [
      ['Subtotal (45.00 + 7.49)', '$52.49'],
      ['RUN5 (order is over $50, so it applies)', '−$5.00'],
      ['After discount', '$47.49'],
      ['Shipping (47.49 is under $50)', '$4.99'],
    ],
    total: 52.48,
    trap: 'The coupon pushes the order below the free shipping line. Also try removing the socks: the coupon should then stop applying.',
  },
];

export default function PriceCalculator() {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | 'right' | 'wrong' | 'invalid'>(null);
  const s = scenarios[index];

  const pick = (i: number) => {
    setIndex(i);
    setValue('');
    setResult(null);
  };

  const check = (e: FormEvent) => {
    e.preventDefault();
    const n = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    if (Number.isNaN(n)) return setResult('invalid');
    setResult(Math.abs(n - s.total) < 0.005 ? 'right' : 'wrong');
  };

  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
          <Calculator size={20} />
        </span>
        <div>
          <p className="font-semibold text-fg">Price calculator check</p>
          <p className="text-sm text-muted">Work out the expected total before you look at the app. That is your expected result.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Scenario">
        {scenarios.map((sc, i) => (
          <button
            key={sc.name}
            type="button"
            aria-pressed={i === index}
            onClick={() => pick(i)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              i === index ? 'bg-brand text-brand-fg ring-brand' : 'bg-subtle text-muted ring-line hover:text-fg'
            }`}
          >
            {i + 1}. {sc.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-[#f6f7fb] p-4 text-[#0e1120]">
          <p className="text-xs font-semibold tracking-wide text-[#5b6075] uppercase">Cart</p>
          <ul className="mt-2 space-y-1 text-sm">
            {s.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3">
                <span>
                  {l.qty} × {l.label}
                </span>
                <span className="tabular-nums">${l.price.toFixed(2)} each</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold tracking-wide text-[#5b6075] uppercase">Rules</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {s.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div>
          <form onSubmit={check} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="text-sm font-medium text-fg">Expected total ($)</span>
              <input
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g. 42.50"
                className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-surface px-3 font-mono text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
              />
            </label>
            <button type="submit" className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Check
            </button>
          </form>

          <div aria-live="polite" className="mt-3">
            {result === 'invalid' && <p className="text-sm text-warn">Type a number, for example 42.50.</p>}
            {result === 'wrong' && (
              <p className="flex items-start gap-2 text-sm text-danger">
                <XCircle size={16} className="mt-0.5 shrink-0" /> Not quite. Re-read the rules: which number decides free shipping, and when is rounding applied?
              </p>
            )}
            {result === 'right' && (
              <p className="flex items-start gap-2 text-sm text-ok">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> Correct, ${s.total.toFixed(2)}. Now compare that to what the app shows.
              </p>
            )}
          </div>

          {(result === 'right' || result === 'wrong') && (
            <div className="mt-3 rounded-2xl border border-line bg-subtle p-3 text-sm">
              <ul className="space-y-1">
                {s.breakdown.map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-3">
                    <span className="text-muted">{k}</span>
                    <span className="shrink-0 font-mono text-fg">{v}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 border-t border-line pt-1 font-semibold">
                  <span className="text-fg">Total</span>
                  <span className="font-mono text-fg">${s.total.toFixed(2)}</span>
                </li>
              </ul>
              <p className="mt-2 text-muted">
                <strong className="text-fg">Bug trap:</strong> {s.trap}
              </p>
              <button type="button" onClick={() => pick((index + 1) % scenarios.length)} className="mt-2 flex items-center gap-1 text-xs font-medium text-brand">
                <RotateCcw size={12} /> Next scenario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
