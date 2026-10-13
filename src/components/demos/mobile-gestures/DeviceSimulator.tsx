import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { BookOpen, ChevronLeft, Heart, Lock, Plus, RotateCw, ShoppingBag, Smartphone, Star, Tablet, Pizza, Info as InfoIcon } from 'lucide-react';

/*
 * Device simulator: rotate a device, switch between a small phone, a large phone with a Dynamic Island,
 * a tablet and a foldable, and watch a sample food-delivery screen re-layout.
 * The app is rendered at the device's real logical size (pt / dp) and scaled down to fit,
 * so the layout decisions are the ones a real app would make.
 */

type Orientation = 'portrait' | 'landscape';
type Insets = { t: number; b: number; l: number; r: number };
type DeviceId = 'se' | 'pro' | 'tablet' | 'fold';

interface Spec {
  label: string;
  model: string;
  os: 'ios' | 'android';
  w: number; // portrait logical width
  h: number; // portrait logical height
  unit: 'pt' | 'dp';
  density: number;
  pxW: number;
  pxH: number;
  approx?: boolean;
  radius: number;
  bezel: [number, number]; // [sides, top/bottom] in portrait, logical units
  homeButton?: boolean;
  cutout?: { cx: number; cy: number; w: number; h: number }; // in portrait coordinates
  homeIndicator: boolean;
  statusBar: Record<Orientation, boolean>;
  insets: Record<Orientation, Insets>;
  hinge?: boolean;
  splittable?: boolean;
}

const specs: Record<'se' | 'pro' | 'tablet' | 'foldOpen' | 'foldClosed', Spec> = {
  se: {
    label: 'Small phone',
    model: 'iPhone SE (3rd gen)',
    os: 'ios',
    w: 375,
    h: 667,
    unit: 'pt',
    density: 2,
    pxW: 750,
    pxH: 1334,
    radius: 0,
    bezel: [18, 95],
    homeButton: true,
    homeIndicator: false,
    statusBar: { portrait: true, landscape: false },
    insets: { portrait: { t: 20, b: 0, l: 0, r: 0 }, landscape: { t: 0, b: 0, l: 0, r: 0 } },
  },
  pro: {
    label: 'Large phone',
    model: 'iPhone 16 Pro Max',
    os: 'ios',
    w: 440,
    h: 956,
    unit: 'pt',
    density: 3,
    pxW: 1320,
    pxH: 2868,
    radius: 62,
    bezel: [14, 14],
    cutout: { cx: 220, cy: 29.5, w: 126, h: 37 },
    homeIndicator: true,
    statusBar: { portrait: true, landscape: false },
    insets: { portrait: { t: 62, b: 34, l: 0, r: 0 }, landscape: { t: 0, b: 21, l: 62, r: 62 } },
  },
  tablet: {
    label: 'Tablet',
    model: 'iPad Air 11-inch',
    os: 'ios',
    w: 820,
    h: 1180,
    unit: 'pt',
    density: 2,
    pxW: 1640,
    pxH: 2360,
    radius: 18,
    bezel: [26, 26],
    homeIndicator: true,
    statusBar: { portrait: true, landscape: true },
    insets: { portrait: { t: 24, b: 20, l: 0, r: 0 }, landscape: { t: 24, b: 20, l: 0, r: 0 } },
    splittable: true,
  },
  foldOpen: {
    label: 'Foldable',
    model: 'Android foldable (inner screen)',
    os: 'android',
    w: 707,
    h: 823,
    unit: 'dp',
    density: 2.625,
    pxW: 1856,
    pxH: 2160,
    approx: true,
    radius: 22,
    bezel: [14, 14],
    homeIndicator: true,
    statusBar: { portrait: true, landscape: true },
    insets: { portrait: { t: 32, b: 24, l: 0, r: 0 }, landscape: { t: 32, b: 24, l: 0, r: 0 } },
    hinge: true,
    splittable: true,
  },
  foldClosed: {
    label: 'Foldable',
    model: 'Android foldable (cover screen)',
    os: 'android',
    w: 369,
    h: 905,
    unit: 'dp',
    density: 2.625,
    pxW: 968,
    pxH: 2376,
    approx: true,
    radius: 30,
    bezel: [12, 12],
    cutout: { cx: 184.5, cy: 18, w: 12, h: 12 },
    homeIndicator: true,
    statusBar: { portrait: true, landscape: true },
    insets: { portrait: { t: 36, b: 24, l: 0, r: 0 }, landscape: { t: 28, b: 24, l: 36, r: 0 } },
  },
};

