import { useEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

/**
 * A correct, accessible carousel (based on the WAI-ARIA APG carousel pattern).
 * - region with aria-roledescription="carousel" and a label; each slide is a group "3 of 5"
 * - autoplay pauses on hover and on keyboard focus, and has a visible Pause/Play button (WCAG 2.2.2)
 * - manual navigation stops autoplay; reduced motion starts paused and removes the slide animation
 * - swipe with mouse or touch (pointer events, axis lock, touch-action: pan-y so vertical page scroll still works)
 * - optional seamless looping using clone slides; dots have 44 px tall, 24 px wide hit areas
 */

const DURATION = 350;

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

export interface CarouselProps {
  label: string;
  count: number;
  renderSlide: (i: number) => ReactNode;
  slideName?: (i: number) => string;
  loop?: boolean;
  autoplay?: boolean;
  interval?: number;
  reducedMotion?: boolean;
  showTargets?: boolean;
  arrows?: boolean;
  counter?: boolean;
  aspect?: string;
  onIndexChange?: (i: number) => void;
  onStatus?: (s: string) => void;
  dotColor?: string;
}

export function Carousel({
  label,
  count,
  renderSlide,
  slideName,
  loop = false,
  autoplay = false,
  interval = 5000,
  reducedMotion,
  showTargets = false,
  arrows = true,
  counter = false,
  aspect = '16 / 9',
  onIndexChange,
  onStatus,
  dotColor = '#1d4ed8',
}: CarouselProps) {
  const sysReduce = usePrefersReducedMotion();
  const reduce = reducedMotion ?? sysReduce;
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [userPaused, setUserPaused] = useState(reduce);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const busy = useRef(false);
  const snapTimer = useRef<number | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const g = useRef<{ x: number; y: number; t: number; axis: 'x' | 'y' | null; id: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => setUserPaused(reduce), [reduce]);
  useEffect(() => () => clearTimeout(snapTimer.current), []);

  const running = autoplay && !userPaused && !hover && !focusIn && !dragging;
  const status = !autoplay
    ? 'Autoplay off'
    : userPaused
      ? 'Paused (by the user or reduced motion)'
      : hover
        ? 'Paused while the pointer is over it'
        : focusIn
          ? 'Paused while keyboard focus is inside'
          : dragging
            ? 'Paused while dragging'
            : 'Playing';

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  const goTo = (target: number, dir: -1 | 0 | 1) => {
    if (busy.current) return;
    let t = target;
    if (!loop) {
      t = Math.max(0, Math.min(count - 1, target));
      if (t === index) {
        setAnimate(true);
        setPos(t);
        return;
      }
    } else t = ((target % count) + count) % count;
    setIndex(t);
    onIndexChange?.(t);
    if (!loop) {
      setAnimate(!reduce);
      setPos(t);
      return;
    }
    const wrapFwd = dir === 1 && index === count - 1 && t === 0;
    const wrapBack = dir === -1 && index === 0 && t === count - 1;
    if (reduce || (!wrapFwd && !wrapBack)) {
      setAnimate(!reduce);
      setPos(t + 1);
      return;
    }
    // Seamless loop: slide onto the clone, then jump (without animation) to the real slide.
    busy.current = true;
    setAnimate(true);
    setPos(wrapFwd ? count + 1 : 0);
    snapTimer.current = window.setTimeout(() => {
      setAnimate(false);
      setPos(wrapFwd ? 1 : count);
      busy.current = false;
    }, DURATION + 30);
  };

  // Autoplay: a fresh full interval for every slide.
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => goTo(index + 1, 1), interval);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, index, interval]);

  const manual = (target: number, dir: -1 | 0 | 1) => {
    if (autoplay) setUserPaused(true); // the user took control: don't take it back
    goTo(target, dir);
  };

  /* ---- swipe (mouse + touch) ---- */
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    g.current = { x: e.clientX, y: e.clientY, t: Date.now(), axis: null, id: e.pointerId };
    moved.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      s.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (s.axis === 'y') {
        g.current = null; // vertical: let the page scroll
        return;
      }
      box.current?.setPointerCapture(s.id);
      setDragging(true);
      moved.current = true;
    }
    const atEdge = !loop && ((index === 0 && mx > 0) || (index === count - 1 && mx < 0));
    setDx(atEdge ? mx / 3 : mx);
  };
  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s || s.axis !== 'x') return;
    window.setTimeout(() => (moved.current = false), 0);
    const w = box.current?.clientWidth ?? 300;
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.5;
    setDragging(false);
    setDx(0);
    if (dx < -w * 0.2 || (fast && dx < -20)) manual(index + 1, 1);
    else if (dx > w * 0.2 || (fast && dx > 20)) manual(index - 1, -1);
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false);
  };

  const order = loop ? [count - 1, ...Array.from({ length: count }, (_, i) => i), 0] : Array.from({ length: count }, (_, i) => i);
  const transition = animate && !dragging && !reduce ? `transform ${DURATION}ms ease` : 'none';
  const target = showTargets ? 'outline-2 outline-dashed outline-[#e11d48] -outline-offset-2' : '';
  const name = (i: number) => slideName?.(i) ?? `Slide ${i + 1}`;
  const arrowBtn = `absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#0e1120] shadow-md outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1d4ed8] disabled:opacity-0 ${target}`;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative w-full min-w-0"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
      onFocus={() => setFocusIn(true)}
      onBlur={onBlur}
    >
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: aspect }}>
        {autoplay && (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? 'Start automatic slide show' : 'Stop automatic slide show'}
            className={`absolute bottom-2 left-2 z-10 grid size-11 place-items-center rounded-full bg-black/55 text-white outline-none hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white ${target}`}
          >
            {userPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
          </button>
        )}
        {arrows && (
          <>
            <button type="button" onClick={() => manual(index - 1, -1)} disabled={!loop && index === 0} aria-label="Previous slide" className={`${arrowBtn} left-2`}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => manual(index + 1, 1)} disabled={!loop && index === count - 1} aria-label="Next slide" className={`${arrowBtn} right-2`}>
              <ChevronRight size={20} />
            </button>
          </>
        )}
        {counter && (
          <span className="absolute top-2 right-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white" aria-hidden="true">
            {index + 1} / {count}
          </span>
        )}
        <div
          ref={box}
          className="h-full touch-pan-y select-none"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            g.current = null;
            setDragging(false);
            setDx(0);
          }}
          onClickCapture={(e) => {
            if (moved.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="flex h-full" aria-live={running ? 'off' : 'polite'} style={{ transform: `translateX(calc(${-pos * 100}% + ${dx}px))`, transition }}>
            {order.map((i, k) => {
              const clone = loop && (k === 0 || k === order.length - 1);
              const current = !clone && i === index;
              return (
                <div
                  key={clone ? `clone-${k}` : i}
                  role={clone ? undefined : 'group'}
                  aria-roledescription={clone ? undefined : 'slide'}
                  aria-label={clone ? undefined : `${i + 1} of ${count}`}
                  aria-hidden={!current}
                  inert={!current}
                  className="h-full w-full shrink-0"
                >
                  {renderSlide(i)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-center">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => manual(i, i > index ? 1 : -1)}
            aria-label={`${name(i)}, slide ${i + 1} of ${count}`}
            aria-current={i === index ? 'true' : undefined}
            className={`group grid h-11 w-6 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] ${target}`}
          >
            <span className="block h-2 rounded-full transition-all" style={{ width: i === index ? 18 : 8, background: i === index ? dotColor : '#9ca3af' }} />
          </button>
        ))}
      </div>
    </section>
  );
}
