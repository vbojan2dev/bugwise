import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, Leaf, Plus, RefreshCw, RotateCcw, ShoppingBasket } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { ProxyWindow, type Preset } from './ProxyWindow';
import { useFakeProxy, type FakeServer } from './useFakeProxy';

/*
 * Proxy challenge: a deliberately broken grocery app + a fake proxy. Bugs (don't spoil them!):
 *  1. Login sends the password in the URL query string (GET /v1/login?email=…&password=…).
 *  2. The add_to_cart analytics event is sent twice for every tap.
 *  3. A 500 response for /v1/products leaves a blank white screen (no error message, no retry).
 *  4. An empty product list crashes the app (it reads products[0] for the "Deal of the day" banner).
 *  5. The server trusts the total sent by the app: editing the order request changes the amount charged.
 *  6. GET /v1/me returns the full card number and CVV, although the app only shows the last 4 digits.
 */

const API = 'api.freshcart.example';
const METRICS = 'collect.metrics.example';
const catalog = [
  { id: 'apples', name: 'Organic apples', unit: '1 kg', price: 3.49 },
  { id: 'bread', name: 'Sourdough loaf', unit: '800 g', price: 4.5 },
  { id: 'oatmilk', name: 'Oat milk', unit: '1 L', price: 2.79 },
];

const server: FakeServer = (method, path, body) => {
  const p = path.split('?')[0];
  if (method === 'GET' && p === '/v1/login') return { status: 200, body: { token: 'eyJhbGciOiJIUzI1NiJ9.a7f3', user: { id: 4821, name: 'Anna' } } };
  if (method === 'GET' && p === '/v1/products') return { status: 200, body: { products: catalog } };
  if (method === 'GET' && p === '/v1/me')
    return {
      status: 200,
      body: { id: 4821, name: 'Anna Kovač', email: 'anna@example.com', payment: { brand: 'Visa', last4: '4242', number: '4242 4242 4242 4242', cvv: '737', expiry: '08/29' } },
    };
  if (method === 'POST' && p === '/v1/cart') return { status: 201, body: { ok: true } };
  if (method === 'POST' && p === '/v1/events') return { status: 204, body: '' };
  if (method === 'POST' && p === '/v1/orders') {
    // BUG 5: the server charges whatever total the client sends.
    const total = Number((body as { total?: unknown })?.total);
    return { status: 201, body: { order_id: 'A-2291', status: 'paid', charged: Number.isFinite(total) ? total : 0, currency: 'USD' } };
  }
  return { status: 404, body: { error: 'not_found' } };
};

const responsePresets = (): Preset[] => [
  { label: 'Status 500', apply: () => [500, JSON.stringify({ error: 'internal_error' }, null, 2)] },
  { label: 'Status 401', apply: () => [401, JSON.stringify({ error: 'unauthorized' }, null, 2)] },
];

type Screen = 'login' | 'shop' | 'blank' | 'crashed' | 'paid';
type Product = { id: string; name: string; unit: string; price: number };

