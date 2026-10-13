import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { RotateCcw, ShoppingBag, X } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken mobile web shop with a hamburger menu. Bugs (don't spoil them!):
 *  1. The hamburger button has no accessible name (icon only), and aria-expanded is hard-coded to "false".
 *  2. Choosing a page in the menu changes the page, but the menu stays open (no close on route change).
 *  3. No scroll lock: scrolling over the menu or the scrim scrolls the page behind.
 *  4. The current page is highlighted with startsWith(), so "Home" ("/") is marked on every page.
 *  5. Esc does nothing, focus stays on the button when the menu opens, and because the menu comes
 *     last in the DOM, Tab walks through the page behind the scrim first.
 */

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/new', label: 'New in' },
  { href: '/women', label: 'Women' },
  { href: '/men', label: 'Men' },
  { href: '/sale', label: 'Sale' },
  { href: '/orders', label: 'My orders' },
  { href: '/help', label: 'Help & returns' },
];

const PAGES: Record<string, { title: string; intro: string; items: string[] }> = {
  '/': { title: 'Autumn is here', intro: 'Warm layers, soft knits and rain-ready jackets.', items: ['Wool scarf', 'Rain jacket', 'Knit beanie', 'Canvas tote', 'Linen shirt', 'Chelsea boots'] },
  '/new': { title: 'New in', intro: 'Fresh arrivals every Thursday.', items: ['Corduroy shirt', 'Puffer vest', 'Merino socks', 'Leather gloves', 'Cargo trousers', 'Fleece hoodie'] },
  '/women': { title: 'Women', intro: 'Dresses, knitwear, coats and more.', items: ['Wrap dress', 'Cable knit', 'Trench coat', 'Midi skirt', 'Ankle boots', 'Silk blouse'] },
  '/men': { title: 'Men', intro: 'Everyday basics and smart layers.', items: ['Oxford shirt', 'Chinos', 'Bomber jacket', 'Crew sweater', 'Derby shoes', 'Wool coat'] },
  '/sale': { title: 'Sale: up to 30% off', intro: 'Last sizes, while stocks last.', items: ['Rain jacket −30%', 'Linen shirt −20%', 'Denim jacket −25%', 'Sneakers −15%', 'Beanie −30%', 'Tote −10%'] },
  '/orders': { title: 'My orders', intro: 'Track parcels and start returns.', items: ['#4821 · On its way', '#4790 · Delivered', '#4755 · Delivered', '#4702 · Returned', '#4688 · Delivered', '#4650 · Delivered'] },
  '/help': { title: 'Help & returns', intro: 'Free returns within 30 days.', items: ['Start a return', 'Delivery times', 'Payment options', 'Size guide', 'Contact us', 'Gift cards'] },
};
const COLORS = ['#e9d8c4', '#cfe1d6', '#d6dcef', '#f1d5d8', '#efe3c2', '#dcd3ec'];

interface Info {
  role: string;
  name: string;
  states: string[];
  behind: boolean;
}

function describe(el: HTMLElement, page: HTMLElement | null, menuOpen: boolean): Info {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role') || (tag === 'button' ? 'button' : tag === 'a' ? 'link' : tag === 'main' ? 'main' : tag);
  const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
  const states: string[] = [];
  const exp = el.getAttribute('aria-expanded');
  if (exp !== null) states.push(exp === 'true' ? 'expanded' : 'collapsed');
  if (el.getAttribute('aria-current') === 'page') states.push('current page');
  return { role, name, states, behind: menuOpen && !!page?.contains(el) };
}

