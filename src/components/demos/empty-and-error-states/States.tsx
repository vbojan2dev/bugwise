import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { House, Receipt, Search, User } from 'lucide-react';

/** Shared building blocks for the empty & error state demos (iOS-style food delivery app). */

export interface Order {
  id: number;
  restaurant: string;
  summary: string;
  total: string;
  when: string;
  status: 'active' | 'delivered';
  color: string;
}

export const orders: Order[] = [
  { id: 1, restaurant: 'Sakura Sushi Bar', summary: '2 items', total: '€24.80', when: 'Today, 19:05', status: 'active', color: '#fda4af' },
  { id: 2, restaurant: 'Napoli Pizza Corner', summary: '3 items', total: '€31.50', when: 'Sat, 20:12', status: 'delivered', color: '#fde68a' },
  { id: 3, restaurant: 'Green Bowl', summary: '1 item', total: '€11.90', when: 'Thu, 12:40', status: 'delivered', color: '#bbf7d0' },
  { id: 4, restaurant: 'Burger Barn', summary: '2 items', total: '€18.20', when: '12 Oct, 21:03', status: 'delivered', color: '#fed7aa' },
];

export const ink = { text: '#000', secondary: '#6c6c70', tertiary: '#8e8e93', blue: '#007aff', bg: '#f2f2f7', sep: '#e5e5ea' };

export function OrderRow({ o, dim = false }: { o: Order; dim?: boolean }) {
  return (
    <li className={`flex items-center gap-3 px-3 py-2.5 ${dim ? 'opacity-60' : ''}`}>
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-black/60" style={{ background: o.color }}>
        {o.restaurant.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{o.restaurant}</span>
        <span className="block truncate text-[11px]" style={{ color: ink.secondary }}>
          {o.summary} · {o.total} · {o.when}
        </span>
      </span>
      {o.status === 'active' ? (
        <span className="shrink-0 rounded-full bg-[#e8f8ee] px-2 py-0.5 text-[10px] font-semibold text-[#0b7a43]">On the way</span>
      ) : (
        <span className="shrink-0 text-[10px]" style={{ color: ink.tertiary }}>
          Delivered
        </span>
      )}
    </li>
  );
}

export function OrderList({ list, dim = false }: { list: Order[]; dim?: boolean }) {
  return (
    <ul className="mx-3 divide-y overflow-hidden rounded-xl bg-white" style={{ borderColor: ink.sep }}>
      {list.map((o) => (
        <OrderRow key={o.id} o={o} dim={dim} />
      ))}
    </ul>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <ul aria-hidden="true" className="mx-3 animate-pulse divide-y overflow-hidden rounded-xl bg-white" style={{ borderColor: ink.sep }}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <span className="size-9 shrink-0 rounded-lg bg-[#e5e5ea]" />
          <span className="flex-1 space-y-1.5">
            <span className="block h-2.5 w-2/3 rounded bg-[#e5e5ea]" />
            <span className="block h-2 w-5/6 rounded bg-[#ececf0]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A well-built empty / error state: icon, headline (what happened), body (why / what next), actions. */
export function EmptyState({
  icon: I,
  tone = 'neutral',
  title,
  body,
  primary,
  onPrimary,
  primaryBusy = false,
  secondary,
  onSecondary,
  compact = false,
}: {
  icon: LucideIcon;
  tone?: 'neutral' | 'error' | 'warn';
  title: string;
  body: ReactNode;
  primary?: string;
  onPrimary?: () => void;
  primaryBusy?: boolean;
  secondary?: string;
  onSecondary?: () => void;
  compact?: boolean;
}) {
  const colors = tone === 'error' ? { bg: '#fdecec', fg: '#c0262d' } : tone === 'warn' ? { bg: '#fff4e0', fg: '#b45309' } : { bg: '#e8f0fe', fg: '#1a56db' };
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-3 py-4' : 'px-5 py-8'}`}>
      <span aria-hidden="true" className={`grid place-items-center rounded-full ${compact ? 'size-11' : 'size-14'}`} style={{ background: colors.bg, color: colors.fg }}>
        <I size={compact ? 20 : 26} strokeWidth={1.75} />
      </span>
      <p className={`mt-3 font-semibold ${compact ? 'text-[14px]' : 'text-[16px]'}`}>{title}</p>
      <p className="mt-1 max-w-[16rem] text-[12px] leading-snug" style={{ color: ink.secondary }}>
        {body}
      </p>
      {primary && (
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryBusy}
          className="mt-4 h-10 min-w-[9rem] rounded-full px-5 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff] disabled:opacity-60"
          style={{ background: ink.blue }}
        >
          {primaryBusy ? 'Retrying…' : primary}
        </button>
      )}
      {secondary && (
        <button type="button" onClick={onSecondary} className="mt-2 h-9 rounded-full px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-[#007aff]" style={{ color: ink.blue }}>
          {secondary}
        </button>
      )}
    </div>
  );
}

/** Simplified iOS screen for small side-by-side demos (not a full PhoneFrame). */
export function MiniScreen({ children, filter = 'All', label }: { children: ReactNode; filter?: string; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="relative mx-auto flex h-[430px] w-full max-w-[260px] flex-col overflow-hidden rounded-[28px] border-[6px] border-[#0c0d12] text-black"
      style={{ background: ink.bg, colorScheme: 'light' }}
    >
      <div className="shrink-0 px-4 pt-3 pb-2">
        <p className="text-[22px] leading-none font-bold">Orders</p>
        <div className="mt-2.5 flex gap-1.5 text-[11px] font-medium">
          {['All', 'Active', 'Canceled'].map((f) => (
            <span key={f} className="rounded-full px-2.5 py-1" style={f === filter ? { background: '#000', color: '#fff' } : { background: '#e5e5ea', color: '#3a3a3c' }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto pb-2">{children}</div>
      <TabBar />
    </div>
  );
}

export function TabBar() {
  const tabs: { icon: LucideIcon; label: string }[] = [
    { icon: House, label: 'Home' },
    { icon: Search, label: 'Search' },
    { icon: Receipt, label: 'Orders' },
    { icon: User, label: 'Account' },
  ];
  return (
    <div aria-hidden="true" className="flex h-12 shrink-0 items-start justify-around border-t bg-[#f9f9f9]/95 pt-1.5 text-[9px]" style={{ borderColor: ink.sep }}>
      {tabs.map((t) => (
        <span key={t.label} className="flex flex-col items-center gap-0.5" style={{ color: t.label === 'Orders' ? ink.blue : ink.tertiary }}>
          <t.icon size={17} />
          {t.label}
        </span>
      ))}
    </div>
  );
}
