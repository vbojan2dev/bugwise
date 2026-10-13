import { useState } from 'react';
import { Hand, MousePointer2, RotateCcw } from 'lucide-react';
import { ResizableViewport, ViewportControls, ZoomSwitch } from './viewport';
import { ShopPage } from './ShopPage';

/*
 * Bug hunt: the same shop page with six responsive bugs (see the list at the top of ShopPage.tsx).
 * The "Input" switch simulates a touch device: hover events are ignored, like on a phone or tablet.
 */

// A finger-sized circle cursor so "touch" mode feels different (inline data URI, no network).
const touchCursor =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='11' fill='rgba(91,75,255,.25)' stroke='%235b4bff' stroke-width='2'/%3E%3C/svg%3E\") 14 14, pointer";

export function BuggyResponsiveShop() {
  const [width, setWidth] = useState(1280);
  const [fit, setFit] = useState(true);
  const [touch, setTouch] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <div className="flex w-full max-w-[560px] min-w-0 flex-col gap-3">
      <div className="rounded-2xl border border-line bg-surface p-3">
        <ViewportControls width={width} onChange={setWidth} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Input type">
            <button
              type="button"
              aria-pressed={!touch}
              onClick={() => setTouch(false)}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${!touch ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}
            >
              <MousePointer2 size={12} aria-hidden="true" /> Mouse
            </button>
            <button
              type="button"
              aria-pressed={touch}
              onClick={() => setTouch(true)}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${touch ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}
            >
              <Hand size={12} aria-hidden="true" /> Touch
            </button>
          </div>
          <ZoomSwitch fit={fit} onChange={setFit} />
          <button type="button" onClick={() => setSession((s) => s + 1)} className="ml-auto flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} aria-hidden="true" /> Reload page
          </button>
        </div>
      </div>
      <ResizableViewport width={width} onWidthChange={setWidth} fit={fit} height={600} url="trailhead.example.com">
        <div style={touch ? { cursor: touchCursor } : undefined} className={`min-h-full ${touch ? '[&_*]:!cursor-[inherit]' : ''}`}>
          <ShopPage key={`${session}-${touch}`} vw={width} buggy touch={touch} />
        </div>
      </ResizableViewport>
      <p className="text-xs text-muted">
        Tip: switch to <strong>100% (scroll)</strong> to see wide layouts at real size. In <strong>Touch</strong> mode there is no hover, just like on a phone or tablet.
      </p>
    </div>
  );
}
