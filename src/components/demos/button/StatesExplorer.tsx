import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { Button, type ButtonState, type Emphasis, type Platform } from './Button';

const states: { id: ButtonState; name: string; check: string }[] = [
  { id: 'default', name: 'Default', check: 'Readable label, enough contrast (4.5:1 text, 3:1 shape against the background).' },
  { id: 'hover', name: 'Hover', check: 'Web and iPad/desktop pointers only. A subtle change; never the only hint that something is clickable.' },
  { id: 'pressed', name: 'Pressed', check: 'Instant feedback on touch-down, so the user knows the tap registered.' },
  { id: 'focused', name: 'Focused', check: 'Keyboard users must see a clear focus ring. Press Tab on the web and look for it.' },
  { id: 'disabled', name: 'Disabled', check: 'Looks inactive and really is: no tap, no click, no Enter key, no request.' },
  { id: 'loading', name: 'Loading', check: 'Shows progress, blocks repeat taps, keeps its size, and always ends (success or error).' },
];

const emphases: { id: Emphasis; name: string }[] = [
  { id: 'filled', name: 'Filled' },
  { id: 'tonal', name: 'Tonal' },
  { id: 'outlined', name: 'Outlined' },
  { id: 'text', name: 'Text' },
  { id: 'destructive', name: 'Destructive' },
];

type Outcome = 'success' | 'error' | 'slow';

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; name: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`flex-1 rounded-md px-2 py-1.5 whitespace-nowrap ${value === o.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StatesExplorer() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [emphasis, setEmphasis] = useState<Emphasis>('filled');
  const [dark, setDark] = useState(false);

  // Live button
  const [outcome, setOutcome] = useState<Outcome>('success');
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'ok' | 'fail' | null>(null);
  const [taps, setTaps] = useState(0);
  const [requests, setRequests] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const screen = dark ? '#000' : '#f2f2f7';
  const sub = dark ? '#8e8e93' : '#6b6b70';

  const pay = () => {
    setRequests((r) => r + 1);
    setLoading(true);
    setResult(null);
    timer.current = window.setTimeout(
      () => {
        setLoading(false);
        setResult(outcome === 'error' ? 'fail' : 'ok');
      },
      outcome === 'slow' ? 4000 : 1400,
    );
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setLoading(false);
    setResult(null);
    setTaps(0);
    setRequests(0);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🎛️ Button states explorer</p>
        <p className="text-sm text-muted">Every button has six states. A tester checks all of them on every platform and in both themes.</p>
      </div>
      <div className="grid gap-4 border-b border-line p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <Seg
          label="Platform"
          value={platform}
          onChange={setPlatform}
          options={[
            { id: 'ios', name: 'iOS' },
            { id: 'material', name: 'Android' },
            { id: 'web', name: 'Web' },
          ]}
        />
        <Seg label="Emphasis" value={emphasis} onChange={setEmphasis} options={emphases} />
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {states.map((s) => (
          <div key={s.id} className="flex flex-col bg-surface">
            <div className="grid h-28 place-items-center" style={{ background: screen }}>
              <Button platform={platform} emphasis={emphasis} dark={dark} state={s.id} label="Continue" />
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{s.check}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-0 border-t border-line md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-line p-5 md:border-r md:border-b-0">
          <p className="text-sm font-semibold">Now try a real one</p>
          <Seg
            label="Server response"
            value={outcome}
            onChange={setOutcome}
            options={[
              { id: 'success', name: 'Success' },
              { id: 'error', name: 'Error' },
              { id: 'slow', name: 'Slow (4 s)' },
            ]}
          />
          <label className="flex items-center justify-between text-sm font-medium">
            Disabled
            <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
          <p className="text-[13px] leading-relaxed text-muted">Tap the button several times quickly while it loads. A good button counts your taps but sends only one request.</p>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="grid flex-1 place-items-center gap-3 p-6" style={{ background: screen }}>
            <div className="flex w-full max-w-[16rem] flex-col items-center gap-3">
              {/* Count raw taps on a wrapper so we can show that taps during loading are ignored. */}
              <div className="w-full" onClickCapture={() => setTaps((t) => t + 1)}>
                <Button platform={platform} emphasis={emphasis} dark={dark} label="Pay €24.90" fullWidth disabled={disabled} loading={loading} onClick={pay} />
              </div>
              <p aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-[13px] font-medium" style={{ color: result === 'fail' ? '#ff3b30' : result === 'ok' ? '#34c759' : sub }}>
                {result === 'ok' && (
                  <>
                    <CheckCircle2 size={15} /> Payment successful
                  </>
                )}
                {result === 'fail' && (
                  <>
                    <AlertCircle size={15} /> Payment failed. Please try again.
                  </>
                )}
                {!result && (loading ? 'Processing…' : disabled ? 'Button is disabled' : 'Ready')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-5 py-3 font-mono text-xs text-muted">
            <span>
              taps: <strong className="text-fg">{taps}</strong>
            </span>
            <span>
              requests sent: <strong className="text-fg">{requests}</strong>
            </span>
            <button type="button" onClick={reset} className="ml-auto font-sans font-medium hover:text-fg">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
