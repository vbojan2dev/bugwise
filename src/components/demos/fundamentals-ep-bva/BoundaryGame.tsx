import { useMemo, useState } from 'react';
import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from 'lucide-react';

/**
 * Boundary number-line game: for a rule, pick the boundary test values on
 * zoomed-in "windows" around each edge, in 2-value or 3-value mode.
 */

type Window = { boundary: number; side: 'low' | 'high'; values: number[] };
type Rule = {
  id: string;
  tab: string;
  app: string;
  text: string;
  code: string;
  money?: boolean;
  isValid: (v: number) => boolean;
  windows: Window[];
};

const range = (a: number, b: number, step = 1) => {
  const out: number[] = [];
  for (let i = 0; a + i * step <= b + 1e-9; i++) out.push(Math.round((a + i * step) * 100) / 100);
  return out;
};

const RULES: Rule[] = [
  {
    id: 'age',
    tab: 'Age 18–60',
    app: 'Fitness app · sign-up',
    text: 'Age must be from 18 to 60 (inclusive).',
    code: 'age >= 18 && age <= 60',
    isValid: (v) => v >= 18 && v <= 60,
    windows: [
      { boundary: 18, side: 'low', values: range(15, 21) },
      { boundary: 60, side: 'high', values: range(57, 63) },
    ],
  },
  {
    id: 'pwd',
    tab: 'Password 8–64',
    app: 'Banking app · new password',
    text: 'Password length must be 8 to 64 characters.',
    code: 'len >= 8 && len <= 64',
    isValid: (v) => v >= 8 && v <= 64,
    windows: [
      { boundary: 8, side: 'low', values: range(5, 11) },
      { boundary: 64, side: 'high', values: range(61, 67) },
    ],
  },
  {
    id: 'cart',
    tab: 'Cart 1–10 items',
    app: 'Shop · cart size',
    text: 'A cart holds up to 10 different products. Checkout needs at least 1.',
    code: 'items >= 1 && items <= 10',
    isValid: (v) => v >= 1 && v <= 10,
    windows: [
      { boundary: 1, side: 'low', values: range(0, 6) },
      { boundary: 10, side: 'high', values: range(7, 13) },
    ],
  },
  {
    id: 'ship',
    tab: 'Free shipping €50',
    app: 'Shop · order summary',
    text: 'Shipping is free for orders of €50.00 or more.',
    code: 'total >= 50.00',
    money: true,
    isValid: (v) => v >= 50,
    windows: [{ boundary: 50, side: 'low', values: range(49.97, 50.03, 0.01) }],
  },
];

type Mode = 2 | 3;

function expected(rule: Rule, mode: Mode): number[] {
  const out: number[] = [];
  const st = rule.money ? 0.01 : 1;
  const r = (n: number) => Math.round(n * 100) / 100;
  for (const w of rule.windows) {
    const b = w.boundary;
    if (w.side === 'low') {
      // boundary is the first valid value
      out.push(r(b - st), b);
      if (mode === 3) out.push(r(b + st));
    } else {
      // boundary is the last valid value
      if (mode === 3) out.push(r(b - st));
      out.push(b, r(b + st));
    }
  }
  return out;
}

const key = (n: number) => n.toFixed(2);

