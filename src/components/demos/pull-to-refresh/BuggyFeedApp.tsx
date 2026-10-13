import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Bike, Footprints, Mountain, RotateCcw, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { IosSpinner } from './Indicators';

/*
 * A deliberately broken activity feed with pull to refresh. Bugs (don't spoil them for learners!):
 *  1. When the request fails (server error or offline), the spinner never stops and no error is shown.
 *  2. There is no "already refreshing" guard: pulling again during a refresh sends a second request,
 *     and because both ask for the same page, the new items appear twice.
 *  3. After new items arrive, the app "keeps your place" with a wrong row height, so the list jumps
 *     down to a random spot instead of showing the new items at the top.
 *  4. The threshold is tiny (14 px) and the pull is measured from wherever the list reaches the top,
 *     so dragging the list back up to the top in one go (normal scrolling) triggers a refresh.
 *  5. There is no non-gesture way to refresh: no button, no menu, nothing for keyboard or screen reader users.
 *  6. "Updated 8:15" never changes, even after a successful refresh.
 * Pointer Events: works with a mouse (drag) and a finger.
 */

interface Post {
  uid: number;
  name: string;
  what: string;
  detail: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

type P = Omit<Post, 'uid'>;

const seed: P[] = [
  { name: 'Emma', what: 'ran 5.2 km', detail: '28:14 · Riverside loop', time: '8:02', icon: Footprints, color: '#ff9500' },
  { name: 'Daniel', what: 'cycled 22 km', detail: '54:10 · Canal path', time: '7:48', icon: Bike, color: '#5856d6' },
  { name: 'Sofia', what: 'swam 1.5 km', detail: '36:40 · City pool', time: '7:30', icon: Waves, color: '#30b0c7' },
  { name: 'Leo', what: 'hiked 9.8 km', detail: '2:41:00 · Green hills', time: '7:05', icon: Mountain, color: '#34c759' },
  { name: 'Mia', what: 'ran 10 km', detail: '52:31 · Park run', time: '6:50', icon: Footprints, color: '#ff2d55' },
  { name: 'Marco', what: 'cycled 41 km', detail: '1:32:00 · Coast road', time: '6:31', icon: Bike, color: '#af52de' },
  { name: 'Anna', what: 'walked 4.1 km', detail: '45:12 · Old town', time: '6:10', icon: Footprints, color: '#a2845e' },
  { name: 'Tom', what: 'swam 800 m', detail: '22:05 · Lake', time: 'Yesterday', icon: Waves, color: '#007aff' },
  { name: 'Lena', what: 'ran 7.4 km', detail: '39:50 · Hill repeats', time: 'Yesterday', icon: Footprints, color: '#ff3b30' },
  { name: 'Omar', what: 'hiked 14 km', detail: '4:05:00 · Ridge trail', time: 'Yesterday', icon: Mountain, color: '#8e8e93' },
];

const pages: P[][] = [
  [
    { name: 'Grace', what: 'ran 3.0 km', detail: '16:02 · Morning jog', time: 'Just now', icon: Footprints, color: '#ff9500' },
    { name: 'Noah', what: 'cycled 12 km', detail: '31:40 · Commute', time: 'Just now', icon: Bike, color: '#34c759' },
    { name: 'Ivy', what: 'swam 1.0 km', detail: '25:18 · City pool', time: 'Just now', icon: Waves, color: '#5856d6' },
  ],
  [
    { name: 'Ben', what: 'walked 2.2 km', detail: '24:30 · Dog walk', time: 'Just now', icon: Footprints, color: '#a2845e' },
    { name: 'Zoe', what: 'hiked 6.5 km', detail: '1:48:00 · Forest loop', time: 'Just now', icon: Mountain, color: '#30b0c7' },
  ],
  [{ name: 'Kai', what: 'ran 21.1 km', detail: '1:49:12 · Half marathon!', time: 'Just now', icon: Footprints, color: '#ff2d55' }],
];

const PULL_AT = 14; // BUG 4: far too low
const ROW_H = 118; // BUG 3: real rows are about 66 px tall
const LATENCY = 2500;

interface Log {
  id: number;
  page: number;
  status: 'pending' | 'ok' | 'error' | 'failed';
  count?: number;
}

export function BuggyFeedApp() {
  const uid = useRef(0);
  const make = (ps: P[]) => ps.map((p) => ({ ...p, uid: ++uid.current }));
  const [posts, setPosts] = useState<Post[]>(() => make(seed));
  const [pull, setPullState] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [log, setLog] = useState<Log[]>([]);

  const list = useRef<HTMLDivElement>(null);
  const g = useRef<{ pid: number; y: number; start: number } | null>(null);
  const pullRef = useRef(0);
  const cursor = useRef(0);
  const reqId = useRef(0);
  const timers = useRef<number[]>([]);

  const jump = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useLayoutEffect(() => {
    if (jump.current && list.current) {
      list.current.scrollTop += jump.current;
      jump.current = 0;
    }
  }, [posts]);

  const setPull = (v: number) => {
    pullRef.current = v;
    setPullState(v);
  };

  const refresh = () => {
    // BUG 2: no "already loading" check
    const id = ++reqId.current;
    const page = cursor.current;
    const failsOffline = offline;
    const failsServer = serverError;
    setRefreshing(true);
    setLog((l) => [{ id, page, status: 'pending' as const }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(
        () => {
          if (failsOffline || failsServer) {
            setLog((l) => l.map((e) => (e.id === id ? { ...e, status: failsOffline ? 'failed' : 'error' } : e)));
            return; // BUG 1: refreshing stays true, nothing tells the user
          }
          const batch = pages[page] ?? [];
          cursor.current = page + 1; // BUG 2: a second request started with the same page returns the same posts
          const added = make(batch);
          // BUG 3: tries to keep the reading position, with the wrong row height (and even when the user was at the top)
          if (added.length) jump.current = added.length * ROW_H;
          setPosts((ps) => [...added, ...ps]);
          setRefreshing(false);
          setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'ok', count: added.length } : e)));
          // BUG 6: "Updated" time is never set
        },
        failsOffline ? 700 : LATENCY,
      ),
    );
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (g.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    g.current = { pid: e.pointerId, y: e.clientY, start: list.current?.scrollTop ?? 0 };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid || !list.current) return;
    const next = cur.start - (e.clientY - cur.y);
    if (next < 0) {
      // BUG 4: the pull starts wherever the list hits the top, even mid-scroll
      setPull(Math.min(90, -next * 0.5));
      list.current.scrollTop = 0;
    } else {
      if (pullRef.current) setPull(0);
      list.current.scrollTop = next;
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    g.current = null;
    if (e.type !== 'pointercancel' && pullRef.current >= PULL_AT) refresh();
    setPull(0);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    g.current = null;
    cursor.current = 0;
    setPosts(make(seed));
    setPull(0);
    setRefreshing(false);
    setLog([]);
    if (list.current) list.current.scrollTop = 0;
  };

  const sub = 'rgba(60,60,67,.6)';
  const gap = refreshing ? 48 : pull;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="flex h-full flex-col bg-[#f2f2f7] text-black">
          <div className="shrink-0 px-4 pt-3 pb-2">
            <p className="text-[26px] leading-none font-bold tracking-tight">Activity</p>
            <p className="mt-1 text-[11px]" style={{ color: sub }}>
              Friends · Updated 8:15
            </p>
          </div>
          <div
            ref={list}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative min-h-0 flex-1 overflow-y-auto pb-6 select-none"
            style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
          >
            <div className="flex items-end justify-center overflow-hidden" style={{ height: gap, transition: g.current ? 'none' : 'height 200ms ease' }}>
              {gap > 8 && (
                <span className="mb-2">
                  <IosSpinner progress={Math.min(1, pull / PULL_AT)} spinning={refreshing} size={22} />
                </span>
              )}
            </div>
            <ul className="space-y-2 px-3">
              {posts.map((p) => (
                <li key={p.uid} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white" style={{ background: p.color }}>
                    {p.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">
                      <strong>{p.name}</strong> {p.what}
                    </span>
                    <span className="block truncate text-[12px]" style={{ color: sub }}>
                      {p.detail}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <p.icon size={16} style={{ color: p.color }} aria-hidden="true" />
                    <span className="text-[10px]" style={{ color: sub }}>
                      {p.time}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 space-y-2 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">Server returns errors (500)</span>
            <input type="checkbox" checked={serverError} onChange={(e) => setServerError(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">Airplane mode (offline)</span>
            <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-faint">Drag the list with your mouse or finger to scroll and to pull down at the top. Each request takes about 2.5 s.</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Pull to refresh to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">/api/feed?page={e.page}</span>
              {e.status === 'ok' && <span className="shrink-0 text-[#34d399]">200 · {e.count} new</span>}
              {e.status === 'pending' && <span className="shrink-0 text-[#fbbf24]">pending…</span>}
              {e.status === 'error' && <span className="shrink-0 text-[#f87171]">500</span>}
              {e.status === 'failed' && <span className="shrink-0 text-[#f87171]">no connection</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
