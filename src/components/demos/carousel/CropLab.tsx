import { useState } from 'react';
import { PROMOS, SlideArt } from './SlideArt';

/*
 * Aspect ratio & cropping lab. The same 16:9 banner (with text baked into the image) shown in
 * different slide shapes and fit modes, plus a too-small image that looks blurry when stretched.
 */

const RATIOS = [
  { v: '21 / 9', l: '21:9 desktop' },
  { v: '16 / 9', l: '16:9' },
  { v: '4 / 3', l: '4:3 tablet' },
  { v: '1 / 1', l: '1:1 phone' },
];
const FITS = [
  { v: 'xMidYMid slice', l: 'Cover, centered' },
  { v: 'xMinYMid slice', l: 'Cover, focal point left' },
  { v: 'xMidYMid meet', l: 'Contain' },
];

function Seg({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold text-faint">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-md px-2 py-1 text-xs font-medium ${value === o.v ? 'bg-brand text-white' : 'bg-subtle text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function CropLab() {
  const [ratio, setRatio] = useState('1 / 1');
  const [fit, setFit] = useState('xMidYMid slice');
  const [small, setSmall] = useState('no');

  const verdict =
    fit === 'xMidYMid meet'
      ? ratio === '16 / 9'
        ? 'Fits perfectly: the slide has the same shape as the image.'
        : 'Nothing is cut off, but empty bars appear around the image (letterboxing).'
      : ratio === '16 / 9'
        ? 'Fits perfectly: the slide has the same shape as the image.'
        : ratio === '21 / 9'
          ? 'Top and bottom are cut. Here it is fine, but faces or products near the edge would be lost.'
          : fit === 'xMidYMid slice'
            ? 'The headline is cut off. Text baked into the image does not survive cropping.'
            : 'Better: the text side is kept, but the product on the right is lost. Separate text from image, or use a different crop per breakpoint.';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 md:grid-cols-3">
        <Seg label="Slide shape" value={ratio} onChange={setRatio} options={RATIOS} />
        <Seg label="Fit" value={fit} onChange={setFit} options={FITS} />
        <Seg label="Image file" value={small} onChange={setSmall} options={[{ v: 'no', l: '1600 px wide' }, { v: 'yes', l: '320 px (stretched)' }]} />
      </div>
      <div className="grid place-items-center bg-[#e9ebf2] px-3 py-6" style={{ colorScheme: 'light' }}>
        <div className="w-full overflow-hidden rounded-xl bg-[#111827] shadow-sm transition-[max-width]" style={{ aspectRatio: ratio, maxWidth: ratio === '1 / 1' ? 300 : ratio === '4 / 3' ? 400 : 560 }}>
          <SlideArt promo={PROMOS[0]} fit={fit} blur={small === 'yes' ? 2.2 : 0} id="crop" />
        </div>
      </div>
      <p className="border-t border-line p-4 text-sm text-muted" aria-live="polite">
        {verdict}
        {small === 'yes' && ' The image file is far smaller than the slide, so it is stretched and looks blurry, especially on high-density (Retina) screens.'}
      </p>
    </div>
  );
}
