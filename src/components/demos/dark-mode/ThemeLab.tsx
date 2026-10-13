import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Moon, Search, Send, Sun, X } from 'lucide-react';
import { contrastRatio } from './contrast';

/*
 * Theme lab: one sample wallet screen rendered in a light and a dark theme side by side.
 * The learner flips the system appearance, the in-app setting and "Increase contrast",
 * sees which theme the user would actually get, and measures contrast on chosen elements.
 * The default tokens contain realistic flaws on purpose (a grey caption reused in both themes,
 * a bright blue button with white text, a faint field border in dark) so the checker finds something.
 */

type Mode = 'light' | 'dark';
type AppSetting = 'system' | 'light' | 'dark';
interface Tokens {
  bg: string;
  card: string;
  text: string;
  caption: string;
  accent: string;
  btnBg: string;
  btnText: string;
  border: string;
}
type TokenKey = keyof Tokens;

const LIGHT: Tokens = { bg: '#ffffff', card: '#f2f2f7', text: '#111111', caption: '#6b7280', accent: '#0066cc', btnBg: '#0066cc', btnText: '#ffffff', border: '#8e8e93' };
const DARK: Tokens = { bg: '#000000', card: '#1c1c1e', text: '#f5f5f7', caption: '#6b7280', accent: '#0a84ff', btnBg: '#0a84ff', btnText: '#ffffff', border: '#3a3a3c' };
const LIGHT_HC: Tokens = { ...LIGHT, caption: '#3f3f46', accent: '#004c99', btnBg: '#004c99', border: '#3a3a3c' };
const DARK_HC: Tokens = { ...DARK, caption: '#c7c7cc', accent: '#409cff', btnBg: '#409cff', btnText: '#000000', border: '#8e8e93' };

