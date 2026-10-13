import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, MapPin, Play, RotateCcw, Users, XCircle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/**
 * Side-by-side story: a grocery checkout passes every spec check (verification)
 * but fails with real users (validation). Version 1.1 fixes the spec and the screen.
 */

type Version = '1.0' | '1.1';

const specs: Record<Version, string[]> = {
  '1.0': [
    'Checkout lists the user\'s saved addresses. The first saved address is preselected.',
    'The order summary shows items, delivery fee and total.',
    'Total = items + delivery fee, rounded to 2 decimals.',
    '"Place order" submits the order and shows a confirmation.',
  ],
  '1.1': [
    'The last used address is preselected and shown at the top of checkout with a "Change" link.',
    'The order summary shows items, delivery fee and total.',
    'Total = items + delivery fee, rounded to 2 decimals.',
    '"Place order" submits the order and shows a confirmation.',
  ],
};

interface Session {
  name: string;
  ok: boolean;
  note: string;
}

const sessions: Record<Version, Session[]> = {
  '1.0': [
    { name: 'Mia', ok: false, note: 'Ordered on Saturday morning. Groceries went to her office, which was closed. "I never saw where it was going."' },
    { name: 'Jon', ok: true, note: 'Ordered from work, so the office address was what he wanted. No problem.' },
    { name: 'Priya', ok: false, note: 'Spotted "Office" after paying, canceled and reordered. Called support to check she was not charged twice.' },
    { name: 'Leo', ok: true, note: 'Only has one saved address. Smooth checkout.' },
    { name: 'Sam', ok: false, note: 'Saved his parents\' address first, months ago. Weekly order went to the wrong city.' },
  ],
  '1.1': [
    { name: 'Mia', ok: true, note: 'Saw "Deliver to Home" at the top and placed the order.' },
    { name: 'Jon', ok: true, note: 'Tapped "Change", picked Office, done in two taps.' },
    { name: 'Priya', ok: true, note: 'Home was preselected because she used it last time.' },
    { name: 'Leo', ok: true, note: 'One address, nothing changed for him.' },
    { name: 'Sam', ok: true, note: 'His last order went home, so home was preselected.' },
  ],
};

const items = [
  { name: 'Bananas, 1 kg', price: 2.49 },
  { name: 'Oat milk, 1 L', price: 1.99 },
  { name: 'Sourdough bread', price: 3.8 },
];
const fee = 2.99;
const total = items.reduce((s, i) => s + i.price, 0) + fee;

