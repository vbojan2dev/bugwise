import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ShoppingBag, RotateCcw, Lock, X, Images, Bike } from 'lucide-react';

/*
 * A deliberately broken product screen that only misbehaves on some device profiles.
 * Bugs (don't spoil them for learners!):
 *  1. Short screens (iPhone SE): the "Add to order" button is cut off. The screen does not scroll.
 *  2. Large text (130%/200%): the product name block has a fixed height, so the name overlaps the description.
 *  3. Foldable unfolded / tablet: the hero photo is stretched (aspect ratio not kept).
 *  4. Low-RAM device (Moto E13, 2 GB): "See all photos" crashes the app.
 *  5. Xiaomi (HyperOS battery saver): after locking the phone, no order-status notification arrives
 *     and the status stays stale.
 */

interface Profile {
  id: string;
  name: string;
  os: 'ios' | 'android';
  w: number;
  h: number;
  ram: number;
  oem: string;
}

const profiles: Profile[] = [
  { id: 'ip16', name: 'iPhone 16 · 393×852 pt', os: 'ios', w: 393, h: 852, ram: 8, oem: 'Apple' },
  { id: 'se', name: 'iPhone SE (3rd gen) · 375×667 pt', os: 'ios', w: 375, h: 667, ram: 4, oem: 'Apple' },
  { id: 'pixel', name: 'Pixel 8 · 412×915 dp', os: 'android', w: 412, h: 915, ram: 8, oem: 'Google' },
  { id: 'moto', name: 'Moto E13 · 360×800 dp · 2 GB RAM', os: 'android', w: 360, h: 800, ram: 2, oem: 'Motorola' },
  { id: 'redmi', name: 'Xiaomi Redmi Note 13 · HyperOS', os: 'android', w: 393, h: 873, ram: 6, oem: 'Xiaomi' },
  { id: 'fold', name: 'Galaxy Z Fold · unfolded · ≈673×841 dp', os: 'android', w: 673, h: 841, ram: 12, oem: 'Samsung' },
  { id: 'ipad', name: 'iPad (10th gen) · 820×1180 pt', os: 'ios', w: 820, h: 1180, ram: 4, oem: 'Apple' },
];

const sizes = [
  { id: 'S', price: 9.9 },
  { id: 'M', price: 13.9 },
  { id: 'L', price: 18.9 },
];
const extrasList = [
  { id: 'basil', label: 'Extra basil', price: 0.5 },
  { id: 'cheese', label: 'Extra mozzarella', price: 1.5 },
  { id: 'chili', label: 'Chili oil', price: 0.8 },
];
const stages = ['Preparing', 'On the way', 'Arriving in 2 min', 'Delivered'];
const stageNotes = ['', 'Your rider picked up your order 🛵', 'Your rider is 2 minutes away', 'Delivered. Enjoy your meal!'];

const euro = (n: number) => `€${n.toFixed(2)}`;

