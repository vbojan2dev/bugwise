import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, PackagePlus, Trash2, XCircle } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { findTransition, invalidPairs, orderModel as spec, tkey } from './models';

/*
 * A deliberately broken order back office. The spec is orderModel in models.ts.
 * Bugs (don't spoil them for learners!):
 *  1. Delivered + Cancel → Canceled (and refunds) although the customer has the goods.
 *  2. Placed + Refund → Refunded: refunds money that was never paid.
 *  3. Placed + Ship → Shipped: ships an unpaid order.
 *  4. Canceled + Pay → Paid: a canceled order comes back to life and takes money.
 *  5. Paid + Pay → stays Paid but charges the card a second time.
 * Every other pair follows the spec (invalid ones are rejected with an error).
 */

type St = 'placed' | 'paid' | 'shipped' | 'delivered' | 'canceled' | 'refunded';
interface Money {
  id: number;
  kind: 'charge' | 'refund';
  amount: number;
}
interface Line {
  id: number;
  from: St;
  event: string;
  to: St | null;
}

const TOTAL = 84;
const label = (s: string) => spec.states.find((x) => x.id === s)?.label ?? s;
const pill: Record<St, string> = {
  placed: 'bg-[#eef2ff] text-[#3730a3]',
  paid: 'bg-[#e0f2fe] text-[#075985]',
  shipped: 'bg-[#fef3c7] text-[#92400e]',
  delivered: 'bg-[#dcfce7] text-[#166534]',
  canceled: 'bg-[#f3f4f6] text-[#374151]',
  refunded: 'bg-[#fce7f3] text-[#9d174d]',
};
const actions: { id: string; label: string }[] = [
  { id: 'pay', label: 'Record payment' },
  { id: 'ship', label: 'Ship' },
  { id: 'deliver', label: 'Mark delivered' },
  { id: 'cancel', label: 'Cancel order' },
  { id: 'refund', label: 'Refund' },
];
const invalidAll = invalidPairs(spec);
const times = ['09:12', '09:14', '10:03', '11:40', '13:25', '14:02', '15:47', '16:10', '17:33', '18:05'];

