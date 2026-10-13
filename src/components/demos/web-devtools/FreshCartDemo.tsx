import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Apple, Banana, Cherry, Croissant, ImageOff, Leaf, Milk, RotateCcw, RotateCw, ShoppingCart, Store, Wheat, WifiOff } from 'lucide-react';
import { DevToolsPanel, reqName, type DevTab, type ElNode, type Throttle } from './DevToolsPanel';
import { kvSet, kvDel, type ConsoleEntry, type Cookie, type KV, type NetEntry, type ReqType } from './types';

/*
 * "FreshCart": a mock grocery web page with a fake Chrome DevTools panel docked below it.
 * Everything the page does (page load, filters, add to cart, saving the profile, logging in)
 * produces realistic network rows, console messages and storage entries.
 *
 * With buggy={true} the same page hides six bugs (don't spoil them for learners!):
 *  1. Saving the profile returns 500, but the page shows a "Profile saved" toast anyway
 *     (the name is updated optimistically and reverts after a reload).
 *  2. The "On sale" filter crashes: the API returns { results } instead of { items } →
 *     "TypeError: Cannot read properties of undefined (reading 'map')", list doesn't change.
 *  3. Every products request is sent twice (duplicate GET /api/products).
 *  4. The croissant image 404s (typo in the file extension: .wepb).
 *  5. GET /api/me leaks passwordHash, internalNotes and lastLoginIp.
 *  6. GET /api/recommendations takes ~6 s (slow server, long TTFB).
 */

const ORIGIN = 'freshcart.example';

type Cat = 'all' | 'fruit' | 'bakery' | 'sale';
interface Product {
  id: string;
  name: string;
  price: number;
  cat: 'fruit' | 'bakery';
  sale: boolean;
  tile: string;
  icon: typeof Apple;
  size: string;
}

const PRODUCTS: Product[] = [
  { id: 'apples', name: 'Gala apples, 1 kg', price: 2.49, cat: 'fruit', sale: true, tile: '#fde2e2', icon: Apple, size: '21.4 kB' },
  { id: 'sourdough', name: 'Sourdough loaf', price: 3.2, cat: 'bakery', sale: false, tile: '#f5e6d3', icon: Wheat, size: '24.9 kB' },
  { id: 'croissant', name: 'Butter croissant', price: 1.1, cat: 'bakery', sale: true, tile: '#fdf0c8', icon: Croissant, size: '18.7 kB' },
  { id: 'bananas', name: 'Fairtrade bananas', price: 1.35, cat: 'fruit', sale: false, tile: '#fef9c3', icon: Banana, size: '19.2 kB' },
];
const RECS = [
  { name: 'Oat milk', icon: Milk },
  { name: 'Blueberries', icon: Cherry },
  { name: 'Baby spinach', icon: Leaf },
];
const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'sale', label: 'On sale' },
];

const STATUS_TEXT: Record<number, string> = { 200: 'OK', 201: 'Created', 401: 'Unauthorized', 404: 'Not Found', 422: 'Unprocessable Content', 500: 'Internal Server Error' };
const MULT: Record<Throttle, number> = { none: 1, fast4g: 1.6, slow4g: 4, '3g': 8, offline: 1 };
const SID = 's%3A9f2c41e7b0a84d6c.Hq2mZ';

const initialCookies = (): Cookie[] => [
  { name: 'session_id', value: SID, domain: ORIGIN, path: '/', expires: 'Session', httpOnly: true, secure: true, sameSite: 'Lax' },
  { name: 'locale', value: 'en-GB', domain: ORIGIN, path: '/', expires: '2027-10-13T09:00:00.000Z', httpOnly: false, secure: true, sameSite: 'Lax' },
  { name: '_ga', value: 'GA1.1.1824406732.1760345000', domain: `.${ORIGIN}`, path: '/', expires: '2027-11-17T09:00:00.000Z', httpOnly: false, secure: false, sameSite: '' },
];
const initialLocal = (): KV => [['fc_theme', 'light']];

const money = (n: number) => `€${n.toFixed(2)}`;
const apiItem = (p: Product) => ({ id: p.id, name: p.name, price: p.price, category: p.cat, onSale: p.sale, image: `/img/products/${p.id}.webp` });
const jsonHeaders = (size: string): [string, string][] => [
  ['content-type', 'application/json; charset=utf-8'],
  ['content-length', String(Math.round(parseFloat(size) * 1024) || 0)],
  ['cache-control', 'no-store'],
];

interface Spec {
  method?: string;
  url: string;
  type: ReqType;
  ms: number;
  status: number;
  size: string;
  body?: unknown;
  response?: unknown;
  reqHeaders?: [string, string][];
  resHeaders?: [string, string][];
  cacheable?: boolean;
  initiator?: string;
}

type Done = (status: number) => void;

