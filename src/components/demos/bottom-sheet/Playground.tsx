import { useEffect, useRef, useState } from 'react';
import { Check, Delete, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Sheet, type CloseHow } from './Sheet';

/*
 * Sheet lab: switch good behaviors off one at a time and feel the difference.
 *  - Scroll before drag (nested scrolling)
 *  - Move above the keyboard
 *  - Ask before discarding changes
 */

const OPTIONS = ['Leave at the door', 'Hand it to me', 'Leave with a neighbor', 'Leave at reception', 'Call me on arrival', 'Text me on arrival', 'Don’t ring the bell', 'Ring the bell twice', 'Use the side entrance', 'Beware of the dog', 'Leave in the parcel box', 'Knock quietly (baby asleep)'];
const ROWS = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']];

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-w-0 items-start justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 shrink-0 accent-[var(--brand)]" />
    </label>
  );
}

export default function Playground() {
  const [nested, setNested] = useState(true);
  const [avoid, setAvoid] = useState(true);
  const [protect, setProtect] = useState(true);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState({ option: 'Leave at the door', note: '' });
  const [draft, setDraft] = useState(saved);
  const [kb, setKb] = useState(false);
  const [kbH, setKbH] = useState(220);
  const [confirm, setConfirm] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const screen = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLInputElement>(null);
  const closeRef = useRef<((how: CloseHow) => void) | null>(null);
  const allowClose = useRef(false);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 5));
  const dirty = draft.option !== saved.option || draft.note !== saved.note;

  useEffect(() => {
    if (!open) {
      setKb(false);
      setConfirm(false);
    }
  }, [open]);

  const openSheet = () => {
    setDraft(saved);
    allowClose.current = false;
    setOpen(true);
    addLog('Opened at medium height');
  };

  const focusNote = () => {
    const h = screen.current?.clientHeight ?? 500;
    setKbH(Math.round(h * 0.4));
    setKb(true);
  };

  const onClose = (how: CloseHow) => {
    setOpen(false);
    if (how === 'button') return;
    const label = { swipe: 'Swiped down', scrim: 'Tapped outside', esc: 'Cancel / Esc' }[how];
    if (allowClose.current) addLog(`${label} → discarded after confirming`);
    else if (dirty) addLog(`${label} → your changes were LOST without warning`);
    else addLog(`${label} → closed, nothing changed`);
  };

  const beforeDismiss = () => {
    if (allowClose.current || !protect || !dirty) return true;
    setKb(false);
    note.current?.blur();
    setConfirm(true);
    addLog('Blocked: asked “Discard changes?”');
    return false;
  };

  const save = () => {
    setSaved(draft);
    allowClose.current = true;
    addLog(`Saved: “${draft.option}”${draft.note ? ` + note` : ''}`);
    closeRef.current?.('button');
  };

  const typeKey = (k: string) => setDraft((d) => ({ ...d, note: k === '⌫' ? d.note.slice(0, -1) : (d.note + k).slice(0, 60) }));

  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-5 rounded-3xl border border-line bg-surface p-4 sm:p-6 md:grid-cols-[auto_1fr]">
      <div className="mx-auto" style={{ colorScheme: 'light' }}>
        <PhoneFrame width={270}>
          <div ref={screen} className="absolute inset-0 overflow-hidden bg-[#f2f2f7] text-black">
            <div className="h-full p-4" inert={open}>
              <p className="text-[24px] font-bold">Checkout</p>
              <div className="mt-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-white text-[14px]">
                <div className="flex justify-between px-3 py-2.5">
                  <span>Burger Lab</span>
                  <span>€14.50</span>
                </div>
                <button ref={trigger} type="button" onClick={openSheet} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left outline-none focus-visible:bg-black/5">
                  <span className="shrink-0">Delivery</span>
                  <span className="truncate text-[#007aff]">{saved.option}</span>
                </button>
                {saved.note && <p className="truncate px-3 py-2 text-[12px] text-black/55">Note: {saved.note}</p>}
              </div>
              <p className="mt-3 text-[12px] text-black/50">Tap “Delivery” to open the sheet.</p>
            </div>

            {open && (
              <Sheet
                id="lab-sheet"
                title="Delivery instructions"
                detents={[0.55, 0.93]}
                contentDrag={nested ? 'nested' : 'sheet'}
                bottomInset={kb && avoid ? kbH : 0}
                returnFocus={trigger}
                closeRef={closeRef}
                onBeforeDismiss={beforeDismiss}
                onClose={onClose}
                onDetentChange={(_, l) => addLog(`Dragged to ${l}`)}
                showTitle={false}
                header={
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pb-2">
                    <button type="button" onClick={() => closeRef.current?.('esc')} className="justify-self-start rounded px-1 text-[15px] text-[#007aff] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]">
                      Cancel
                    </button>
                    <p id="lab-sheet-title" className="text-[15px] font-semibold">
                      Delivery
                    </p>
                    <span />
                  </div>
                }
                footer={
                  <div className="space-y-2 border-t border-black/10 bg-white p-3">
                    <input
                      ref={note}
                      value={draft.note}
                      onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                      onFocus={focusNote}
                      onBlur={() => setKb(false)}
                      placeholder="Note for the courier"
                      aria-label="Note for the courier"
                      className="h-10 w-full rounded-lg bg-[#f2f2f7] px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#007aff]"
                    />
                    <button type="button" onClick={save} className="h-10 w-full rounded-lg bg-[#007aff] text-[15px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2">
                      Save
                    </button>
                  </div>
                }
              >
                <ul role="radiogroup" aria-label="Where to leave it" className="mx-3 mb-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-[#f2f2f7] text-[14px]">
                  {OPTIONS.map((o) => (
                    <li key={o}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={draft.option === o}
                        onClick={() => setDraft((d) => ({ ...d, option: o }))}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left outline-none focus-visible:bg-black/5"
                      >
                        {o}
                        {draft.option === o && <Check size={16} className="text-[#007aff]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </Sheet>
            )}

            {open && kb && (
              <div className="absolute inset-x-0 bottom-0 z-50 flex flex-col justify-center gap-1.5 bg-[#d1d3d9] px-1 pb-4" style={{ height: kbH }} onMouseDown={(e) => e.preventDefault()} aria-hidden="true">
                {ROWS.map((r, i) => (
                  <div key={i} className="flex justify-center gap-1">
                    {r.map((k) => (
                      <span key={k} onClick={() => typeKey(k)} className="grid h-8 w-[22px] cursor-pointer place-items-center rounded-[5px] bg-white text-[14px] shadow-[0_1px_0_rgba(0,0,0,.3)]">
                        {k}
                      </span>
                    ))}
                    {i === 2 && (
                      <span onClick={() => typeKey('⌫')} className="grid h-8 w-8 cursor-pointer place-items-center rounded-[5px] bg-[#adb1b9]">
                        <Delete size={14} />
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex justify-center gap-1 px-2">
                  <span onClick={() => typeKey(' ')} className="h-8 flex-1 cursor-pointer rounded-[5px] bg-white shadow-[0_1px_0_rgba(0,0,0,.3)]" />
                  <span onClick={() => note.current?.blur()} className="grid h-8 cursor-pointer place-items-center rounded-[5px] bg-[#007aff] px-3 text-[13px] text-white">
                    done
                  </span>
                </div>
              </div>
            )}

            {confirm && (
              <div className="absolute inset-0 z-[60] grid place-items-center bg-black/30 p-6">
                <div role="alertdialog" aria-modal="true" aria-labelledby="lab-discard-t" className="w-full max-w-[230px] overflow-hidden rounded-[14px] bg-white/95 text-center backdrop-blur">
                  <p id="lab-discard-t" className="px-4 pt-4 text-[16px] font-semibold">
                    Discard changes?
                  </p>
                  <p className="px-4 pt-1 pb-3 text-[12px] text-black/60">Your delivery choice hasn’t been saved.</p>
                  <div className="grid grid-cols-2 border-t border-black/10 text-[16px]">
                    <button type="button" autoFocus onClick={() => setConfirm(false)} className="py-2.5 font-semibold text-[#007aff] outline-none focus-visible:bg-black/5">
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        allowClose.current = true;
                        setConfirm(false);
                        closeRef.current?.('esc');
                      }}
                      className="border-l border-black/10 py-2.5 text-[#ff3b30] outline-none focus-visible:bg-black/5"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>

      <div className="min-w-0 space-y-3">
        <p className="text-sm text-muted">
          Open the sheet, change the option, then try to close it every way. Drag the <strong>list</strong>, not just the grabber. Tap the note field to bring up the keyboard. Then switch a behavior off and repeat.
        </p>
        <Toggle label="Scroll before drag" hint="Dragging the list scrolls it. Only at the top does it move the sheet." checked={nested} onChange={setNested} />
        <Toggle label="Move above the keyboard" hint="The sheet rises so the note field and Save stay visible." checked={avoid} onChange={setAvoid} />
        <Toggle label="Ask before discarding" hint="Swipe, tap outside and Cancel ask first if you changed something." checked={protect} onChange={setProtect} />
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">What happened</p>
            <button type="button" onClick={() => setLog([])} className="flex items-center gap-1 text-xs text-muted hover:text-fg">
              <RotateCcw size={12} /> Clear
            </button>
          </div>
          <ul className="mt-1 space-y-0.5 text-sm" aria-live="polite">
            {log.length === 0 && <li className="text-muted">Nothing yet.</li>}
            {log.map((s, i) => (
              <li key={i} className={s.includes('LOST') ? 'font-medium text-danger' : i === 0 ? 'text-fg' : 'text-muted'}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