interface Element {
  id: string;
  label: string;
  fg: TokenKey;
  bg: TokenKey;
  min: number;
  kind: string;
}
const ELEMENTS: Element[] = [
  { id: 'body', label: 'Balance text', fg: 'text', bg: 'card', min: 4.5, kind: 'Text' },
  { id: 'caption', label: 'Caption', fg: 'caption', bg: 'bg', min: 4.5, kind: 'Text' },
  { id: 'link', label: 'See all link', fg: 'accent', bg: 'bg', min: 4.5, kind: 'Text' },
  { id: 'button', label: 'Button label', fg: 'btnText', bg: 'btnBg', min: 4.5, kind: 'Text' },
  { id: 'border', label: 'Field border', fg: 'border', bg: 'bg', min: 3, kind: 'UI part' },
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string; icon?: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniScreen({ t, mode, picked, active }: { t: Tokens; mode: Mode; picked: string; active: boolean }) {
  const ring = (id: string): CSSProperties => (picked === id ? { outline: '2px dashed #f59e0b', outlineOffset: 2, borderRadius: 4 } : {});
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-center justify-between gap-1 text-xs font-medium text-muted">
        <span className="flex items-center gap-1">
          {mode === 'light' ? <Sun size={13} /> : <Moon size={13} />} {mode === 'light' ? 'Light theme' : 'Dark theme'}
        </span>
        {active && <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">On screen</span>}
      </figcaption>
      <div
        className={`overflow-hidden rounded-[22px] border-[5px] ${active ? 'border-[#0c0d12]' : 'border-[#0c0d12]/40'}`}
        style={{ background: t.bg, color: t.text, colorScheme: mode }}
        aria-label={`Wallet screen in ${mode} theme`}
      >
        <div className="flex items-center justify-between px-3 pt-1.5 text-[9px] font-semibold" style={{ color: t.text }}>
          <span>9:41</span>
          <span className="h-[7px] w-[14px] rounded-[2px] border border-current p-[1px]">
            <span className="block h-full w-3/4 rounded-[1px] bg-current" />
          </span>
        </div>
        <div className="space-y-2 px-2.5 pt-2 pb-3">
          <div>
            <p className="text-[15px] leading-tight font-bold">Wallet</p>
            <p className="text-[10px]" style={{ color: t.caption, ...ring('caption') }}>
              Updated 2 min ago
            </p>
          </div>
          <div className="rounded-xl p-2" style={{ background: t.card }}>
            <p className="text-[9px] opacity-70">Balance</p>
            <p className="text-[15px] font-semibold tracking-tight" style={{ color: t.text, ...ring('body') }}>
              €2,480.15
            </p>
          </div>
          <div className="flex h-6 items-center gap-1 rounded-md border px-1.5 text-[9px]" style={{ borderColor: t.border, color: t.caption, ...ring('border') }}>
            <Search size={10} /> Search payments
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold">Recent</span>
            <span className="font-medium" style={{ color: t.accent, ...ring('link') }}>
              See all
            </span>
          </div>
          <div className="flex h-7 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold" style={{ background: t.btnBg, color: t.btnText, ...ring('button') }}>
            <Send size={11} /> Send money
          </div>
        </div>
      </div>
    </figure>
  );
}

function Swatch({ c }: { c: string }) {
  return <span className="inline-block size-3.5 shrink-0 rounded border border-line align-middle" style={{ background: c }} />;
}

export default function ThemeLab() {
  const [system, setSystem] = useState<Mode>('light');
  const [app, setApp] = useState<AppSetting>('system');
  const [hc, setHc] = useState(false);
  const [picked, setPicked] = useState('caption');

  const resolved: Mode = app === 'system' ? system : app;
  const light = hc ? LIGHT_HC : LIGHT;
  const dark = hc ? DARK_HC : DARK;
  const el = ELEMENTS.find((e) => e.id === picked) ?? ELEMENTS[0];

  const why =
    app === 'system'
      ? `The in-app setting is "System", so the app follows the phone: ${system}.`
      : `The in-app setting "${app === 'light' ? 'Light' : 'Dark'}" overrides the phone's ${system} appearance.`;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-3">
        <Seg
          label="Phone appearance"
          value={system}
          onChange={setSystem}
          options={[
            { v: 'light', label: 'Light', icon: <Sun size={13} /> },
            { v: 'dark', label: 'Dark', icon: <Moon size={13} /> },
          ]}
        />
        <Seg
          label="In-app setting"
          value={app}
          onChange={setApp}
          options={[
            { v: 'system', label: 'System' },
            { v: 'light', label: 'Light' },
            { v: 'dark', label: 'Dark' },
          ]}
        />
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Accessibility</p>
          <button
            type="button"
            role="switch"
            aria-checked={hc}
            onClick={() => setHc((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-subtle px-2.5 py-1.5 text-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-brand"
          >
            Increase contrast
            <span className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${hc ? 'bg-ok' : 'bg-line-strong'}`}>
              <span className="absolute top-[2px] left-[2px] size-[14px] rounded-full bg-white shadow transition-transform" style={{ transform: hc ? 'translateX(12px)' : 'none' }} />
            </span>
          </button>
        </div>
      </div>

      <p className="border-b border-line bg-subtle px-4 py-2.5 text-sm text-muted" aria-live="polite">
        The user sees the <strong className="text-fg">{resolved} theme</strong>. {why}
      </p>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <MiniScreen t={light} mode="light" picked={picked} active={resolved === 'light'} />
          <MiniScreen t={dark} mode="dark" picked={picked} active={resolved === 'dark'} />
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Contrast checker</p>
          <div role="radiogroup" aria-label="Element to measure" className="flex flex-wrap gap-1.5">
            {ELEMENTS.map((e) => (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={picked === e.id}
                onClick={() => setPicked(e.id)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand ${picked === e.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {(['light', 'dark'] as Mode[]).map((m) => {
              const t = m === 'light' ? light : dark;
              const r = contrastRatio(t[el.fg], t[el.bg]);
              const pass = r >= el.min;
              return (
                <div key={m} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                  <span className="w-11 shrink-0 text-xs font-medium text-muted capitalize">{m}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 font-mono text-[11px] text-muted">
                    <Swatch c={t[el.fg]} /> {t[el.fg]} <span aria-hidden="true">on</span>
                    <span className="sr-only">on</span> <Swatch c={t[el.bg]} /> {t[el.bg]}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold text-fg">{r.toFixed(2)}:1</span>
                  <span className={`flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${pass ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
                    {pass ? <Check size={12} /> : <X size={12} />} {pass ? 'Pass' : 'Fail'}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {el.kind}: WCAG AA needs at least <strong className="text-fg">{el.min}:1</strong>
            {el.min === 3 ? ' for borders and icons people need to see to use a control.' : ' for normal-size text.'} The dashed outline shows the measured element.
          </p>
        </div>
      </div>
    </div>
  );
}
