import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { ArrowLeft, Link2, Package, PackageCheck, RotateCcw, Search, Triangle, Undo2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken Android (Material 3) "My orders" screen with three tabs. Bugs (don't spoil them!):
 *  1. Swiping the content changes the page, but the active indicator (and aria-selected) stays on the old tab.
 *  2. Switching tabs remounts the list, so the scroll position of each tab is lost (always back to the top).
 *  3. The deep link shop://orders/returns opens the Active tab (route table uses "return", falls back to tab 0).
 *  4. In German, the fixed tabs clip "Rücksendungen" mid-word (no ellipsis, no scrolling, no wrapping).
 *  5. The badge on "Active" is a stored number that is never updated: after a delivery it still says 2.
 *  6. System Back from an order detail returns to the Active tab, while the app bar's back arrow
 *     correctly returns to the tab you came from (inconsistent Back behavior).
 */

type Tab = 0 | 1 | 2;
interface Order {
  id: string;
  shop: string;
  items: string;
  total: string;
  eta?: string;
}

const purple = '#6750a4';
const LABELS = {
  en: ['Active', 'Delivered', 'Returns'],
  de: ['Aktiv', 'Zugestellt', 'Rücksendungen'],
};
const T = {
  en: { title: 'My orders', none: 'No active orders', back: 'Press back again to exit', delivered: 'was delivered', eta: 'Arrives', detail: 'Order details', placed: 'Placed on', returnBtn: 'Start a return' },
  de: { title: 'Meine Bestellungen', none: 'Keine aktiven Bestellungen', back: 'Zum Beenden erneut zurück drücken', delivered: 'wurde zugestellt', eta: 'Ankunft', detail: 'Bestelldetails', placed: 'Bestellt am', returnBtn: 'Rücksendung starten' },
};

const INITIAL_ACTIVE: Order[] = [
  { id: '#4821', shop: 'Nordic Home', items: 'Desk lamp, 2 bulbs', total: '€54.90', eta: 'today 14–16' },
  { id: '#4817', shop: 'RunFast', items: 'Trail runner 2, size 42', total: '€129.00', eta: 'tomorrow' },
];
const SHOPS = ['BookNook', 'Pixel Store', 'GreenLeaf', 'Kitchenly', 'Toy Planet', 'Sporty', 'BeautyBar', 'PetPal', 'Nordic Home', 'TechHub', 'Pizza Roma', 'Café Mila', 'Outdoorly', 'Paper & Co'];
const DELIVERED: Order[] = SHOPS.map((s, i) => ({ id: `#${4790 - i * 7}`, shop: s, items: `${(i % 3) + 1} item${i % 3 ? 's' : ''}`, total: `€${(12 + i * 6.35).toFixed(2)}` }));
const RETURNS: Order[] = [
  { id: '#4702', shop: 'Sporty', items: 'Rain jacket, size M', total: '€79.00', eta: 'Refund pending' },
  { id: '#4655', shop: 'Pixel Store', items: 'Phone case', total: '€19.99', eta: 'Refunded' },
];

export function BuggyOrdersApp() {
  const [lang, setLang] = useState<'en' | 'de'>('en');
  const [screen, setScreen] = useState<'orders' | 'detail'>('orders');
  const [tab, setTab] = useState<Tab>(0); // the page that is shown
  const [indicator, setIndicator] = useState<Tab>(0); // BUG 1: tracked separately and only set on tap
  const [active, setActive] = useState<Order[]>(INITIAL_ACTIVE);
  const [delivered, setDelivered] = useState<Order[]>(DELIVERED);
  const [badge] = useState(INITIAL_ACTIVE.length); // BUG 5: should be derived from active.length
  const [detail, setDetail] = useState<Order | null>(null);
  const [snack, setSnack] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const snackTimer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);
  const swiped = useRef(false);
  const [dx, setDx] = useState(0);
  const t = T[lang];
  const labels = LABELS[lang];

  useEffect(() => () => clearTimeout(snackTimer.current), []);

  const showSnack = (s: string) => {
    setSnack(s);
    clearTimeout(snackTimer.current);
    snackTimer.current = window.setTimeout(() => setSnack(''), 3000);
  };
  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 4));

  const tapTab = (i: Tab) => {
    setTab(i);
    setIndicator(i);
  };

  /* ---- swipe between tabs (BUG 1: only the page changes) ---- */
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    swipe.current = { x: e.clientX, y: e.clientY, axis: null };
    swiped.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      s.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (s.axis === 'x') {
        e.currentTarget.setPointerCapture(e.pointerId);
        swiped.current = true;
      }
    }
    if (s.axis === 'x') setDx(Math.max(-90, Math.min(90, mx)));
  };
  const up = () => {
    const s = swipe.current;
    swipe.current = null;
    if (s?.axis === 'x') {
      window.setTimeout(() => (swiped.current = false), 0);
      if (dx < -50) setTab((p) => Math.min(2, p + 1) as Tab);
      if (dx > 50) setTab((p) => Math.max(0, p - 1) as Tab);
    }
    setDx(0);
  };

  /* ---- device actions ---- */
  const deliverNext = () => {
    const first = active[0];
    if (!first) {
      showSnack(lang === 'en' ? 'No active orders left' : 'Keine aktiven Bestellungen');
      return;
    }
    setActive((a) => a.slice(1));
    setDelivered((d) => [{ ...first, eta: undefined }, ...d]);
    addLog(`Push: “Your ${first.shop} order ${t.delivered}”`);
    showSnack(`${first.shop} ${first.id} ${t.delivered}`);
  };

  const ROUTES: Record<string, Tab> = { active: 0, delivered: 1, return: 2 }; // BUG 3: link uses "returns"
  const openLink = (path: string) => {
    const seg = path.split('/').pop() ?? '';
    const target = ROUTES[seg] ?? 0;
    setScreen('orders');
    setDetail(null);
    setTab(target);
    setIndicator(target);
    addLog(`Opened link shop://orders/${seg}`);
  };

  const openDetail = (o: Order) => {
    setDetail(o);
    setScreen('detail');
  };
  const appBack = () => {
    setScreen('orders'); // keeps `tab` and `indicator`
  };
  const systemBack = () => {
    if (screen === 'detail') {
      setScreen('orders');
      setTab(0); // BUG 6: System Back resets to the first tab
      setIndicator(0);
      addLog('System Back');
      return;
    }
    addLog('System Back');
    showSnack(t.back);
  };

  const restart = () => {
    clearTimeout(snackTimer.current);
    setScreen('orders');
    setTab(0);
    setIndicator(0);
    setActive(INITIAL_ACTIVE);
    setDelivered(DELIVERED);
    setDetail(null);
    setSnack('');
    setLog([]);
  };

  const row = (o: Order, icon: ReactNode) => (
    <li key={o.id}>
      <button type="button" onClick={() => openDetail(o)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eaddff] text-[#21005d]">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">
            {o.shop} <span className="font-normal text-[#49454f]">{o.id}</span>
          </span>
          <span className="block truncate text-[12px] text-[#49454f]">
            {o.items} · {o.total}
          </span>
          {o.eta && <span className="block text-[12px]" style={{ color: purple }}>{tab === 0 ? `${t.eta} ${o.eta}` : o.eta}</span>}
        </span>
      </button>
    </li>
  );

  const list = (() => {
    if (tab === 0)
      return active.length ? <ul>{active.map((o) => row(o, <Package size={18} />))}</ul> : <p className="px-6 pt-16 text-center text-[14px] text-[#49454f]">{t.none}</p>;
    if (tab === 1) return <ul>{delivered.map((o) => row(o, <PackageCheck size={18} />))}</ul>;
    return <ul>{RETURNS.map((o) => row(o, <Undo2 size={18} />))}</ul>;
  })();

  const counts = [badge, 0, 0];

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os="android" width={290}>
        <div className="absolute inset-0 flex flex-col bg-[#fef7ff] text-[#1d1b20]" style={{ colorScheme: 'light' }}>
          {screen === 'orders' ? (
            <>
              <div className="flex h-14 shrink-0 items-center gap-1 px-1">
                <p className="min-w-0 flex-1 truncate pl-3 text-[20px]">{t.title}</p>
                <span className="grid size-12 place-items-center" aria-hidden="true">
                  <Search size={20} />
                </span>
              </div>
              {/* BUG 4: fixed tabs + overflow-hidden + no ellipsis */}
              <div role="tablist" className="flex shrink-0 border-b border-[#cac4d0]">
                {labels.map((l, i) => {
                  const sel = i === indicator;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={sel}
                      onClick={() => tapTab(i as Tab)}
                      className="relative flex h-12 w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-3 text-[14px] font-medium whitespace-nowrap hover:bg-black/[0.04]"
                      style={{ color: sel ? purple : '#49454f' }}
                    >
                      <span className="overflow-hidden">{l}</span>
                      {counts[i] > 0 && (
                        <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-[#b3261e] px-1 text-[10px] text-white" aria-label={`${counts[i]} active`}>
                          {counts[i]}
                        </span>
                      )}
                      {sel && <span className="absolute bottom-0 left-1/2 h-[3px] w-[60%] -translate-x-1/2 rounded-t-[3px]" style={{ background: purple }} />}
                    </button>
                  );
                })}
              </div>
              <div
                className="relative min-h-0 flex-1 overflow-hidden select-none"
                style={{ touchAction: 'pan-y' }}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onClickCapture={(e) => {
                  if (swiped.current) {
                    e.stopPropagation();
                    swiped.current = false;
                  }
                }}
              >
                {/* BUG 2: key={tab} remounts the scroller on every tab change, so scroll position is lost */}
                <div key={tab} role="tabpanel" className="absolute inset-0 overflow-y-auto pb-16" style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? 'transform .2s' : 'none' }}>
                  {list}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 shrink-0 items-center gap-1 px-1">
                <button type="button" onClick={appBack} aria-label="Back" className="grid size-12 place-items-center rounded-full hover:bg-black/5">
                  <ArrowLeft size={22} />
                </button>
                <p className="min-w-0 flex-1 truncate text-[20px]">{t.detail}</p>
              </div>
              {detail && (
                <div className="space-y-3 px-5 pt-2 text-[14px]">
                  <p className="text-[22px]">{detail.shop}</p>
                  <p className="text-[#49454f]">
                    {detail.id} · {t.placed} 3 Oct
                  </p>
                  <div className="rounded-2xl bg-[#f3edf7] p-4">
                    <p>{detail.items}</p>
                    <p className="mt-1 font-medium">{detail.total}</p>
                  </div>
                  <button type="button" className="h-10 rounded-full px-5 text-[14px] font-medium text-white" style={{ background: purple }}>
                    {t.returnBtn}
                  </button>
                </div>
              )}
            </>
          )}
          {snack && <div className="absolute inset-x-3 bottom-6 z-50 flex min-h-12 items-center rounded-[4px] bg-[#322f35] px-4 py-2 text-[14px] text-[#f5eff7] shadow-lg">{snack}</div>}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <button type="button" onClick={systemBack} className="flex items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand">
            <Triangle size={12} className="-rotate-90 fill-current" /> System Back
          </button>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Deutsch
            <input type="checkbox" checked={lang === 'de'} onChange={(e) => setLang(e.target.checked ? 'de' : 'en')} className="accent-[var(--brand)]" />
          </label>
          <button type="button" onClick={deliverNext} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand">
            <PackageCheck size={14} /> Simulate: next order delivered
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Open a link (e.g. from an email)</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
          {['orders/delivered', 'orders/returns'].map((p) => (
            <button key={p} type="button" onClick={() => openLink(p)} className="flex min-w-0 items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-left font-mono text-xs hover:text-brand">
              <Link2 size={14} className="shrink-0" /> <span className="truncate">shop://{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Event log</p>
        <ul className="min-h-[3.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Pushes, links and Back presses appear here…</li>}
          {log.map((e, i) => (
            <li key={i} className="truncate">
              {e}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
