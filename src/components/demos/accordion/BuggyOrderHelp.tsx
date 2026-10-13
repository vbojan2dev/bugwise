import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Link2, Package, RotateCcw, Volume2 } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { useScreenReader } from './Accordion';

/*
 * A deliberately broken "Order details" page (web shop) built from accordion sections. Bugs (don't spoil them!):
 *  1. The chevron's rotation is a separate piece of state that is flipped on every chevron click.
 *     "Delivery" starts open with the chevron pointing down, and "Expand all" never rotates any chevron.
 *  2. Only the small chevron is a button. Clicking the title or anywhere else on the header row does nothing.
 *  3. After opening a section, the page scrolls so the panel's bottom is visible. For the long "Items" panel
 *     that pushes the header you just clicked off the top of the view.
 *  4. aria-expanded is hard-coded to false: the screen reader says "collapsed" for open sections too.
 *  5. Deep links (#returns, from the email or the link in Delivery) scroll to the Returns header but don't open it.
 *  6. The "Expand all / Collapse all" label is its own boolean, only flipped by that button. After opening or
 *     closing sections by hand, the label is wrong (e.g. "Expand all" while everything is open).
 */

type Id = 'delivery' | 'items' | 'payment' | 'returns' | 'contact';
const IDS: Id[] = ['delivery', 'items', 'payment', 'returns', 'contact'];
const BASE = 'shop.example.com/orders/4821';

const ITEMS = [
  { n: 'Desk lamp “Nordic”', q: 1, p: '€39.90' },
  { n: 'LED bulb E27, warm white', q: 2, p: '€15.00' },
  { n: 'Linen cushion cover, sand', q: 2, p: '€49.80' },
  { n: 'Ceramic plant pot, 14 cm', q: 1, p: '€24.90' },
  { n: 'Wool throw blanket', q: 1, p: '€44.90' },
  { n: 'Gift wrap', q: 1, p: '€0.00' },
];

