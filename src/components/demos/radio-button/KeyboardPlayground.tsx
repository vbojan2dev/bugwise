import { useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import { Radio } from './Radio';

const SEATS = [
  { v: 'window', l: 'Window' },
  { v: 'aisle', l: 'Aisle' },
  { v: 'middle', l: 'Middle' },
];

interface Entry {
  id: number;
  key: string;
  text: string;
}

export default function KeyboardPlayground() {
  const id = useId();
  const [noDefault, setNoDefault] = useState(false);
  const [seat, setSeat] = useState('aisle');
  const [log, setLog] = useState<Entry[]>([]);
  const lastKey = useRef<string | null>(null);
  const nextId = useRef(1);

  const push = (key: string, text: string) => setLog((l) => [{ id: nextId.current++, key, text }, ...l].slice(0, 7));

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key === ' ' ? 'Space' : e.key;
    if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(k)) {
      lastKey.current = e.shiftKey && k === 'Tab' ? 'Shift+Tab' : k;
    }
  };
  const describe = (el: HTMLElement) => {
    if (el instanceof HTMLInputElement && el.type === 'radio') return `radio "${SEATS.find((s) => s.v === el.value)?.l}"${el.checked ? ' (selected)' : ''}`;
    return el.dataset.desc ?? el.tagName.toLowerCase();
  };
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const k = lastKey.current ?? 'Click';
    lastKey.current = null;
    push(k, `focus → ${describe(e.target as HTMLElement)}`);
  };
  const select = (v: string) => {
    setSeat(v);
    push(lastKey.current ?? '↳', `selected "${SEATS.find((s) => s.v === v)?.l}"`);
  };
  const reset = (empty = noDefault) => {
    setSeat(empty ? '' : 'aisle');
    setLog([]);
  };

  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl border border-line bg-[#f9fafb] p-4 text-[14px] text-[#111827]" style={{ colorScheme: 'light' }}>
        <div className="space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4" onKeyDownCapture={onKeyDown} onMouseDownCapture={() => (lastKey.current = 'Click')} onFocusCapture={onFocus}>
          <div>
            <label htmlFor={`${id}-name`} className="mb-1 block text-[13px] font-medium">
              Passenger name
            </label>
            <input id={`${id}-name`} data-desc='text field "Passenger name"' defaultValue="Ana Silva" className="w-full min-w-0 rounded-lg border border-[#d1d5db] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]" />
          </div>
          <fieldset>
            <legend className="text-[13px] font-medium">Seat preference</legend>
            {SEATS.map((s) => (
              <Radio key={s.v} platform="web" name={`${id}-seat`} value={s.v} label={s.l} checked={seat === s.v} onSelect={select} />
            ))}
          </fieldset>
          <button type="button" data-desc='button "Continue"' className="w-full rounded-lg bg-[#2563eb] py-2.5 font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:outline-none">
            Continue
          </button>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-[#374151]">
          <input
            type="checkbox"
            checked={noDefault}
            onChange={(e) => {
              setNoDefault(e.target.checked);
              reset(e.target.checked);
            }}
            className="accent-[#2563eb]"
          />
          Start with nothing selected
        </label>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <p className="flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
              <Keyboard size={13} aria-hidden="true" /> Key log
            </p>
            <button type="button" onClick={() => reset()} className="flex items-center gap-1 font-sans text-[11px] text-white/50 hover:text-white">
              <RotateCcw size={11} /> Reset
            </button>
          </div>
          <ul className="min-h-[9.5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Click "Passenger name", then press Tab…</li>}
            {log.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className="w-[4.5rem] shrink-0 text-[#c4b5fd]">{e.key}</span>
                <span className="min-w-0 break-words">{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="space-y-1.5 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          <li>
            <strong className="text-fg">Tab</strong> enters the group <em>once</em>, on the selected radio (or the first one if nothing is selected).
          </li>
          <li>
            <strong className="text-fg">Arrow keys</strong> move focus <em>and</em> selection inside the group, and wrap around.
          </li>
          <li>
            <strong className="text-fg">Tab</strong> again leaves the group and goes to Continue.
          </li>
          <li>
            <strong className="text-fg">Space</strong> selects the focused radio if none is selected yet.
          </li>
        </ul>
      </div>
    </div>
  );
}