const menu = [
  { name: 'Margherita', desc: 'Tomato, mozzarella, basil', price: 9.5, color: '#ffb199' },
  { name: 'Diavola', desc: 'Spicy salami, chilli oil', price: 11, color: '#ff8a80' },
  { name: 'Quattro Formaggi', desc: 'Four cheeses, honey drizzle', price: 12.5, color: '#ffe082' },
  { name: 'Funghi', desc: 'Mushrooms, garlic, thyme', price: 10.5, color: '#d7ccc8' },
  { name: 'Calzone', desc: 'Folded, ham and ricotta', price: 11.5, color: '#ffcc80' },
  { name: 'Tiramisu', desc: 'Homemade, serves one', price: 5.5, color: '#bcaaa4' },
  { name: 'Lemonade', desc: 'Fresh, 0.4 l', price: 3.9, color: '#fff59d' },
];

const ORANGE = '#e8590c';
const zero: Insets = { t: 0, b: 0, l: 0, r: 0 };

function layoutFor(w: number, h: number) {
  const width = w < 600 ? 'compact' : w < 840 ? 'medium' : 'expanded';
  if (width === 'compact') return { width, height: h < 480 ? 'compact' : 'regular', kind: 'one' as const, text: 'Compact width → one column, basket bar at the bottom' };
  if (h < 480) return { width, height: 'compact', kind: 'two' as const, text: 'Compact height → two panes side by side, no tall hero image' };
  if (width === 'medium') return { width, height: 'regular', kind: 'grid2' as const, text: 'Medium width → category sidebar + 2-column grid' };
  return { width, height: 'regular', kind: 'grid3' as const, text: 'Expanded width → category sidebar + 3-column grid' };
}

const euro = (n: number) => `€${n.toFixed(2)}`;

function MenuRow({ m, onAdd }: { m: (typeof menu)[number]; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#e5e5ea] bg-white px-4 py-3">
      <div className="size-14 shrink-0 rounded-xl" style={{ background: m.color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold">{m.name}</p>
        <p className="truncate text-[13px] text-[#6b6b70]">{m.desc}</p>
        <p className="text-[14px] font-medium">{euro(m.price)}</p>
      </div>
      <button type="button" aria-label={`Add ${m.name}`} onClick={onAdd} className="grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ background: ORANGE }}>
        <Plus size={18} />
      </button>
    </div>
  );
}

function MenuCard({ m, onAdd }: { m: (typeof menu)[number]; onAdd: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="h-24" style={{ background: m.color }} />
      <div className="flex items-end gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{m.name}</p>
          <p className="truncate text-[13px] text-[#6b6b70]">{m.desc}</p>
          <p className="text-[14px] font-medium">{euro(m.price)}</p>
        </div>
        <button type="button" aria-label={`Add ${m.name}`} onClick={onAdd} className="grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ background: ORANGE }}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function Hero({ height }: { height: number }) {
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ height, background: 'linear-gradient(135deg,#ffb74d,#e8590c)' }}>
      <Pizza size={Math.min(72, height * 0.45)} className="text-white/90" strokeWidth={1.5} />
    </div>
  );
}

function Info({ compact }: { compact?: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[22px] leading-tight font-bold">Luigi&apos;s Pizzeria</p>
      <p className="mt-1 flex items-center gap-1 text-[13px] text-[#6b6b70]">
        <Star size={13} className="fill-[#ffb300] text-[#ffb300]" /> 4.7 · 25–35 min · €1.99 delivery
      </p>
      {!compact && <p className="mt-2 text-[14px] leading-snug text-[#3a3a3c]">Wood-fired Neapolitan pizza, made to order since 1998. Free delivery on orders over €25.</p>}
    </div>
  );
}