export default function BoundaryGame() {
  const [rid, setRid] = useState(RULES[0].id);
  const [mode, setMode] = useState<Mode>(2);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const rule = RULES.find((r) => r.id === rid)!;
  const fmt = (n: number) => (rule.money ? n.toFixed(2) : String(n));

  const exp = useMemo(() => expected(rule, mode), [rule, mode]);
  const expSet = new Set(exp.map(key));
  const pickedVals = Object.keys(picked)
    .filter((k) => picked[k])
    .map(Number)
    .sort((a, b) => a - b);

  const missing = exp.filter((v) => !picked[key(v)]);
  const extra = pickedVals.filter((v) => !expSet.has(key(v)));
  const allOk = !missing.length && !extra.length;

  const toggle = (v: number) => {
    setPicked((p) => ({ ...p, [key(v)]: !p[key(v)] }));
  };
  const reset = (id = rid, m = mode) => {
    setRid(id);
    setMode(m);
    setPicked({});
    setChecked(false);
  };

  const whyExtra = (v: number) => {
    const st = rule.money ? 0.01 : 1;
    const near = rule.windows.find((w) => Math.abs(v - w.boundary) <= st * 1.01 + 1e-9);
    if (mode === 2 && near) return `${fmt(v)} is the 3-value neighbor of ${fmt(near.boundary)}. Useful, but not part of the 2-value set.`;
    return `${fmt(v)} is not next to a boundary. It sits in the same partition as a value you already test, so it adds no new boundary information.`;
  };
  const whyMissing = (v: number) => {
    const w = rule.windows.find((x) => Math.abs(v - x.boundary) <= (rule.money ? 0.0101 : 1.01));
    if (!w) return '';
    if (Math.abs(v - w.boundary) < 1e-9) return `${fmt(v)} is the boundary itself (${w.side === 'low' ? 'smallest' : 'largest'} ${rule.isValid(v) ? 'valid' : 'invalid'} value).`;
    if (!rule.isValid(v)) return `${fmt(v)} is the first invalid value just outside the boundary. It catches a range that is accidentally too wide.`;
    return `${fmt(v)} is the valid neighbor just inside the boundary (3-value BVA).`;
  };

  return (
    <div className="not-prose relative my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🎯 Boundary game: pick the edge values</p>
        <p className="text-sm text-muted">Tap the values you would test. Then check your picks.</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-subtle px-4 py-2.5" role="tablist" aria-label="Rule">
        {RULES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === rid}
            onClick={() => reset(x.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
              x.id === rid ? 'bg-brand text-brand-fg' : 'bg-surface text-muted ring-1 ring-line hover:text-fg'
            }`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 rounded-2xl bg-brand-soft p-4">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">{rule.app}</p>
            <p className="mt-1 text-sm text-fg">{rule.text}</p>
          </div>
          <div className="inline-flex rounded-xl bg-subtle p-1 text-sm font-medium ring-1 ring-line" role="radiogroup" aria-label="BVA mode">
            {([2, 3] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => reset(rid, m)}
                className={`rounded-lg px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${mode === m ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
              >
                {m}-value
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted">
          {mode === 2
            ? '2-value BVA: for each boundary, test the boundary value and its closest neighbor on the other side.'
            : '3-value BVA: for each boundary, test the boundary value and the closest neighbor on BOTH sides.'}{' '}
          {rule.money ? 'Money moves in steps of €0.01.' : 'Values move in steps of 1.'}
        </p>

        <div className="space-y-4">
          {rule.windows.map((w) => (
            <div key={w.boundary}>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
                Around {rule.money ? '€' : ''}
                {fmt(w.boundary)}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {w.values.map((v) => {
                  const on = !!picked[key(v)];
                  const isExp = expSet.has(key(v));
                  const shade = checked ? (rule.isValid(v) ? 'border-b-4 border-b-ok' : 'border-b-4 border-b-danger') : '';
                  let state = on ? 'bg-brand text-brand-fg ring-brand' : 'bg-surface text-fg ring-line hover:bg-subtle';
                  if (checked && on && !isExp) state = 'bg-danger-soft text-danger ring-danger';
                  if (checked && on && isExp) state = 'bg-ok-soft text-ok ring-ok';
                  if (checked && !on && isExp) state = 'bg-warn-soft text-warn ring-warn';
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${rule.money ? '€' : ''}${fmt(v)}`}
                      onClick={() => toggle(v)}
                      className={`h-11 min-w-0 rounded-lg px-0.5 font-mono text-[11px] font-semibold ring-1 transition sm:text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${state} ${shade}`}
                    >
                      {fmt(v)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Check my values
          </button>
          <button
            type="button"
            onClick={() => {
              setPicked(Object.fromEntries(exp.map((v) => [key(v), true])));
              setChecked(true);
            }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Lightbulb size={15} /> Show answer
          </button>
          <button type="button" onClick={() => reset()} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        <div aria-live="polite">
          {checked && (
            <div className={`rounded-2xl border p-4 text-sm ${allOk ? 'border-ok/40 bg-ok-soft' : 'border-line bg-subtle'}`}>
              {allOk ? (
                <p className="font-semibold text-ok">
                  Perfect {mode}-value set: {exp.map(fmt).join(', ')}. That's {exp.length} tests for this rule.
                </p>
              ) : (
                <p className="font-semibold text-fg">
                  {exp.length - missing.length} of {exp.length} boundary values found{extra.length ? `, ${extra.length} extra` : ''}.
                </p>
              )}
              <ul className="mt-2 space-y-1.5">
                {missing.map((v) => (
                  <li key={'m' + v} className="flex items-start gap-2 text-fg">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-warn" />
                    <span className="min-w-0">Missing: {whyMissing(v)}</span>
                  </li>
                ))}
                {extra.map((v) => (
                  <li key={'e' + v} className="flex items-start gap-2 text-fg">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />
                    <span className="min-w-0">Extra: {whyExtra(v)}</span>
                  </li>
                ))}
                {allOk && (
                  <li className="flex items-start gap-2 text-fg">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
                    <span className="min-w-0">
                      The underline shows valid (green) and invalid (red) values. Each boundary is tested from both sides, so a <code>&lt;</code> written instead of{' '}
                      <code>&lt;=</code> in <code>{rule.code}</code> cannot hide.
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
