import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Bell, Circle, Compass, Camera, Download, Lock, Mail, Megaphone, MessageSquare, Package, QrCode, RotateCcw, SearchX, ShoppingBag, Tent, Triangle, User, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken deep-link setup for "Pinecone", an outdoor gear shop (Android).
 * Bugs (don't spoil them for learners!):
 *  1. App Links are only verified for pinecone.example, not www.pinecone.example: www links open the website.
 *  2. Logged out + link to an order: after logging in the app goes to Home, the target is forgotten.
 *  3. A link to a deleted product (999) shows a blank screen (404 from the API is not handled).
 *  4. Cold start from a link: the back stack only contains the target, so Back closes the app.
 *     (Warm start from the background works: Back returns to the previous screen.)
 *  5. The in-app router matches path + query string, so ?utm_… parameters lead to "Page not found".
 *  6. Deferred deep link after install: the pending link is never consumed, so onboarding restarts forever.
 *
 * Working on purpose: QR / push / plain https links, web fallback when not installed (incl. a proper
 * "no longer available" page on the website), Instagram in-app browser with an "Open in app" button,
 * /go/ campaign link when the app is installed, normal first launch after a manual install.
 */

type Screen = { kind: 'home' } | { kind: 'product'; id: number } | { kind: 'order'; id: number } | { kind: 'notfound'; path: string } | { kind: 'login' } | { kind: 'onboarding' };
type View = 'os' | 'app' | 'browser' | 'store';
type AppState = 'foreground' | 'background' | 'killed';
type Tone = 'info' | 'ok' | 'warn' | 'err';

interface IncomingLink {
  id: string;
  source: string;
  icon: typeof Mail;
  title: string;
  url: string;
  inApp?: boolean;
}

const LINKS: IncomingLink[] = [
  { id: 'qr', source: 'QR code', icon: QrCode, title: 'Poster in the shop window', url: 'https://pinecone.example/product/42' },
  { id: 'news', source: 'Email', icon: Mail, title: 'Newsletter: "Trail Tent 2P, now -20%"', url: 'https://pinecone.example/product/42?utm_source=newsletter&utm_medium=email' },
  { id: 'sms', source: 'SMS', icon: MessageSquare, title: 'Jonas: "Look at this rain jacket!"', url: 'https://www.pinecone.example/product/17' },
  { id: 'ship', source: 'Email', icon: Mail, title: '"Your order #8812 has shipped"', url: 'https://pinecone.example/orders/8812' },
  { id: 'push', source: 'Push', icon: Bell, title: '"Order #8812 arrives today"', url: 'pinecone://orders/8812' },
  { id: 'old', source: 'Old email', icon: Mail, title: '2024: "Last chance: Hammock Lite"', url: 'https://pinecone.example/product/999' },
  { id: 'insta', source: 'Instagram', icon: Camera, title: 'Sponsored post: Trail Tent 2P', url: 'https://pinecone.example/product/42', inApp: true },
  { id: 'ad', source: 'Ad', icon: Megaphone, title: 'Banner ad: "10% off your first tent"', url: 'https://pinecone.example/go/spring-tent' },
];

const PRODUCTS: Record<number, { name: string; price: string; color: string }> = {
  42: { name: 'Trail Tent 2P', price: '$189.00', color: '#d9e8dc' },
  17: { name: 'Storm Rain Jacket', price: '$129.00', color: '#dbe4f0' },
  8: { name: 'Mini Camp Stove', price: '$59.00', color: '#f2e3d3' },
};
const CAMPAIGNS: Record<string, number> = { 'spring-tent': 42 };

const GREEN = '#2f6b45';
const sub = 'rgba(28,27,31,.62)';

function parts(url: string) {
  const m = url.match(/^([a-z]+):\/\/([^/?#]*)(.*)$/i);
  if (!m) return { scheme: '', host: '', rest: '' };
  return { scheme: m[1].toLowerCase(), host: m[2].toLowerCase(), rest: m[3] || '/' };
}

/** In-app router. BUG 5: matches the whole rest of the URL, including the query string. */
function appRoute(url: string): Screen {
  const p = parts(url);
  const path = p.scheme === 'pinecone' ? `/${p.host}${p.rest === '/' ? '' : p.rest}` : p.rest;
  let m = path.match(/^\/product\/(\d+)$/);
  if (m) return { kind: 'product', id: Number(m[1]) };
  m = path.match(/^\/orders\/(\d+)$/);
  if (m) return { kind: 'order', id: Number(m[1]) };
  m = path.match(/^\/go\/([a-z-]+)$/);
  if (m && CAMPAIGNS[m[1]]) return { kind: 'product', id: CAMPAIGNS[m[1]] };
  if (path === '/' || path === '') return { kind: 'home' };
  return { kind: 'notfound', path };
}

function Switch({ label, checked, onChange, note }: { label: string; checked: boolean; onChange: () => void; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0 text-sm text-fg">
        {label}
        {note && <span className="block text-xs text-muted">{note}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${checked ? 'bg-brand' : 'bg-line-strong'}`}
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? 'translateX(20px)' : 'none' }} />
      </button>
    </div>
  );
}

function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 px-1" style={{ background: '#f4f7f3' }}>
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Navigate up" className="grid size-10 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#2f6b45]">
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span className="ml-3 grid size-7 place-items-center rounded-lg text-white" style={{ background: GREEN }}>
          <Tent size={15} />
        </span>
      )}
      <p className="ml-2 truncate text-[17px] font-medium">{title}</p>
    </div>
  );
}

function ProductImage({ id, big }: { id: number; big?: boolean }) {
  const p = PRODUCTS[id];
  return (
    <div className={`grid place-items-center rounded-2xl ${big ? 'h-36' : 'h-16 w-16 shrink-0'}`} style={{ background: p?.color ?? '#eee', color: GREEN }}>
      <Tent size={big ? 52 : 26} strokeWidth={1.5} />
    </div>
  );
}

export function BuggyLinkTester() {
  const [installed, setInstalled] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [appState, setAppState] = useState<AppState>('killed');
  const [stack, setStack] = useState<Screen[]>([]);
  const [view, setView] = useState<View>('os');
  const [browser, setBrowser] = useState<{ url: string; inApp: boolean } | null>(null);
  const [store, setStore] = useState<{ deferred: string | null; phase: 'idle' | 'installing' | 'done' }>({ deferred: null, phase: 'idle' });
  const [onboarded, setOnboarded] = useState(true);
  const [deferred, setDeferred] = useState<string | null>(null);
  const [onbStep, setOnbStep] = useState(0);
  const [log, setLog] = useState<{ id: number; text: string; tone: Tone }[]>([]);
  const [toast, setToast] = useState('');
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (text: string, tone: Tone = 'info') => {
    const id = nextId.current++;
    setLog((l) => [{ id, text, tone }, ...l].slice(0, 9));
  };
  const flash = (msg: string) => {
    setToast(msg);
    later(() => setToast(''), 2000);
  };

  const needsLogin = (s: Screen) => s.kind === 'order';

  /** Opens a route in the app, as a cold or warm start. */
  const openInApp = (target: Screen, coldStart: boolean) => {
    if (target.kind === 'product') {
      if (PRODUCTS[target.id]) addLog(`GET /api/products/${target.id} → 200`, 'ok');
      else addLog(`GET /api/products/${target.id} → 404`, 'err');
    }
    if (target.kind === 'notfound') addLog(`Router: no route for "${target.path}"`, 'warn');
    const screen: Screen = needsLogin(target) && !loggedIn ? { kind: 'login' } : target;
    if (screen.kind === 'login') addLog('Not logged in → show Log in', 'info');
    // BUG 4: on a cold start the target becomes the only screen (no Home underneath).
    setStack((st) => (coldStart || st.length === 0 ? [screen] : [...st, screen]));
    setView('app');
    setAppState('foreground');
  };

  const tapLink = (link: IncomingLink) => {
    if (link.url.startsWith('pinecone://') && !installed) return;
    const p = parts(link.url);
    addLog(`${link.source}: ${link.url}`, 'info');
    const cold = appState === 'killed';
    if (link.url.startsWith('pinecone://')) {
      addLog(cold ? 'Cold start (app was not running)' : 'Warm start (app was in background)');
      openInApp(appRoute(link.url), cold);
      return;
    }
    if (link.inApp) {
      addLog('Instagram opens the link in its in-app browser', 'info');
      setBrowser({ url: link.url, inApp: true });
      setView('browser');
      if (appState === 'foreground') setAppState('background');
      return;
    }
    if (!installed) {
      if (p.rest.startsWith('/go/')) {
        addLog('Link service: app not installed → Google Play (link remembered)', 'info');
        setStore({ deferred: p.rest, phase: 'idle' });
        setView('store');
        return;
      }
      addLog('No app handles this link → Chrome', 'info');
      setBrowser({ url: link.url, inApp: false });
      setView('browser');
      return;
    }
    // BUG 1: assetlinks.json is only published on pinecone.example, so www links are not verified.
    if (p.host !== 'pinecone.example') {
      addLog(`App Links: ${p.host} not verified for Pinecone → Chrome`, 'warn');
      setBrowser({ url: link.url, inApp: false });
      setView('browser');
      if (appState === 'foreground') setAppState('background');
      return;
    }
    addLog(`App Links: verified → open Pinecone (${cold ? 'cold start' : 'warm start'})`, 'ok');
    openInApp(appRoute(link.url), cold);
  };

  const goHome = () => {
    if (view === 'os') return;
    setView('os');
    if (appState === 'foreground') setAppState('background');
  };

  const back = () => {
    if (view === 'app') {
      const top = stack[stack.length - 1];
      if (top?.kind === 'onboarding') {
        addLog('Back on onboarding → app closed', 'info');
        setView('os');
        setStack([]);
        setAppState('killed');
        return;
      }
      if (stack.length > 1) {
        setStack((st) => st.slice(0, -1));
        return;
      }
      addLog('Back on the last screen → app closed');
      setView('os');
      setStack([]);
      setAppState('killed');
      return;
    }
    if (view === 'browser' || view === 'store') {
      setView('os');
    }
  };

  const killApp = () => {
    if (!installed) return;
    setAppState('killed');
    setStack([]);
    if (view === 'app') setView('os');
    addLog('App killed (swiped away from Recents)', 'info');
  };

  const launchFromIcon = () => {
    if (!installed) return;
    if (appState !== 'killed' && stack.length > 0) {
      setView('app');
      setAppState('foreground');
      return;
    }
    addLog('Pinecone launched from the home screen');
    if (!onboarded || deferred) {
      if (deferred) addLog(`Deferred link waiting: ${deferred}`, 'info');
      setOnbStep(0);
      setStack([{ kind: 'onboarding' }]);
    } else {
      setStack([{ kind: 'home' }]);
    }
    setView('app');
    setAppState('foreground');
  };

  const finishOnboarding = () => {
    if (deferred) {
      // BUG 6: the deferred link is read again but never cleared, and the handler restarts first-run.
      addLog(`Deferred link: ${deferred} → first launch flow`, 'info');
      setOnboarded(true);
      setOnbStep(0);
      setStack([{ kind: 'onboarding' }]);
      return;
    }
    setOnboarded(true);
    setStack([{ kind: 'home' }]);
  };

  const toggleInstalled = () => {
    if (installed) {
      setInstalled(false);
      setLoggedIn(false);
      setAppState('killed');
      setStack([]);
      setDeferred(null);
      setOnboarded(false);
      if (view === 'app') setView('os');
      addLog('Pinecone uninstalled (app data deleted)', 'info');
    } else {
      setInstalled(true);
      setOnboarded(false);
      setDeferred(null);
      addLog('Pinecone installed from Google Play', 'info');
    }
  };

  const installFromStore = () => {
    const pending = store.deferred;
    setStore((s) => ({ ...s, phase: 'installing' }));
    later(() => {
      setStore((s) => ({ ...s, phase: 'done' }));
      setInstalled(true);
      setOnboarded(false);
      setLoggedIn(false);
      setDeferred(pending);
      setAppState('killed');
      setStack([]);
      addLog('Pinecone installed', 'ok');
    }, 1400);
  };

  const logIn = () => {
    setLoggedIn(true);
    addLog('POST /api/login → 200', 'ok');
    // BUG 2: the screen the user came for is not remembered; always go Home after login.
    addLog('Login OK → Home', 'info');
    setStack([{ kind: 'home' }]);
    flash('Welcome back, Sam');
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setInstalled(true);
    setLoggedIn(true);
    setAppState('killed');
    setStack([]);
    setView('os');
    setBrowser(null);
    setStore({ deferred: null, phase: 'idle' });
    setOnboarded(true);
    setDeferred(null);
    setOnbStep(0);
    setLog([]);
    setToast('');
  };

  /* ---------- phone screens ---------- */

  const top = stack[stack.length - 1];
  const canGoUp = stack.length > 1 || (top && top.kind !== 'home' && top.kind !== 'onboarding' && top.kind !== 'login');

  let screen: ReactNode = null;
  if (view === 'os') {
    const icons = [
      { label: 'Gmail', bg: '#ea4335', icon: Mail },
      { label: 'Messages', bg: '#1a73e8', icon: MessageSquare },
      { label: 'Chrome', bg: '#fbbc04', icon: Compass },
      { label: 'Play Store', bg: '#34a853', icon: Triangle },
    ];
    screen = (
      <div className="flex h-full flex-col px-5 pt-8" style={{ background: 'linear-gradient(160deg,#cfe3d4,#9cc0b2 55%,#6c9a8c)' }}>
        <p className="text-center text-[44px] leading-none font-light text-white drop-shadow">9:41</p>
        <p className="mt-1 text-center text-[12px] text-white/90">Wednesday, 15 October</p>
        <div className="mt-auto mb-10 grid grid-cols-4 gap-y-4 text-center">
          {icons.map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1" aria-hidden="true">
              <span className="grid size-12 place-items-center rounded-full text-white" style={{ background: a.bg }}>
                <a.icon size={20} />
              </span>
              <span className="text-[10px] text-white">{a.label}</span>
            </div>
          ))}
          {installed && (
            <button type="button" onClick={launchFromIcon} className="flex flex-col items-center gap-1 rounded-xl focus-visible:outline-2 focus-visible:outline-white">
              <span className="grid size-12 place-items-center rounded-full text-white" style={{ background: GREEN }}>
                <Tent size={20} />
              </span>
              <span className="text-[10px] text-white">Pinecone</span>
            </button>
          )}
        </div>
      </div>
    );
  } else if (view === 'store') {
    screen = (
      <div className="flex h-full flex-col bg-white px-4 pt-3 text-[#1c1b1f]">
        <p className="text-[13px] font-medium" style={{ color: sub }}>
          Google Play
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid size-16 place-items-center rounded-2xl text-white" style={{ background: GREEN }}>
            <Tent size={30} />
          </span>
          <div>
            <p className="text-[18px] font-semibold">Pinecone</p>
            <p className="text-[12px]" style={{ color: '#01875f' }}>
              Pinecone Outdoor Ltd
            </p>
            <p className="text-[11px]" style={{ color: sub }}>
              4.6 ★ · 100K+ downloads
            </p>
          </div>
        </div>
        {store.phase === 'done' ? (
          <button type="button" onClick={launchFromIcon} className="mt-5 h-10 rounded-full text-[14px] font-medium text-white" style={{ background: '#01875f' }}>
            Open
          </button>
        ) : (
          <button
            type="button"
            disabled={store.phase === 'installing' || installed}
            onClick={installFromStore}
            className="mt-5 flex h-10 items-center justify-center gap-2 rounded-full text-[14px] font-medium text-white disabled:opacity-70"
            style={{ background: '#01875f' }}
          >
            {store.phase === 'installing' ? 'Installing…' : installed ? 'Installed' : 'Install'}
          </button>
        )}
        {store.phase === 'installing' && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e0e0e0]">
            <div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: '#01875f' }} />
          </div>
        )}
        <p className="mt-5 text-[13px] leading-snug" style={{ color: sub }}>
          Tents, jackets and camp kitchens, delivered in 2 days. Track your orders and get member-only deals.
        </p>
      </div>
    );
  } else if (view === 'browser' && browser) {
    const p = parts(browser.url);
    const pm = p.rest.match(/^\/product\/(\d+)/);
    const om = p.rest.match(/^\/orders\/(\d+)/);
    const pid = pm ? Number(pm[1]) : null;
    const product = pid != null ? PRODUCTS[pid] : null;
    screen = (
      <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
        {browser.inApp ? (
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 px-2">
            <button type="button" onClick={back} aria-label="Close" className="grid size-8 place-items-center rounded-full">
              <X size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold">Pinecone Outdoor</p>
              <p className="truncate text-[10px]" style={{ color: sub }}>
                {p.host}
              </p>
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-b border-black/10 px-2 py-1.5" style={{ background: '#f1f3f4' }}>
            <p className="truncate rounded-full bg-white px-3 py-1 text-[11px]" style={{ color: sub }}>
              <Lock size={10} className="mr-1 inline" aria-hidden="true" />
              {p.host}
              {p.rest}
            </p>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 px-3 py-2 text-[12px]" style={{ background: '#eef4ef' }}>
            <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: GREEN }}>
              <Tent size={14} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <strong>Pinecone app</strong>
              <br />
              <span style={{ color: sub }}>Faster checkout in the app</span>
            </span>
            {installed ? (
              <button
                type="button"
                onClick={() => {
                  addLog('Website "Open in app" → Pinecone', 'ok');
                  openInApp(appRoute(`https://pinecone.example${p.rest}`), appState === 'killed');
                }}
                className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                style={{ background: GREEN }}
              >
                Open in app
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStore({ deferred: null, phase: 'idle' });
                  setView('store');
                }}
                className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                style={{ background: GREEN }}
              >
                Get
              </button>
            )}
          </div>
          <div className="px-4 pt-3 pb-6">
            <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: GREEN }}>
              pinecone.example
            </p>
            {product && pid != null ? (
              <>
                <div className="mt-2">
                  <ProductImage id={pid} big />
                </div>
                <p className="mt-3 text-[18px] font-semibold">{product.name}</p>
                <p className="text-[15px]">{product.price}</p>
                <div className="mt-3 h-9 rounded-lg text-center text-[13px] leading-9 font-semibold text-white" style={{ background: '#1c1b1f' }}>
                  Add to cart
                </div>
              </>
            ) : pid != null ? (
              <>
                <p className="mt-3 text-[17px] font-semibold">This product is no longer available</p>
                <p className="mt-1 text-[13px]" style={{ color: sub }}>
                  Hammock Lite was part of a past collection. Take a look at what&rsquo;s new instead.
                </p>
                <div className="mt-3 h-9 rounded-lg text-center text-[13px] leading-9 font-semibold text-white" style={{ background: '#1c1b1f' }}>
                  Shop new arrivals
                </div>
              </>
            ) : om ? (
              <>
                <p className="mt-3 text-[17px] font-semibold">Order #{om[1]}</p>
                <p className="mt-1 text-[13px]" style={{ color: sub }}>
                  Log in to see your order details.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[17px] font-semibold">Spring sale</p>
            )}
          </div>
        </div>
      </div>
    );
  } else if (view === 'app' && top) {
    if (top.kind === 'onboarding') {
      const steps = [
        { title: 'Gear for every trail', text: 'Tents, jackets and stoves tested by our team in real weather.' },
        { title: 'Track every order', text: 'Get a notification when your order ships and when it arrives.' },
      ];
      const s = steps[onbStep];
      screen = (
        <div className="flex h-full flex-col bg-white px-5 pt-10 pb-8 text-center text-[#1c1b1f]">
          <span className="mx-auto grid size-24 place-items-center rounded-full" style={{ background: '#e3efe6', color: GREEN }}>
            {onbStep === 0 ? <Tent size={44} strokeWidth={1.5} /> : <Package size={44} strokeWidth={1.5} />}
          </span>
          <p className="mt-6 text-[22px] font-semibold">{s.title}</p>
          <p className="mt-2 text-[14px]" style={{ color: sub }}>
            {s.text}
          </p>
          <div className="mt-auto flex justify-center gap-1.5" aria-label={`Step ${onbStep + 1} of 2`}>
            {steps.map((_, i) => (
              <span key={i} className="size-2 rounded-full" style={{ background: i === onbStep ? GREEN : '#cfd8d1' }} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (onbStep === 0 ? setOnbStep(1) : finishOnboarding())}
            className="mt-5 h-11 rounded-full text-[15px] font-medium text-white"
            style={{ background: GREEN }}
          >
            {onbStep === 0 ? 'Next' : 'Get started'}
          </button>
        </div>
      );
    } else if (top.kind === 'home') {
      screen = (
        <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
          <TopBar title="Pinecone" onBack={canGoUp ? back : undefined} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
            <p className="text-[20px] font-semibold">{loggedIn ? 'Hi, Sam' : 'Welcome'}</p>
            {loggedIn ? (
              <button
                type="button"
                onClick={() => setStack((st) => [...st, { kind: 'order', id: 8812 }])}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px]"
                style={{ background: '#e3efe6' }}
              >
                <Package size={16} style={{ color: GREEN }} /> Order #8812 · Shipped
              </button>
            ) : (
              <button type="button" onClick={() => setStack((st) => [...st, { kind: 'login' }])} className="mt-2 flex items-center gap-2 text-[13px] font-semibold" style={{ color: GREEN }}>
                <User size={15} /> Log in
              </button>
            )}
            <p className="mt-4 text-[13px] font-semibold">Popular right now</p>
            <div className="mt-2 space-y-2">
              {[42, 17, 8].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStack((st) => [...st, { kind: 'product', id }])}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/10 p-2 text-left"
                >
                  <ProductImage id={id} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{PRODUCTS[id].name}</span>
                    <span className="text-[13px]" style={{ color: sub }}>
                      {PRODUCTS[id].price}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (top.kind === 'product') {
      const product = PRODUCTS[top.id];
      // BUG 3: a 404 for a deleted product leaves product undefined, and the screen renders nothing.
      screen = (
        <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
          <TopBar title={product ? product.name : ''} onBack={back} />
          {product && (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
              <ProductImage id={top.id} big />
              <p className="mt-3 text-[20px] font-semibold">{product.name}</p>
              <p className="text-[16px]">{product.price}</p>
              <p className="mt-1 text-[12px]" style={{ color: '#01875f' }}>
                In stock · Delivery in 2 days
              </p>
              <button type="button" onClick={() => flash('Added to cart')} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-white" style={{ background: GREEN }}>
                <ShoppingBag size={16} /> Add to cart
              </button>
            </div>
          )}
        </div>
      );
    } else if (top.kind === 'order') {
      screen = (
        <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
          <TopBar title={`Order #${top.id}`} onBack={back} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
            <p className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium" style={{ background: '#e3efe6', color: GREEN }}>
              <Package size={13} /> Shipped · arrives today
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ProductImage id={8} />
              <div>
                <p className="text-[14px] font-medium">Mini Camp Stove</p>
                <p className="text-[12px]" style={{ color: sub }}>
                  Qty 1 · $59.00
                </p>
              </div>
            </div>
            <p className="mt-4 text-[12px]" style={{ color: sub }}>
              Delivering to Sam Ortiz, 4 Harbour Rd
            </p>
          </div>
        </div>
      );
    } else if (top.kind === 'login') {
      screen = (
        <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
          <TopBar title="Log in" onBack={canGoUp ? back : undefined} />
          <div className="px-5 pt-4">
            <p className="text-[14px]" style={{ color: sub }}>
              Log in to continue.
            </p>
            <p className="mt-4 text-[12px]" style={{ color: sub }}>
              Email
            </p>
            <p className="mt-1 rounded-lg border border-black/20 px-3 py-2 text-[14px]">sam@test.com</p>
            <p className="mt-3 text-[12px]" style={{ color: sub }}>
              Password
            </p>
            <p className="mt-1 rounded-lg border border-black/20 px-3 py-2 text-[14px] tracking-widest">••••••••</p>
            <button type="button" onClick={logIn} className="mt-5 h-11 w-full rounded-full text-[15px] font-medium text-white" style={{ background: GREEN }}>
              Log in
            </button>
          </div>
        </div>
      );
    } else {
      screen = (
        <div className="flex h-full flex-col bg-white text-[#1c1b1f]">
          <TopBar title="Pinecone" onBack={back} />
          <div className="flex flex-1 flex-col items-center px-6 pt-14 text-center">
            <SearchX size={44} strokeWidth={1.5} style={{ color: sub }} />
            <p className="mt-3 text-[18px] font-semibold">Page not found</p>
            <p className="mt-1 text-[13px]" style={{ color: sub }}>
              We couldn&rsquo;t find what you were looking for.
            </p>
            <button type="button" onClick={() => setStack([{ kind: 'home' }])} className="mt-5 h-10 rounded-full px-5 text-[14px] font-medium text-white" style={{ background: GREEN }}>
              Go to Home
            </button>
          </div>
        </div>
      );
    }
  }

  const stateLabel: Record<AppState, string> = { foreground: 'Open (on screen)', background: 'In background', killed: 'Not running' };
  const toneCls: Record<Tone, string> = { info: 'text-muted', ok: 'text-ok', warn: 'text-warn', err: 'text-danger' };

  return (
    <div className="not-prose @container w-full">
    <div className="grid grid-cols-1 gap-5 @2xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-xl border border-line bg-surface p-3" aria-label="Device state">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Device state</p>
          <Switch label="Pinecone installed" checked={installed} onChange={toggleInstalled} note={installed ? undefined : 'Uninstalling also logs you out'} />
          <Switch label="Logged in" checked={loggedIn} onChange={() => installed && setLoggedIn((v) => !v)} />
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            <span className="text-sm text-fg">
              App: <strong>{installed ? stateLabel[appState] : 'Not installed'}</strong>
            </span>
            <button
              type="button"
              onClick={killApp}
              disabled={!installed || appState === 'killed'}
              className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-fg hover:bg-subtle disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
            >
              Kill app
            </button>
          </div>
        </section>

        <section aria-label="Incoming links">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Incoming links: tap one to open it on the phone</p>
          <ul className="space-y-1.5">
            {LINKS.map((l) => {
              const disabled = l.url.startsWith('pinecone://') && !installed;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => tapLink(l)}
                    className="flex w-full min-w-0 items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-left hover:bg-subtle disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <l.icon size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm text-fg">
                        <span className="font-semibold">{l.source}</span> · {l.title}
                      </span>
                      <span className="block font-mono text-[11px] break-all text-muted">{disabled ? 'Not delivered: app not installed' : l.url}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-subtle p-3" aria-label="Device log">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Device log</p>
            <button type="button" onClick={reset} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand">
              <RotateCcw size={12} /> Reset device
            </button>
          </div>
          <ol className="mt-1.5 space-y-0.5 font-mono text-[11px]" aria-live="polite">
            {log.length === 0 && <li className="text-faint">Nothing yet. Tap a link.</li>}
            {log.map((e) => (
              <li key={e.id} className={`break-all ${toneCls[e.tone]}`}>
                {e.text}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="order-first flex min-w-0 flex-col items-center gap-2 justify-self-center @2xl:order-none">
        <div style={{ colorScheme: 'light' }}>
          <PhoneFrame os="android" width={260}>
            <div className="relative h-full">
              {screen}
              {toast && (
                <div role="status" className="absolute inset-x-4 bottom-8 rounded-lg bg-[#313033] px-3 py-2.5 text-[13px] text-white">
                  {toast}
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
        <div className="flex items-center gap-2" aria-label="Android navigation">
          <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand">
            <Triangle size={12} className="-rotate-90" aria-hidden="true" /> Back
          </button>
          <button type="button" onClick={goHome} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand">
            <Circle size={12} aria-hidden="true" /> Home
          </button>
        </div>
        {store.phase === 'installing' && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Download size={12} /> Installing…
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