export function BuggyLayoutLab() {
  const [pid, setPid] = useState('ip16');
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState('L');
  const [extras, setExtras] = useState<string[]>([]);
  const [stage, setStage] = useState(0);
  const [updated, setUpdated] = useState('just now');
  const [locked, setLocked] = useState(false);
  const [lockNote, setLockNote] = useState('');
  const [gallery, setGallery] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const p = profiles.find((x) => x.id === pid)!;
  const ios = p.os === 'ios';
  const accent = ios ? '#007aff' : '#6750a4';
  const fs = (n: number) => n * scale;

  const resetApp = () => {
    window.clearTimeout(timer.current);
    setSize('L');
    setExtras([]);
    setStage(0);
    setUpdated('just now');
    setLocked(false);
    setLockNote('');
    setGallery(false);
    setCrashed(false);
    setToast('');
  };

  const changeDevice = (id: string) => {
    setPid(id);
    resetApp();
  };

  const total = (sizes.find((s) => s.id === size)?.price ?? 0) + extras.reduce((n, id) => n + (extrasList.find((e) => e.id === id)?.price ?? 0), 0);

  const showToast = (t: string) => {
    setToast(t);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), 2200);
  };

  const lockPhone = () => {
    setGallery(false);
    setToast('');
    if (p.oem === 'Xiaomi') {
      // BUG 5: the battery saver froze the app in the background, so no update and no notification.
      setLockNote('');
      setUpdated('10 min ago');
    } else {
      const next = Math.min(stage + 1, stages.length - 1);
      setStage(next);
      setLockNote(next > stage ? stageNotes[next] : '');
      setUpdated('just now');
    }
    setLocked(true);
  };

  const openPhotos = () => {
    if (p.ram <= 2) setCrashed(true); // BUG 4: full-size images decoded at once, out of memory on 2 GB devices
    else setGallery(true);
  };

  const s = Math.min(300 / p.w, 540 / p.h);
  const sub = ios ? '#8e8e93' : '#49454f';
  const card = ios ? '#f2f2f7' : '#f3edf7';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <div className="rounded-[26px] bg-[#0c0d12] p-[8px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]">
        <div className="relative overflow-hidden rounded-[18px] bg-white" style={{ width: p.w * s, height: p.h * s }}>
          <div
            className="absolute top-0 left-0 overflow-hidden bg-white text-black"
            style={{
              width: p.w,
              height: p.h,
              transform: `scale(${s})`,
              transformOrigin: 'top left',
              fontFamily: ios ? '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' : 'Roboto, "Noto Sans", system-ui, sans-serif',
            }}
          >
            {/* status bar */}
            <div className="flex h-[30px] items-center justify-between px-5 text-[13px] font-semibold">
              <span>9:41</span>
              <span className="h-[11px] w-[22px] rounded-[3px] border border-black p-[1px]">
                <span className="block h-full w-3/4 rounded-[1px] bg-black" />
              </span>
            </div>

            {/* BUG 1: the content area clips instead of scrolling */}
            <div className="overflow-hidden" style={{ height: p.h - 30 }}>
              <div className="flex h-[46px] items-center px-2">
                <ChevronLeft size={26} style={{ color: accent }} />
                <span className="flex-1 text-center font-semibold" style={{ fontSize: fs(16) }}>
                  Pizza Place
                </span>
                <ShoppingBag size={22} style={{ color: accent }} className="mr-2" />
              </div>

              <div className="mx-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: card, fontSize: fs(13) }}>
                <Bike size={16} style={{ color: accent }} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  Order #4821 · <strong>{stages[stage]}</strong>
                </span>
                <span style={{ color: sub, fontSize: fs(11) }}>{updated}</span>
              </div>

              {/* BUG 3: fixed height + preserveAspectRatio="none" stretches the photo on wide screens */}
              <svg className="mt-3 block w-full" height={170} viewBox="0 0 400 170" preserveAspectRatio="none" role="img" aria-label="Photo of a margherita pizza">
                <rect width="400" height="170" fill="#7c4a2a" />
                <rect width="400" height="170" fill="url(#wood)" opacity=".25" />
                <defs>
                  <pattern id="wood" width="40" height="12" patternUnits="userSpaceOnUse">
                    <path d="M0 6 Q10 2 20 6 T40 6" stroke="#3b1f0f" fill="none" />
                  </pattern>
                </defs>
                <circle cx="200" cy="85" r="72" fill="#e2a74f" />
                <circle cx="200" cy="85" r="62" fill="#d1402f" />
                {[
                  [175, 62],
                  [222, 70],
                  [190, 108],
                  [232, 104],
                  [205, 84],
                ].map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="12" fill="#fdf6e3" />
                ))}
                {[
                  [184, 80],
                  [214, 98],
                  [226, 60],
                ].map(([x, y]) => (
                  <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="4" fill="#2f7d32" />
                ))}
              </svg>

              <div className="px-4 pt-3">
                {/* BUG 2: the name block has a fixed height of two lines at 100% text; bigger text spills over the description */}
                <div className="relative h-[52px]">
                  <p className="pr-[72px] leading-tight font-bold" style={{ fontSize: fs(20) }}>
                    Margherita pizza, wood-fired with extra basil
                  </p>
                  <p className="absolute top-0 right-0 font-bold" style={{ fontSize: fs(17), color: accent }}>
                    {euro(sizes.find((x) => x.id === size)!.price)}
                  </p>
                </div>
                <p className="mt-1.5 leading-snug" style={{ fontSize: fs(13), color: sub }}>
                  San Marzano tomatoes, fior di latte, fresh basil and olive oil.
                </p>

                <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Size">
                  {sizes.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      role="radio"
                      aria-checked={size === x.id}
                      onClick={() => setSize(x.id)}
                      className="min-h-[40px] flex-1 rounded-full border font-semibold"
                      style={{ fontSize: fs(14), borderColor: size === x.id ? accent : '#d1d1d6', background: size === x.id ? accent : 'transparent', color: size === x.id ? '#fff' : '#000' }}
                    >
                      {x.id}
                    </button>
                  ))}
                </div>

                <p className="mt-3 font-semibold" style={{ fontSize: fs(14) }}>
                  Extras
                </p>
                {extrasList.map((e) => {
                  const on = extras.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setExtras((prev) => (prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id]))}
                      className="flex min-h-[44px] w-full items-center gap-3 border-b border-[#e5e5ea] text-left"
                      style={{ fontSize: fs(14) }}
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 text-[12px] text-white" style={{ borderColor: on ? accent : '#c7c7cc', background: on ? accent : 'transparent' }}>
                        {on ? '✓' : ''}
                      </span>
                      <span className="flex-1">{e.label}</span>
                      <span style={{ color: sub }}>+{euro(e.price)}</span>
                    </button>
                  );
                })}

                <button type="button" onClick={openPhotos} className="mt-2 flex min-h-[40px] items-center gap-1.5 font-medium" style={{ fontSize: fs(14), color: accent }}>
                  <Images size={16} /> See all photos (24)
                </button>

                <button
                  type="button"
                  onClick={() => showToast(`Added to order · ${euro(total)}`)}
                  className="mt-3 mb-6 block w-full rounded-full py-3 font-semibold text-white"
                  style={{ fontSize: fs(16), background: accent }}
                >
                  Add to order · {euro(total)}
                </button>
              </div>
            </div>

            {toast && (
              <div role="status" className="absolute inset-x-4 bottom-6 z-20 rounded-xl bg-[#1c1c1e]/90 px-3 py-2.5 text-center text-[13px] text-white">
                {toast}
              </div>
            )}

            {gallery && (
              <div className="absolute inset-0 z-30 flex flex-col bg-black text-white">
                <div className="flex h-[76px] items-end justify-between px-4 pb-2">
                  <span className="text-[16px] font-semibold">Photos</span>
                  <button type="button" aria-label="Close photos" onClick={() => setGallery(false)} className="grid size-10 place-items-center rounded-full bg-white/15">
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="aspect-square" style={{ background: `hsl(${(i * 23) % 40 + 10} 60% ${35 + (i % 4) * 8}%)` }} />
                  ))}
                </div>
              </div>
            )}

            {crashed && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-black/40 px-8">
                <div role="alertdialog" aria-label="FoodNow keeps stopping" className="w-full max-w-[290px] rounded-[28px] bg-[#ece6f0] p-6 text-[#1d1b20]">
                  <p className="text-[20px]">FoodNow keeps stopping</p>
                  <div className="mt-5 space-y-3 text-[15px] text-[#1d1b20]">
                    <button type="button" onClick={resetApp} className="block">
                      Close app
                    </button>
                    <button type="button" onClick={resetApp} className="block">
                      App info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {locked && (
              <div className="absolute inset-0 z-40 flex flex-col items-center bg-[linear-gradient(160deg,#312e81,#0f172a)] px-5 pt-16 text-white">
                <Lock size={18} className="opacity-80" />
                <p className="mt-2 text-[56px] leading-none font-light">9:51</p>
                <p className="mt-1 text-[14px] opacity-80">10 minutes later</p>
                {lockNote ? (
                  <div className="mt-8 w-full max-w-[340px] rounded-2xl bg-white/20 px-4 py-3 text-left backdrop-blur">
                    <p className="text-[12px] font-semibold opacity-80">FOODNOW · now</p>
                    <p className="text-[15px]">{lockNote}</p>
                  </div>
                ) : (
                  <p className="mt-8 text-[13px] opacity-60">No notifications</p>
                )}
                <button type="button" onClick={() => setLocked(false)} className="mt-auto mb-10 rounded-full bg-white/20 px-6 py-2.5 text-[15px] font-medium">
                  Unlock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device profile</p>
          <button type="button" onClick={resetApp} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <label className="mt-2 block">
          <span className="sr-only">Device</span>
          <select value={pid} onChange={(e) => changeDevice(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm text-fg">
            {profiles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Font size (system setting)</p>
        <div role="radiogroup" aria-label="Font size" className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-subtle p-1 text-sm font-medium">
          {[1, 1.3, 2].map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={scale === v}
              onClick={() => setScale(v)}
              className={`rounded-lg py-1.5 ${scale === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {Math.round(v * 100)}%
            </button>
          ))}
        </div>
        <button type="button" onClick={lockPhone} disabled={locked} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 text-sm font-medium text-fg hover:bg-[var(--color-line)] disabled:opacity-50">
          <Lock size={14} /> Lock phone for 10 minutes
        </button>
        <p className="mt-2 text-xs text-muted">
          {p.oem} · {p.ram} GB RAM · shown at {Math.round(s * 100)}% scale
        </p>
      </div>
    </div>
  );
}
