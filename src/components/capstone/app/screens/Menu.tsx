import { useEffect, useState } from 'react';
import { ChevronLeft, Clock, Minus, Plus, ShoppingBag, Star, WifiOff } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { restaurantById } from '../data';
import { CUISINE_LABEL, clockOf, hhmm } from '../i18n';
import { dishPrice, feeIn, totals } from '../pricing';
import { useApp } from '../context';
import { Spinner } from '../ui';
import { CUISINE_ICON, isOpenAt } from './Home';

export function Menu({
  id,
  cached,
  onLoaded,
  onBack,
  onCart,
  pending,
  onAdd,
  onRemove,
}: {
  id: string;
  cached: boolean;
  onLoaded: () => void;
  onBack: () => void;
  onCart: () => void;
  pending: Record<string, number>;
  onAdd: (dishId: string) => void;
  onRemove: (dishId: string) => void;
}) {
  const { t, lang, api, now, money, cur, cart, seen, active, dark } = useApp();
  const r = restaurantById(id)!;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(cached ? 'ready' : 'loading');

  const load = () => {
    setState('loading');
    api('GET', `/api/restaurants/${id}/menu`, { ms: 500 })
      .then(() => {
        onLoaded();
        setState('ready');
      })
      .catch(() => setState('error'));
  };
  useEffect(() => {
    if (!cached) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (active && dark && state === 'ready') seen('B22', 'menu');
  }, [active, dark, state, seen]);

  const open = isOpenAt(r, clockOf(now));
  const mine = cart.restaurantId === id;
  const tot = totals(cart, cur);
  const Icon = CUISINE_ICON[r.cuisine];

  return (
    <div className="flex h-full flex-col">
      <div className="relative shrink-0" style={{ background: `linear-gradient(135deg, hsl(${r.hue} 75% 62%), hsl(${r.hue + 25} 70% 42%))` }}>
        <button type="button" onClick={onBack} aria-label={t('back')} className="absolute top-2 left-2 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-[#111]">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div className="grid h-[76px] place-items-center">
          <Icon size={36} aria-hidden="true" className="text-white/90" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-(--sf) px-4 pt-3 pb-3">
          <h1 className="t20 font-bold tracking-tight [overflow-wrap:anywhere]">{r.name}</h1>
          <p className="t13 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-(--sub)">
            <span className="flex items-center gap-0.5 font-semibold text-(--fg)">
              <Star size={13} aria-hidden="true" className="fill-current text-(--star)" /> {r.rating.toFixed(1)}
            </span>
            <span>{t('reviews', { n: r.reviews.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US') })}</span>
            <span aria-hidden="true">·</span>
            <span>{CUISINE_LABEL[r.cuisine][lang]}</span>
          </p>
          <p className="t13 mt-0.5 flex flex-wrap items-center gap-x-2 text-(--sub)">
            <span className="flex items-center gap-1">
              <Clock size={13} aria-hidden="true" /> {t('minutes', { a: r.eta[0], b: r.eta[1] })}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {money(feeIn(cur))} {t('delivery')}
            </span>
          </p>
          <p className="t12 mt-2 rounded-lg bg-(--sf2) px-2.5 py-1.5 text-(--sub)">{t('maxNote', { n: SPEC.maxPerDish })}</p>
          {!open && (
            <p role="status" className="t13 mt-2 rounded-lg bg-(--warnsoft) px-2.5 py-1.5 font-medium text-(--warn)">
              {t('closedBanner', { t: hhmm(r.hours[0]) })}
            </p>
          )}
        </div>
        {state === 'loading' && (
          <div className="space-y-2 p-4" aria-busy="true" aria-label={t('loading')}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="pulse h-16 rounded-xl bg-(--sf2)" />
            ))}
          </div>
        )}
        {state === 'error' && (
          <div className="px-6 pt-10 text-center">
            <WifiOff size={26} aria-hidden="true" className="mx-auto text-(--sub)" />
            <p className="t15 mt-2 font-semibold">{t('menuError')}</p>
            <p className="t13 text-(--sub)">{t('errOffline')}</p>
            <button type="button" onClick={load} className="t14 mt-3 rounded-full bg-(--brand) px-4 py-2 font-semibold text-white">
              {t('retry')}
            </button>
          </div>
        )}
        {state === 'ready' && (
          <ul className="mt-2 divide-y divide-(--line) bg-(--sf)">
            {r.dishes.map((d) => {
              const qty = mine ? (cart.items[d.id] ?? 0) : 0;
              const busy = (pending[d.id] ?? 0) > 0;
              const price = dishPrice(d.id, cur);
              return (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    {/* BUG B22: hard-coded text colors that ignore dark mode. */}
                    <p className="t15 font-semibold" style={{ color: '#1d1d1f' }}>
                      {d.name}
                    </p>
                    <p className="t12 mt-0.5" style={{ color: '#3c3c43' }}>
                      {d.desc[lang]}
                    </p>
                    <p className="t14 mt-1 font-semibold tabular-nums">{money(price)}</p>
                  </div>
                  {qty > 0 ? (
                    <div className="flex shrink-0 items-center rounded-full bg-(--sf2)">
                      <button type="button" disabled={!open} onClick={() => onRemove(d.id)} aria-label={t('removeOne', { d: d.name, p: money(price) })} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span className="t14 w-6 text-center font-semibold tabular-nums">{qty}</span>
                      {/* BUG B06: no upper limit. BUG B07: no accessible name. */}
                      <button type="button" data-fd-add disabled={!open} onClick={() => onAdd(d.id)} className="grid size-11 place-items-center rounded-full disabled:opacity-40">
                        {busy ? <Spinner size={14} /> : <Plus size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-fd-add
                      disabled={!open}
                      onClick={() => onAdd(d.id)}
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-(--brand) text-white disabled:opacity-40"
                    >
                      {busy ? <Spinner size={14} /> : <Plus size={18} aria-hidden="true" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="h-4" />
      </div>
      {mine && tot.count > 0 && (
        <div className="shrink-0 bg-(--bg) px-3 pt-2 pb-2">
          <button type="button" onClick={onCart} className="t15 flex h-12 w-full items-center gap-2 rounded-xl bg-(--brand) px-4 font-semibold text-white">
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left">
              {t('viewCart')} · {tot.count === 1 ? t('items1') : t('items', { n: tot.count })}
            </span>
            <span className="tabular-nums">{money(tot.subtotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
