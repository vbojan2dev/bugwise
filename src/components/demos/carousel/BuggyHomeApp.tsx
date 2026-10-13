import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Backpack, Coffee, Footprints, Heart, RotateCcw, Search, Shirt, ShoppingBag, Sun, Tent, Volume2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { PROMOS, SlideArt } from './SlideArt';

/*
 * A deliberately broken shopping app home screen with a hero carousel. Bugs (don't spoil them!):
 *  1. Autoplay (every 3 s) can't be paused: no pause button, it doesn't stop on hover, focus or while reading.
 *  2. Dots are 8 px; the developer tried to enlarge the hit area but anchored it on the wrong side,
 *     so each dot's invisible hit box covers its LEFT neighbor: tapping a dot opens the next slide.
 *  3. Vertical swipes that start on the carousel don't scroll the page (touch-action: none, and the
 *     pointerdown is swallowed, so mouse "finger" dragging is blocked too).
 *  4. The slide counter (and the slides' aria-label) always say 1 of 5.
 *  5. Looping: after the last slide it animates backwards through every slide (visible rewind) instead of continuing.
 *  6. All five hero images are downloaded at full 2400 px resolution on launch (≈12.4 MB), none lazy-loaded.
 */

const N = PROMOS.length;
const HERO_MB = [2.6, 2.4, 2.5, 2.3, 2.6];
const PRODUCTS = [
  { name: 'Trail runner 2', price: '€129', icon: Footprints, bg: '#e0f2fe' },
  { name: 'Ridge day pack', price: '€79', icon: Backpack, bg: '#dcfce7' },
  { name: 'Dome tent 2P', price: '€189', icon: Tent, bg: '#fef3c7' },
  { name: 'Sun hat', price: '€24', icon: Sun, bg: '#ffe4e6' },
  { name: 'Merino tee', price: '€49', icon: Shirt, bg: '#ede9fe' },
  { name: 'Camp mug', price: '€12', icon: Coffee, bg: '#f1f5f9' },
];

function BuggyCarousel({ onSlide }: { onSlide: (i: number) => void }) {
  const [index, setIndex] = useState(0);
  const [shown] = useState(1); // BUG 4: captured once, never updated
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);

  useEffect(() => onSlide(index), [index, onSlide]);

  // BUG 1: always running, no pause on hover/focus, no pause button
  useEffect(() => {
    const t = window.setInterval(() => setIndex((i) => (i + 1 === N ? 0 : i + 1)), 3000); // BUG 5: wraps to 0 by sliding back
    return () => clearInterval(t);
  }, []);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // BUG 3: swallows the gesture, the page never sees it
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, axis: null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    if (!d.axis && (Math.abs(mx) > 8 || Math.abs(my) > 8)) d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (d.axis === 'x') setDx(mx);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.axis === 'x') {
      if (dx < -40) setIndex((i) => (i + 1) % N);
      if (dx > 40) setIndex((i) => (i - 1 + N) % N);
    }
    setDx(0);
  };

  return (
    <div className="relative" aria-label="Offers">
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-xl select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="flex h-full" style={{ transform: `translateX(calc(${-index * 100}% + ${dx}px))`, transition: dx ? 'none' : 'transform 500ms ease' }}>
          {PROMOS.map((p, i) => (
            <div key={i} className="h-full w-full shrink-0" aria-label={`Slide ${shown} of ${N}`}>
              <SlideArt promo={p} id={`bug-${i}`} />
            </div>
          ))}
        </div>
        <span className="absolute top-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {shown} / {N}
        </span>
      </div>
      {/* BUG 2: 8 px dots; each 28 px hit box is anchored on the right and overlaps the previous dot */}
      <div className="mt-1.5 flex justify-center">
        <div className="flex">
          {PROMOS.map((p, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className="relative flex h-5 w-7 shrink-0 items-center justify-end"
              style={{ marginLeft: i === 0 ? 0 : -12 }}
            >
              <span className="block size-2 rounded-full" style={{ background: i === index ? '#ea580c' : '#d1d5db' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BuggyHomeApp() {
  const [run, setRun] = useState(0);
  const [slide, setSlide] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const screen = useRef<HTMLDivElement>(null);
  const pan = useRef<{ y: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // BUG 6: every hero image requested at once, full size, on launch
  useEffect(() => {
    setLog(PROMOS.map((_, i) => `GET /img/home/hero-${i + 1}.jpg 2400×1350 · ${HERO_MB[i]} MB`));
  }, [run]);

  /* "Finger" scrolling with the mouse, so desktop learners can feel touch scrolling. */
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !screen.current) return;
    pan.current = { y: e.clientY, top: screen.current.scrollTop, moved: false };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    if (!p || !screen.current) return;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.abs(dy) > 6) {
      p.moved = true;
      screen.current.setPointerCapture(e.pointerId);
    }
    if (p.moved) screen.current.scrollTop = p.top - dy;
  };
  const up = () => {
    if (pan.current?.moved) {
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
    }
    pan.current = null;
  };

  const total = HERO_MB.reduce((s, x) => s + x, 0);

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="absolute inset-0 flex flex-col bg-white text-[#111827]" style={{ colorScheme: 'light' }}>
          <div className="flex h-11 shrink-0 items-center justify-between px-4">
            <p className="text-[19px] font-extrabold tracking-tight text-[#ea580c]">ShopNow</p>
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
          <div
            key={run}
            ref={screen}
            className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-8 select-none"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          >
            <div className="mb-3 flex h-9 items-center gap-2 rounded-full bg-[#f3f4f6] px-3 text-[13px] text-black/45">
              <Search size={15} /> Search outdoor gear
            </div>
            <BuggyCarousel onSlide={setSlide} />
            <p className="mt-4 mb-2 text-[15px] font-bold">Categories</p>
            <div className="flex gap-2 overflow-hidden">
              {['Shoes', 'Tents', 'Bags', 'Jackets'].map((c) => (
                <span key={c} className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-[12px]">
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-4 mb-2 text-[15px] font-bold">Popular now</p>
            <ul className="grid grid-cols-2 gap-2">
              {PRODUCTS.map((p) => (
                <li key={p.name} className="overflow-hidden rounded-xl border border-black/10">
                  <span className="relative grid h-24 place-items-center" style={{ background: p.bg }}>
                    <p.icon size={36} strokeWidth={1.5} aria-hidden="true" />
                    <Heart size={14} className="absolute top-2 right-2 text-black/40" aria-hidden="true" />
                  </span>
                  <span className="block px-2 pt-1.5 text-[12px] font-medium">{p.name}</span>
                  <span className="block px-2 pb-2 text-[12px] text-black/55">{p.price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-[11px] text-black/40">You’ve reached the end · Help · Returns</p>
          </div>
        </div>
      </PhoneFrame>
      <p className="text-center text-xs text-muted">With a mouse, drag the screen up and down like a finger. On a phone, just swipe.</p>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Volume2 size={13} /> VoiceOver on the banner
          </p>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <p className="mt-1 text-sm">
          “{PROMOS[slide].title}. Slide 1 of {N}.”
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="flex justify-between gap-2 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network (app launch)</span>
          <span className="normal-case">
            {log.length} req · {total.toFixed(1)} MB
          </span>
        </p>
        <ul className="space-y-1 px-3 py-2">
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
