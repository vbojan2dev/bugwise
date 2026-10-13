import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Maximize2, Minimize2, Minus, Pause, Play, Plus, RotateCcw, RotateCw, Star, Wifi, Coffee, Waves, Car, Delete } from 'lucide-react';

/*
 * A deliberately broken hotel booking screen for the orientation lesson. Bugs (don't spoil them!):
 *  1. Form data (name, email) is lost after rotation: the screen is re-created and those fields were never saved.
 *  2. In landscape the photo gallery ignores the safe area: the "previous photo" arrow sits under the Dynamic Island
 *     (hidden and untappable).
 *  3. Video: rotating restarts it from 0:00, paused, and it doesn't go full screen in landscape.
 *  4. Landscape doesn't use the extra width: the description stretches into very long lines (~90 characters).
 *  5. Promo code dialog in landscape: centered on the full screen, so the keyboard hides the input and the buttons,
 *     and the dialog can't scroll.
 *  6. Scroll position resets to the top on rotation.
 * Things that correctly survive rotation: guests count, gallery photo, applied promo code, open dialog.
 */

type Orientation = 'portrait' | 'landscape';
const PW = 300;
const PH = 650;
const INSETS = {
  portrait: { t: 46, b: 26, l: 0, r: 0 },
  landscape: { t: 0, b: 16, l: 46, r: 46 },
};
const RADIUS = 42;
const KEYBOARD = { portrait: 216, landscape: 160 };
const PRICE = 189;
const VIDEO_LEN = 45;

const photos = [
  { label: 'Rooftop pool', bg: 'linear-gradient(160deg,#4fc3f7,#0277bd)' },
  { label: 'Deluxe room', bg: 'linear-gradient(160deg,#ffe0b2,#bf8040)' },
  { label: 'Terrace view', bg: 'linear-gradient(160deg,#ffcc80,#e65100)' },
  { label: 'Lobby', bg: 'linear-gradient(160deg,#c5e1a5,#558b2f)' },
  { label: 'Breakfast', bg: 'linear-gradient(160deg,#fff59d,#f9a825)' },
];

const blue = '#007aff';
const sub = 'rgba(60,60,67,.6)';
const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

