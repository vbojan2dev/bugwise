import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, CreditCard, Minus, Plus, RotateCcw, CheckCircle2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken food-delivery checkout. Bugs (don't spoil them for learners!):
 *  1. Double submit: "Place order" is not blocked while the request is running, so two taps create two orders.
 *  2. Spinner never stops: on a 500 error the button keeps spinning forever and no error is shown.
 *  3. The "Apply" promo button looks disabled when the field is empty, but still sends a request.
 *  4. With large text the label is truncated and the price disappears ("Place order · €…").
 *  5. "Clear" empties the whole basket immediately: no confirmation, no undo.
 *  6. The +/− quantity buttons only react to taps on the tiny icon, not the whole circle (see layout bounds).
 */

interface Item {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

const initialItems: Item[] = [
  { id: 'pizza', name: 'Margherita pizza', price: 11.5, qty: 1, emoji: '🍕' },
  { id: 'bread', name: 'Garlic bread', price: 4.9, qty: 1, emoji: '🥖' },
  { id: 'lemonade', name: 'Lemonade', price: 3.5, qty: 2, emoji: '🍋' },
];
const DELIVERY = 1.5;
const eur = (n: number) => `€${n.toFixed(2)}`;

interface LogEntry {
  id: number;
  method: 'POST';
  path: string;
  status: number | null;
}

export function BuggyCheckout() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [promo, setPromo] = useState('');
  const [promoOn, setPromoOn] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<number | null>(null);
  const [orders, setOrders] = useState<{ id: number; total: number }[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [largeText, setLargeText] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [bounds, setBounds] = useState(false);
  const nextLog = useRef(1);
  const nextOrder = useRef(1042);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = promoOn ? Math.round(subtotal * 10) / 100 : 0;
  const total = Math.max(0, subtotal - discount) + (items.length ? DELIVERY : 0);

  const request = (path: string, ms: number, status: number, done: () => void) => {
    const id = nextLog.current++;
    setLog((l) => [{ id, method: 'POST' as const, path, status: null }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
        done();
      }, ms),
    );
  };

  const changeQty = (id: string, d: number) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i)).filter((i) => i.qty > 0));

  const applyPromo = () => {
    // BUG 3: no guard for an empty code, although the button looks disabled.
    const code = promo.trim().toUpperCase();
    const ok = code === 'SAVE10';
    request(`/api/promo  code="${code}"`, 600, code === '' ? 400 : ok ? 200 : 404, () => {
      if (ok) {
        setPromoOn(true);
        setPromoMsg({ ok: true, text: 'SAVE10 applied: 10% off' });
      } else {
        setPromoOn(false);
        setPromoMsg({ ok: false, text: code === '' ? 'Something went wrong' : 'Code not found' });
      }
    });
  };

  const placeOrder = () => {
    // BUG 1: no "if (placing) return" and the button is not disabled while loading.
    setPlacing(true);
    const amount = total;
    const fail = serverError;
    request('/api/orders', 1600, fail ? 500 : 201, () => {
      if (fail) return; // BUG 2: loading state is never reset, no error message.
      const id = nextOrder.current++;
      setOrders((o) => [...o, { id, total: amount }]);
      setPlacing(false);
      setPlaced(id);
    });
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setItems(initialItems);
    setPromo('');
    setPromoOn(false);
    setPromoMsg(null);
    setPlacing(false);
    setPlaced(null);
    setLog([]);
    nextOrder.current = 1042 + orders.length;
  };

  const backToBasket = () => {
    setPlaced(null);
    setItems(initialItems);
    setPromoOn(false);
    setPromo('');
    setPromoMsg(null);
  };

  const b = bounds ? 'outline outline-1 outline-[#ff2bd6]' : '';
  const sub = 'rgba(60,60,67,.6)';
  const t = largeText ? 1.25 : 1;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        {placed !== null ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <CheckCircle2 size={56} className="text-[#34c759]" />
            <p className="mt-3 text-[22px] font-bold">Order placed!</p>
            <p className="mt-1 text-[13px]" style={{ color: sub }}>
              Order #{placed} · arriving in 25–35 min
            </p>
            <button type="button" onClick={backToBasket} className={`mt-6 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-[#007aff] ${b}`}>
              Back to menu
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-3 pt-1 pb-2">
              <span className="flex items-center text-[15px] text-[#007aff]">
                <ChevronLeft size={22} /> Menu
              </span>
              <span className="text-[15px] font-semibold">Checkout</span>
              <span className="w-14" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3" style={{ fontSize: 13 * t }}>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                  Your basket
                </p>
                {items.length > 0 && (
                  <button type="button" onClick={() => setItems([])} className={`px-1 py-1 text-[13px] font-medium text-[#ff3b30] ${b}`}>
                    Clear
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="py-8 text-center text-[13px]" style={{ color: sub }}>
                  Your basket is empty.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-black/5">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-2 py-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f2f2f7] text-lg">{i.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{i.name}</span>
                        <span className="block text-[12px]" style={{ color: sub }}>
                          {eur(i.price * i.qty)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {/* BUG 6: the visible circle is 28px, but only the 12px icon is clickable. */}
                        <span className="grid size-7 place-items-center rounded-full bg-[#f2f2f7] text-[#007aff]">
                          <Minus size={12} strokeWidth={3} role="button" aria-label={`Fewer ${i.name}`} onClick={() => changeQty(i.id, -1)} className={`cursor-pointer ${b}`} />
                        </span>
                        <span className="w-4 text-center font-semibold tabular-nums">{i.qty}</span>
                        <span className="grid size-7 place-items-center rounded-full bg-[#f2f2f7] text-[#007aff]">
                          <Plus size={12} strokeWidth={3} role="button" aria-label={`More ${i.name}`} onClick={() => changeQty(i.id, 1)} className={`cursor-pointer ${b}`} />
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                Promo code
              </p>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="e.g. SAVE10"
                  aria-label="Promo code"
                  className={`h-9 min-w-0 flex-1 rounded-lg bg-[#f2f2f7] px-3 text-[13px] text-black uppercase outline-none placeholder:text-black/35 placeholder:normal-case focus:ring-2 focus:ring-[#007aff]/40 ${b}`}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-semibold ${promo.trim() ? 'bg-[#007aff] text-white' : 'bg-[#787880]/15 text-black/30'} ${b}`}
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className="mt-1 text-[12px]" style={{ color: promoMsg.ok ? '#248a3d' : '#ff3b30' }}>
                  {promoMsg.text}
                </p>
              )}

              <p className="mt-3 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                Payment
              </p>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#f2f2f7] px-3 py-2">
                <CreditCard size={16} className="text-[#007aff]" />
                <span className="flex-1">Visa •••• 4242</span>
              </div>

              <div className="mt-3 space-y-0.5 text-[12px]" style={{ color: sub }}>
                <p className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{eur(subtotal)}</span>
                </p>
                {discount > 0 && (
                  <p className="flex justify-between text-[#248a3d]">
                    <span>Discount</span>
                    <span>−{eur(discount)}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <span>Delivery</span>
                  <span>{eur(items.length ? DELIVERY : 0)}</span>
                </p>
              </div>
            </div>
            {/* Sticky CTA */}
            <div className="shrink-0 border-t border-black/5 bg-white/95 px-4 pt-2.5 pb-6">
              <button
                type="button"
                onClick={placeOrder}
                disabled={items.length === 0}
                className={`relative flex h-[50px] w-full items-center justify-center rounded-[14px] bg-[#007aff] px-4 font-semibold text-white active:opacity-60 disabled:bg-[#787880]/15 disabled:text-black/30 ${b}`}
                style={{ fontSize: largeText ? 28 : 17 }}
              >
                {placing ? (
                  <span aria-label="Loading" className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  // BUG 4: clipped with an ellipsis, so the price disappears at large text sizes.
                  <span className="min-w-0 truncate">Place order · {eur(total)}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Large text
            <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Server errors
            <input type="checkbox" checked={serverError} onChange={(e) => setServerError(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            <span>Show layout bounds <span className="text-[11px] text-faint">(developer option)</span></span>
            <input type="checkbox" checked={bounds} onChange={(e) => setBounds(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network log</span>
          <span className="normal-case">
            Orders in database: <strong className={orders.length > 1 ? 'text-[#fbbf24]' : 'text-white/80'}>{orders.length}</strong>
          </span>
        </div>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Requests will appear here…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#c4b5fd]">{e.method}</span>
              <span className="min-w-0 flex-1 truncate">{e.path}</span>
              {e.status === null ? (
                <span className="text-[#fbbf24]">pending…</span>
              ) : (
                <span className={e.status < 300 ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>
              )}
            </li>
          ))}
        </ul>
        {orders.length > 0 && (
          <p className="border-t border-white/10 px-3 py-2 text-white/50">
            {orders.map((o) => `#${o.id} ${eur(o.total)}`).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
