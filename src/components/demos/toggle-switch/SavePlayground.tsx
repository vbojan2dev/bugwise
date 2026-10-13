import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, Server, Smartphone } from 'lucide-react';
import { Switch } from './Switch';

type Strategy = 'optimistic' | 'pessimistic' | 'broken';
type Net = 'fast' | 'slow' | 'fail';

const strategies: { id: Strategy; name: string; text: string }[] = [
  { id: 'optimistic', name: 'Optimistic + rollback', text: 'The switch flips instantly. If the server fails, it flips back and explains why. The usual choice for toggles.' },
  { id: 'pessimistic', name: 'Wait for server', text: 'The switch shows progress and only flips once the server confirms. Safer for important settings, but feels slower.' },
  { id: 'broken', name: 'Optimistic, no rollback', text: 'The switch flips instantly and ignores errors. The user believes the setting changed. It did not.' },
];

interface LogEntry {
  id: number;
  value: boolean;
  status: number | null;
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; name: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-md px-2 py-1.5 text-left ${value === o.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SavePlayground() {
  const [strategy, setStrategy] = useState<Strategy>('optimistic');
  const [net, setNet] = useState<Net>('fast');
  const [ui, setUi] = useState(true);
  const [server, setServer] = useState(true);
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);
  const latest = useRef(0);
  const serverRef = useRef(true);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const toggle = (next: boolean) => {
    const id = nextId.current++;
    latest.current = id;
    const fail = net === 'fail';
    const ms = net === 'slow' ? 3000 : net === 'fail' ? 1200 : 400;
    setToast(null);
    setLog((l) => [{ id, value: next, status: null }, ...l].slice(0, 5));
    setPending((p) => p + 1);
    if (strategy !== 'pessimistic') setUi(next);
    later(() => {
      setPending((p) => p - 1);
      setLog((l) => l.map((e) => (e.id === id ? { ...e, status: fail ? 500 : 200 } : e)));
      if (!fail) {
        serverRef.current = next;
        setServer(next);
        if (strategy === 'pessimistic') setUi(next);
        return;
      }
      if (strategy === 'optimistic') {
        // Roll back to the last value the server confirmed (only for the newest request).
        if (id !== latest.current) return;
        setUi(serverRef.current);
        setToast("Couldn't update order updates. Check your connection and try again.");
      } else if (strategy === 'pessimistic') {
        setToast("Couldn't update order updates. Please try again.");
      }
      // 'broken': nothing happens. The switch keeps lying.
    }, ms);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPending(0);
    setToast(null);
    setUi(server);
    setLog((l) => l.map((e) => (e.status === null ? { ...e, status: 0 } : e)));
  };

  const busy = strategy === 'pessimistic' && pending > 0;
  const mismatch = pending === 0 && ui !== server;
  const s = strategies.find((x) => x.id === strategy)!;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 When does the setting really save?</p>
        <p className="text-sm text-muted">A switch talks to a server. Pick a strategy and a network, then flip the switch and compare what the user sees with what the server stored.</p>
      </div>
      <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-line p-5 md:border-r md:border-b-0">
          <Seg label="Save strategy" value={strategy} onChange={setStrategy} options={strategies} />
          <Seg
            label="Network"
            value={net}
            onChange={setNet}
            options={[
              { id: 'fast', name: 'Fast (0.4 s)' },
              { id: 'slow', name: 'Slow (3 s)' },
              { id: 'fail', name: 'Fails (500)' },
            ]}
          />
          <p className="text-[13px] leading-relaxed text-muted">{s.text}</p>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 bg-[#f2f2f7] px-4 py-8 text-black">
            <div className="w-full max-w-[18rem] overflow-hidden rounded-xl bg-white">
              <div className="flex min-h-11 items-center gap-3 px-4 py-2">
                <span id="save-pg-label" className="flex-1 text-[15px]">
                  Order updates
                </span>
                {busy && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />}
                <Switch platform="ios" checked={ui} onChange={toggle} disabled={busy} labelledBy="save-pg-label" />
              </div>
            </div>
            <div aria-live="polite" className="min-h-[3.25rem] w-full max-w-[18rem]">
              {toast && <p className="rounded-xl bg-[#1c1c1e] px-3 py-2.5 text-[12px] leading-snug text-white shadow-lg">{toast}</p>}
            </div>
            <button type="button" onClick={restart} className="flex items-center gap-1.5 text-[12px] font-medium text-black/55 hover:text-black">
              <RotateCcw size={12} /> Restart app (reload from server)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-line bg-line text-sm">
            <div className="flex items-center gap-2 bg-surface px-4 py-3">
              <Smartphone size={16} className="text-muted" />
              <span className="text-muted">App shows</span>
              <strong className="ml-auto">{ui ? 'ON' : 'OFF'}</strong>
            </div>
            <div className="flex items-center gap-2 bg-surface px-4 py-3">
              <Server size={16} className="text-muted" />
              <span className="text-muted">Server has</span>
              <strong className="ml-auto">{server ? 'ON' : 'OFF'}</strong>
            </div>
          </div>
          <div className="border-t border-line px-4 py-3 text-sm">
            {mismatch ? (
              <p className="flex items-start gap-2 text-fg">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> The app and the server disagree. The user thinks order updates are {ui ? 'on' : 'off'}, but they are {server ? 'on' : 'off'}. Restart the app to see it.
              </p>
            ) : (
              <p className="flex items-start gap-2 text-fg">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> {pending ? 'Saving…' : 'App and server agree.'}
              </p>
            )}
          </div>
          <ul className="min-h-[4.5rem] space-y-1 border-t border-line bg-[#0e1120] px-4 py-2 font-mono text-[11px] text-[#c9cde0]">
            {log.length === 0 && <li className="text-white/35">Flip the switch to see requests…</li>}
            {log.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className="text-[#c4b5fd]">PATCH</span>
                <span className="min-w-0 flex-1 truncate">/api/settings orderUpdates={String(e.value)}</span>
                {e.status === null ? (
                  <span className="text-[#fbbf24]">pending…</span>
                ) : e.status === 0 ? (
                  <span className="text-white/40">canceled</span>
                ) : (
                  <span className={e.status === 200 ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