export default function FreshCartDemo({ buggy = false }: { buggy?: boolean }) {
  // DevTools state
  const [tab, setTab] = useState<DevTab>(buggy ? 'elements' : 'network');
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [reqs, setReqs] = useState<NetEntry[]>([]);
  const [preserve, setPreserve] = useState(false);
  const [disableCache, setDisableCache] = useState(false);
  const [throttle, setThrottle] = useState<Throttle>('none');
  const [device, setDevice] = useState(false);
  const [selNode, setSelNode] = useState<string | null>('title');
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [forced, setForced] = useState<{ node: string | null; hover: boolean; focus: boolean }>({ node: null, hover: false, focus: false });
  const [cookies, setCookies] = useState<Cookie[]>(initialCookies);
  const [local, setLocal] = useState<KV>(initialLocal);
  const [session, setSession] = useState<KV>([]);

  // Page state
  const [offline, setOffline] = useState(false);
  const [user, setUser] = useState<{ name: string } | null | 'loading'>('loading');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [category, setCategory] = useState<Cat>('all');
  const [recs, setRecs] = useState<typeof RECS | null>(null);
  const [imgs, setImgs] = useState<Record<string, 'loading' | 'ok' | 'broken'>>({});
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Weekly deals');
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});

  // Refs (read inside timers, so they never see stale state)
  const nextId = useRef(1);
  const timers = useRef(new Set<number>());
  const toastTimer = useRef<number | undefined>(undefined);
  const throttleRef = useRef<Throttle>('none');
  const disableCacheRef = useRef(false);
  const preserveRef = useRef(false);
  const cookiesRef = useRef<Cookie[]>(cookies);
  const cache = useRef(new Set<string>());
  const loadedImgs = useRef(new Set<string>());
  const serverName = useRef('Maya');
  const cartItems = useRef<Record<string, number>>({});

  cookiesRef.current = cookies;
  throttleRef.current = throttle;
  disableCacheRef.current = disableCache;
  preserveRef.current = preserve;

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  };

  const log = (level: ConsoleEntry['level'], text: string, source?: string, stack?: string[]) => {
    const id = nextId.current++;
    setLogs((l) => [...l, { id, level, text, source, stack }].slice(-200));
  };

  const showToast = (text: string, tone: 'ok' | 'err' = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const sid = () => cookiesRef.current.find((c) => c.name === 'session_id')?.value;
  const cookieHeader = () => cookiesRef.current.map((c) => `${c.name}=${c.value}`).join('; ');

  const send = (spec: Spec, onDone?: Done) => {
    const id = nextId.current++;
    const thr = throttleRef.current;
    const cacheHit = !!spec.cacheable && !disableCacheRef.current && cache.current.has(spec.url);
    const isOffline = thr === 'offline' && !cacheHit;
    const jitter = (id * 37) % 23;
    const ms = cacheHit ? (spec.type === 'img' ? 0 : 3) : isOffline ? 25 : Math.round(spec.ms * MULT[thr] + jitter);
    const method = spec.method ?? 'GET';
    setReqs((r) => [
      ...r,
      { id, method, url: spec.url, type: spec.type, status: null, size: '', time: 0, requestHeaders: spec.reqHeaders, requestBody: spec.body, initiator: spec.initiator },
    ]);
    later(() => {
      const status = isOffline ? 0 : spec.status;
      const statusText = isOffline ? 'failed' : STATUS_TEXT[status];
      setReqs((r) =>
        r.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                statusText,
                time: ms,
                fromCache: cacheHit,
                size: cacheHit ? (spec.type === 'img' ? '(memory cache)' : '(disk cache)') : isOffline ? '0 B' : spec.size,
                responseBody: isOffline ? undefined : spec.response,
                responseHeaders: isOffline ? undefined : (spec.resHeaders ?? (spec.type === 'fetch' ? jsonHeaders(spec.size) : undefined)),
              }
            : e,
        ),
      );
      if (!isOffline && spec.cacheable && status < 400) cache.current.add(spec.url);
      if (isOffline) {
        log('error', spec.type === 'fetch' ? `${method} https://${ORIGIN}${spec.url} net::ERR_INTERNET_DISCONNECTED` : 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED', spec.type === 'fetch' ? 'app.js:88' : reqName(spec.url));
      } else if (status >= 400) {
        log(
          'error',
          spec.type === 'fetch' ? `${method} https://${ORIGIN}${spec.url} ${status} (${statusText})` : `Failed to load resource: the server responded with a status of ${status} (${statusText})`,
          spec.type === 'fetch' ? 'app.js:88' : reqName(spec.url),
        );
      }
      onDone?.(status);
    }, ms);
  };

  /* ───────── API helpers ───────── */

  const meBody = (name: string) =>
    buggy
      ? {
          id: 4821,
          name,
          email: 'maya@example.com',
          locale: 'en-GB',
          avatarUrl: '/img/avatars/4821.webp',
          role: 'customer',
          passwordHash: '$2b$12$Q8nR0w7aZp1mX3kE9sV2tO6yLh4cGd5fJ8bN1uA7iW3eR0qT9yZxS',
          internalNotes: 'Complained about late delivery on 3 Oct, gave EUR 10 goodwill voucher',
          lastLoginIp: '198.51.100.77',
        }
      : { id: 4821, name, email: 'maya@example.com', locale: 'en-GB', avatarUrl: '/img/avatars/4821.webp' };

  const requestImages = (list: Product[]) => {
    list.forEach((p) => {
      if (loadedImgs.current.has(p.id)) return;
      loadedImgs.current.add(p.id);
      const broken = buggy && p.id === 'croissant';
      const url = broken ? '/img/products/croissant.wepb' : `/img/products/${p.id}.webp`;
      setImgs((m) => ({ ...m, [p.id]: 'loading' }));
      send(
        {
          url,
          type: 'img',
          ms: 120 + PRODUCTS.indexOf(p) * 35,
          status: broken ? 404 : 200,
          size: broken ? '0.5 kB' : p.size,
          cacheable: true,
          initiator: 'deals (parser)',
          response: broken ? '<!DOCTYPE html>\n<html><head><title>404 Not Found</title></head>\n<body><h1>Not Found</h1></body></html>' : undefined,
          resHeaders: broken ? [['content-type', 'text/html']] : [['content-type', 'image/webp'], ['cache-control', 'public, max-age=31536000']],
        },
        (status) => setImgs((m) => ({ ...m, [p.id]: status === 200 ? 'ok' : 'broken' })),
      );
    });
  };

  const fetchProducts = (cat: Cat) => {
    setProductsLoading(true);
    setSession((s) => kvSet(s, 'fc_last_category', cat));
    const list = cat === 'all' ? PRODUCTS : cat === 'sale' ? PRODUCTS.filter((p) => p.sale) : PRODUCTS.filter((p) => p.cat === cat);
    const brokenShape = buggy && cat === 'sale';
    const body = brokenShape ? { results: list.map(apiItem), total: list.length } : { items: list.map(apiItem), total: list.length };
    const spec: Spec = {
      url: `/api/products?category=${cat}`,
      type: 'fetch',
      ms: 360,
      status: 200,
      size: `${(0.6 + list.length * 0.45).toFixed(1)} kB`,
      response: body,
      reqHeaders: [['accept', 'application/json']],
      initiator: 'app.js:142',
    };
    const handle: Done = (status) => {
      setProductsLoading(false);
      if (status === 0) {
        showToast('You seem to be offline', 'err');
        return;
      }
      if (status !== 200) return;
      if (brokenShape) {
        log('error', "Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'map')", 'app.js:214', [
          '    at renderProducts (app.js:214:31)',
          '    at applyFilter (app.js:188:5)',
          '    at async HTMLButtonElement.onFilterClick (app.js:97:9)',
        ]);
        return;
      }
      setProducts(list);
      log('log', `Loaded ${list.length} products (category=${cat})`, 'app.js:201');
      requestImages(list);
    };
    send(spec, handle);
    if (buggy) send(spec, handle); // BUG 3: duplicate request
  };

  const boot = () => {
    log('info', 'FreshCart web v3.2.0 (production build)', 'app.js:12');
    log('warn', "[Deprecation] Listener added for a 'DOMNodeInserted' mutation event. Support for this event type has been removed.", 'chat-widget.js:1');
    const hasSession = !!sid();
    send(
      {
        url: '/api/me',
        type: 'fetch',
        ms: 170,
        status: hasSession ? 200 : 401,
        size: buggy ? '0.6 kB' : '0.3 kB',
        response: hasSession ? meBody(serverName.current) : { error: 'unauthenticated', message: 'Log in to continue' },
        reqHeaders: [
          ['accept', 'application/json'],
          ['cookie', cookieHeader()],
        ],
        initiator: 'app.js:61',
      },
      (status) => {
        if (status === 200) {
          setUser({ name: serverName.current });
          setNameInput(serverName.current);
        } else {
          setUser(null);
          if (status === 401) log('log', 'No active session, showing guest view', 'app.js:66');
        }
      },
    );
    fetchProducts('all');
    send(
      {
        url: '/api/recommendations?limit=3',
        type: 'fetch',
        ms: buggy ? 6100 : 240, // BUG 6
        status: 200,
        size: '0.9 kB',
        response: { items: RECS.map((r, i) => ({ id: `rec_${i + 1}`, name: r.name })), model: 'similar-baskets-v2' },
        reqHeaders: [['accept', 'application/json']],
        initiator: 'app.js:170',
      },
      (status) => setRecs(status === 200 ? RECS : []),
    );
  };

  const loadPage = () => {
    loadedImgs.current = new Set();
    setOffline(false);
    setUser('loading');
    setProducts(null);
    setProductsLoading(false);
    setRecs(null);
    setImgs({});
    setToast(null);
    setNameError(null);
    setSaving(false);
    setCategory('all');
    setPicking(false);
    send(
      {
        url: '/deals',
        type: 'doc',
        ms: 110,
        status: 200,
        size: '14.2 kB',
        response: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>Weekly deals · FreshCart</title>\n  <link rel="stylesheet" href="/static/styles.css">\n  <script src="/static/app.js" defer></script>\n</head>\n…',
        resHeaders: [
          ['content-type', 'text/html; charset=utf-8'],
          ['cache-control', 'no-cache'],
        ],
        reqHeaders: [['cookie', cookieHeader()]],
      },
      (status) => {
        if (status === 0) {
          setOffline(true);
          setUser(null);
          return;
        }
        send({ url: '/static/styles.css', type: 'css', ms: 70, status: 200, size: '38.1 kB', cacheable: true, initiator: 'deals', response: '.site-header{display:flex;justify-content:space-between;…}', resHeaders: [['content-type', 'text/css'], ['cache-control', 'public, max-age=86400']] });
        send(
          { url: '/static/app.js', type: 'js', ms: 150, status: 200, size: '212 kB', cacheable: true, initiator: 'deals', response: '/*! FreshCart web v3.2.0 */\n(()=>{"use strict";…', resHeaders: [['content-type', 'text/javascript'], ['cache-control', 'public, max-age=86400']] },
          (s) => {
            if (s === 200) boot();
            else setUser(null);
          },
        );
      },
    );
  };

  useEffect(() => {
    loadPage();
    return () => {
      clearTimers();
      clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────── Page actions ───────── */

  const reload = () => {
    clearTimers();
    if (preserveRef.current) {
      setReqs((r) => r.map((e) => (e.status === null ? { ...e, status: 0, statusText: 'canceled', time: 0 } : e)));
      log('info', `Navigated to https://${ORIGIN}/deals`);
    } else {
      setReqs([]);
      setLogs([]);
    }
    loadPage();
  };

  const restart = () => {
    clearTimers();
    cache.current = new Set();
    serverName.current = 'Maya';
    cartItems.current = {};
    cookiesRef.current = initialCookies();
    setCookies(cookiesRef.current);
    setLocal(initialLocal());
    setSession([]);
    setReqs([]);
    setLogs([]);
    setCartCount(0);
    setTitle('Weekly deals');
    setNameOverrides({});
    setForced({ node: null, hover: false, focus: false });
    setSelNode('title');
    setDevice(false);
    setPreserve(false);
    preserveRef.current = false;
    setDisableCache(false);
    disableCacheRef.current = false;
    setThrottle('none');
    throttleRef.current = 'none';
    setTab(buggy ? 'elements' : 'network');
    loadPage();
  };

  const chooseCategory = (cat: Cat) => {
    setCategory(cat);
    fetchProducts(cat);
  };

  const logOut = (message: string) => {
    setUser(null);
    showToast(message, 'err');
  };

  const addToCart = (p: Product) => {
    if (user === 'loading') return;
    if (!user) {
      showToast('Log in to add items to your cart', 'err');
      return;
    }
    const hasSession = !!sid();
    const nextCount = Object.values(cartItems.current).reduce((a, b) => a + b, 0) + 1;
    send(
      {
        method: 'POST',
        url: '/api/cart/items',
        type: 'fetch',
        ms: 260,
        status: hasSession ? 201 : 401,
        size: '0.4 kB',
        body: { productId: p.id, qty: 1 },
        response: hasSession ? { cartId: 'c_7f3a', added: { productId: p.id, qty: 1 }, count: nextCount } : { error: 'unauthenticated', message: 'Session expired' },
        reqHeaders: [
          ['content-type', 'application/json'],
          ['cookie', cookieHeader()],
        ],
        initiator: 'app.js:233',
      },
      (status) => {
        if (status === 201) {
          cartItems.current = { ...cartItems.current, [p.id]: (cartItems.current[p.id] ?? 0) + 1 };
          const items = cartItems.current;
          setCartCount(Object.values(items).reduce((a, b) => a + b, 0));
          setLocal((l) => kvSet(l, 'fc_cart', JSON.stringify({ items: Object.entries(items).map(([id, qty]) => ({ id, qty })) })));
          showToast(`${p.name} added to cart`);
        } else if (status === 401) logOut('Your session has expired. Please log in again.');
        else if (status === 0) showToast('You seem to be offline', 'err');
      },
    );
  };

  const logIn = () => {
    send(
      {
        method: 'POST',
        url: '/api/login',
        type: 'fetch',
        ms: 320,
        status: 200,
        size: '0.5 kB',
        body: { email: 'maya@example.com', password: '••••••••' },
        response: { user: meBody(serverName.current) },
        reqHeaders: [['content-type', 'application/json']],
        resHeaders: [
          ['content-type', 'application/json; charset=utf-8'],
          ['set-cookie', `session_id=${SID}; Path=/; HttpOnly; Secure; SameSite=Lax`],
        ],
        initiator: 'app.js:301',
      },
      (status) => {
        if (status !== 200) {
          if (status === 0) showToast('You seem to be offline', 'err');
          return;
        }
        setCookies((c) => {
          const next = [...c.filter((x) => x.name !== 'session_id'), initialCookies()[0]];
          cookiesRef.current = next;
          return next;
        });
        setUser({ name: serverName.current });
        setNameInput(serverName.current);
        showToast(`Welcome back, ${serverName.current}`);
      },
    );
  };

  const saveProfile = () => {
    if (!user || user === 'loading' || saving) return;
    const name = nameInput.trim();
    setNameError(null);
    setSaving(true);
    const hasSession = !!sid();
    let status: number;
    let response: unknown;
    if (!hasSession) {
      status = 401;
      response = { error: 'unauthenticated', message: 'Session expired' };
    } else if (buggy) {
      status = 500; // BUG 1
      response = { error: 'internal_error', message: 'Something went wrong', traceId: '7c1e9a42f0d3' };
    } else if (!name || name.length > 30) {
      status = 422;
      response = { error: 'validation_failed', fields: { displayName: name ? 'Must be 30 characters or fewer' : 'Display name is required' } };
    } else {
      status = 200;
      response = { id: 4821, displayName: name, updatedAt: '2026-10-13T09:41:07Z' };
    }
    if (buggy) setUser({ name: name || 'Maya' }); // optimistic update, never rolled back
    send(
      {
        method: 'PUT',
        url: '/api/profile',
        type: 'fetch',
        ms: 520,
        status,
        size: '0.3 kB',
        body: { displayName: name },
        response,
        reqHeaders: [
          ['content-type', 'application/json'],
          ['cookie', cookieHeader()],
        ],
        initiator: 'app.js:356',
      },
      (st) => {
        setSaving(false);
        if (buggy) {
          showToast('Profile saved'); // BUG 1: shown no matter what the server said
          return;
        }
        if (st === 200) {
          serverName.current = name;
          setUser({ name });
          showToast('Profile saved');
        } else if (st === 422) setNameError(name ? 'Must be 30 characters or fewer.' : 'Please enter a display name.');
        else if (st === 401) logOut('Your session has expired. Please log in again.');
        else if (st === 0) showToast('Could not save. Check your connection.', 'err');
      },
    );
  };

  /* ───────── Storage edits from the Application panel ───────── */

  const deleteCookie = (name: string) =>
    setCookies((c) => {
      const next = c.filter((x) => x.name !== name);
      cookiesRef.current = next;
      return next;
    });
  const clearSite = () => {
    cookiesRef.current = [];
    setCookies([]);
    setLocal([]);
    setSession([]);
    cache.current = new Set();
    showToast('Site data cleared. Reload to see the effect.');
  };

  /* ───────── Elements panel ───────── */

  const shownProducts = products ?? [];
  const first = shownProducts[0];
  const pname = (p: Product) => nameOverrides[p.id] ?? p.name;
  const isForced = (id: string, s: 'hover' | 'focus') => forced.node === id && forced[s];

  const nodes: ElNode[] = [
    { id: 'body', depth: 0, tag: 'body', attrs: [['class', 'page']], styles: [{ selector: 'body', props: [['margin', '0'], ['font-family', 'Inter, system-ui, sans-serif'], ['background', '#f8fafc']] }] },
    { id: 'header', depth: 1, tag: 'header', attrs: [['class', 'site-header']], styles: [{ selector: '.site-header', props: [['display', 'flex'], ['justify-content', 'space-between'], ['padding', '8px 12px'], ['border-bottom', '1px solid #e2e8f0']] }] },
    { id: 'logo', depth: 2, tag: 'a', attrs: [['class', 'logo'], ['href', '/']], text: 'FreshCart', styles: [{ selector: '.logo', props: [['font-weight', '800'], ['color', '#15803d']] }] },
    {
      id: 'account',
      depth: 2,
      tag: 'button',
      attrs: [['class', 'account']],
      text: user && user !== 'loading' ? `Hi, ${user.name}` : 'Log in',
      styles: [{ selector: '.account', props: [['font-size', '13px'], ['max-width', '140px'], ['white-space', 'nowrap'], ['overflow', 'hidden'], ['text-overflow', 'ellipsis']] }],
    },
    { id: 'main', depth: 1, tag: 'main', attrs: [['id', 'content']], styles: [{ selector: '#content', props: [['padding', '12px']] }] },
    { id: 'title', depth: 2, tag: 'h1', attrs: [['class', 'page-title']], text: title, editable: true, styles: [{ selector: '.page-title', props: [['font-size', '20px'], ['font-weight', '700'], ['line-height', '1.2'], ['overflow-wrap', 'anywhere']] }] },
    { id: 'chips', depth: 2, tag: 'div', attrs: [['class', 'chips'], ['role', 'group']], collapsed: true, styles: [{ selector: '.chips', props: [['display', 'flex'], ['gap', '6px'], ['overflow-x', 'auto']] }] },
    { id: 'grid', depth: 2, tag: 'ul', attrs: [['class', 'product-grid']], styles: [{ selector: '.product-grid', props: [['display', 'grid'], ['grid-template-columns', 'repeat(2, 1fr)'], ['gap', '8px']] }] },
    ...(first
      ? ([
          { id: 'card', depth: 3, tag: 'li', attrs: [['class', 'card']], styles: [{ selector: '.card', props: [['background', '#fff'], ['border', '1px solid #e2e8f0'], ['border-radius', '12px'], ['padding', '8px']] }] },
          {
            id: 'img',
            depth: 4,
            tag: 'img',
            attrs: [
              ['src', buggy && first.id === 'croissant' ? '/img/products/croissant.wepb' : `/img/products/${first.id}.webp`],
              ['alt', first.name],
            ],
            selfClosing: true,
            styles: [{ selector: '.card img', props: [['width', '100%'], ['aspect-ratio', '4 / 3'], ['object-fit', 'cover'], ['border-radius', '8px']] }],
          },
          {
            id: 'card-title',
            depth: 4,
            tag: 'h3',
            attrs: [['class', 'card-title']],
            text: pname(first),
            editable: true,
            styles: [{ selector: '.card-title', props: [['font-size', '13px'], ['display', '-webkit-box'], ['-webkit-line-clamp', '2'], ['-webkit-box-orient', 'vertical'], ['overflow', 'hidden']] }],
          },
          {
            id: 'btn',
            depth: 4,
            tag: 'button',
            attrs: [['class', 'btn-add'], ['type', 'button']],
            text: 'Add',
            styles: [{ selector: '.btn-add', props: [['background', '#16a34a'], ['color', '#fff'], ['border-radius', '8px'], ['min-height', '32px'], ['transition', 'background .15s']] }],
            hoverRule: { selector: '.btn-add:hover', props: [['background', '#166534']] },
            focusRule: { selector: '.btn-add:focus-visible', props: [['outline', '2px solid #1d4ed8'], ['outline-offset', '2px']] },
          },
          ...shownProducts.slice(1).map((p) => ({ id: `card-${p.id}`, depth: 3, tag: 'li', attrs: [['class', 'card']] as [string, string][], collapsed: true, styles: [{ selector: '.card', props: [['background', '#fff'], ['border-radius', '12px']] as [string, string][] }] })),
        ] as ElNode[])
      : []),
    { id: 'recs', depth: 2, tag: 'section', attrs: [['class', 'recs'], ['aria-busy', recs === null ? 'true' : 'false']], collapsed: true, styles: [{ selector: '.recs', props: [['margin-top', '16px']] }] },
    { id: 'profile', depth: 2, tag: 'form', attrs: [['class', 'profile']], styles: [{ selector: '.profile', props: [['margin-top', '16px'], ['padding', '10px'], ['background', '#fff'], ['border-radius', '12px']] }] },
    { id: 'name-input', depth: 3, tag: 'input', attrs: [['id', 'displayName'], ['name', 'displayName'], ['value', nameInput]], selfClosing: true, styles: [{ selector: '.profile input', props: [['flex', '1'], ['min-width', '0'], ['border', '1px solid #cbd5e1']] }] },
    {
      id: 'save',
      depth: 3,
      tag: 'button',
      attrs: [['class', 'btn-save'], ['type', 'submit']],
      text: 'Save',
      styles: [{ selector: '.btn-save', props: [['background', '#0f172a'], ['color', '#fff'], ['border-radius', '8px']] }],
      hoverRule: { selector: '.btn-save:hover', props: [['background', '#334155']] },
      focusRule: { selector: '.btn-save:focus-visible', props: [['outline', '2px solid #1d4ed8'], ['outline-offset', '2px']] },
    },
  ];

  const editText = (id: string, text: string) => {
    if (id === 'title') setTitle(text);
    if (id === 'card-title' && first) setNameOverrides((o) => ({ ...o, [first.id]: text }));
  };

  // Highlight the inspected (or hovered while picking) element in the page.
  const hl = (id: string): CSSProperties | undefined => {
    const on = (picking && hoverNode === id) || (!picking && tab === 'elements' && selNode === id);
    return on ? { outline: '2px solid rgba(26,115,232,.9)', outlineOffset: 1, background: 'rgba(111,168,220,.18)' } : undefined;
  };

  const pickTarget = (e: MouseEvent) => (e.target as HTMLElement).closest<HTMLElement>('[data-node]')?.dataset.node ?? null;
  const onPageClickCapture = (e: MouseEvent) => {
    if (!picking) return;
    e.preventDefault();
    e.stopPropagation();
    const id = pickTarget(e);
    if (id) setSelNode(id);
    setPicking(false);
    setHoverNode(null);
    setTab('elements');
  };

  /* ───────── Render ───────── */

  const accountLabel = user === 'loading' ? '…' : user ? `Hi, ${user.name}` : 'Log in';

  const page = offline ? (
    <div className="grid h-full place-items-center p-6 text-center text-[#3c4043]">
      <div>
        <WifiOff className="mx-auto mb-3 text-[#5f6368]" size={36} />
        <p className="text-[17px] font-semibold">No internet</p>
        <p className="mt-1 text-[12px] text-[#5f6368]">ERR_INTERNET_DISCONNECTED</p>
        <p className="mt-2 text-[12px] text-[#5f6368]">Set throttling back to "No throttling" and reload.</p>
      </div>
    </div>
  ) : (
    <div data-node="body" className="@container min-h-full bg-[#f8fafc] text-[#0f172a]" style={hl('body')}>
      <header data-node="header" className="flex items-center justify-between gap-2 border-b border-[#e2e8f0] bg-white px-3 py-2" style={hl('header')}>
        <a data-node="logo" href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 font-extrabold text-[#15803d]" style={hl('logo')}>
          <Store size={16} /> FreshCart
        </a>
        <div className="flex min-w-0 items-center gap-2">
          <button
            data-node="account"
            type="button"
            onClick={() => user === null && logIn()}
            className="max-w-[140px] truncate rounded-md px-2 py-1 text-[13px] font-medium hover:bg-[#f1f5f9] focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
            style={hl('account')}
          >
            {accountLabel}
          </button>
          <span className="flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px] font-semibold text-[#166534]" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart size={13} /> {cartCount}
          </span>
        </div>
      </header>
      <main data-node="main" className="p-3" style={hl('main')}>
        <h1 data-node="title" className="text-[20px] leading-tight font-bold [overflow-wrap:anywhere]" style={hl('title')}>
          {title}
        </h1>
        <p className="text-[12px] text-[#64748b]">Prices valid until Sunday</p>
        <div data-node="chips" role="group" aria-label="Filter products" className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={hl('chips')}>
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => chooseCategory(c.id)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
              style={category === c.id ? { background: '#15803d', borderColor: '#15803d', color: '#fff' } : { background: '#fff', borderColor: '#cbd5e1', color: '#334155' }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ul data-node="grid" className={`mt-2 grid grid-cols-2 gap-2 transition-opacity @lg:grid-cols-4 ${productsLoading ? 'opacity-50' : ''}`} style={hl('grid')} aria-busy={products === null || productsLoading}>
          {products === null
            ? [0, 1, 2, 3].map((i) => (
                <li key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-2">
                  <div className="aspect-[4/3] animate-pulse rounded-lg bg-[#e2e8f0]" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[#e2e8f0]" />
                  <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-[#e2e8f0]" />
                </li>
              ))
            : shownProducts.map((p, i) => {
                const state = imgs[p.id] ?? 'loading';
                const isFirst = i === 0;
                return (
                  <li key={p.id} data-node={isFirst ? 'card' : `card-${p.id}`} className="flex min-w-0 flex-col rounded-xl border border-[#e2e8f0] bg-white p-2" style={hl(isFirst ? 'card' : `card-${p.id}`)}>
                    <div
                      data-node={isFirst ? 'img' : undefined}
                      role="img"
                      aria-label={p.name}
                      className="grid aspect-[4/3] place-items-center rounded-lg"
                      style={{ background: state === 'ok' ? p.tile : '#f1f5f9', ...(isFirst ? hl('img') : {}) }}
                    >
                      {state === 'ok' && <p.icon size={30} className="text-[#0f172a]/60" />}
                      {state === 'broken' && (
                        <span className="flex flex-col items-center gap-1 px-1 text-center text-[10px] text-[#64748b]">
                          <ImageOff size={18} /> {p.name}
                        </span>
                      )}
                      {state === 'loading' && <span className="size-full animate-pulse rounded-lg bg-[#e2e8f0]" />}
                    </div>
                    <h3 data-node={isFirst ? 'card-title' : undefined} className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[13px] leading-[1.2] font-medium [overflow-wrap:anywhere]" style={isFirst ? hl('card-title') : undefined}>
                      {pname(p)}
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className="text-[13px] font-bold">
                        {money(p.price)}
                        {p.sale && <span className="ml-1 rounded bg-[#fee2e2] px-1 text-[10px] font-semibold text-[#b91c1c]">Sale</span>}
                      </span>
                      <button
                        data-node={isFirst ? 'btn' : undefined}
                        type="button"
                        onClick={() => addToCart(p)}
                        aria-label={`Add ${pname(p)} to cart`}
                        className={`min-h-8 rounded-lg px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8] ${isFirst && isForced('btn', 'hover') ? 'bg-[#166534]' : 'bg-[#16a34a]'} ${isFirst && isForced('btn', 'focus') ? 'outline-2 outline-offset-2 outline-[#1d4ed8]' : ''}`}
                        style={isFirst ? hl('btn') : undefined}
                      >
                        Add
                      </button>
                    </div>
                  </li>
                );
              })}
        </ul>
        <section data-node="recs" className="mt-4" style={hl('recs')} aria-busy={recs === null}>
          <h2 className="text-[14px] font-semibold">Recommended for you</h2>
          <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
            {recs === null
              ? [0, 1, 2].map((i) => <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-lg bg-[#e2e8f0]" />)
              : recs.map((r) => (
                  <span key={r.name} className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-[12px]">
                    <r.icon size={14} className="text-[#15803d]" /> {r.name}
                  </span>
                ))}
          </div>
        </section>
        <form
          data-node="profile"
          className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-2.5"
          style={hl('profile')}
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
        >
          <label htmlFor={`displayName-${buggy ? 'b' : 'p'}`} className="text-[12px] font-semibold">
            Display name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id={`displayName-${buggy ? 'b' : 'p'}`}
              data-node="name-input"
              value={nameInput}
              disabled={!user || user === 'loading'}
              onChange={(e) => setNameInput(e.target.value)}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? `nameErr-${buggy ? 'b' : 'p'}` : undefined}
              className="w-0 min-w-0 flex-1 rounded-lg border border-[#cbd5e1] bg-white px-2 py-1.5 text-[13px] text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#1d4ed8] disabled:bg-[#f1f5f9]"
              style={hl('name-input')}
            />
            <button
              data-node="save"
              type="submit"
              disabled={!user || user === 'loading' || saving}
              className={`rounded-lg px-3 text-[13px] font-semibold text-white hover:bg-[#334155] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8] disabled:opacity-50 ${isForced('save', 'hover') ? 'bg-[#334155]' : 'bg-[#0f172a]'} ${isForced('save', 'focus') ? 'outline-2 outline-offset-2 outline-[#1d4ed8]' : ''}`}
              style={hl('save')}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {nameError && (
            <p id={`nameErr-${buggy ? 'b' : 'p'}`} className="mt-1 text-[12px] text-[#b91c1c]">
              {nameError}
            </p>
          )}
          {user === null && <p className="mt-1 text-[12px] text-[#64748b]">Log in to edit your profile.</p>}
        </form>
      </main>
    </div>
  );

  return (
    <div className="not-prose w-full min-w-0">
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-white shadow-[0_24px_48px_-16px_rgba(16,18,35,.25)]" style={{ colorScheme: 'light' }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2 text-[#0e1120]">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <button type="button" onClick={reload} aria-label="Reload page" title="Reload page" className="grid size-7 shrink-0 place-items-center rounded-md text-[#5f6368] hover:bg-[#e8eaed] focus-visible:outline-2 focus-visible:outline-[#1a73e8]">
            <RotateCw size={14} />
          </button>
          <div className="min-w-0 flex-1 truncate rounded-lg border border-[#e5e7ef] bg-white px-3 py-1 font-mono text-[11px] text-[#5f6368]">{ORIGIN}/deals</div>
        </div>

        {/* Page viewport */}
        <div
          className={`relative h-[300px] overflow-auto ${device ? 'bg-[#dadce0]' : 'bg-[#f8fafc]'} ${picking ? 'cursor-crosshair' : ''}`}
          onClickCapture={onPageClickCapture}
          onMouseOver={(e) => picking && setHoverNode(pickTarget(e))}
          onMouseLeave={() => setHoverNode(null)}
        >
          {device ? (
            <div className="mx-auto w-full max-w-[375px]">
              <p className="bg-[#f1f3f4] py-0.5 text-center font-mono text-[10px] text-[#5f6368]">iPhone SE · 375 × 667 · 100%</p>
              <div className="bg-white">{page}</div>
            </div>
          ) : (
            page
          )}
        </div>
        {toast && (
          <div className="pointer-events-none relative">
            <div
              role="status"
              className="absolute bottom-3 left-1/2 z-10 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium text-white shadow-lg"
              style={{ background: toast.tone === 'ok' ? '#166534' : '#b91c1c' }}
            >
              {toast.tone === 'ok' ? '✓' : '!'} {toast.text}
            </div>
          </div>
        )}

        {/* DevTools */}
        <div className="border-t-2 border-[#d7dae0]">
          <DevToolsPanel
            tab={tab}
            onTab={(t) => {
              setTab(t);
              setPicking(false);
            }}
            origin={ORIGIN}
            height={300}
            device={device}
            onToggleDevice={() => setDevice((d) => !d)}
            nodes={nodes}
            selectedNode={selNode}
            onSelectNode={setSelNode}
            picking={picking}
            onTogglePick={() => {
              setPicking((v) => !v);
              setTab('elements');
            }}
            forced={forced.node === selNode ? { hover: forced.hover, focus: forced.focus } : { hover: false, focus: false }}
            onForce={(s, on) => setForced((f) => (f.node === selNode ? { ...f, [s]: on } : { node: selNode, hover: false, focus: false, [s]: on }))}
            onEditText={editText}
            logs={logs}
            onClearConsole={() => setLogs([])}
            requests={reqs}
            onClearNetwork={() => setReqs([])}
            preserveLog={preserve}
            onPreserveLog={setPreserve}
            disableCache={disableCache}
            onDisableCache={setDisableCache}
            throttle={throttle}
            onThrottle={setThrottle}
            cookies={cookies}
            local={local}
            session={session}
            onDeleteCookie={deleteCookie}
            onDeleteLocal={(k) => setLocal((l) => kvDel(l, k))}
            onDeleteSession={(k) => setSession((s) => kvDel(s, k))}
            onClearSite={clearSite}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Reload with the ⟳ button. Settings like throttling apply to the next requests.</span>
        <button type="button" onClick={restart} className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 font-medium hover:text-fg">
          <RotateCcw size={12} /> Restart demo
        </button>
      </div>
    </div>
  );
}
