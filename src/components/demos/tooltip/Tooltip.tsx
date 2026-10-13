import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactElement, type RefObject } from 'react';

/*
 * Shared, correct tooltip primitives for the Tooltip page.
 * - Tooltip: shows on mouse hover (after a delay), on keyboard focus (immediately) and on touch long-press.
 *   Follows WCAG 1.4.13: dismissible (Esc), hoverable (the pointer can move onto it) and persistent
 *   (stays until the pointer leaves, focus moves or Esc is pressed). Keeps itself inside the nearest
 *   [data-tooltip-boundary] (shifts sideways, flips below when there is no room above).
 *   Everything can be switched off for the lab, to show what breaks.
 * - describeEl / useAnnouncer: show what a screen reader would announce for the focused control,
 *   computed from the real DOM (name, role, state, description).
 */

export type TooltipSkin = 'web' | 'm3';

export interface TriggerProps {
  'aria-describedby'?: string;
  onPointerEnter: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  onContextMenu: (e: { preventDefault: () => void }) => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
}

export interface TooltipProps {
  text: string;
  children: (p: TriggerProps) => ReactElement;
  placement?: 'top' | 'bottom';
  showDelay?: number;
  hoverable?: boolean;
  escape?: boolean;
  collision?: boolean;
  /** Link the tooltip as the trigger's description (aria-describedby). Off when the text is the same as the name. */
  describe?: boolean;
  skin?: TooltipSkin;
  onEvent?: (s: string) => void;
}