interface Shared {
  guests: number;
  setGuests: (fn: (g: number) => number) => void;
  photo: number;
  setPhoto: (fn: (p: number) => number) => void;
  promoOpen: boolean;
  setPromoOpen: (v: boolean) => void;
  promoInput: string;
  setPromoInput: (fn: (v: string) => string) => void;
  discount: boolean;
  setDiscount: (v: boolean) => void;
  onBook: () => void;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(700);
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

/** Everything inside this component is re-created on rotation (like an Android Activity). */
function HotelScreen({ o, shared }: { o: Orientation; shared: Shared }) {
  const land = o === 'landscape';
  const ins = INSETS[o];
  const W = land ? PH : PW;
  const H = land ? PW : PH;

  // BUG 1: plain local state, not saved anywhere, so it is lost when the screen is re-created.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // BUG 3: video position lives here too, so rotation restarts it.
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [full, setFull] = useState(false);
  const [kb, setKb] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');
  const promoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((t) => {
        if (t + 1 >= VIDEO_LEN) {
          setPlaying(false);
          return VIDEO_LEN;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  const togglePlay = () => {
    if (!playing && time >= VIDEO_LEN) setTime(0);
    setPlaying((p) => !p);
  };

  const applyPromo = () => {
    const code = shared.promoInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      shared.setDiscount(true);
      setPromoMsg('');
      promoRef.current?.blur();
      shared.setPromoOpen(false);
    } else {
      setPromoMsg(code ? 'This code is not valid.' : 'Enter a code.');
    }
  };

  const price = shared.discount ? Math.round(PRICE * 0.9) : PRICE;
  const nights = 2;
  const pad = { paddingLeft: ins.l + 16, paddingRight: ins.r + 16 };
  const galleryH = land ? H - 44 : 190;
  const p = photos[shared.photo];

  const press = (ch: string) => {
    if (ch === 'del') shared.setPromoInput((v) => v.slice(0, -1));
    else if (ch === 'done') promoRef.current?.blur();
    else shared.setPromoInput((v) => (v + ch).slice(0, 16));
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-white text-black" style={{ width: W, height: H }}>
      {/* Status bar (iOS hides it in landscape) */}
      {!land && (
        <div className="flex items-center justify-between px-7 text-[13px] font-semibold" style={{ height: ins.t }}>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <Wifi size={13} />
            <span className="h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-current" />
            </span>
          </span>
        </div>
      )}
      {/* Navigation bar (correctly inset) */}
      <div className="flex h-[44px] items-center justify-between border-b border-[#e5e5ea] bg-white" style={{ paddingLeft: ins.l + 6, paddingRight: ins.r + 14 }}>
        <span className="flex items-center text-[15px]" style={{ color: blue }}>
          <ChevronLeft size={22} /> Hotels
        </span>
        <span className="text-[15px] font-semibold">Casa Azul</span>
        <Heart size={19} style={{ color: blue }} />
      </div>

      {/* BUG 6: the scroll container is re-created on rotation, so it starts at the top again */}
      <div className="absolute inset-x-0 overflow-y-auto overscroll-contain" style={{ top: (land ? 0 : ins.t) + 44, bottom: 0, paddingBottom: ins.b + 70 }}>
        {/* Gallery. BUG 2: in landscape it is full-bleed and its arrows ignore the left/right safe area. */}
        <div className="relative" style={{ height: galleryH, background: p.bg, margin: land ? 0 : '12px 16px 0', borderRadius: land ? 0 : 14 }}>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => shared.setPhoto((i) => (i + photos.length - 1) % photos.length)}
            className="absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow"
            style={{ left: 8 }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => shared.setPhoto((i) => (i + 1) % photos.length)}
            className="absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow"
            style={{ right: 8 }}
          >
            <ChevronRight size={18} />
          </button>
          <span className="absolute bottom-2.5 left-3 text-[13px] font-semibold text-white drop-shadow">{p.label}</span>
          <span className="absolute right-3 bottom-2.5 rounded-full bg-black/45 px-2 text-[11px] font-medium text-white">
            {shared.photo + 1} / {photos.length}
          </span>
        </div>

        <div style={pad} className="pt-3">
          <p className="text-[20px] leading-tight font-bold">Casa Azul Boutique Hotel</p>
          <p className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: sub }}>
            <Star size={12} className="fill-[#ffb300] text-[#ffb300]" /> 4.8 (1,204) · Ribeira, Porto
          </p>
          {/* BUG 4: no max width in landscape, so lines get very long */}
          <p className="mt-2 text-[13px] leading-relaxed text-[#3a3a3c]">
            A restored 19th-century townhouse a short walk from the river, with blue-tiled walls, a rooftop pool and views over the old town. Rooms have air conditioning, rain showers and blackout curtains. Breakfast with fresh pastéis de nata is served on the terrace every morning from 7:00 to 10:30.
          </p>

          <p className="mt-4 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            Video tour
          </p>
          <div className="relative mt-1.5 overflow-hidden rounded-xl bg-[#111]" style={{ width: Math.min(268, W - ins.l - ins.r - 32), aspectRatio: '16 / 9' }}>
            <div className="absolute inset-0 opacity-80" style={{ background: photos[(Math.floor(time / 9) + 0) % photos.length].bg }} />
            <button type="button" aria-label={playing ? 'Pause video' : 'Play video'} onClick={togglePlay} className="absolute inset-0 grid place-items-center">
              <span className="grid size-10 place-items-center rounded-full bg-black/55 text-white">{playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}</span>
            </button>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-[10px] text-white">
              <span className="tabular-nums">{fmt(time)}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <span className="block h-full bg-white" style={{ width: `${(time / VIDEO_LEN) * 100}%` }} />
              </span>
              <span className="tabular-nums">{fmt(VIDEO_LEN)}</span>
              <button type="button" aria-label="Full screen" onClick={() => setFull(true)} className="p-0.5">
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          <p className="mt-4 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            Your stay
          </p>
          <div className="mt-1.5 rounded-xl bg-[#f2f2f7] px-3 py-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span>Oct 24 – Oct 26 · {nights} nights</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Guests</span>
              <span className="flex items-center gap-2">
                <button type="button" aria-label="Fewer guests" onClick={() => shared.setGuests((g) => Math.max(1, g - 1))} className="grid size-7 place-items-center rounded-full bg-white shadow-sm">
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center font-semibold tabular-nums">{shared.guests}</span>
                <button type="button" aria-label="More guests" onClick={() => shared.setGuests((g) => Math.min(4, g + 1))} className="grid size-7 place-items-center rounded-full bg-white shadow-sm">
                  <Plus size={14} />
                </button>
              </span>
            </div>
          </div>

          <p className="mt-4 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            Your details
          </p>
          <div className="mt-1.5 space-y-2">
            <label className="block">
              <span className="text-[11px]" style={{ color: sub }}>
                Full name
              </span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className="block h-9 w-full rounded-lg border border-[#d1d1d6] bg-white px-2.5 text-[14px] outline-none focus:border-[#007aff]" placeholder="Anna Smith" />
            </label>
            <label className="block">
              <span className="text-[11px]" style={{ color: sub }}>
                Email
              </span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="off" className="block h-9 w-full rounded-lg border border-[#d1d1d6] bg-white px-2.5 text-[14px] outline-none focus:border-[#007aff]" placeholder="anna@example.com" />
            </label>
          </div>

          <button type="button" onClick={() => shared.setPromoOpen(true)} className="mt-3 text-[13px] font-medium" style={{ color: blue }}>
            {shared.discount ? '✓ WELCOME10 applied (−10%)' : 'Have a promo code?'}
          </button>

          <p className="mt-4 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            Amenities
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[12px]">
            {[
              [Wifi, 'Free Wi-Fi'],
              [Waves, 'Rooftop pool'],
              [Coffee, 'Breakfast'],
              [Car, 'Parking €15'],
            ].map(([I, t]) => {
              const Icon = I as typeof Wifi;
              return (
                <span key={t as string} className="flex items-center gap-1.5 rounded-lg bg-[#f2f2f7] px-2 py-1.5">
                  <Icon size={13} style={{ color: blue }} /> {t as string}
                </span>
              );
            })}
          </div>
          <p className="mt-4 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
            House rules
          </p>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: sub }}>
            Check-in from 15:00, check-out until 11:00. No parties. Free cancellation until 48 hours before arrival.
          </p>
        </div>
      </div>

      {/* Bottom booking bar (correctly inset) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#e5e5ea] bg-white/95 pt-2" style={{ paddingLeft: ins.l + 16, paddingRight: ins.r + 16, paddingBottom: ins.b + 6 }}>
        <span className="text-[13px]">
          <strong className="text-[16px]">€{price}</strong> / night
          <span className="block text-[11px]" style={{ color: sub }}>
            €{price * nights} total · {shared.guests} {shared.guests === 1 ? 'guest' : 'guests'}
          </span>
        </span>
        <button type="button" onClick={shared.onBook} className="rounded-xl px-4 py-2 text-[14px] font-semibold text-white" style={{ background: blue }}>
          Book now
        </button>
      </div>

      {/* Full-screen video (works when you tap the button) */}
      {full && (
        <div className="absolute inset-0 z-20 bg-black text-white">
          <div className="absolute inset-0 opacity-80" style={{ background: photos[Math.floor(time / 9) % photos.length].bg }} />
          <button type="button" aria-label={playing ? 'Pause video' : 'Play video'} onClick={togglePlay} className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-black/55">{playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}</span>
          </button>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent pt-6 text-[11px]" style={{ paddingLeft: ins.l + 12, paddingRight: ins.r + 12, paddingBottom: ins.b + 8 }}>
            <span className="tabular-nums">{fmt(time)}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white" style={{ width: `${(time / VIDEO_LEN) * 100}%` }} />
            </span>
            <span className="tabular-nums">{fmt(VIDEO_LEN)}</span>
            <button type="button" aria-label="Exit full screen" onClick={() => setFull(false)} className="p-1">
              <Minimize2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Promo code dialog. BUG 5: always centered on the full screen, ignores the keyboard, can't scroll. */}
      {shared.promoOpen && (
        <div className="absolute inset-0 z-30 bg-black/40">
          <div className="absolute left-1/2 flex w-[260px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-xl" style={{ top: '50%', height: 196 }}>
            <p className="text-[16px] font-semibold">Promo code</p>
            <p className="mt-1 text-[12px] leading-snug" style={{ color: sub }}>
              Enter your code to get a discount on this stay. Try <strong>WELCOME10</strong>.
            </p>
            <input
              ref={promoRef}
              value={shared.promoInput}
              onChange={(e) => shared.setPromoInput(() => e.target.value.slice(0, 16))}
              onFocus={() => setKb(true)}
              onBlur={() => setKb(false)}
              onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
              aria-label="Promo code"
              autoComplete="off"
              className="mt-2.5 h-9 w-full shrink-0 rounded-lg border border-[#d1d1d6] px-2.5 text-[14px] uppercase outline-none focus:border-[#007aff]"
              placeholder="CODE"
            />
            <p className="mt-1 h-4 text-[11px] text-[#ff3b30]">{promoMsg}</p>
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPromoMsg('');
                  shared.setPromoOpen(false);
                }}
                className="h-9 flex-1 rounded-lg bg-[#f2f2f7] text-[14px] font-medium"
                style={{ color: blue }}
              >
                Cancel
              </button>
              <button type="button" onClick={applyPromo} className="h-9 flex-1 rounded-lg text-[14px] font-semibold text-white" style={{ background: blue }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated on-screen keyboard */}
      {kb && (
        <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col justify-center gap-1.5 bg-[#d1d3d9] px-1 select-none" style={{ height: KEYBOARD[o], paddingLeft: ins.l + 4, paddingRight: ins.r + 4, paddingBottom: ins.b }} onPointerDown={(e) => e.preventDefault()}>
          {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, ri) => (
            <div key={row} className="flex justify-center gap-1">
              {[...row].map((k) => (
                <button key={k} type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => press(k)} className="h-8 max-w-9 min-w-0 flex-1 rounded-[5px] bg-white text-[13px] shadow-[0_1px_0_rgba(0,0,0,.3)]">
                  {k}
                </button>
              ))}
              {ri === 2 && (
                <button type="button" tabIndex={-1} aria-label="Delete" onMouseDown={(e) => e.preventDefault()} onClick={() => press('del')} className="grid h-8 w-10 place-items-center rounded-[5px] bg-[#adb1bb]">
                  <Delete size={14} />
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-1">
            {['1', '0'].map((k) => (
              <button key={k} type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => press(k)} className="h-8 w-9 rounded-[5px] bg-white text-[13px]">
                {k}
              </button>
            ))}
            <span className="h-8 flex-1 rounded-[5px] bg-white" />
            <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => press('done')} className="h-8 w-16 rounded-[5px] text-[13px] font-semibold text-white" style={{ background: blue }}>
              done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BuggyHotelApp() {
  const [o, setO] = useState<Orientation>('portrait');
  const [run, setRun] = useState(0);
  const [guests, setGuests] = useState(2);
  const [photo, setPhoto] = useState(0);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [discount, setDiscount] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const [box, avail] = useWidth<HTMLDivElement>();

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const land = o === 'landscape';
  const W = land ? PH : PW;
  const H = land ? PW : PH;
  const FW = W + 20;
  const FH = H + 20;
  const s = Math.min(1, avail / FW);

  const restart = () => {
    setO('portrait');
    setGuests(2);
    setPhoto(0);
    setPromoOpen(false);
    setPromoInput('');
    setDiscount(false);
    setToast(false);
    setRun((r) => r + 1);
  };

  const onBook = () => {
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(false), 2200);
  };

  const shared: Shared = { guests, setGuests, photo, setPhoto, promoOpen, setPromoOpen, promoInput, setPromoInput, discount, setDiscount, onBook };

  // Dynamic Island: top center in portrait, left center in landscape (phone turned counter-clockwise).
  const island = land ? { left: 11, top: H / 2 - 48, width: 28, height: 96 } : { left: W / 2 - 48, top: 11, width: 96, height: 28 };

  return (
    <div ref={box} className="orient-hunt flex w-full flex-col items-center gap-4">
      {/* Give this bug hunt the full width (stack the bug list below) so landscape fits. */}
      <style>{`.bughunt:has(.orient-hunt) > div.grid{grid-template-columns:minmax(0,1fr)!important}.bughunt:has(.orient-hunt) > div.grid > ol{border-left-width:0!important;border-top-width:1px!important}`}</style>
      <div style={{ width: FW * s, height: FH * s }} className="transition-[height] duration-300">
        <div className="origin-top-left bg-[#0c0d12] p-[10px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]" style={{ width: FW, height: FH, borderRadius: RADIUS + 8, transform: `scale(${s})` }}>
          <div className="relative size-full overflow-hidden bg-white" style={{ borderRadius: RADIUS }}>
            <HotelScreen key={`${run}-${o}`} o={o} shared={shared} />
            {/* The island is hardware: no pixels, no touch. */}
            <div className="absolute z-50 rounded-full bg-black" style={island} />
            <div className="pointer-events-none absolute left-1/2 z-50 h-[4px] w-[100px] -translate-x-1/2 rounded-full bg-black/80" style={{ bottom: 6 }} />
            {toast && (
              <div className="pointer-events-none absolute inset-x-0 z-50 flex justify-center" style={{ top: land ? 54 : 100 }}>
                <span className="rounded-full bg-black/80 px-3 py-1.5 text-[12px] text-white">Demo only: no booking was made</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setO((x) => (x === 'portrait' ? 'landscape' : 'portrait'))} className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-2 text-sm font-medium hover:text-fg">
            <RotateCw size={15} /> Rotate phone
          </button>
          <span className="text-sm text-muted">
            Now: <strong className="text-fg capitalize">{o}</strong>
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">Scroll with the mouse wheel or by swiping. Type in the fields, play the video, open the promo code dialog, then rotate.</p>
      </div>
    </div>
  );
}
