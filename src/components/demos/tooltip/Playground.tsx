import { useRef, useState } from 'react';
import { Archive, BellOff, Check, Clock, ListChecks, MailOpen, Trash2, Volume2, X } from 'lucide-react';
import { Tooltip, useAnnouncer } from './Tooltip';

/*
 * Tooltip lab: a mail app toolbar with correct tooltips that the learner can break on purpose.
 *  - Show delay: 0 / 400 / 1000 ms (hover only; keyboard focus always shows immediately)
 *  - Hoverable: can the pointer move onto the tooltip without it disappearing?
 *  - Esc closes: on/off
 *  - Edge handling: on (shift / flip to stay inside the frame) vs off (clipped at the edges)
 * A live WCAG 1.4.13 check, a "screen reader would say" panel and an event log.
 */

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

const TOOLS = [
  { label: 'Archive', tip: 'Archive (E)', icon: Archive },
  { label: 'Delete', tip: 'Delete (#)', icon: Trash2 },
  { label: 'Mark as unread', tip: 'Mark as unread (U)', icon: MailOpen },
  { label: 'Mute', tip: 'Mute this conversation. New replies skip your inbox.', icon: BellOff },
  { label: 'Snooze', tip: 'Snooze until tomorrow, 8:00', icon: Clock },
];

export default function Playground() {
  const [delay, setDelay] = useState<'0' | '400' | '1000'>('400');
  const [hoverable, setHoverable] = useState<'on' | 'off'>('on');
  const [esc, setEsc] = useState<'on' | 'off'>('on');
  const [edge, setEdge] = useState<'on' | 'off'>('on');
  const [said, setSaid] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  useAnnouncer(root, setSaid);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 5));

  const checks = [
    { ok: esc === 'on', name: 'Dismissible', text: esc === 'on' ? 'Esc hides it without moving the pointer or focus.' : 'Esc does nothing. The tooltip covers the content below.' },
    { ok: hoverable === 'on', name: 'Hoverable', text: hoverable === 'on' ? 'You can move the pointer onto it (e.g. to zoom in on it).' : 'It vanishes when the pointer moves towards it.' },
    { ok: true, name: 'Persistent', text: 'Stays until the pointer leaves, focus moves or Esc. No timer.' },
  ];

  return (
    <div ref={root} className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:grid-cols-4">
        <Seg label="Hover delay" value={delay} onChange={setDelay} options={[{ v: '0', l: '0' }, { v: '400', l: '400 ms' }, { v: '1000', l: '1 s' }]} />
        <Seg label="Hoverable" value={hoverable} onChange={setHoverable} options={[{ v: 'on', l: 'On' }, { v: 'off', l: 'Off' }]} />
        <Seg label="Esc closes" value={esc} onChange={setEsc} options={[{ v: 'on', l: 'On' }, { v: 'off', l: 'Off' }]} />
        <Seg label="Edge handling" value={edge} onChange={setEdge} options={[{ v: 'on', l: 'On' }, { v: 'off', l: 'Off' }]} />
      </div>

      <div className="bg-[#e9ebf2] px-3 py-6 sm:px-6" style={{ colorScheme: 'light' }}>
        <div data-tooltip-boundary className="relative mx-auto max-w-[420px] overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 px-1.5 py-1.5 text-[#3c4150]">
            {TOOLS.map((t) => (
              <Tooltip
                key={`${t.label}-${edge}`}
                text={t.tip}
                placement="bottom"
                showDelay={Number(delay)}
                hoverable={hoverable === 'on'}
                escape={esc === 'on'}
                collision={edge === 'on'}
                describe={t.tip !== t.label && !t.tip.startsWith(`${t.label} (`)}
                onEvent={(s) => addLog(`${t.label}: ${s}`)}
              >
                {(p) => (
                  <button
                    type="button"
                    aria-label={t.label}
                    {...p}
                    className="grid size-11 place-items-center rounded-lg outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
                  >
                    <t.icon size={19} aria-hidden="true" />
                  </button>
                )}
              </Tooltip>
            ))}
          </div>
          <div className="space-y-1 px-4 pt-3 pb-5">
            <p className="text-[15px] font-semibold">Your order has shipped</p>
            <p className="text-[12px] text-[#5a5f70]">Nordic Home &lt;orders@nordic.example&gt; · 09:14</p>
            <p className="pt-2 text-[14px] leading-relaxed text-[#3c4150]">Hi Anna, good news: order #4821 is on its way. Track it with DHL using the code JJD0099 1234 5678.</p>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-[420px] text-center text-[12px] text-[#5a5f70]">Mouse: hover · Keyboard: Tab, then Esc · Touch: press and hold</p>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-3">
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="text-xs font-semibold text-faint">WCAG 1.4.13 check</p>
          <ul className="mt-1 space-y-1.5">
            {checks.map((c) => (
              <li key={c.name} className="flex gap-2 text-sm">
                {c.ok ? <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Pass" /> : <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Fail" />}
                <span className="min-w-0">
                  <strong className="text-fg">{c.name}.</strong> <span className="text-muted">{c.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader would say
          </p>
          <p className="mt-1 text-sm text-fg" aria-live="polite">
            {said ? `“${said}”` : 'Tab to a toolbar button to hear it…'}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <ListChecks size={14} /> Event log
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {log.length === 0 && <li>Hover, Tab or long-press a button.</li>}
            {log.map((s, i) => (
              <li key={i} className={i === 0 ? 'text-fg' : ''}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
        Things to try: turn <strong>Edge handling</strong> off and hover <strong>Archive</strong> and <strong>Snooze</strong> at the edges. Turn <strong>Hoverable</strong> off and try to move the pointer onto the long <strong>Mute</strong> tooltip. Set the delay to <strong>0</strong> and sweep the mouse across the toolbar: tooltips flash on and off. Tab to a button: keyboard focus never waits for the delay.
      </p>
    </div>
  );
}
