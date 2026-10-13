import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2, RotateCcw, ShoppingBag } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken checkout. Bugs (don't spoil them for learners!):
 *  1. "Pay on delivery" was added later with a different `name`, so it is its own group:
 *     it can be selected together with Card or PayPal, and once selected it can't be unselected.
 *  2. Shipping options are custom <span role="radio"> elements, each its own tab stop, with no key handling:
 *     arrow keys (and Space) don't move or change the selection.
 *  3. The total is calculated from the previously selected shipping option (stale state), so it lags one step behind.
 *  4. Payment has no default (fine) but nothing checks it: the order is placed with no payment method.
 *  5. Only the small circle selects a shipping option. Tapping the name, description or price does nothing.
 *  6. When the email validation error appears, shipping is reset to Standard (the selection is lost on re-render).
 */

type ShipKey = 'standard' | 'express' | 'nextday';
const SHIP: Record<ShipKey, { l: string; s: string; p: number }> = {
  standard: { l: 'Standard', s: '3–5 working days', p: 0 },
  express: { l: 'Express', s: '1–2 working days', p: 6.99 },
  nextday: { l: 'Next day', s: 'Order by 8 pm, arrives tomorrow', p: 12.99 },
};
const SUBTOTAL = 54;
const eur = (n: number) => `€${n.toFixed(2)}`;

interface Placed {
  shipping: string;
  payment: string;
  total: number;
}

export function BuggyCheckout() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [shipping, setShipping] = useState<ShipKey>('standard');
  const [total, setTotal] = useState(SUBTOTAL);
  const [payment, setPayment] = useState<'card' | 'paypal' | null>(null);
  const [cod, setCod] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const selectShipping = (k: ShipKey) => {
    setShipping(k);
    setTotal(SUBTOTAL + SHIP[shipping].p); // BUG 3: uses the old selection
  };

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter an email address for your receipt.');
      // BUG 6: the form re-renders from its defaults
      setShipping('standard');
      setTotal(SUBTOTAL);
      return;
    }
    setEmailError('');
    // BUG 4: no check that a payment method was chosen
    const methods = [payment === 'card' ? 'Card' : payment === 'paypal' ? 'PayPal' : null, cod ? 'Pay on delivery' : null].filter(Boolean);
    setPlaced({ shipping: SHIP[shipping].l, payment: methods.length ? methods.join(' + ') : '(none)', total });
  };

  const restart = () => {
    setEmail('');
    setEmailError('');
    setShipping('standard');
    setTotal(SUBTOTAL);
    setPayment(null);
    setCod(false);
    setPlaced(null);
  };

  const dark = '#111827';
  const muted = '#6b7280';

  return (
    <div className="flex w-full max-w-[460px] min-w-0 flex-col gap-4">
      <BrowserFrame url="shop.example.com/checkout">
        <div className="min-h-[520px] bg-white px-4 py-4 text-[14px] sm:px-6" style={{ colorScheme: 'light', color: dark }}>
          <div className="mb-4 flex items-center gap-2 font-bold">
            <ShoppingBag size={18} aria-hidden="true" /> Stride
            <span className="ml-auto text-[11px] font-medium" style={{ color: muted }}>
              Checkout
            </span>
          </div>

          {placed ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[18px] font-bold">
                <CheckCircle2 size={20} color="#16a34a" aria-hidden="true" /> Order #48213 placed
              </p>
              <dl className="space-y-2 rounded-xl bg-[#f9fafb] p-3 text-[13px]">
                {[
                  ['Shipping', placed.shipping],
                  ['Payment', placed.payment],
                  ['Total charged', eur(placed.total)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt style={{ color: muted }}>{k}</dt>
                    <dd className="min-w-0 text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <form onSubmit={placeOrder} noValidate className="space-y-5">
              <div>
                <label htmlFor={`${id}-email`} className="mb-1 block text-[13px] font-medium">
                  Email for your receipt
                </label>
                <input
                  id={`${id}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? `${id}-email-err` : undefined}
                  className={`w-full min-w-0 rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#111827] ${emailError ? 'border-[#dc2626]' : 'border-[#d1d5db]'}`}
                />
                {emailError && (
                  <p id={`${id}-email-err`} role="alert" className="mt-1 text-[12px] text-[#dc2626]">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <p id={`${id}-ship`} className="mb-2 text-[13px] font-semibold">
                  Shipping
                </p>
                <div role="radiogroup" aria-labelledby={`${id}-ship`} className="space-y-2">
                  {(Object.keys(SHIP) as ShipKey[]).map((k) => {
                    const o = SHIP[k];
                    const on = shipping === k;
                    return (
                      <div key={k} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${on ? 'border-[#111827] bg-[#f9fafb]' : 'border-[#e5e7eb]'}`}>
                        {/* BUG 2 + 5: only this small span reacts, and only to clicks */}
                        <span
                          role="radio"
                          aria-checked={on}
                          aria-label={o.l}
                          tabIndex={0}
                          onClick={() => selectShipping(k)}
                          className={`mt-0.5 grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-full border-2 outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 ${on ? 'border-[#111827]' : 'border-[#9ca3af]'}`}
                        >
                          {on && <span className="size-2 rounded-full bg-[#111827]" />}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span className="block font-medium">{o.l}</span>
                          <span className="block text-[12px]" style={{ color: muted }}>
                            {o.s}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium">{o.p ? eur(o.p) : 'Free'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <fieldset>
                <legend className="mb-1 text-[13px] font-semibold">Payment</legend>
                {/* BUG 1: "Pay on delivery" uses a different name */}
                {[
                  { name: `${id}-payment`, label: 'Card', checked: payment === 'card', set: () => setPayment('card') },
                  { name: `${id}-payment`, label: 'PayPal', checked: payment === 'paypal', set: () => setPayment('paypal') },
                  { name: `${id}-payment_method`, label: 'Pay on delivery', checked: cod, set: () => setCod(true) },
                ].map((r) => (
                  <label key={r.label} className="flex cursor-pointer items-center gap-2.5 py-1.5">
                    <input type="radio" name={r.name} checked={r.checked} onChange={r.set} className="size-4 accent-[#111827]" />
                    {r.label}
                  </label>
                ))}
              </fieldset>

              <dl className="space-y-1 border-t border-[#e5e7eb] pt-3 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt style={{ color: muted }}>Trail running shoes</dt>
                  <dd>{eur(SUBTOTAL)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: muted }}>Shipping ({SHIP[shipping].l})</dt>
                  <dd>{SHIP[shipping].p ? eur(SHIP[shipping].p) : 'Free'}</dd>
                </div>
                <div className="flex justify-between gap-3 pt-1 text-[15px] font-bold">
                  <dt>Total</dt>
                  <dd>{eur(total)}</dd>
                </div>
              </dl>

              <button type="submit" className="w-full rounded-lg bg-[#111827] py-2.5 font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 focus-visible:outline-none">
                Place order
              </button>
            </form>
          )}
        </div>
      </BrowserFrame>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
        <p className="text-xs text-muted">Use the mouse and the keyboard (Tab, arrows, Space).</p>
        <button type="button" onClick={restart} className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Start over
        </button>
      </div>
    </div>
  );
}
