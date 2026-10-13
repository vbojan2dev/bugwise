import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, Download, Filter, House, Info, MoreVertical, Receipt, Search, Share, User } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { IOSTabBar, IOS_BAR, IOS_BLUE, IOS_SEP, M3, M3NavigationBar, type Dest } from './Bars';

/*
 * Bars lab: one "Order history" screen with a top bar and a bottom bar.
 * Change the title, the number of actions and the text size, and switch good behaviors off one at a time.
 */

const TITLES = {
  short: 'Orders',
  long: 'Order #48213 · Nordic Home Furniture',
  german: 'Bestellungen und Rücksendungen',
} as const;
type TitleKey = keyof typeof TITLES;

const ACTIONS = [
  { label: 'Search', icon: Search },
  { label: 'Filter', icon: Filter },
  { label: 'Share', icon: Share },
  { label: 'Download invoices', icon: Download },
];

const DESTS: Dest[] = [
  { label: 'Home', icon: House },
  { label: 'Search', icon: Search },
  { label: 'Orders', icon: Receipt },
  { label: 'Account', icon: User },
];

const ROWS = Array.from({ length: 14 }, (_, i) => ({ id: `#${48213 - i * 11}`, shop: ['Nordic Home', 'Pizza Roma', 'RunFast', 'BookNook', 'GreenLeaf', 'Pixel Store', 'Sushi Kai'][i % 7], total: `€${(14 + i * 7.15).toFixed(2)}` }));

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

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-w-0 items-start justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 shrink-0 accent-[var(--brand)]" />
    </label>
  );
}

