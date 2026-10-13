import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';

/*
 * A correct, reusable bottom sheet for the Bottom Sheet page.
 * It is positioned `absolute` inside its demo frame (never `fixed`).
 *
 * - Detents: heights as fractions of the frame (e.g. [0.5, 0.92] = medium + large).
 * - Drag the handle / header to move between detents; drag below the lowest detent to dismiss.
 * - Nested scrolling: dragging the content scrolls it; only when the list is at the top
 *   does a downward drag move the sheet (and an upward drag expands it until the top detent).
 * - Modal sheets: scrim (tap = cancel), focus moves in, Tab is trapped, Esc closes, focus returns.
 * - Standard (non-modal) sheets: no scrim, the page behind stays usable, not dismissible.
 */

export type CloseHow = 'swipe' | 'scrim' | 'esc' | 'button';
export type SheetVariant = 'ios' | 'material' | 'web';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export interface SheetProps {
  id: string;
  title: string;
  /** Show the title as a header row. Set false when `header` renders its own title with id `${id}-title`. */
  showTitle?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  variant?: SheetVariant;
  detents?: number[];
  detentLabels?: string[];
  initialDetent?: number;
  modal?: boolean;
  dismissible?: boolean;
  /** Called after the close animation. */
  onClose?: (how: CloseHow) => void;
  onDetentChange?: (index: number, label: string) => void;
  /** Extra space at the bottom, e.g. the on-screen keyboard height. */
  bottomInset?: number;
  returnFocus?: RefObject<HTMLElement | null>;
  /** Imperative close trigger from inside (e.g. a Done button): pass a function receiving `close`. */
  closeRef?: RefObject<((how: CloseHow) => void) | null>;
  /** Show a grabber / drag handle. */
  handle?: boolean;
  /** Called when the user tries to dismiss; return false to block (e.g. unsaved changes). */
  onBeforeDismiss?: (how: CloseHow) => boolean;
  /** 'nested' (correct): content scrolls first. 'sheet': any drag on the content moves the sheet (a common bug). */
  contentDrag?: 'nested' | 'sheet';
}

const LOOK: Record<SheetVariant, { bg: string; fg: string; radius: number; grabber: string; gw: number; gh: number }> = {
  ios: { bg: '#ffffff', fg: '#000000', radius: 16, grabber: 'rgba(60,60,67,.3)', gw: 36, gh: 5 },
  material: { bg: '#f7f2fa', fg: '#1d1b20', radius: 28, grabber: 'rgba(121,116,126,.6)', gw: 32, gh: 4 },
  web: { bg: '#ffffff', fg: '#0e1120', radius: 16, grabber: 'rgba(0,0,0,.2)', gw: 40, gh: 4 },
};

