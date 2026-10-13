import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Leaf, Plus, RefreshCw, ShoppingBasket } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { ProxyWindow, type Preset } from './ProxyWindow';
import { useFakeProxy, type FakeServer } from './useFakeProxy';

/*
 * Proxy playground: a well-behaved grocery app talks to a fake server through a fake proxy.
 * Learners use Breakpoint / Map Local / Throttle and watch how the app reacts.
 */

const API = 'api.freshcart.example';
const METRICS = 'collect.metrics.example';

const catalog = [
  { id: 'apples', name: 'Organic apples', unit: '1 kg', price: 3.49 },
  { id: 'bread', name: 'Sourdough loaf', unit: '800 g', price: 4.5 },
  { id: 'oatmilk', name: 'Oat milk', unit: '1 L', price: 2.79 },
  { id: 'eggs', name: 'Free-range eggs', unit: '12 pack', price: 3.95 },
];

const server: FakeServer = (method, path) => {
  const p = path.split('?')[0];
  if (method === 'GET' && p === '/v1/products') return { status: 200, body: { products: catalog } };
  if (method === 'POST' && p === '/v1/cart') return { status: 201, body: { ok: true } };
  if (method === 'POST' && p === '/v1/events') return { status: 204, body: '' };
  return { status: 404, body: { error: 'not_found' } };
};

type Product = { id: string; name: string; unit: string; price: unknown };
type View = { kind: 'loading' } | { kind: 'list'; items: Product[] } | { kind: 'empty' } | { kind: 'error'; status: number } | { kind: 'malformed' } | { kind: 'aborted' };

const responsePresets = (): Preset[] => [
  {
    label: 'First price → 0.01',
    apply: (s, t) => {
      try {
        const j = JSON.parse(t);
        if (Array.isArray(j?.products) && j.products[0]) j.products[0].price = 0.01;
        return [s, JSON.stringify(j, null, 2)];
      } catch {
        return [s, t];
      }
    },
  },
  { label: 'Status 500', apply: () => [500, JSON.stringify({ error: 'internal_error' }, null, 2)] },
  { label: 'Empty list', apply: (s) => [s, JSON.stringify({ products: [] }, null, 2)] },
  { label: 'Break the JSON', apply: (s, t) => [s, t.slice(0, Math.max(10, Math.floor(t.length / 2)))] },
];

