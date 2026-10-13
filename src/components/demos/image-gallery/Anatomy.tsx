import { ChevronLeft, ChevronRight, Play, Share, X, ZoomIn } from 'lucide-react';
import { PHOTOS, PhotoArt } from './photos';

const parts = [
  { n: 1, name: 'Thumbnail grid', text: 'Small, cropped previews. Each thumbnail is a button (or link) named by the photo’s alt text.' },
  { n: 2, name: 'Video item', text: 'Marked with a play icon and duration, so users know it is not a photo.' },
  { n: 3, name: 'Viewer (lightbox)', text: 'A modal dialog over the page. Focus moves into it and stays there until it closes.' },
  { n: 4, name: 'Close', text: 'Always visible. Esc, swipe down and the system Back do the same.' },
  { n: 5, name: 'Counter', text: '“3 of 12”. Must match the photo shown, and its total must match the grid.' },
  { n: 6, name: 'Share / save', text: 'Opens the system share sheet or saves the photo. Optional, but it must share the right photo.' },
  { n: 7, name: 'Full photo', text: 'The whole image, uncropped and sharp. Pinch or double-tap to zoom.' },
  { n: 8, name: 'Previous / next', text: 'Button alternative to swiping (WCAG 2.5.1). Disabled at the first and last photo.' },
  { n: 9, name: 'Caption and zoom buttons', text: 'Caption describes the photo for everyone; zoom buttons are the alternative to pinching.' },
];

function M({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  const p = PHOTOS[2];
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.2fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-5 py-8" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="Left: a three-column grid of photo thumbnails, one marked as a video of 0:42. Right: the photo viewer showing the bedroom photo whole on black, with a close button, the counter '3 of 12' and a share button at the top, previous and next arrows on the sides, and a caption with a zoom button at the bottom."
          className="mx-auto flex max-w-[22rem] items-center justify-center gap-4"
        >
          <div className="relative w-[44%] rounded-xl bg-white p-1 shadow-sm">
            <M n={1} className="-top-3 -left-3" />
            <M n={2} className="-bottom-5 left-0" />
            <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded-lg">
              {PHOTOS.slice(0, 9).map((ph, i) => (
                <span key={ph.id} className={`relative aspect-square overflow-hidden ${i === 2 ? 'outline-2 -outline-offset-2 outline-[#2563eb]' : ''}`}>
                  <PhotoArt photo={ph} />
                  {ph.video && (
                    <span className="absolute right-0.5 bottom-0.5 flex items-center rounded bg-black/60 px-0.5 text-[7px] text-white">
                      <Play size={6} fill="currentColor" /> {ph.video}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex aspect-[9/16] w-[50%] flex-col rounded-xl bg-black p-1.5 text-white shadow-sm">
            <M n={3} className="-top-3 -right-3" />
            <div className="flex items-center justify-between">
              <span className="relative grid size-5 place-items-center rounded-full bg-white/15">
                <X size={11} />
                <M n={4} className="-bottom-6 -left-2" />
              </span>
              <span className="relative text-[9px] font-semibold">
                3 of 12
                <M n={5} className="-top-7 left-1" />
              </span>
              <span className="relative grid size-5 place-items-center rounded-full bg-white/15">
                <Share size={10} />
                <M n={6} className="-bottom-6 -right-2" />
              </span>
            </div>
            <div className="relative my-1 min-h-0 flex-1">
              <PhotoArt photo={p} fit="contain" />
              <M n={7} className="top-[40%] left-[40%]" />
              <span className="absolute top-1/2 left-0 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-white/15">
                <ChevronLeft size={10} />
              </span>
              <span className="absolute top-1/2 right-0 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-white/15">
                <ChevronRight size={10} />
              </span>
              <M n={8} className="top-[60%] -left-4" />
            </div>
            <div className="relative flex items-end justify-between gap-1">
              <span className="text-[7px] leading-tight text-white/85">{p.caption}</span>
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/15">
                <ZoomIn size={9} />
              </span>
              <M n={9} className="-bottom-5 left-[30%]" />
            </div>
          </div>
        </div>
      </div>
      <ol className="min-w-0 space-y-3">
        {parts.map((pt) => (
          <li key={pt.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{pt.n}</span>
            <div className="min-w-0">
              <p className="font-semibold">{pt.name}</p>
              <p className="text-sm text-muted">{pt.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