export function Sheet({
  id,
  title,
  showTitle = true,
  header,
  footer,
  children,
  variant = 'ios',
  detents = [0.5, 0.92],
  detentLabels,
  initialDetent = 0,
  modal = true,
  dismissible = true,
  onClose,
  onDetentChange,
  bottomInset = 0,
  returnFocus,
  closeRef,
  handle = true,
  onBeforeDismiss,
  contentDrag = 'nested',
}: SheetProps) {
  const look = LOOK[variant];
  const labels = detentLabels ?? detents.map((d, i) => (detents.length === 1 ? 'open' : i === detents.length - 1 ? 'large' : i === 0 ? 'medium' : `step ${i + 1}`));
  const [idx, setIdx] = useState(initialDetent);
  const [drag, setDragState] = useState(0); // px, positive = pulled down
  const [dragging, setDraggingState] = useState(false);
  // Refs mirror the state so pointer handlers never read a stale value between renders.
  const dragRef = useRef(0);
  const draggingRef = useRef(false);
  const setDrag = (v: number) => {
    dragRef.current = v;
    setDragState(v);
  };
  const setDragging = (v: boolean) => {
    draggingRef.current = v;
    setDraggingState(v);
  };
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const g = useRef<{ y: number; t: number; mode: 'sheet' | 'scroll' | null; top0: number; base: number; id: number; src: 'handle' | 'content' } | null>(null);
  const suppressClick = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20);
    timers.current.push(t);
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  // Focus moves into a modal sheet when it opens.
  useEffect(() => {
    if (entered && modal) sheet.current?.focus({ preventScroll: true });
  }, [entered, modal]);

  const finishClose = (how: CloseHow) => {
    setClosing(true);
    timers.current.push(
      window.setTimeout(() => {
        onClose?.(how);
        // Wait for the page behind to become interactive (not inert) again.
        const el = returnFocus?.current;
        window.setTimeout(() => el?.focus({ preventScroll: true }), 30);
      }, 240),
    );
  };

  const requestClose = (how: CloseHow) => {
    if (closing) return;
    if (how !== 'button' && !dismissible) return;
    if (onBeforeDismiss && !onBeforeDismiss(how)) {
      setDrag(0);
      return;
    }
    finishClose(how);
  };
  if (closeRef) closeRef.current = requestClose;

  const frameH = () => root.current?.clientHeight ?? 500;

  const settle = (dy: number, startT: number) => {
    const H = frameH();
    const current = detents[idx] * H - dy;
    const v = dy / Math.max(1, Date.now() - startT); // px per ms, positive = down
    const lowest = detents[0] * H;
    if (dismissible && (current < lowest * 0.6 || (v > 0.9 && idx === 0 && dy > 30))) {
      setDrag(0);
      requestClose('swipe');
      return;
    }
    let best = 0;
    detents.forEach((d, i) => {
      if (Math.abs(d * H - current) < Math.abs(detents[best] * H - current)) best = i;
    });
    if (Math.abs(v) > 0.6) best = Math.max(0, Math.min(detents.length - 1, v < 0 ? idx + 1 : idx - 1));
    setDrag(0);
    if (best !== idx) {
      setIdx(best);
      onDetentChange?.(best, labels[best]);
    }
  };

  const onDown = (src: 'handle' | 'content') => (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (src === 'content' && target.closest('input, textarea, select')) return;
    g.current = { y: e.clientY, t: Date.now(), mode: src === 'handle' ? 'sheet' : null, top0: scroller.current?.scrollTop ?? 0, base: e.clientY, id: e.pointerId, src };
    suppressClick.current = false;
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (!draggingRef.current && Math.abs(dy) < 6) return;
    if (!s.mode) {
      const atTop = (scroller.current?.scrollTop ?? 0) <= 0;
      const atMax = idx === detents.length - 1;
      s.mode = contentDrag === 'sheet' || (dy > 0 && atTop) || (dy < 0 && !atMax) ? 'sheet' : 'scroll';
      s.base = e.clientY;
      s.t = Date.now();
    }
    if (!draggingRef.current) {
      e.currentTarget.setPointerCapture(s.id);
      setDragging(true);
      suppressClick.current = true;
    }
    if (s.mode === 'sheet') {
      const d = e.clientY - s.base;
      // Rubber band above the top detent.
      const H = frameH();
      const maxUp = (detents[detents.length - 1] - detents[idx]) * H;
      setDrag(d < -maxUp ? -maxUp + (d + maxUp) / 4 : d);
    } else if (scroller.current) {
      scroller.current.scrollTop = s.top0 - (e.clientY - s.y);
    }
  };

  const onUp = () => {
    const s = g.current;
    g.current = null;
    if (!draggingRef.current) return;
    setDragging(false);
    // The click that follows a drag is swallowed by the capture handlers, then we reset.
    timers.current.push(window.setTimeout(() => (suppressClick.current = false), 0));
    if (s?.mode === 'sheet') settle(dragRef.current, s.t);
  };

  const cycle = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const next = idx < detents.length - 1 ? idx + 1 : 0;
    setIdx(next);
    onDetentChange?.(next, labels[next]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && modal) {
      e.stopPropagation();
      requestClose('esc');
      return;
    }
    if (e.key === 'Tab' && modal && sheet.current) {
      const items = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const shown = entered && !closing;
  const frac = detents[idx];
  const height = `min(calc(${(frac * 100).toFixed(2)}% - ${drag}px), calc(100% - ${bottomInset + 8}px))`;

  return (
    <div ref={root} className={`absolute inset-0 z-40 overflow-hidden ${modal ? '' : 'pointer-events-none'}`} onKeyDown={onKeyDown}>
      {modal && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black"
          style={{ opacity: shown ? (variant === 'material' ? 0.32 : 0.25) : 0, transition: 'opacity .24s' }}
          onClick={() => requestClose('scrim')}
        />
      )}
      <div
        ref={sheet}
        id={id}
        role={modal ? 'dialog' : 'region'}
        aria-modal={modal || undefined}
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className="pointer-events-auto absolute inset-x-0 flex flex-col outline-none"
        style={{
          bottom: bottomInset,
          height,
          background: look.bg,
          color: look.fg,
          colorScheme: 'light',
          borderRadius: `${look.radius}px ${look.radius}px 0 0`,
          boxShadow: '0 -2px 16px rgba(0,0,0,.14)',
          transform: shown ? 'translateY(0)' : 'translateY(105%)',
          transition: dragging ? 'transform .24s' : 'height .28s cubic-bezier(.2,0,0,1), transform .24s cubic-bezier(.2,0,0,1), bottom .25s',
        }}
      >
        <div className="shrink-0 touch-none select-none" onPointerDown={onDown('handle')} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {handle && (
            <div className="flex justify-center" style={{ paddingTop: variant === 'material' ? 16 : 6, paddingBottom: variant === 'material' ? 8 : 4 }}>
              {detents.length > 1 ? (
                <button
                  type="button"
                  onClick={cycle}
                  aria-label={`Sheet size: ${labels[idx]}. Activate to ${idx < detents.length - 1 ? 'expand' : 'collapse'}.`}
                  className="grid h-6 w-12 cursor-grab place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
                >
                  <span className="block rounded-full" style={{ width: look.gw, height: look.gh, background: look.grabber }} />
                </button>
              ) : (
                <span aria-hidden="true" className="my-2.5 block rounded-full" style={{ width: look.gw, height: look.gh, background: look.grabber }} />
              )}
            </div>
          )}
          {header}
          {showTitle && !header && (
            <p id={`${id}-title`} className="px-5 pt-1 pb-2 text-[17px] font-semibold">
              {title}
            </p>
          )}
        </div>
        <div
          ref={scroller}
          className="min-h-0 flex-1 touch-none overflow-y-auto overscroll-contain"
          onPointerDown={onDown('content')}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              e.stopPropagation();
              e.preventDefault();
              suppressClick.current = false;
            }
          }}
        >
          {children}
        </div>
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
