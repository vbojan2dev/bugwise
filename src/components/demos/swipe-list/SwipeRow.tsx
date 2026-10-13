import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/*
 * A correct swipeable list row, used by the gallery and the playground.
 * - Pointer Events, so it works with a finger, a pen and a mouse (drag).
 * - Direction lock: after 8 px the row decides "horizontal = swipe" or "vertical = scroll" and ignores the other.
 *   `touch-action: pan-y` lets the browser keep handling vertical scrolling on touch screens.
 * - Reveal mode: a short swipe snaps open to show buttons; full swipe (optional) triggers the outermost action.
 * - Dismiss mode (Gmail style): no buttons, the background shows what will happen; past 40% the action fires.
 * - Tapping an open row closes it instead of opening the item. Escape closes it too.
 * - The action buttons are real buttons in the DOM. Tabbing to one reveals the row, so keyboard users get the same actions.
 * The parent owns `open`, so it can keep only one row open at a time.
 */

export type Side = 'leading' | 'trailing';

export interface SwipeAction {
  key: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  fg?: string;
}

interface Props {
  label: string;
  leading?: SwipeAction[];
  trailing?: SwipeAction[];
  open: Side | null;
  onOpenChange: (side: Side | null) => void;
  /** Called when a horizontal swipe starts, so the parent can close other rows. */
  onDragStart?: () => void;
  onAction: (key: string) => void;
  onTap?: () => void;
  fullSwipe?: boolean;
  mode?: 'reveal' | 'dismiss';
  actionWidth?: number;
  /** Called when the swipe crosses the "point of no return" (where a real app plays a haptic tick). */
  onHaptic?: () => void;
  contentClassName?: string;
  actionTextClassName?: string;
  children: ReactNode;
}

interface Gesture {
  pid: number;
  x: number;
  y: number;
  base: number;
  width: number;
  lock: 'h' | 'v' | null;
  armed: boolean;
}

const SLOP = 8;

