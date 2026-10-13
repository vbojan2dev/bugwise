import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronLeft, ClipboardList, House, Minus, Plus, ShoppingBag, User } from 'lucide-react';
import { useApp } from './context';
import type { RouteName } from './types';

export function Spinner({ size = 16 }: { size?: number }) {
  return <span aria-hidden="true" className="spin inline-block shrink-0 rounded-full border-2 border-current border-t-transparent opacity-80" style={{ width: size, height: size }} />;
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  const { t } = useApp();
  return (
    <div className="flex min-h-[44px] shrink-0 items-center gap-1 border-b border-(--line) bg-(--sf) px-2">
      {onBack && (
        <button type="button" onClick={onBack} aria-label={t('back')} className="grid size-10 shrink-0 place-items-center rounded-full text-(--brandfg)">
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
      )}
      <h1 className={`t17 min-w-0 flex-1 truncate font-semibold ${onBack ? '' : 'pl-2'}`}>{title}</h1>
      {right}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="up relative max-h-[85%] overflow-y-auto rounded-t-2xl bg-(--sf) px-4 pt-2 pb-6 outline-none"
      >
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-(--line)" aria-hidden="true" />
        <h2 className="t17 mb-2 font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label, sub, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="t15 block">{label}</span>
        {sub && <span className="t12 block text-(--sub)">{sub}</span>}
      </span>
      <span aria-hidden="true" className="relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors" style={{ background: checked ? '#1f9d55' : 'var(--sf2)', boxShadow: checked ? 'none' : 'inset 0 0 0 1px var(--line)' }}>
        <span className="absolute top-[2px] size-[24px] rounded-full bg-white shadow transition-[left]" style={{ left: checked ? 22 : 2 }} />
      </span>
    </button>
  );
}

/** Correct stepper used in the cart. */
export function Stepper({ qty, max, onDec, onInc, name, price, busy }: { qty: number; max: number; onDec: () => void; onInc: () => void; name: string; price: string; busy?: boolean }) {
  const { t } = useApp();
  return (
    <div className="flex shrink-0 items-center rounded-full bg-(--sf2)">
      <button type="button" onClick={onDec} aria-label={t('removeOne', { d: name, p: price })} className="grid size-11 place-items-center rounded-full">
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="t14 w-6 text-center font-semibold tabular-nums" aria-live="polite">
        {busy ? <Spinner size={12} /> : qty}
      </span>
      <button type="button" onClick={onInc} disabled={qty >= max} aria-label={t('addOne', { d: name, p: price })} className="grid size-11 place-items-center rounded-full disabled:opacity-35">
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="t13 pointer-events-none absolute inset-x-3 bottom-[76px] z-30 rounded-xl bg-[#2b2b30] px-3 py-2.5 text-white shadow-lg">
      {text}
    </div>
  );
}

export type Tab = 'home' | 'cart' | 'orders' | 'profile';
export const TAB_ROUTES: Record<Tab, RouteName> = { home: 'home', cart: 'cart', orders: 'orders', profile: 'profile' };

/** Bottom tab bar. BUG B23: fixed item height + overflow hidden, so large text gets clipped. */
export function TabBar({ current, onTab, cartCount }: { current: Tab | null; onTab: (t: Tab) => void; cartCount: number }) {
  const { t } = useApp();
  const tabs: { id: Tab; label: string; Icon: typeof House }[] = [
    { id: 'home', label: t('tabHome'), Icon: House },
    { id: 'cart', label: t('tabCart'), Icon: ShoppingBag },
    { id: 'orders', label: t('tabOrders'), Icon: ClipboardList },
    { id: 'profile', label: t('tabProfile'), Icon: User },
  ];
  return (
    <nav aria-label="Tabs" data-fd-tabbar className="flex shrink-0 border-t border-(--line) bg-(--sf) px-1 pt-0.5 pb-[10px]">
      {tabs.map(({ id, label, Icon }) => {
        const on = current === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            aria-current={on ? 'page' : undefined}
            className="relative flex h-[44px] min-w-0 flex-1 flex-col items-center justify-center"
            style={{ color: on ? 'var(--brandfg)' : 'var(--sub)' }}
          >
            <span className="flex h-[36px] w-full flex-col items-center overflow-hidden">
            <Icon aria-hidden="true" className="shrink-0" style={{ width: 'calc(20px * var(--fs))', height: 'calc(20px * var(--fs))' }} />
            <span className="mt-[2px] block w-full overflow-hidden whitespace-nowrap text-center font-medium" style={{ fontSize: 'calc(10.5px * var(--fs))', lineHeight: 1.25 }}>
              {label}
            </span>
            </span>
            {id === 'cart' && cartCount > 0 && (
              <span className="absolute top-[3px] left-1/2 ml-1.5 min-w-[16px] rounded-full bg-(--brand) px-1 text-center text-[10px] leading-[16px] font-bold text-white">{cartCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
