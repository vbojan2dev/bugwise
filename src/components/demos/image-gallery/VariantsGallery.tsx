import { useRef, useState, type ReactNode } from 'react';
import { Images, Play } from 'lucide-react';
import { Lightbox } from './Lightbox';
import { PHOTOS, PhotoArt, type Photo } from './photos';

/*
 * Three common gallery layouts, all opening the same correct viewer:
 *  - Square grid (iOS Photos / Google Photos style): every photo cropped to a square.
 *  - Listing hero: one big photo + four small ones, "+7" opens the rest (property and travel apps).
 *  - Justified rows (web galleries): photos keep their real aspect ratio, nothing is cropped.
 * Closing the viewer returns focus to the thumbnail of the photo you were looking at.
 */

type Layout = 'grid' | 'hero' | 'rows';
const LAYOUTS: { id: Layout; label: string; note: string }[] = [
  { id: 'grid', label: 'Square grid', note: 'Photos apps and profiles: dense, every photo cropped to a square. Fast to scan, but portraits and panoramas lose their edges.' },
  { id: 'hero', label: 'Listing hero', note: 'Property, hotel and product pages: one big photo, a few small ones and a “+7” tile. The tile must open the viewer at the right photo.' },
  { id: 'rows', label: 'Justified rows', note: 'Web galleries and search results: rows of equal height, each photo at its real aspect ratio. Nothing is cropped.' },
];

function VideoBadge({ p }: { p: Photo }) {
  if (!p.video) return null;
  return (
    <span className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
      <Play size={8} fill="currentColor" aria-hidden="true" /> {p.video}
    </span>
  );
}

const thumbName = (p: Photo, i: number) => `${p.video ? `Video, ${p.video}` : 'Photo'} ${i + 1} of ${PHOTOS.length}: ${p.alt}`;
const ring = 'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#2563eb]';

export default function VariantsGallery() {
  const [layout, setLayout] = useState<Layout>('grid');
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const close = (i: number) => {
    setOpen(null);
    requestAnimationFrame(() => {
      // The hero layout has no tile for every photo: fall back to the "+7" tile.
      const el = thumbs.current[i] ?? thumbs.current[4];
      const sc = scroller.current;
      if (!el || !sc) return;
      el.focus({ preventScroll: true });
      const r = el.getBoundingClientRect();
      const s = sc.getBoundingClientRect();
      if (r.top < s.top) sc.scrollTop -= s.top - r.top + 8;
      else if (r.bottom > s.bottom) sc.scrollTop += r.bottom - s.bottom + 8;
    });
  };

  const tile = (i: number, className: string, extra?: ReactNode, name?: string) => (
    <button
      key={PHOTOS[i].id}
      ref={(el) => {
        thumbs.current[i] = el;
      }}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={name ?? thumbName(PHOTOS[i], i)}
      className={`relative overflow-hidden bg-[#e5e7eb] ${ring} ${className}`}
    >
      <PhotoArt photo={PHOTOS[i]} />
      <VideoBadge p={PHOTOS[i]} />
      {extra}
    </button>
  );

  const rows: number[][] = [[0, 2, 1], [7], [3, 4, 5], [6, 8], [9, 10, 11]];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap gap-1.5 border-b border-line p-3" role="group" aria-label="Gallery layout">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={layout === l.id}
            onClick={() => {
              setOpen(null);
              thumbs.current = [];
              setLayout(l.id);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${layout === l.id ? 'bg-brand text-white' : 'bg-subtle text-muted hover:text-fg'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="px-4 pt-3 text-sm text-muted">{LAYOUTS.find((l) => l.id === layout)!.note}</p>

      <div className="px-3 py-5 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="relative mx-auto h-[460px] max-w-[360px] overflow-hidden rounded-2xl bg-white text-[#111827] shadow-sm ring-1 ring-black/5">
          <div ref={scroller} className="h-full overflow-y-auto" inert={open !== null}>
            <div className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b border-black/5 bg-white/95 px-3">
              <Images size={17} aria-hidden="true" />
              <p className="text-[14px] font-semibold">Riverside flat · 12 photos</p>
            </div>

            {layout === 'grid' && <div className="grid grid-cols-3 gap-[2px]">{PHOTOS.map((_, i) => tile(i, 'aspect-square'))}</div>}

            {layout === 'hero' && (
              <div className="space-y-1 p-2">
                {tile(0, 'block aspect-[16/10] w-full rounded-t-xl')}
                <div className="grid grid-cols-4 gap-1">
                  {tile(1, 'aspect-square')}
                  {tile(2, 'aspect-square')}
                  {tile(3, 'aspect-square')}
                  {tile(
                    4,
                    'aspect-square',
                    <span className="absolute inset-0 grid place-items-center bg-black/55 text-[15px] font-semibold text-white">+7</span>,
                    `Show all 12 photos, starting at photo 5: ${PHOTOS[4].alt}`,
                  )}
                </div>
                <div className="space-y-1.5 px-1 pt-3">
                  <p className="text-[17px] font-bold">€1,450 / month</p>
                  <p className="text-[13px] text-black/60">2 rooms · 64 m² · 3rd floor with lift · Balcony over the river</p>
                </div>
              </div>
            )}

            {layout === 'rows' && (
              <div className="space-y-1 p-1">
                {rows.map((row, r) => (
                  <div key={r} className="flex gap-1">
                    {row.map((i) => {
                      const p = PHOTOS[i];
                      return (
                        <div key={p.id} className="min-w-0" style={{ flex: `${p.w / p.h} 1 0`, aspectRatio: `${p.w} / ${p.h}` }}>
                          {tile(i, 'block h-full w-full rounded-sm')}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {open !== null && <Lightbox items={PHOTOS} start={open} label="Photos of Riverside flat" onClose={close} />}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Tap a photo. Swipe or drag sideways, double-tap to zoom, swipe down or press Esc to close.</p>
      </div>
    </div>
  );
}
