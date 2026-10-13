import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BellOff, Bike, Check, ChevronLeft, ChevronRight, Home, Moon, Power, RotateCcw, Send, Settings, Smartphone, Store } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately buggy food delivery app ("QuickBite") with a fake staging "server console" for sending pushes.
 * Bugs (don't spoil them for learners!):
 *  1. Tapping a push while the app is killed (cold start) opens Home instead of the order (the launch
 *     notification's deep link is ignored). From the background it works.
 *  2. Every cold start registers the device token again and the server stores a duplicate row,
 *     so after one cold start every push is delivered twice.
 *  3. Turning off "Offers & promotions" in the in-app settings is never synced to the server
 *     (no request), so promos keep arriving. "Order updates" syncs correctly.
 *  4. A push that arrives while the app is in the foreground is ignored: no in-app banner, and the
 *     order screen keeps the old status until you leave and come back.
 *  5. German pushes are sent with raw placeholders ("{{restaurant}}", "{{driver}}"): the server
 *     only fills in placeholders for English.
 *  6. The badge count on the app icon is never cleared, not even after opening the app or the order.
 *
 * Working on purpose: notification permission off (nothing shown, settings screen explains it),
 * Do Not Disturb (delivered silently, no banner), quiet hours for promos in the user's own time zone,
 * order updates switch, deep link from the background, data refresh when the app is opened.
 */

type AppState = 'foreground' | 'background' | 'killed';
type Screen = 'home' | 'order' | 'settings';
type EventKey = 'confirmed' | 'pickedUp' | 'arriving' | 'delivered' | 'promo';
type Lang = 'en' | 'de';
interface Text {
  title: string;
  body: string;
}
interface Notif extends Text {
  id: number;
  link: 'order' | 'home';
  time: string;
  silenced: boolean;
}
interface LogLine {
  id: number;
  text: string;
  tone: 'ok' | 'warn' | 'info';
}

const ORANGE = '#ea580c';
const TOKEN = 'a1f3…9c';
const SERVER_UTC = 20 * 60 + 30; // 20:30 UTC
const STATUSES = ['Placed', 'Confirmed', 'On the way', 'Arriving', 'Delivered'];
const VALUES: Record<string, string> = { restaurant: 'Pasta Roma', driver: 'Marco' };

const EVENTS: Record<EventKey, { label: string; status?: number; link: 'order' | 'home'; en: Text; de: Text }> = {
  confirmed: {
    label: 'Order confirmed',
    status: 1,
    link: 'order',
    en: { title: 'Order confirmed', body: '{{restaurant}} is preparing your food.' },
    de: { title: 'Bestellung bestätigt', body: '{{restaurant}} bereitet dein Essen zu.' },
  },
  pickedUp: {
    label: 'Picked up',
    status: 2,
    link: 'order',
    en: { title: 'On the way', body: '{{driver}} picked up your order. Arriving in 18 min.' },
    de: { title: 'Unterwegs', body: '{{driver}} hat deine Bestellung abgeholt. Ankunft in 18 Min.' },
  },
  arriving: {
    label: 'Driver arriving',
    status: 3,
    link: 'order',
    en: { title: 'Driver arriving', body: '{{driver}} is 2 minutes away.' },
    de: { title: 'Fahrer kommt gleich', body: '{{driver}} ist in 2 Minuten da.' },
  },
  delivered: {
    label: 'Delivered',
    status: 4,
    link: 'order',
    en: { title: 'Delivered', body: 'Enjoy your meal! How was {{restaurant}}?' },
    de: { title: 'Geliefert', body: 'Guten Appetit! Wie war {{restaurant}}?' },
  },
  promo: {
    label: 'Promo: 20% off',
    link: 'home',
    en: { title: '20% off tonight', body: 'Use code PASTA20 before midnight.' },
    de: { title: '20 % Rabatt heute Abend', body: 'Mit dem Code PASTA20 bis Mitternacht.' },
  },
};

const ZONES = [
  { id: 'ny', label: 'New York (UTC−5)', offset: -5 },
  { id: 'lon', label: 'London (UTC+0)', offset: 0 },
  { id: 'ber', label: 'Berlin (UTC+1)', offset: 1 },
  { id: 'tok', label: 'Tokyo (UTC+9)', offset: 9 },
];

const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (m, k: string) => VALUES[k] ?? m);

function renderText(ev: EventKey, lang: Lang): Text {
  const t = EVENTS[ev][lang];
  // BUG 5: placeholders are only filled in for English.
  if (lang !== 'en') return t;
  return { title: fill(t.title), body: fill(t.body) };
}

function Switch({ checked, onChange, label, accent = ORANGE }: { checked: boolean; onChange: () => void; label: string; accent?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      style={{ background: checked ? accent : 'rgba(120,120,128,.32)' }}
    >
      <span className="absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? 'translateX(16px)' : 'none' }} />
    </button>
  );
}

function AppIcon({ size = 46 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center text-white" style={{ width: size, height: size, borderRadius: size * 0.24, background: 'linear-gradient(135deg,#fb923c,#ea580c)' }}>
      <Bike size={size * 0.52} />
    </span>
  );
}

function NotifCard({ n, onTap }: { n: Notif; onTap?: () => void }) {
  const inner = (
    <>
      <AppIcon size={30} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] font-semibold">{n.title}</span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-black/45">
            {n.silenced && <Moon size={10} aria-label="Silenced by Do Not Disturb" />}
            {n.time}
          </span>
        </span>
        <span className="block text-[12px] leading-snug">{n.body}</span>
      </span>
    </>
  );
  const cls = 'flex w-full items-start gap-2 rounded-2xl bg-white/85 p-2.5 text-left text-black shadow-md';
  return onTap ? (
    <button type="button" onClick={onTap} className={`${cls} focus-visible:outline-2 focus-visible:outline-white`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function BuggyDeliveryPush() {
  const timers = useRef<number[]>([]);
  const bannerTimer = useRef<number | undefined>(undefined);
  const nextId = useRef(1);
  const server = useRef({ tokens: [TOKEN], prefs: { orders: true, promos: true }, status: 0 });

  // "Server" state mirrored for display
  const [tokens, setTokens] = useState<string[]>([TOKEN]);
  const [serverPrefs, setServerPrefs] = useState({ orders: true, promos: true });
  const [serverStatus, setServerStatus] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);

  // Device
  const [appState, setAppState] = useState<AppState>('foreground');
  const [allowed, setAllowed] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [zone, setZone] = useState('lon');
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [banner, setBanner] = useState<Notif | null>(null);
  const [badge, setBadge] = useState(0);

  // App
  const [screen, setScreen] = useState<Screen>('home');
  const [shownStatus, setShownStatus] = useState(0);
  const [prefs, setPrefs] = useState({ orders: true, promos: true });
  const [splash, setSplash] = useState(false);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(bannerTimer.current);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (text: string, tone: LogLine['tone']) => {
    const id = nextId.current++;
    setLog((l) => [{ id, text, tone }, ...l].slice(0, 7));
  };

  const offset = ZONES.find((z) => z.id === zone)?.offset ?? 0;
  const localMin = (SERVER_UTC + offset * 60 + 1440) % 1440;
  const quiet = localMin >= 21 * 60 || localMin < 8 * 60;

  const showBanner = (n: Notif) => {
    setBanner(n);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 3500);
  };

  const deliver = (ev: EventKey, text: Text) => {
    if (!allowed) return; // correct: the OS drops it when notifications are off
    if (appState === 'foreground') return; // BUG 4: no in-app banner, no refresh of the order screen
    const n: Notif = { id: nextId.current++, ...text, link: EVENTS[ev].link, time: fmt(localMin), silenced: dnd };
    setNotifs((p) => [n, ...p].slice(0, 12));
    setBadge((b) => b + 1);
    if (!dnd) showBanner(n);
  };

  const send = (ev: EventKey) => {
    const e = EVENTS[ev];
    const s = server.current;
    if (e.status !== undefined) {
      s.status = e.status;
      setServerStatus(e.status);
    }
    if (ev === 'promo' ? !s.prefs.promos : !s.prefs.orders) {
      addLog(`${e.label}: not sent, user turned this type off`, 'info');
      return;
    }
    if (ev === 'promo' && quiet) {
      addLog(`${e.label}: held until 08:00 user time (quiet hours, it is ${fmt(localMin)} there)`, 'warn');
      return;
    }
    const text = renderText(ev, lang);
    s.tokens.forEach((t) => {
      addLog(`→ APNs ${t} "${text.title}" · 200 OK`, 'ok');
      deliver(ev, text);
    });
  };

  const register = () => {
    const s = server.current;
    // BUG 2: the server inserts a new row instead of updating the existing token.
    s.tokens = [...s.tokens, TOKEN];
    setTokens(s.tokens);
    addLog(`POST /devices {token: ${TOKEN}} · 201 Created`, 'info');
  };

  const open = (link?: 'order' | 'home') => {
    if (appState === 'foreground') return;
    const cold = appState === 'killed';
    setShownStatus(server.current.status); // correct: fresh data when the app opens
    if (cold) {
      register();
      setScreen('home'); // BUG 1: the deep link of the launch notification is ignored on cold start
      setSplash(true);
      later(() => setSplash(false), 700);
    } else if (link) {
      setScreen(link);
    }
    setAppState('foreground');
    setBanner(null);
    // BUG 6: the badge is never reset (should be setBadge(0) or the number of unread updates)
  };

  const tapNotif = (n: Notif) => {
    setNotifs((p) => p.filter((x) => x.id !== n.id));
    open(n.link);
  };

  const goHome = () => {
    if (appState === 'foreground') setAppState('background');
  };
  const forceQuit = () => {
    if (appState === 'killed') return;
    setAppState('killed');
    setScreen('home');
    setSplash(false);
  };

  const openOrder = () => {
    setShownStatus(server.current.status);
    setScreen('order');
  };

  const toggleOrders = () => {
    const v = !server.current.prefs.orders;
    server.current.prefs = { ...server.current.prefs, orders: v };
    setServerPrefs(server.current.prefs);
    setPrefs((p) => ({ ...p, orders: v }));
    addLog(`PUT /me/notification-settings {orders: ${v}} · 200`, 'info');
  };
  // BUG 3: only the local switch changes, nothing is sent to the server.
  const togglePromos = () => setPrefs((p) => ({ ...p, promos: !p.promos }));

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(bannerTimer.current);
    server.current = { tokens: [TOKEN], prefs: { orders: true, promos: true }, status: 0 };
    setTokens([TOKEN]);
    setServerPrefs({ orders: true, promos: true });
    setServerStatus(0);
    setLog([]);
    setAppState('foreground');
    setAllowed(true);
    setDnd(false);
    setLang('en');
    setZone('lon');
    setNotifs([]);
    setBanner(null);
    setBadge(0);
    setScreen('home');
    setShownStatus(0);
    setPrefs({ orders: true, promos: true });
    setSplash(false);
  };

  // ---------- Phone content ----------
  const sub = 'rgba(60,60,67,.6)';
  let phone: ReactNode;

  if (appState !== 'foreground') {
    phone = (
      <div className="flex h-full flex-col px-3 pt-2 pb-6 text-white" style={{ background: 'linear-gradient(165deg,#334155,#1e1b4b 60%,#0f172a)' }}>
        <div className="text-center">
          <p className="text-[40px] leading-none font-semibold tracking-tight">{fmt(localMin)}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-white/70">
            {ZONES.find((z) => z.id === zone)?.label.split(' (')[0]}
            {dnd && (
              <span className="ml-1 flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-px">
                <Moon size={10} /> Do Not Disturb
              </span>
            )}
          </p>
        </div>
        <p className="mt-3 mb-1.5 text-[11px] font-semibold text-white/70">Notification Center</p>
        <div className="relative min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {notifs.length === 0 && <p className="pt-3 text-center text-[12px] text-white/50">No notifications</p>}
          {notifs.map((n) => (
            <NotifCard key={n.id} n={n} onTap={() => tapNotif(n)} />
          ))}
        </div>
        <p className="mt-1 text-center text-[10px] text-white/50">App is {appState === 'killed' ? 'not running (killed)' : 'in the background'}</p>
        <div className="mt-2 flex items-end justify-around rounded-[22px] bg-white/15 px-2 py-2">
          {['#22c55e', '#3b82f6', '#a855f7'].map((c) => (
            <span key={c} aria-hidden="true" className="size-[42px] rounded-[11px]" style={{ background: c, opacity: 0.8 }} />
          ))}
          <button type="button" onClick={() => open()} aria-label={`QuickBite${badge ? `, ${badge} notifications` : ''}`} className="relative rounded-[11px] focus-visible:outline-2 focus-visible:outline-white">
            <AppIcon size={42} />
            {badge > 0 && <span className="absolute -top-1.5 -right-1.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold">{badge}</span>}
          </button>
        </div>
        {banner && (
          <div className="absolute inset-x-2 top-1 z-20">
            <NotifCard n={banner} onTap={() => tapNotif(banner)} />
          </div>
        )}
      </div>
    );
  } else if (splash) {
    phone = (
      <div className="grid h-full place-items-center" style={{ background: ORANGE }}>
        <span className="flex flex-col items-center gap-2 text-white">
          <Bike size={44} />
          <span className="text-[18px] font-bold tracking-tight">QuickBite</span>
        </span>
      </div>
    );
  } else if (screen === 'order') {
    phone = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-2 pb-8">
        <button type="button" onClick={() => setScreen('home')} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: ORANGE }}>
          <ChevronLeft size={22} /> Home
        </button>
        <p className="mt-2 text-[22px] font-bold tracking-tight">Order #4821</p>
        <p className="text-[12px]" style={{ color: sub }}>
          Pasta Roma · 2 items · €24.90
        </p>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            Status
          </p>
          <p className="mt-0.5 text-[18px] font-bold" style={{ color: ORANGE }}>
            {STATUSES[shownStatus]}
          </p>
          <ol className="mt-2 space-y-1.5">
            {STATUSES.map((st, i) => (
              <li key={st} className="flex items-center gap-2 text-[13px]">
                <span className="grid size-5 place-items-center rounded-full" style={{ background: i <= shownStatus ? ORANGE : 'rgba(120,120,128,.2)', color: '#fff' }}>
                  {i <= shownStatus && <Check size={12} />}
                </span>
                <span style={{ color: i <= shownStatus ? '#000' : sub }}>{st}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-3 text-[11px]" style={{ color: sub }}>
          Driver: Marco · Delivery to 21 Baker St
        </p>
      </div>
    );
  } else if (screen === 'settings') {
    phone = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-2 pb-8">
        <button type="button" onClick={() => setScreen('home')} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: ORANGE }}>
          <ChevronLeft size={22} /> Home
        </button>
        <p className="mt-2 text-[22px] font-bold tracking-tight">Notifications</p>
        {!allowed && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff4e5] p-2.5 text-[12px] text-[#7c2d12]">
            <BellOff size={16} className="mt-px shrink-0" />
            <span>Notifications are off for QuickBite in iOS Settings. Turn them on in Settings › Notifications › QuickBite.</span>
          </div>
        )}
        <div className="mt-3 divide-y divide-black/[.06] overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px]">Order updates</span>
              <span className="block text-[11px]" style={{ color: sub }}>
                Status changes for your orders
              </span>
            </span>
            <Switch checked={prefs.orders} onChange={toggleOrders} label="Order updates" accent="#34c759" />
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px]">Offers &amp; promotions</span>
              <span className="block text-[11px]" style={{ color: sub }}>
                Discounts and news
              </span>
            </span>
            <Switch checked={prefs.promos} onChange={togglePromos} label="Offers and promotions" accent="#34c759" />
          </div>
        </div>
        <p className="mt-2 px-1 text-[11px]" style={{ color: sub }}>
          We never send offers between 21:00 and 08:00 your time.
        </p>
      </div>
    );
  } else {
    phone = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-2 pb-8">
        <div className="flex items-center justify-between">
          <p className="text-[24px] font-bold tracking-tight">QuickBite</p>
          <button type="button" onClick={() => setScreen('settings')} aria-label="Notification settings" className="grid size-9 place-items-center rounded-full bg-white" style={{ color: ORANGE }}>
            <Settings size={18} />
          </button>
        </div>
        <p className="mt-2 mb-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
          Your order
        </p>
        <button type="button" onClick={openOrder} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffedd5]" style={{ color: ORANGE }}>
            <Bike size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">Pasta Roma</span>
            <span className="block text-[12px]" style={{ color: ORANGE }}>
              {STATUSES[shownStatus]}
            </span>
          </span>
          <ChevronRight size={18} style={{ color: sub }} />
        </button>
        <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
          Near you
        </p>
        <div className="divide-y divide-black/[.06] overflow-hidden rounded-2xl bg-white text-[13px]">
          {['Sushi Go · 20 min', 'Burger Lab · 25 min', 'Green Bowl · 15 min'].map((r) => (
            <div key={r} className="flex items-center gap-3 px-3 py-2.5">
              <Store size={16} style={{ color: sub }} />
              {r}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stateLabel = { foreground: 'Foreground (open)', background: 'Background', killed: 'Killed (not running)' }[appState];
  const btn = 'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-subtle px-2 py-2 text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-subtle';
  const selectCls = 'w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg';
  const toneColor = { ok: '#34d399', warn: '#fbbf24', info: '#7dd3fc' };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {phone}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          App state: <strong className="text-fg">{stateLabel}</strong>
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <button type="button" onClick={() => open()} disabled={appState === 'foreground'} className={btn}>
            <Smartphone size={13} /> Open app
          </button>
          <button type="button" onClick={goHome} disabled={appState !== 'foreground'} className={btn}>
            <Home size={13} /> Home screen
          </button>
          <button type="button" onClick={forceQuit} disabled={appState === 'killed'} className={btn}>
            <Power size={13} /> Force quit
          </button>
        </div>
        <div className="mt-3 space-y-2 text-sm text-fg">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0">Allow notifications (iOS Settings)</span>
            <Switch checked={allowed} onChange={() => setAllowed((v) => !v)} label="Allow notifications in iOS Settings" accent="#34c759" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0">Do Not Disturb</span>
            <Switch checked={dnd} onChange={() => setDnd((v) => !v)} label="Do Not Disturb" accent="#5e5ce6" />
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className="shrink-0">Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={`${selectCls} max-w-[11rem]`}>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="shrink-0">Time zone</span>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className={`${selectCls} max-w-[11rem]`}>
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold tracking-wide text-white/50 uppercase">Server console (staging)</p>
        <div className="space-y-1 px-3 pt-2 text-[12px]">
          <p>
            Order #4821: <strong className="text-white">{STATUSES[serverStatus]}</strong>
          </p>
          <p>
            Server time 20:30 UTC · user’s time <strong className="text-white">{fmt(localMin)}</strong>
          </p>
          <p>
            Anna’s settings: orders <strong className="text-white">{serverPrefs.orders ? 'on' : 'off'}</strong> · promos <strong className="text-white">{serverPrefs.promos ? 'on' : 'off'}</strong>
          </p>
          <p>
            Device tokens ({tokens.length}): <span className="font-mono text-[11px] text-white">{tokens.join(', ')}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 px-3 pt-2.5">
          {(Object.keys(EVENTS) as EventKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => send(k)}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-[12px] font-medium text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#7dd3fc] ${k === 'promo' ? 'col-span-2' : ''}`}
            >
              <Send size={12} className="shrink-0" /> <span className="truncate">{EVENTS[k].label}</span>
            </button>
          ))}
        </div>
        <ul className="mt-2.5 min-h-[4.5rem] space-y-1 border-t border-white/10 px-3 py-2 font-mono text-[11px]" aria-live="polite">
          {log.length === 0 && <li className="text-white/35">Send a push to see what happens…</li>}
          {log.map((l) => (
            <li key={l.id} className="leading-snug break-words" style={{ color: toneColor[l.tone] }}>
              {l.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Tapping an order update opens that order.</li>
          <li>In the open app, updates show an in-app banner and refresh the screen.</li>
          <li>Users choose which types they get. Offers are never sent 21:00–08:00 their time.</li>
          <li>The badge shows unread updates.</li>
        </ul>
      </div>
    </div>
  );
}
