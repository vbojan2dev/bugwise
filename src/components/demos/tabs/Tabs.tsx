import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/*
 * Shared, correct tab primitives for the Tabs page.
 * - M3Tabs: Material 3 primary / secondary tabs (fixed or scrollable), ARIA tablist with arrow keys.
 * - IOSTabBar: iOS bottom tab bar with badges.
 * - useTabKeys: roving focus + arrow / Home / End handling (automatic or manual activation).
 */

export interface TabItem {
  label: string;
  icon?: LucideIcon;
  badge?: number | 'dot';
  disabled?: boolean;
}

/** Keyboard handler for an ARIA tablist (horizontal). */
export function useTabKeys({
  count,
  value,
  onChange,
  manual = false,
  onFocusIndex,
}: {
  count: number;
  value: number;
  onChange?: (i: number) => void;
  manual?: boolean;
  onFocusIndex?: (i: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % count;
    else if (e.key === 'ArrowLeft') next = (i - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next >= 0) {
      e.preventDefault();
      refs.current[next]?.focus();
      onFocusIndex?.(next);
      if (!manual) onChange?.(next);
      return;
    }
    if (manual && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange?.(i);
    }
  };
  return { refs, onKeyDown, value };
}

/** Small numeric or dot badge. */
export function Badge({ value, color = '#b3261e', className = '' }: { value: number | 'dot'; color?: string; className?: string }) {
  if (value === 'dot') return <span aria-hidden="true" className={`inline-block size-1.5 rounded-full ${className}`} style={{ background: color }} />;
  return (
    <span aria-hidden="true" className={`inline-grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none font-medium text-white ${className}`} style={{ background: color }}>
      {value > 999 ? '999+' : value}
    </span>
  );
}

function badgeText(b?: number | 'dot') {
  if (b === undefined) return '';
  if (b === 'dot') return ', new content';
  return `, ${b} new`;
}

/** Material 3 tabs. Purely visual when onChange is missing (static illustrations). */
export function M3Tabs({
  id,
  tabs,
  value,
  onChange,
  variant = 'primary',
  scrollable = false,
  manual = false,
  dark = false,
  className = '',
}: {
  id: string;
  tabs: TabItem[];
  value: number;
  onChange?: (i: number) => void;
  variant?: 'primary' | 'secondary';
  scrollable?: boolean;
  manual?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const { refs, onKeyDown } = useTabKeys({ count: tabs.length, value, onChange, manual });
  const scroller = useRef<HTMLDivElement>(null);
  const interactive = !!onChange;
  const primaryColor = dark ? '#d0bcff' : '#6750a4';
  const on = dark ? '#e6e0e9' : '#1d1b20';
  const off = dark ? '#cac4d0' : '#49454f';
  const hasIcons = tabs.some((t) => t.icon);

  // Keep the selected tab visible in scrollable tabs without scrolling the page.
  useEffect(() => {
    if (!scrollable) return;
    const box = scroller.current;
    const el = refs.current[value];
    if (!box || !el) return;
    const left = el.offsetLeft - box.offsetLeft;
    const target = left - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [value, scrollable, refs]);

  return (
    <div
      ref={scroller}
      role="tablist"
      aria-orientation="horizontal"
      className={`relative flex border-b ${scrollable ? 'overflow-x-auto [scrollbar-width:none]' : ''} ${className}`}
      style={{ borderColor: dark ? '#49454f' : '#cac4d0' }}
    >
      {tabs.map((t, i) => {
        const sel = i === value;
        const color = sel ? (variant === 'primary' ? primaryColor : on) : off;
        return (
          <button
            key={t.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-controls={`${id}-panel-${i}`}
            aria-label={t.badge !== undefined ? `${t.label}${badgeText(t.badge)}` : undefined}
            aria-disabled={t.disabled || undefined}
            tabIndex={interactive ? (sel ? 0 : -1) : -1}
            onClick={() => !t.disabled && onChange?.(i)}
            onKeyDown={(e) => interactive && onKeyDown(e, i)}
            className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[14px] font-medium outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-inset ${
              scrollable ? 'shrink-0 px-4' : 'flex-1 px-2'
            } ${hasIcons && variant === 'primary' ? 'h-16' : 'h-12'} ${t.disabled ? 'opacity-40' : ''}`}
            style={{ color, ['--tw-ring-color' as string]: primaryColor }}
          >
            {t.icon && variant === 'primary' && (
              <span className="relative">
                <t.icon size={22} strokeWidth={sel ? 2.2 : 1.8} />
                {t.badge !== undefined && <Badge value={t.badge} className={t.badge === 'dot' ? 'absolute -top-0.5 -right-1' : 'absolute -top-1.5 left-3'} />}
              </span>
            )}
            <span className="inline-flex max-w-full items-center gap-1.5">
              {t.icon && variant === 'secondary' && <t.icon size={16} />}
              <span className="truncate">{t.label}</span>
              {t.badge !== undefined && !(t.icon && variant === 'primary') && <Badge value={t.badge} />}
            </span>
            {sel &&
              (variant === 'primary' ? (
                <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-[3px] w-[min(100%_-_16px,max(28px,62%))] -translate-x-1/2 rounded-t-[3px]" style={{ background: primaryColor }} />
              ) : (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: primaryColor }} />
              ))}
          </button>
        );
      })}
    </div>
  );
}

/** A panel that belongs to a tab (role tabpanel). */
export function TabPanel({ id, index, active, children, className = '' }: { id: string; index: number; active: boolean; children: ReactNode; className?: string }) {
  return (
    <div id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={!active} tabIndex={0} className={`outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-inset ${className}`}>
      {children}
    </div>
  );
}

/** iOS bottom tab bar. */
export function IOSTabBar({ id, items, value, onChange, dark = false }: { id: string; items: TabItem[]; value: number; onChange?: (i: number) => void; dark?: boolean }) {
  const { refs, onKeyDown } = useTabKeys({ count: items.length, value, onChange });
  return (
    <div
      role="tablist"
      aria-label="Tab bar"
      className="flex shrink-0 border-t pt-1 pb-4 backdrop-blur"
      style={{ borderColor: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)', background: dark ? 'rgba(22,22,24,.94)' : 'rgba(249,249,249,.94)' }}
    >
      {items.map((t, i) => {
        const sel = i === value;
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-label={`${t.label}${badgeText(t.badge)}`}
            tabIndex={onChange ? (sel ? 0 : -1) : -1}
            onClick={() => onChange?.(i)}
            onKeyDown={(e) => onChange && onKeyDown(e, i)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"
            style={{ color: sel ? '#007aff' : dark ? '#8e8e93' : '#8a8a8e' }}
          >
            <span className="relative">
              {Icon && <Icon size={23} strokeWidth={sel ? 2.3 : 1.8} />}
              {t.badge !== undefined && <Badge value={t.badge} color="#ff3b30" className={t.badge === 'dot' ? 'absolute -top-0.5 -right-1' : 'absolute -top-1.5 left-3.5'} />}
            </span>
            <span className="max-w-full truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
