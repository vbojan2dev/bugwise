import { ArrowLeft, ArrowRight, Database, KeyRound, Server, Smartphone } from 'lucide-react';

/*
 * Static sequence diagram: how a login works, from typing a password to using the session token.
 * Three columns (app, server, database); each step is an arrow spanning two columns, or a note in one column.
 */

type Step = { n: number; from: 0 | 1 | 2; to: 0 | 1 | 2; label: string; code?: string };

const steps: Step[] = [
  { n: 1, from: 0, to: 1, label: 'Sends email + password over HTTPS', code: 'POST /login' },
  { n: 2, from: 1, to: 2, label: 'Finds the user and compares password hashes' },
  { n: 3, from: 2, to: 1, label: 'Match found' },
  { n: 4, from: 1, to: 0, label: 'Creates a session and returns a token', code: 'token: 8f2a…' },
  { n: 5, from: 0, to: 0, label: 'Stores the token safely (Keychain, Keystore or a cookie)' },
  { n: 6, from: 0, to: 1, label: 'Every next request carries the token', code: 'GET /orders' },
  { n: 7, from: 1, to: 0, label: 'Checks the token and answers', code: "200 · Anna's orders" },
];

const actors = [
  { icon: Smartphone, name: 'App', sub: 'phone or browser' },
  { icon: Server, name: 'Server', sub: 'checks who you are' },
  { icon: Database, name: 'Database', sub: 'users + hashes' },
];

export default function AuthFlow() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {actors.map((a) => (
          <div key={a.name} className="flex flex-col items-center rounded-2xl bg-subtle px-1 py-3 text-center">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <a.icon size={18} />
            </span>
            <span className="mt-1.5 text-sm font-semibold text-fg">{a.name}</span>
            <span className="hidden text-[11px] text-faint sm:block">{a.sub}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-3">
        {/* lifelines */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <span key={i} className="mx-auto h-full w-px border-l border-dashed border-line-strong" />
          ))}
        </div>
      <ol className="relative space-y-2">
        {steps.map((s) => {
          const lo = Math.min(s.from, s.to);
          const hi = Math.max(s.from, s.to);
          const self = s.from === s.to;
          const right = s.to > s.from;
          const colStart = ['col-start-1', 'col-start-2', 'col-start-3'][lo];
          const span = self ? 'col-span-1' : hi - lo === 1 ? 'col-span-2' : 'col-span-3';
          return (
            <li key={s.n} className="relative grid grid-cols-3 gap-2 sm:gap-4">
              <div className={`${colStart} ${span} ${self ? '' : 'px-[16%]'}`}>
                <div className={`rounded-xl border px-2.5 py-2 text-center ${self ? 'border-brand/30 bg-brand-soft' : 'border-line bg-surface'}`}>
                  <p className="text-[12px] leading-snug text-fg sm:text-[13px]">
                    <span className="mr-1 inline-grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-fg align-[1px]">{s.n}</span>
                    {s.label}
                  </p>
                  {s.code && <code className="mt-1 inline-block rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-muted">{s.code}</code>}
                  {!self && (
                    <div className={`mt-1.5 flex items-center text-brand ${right ? '' : 'flex-row-reverse'}`}>
                      <span className="h-px flex-1 bg-current" />
                      {right ? <ArrowRight size={14} className="-ml-1" /> : <ArrowLeft size={14} className="-mr-1" />}
                    </div>
                  )}
                  {self && <KeyRound size={14} className="mx-auto mt-1 text-brand" />}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">
        The password is checked once. After that, the <strong className="text-fg">token</strong> proves who you are until you log out or it expires.
      </figcaption>
    </figure>
  );
}
