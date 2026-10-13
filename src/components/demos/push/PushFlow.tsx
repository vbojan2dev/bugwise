import { ArrowDown, BellRing, Cloud, Server, Smartphone } from 'lucide-react';

/*
 * Static diagram: the journey of a push notification, from registering the device to the banner on screen.
 * Four "actors" laid out as a vertical pipeline (stacks nicely on phones).
 */

const steps = [
  {
    icon: Smartphone,
    who: 'Your app',
    what: 'Asks the user for permission, then asks the operating system for a device token.',
    code: 'token: a1f3…9c',
  },
  {
    icon: Cloud,
    who: 'APNs (Apple) / FCM (Google)',
    what: 'Issues the token. It is the "postal address" of this app on this device.',
  },
  {
    icon: Server,
    who: 'Your company’s server',
    what: 'Stores the token next to the user account. When the order changes, it sends a message to APNs or FCM.',
    code: '{ to: a1f3…9c, title: "On the way" }',
  },
  {
    icon: Cloud,
    who: 'APNs / FCM',
    what: 'Delivers the message to the device (now, or later if the phone is offline).',
  },
  {
    icon: BellRing,
    who: 'The device',
    what: 'The operating system shows the banner, sound and badge. The app decides what happens on tap.',
  },
];

export default function PushFlow() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={i} className="min-w-0">
            <div className="flex items-start gap-3 rounded-2xl bg-subtle p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">
                  <span className="mr-1.5 inline-grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-fg align-[1px]">{i + 1}</span>
                  {s.who}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{s.what}</p>
                {s.code && <code className="mt-1.5 inline-block max-w-full rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] break-all text-muted ring-1 ring-line">{s.code}</code>}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5 text-brand" aria-hidden="true">
                <ArrowDown size={16} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-center text-xs text-muted">
        Your server never contacts the phone directly. It hands the message to <strong className="text-fg">Apple or Google</strong>, and they deliver it.
      </figcaption>
    </figure>
  );
}
