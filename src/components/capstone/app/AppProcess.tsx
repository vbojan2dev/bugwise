import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { SPEC, type Screen } from '@/lib/capstone';
import { ADDRESSES, DISHES, restaurantById } from './data';
import { useApp } from './context';
import { totals } from './pricing';
import { Sheet, TabBar, Toast, type Tab } from './ui';
import type { CartState, Push, Route, RouteName } from './types';
import { Login } from './screens/Login';
import { Home, emptyFilters, type HomeFilters } from './screens/Home';
import { Menu } from './screens/Menu';
import { Cart } from './screens/Cart';
import { Checkout, emptyDraft, isDirty, type CheckoutDraft } from './screens/Checkout';
import { OrdersList, Tracking } from './screens/Orders';
import { Profile } from './screens/Profile';

export interface ProcessHandle {
  /** System Back. Returns false when the app should go to the background. */
  back: () => boolean;
}

export const SCREEN_OF: Record<RouteName, Screen> = {
  login: 'login',
  home: 'home',
  menu: 'menu',
  cart: 'cart',
  checkout: 'checkout',
  orders: 'tracking',
  tracking: 'tracking',
  profile: 'profile',
};
const TAB_OF: Partial<Record<RouteName, Tab>> = { home: 'home', menu: 'home', cart: 'cart', orders: 'orders', tracking: 'orders', profile: 'profile' };
const emptyCart: CartState = { restaurantId: null, items: {}, coupons: [] };

interface Props {
  /** Notification that cold-started the app, if any. */
  launchIntent: Push | null;
  /** Notification tapped while the app was running in the background. */
  intent: Push | null;
  onIntentHandled: () => void;
  onScreen: (s: Screen) => void;
  grayscale: boolean;
}

