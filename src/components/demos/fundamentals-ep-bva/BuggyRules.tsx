import { useState } from 'react';
import { Bug, CheckCircle2, CircleAlert, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';

/**
 * "Buggy implementation" mode. Six mock rules; three hide an off-by-one bug:
 *  - age:   uses age > 18 instead of age >= 18 (18 is rejected)
 *  - ship:  free shipping uses total > 50 instead of >= 50 (€50.00 still pays €4.99)
 *  - pwd:   max length check is len <= 63 instead of <= 64 (64 characters rejected)
 * Correct ones: cart quantity 1–10, hotel nights 1–30, promo code 6–10 characters.
 */

type Outcome = { pass: boolean; text: string };
type Rule = {
  id: string;
  title: string;
  spec: string;
  unit: string;
  money?: boolean;
  placeholder: string;
  run: (n: number) => Outcome;
  buggy: boolean;
  reveal: string;
  /** Values that expose the bug (empty for correct rules). */
  exposes: number[];
};

const RULES: Rule[] = [
  {
    id: 'age',
    title: 'Sign-up age',
    spec: 'Ages 18 to 60 can sign up.',
    unit: 'years',
    placeholder: 'Age',
    run: (n) => (n > 18 && n <= 60 ? { pass: true, text: 'Account created' } : { pass: false, text: 'Sorry, you must be 18–60' }),
    buggy: true,
    reveal: 'The code says age > 18 instead of age >= 18, so an 18-year-old is turned away. Only the boundary value 18 shows it: 17 and 19 behave correctly.',
    exposes: [18],
  },
  {
    id: 'qty',
    title: 'Cart quantity',
    spec: 'You can buy 1 to 10 of one item.',
    unit: 'items',
    placeholder: 'Qty',
    run: (n) => (n >= 1 && n <= 10 ? { pass: true, text: 'Added to cart' } : { pass: false, text: n < 1 ? 'Minimum is 1' : 'Max 10 per order' }),
    buggy: false,
    reveal: 'Correct: 0 and 11 are rejected, 1 and 10 are accepted.',
    exposes: [],
  },
  {
    id: 'ship',
    title: 'Free shipping',
    spec: 'Shipping is free from €50.00.',
    unit: '€',
    money: true,
    placeholder: 'Order total',
    run: (n) => (n > 50 ? { pass: true, text: 'Free shipping' } : { pass: false, text: 'Shipping €4.99' }),
    buggy: true,
    reveal: 'The code says total > 50 instead of total >= 50. A customer with exactly €50.00 still pays €4.99. €49.99 and €50.01 both look fine, so only €50.00 catches it.',
    exposes: [50],
  },
  {
    id: 'pwd',
    title: 'Password length',
    spec: 'Passwords must be 8 to 64 characters.',
    unit: 'characters',
    placeholder: 'Length',
    run: (n) => (n >= 8 && n <= 63 ? { pass: true, text: 'Password saved' } : { pass: false, text: n < 8 ? 'Too short (min 8)' : 'Too long (max 64)' }),
    buggy: true,
    reveal:
      'The maximum is off by one: the code allows only up to 63. A 64-character password, which the spec allows, is rejected with "Too long (max 64)". Users of password managers hit this first.',
    exposes: [64],
  },
  {
    id: 'nights',
    title: 'Hotel stay',
    spec: 'A booking is 1 to 30 nights.',
    unit: 'nights',
    placeholder: 'Nights',
    run: (n) => (n >= 1 && n <= 30 ? { pass: true, text: 'Room available' } : { pass: false, text: n < 1 ? 'Choose at least 1 night' : 'Max 30 nights' }),
    buggy: false,
    reveal: 'Correct: 0 and 31 are rejected, 1 and 30 are accepted.',
    exposes: [],
  },
  {
    id: 'promo',
    title: 'Promo code length',
    spec: 'Codes are 6 to 10 characters.',
    unit: 'characters',
    placeholder: 'Length',
    run: (n) => (n >= 6 && n <= 10 ? { pass: true, text: 'Format OK' } : { pass: false, text: 'Invalid code format' }),
    buggy: false,
    reveal: 'Correct: 5 and 11 are rejected, 6 and 10 are accepted.',
    exposes: [],
  },
];

type Verdict = 'ok' | 'bug' | undefined;

export default function BuggyRules() {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Record<string, { v: number; o: Outcome }[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [checked, setChecked] = useState(false);

  const test = (r: Rule, e: React.FormEvent) => {
    e.preventDefault();
    const raw = (inputs[r.id] ?? '').trim().replace(',', '.');
    const n = Number(raw);
    if (!raw || !Number.isFinite(n) || (!r.money && !Number.isInteger(n))) {
      setErrors((p) => ({ ...p, [r.id]: r.money ? 'Enter an amount like 49.99' : 'Enter a whole number' }));
      return;
    }
    const v = r.money ? Math.round(n * 100) / 100 : n;
    setErrors((p) => ({ ...p, [r.id]: '' }));
    setLogs((p) => {
      const prev = (p[r.id] ?? []).filter((x) => x.v !== v);
      return { ...p, [r.id]: [{ v, o: r.run(v) }, ...prev].slice(0, 8) };
    });
  };

  const reset = () => {
    setInputs({});
    setLogs({});
    setErrors({});
    setVerdicts({});
    setChecked(false);
  };

  const fmt = (r: Rule, v: number) => (r.money ? `€${v.toFixed(2)}` : String(v));
  const decided = RULES.filter((r) => verdicts[r.id]).length;
  const correct = RULES.filter((r) => (verdicts[r.id] === 'bug') === r.buggy && verdicts[r.id]).length;

  return (
    <div className="not-prose relative my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
          <Bug size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">🐞 Buggy implementation mode</p>
          <p className="text-sm text-muted">
            Some of these six rules have an <strong className="text-fg">off-by-one bug</strong>. Use boundary values to find out which, then give your verdict.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 bg-subtle p-4 sm:p-6 md:grid-cols-2">
        {RULES.map((r) => {
          const log = logs[r.id] ?? [];
          const v = verdicts[r.id];
          const right = checked && v !== undefined && (v === 'bug') === r.buggy;
          const testedExposer = r.exposes.some((x) => log.some((l) => Math.abs(l.v - x) < 1e-9));
          return (
            <li key={r.id} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted">{r.spec}</p>

              <form onSubmit={(e) => test(r, e)} className="mt-3 flex min-w-0 items-center gap-2" style={{ colorScheme: 'light' }}>
                <label htmlFor={`br-${r.id}`} className="sr-only">
                  {r.placeholder} ({r.unit})
                </label>
                <div className="flex h-10 w-0 min-w-0 flex-1 items-center rounded-lg border border-[#d1d1d6] bg-white px-2 focus-within:border-[#007aff] focus-within:ring-2 focus-within:ring-[#007aff]/30">
                  {r.money && <span className="pr-1 text-sm text-[#6c6c70]">€</span>}
                  <input
                    id={`br-${r.id}`}
                    value={inputs[r.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputs((p) => ({ ...p, [r.id]: val }));
                    }}
                    inputMode={r.money ? 'decimal' : 'numeric'}
                    placeholder={r.placeholder}
                    autoComplete="off"
                    className="w-0 min-w-0 flex-1 bg-transparent text-[15px] text-[#1c1c1e] placeholder:text-[#a1a1a6] focus:outline-none"
                  />
                  {!r.money && <span className="pl-1 text-xs text-[#6c6c70]">{r.unit}</span>}
                </div>
                <button type="submit" className="h-10 shrink-0 rounded-lg bg-[#007aff] px-3 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none">
                  Test
                </button>
              </form>
              {errors[r.id] && <p className="mt-1 text-xs text-danger">{errors[r.id]}</p>}

              <ul className="mt-2 flex min-h-[28px] flex-wrap gap-1" aria-live="polite" aria-label={`Results for ${r.title}`}>
                {log.map((l) => (
                  <li
                    key={l.v}
                    className={`flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${l.o.pass ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}
                  >
                    {l.o.pass ? <CheckCircle2 size={12} className="shrink-0" /> : <CircleAlert size={12} className="shrink-0" />}
                    <span className="font-mono font-semibold">{fmt(r, l.v)}</span>
                    <span className="truncate">{l.o.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium" role="radiogroup" aria-label={`Verdict for ${r.title}`}>
                {(
                  [
                    ['ok', 'Looks correct', ShieldCheck],
                    ['bug', 'Buggy', Bug],
                  ] as const
                ).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={v === val}
                    onClick={() => setVerdicts((p) => ({ ...p, [r.id]: val }))}
                    className={`flex items-center justify-center gap-1 rounded-md py-1.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                      v === val ? (val === 'bug' ? 'bg-danger text-white' : 'bg-ok text-white') : 'text-muted hover:text-fg'
                    }`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {checked && (
                <div className={`mt-3 rounded-xl p-3 text-sm ${v === undefined ? 'bg-subtle text-muted' : right ? 'bg-ok-soft text-fg' : 'bg-danger-soft text-fg'}`}>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {v === undefined ? null : right ? <CheckCircle2 size={15} className="text-ok" /> : <XCircle size={15} className="text-danger" />}
                    {v === undefined ? 'No verdict yet.' : right ? 'Right!' : r.buggy ? 'This one is buggy.' : 'This one is actually correct.'}
                  </p>
                  {(v !== undefined || r.buggy) && <p className="mt-1">{r.reveal}</p>}
                  {r.buggy && v !== undefined && (
                    <p className="mt-1 text-muted">
                      {testedExposer
                        ? `You tested ${r.exposes.map((x) => fmt(r, x)).join(', ')}: that is the value that proves it.`
                        : `You never tested ${r.exposes.map((x) => fmt(r, x)).join(', ')}, the one value that proves it. A guess is not evidence for a bug report!`}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={decided === 0}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
        >
          Check my verdicts
        </button>
        <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
          <RotateCcw size={15} /> Start over
        </button>
        <p className="text-sm text-muted" aria-live="polite">
          {checked ? (
            <>
              <strong className="text-fg">
                {correct}/{RULES.length}
              </strong>{' '}
              verdicts right{correct === RULES.length ? '. You found all three off-by-one bugs!' : '.'}
            </>
          ) : (
            `${decided}/${RULES.length} verdicts given`
          )}
        </p>
      </div>
    </div>
  );
}
