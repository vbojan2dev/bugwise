import { useState } from 'react';

/*
 * srcset/sizes picker: shows which file a browser would roughly choose for a gallery
 * thumbnail or the viewer, given the screen width and pixel density.
 * Rule of thumb used here (and by browsers on a cold cache): slot width (from `sizes`) × device pixel ratio,
 * then the smallest candidate that is at least that wide.
 */

const CANDIDATES = [
  { w: 300, kb: 22 },
  { w: 600, kb: 70 },
  { w: 1200, kb: 240 },
  { w: 2400, kb: 820 },
];
const ORIGINAL_KB = 3400;

function Seg<T extends string | number>({ label, value, options, onChange, fmt }: { label: string; value: T; options: T[]; onChange: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-faint">{label}</p>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${value === o ? 'bg-brand text-white' : 'bg-subtle text-muted hover:text-fg'}`}
          >
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SrcsetLab() {
  const [screen, setScreen] = useState(390);
  const [dpr, setDpr] = useState(3);
  const [where, setWhere] = useState<'thumb' | 'viewer'>('thumb');

  const slot = where === 'thumb' ? (screen >= 768 ? screen * 0.25 : screen * 0.33) : screen;
  const need = Math.round(slot * dpr);
  const pick = CANDIDATES.find((c) => c.w >= need) ?? CANDIDATES[CANDIDATES.length - 1];
  const sizes = where === 'thumb' ? '(min-width: 768px) 25vw, 33vw' : '100vw';
  const saving = Math.round((1 - pick.kb / ORIGINAL_KB) * 100);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-3">
        <Seg label="Screen width (CSS px)" value={screen} options={[390, 768, 1440]} onChange={setScreen} fmt={(v) => `${v}`} />
        <Seg label="Pixel density" value={dpr} options={[1, 2, 3]} onChange={setDpr} fmt={(v) => `${v}x`} />
        <Seg label="Image shown in" value={where} options={['thumb', 'viewer'] as ('thumb' | 'viewer')[]} onChange={setWhere} fmt={(v) => (v === 'thumb' ? 'Grid' : 'Viewer')} />
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <pre className="min-w-0 overflow-x-auto rounded-xl bg-[#0e1120] p-3 font-mono text-[11px] leading-relaxed text-[#c9cde0]">
          {`<img
  src="kitchen-600.jpg"
  srcset="kitchen-300.jpg 300w,
          kitchen-600.jpg 600w,
          kitchen-1200.jpg 1200w,
          kitchen-2400.jpg 2400w"
  sizes="${sizes}"
  width="1500" height="1000"
  loading="${where === 'thumb' ? 'lazy' : 'eager'}"
  alt="Open kitchen with white cabinets…">`}
        </pre>
        <div className="min-w-0 space-y-2 text-sm">
          <p>
            Slot: <strong>{Math.round(slot)} CSS px</strong> wide ({where === 'thumb' ? (screen >= 768 ? '4 columns' : '3 columns') : 'full width'})
          </p>
          <p>
            × {dpr}x density = needs about <strong>{need} real pixels</strong>
          </p>
          <ul className="space-y-1">
            {CANDIDATES.map((c) => (
              <li key={c.w} className={`flex justify-between gap-2 rounded-lg px-3 py-1.5 ${c === pick ? 'bg-brand-soft font-semibold text-brand' : 'bg-subtle text-muted'}`}>
                <span>kitchen-{c.w}.jpg</span>
                <span>{c.kb} KB</span>
              </li>
            ))}
            <li className="flex justify-between gap-2 rounded-lg px-3 py-1.5 text-danger line-through decoration-1">
              <span>original 4032 px</span>
              <span>3.4 MB</span>
            </li>
          </ul>
          <p className="text-muted">
            The browser downloads <strong className="text-fg">kitchen-{pick.w}.jpg</strong>, {saving}% less than the original.
            {pick.w < need && ' No file is big enough, so it takes the largest one; it may look slightly soft at this density.'}
          </p>
        </div>
      </div>
    </div>
  );
}
