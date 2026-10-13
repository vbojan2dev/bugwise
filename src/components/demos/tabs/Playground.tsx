import { useRef, useState, type KeyboardEvent } from 'react';
import { Keyboard, Volume2 } from 'lucide-react';

/*
 * Tabs lab: a correct web tablist that the learner can configure.
 *  - Activation: automatic (arrows select) vs manual (arrows move focus, Enter/Space selects)
 *  - Language: English vs German (longer labels)
 *  - Layout: fixed (equal widths, truncation) vs scrollable
 *  - Width: phone vs wide
 * Shows what a screen reader would announce and a log of keys pressed.
 */

const LABELS = {
  en: ['Overview', 'Specs', 'Reviews', 'Q&A'],
  de: ['Übersicht', 'Technische Daten', 'Bewertungen', 'Fragen und Antworten'],
};
const BODY = {
  en: ['Lightweight 14" laptop, 1.2 kg, 18 h battery.', 'CPU 10-core · 16 GB RAM · 512 GB SSD · USB-C ×2', '4.5 / 5 from 312 reviews.', '27 answered questions. Ask your own.'],
  de: ['Leichtes 14"-Notebook, 1,2 kg, 18 h Akku.', 'CPU 10 Kerne · 16 GB RAM · 512 GB SSD · USB-C ×2', '4,5 / 5 aus 312 Bewertungen.', '27 beantwortete Fragen. Stellen Sie Ihre eigene.'],
};

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

export default function Playground() {
  const [manual, setManual] = useState<'auto' | 'manual'>('auto');
  const [lang, setLang] = useState<'en' | 'de'>('en');
  const [layout, setLayout] = useState<'fixed' | 'scroll'>('fixed');
  const [width, setWidth] = useState<'phone' | 'wide'>('phone');
  const [tab, setTab] = useState(0);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = LABELS[lang];
  const n = labels.length;

  const say = (i: number, selected: boolean) => `“${labels[i]}, tab, ${selected ? 'selected, ' : ''}${i + 1} of ${n}”`;
  const announce = focusIdx === null ? 'Tab into the tab row to hear it…' : say(focusIdx, focusIdx === tab);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 5));

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next >= 0) {
      e.preventDefault();
      refs.current[next]?.focus();
      if (manual === 'auto') {
        setTab(next);
        addLog(`${e.key} → focus and select “${labels[next]}”`);
      } else addLog(`${e.key} → focus “${labels[next]}” (not selected yet)`);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (manual === 'manual') {
        e.preventDefault();
        setTab(i);
        addLog(`${e.key === ' ' ? 'Space' : 'Enter'} → select “${labels[i]}”`);
      }
    }
    if (e.key === 'Tab') addLog(e.shiftKey ? 'Shift+Tab → leave the tab row' : 'Tab → into the selected panel');
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:grid-cols-4">
        <Seg label="Activation" value={manual} onChange={setManual} options={[{ v: 'auto', l: 'Automatic' }, { v: 'manual', l: 'Manual' }]} />
        <Seg label="Language" value={lang} onChange={setLang} options={[{ v: 'en', l: 'English' }, { v: 'de', l: 'Deutsch' }]} />
        <Seg label="Layout" value={layout} onChange={setLayout} options={[{ v: 'fixed', l: 'Fixed' }, { v: 'scroll', l: 'Scrollable' }]} />
        <Seg label="Width" value={width} onChange={setWidth} options={[{ v: 'phone', l: 'Phone' }, { v: 'wide', l: 'Wide' }]} />
      </div>

      <div className="bg-[#e9ebf2] px-3 py-6 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm transition-[max-width]" style={{ maxWidth: width === 'phone' ? 340 : 640 }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[17px] font-bold">Aero 14 laptop</p>
            <p className="text-[13px] text-black/55">€1,199</p>
          </div>
          <div role="tablist" aria-label="Product details" className={`flex border-b border-black/15 ${layout === 'scroll' ? 'overflow-x-auto' : ''}`}>
            {labels.map((l, i) => (
              <button
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                id={`lab-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === tab}
                aria-controls={`lab-panel-${i}`}
                tabIndex={i === tab ? 0 : -1}
                title={layout === 'fixed' ? l : undefined}
                onClick={() => {
                  setTab(i);
                  addLog(`Click → select “${l}”`);
                }}
                onKeyDown={(e) => onKeyDown(e, i)}
                onFocus={() => setFocusIdx(i)}
                onBlur={() => setFocusIdx(null)}
                className={`relative h-11 text-[13px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-inset ${
                  layout === 'fixed' ? 'min-w-0 flex-1 truncate px-2' : 'shrink-0 px-3'
                } ${i === tab ? 'text-[#2f6bff]' : 'text-black/60 hover:text-black'}`}
              >
                {l}
                {i === tab && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#2f6bff]" />}
              </button>
            ))}
          </div>
          {labels.map((l, i) => (
            <div key={i} id={`lab-panel-${i}`} role="tabpanel" aria-labelledby={`lab-tab-${i}`} hidden={i !== tab} tabIndex={0} className="min-h-[88px] p-4 text-[14px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-inset">
              {BODY[lang][i]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader would say
          </p>
          <p className="mt-1 text-sm text-fg" aria-live="polite">
            {announce}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Keyboard size={14} /> Key log
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {log.length === 0 && <li>Click a tab, then use ← → Home End{manual === 'manual' ? ' and Enter' : ''}.</li>}
            {log.map((s, i) => (
              <li key={i} className={i === 0 ? 'text-fg' : ''}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        Things to notice: in <strong>Deutsch + Fixed + Phone</strong> the labels are cut off. <strong>Scrollable</strong> fixes it, but the last tab hides off-screen. In <strong>Manual</strong> mode, arrows only move focus until you press Enter or Space.
      </p>
    </div>
  );
}
