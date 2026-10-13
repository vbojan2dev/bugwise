import { useState, type ReactNode } from 'react';
import { ArrowLeft, Contrast, FastForward, Megaphone, Moon, Power, RotateCw, Smartphone, Speech, Type } from 'lucide-react';
import { PRIORITIES, SCREEN_LABEL, SEVERITIES, type Priority, type Screen, type Severity } from '@/lib/capstone';
import type { LogEntry, Net } from './types';

const card = 'rounded-2xl border border-line bg-surface p-3';
const heading = 'text-xs font-semibold tracking-wide text-faint uppercase';

function Toggle({ label, icon, checked, onChange }: { label: string; icon: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-sm">
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--brand)]" />
    </label>
  );
}

const btn = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-subtle disabled:opacity-45';

export function DevicePanel(p: {
  landscape: boolean;
  setLandscape: (v: boolean) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  grayscale: boolean;
  setGrayscale: (v: boolean) => void;
  sr: boolean;
  setSr: (v: boolean) => void;
  net: Net;
  setNet: (n: Net) => void;
  appState: 'active' | 'background' | 'closed';
  onBack: () => void;
  onBackground: () => void;
  onReturn: () => void;
  onClose: () => void;
  onSkip: (min: number) => void;
  onPromo: () => void;
}) {
  const nets: [Net, string][] = [
    ['wifi', 'Wi-Fi'],
    ['slow', 'Slow'],
    ['offline', 'Offline'],
  ];
  return (
    <div className={card}>
      <p className={heading}>Device controls</p>
      <div className="mt-2 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        <Toggle label="Landscape" icon={<RotateCw size={15} />} checked={p.landscape} onChange={p.setLandscape} />
        <Toggle label="Dark mode" icon={<Moon size={15} />} checked={p.dark} onChange={p.setDark} />
        <Toggle label="Large text" icon={<Type size={15} />} checked={p.largeText} onChange={p.setLargeText} />
        <Toggle label="Grayscale" icon={<Contrast size={15} />} checked={p.grayscale} onChange={p.setGrayscale} />
        <Toggle label="Screen reader preview" icon={<Speech size={15} />} checked={p.sr} onChange={p.setSr} />
      </div>
      <fieldset className="mt-3">
        <legend className="mb-1 text-sm font-medium text-muted">Network</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1">
          {nets.map(([id, label]) => (
            <label key={id} className={`cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium ${p.net === id ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>
              <input type="radio" name="fd-net" className="sr-only" checked={p.net === id} onChange={() => p.setNet(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 mb-1 text-sm font-medium text-muted">App and system</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={p.onBack} disabled={p.appState !== 'active'}>
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
        {p.appState === 'active' ? (
          <button type="button" className={btn} onClick={p.onBackground}>
            <Smartphone size={15} aria-hidden="true" /> Send to background
          </button>
        ) : (
          <button type="button" className={btn} onClick={p.onReturn}>
            <Smartphone size={15} aria-hidden="true" /> {p.appState === 'closed' ? 'Open app' : 'Return to app'}
          </button>
        )}
        <button type="button" className={btn} onClick={p.onClose} disabled={p.appState === 'closed'}>
          <Power size={15} aria-hidden="true" /> Close app completely
        </button>
      </div>
      <p className="mt-3 mb-1 text-sm font-medium text-muted">Let time pass</p>
      <div className="flex flex-wrap gap-2">
        {[1, 5, 15].map((m) => (
          <button key={m} type="button" className={btn} onClick={() => p.onSkip(m)}>
            <FastForward size={15} aria-hidden="true" /> +{m} min
          </button>
        ))}
      </div>
      <p className="mt-3 mb-1 text-sm font-medium text-muted">Push test console</p>
      <button type="button" className={btn} onClick={p.onPromo}>
        <Megaphone size={15} aria-hidden="true" /> Marketing sends a promo push
      </button>
      <p className="mt-2 text-xs text-faint">Order-status pushes arrive on their own while an order is on its way. Tap a notification on the banner or the lock screen to open it.</p>
    </div>
  );
}

export function ScreenReaderPanel({ on, lines }: { on: boolean; lines: string[] }) {
  return (
    <div className={card}>
      <p className={heading}>Screen reader preview</p>
      {!on ? (
        <p className="mt-1.5 text-sm text-muted">Turn on “Screen reader preview”, then tap or Tab to elements in the app to hear what VoiceOver would announce.</p>
      ) : lines.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted">Tap any element in the app…</p>
      ) : (
        <ol className="mt-1.5 space-y-1 text-sm" aria-live="polite">
          {lines.map((l, i) => (
            <li key={i} className={i === 0 ? 'font-medium text-fg' : 'text-faint'}>
              “{l}”
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function NetworkLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
      <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/55 uppercase">Network log</p>
      <ul className="max-h-[220px] min-h-[5.5rem] space-y-1 overflow-y-auto px-3 py-2">
        {log.length === 0 && <li className="text-white/60">API requests will show up here…</li>}
        {log.map((e) => (
          <li key={e.id} className="flex items-center gap-2">
            <span className="w-11 shrink-0 text-[#7dd3fc]">{e.method}</span>
            <span className="min-w-0 flex-1 truncate" title={e.path}>
              {e.path}
            </span>
            {e.status === 'pending' ? (
              <span className="shrink-0 text-[#fbbf24]">pending…</span>
            ) : e.status === 'ERR' ? (
              <span className="shrink-0 text-[#f87171]">ERR offline</span>
            ) : (
              <span className={`shrink-0 ${e.status >= 400 ? 'text-[#f87171]' : 'text-[#34d399]'}`}>
                {e.status} · {(e.ms / 1000).toFixed(1)}s
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SCREENS: Screen[] = ['login', 'home', 'menu', 'cart', 'checkout', 'tracking', 'profile', 'any'];

export interface ReportDraft {
  screen: Screen;
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
  priority: Priority;
}

export function ReportForm({ initialScreen, onSubmit, onCancel }: { initialScreen: Screen; onSubmit: (r: ReportDraft) => void; onCancel: () => void }) {
  const [r, setR] = useState<ReportDraft>({ screen: initialScreen, title: '', steps: '', expected: '', actual: '', severity: 'major', priority: 'P2' });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof ReportDraft>(k: K, v: ReportDraft[K]) => setR((x) => ({ ...x, [k]: v }));
  const missing = !r.title.trim() || !r.actual.trim();
  const field = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand';
  const lbl = 'mb-1 block text-sm font-medium';
  return (
    <form
      className={`${card} space-y-3`}
      aria-label="Bug report"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!missing) onSubmit(r);
      }}
    >
      <p className="text-base font-semibold">New bug report</p>
      <div>
        <label htmlFor="fd-r-title" className={lbl}>
          Title <span className="text-danger">*</span>
        </label>
        <input id="fd-r-title" className={field} value={r.title} onChange={(e) => set('title', e.target.value)} placeholder="Short summary: what is wrong, where" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="fd-r-screen" className={lbl}>
            Screen
          </label>
          <select id="fd-r-screen" className={field} value={r.screen} onChange={(e) => set('screen', e.target.value as Screen)}>
            {SCREENS.map((s) => (
              <option key={s} value={s}>
                {SCREEN_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="fd-r-sev" className={lbl}>
            Severity
          </label>
          <select id="fd-r-sev" className={field} value={r.severity} onChange={(e) => set('severity', e.target.value as Severity)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="fd-r-pri" className={lbl}>
            Priority
          </label>
          <select id="fd-r-pri" className={field} value={r.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
            {PRIORITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="fd-r-steps" className={lbl}>
          Steps to reproduce
        </label>
        <textarea id="fd-r-steps" rows={4} className={field} value={r.steps} onChange={(e) => set('steps', e.target.value)} placeholder={'1. Log in as the test account\n2. …\n3. …'} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="fd-r-exp" className={lbl}>
            Expected result
          </label>
          <textarea id="fd-r-exp" rows={3} className={field} value={r.expected} onChange={(e) => set('expected', e.target.value)} />
        </div>
        <div className="min-w-0">
          <label htmlFor="fd-r-act" className={lbl}>
            Actual result <span className="text-danger">*</span>
          </label>
          <textarea id="fd-r-act" rows={3} className={field} value={r.actual} onChange={(e) => set('actual', e.target.value)} />
        </div>
      </div>
      {tried && missing && (
        <p role="alert" className="text-sm text-danger">
          Add at least a title and the actual result.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg">
          Save report
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}