export function BuggyShopMenu() {
  const [path, setPath] = useState('/');
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const page = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const moved = useRef(false);

  // keep the inspector in sync when state changes while something is focused
  useEffect(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el && root.current?.contains(el)) setInfo(describe(el, page.current, open));
  }, [open, path]);

  const go = (href: string) => {
    setPath(href); // BUG 2: the menu is not closed on navigation
    page.current?.scrollTo({ top: 0 });
  };

  // BUG 3: wheel and touch drags over the menu/scrim are passed on to the page behind
  const wheel = (e: WheelEvent) => {
    if (page.current) page.current.scrollTop += e.deltaY;
  };
  const pDown = (e: PointerEvent) => {
    drag.current = e.clientY;
    moved.current = false;
  };
  const pMove = (e: PointerEvent) => {
    if (drag.current === null || e.pointerType === 'mouse') return;
    const d = drag.current - e.clientY;
    if (Math.abs(d) > 3) moved.current = true;
    if (page.current) page.current.scrollTop += d;
    drag.current = e.clientY;
  };
  const pUp = () => {
    drag.current = null;
  };

  const current = NAV.find((n) => path.startsWith(n.href)); // BUG 4: "/" matches every path
  const p = PAGES[path];

  const restart = () => {
    setPath('/');
    setOpen(false);
    setInfo(null);
    page.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4">
      <div ref={root} onFocus={(e) => setInfo(describe(e.target as HTMLElement, page.current, open))}>
        <BrowserFrame url={`shop.example.com${path}`}>
          <div className="relative h-[460px] overflow-hidden bg-white text-[#0e1120]" style={{ colorScheme: 'light' }}>
            <div ref={page} className="absolute inset-0 overflow-y-auto" onScroll={(e) => setScrollY(Math.round(e.currentTarget.scrollTop))}>
              <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-black/10 bg-white px-2">
                {/* BUG 1: no accessible name, aria-expanded never changes */}
                <button type="button" aria-expanded="false" aria-controls="shop-menu" onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-lg outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="flex-1 font-bold tracking-tight">Threadline</span>
                <a href="#" onClick={(e) => e.preventDefault()} aria-label="Basket, 2 items" className="relative mr-1 grid size-10 place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                  <ShoppingBag size={20} />
                  <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-[#c2410c] text-[10px] text-white">2</span>
                </a>
              </header>
              <main className="px-4 pt-4 pb-6">
                <h3 className="text-[22px] leading-tight font-bold">{p.title}</h3>
                <p className="mt-1 text-[14px] text-[#4a5065]">{p.intro}</p>
                {path === '/' && (
                  <a href="#" onClick={(e) => { e.preventDefault(); go('/sale'); }} className="mt-3 block rounded-xl bg-[#2d6a4f] px-4 py-3 text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                    Shop the sale: up to 30% off →
                  </a>
                )}
                <ul className="mt-4 grid grid-cols-2 gap-3">
                  {p.items.map((it, i) => (
                    <li key={it}>
                      <a href="#" onClick={(e) => e.preventDefault()} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                        <span className="block h-24 rounded-lg" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="mt-1 block truncate text-[13px] font-medium">{it}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <footer className="mt-6 border-t border-black/10 pt-3 text-[12px] text-[#4a5065]">
                  <a href="#" onClick={(e) => e.preventDefault()} className="underline">
                    Privacy
                  </a>{' '}
                  ·{' '}
                  <a href="#" onClick={(e) => e.preventDefault()} className="underline">
                    Terms
                  </a>{' '}
                  · © Threadline
                </footer>
              </main>
            </div>

            {open && (
              <div
                className="absolute inset-0 z-20 bg-black/40"
                style={{ touchAction: 'none' }}
                aria-hidden="true"
                onWheel={wheel}
                onPointerDown={pDown}
                onPointerMove={pMove}
                onPointerUp={pUp}
                onPointerCancel={pUp}
                onClick={() => {
                  if (!moved.current) setOpen(false);
                }}
              />
            )}
            {/* BUG 5: rendered after the page, no focus move, no Esc, no focus trap */}
            <nav
              id="shop-menu"
              aria-label="Main"
              className="absolute inset-y-0 left-0 z-30 w-[78%] bg-white shadow-xl transition-transform duration-200"
              style={{ transform: open ? 'none' : 'translateX(-105%)', visibility: open ? 'visible' : 'hidden', touchAction: 'none' }}
              onWheel={wheel}
              onPointerDown={pDown}
              onPointerMove={pMove}
              onPointerUp={pUp}
              onPointerCancel={pUp}
            >
              <div className="flex h-12 items-center justify-between border-b border-black/10 px-3">
                <span className="font-bold tracking-tight">Menu</span>
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                  <X size={20} />
                </button>
              </div>
              <ul className="p-2">
                {NAV.map((n) => {
                  const sel = n === current;
                  return (
                    <li key={n.href}>
                      <a
                        href="#"
                        aria-current={sel ? 'page' : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          go(n.href);
                        }}
                        className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]"
                        style={{ background: sel ? '#eef0ff' : undefined, color: sel ? '#3d32c9' : undefined, boxShadow: sel ? 'inset 3px 0 0 #3d32c9' : undefined }}
                      >
                        {n.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </BrowserFrame>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <p className="font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Accessibility inspector</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 font-sans text-xs font-medium text-white/60 hover:text-white">
            <RotateCcw size={12} /> Reload
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2">
          <dt className="text-white/45">Focused</dt>
          <dd className="min-w-0 truncate">{info ? info.role : <span className="text-white/35">Click into the shop and press Tab…</span>}</dd>
          <dt className="text-white/45">Name</dt>
          <dd className="min-w-0 truncate">{info ? info.name ? `“${info.name}”` : <span className="text-[#ffb4a9]">(no name)</span> : '–'}</dd>
          <dt className="text-white/45">State</dt>
          <dd className="min-w-0 truncate">{info ? (info.states.join(', ') || '–') : '–'}</dd>
          <dt className="text-white/45">Visible</dt>
          <dd className="min-w-0 truncate">{info ? (info.behind ? <span className="text-[#ffb4a9]">behind the open menu</span> : 'yes') : '–'}</dd>
          <dt className="text-white/45">Page scroll</dt>
          <dd>{scrollY}px</dd>
        </dl>
      </div>
    </div>
  );
}
