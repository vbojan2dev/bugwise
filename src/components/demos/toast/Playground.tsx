import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Heart, Volume2 } from 'lucide-react';
import { TimeBar, useCountdown, WebToast } from './Toasts';

/*
 * Toast timing lab: tweak duration, action, position, stacking, pause-on-hover and live-region
 * settings, then trigger toasts on a small fake shop page. Everything stays inside the demo frame.
 */

type Position = 'top-right' | 'top-center' | 'bottom-center';
type Stacking = 'replace' | 'max3' | 'unlimited';
interface T {
  id: number;
  n: number;
}

function Timed({ ms, paused, onEnd, children }: { ms: number; paused: boolean; onEnd: () => void; children: (left: number, hold: (v: boolean) => void) => ReactNode }) {
  const [hold, setHold] = useState(false);
  const left = useCountdown(ms, paused && hold, onEnd);
  return <>{children(left, setHold)}</>;
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

function Seg<V extends string>({ value, options, onChange }: { value: V; options: [V, string][]; onChange: (v: V) => void }) {
  return (
    <div className="grid gap-1 rounded-lg bg-subtle p-1 text-xs font-medium" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`rounded-md px-1 py-1.5 ${value === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Playground() {
  const [seconds, setSeconds] = useState(6);
  const [action, setAction] = useState(true);
  const [position, setPosition] = useState<Position>('top-right');
  const [stacking, setStacking] = useState<Stacking>('max3');
  const [pause, setPause] = useState(true);
  const [live, setLive] = useState(true);
  const [toasts, setToasts] = useState<T[]>([]);
  const [wishlist, setWishlist] = useState(0);
  const [said, setSaid] = useState<{ id: number; text: string }[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const ms = seconds * 1000;

  const add = () => {
    const id = nextId.current++;
    setWishlist((w) => w + 1);
    setToasts((t) => {
      const next = [{ id, n: id }, ...t];
      if (stacking === 'replace') return next.slice(0, 1);
      if (stacking === 'max3') return next.slice(0, 3);
      return next;
    });
    setSaid((s) => [{ id, text: live ? `"Added to wishlist${action ? '. Undo, button' : ''}"` : '(silence: nothing announced)' }, ...s].slice(0, 4));
  };
  const burst = () => {
    for (let i = 0; i < 5; i++) timers.current.push(window.setTimeout(add, i * 150));
  };
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const undo = (id: number) => {
    setWishlist((w) => Math.max(0, w - 1));
    remove(id);
  };

  const issues: string[] = [];
  if (seconds < 4) issues.push(`${seconds} s is too short. Many people can't read a sentence, let alone reach a button, that fast. Aim for 4–10 s.`);
  if (action && seconds < 6) issues.push('There is an Undo action but little time to reach it. Give it longer (or keep it until dismissed), especially for screen reader and switch users.');
  if (stacking === 'unlimited') issues.push('Unlimited stacking: tap "Add 5 quickly" and watch the toasts pile up over the page.');
  if (!pause) issues.push('The timer keeps running while the pointer or keyboard focus is on the toast, so it can vanish right under the cursor. WCAG 2.2.1 asks that time limits can be paused or extended.');
  if (!live) issues.push('No live region: screen readers stay silent and blind users never learn that anything happened.');
  if (position === 'bottom-center') issues.push('Bottom center is fine on desktop, but on mobile check it doesn\'t cover the bottom navigation, a cookie banner or the "Checkout" button.');

  const pos = { 'top-right': 'top-12 right-3 w-[min(16rem,calc(100%-1.5rem))]', 'top-center': 'top-12 left-1/2 w-[min(16rem,calc(100%-1.5rem))] -translate-x-1/2', 'bottom-center': 'bottom-3 left-1/2 w-[min(16rem,calc(100%-1.5rem))] -translate-x-1/2' }[position];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Toast timing lab</p>
        <p className="text-sm text-muted">Change the settings, then add items to the wishlist. Try to press Undo in time, hover a toast, and spam the button.</p>
      </div>
      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label={`Duration: ${seconds} s`}>
            <input type="range" min={1} max={10} value={seconds} onChange={(e) => setSeconds(+e.target.value)} className="w-full accent-[var(--brand)]" aria-label="Duration in seconds" />
          </Control>
          <Control label="Position">
            <Seg value={position} onChange={setPosition} options={[['top-right', 'Top right'], ['top-center', 'Top'], ['bottom-center', 'Bottom']]} />
          </Control>
          <Control label="Stacking">
            <Seg value={stacking} onChange={setStacking} options={[['replace', 'Replace'], ['max3', 'Max 3'], ['unlimited', 'Unlimited']]} />
          </Control>
          {(
            [
              ['Undo action', action, setAction],
              ['Pause on hover / focus', pause, setPause],
              ['Announce (live region)', live, setLive],
            ] as const
          ).map(([l, v, set]) => (
            <label key={l} className="flex items-center justify-between text-sm font-medium">
              {l}
              <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            </label>
          ))}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="bg-[#e9ebf2] p-4 sm:p-6">
            <div className="relative h-[340px] overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#eceef3] px-4 py-3">
                <span className="text-[15px] font-bold">Peak Outdoor</span>
                <span className="flex items-center gap-1 text-[13px] text-[#4a4f60]">
                  <Heart size={14} /> Wishlist ({wishlist})
                </span>
              </div>
              <div className="flex gap-3 p-4">
                <div className="size-24 shrink-0 rounded-xl bg-gradient-to-br from-[#ffd8c2] to-[#ffb38a]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">Trail running shoes</p>
                  <p className="text-[13px] text-[#6b7080]">€119.00</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={add} className="flex items-center gap-1.5 rounded-lg bg-[#0e1120] px-3 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]">
                      <Heart size={14} /> Add to wishlist
                    </button>
                    <button type="button" onClick={burst} className="rounded-lg border border-[#d0d4de] px-3 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]">
                      Add 5 quickly
                    </button>
                  </div>
                </div>
              </div>
              <div className={`absolute ${pos} space-y-2`} role={live ? 'status' : undefined} aria-live={live ? 'polite' : undefined}>
                {toasts.map((t) => (
                  <Timed key={t.id} ms={ms} paused={pause} onEnd={() => remove(t.id)}>
                    {(left, hold) => (
                      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)} className="transition duration-200 starting:translate-y-2 starting:opacity-0">
                        <WebToast title="Added to wishlist" text="Trail running shoes" action={action ? 'Undo' : undefined} onAction={() => undo(t.id)} onClose={() => remove(t.id)}>
                          <TimeBar left={left} total={ms} color="#079455" />
                        </WebToast>
                      </div>
                    )}
                  </Timed>
                ))}
              </div>
            </div>
          </div>

          <div className="grid border-t border-line xl:grid-cols-2">
            <div className="space-y-2 border-b border-line p-5 xl:border-r xl:border-b-0">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Problems with these settings</p>
              {issues.length ? (
                issues.map((t) => (
                  <p key={t} className="flex items-start gap-2 text-sm text-fg">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> {t}
                  </p>
                ))
              ) : (
                <p className="flex items-start gap-2 text-sm text-fg">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> Sensible settings. Now set the duration to 2 s and try to press Undo.
                </p>
              )}
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
                <Volume2 size={13} /> Screen reader would say
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {said.length === 0 && <li className="text-faint">Add something to the wishlist…</li>}
                {said.map((s) => (
                  <li key={s.id} className={s.text.startsWith('(') ? 'text-danger' : 'text-fg'}>
                    {s.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