function BasketBar({ count, total, style }: { count: number; total: number; style: CSSProperties }) {
  return (
    <div className="absolute flex h-[52px] items-center justify-between rounded-2xl px-4 text-[16px] font-semibold text-white shadow-lg" style={{ background: ORANGE, ...style }}>
      <span className="flex items-center gap-2">
        <ShoppingBag size={18} /> View basket · {count}
      </span>
      <span>{euro(total)}</span>
    </div>
  );
}

interface AppProps {
  w: number;
  h: number;
  ins: Insets;
  respect: boolean;
  showSafe: boolean;
  statusBar: boolean;
  homeIndicator: boolean;
  os: 'ios' | 'android';
  basket: number[];
  onAdd: (i: number) => void;
}

function RestaurantApp({ w, h, ins, respect, showSafe, statusBar, homeIndicator, os, basket, onAdd }: AppProps) {
  const p = respect ? ins : zero;
  const L = layoutFor(w, h);
  const count = basket.length;
  const total = basket.reduce((s, i) => s + menu[i].price, 0);
  const nav = (
    <div className="flex h-[44px] shrink-0 items-center justify-between bg-white/95" style={{ paddingLeft: p.l + 8, paddingRight: p.r + 12 }}>
      <span className="flex items-center text-[17px]" style={{ color: ORANGE }}>
        <ChevronLeft size={26} /> Back
      </span>
      <span className="text-[17px] font-semibold">Luigi&apos;s</span>
      <Heart size={22} style={{ color: ORANGE }} />
    </div>
  );

  let body: ReactNode;
  if (L.kind === 'one') {
    body = (
      <>
        <div style={{ paddingLeft: p.l, paddingRight: p.r }}>
          <Hero height={Math.min(190, h * 0.22)} />
          <Info />
          <p className="px-4 pt-4 pb-2 text-[13px] font-semibold tracking-wide text-[#6b6b70] uppercase">Pizza</p>
          {menu.map((m, i) => (
            <MenuRow key={m.name} m={m} onAdd={() => onAdd(i)} />
          ))}
        </div>
        <BasketBar count={count} total={total} style={{ left: p.l + 16, right: p.r + 16, bottom: p.b + 8 }} />
      </>
    );
  } else if (L.kind === 'two') {
    body = (
      <div className="absolute inset-x-0 bottom-0 flex" style={{ top: p.t + 44, paddingLeft: p.l, paddingRight: p.r }}>
        <div className="flex w-[38%] min-w-0 flex-col border-r border-[#e5e5ea] bg-white">
          <Hero height={Math.min(140, (h - p.t) * 0.35)} />
          <Info compact />
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {menu.map((m, i) => (
            <MenuRow key={m.name} m={m} onAdd={() => onAdd(i)} />
          ))}
          <BasketBar count={count} total={total} style={{ left: 16, right: 16, bottom: p.b + 8 }} />
        </div>
      </div>
    );
  } else {
    const cols = L.kind === 'grid2' ? 2 : 3;
    body = (
      <div className="absolute inset-x-0 bottom-0 flex flex-col" style={{ top: p.t + 44, paddingLeft: p.l, paddingRight: p.r }}>
        <div className="flex shrink-0 items-stretch bg-white">
          <div className="w-[44%]">
            <Hero height={170} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <Info />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="w-[180px] shrink-0 space-y-1 border-r border-[#e5e5ea] bg-white p-3 text-[15px]">
            {['Pizza', 'Calzone', 'Desserts', 'Drinks'].map((c, i) => (
              <p key={c} className="rounded-lg px-3 py-2" style={i === 0 ? { background: '#fff1e8', color: ORANGE, fontWeight: 600 } : undefined}>
                {c}
              </p>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {menu.map((m, i) => (
                <MenuCard key={m.name} m={m} onAdd={() => onAdd(i)} />
              ))}
            </div>
            <BasketBar count={count} total={total} style={{ right: 16, width: 300, bottom: p.b + 12 }} />
          </div>
        </div>
      </div>
    );
  }

  const time = (
    <span className="text-[15px] font-semibold" style={{ fontSize: os === 'android' ? 13 : 15 }}>
      9:41
    </span>
  );

  return (
    <div className="absolute inset-0 overflow-hidden text-black" style={{ width: w, height: h, background: '#f2f2f7' }}>
      {L.kind === 'one' ? (
        <div className="absolute inset-0 overflow-hidden">
          <div style={{ height: p.t }} className="bg-white" />
          {nav}
          {body}
        </div>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 bg-white" style={{ paddingTop: p.t }}>
            {nav}
          </div>
          {body}
        </>
      )}

      {/* System UI drawn by the OS on top of the app */}
      {statusBar && ins.t > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: Math.min(ins.t, 54), paddingLeft: os === 'ios' && ins.t > 40 ? 52 : 18, paddingRight: os === 'ios' && ins.t > 40 ? 48 : 18 }}>
          {time}
          <span className="flex items-center gap-1.5">
            <span className="flex items-end gap-[2px]">
              {[5, 7, 9, 11].map((x) => (
                <span key={x} className="w-[3px] rounded-[1px] bg-black" style={{ height: x }} />
              ))}
            </span>
            <span className="h-[12px] w-[24px] rounded-[4px] border border-black p-[1.5px]">
              <span className="block h-full w-3/4 rounded-[2px] bg-black" />
            </span>
          </span>
        </div>
      )}
      {homeIndicator && <div className="pointer-events-none absolute left-1/2 h-[5px] -translate-x-1/2 rounded-full bg-black" style={{ bottom: 8, width: os === 'ios' ? 140 : 110 }} />}

      {showSafe && (
        <div className="pointer-events-none absolute inset-0">
          {(['t', 'b', 'l', 'r'] as const).map((k) => {
            const v = ins[k];
            if (!v) return null;
            const st: CSSProperties =
              k === 't' ? { top: 0, left: 0, right: 0, height: v } : k === 'b' ? { bottom: 0, left: 0, right: 0, height: v } : k === 'l' ? { top: 0, bottom: 0, left: 0, width: v } : { top: 0, bottom: 0, right: 0, width: v };
            return (
              <div key={k} className="absolute grid place-items-center" style={{ ...st, background: 'repeating-linear-gradient(45deg, rgba(255,59,48,.35) 0 6px, rgba(255,59,48,.15) 6px 12px)' }}>
                <span className="rounded bg-[#ff3b30] px-1.5 text-[13px] font-bold text-white">{v}</span>
              </div>
            );
          })}
          <div className="absolute border-2 border-dashed border-[#34c759]" style={{ top: ins.t, bottom: ins.b, left: ins.l, right: ins.r }} />
        </div>
      )}
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const next = Math.floor(el.clientWidth);
      setW((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export default function DeviceSimulator() {
  const [device, setDevice] = useState<DeviceId>('pro');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [folded, setFolded] = useState(false);
  const [showSafe, setShowSafe] = useState(true);
  const [respect, setRespect] = useState(true);
  const [lock, setLock] = useState(false);
  const [split, setSplit] = useState(false);
  const [basket, setBasket] = useState<number[]>([0]);
  const [box, availW] = useWidth<HTMLDivElement>();

  const spec = device === 'fold' ? (folded ? specs.foldClosed : specs.foldOpen) : specs[device];
  const land = orientation === 'landscape';
  const appOrientation: Orientation = lock ? 'portrait' : orientation;
  const rotatedApp = appOrientation !== orientation;
  const canSplit = !!spec.splittable && !rotatedApp;
  const splitOn = split && canSplit;

  // Device screen size in the current physical orientation
  const SW = land ? spec.h : spec.w;
  const SH = land ? spec.w : spec.h;
  const [bx, by] = land ? [spec.bezel[1], spec.bezel[0]] : spec.bezel;
  const maxH = availW < 500 ? 380 : 460;
  const s = Math.min((availW - 8) / (SW + 2 * bx), maxH / (SH + 2 * by));

  // App size and insets (in app orientation)
  const AW0 = appOrientation === 'landscape' ? spec.h : spec.w;
  const AH = appOrientation === 'landscape' ? spec.w : spec.h;
  const fullIns = spec.insets[appOrientation];
  const AW = splitOn ? Math.floor((AW0 - 10) / 2) : AW0;
  const appIns = splitOn ? { ...fullIns, r: 0 } : fullIns;
  const L = layoutFor(AW, AH);

  // Cutout in current device coordinates (device rotated counter-clockwise for landscape)
  const cut = spec.cutout ? (land ? { cx: spec.cutout.cy, cy: spec.w - spec.cutout.cx, w: spec.cutout.h, h: spec.cutout.w } : spec.cutout) : null;

  const appTransform = rotatedApp ? `translate(0px, ${SH * s}px) rotate(-90deg) scale(${s})` : `scale(${s})`;

  const notes: string[] = [];
  if (rotatedApp) notes.push('Rotation lock is on: the phone turned, but the app stays in portrait. Nothing should re-layout, restart or lose data.');
  if (!respect) notes.push('The app ignores the safe area: content slides under the status bar, the camera cut-out and the home indicator. Look at the Back button and the basket bar.');
  if (device === 'pro' && land && !rotatedApp && respect) notes.push('In landscape the Dynamic Island sits on the left, so iOS adds 62 pt of safe area on BOTH sides (and 21 pt at the bottom for the home indicator).');
  if (device === 'se' && land && !rotatedApp) notes.push('iPhone SE has no notch and no home indicator, and iOS hides the status bar in landscape: zero insets. Small screen, very little height.');
  if (splitOn) notes.push(`Split screen: the app gets only ${AW} ${spec.unit} of width, so even on a big screen it must switch to its compact phone layout.`);
  if (device === 'fold') notes.push(folded ? 'Folded: a tall, narrow cover screen. Unfold while the app is open: the basket must survive and the layout must switch.' : 'Unfolded: an almost square screen with a hinge across the middle. Avoid putting buttons or text right on the fold.');
  if (L.height === 'compact' && !rotatedApp) notes.push('Very little height: there is no room for a big hero image plus a list, so the layout splits into two panes.');
  if (basket.length > 1) notes.push(`Your basket has ${basket.length} items. Rotate, switch devices or fold: a well-built app keeps it.`);

  const deviceButtons: { id: DeviceId; label: string; icon: typeof Smartphone }[] = [
    { id: 'se', label: 'Small phone', icon: Smartphone },
    { id: 'pro', label: 'Large phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'fold', label: 'Foldable', icon: BookOpen },
  ];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">📱 Device simulator</p>
        <p className="text-sm text-muted">Rotate, switch devices and fold. The sample app is rendered at the real logical screen size of each device, then scaled down to fit.</p>
      </div>

      <div className="space-y-3 border-b border-line p-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1 sm:grid-cols-4" role="radiogroup" aria-label="Device">
          {deviceButtons.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={device === d.id}
              onClick={() => {
                setDevice(d.id);
                if (d.id !== 'fold') setFolded(false);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium ${device === d.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              <d.icon size={d.id === 'se' ? 14 : 16} /> {d.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-subtle">
            <RotateCw size={15} /> Rotate ({orientation})
          </button>
          {device === 'fold' && (
            <button type="button" onClick={() => setFolded((f) => !f)} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-subtle">
              <BookOpen size={15} /> {folded ? 'Unfold' : 'Fold'}
            </button>
          )}
          {[
            { label: 'Show safe areas', v: showSafe, set: setShowSafe, disabled: false },
            { label: 'App respects safe areas', v: respect, set: setRespect, disabled: false },
            { label: 'Rotation lock', v: lock, set: setLock, disabled: false },
            { label: 'Split screen', v: split, set: setSplit, disabled: !canSplit },
          ].map((t) => (
            <label key={t.label} className={`flex items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1.5 text-sm ${t.disabled ? 'opacity-50' : ''}`}>
              <input type="checkbox" checked={t.v} disabled={t.disabled} onChange={(e) => t.set(e.target.checked)} className="size-4 accent-[var(--brand)]" />
              {t.label === 'Rotation lock' && <Lock size={13} className="text-muted" />}
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div ref={box} className="grid place-items-center p-4" style={{ background: 'repeating-linear-gradient(0deg, transparent 0 23px, rgba(127,127,127,.08) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(127,127,127,.08) 23px 24px)' }}>
        <div
          className="relative bg-[#0c0d12] shadow-[0_24px_48px_-16px_rgba(16,18,35,.45)] transition-all duration-300"
          style={{ width: (SW + 2 * bx) * s, height: (SH + 2 * by) * s, borderRadius: (spec.radius + Math.min(bx, by)) * s + 6, padding: `${by * s}px ${bx * s}px` }}
        >
          {spec.homeButton && (
            <span
              className="absolute rounded-full border-2 border-[#3a3a40]"
              style={{ width: 52 * s, height: 52 * s, ...(land ? { right: (bx * s - 52 * s) / 2, top: '50%', marginTop: -26 * s } : { bottom: (by * s - 52 * s) / 2, left: '50%', marginLeft: -26 * s }) }}
            />
          )}
          <div className="relative size-full overflow-hidden" style={{ borderRadius: spec.radius * s, background: '#f2f2f7' }}>
            <div className="absolute top-0 left-0 origin-top-left" style={{ width: AW0, height: AH, transform: appTransform }}>
              <div className="absolute top-0 left-0" style={{ width: AW, height: AH }}>
                <RestaurantApp
                  w={AW}
                  h={AH}
                  ins={appIns}
                  respect={respect}
                  showSafe={showSafe}
                  statusBar={spec.statusBar[appOrientation]}
                  homeIndicator={spec.homeIndicator}
                  os={spec.os}
                  basket={basket}
                  onAdd={(i) => setBasket((b) => [...b, i])}
                />
              </div>
              {splitOn && (
                <>
                  <div className="absolute top-0 grid place-items-center bg-black" style={{ left: AW, width: 10, height: AH }}>
                    <span className="h-16 w-[4px] rounded-full bg-white/60" />
                  </div>
                  <div className="absolute top-0 grid place-items-center bg-[#fffbe6] text-[#8a6d00]" style={{ left: AW + 10, width: AW0 - AW - 10, height: AH }}>
                    <span className="text-center text-[22px] font-semibold">
                      Notes
                      <span className="block text-[15px] font-normal">(another app)</span>
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Physical hardware: camera cut-out and hinge stay put when the device rotates */}
            {cut && (
              <div
                className="pointer-events-none absolute rounded-full bg-black"
                style={{ left: (cut.cx - cut.w / 2) * s, top: (cut.cy - cut.h / 2) * s, width: cut.w * s, height: cut.h * s }}
              />
            )}
            {spec.hinge && (
              <div
                className="pointer-events-none absolute"
                style={land ? { left: 0, right: 0, top: '50%', height: 0, borderTop: '1.5px dashed rgba(0,0,0,.35)' } : { top: 0, bottom: 0, left: '50%', width: 0, borderLeft: '1.5px dashed rgba(0,0,0,.35)' }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-line p-4 sm:grid-cols-2">
        <dl className="min-w-0 space-y-1.5 text-sm">
          {[
            ['Device', spec.model],
            ['Screen', `${SW} × ${SH} ${spec.unit}${spec.approx ? ' (approx.)' : ''}`],
            ['Pixels', `${land ? spec.pxH : spec.pxW} × ${land ? spec.pxW : spec.pxH} px (${spec.unit === 'pt' ? `@${spec.density}x` : `density ${spec.density}`})`],
            ['App window', `${AW} × ${AH} ${spec.unit}${rotatedApp ? ' (still portrait)' : ''}`],
            ['Safe-area insets', `top ${appIns.t} · bottom ${appIns.b} · left ${appIns.l} · right ${appIns.r}`],
            ['Layout', L.text],
            ["Shown at", `${Math.round(s * 100)}% (1 ${spec.unit} drawn as 1 CSS px)`],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-28 shrink-0 text-faint">{k}</dt>
              <dd className="min-w-0 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="min-w-0 rounded-2xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <InfoIcon size={13} /> What to notice
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted">
            {notes.length === 0 && <li>Tap a “+” in the app to add pizzas, then rotate. Try the large phone in landscape, the tablet in split screen, and folding the foldable.</li>}
            {notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
          {basket.length > 1 && (
            <button type="button" onClick={() => setBasket([0])} className="mt-2 text-xs font-medium text-muted underline hover:text-fg">
              Empty basket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
