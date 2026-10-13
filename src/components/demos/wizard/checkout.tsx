import { useId, type ReactNode } from 'react';
import { Check, CreditCard, Pencil, TriangleAlert, Wallet, Banknote } from 'lucide-react';

/* Shared pieces for the wizard demos: a 4-step checkout (Contact, Shipping, Payment, Review). */

export const STEPS = [
  { key: 'contact', label: 'Contact' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
] as const;
export type StepKey = (typeof STEPS)[number]['key'];

export interface Contact {
  email: string;
  phone: string;
}
export interface Shipping {
  street: string;
  city: string;
  zip: string;
  speed: 'standard' | 'express';
}
export interface Payment {
  method: '' | 'card' | 'paypal' | 'invoice';
  billingSame: boolean;
}
export interface Data {
  contact: Contact;
  shipping: Shipping;
  payment: Payment;
}
export type FormKey = 'contact' | 'shipping' | 'payment';
export type Errors = Record<string, string>;

export const EMPTY: Data = {
  contact: { email: '', phone: '' },
  shipping: { street: '', city: '', zip: '', speed: 'standard' },
  payment: { method: '', billingSame: true },
};
export const SAMPLE: Data = {
  contact: { email: 'maya.lopez@example.com', phone: '+1 555 0142' },
  shipping: { street: '1200 Lakeview Avenue, Apt 4B', city: 'Portland', zip: '97205', speed: 'express' },
  payment: { method: 'card', billingSame: true },
};

export const FORM_KEYS: FormKey[] = ['contact', 'shipping', 'payment'];

export function validate(key: FormKey, d: Data): Errors {
  const e: Errors = {};
  if (key === 'contact') {
    if (!d.contact.email.trim()) e.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact.email.trim())) e.email = 'Enter an email like name@example.com.';
  }
  if (key === 'shipping') {
    if (!d.shipping.street.trim()) e.street = 'Enter your street and house number.';
    if (!d.shipping.city.trim()) e.city = 'Enter your city.';
    if (!/^\d{5}$/.test(d.shipping.zip.trim())) e.zip = 'Enter a 5-digit ZIP code.';
  }
  if (key === 'payment') {
    if (!d.payment.method) e.method = 'Choose a payment method.';
  }
  return e;
}

export const METHOD_LABEL: Record<Payment['method'], string> = {
  '': '—',
  card: 'Visa ending 4242 (saved card)',
  paypal: 'PayPal',
  invoice: 'Pay on delivery',
};

const SUBTOTAL = 64.5;
export const total = (d: Data) => SUBTOTAL + (d.shipping.speed === 'express' ? 9.9 : 0);
export const money = (n: number) => `$${n.toFixed(2)}`;

/* ---------- fields ---------- */

