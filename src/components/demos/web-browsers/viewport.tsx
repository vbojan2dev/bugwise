import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Lock, RotateCw } from 'lucide-react';

/** Breakpoints used by the sample shop pages (same values as Tailwind's defaults). */
export const BREAKPOINTS = [
  { id: 'base', min: 0, label: 'base', range: '< 640' },
  { id: 'sm', min: 640, label: 'sm', range: '≥ 640' },
  { id: 'md', min: 768, label: 'md', range: '≥ 768' },
  { id: 'lg', min: 1024, label: 'lg', range: '≥ 1024' },
  { id: 'xl', min: 1280, label: 'xl', range: '≥ 1280' },
] as const;

export const MIN_W = 320;
export const MAX_W = 1440;

export const PRESETS = [
  { label: 'iPhone SE (1st)', w: 320 },
  { label: 'Galaxy S', w: 360 },
  { label: 'iPhone 15', w: 393 },
  { label: 'iPad 9.7″', w: 768 },
  { label: 'iPad Air', w: 820 },
  { label: 'Laptop', w: 1280 },
  { label: 'Desktop', w: 1440 },
];

export function activeBreakpoint(w: number) {
  return [...BREAKPOINTS].reverse().find((b) => w >= b.min) ?? BREAKPOINTS[0];
}

export const clampW = (w: number) => Math.min(MAX_W, Math.max(MIN_W, Math.round(w)));

