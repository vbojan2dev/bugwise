import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SegmentedControl, type Variant } from './SegmentedControl';

const languages = {
  English: ['Day', 'Week', 'Month', 'Year', 'Custom', 'All time', 'Today'],
  German: ['Tag', 'Woche', 'Monat', 'Jahr', 'Benutzerdefiniert', 'Gesamtzeitraum', 'Heute'],
  Serbian: ['Dan', 'Nedelja', 'Mesec', 'Godina', 'Prilagođeno', 'Sve vreme', 'Danas'],
  Finnish: ['Päivä', 'Viikko', 'Kuukausi', 'Vuosi', 'Mukautettu', 'Koko ajalta', 'Tänään'],
} as const;
type Lang = keyof typeof languages;

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </label>
  );
}

export default function Playground() {
  const [count, setCount] = useState(4);
  const [lang, setLang] = useState<Lang>('English');
  const [width, setWidth] = useState(320);
  const [scale, setScale] = useState(1);
  const [variant, setVariant] = useState<Variant>('ios');
  const [dark, setDark] = useState(false);
  const [value, setValue] = useState(0);
  const [truncated, setTruncated] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);

  const labels = languages[lang].slice(0, count);
  useEffect(() => {
    if (value >= count) setValue(count - 1);
  }, [count, value]);

  // Detect clipped labels. Re-measure on every render and whenever the box resizes
  // (the width animates, so a single measurement right after a change is too early).
  useLayoutEffect(() => {
    const measure = () => {
      const spans = [...(box.current?.querySelectorAll('button span') ?? [])] as HTMLElement[];
      const next = spans.filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.textContent ?? '');
      setTruncated((prev) => (prev.join('|') === next.join('|') ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  });

  const issues: string[] = [];
  if (count > 5) issues.push(`${count} segments is too many. Above 5, a dropdown or tabs usually work better.`);
  if (truncated.length) issues.push(`Truncated labels: ${truncated.map((t) => `"${t}"`).join(', ')}. Users can't read what the option does.`);
  const segWidth = (width - 4) / count;
  if (segWidth < 44) issues.push(`Each segment is only ${Math.round(segWidth)}px wide. Touch targets should be at least 44×44 pt (iOS) / 48×48 dp (Android).`);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Stress-test playground</p>
        <p className="text-sm text-muted">Testers break components by pushing them to extremes. Change the settings and watch what happens.</p>
      </div>
      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label={`Segments: ${count}`}>
            <input type="range" min={2} max={7} value={count} onChange={(e) => setCount(+e.target.value)} className="w-full accent-[var(--brand)]" />
          </Control>
          <Control label="Language">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm">
              {Object.keys(languages).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Control>
          <Control label={`Screen width: ${width}px`}>
            <input type="range" min={200} max={420} step={10} value={width} onChange={(e) => setWidth(+e.target.value)} className="w-full accent-[var(--brand)]" />
          </Control>
          <Control label={`Text size: ${Math.round(scale * 100)}%`}>
            <input type="range" min={0.85} max={1.6} step={0.05} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" />
          </Control>
          <Control label="Style">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
              {(['ios', 'material', 'web'] as Variant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`rounded-md py-1.5 capitalize ${variant === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
                >
                  {v === 'ios' ? 'iOS' : v}
                </button>
              ))}
            </div>
          </Control>
          <label className="flex items-center justify-between text-sm font-medium">
            Dark mode
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid flex-1 place-items-center overflow-x-auto p-6" style={{ background: dark ? '#000' : '#f2f2f7' }}>
            <div ref={box} className="transition-[width] duration-200" style={{ width }}>
              <SegmentedControl
                options={labels.map((l) => ({ label: l }))}
                value={value}
                onChange={(v) => setValue(v as number)}
                variant={variant}
                dark={dark}
                textScale={scale}
                ariaLabel="Time range"
              />
              <p className="mt-4 text-center text-xs" style={{ color: dark ? '#8e8e93' : '#6b6b70' }}>
                Showing: <strong>{labels[value]}</strong>
              </p>
            </div>
          </div>
          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t} className="flex items-start gap-2 text-sm text-fg">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> {t}
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Looks good. Now try German, a narrow screen, or 160% text size.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
