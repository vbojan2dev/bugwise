import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronLeft, CheckCircle2, CreditCard, Headphones, Minus, Plus, RotateCcw, Smartphone, Tag, Trash2, Cable, X, Truck } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken shopping cart + checkout screen. Bugs (don't spoil them for learners!):
 *  1. The minus button is never disabled: quantity goes to 0 and negative, the item stays with a negative price.
 *  2. The same coupon (SAVE10) can be applied again and again; each copy takes another 10% off.
 *  3. Free shipping checks the subtotal BEFORE the discount, so $51.43 - 10% = $46.29 still ships free.
 *  4. The total is never rounded: the 10% discount is shown rounded, but the raw float is used, e.g. $53.928.
 *  5. "Pay" is not disabled while processing and has no idempotency key: a double tap creates two orders/charges.
 *  6. Removing an item does not recalculate the summary until something else changes.
 */

interface Item {
  id: string;
  name: string;
  meta: string;
  price: number;
  qty: number;
  stock: number;
  icon: typeof Headphones;
  tint: string;
}

const initialCart: Item[] = [
  { id: 'buds', name: 'Wireless earbuds', meta: 'White', price: 29.99, qty: 1, stock: 8, icon: Headphones, tint: '#e8f0ff' },
  { id: 'case', name: 'Phone case', meta: 'Midnight blue', price: 12.95, qty: 1, stock: 12, icon: Smartphone, tint: '#ffeede' },
  { id: 'cable', name: 'USB-C cable 2 m', meta: 'Braided', price: 8.49, qty: 2, stock: 3, icon: Cable, tint: '#e3f7ec' },
];

const SHIPPING = 4.99;
const FREE_FROM = 50;
const round2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`;

interface Summary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

function compute(cart: Item[], coupons: string[]): Summary {
  const subtotal = round2(cart.reduce((s, i) => s + i.price * i.qty, 0));
  // BUG 2: every copy of SAVE10 in the list counts again.
  const percent = coupons.filter((c) => c === 'SAVE10').length * 0.1;
  const discount = subtotal * percent; // BUG 4: not rounded to cents
  // BUG 3: threshold compares the pre-discount subtotal.
  const freeShip = coupons.includes('FREESHIP') || subtotal >= FREE_FROM;
  const shipping = cart.length === 0 || freeShip ? 0 : SHIPPING;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

interface LogEntry {
  id: number;
  method: 'POST' | 'DELETE' | 'PATCH';
  path: string;
  status: 'pending' | number;
  note?: string;
}

interface Order {
  number: number;
  amount: number;
}

export function BuggyCheckout() {
  const [cart, setCart] = useState<Item[]>(initialCart);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary>(() => compute(initialCart, []));
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [screen, setScreen] = useState<'cart' | 'done'>('cart');
  const [orders, setOrders] = useState<Order[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextLog = useRef(1);
  const nextOrder = useRef(10431);
  const inFlight = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addLog = (e: Omit<LogEntry, 'id'>) => {
    const id = nextLog.current++;
    setLog((l) => [{ ...e, id }, ...l].slice(0, 8));
    return id;
  };
  const patchLog = (id: number, p: Partial<LogEntry>) => setLog((l) => l.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const update = (nextCart: Item[], nextCoupons: string[]) => {
    setCart(nextCart);
    setCoupons(nextCoupons);
    setSummary(compute(nextCart, nextCoupons));
  };

  const changeQty = (id: string, delta: number) => {
    const next = cart.map((i) => (i.id === id ? { ...i, qty: Math.min(i.stock, i.qty + delta) } : i)); // BUG 1: no lower bound
    const item = next.find((i) => i.id === id)!;
    addLog({ method: 'PATCH', path: `/api/cart/items/${id}`, status: 200, note: `qty=${item.qty}` });
    update(next, coupons);
  };

  const remove = (id: string) => {
    addLog({ method: 'DELETE', path: `/api/cart/items/${id}`, status: 204 });
    setCart((c) => c.filter((i) => i.id !== id)); // BUG 6: summary is not recalculated
  };

  const applyCode = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (c === 'SAVE10' || c === 'FREESHIP') {
      addLog({ method: 'POST', path: '/api/cart/coupons', status: 200, note: c });
      update(cart, [...coupons, c]); // BUG 2: no duplicate check
      setCodeMsg({ ok: true, text: `${c} applied` });
      setCode('');
    } else if (c === 'SPRING5') {
      addLog({ method: 'POST', path: '/api/cart/coupons', status: 422, note: 'expired' });
      setCodeMsg({ ok: false, text: 'SPRING5 expired on 31 May.' });
    } else {
      addLog({ method: 'POST', path: '/api/cart/coupons', status: 404, note: c.slice(0, 12) });
      setCodeMsg({ ok: false, text: 'This code isn’t valid. Check the spelling.' });
    }
  };

  const removeCoupon = (index: number) => {
    addLog({ method: 'DELETE', path: '/api/cart/coupons', status: 204, note: coupons[index] });
    update(
      cart,
      coupons.filter((_, i) => i !== index),
    );
    setCodeMsg(null);
  };

  const pay = () => {
    // BUG 5: button stays enabled while processing and there is no idempotency key.
    const amount = round2(summary.total);
    const number = nextOrder.current++;
    inFlight.current++;
    setProcessing(true);
    const id = addLog({ method: 'POST', path: '/api/orders', status: 'pending', note: `$${amount.toFixed(2)}` });
    timers.current.push(
      window.setTimeout(() => {
        patchLog(id, { status: 201, note: `#${number} · charged $${amount.toFixed(2)}` });
        setOrders((o) => [...o, { number, amount }]);
        inFlight.current--;
        if (inFlight.current === 0) setProcessing(false);
        setScreen('done');
      }, 1500),
    );
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    inFlight.current = 0;
    setCart(initialCart);
    setCoupons([]);
    setSummary(compute(initialCart, []));
    setCode('');
    setCodeMsg(null);
    setProcessing(false);
    setScreen('cart');
    setOrders([]);
    setLog([]);
  };

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const sub = 'rgba(60,60,67,.6)';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        {screen === 'cart' ? (
          <div className="flex h-full flex-col bg-[#f2f2f7] text-black">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="flex items-center text-[15px] text-[#007aff]">
                <ChevronLeft size={20} /> Shop
              </span>
              <span className="text-[15px] font-semibold">Cart ({count})</span>
              <span className="w-12" />
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 [scrollbar-width:none]">
              {cart.length === 0 && <p className="rounded-xl bg-white px-3 py-6 text-center text-[13px]" style={{ color: sub }}>Your cart is empty.</p>}
              {cart.map((i) => (
                <div key={i.id} className="flex gap-2.5 rounded-xl bg-white p-2.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ background: i.tint }}>
                    <i.icon size={20} className="text-[#3a3a3c]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13px] leading-tight font-semibold">{i.name}</p>
                      <p className="shrink-0 text-[13px] font-semibold tabular-nums">{money(round2(i.price * i.qty))}</p>
                    </div>
                    <p className="text-[11px]" style={{ color: sub }}>
                      {i.meta} · ${i.price.toFixed(2)}
                      {i.stock <= 3 && <span className="text-[#c2410c]"> · Only {i.stock} left</span>}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center rounded-lg bg-[#f2f2f7]">
                        <button type="button" aria-label={`Decrease ${i.name}`} onClick={() => changeQty(i.id, -1)} className="grid size-8 place-items-center rounded-lg text-[#007aff]">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-[13px] font-semibold tabular-nums" aria-live="polite">
                          {i.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${i.name}`}
                          onClick={() => changeQty(i.id, 1)}
                          disabled={i.qty >= i.stock}
                          className="grid size-8 place-items-center rounded-lg text-[#007aff] disabled:text-[#c7c7cc]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => remove(i.id)} className="flex items-center gap-1 text-[12px] text-[#ff3b30]">
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <form onSubmit={applyCode} className="rounded-xl bg-white p-2.5">
                <div className="flex gap-2">
                  <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-[#f2f2f7] px-2">
                    <Tag size={13} style={{ color: sub }} />
                    <span className="sr-only">Coupon code</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Coupon code"
                      className="h-8 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#8e8e93]"
                    />
                  </label>
                  <button type="submit" className="rounded-lg bg-[#e5e5ea] px-3 text-[13px] font-semibold text-[#007aff]">
                    Apply
                  </button>
                </div>
                {codeMsg && (
                  <p className={`mt-1.5 text-[11px] ${codeMsg.ok ? 'text-[#248a3d]' : 'text-[#d70015]'}`} role="status">
                    {codeMsg.text}
                  </p>
                )}
                {coupons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {coupons.map((c, idx) => (
                      <span key={idx} className="flex items-center gap-1 rounded-full bg-[#e8f0ff] py-0.5 pr-1 pl-2 text-[11px] font-semibold text-[#0040dd]">
                        {c}
                        <button type="button" aria-label={`Remove coupon ${c}`} onClick={() => removeCoupon(idx)} className="grid size-4 place-items-center rounded-full hover:bg-black/10">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </form>

              <div className="space-y-1 rounded-xl bg-white p-3 text-[13px]">
                <div className="flex justify-between">
                  <span style={{ color: sub }}>Subtotal</span>
                  <span className="tabular-nums">{money(summary.subtotal)}</span>
                </div>
                {summary.discount !== 0 && (
                  <div className="flex justify-between text-[#248a3d]">
                    <span>Discount</span>
                    <span className="tabular-nums">−{money(summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: sub }}>Shipping</span>
                  <span className="tabular-nums">{summary.shipping === 0 ? 'Free' : money(summary.shipping)}</span>
                </div>
                <p className="flex items-center gap-1 text-[10px]" style={{ color: sub }}>
                  <Truck size={11} /> Free shipping on orders over ${FREE_FROM} · prices include VAT
                </p>
                <div className="flex justify-between border-t border-black/10 pt-1.5 text-[15px] font-bold">
                  <span>Total</span>
                  {/* BUG 4: raw float, no toFixed */}
                  <span className="tabular-nums">${summary.total}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px]">
                <CreditCard size={15} className="text-[#1a1f71]" />
                <span className="flex-1">Visa •••• 4242</span>
                <span className="rounded bg-[#fff4d6] px-1.5 text-[10px] font-semibold text-[#8a5a00]">TEST</span>
              </div>
            </div>

            <div className="shrink-0 border-t border-black/10 bg-white/90 px-3 pt-2 pb-6">
              <button
                type="button"
                onClick={pay}
                disabled={cart.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007aff] text-[15px] font-semibold text-white disabled:bg-[#c7c7cc]"
              >
                {processing && <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {processing ? 'Processing…' : `Pay ${money(round2(summary.total))}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center bg-white px-5 pt-14 text-center text-black">
            <CheckCircle2 size={56} className="text-[#34c759]" />
            <p className="mt-4 text-[22px] font-bold tracking-tight">Thank you!</p>
            <p className="mt-1 text-[13px]" style={{ color: sub }}>
              Order #{orders[0]?.number} is confirmed.
            </p>
            <div className="mt-5 w-full rounded-xl bg-[#f2f2f7] p-3 text-left text-[13px]">
              <div className="flex justify-between">
                <span style={{ color: sub }}>Paid with</span>
                <span>Visa •••• 4242</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span style={{ color: sub }}>Amount</span>
                <span className="font-semibold tabular-nums">{money(orders[0]?.amount ?? 0)}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: sub }}>
              A confirmation email is on its way to anna@example.com.
            </p>
            <button type="button" onClick={restart} className="mt-auto mb-8 h-11 w-full rounded-xl bg-[#007aff] text-[15px] font-semibold text-white">
              Continue shopping
            </button>
          </div>
        )}
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Test data</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <ul className="mt-2 space-y-1 text-muted">
          <li>
            <code className="font-semibold text-fg">SAVE10</code> 10% off the order (once per order)
          </li>
          <li>
            <code className="font-semibold text-fg">FREESHIP</code> free shipping
          </li>
          <li>
            <code className="font-semibold text-fg">SPRING5</code> expired code
          </li>
          <li>Shipping $4.99, free when the order total after discounts is $50 or more.</li>
        </ul>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network log</span>
          <span className="normal-case">Orders: {orders.length}</span>
        </div>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Change the cart to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className={e.method === 'POST' ? 'text-[#7dd3fc]' : e.method === 'DELETE' ? 'text-[#fca5a5]' : 'text-[#c4b5fd]'}>{e.method}</span>
              <span className="min-w-0 flex-1 truncate">
                {e.path}
                {e.note && <span className="text-white/45"> {e.note}</span>}
              </span>
              {e.status === 'pending' ? (
                <span className="text-[#fbbf24]">pending…</span>
              ) : (
                <span className={e.status >= 400 ? 'text-[#f87171]' : 'text-[#34d399]'}>{e.status}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