function Status({ tone, children }: { tone: 'ok' | 'warn' | 'danger' | 'info'; children: ReactNode }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'info' ? Info : AlertTriangle;
  const color = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-brand';
  return (
    <li className="flex gap-2 text-sm">
      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function intersects(a: DOMRect, b: DOMRect) {
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom && a.bottom > b.top;
}

export default function Playground() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [titleKey, setTitleKey] = useState<TitleKey>('long');
  const [actionCount, setActionCount] = useState(2);
  const [scale, setScale] = useState(1);
  const [truncate, setTruncate] = useState(true);
  const [safeArea, setSafeArea] = useState(true);
  const [inset, setInset] = useState(true);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState(2);
  const [menu, setMenu] = useState(false);
  const [measure, setMeasure] = useState({ overlap: false, clipped: false });
  const [barH, setBarH] = useState(70);

  const titleRef = useRef<HTMLParagraphElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const menuBtn = useRef<HTMLButtonElement>(null);

  const ios = platform === 'ios';
  const title = TITLES[titleKey];
  const visibleActions = ios ? ACTIONS.slice(0, actionCount) : ACTIONS.slice(0, actionCount > 2 ? 1 : actionCount);
  const overflow = ios ? [] : actionCount > 2 ? ACTIONS.slice(1, actionCount) : [];

  // Re-measure after every render: title vs buttons, clipped text, bottom bar height.
  useLayoutEffect(() => {
    const t = titleRef.current;
    const a = actionsRef.current;
    const b = backRef.current;
    if (t && a) {
      const tr = t.getBoundingClientRect();
      const overlap = intersects(tr, a.getBoundingClientRect()) || (b ? intersects(tr, b.getBoundingClientRect()) : false);
      const clipped = t.scrollWidth > t.clientWidth + 1;
      setMeasure((m) => (m.overlap === overlap && m.clipped === clipped ? m : { overlap, clipped }));
    }
    const h = barRef.current?.offsetHeight ?? 0;
    if (h) setBarH((p) => (p === h ? p : h));
  });

  useEffect(() => {
    if (!hideOnScroll) setHidden(false);
  }, [hideOnScroll]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  useEffect(() => setMenu(false), [platform, actionCount]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const y = el.scrollTop;
    const d = y - lastY.current;
    lastY.current = y;
    if (!hideOnScroll) return;
    if (y + el.clientHeight >= el.scrollHeight - 2 || y < 30) setHidden(false);
    else if (d > 4) setHidden(true);
    else if (d < -4) setHidden(false);
  };

  const titleStyle = { fontSize: (ios ? 16 : 21) * scale };
  const titleNode = truncate ? (
    <p ref={titleRef} className={`min-w-0 flex-1 truncate ${ios ? 'px-1 text-center font-semibold' : 'pl-1'}`} style={titleStyle}>
      {title}
    </p>
  ) : (
    <>
      <span className="flex-1" />
      <p ref={titleRef} className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap ${ios ? 'left-1/2 -translate-x-1/2 font-semibold' : 'left-14'}`} style={titleStyle}>
        {title}
      </p>
    </>
  );

  const checks: { tone: 'ok' | 'warn' | 'danger' | 'info'; text: ReactNode }[] = [];
  if (measure.overlap) checks.push({ tone: 'danger', text: <><strong>Title overlaps the buttons.</strong> Tapping the title area may hit an action, and neither is readable.</> });
  else if (measure.clipped) checks.push({ tone: 'warn', text: <><strong>Title is truncated with “…”.</strong> Acceptable, if the full name is shown elsewhere (large title, the screen itself) and read by the screen reader.</> });
  else checks.push({ tone: 'ok', text: <>Title fits.</> });
  if (overflow.length) checks.push({ tone: 'info', text: <>{overflow.length} action{overflow.length > 1 ? 's' : ''} moved into the <strong>⋮ overflow menu</strong>. Open it and check every item.</> });
  if (ios && actionCount > 2) checks.push({ tone: 'warn', text: <>Three icons crowd an iPhone bar and squeeze the title. Apple suggests keeping bar items to a minimum.</> });
  checks.push(safeArea ? { tone: 'ok', text: <>Bottom bar sits above the {ios ? 'home indicator' : 'gesture bar'}.</> } : { tone: 'danger', text: <><strong>Labels sit under the {ios ? 'home indicator' : 'gesture bar'}.</strong> Hard to read and taps can trigger the system gesture.</> });
  checks.push(inset ? { tone: 'ok', text: <>Content is inset: the last row can scroll above the bar.</> } : { tone: 'danger', text: <><strong>The last rows are hidden behind the bar.</strong> Scroll to the end: “End of order history” is unreachable.</> });

  return (
    <div className="not-prose my-8 grid grid-cols-1 items-start gap-6 rounded-3xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[auto_1fr]">
      <div className="flex min-w-0 justify-center">
        <PhoneFrame os={platform} width={280}>
          <div className="absolute inset-0 flex flex-col" style={{ colorScheme: 'light', background: ios ? '#f2f2f7' : M3.surface, color: ios ? '#000' : M3.onSurface }}>
            {/* top bar */}
            {ios ? (
              <div className="relative flex h-11 shrink-0 items-center border-b px-1" style={{ background: IOS_BAR, borderColor: IOS_SEP }}>
                <span ref={backRef} className="flex shrink-0 items-center" style={{ color: IOS_BLUE, fontSize: 16 * scale }}>
                  <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" />
                  Account
                </span>
                {titleNode}
                <div ref={actionsRef} className="flex shrink-0 items-center">
                  {visibleActions.map((a) => (
                    <span key={a.label} role="img" aria-label={a.label} className="grid size-9 place-items-center" style={{ color: IOS_BLUE }}>
                      <a.icon size={19} />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative flex h-16 shrink-0 items-center px-1" style={{ background: M3.surface }}>
                <span ref={backRef} className="grid size-12 shrink-0 place-items-center" role="img" aria-label="Back">
                  <ArrowLeft size={22} />
                </span>
                {titleNode}
                <div ref={actionsRef} className="flex shrink-0 items-center">
                  {visibleActions.map((a) => (
                    <span key={a.label} role="img" aria-label={a.label} className="grid size-11 place-items-center">
                      <a.icon size={21} />
                    </span>
                  ))}
                  {overflow.length > 0 && (
                    <button ref={menuBtn} type="button" aria-label="More options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="grid size-11 place-items-center rounded-full hover:bg-black/5">
                      <MoreVertical size={21} />
                    </button>
                  )}
                </div>
                {menu && (
                  <>
                    <div className="absolute inset-x-0 top-0 z-30 h-[1000px]" onClick={() => setMenu(false)} aria-hidden="true" />
                    <ul role="menu" className="absolute top-12 right-2 z-40 min-w-[11rem] rounded-[4px] bg-[#f3edf7] py-2 text-[14px] shadow-lg">
                      {overflow.map((a) => (
                        <li key={a.label} role="none">
                          <button type="button" role="menuitem" onClick={() => setMenu(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-black/5">
                            <a.icon size={18} aria-hidden="true" /> {a.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* content + bottom bar */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto" onScroll={onScroll} tabIndex={0} aria-label="Order history" style={{ paddingBottom: inset ? barH : 0 }}>
                <ul className={ios ? 'm-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-white' : 'space-y-1 p-2'}>
                  {ROWS.map((r) => (
                    <li key={r.id} className={`flex items-center justify-between gap-2 px-3 py-2.5 ${ios ? '' : 'rounded-xl bg-[#f3edf7]'}`} style={{ fontSize: 14 * scale }}>
                      <span className="min-w-0 truncate">
                        {r.shop} <span className="opacity-60">{r.id}</span>
                      </span>
                      <span className="shrink-0">{r.total}</span>
                    </li>
                  ))}
                </ul>
                <p className="px-4 pt-1 pb-3 text-center text-[12px] font-semibold" style={{ color: ios ? IOS_BLUE : M3.primary }}>
                  End of order history
                </p>
              </div>
              <div ref={barRef} className="absolute inset-x-0 bottom-0 transition-transform duration-200" style={{ transform: hidden ? 'translateY(100%)' : 'none' }}>
                {ios ? <IOSTabBar items={DESTS} value={tab} onSelect={setTab} safeArea={safeArea} scale={scale} /> : <M3NavigationBar items={DESTS} value={tab} onSelect={setTab} safeArea={safeArea} scale={scale} />}
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Seg label="Platform" value={platform} onChange={setPlatform} options={[{ v: 'ios', l: 'iOS' }, { v: 'android', l: 'Android' }]} />
          <Seg label="Title" value={titleKey} onChange={setTitleKey} options={[{ v: 'short', l: 'Short' }, { v: 'long', l: 'Long' }, { v: 'german', l: 'German' }]} />
          <Seg label="Actions" value={actionCount} onChange={setActionCount} options={[{ v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }]} />
          <Seg label="Text size" value={scale} onChange={setScale} options={[{ v: 1, l: '100%' }, { v: 1.25, l: '125%' }, { v: 1.5, l: '150%' }]} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Toggle label="Truncate long titles" hint="Off: the title is drawn at full width." checked={truncate} onChange={setTruncate} />
          <Toggle label="Respect bottom safe area" hint="Padding above the home indicator." checked={safeArea} onChange={setSafeArea} />
          <Toggle label="Inset content for the bar" hint="Extra space so the last row clears the bar." checked={inset} onChange={setInset} />
          <Toggle label="Hide bottom bar on scroll" hint="A design choice: hides going down, returns going up." checked={hideOnScroll} onChange={setHideOnScroll} />
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">What a tester sees</p>
          <ul className="space-y-2" aria-live="polite">
            {checks.map((c, i) => (
              <Status key={i} tone={c.tone}>
                {c.text}
              </Status>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
