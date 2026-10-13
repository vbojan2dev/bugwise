import { useState } from 'react';
import { CheckCircle2, CircleAlert, RotateCcw, Truck } from 'lucide-react';

/**
 * "Test it" box: type a value into a mock field, see how the app reacts and
 * which equivalence partition the value belongs to. Tracks partition coverage.
 */

type Part = { id: string; name: string; kind: 'valid' | 'invalid' | 'output'; example: string };
type Result = { part: string; ok: boolean; msg: string };
type Field = {
  id: string;
  tab: string;
  screen: string;
  label: string;
  placeholder: string;
  button: string;
  inputMode: 'numeric' | 'decimal' | 'text';
  parts: Part[];
  classify: (raw: string) => Result;
};

const INT = /^-?\d+$/;
const NUM = /^-?\d+([.,]\d+)?$/;
const num = (s: string) => Number(s.replace(',', '.'));

const FIELDS: Field[] = [
  {
    id: 'age',
    tab: 'Age 18–60',
    screen: 'Create account',
    label: 'Age',
    placeholder: 'Your age',
    button: 'Continue',
    inputMode: 'numeric',
    parts: [
      { id: 'empty', name: 'Empty', kind: 'invalid', example: '(blank)' },
      { id: 'nan', name: 'Not a number', kind: 'invalid', example: 'abc' },
      { id: 'dec', name: 'Decimal', kind: 'invalid', example: '25.5' },
      { id: 'low', name: 'Below 18', kind: 'invalid', example: '12' },
      { id: 'ok', name: '18 – 60', kind: 'valid', example: '35' },
      { id: 'high', name: 'Above 60', kind: 'invalid', example: '72' },
    ],
    classify: (raw) => {
      const t = raw.trim();
      if (!t) return { part: 'empty', ok: false, msg: 'Enter your age.' };
      if (!NUM.test(t)) return { part: 'nan', ok: false, msg: 'Age must be a number.' };
      if (!INT.test(t)) return { part: 'dec', ok: false, msg: 'Enter your age in whole years.' };
      const n = num(t);
      if (n < 18) return { part: 'low', ok: false, msg: 'You must be at least 18 to sign up.' };
      if (n > 60) return { part: 'high', ok: false, msg: 'This plan is for ages 18 to 60.' };
      return { part: 'ok', ok: true, msg: 'Looks good! Next: choose your goals.' };
    },
  },
  {
    id: 'qty',
    tab: 'Quantity 1–10',
    screen: 'Your cart',
    label: 'Quantity · Running socks',
    placeholder: 'Qty',
    button: 'Update cart',
    inputMode: 'numeric',
    parts: [
      { id: 'empty', name: 'Empty', kind: 'invalid', example: '(blank)' },
      { id: 'nan', name: 'Not a number', kind: 'invalid', example: 'two' },
      { id: 'dec', name: 'Decimal', kind: 'invalid', example: '2.5' },
      { id: 'low', name: '0 or less', kind: 'invalid', example: '0' },
      { id: 'ok', name: '1 – 10', kind: 'valid', example: '4' },
      { id: 'high', name: '11 or more', kind: 'invalid', example: '25' },
    ],
    classify: (raw) => {
      const t = raw.trim();
      if (!t) return { part: 'empty', ok: false, msg: 'Enter a quantity.' };
      if (!NUM.test(t)) return { part: 'nan', ok: false, msg: 'Quantity must be a number.' };
      if (!INT.test(t)) return { part: 'dec', ok: false, msg: 'Quantity must be a whole number.' };
      const n = num(t);
      if (n < 1) return { part: 'low', ok: false, msg: 'Quantity must be at least 1. Use "Remove" to delete the item.' };
      if (n > 10) return { part: 'high', ok: false, msg: 'Max 10 per order.' };
      return { part: 'ok', ok: true, msg: `Cart updated: ${n} × €8.00 = €${(n * 8).toFixed(2)}` };
    },
  },
  {
    id: 'promo',
    tab: 'Promo code',
    screen: 'Checkout',
    label: 'Promo code (optional)',
    placeholder: 'e.g. PIZZA10',
    button: 'Apply',
    inputMode: 'text',
    parts: [
      { id: 'empty', name: 'Empty (no code)', kind: 'valid', example: '(blank)' },
      { id: 'sym', name: 'Has symbols', kind: 'invalid', example: 'SAVE-10!' },
      { id: 'short', name: '1–5 chars', kind: 'invalid', example: 'ABC' },
      { id: 'ok', name: '6–10 chars', kind: 'valid', example: 'PIZZA10' },
      { id: 'long', name: '11+ chars', kind: 'invalid', example: 'FREEDELIVERY2' },
    ],
    classify: (raw) => {
      const t = raw.trim();
      if (!t) return { part: 'empty', ok: true, msg: 'No code. You pay the full price.' };
      if (!/^[a-z0-9]+$/i.test(t)) return { part: 'sym', ok: false, msg: 'Codes use letters and numbers only.' };
      if (t.length < 6) return { part: 'short', ok: false, msg: `Invalid code format (${t.length} characters).` };
      if (t.length > 10) return { part: 'long', ok: false, msg: `Invalid code format (${t.length} characters).` };
      return { part: 'ok', ok: true, msg: `Format OK (${t.length} characters). Checking the code…` };
    },
  },
  {
    id: 'ship',
    tab: 'Shipping (output)',
    screen: 'Order summary',
    label: 'Items subtotal (€)',
    placeholder: 'e.g. 34.90',
    button: 'Calculate shipping',
    inputMode: 'decimal',
    parts: [
      { id: 'zero', name: '€0 or less', kind: 'invalid', example: '0' },
      { id: 'a', name: 'Under €20', kind: 'output', example: '12.50' },
      { id: 'b', name: '€20 – €49.99', kind: 'output', example: '35.00' },
      { id: 'c', name: '€50 and up', kind: 'output', example: '80.00' },
    ],
    classify: (raw) => {
      const t = raw.trim();
      if (!t || !NUM.test(t)) return { part: '', ok: false, msg: 'Enter an amount like 34.90. (In the real app the total is calculated, not typed.)' };
      const n = num(t);
      if (n <= 0) return { part: 'zero', ok: false, msg: 'Your cart is empty.' };
      if (n < 20) return { part: 'a', ok: true, msg: 'Shipping: €4.99' };
      if (n < 50) return { part: 'b', ok: true, msg: 'Shipping: €2.99' };
      return { part: 'c', ok: true, msg: 'Shipping: FREE 🎉' };
    },
  },
];

