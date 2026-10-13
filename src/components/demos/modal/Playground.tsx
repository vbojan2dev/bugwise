import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Monitor, Smartphone, X, ChevronRight } from 'lucide-react';
import { trapTab, WebButton } from './Dialogs';

/*
 * "Close it every way" playground: a web dialog whose behaviors can be switched on and off,
 * with an event log that shows what happened to focus, scrolling and typed data.
 * Everything is contained in the demo frame (absolute positioning only).
 */

interface Settings {
  esc: boolean;
  backdrop: boolean;
  trap: boolean;
  lock: boolean;
  returnFocus: boolean;
}
type Tone = 'ok' | 'bad' | 'info';
interface Entry {
  id: number;
  text: string;
  tone: Tone;
}

const restaurants = ['Pizza Roma', 'Sushi Kaito', 'Green Bowl', 'Taco Loco', 'Curry House', 'Burger Lab', 'Pho Saigon', 'Le Petit Café'];

const toggles: { key: keyof Settings; label: string; help: string }[] = [
  { key: 'esc', label: 'Esc closes', help: 'Press Esc while the dialog is open' },
  { key: 'backdrop', label: 'Click outside closes', help: 'Click the dark area' },
  { key: 'trap', label: 'Trap focus inside', help: 'Press Tab / Shift+Tab many times' },
  { key: 'lock', label: 'Lock background scroll', help: 'Scroll over the dialog' },
  { key: 'returnFocus', label: 'Return focus on close', help: 'Close, then press Tab' },
];

