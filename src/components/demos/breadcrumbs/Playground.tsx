import { useState } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';
import { Breadcrumbs, announce, type Crumb, type SmallScreen } from './Breadcrumbs';

/*
 * Breadcrumb lab: a CORRECT breadcrumb in a narrow or wide page. Learners switch width, label length,
 * the small-screen strategy and the separator markup, and watch both the visual result and what a
 * screen reader would announce. Clicking a crumb "navigates" up the hierarchy (the trail gets shorter).
 */

const SHORT: Crumb[] = [
  { label: 'Home', path: '/' },
  { label: 'Camping', path: '/c/camping' },
  { label: 'Tents', path: '/c/camping/tents' },
  { label: 'Backpacking', path: '/c/camping/tents/backpacking' },
  { label: 'Trailhead 2P', path: '/p/trailhead-2p' },
];
const LONG: Crumb[] = [
  { label: 'Home', path: '/' },
  { label: 'Outdoor & Camping Equipment', path: '/c/camping' },
  { label: 'Tents, Shelters & Hammocks', path: '/c/camping/tents' },
  { label: 'Backpacking Tents (1–2 person)', path: '/c/camping/tents/backpacking' },
  { label: 'Trailhead UltraLight 2-Person Backpacking Tent with Footprint', path: '/p/trailhead-2p' },
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold text-faint">{label}</legend>
      <div className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-medium ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const STRATEGY_NOTE: Record<SmallScreen, string> = {
  wrap: 'Wrap: every level stays visible, but long names can push the title far down the screen.',
  collapse: 'Collapse: first level + “…” + the last two. Tap “…” to reach the hidden levels.',
  parent: 'Parent only: a single “‹ parent” link. Compact, but users lose the sense of depth.',
  scroll: 'Scroll: one line you swipe sideways. Hidden levels are easy to miss, so check they are discoverable.',
};

export default function Playground() {
  const [width, setWidth] = useState<'desktop' | 'phone'>('phone');
  const [names, setNames] = useState<'short' | 'long'>('long');
  const [strategy, setStrategy] = useState<SmallScreen>('collapse');
  const [seps, setSeps] = useState<'css' | 'text'>('css');
  const [depth, setDepth] = useState(5);
  const [lastClick, setLastClick] = useState<string | null>(null);

  const items = (names === 'short' ? SHORT : LONG).slice(0, depth);
  const mode: SmallScreen = width === 'phone' ? strategy : 'wrap';
  const current = items[items.length - 1];
  const lines = announce(items, mode, seps === 'text');

  const navigate = (c: Crumb) => {
    const idx = items.findIndex((x) => x.path === c.path);
    if (idx >= 0) setDepth(idx + 1);
    setLastClick(c.path);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-2">
        <Seg label="Screen width" value={width} onChange={setWidth} options={[{ v: 'desktop', l: 'Desktop' }, { v: 'phone', l: 'Phone' }]} />
        <Seg label="Category names" value={names} onChange={setNames} options={[{ v: 'short', l: 'Short' }, { v: 'long', l: 'Long' }]} />
        <Seg
          label="Small-screen strategy"
          value={strategy}
          onChange={setStrategy}
          options={[
            { v: 'wrap', l: 'Wrap' },
            { v: 'collapse', l: 'Collapse' },
            { v: 'parent', l: 'Parent' },
            { v: 'scroll', l: 'Scroll' },
          ]}
        />
        <Seg label="Separators in the markup" value={seps} onChange={setSeps} options={[{ v: 'css', l: 'Decorative ›' }, { v: 'text', l: 'Text “/”' }]} />
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 bg-[#e9ebf2] px-3 py-5 sm:px-6" style={{ colorScheme: 'light' }}>
          <div className="mx-auto overflow-visible rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm transition-[max-width]" style={{ maxWidth: width === 'phone' ? 320 : 640 }}>
            <p className="truncate rounded-t-xl border-b border-black/10 bg-[#f6f7fb] px-3 py-1.5 font-mono text-[10px] text-black/45">shop.example.com{current.path}</p>
            <div className="min-h-[220px] p-4">
              <Breadcrumbs key={`${mode}-${names}-${depth}`} items={items} mode={mode} textSeparators={seps === 'text'} onNavigate={navigate} />
              <p className="mt-3 text-[18px] leading-snug font-bold">{current.label}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-black/[0.07]" />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] text-[#1d4ed8]">{lastClick ? `Opened ${lastClick}` : 'Click a level to go up the hierarchy'}</p>
                {depth < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDepth(5);
                      setLastClick(null);
                    }}
                    className="flex items-center gap-1 rounded-md bg-black/[0.06] px-2 py-1 text-[11px] font-medium text-black/70 hover:bg-black/10"
                  >
                    <RotateCcw size={11} /> Back to the product
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-[40rem] text-center text-[12px] text-[#4a4f60]">
            {width === 'desktop' ? 'Desktop: the full trail fits, so the small-screen strategy is not used. Switch to Phone to compare strategies.' : STRATEGY_NOTE[strategy]}
          </p>
        </div>

        <div className="min-w-0 border-t border-line p-4 lg:border-t-0 lg:border-l">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Volume2 size={13} /> Screen reader reads
          </p>
          <ol className="mt-2 space-y-1 text-[13px]">
            {lines.map((l, i) => (
              <li key={i} className={`rounded-md px-2 py-1 ${l === 'slash' ? 'bg-danger-soft font-semibold text-danger' : 'bg-subtle text-fg'}`}>
                {l}
              </li>
            ))}
          </ol>
          {seps === 'text' && <p className="mt-2 text-xs text-danger">Text separators are read aloud between every level: noise for screen reader users.</p>}
        </div>
      </div>
    </div>
  );
}
