import { useEffect, useRef, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

/** Shows how many requests a search box sends with and without a debounce. */
export function DebounceDemo() {
  const [debounce, setDebounce] = useState(true);
  const [value, setValue] = useState('');
  const [keys, setKeys] = useState(0);
  const [sent, setSent] = useState<{ id: number; q: string }[]>([]);
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const nextId = useRef(1);
  const [count, setCount] = useState(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = (q: string) => {
    const id = nextId.current++;
    setSent((s) => [{ id, q }, ...s].slice(0, 30));
    setCount((c) => c + 1);
  };

  const onChange = (q: string) => {
    setValue(q);
    setKeys((k) => k + 1);
    window.clearTimeout(timer.current);
    if (!debounce) {
      setWaiting(false);
      send(q);
      return;
    }
    setWaiting(true);
    timer.current = window.setTimeout(() => {
      setWaiting(false);
      send(q);
    }, 300);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setValue('');
    setKeys(0);
    setSent([]);
    setCount(0);
    setWaiting(false);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <p className="text-sm font-semibold">Try it: type “wireless earbuds” quickly</p>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={debounce} onChange={(e) => { setDebounce(e.target.checked); reset(); }} className="accent-[var(--brand)]" />
            Debounce 300 ms
          </label>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 text-[#0f172a] ring-1 ring-black/5">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-[#d4d7e1] bg-[#f8fafc] pr-3 pl-9 text-[14px] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-[#f1f5f9] p-2">
              <p className="text-[11px] text-[#64748b]">Keystrokes</p>
              <p className="text-xl font-bold tabular-nums">{keys}</p>
            </div>
            <div className="rounded-xl bg-[#f1f5f9] p-2">
              <p className="text-[11px] text-[#64748b]">Requests sent</p>
              <p className="text-xl font-bold tabular-nums">{count}</p>
            </div>
          </div>
          <p className="mt-3 h-4 text-[11px] text-[#64748b]">{waiting ? 'Waiting for you to pause typing…' : ''}</p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
          <ul className="h-[9.5rem] space-y-1 overflow-y-auto px-3 py-2">
            {sent.length === 0 && <li className="text-white/35">No requests yet…</li>}
            {sent.map((r) => (
              <li key={r.id} className="truncate">
                <span className="text-[#7dd3fc]">GET</span> /api/search?q={encodeURIComponent(r.q)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
