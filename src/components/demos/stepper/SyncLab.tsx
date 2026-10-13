import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { Stepper } from './Stepper';

/*
 * Rapid taps vs the network. Each request has a random upload time (when the server saves it)
 * and download time (when the app gets the answer), so requests can overtake each other.
 */

type Strategy = 'naive' | 'stale' | 'debounce';

interface Entry {
  id: number;
  qty: number;
  state: 'sent' | 'saved' | 'done' | 'ignored';
}

function Pills<T extends string>({ value, options, onChange, render }: { value: T; options: readonly T[]; onChange: (v: T) => void; render: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 whitespace-nowrap ${value === o ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

const names: Record<Strategy, string> = { naive: 'Every tap, trust every reply', stale: 'Every tap, ignore old replies', debounce: 'Debounce, then send once' };

export default function SyncLab() {
  const [strategy, setStrategy] = useState<Strategy>('naive');
  const [unstable, setUnstable] = useState(true);
  const [shown, setShown] = useState(1);
  const [server, setServer] = useState(1);
  const [log, setLog] = useState<Entry[]>([]);
  const [pending, setPending] = useState(0);
  const [debouncing, setDebouncing] = useState(false);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const latest = useRef(0);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(debounce.current);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const mark = (id: number, state: Entry['state']) => setLog((l) => l.map((e) => (e.id === id ? { ...e, state } : e)));

  const send = (qty: number, mode: Strategy) => {
    const id = ++seq.current;
    latest.current = id;
    const up = unstable ? 100 + Math.random() * 900 : 200;
    const down = unstable ? 100 + Math.random() * 700 : 150;
    setPending((p) => p + 1);
    setLog((l) => [{ id, qty, state: 'sent' as const }, ...l].slice(0, 8));
    later(() => {
      setServer(qty); // the server saves requests in the order they arrive
      mark(id, 'saved');
    }, up);
    later(() => {
      setPending((p) => p - 1);
      if (mode === 'naive') {
        setShown(qty); // overwrites the UI with whatever arrives last
        mark(id, 'done');
      } else if (id === latest.current) {
        mark(id, 'done');
      } else {
        mark(id, 'ignored');
      }
    }, up + down);
  };

  const change = (v: number) => {
    setShown(v);
    if (strategy === 'debounce') {
      clearTimeout(debounce.current);
      setDebouncing(true);
      debounce.current = window.setTimeout(() => {
        setDebouncing(false);
        send(v, 'debounce');
      }, 500);
    } else send(v, strategy);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(debounce.current);
    setDebouncing(false);
    setPending(0);
    setShown(1);
    setServer(1);
    setLog([]);
    seq.current = 0;
    latest.current = 0;
  };

  const idle = pending === 0 && !debouncing;
  const sent = seq.current;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">📶 Rapid taps vs the network</p>
        <p className="text-sm text-muted">Tap + five times as fast as you can (or hold it), then wait. Does the cart agree with the server?</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="How the app syncs">
            <div className="flex flex-col gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
              {(Object.keys(names) as Strategy[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={strategy === s}
                  onClick={() => {
                    reset();
                    setStrategy(s);
                  }}
                  className={`rounded-md px-2 py-1.5 text-left ${strategy === s ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
                >
                  {names[s]}
                </button>
              ))}
            </div>
          </Control>
          <Control label="Network">
            <Pills value={unstable ? 'jitter' : 'stable'} options={['stable', 'jitter'] as const} onChange={(v) => setUnstable(v === 'jitter')} render={(v) => (v === 'stable' ? 'Stable' : 'Unstable (4G)')} />
          </Control>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="px-5 py-8" style={{ background: '#f2f2f7', color: '#000', colorScheme: 'light' }}>
            <div className="mx-auto flex max-w-[20rem] items-center justify-between gap-3 rounded-xl bg-white px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">Bananas (bunch)</p>
                <p className="text-[12px] text-[rgba(60,60,67,.6)]">€1.99 each · total €{(shown * 1.99).toFixed(2)}</p>
              </div>
              <Stepper label="Quantity of Bananas" value={shown} min={1} max={20} onChange={change} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-3">
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Cart shows</p>
              <p className="text-lg font-semibold tabular-nums">{shown}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Server saved</p>
              <p className="text-lg font-semibold tabular-nums">{server}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Requests</p>
              <p className="text-lg font-semibold tabular-nums">{sent}</p>
            </div>
          </div>

          <div className="border-t border-line p-5">
            {!idle ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={16} className="shrink-0 animate-spin" /> {debouncing ? 'Waiting for you to stop tapping…' : `${pending} request${pending === 1 ? '' : 's'} in flight…`}
              </p>
            ) : sent === 0 ? (
              <p className="text-sm text-muted">Tap + quickly a few times.</p>
            ) : shown === server ? (
              <p className="flex items-start gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
                <span>
                  In sync: the cart and the server both say {shown}.{' '}
                  {strategy === 'stale' && 'Lucky this time? Try again a few times: ignoring old replies fixes the screen, not the order in which the server saved them.'}
                  {strategy === 'naive' && 'Try again faster, with the unstable network.'}
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-fg">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <span>
                  Out of sync: the cart shows <strong>{shown}</strong> but the server saved <strong>{server}</strong>. At checkout the user pays for {server}.
                  {strategy === 'stale' && ' The screen ignored old replies, but the requests reached the server in the wrong order. Fix it on the server too (a version number), or debounce.'}
                </span>
              </p>
            )}
          </div>

          <div className="overflow-hidden border-t border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
              <span>Network log</span>
              <span className="normal-case">newest first</span>
            </div>
            <ul className="min-h-[5rem] space-y-1 px-3 py-2">
              {log.length === 0 && <li className="text-white/35">No requests yet…</li>}
              {log.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="text-[#7dd3fc]">#{e.id} PATCH</span>
                  <span className="min-w-0 flex-1 truncate">/cart/bananas qty={e.qty}</span>
                  <span className={e.state === 'done' ? 'text-[#34d399]' : e.state === 'ignored' ? 'text-white/40' : e.state === 'saved' ? 'text-[#a5b4fc]' : 'text-[#fbbf24]'}>
                    {e.state === 'sent' ? '…' : e.state === 'saved' ? 'saved' : e.state === 'done' ? '200' : '200 (ignored)'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
