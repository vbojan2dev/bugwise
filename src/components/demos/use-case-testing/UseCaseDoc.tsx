/**
 * A use case laid out the way many teams write it (in the style popularized by Alistair Cockburn):
 * actors, preconditions, trigger, main success scenario, extensions and postconditions.
 * Purely visual, no client directive needed.
 */

export type Extension = { id: string; kind: 'alternative' | 'exception'; when: string; steps: string[] };
export type UseCase = {
  title: string;
  app: string;
  primaryActor: string;
  otherActors?: string;
  preconditions: string[];
  trigger: string;
  main: string[];
  extensions: Extension[];
  successGuarantee: string[];
  minimalGuarantee: string[];
};

export const RESET_PASSWORD: UseCase = {
  title: 'UC-07 Reset a forgotten password',
  app: 'Banking app',
  primaryActor: 'Customer who can’t log in',
  otherActors: 'Email service',
  preconditions: ['The customer has an account with a verified email address.', 'The customer is logged out.'],
  trigger: 'The customer taps “Forgot password?” on the login screen.',
  main: [
    'The customer enters their email address and taps Send link.',
    'The system shows “If an account exists, we’ve sent a link” and emails a reset link valid for 30 minutes.',
    'The customer opens the link on the same phone.',
    'The system shows the New password screen.',
    'The customer enters a new password that meets the rules and taps Save.',
    'The system saves the password, logs out all other devices and shows “Password changed”.',
  ],
  extensions: [
    { id: '1a', kind: 'alternative', when: 'The email address has a typo in its format', steps: ['The system shows “Enter a valid email address”; the customer corrects it and continues at step 1.'] },
    { id: '3a', kind: 'alternative', when: 'The customer opens the link on a computer', steps: ['The website shows the New password screen; the flow continues at step 5.'] },
    { id: '3b', kind: 'exception', when: 'The link is older than 30 minutes', steps: ['The system shows “This link has expired” with a button to send a new one. The use case ends.'] },
    { id: '3c', kind: 'exception', when: 'The link was already used', steps: ['The system shows “This link has already been used”. The use case ends.'] },
    { id: '5a', kind: 'alternative', when: 'The new password breaks a rule', steps: ['The system explains which rule; the customer corrects it and continues at step 5.'] },
  ],
  successGuarantee: ['Only the new password works.', 'Other devices are logged out.', 'The reset link can’t be used again.'],
  minimalGuarantee: ['The old password still works.'],
};

export const REORDER: UseCase = {
  title: 'UC-12 Reorder a previous order',
  app: 'FoodDash',
  primaryActor: 'Logged-in customer',
  otherActors: 'Restaurant system, payment provider',
  preconditions: ['The customer is logged in.', 'The customer has at least one completed order.'],
  trigger: 'The customer taps Reorder on a past order.',
  main: [
    'The customer opens Orders and taps Reorder on a past order.',
    'The system checks that the restaurant is open and every dish is available.',
    'The system adds the dishes to the cart at today’s prices and opens the cart.',
    'The customer checks the address and payment method and taps Place order.',
    'The system charges the payment method and shows the order confirmation.',
  ],
  extensions: [
    { id: '1a', kind: 'alternative', when: 'The cart already has items from another restaurant', steps: ['The system asks whether to replace them. Replace: continue at step 2. Cancel: the use case ends with the cart unchanged.'] },
    { id: '2a', kind: 'alternative', when: 'Some dishes are sold out', steps: ['The system adds the available dishes and lists the missing ones; continue at step 3.'] },
    { id: '2b', kind: 'exception', when: 'Every dish is sold out', steps: ['The system says nothing can be reordered. The cart stays as it was. The use case ends.'] },
    { id: '2c', kind: 'exception', when: 'The restaurant is closed', steps: ['The system shows when it opens. Nothing is added to the cart. The use case ends.'] },
    { id: '3a', kind: 'alternative', when: 'Prices changed since the original order', steps: ['The cart shows a “Prices updated” notice next to the changed dishes; continue at step 4.'] },
    { id: '5a', kind: 'exception', when: 'The payment is declined', steps: ['The system keeps the cart and asks for another payment method; the customer may continue at step 4.'] },
  ],
  successGuarantee: ['A new order exists at today’s prices.', 'The customer is charged once.', 'The original order is unchanged in the history.'],
  minimalGuarantee: ['No order is created and nothing is charged if the use case ends early.'],
};

const kindStyle = {
  alternative: 'border-info bg-info-soft',
  exception: 'border-danger bg-danger-soft',
};

export default function UseCaseDoc({ uc = RESET_PASSWORD }: { uc?: UseCase }) {
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-2xl border border-line bg-surface text-sm text-fg">
      <div className="border-b border-line bg-subtle px-4 py-3">
        <p className="text-xs font-semibold text-faint">{uc.app}</p>
        <p className="font-semibold">{uc.title}</p>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="font-semibold text-muted">Primary actor</dt>
        <dd className="min-w-0">{uc.primaryActor}</dd>
        {uc.otherActors && (
          <>
            <dt className="font-semibold text-muted">Other actors</dt>
            <dd className="min-w-0">{uc.otherActors}</dd>
          </>
        )}
        <dt className="font-semibold text-muted">Preconditions</dt>
        <dd className="min-w-0">
          <ul className="list-disc space-y-0.5 pl-5">
            {uc.preconditions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </dd>
        <dt className="font-semibold text-muted">Trigger</dt>
        <dd className="min-w-0">{uc.trigger}</dd>
      </dl>
      <div className="border-t border-line px-4 py-3">
        <p className="mb-2 font-semibold">
          Main success scenario <span className="font-normal text-muted">(the happy path)</span>
        </p>
        <ol className="space-y-1.5">
          {uc.main.map((s, i) => (
            <li key={s} className="flex gap-2">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-xs font-bold text-fg">{i + 1}</span>
              <span className="min-w-0 pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="border-t border-line px-4 py-3">
        <p className="mb-2 font-semibold">
          Extensions <span className="font-normal text-muted">(alternative and exception flows, numbered by the step where they branch off)</span>
        </p>
        <ul className="space-y-2">
          {uc.extensions.map((e) => (
            <li key={e.id} className={`rounded-lg border-l-4 px-3 py-2 ${kindStyle[e.kind]}`}>
              <p>
                <strong>{e.id}.</strong> {e.when}{' '}
                <span className="ml-1 rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">{e.kind === 'alternative' ? 'Alternative' : 'Exception'}</span>
              </p>
              {e.steps.map((s) => (
                <p key={s} className="mt-0.5 text-muted">
                  {s}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="font-semibold text-muted">Postconditions on success</dt>
        <dd className="min-w-0">
          <ul className="list-disc space-y-0.5 pl-5">
            {uc.successGuarantee.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </dd>
        <dt className="font-semibold text-muted">If it fails</dt>
        <dd className="min-w-0">
          <ul className="list-disc space-y-0.5 pl-5">
            {uc.minimalGuarantee.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </figure>
  );
}
