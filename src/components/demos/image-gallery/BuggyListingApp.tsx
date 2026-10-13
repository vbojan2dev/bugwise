import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Heart, MapPin, Play, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Lightbox } from './Lightbox';
import { FULL_TOTAL_MB, PHOTOS, PhotoArt, type Category } from './photos';

/*
 * A deliberately broken property listing with a photo gallery. Bugs (don't spoil them!):
 *  1. Closing the viewer scrolls the screen back to the top (and focus is not returned to the thumbnail).
 *  2. Swiping (or tapping Next) past the last photo opens an empty black slide.
 *  3. Zoom stays applied when you move to the next/previous photo.
 *  4. The counter is 0-based: the first photo says "0 of 12", the last "11 of 12".
 *  5. After filtering (Rooms / Outside / Floor plan), a thumbnail opens the photo at the same
 *     position in the UNFILTERED list (index of the filtered grid used on the full list).
 *  6. The grid loads the full-resolution original for every thumbnail on launch (~40 MB).
 */

const FILTERS: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'outside', label: 'Outside' },
  { id: 'plan', label: 'Floor plan' },
];

export function BuggyListingApp() {
  const [run, setRun] = useState(0);
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const screen = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => (filter === 'all' ? PHOTOS : PHOTOS.filter((p) => p.category === filter)), [filter]);

  // BUG 6: every original photo is downloaded for the thumbnails.
  useEffect(() => {
    setLog(PHOTOS.map((p) => `GET /listing/2231/photo-${p.id}.jpg 4032×3024 · ${p.fullMb.toFixed(1)} MB`));
  }, [run]);

  const close = () => {
    setOpen(null);
    // BUG 1: the screen "re-renders" from the top; focus is not restored.
    if (screen.current) screen.current.scrollTop = 0;
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="absolute inset-0 flex flex-col bg-white text-[#111827]" style={{ colorScheme: 'light' }}>
          <div className="flex h-11 shrink-0 items-center justify-between px-3">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              <ArrowLeft size={18} aria-hidden="true" /> Nestly
            </span>
            <Heart size={18} aria-label="Save listing" />
          </div>
          <div key={run} ref={screen} className="relative min-h-0 flex-1 overflow-y-auto pb-8" inert={open !== null}>
            <div className="px-3">
              <p className="text-[18px] font-bold">€1,450 / month</p>
              <p className="text-[13px] font-medium">Bright 2-room flat, Riverside</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-black/55">
                <MapPin size={12} aria-hidden="true" /> Quay Street 14 · 64 m² · 3rd floor
              </p>
              <p className="mt-3 text-[13px] font-semibold">About this flat</p>
              <p className="mt-1 text-[12px] leading-snug text-black/70">
                Renovated in 2024, with oak floors, a balcony over the river and a quiet bedroom facing the green courtyard. Lift, bike room and storage in the basement. Available from 1 December.
              </p>
            </div>

            <p className="px-3 pt-4 pb-1.5 text-[13px] font-semibold">Photos</p>
            <div className="flex gap-1.5 overflow-x-auto px-3 pb-2" role="group" aria-label="Filter photos">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium ${filter === f.id ? 'border-[#0f766e] bg-[#ccfbf1] text-[#115e59]' : 'border-black/15 text-black/70'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-[2px]">
              {shown.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpen(i)} // BUG 5: index in the filtered grid, used on the full list
                  aria-label={`${p.video ? 'Video' : 'Photo'}: ${p.alt}`}
                  className="relative aspect-square overflow-hidden bg-[#e5e7eb] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#2563eb]"
                >
                  <PhotoArt photo={p} />
                  {p.video && (
                    <span className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                      <Play size={8} fill="currentColor" aria-hidden="true" /> {p.video}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mx-3 mt-4 rounded-xl bg-[#f0fdfa] p-3">
              <p className="text-[13px] font-semibold">Book a viewing</p>
              <p className="text-[12px] text-black/60">Next free slots: Thu 17:30, Sat 10:00</p>
            </div>
          </div>
          {open !== null && (
            <Lightbox
              items={PHOTOS}
              start={open}
              label="Photos of Bright 2-room flat"
              onClose={close}
              bugs={{ keepZoom: true, pastEnd: true, zeroCounter: true }}
            />
          )}
        </div>
      </PhoneFrame>
      <p className="text-center text-xs text-muted">Scroll the screen, tap a photo. Swipe or drag, double-tap to zoom, use the arrows, swipe down or press Esc to close.</p>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network (screen open)</span>
          <span className="flex items-center gap-2 normal-case">
            {log.length} req · {FULL_TOTAL_MB.toFixed(1)} MB
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                setFilter('all');
                setRun((r) => r + 1);
              }}
              className="flex items-center gap-1 font-medium text-white/60 hover:text-white"
            >
              <RotateCcw size={12} /> Restart
            </button>
          </span>
        </p>
        <ul className="max-h-[8rem] space-y-1 overflow-y-auto px-3 py-2">
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