export function SwipeRow({
  label,
  leading = [],
  trailing = [],
  open,
  onOpenChange,
  onDragStart,
  onAction,
  onTap,
  fullSwipe = false,
  mode = 'reveal',
  actionWidth = 72,
  onHaptic,
  contentClassName = 'bg-white',
  actionTextClassName = 'text-[12px]',
  children,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const g = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const commitTimer = useRef<number | undefined>(undefined);
  const [drag, setDragState] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const setDrag = (v: number | null) => {
    dragRef.current = v;
    setDragState(v);
  };
  const [armed, setArmed] = useState(false);
  const [committing, setCommitting] = useState(false);

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const leadW = mode === 'reveal' ? leading.length * actionWidth : 0;
  const trailW = mode === 'reveal' ? trailing.length * actionWidth : 0;
  const base = open === 'trailing' ? -trailW : open === 'leading' ? leadW : 0;
  const offset = drag ?? base;

  const armAt = (width: number, sideW: number) => (mode === 'dismiss' ? width * 0.4 : Math.max(width * 0.55, sideW + 48));

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (committing || g.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    suppressClick.current = false;
    g.current = { pid: e.pointerId, x: e.clientX, y: e.clientY, base, width: root.current?.offsetWidth ?? 300, lock: null, armed: false };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    const dx = e.clientX - cur.x;
    const dy = e.clientY - cur.y;
    if (!cur.lock) {
      if (Math.hypot(dx, dy) < SLOP) return;
      cur.lock = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (cur.lock === 'h') {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone */
        }
        onDragStart?.();
      }
    }
    if (cur.lock !== 'h') return;

    let next = cur.base + dx;
    const hasLead = leading.length > 0;
    const hasTrail = trailing.length > 0;
    if (!hasLead) next = Math.min(next, 0);
    if (!hasTrail) next = Math.max(next, 0);
    const canFull = mode === 'dismiss' || fullSwipe;
    // Rubber band past the buttons when full swipe is off.
    if (!canFull) {
      if (next < -trailW) next = -trailW + (next + trailW) * 0.25;
      if (next > leadW) next = leadW + (next - leadW) * 0.25;
    }
    next = Math.max(-cur.width, Math.min(cur.width, next));
    setDrag(next);

    const isArmed = canFull && (next < 0 ? -next >= armAt(cur.width, trailW) : next >= armAt(cur.width, leadW)) && next !== 0;
    if (isArmed !== cur.armed) {
      cur.armed = isArmed;
      setArmed(isArmed);
      if (isArmed) onHaptic?.();
    }
  };

  const finish = (canceled: boolean) => {
    const cur = g.current;
    g.current = null;
    if (!cur || cur.lock !== 'h') return;
    suppressClick.current = true;
    const o = dragRef.current ?? cur.base;
    setArmed(false);
    if (canceled) {
      setDrag(null);
      return;
    }
    if (cur.armed) {
      const action = o < 0 ? trailing[0] : leading[0];
      setCommitting(true);
      setDrag(o < 0 ? -cur.width : cur.width);
      commitTimer.current = window.setTimeout(() => {
        setCommitting(false);
        setDrag(null);
        onOpenChange(null);
        onAction(action.key);
      }, 220);
      return;
    }
    setDrag(null);
    if (mode === 'dismiss') {
      onOpenChange(null);
    } else if (o < -trailW / 2 && trailW > 0) {
      onOpenChange('trailing');
    } else if (o > leadW / 2 && leadW > 0) {
      onOpenChange('leading');
    } else {
      onOpenChange(null);
    }
  };

  const onClickCapture = (e: ReactMouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onContentClick = () => {
    if (open) {
      onOpenChange(null);
      return;
    }
    onTap?.();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      onOpenChange(null);
    }
  };

  const dragging = drag !== null && !committing;
  const transition = dragging ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1), width 220ms cubic-bezier(.2,.8,.2,1)';

  const renderActions = (side: Side, actions: SwipeAction[], width: number) => (
    <div
      className={`absolute inset-y-0 flex overflow-hidden ${side === 'leading' ? 'left-0' : 'right-0 flex-row-reverse'}`}
      style={{ width: Math.max(0, width), transition: dragging ? 'none' : 'width 220ms cubic-bezier(.2,.8,.2,1)' }}
    >
      {actions.map((a, i) => {
        const grow = armed ? (i === 0 ? '1 0 auto' : '0 0 0px') : '1 1 0px';
        return (
          <button
            key={a.key}
            type="button"
            aria-label={`${a.label}: ${label}`}
            onFocus={() => {
              if (open !== side) onOpenChange(side);
            }}
            onClick={() => {
              onOpenChange(null);
              onAction(a.key);
            }}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${actionTextClassName}`}
            style={{ flex: grow, background: a.bg, color: a.fg ?? '#fff', transition: dragging ? 'none' : 'flex 160ms ease' }}
          >
            <a.icon size={18} aria-hidden="true" />
            {a.label}
          </button>
        );
      })}
    </div>
  );

  const dismissBg = () => {
    if (offset === 0) return null;
    const a = offset < 0 ? trailing[0] : leading[0];
    if (!a) return null;
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center px-5 ${offset < 0 ? 'justify-end' : 'justify-start'}`}
        style={{ background: armed || committing ? a.bg : '#c4c7c5', color: '#fff', transition: 'background 150ms' }}
      >
        <a.icon size={22} style={{ transform: armed || committing ? 'scale(1.15)' : undefined, transition: 'transform 150ms' }} />
      </div>
    );
  };

  return (
    <div ref={root} className="relative overflow-hidden" onKeyDown={onKeyDown}>
      {mode === 'reveal' ? (
        <>
          {leading.length > 0 && renderActions('leading', leading, offset)}
          {trailing.length > 0 && renderActions('trailing', trailing, -offset)}
        </>
      ) : (
        dismissBg()
      )}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => finish(false)}
        onPointerCancel={() => finish(true)}
        onClickCapture={onClickCapture}
        onClick={onContentClick}
        onKeyDown={(e) => {
          if (onTap && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
            e.preventDefault();
            onContentClick();
          }
        }}
        role={onTap ? 'button' : undefined}
        tabIndex={onTap ? 0 : undefined}
        aria-label={onTap ? label : undefined}
        className={`relative select-none outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-inset ${contentClassName}`}
        style={{ transform: `translateX(${offset}px)`, transition, touchAction: 'pan-y', WebkitUserSelect: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
