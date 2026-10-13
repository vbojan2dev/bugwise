import type { LucideIcon } from 'lucide-react';

/* Shared iOS and Material 3 bar pieces for the navigation bar demos. */

export const IOS_BLUE = '#007aff';
export const IOS_BG = '#f2f2f7';
export const IOS_BAR = 'rgba(249,249,249,.94)';
export const IOS_SEP = 'rgba(60,60,67,.29)';
export const M3 = {
  primary: '#6750a4',
  surface: '#fef7ff',
  container: '#f3edf7',
  scrolled: '#f3edf7',
  indicator: '#e8def8',
  onSurface: '#1d1b20',
  variant: '#49454f',
  onIndicator: '#4a4458',
};

export interface Dest {
  label: string;
  icon: LucideIcon;
  badge?: number | 'dot';
}

export function badgeWords(badge?: number | 'dot') {
  if (badge === undefined || badge === 0) return '';
  return badge === 'dot' ? ', new' : `, ${badge} new`;
}

export function Badge({ value, color, className = '' }: { value: number | 'dot'; color: string; className?: string }) {
  if (value === 0) return null;
  if (value === 'dot') return <span className={`block size-2 rounded-full ${className}`} style={{ background: color }} aria-hidden="true" />;
  return (
    <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none font-semibold text-white ${className}`} style={{ background: color }} aria-hidden="true">
      {value > 99 ? '99+' : value}
    </span>
  );
}

/** iOS tab bar. `safeArea` adds the 34 pt home indicator inset (scaled down for the mockup). */
export function IOSTabBar({
  items,
  value,
  onSelect,
  safeArea = true,
  scale = 1,
  label = 'Tab bar',
  className = '',
}: {
  items: Dest[];
  value: number;
  onSelect?: (i: number) => void;
  safeArea?: boolean;
  scale?: number;
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex shrink-0 border-t backdrop-blur ${className}`} style={{ borderColor: IOS_SEP, background: IOS_BAR, paddingBottom: safeArea ? 20 : 1, paddingTop: 3 }}>
      {items.map((t, i) => {
        const sel = i === value;
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            aria-current={sel ? 'page' : undefined}
            aria-label={`${t.label}${badgeWords(t.badge)}`}
            onClick={() => onSelect?.(i)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-0.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"
            style={{ color: sel ? IOS_BLUE : '#8a8a8e', fontSize: 10 * scale }}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={sel ? 2.3 : 1.8} aria-hidden="true" />
              {t.badge !== undefined && <Badge value={t.badge} color="#ff3b30" className={t.badge === 'dot' ? 'absolute -top-0.5 -right-1' : 'absolute -top-1.5 left-3.5'} />}
            </span>
            <span className="max-w-full truncate leading-tight">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Material 3 navigation bar (bottom navigation) with the pill-shaped active indicator. */
export function M3NavigationBar({
  items,
  value,
  onSelect,
  safeArea = true,
  scale = 1,
  label = 'Navigation bar',
  className = '',
}: {
  items: Dest[];
  value: number;
  onSelect?: (i: number) => void;
  safeArea?: boolean;
  scale?: number;
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex shrink-0 ${className}`} style={{ background: M3.container, paddingBottom: safeArea ? 16 : 1, paddingTop: 10 }}>
      {items.map((t, i) => {
        const sel = i === value;
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            aria-current={sel ? 'page' : undefined}
            aria-label={`${t.label}${badgeWords(t.badge)}`}
            onClick={() => onSelect?.(i)}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1 font-medium outline-none"
            style={{ color: sel ? M3.onSurface : M3.variant, fontSize: 12 * scale }}
          >
            <span
              className="relative grid h-8 w-14 place-items-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-[#6750a4]"
              style={{ background: sel ? M3.indicator : 'transparent', color: sel ? M3.onIndicator : M3.variant }}
            >
              <Icon size={22} strokeWidth={sel ? 2.3 : 1.8} aria-hidden="true" />
              {t.badge !== undefined && <Badge value={t.badge} color="#b3261e" className={t.badge === 'dot' ? 'absolute top-1 right-4' : 'absolute top-0 left-[30px]'} />}
            </span>
            <span className="max-w-full truncate leading-tight">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
