import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Hand,
  MousePointerClick,
  Move,
  Pointer,
  RotateCcw,
  RotateCw,
  Timer,
  ZoomIn,
  ZoomOut,
  Eraser,
} from 'lucide-react';

/*
 * Gesture pad: recognizes tap, double tap, long press, swipe (with direction), drag,
 * pinch and rotate using Pointer Events, so it works with a mouse, a pen and touch.
 * On desktop, hold Shift while dragging to simulate a two-finger pinch/rotate
 * (the second "finger" is mirrored around the center of the pad, like Option in the iOS Simulator).
 */

const SLOP = 10; // px a finger may wobble before we call it "movement"
const LONG_PRESS = 500; // ms
const DOUBLE_TAP = 300; // ms between taps
const SWIPE_MIN_DIST = 40; // px
const SWIPE_MIN_VELOCITY = 0.5; // px per ms (= 500 px/s)

type Pt = { x: number; y: number };
type TPt = Pt & { t: number };
type Kind = 'tap' | 'double' | 'long' | 'longdrag' | 'swipe' | 'drag' | 'pinch-in' | 'pinch-out' | 'rotate' | 'two-tap' | 'two' | 'pending';

interface Result {
  kind: Kind;
  name: string;
  duration: number;
  distance: number;
  velocity: number; // px/s
  direction?: 'left' | 'right' | 'up' | 'down';
  scale?: number;
  angle?: number;
  fingers: number;
  why: string;
}

interface Gesture {
  startT: number;
  primary: number;
  start: Pt;
  trail: TPt[];
  moved: boolean;
  longFired: boolean;
  maxFingers: number;
  pinchStart?: { dist: number; angle: number };
  scale: number;
  angle: number;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const angleOf = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const VIRTUAL = -1;

const icons: Record<string, typeof Pointer> = {
  tap: Pointer,
  pending: Pointer,
  double: MousePointerClick,
  long: Timer,
  longdrag: Move,
  drag: Move,
  'pinch-in': ZoomOut,
  'pinch-out': ZoomIn,
  rotate: RotateCw,
  'two-tap': Hand,
  two: Hand,
  left: ArrowLeft,
  right: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
};

export default function GesturePad() {
  const pad = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { start: Pt; cur: Pt }>());
  const g = useRef<Gesture | null>(null);
  const longTimer = useRef<number | undefined>(undefined);
  const tapTimer = useRef<number | undefined>(undefined);
  const lastTap = useRef<{ t: number; p: Pt } | null>(null);

  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [waitForDouble, setWaitForDouble] = useState(true);
  const [pressing, setPressing] = useState(false);
  const [longNow, setLongNow] = useState(false);

  useEffect(
    () => () => {
      clearTimeout(longTimer.current);
      clearTimeout(tapTimer.current);
    },
    [],
  );