export const AppProcess = forwardRef<ProcessHandle, Props>(function AppProcess({ launchIntent, intent, onIntentHandled, onScreen, grayscale }, ref) {
  const app = useApp();
  const { t, api, cart, setCart, loggedIn, setLoggedIn, seen, active, lang, largeText, landscape, cur, addOrder } = app;

  const [stack, setStack] = useState<Route[]>(() => [{ name: loggedIn ? 'home' : 'login' }]);
  const [splash, setSplash] = useState(true);
  const [filters, setFilters] = useState<HomeFilters>(emptyFilters);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [menus, setMenus] = useState<Record<string, true>>({});
  const [pending, setPending] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<CheckoutDraft>(emptyDraft);
  const [placing, setPlacing] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [newCartFor, setNewCartFor] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef(0);
  const createdInSession = useRef(0);

  const top = stack[stack.length - 1];
  // Auth guard (every screen except the profile, see B19).
  const effective: Route = !loggedIn && top.name !== 'login' && top.name !== 'profile' ? { name: 'login' } : top;

  const toast = useCallback((s: string) => {
    setToastText(s);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Cold start: splash, then Home. BUG B16: the notification that launched the app is ignored.
  useEffect(() => {
    const id = window.setTimeout(() => setSplash(false), 700);
    if (launchIntent?.kind === 'order' && loggedIn) seen('B16', 'tracking');
    if (launchIntent) onIntentHandled();
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warm start from a notification: open the right screen (correct).
  useEffect(() => {
    if (!intent) return;
    if (!loggedIn) setStack([{ name: 'login' }]);
    else if (intent.kind === 'order' && intent.orderId) setStack([{ name: 'home' }, { name: 'orders' }, { name: 'tracking', id: intent.orderId }]);
    else setStack([{ name: 'home' }]);
    onIntentHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.id]);

  useEffect(() => {
    onScreen(SCREEN_OF[effective.name]);
  }, [effective.name, onScreen]);

  // BUG B13: rotating recreates the checkout screen and the draft is not restored.
  const prevLandscape = useRef(landscape);
  useEffect(() => {
    if (prevLandscape.current === landscape) return;
    prevLandscape.current = landscape;
    if (effective.name === 'checkout') {
      setDraft((d) => {
        if (isDirty(d)) seen('B13', 'checkout');
        return emptyDraft;
      });
      setCheckoutError(null);
    }
  }, [landscape, effective.name, seen]);

  const showTabs = !splash && loggedIn && effective.name !== 'login' && effective.name !== 'checkout';
  const visibleTabs = !splash && effective.name !== 'login' && effective.name !== 'checkout';

  useEffect(() => {
    if (!active || splash) return;
    const s = SCREEN_OF[effective.name];
    if (largeText && visibleTabs) seen('B23', s);
    const pricey = ['home', 'menu', 'cart', 'checkout', 'tracking'].includes(effective.name) || (effective.name === 'orders' && app.orders.length > 0);
    const cartShown = effective.name !== 'cart' || totals(cart, cur).count > 0;
    if (lang === 'sr' && pricey && cartShown) seen('B21', s);
  }, [active, splash, effective.name, largeText, visibleTabs, lang, seen, app.orders.length, cart, cur]);

  const push = (r: Route) => setStack((s) => [...s, r]);
  const back = () => {
    if (newCartFor) {
      setNewCartFor(null);
      return true;
    }
    if (stack.length <= 1) return false;
    setStack((s) => s.slice(0, -1));
    return true;
  };
  useImperativeHandle(ref, () => ({ back }));

  const onTab = (tab: Tab) => {
    if (!loggedIn) return setStack([{ name: 'login' }]);
    setStack(tab === 'home' ? [{ name: 'home' }] : [{ name: 'home' }, { name: tab }]);
  };

  // ----- cart actions (menu) -----
  const doAdd = (dishId: string, reset: boolean) => {
    const rid = DISHES[dishId].restaurantId;
    setPending((p) => ({ ...p, [dishId]: (p[dishId] ?? 0) + 1 }));
    if (app.net === 'offline') seen('B24', 'menu');
    api('POST', '/api/cart/items', { ms: 300 }).then(
      () => {
        setPending((p) => ({ ...p, [dishId]: Math.max(0, (p[dishId] ?? 1) - 1) }));
        setCart((c) => {
          const base = reset || c.restaurantId !== rid ? emptyCart : c;
          // BUG B06: no maximum per dish.
          const q = (base.items[dishId] ?? 0) + 1;
          if (q > SPEC.maxPerDish) seen('B06', 'menu');
          return { ...base, restaurantId: rid, items: { ...base.items, [dishId]: q } };
        });
      },
      () => {
        // BUG B24: the failure is swallowed; the pending spinner is never cleared.
      },
    );
  };
  const add = (dishId: string) => {
    const rid = DISHES[dishId].restaurantId;
    if (cart.restaurantId && cart.restaurantId !== rid && Object.keys(cart.items).length > 0) return setNewCartFor(dishId);
    doAdd(dishId, false);
  };
  const remove = (dishId: string) => {
    api('PATCH', `/api/cart/items/${dishId}`, { ms: 300 })
      .then(() =>
        setCart((c) => {
          const q = (c.items[dishId] ?? 0) - 1;
          const items = { ...c.items };
          if (q <= 0) delete items[dishId];
          else items[dishId] = q;
          const empty = Object.keys(items).length === 0;
          return { ...c, items, restaurantId: empty ? null : c.restaurantId, coupons: empty ? [] : c.coupons };
        }),
      )
      .catch(() => toast(t('offlineAction')));
  };

  // ----- place order -----
  const placeOrder = () => {
    if (placing === 0) createdInSession.current = 0;
    setPlacing((n) => n + 1);
    setCheckoutError(null);
    const snapCart = cart;
    const snapDraft = draft;
    const tot = totals(snapCart, cur);
    api('POST', '/api/orders', {
      ms: 1800,
      server: () => {
        const o = addOrder({
          restaurantId: snapCart.restaurantId!,
          items: Object.entries(snapCart.items).map(([dishId, qty]) => ({ dishId, qty })),
          currency: cur,
          subtotal: tot.subtotal,
          discount: tot.discount,
          fee: tot.fee,
          total: tot.total,
          // BUG B14: the typed text is accepted even if no suggestion was picked.
          address: snapDraft.address.trim(),
          slot: snapDraft.slot,
          payment: snapDraft.payment,
          placedAt: app.now,
        });
        return { status: 201, data: o };
      },
    })
      .then((res) => {
        setPlacing((n) => Math.max(0, n - 1));
        createdInSession.current += 1;
        // BUG B12: a second tap while the first request runs creates a second order.
        if (createdInSession.current > 1) {
          seen('B12', 'checkout');
          return;
        }
        if (!snapDraft.picked && !ADDRESSES.includes(snapDraft.address.trim())) seen('B14', 'checkout');
        const o = res.data as { id: string };
        setCart(() => emptyCart);
        setDraft(emptyDraft);
        setStack([{ name: 'home' }, { name: 'orders' }, { name: 'tracking', id: o.id }]);
        toast(t('orderPlaced'));
      })
      .catch(() => {
        setPlacing((n) => Math.max(0, n - 1));
        setCheckoutError(t('errOffline'));
      });
  };

  if (splash)
    return (
      <div className="grid h-full place-items-center bg-(--brand) text-white">
        <div className="flex flex-col items-center gap-2">
          <UtensilsCrossed size={44} aria-hidden="true" />
          <span className="t22 font-extrabold tracking-tight">FoodDash</span>
        </div>
      </div>
    );

  const tot = totals(cart, cur);
  let body: React.ReactNode = null;
  switch (effective.name) {
    case 'login':
      body = (
        <Login
          toast={toast}
          onSuccess={() => {
            setLoggedIn(true);
            setStack([{ name: 'home' }]);
          }}
        />
      );
      break;
    case 'home':
      body = <Home filters={filters} setFilters={setFilters} loaded={restaurantsLoaded} setLoaded={setRestaurantsLoaded} onOpen={(id) => push({ name: 'menu', id })} />;
      break;
    case 'menu':
      body = (
        <Menu
          key={effective.id}
          id={effective.id!}
          cached={!!menus[effective.id!]}
          onLoaded={() => setMenus((m) => ({ ...m, [effective.id!]: true }))}
          onBack={back}
          onCart={() => push({ name: 'cart' })}
          pending={pending}
          onAdd={add}
          onRemove={remove}
        />
      );
      break;
    case 'cart':
      body = <Cart toast={toast} onBack={stack.length > 2 ? back : undefined} onBrowse={() => setStack([{ name: 'home' }])} onCheckout={() => push({ name: 'checkout' })} />;
      break;
    case 'checkout':
      body =
        tot.count > 0 ? (
          <Checkout key={landscape ? 'l' : 'p'} draft={draft} setDraft={setDraft} placing={placing > 0} error={checkoutError} onPlace={placeOrder} onBack={back} />
        ) : (
          <Cart toast={toast} onBrowse={() => setStack([{ name: 'home' }])} onCheckout={() => {}} onBack={back} />
        );
      break;
    case 'orders':
      body = <OrdersList onOpen={(id) => push({ name: 'tracking', id })} />;
      break;
    case 'tracking':
      body = <Tracking key={effective.id} id={effective.id!} onBack={back} grayscale={grayscale} />;
      break;
    case 'profile':
      body = (
        <Profile
          toast={toast}
          onLogout={() => {
            setLoggedIn(false);
            // BUG B19: login is pushed on top of the existing history instead of replacing it.
            setStack((s) => [...s, { name: 'login' }]);
          }}
        />
      );
      break;
  }

  const newCartDish = newCartFor ? DISHES[newCartFor] : null;
  return (
    <div className="relative flex h-full flex-col">
      <div className="relative min-h-0 flex-1">{body}</div>
      {visibleTabs && <TabBar current={TAB_OF[effective.name] ?? null} onTab={onTab} cartCount={showTabs ? tot.count : 0} />}
      {toastText && <Toast text={toastText} />}
      {newCartDish && (
        <Sheet title={t('newCartTitle')} onClose={() => setNewCartFor(null)}>
          <p className="t14 text-(--sub)">{t('newCartBody', { r: restaurantById(cart.restaurantId)?.name ?? '' })}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setNewCartFor(null)} className="t15 h-11 flex-1 rounded-xl bg-(--sf2) font-semibold">
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                const id = newCartFor!;
                setNewCartFor(null);
                doAdd(id, true);
              }}
              className="t15 h-11 flex-1 rounded-xl bg-(--brand) font-semibold text-white"
            >
              {t('newCart')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
});
