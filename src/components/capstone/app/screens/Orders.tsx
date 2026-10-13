import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ClipboardList, CreditCard, MapPin, WifiOff } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { DISHES, restaurantById } from '../data';
import { arrivalWindow, orderStep } from '../orders';
import { clockOf, hhmm } from '../i18n';
import { useApp } from '../context';
import { Spinner, TopBar } from '../ui';

export function OrdersList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, orders, progressNow, money } = useApp();
  const list = [...orders].reverse();
  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('ordersTitle')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {list.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <ClipboardList size={40} aria-hidden="true" className="text-(--sub)" />
            <p className="t17 mt-3 font-semibold">{t('noOrders')}</p>
            <p className="t14 mt-1 text-(--sub)">{t('noOrdersSub')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((o) => {
              const r = restaurantById(o.restaurantId)!;
              const done = orderStep(o, progressNow) === 3;
              return (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpen(o.id)} className="flex w-full items-center gap-3 rounded-2xl bg-(--sf) px-4 py-3 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="t15 block truncate font-semibold">{r.name}</span>
                      <span className="t13 block text-(--sub)">
                        {t('order', { id: o.id })} · {hhmm(clockOf(o.placedAt))}
                      </span>
                      <span className="t13 block tabular-nums">{money(o.total, o.currency)}</span>
                    </span>
                    <span
                      className="t12 shrink-0 rounded-full px-2 py-0.5 font-semibold"
                      style={done ? { background: 'var(--sf2)', color: 'var(--sub)' } : { background: 'var(--oksoft)', color: 'var(--ok)' }}
                    >
                      {done ? t('delivered') : t('active')}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="text-(--sub)" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const STEP_COLORS = ['#34a853', '#f59e0b', '#a8a8ad'];

export function Tracking({ id, onBack, grayscale }: { id: string; onBack: () => void; grayscale: boolean }) {
  const { t, orders, progressNow: now, api, active, net, money, seen } = useApp();
  const o = orders.find((x) => x.id === id);
  const [shown, setShown] = useState<number | null>(null);
  const [stopped, setStopped] = useState(false);
  const pollRef = useRef(0);
  const nowRef = useRef(now);
  nowRef.current = now;
  const orderRef = useRef(o);
  orderRef.current = o;

  const fetchStatus = () => {
    const ord = orderRef.current;
    if (!ord) return;
    api('GET', `/api/orders/${ord.id}`, { ms: 300, server: () => ({ status: 200, data: orderStep(ord, nowRef.current) }) })
      .then((res) => setShown(res.data as number))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = window.setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // The OS suspends the app in the background, so polling stops.
  // BUG B15: nothing restarts polling or refreshes when the app comes back.
  useEffect(() => {
    if (!active && !stopped) {
      clearInterval(pollRef.current);
      setStopped(true);
    }
  }, [active, stopped]);

  const server = o ? orderStep(o, now) : 0;
  useEffect(() => {
    if (active && stopped && shown != null && shown !== server) seen('B15', 'tracking');
  }, [active, stopped, shown, server, seen]);
  useEffect(() => {
    if (active && grayscale && shown != null) seen('B17', 'tracking');
  }, [active, grayscale, shown, seen]);

  if (!o) return null;
  const r = restaurantById(o.restaurantId)!;
  const steps = [t('stepConfirmed'), t('stepPreparing'), t('stepOnTheWay'), t('stepDelivered')];
  const win = arrivalWindow(o, SPEC.slotMinutes);

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('order', { id: o.id })} onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="bg-(--sf) px-4 pt-4 pb-4">
          <p className="t13 text-(--sub) [overflow-wrap:anywhere]">{r.name}</p>
          <p className="t22 mt-0.5 font-bold tracking-tight">{o.slot != null ? t('scheduledFor', { t: win }) : t('arrives', { t: win })}</p>
          {shown == null ? (
            <div className="mt-4 flex items-center gap-2 text-(--sub)">
              <Spinner size={14} />
              <span className="t13">{t('loading')}</span>
            </div>
          ) : (
            // BUG B17: the current step is shown by color only; no text, icon or announcement.
            <div data-fd-progress className="mt-4">
              <div className="flex gap-1.5">
                {steps.map((s, i) => (
                  <span key={s} className="h-2 flex-1 rounded-full" style={{ background: i < shown ? STEP_COLORS[0] : i === shown ? STEP_COLORS[1] : STEP_COLORS[2] }} />
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {steps.map((s) => (
                  <span key={s} className="t11 min-w-0 flex-1 text-center text-(--sub)">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {net === 'offline' && (
            <p role="status" className="t12 mt-3 flex items-center gap-1.5 rounded-lg bg-(--warnsoft) px-2.5 py-1.5 text-(--warn)">
              <WifiOff size={13} aria-hidden="true" /> {t('statusOffline')}
            </p>
          )}
        </section>
        <section className="mt-3 space-y-3 bg-(--sf) px-4 py-3">
          <div className="flex gap-3">
            <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-(--sub)" />
            <div className="min-w-0">
              <p className="t12 text-(--sub)">{t('deliveringTo')}</p>
              <p className="t14 [overflow-wrap:anywhere]">{o.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CreditCard size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-(--sub)" />
            <div className="min-w-0">
              <p className="t12 text-(--sub)">{t('paidWith')}</p>
              <p className="t14">{t('card')}</p>
            </div>
          </div>
        </section>
        <section className="mt-3 bg-(--sf) px-4 py-3">
          <h2 className="t13 mb-1.5 font-semibold">{t('orderItems')}</h2>
          <ul className="t14 space-y-1">
            {o.items.map((it) => (
              <li key={it.dishId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {it.qty}× {DISHES[it.dishId].name}
                </span>
              </li>
            ))}
          </ul>
          <div className="t15 mt-2 flex justify-between gap-3 border-t border-(--line) pt-2 font-bold">
            <span>{t('total')}</span>
            <span className="tabular-nums">{money(o.total, o.currency)}</span>
          </div>
        </section>
        <div className="h-4" />
      </div>
    </div>
  );
}
