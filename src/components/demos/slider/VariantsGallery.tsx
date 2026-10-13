import { useId, useState, type ReactNode } from 'react';
import { Pause, Play, Sun, SunDim, Volume1, Volume2 } from 'lucide-react';
import { Slider, type SliderValue } from './Slider';

function Demo({ title, platform, note, bg = '#f2f2f7', dark = false, children }: { title: string; platform: string; note: string; bg?: string; dark?: boolean; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface">
      <div className="grid min-h-48 place-items-center rounded-t-2xl px-5 py-7" style={{ background: bg, color: dark ? '#fff' : '#000', colorScheme: dark ? 'dark' : 'light' }}>
        <div className="w-full max-w-[17.5rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const spokenTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m} minute${m === 1 ? '' : 's'} ${sec} second${sec === 1 ? '' : 's'}`;
};

function PriceWithInputs() {
  const [range, setRange] = useState<[number, number]>([40, 160]);
  const [draft, setDraft] = useState<[string, string]>(['40', '160']);
  const id = useId();
  const commit = (i: 0 | 1) => {
    const n = Math.round(Number(draft[i].replace(',', '.')));
    const next: [number, number] = [...range];
    if (Number.isFinite(n) && draft[i].trim() !== '') {
      next[i] = i === 0 ? Math.min(Math.max(0, n), range[1]) : Math.max(Math.min(200, n), range[0]);
    }
    setRange(next);
    setDraft([String(next[0]), String(next[1])]);
  };
  return (
    <div className="text-[#111827]">
      <p className="mb-1 text-sm font-semibold">Price</p>
      <Slider
        variant="web"
        value={range}
        min={0}
        max={200}
        step={5}
        labels={['Minimum price', 'Maximum price']}
        valueText={(v) => `€${v}`}
        onChange={(v) => {
          const r = v as [number, number];
          setRange(r);
          setDraft([String(r[0]), String(r[1])]);
        }}
      />
      <div className="mt-1 flex items-center gap-2">
        {(['Min', 'Max'] as const).map((l, i) => (
          <label key={l} className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-[#d1d5db] bg-white px-2 py-1.5 text-sm focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/30">
            <span className="text-[#6b7280]" id={`${id}-${l}`}>
              {l} €
            </span>
            <input
              inputMode="numeric"
              aria-labelledby={`${id}-${l}`}
              value={draft[i]}
              onChange={(e) => {
                const val = e.target.value;
                setDraft((d) => (i === 0 ? [val, d[1]] : [d[0], val]));
              }}
              onBlur={() => commit(i as 0 | 1)}
              onKeyDown={(e) => e.key === 'Enter' && commit(i as 0 | 1)}
              className="w-0 min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function NativeRange() {
  const [v, setV] = useState(70);
  const id = useId();
  return (
    <div className="text-[#111827]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-semibold">
          Brightness
        </label>
        <output htmlFor={id} className="tabular-nums text-[#4b5563]">
          {v}%
        </output>
      </div>
      <div className="flex items-center gap-2">
        <SunDim size={16} className="shrink-0 text-[#6b7280]" aria-hidden="true" />
        <input id={id} type="range" min={0} max={100} value={v} aria-valuetext={`${v}%`} onChange={(e) => setV(+e.target.value)} className="h-6 w-0 min-w-0 flex-1 accent-[#2563eb]" />
        <Sun size={18} className="shrink-0 text-[#6b7280]" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  const [vol, setVol] = useState<SliderValue>(60);
  const [radius, setRadius] = useState<SliderValue>(5);
  const [price, setPrice] = useState<SliderValue>([40, 180]);
  const [pos, setPos] = useState<SliderValue>(84);
  const [playing, setPlaying] = useState(false);
  const p = price as [number, number];

  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every slider here works. Drag the thumbs, then click one and try the keyboard: arrows, Page Up / Page Down, Home and End.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Continuous slider" platform="iOS" note="No steps: any value between min and max. Fine for volume or brightness, where the exact number doesn't matter and you judge by feel.">
          <Slider
            value={vol}
            onChange={setVol}
            step={0}
            label="Volume"
            valueText={(v) => `${Math.round(v)}%`}
            startIcon={<Volume1 size={18} className="shrink-0 text-[#8e8e93]" aria-hidden="true" />}
            endIcon={<Volume2 size={20} className="shrink-0 text-[#8e8e93]" aria-hidden="true" />}
          />
          <p className="mt-1 text-center text-[13px] text-[rgba(60,60,67,.6)]">Volume {Math.round(vol as number)}%</p>
        </Demo>

        <Demo title="Discrete slider with stops" platform="Android · Material 3" bg="#fef7ff" note="Snaps to steps (here 1 km), and the dots show every allowed value. The value indicator appears while you drag.">
          <p className="mb-3 text-[14px] font-medium text-[#1d1b20]">Search radius: {radius as number} km</p>
          <Slider variant="material" surface="#fef7ff" value={radius} onChange={setRadius} min={1} max={10} step={1} ticks showValue="active" label="Search radius" format={(v) => `${v} km`} valueText={(v) => `${v} kilometers`} />
        </Demo>

        <Demo title="Range slider (two thumbs)" platform="Android · Material 3" bg="#fef7ff" note="Picks a low and a high value, like a price filter. The thumbs must never pass each other, and each needs its own accessible name.">
          <div className="mb-3 flex items-baseline justify-between text-[#1d1b20]">
            <span className="text-[14px] font-medium">Price</span>
            <span className="text-[14px] tabular-nums">
              €{p[0]} – €{p[1]}
            </span>
          </div>
          <Slider variant="material" surface="#fef7ff" value={price} onChange={setPrice} min={0} max={300} step={10} showValue="active" labels={['Minimum price', 'Maximum price']} format={(v) => `€${v}`} valueText={(v) => `€${v}`} />
        </Demo>

        <Demo title="Native range input" platform="Web" bg="#fff" note={'A real <input type="range">. Keyboard, screen readers and touch work out of the box; styling the thumb differs per browser.'}>
          <NativeRange />
        </Demo>

        <Demo title="Range slider + text fields" platform="Web" bg="#fff" note="The fix for 'I need exactly €95': drag for a rough range, type for an exact one. Both stay in sync, and typed values are clamped and ordered.">
          <PriceWithInputs />
        </Demo>

        <Demo title="Seek bar" platform="Video · audio players" bg="#0b0b0f" dark note="A slider whose value is a time. The lighter part shows what's already buffered. Screen readers should hear '1 minute 24 seconds of 3 minutes 45 seconds', not '84'.">
          <div className="rounded-xl bg-[#1c1c22] p-3">
            <div className="mb-2 grid h-20 place-items-center rounded-lg bg-gradient-to-br from-[#312e81] to-[#0f172a]">
              <button
                type="button"
                onClick={() => setPlaying((x) => !x)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="grid size-10 place-items-center rounded-full bg-white/90 text-black outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
            </div>
            <Slider variant="web" dark value={pos} onChange={setPos} min={0} max={225} step={1} buffered={70} showValue="active" label="Seek" format={time} valueText={(v) => `${spokenTime(v)} of ${spokenTime(225)}`} />
            <div className="flex justify-between text-[11px] text-white/60 tabular-nums">
              <span>{time(pos as number)}</span>
              <span>{time(225)}</span>
            </div>
          </div>
        </Demo>
      </div>
    </div>
  );
}
