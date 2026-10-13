import { ArrowDown, CheckCircle2, Clock, KeyRound, LogOut, Mail, MessageSquareText, Repeat, Smartphone } from 'lucide-react';

/*
 * Static diagram: the password reset flow (left) and the life of a reset token (right).
 */

const flow = [
  { icon: Smartphone, who: 'App', text: 'User taps "Forgot password?" and enters an email' },
  { icon: MessageSquareText, who: 'App', text: 'Same confirmation for every email: "If an account exists, we sent a link"' },
  { icon: Mail, who: 'Email', text: 'Link with a long random token, valid once and for a short time' },
  { icon: KeyRound, who: 'App', text: 'Link opens the reset screen, user sets a new password (same rules as sign up)' },
  { icon: LogOut, who: 'Server', text: 'Password saved, token burned, other sessions signed out, "password changed" email sent' },
];

const endings = [
  { icon: CheckCircle2, label: 'Used', text: 'Password was changed with it' },
  { icon: Clock, label: 'Expired', text: 'Older than the limit (e.g. 30 min)' },
  { icon: Repeat, label: 'Replaced', text: 'A newer link was requested (if the spec says so)' },
];

export default function ResetFlow() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ol className="min-w-0 space-y-1">
          {flow.map((s, i) => (
            <li key={i}>
              <div className="flex items-start gap-3 rounded-2xl bg-subtle p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <s.icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">
                    {i + 1} · {s.who}
                  </p>
                  <p className="text-sm leading-snug text-fg">{s.text}</p>
                </div>
              </div>
              {i < flow.length - 1 && <ArrowDown size={14} className="mx-auto my-0.5 text-faint" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div className="min-w-0 rounded-2xl border border-line p-3">
          <p className="text-sm font-semibold text-fg">Life of a reset token</p>
          <div className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm">
            <span className="font-semibold text-ok">Valid</span>
            <span className="text-muted"> · just issued, unused, not expired</span>
          </div>
          <p className="my-2 text-center text-xs text-faint">becomes invalid forever when it is…</p>
          <ul className="space-y-2">
            {endings.map((e) => (
              <li key={e.label} className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-3 py-2 text-sm">
                <e.icon size={16} className="mt-0.5 shrink-0 text-danger" />
                <span className="min-w-0">
                  <span className="font-semibold text-danger">{e.label}</span>
                  <span className="text-muted"> · {e.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">
        A reset link is a temporary key to the account. Most reset bugs are a key that keeps working when it shouldn't.
      </figcaption>
    </figure>
  );
}