export default function ProxyLab() {
  const proxy = useFakeProxy({
    server,
    apiHost: API,
    mapLocalPath: '/v1/products',
    mapLocalBody: { products: [] },
    userAgent: 'FreshCart/5.2 (iPhone; iOS 18.0)',
  });
  const { send } = proxy;
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [cart, setCart] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const loadId = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const load = async () => {
    const id = ++loadId.current;
    setView({ kind: 'loading' });
    void send('POST', METRICS, '/v1/events', { event: 'screen_view', screen: 'products' });
    const res = await send('GET', API, '/v1/products?store=12');
    if (id !== loadId.current) return;
    if (!res) return setView({ kind: 'aborted' });
    if (res.status >= 400) return setView({ kind: 'error', status: res.status });
    const items = (res.body as { products?: unknown })?.products;
    if (!Array.isArray(items)) return setView({ kind: 'malformed' });
    setView(items.length ? { kind: 'list', items: items as Product[] } : { kind: 'empty' });
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (p: Product) => {
    void send('POST', METRICS, '/v1/events', { event: 'add_to_cart', product_id: p.id });
    const res = await send('POST', API, '/v1/cart', { product_id: p.id, qty: 1 });
    if (res && res.status < 400) {
      setCart((c) => c + 1);
      showToast(`${p.name} added`);
    } else showToast('Couldn’t add to basket. Try again.');
  };

  const price = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? `$${v.toFixed(2)}` : 'Price unavailable');

  const message = (title: string, text: string) => (
    <div className="flex h-full flex-col items-center justify-center px-5 pb-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[#fff1e6] text-[#e8590c]">
        <AlertTriangle size={22} />
      </span>
      <p className="mt-3 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[11.5px] text-[#6b6b70]">{text}</p>
      <button type="button" onClick={() => void load()} className="mt-4 rounded-full bg-[#2f9e44] px-5 py-2 text-[13px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 focus-visible:outline-none">
        Try again
      </button>
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Proxy playground</p>
        <p className="text-sm text-muted">
          The grocery app on the phone talks to its server through the proxy. Try this: turn on <strong className="text-fg">Breakpoint</strong>, tap refresh in the app, change a price or the status code, then press <strong className="text-fg">Execute</strong>. Then try <strong className="text-fg">Map Local</strong> and <strong className="text-fg">Throttle</strong>.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 border-b border-line p-4 sm:p-5 lg:border-r lg:border-b-0">
          <ProxyWindow proxy={proxy} mapLocalLabel="GET /v1/products → empty-list.json" responsePresets={responsePresets} />
        </div>
        <div className="flex justify-center p-5" style={{ background: '#f2f2f7' }}>
          <PhoneFrame width={250}>
            <div className="relative flex h-full flex-col bg-white text-black">
              <div className="flex items-center justify-between px-4 pt-2 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#2f9e44] text-white">
                    <Leaf size={15} />
                  </span>
                  <p className="text-[17px] font-bold tracking-tight">FreshCart</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void load()}
                    aria-label="Refresh products"
                    className="grid size-8 place-items-center rounded-full bg-[#f2f2f7] text-[#2f9e44] focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:outline-none"
                  >
                    <RefreshCw size={14} className={view.kind === 'loading' ? 'animate-spin' : ''} />
                  </button>
                  <span className="relative grid size-8 place-items-center rounded-full bg-[#f2f2f7]" aria-label={`Basket: ${cart} items`}>
                    <ShoppingBasket size={15} />
                    {cart > 0 && <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e03131] px-1 text-[9px] font-bold text-white">{cart}</span>}
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
                {view.kind === 'loading' && (
                  <div className="space-y-2" aria-label="Loading products">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex animate-pulse items-center gap-2.5 rounded-xl bg-[#f8f9fa] p-2.5">
                        <div className="size-11 rounded-lg bg-[#e9ecef]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-2/3 rounded bg-[#e9ecef]" />
                          <div className="h-2 w-1/3 rounded bg-[#e9ecef]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {view.kind === 'list' && (
                  <div className="space-y-2">
                    {view.items.map((p, i) => (
                      <div key={`${String(p.id)}-${i}`} className="flex items-center gap-2.5 rounded-xl bg-[#f8f9fa] p-2.5">
                        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#ebfbee] text-[#2f9e44]">
                          <Leaf size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold">{String(p.name ?? 'Unnamed item')}</p>
                          <p className="text-[10.5px] text-[#868e96]">{String(p.unit ?? '')}</p>
                          <p className="text-[13px] font-bold tabular-nums">{price(p.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void add(p)}
                          aria-label={`Add ${String(p.name)} to basket`}
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2f9e44] text-white focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {view.kind === 'empty' && (
                  <div className="flex h-full flex-col items-center justify-center px-5 pb-12 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-[#ebfbee] text-[#2f9e44]">
                      <ShoppingBasket size={22} />
                    </span>
                    <p className="mt-3 text-[15px] font-semibold">Nothing on the shelves</p>
                    <p className="mt-1 text-[11.5px] text-[#6b6b70]">This store has no products right now. Check back later or pick another store.</p>
                  </div>
                )}
                {view.kind === 'error' && message('We couldn’t load the products', `The server had a problem (error ${view.status}). It’s not your fault.`)}
                {view.kind === 'malformed' && message('Something went wrong', 'We received data we couldn’t read. Please try again.')}
                {view.kind === 'aborted' && message('Connection interrupted', 'The request didn’t finish. Check your connection and try again.')}
              </div>
              {toast && (
                <div className="absolute inset-x-3 bottom-6 rounded-xl bg-[#1c1c1e]/90 px-3 py-2 text-center text-[11.5px] font-medium text-white" role="status">
                  {toast}
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
