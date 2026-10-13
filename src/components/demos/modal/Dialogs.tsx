import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/*
 * Platform-styled dialog building blocks used across the modal page.
 * Every overlay is positioned with `absolute` inside its own demo screen, never `fixed`,
 * so it can only cover the demo it belongs to.
 */

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusables(root: HTMLElement | null) {
  return root ? ([...root.querySelectorAll(FOCUSABLE)] as HTMLElement[]) : [];
}

/** Tab / Shift+Tab wrap-around inside `root`. Returns true when it handled the key. */
export function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== 'Tab') return false;
  const els = focusables(root);
  if (!els.length) return false;
  const first = els[0];
  const last = els[els.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !root?.contains(active))) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

/**
 * An accessible, contained modal layer: scrim + positioned panel.
 * Moves focus in on open, traps Tab, closes on Esc, and returns focus to `returnTo` on close.
 */
export function Layer({
  open,
  onClose,
  children,
  placement = 'center',
  dismissOnScrim = true,
  dismissOnEsc = true,
  scrim = 'rgba(0,0,0,.4)',
  returnTo,
}: {
  open: boolean;
  /** Called on Esc or a scrim click, with the reason. */
  onClose: (reason: 'esc' | 'scrim') => void;
  children: ReactNode;
  placement?: 'center' | 'bottom' | 'full';
  dismissOnScrim?: boolean;
  dismissOnEsc?: boolean;
  scrim?: string;
  returnTo?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const root = ref.current;
      const target = root?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0];
      target?.focus({ preventScroll: true });
    }, 20);
    const back = returnTo?.current;
    return () => {
      window.clearTimeout(t);
      back?.focus({ preventScroll: true });
    };
  }, [open, returnTo]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && dismissOnEsc) {
      e.stopPropagation();
      onClose('esc');
      return;
    }
    trapTab(e, ref.current);
  };

  const pos = placement === 'center' ? 'items-center justify-center p-5' : placement === 'bottom' ? 'items-end justify-center' : 'items-stretch justify-stretch';

  return (
    <div ref={ref} className={`absolute inset-0 z-40 flex ${pos}`} onKeyDown={onKeyDown}>
      <div
        className="absolute inset-0 transition-opacity duration-200 starting:opacity-0"
        style={{ background: placement === 'full' ? 'transparent' : scrim }}
        onClick={dismissOnScrim ? () => onClose('scrim') : undefined}
        aria-hidden="true"
      />
      <div className={`relative z-10 transition duration-200 ${placement === 'bottom' ? 'w-full starting:translate-y-full' : placement === 'full' ? 'flex w-full starting:translate-y-6 starting:opacity-0' : 'starting:scale-95 starting:opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------- iOS ---------------------------------- */

export interface Action {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onClick?: () => void;
  autoFocus?: boolean;
}

export function IOSAlert({ id = 'ios-alert', title, message, actions, scale = 1 }: { id?: string; title: string; message?: string; actions: Action[]; scale?: number }) {
  const stacked = actions.length > 2;
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-t`}
      aria-describedby={message ? `${id}-m` : undefined}
      className="w-[270px] max-w-full overflow-hidden rounded-[14px] text-center text-black"
      style={{ background: 'rgba(242,242,242,.97)', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}
    >
      <div className="px-4 pt-5 pb-4">
        <p id={`${id}-t`} className="font-semibold" style={{ fontSize: 17 * scale, lineHeight: 1.3 }}>
          {title}
        </p>
        {message && (
          <p id={`${id}-m`} className="mt-1" style={{ fontSize: 13 * scale, lineHeight: 1.35 }}>
            {message}
          </p>
        )}
      </div>
      <div className={stacked ? 'flex flex-col' : 'flex'}>
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            data-autofocus={a.autoFocus || undefined}
            className={`min-h-11 flex-1 border-t border-black/15 px-2 focus-visible:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007aff] active:bg-black/10 ${!stacked && i > 0 ? 'border-l' : ''}`}
            style={{ fontSize: 17 * scale, color: a.style === 'destructive' ? '#ff3b30' : '#007aff', fontWeight: a.style === 'cancel' ? 600 : 400 }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IOSActionSheet({ id = 'ios-sheet', title, message, actions, cancel }: { id?: string; title?: string; message?: string; actions: Action[]; cancel: Action }) {
  const btn = 'min-h-[52px] w-full border-t border-black/15 text-[19px] focus-visible:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007aff] active:bg-black/10';
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={title ? `${id}-t` : undefined} aria-label={title ? undefined : 'Actions'} className="w-full space-y-2 px-2 pb-6 text-center">
      <div className="overflow-hidden rounded-[13px]" style={{ background: 'rgba(242,242,242,.97)' }}>
        {(title || message) && (
          <div className="px-4 py-3.5 text-[13px] text-[#8a8a8e]">
            {title && (
              <p id={`${id}-t`} className="font-semibold">
                {title}
              </p>
            )}
            {message && <p className="mt-0.5">{message}</p>}
          </div>
        )}
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={`${btn} ${i === 0 && !title && !message ? 'border-t-0' : ''}`}
            style={{ color: a.style === 'destructive' ? '#ff3b30' : '#007aff' }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={cancel.onClick} data-autofocus className={`${btn} rounded-[13px] border-t-0 bg-white font-semibold text-[#007aff]`}>
        {cancel.label}
      </button>
    </div>
  );
}

/* ------------------------------- Material 3 ------------------------------- */

export function M3Dialog({
  id = 'm3-dialog',
  icon,
  title,
  body,
  actions,
  scale = 1,
}: {
  id?: string;
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  actions: Action[];
  scale?: number;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-b`}
      className="w-[280px] max-w-full rounded-[28px] p-6 text-[#1d1b20]"
      style={{ background: '#ece6f0', boxShadow: '0 4px 16px rgba(0,0,0,.18)' }}
    >
      {icon && <div className={`mb-4 flex justify-center text-[#6750a4]`}>{icon}</div>}
      <p id={`${id}-t`} className={icon ? 'text-center' : ''} style={{ fontSize: 22 * scale, lineHeight: 1.3 }}>
        {title}
      </p>
      <div id={`${id}-b`} className="mt-4 text-[#49454f]" style={{ fontSize: 14 * scale, lineHeight: 1.45 }}>
        {body}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            data-autofocus={a.autoFocus || undefined}
            className="h-10 rounded-full px-3 font-medium hover:bg-[#6750a4]/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6750a4]"
            style={{ fontSize: 14 * scale, color: a.style === 'destructive' ? '#b3261e' : '#6750a4' }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function M3FullScreen({ id = 'm3-full', title, onClose, onSave, children }: { id?: string; title: string; onClose?: () => void; onSave?: () => void; children: ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} className="flex h-full w-full flex-col bg-[#fef7ff] text-[#1d1b20]">
      <div className="flex h-14 shrink-0 items-center gap-2 px-1">
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-12 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#6750a4]">
          <X size={22} />
        </button>
        <p id={`${id}-t`} className="flex-1 text-[20px]">
          {title}
        </p>
        <button type="button" onClick={onSave} className="mr-2 h-10 rounded-full px-3 text-[14px] font-medium text-[#6750a4] hover:bg-[#6750a4]/10 focus-visible:outline-2 focus-visible:outline-[#6750a4]">
          Save
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">{children}</div>
    </div>
  );
}

/** Material 3 outlined text field look (label floats above the value). */
export function M3Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange?: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="relative mt-4 block">
      <span className="absolute -top-2 left-3 bg-[#fef7ff] px-1 text-[12px] text-[#6750a4]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
        data-autofocus={autoFocus || undefined}
        className="h-12 w-full rounded-[4px] border border-[#79747e] bg-transparent px-4 text-[15px] outline-none focus:border-2 focus:border-[#6750a4]"
      />
    </label>
  );
}

/* ----------------------------------- Web ----------------------------------- */

export function WebModal({
  id = 'web-modal',
  title,
  children,
  onClose,
  footer,
  width = 340,
  role = 'dialog',
}: {
  id?: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  width?: number;
  role?: 'dialog' | 'alertdialog';
}) {
  return (
    <div
      role={role}
      aria-modal="true"
      aria-labelledby={`${id}-t`}
      className="max-w-full overflow-hidden rounded-xl bg-white text-[#0e1120] shadow-[0_20px_50px_-12px_rgba(0,0,0,.35)]"
      style={{ width }}
    >
      <div className="flex items-start gap-3 px-5 pt-4">
        <p id={`${id}-t`} className="flex-1 pt-1 text-[16px] font-semibold">
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 grid size-9 place-items-center rounded-lg text-[#6b7080] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#2f6bff]"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-5 pt-1 pb-4 text-[14px] leading-relaxed text-[#4a4f60]">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[#eceef3] bg-[#f8f9fb] px-5 py-3">{footer}</div>}
    </div>
  );
}

export function WebButton({ children, kind = 'secondary', onClick, autoFocus, disabled }: { children: ReactNode; kind?: 'primary' | 'secondary' | 'danger'; onClick?: () => void; autoFocus?: boolean; disabled?: boolean }) {
  const styles = {
    primary: 'bg-[#2f6bff] text-white hover:bg-[#2559d9] border-transparent',
    danger: 'bg-[#d92d20] text-white hover:bg-[#b42318] border-transparent',
    secondary: 'bg-white text-[#0e1120] border-[#d0d4de] hover:bg-[#f2f4f7]',
  }[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-autofocus={autoFocus || undefined}
      className={`h-9 rounded-lg border px-3.5 text-[14px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff] disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Bottom sheet ------------------------------ */

export function BottomSheet({ id = 'sheet', title, children, handle }: { id?: string; title: string; children: ReactNode; handle?: ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} className="w-full rounded-t-[28px] bg-[#f7f2fa] pb-5 text-[#1d1b20] shadow-[0_-4px_16px_rgba(0,0,0,.12)]">
      {handle ?? (
        <div className="flex justify-center pt-3 pb-2">
          <span className="h-1 w-8 rounded-full bg-[#79747e]/60" />
        </div>
      )}
      <p id={`${id}-t`} className="px-6 pt-1 pb-2 text-[16px] font-medium">
        {title}
      </p>
      {children}
    </div>
  );
}

/* --------------------------- Static illustrations -------------------------- */

/** A small contained screen with fake app content behind an optional overlay. For static, decorative use. */
export function StaticScreen({
  label,
  children,
  placement = 'center',
  height = 240,
  bg = '#ffffff',
  scrim = true,
}: {
  label: string;
  children?: ReactNode;
  placement?: 'center' | 'bottom' | 'top' | 'none';
  height?: number;
  bg?: string;
  scrim?: boolean;
}) {
  const pos = { center: 'items-center justify-center p-3', bottom: 'items-end', top: 'items-start p-2', none: 'hidden' }[placement];
  return (
    <div role="img" aria-label={label} className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[18px] border border-black/10" style={{ height, background: bg }}>
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
        <div inert className={`absolute inset-0 flex ${pos}`} style={{ background: scrim ? 'rgba(0,0,0,.4)' : 'transparent' }}>
          <div className="pointer-events-none flex w-full justify-center">{children}</div>
        </div>
      )}
    </div>
  );
}

/** Inline warning banner (non-modal), used in comparisons. */
export function InlineBanner({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-start gap-2 rounded-lg border border-[#f5c26b] bg-[#fff7e6] p-2.5 text-[12px] text-[#6b4a00]">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      {text}
    </div>
  );
}

/** Static Material snackbar look, used in comparisons. */
export function MiniSnackbar({ text, action }: { text: string; action?: string }) {
  return (
    <div className="m-3 flex min-h-11 flex-1 items-center gap-2 rounded-[4px] bg-[#322f35] px-4 py-2 text-[13px] text-[#f5eff7] shadow-lg">
      <span className="flex-1">{text}</span>
      {action && <span className="font-medium text-[#d0bcff]">{action}</span>}
    </div>
  );
}