export function BuggyOrderAdmin() {
  const [order, setOrder] = useState(1042);
  const [state, setState] = useState<St>('placed');
  const [money, setMoney] = useState<Money[]>([]);
  const [history, setHistory] = useState<{ s: St; t: string }[]>([{ s: 'placed', t: times[0] }]);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [log, setLog] = useState<Line[]>([]);
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['placed']));
  const [covered, setCovered] = useState<Set<string>>(() => new Set());
  const [tried, setTried] = useState<Set<string>>(() => new Set());
  const ids = useRef(1);
  const timer = useRef<number | undefined>(undefined);
  const stateRef = useRef<St>('placed');

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (ok: boolean, text: string) => {
    window.clearTimeout(timer.current);
    setToast({ ok, text });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const fire = (event: string) => {
    const from = stateRef.current;
    const k = tkey(from, event);
    const specT = findTransition(spec, from, event);
    // Record coverage against the SPEC, whatever the system does.
    if (specT) setCovered((c) => new Set(c).add(k));
    else setTried((c) => new Set(c).add(k));

    let to: St | null = null;
    const addMoney = (kind: Money['kind']) => setMoney((m) => [...m, { id: ids.current++, kind, amount: TOTAL }]);

    switch (k) {
      // ---- correct transitions ----
      case 'placed:pay':
        to = 'paid';
        addMoney('charge');
        break;
      case 'placed:cancel':
        to = 'canceled';
        break;
      case 'paid:ship':
        to = 'shipped';
        break;
      case 'paid:cancel':
        to = 'canceled';
        addMoney('refund');
        break;
      case 'shipped:deliver':
        to = 'delivered';
        break;
      case 'delivered:refund':
        to = 'refunded';
        addMoney('refund');
        break;
      // ---- bugs ----
      case 'delivered:cancel': // BUG 1
        to = 'canceled';
        addMoney('refund');
        break;
      case 'placed:refund': // BUG 2
        to = 'refunded';
        addMoney('refund');
        break;
      case 'placed:ship': // BUG 3
        to = 'shipped';
        break;
      case 'canceled:pay': // BUG 4
        to = 'paid';
        addMoney('charge');
        break;
      case 'paid:pay': // BUG 5: self-transition that charges again
        to = 'paid';
        addMoney('charge');
        break;
      default:
        to = null;
    }

    setLog((l) => [{ id: ids.current++, from, event, to }, ...l].slice(0, 30));
    if (to) {
      stateRef.current = to;
      const next = to;
      setState(next);
      setVisited((v) => new Set(v).add(next));
      setHistory((h) => [...h, { s: next, t: times[Math.min(h.length, times.length - 1)] }]);
      flash(true, `${actions.find((a) => a.id === event)?.label}: done. Order is now ${label(next)}.`);
    } else {
      flash(false, `Can't ${actions.find((a) => a.id === event)?.label.toLowerCase()}: order is ${label(from)}.`);
    }
  };

  const newOrder = () => {
    window.clearTimeout(timer.current);
    stateRef.current = 'placed';
    setOrder((o) => o + 1);
    setState('placed');
    setMoney([]);
    setHistory([{ s: 'placed', t: times[0] }]);
    setToast(null);
  };
  const clearCoverage = () => {
    setVisited(new Set([stateRef.current]));
    setCovered(new Set());
    setTried(new Set());
    setLog([]);
  };

  const charged = money.filter((m) => m.kind === 'charge').reduce((a, m) => a + m.amount, 0);
  const refunded = money.filter((m) => m.kind === 'refund').reduce((a, m) => a + m.amount, 0);
  const evLabel = (id: string) => actions.find((a) => a.id === id)?.label ?? id;

  return (
    <div className="w-full max-w-[460px] min-w-0 space-y-4">
      <BrowserFrame url="shop.example.com/admin">
        <div className="space-y-4 p-4 text-[13px]" style={{ colorScheme: 'light', background: '#fff', color: '#0e1120' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-[#6b7280] uppercase">Order</p>
              <p className="text-base font-semibold">#A-{order}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pill[state]}`}>
              {label(state)}
            </span>
          </div>

          <div className="rounded-lg border border-[#e5e7eb] p-3">
            <div className="flex justify-between gap-2">
              <span>Trail running shoes × 1</span>
              <span>$74.00</span>
            </div>
            <div className="mt-1 flex justify-between gap-2 text-[#6b7280]">
              <span>Shipping</span>
              <span>$10.00</span>
            </div>
            <div className="mt-2 flex justify-between gap-2 border-t border-[#e5e7eb] pt-2 font-semibold">
              <span>Total</span>
              <span>${TOTAL.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Actions</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => fire(a.id)}
                  className={`min-h-10 rounded-lg border px-2 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] active:scale-[.98] ${
                    a.id === 'cancel' || a.id === 'refund'
                      ? 'border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2]'
                      : 'border-[#d1d5db] text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div className="mt-2 min-h-[38px]" role="status">
              {toast ? (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[13px] text-white ${toast.ok ? 'bg-[#111827]' : 'bg-[#b91c1c]'}`}>
                  {toast.ok ? <CheckCircle2 size={16} className="mt-px shrink-0" /> : <CircleAlert size={16} className="mt-px shrink-0" />}
                  <span className="min-w-0">{toast.text}</span>
                </div>
              ) : (
                <p className="text-[11px] text-[#6b7280]">Staff tool: every action is always shown. The server must reject the ones that aren't allowed.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Payments</p>
              {money.length === 0 ? (
                <p className="text-[#6b7280]">No payments yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {money.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span>{m.kind === 'charge' ? 'Card charged' : 'Refund issued'}</span>
                      <span className={m.kind === 'charge' ? '' : 'text-[#b91c1c]'}>
                        {m.kind === 'charge' ? '+' : '−'}${m.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 border-t border-[#e5e7eb] pt-1 font-semibold">
                Net: {charged - refunded < 0 ? '−' : ''}${Math.abs(charged - refunded).toFixed(2)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Status history</p>
              <ol className="space-y-0.5">
                {history.slice(-6).map((h, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{label(h.s)}</span>
                    <span className="text-[#6b7280]">{h.t}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </BrowserFrame>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-fg">Tester's notebook</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={newOrder} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]">
              <PackagePlus size={14} /> New order
            </button>
            <button type="button" onClick={clearCoverage} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]">
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">Coverage is measured against the spec diagram above, across all orders you create.</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['States', visited.size, spec.states.length],
            ['Valid', covered.size, spec.transitions.length],
            ['Invalid tried', tried.size, invalidAll.length],
          ].map(([l, v, t]) => (
            <div key={l as string} className="min-w-0 rounded-xl bg-subtle px-1 py-2 ring-1 ring-line">
              <dt className="truncate text-[11px] text-muted">{l}</dt>
              <dd className="font-mono text-sm font-semibold text-fg">
                {v}/{t}
              </dd>
            </div>
          ))}
        </dl>
        {log.length > 0 && (
          <ol className="relative mt-3 max-h-40 space-y-1 overflow-y-auto pr-1 text-xs" aria-label="What the system did, newest first">
            {log.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-lg bg-subtle px-2 py-1.5">
                {l.to ? <CheckCircle2 size={14} className="shrink-0 text-muted" aria-label="accepted" /> : <XCircle size={14} className="shrink-0 text-muted" aria-label="rejected" />}
                <span className="min-w-0 text-fg">
                  {label(l.from)} <span className="text-muted">+ {evLabel(l.event)} →</span> {l.to ? label(l.to) : <em className="text-muted">rejected</em>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
