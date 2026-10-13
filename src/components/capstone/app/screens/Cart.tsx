import { useEffect, useState } from 'react';
import { ShoppingBag, Tag, X } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { DISHES, restaurantById } from '../data';
import { rawMoney } from '../i18n';
import { dishPrice, totals } from '../pricing';
import { useApp } from '../context';
import { Spinner, Stepper, TopBar } from '../ui';

export function Cart({ onCheckout, onBrowse, onBack, toast }: { onCheckout: () => void; onBrowse: () => void; onBack?: () => void; toast: (s: string) => void }) {
  const { t, lang, api, money, cur, cart, setCart, seen, active } = useApp();
  const [code, setCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyDish, setBusyDish] = useState<string | null>(null);
  const r = restaurantById(cart.restaurantId);
  const tot = totals(cart, cur);
  const items = Object.entries(cart.items).filter(([, q]) => q > 0);
  const totalText = rawMoney(tot.total, lang);

  useEffect(() => {
    if (!active || items.length === 0) return;
    if (tot.freeByBug) seen('B09', 'cart');
    // B10 is visible when the printed total is not a clean 2-decimal amount (23.9, 25, 23.900000000000002).
    const twoDecimals = String(tot.total) === tot.total.toFixed(2);
    if (!twoDecimals) seen('B10', 'cart');
  }, [active, items.length, tot.freeByBug, tot.total, seen]);

  const changeQty = (dishId: string, delta: number) => {
    if (busyDish) return;
    setBusyDish(dishId);
    api('PATCH', `/api/cart/items/${dishId}`, { ms: 300 })
      .then(() => {
        setBusyDish(null);
        setCart((c) => {
          const q = Math.max(0, Math.min((c.items[dishId] ?? 0) + delta, delta > 0 ? SPEC.maxPerDish : Infinity));
          const next = { ...c.items };
          if (q === 0) delete next[dishId];
          else next[dishId] = q;
          const empty = Object.keys(next).length === 0;
          return { ...c, items: next, restaurantId: empty ? null : c.restaurantId, coupons: empty ? [] : c.coupons };
        });
      })
      .catch(() => {
        setBusyDish(null);
        toast(t('offlineAction'));
      });
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return setCouponMsg({ ok: false, text: t('couponEmpty') });
    setCouponBusy(true);
    setCouponMsg(null);
    const valid = c === SPEC.coupon.code;
    api('POST', '/api/cart/coupon', { ms: 500, server: () => ({ status: valid ? 200 : 422 }) })
      .then(() => {
        setCouponBusy(false);
        if (!valid) return setCouponMsg({ ok: false, text: t('couponInvalid') });
        // BUG B08: no check whether the code is already applied.
        setCart((x) => {
          if (x.coupons.length >= 1) seen('B08', 'cart');
          return { ...x, coupons: [...x.coupons, c] };
        });
        setCode('');
        setCouponMsg({ ok: true, text: t('couponApplied', { c }) });
      })
      .catch(() => {
        setCouponBusy(false);
        setCouponMsg({ ok: false, text: t('offlineAction') });
      });
  };

  const removeCoupon = (i: number) => {
    api('DELETE', '/api/cart/coupon', { ms: 300 })
      .then(() => setCart((x) => ({ ...x, coupons: x.coupons.filter((_, j) => j !== i) })))
      .catch(() => toast(t('offlineAction')));
  };

  if (items.length === 0)
    return (
      <div className="flex h-full flex-col">
        <TopBar title={t('cartTitle')} onBack={onBack} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ShoppingBag size={40} aria-hidden="true" className="text-(--sub)" />
          <p className="t17 mt-3 font-semibold">{t('cartEmpty')}</p>
          <p className="t14 mt-1 text-(--sub)">{t('cartEmptySub')}</p>
          <button type="button" onClick={onBrowse} className="t15 mt-4 rounded-full bg-(--brand) px-5 py-2.5 font-semibold text-white">
            {t('browse')}
          </button>
        </div>
      </div>
    );

  const row = (label: string, value: string, strong = false, color?: string) => (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? 't17 font-bold' : 't14'}`}>
      <dt className={strong ? '' : 'text-(--sub)'}>{label}</dt>
      <dd className="text-right tabular-nums" style={color ? { color } : undefined}>
        {value}
      </dd>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('cartTitle')} onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="t13 px-4 pt-3 font-semibold text-(--sub) [overflow-wrap:anywhere]">{r?.name}</p>
        <ul className="mt-2 divide-y divide-(--line) bg-(--sf)">
          {items.map(([id, qty]) => {
            const d = DISHES[id];
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="t15 font-medium">{d.name}</p>
                  <p className="t13 text-(--sub) tabular-nums">{money(dishPrice(id, cur) * qty)}</p>
                  {qty >= SPEC.maxPerDish && <p className="t12 text-(--warn)">{t('maxReached', { n: SPEC.maxPerDish })}</p>}
                </div>
                <Stepper qty={qty} max={SPEC.maxPerDish} name={d.name} price={money(dishPrice(id, cur))} busy={busyDish === id} onDec={() => changeQty(id, -1)} onInc={() => changeQty(id, 1)} />
              </li>
            );
          })}
        </ul>

        <form onSubmit={apply} className="mt-3 bg-(--sf) px-4 py-3">
          <label htmlFor="fd-coupon" className="t13 mb-1.5 block font-medium">
            {t('coupon')}
          </label>
          <div className="flex gap-2">
            <input
              id="fd-coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              className="t15 h-10 w-0 min-w-0 flex-1 rounded-lg border border-(--line) bg-(--bg) px-3 uppercase outline-none focus:border-(--brandfg)"
              aria-describedby={couponMsg ? 'fd-coupon-msg' : undefined}
            />
            <button type="submit" disabled={couponBusy} className="t14 flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-(--fg) px-4 font-semibold text-(--bg) disabled:opacity-60">
              {couponBusy && <Spinner size={13} />}
              {t('apply')}
            </button>
          </div>
          {couponMsg && (
            <p id="fd-coupon-msg" role="status" className="t13 mt-1.5" style={{ color: couponMsg.ok ? 'var(--ok)' : 'var(--danger)' }}>
              {couponMsg.text}
            </p>
          )}
          {cart.coupons.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {cart.coupons.map((c, i) => (
                <li key={i} className="t13 flex items-center gap-1 rounded-full bg-(--oksoft) py-1 pr-1 pl-2.5 font-semibold text-(--ok)">
                  <Tag size={13} aria-hidden="true" /> {c} −{SPEC.coupon.percent}%
                  <button type="button" onClick={() => removeCoupon(i)} aria-label={t('removeCoupon', { c })} className="grid size-6 place-items-center rounded-full">
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <dl className="mt-3 space-y-1.5 bg-(--sf) px-4 py-3">
          {row(t('subtotal'), money(tot.subtotal))}
          {cart.coupons.map((c, i) => (
            <div key={i}>{row(t('discount', { c }), `−${money(tot.discountEach)}`, false, 'var(--ok)')}</div>
          ))}
          {row(t('deliveryFee'), tot.free ? t('free') : money(tot.fee), false, tot.free ? 'var(--ok)' : undefined)}
          <p className="t12 text-(--sub)">{tot.free ? t('freeReached') : t('addMore', { x: money(tot.missing) })}</p>
          <div className="border-t border-(--line) pt-2">{row(t('total'), totalText, true)}</div>
        </dl>
        <div className="h-3" />
      </div>
      <div className="shrink-0 border-t border-(--line) bg-(--sf) px-3 pt-2 pb-2">
        <button type="button" onClick={onCheckout} className="t16 h-12 w-full rounded-xl bg-(--brand) font-semibold text-white">
          {t('toCheckout')}
        </button>
      </div>
    </div>
  );
}
