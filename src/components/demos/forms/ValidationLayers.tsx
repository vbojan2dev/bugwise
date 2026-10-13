import { ArrowDown, ArrowRight, Server, ShieldCheck, Smartphone, Terminal, Zap } from 'lucide-react';

/** Static diagram: client-side checks are a convenience, server-side checks are the real gate. */
export default function ValidationLayers() {
  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0 rounded-2xl border border-line bg-subtle p-4">
          <p className="flex items-center gap-2 font-semibold text-fg">
            <Smartphone size={18} className="text-brand" aria-hidden="true" /> In the app or browser
          </p>
          <p className="mt-0.5 text-xs font-semibold tracking-wide text-faint uppercase">Client-side validation</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li className="flex gap-2">
              <Zap size={15} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" /> Instant feedback while the user fills in the form
            </li>
            <li>Required fields, formats, lengths, "passwords match"</li>
            <li>Saves a trip to the server for obvious mistakes</li>
            <li className="font-medium text-fg">Can be skipped, changed or simply missing</li>
          </ul>
        </div>

        <div className="flex items-center justify-center text-faint" aria-hidden="true">
          <ArrowRight size={22} className="hidden md:block" />
          <ArrowDown size={22} className="md:hidden" />
        </div>

        <div className="min-w-0 rounded-2xl border-2 border-ok/50 bg-ok-soft/40 p-4">
          <p className="flex items-center gap-2 font-semibold text-fg">
            <Server size={18} className="text-ok" aria-hidden="true" /> On the server
          </p>
          <p className="mt-0.5 text-xs font-semibold tracking-wide text-faint uppercase">Server-side validation</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li className="flex gap-2">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> The same rules again, every time
            </li>
            <li>Things only the server knows: "email already registered", stock, prices, rate limits</li>
            <li>Rejects bad data with a clear error (often a 400 or 422)</li>
            <li className="font-medium text-fg">The only check you can trust</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-danger/40 bg-danger-soft/30 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Terminal size={16} className="text-danger" aria-hidden="true" /> Ways to reach the server without the app's checks
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2">
          <li>Calling the API directly with Postman or curl</li>
          <li>Editing the request in a proxy tool or DevTools</li>
          <li>An old app version with older (or no) rules</li>
          <li>A second client: website, iOS and Android each with their own checks</li>
        </ul>
      </div>
    </div>
  );
}