export function BuggyProxyHunt() {
  const proxy = useFakeProxy({
    server,
    apiHost: API,
    mapLocalPath: '/v1/products',
    mapLocalBody: { products: [] },
    userAgent: 'FreshCart/5.3 (iPhone; iOS 18.0)',
  });
  const { send, setAuthToken } = proxy;
  const [screen, setScreen] = useState<Screen>('login');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState<{ id: string; charged: number } | null>(null);
  const session = useRef(0); // bumps on restart so late responses are ignored

  const loadShop = async () => {
    const s = session.current;
    setProducts(null);
    setScreen('shop');
    void send('POST', METRICS, '/v1/events', { event: 'screen_view', screen: 'shop' });
    send('GET', API, '/v1/me').then((r) => {
      if (s !== session.current || !r || r.status >= 400) return;
      const pay = (r.body as { payment?: { brand?: string; last4?: string } })?.payment;
      if (pay) setCard(`${pay.brand} •••• ${pay.last4}`);
    });
    const res = await send('GET', API, '/v1/products?store=12');
    if (s !== session.current || !res) return;
    // BUG 3: no error handling, a non-200 response leaves an empty screen.
    if (res.status !== 200) return setScreen('blank');
    const list = (res.body as { products?: Product[] })?.products;
    // BUG 4: the "Deal of the day" banner reads list[0] without checking, so an empty (or broken) list crashes the app.
    if (!Array.isArray(list) || list.length === 0) return setScreen('crashed');
    setProducts(list);
  };

  const login = async () => {
    const s = session.current;
    setLoggingIn(true);
    setLoginError(false);
    // BUG 1: credentials in the query string end up in logs, proxies and analytics.
    const res = await send('GET', API, '/v1/login?email=anna%40example.com&password=Summer2024!');
    if (s !== session.current) return;
    setLoggingIn(false);
    if (!res || res.status >= 400) return setLoginError(true);
    setAuthToken((res.body as { token?: string })?.token ?? null);
    void loadShop();
  };

  const add = (p: Product) => {
    // BUG 2: the event is tracked in the button handler AND in the cart observer.
    void send('POST', METRICS, '/v1/events', { event: 'add_to_cart', product_id: p.id, price: p.price });
    void send('POST', METRICS, '/v1/events', { event: 'add_to_cart', product_id: p.id, price: p.price });
    setCart((c) => [...c, p]);
    void send('POST', API, '/v1/cart', { product_id: p.id, qty: 1 });
  };

  const checkout = async () => {
    const s = session.current;
    const items = Object.values(
      cart.reduce<Record<string, { product_id: string; qty: number; price: number }>>((acc, p) => {
        acc[p.id] = acc[p.id] ? { ...acc[p.id], qty: acc[p.id].qty + 1 } : { product_id: p.id, qty: 1, price: p.price };
        return acc;
      }, {}),
    );
    const total = Math.round(cart.reduce((sum, p) => sum + p.price, 0) * 100) / 100;
    setPaying(true);
    const res = await send('POST', API, '/v1/orders', { items, total, currency: 'USD' });
    if (s !== session.current) return;
    setPaying(false);
    if (!res || res.status >= 400) return;
    const b = res.body as { order_id?: string; charged?: number };
    setPaid({ id: String(b.order_id ?? '—'), charged: Number(b.charged ?? 0) });
    setCart([]);
    setScreen('paid');
  };

  const restart = () => {
    session.current++;
    setAuthToken(null);
    setScreen('login');
    setLoggingIn(false);
    setLoginError(false);
    setPaying(false);
    setProducts(null);
    setCard(null);
    setCart([]);
    setPaid(null);
  };

  // Clean slate if the component remounts.
  useEffect(() => () => void session.current++, []);

  const total = cart.reduce((s, p) => s + p.price, 0);

  return (
    <div className="flex w-full max-w-[560px] min-w-0 flex-col items-center gap-4">
      <PhoneFrame width={250}>
        <div className="relative flex h-full flex-col bg-white text-black">
          {screen === 'login' && (
            <div className="flex h-full flex-col px-5 pt-8">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#2f9e44] text-white">
                <Leaf size={24} />
              </span>
              <p className="mt-4 text-[22px] font-bold tracking-tight">Welcome back</p>
              <p className="text-[12px] text-[#6b6b70]">Log in to FreshCart</p>
              <div className="mt-5 space-y-2">
                <div className="rounded-xl border border-[#dee2e6] px-3 py-2">
                  <p className="text-[10px] text-[#868e96]">Email</p>
                  <p className="text-[13px]">anna@example.com</p>
                </div>
                <div className="rounded-xl border border-[#dee2e6] px-3 py-2">
                  <p className="text-[10px] text-[#868e96]">Password</p>
                  <p className="text-[13px] tracking-widest">••••••••••••</p>
                </div>
              </div>
              {loginError && <p className="mt-3 text-[11.5px] text-[#c92a2a]">Couldn’t log you in. Please try again.</p>}
              <button
                type="button"
                onClick={() => void login()}
                disabled={loggingIn}
                className="mt-4 rounded-xl bg-[#2f9e44] py-2.5 text-[14px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
              >
                {loggingIn ? 'Logging in…' : 'Log in'}
              </button>
            </div>
          )}

          {screen === 'shop' && (
            <>
              <div className="flex items-center justify-between px-4 pt-2 pb-2">
                <p className="text-[17px] font-bold tracking-tight">FreshCart</p>
                <button
                  type="button"
                  onClick={() => void loadShop()}
                  aria-label="Refresh products"
                  className="grid size-8 place-items-center rounded-full bg-[#f2f2f7] text-[#2f9e44] focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:outline-none"
                >
                  <RefreshCw size={14} className={products === null ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3">
                {products === null ? (
                  <div className="grid h-40 place-items-center">
                    <span className="size-6 animate-spin rounded-full border-2 border-[#2f9e44] border-t-transparent" aria-label="Loading" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-[#ebfbee] p-3">
                      <p className="text-[10px] font-semibold tracking-wide text-[#2b8a3e] uppercase">Deal of the day</p>
                      <p className="text-[13px] font-semibold">{products[0].name}</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {products.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 rounded-xl bg-[#f8f9fa] p-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold">{p.name}</p>
                            <p className="text-[12px] font-bold tabular-nums">${Number(p.price).toFixed(2)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => add(p)}
                            aria-label={`Add ${p.name} to basket`}
                            className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2f9e44] text-white focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="shrink-0 border-t border-[#e9ecef] px-3 pt-2 pb-5">
                {card && (
                  <p className="mb-1.5 flex items-center gap-1 text-[10.5px] text-[#868e96]">
                    <CreditCard size={12} /> Pay with {card}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void checkout()}
                  disabled={cart.length === 0 || paying}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2f9e44] py-2.5 text-[13px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
                >
                  <ShoppingBasket size={15} />
                  {paying ? 'Paying…' : cart.length ? `Pay $${total.toFixed(2)} (${cart.length})` : 'Basket is empty'}
                </button>
              </div>
            </>
          )}

          {screen === 'paid' && paid && (
            <div className="flex h-full flex-col items-center justify-center px-5 pb-10 text-center">
              <CheckCircle2 size={44} className="text-[#2f9e44]" />
              <p className="mt-3 text-[17px] font-bold">Order placed</p>
              <p className="mt-1 text-[12px] text-[#6b6b70]">Order {paid.id}</p>
              <p className="mt-3 text-[13px]">
                Charged to your card: <strong className="tabular-nums">${paid.charged.toFixed(2)}</strong>
              </p>
              <button type="button" onClick={() => void loadShop()} className="mt-5 rounded-full bg-[#f2f2f7] px-4 py-2 text-[13px] font-semibold text-[#2f9e44]">
                Back to shop
              </button>
            </div>
          )}

          {/* BUG 3: blank screen, nothing to tap */}
          {screen === 'blank' && <div className="h-full bg-white" aria-label="Blank screen" />}

          {/* BUG 4: the app crashed back to the home screen */}
          {screen === 'crashed' && (
            <div className="absolute inset-0 grid grid-cols-4 content-start gap-x-2 gap-y-4 px-4 pt-8" style={{ background: 'linear-gradient(160deg,#4c6ef5,#ae3ec9)' }}>
              {['Mail', 'Maps', 'Photos', 'Camera', 'Clock', 'Notes'].map((a) => (
                <div key={a} className="flex flex-col items-center gap-1">
                  <span className="size-11 rounded-[12px] bg-white/25" />
                  <span className="text-[9.5px] text-white">{a}</span>
                </div>
              ))}
              <button type="button" onClick={() => void loadShop()} className="flex flex-col items-center gap-1" aria-label="Open FreshCart">
                <span className="grid size-11 place-items-center rounded-[12px] bg-[#2f9e44] text-white">
                  <Leaf size={20} />
                </span>
                <span className="text-[9.5px] text-white">FreshCart</span>
              </button>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
        <p className="text-xs text-muted">Stuck on a blank screen? Restart the app like a real user would.</p>
        <button type="button" onClick={restart} className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Restart app
        </button>
      </div>

      <ProxyWindow
        proxy={proxy}
        mapLocalLabel="GET /v1/products → empty-list.json"
        responsePresets={responsePresets}
        emptyHint="Log in on the phone to start capturing traffic."
      />
    </div>
  );
}
