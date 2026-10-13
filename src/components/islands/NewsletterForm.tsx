import { useState, type FormEvent } from 'react';
import { MailCheck } from 'lucide-react';

/**
 * Email signup that posts to a Kit form. Kit sends a confirmation email (double opt-in),
 * so "done" means "check your inbox", not "subscribed".
 * Without JavaScript, or if the request fails, the plain form posts to Kit in a new tab.
 */
export default function NewsletterForm({ formId, compact = false, button = 'Subscribe' }: { formId: string; compact?: boolean; button?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const action = `https://app.kit.com/forms/${formId}/subscriptions`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setState('sending');
    try {
      const res = await fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">
        <MailCheck size={18} className="mt-0.5 shrink-0" />
        <span>Almost there: check your inbox and click the link to confirm.</span>
      </p>
    );
  }

  return (
    <form action={action} method="post" target="_blank" onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`nl-${formId}-${compact ? 'c' : 'f'}`}>
          Email address
        </label>
        <input
          id={`nl-${formId}-${compact ? 'c' : 'f'}`}
          type="email"
          name="email_address"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button type="submit" disabled={state === 'sending'} className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {state === 'sending' ? 'Sending…' : button}
        </button>
      </div>
      {state === 'error' && (
        <p role="alert" className="text-xs text-danger">
          That didn't go through. Check the address and try again.
        </p>
      )}
      <p className="text-xs text-faint">No spam. Unsubscribe with one click. Your email is stored by Kit, our newsletter service.</p>
    </form>
  );
}