export function Tooltip({
  text,
  children,
  placement = 'top',
  showDelay = 400,
  hoverable = true,
  escape = true,
  collision = true,
  describe = false,
  skin = 'web',
  onEvent,
}: TooltipProps) {
  const id = `tt-${useId().replace(/[:«»]/g, '')}`;
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const [below, setBelow] = useState(placement === 'bottom');
  const openRef = useRef(false);
  const tipRef = useRef<HTMLSpanElement>(null);
  const showT = useRef<number | undefined>(undefined);
  const hideT = useRef<number | undefined>(undefined);
  const pressT = useRef<number | undefined>(undefined);
  const evt = useRef(onEvent);
  evt.current = onEvent;

  const set = (v: boolean, why?: string) => {
    if (openRef.current === v) return;
    openRef.current = v;
    setOpen(v);
    if (why) evt.current?.(why);
  };
  const clearAll = () => {
    clearTimeout(showT.current);
    clearTimeout(hideT.current);
    clearTimeout(pressT.current);
  };
  useEffect(() => clearAll, []);

  const show = (why: string, delay: number) => {
    clearTimeout(hideT.current);
    if (openRef.current) return;
    clearTimeout(showT.current);
    if (delay <= 0) set(true, why);
    else showT.current = window.setTimeout(() => set(true, why), delay);
  };
  const hide = (why: string, delay = 0) => {
    clearTimeout(showT.current);
    clearTimeout(hideT.current);
    if (!openRef.current) return;
    if (delay <= 0) set(false, why);
    else hideT.current = window.setTimeout(() => set(false, why), delay);
  };

  // Esc closes the tooltip without moving focus (WCAG 1.4.13 "dismissible")
  useEffect(() => {
    if (!open || !escape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearAll();
        set(false, 'Esc → hide');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, escape]);

  // Keep the tooltip inside its boundary: shift sideways, flip below if there is no room above.
  useLayoutEffect(() => {
    if (!open) return;
    const tip = tipRef.current;
    if (!tip) return;
    if (!collision) {
      setShift(0);
      setBelow(placement === 'bottom');
      return;
    }
    const boundary = tip.closest('[data-tooltip-boundary]') ?? document.documentElement;
    const b = boundary.getBoundingClientRect();
    const r = tip.getBoundingClientRect();
    const baseLeft = r.left - shift;
    const pad = 6;
    let s = 0;
    if (baseLeft < b.left + pad) s = b.left + pad - baseLeft;
    else if (baseLeft + r.width > b.right - pad) s = b.right - pad - (baseLeft + r.width);
    setShift(s);
    if (placement === 'top' && !below && r.top < b.top + pad) setBelow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collision]);

  useEffect(() => {
    if (!open) {
      setBelow(placement === 'bottom');
    }
  }, [open, placement]);

  const trigger: TriggerProps = {
    'aria-describedby': describe ? id : undefined,
    onPointerEnter: (e) => {
      if (e.pointerType === 'touch') return;
      show(`hover → show${showDelay ? ` after ${showDelay} ms` : ''}`, showDelay);
    },
    onPointerLeave: (e) => {
      if (e.pointerType === 'touch') return;
      hide('pointer left → hide', hoverable ? 150 : 0);
    },
    onPointerDown: (e) => {
      if (e.pointerType !== 'touch') return;
      clearTimeout(pressT.current);
      pressT.current = window.setTimeout(() => show('long-press → show', 0), 500);
    },
    onPointerUp: (e) => {
      if (e.pointerType !== 'touch') return;
      clearTimeout(pressT.current);
      if (openRef.current) hide('released → hide after 1.5 s', 1500);
    },
    onPointerCancel: () => clearTimeout(pressT.current),
    onContextMenu: (e) => e.preventDefault(),
    onFocus: (e) => {
      // keyboard focus only; a mouse click or tap also focuses buttons in some browsers
      let kb = true;
      try {
        kb = e.currentTarget.matches(':focus-visible');
      } catch {
        kb = true;
      }
      if (kb) show('focus → show', 0);
    },
    onBlur: () => hide('blur → hide'),
  };

  const skinCls =
    skin === 'm3'
      ? 'rounded-[4px] bg-[#322f35] px-2 py-1 text-[12px] leading-4 text-[#f5eff7]'
      : 'rounded-md bg-[#1f2330] px-2.5 py-1.5 text-[12px] leading-4 text-white shadow-lg';

  return (
    <span className="relative inline-flex">
      {children(trigger)}
      <span
        ref={tipRef}
        id={id}
        role="tooltip"
        hidden={!open}
        onPointerEnter={() => hoverable && clearTimeout(hideT.current)}
        onPointerLeave={(e) => e.pointerType !== 'touch' && hide('pointer left tooltip → hide', 120)}
        className={`absolute left-1/2 z-40 w-max max-w-[200px] text-left font-normal whitespace-normal ${skinCls} ${below ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        style={{ transform: `translateX(calc(-50% + ${shift}px))`, pointerEvents: hoverable ? 'auto' : 'none' }}
      >
        {text}
        {skin === 'web' && (
          <span
            aria-hidden="true"
            className={`absolute size-2 rotate-45 bg-[#1f2330] ${below ? '-top-1' : '-bottom-1'}`}
            style={{ left: `calc(50% - ${shift}px - 4px)` }}
          />
        )}
      </span>
    </span>
  );
}

/* ---------- screen reader helper ---------- */

function textOf(ids: string | null): string {
  if (!ids) return '';
  return ids
    .split(/\s+/)
    .map((i) => document.getElementById(i)?.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A simplified accessible-name / role / state / description computation for demo purposes. */
export function describeEl(el: Element | null): string {
  if (!el) return '';
  const tag = el.tagName.toLowerCase();
  const roleAttr = el.getAttribute('role');
  const role = roleAttr ?? (tag === 'button' ? 'button' : tag === 'a' ? 'link' : tag === 'input' || tag === 'textarea' ? 'text field' : '');
  if (!role) return '';
  let name = textOf(el.getAttribute('aria-labelledby')) || el.getAttribute('aria-label') || '';
  if (!name && (tag === 'input' || tag === 'textarea')) {
    const labels = (el as HTMLInputElement).labels;
    name = labels && labels.length ? (labels[0].textContent ?? '') : '';
  }
  if (!name && tag !== 'input') name = el.textContent ?? '';
  name = name.replace(/\s+/g, ' ').trim();
  const parts: string[] = [];
  if (name) parts.push(name);
  parts.push(role);
  const exp = el.getAttribute('aria-expanded');
  if (exp) parts.push(exp === 'true' ? 'expanded' : 'collapsed');
  const checked = el.getAttribute('aria-checked');
  if (checked) parts.push(checked === 'true' ? 'on' : 'off');
  const desc = textOf(el.getAttribute('aria-describedby'));
  if (desc) parts.push(desc);
  return parts.join(', ');
}

/** Calls `onSay` with what a screen reader would announce when a control inside `root` gets focus. */
export function useAnnouncer(root: RefObject<HTMLElement | null>, onSay: (s: string) => void) {
  const say = useRef(onSay);
  say.current = onSay;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onFocus = (e: globalThis.FocusEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t || !el.contains(t)) return;
      const s = describeEl(t);
      if (s) say.current(s);
    };
    el.addEventListener('focusin', onFocus);
    return () => el.removeEventListener('focusin', onFocus);
  }, [root]);
}
