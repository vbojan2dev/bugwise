import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Menu, Search, ShoppingBag } from 'lucide-react';

/*
 * Web header lab: a small phone viewport with a sticky header, a promo strip and a cookie bar.
 * Shows how much room is left for content, and whether a focused link ends up hidden behind a bar.
 */

type Mode = 'sticky' | 'smart' | 'static';
type Cookie = 'none' | 'big' | 'compact';

const VIEW = { portrait: { w: 300, h: 500, label: 'Small phone' }, landscape: { w: 520, h: 230, label: 'Landscape' } };

function Seg<T extends string | number>({ label, options, value, onChange }: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={o.v === value}
            onClick={() => onChange(o.v)}
            className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium ${o.v === value ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

const PRODUCTS = ['Linen shirt', 'Wool scarf', 'Canvas tote', 'Rain jacket', 'Denim jacket', 'Knit beanie', 'Chino shorts', 'Leather belt'];

export default function WebHeaderLab() {
  const [device, setDevice] = useState<keyof typeof VIEW>('portrait');
  const [mode, setMode] = useState<Mode>('sticky');
  const [cookie, setCookie] = useState<Cookie>('big');
  const [promo, setPromo] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [padFix, setPadFix] = useState(false);
  const [y, setY] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [obscured, setObscured] = useState<'' | 'header' | 'cookie' | 'ok'>('');
  const lastY = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const cookieRef = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const frame = useRef<number | undefined>(undefined);

  const v = VIEW[device];
  const headerH = 48 * zoom;
  const promoH = promo ? 30 * zoom : 0;
  const topH = headerH + promoH;
  const cookieH = cookie === 'none' ? 0 : cookie === 'big' ? 150 * zoom : 52 * zoom;

  useEffect(() => () => clearTimeout(frame.current), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setY(0);
    setHeaderHidden(false);
    setObscured('');
  }, [device, mode, zoom]);

  const topVisible = mode === 'sticky' ? topH : mode === 'smart' ? (headerHidden ? 0 : topH) : Math.max(0, topH - y);
  const content = Math.max(0, v.h - topVisible - cookieH);
  const pct = Math.round((content / v.h) * 100);
  const tone = pct >= 60 ? 'text-ok' : pct >= 40 ? 'text-warn' : 'text-danger';

  const check = () => {
    clearTimeout(frame.current);
    frame.current = window.setTimeout(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !scroller.current?.contains(el) || el === scroller.current || el === main.current) return setObscured('');
      const r = el.getBoundingClientRect();
      const h = header.current?.getBoundingClientRect();
      const c = cookieRef.current?.getBoundingClientRect();
      if (h && mode !== 'static' && r.top < h.bottom - 2 && r.bottom > h.top) return setObscured('header');
      if (c && r.bottom > c.top + 2) return setObscured('cookie');
      setObscured('ok');
    }, 60);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const ny = el.scrollTop;
    const d = ny - lastY.current;
    lastY.current = ny;
    setY(ny);
    if (mode === 'smart') {
      if (ny < topH) setHeaderHidden(false);
      else if (d > 3) setHeaderHidden(true);
      else if (d < -3) setHeaderHidden(false);
    }
    if (obscured) check();
  };

  const skip = (e: React.MouseEvent) => {
    e.preventDefault();
    main.current?.focus();
  };

  const fs = (n: number) => ({ fontSize: n * zoom });
  let obscuredNote: ReactNode = <span className="text-muted">Click into the page and press <kbd>Tab</kbd> to move through the links.</span>;
  if (obscured === 'header') obscuredNote = <span className="text-danger"><strong>The focused link is hidden behind the sticky header.</strong> Keyboard users can’t see where they are.</span>;
  if (obscured === 'cookie') obscuredNote = <span className="text-danger"><strong>The focused link is hidden behind the cookie bar.</strong></span>;
  if (obscured === 'ok') obscuredNote = <span className="text-ok">The focused link is fully visible.</span>;

  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Seg label="Screen" value={device} onChange={setDevice} options={[{ v: 'portrait', l: 'Small phone' }, { v: 'landscape', l: 'Landscape' }]} />
        <Seg label="Header" value={mode} onChange={setMode} options={[{ v: 'sticky', l: 'Sticky' }, { v: 'smart', l: 'Hides on scroll' }, { v: 'static', l: 'Scrolls away' }]} />
        <Seg label="Cookie bar" value={cookie} onChange={setCookie} options={[{ v: 'big', l: 'Big' }, { v: 'compact', l: 'Compact' }, { v: 'none', l: 'Accepted' }]} />
        <Seg label="Promo strip" value={promo ? 1 : 0} onChange={(x) => setPromo(x === 1)} options={[{ v: 1, l: 'On' }, { v: 0, l: 'Off' }]} />
        <Seg label="Text zoom" value={zoom} onChange={setZoom} options={[{ v: 1, l: '100%' }, { v: 1.5, l: '150%' }, { v: 2, l: '200%' }]} />
        <Seg label="scroll-padding fix" value={padFix ? 1 : 0} onChange={(x) => setPadFix(x === 1)} options={[{ v: 0, l: 'Off' }, { v: 1, l: 'On' }]} />
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[auto_1fr]">
        <div className="min-w-0 overflow-x-auto">
          <div className="relative mx-auto overflow-hidden rounded-xl border-[6px] border-[#0c0d12] bg-white text-[#0e1120]" style={{ width: v.w, maxWidth: '100%', height: v.h, colorScheme: 'light' }}>
            <div
              ref={scroller}
              className="absolute inset-0 overflow-y-auto"
              onScroll={onScroll}
              onFocus={(e: FocusEvent) => e.target !== scroller.current && check()}
              style={{ scrollPaddingTop: padFix && mode !== 'static' ? topH + 8 : undefined, scrollPaddingBottom: padFix ? cookieH + 8 : undefined }}
            >
              <a href="#web-lab-main" onClick={skip} className="absolute top-1 left-1 z-50 -translate-y-[200%] rounded-md bg-[#0e1120] px-3 py-2 text-[13px] font-semibold text-white outline-none focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                Skip to main content
              </a>
              <header
                ref={header}
                className={`${mode === 'static' ? 'relative' : 'sticky'} top-0 z-20 transition-transform duration-200`}
                style={{ transform: mode === 'smart' && headerHidden ? 'translateY(-100%)' : 'none' }}
              >
                <div className="flex items-center gap-2 border-b border-black/10 bg-white px-3" style={{ height: headerH }}>
                  <Menu size={20 * zoom} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-bold tracking-tight" style={fs(16)}>
                    Threadline
                  </span>
                  <Search size={19 * zoom} aria-hidden="true" />
                  <ShoppingBag size={19 * zoom} aria-hidden="true" />
                </div>
                {promo && (
                  <div className="flex items-center justify-center truncate bg-[#2d6a4f] px-2 text-white" style={{ height: promoH, ...fs(12) }}>
                    Free delivery over €50
                  </div>
                )}
              </header>
              <main id="web-lab-main" ref={main} tabIndex={-1} className="px-3 pt-3 outline-none" style={{ paddingBottom: cookieH + 12 }}>
                <h3 className="font-bold" style={fs(19)}>
                  New in: autumn
                </h3>
                <p className="mt-1 text-[#4a5065]" style={fs(13)}>
                  Warm layers for cold mornings. Free returns within 30 days.
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {PRODUCTS.map((p, i) => (
                    <li key={p}>
                      <a href="#web-lab-main" onClick={(e) => e.preventDefault()} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
                        <span className="block h-16 rounded-lg" style={{ background: ['#e9d8c4', '#cfe1d6', '#d6dcef', '#f1d5d8'][i % 4] }} />
                        <span className="mt-1 block truncate font-medium underline" style={fs(13)}>
                          {p}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </main>
            </div>
            {cookie !== 'none' && (
              <div ref={cookieRef} className="absolute inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[#f6f7fb] p-3 shadow-[0_-8px_20px_rgba(0,0,0,.08)]" style={{ height: cookieH }}>
                {cookie === 'big' ? (
                  <>
                    <p className="font-semibold" style={fs(13)}>
                      We value your privacy
                    </p>
                    <p className="mt-1 text-[#4a5065]" style={fs(11)}>
                      We use cookies to improve your experience and show relevant ads. You can change your choice at any time.
                    </p>
                  </>
                ) : (
                  <p className="truncate text-[#4a5065]" style={fs(11)}>
                    We use cookies. <span className="underline">Settings</span>
                  </p>
                )}
                <div className="mt-2 flex gap-2" aria-hidden="true">
                  <span className="rounded-md bg-[#0e1120] px-2 py-1 text-white" style={fs(11)}>
                    Accept
                  </span>
                  <span className="rounded-md border border-black/20 px-2 py-1" style={fs(11)}>
                    Reject
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Room left for content</p>
            <p className={`mt-1 text-3xl font-bold ${tone}`} aria-live="polite">
              {pct}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
              <div className={`h-full rounded-full ${pct >= 60 ? 'bg-ok' : pct >= 40 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">
              Header {Math.round(topVisible)} px · cookie bar {Math.round(cookieH)} px · content {Math.round(content)} px of {v.h} px.
            </p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-line p-4 text-sm">
            {obscured === 'header' || obscured === 'cookie' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />}
            <p className="min-w-0" aria-live="polite">
              <span className="block text-xs font-semibold tracking-wide text-faint uppercase">Keyboard focus</span>
              {obscuredNote}
            </p>
          </div>
          <p className="text-sm text-muted">
            Tip: the first <kbd>Tab</kbd> inside the page shows a <strong>Skip to main content</strong> link. Press <kbd>Enter</kbd> on it and the next <kbd>Tab</kbd> lands on the first product, not in the header.
          </p>
        </div>
      </div>
    </div>
  );
}