const chip = {
  valid: 'bg-ok-soft text-ok',
  invalid: 'bg-danger-soft text-danger',
  output: 'bg-info-soft text-info',
} as const;

export default function FieldTester() {
  const [fid, setFid] = useState(FIELDS[0].id);
  const f = FIELDS.find((x) => x.id === fid)!;
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [log, setLog] = useState<{ v: string; part: string }[]>([]);

  const switchTo = (id: string) => {
    setFid(id);
    setValue('');
    setResult(null);
    setLog([]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = f.classify(value);
    setResult(r);
    setLog((prev) => [{ v: value.trim() === '' ? '(blank)' : value.trim(), part: r.part }, ...prev].slice(0, 12));
  };

  const covered = new Set(log.map((l) => l.part).filter(Boolean));
  const allCovered = f.parts.every((p) => covered.has(p.id));
  const partName = (id: string) => f.parts.find((p) => p.id === id)?.name ?? 'Not a valid amount';

  return (
    <div className="not-prose relative my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🔬 Test it: which partition is this value in?</p>
        <p className="text-sm text-muted">Type a value into the app and submit it. Try to hit every partition with as few values as you can.</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-subtle px-4 py-2.5" role="tablist" aria-label="Field to test">
        {FIELDS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === fid}
            onClick={() => switchTo(x.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
              x.id === fid ? 'bg-brand text-brand-fg' : 'bg-surface text-muted ring-1 ring-line hover:text-fg'
            }`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Mock app screen: light, iOS-style */}
        <div className="min-w-0 p-4 sm:p-6" style={{ background: '#f2f2f7', colorScheme: 'light' }}>
          <div className="mx-auto max-w-sm rounded-[22px] bg-white p-4 text-[#1c1c1e] shadow-[0_8px_24px_-12px_rgba(0,0,0,.25)]">
            <p className="text-[17px] font-semibold">{f.screen}</p>
            <form onSubmit={submit} className="mt-3">
              <label htmlFor={`ft-${f.id}`} className="mb-1 block text-[13px] font-medium text-[#6c6c70]">
                {f.label}
              </label>
              <input
                id={`ft-${f.id}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode={f.inputMode}
                autoComplete="off"
                placeholder={f.placeholder}
                aria-invalid={result ? !result.ok : undefined}
                aria-describedby={`ft-msg-${f.id}`}
                className={`h-11 w-full rounded-[10px] border bg-white px-3 text-[17px] text-[#1c1c1e] placeholder:text-[#a1a1a6] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/30 focus:outline-none ${
                  result && !result.ok ? 'border-[#ff3b30]' : 'border-[#d1d1d6]'
                }`}
              />
              <p id={`ft-msg-${f.id}`} className="mt-1.5 min-h-[20px] text-[13px]" role="status">
                {result && (
                  <span className={`flex items-start gap-1 ${result.ok ? 'text-[#248a3d]' : 'text-[#d70015]'}`}>
                    {f.id === 'ship' && result.ok ? <Truck size={14} className="mt-0.5 shrink-0" /> : result.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <CircleAlert size={14} className="mt-0.5 shrink-0" />}
                    {result.msg}
                  </span>
                )}
              </p>
              <button type="submit" className="mt-3 h-11 w-full rounded-[12px] bg-[#007aff] text-[17px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2 focus-visible:outline-none active:opacity-80">
                {f.button}
              </button>
            </form>
          </div>
        </div>

        {/* Partitions + coverage */}
        <div className="min-w-0 border-t border-line p-4 sm:p-6 md:border-t-0 md:border-l">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Partitions</p>
            <p className="text-sm text-muted">
              Covered <span className="font-mono font-semibold text-fg">{covered.size}/{f.parts.length}</span>
            </p>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1.5">
            {f.parts.map((p) => {
              const hit = result?.part === p.id;
              const done = covered.has(p.id);
              return (
                <li
                  key={p.id}
                  className={`min-w-0 rounded-lg px-2 py-1.5 text-xs transition ${chip[p.kind]} ${hit ? 'ring-2 ring-brand' : ''} ${done ? '' : 'opacity-60'}`}
                >
                  <span className="flex items-center gap-1 font-semibold">
                    {done && <CheckCircle2 size={12} className="shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="block truncate font-mono opacity-80">e.g. {p.example}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-faint">Green = valid, red = invalid, blue = a different output.</p>

          {result && (
            <p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm text-fg" aria-live="polite">
              <strong>{log[0]?.v}</strong> falls into <strong>{partName(result.part)}</strong>.{' '}
              {log.slice(1).some((l) => l.part === result.part && result.part) && (
                <span className="text-muted">You already tested this partition, so this value adds little new information.</span>
              )}
            </p>
          )}
          {allCovered && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-ok-soft p-3 text-sm text-ok">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>
                All {f.parts.length} partitions covered. That's the minimum equivalence-partitioning set for this field ({f.parts.length} tests).
              </span>
            </p>
          )}

          {log.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">Your test log</p>
                <button type="button" onClick={() => switchTo(f.id)} className="flex items-center gap-1 rounded text-xs text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {log.map((l, i) => (
                  <li key={i} className="max-w-full truncate rounded-md bg-subtle px-2 py-0.5 font-mono text-xs text-muted ring-1 ring-line">
                    {l.v} → {partName(l.part)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
