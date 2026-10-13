import { useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { ResizableViewport, ViewportControls, ZoomSwitch, activeBreakpoint } from './viewport';
import { ShopPage } from './ShopPage';

/** Interactive viewport resizer with a responsive sample shop inside. */
export default function ViewportResizer() {
  const [width, setWidth] = useState(393);
  const [fit, setFit] = useState(true);
  const bp = activeBreakpoint(width);

  const rules = [
    { what: 'Navigation', value: width >= 768 ? 'Inline links' : 'Hamburger menu', from: 'md' },
    { what: 'Search field', value: width >= 1024 ? 'Visible in header' : 'Hidden', from: 'lg' },
    { what: 'Hero', value: width >= 768 ? 'Text and image side by side' : 'Image above text', from: 'md' },
    { what: 'Product grid', value: `${width >= 1024 ? 4 : width >= 768 ? 3 : 2} columns`, from: 'md / lg' },
    { what: 'Compare tents', value: width >= 640 ? 'Table' : 'Stacked cards', from: 'sm' },
    { what: 'Footer', value: width >= 768 ? '3 columns' : '1 column', from: 'md' },
  ];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
          <MoveHorizontal size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Viewport resizer</p>
          <p className="text-sm text-muted">Drag the slider (or the handle next to the page) and watch the layout change at each breakpoint.</p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <ViewportControls width={width} onChange={setWidth} />
        <div className="flex justify-end">
          <ZoomSwitch fit={fit} onChange={setFit} />
        </div>
        <ResizableViewport width={width} onWidthChange={setWidth} fit={fit} height={600} url="trailhead.example.com">
          <ShopPage vw={width} />
        </ResizableViewport>
        <div className="rounded-2xl border border-line bg-subtle p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">
            Layout at {width}px <span className="font-mono normal-case">({bp.label})</span>
          </p>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {rules.map((r) => (
              <div key={r.what} className="flex min-w-0 items-baseline justify-between gap-2 border-b border-line pb-1.5">
                <dt className="text-muted">{r.what}</dt>
                <dd className="text-right font-medium">
                  {r.value} <span className="font-mono text-[10px] text-faint">{r.from}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
