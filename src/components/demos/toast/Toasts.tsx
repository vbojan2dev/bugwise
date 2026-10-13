import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

/*
 * Platform-styled toast / snackbar building blocks for the toast page.
 * Overlays are positioned `absolute` inside their own demo screen, never `fixed`.
 */

/**
 * Pausable countdown. Calls `onEnd` once when the time runs out.
 * Uses JS timers (not CSS animations) so it still works with "reduce motion" turned on.
 */
export function useCountdown(ms: number, paused: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(ms);
  const leftRef = useRef(ms);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const done = useRef(false);

  useEffect(() => {
    if (paused || done.current) return;
    const started = Date.now();
    const from = leftRef.current;
    const id = window.setInterval(() => {
      const l = Math.max(0, from - (Date.now() - started));
      leftRef.current = l;
      setLeft(l);
      if (l === 0 && !done.current) {
        done.current = true;
        window.clearInterval(id);
        endRef.current();
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [paused]);

  return left;
}

/** Thin progress bar showing remaining time. */
export function TimeBar({ left, total, color = 'currentColor' }: { left: number; total: number; color?: string }) {
  return (
    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left opacity-60" style={{ background: color, transform: `scaleX(${total ? left / total : 0})` }} />
  );
}

/* --------------------------------- Android -------------------------------- */

/** Android system Toast (Android 12+ look): small pill, optional app icon, no actions. */
export function AndroidToast({ text }: { text: string }) {
  return (
    <div className="mx-auto flex w-fit max-w-[85%] items-center gap-2 rounded-full bg-[#2d2d30] px-3 py-2 text-[13px] text-white shadow-lg">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e4572e] text-[10px] font-bold">F</span>
      <span>{text}</span>
    </div>
  );
}

/** Material 3 snackbar. */
export function Snackbar({
  text,
  action,
  onAction,
  onClose,
  scale = 1,
  wrap = true,
  children,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
  scale?: number;
  /** false = single line that clips (used by a buggy demo). */
  wrap?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-12 items-center gap-1 overflow-hidden rounded-[4px] bg-[#322f35] py-1 pr-2 pl-4 text-[#f5eff7] shadow-[0_4px_12px_rgba(0,0,0,.3)]">
      <span className={`flex-1 py-2 ${wrap ? '' : 'overflow-hidden whitespace-nowrap'}`} style={{ fontSize: 14 * scale, lineHeight: 1.35 }}>
        {text}
      </span>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="h-10 shrink-0 rounded-full px-3 font-medium text-[#d0bcff] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d0bcff]"
          style={{ fontSize: 14 * scale }}
        >
          {action}
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d0bcff]">
          <X size={18} />
        </button>
      )}
      {children}
    </div>
  );
}

/* ----------------------------------- iOS ---------------------------------- */

/** iOS-style HUD (the "Added to Library" square). Not a public API: apps build it themselves. */
export function IOSHud({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div
      className="mx-auto flex size-[150px] flex-col items-center justify-center gap-3 rounded-[22px] px-3 text-center text-[15px] font-semibold text-[#3c3c43]"
      style={{ background: 'rgba(235,235,240,.94)', boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}
    >
      {icon}
      {text}
    </div>
  );
}

/** Custom iOS in-app banner that slides from the top (looks like a notification). */
export function IOSBanner({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mx-2 flex items-center gap-3 rounded-[20px] px-3 py-2.5 text-black" style={{ background: 'rgba(250,250,252,.97)', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
      <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#34c759] text-white">
        <CheckCircle2 size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="block truncate text-[13px] text-[#3c3c43]/70">{text}</span>
      </span>
      {action && (
        <button type="button" onClick={onAction} className="shrink-0 rounded-full bg-[#007aff]/10 px-3 py-1.5 text-[13px] font-semibold text-[#007aff] focus-visible:outline-2 focus-visible:outline-[#007aff]">
          {action}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------- Web ---------------------------------- */

const kinds = {
  success: { icon: CheckCircle2, color: '#079455' },
  error: { icon: AlertCircle, color: '#d92d20' },
  info: { icon: Info, color: '#2f6bff' },
};

export function WebToast({
  kind = 'success',
  title,
  text,
  action,
  onAction,
  onClose,
  children,
}: {
  kind?: keyof typeof kinds;
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const K = kinds[kind];
  return (
    <div className="relative flex w-full items-start gap-2.5 overflow-hidden rounded-xl border border-[#e4e7ec] bg-white p-3 text-[#0e1120] shadow-[0_12px_24px_-8px_rgba(16,24,40,.2)]">
      <K.icon size={18} className="mt-0.5 shrink-0" style={{ color: K.color }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{title}</p>
        {text && <p className="mt-0.5 text-[12px] text-[#4a4f60]">{text}</p>}
        {action && (
          <button type="button" onClick={onAction} className="mt-1.5 text-[12px] font-semibold text-[#2f6bff] hover:underline focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
            {action}
          </button>
        )}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close notification" className="-m-1 grid size-7 shrink-0 place-items-center rounded-md text-[#6b7080] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
          <X size={15} />
        </button>
      )}
      {children}
    </div>
  );
}

/* --------------------------- Static illustrations -------------------------- */

/** A small static phone-like screen with a list behind, for comparisons. Decorative. */
export function StaticScreen({ label, children, placement = 'bottom', height = 200 }: { label: string; children?: ReactNode; placement?: 'bottom' | 'top' | 'center' | 'inline'; height?: number }) {
  const pos = { bottom: 'items-end pb-3', top: 'items-start pt-3', center: 'items-center', inline: 'items-start pt-10' }[placement];
  return (
    <div role="img" aria-label={label} className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[18px] border border-black/10 bg-white" style={{ height }}>
      <div aria-hidden="true" className="space-y-2 p-3">
        <div className="h-3 w-24 rounded bg-black/15" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-black/[0.04] p-2">
            <div className="size-7 rounded-md bg-black/10" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-3/4 rounded bg-black/15" />
              <div className="h-2 w-1/2 rounded bg-black/10" />
            </div>
          </div>
        ))}
      </div>
      {children && (
        <div inert className={`absolute inset-0 flex px-3 ${pos}`}>
          <div className="w-full">{children}</div>
        </div>
      )}
    </div>
  );
}

/** Inline form error (the right tool for validation errors). */
export function InlineFieldError({ label, value, error }: { label: string; value: string; error: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <p className="text-[12px] font-medium text-[#30354a]">{label}</p>
      <div className="mt-1 flex h-9 items-center rounded-lg border-2 border-[#d92d20] px-3 text-[13px] text-[#0e1120]">{value}</div>
      <p className="mt-1 flex items-center gap-1 text-[12px] text-[#b42318]">
        <AlertCircle size={13} /> {error}
      </p>
    </div>
  );
}
