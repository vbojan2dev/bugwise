/*
 * FoodDash 2.0: the Capstone app under test. A simulated phone with device controls, a network log,
 * a screen reader preview and a bug report panel.
 *
 * It contains the 24 deliberate bugs from src/lib/capstone.ts (search for "BUG Bxx").
 * Each one calls observeBug() when it manifests; everything else is meant to work correctly.
 *
 * Time model: the device clock is frozen at SPEC.now and only moves when the learner lets time pass
 * (device controls). Orders progress on "progress time" = real elapsed time + skipped time.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bug } from 'lucide-react';
import { SPEC, fileReport, loadCapstone, observeBug, type Screen } from '@/lib/capstone';
import { AppProcess, type ProcessHandle } from './AppProcess';
import { Ctx, type AppCtx } from './context';
import { restaurantById } from './data';
import { currencyOf, money as fmtMoney, translate, clockOf, type TKey } from './i18n';
import { orderStep } from './orders';
import { appCss } from './styles';
import { LockScreen, Phone, PushBanner, StatusBar } from './Phone';
import { DevicePanel, NetworkLog, ReportForm, ScreenReaderPanel, type ReportDraft } from './Panels';
import { announce } from './a11y';
import type { Api, CartState, Lang, LogEntry, Net, Order, Push, Settings } from './types';

const BASE = new Date(SPEC.now).getTime();
const MIN = 60_000;
const PROMO_EVERY = 20 * MIN;
type AppState = 'active' | 'background' | 'closed';

export default function FoodDashApp() {
  // ---------- device ----------
  const [landscape, setLandscape] = useState(false);
  const [dark, setDark] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [sr, setSr] = useState(false);
  const [net, setNetState] = useState<Net>('wifi');
  const netRef = useRef<Net>('wifi');
  const setNet = (n: Net) => {
    netRef.current = n;
    setNetState(n);
  };
  const [appState, setAppState] = useState<AppState>('active');
  const [launchId, setLaunchId] = useState(1);
  const [launchIntent, setLaunchIntent] = useState<Push | null>(null);
  const [warmIntent, setWarmIntent] = useState<Push | null>(null);

  // ---------- time ----------
  const realStart = useRef(0);
  const [skip, setSkip] = useState(0);
  const [, setTick] = useState(0);
  if (realStart.current === 0 && typeof performance !== 'undefined') realStart.current = performance.now();
  const realElapsed = typeof performance !== 'undefined' && realStart.current ? performance.now() - realStart.current : 0;
  const clock = BASE + skip;
  const progressNow = BASE + realElapsed + skip;

  // ---------- "server" + persisted app data ----------
  const [lang, setLang] = useState<Lang>('en');
  const [loggedIn, setLoggedInState] = useState(false);
  const [cart, setCartState] = useState<CartState>({ restaurantId: null, items: {}, coupons: [] });
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({ orderUpdates: true, promotions: true });
  const [lockPushes, setLockPushes] = useState<Push[]>([]);
  const [banner, setBanner] = useState<Push | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [screen, setScreen] = useState<Screen>('login');
  const [srLines, setSrLines] = useState<string[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState(0);

  const timers = useRef(new Set<number>());
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  // ---------- bug observation ----------
  const seenRef = useRef(new Set<string>());
  const seen = useCallback((id: string, s: Screen) => {
    const key = `${id}:${s}`;
    if (seenRef.current.has(key)) return;
    seenRef.current.add(key);
    observeBug(id, s);
  }, []);

  // ---------- network ----------
  const logId = useRef(0);
  const api: Api = useCallback(
    (method, path, opts = {}) =>
      new Promise((resolve, reject) => {
        const id = ++logId.current;
        const add = (e: LogEntry) => setLog((l) => [e, ...l.filter((x) => x.id !== id)].slice(0, 40));
        if (netRef.current === 'offline') {
          add({ id, method, path, status: 'ERR', ms: 0 });
          later(() => reject(new Error('offline')), 150);
          return;
        }
        const base = opts.ms ?? 350;
        const ms = Math.round(netRef.current === 'slow' ? base * 3.5 + 900 : base * (0.85 + Math.random() * 0.3));
        add({ id, method, path, status: 'pending', ms });
        later(() => {
          if (netRef.current === 'offline') {
            add({ id, method, path, status: 'ERR', ms });
            reject(new Error('offline'));
            return;
          }
          const res = opts.server ? opts.server() : { status: method === 'POST' ? 201 : 200 };
          add({ id, method, path, status: res.status, ms });
          resolve(res);
        }, ms);
      }),
    [later],
  );

  // ---------- refs for the ticking "server" ----------
  const live = useRef({ orders, settings, loggedIn, appState, progressNow, clock, lang });
  live.current = { orders, settings, loggedIn, appState, progressNow, clock, lang };
  const pushId = useRef(0);
  const nextPromo = useRef<number | null>(null);
  const promoIdx = useRef(0);

  const deliver = useCallback(
    (p: Omit<Push, 'id' | 'at'>) => {
      const push: Push = { ...p, id: ++pushId.current, at: clockOf(live.current.clock) };
      if (p.kind === 'promo' && !live.current.settings.promotions) seen('B18', 'profile');
      if (live.current.appState === 'active') setBanner(push);
      else setLockPushes((l) => [...l, push].slice(-8));
    },
    [seen],
  );

  const sendPromo = useCallback(() => {
    // BUG B18: the promotions switch is never checked before sending.
    const l = live.current.lang;
    const i = promoIdx.current++ % 3;
    const keys: [TKey, TKey][] = [
      ['promo1', 'promo1b'],
      ['promo2', 'promo2b'],
      ['promo3', 'promo3b'],
    ];
    deliver({ kind: 'promo', title: translate(l, keys[i][0]), body: translate(l, keys[i][1]) });
  }, [deliver]);

  const serverTick = useCallback(() => {
    const s = live.current;
    // Order status pushes.
    const changed: Order[] = [];
    for (const o of s.orders) {
      const step = orderStep(o, s.progressNow);
      if (step > o.notified) {
        changed.push({ ...o, notified: step });
        if (s.settings.orderUpdates) {
          const key: TKey = step === 1 ? 'pushPreparing' : step === 2 ? 'pushOnTheWay' : 'pushDelivered';
          deliver({ kind: 'order', orderId: o.id, title: translate(s.lang, key), body: translate(s.lang, 'pushOrderBody', { r: restaurantById(o.restaurantId)?.name ?? '', id: o.id }) });
        }
      }
    }
    if (changed.length) setOrders((os) => os.map((o) => changed.find((c) => c.id === o.id) ?? o));
    // Promotions.
    if (s.loggedIn && nextPromo.current != null && s.progressNow >= nextPromo.current) {
      nextPromo.current = s.progressNow + PROMO_EVERY;
      sendPromo();
    }
  }, [deliver, sendPromo]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  // Run the server after every render caused by the tick or a time skip (guarded: only changes when due).
  useEffect(() => {
    serverTick();
  });

  // ---------- capstone report counter ----------
  useEffect(() => {
    const sync = () => setReportCount(loadCapstone().reports.length);
    sync();
    window.addEventListener('capstone-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('capstone-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // ---------- context ----------
  const setLoggedIn = useCallback((v: boolean) => {
    setLoggedInState(v);
    nextPromo.current = v ? live.current.progressNow + 45_000 : null;
  }, []);
  const orderSeq = useRef(48213);
  const addOrder = useCallback((o: Omit<Order, 'id' | 'notified' | 'startAt'>) => {
    const s = live.current;
    const delay = o.slot != null ? Math.max(0, (o.slot - 18) * MIN - clockOf(s.clock) * MIN) : 0;
    const order: Order = { ...o, id: `FD-${orderSeq.current++}`, notified: 0, startAt: s.progressNow + delay };
    live.current = { ...s, orders: [...s.orders, order] };
    setOrders((os) => [...os, order]);
    return order;
  }, []);

  const cur = currencyOf(lang);
  const active = appState === 'active';
  const ctx: AppCtx = useMemo(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      cur,
      money: (n, c) => fmtMoney(n, lang, c ?? cur),
      now: clock,
      progressNow,
      net,
      api,
      dark,
      largeText,
      landscape,
      active,
      loggedIn,
      setLoggedIn,
      cart,
      setCart: (fn) => setCartState(fn),
      orders,
      addOrder,
      settings,
      setSettings,
      seen,
    }),
    [lang, cur, clock, progressNow, net, api, dark, largeText, landscape, active, loggedIn, setLoggedIn, cart, orders, addOrder, settings, seen],
  );

  // ---------- app lifecycle ----------
  const processRef = useRef<ProcessHandle>(null);
  const toBackground = () => {
    setBanner(null);
    setAppState('background');
  };
  const openApp = (p: Push | null) => {
    setLockPushes((l) => (p ? l.filter((x) => x.id !== p.id) : l));
    if (appState === 'closed') {
      setLaunchIntent(p);
      setWarmIntent(null);
      setLaunchId((x) => x + 1);
    } else if (p) setWarmIntent(p);
    setAppState('active');
  };
  const closeApp = () => {
    setBanner(null);
    setAppState('closed');
    setWarmIntent(null);
  };
  const back = () => {
    if (appState !== 'active') return;
    if (processRef.current && !processRef.current.back()) toBackground();
  };
  const onIntentHandled = useCallback(() => {
    setWarmIntent(null);
    setLaunchIntent(null);
  }, []);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(id);
  }, [banner]);

  // ---------- screen reader preview ----------
  const screenRef = useRef<HTMLDivElement>(null);
  const onSr = (e: React.SyntheticEvent) => {
    if (!sr || !screenRef.current) return;
    const a = announce(e.target as Element, screenRef.current);
    if (!a) return;
    setSrLines((l) => [a.text, ...l].slice(0, 5));
    const add = a.target.closest('[data-fd-add]');
    if (add && a.text.replace(/,?\s*(button|dimmed)/g, '').trim() === '') seen('B07', 'menu');
    if (a.target.closest('[data-fd-progress]')) seen('B17', 'tracking');
  };

  const submitReport = (r: ReportDraft) => {
    fileReport(r);
    const n = loadCapstone().reports.length;
    setReportMsg(`Report R${n} saved.`);
    setReportOpen(false);
  };

  const lastPush = banner;
  return (
    <div className="not-prose w-full min-w-0">
      <style>{appCss}</style>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => {
            setReportOpen((o) => !o);
            setReportMsg(null);
          }}
          aria-expanded={reportOpen}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg shadow-sm"
        >
          <Bug size={16} aria-hidden="true" /> Report a bug
        </button>
        <span className="text-sm text-muted">
          Reports filed: <strong className="text-fg tabular-nums">{reportCount}</strong>
        </span>
        <span role="status" className="text-sm font-medium text-ok">
          {reportMsg}
        </span>
      </div>
      {reportOpen && (
        <div className="mb-4">
          <ReportForm initialScreen={screen} onSubmit={submitReport} onCancel={() => setReportOpen(false)} />
        </div>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <div className="w-full min-w-0 sm:w-auto sm:flex-none" style={{ flexBasis: landscape ? 654 : 320, maxWidth: '100%' }}>
          <Phone landscape={landscape}>
            <div
              ref={screenRef}
              className={`fd absolute inset-0 flex flex-col ${dark ? 'dark' : ''} ${largeText ? 'lg' : ''}`}
              style={{ filter: grayscale ? 'grayscale(1)' : undefined }}
              onClickCapture={onSr}
              onFocusCapture={onSr}
            >
              <Ctx.Provider value={ctx}>
                {appState !== 'closed' && (
                  <div className="flex min-h-0 flex-1 flex-col" hidden={appState !== 'active'} style={{ display: appState === 'active' ? undefined : 'none' }}>
                    <div className="bg-(--sf)">
                      <StatusBar time={clockOf(clock)} net={net} landscape={landscape} />
                    </div>
                    <div className={`relative min-h-0 flex-1 ${landscape ? 'pl-6' : ''}`}>
                      <AppProcess key={launchId} ref={processRef} launchIntent={launchIntent} intent={warmIntent} onIntentHandled={onIntentHandled} onScreen={setScreen} grayscale={grayscale} />
                    </div>
                  </div>
                )}
                {appState !== 'active' && (
                  <LockScreen
                    time={clockOf(clock)}
                    net={net}
                    landscape={landscape}
                    pushes={lockPushes}
                    closed={appState === 'closed'}
                    onOpenPush={(p) => openApp(p)}
                    onOpenApp={() => openApp(null)}
                    onClear={() => setLockPushes([])}
                  />
                )}
                {active && lastPush && (
                  <PushBanner
                    push={lastPush}
                    onOpen={() => {
                      setBanner(null);
                      setWarmIntent(lastPush);
                    }}
                    onClose={() => setBanner(null)}
                  />
                )}
                {sr && srLines[0] && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 bottom-2 z-[60] rounded-xl bg-black/85 px-3 py-2 text-[12px] leading-snug text-white">
                    {srLines[0]}
                  </div>
                )}
              </Ctx.Provider>
              <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-[55] h-[4px] w-[110px] -translate-x-1/2 rounded-full opacity-70" style={{ background: dark || appState !== 'active' ? '#fff' : '#000' }} />
            </div>
          </Phone>
        </div>
        <div className="min-w-0 flex-1 basis-[280px] space-y-3">
          <DevicePanel
            landscape={landscape}
            setLandscape={setLandscape}
            dark={dark}
            setDark={setDark}
            largeText={largeText}
            setLargeText={setLargeText}
            grayscale={grayscale}
            setGrayscale={setGrayscale}
            sr={sr}
            setSr={(v) => {
              setSr(v);
              setSrLines([]);
            }}
            net={net}
            setNet={setNet}
            appState={appState}
            onBack={back}
            onBackground={toBackground}
            onReturn={() => openApp(null)}
            onClose={closeApp}
            onSkip={(m) => setSkip((s) => s + m * MIN)}
            onPromo={sendPromo}
          />
          <ScreenReaderPanel on={sr} lines={srLines} />
          <NetworkLog log={log} />
        </div>
      </div>
    </div>
  );
}