function Checkout({ version }: { version: Version }) {
  return (
    <div className="flex h-full flex-col bg-[#f2f2f7] text-[#000]" role="img" aria-label={version === '1.0' ? 'Checkout screen, version 1.0: the delivery address "Office, 12 Harbor St" is shown in small grey text above the order summary.' : 'Checkout screen, version 1.1: a large "Deliver to Home, 4 Elm Rd" card with a Change link at the top.'}>
      <p className="px-4 pt-2 pb-2 text-[22px] font-bold">Checkout</p>
      {version === '1.0' ? (
        <p className="px-4 pb-3 text-[11px] text-[#8e8e93]">Delivering to: Office · 12 Harbor St</p>
      ) : (
        <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl bg-white p-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f8ee] text-[#248a3d]">
            <MapPin size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-[#6b6b70]">Deliver to</span>
            <span className="block truncate text-[13px] font-semibold">Home · 4 Elm Rd</span>
          </span>
          <span className="text-[13px] font-semibold text-[#007aff]">Change</span>
        </div>
      )}
      <div className="mx-3 rounded-xl bg-white">
        {items.map((i) => (
          <div key={i.name} className="flex justify-between border-b border-[#e5e5ea] px-3 py-2.5 text-[13px]">
            <span>{i.name}</span>
            <span>€{i.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between border-b border-[#e5e5ea] px-3 py-2.5 text-[13px] text-[#6b6b70]">
          <span>Delivery</span>
          <span>€{fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between px-3 py-2.5 text-[14px] font-semibold">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-auto px-3 pb-7">
        <div className="rounded-xl bg-[#248a3d] py-3 text-center text-[15px] font-semibold text-white">Place order</div>
      </div>
    </div>
  );
}

export default function SpecVsUsers() {
  const [version, setVersion] = useState<Version>('1.0');
  const [checked, setChecked] = useState(0);
  const [watched, setWatched] = useState(0);
  const timers = useRef<Record<'spec' | 'users', number[]>>({ spec: [], users: [] });

  const clear = (key?: 'spec' | 'users') => {
    for (const k of key ? [key] : (['spec', 'users'] as const)) {
      timers.current[k].forEach((t) => window.clearTimeout(t));
      timers.current[k] = [];
    }
  };
  useEffect(() => () => clear(), []);

  const switchVersion = (v: Version) => {
    clear();
    setVersion(v);
    setChecked(0);
    setWatched(0);
  };

  const run = (key: 'spec' | 'users', count: number, set: (n: number) => void, step: number) => {
    clear(key);
    set(0);
    for (let n = 1; n <= count; n++) timers.current[key].push(window.setTimeout(() => set(n), n * step));
  };

  const spec = specs[version];
  const users = sessions[version];
  const verifyDone = checked === spec.length;
  const validateDone = watched === users.length;
  const happy = users.filter((u) => u.ok).length;

  const runBtn = 'inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Built right, but the right thing?</p>
          <p className="text-sm text-muted">A grocery app checkout. Run the spec checks, then watch five real customers use it.</p>
        </div>
        <div className="flex rounded-lg bg-subtle p-1 text-xs font-semibold" role="group" aria-label="App version">
          {(['1.0', '1.1'] as Version[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={version === v}
              onClick={() => switchVersion(v)}
              className={`rounded-md px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${version === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
            >
              Version {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex justify-center border-b border-line bg-subtle p-5 lg:border-r lg:border-b-0" style={{ colorScheme: 'light' }}>
          <PhoneFrame width={240}>
            <Checkout version={version} />
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <section className="rounded-2xl border border-line p-4" aria-label="Verification">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-bold text-fg">
                <ClipboardCheck size={16} className="text-info" aria-hidden="true" /> Verification: does it match the spec?
              </p>
              <button type="button" className={runBtn} onClick={() => run('spec', spec.length, setChecked, 450)}>
                {checked ? <RotateCcw size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {checked ? 'Run again' : 'Run spec checks'}
              </button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {spec.map((s, i) => (
                <li key={s} className="flex gap-2 text-sm">
                  {i < checked ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                  ) : (
                    <span className="mt-1 size-3.5 shrink-0 rounded-full border border-line-strong" aria-hidden="true" />
                  )}
                  <span className={i < checked ? 'text-fg' : 'text-muted'}>
                    <span className="sr-only">{i < checked ? 'Passed: ' : 'Not run: '}</span>
                    {s}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold" aria-live="polite">
              {verifyDone ? <span className="text-ok">All {spec.length} spec checks pass. Verification: passed.</span> : <span className="text-faint">Not run yet.</span>}
            </p>
          </section>

          <section className="rounded-2xl border border-line p-4" aria-label="Validation">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-bold text-fg">
                <Users size={16} className="text-ok" aria-hidden="true" /> Validation: does it work for real people?
              </p>
              <button type="button" className={runBtn} onClick={() => run('users', users.length, setWatched, 650)}>
                {watched ? <RotateCcw size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {watched ? 'Watch again' : 'Watch 5 customers'}
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {users.slice(0, watched).map((u) => (
                <li key={u.name} className={`flex gap-2.5 rounded-xl p-2.5 text-sm ${u.ok ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold text-fg">{u.name[0]}</span>
                  <span className="min-w-0 text-fg">
                    <strong>{u.name}</strong>
                    {u.ok ? <CheckCircle2 size={14} className="ml-1 inline align-[-2px] text-ok" aria-hidden="true" /> : <XCircle size={14} className="ml-1 inline align-[-2px] text-danger" aria-hidden="true" />}
                    <span className="sr-only">{u.ok ? ' succeeded. ' : ' had a problem. '}</span> {u.note}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold" aria-live="polite">
              {validateDone ? (
                happy === users.length ? (
                  <span className="text-ok">5 of 5 customers got their groceries where they wanted. Validation: passed.</span>
                ) : (
                  <span className="text-danger">
                    {users.length - happy} of {users.length} customers sent their order to the wrong address. Validation: failed.
                  </span>
                )
              ) : watched ? (
                <span className="text-faint">Watching…</span>
              ) : (
                <span className="text-faint">Not run yet.</span>
              )}
            </p>
          </section>

          {verifyDone && validateDone && (
            <div className="rounded-2xl bg-brand-soft p-4 text-sm text-fg">
              {version === '1.0' ? (
                <>
                  <strong>What happened?</strong> The team built exactly what the spec said, and every check passed. But the spec itself was wrong: "first saved address" is
                  rarely where people want their groceries, and the address was easy to miss. Switch to <strong>Version 1.1</strong> to see the fix.
                </>
              ) : (
                <>
                  <strong>Fixed.</strong> The spec now describes what users need (last used address, shown clearly), so passing verification and passing validation finally
                  mean the same thing. A tester asking "which address will be preselected, and will people notice it?" during the story review could have caught this before
                  any code was written.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
