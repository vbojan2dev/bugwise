import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, Compass, House, Menu, MessageCircle, MoreVertical, Receipt, Search, User, Users } from 'lucide-react';
import { IOSTabBar, IOS_BAR, IOS_BLUE, IOS_SEP, M3, M3NavigationBar, type Dest } from './Bars';

function Card({ title, platform, note, chips, controls, children, bg = '#e9ebf2' }: { title: string; platform: string; note: string; chips: string[]; controls?: ReactNode; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col items-center gap-3 px-4 py-5" style={{ background: bg, colorScheme: 'light' }}>
        {controls}
        <div className="relative h-[330px] w-full max-w-[280px] overflow-hidden rounded-[22px] border border-black/10 shadow-sm">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function Chips<T extends string | number>({ label, options, value, onChange }: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-1">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={o.v === value}
          onClick={() => onChange(o.v)}
          className="rounded-full border px-2.5 py-1 text-[12px] font-medium text-[#1d1b20] outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]"
          style={{ background: o.v === value ? '#1d1b20' : '#fff', color: o.v === value ? '#fff' : '#1d1b20', borderColor: 'rgba(0,0,0,.15)' }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const ORDERS = ['Pizza Roma · €23.40', 'Nordic Home · €54.90', 'Sushi Kai · €31.00', 'GreenLeaf · €12.80', 'RunFast · €129.00', 'BookNook · €18.50', 'Café Mila · €7.20', 'Toy Planet · €24.99', 'Pixel Store · €19.99', 'Kitchenly · €42.00', 'PetPal · €16.40', 'Sporty · €79.00'];

/* 1. iOS navigation bar with a large title that collapses into the bar */
function IOSLargeTitle() {
  const [y, setY] = useState(0);
  const collapsed = y > 36;
  return (
    <div className="flex h-full flex-col bg-[#f2f2f7] text-black">
      <div className="flex h-11 shrink-0 items-center border-b px-1 transition-colors" style={{ background: collapsed ? IOS_BAR : '#f2f2f7', borderColor: collapsed ? IOS_SEP : 'transparent' }}>
        <span className="flex w-20 items-center text-[15px]" style={{ color: IOS_BLUE }} aria-hidden="true">
          <ChevronLeft size={22} strokeWidth={2.4} />
          Account
        </span>
        <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold transition-opacity" style={{ opacity: collapsed ? 1 : 0 }} aria-hidden={!collapsed}>
          Orders
        </p>
        <span className="flex w-20 justify-end pr-2" style={{ color: IOS_BLUE }} aria-hidden="true">
          <Search size={19} />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={(e) => setY(e.currentTarget.scrollTop)} tabIndex={0} aria-label="Orders list, scroll me">
        <h3 className="px-4 pt-1 pb-2 text-[30px] leading-tight font-bold">Orders</h3>
        <ul className="mx-3 mb-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
          {ORDERS.map((o) => (
            <li key={o} className="flex items-center justify-between px-3 py-2.5 text-[14px]">
              {o}
              <ChevronRight size={16} className="text-black/30" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* 2. Material 3 top app bar: small, center-aligned, medium, large */
type M3Kind = 'small' | 'center' | 'medium' | 'large';
const EXTRA: Record<M3Kind, number> = { small: 0, center: 0, medium: 48, large: 88 };
function M3TopBar({ kind }: { kind: M3Kind }) {
  const [y, setY] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const extra = EXTRA[kind];
  const shrink = Math.min(extra, y);
  const collapsed = extra > 0 && shrink >= extra - 4;
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setY(0);
  }, [kind]);
  const smallTitle = kind === 'small' || kind === 'center' || collapsed;
  return (
    <div className="flex h-full flex-col text-[#1d1b20]" style={{ background: M3.surface }}>
      <div className="shrink-0 transition-colors" style={{ background: y > 0 ? M3.scrolled : M3.surface }}>
        <div className="flex h-16 items-center gap-1 px-1">
          <span className="grid size-12 place-items-center" aria-hidden="true">
            {kind === 'center' ? <Menu size={22} /> : <ArrowLeft size={22} />}
          </span>
          <p className={`min-w-0 flex-1 truncate text-[20px] transition-opacity ${kind === 'center' ? 'text-center' : ''}`} style={{ opacity: smallTitle ? 1 : 0 }}>
            {kind === 'center' ? 'Snackr' : 'Trail runners'}
          </p>
          <span className="grid size-12 place-items-center" aria-hidden="true">
            {kind === 'center' ? <User size={22} /> : <Search size={22} />}
          </span>
          {kind !== 'center' && (
            <span className="grid size-12 place-items-center" aria-hidden="true">
              <MoreVertical size={22} />
            </span>
          )}
        </div>
        {extra > 0 && (
          <div className="overflow-hidden px-4" style={{ height: extra - shrink }}>
            <p className="truncate pt-1" style={{ fontSize: kind === 'large' ? 28 : 24, opacity: 1 - shrink / extra, paddingTop: kind === 'large' ? 30 : 6 }}>
              Trail runners
            </p>
          </div>
        )}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto" onScroll={(e) => setY(e.currentTarget.scrollTop)} tabIndex={0} aria-label="Product list, scroll me">
        <ul className="space-y-2 p-3">
          {['Trail runner 2', 'Ridge GTX', 'Mudlark 5', 'Summit Pro', 'Forest Flow', 'Rocky Mid', 'Canyon Lite', 'Peak Racer', 'Moss Grip', 'Alpine Zero'].map((p, i) => (
            <li key={p} className="flex items-center gap-3 rounded-2xl bg-[#f3edf7] p-2.5 text-[14px]">
              <span className="size-10 shrink-0 rounded-xl" style={{ background: ['#d0bcff', '#ffd8e4', '#c8e6c9', '#ffe0b2'][i % 4] }} />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* 3. iOS tab bar: each tab keeps its own stack, re-tapping pops to root, then scrolls to top */
const IOS_TABS: Dest[] = [
  { label: 'Home', icon: House },
  { label: 'Search', icon: Search },
  { label: 'Orders', icon: Receipt, badge: 2 },
  { label: 'Account', icon: User },
];
function IOSTabBarDemo() {
  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState<(string | null)[]>([null, null, null, null]);
  const [seen, setSeen] = useState(false);
  const [toast, setToast] = useState('');
  const scrollers = useRef<(HTMLDivElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = (s: string) => {
    setToast(s);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), 1600);
  };
  const select = (i: number) => {
    if (i === 2) setSeen(true);
    if (i !== tab) {
      setTab(i);
      return;
    }
    if (detail[i]) {
      setDetail((d) => d.map((x, k) => (k === i ? null : x)));
      flash('Popped to the tab’s first screen');
      return;
    }
    scrollers.current[i]?.scrollTo({ top: 0, behavior: 'smooth' });
    flash('Scrolled to the top');
  };
  const items = IOS_TABS.map((t) => (t.label === 'Orders' ? { ...t, badge: seen ? 0 : 2 } : t));
  return (
    <div className="relative flex h-full flex-col bg-[#f2f2f7] text-black">
      <div className="relative min-h-0 flex-1">
        {IOS_TABS.map((t, i) => (
          <div key={t.label} className="absolute inset-0 flex flex-col" style={{ visibility: i === tab ? 'visible' : 'hidden' }}>
            <div className="flex h-11 shrink-0 items-center border-b px-1" style={{ background: IOS_BAR, borderColor: IOS_SEP }}>
              {detail[i] ? (
                <button type="button" onClick={() => setDetail((d) => d.map((x, k) => (k === i ? null : x)))} className="flex w-20 items-center text-[15px]" style={{ color: IOS_BLUE }}>
                  <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
                  {t.label}
                </button>
              ) : (
                <span className="w-20" />
              )}
              <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold">{detail[i] ?? t.label}</p>
              <span className="w-20" />
            </div>
            {detail[i] ? (
              <div className="space-y-2 p-4 text-[14px]">
                <div className="h-24 rounded-xl bg-[#e5d3c0]" />
                <p className="font-semibold">{detail[i]}</p>
                <p className="text-black/60">Tap “{t.label}” in the tab bar again to pop back to the list.</p>
              </div>
            ) : (
              <div
                ref={(el) => {
                  scrollers.current[i] = el;
                }}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <ul className="m-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
                  {ORDERS.map((o, k) => (
                    <li key={o}>
                      <button type="button" onClick={() => setDetail((d) => d.map((x, j) => (j === i ? o.split(' · ')[0] : x)))} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[14px] hover:bg-black/[0.03]">
                        {k + 1}. {o.split(' · ')[0]}
                        <ChevronRight size={16} className="text-black/30" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {toast && (
          <p role="status" className="absolute inset-x-6 bottom-3 z-10 rounded-full bg-black/75 px-3 py-1.5 text-center text-[12px] text-white">
            {toast}
          </p>
        )}
      </div>
      <IOSTabBar items={items} value={tab} onSelect={select} />
    </div>
  );
}

/* 4. Material 3 navigation bar: 3–5 destinations, Back returns to the start destination */
const M3_DESTS: Dest[] = [
  { label: 'Home', icon: House },
  { label: 'Explore', icon: Compass },
  { label: 'Chats', icon: MessageCircle, badge: 3 },
  { label: 'Groups', icon: Users },
  { label: 'Alerts', icon: Bell, badge: 'dot' },
];
function M3NavDemo({ count, backSignal }: { count: number; backSignal: number }) {
  const [tab, setTab] = useState(0);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const last = useRef(backSignal);
  const dests = M3_DESTS.slice(0, count).map((d) => (read[d.label] ? { ...d, badge: undefined } : d));
  useEffect(() => {
    if (tab >= count) setTab(0);
  }, [count, tab]);
  useEffect(() => {
    if (backSignal === last.current) return;
    last.current = backSignal;
    setNote(tab === 0 ? 'Back on the start destination: the app closes' : 'Back returned to Home first');
    setTab(0);
  }, [backSignal, tab]);
  const select = (i: number) => {
    setTab(i);
    setNote('');
    const l = M3_DESTS[i].label;
    setRead((r) => (r[l] ? r : { ...r, [l]: true }));
  };
  const Icon = M3_DESTS[tab]?.icon ?? House;
  return (
    <div className="flex h-full flex-col text-[#1d1b20]" style={{ background: M3.surface }}>
      <div className="flex h-16 shrink-0 items-center px-4 text-[20px]">{M3_DESTS[tab]?.label}</div>
      <div className="grid min-h-0 flex-1 place-items-center px-6 text-center text-[14px] text-[#49454f]">
        <div>
          <Icon size={40} className="mx-auto mb-2" style={{ color: M3.primary }} aria-hidden="true" />
          {note || `${M3_DESTS[tab]?.label} destination`}
        </div>
      </div>
      <M3NavigationBar items={dests} value={tab} onSelect={select} />
    </div>
  );
}

export default function VariantsGallery() {
  const [kind, setKind] = useState<M3Kind>('medium');
  const [count, setCount] = useState(4);
  const [back, setBack] = useState(0);
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      <Card
        title="Navigation bar with large title"
        platform="iOS"
        note="Scroll the list: the big “Orders” title slides away and reappears small, centered in the bar. The back button names the previous screen."
        chips={['Large title collapses', 'Back = previous title', '44 pt bar']}
      >
        <IOSLargeTitle />
      </Card>
      <Card
        title="Top app bar"
        platform="Android"
        note="Small and center-aligned bars keep one height. Medium and large bars start tall and shrink to a small bar as you scroll. A tint shows the bar is above content."
        chips={['64 / 112 / 152 dp', 'Overflow ⋮ menu', 'Tint on scroll']}
        controls={
          <Chips
            label="Top app bar size"
            value={kind}
            onChange={setKind}
            options={[
              { v: 'small', l: 'Small' },
              { v: 'center', l: 'Center-aligned' },
              { v: 'medium', l: 'Medium' },
              { v: 'large', l: 'Large' },
            ]}
          />
        }
      >
        <M3TopBar kind={kind} />
      </Card>
      <Card
        title="Tab bar"
        platform="iOS"
        note="Open a restaurant, switch tabs and come back: it’s still open. Tap the selected tab again to pop to the list, and once more to scroll to the top. The Orders badge clears once you visit."
        chips={['Own stack per tab', 'Re-tap = root / top', 'Above home indicator']}
      >
        <IOSTabBarDemo />
      </Card>
      <Card
        title="Navigation bar (bottom)"
        platform="Android"
        note="3 to 5 destinations with icons and labels. The pill marks the current one. Visit a destination and Back takes you to Home first, then out of the app."
        chips={['3–5 destinations', 'Pill indicator', 'Back → start destination']}
        controls={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Chips
              label="Number of destinations"
              value={count}
              onChange={setCount}
              options={[
                { v: 3, l: '3' },
                { v: 4, l: '4' },
                { v: 5, l: '5' },
              ]}
            />
            <button type="button" onClick={() => setBack((b) => b + 1)} className="rounded-full border border-black/15 bg-white px-2.5 py-1 text-[12px] font-medium text-[#1d1b20] outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]">
              ◁ System Back
            </button>
          </div>
        }
      >
        <M3NavDemo count={count} backSignal={back} />
      </Card>
    </div>
  );
}