  const local = (e: { clientX: number; clientY: number }): Pt => {
    const r = pad.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mirror = (p: Pt): Pt => {
    const r = pad.current!.getBoundingClientRect();
    return { x: r.width - p.x, y: r.height - p.y };
  };

  const commit = (r: Result) => {
    setResult(r);
    if (r.kind !== 'pending') setHistory((h) => [r.name, ...h].slice(0, 8));
  };

  const twoPoints = (): [Pt, Pt] | null => {
    const list = [...pointers.current.values()];
    return list.length >= 2 ? [list[0].cur, list[1].cur] : null;
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    const p = local(e);
    if (pointers.current.size === 0) {
      g.current = { startT: performance.now(), primary: e.pointerId, start: p, trail: [{ ...p, t: performance.now() }], moved: false, longFired: false, maxFingers: 1, scale: 1, angle: 0 };
      setPressing(true);
      setLongNow(false);
      clearTimeout(longTimer.current);
      longTimer.current = window.setTimeout(() => {
        const cur = g.current;
        if (cur && !cur.moved && cur.maxFingers === 1 && pointers.current.size === 1) {
          cur.longFired = true;
          setLongNow(true);
          try {
            navigator.vibrate?.(15); // a light "haptic" tick on Android browsers
          } catch {
            /* not supported */
          }
        }
      }, LONG_PRESS);
    }
    pointers.current.set(e.pointerId, { start: p, cur: p });
    if (e.pointerType === 'mouse' && e.shiftKey) {
      const m = mirror(p);
      pointers.current.set(VIRTUAL, { start: m, cur: m });
    }
    const cur = g.current!;
    cur.maxFingers = Math.max(cur.maxFingers, pointers.current.size);
    const two = twoPoints();
    if (two) {
      clearTimeout(longTimer.current);
      cur.pinchStart = { dist: Math.max(1, dist(two[0], two[1])), angle: angleOf(two[0], two[1]) };
    }
    rerender();
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ptr = pointers.current.get(e.pointerId);
    const cur = g.current;
    if (!ptr || !cur) return;
    const p = local(e);
    ptr.cur = p;
    const v = pointers.current.get(VIRTUAL);
    if (v) v.cur = mirror(p);
    if (!cur.moved && dist(ptr.start, p) > SLOP) {
      cur.moved = true;
      if (!cur.longFired) clearTimeout(longTimer.current);
    }
    if (e.pointerId === cur.primary) {
      cur.trail.push({ ...p, t: performance.now() });
      if (cur.trail.length > 300) cur.trail.shift();
    }
    const two = twoPoints();
    if (two && cur.pinchStart) {
      cur.scale = dist(two[0], two[1]) / cur.pinchStart.dist;
      let a = angleOf(two[0], two[1]) - cur.pinchStart.angle;
      if (a > 180) a -= 360;
      if (a < -180) a += 360;
      cur.angle = a;
    }
    rerender();
  };

  const finish = () => {
    const cur = g.current!;
    const now = performance.now();
    const duration = Math.round(now - cur.startT);
    const end = cur.trail[cur.trail.length - 1];
    const distance = Math.round(dist(cur.start, end));
    // Release velocity: distance covered in the last ~100 ms before lifting the finger.
    let i = cur.trail.length - 1;
    while (i > 0 && end.t - cur.trail[i].t < 100) i--;
    const ref = cur.trail[i];
    const dt = Math.max(1, end.t - ref.t);
    const vel = dist(ref, end) / dt; // px/ms
    const velocity = Math.round(vel * 1000);
    const dx = end.x - cur.start.x;
    const dy = end.y - cur.start.y;
    const direction: Result['direction'] = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const base = { duration, distance, velocity, fingers: cur.maxFingers };

    if (cur.maxFingers >= 2) {
      const scale = Math.round(cur.scale * 100) / 100;
      const angle = Math.round(cur.angle);
      const zoomChange = Math.abs(Math.log(cur.scale));
      if (Math.abs(angle) >= 15 && Math.abs(angle) / 45 > zoomChange) {
        return commit({ ...base, kind: 'rotate', name: `Rotate ${angle > 0 ? 'clockwise' : 'counter-clockwise'}`, scale, angle, why: `Two fingers turned ${Math.abs(angle)}° around each other (more than 15°), with little change in distance.` });
      }
      if (Math.abs(cur.scale - 1) >= 0.1) {
        const out = cur.scale > 1;
        return commit({ ...base, kind: out ? 'pinch-out' : 'pinch-in', name: out ? 'Pinch out (zoom in)' : 'Pinch in (zoom out)', scale, angle, why: `The distance between two fingers changed to ×${scale}. Apps usually map this ratio straight to the zoom level.` });
      }
      if (!cur.moved && duration < LONG_PRESS) {
        return commit({ ...base, kind: 'two-tap', name: 'Two-finger tap', scale, angle, why: 'Two fingers touched and lifted quickly without moving. Maps use it to zoom out.' });
      }
      return commit({ ...base, kind: 'two', name: 'Two-finger drag', scale, angle, why: 'Two fingers moved together without pinching or turning. Some apps use this to scroll a map or tilt it.' });
    }

    if (cur.longFired) {
      return commit(
        cur.moved
          ? { ...base, kind: 'longdrag', name: 'Long press + drag', why: `Held still for ${LONG_PRESS} ms, then moved. This is how you pick up an item to reorder a list or move an app icon.` }
          : { ...base, kind: 'long', name: 'Long press', why: `Held for ${duration} ms without moving more than ${SLOP} px. The long press fired at ${LONG_PRESS} ms, while the finger was still down.` },
      );
    }

    if (cur.moved) {
      if (distance >= SWIPE_MIN_DIST && vel >= SWIPE_MIN_VELOCITY) {
        return commit({ ...base, kind: 'swipe', direction, name: `Swipe ${direction}`, why: `Moved ${distance} px and was still going ${velocity} px/s when the finger lifted (faster than ${SWIPE_MIN_VELOCITY * 1000} px/s). A quick flick = swipe.` });
      }
      return commit({
        ...base,
        kind: 'drag',
        direction,
        name: 'Drag',
        why: distance < SWIPE_MIN_DIST ? `Moved, but only ${distance} px net (under ${SWIPE_MIN_DIST} px), so it is not a swipe.` : `Moved ${distance} px but slowed to ${velocity} px/s before lifting (under ${SWIPE_MIN_VELOCITY * 1000} px/s). Slow, controlled movement = drag.`,
      });
    }

    // A tap. Was it the second tap of a double tap?
    const lt = lastTap.current;
    if (lt && now - lt.t <= DOUBLE_TAP && dist(lt.p, cur.start) <= 30) {
      clearTimeout(tapTimer.current);
      lastTap.current = null;
      return commit({ ...base, kind: 'double', name: 'Double tap', why: `Second tap came ${Math.round(now - lt.t)} ms after the first (within ${DOUBLE_TAP} ms) and close to the same spot.` });
    }
    lastTap.current = { t: now, p: cur.start };
    const tapResult: Result = {
      ...base,
      kind: 'tap',
      name: 'Tap',
      why: `Released after ${duration} ms (under ${LONG_PRESS} ms) without moving more than ${SLOP} px.${waitForDouble ? ` The pad then waited ${DOUBLE_TAP} ms to be sure no second tap was coming.` : ' Reported immediately, so a double tap shows up as "Tap" and then "Double tap".'}`,
    };
    if (waitForDouble) {
      commit({ ...tapResult, kind: 'pending', name: 'Tap…?', why: `Waiting up to ${DOUBLE_TAP} ms for a second tap before deciding.` });
      clearTimeout(tapTimer.current);
      tapTimer.current = window.setTimeout(() => {
        lastTap.current = null;
        commit(tapResult);
      }, DOUBLE_TAP);
    } else {
      commit(tapResult);
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (e.pointerType === 'mouse') pointers.current.delete(VIRTUAL);
    if (pointers.current.size > 0 || !g.current) return rerender();
    clearTimeout(longTimer.current);
    finish();
    setPressing(false);
    rerender();
  };

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit({ kind: 'tap', name: 'Tap (keyboard)', duration: 0, distance: 0, velocity: 0, fingers: 0, why: 'Keyboard and screen reader users "tap" with Enter, Space or a double tap in VoiceOver/TalkBack. Every gesture in an app needs an alternative like this.' });
    }
  };