function Keyboard() {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-50 h-[42%] space-y-1.5 bg-[#d1d4db] px-1 pt-2">
      {rows.map((r) => (
        <div key={r} className="flex justify-center gap-1">
          {[...r].map((k) => (
            <span key={k} className="grid h-8 w-[8.4%] place-items-center rounded-[5px] bg-white text-[13px] text-black shadow-[0_1px_0_rgba(0,0,0,.3)]">
              {k}
            </span>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1 px-1">
        <span className="h-8 w-1/5 rounded-[5px] bg-[#abb0ba]" />
        <span className="h-8 flex-1 rounded-[5px] bg-white" />
        <span className="h-8 w-1/5 rounded-[5px] bg-[#abb0ba]" />
      </div>
    </div>
  );
}

export default function Playground() {
  const [s, setS] = useState<Settings>({ esc: true, backdrop: false, trap: true, lock: true, returnFocus: true });
  const [viewport, setViewport] = useState<'desktop' | 'phone'>('desktop');
  const [adaptive, setAdaptive] = useState(true);
  const [open, setOpen] = useState(false);
  const [kbd, setKbd] = useState(false);
  const [saved, setSaved] = useState({ street: '221B Baker Street', city: 'London' });
  const [form, setForm] = useState(saved);
  const [log, setLog] = useState<Entry[]>([]);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const scrolledLogged = useRef(false);
  const timers = useRef<number[]>([]);
  const settings = useRef(s);
  settings.current = s;

  const phone = viewport === 'phone';
  const full = phone && adaptive;
  const dirty = form.street !== saved.street || form.city !== saved.city;

  const add = (text: string, tone: Tone = 'info') => setLog((l) => [{ id: nextId.current++, text, tone }, ...l].slice(0, 7));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const first = dialog.current?.querySelector<HTMLElement>('input');
      first?.focus({ preventScroll: true });
      add('Opened. Focus moved to the "Street" field.', 'ok');
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  // Wheel / touch over the overlay: either blocked (scroll lock) or passed to the page behind.
  useEffect(() => {
    const el = overlay.current;
    if (!open || !el) return;
    let lastY = 0;
    const scrollBehind = (dy: number) => {
      if (settings.current.lock) return;
      if (bg.current) bg.current.scrollTop += dy;
      if (!scrolledLogged.current) {
        scrolledLogged.current = true;
        add('The page behind the dialog scrolled.', 'bad');
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollBehind(e.deltaY);
    };
    const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      scrollBehind(lastY - y);
      lastY = y;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [open]);

  const openDialog = () => {
    setForm(saved);
    scrolledLogged.current = false;
    setOpen(true);
  };

  const close = (how: string, tone: Tone = 'info') => {
    setOpen(false);
    setKbd(false);
    add(`Closed with ${how}.`, tone);
    timers.current.push(
      window.setTimeout(() => {
        if (settings.current.returnFocus) {
          trigger.current?.focus({ preventScroll: true });
          add('Focus returned to the "Change" button.', 'ok');
        } else {
          (document.activeElement as HTMLElement | null)?.blur?.();
          add('Focus was lost (back to the top of the page).', 'bad');
        }
      }, 30),
    );
  };

  const onFrameKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      if (s.esc) close('Esc');
      else add('Esc pressed: nothing happened.', 'bad');
    }
  };

  const onDialogKey = (e: KeyboardEvent) => {
    if (s.trap) trapTab(e, dialog.current);
  };

  const onBackdrop = () => {
    if (!s.backdrop) return add('Clicked outside: ignored, the dialog stays open.', 'ok');
    close('a click outside', dirty ? 'bad' : 'info');
    if (dirty) add('Your typed changes were thrown away without asking.', 'bad');
  };

  const save = () => {
    setSaved(form);
    close('Save', 'ok');
  };

  const onBgFocus = (e: FocusEvent) => {
    if (open) add(`Focus escaped to "${(e.target as HTMLElement).textContent?.trim() || 'an element'}" behind the dialog.`, 'bad');
  };

  const onDialogFocus = (e: FocusEvent) => {
    if (!phone) return;
    const tag = (e.target as HTMLElement).tagName;
    setKbd(tag === 'INPUT' || tag === 'TEXTAREA');
  };

  const issues: string[] = [];
  if (!s.esc) issues.push('Esc does nothing. Keyboard users expect Esc to close a dialog.');
  if (s.backdrop) issues.push('A click outside closes a dialog that holds a form. One stray click and the typed address is gone. Ignore outside clicks here, or ask "Discard changes?".');
  if (!s.trap) issues.push('Focus is not trapped. Tab reaches links behind the scrim that the user can\'t see.');
  if (!s.lock) issues.push('Scrolling over the dialog scrolls the page behind it, so the user loses their place.');
  if (!s.returnFocus) issues.push('After closing, focus is lost. Keyboard and screen reader users have to start again from the top.');
  if (phone && !adaptive) issues.push('On a phone with the keyboard open, the Save button hides behind the keyboard. Use a full-screen dialog or make the content scroll.');

  const field = 'mt-1 h-10 w-full rounded-lg border border-[#d0d4de] bg-white px-3 text-[14px] text-[#0e1120] outline-none focus:border-[#2f6bff] focus:ring-2 focus:ring-[#2f6bff]/25';

  const formFields = (
    <div className="space-y-3">
      <label className="block text-[13px] font-medium text-[#30354a]">
        Street
        <input className={field} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
      </label>
      <label className="block text-[13px] font-medium text-[#30354a]">
        City
        <input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </label>
      <label className="block text-[13px] font-medium text-[#30354a]">
        Note for the rider
        <textarea className={`${field} h-16 py-2`} placeholder="Ring twice, 3rd floor" />
      </label>
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Close-it-every-way playground</p>
        <p className="text-sm text-muted">Switch behaviors off, then open the dialog and try to escape it with the keyboard, the mouse and the scroll wheel. The log shows what a tester would notice.</p>
      </div>
      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <div className="space-y-2.5">
            {toggles.map((t) => (
              <label key={t.key} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium text-fg">{t.label}</span>
                  <span className="block text-xs text-faint">{t.help}</span>
                </span>
                <input type="checkbox" checked={s[t.key]} onChange={(e) => setS({ ...s, [t.key]: e.target.checked })} className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
              </label>
            ))}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">Device</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
              {(['desktop', 'phone'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setViewport(v);
                    setOpen(false);
                    setKbd(false);
                  }}
                  aria-pressed={viewport === v}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 capitalize ${viewport === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
                >
                  {v === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />} {v}
                </button>
              ))}
            </div>
          </div>
          {phone && (
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium text-fg">Full-screen on phones</span>
                <span className="block text-xs text-faint">Tap a field so the keyboard opens</span>
              </span>
              <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
            </label>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid place-items-center bg-[#e9ebf2] p-4 sm:p-6">
            <div
              className={`relative overflow-hidden border border-black/10 bg-white text-[#0e1120] shadow-sm ${phone ? 'h-[540px] w-[300px] max-w-full rounded-[32px]' : 'h-[400px] w-full rounded-xl'}`}
              onKeyDown={onFrameKey}
            >
              {/* The overlay comes first in the DOM, so without a focus trap Tab walks straight into the page behind it. */}
              {open && (
                <div ref={overlay} className={`absolute inset-0 z-40 flex ${full ? '' : 'items-center justify-center p-4'}`} style={full && kbd ? { bottom: '42%' } : undefined}>
                  {!full && <div className="absolute inset-0 bg-black/45 transition-opacity starting:opacity-0" onClick={onBackdrop} aria-hidden="true" />}
                  <div
                    ref={dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pg-title"
                    onKeyDown={onDialogKey}
                    onFocus={onDialogFocus}
                    className={full ? 'relative flex h-full w-full flex-col bg-white' : 'relative w-[340px] max-w-full rounded-xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,.4)] transition starting:scale-95 starting:opacity-0'}
                  >
                    {full ? (
                      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[#eceef3] px-1">
                        <button type="button" onClick={() => close('the X button')} aria-label="Close" className="grid size-10 place-items-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
                          <X size={18} />
                        </button>
                        <p id="pg-title" className="flex-1 text-[15px] font-semibold">
                          Delivery address
                        </p>
                        <button type="button" onClick={save} className="mr-1 h-9 rounded-lg px-3 text-[14px] font-semibold text-[#2f6bff] focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-5 pt-4">
                        <p id="pg-title" className="flex-1 text-[16px] font-semibold">
                          Delivery address
                        </p>
                        <button type="button" onClick={() => close('the X button')} aria-label="Close" className="-mr-2 grid size-9 place-items-center rounded-lg text-[#6b7080] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    <div className={full ? 'min-h-0 flex-1 overflow-auto p-4' : 'px-5 py-3'}>{formFields}</div>
                    {!full && (
                      <div className="flex justify-end gap-2 rounded-b-xl border-t border-[#eceef3] bg-[#f8f9fb] px-5 py-3">
                        <WebButton onClick={() => close('Cancel')}>Cancel</WebButton>
                        <WebButton kind="primary" onClick={save}>
                          Save
                        </WebButton>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {open && phone && kbd && <Keyboard />}

              <div ref={bg} onFocus={onBgFocus} inert={open && s.trap} className="h-full overflow-y-auto" style={{ overflowY: open && s.lock ? 'hidden' : 'auto' }}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eceef3] bg-white/95 px-4 py-3">
                  <span className="text-[15px] font-bold text-[#e4572e]">Foodly</span>
                  <a href="#orders" onClick={(e) => e.preventDefault()} className="text-[13px] font-medium text-[#4a4f60] focus-visible:outline-2 focus-visible:outline-[#2f6bff]">
                    My orders
                  </a>
                </div>
                <div className="m-3 flex items-center gap-2 rounded-xl bg-[#fff4ef] p-3">
                  <MapPin size={18} className="shrink-0 text-[#e4572e]" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="text-[11px] text-[#6b7080]">Deliver to</p>
                    <p className="truncate font-semibold">
                      {saved.street}, {saved.city}
                    </p>
                  </div>
                  <button
                    ref={trigger}
                    type="button"
                    onClick={openDialog}
                    className="rounded-lg bg-[#e4572e] px-3 py-1.5 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]"
                  >
                    Change
                  </button>
                </div>
                <ul className="space-y-2 px-3 pb-4">
                  {restaurants.map((r, i) => (
                    <li key={r}>
                      <a
                        href={`#${r}`}
                        onClick={(e) => e.preventDefault()}
                        className="flex items-center gap-3 rounded-xl border border-[#eceef3] p-2.5 focus-visible:outline-2 focus-visible:outline-[#2f6bff]"
                      >
                        <span className="size-10 shrink-0 rounded-lg" style={{ background: `hsl(${(i * 47) % 360} 70% 85%)` }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold">{r}</span>
                          <span className="block text-[12px] text-[#6b7080]">
                            {20 + i * 5}–{30 + i * 5} min · ★ 4.{9 - (i % 5)}
                          </span>
                        </span>
                        <ChevronRight size={16} className="text-[#9aa0b0]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-t border-line xl:grid-cols-2">
            <div className="space-y-2 border-b border-line p-5 xl:border-r xl:border-b-0">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Problems with these settings</p>
              {issues.length ? (
                issues.map((t) => (
                  <p key={t} className="flex items-start gap-2 text-sm text-fg">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> {t}
                  </p>
                ))
              ) : (
                <p className="flex items-start gap-2 text-sm text-fg">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> This dialog behaves well. Now switch a setting off and see what breaks.
                </p>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Event log</p>
              <ul className="mt-2 space-y-1.5 text-sm" aria-live="polite">
                {log.length === 0 && <li className="text-faint">Open the dialog to start…</li>}
                {log.map((e) => (
                  <li key={e.id} className={`flex items-start gap-2 ${e.tone === 'bad' ? 'text-danger' : e.tone === 'ok' ? 'text-ok' : 'text-muted'}`}>
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current" /> {e.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
