import { ArrowRight, ArrowDown, Laptop, Server, Smartphone, ShieldCheck } from 'lucide-react';

/** Static diagram: phone -> proxy on the tester's computer -> server, and what the proxy can do in between. */

function Node({ icon: Icon, title, sub }: { icon: typeof Laptop; title: string; sub: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface p-3 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon size={20} aria-hidden />
      </span>
      <p className="mt-2 text-sm font-semibold text-fg">{title}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

function Arrow() {
  return (
    <span className="grid shrink-0 place-items-center text-faint" aria-hidden>
      <ArrowRight size={18} className="hidden sm:block" />
      <ArrowDown size={18} className="sm:hidden" />
    </span>
  );
}

export default function ProxyFlow() {
  return (
    <div className="not-prose my-6 rounded-3xl border border-line bg-subtle p-4 sm:p-5">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Node icon={Smartphone} title="Phone" sub="Wi-Fi proxy points to your computer" />
        <Arrow />
        <div className="min-w-0 flex-[1.4] rounded-2xl border-2 border-dashed border-brand bg-surface p-3 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-xl bg-brand text-brand-fg">
            <Laptop size={20} aria-hidden />
          </span>
          <p className="mt-2 text-sm font-semibold text-fg">Proxy on your computer</p>
          <p className="text-xs text-muted">Charles, Proxyman, Fiddler, mitmproxy</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {['Record', 'Inspect', 'Breakpoint', 'Map Local', 'Throttle', 'Repeat'].map((t) => (
              <span key={t} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                {t}
              </span>
            ))}
          </div>
        </div>
        <Arrow />
        <Node icon={Server} title="Server" sub="api.shop.example" />
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
        For HTTPS traffic, the phone must trust the proxy’s root certificate. The proxy decrypts the traffic, shows it to you, and encrypts it again before passing it on.
      </p>
    </div>
  );
}
