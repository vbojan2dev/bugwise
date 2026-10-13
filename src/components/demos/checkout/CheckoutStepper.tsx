import { useRef, useState, type KeyboardEvent } from 'react';
import { ShoppingCart, MapPin, Truck, CreditCard, ClipboardCheck, PartyPopper, Check } from 'lucide-react';

const steps = [
  {
    name: 'Cart',
    icon: ShoppingCart,
    happens: 'The shopper reviews items, changes quantities, removes things or saves them for later, and enters a coupon.',
    test: ['Quantity limits (min 1, max stock)', 'Remove and save for later update the totals', 'Coupons: valid, expired, used twice, lower/upper case', 'Cart survives closing the app and logging in on another device'],
    bug: 'Total does not refresh after removing an item.',
  },
  {
    name: 'Shipping',
    icon: MapPin,
    happens: 'The shopper enters or picks a delivery address. Guests type it in; logged-in users choose a saved one.',
    test: ['Required fields and postcode format per country', 'Saved addresses can be selected and edited', 'Unsupported countries are blocked with a clear message', 'Autofill fills the right fields'],
    bug: 'Changing the country does not update shipping costs or tax.',
  },
  {
    name: 'Delivery',
    icon: Truck,
    happens: 'The shopper picks a delivery option (standard, express, pickup). Each one has a price and an estimated date.',
    test: ['Each option changes the shipping line and total', 'Free shipping threshold is applied correctly', 'Delivery dates skip weekends and holidays', 'Express is hidden where it is not available'],
    bug: 'Free shipping is calculated before the discount is subtracted.',
  },
  {
    name: 'Payment',
    icon: CreditCard,
    happens: 'The shopper pays by card, Apple Pay, Google Pay or PayPal. The payment gateway approves or declines it, sometimes after a 3-D Secure check.',
    test: ['Approved, declined and insufficient funds test cards', '3-D Secure challenge: pass, fail, cancel', 'Double tap on Pay creates only one charge', 'Card fields validate number, expiry and CVC'],
    bug: 'Double tapping Pay charges the card twice.',
  },
  {
    name: 'Review',
    icon: ClipboardCheck,
    happens: 'A final summary of items, address, delivery, payment method and total. Nothing is charged until the shopper confirms.',
    test: ['Every value matches what was chosen in earlier steps', 'Edit links jump back to the right step and keep data', 'Price changes since the cart are clearly shown', 'Terms and conditions link works'],
    bug: 'Review shows the old address after the shopper edited it.',
  },
  {
    name: 'Confirmation',
    icon: PartyPopper,
    happens: 'The order number appears, the cart is emptied, stock is reserved, and a confirmation email (or push) is sent.',
    test: ['Order number shown and found in order history', 'Exactly one confirmation email with correct items and total', 'Cart is empty afterwards', 'Refreshing this page does not create a new order'],
    bug: 'Refreshing the confirmation page places the order again.',
  },
];

export default function CheckoutStepper() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = steps[active];

  const onKey = (e: KeyboardEvent) => {
    let next = active;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (active + 1) % steps.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (active - 1 + steps.length) % steps.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = steps.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div role="tablist" aria-label="Checkout steps" onKeyDown={onKey} className="grid grid-cols-3 gap-y-3 border-b border-line bg-subtle px-3 py-4 sm:grid-cols-6 sm:px-5">
        {steps.map((st, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <button
              key={st.name}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`checkout-step-${i}`}
              aria-selected={current}
              aria-controls="checkout-step-panel"
              tabIndex={current ? 0 : -1}
              onClick={() => setActive(i)}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {i > 0 && <span aria-hidden className={`absolute top-[18px] right-1/2 hidden h-0.5 w-full sm:block ${i <= active ? 'bg-brand' : 'bg-line-strong'}`} />}
              <span
                className={`relative z-10 grid size-9 place-items-center rounded-full ring-4 ring-subtle transition-colors ${
                  current ? 'bg-brand text-brand-fg' : done ? 'bg-brand-soft text-brand' : 'bg-surface text-muted group-hover:text-fg'
                } ${!current && !done ? 'border border-line-strong' : ''}`}
              >
                {done ? <Check size={16} /> : <st.icon size={16} />}
              </span>
              <span className={`text-xs font-medium ${current ? 'text-fg' : 'text-muted'}`}>
                <span className="text-faint">{i + 1}.</span> {st.name}
              </span>
            </button>
          );
        })}
      </div>
      <div id="checkout-step-panel" role="tabpanel" aria-labelledby={`checkout-step-${active}`} className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">What happens</p>
          <p className="mt-1.5 text-sm text-fg">{s.happens}</p>
          <div className="mt-4 rounded-xl bg-danger-soft px-3 py-2.5 text-sm">
            <p className="text-xs font-semibold tracking-wide text-danger uppercase">Classic bug</p>
            <p className="mt-0.5 text-fg">{s.bug}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">What to test</p>
          <ul className="mt-1.5 space-y-1.5 text-sm">
            {s.test.map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-ok" />
                <span className="text-fg">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
        <button type="button" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} className="font-medium text-muted hover:text-fg disabled:opacity-40">
          ← Back
        </button>
        <span className="text-xs text-faint">
          Step {active + 1} of {steps.length}
        </span>
        <button type="button" onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))} disabled={active === steps.length - 1} className="font-medium text-brand disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  );
}
