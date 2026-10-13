import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

/**
 * Horizontal pager (like Android's ViewPager / HorizontalPager): swipe the content left or right
 * to change tabs. All pages stay mounted, so each one keeps its own scroll position and state.
 */
export function Pager({ index, onIndexChange, pages, className = '' }: { index: number; onIndexChange: (i: number) => void; pages: ReactNode[]; className?: string }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const g = useRef<{ x: number; y: number; t: number; axis: 'x' | 'y' | null; id: number } | null>(null);
  const moved = useRef(false);

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
      if (s.axis === 'x') {
        box.current?.setPointerCapture(s.id);
        setDragging(true);
        moved.current = true;
      }
    }
    if (s.axis !== 'x') return;
    // Resist at the edges.
    const atEdge = (index === 0 && mx > 0) || (index === pages.length - 1 && mx < 0);
    setDx(atEdge ? mx / 3 : mx);
  };
  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s || s.axis !== 'x') return;
    window.setTimeout(() => (moved.current = false), 0);
    const w = box.current?.clientWidth ?? 300;
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.5;
    let next = index;
    if (dx < -w * 0.25 || (fast && dx < -20)) next = Math.min(pages.length - 1, index + 1);
    if (dx > w * 0.25 || (fast && dx > 20)) next = Math.max(0, index - 1);
    setDragging(false);
    setDx(0);
    if (next !== index) onIndexChange(next);
  };

  return (
    <div
      ref={box}
      className={`relative min-h-0 overflow-hidden select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={(e) => {
        if (moved.current) {
          e.stopPropagation();
          e.preventDefault();
          moved.current = false;
        }
      }}
    >
      <div className="flex h-full" style={{ transform: `translateX(calc(${-index * 100}% + ${dx}px))`, transition: dragging ? 'none' : 'transform .28s cubic-bezier(.2,0,0,1)' }}>
        {pages.map((p, i) => (
          <div key={i} className="h-full w-full shrink-0" aria-hidden={i !== index || undefined} inert={i !== index}>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}