export function BuggyOrderHelp() {
  const [open, setOpen] = useState<Set<Id>>(() => new Set<Id>(['delivery']));
  const [flipped, setFlipped] = useState<Partial<Record<Id, boolean>>>({}); // BUG 1: should be derived from `open`
  const [allOpen, setAllOpen] = useState(false); // BUG 6: should be derived from `open`
  const [url, setUrl] = useState(BASE);
  const [said, setSaid] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<Partial<Record<Id, HTMLElement | null>>>({});
  const panels = useRef<Partial<Record<Id, HTMLDivElement | null>>>({});
  const timers = useRef<number[]>([]);

  useScreenReader(root, setSaid);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 4));

  const toggle = (id: Id) => {
    const willOpen = !open.has(id);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setFlipped((f) => ({ ...f, [id]: !f[id] })); // BUG 1
    if (willOpen) {
      // BUG 3: "make sure the opened content is visible" scrolls to the panel's END
      later(() => {
        const sc = scroller.current;
        const p = panels.current[id];
        if (!sc || !p) return;
        const bottom = p.offsetTop + p.offsetHeight;
        if (bottom > sc.scrollTop + sc.clientHeight) sc.scrollTop = bottom - sc.clientHeight + 12;
      }, 40);
    }
  };

  const expandAll = () => {
    setOpen(allOpen ? new Set<Id>() : new Set<Id>(IDS));
    setAllOpen((v) => !v); // BUG 6 (and BUG 1: chevrons are not updated)
  };

  const goToReturns = () => {
    setUrl(`${BASE}#returns`);
    // BUG 5: scrolls to the section but never opens it
    later(() => {
      const sc = scroller.current;
      const s = sections.current.returns;
      if (sc && s) sc.scrollTop = s.offsetTop - 8;
    }, 30);
    addLog('Navigated to #returns');
  };

  const openEmailLink = () => {
    reset(false);
    addLog('Opened link from “Your order was delivered” email');
    goToReturns();
  };

  const reset = (clearLog = true) => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setOpen(new Set<Id>(['delivery']));
    setFlipped({});
    setAllOpen(false);
    setUrl(BASE);
    setSaid('');
    if (clearLog) setLog([]);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  const section = (id: Id, title: string, summary: string, body: ReactNode) => {
    const isOpen = open.has(id);
    return (
      <section
        key={id}
        id={`help-${id}`}
        ref={(el) => {
          sections.current[id] = el;
        }}
        className="border-t border-black/10"
      >
        {/* BUG 2: the row is a plain div; only the chevron button reacts */}
        <div className="flex min-h-[52px] items-center gap-3 py-2 pr-2 pl-4">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-[15px] font-semibold">{title}</h3>
            <p className="truncate text-[12px] text-[#5a5f70]">{summary}</p>
          </div>
          <button
            type="button"
            aria-label={title}
            aria-expanded={false} /* BUG 4: never updated */
            onClick={() => toggle(id)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#5a5f70] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
          >
            <ChevronDown size={18} style={{ transform: flipped[id] ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>
        {isOpen && (
          <div
            ref={(el) => {
              panels.current[id] = el;
            }}
            className="px-4 pb-4 text-[14px] leading-relaxed text-[#3c4150]"
          >
            {body}
          </div>
        )}
      </section>
    );
  };

  return (
    <div ref={root} className="flex w-full max-w-[560px] flex-col gap-4">
      <BrowserFrame url={url}>
        <div ref={scroller} className="relative h-[380px] overflow-y-auto overscroll-contain bg-white text-[#0e1120]" style={{ colorScheme: 'light' }}>
          <div className="flex items-center gap-2 border-b border-black/10 px-4 py-2.5 text-[13px]">
            <span className="font-bold tracking-tight">nordic·home</span>
            <span className="ml-auto text-[#5a5f70]">My account</span>
          </div>
          <div className="px-4 pt-4 pb-3">
            <p className="text-[12px] text-[#5a5f70]">My orders ›</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-[20px] font-bold">Order #4821</h2>
              <span className="rounded-full bg-[#e6f6ec] px-2 py-0.5 text-[12px] font-semibold text-[#17733a]">Delivered</span>
            </div>
            <p className="mt-0.5 text-[13px] text-[#5a5f70]">Placed 3 Oct · 8 items · €174.50</p>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 pb-2">
            <p className="text-[13px] font-semibold tracking-wide text-[#5a5f70] uppercase">Order details</p>
            <button type="button" onClick={expandAll} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#2f6bff] outline-none hover:bg-[#2f6bff]/10 focus-visible:ring-2 focus-visible:ring-[#2f6bff]">
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {section(
            'delivery',
            'Delivery',
            'Delivered Mon 6 Oct',
            <>
              <p>Delivered on Monday 6 October at 14:12 to parcel locker “Hauptbahnhof 3”, compartment 41.</p>
              <p className="mt-2">
                Something wrong with your order?{' '}
                <a
                  href="#returns"
                  onClick={(e) => {
                    e.preventDefault();
                    goToReturns();
                  }}
                  className="font-medium text-[#2f6bff] underline"
                >
                  See returns
                </a>
              </p>
            </>,
          )}
          {section(
            'items',
            'Items (6)',
            '8 pieces from 1 seller',
            <ul className="divide-y divide-black/10">
              {ITEMS.map((it) => (
                <li key={it.n} className="flex min-h-[60px] items-center gap-3 py-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f2f4f8] text-[#5a5f70]">
                    <Package size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-[#0e1120]">{it.n}</span>
                    <span className="block text-[12px]">Qty {it.q}</span>
                  </span>
                  <span className="shrink-0 text-[14px] font-medium text-[#0e1120]">{it.p}</span>
                </li>
              ))}
              <li className="flex justify-between pt-3 font-semibold text-[#0e1120]">
                <span>Total</span>
                <span>€174.50</span>
              </li>
            </ul>,
          )}
          {section(
            'payment',
            'Payment',
            'Visa •••• 4242',
            <>
              <p>Paid €174.50 with Visa •••• 4242 on 3 October.</p>
              <p className="mt-1">Shipping: free (order over €50).</p>
            </>,
          )}
          {section(
            'returns',
            'Returns',
            'Free returns until 5 Nov',
            <>
              <p>You can return items within 30 days of delivery. The return label is free. Refunds arrive within 5 working days after we receive the parcel.</p>
              <button type="button" className="mt-3 h-10 rounded-full bg-[#0e1120] px-5 text-[14px] font-semibold text-white">
                Start a return
              </button>
            </>,
          )}
          {section('contact', 'Help with this order', 'Chat or call us', <p>Chat with us 8:00–20:00, or call +49 30 1234 5678. Have your order number ready.</p>)}
          <div className="h-6 border-t border-black/10" />
        </div>
      </BrowserFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Tester tools</p>
          <button type="button" onClick={() => reset()} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reload page
          </button>
        </div>
        <button type="button" onClick={openEmailLink} className="mt-2 flex w-full min-w-0 items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-left font-mono text-xs hover:text-brand">
          <Link2 size={14} className="shrink-0" /> <span className="truncate">Email link: …/orders/4821#returns</span>
        </button>
        <div className="mt-2 rounded-lg bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader would say
          </p>
          <p className="mt-1 text-sm text-fg" aria-live="polite">
            {said ? `“${said}”` : 'Tab to a control or click one to hear it…'}
          </p>
        </div>
        {log.length > 0 && (
          <ul className="mt-2 space-y-0.5 px-1 font-mono text-[11px] text-muted">
            {log.map((s, i) => (
              <li key={i} className="truncate">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
