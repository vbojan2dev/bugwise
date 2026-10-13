import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Pause, Play, Share, X, ZoomIn, ZoomOut } from 'lucide-react';
import { PhotoArt, type Photo } from './photos';

/*
 * A full-screen photo viewer ("lightbox") that lives INSIDE its demo frame (position: absolute).
 * Correct behavior:
 *  - dialog semantics (role="dialog", aria-modal, label), focus moves in on open, Tab is trapped,
 *    Esc / X / swipe down close it, and the parent gets the CURRENT index back to restore focus.
 *  - swipe (touch or mouse drag) and Prev/Next buttons, arrow keys; clear ends (rubber band, disabled buttons).
 *  - double-tap / double-click zooms at that point, pinch with two fingers, +/- buttons and keys;
 *    panning is limited to the photo's edges; zoom resets when you move to another photo.
 *  - counter "3 of 12", caption, polite live announcement, video items that never autoplay.
 * `bugs` switches on deliberate mistakes for the bug hunt only.
 */

export interface LightboxBugs {
  keepZoom?: boolean;
  pastEnd?: boolean;
  zeroCounter?: boolean;
}

interface Props {
  items: Photo[];
  start: number;
  label: string;
  onClose: (index: number) => void;
  onIndexChange?: (index: number) => void;
  reducedMotion?: boolean;
  zoomButtons?: boolean;
  /** Is the full-size image for this item loaded? Defaults to always. */
  isLoaded?: (index: number) => boolean;
  blurUp?: boolean;
  bugs?: LightboxBugs;
}

type Pt = { x: number; y: number };
type Gesture =
  | { kind: 'one'; start: Pt; p0: Pt; axis: 'x' | 'y' | 'pan' | 'lock' | null; moved: boolean }
  | { kind: 'pinch'; d0: number; s0: number; local: Pt };

