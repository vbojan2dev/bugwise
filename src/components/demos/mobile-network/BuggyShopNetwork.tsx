import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Package, RefreshCw, RotateCcw, ShoppingBag, User, Wifi, Signal, WifiOff } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken sports shop app for the network bug hunt. Bugs (don't spoil them!):
 *  1. Orders tab while offline: the request fails but the error is ignored, so the spinner spins forever.
 *  2. "Buy now" has no loading/disabled state; on a slow network a second tap creates a second order.
 *  3. Refreshing the shop offline shows the raw NSURLErrorDomain -1009 error text in an alert.
 *  4. Going offline in the middle of a photo upload silently drops the upload (no message, no retry).
 *  5. Starting the app offline shows yesterday's cached prices as if they were current (no offline / "last updated" hint).
 *  6. The "Retry" button on the failed order banner does nothing.
 */

type Net = 'wifi' | '3g' | 'offline';
type Status = 'pending' | number | 'offline' | 'lost';
interface LogEntry {
  id: number;
  method: string;
  path: string;
  status: Status;
}
interface Order {
  no: number;
  name: string;
  price: number;
}

const products = [
  { id: 'shoes', name: 'Trail running shoes', price: 99.99, cached: 79.99, hue: '#3b82f6' },
  { id: 'mat', name: 'Yoga mat', price: 39.5, cached: 34.5, hue: '#a855f7' },
  { id: 'bottle', name: 'Steel water bottle', price: 24.0, cached: 24.0, hue: '#14b8a6' },
  { id: 'band', name: 'Fitness tracker', price: 129.0, cached: 129.0, hue: '#f97316' },
];
const speed: Record<Exclude<Net, 'offline'>, number> = { wifi: 1, '3g': 6 };
const money = (n: number) => `$${n.toFixed(2)}`;

export function BuggyShopNetwork() {
  const [net, setNet] = useState<Net>('wifi');
  const netRef = useRef<Net>('wifi');
  const [tab, setTab] = useState<'shop' | 'orders' | 'profile'>('shop');
  const [detail, setDetail] = useState<string | null>(null);
  const [priceSource, setPriceSource] = useState<'fresh' | 'cached' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(false);
  const [orders, setOrders] = useState<Order[]>([{ no: 1042, name: 'Steel water bottle', price: 24 }]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [buyError, setBuyError] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [upload, setUpload] = useState<number | null>(null);
  const [avatarNew, setAvatarNew] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const ids = useRef(1);
  const orderNo = useRef(1043);
  const ordersReq = useRef(0);
  const timers = useRef<number[]>([]);
  const uploadIv = useRef<number | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const stopUpload = () => {
    if (uploadIv.current !== null) window.clearInterval(uploadIv.current);
    uploadIv.current = null;
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopUpload();
    },
    [],
  );

  const toast = (text: string) => {
    const id = ids.current++;
    setToasts((t) => [...t, { id, text }]);
    later(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  /** Fake HTTP request. Fails if the device is offline when it starts or when the response would arrive. */
  const request = (method: string, path: string, ms: number, okStatus: number, done: (ok: boolean) => void) => {
    const id = ids.current++;
    setLog((l) => [{ id, method, path, status: 'pending' as Status }, ...l].slice(0, 7));
    const finish = (status: Status) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
    const n = netRef.current;
    if (n === 'offline') {
      later(() => {
        finish('offline');
        done(false);
      }, 60);
      return;
    }
    later(() => {
      if (netRef.current === 'offline') {
        finish('offline');
        done(false);
      } else {
        finish(okStatus);
        done(true);
      }
    }, ms * speed[n]);
  };

  const loadProducts = () => {
    setPriceSource(null);
    // BUG 5: on failure, fall back to the cache silently, with no "offline" or "last updated" hint.
    request('GET', '/v2/products', 450, 200, (ok) => setPriceSource(ok ? 'fresh' : 'cached'));
  };

  const refresh = () => {
    setRefreshing(true);
    request('GET', '/v2/products', 450, 200, (ok) => {
      setRefreshing(false);
      if (ok) setPriceSource('fresh');
      else setAlert(true); // BUG 3: raw system error shown to the user
    });
  };

  const loadOrders = () => {
    const token = ++ordersReq.current;
    setOrdersReady(false);
    request('GET', '/v2/orders', 400, 200, (ok) => {
      if (token !== ordersReq.current) return;
      if (ok) setOrdersReady(true);
      // BUG 1: failure is ignored, so the spinner never stops.
    });
  };

  const buy = (pid: string) => {
    const p = products.find((x) => x.id === pid)!;
    // BUG 2: no loading state and the button is never disabled.
    request('POST', '/v2/orders', 600, 201, (ok) => {
      if (ok) {
        const no = orderNo.current++;
        setOrders((o) => [{ no, name: p.name, price: p.price }, ...o]);
        setBuyError(false);
        toast(`Order #${no} placed`);
      } else setBuyError(true);
    });
  };

  const startUpload = () => {
    setUploadError(false);
    if (netRef.current === 'offline') {
      setUploadError(true);
      return;
    }
    const id = ids.current++;
    setLog((l) => [{ id, method: 'PUT', path: '/v2/me/avatar', status: 'pending' as Status }, ...l].slice(0, 7));
    setUpload(0);
    stopUpload();
    let progress = 0;
    uploadIv.current = window.setInterval(() => {
      const n = netRef.current;
      if (n === 'offline') {
        // BUG 4: connection lost mid-upload, upload is dropped without telling the user.
        stopUpload();
        setUpload(null);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'lost' as Status } : e)));
        return;
      }
      progress = Math.min(100, progress + (n === 'wifi' ? 6 : 1.5));
      setUpload(progress);
      if (progress >= 100) {
        stopUpload();
        setUpload(null);
        setAvatarNew(true);
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 200 as Status } : e)));
        toast('Profile photo updated');
      }
    }, 150);
  };

  const changeNet = (n: Net) => {
    netRef.current = n;
    setNet(n);
  };

  const goTab = (t: 'shop' | 'orders' | 'profile') => {
    setTab(t);
    setDetail(null);
    setBuyError(false);
    if (t === 'orders') loadOrders();
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    stopUpload();
    ordersReq.current++;
    setUpload(null);
    setUploadError(false);
    setToasts([]);
    setAlert(false);
    setRefreshing(false);
    setBuyError(false);
    setTab('shop');
    setDetail(null);
    setLog([]);
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceOf = (p: (typeof products)[number]) => (priceSource === 'cached' ? p.cached : p.price);
  const prod = detail ? products.find((p) => p.id === detail)! : null;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={280}>
        <div className="relative flex h-full flex-col bg-[#f2f2f7] text-black">
          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">
            {tab === 'shop' && !prod && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[26px] font-bold tracking-tight">Shop</p>
                  <button
                    type="button"
                    onClick={refresh}
                    aria-label="Refresh"
                    className="grid size-8 place-items-center rounded-full bg-white text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:outline-none"
                  >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  {products.map((p) =>
                    priceSource === null ? (
                      <div key={p.id} className="animate-pulse rounded-2xl bg-white p-2.5">
                        <div className="aspect-square rounded-xl bg-[#e5e5ea]" />
                        <div className="mt-2 h-2.5 w-3/4 rounded bg-[#e5e5ea]" />
                        <div className="mt-1.5 h-2.5 w-1/3 rounded bg-[#e5e5ea]" />
                      </div>
                    ) : (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setDetail(p.id);
                          setBuyError(false);
                        }}
                        className="flex flex-col rounded-2xl bg-white p-2.5 text-left focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:outline-none"
                      >
                        <div className="grid aspect-square place-items-center rounded-xl" style={{ background: `${p.hue}22`, color: p.hue }}>
                          <ShoppingBag size={28} />
                        </div>
                        <p className="mt-2 text-[12px] leading-tight font-semibold">{p.name}</p>
                        <p className="mt-0.5 text-[13px] font-bold tabular-nums">{money(priceOf(p))}</p>
                      </button>
                    ),
                  )}
                </div>
              </>
            )}

            {tab === 'shop' && prod && (
              <>
                <button type="button" onClick={() => setDetail(null)} className="-ml-1 flex items-center text-[15px] text-[#007aff]">
                  <ChevronLeft size={22} /> Shop
                </button>
                <div className="mt-2 grid aspect-[4/3] place-items-center rounded-2xl" style={{ background: `${prod.hue}22`, color: prod.hue }}>
                  <ShoppingBag size={48} />
                </div>
                <p className="mt-3 text-[20px] leading-tight font-bold">{prod.name}</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums">{money(priceOf(prod))}</p>
                <p className="mt-1 text-[12px] text-[#6b6b70]">Free delivery in 2–3 days · 30-day returns</p>
                {buyError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#ffe5e5] px-3 py-2 text-[12px] text-[#a01515]">
                    <span className="min-w-0 flex-1">Couldn’t place your order.</span>
                    {/* BUG 6: Retry does nothing */}
                    <button type="button" onClick={() => {}} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#a01515]">
                      Retry
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => buy(prod.id)}
                  className="mt-4 w-full rounded-xl bg-[#007aff] py-3 text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2 focus-visible:outline-none active:opacity-90"
                >
                  Buy now
                </button>
              </>
            )}

            {tab === 'orders' && (
              <>
                <p className="text-[26px] font-bold tracking-tight">Orders</p>
                {!ordersReady ? (
                  <div className="grid h-48 place-items-center">
                    <span className="size-6 animate-spin rounded-full border-2 border-[#8e8e93] border-t-transparent" aria-label="Loading orders" />
                  </div>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-xl bg-white">
                    {orders.map((o, i) => (
                      <div key={o.no} className={`flex items-center gap-3 px-3 py-2.5 ${i ? 'border-t border-[#e5e5ea]' : ''}`}>
                        <Package size={18} className="shrink-0 text-[#007aff]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">{o.name}</p>
                          <p className="text-[11px] text-[#8e8e93]">
                            Order #{o.no} · {money(o.price)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[#c7c7cc]" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'profile' && (
              <>
                <p className="text-[26px] font-bold tracking-tight">Profile</p>
                <div className="mt-3 flex flex-col items-center rounded-2xl bg-white p-4">
                  <div className="relative">
                    <div
                      className="grid size-20 place-items-center rounded-full text-[24px] font-bold text-white"
                      style={{ background: avatarNew || upload !== null ? 'linear-gradient(135deg,#f59e0b,#ec4899)' : '#8e8e93', opacity: upload !== null ? 0.6 : 1 }}
                    >
                      {avatarNew || upload !== null ? '🏃‍♀️' : 'AK'}
                    </div>
                  </div>
                  <p className="mt-2 text-[15px] font-semibold">Anna Kovač</p>
                  <p className="text-[11px] text-[#8e8e93]">anna@example.com</p>
                  {upload !== null && (
                    <div className="mt-3 w-full">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e5ea]">
                        <div className="h-full bg-[#007aff]" style={{ width: `${upload}%` }} />
                      </div>
                      <p className="mt-1 text-center text-[11px] text-[#6b6b70]">Uploading photo… {Math.round(upload)}%</p>
                    </div>
                  )}
                  {uploadError && <p className="mt-3 text-center text-[11.5px] text-[#a01515]">You’re offline. Your photo wasn’t uploaded. Try again when you’re back online.</p>}
                  <button
                    type="button"
                    onClick={startUpload}
                    disabled={upload !== null}
                    className="mt-3 flex items-center gap-1.5 rounded-full bg-[#f2f2f7] px-4 py-2 text-[13px] font-semibold text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:outline-none disabled:opacity-50"
                  >
                    <Camera size={15} /> Change photo
                  </button>
                  <p className="mt-1 text-[10px] text-[#8e8e93]">Picks a sample 4 MB photo</p>
                </div>
              </>
            )}
          </div>

          {/* Toasts */}
          <div className="pointer-events-none absolute inset-x-3 bottom-[62px] z-10 space-y-1.5" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className="rounded-xl bg-[#1c1c1e]/90 px-3 py-2 text-center text-[12px] font-medium text-white shadow-lg">
                {t.text}
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="grid shrink-0 grid-cols-3 border-t border-[#d1d1d6] bg-white/95 pt-1.5 pb-5">
            {(
              [
                ['shop', 'Shop', ShoppingBag],
                ['orders', 'Orders', Package],
                ['profile', 'Profile', User],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => goTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${tab === id ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>

          {/* Raw error alert (BUG 3) */}
          {alert && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/30 px-6">
              <div role="alertdialog" aria-label="Error" className="w-full overflow-hidden rounded-2xl bg-[#f2f2f7]/95 text-center shadow-xl">
                <div className="px-4 pt-4 pb-3">
                  <p className="text-[15px] font-semibold">Error</p>
                  <p className="mt-1 font-mono text-[10.5px] leading-snug break-all text-[#3c3c43]">
                    Error Domain=NSURLErrorDomain Code=-1009 "The Internet connection appears to be offline." UserInfo=&#123;NSErrorFailingURLStringKey=https://api.fitshop.example/v2/products, _kCFStreamErrorCodeKey=50&#125;
                  </p>
                </div>
                <button type="button" onClick={() => setAlert(false)} className="w-full border-t border-[#c6c6c8] py-2.5 text-[15px] font-semibold text-[#007aff]">
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device network</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium" role="radiogroup" aria-label="Device network">
          {(
            [
              ['wifi', 'Wi-Fi', Wifi],
              ['3g', 'Slow 3G', Signal],
              ['offline', 'Offline', WifiOff],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={net === id}
              onClick={() => changeNet(id)}
              className={`flex items-center justify-center gap-1 rounded-md py-1.5 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:outline-none ${net === id ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[6rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Requests will appear here…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className={e.method === 'GET' ? 'text-[#7dd3fc]' : 'text-[#c4b5fd]'}>{e.method}</span>
              <span className="min-w-0 flex-1 truncate">{e.path}</span>
              {e.status === 'pending' ? (
                <span className="text-[#fbbf24]">pending…</span>
              ) : e.status === 'offline' ? (
                <span className="text-[#f87171]">no connection</span>
              ) : e.status === 'lost' ? (
                <span className="text-[#f87171]">connection lost</span>
              ) : (
                <span className="text-[#34d399]">{e.status}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
