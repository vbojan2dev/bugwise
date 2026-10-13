import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Receipt, RefreshCw, RotateCcw, WifiOff } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { EmptyState, OrderList, TabBar, ink, orders, type Order } from './States';

/*
 * A deliberately broken iOS "Orders" screen. Bugs (don't spoil them for learners!):
 *  1. When the API returns an empty list ([]), the spinner never stops.
 *  2. A 500 shows "Something went wrong." with no explanation and no Retry button.
 *  3. Retry on the offline screen fires two requests per tap.
 *  4. Every load first flashes the "No orders yet" empty state before the spinner and the data.
 *  5. The "No internet connection" banner stays after the connection is back.
 *  6. The "Canceled" filter (no canceled orders) shows a raw "TypeError: ... (reading 'map')"
 *     instead of a filtered empty state.
 */

type Phase = 'blank' | 'loading' | 'list' | 'error' | 'offline';
type Mock = 'off' | 'empty' | '500';
type Filter = 'All' | 'Active' | 'Delivered' | 'Canceled';

interface LogEntry {
  id: number;
  path: string;
  status?: string;
  ok?: boolean;
}

const filters: Filter[] = ['All', 'Active', 'Delivered', 'Canceled'];

export function BuggyOrdersApp() {
  const [phase, setPhase] = useState<Phase>('blank');
  const [data, setData] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [airplane, setAirplane] = useState(false);
  const [banner, setBanner] = useState(false);
  const [mock, setMock] = useState<Mock>('off');
  const [log, setLog] = useState<LogEntry[]>([]);
  const airplaneRef = useRef(false);
  const mockRef = useRef<Mock>('off');
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const load = () => {
    // BUG 4: the list is cleared and the screen renders the empty state before the request even starts
    setPhase('blank');
    setData([]);
    setFilter('All');
    later(() => {
      setPhase('loading');
      const id = nextId.current++;
      setLog((l) => [{ id, path: '/api/orders' }, ...l].slice(0, 6));
      const offline = airplaneRef.current;
      const mode = mockRef.current;
      later(
        () => {
          if (offline) {
            setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'failed (offline)', ok: false } : e)));
            setPhase('offline');
            return;
          }
          if (mode === '500') {
            setLog((l) => l.map((e) => (e.id === id ? { ...e, status: '500', ok: false } : e)));
            setPhase('error');
            return;
          }
          const list = mode === 'empty' ? [] : orders;
          setLog((l) => l.map((e) => (e.id === id ? { ...e, status: mode === 'empty' ? '200 · []' : `200 · ${list.length} orders`, ok: true } : e)));
          setData(list);
          // BUG 1: an empty array never ends the loading state
          if (list.length > 0) setPhase('list');
        },
        offline ? 400 : 900,
      );
    }, 600);
  };

  useEffect(() => {
    load();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAirplaneMode = (on: boolean) => {
    airplaneRef.current = on;
    setAirplane(on);
    if (on) setBanner(true);
    // BUG 5: the banner is never cleared when the connection comes back
  };

  const setMockMode = (m: Mock) => {
    mockRef.current = m;
    setMock(m);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLog([]);
    setBanner(airplaneRef.current);
    load();
  };

  // Group orders by filter. BUG 6: there is no "Canceled" group, so groups.Canceled is undefined.
  const groups: Partial<Record<Filter, Order[]>> = { All: data };
  data.forEach((o) => {
    const k: Filter = o.status === 'active' ? 'Active' : 'Delivered';
    (groups[k] ??= []).push(o);
  });
  const shown = groups[filter];

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="absolute inset-0 flex flex-col text-black" style={{ background: ink.bg, colorScheme: 'light' }}>
          <div className="flex shrink-0 items-end justify-between px-4 pt-2 pb-2">
            <p className="text-[26px] leading-none font-bold">Orders</p>
            <button type="button" onClick={load} aria-label="Refresh" className="grid size-9 place-items-center rounded-full" style={{ color: ink.blue }}>
              <RefreshCw size={19} />
            </button>
          </div>

          {banner && (
            <div role="status" className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-[#3a3a3c] px-3 py-2 text-[12px] text-white">
              <WifiOff size={14} aria-hidden="true" /> No internet connection
            </div>
          )}

          <div className="relative min-h-0 flex-1 overflow-y-auto pb-3">
            {phase === 'blank' && <EmptyState icon={Receipt} title="No orders yet" body="When you order food, you'll find your orders and receipts here." primary="Browse restaurants" />}

            {phase === 'loading' && (
              <div className="flex flex-col items-center gap-2 pt-28 text-[12px]" style={{ color: ink.secondary }} role="status">
                <LoaderCircle size={26} className="animate-spin" aria-hidden="true" />
                Loading…
              </div>
            )}

            {phase === 'list' && (
              <>
                <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 text-[11px] font-medium">
                  {filters.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={filter === f}
                      onClick={() => setFilter(f)}
                      className="shrink-0 rounded-full px-2.5 py-1"
                      style={f === filter ? { background: '#000', color: '#fff' } : { background: '#e5e5ea', color: '#3a3a3c' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {shown ? (
                  <OrderList list={shown} />
                ) : (
                  <p className="mx-3 rounded-lg bg-white p-3 font-mono text-[11px] leading-snug break-words text-[#c0262d]">TypeError: Cannot read properties of undefined (reading 'map')</p>
                )}
              </>
            )}

            {phase === 'error' && (
              <p className="pt-32 text-center text-[13px]" style={{ color: ink.secondary }}>
                Something went wrong.
              </p>
            )}

            {phase === 'offline' && (
              <EmptyState
                icon={WifiOff}
                tone="warn"
                title="You're offline"
                body="Check your internet connection and try again."
                primary="Retry"
                onPrimary={() => {
                  // BUG 3: the retry handler and the screen's own "on retry" listener both reload
                  load();
                  load();
                }}
              />
            )}
          </div>
          <div className="pb-4" style={{ background: '#f9f9f9' }}>
            <TabBar />
          </div>
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device & proxy</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Airplane mode
            <input type="checkbox" checked={airplane} onChange={(e) => setAirplaneMode(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            <span className="shrink-0">Map Local /api/orders</span>
            <select value={mock} onChange={(e) => setMockMode(e.target.value as Mock)} className="w-0 min-w-0 flex-1 rounded-md border border-line bg-surface px-1.5 py-1 text-sm">
              <option value="off">Off (real server)</option>
              <option value="empty">200 · empty list []</option>
              <option value="500">500 server error</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">Changes apply to the next request: tap Refresh in the app after changing them.</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Waiting for requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">{e.path}</span>
              {e.status === undefined ? <span className="text-[#fbbf24]">pending…</span> : <span className={e.ok ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
