import { useId, useState } from 'react';
import { ArrowLeftRight, Check, X } from 'lucide-react';
import { contrastRatio, hexToRgb } from './a11y-utils';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const valid = hexToRgb(value) ? value : '#000000';
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold tracking-wide text-faint uppercase">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={(valid.length === 4 ? '#' + valid.slice(1).split('').map((c) => c + c).join('') : valid).toLowerCase()}
          onChange={(e) => {
            setDraft(null);
            onChange(e.target.value);
          }}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
        />
        <input
          id={id}
          value={draft ?? value}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value);
            if (hexToRgb(e.target.value)) onChange(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value);
          }}
          onBlur={() => setDraft(null)}
          className="h-9 w-0 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 font-mono text-sm uppercase"
        />
      </div>
    </div>
  );
}

function Pass({ ok, label, need }: { ok: boolean; label: string; need: string }) {
  return (
    <li className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs ${ok ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
      <span className="min-w-0">
        <span className="font-semibold text-fg">{label}</span> <span className="text-muted">({need})</span>
      </span>
      <span className={`flex shrink-0 items-center gap-1 font-semibold ${ok ? 'text-ok' : 'text-danger'}`}>
        {ok ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />} {ok ? 'Pass' : 'Fail'}
      </span>
    </li>
  );
}

/** Controlled contrast checker: two colors in, ratio and WCAG results out. */
export function ContrastPanel({ fg, bg, setFg, setBg, note }: { fg: string; bg: string; setFg: (v: string) => void; setBg: (v: string) => void; note?: React.ReactNode }) {
  const a = hexToRgb(fg) ?? [0, 0, 0];
  const b = hexToRgb(bg) ?? [255, 255, 255];
  const ratio = contrastRatio(a, b);
  const shown = Math.floor(ratio * 100) / 100;
  return (
    <div className="min-w-0 space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <ColorField label="Text" value={fg} onChange={setFg} />
        <button
          type="button"
          onClick={() => {
            setFg(bg);
            setBg(fg);
          }}
          aria-label="Swap colors"
          className="mb-0.5 grid size-8 place-items-center rounded-md border border-line text-muted hover:text-fg"
        >
          <ArrowLeftRight size={14} aria-hidden="true" />
        </button>
        <ColorField label="Background" value={bg} onChange={setBg} />
      </div>
      {note}
      <div className="flex items-stretch gap-3">
        <div className="grid min-w-0 flex-1 place-items-center rounded-xl border border-line px-3 py-3 text-center" style={{ background: bg, color: fg }}>
          <p className="text-[13px]">Small text: Deliver to my address</p>
          <p className="text-[19px] font-bold">Large bold text</p>
        </div>
        <div className="grid w-24 shrink-0 place-items-center rounded-xl bg-subtle p-2 text-center" aria-live="polite">
          <p className="text-[26px] leading-none font-bold tabular-nums text-fg">{shown.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-muted">: 1 ratio</p>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <Pass ok={ratio >= 4.5} label="AA normal text" need="4.5:1" />
        <Pass ok={ratio >= 3} label="AA large text" need="3:1" />
        <Pass ok={ratio >= 7} label="AAA normal text" need="7:1" />
        <Pass ok={ratio >= 4.5} label="AAA large text" need="4.5:1" />
        <Pass ok={ratio >= 3} label="UI parts and icons (AA)" need="3:1" />
      </ul>
    </div>
  );
}

const presets = [
  { label: 'Light grey hint', fg: '#b4b9c3', bg: '#ffffff' },
  { label: 'Grey placeholder', fg: '#9ca3af', bg: '#ffffff' },
  { label: 'White on brand green', fg: '#ffffff', bg: '#1f7a4d' },
  { label: 'White on orange', fg: '#ffffff', bg: '#f59e0b' },
  { label: 'Dark mode body', fg: '#e5e7eb', bg: '#111827' },
];

/** Standalone contrast checker with a few realistic presets. */
export default function ContrastChecker() {
  const [fg, setFg] = useState('#767676');
  const [bg, setBg] = useState('#ffffff');
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🎨 Contrast checker</p>
        <p className="text-sm text-muted">Pick two colors and see if the pair passes WCAG. Try the presets: they are real color pairs testers report all the time.</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setFg(p.fg);
                setBg(p.bg);
              }}
              className="flex items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-muted hover:text-fg"
            >
              <span className="size-3 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }} aria-hidden="true" />
              {p.label}
            </button>
          ))}
        </div>
        <ContrastPanel fg={fg} bg={bg} setFg={setFg} setBg={setBg} />
      </div>
    </div>
  );
}