/** Slider, number field, presets and breakpoint chips. */
export function ViewportControls({ width, onChange, presets = PRESETS }: { width: number; onChange: (w: number) => void; presets?: typeof PRESETS }) {
  const [draft, setDraft] = useState(String(width));
  const numId = useId();
  useEffect(() => {
    setDraft(String(width));
  }, [width]);
  const active = activeBreakpoint(width);
  const pct = (w: number) => ((w - MIN_W) / (MAX_W - MIN_W)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={numId} className="text-xs font-semibold tracking-wide text-faint uppercase">
          Viewport width
        </label>
        <span className="flex items-center gap-1">
          <input
            id={numId}
            type="number"
            inputMode="numeric"
            min={MIN_W}
            max={MAX_W}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= MIN_W && v <= MAX_W) onChange(Math.round(v));
            }}
            onBlur={() => setDraft(String(width))}
            className="h-8 w-20 rounded-lg border border-line bg-surface px-2 font-mono text-sm tabular-nums"
          />
          <span className="text-sm text-muted">px</span>
        </span>
        <span className="ml-auto rounded-full bg-brand-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-brand">
          {active.label} <span className="font-normal opacity-80">({active.range})</span>
        </span>
      </div>

      <div className="relative pt-1 pb-5">
        <input
          type="range"
          min={MIN_W}
          max={MAX_W}
          step={1}
          value={width}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Viewport width in CSS pixels"
          aria-valuetext={`${width} pixels, ${active.label} breakpoint`}
          className="relative z-10 w-full accent-[var(--brand)]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5" aria-hidden="true">
          {BREAKPOINTS.slice(1).map((b) => (
            <span key={b.id} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pct(b.min)}%` }}>
              <span className={`mx-auto block h-1.5 w-px ${width >= b.min ? 'bg-brand' : 'bg-line-strong'}`} />
              <span className={`block font-mono text-[10px] leading-tight ${active.id === b.id ? 'font-semibold text-brand' : 'text-faint'}`}>{b.min}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Device presets">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={width === p.w}
            onClick={() => onChange(p.w)}
            className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
              width === p.w ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'
            }`}
          >
            {p.label} <span className="font-mono opacity-70">{p.w}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1" aria-label="Breakpoints">
        {BREAKPOINTS.map((b) => (
          <span
            key={b.id}
            className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${active.id === b.id ? 'bg-brand text-brand-fg' : 'bg-subtle text-faint'}`}
          >
            {b.label} {b.range}
          </span>
        ))}
      </div>
    </div>
  );
}

const HANDLE = 16;

/**
 * A browser-like frame whose *inner* viewport has a given CSS width. It never depends on the real window size:
 * in "fit" mode the viewport is scaled down to fit the container, otherwise the container scrolls sideways.
 */
export function ResizableViewport({
  width,
  onWidthChange,
  height = 600,
  url = 'shop.example.com',
  fit = true,
  children,
}: {
  width: number;
  onWidthChange: (w: number) => void;
  height?: number;
  url?: string;
  fit?: boolean;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  const drag = useRef<{ x: number; w: number; s: number } | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setAvail(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const room = Math.max(200, (avail || 340) - HANDLE - 2);
  const scale = fit ? Math.min(1, room / width) : 1;
  const frameW = Math.round(width * scale);
  const tickStep = 100 * scale >= 34 ? 100 : 100 * scale >= 17 ? 200 : 400;
  const ticks: number[] = [];
  for (let t = 0; t <= width; t += 100) ticks.push(t);

  return (
    <div ref={outer} className="w-full min-w-0" style={{ contain: 'inline-size' }}>
      <div className={fit ? '' : 'overflow-x-auto pb-2'}>
        <div className="relative" style={{ width: frameW + HANDLE }}>
          {/* Ruler */}
          <div className="relative mb-1 h-5 border-b border-line" style={{ width: frameW }} aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="absolute bottom-0" style={{ left: t * scale }}>
                <span className={`block w-px bg-line-strong ${t % tickStep === 0 ? 'h-2' : 'h-1'}`} />
                {t % tickStep === 0 && t > 0 && t < width - 45 && (
                  <span className="absolute bottom-2 -translate-x-1/2 font-mono text-[9px] text-faint">{t}</span>
                )}
              </span>
            ))}
            {BREAKPOINTS.slice(1)
              .filter((b) => b.min <= width)
              .map((b) => (
                <span key={b.id} className="absolute bottom-0 h-full w-0.5 -translate-x-1/2 bg-brand/70" style={{ left: b.min * scale }} title={`${b.label} ${b.min}px`} />
              ))}
            <span className="absolute right-1 bottom-1 rounded bg-surface px-0.5 font-mono text-[10px] font-semibold text-brand">{width}</span>
          </div>

          {/* Frame */}
          <div className="overflow-hidden rounded-xl border border-line-strong bg-white text-[#111827] shadow-[0_16px_32px_-16px_rgba(16,18,35,.3)]" style={{ width: frameW }}>
            <div className="flex items-center gap-1.5 border-b border-[#e5e7eb] bg-[#f3f4f6] px-2 py-1.5 text-[#6b7280]">
              <ArrowLeft size={13} aria-hidden="true" className="shrink-0" />
              <ArrowRight size={13} aria-hidden="true" className="shrink-0 opacity-50" />
              <RotateCw size={12} aria-hidden="true" className="shrink-0" />
              <span className="flex min-w-0 flex-1 items-center gap-1 truncate rounded-full bg-white px-2 py-0.5 font-mono text-[10px]">
                <Lock size={9} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{url}</span>
              </span>
            </div>
            <div style={{ width: frameW, height: Math.round(height * scale), overflow: 'hidden' }}>
              <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                <div className="relative h-full w-full overflow-auto bg-white" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* Drag handle */}
          <div
            aria-hidden="true"
            title="Drag to resize"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, w: width, s: scale };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              onWidthChange(clampW(d.w + (e.clientX - d.x) / d.s));
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            className="absolute top-6 bottom-0 flex cursor-ew-resize touch-none items-center justify-center"
            style={{ left: frameW, width: HANDLE }}
          >
            <span className="h-12 w-1.5 rounded-full bg-line-strong" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small "Fit / 100%" switch. */
export function ZoomSwitch({ fit, onChange }: { fit: boolean; onChange: (fit: boolean) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Preview zoom">
      {[
        [true, 'Fit to box'],
        [false, '100% (scroll)'],
      ].map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={fit === v}
          onClick={() => onChange(v as boolean)}
          className={`rounded-md px-2 py-0.5 font-medium ${fit === v ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}
        >
          {l as string}
        </button>
      ))}
    </div>
  );
}
