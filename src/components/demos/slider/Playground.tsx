import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import { Slider, type SliderValue, type SliderVariant } from './Slider';

const presets = {
  volume: { label: 'Volume 0–100 %', min: 0, max: 100, name: 'Volume', fmt: (s: string) => `${s}%` },
  price: { label: 'Price €0–249', min: 0, max: 249, name: 'Price', fmt: (s: string) => `€${s}` },
  opacity: { label: 'Opacity 0–1', min: 0, max: 1, name: 'Opacity', fmt: (s: string) => s },
  age: { label: 'Age 18–99', min: 18, max: 99, name: 'Age', fmt: (s: string) => `${s} years` },
} as const;
type PresetKey = keyof typeof presets;
const steps = [0, 1, 5, 7, 10, 0.1, 0.25] as const;

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

function Pills<T extends string | number>({ value, options, onChange, render }: { value: T; options: readonly T[]; onChange: (v: T) => void; render: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 whitespace-nowrap ${value === o ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

export default function Playground() {
  const [preset, setPreset] = useState<PresetKey>('price');
  const [step, setStep] = useState<number>(10);
  const [range, setRange] = useState(false);
  const [naive, setNaive] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [hit, setHit] = useState(44);
  const [variant, setVariant] = useState<SliderVariant>('ios');
  const [value, setValue] = useState<SliderValue>(100);
  const [changes, setChanges] = useState(0);
  const [commits, setCommits] = useState(0);

  const P = presets[preset];
  const { min, max } = P;

  const defaults = (key: PresetKey, st: number, isRange: boolean): SliderValue => {
    const { min: a, max: b } = presets[key];
    const snap = (v: number) => (st ? +(a + Math.round((v - a) / st) * st).toFixed(decimals(st)) : v);
    const clampTop = (v: number) => Math.min(v, st ? +(a + Math.floor((b - a) / st + 1e-9) * st).toFixed(decimals(st)) : b);
    return isRange ? [clampTop(snap(a + (b - a) * 0.25)), clampTop(snap(a + (b - a) * 0.7))] : clampTop(snap(a + (b - a) * 0.4));
  };
  const reconfigure = (key: PresetKey, st: number, isRange: boolean) => {
    setPreset(key);
    setStep(st);
    setRange(isRange);
    setValue(defaults(key, st, isRange));
    setChanges(0);
    setCommits(0);
  };

  const dec = decimals(step);
  const lastStep = step ? +(min + Math.floor((max - min) / step + 1e-9) * step).toFixed(dec) : max;
  const shown = (v: number) => {
    if (naive) return String(v);
    if (step) return v.toFixed(dec);
    return max - min <= 1 ? v.toFixed(2) : String(Math.round(v));
  };
  const text = (v: number) => P.fmt(shown(v));
  const vals = Array.isArray(value) ? value : [value];

  const issues: { kind: 'warn' | 'info'; text: string }[] = [];
  const count = step ? (max - min) / step : Infinity;
  if (step && step > max - min) issues.push({ kind: 'warn', text: `The step (${step}) is bigger than the whole range (${min}–${max}). The slider can't move at all.` });
  else if (step && Math.abs(count - Math.round(count)) > 1e-9)
    issues.push({ kind: 'warn', text: `Max ${text(max)} is unreachable. ${max - min} isn't a multiple of ${step}, so the last stop is ${text(lastStep)}. That's what a native <input type="range"> does too. Ask what should happen.` });
  if (vals.some((v) => String(v).replace(/^-?\d+\.?/, '').length > 6))
    issues.push({ kind: 'warn', text: `Floating-point noise: the label shows "${text(vals.find((v) => String(v).replace(/^-?\d+\.?/, '').length > 6) ?? 0)}". Round to the step's decimals before showing or comparing values.` });
  if (hit < 44) issues.push({ kind: 'warn', text: `The thumb's touch area is only ${hit}×${hit} px. Aim for at least 44×44 pt (iOS) / 48×48 dp (Android).` });
  if (!step) issues.push({ kind: 'info', text: 'Continuous: nobody can hit an exact value by dragging. Fine for volume, wrong for age or an exact price.' });
  else if (count > 60) issues.push({ kind: 'warn', text: `${Math.floor(count) + 1} possible values on a track about 260 px wide: ${260 / count < 1 ? 'less than 1 px' : `about ${Math.round(260 / count)} px`} per value. Picking an exact one is fiddly; offer a text field or stepper too.` });
  if (range && vals[0] === vals[1]) issues.push({ kind: 'info', text: 'Both thumbs are on the same value. Can you still grab each one and drag it the right way?' });
  if (rtl) issues.push({ kind: 'info', text: 'Right-to-left: the slider is mirrored, so the minimum is on the right. Check that dragging and arrow keys follow what you see.' });

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Stress-test playground</p>
        <p className="text-sm text-muted">Change the range, the step and the math, then drag the thumb all the way to both ends. Watch the readouts below the slider.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Range">
            <select value={preset} onChange={(e) => reconfigure(e.target.value as PresetKey, step, range)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm">
              {(Object.keys(presets) as PresetKey[]).map((k) => (
                <option key={k} value={k}>
                  {presets[k].label}
                </option>
              ))}
            </select>
          </Control>
          <Control label="Step">
            <Pills value={step} options={steps} onChange={(s) => reconfigure(preset, s, range)} render={(s) => (s === 0 ? 'none' : String(s))} />
          </Control>
          <Control label="Thumbs">
            <Pills value={range ? 'range' : 'single'} options={['single', 'range'] as const} onChange={(m) => reconfigure(preset, step, m === 'range')} render={(m) => (m === 'range' ? 'Two (range)' : 'One')} />
          </Control>
          <Control label="Rounding math">
            <Pills value={naive ? 'naive' : 'fixed'} options={['fixed', 'naive'] as const} onChange={(m) => setNaive(m === 'naive')} render={(m) => (m === 'fixed' ? 'Rounded' : 'Naive (buggy)')} />
          </Control>
          <Control label={`Thumb touch area: ${hit}px`}>
            <input type="range" min={16} max={56} step={2} value={hit} onChange={(e) => setHit(+e.target.value)} aria-label="Thumb touch area" className="w-full accent-[var(--brand)]" />
          </Control>
          <Control label="Style">
            <Pills value={variant} options={['ios', 'material', 'web'] as const} onChange={setVariant} render={(v) => (v === 'ios' ? 'iOS' : v === 'material' ? 'Material' : 'Web')} />
          </Control>
          <label className="flex items-center justify-between text-sm font-medium">
            Right-to-left (Arabic, Hebrew)
            <input type="checkbox" checked={rtl} onChange={(e) => setRtl(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="px-5 pt-12 pb-6 sm:px-8" style={{ background: variant === 'material' ? '#fef7ff' : '#fff', color: '#000', colorScheme: 'light' }}>
            <div className="mx-auto max-w-[22rem]">
              <div dir={rtl ? 'rtl' : 'ltr'} className="mb-2 flex items-baseline justify-between gap-3 text-[14px]">
                <span className="shrink-0 font-semibold">{P.name}</span>
                <span className="min-w-0 text-right tabular-nums break-all" dir="ltr">
                  {vals.map(text).join(' – ')}
                </span>
              </div>
              <Slider
                key={`${preset}-${step}-${range}`}
                variant={variant}
                surface={variant === 'material' ? '#fef7ff' : '#fff'}
                value={value}
                onChange={(v) => {
                  setValue(v);
                  setChanges((c) => c + 1);
                }}
                onCommit={() => setCommits((c) => c + 1)}
                min={min}
                max={max}
                step={step}
                lastStepOnly
                naiveMath={naive}
                rtl={rtl}
                hitSize={hit}
                showHitArea
                ticks={step > 0 && count <= 30}
                showValue="active"
                label={P.name}
                labels={[`Minimum ${P.name.toLowerCase()}`, `Maximum ${P.name.toLowerCase()}`]}
                format={text}
                valueText={text}
              />
              <div dir={rtl ? 'rtl' : 'ltr'} className="mt-3 flex justify-between text-[11px] text-[#6b6b70] tabular-nums">
                <span>{text(min)}</span>
                <span>{text(max)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">aria-valuenow</p>
              <p className="font-mono text-[13px] break-all">{vals.map(String).join(' / ')}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Screen reader hears</p>
              <p className="text-[13px] break-words">
                “{range ? `Minimum ${P.name.toLowerCase()}` : P.name}, {text(vals[0])}, adjustable”
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">Events</p>
                <button
                  type="button"
                  onClick={() => {
                    setChanges(0);
                    setCommits(0);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
              <p className="text-[13px]">
                <strong className="tabular-nums">{changes}</strong> change events · <strong className="tabular-nums">{commits}</strong> committed values
              </p>
              <p className="text-xs text-muted">An app that calls the server on every change event would have sent {changes} requests. Apply on release or debounce.</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t.text} className="flex items-start gap-2 text-sm text-fg">
                  {t.kind === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-brand" />} <span className="min-w-0">{t.text}</span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Looks fine. Now try step 7, step 0.1 with naive math, or the age range.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