const MAX = 4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function Lightbox({ items, start, label, onClose, onIndexChange, reducedMotion = false, zoomButtons = true, isLoaded, blurUp = true, bugs = {} }: Props) {
  const N = items.length;
  const last = bugs.pastEnd ? N : N - 1;
  const [index, setIndex] = useState(start);
  const [view, setViewState] = useState<{ s: number; p: Pt }>({ s: 1, p: { x: 0, y: 0 } });
  const [drag, setDragState] = useState<Pt>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState('');
  const [shown, setShown] = useState(false);

  const indexRef = useRef(start);
  const viewRef = useRef(view);
  const dragRef = useRef(drag);
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const g = useRef<Gesture | null>(null);
  const lastTap = useRef<{ t: number; p: Pt } | null>(null);

  const setView = (s: number, p: Pt) => {
    viewRef.current = { s, p };
    setViewState({ s, p });
  };
  const setDrag = (p: Pt) => {
    dragRef.current = p;
    setDragState(p);
  };

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  useEffect(() => {
    onIndexChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Fake video playback: a timer, never started automatically.
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 2.5)), 250);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => {
    if (progress >= 100) setPlaying(false);
  }, [progress]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const fit = () => {
    const r = stage.current?.getBoundingClientRect();
    const it = items[indexRef.current];
    if (!r || !it) return { W: 1, H: 1, iw: 1, ih: 1, r };
    const f = Math.min(r.width / it.w, r.height / it.h);
    return { W: r.width, H: r.height, iw: it.w * f, ih: it.h * f, r };
  };
  const clampPan = (p: Pt, s: number) => {
    const { W, H, iw, ih } = fit();
    const mx = Math.max(0, (iw * s - W) / 2);
    const my = Math.max(0, (ih * s - H) / 2);
    return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
  };
  /** Zoom to s1 keeping point c (relative to the stage center) under the finger. */
  const zoomAt = (s1: number, c: Pt = { x: 0, y: 0 }) => {
    const { s: s0, p: p0 } = viewRef.current;
    const s = clamp(s1, 1, MAX);
    if (s === 1) return setView(1, { x: 0, y: 0 });
    const local = { x: (c.x - p0.x) / s0, y: (c.y - p0.y) / s0 };
    setView(s, clampPan({ x: c.x - s * local.x, y: c.y - s * local.y }, s));
  };

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to > last || to === indexRef.current) return;
      indexRef.current = to;
      setIndex(to);
      if (!bugs.keepZoom) setView(1, { x: 0, y: 0 });
      setPlaying(false);
      setProgress(0);
    },
    [last, bugs.keepZoom],
  );

  const close = () => onClose(indexRef.current);

  const rel = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, rel(e));
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const { s, p } = viewRef.current;
      const m = mid(pts[0], pts[1]);
      g.current = { kind: 'pinch', d0: Math.max(1, dist(pts[0], pts[1])), s0: s, local: { x: (m.x - p.x) / s, y: (m.y - p.y) / s } };
      setDrag({ x: 0, y: 0 });
      setDragging(true);
    } else if (pts.length === 1) {
      g.current = { kind: 'one', start: pts[0], p0: viewRef.current.p, axis: null, moved: false };
    }
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, rel(e));
    const ges = g.current;
    if (!ges) return;
    const pts = [...pointers.current.values()];
    if (ges.kind === 'pinch') {
      if (pts.length < 2) return;
      const s = clamp((ges.s0 * dist(pts[0], pts[1])) / ges.d0, 1, MAX);
      const m = mid(pts[0], pts[1]);
      setView(s, clampPan({ x: m.x - s * ges.local.x, y: m.y - s * ges.local.y }, s));
      return;
    }
    const cur = pts[0];
    const dx = cur.x - ges.start.x;
    const dy = cur.y - ges.start.y;
    if (!ges.moved && Math.hypot(dx, dy) > 8) {
      ges.moved = true;
      if (!ges.axis) ges.axis = viewRef.current.s > 1 ? 'pan' : Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      setDragging(true);
    }
    if (!ges.moved) return;
    if (ges.axis === 'pan') setView(viewRef.current.s, clampPan({ x: ges.p0.x + dx, y: ges.p0.y + dy }, viewRef.current.s));
    if (ges.axis === 'x') {
      const atEnd = (dx > 0 && indexRef.current === 0) || (dx < 0 && indexRef.current === last);
      setDrag({ x: atEnd ? dx * 0.3 : dx, y: 0 });
    }
    if (ges.axis === 'y') setDrag({ x: 0, y: Math.max(0, dy) });
  };

  const up = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = pointers.current.get(e.pointerId)!;
    pointers.current.delete(e.pointerId);
    const ges = g.current;
    if (!ges) return;
    const rest = [...pointers.current.values()];
    if (ges.kind === 'pinch') {
      if (rest.length === 1) {
        // One finger stays down: let it pan, but never turn it into a swipe.
        g.current = { kind: 'one', start: rest[0], p0: viewRef.current.p, axis: viewRef.current.s > 1 ? 'pan' : 'lock', moved: true };
      } else if (rest.length === 0) {
        g.current = null;
        setDragging(false);
        if (viewRef.current.s < 1.05) setView(1, { x: 0, y: 0 });
      }
      return;
    }
    if (rest.length > 0) return;
    g.current = null;
    setDragging(false);
    const d = dragRef.current;
    setDrag({ x: 0, y: 0 });
    if (cancelled) return;
    if (!ges.moved) {
      const now = performance.now();
      const lt = lastTap.current;
      if (lt && now - lt.t < 320 && dist(lt.p, p) < 30) {
        lastTap.current = null;
        if (viewRef.current.s > 1) setView(1, { x: 0, y: 0 });
        else zoomAt(2.5, p);
      } else {
        lastTap.current = { t: now, p };
      }
      return;
    }
    if (ges.axis === 'x') {
      if (d.x < -60) go(indexRef.current + 1);
      else if (d.x > 60) go(indexRef.current - 1);
    }
    if (ges.axis === 'y' && d.y > 90) close();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(indexRef.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(indexRef.current - 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomAt(viewRef.current.s + 1);
    } else if (e.key === '-') {
      e.preventDefault();
      zoomAt(viewRef.current.s - 1);
    } else if (e.key === 'Tab' && dialog.current) {
      const els = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')].filter((el) => !el.closest('[inert]'));
      if (els.length === 0) return;
      const first = els[0];
      const lastEl = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.current.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !dialog.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const item = items[index] as Photo | undefined;
  const shownNumber = bugs.zeroCounter ? index : index + 1;
  const slots: (Photo | null)[] = bugs.pastEnd ? [...items, null] : items;
  const anim = reducedMotion ? 'none' : undefined;
  const fade = Math.min(1, drag.y / 300);
  const btn = 'grid size-11 place-items-center rounded-full bg-white/12 text-white hover:bg-white/20 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKey}
      className="absolute inset-0 z-40 flex outline-none flex-col overflow-hidden text-white select-none"
      style={{
        background: `rgba(0,0,0,${1 - fade * 0.7})`,
        opacity: shown ? 1 : 0,
        transform: shown || reducedMotion ? 'none' : 'scale(0.96)',
        transition: anim ?? 'opacity 200ms ease, transform 200ms ease',
        colorScheme: 'dark',
      }}
    >
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-2 pt-2" style={{ opacity: 1 - fade }}>
        <button ref={closeBtn} type="button" onClick={close} aria-label="Close photo viewer" className={btn}>
          <X size={20} />
        </button>
        <p className="min-w-0 truncate text-[13px] font-semibold tabular-nums" aria-hidden="true">
          {shownNumber} of {N}
        </p>
        <button type="button" onClick={() => setToast(item ? `Share sheet: “${item.title}” + link to the listing` : 'Nothing to share')} aria-label="Share photo" className={btn}>
          <Share size={18} />
        </button>
      </div>

      <div
        ref={stage}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => up(e)}
        onPointerCancel={(e) => up(e, true)}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="flex h-full"
          style={{ transform: `translateX(calc(${-index * 100}% + ${drag.x}px))`, transition: dragging || reducedMotion ? 'none' : 'transform 280ms ease' }}
        >
          {slots.map((it, i) => {
            const current = i === index;
            const near = Math.abs(i - index) <= 1;
            const loaded = !isLoaded || isLoaded(i);
            return (
              <div key={it?.id ?? 'blank'} className="relative h-full w-full shrink-0" aria-hidden={!current} inert={!current}>
                {it && near && (
                  <div
                    className="absolute inset-0"
                    style={
                      current
                        ? {
                            transform: `translate(${view.p.x}px, ${view.p.y + drag.y}px) scale(${view.s * (1 - fade * 0.25)})`,
                            transition: dragging || reducedMotion ? 'none' : 'transform 220ms ease',
                          }
                        : undefined
                    }
                  >
                    {loaded || blurUp ? <PhotoArt photo={it} fit="contain" blur={loaded ? 0 : 10} /> : null}
                    {!loaded && (
                      <span className="absolute inset-0 grid place-items-center" role="status" aria-label="Loading photo">
                        <LoaderCircle size={28} className="animate-spin text-white/80" />
                      </span>
                    )}
                  </div>
                )}
                {it?.video && near && current && loaded && (
                  <div className="absolute inset-x-0 bottom-3 flex items-center gap-2 px-4">
                    <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause video' : `Play video, ${it.video}`} className={btn}>
                      {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/30">
                      <span className="block h-full bg-white" style={{ width: `${progress}%` }} />
                    </span>
                    <span className="text-[11px] tabular-nums">{it.video}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo" className={`${btn} absolute top-1/2 left-1.5 -translate-y-1/2`} style={{ opacity: index === 0 ? 0.3 : 1 - fade }}>
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next photo" className={`${btn} absolute top-1/2 right-1.5 -translate-y-1/2`} style={{ opacity: index === last ? 0.3 : 1 - fade }}>
          <ChevronRight size={22} />
        </button>
        {toast && (
          <p role="status" className="absolute inset-x-3 top-2 rounded-xl bg-white px-3 py-2 text-center text-[12px] font-medium text-[#111827] shadow-lg">
            {toast}
          </p>
        )}
      </div>

      <div className="relative z-10 flex shrink-0 items-end justify-between gap-2 px-3 pt-2 pb-5" style={{ opacity: 1 - fade }}>
        <p className="min-w-0 text-[12px] leading-snug text-white/90">{item?.caption ?? ''}</p>
        {zoomButtons && (
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={() => zoomAt(view.s - 1)} disabled={view.s <= 1} aria-label="Zoom out" className={btn}>
              <ZoomOut size={18} />
            </button>
            <button type="button" onClick={() => zoomAt(view.s + 1)} disabled={view.s >= MAX || !item} aria-label="Zoom in" className={btn}>
              <ZoomIn size={18} />
            </button>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {item ? `${item.title}, ${item.video ? 'video' : 'photo'} ${shownNumber} of ${N}` : ''}
      </p>
    </div>
  );
}
