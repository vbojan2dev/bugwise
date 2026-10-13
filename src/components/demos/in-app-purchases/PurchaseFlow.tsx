import { BadgeCheck, CreditCard, Lock, Server, ShoppingBag, Smartphone, Unlock, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* Static diagram: who does what during an in-app purchase. */

type Actor = 'app' | 'store' | 'server';

const ACTOR: Record<Actor, { label: string; cls: string }> = {
  app: { label: 'Your app', cls: 'bg-brand-soft text-brand' },
  store: { label: 'App Store / Google Play', cls: 'bg-warn-soft text-warn' },
  server: { label: 'Your server', cls: 'bg-ok-soft text-ok' },
};

const STEPS: { actor: Actor; icon: LucideIcon; title: string; text: string }[] = [
  { actor: 'app', icon: Lock, title: 'Paywall', text: 'Loads the products and their prices from the store, then the user taps Subscribe.' },
  { actor: 'store', icon: ShoppingBag, title: 'Store purchase sheet', text: 'The system sheet shows the price, trial and payment method. The app cannot change or see it.' },
  { actor: 'store', icon: CreditCard, title: 'Store charges the user', text: 'Card, carrier billing or gift card balance, plus any bank check (3-D Secure). The app never sees card details.' },
  { actor: 'app', icon: Smartphone, title: 'App receives the transaction', text: 'Success, canceled, pending (Ask to Buy, slow payment) or failed. Each needs its own screen.' },
  { actor: 'server', icon: Server, title: 'Server verifies it', text: 'Checks the signed transaction or purchase token with the store and saves an entitlement for the account.' },
  { actor: 'app', icon: Unlock, title: 'Premium unlocks', text: 'Immediately, without a restart. Then the app finishes (iOS) or acknowledges (Android) the purchase.' },
  { actor: 'store', icon: Bell, title: 'Later: store notifications', text: 'Renewals, billing problems, cancellations and refunds arrive as server notifications and update the entitlement.' },
];

export default function PurchaseFlow() {
  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(ACTOR) as Actor[]).map((a) => (
          <span key={a} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACTOR[a].cls}`}>
            {ACTOR[a].label}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className={`flex min-w-0 gap-3 rounded-xl border border-line bg-bg p-3 ${i === STEPS.length - 1 ? 'border-dashed sm:col-span-2' : ''}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${ACTOR[s.actor].cls}`}>
              <s.icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-fg">
                {i < STEPS.length - 1 ? `${i + 1}. ` : ''}
                {s.title}
              </span>
              <span className="block text-xs leading-relaxed text-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
        <BadgeCheck size={14} className="mt-px shrink-0 text-ok" /> The entitlement on your server, not a flag on the phone, is the single source of truth for "is this user Premium?"
      </p>
    </div>
  );
}