function Field({ label, value, onChange, error, type = 'text', optional, autoComplete, inputMode }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  optional?: boolean;
  autoComplete?: string;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[12px] font-medium text-black/70">
        {label}
        {optional && <span className="font-normal text-black/45"> (optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`mt-1 h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-[14px] outline-none focus:ring-2 ${error ? 'border-[#c62828] focus:ring-[#c62828]/25' : 'border-black/20 focus:border-[#4338ca] focus:ring-[#4338ca]/20'}`}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 flex items-start gap-1 text-[12px] text-[#b42318]">
          <TriangleAlert size={13} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-[17px] font-bold">{children}</h3>
      {sub && <p className="text-[12px] text-black/55">{sub}</p>}
    </div>
  );
}

export function ContactForm({ d, set, errors }: { d: Data; set: (c: Partial<Contact>) => void; errors: Errors }) {
  return (
    <div>
      <Title sub="We'll send your receipt and delivery updates here.">Contact details</Title>
      <div className="space-y-3">
        <Field label="Email" type="email" inputMode="email" autoComplete="email" value={d.contact.email} onChange={(v) => set({ email: v })} error={errors.email} />
        <Field label="Phone" type="tel" inputMode="tel" autoComplete="tel" optional value={d.contact.phone} onChange={(v) => set({ phone: v })} />
      </div>
    </div>
  );
}

export function ShippingForm({ d, set, errors }: { d: Data; set: (c: Partial<Shipping>) => void; errors: Errors }) {
  const name = useId();
  const speeds: { v: Shipping['speed']; l: string; s: string }[] = [
    { v: 'standard', l: 'Standard', s: '3–5 days · Free' },
    { v: 'express', l: 'Express', s: 'Tomorrow · $9.90' },
  ];
  return (
    <div>
      <Title sub="Where should we deliver?">Shipping</Title>
      <div className="space-y-3">
        <Field label="Street and number" autoComplete="street-address" value={d.shipping.street} onChange={(v) => set({ street: v })} error={errors.street} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
          <Field label="City" autoComplete="address-level2" value={d.shipping.city} onChange={(v) => set({ city: v })} error={errors.city} />
          <Field label="ZIP code" inputMode="numeric" autoComplete="postal-code" value={d.shipping.zip} onChange={(v) => set({ zip: v })} error={errors.zip} />
        </div>
        <fieldset>
          <legend className="text-[12px] font-medium text-black/70">Delivery</legend>
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {speeds.map((s) => (
              <label key={s.v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${d.shipping.speed === s.v ? 'border-[#4338ca] bg-[#4338ca]/5' : 'border-black/15'}`}>
                <input type="radio" name={name} checked={d.shipping.speed === s.v} onChange={() => set({ speed: s.v })} className="accent-[#4338ca]" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{s.l}</span>
                  <span className="block text-[11px] text-black/55">{s.s}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export function PaymentForm({ d, set, errors }: { d: Data; set: (c: Partial<Payment>) => void; errors: Errors }) {
  const name = useId();
  const opts: { v: Payment['method']; icon: typeof CreditCard }[] = [
    { v: 'card', icon: CreditCard },
    { v: 'paypal', icon: Wallet },
    { v: 'invoice', icon: Banknote },
  ];
  return (
    <div>
      <Title sub="You won't be charged until you place the order.">Payment</Title>
      <fieldset aria-describedby={errors.method ? `${name}-err` : undefined}>
        <legend className="text-[12px] font-medium text-black/70">Payment method</legend>
        <div className="mt-1 space-y-2">
          {opts.map((o) => (
            <label key={o.v} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 ${d.payment.method === o.v ? 'border-[#4338ca] bg-[#4338ca]/5' : errors.method ? 'border-[#c62828]/60' : 'border-black/15'}`}>
              <input type="radio" name={name} checked={d.payment.method === o.v} onChange={() => set({ method: o.v })} className="accent-[#4338ca]" />
              <o.icon size={16} className="shrink-0 text-black/60" aria-hidden="true" />
              <span className="min-w-0 text-[13px] font-medium">{METHOD_LABEL[o.v]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.method && (
        <p id={`${name}-err`} className="mt-1.5 flex items-start gap-1 text-[12px] text-[#b42318]">
          <TriangleAlert size={13} className="mt-px shrink-0" aria-hidden="true" />
          {errors.method}
        </p>
      )}
      <label className="mt-3 flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={d.payment.billingSame} onChange={(e) => set({ billingSame: e.target.checked })} className="size-4 accent-[#4338ca]" />
        Billing address same as shipping
      </label>
    </div>
  );
}

export function ReviewPanel({ d, onEdit, missing = [] }: { d: Data; onEdit: (k: FormKey) => void; missing?: FormKey[] }) {
  const rows: { k: FormKey; title: string; lines: string[] }[] = [
    { k: 'contact', title: 'Contact', lines: [d.contact.email || '—', d.contact.phone].filter(Boolean) },
    {
      k: 'shipping',
      title: 'Shipping',
      lines: [d.shipping.street || '—', [d.shipping.zip, d.shipping.city].filter(Boolean).join(' ') || '—', d.shipping.speed === 'express' ? 'Express · $9.90' : 'Standard · Free'],
    },
    { k: 'payment', title: 'Payment', lines: [METHOD_LABEL[d.payment.method], d.payment.billingSame ? 'Billing = shipping address' : 'Separate billing address'] },
  ];
  return (
    <div>
      <Title sub="Check everything before you place the order.">Review your order</Title>
      <ul className="divide-y divide-black/10 rounded-lg border border-black/10">
        {rows.map((r) => (
          <li key={r.k} className="flex items-start justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-wide text-black/50 uppercase">{r.title}</p>
              {r.lines.map((l, i) => (
                <p key={i} className="text-[13px] break-words">
                  {l}
                </p>
              ))}
              {missing.includes(r.k) && (
                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#b42318]">
                  <TriangleAlert size={12} aria-hidden="true" /> This step isn't complete yet.
                </p>
              )}
            </div>
            <button type="button" onClick={() => onEdit(r.k)} aria-label={`Edit ${r.title.toLowerCase()}`} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#4338ca] hover:bg-[#4338ca]/10">
              <Pencil size={12} aria-hidden="true" /> Edit
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between text-[14px] font-bold">
        <span>Total (2 items)</span>
        <span>{money(total(d))}</span>
      </p>
    </div>
  );
}

/* ---------- step indicator ---------- */

export function StepIndicator({
  current,
  done,
  canSelect,
  onSelect,
  compact,
  errorStep,
}: {
  current: number;
  done: boolean[];
  canSelect: (i: number) => boolean;
  onSelect: (i: number) => void;
  compact?: boolean;
  errorStep?: number | null;
}) {
  if (compact) {
    const next = STEPS[current + 1];
    return (
      <div className="border-b border-black/10 px-4 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold">
            Step {current + 1} of {STEPS.length}: {STEPS[current].label}
          </p>
          {next && <p className="truncate text-[11px] text-black/50">Next: {next.label}</p>}
        </div>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.key} className={`h-1 flex-1 rounded-full ${i <= current ? 'bg-[#4338ca]' : 'bg-black/10'}`} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <nav aria-label="Checkout steps" className="border-b border-black/10 px-3 py-3">
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const isCur = i === current;
          const isDone = done[i] && !isCur;
          const isErr = errorStep === i;
          const sel = canSelect(i) && !isCur;
          const circle = (
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                isErr ? 'bg-[#c62828] text-white' : isCur ? 'bg-[#4338ca] text-white ring-4 ring-[#4338ca]/15' : isDone ? 'bg-[#4338ca]/15 text-[#4338ca]' : 'border-2 border-black/20 text-black/45'
              }`}
            >
              {isErr ? '!' : isDone ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
          );
          const text = (
            <span className={`mt-1 block max-w-full truncate text-center text-[11px] ${isCur ? 'font-bold text-black' : isDone ? 'font-medium text-black/75' : 'text-black/45'}`}>{s.label}</span>
          );
          const status = isCur ? '' : isErr ? ', has errors' : isDone ? ', completed' : ', not started';
          return (
            <li key={s.key} className="relative flex min-w-0 flex-1 flex-col items-center" aria-current={isCur ? 'step' : undefined}>
              {i > 0 && <span
                  className={`absolute top-[15px] h-0.5 ${done[i - 1] ? 'bg-[#4338ca]/50' : 'bg-black/10'}`}
                  style={{ right: 'calc(50% + 18px)', width: 'calc(100% - 36px)' }}
                  aria-hidden="true"
                />}
              {sel ? (
                <button type="button" onClick={() => onSelect(i)} className="relative z-10 flex min-w-0 flex-col items-center rounded-lg px-1 py-0.5 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#4338ca]">
                  {circle}
                  {text}
                  <span className="sr-only">{`Step ${i + 1}${status}`}</span>
                </button>
              ) : (
                <span className="relative z-10 flex min-w-0 flex-col items-center px-1 py-0.5">
                  {circle}
                  {text}
                  <span className="sr-only">{`Step ${i + 1}${isCur ? ', current' : status}`}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
