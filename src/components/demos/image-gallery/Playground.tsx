import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Play, RotateCcw, Triangle, Volume2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Lightbox } from './Lightbox';
import { PHOTOS, PhotoArt, formatKb, thumbKb, viewerKb } from './photos';

/*
 * Gallery lab: a correct gallery + viewer with switches for the network, image sizes,
 * lazy loading, placeholders, cropping, reduced motion and zoom buttons.
 * Shows a network log (simulated with timers) and what a screen reader would say.
 */

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 text-sm">
      <span className="truncate">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--brand)]" />
    </label>
  );
}

type Load = 'loading' | 'done';

export default function Playground() {
  const [slow, setSlow] = useState(false);
  const [blurUp, setBlurUp] = useState(true);
  const [srcset, setSrcset] = useState(true);
  const [lazy, setLazy] = useState(true);
  const [crop, setCrop] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [zoomBtns, setZoomBtns] = useState(true);

  const [session, setSession] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, Load>>({});
  const [full, setFull] = useState<Record<number, Load>>({});
  const [log, setLog] = useState<{ text: string; kb: number }[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [sr, setSr] = useState('Photos of Riverside flat. 12 photos.');
  const [backNote, setBackNote] = useState('');

  const requested = useRef(new Set<string>());
  const timers = useRef(new Set<number>());
  const sessionRef = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  };
  useEffect(() => clearTimers, []);

  const reload = (set: (v: boolean) => void) => (v: boolean) => {
    set(v);
    clearTimers();
    requested.current.clear();
    sessionRef.current += 1;
    setSession(sessionRef.current);
    setThumbs({});
    setFull({});
    setLog([]);
    setOpen(null);
    setBackNote('');
  };

  const request = useCallback(
    (kind: 'thumb' | 'view', i: number) => {
      const key = `${kind}-${i}`;
      if (requested.current.has(key)) return;
      requested.current.add(key);
      const p = PHOTOS[i];
      const kb = kind === 'thumb' ? (srcset ? thumbKb(p) : p.fullMb * 1000) : viewerKb(p);
      const name = kind === 'thumb' ? (srcset ? `thumb-${p.id}.jpg?w=300` : `photo-${p.id}.jpg (original)`) : `photo-${p.id}.jpg?w=1200`;
      setLog((l) => [...l, { text: `GET ${name} · ${formatKb(kb)}`, kb }]);
      const set = kind === 'thumb' ? setThumbs : setFull;
      set((s) => ({ ...s, [i]: 'loading' }));
      const speed = slow ? 40 : 1500; // KB per second
      const delay = Math.min(4000, 150 + (kb / speed) * 1000);
      const mine = sessionRef.current;
      const t = window.setTimeout(() => {
        timers.current.delete(t);
        if (sessionRef.current !== mine) return;
        set((s) => ({ ...s, [i]: 'done' }));
      }, delay);
      timers.current.add(t);
    },
    [slow, srcset],
  );

  // Thumbnails: everything at once, or only what scrolls into view.
  useEffect(() => {
    if (!lazy) {
      PHOTOS.forEach((_, i) => request('thumb', i));
      return;
    }
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) request('thumb', Number((en.target as HTMLElement).dataset.i));
        });
      },
      { root, rootMargin: '0px 0px 40px 0px' },
    );
    tiles.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [session, lazy, request]);

  const onIndex = useCallback(
    (i: number) => {
      setSr(`${PHOTOS[i].title}, ${PHOTOS[i].video ? 'video' : 'photo'} ${i + 1} of ${PHOTOS.length}`);
      if (!srcset) return; // the original is already downloaded for the grid
      request('view', i);
      if (i + 1 < PHOTOS.length) request('view', i + 1); // preload the next one
    },
    [srcset, request],
  );

  const viewerLoaded = (i: number) => (srcset ? full[i] === 'done' : thumbs[i] === 'done');

  const close = (i: number) => {
    setOpen(null);
    setSr(`Back on the grid. Focus: photo ${i + 1} of ${PHOTOS.length}, button, ${PHOTOS[i].alt}`);
    requestAnimationFrame(() => {
      const el = tiles.current[i];
      const sc = scroller.current;
      if (!el || !sc) return;
      el.focus({ preventScroll: true });
      const r = el.getBoundingClientRect();
      const s = sc.getBoundingClientRect();
      if (r.top < s.top) sc.scrollTop -= s.top - r.top + 8;
      else if (r.bottom > s.bottom) sc.scrollTop += r.bottom - s.bottom + 8;
    });
  };

  const back = () => {
    if (open !== null) {
      close(open);
      setBackNote('Back closed the viewer and kept you on the gallery.');
    } else setBackNote('No viewer open: Back would leave the listing screen.');
  };

  const totalKb = log.reduce((s, e) => s + e.kb, 0);
  const hint = !slow && blurUp ? 'Blur-up only shows while images load: turn on Slow network (3G).' : !slow ? 'Placeholders only show while images load: turn on Slow network (3G).' : 'Watch the grid while it loads, then scroll down.';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-2 border-b border-line p-4 sm:grid-cols-2">
        <Toggle label="Slow network (3G)" checked={slow} onChange={reload(setSlow)} />
        <Toggle label="Blur-up placeholders" checked={blurUp} onChange={reload(setBlurUp)} />
        <Toggle label="Sized thumbnails (srcset)" checked={srcset} onChange={reload(setSrcset)} />
        <Toggle label="Lazy-load thumbnails" checked={lazy} onChange={reload(setLazy)} />
        <Toggle label="Crop thumbnails (cover)" checked={crop} onChange={setCrop} />
        <Toggle label="Reduced motion" checked={reduce} onChange={setReduce} />
        <Toggle label="Zoom buttons in viewer" checked={zoomBtns} onChange={setZoomBtns} />
        <button type="button" onClick={() => reload(() => {})(true)} className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg">
          <RotateCcw size={14} /> Reload page
        </button>
      </div>
      <p className="border-b border-line px-4 py-2 text-xs text-muted">
        {hint} Reduced motion and zoom buttons change the viewer: open a photo.
      </p>

      <div className="flex flex-col items-center gap-3 bg-[#e9ebf2] px-3 py-6" style={{ colorScheme: 'light' }}>
        <PhoneFrame width={290} os="android">
          <div className="absolute inset-0 flex flex-col bg-white text-[#111827]">
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/5 px-3">
              <ArrowLeft size={18} aria-hidden="true" />
              <p className="text-[15px] font-semibold">Riverside flat</p>
            </div>
            <div key={session} ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto pb-6" inert={open !== null}>
              <div className="px-3 pt-3 pb-2">
                <p className="text-[18px] font-bold">€1,450 / month</p>
                <p className="text-[12px] text-black/60">2 rooms · 64 m² · 3rd floor with lift</p>
                <p className="mt-2 text-[12px] leading-snug text-black/70">Bright flat with a balcony over the river, a renovated kitchen and a quiet bedroom facing the courtyard.</p>
              </div>
              <p className="px-3 pt-2 pb-1.5 text-[13px] font-semibold">Photos (12)</p>
              <div className="grid grid-cols-2 gap-1 px-1">
                {PHOTOS.map((p, i) => {
                  const st = thumbs[i];
                  return (
                    <button
                      key={p.id}
                      data-i={i}
                      ref={(el) => {
                        tiles.current[i] = el;
                      }}
                      type="button"
                      onClick={() => {
                        setBackNote('');
                        setOpen(i);
                      }}
                      aria-label={`${p.video ? `Video, ${p.video}` : 'Photo'} ${i + 1} of 12: ${p.alt}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#e5e7eb] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#2563eb]"
                    >
                      {st === 'done' ? (
                        <PhotoArt photo={p} fit={crop ? 'cover' : 'contain'} />
                      ) : st === 'loading' && blurUp ? (
                        <PhotoArt photo={p} fit={crop ? 'cover' : 'contain'} blur={6} />
                      ) : (
                        <span className="grid h-full place-items-center text-black/30">
                          <ImageIcon size={20} aria-hidden="true" />
                        </span>
                      )}
                      {p.video && st === 'done' && (
                        <span className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                          <Play size={8} fill="currentColor" aria-hidden="true" /> {p.video}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 px-3 text-[11px] text-black/45">Listed 3 days ago · Ref. RF-2231</p>
            </div>
            {open !== null && (
              <Lightbox
                items={PHOTOS}
                start={open}
                label="Photos of Riverside flat"
                onClose={close}
                onIndexChange={onIndex}
                reducedMotion={reduce}
                zoomButtons={zoomBtns}
                isLoaded={viewerLoaded}
                blurUp={blurUp}
              />
            )}
          </div>
        </PhoneFrame>
        <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-full bg-[#111827] px-4 py-2 text-sm font-medium text-white" aria-label="Android system Back">
          <Triangle size={12} className="-rotate-90" fill="currentColor" aria-hidden="true" /> Back
        </button>
        {backNote && <p className="text-center text-xs text-[#374151]">{backNote}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader
          </p>
          <p className="mt-1 text-sm text-fg">“{sr}”</p>
        </div>
        <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="flex justify-between gap-2 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
            <span>Network · images</span>
            <span className="normal-case">
              {log.length} req · {formatKb(totalKb)}
            </span>
          </p>
          <ul className="max-h-[9rem] min-h-[5rem] space-y-1 overflow-y-auto px-3 py-2">
            {log.map((e, i) => (
              <li key={i} className="truncate">
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