  const clear = () => {
    setResult(null);
    setHistory([]);
  };

  const cur = g.current;
  const active = [...pointers.current.entries()];
  const trail = cur && pressing ? cur.trail : [];
  const Icon = result ? (result.kind === 'swipe' && result.direction ? icons[result.direction] : icons[result.kind]) : Hand;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">✋ Gesture pad</p>
        <p className="text-sm text-muted">
          Tap, double tap, press and hold, flick, drag slowly. Works with a mouse or a finger. Pinch and rotate with two fingers on a touch screen, or hold <kbd className="rounded border border-line px-1 text-xs">Shift</kbd> while dragging with a mouse.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 p-4">
          <div
            ref={pad}
            role="application"
            aria-label="Gesture pad. Use touch or mouse gestures. Press Enter to tap."
            aria-describedby="gesture-pad-result"
            tabIndex={0}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            onContextMenu={(e) => e.preventDefault()}
            className="relative h-72 cursor-crosshair overflow-hidden rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2"
            style={{ touchAction: 'none', background: '#f2f2f7', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          >
            {/* dotted grid */}
            <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(#c7c7cc 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {!pressing && !result && (
              <p className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm" style={{ color: '#8e8e93' }}>
                Try a gesture here
              </p>
            )}
            <svg className="pointer-events-none absolute inset-0 size-full">
              {trail.length > 1 && <polyline points={trail.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#007aff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />}
              {cur && pressing && (
                <>
                  {/* touch slop: movement inside this circle still counts as "not moved" */}
                  <circle cx={cur.start.x} cy={cur.start.y} r={SLOP} fill="none" stroke="#8e8e93" strokeDasharray="2 3" />
                  {/* long press progress ring */}
                  {!cur.moved && cur.maxFingers === 1 && (
                    <circle
                      cx={cur.start.x}
                      cy={cur.start.y}
                      r={30}
                      fill="none"
                      stroke={longNow ? '#34c759' : '#ff9500'}
                      strokeWidth={4}
                      strokeDasharray={188.5}
                      strokeDashoffset={0}
                      transform={`rotate(-90 ${cur.start.x} ${cur.start.y})`}
                      style={{ animation: longNow ? undefined : `gp-ring ${LONG_PRESS}ms linear forwards` }}
                    />
                  )}
                </>
              )}
              {active.length >= 2 && <line x1={active[0][1].cur.x} y1={active[0][1].cur.y} x2={active[1][1].cur.x} y2={active[1][1].cur.y} stroke="#af52de" strokeWidth={2} strokeDasharray="4 4" />}
              {active.map(([id, p]) => (
                <circle key={id} cx={p.cur.x} cy={p.cur.y} r={22} fill={id === VIRTUAL ? 'rgba(175,82,222,.25)' : 'rgba(0,122,255,.22)'} stroke={id === VIRTUAL ? '#af52de' : '#007aff'} strokeWidth={2} />
              ))}
            </svg>
            <style>{`@keyframes gp-ring { from { stroke-dashoffset: 188.5 } to { stroke-dashoffset: 0 } }`}</style>
            {cur && pressing && cur.maxFingers >= 2 && (
              <p className="pointer-events-none absolute top-2 left-2 rounded-md bg-white/90 px-2 py-1 font-mono text-[11px] text-black shadow-sm">
                ×{cur.scale.toFixed(2)} · {Math.round(cur.angle)}°
              </p>
            )}
            {longNow && pressing && cur && !cur.moved && (
              <p className="pointer-events-none absolute top-2 left-2 rounded-md bg-[#34c759] px-2 py-1 text-[11px] font-semibold text-white">Long press fired, finger still down</p>
            )}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={waitForDouble} onChange={(e) => setWaitForDouble(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            Wait {DOUBLE_TAP} ms for a possible double tap before reporting a tap
          </label>
        </div>

        <div className="min-w-0 border-t border-line p-4 md:border-t-0 md:border-l">
          <div id="gesture-pad-result" aria-live="polite" className="rounded-2xl bg-subtle p-3">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Recognized</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <Icon size={20} className="shrink-0 text-brand" />
              <span className="min-w-0">{result ? result.name : 'Nothing yet'}</span>
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ['Duration', result ? `${result.duration} ms` : '–'],
              ['Distance', result ? `${result.distance} px` : '–'],
              ['Velocity', result ? `${result.velocity} px/s` : '–'],
              ['Fingers', result ? String(result.fingers) : '–'],
              ...(result?.scale !== undefined ? [['Scale', `×${result.scale}`], ['Rotation', `${result.angle}°`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line px-2.5 py-1.5">
                <dt className="text-[11px] text-faint">{k}</dt>
                <dd className="font-mono text-[13px] font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {result && <p className="mt-3 text-[13px] leading-relaxed text-muted">{result.why}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-line p-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Thresholds used here</p>
          <ul className="mt-2 space-y-1 text-[13px] text-muted">
            <li>
              <strong className="text-fg">Touch slop:</strong> {SLOP} px of wobble still counts as "not moving"
            </li>
            <li>
              <strong className="text-fg">Long press:</strong> held still for {LONG_PRESS} ms
            </li>
            <li>
              <strong className="text-fg">Double tap:</strong> second tap within {DOUBLE_TAP} ms
            </li>
            <li>
              <strong className="text-fg">Swipe:</strong> ≥ {SWIPE_MIN_DIST} px and ≥ {SWIPE_MIN_VELOCITY * 1000} px/s at release, otherwise drag
            </li>
            <li>
              <strong className="text-fg">Pinch:</strong> finger distance changes by ≥ 10%. <strong className="text-fg">Rotate:</strong> ≥ 15°
            </li>
          </ul>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">History</p>
            <button type="button" onClick={clear} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <Eraser size={12} /> Clear
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {history.length === 0 && <span className="text-[13px] text-faint">Your gestures will appear here.</span>}
            {history.map((h, i) => (
              <span key={`${h}-${i}-${history.length}`} className={`rounded-full border border-line px-2 py-0.5 text-xs ${i === 0 ? 'bg-brand-soft text-fg' : 'text-muted'}`}>
                {h}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-faint">
            <RotateCcw size={12} className="mt-0.5 shrink-0" /> Real apps tune these numbers. iOS and Android use similar defaults, but every app can change them.
          </p>
        </div>
      </div>
    </div>
  );
}
