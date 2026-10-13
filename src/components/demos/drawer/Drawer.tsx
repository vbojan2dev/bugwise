import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/* A correct Material 3 modal navigation drawer, contained in its demo frame (absolute, never fixed). */

export const MD = {
  primary: '#6750a4',
  surface: '#fef7ff',
  drawer: '#f7f2fa',
  indicator: '#e8def8',
  onIndicator: '#1d192b',
  onSurface: '#1d1b20',
  variant: '#49454f',
  outline: '#cac4d0',
};

export interface DrawerItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section?: string;
}

export type CloseHow = 'scrim' | 'swipe' | 'esc' | 'select' | 'back';

export function DrawerList({ items, current, onSelect, headline, labelId }: { items: DrawerItem[]; current: string; onSelect: (id: string) => void; headline?: string; labelId?: string }) {
  return (
    <>
      {headline && (
        <p id={labelId} className="px-4 pt-4 pb-3 text-[14px] font-medium" style={{ color: MD.variant }}>
          {headline}
        </p>
      )}
      <ul className="px-3">
        {items.map((it) => {
          const sel = it.id === current;
          return (
            <li key={it.id}>
              {it.section && (
                <>
                  <div className="mx-1 my-2 h-px" style={{ background: MD.outline }} />
                  <p className="px-4 pt-2 pb-2 text-[13px] font-medium" style={{ color: MD.variant }}>
                    {it.section}
                  </p>
                </>
              )}
              <button
                type="button"
                data-drawer-item={it.id}
                aria-current={sel ? 'page' : undefined}
                onClick={() => onSelect(it.id)}
                className="flex h-12 w-full items-center gap-3 rounded-full px-4 text-left text-[14px] font-medium outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-[#6750a4]"
                style={{ background: sel ? MD.indicator : undefined, color: sel ? MD.onIndicator : MD.variant }}
              >
                <it.icon size={20} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.badge ? (
                  <span className="text-[12px]">
                    {it.badge}
                    <span className="sr-only"> unread</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Modal drawer with scrim, swipe-to-close, Esc, focus trap and focus-in on open.
 * The parent handles returning focus (via onClose) because only it knows the trigger.
 */
export function ModalDrawer({
  open,
  onClose,
  label,
  children,
  width = '80%',
}: {
  open: boolean;
  onClose: (how: CloseHow) => void;
  label: string;
  children: ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const [dx, setDx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const p = panel.current;
      if (!p) return;
      const cur = p.querySelector<HTMLElement>('[aria-current="page"]') ?? p.querySelector<HTMLElement>('button, a[href]');
      cur?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose('esc');
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'));
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { x: e.clientX, id: e.pointerId };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const m = Math.min(0, e.clientX - d.x);
    if (m < -8 && !panel.current?.hasPointerCapture(d.id)) panel.current?.setPointerCapture(d.id);
    setDx(m);
  };
  const up = () => {
    const was = dx;
    drag.current = null;
    setDx(0);
    if (was < -60) onClose('swipe');
  };

  return (
    <div className="absolute inset-0 z-40 overflow-hidden" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div className="absolute inset-0 bg-black transition-opacity duration-200" style={{ opacity: open ? 0.32 : 0 }} onClick={() => onClose('scrim')} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onKeyDown}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="absolute inset-y-0 left-0 overflow-y-auto overscroll-contain rounded-r-2xl pb-6 shadow-xl"
        style={{
          width,
          maxWidth: 300,
          background: MD.drawer,
          color: MD.onSurface,
          touchAction: 'pan-y',
          transform: open ? `translateX(${dx}px)` : 'translateX(-105%)',
          transition: dx ? 'none' : open ? 'transform .25s ease-out' : 'transform .2s ease-in, visibility 0s linear .2s',
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
