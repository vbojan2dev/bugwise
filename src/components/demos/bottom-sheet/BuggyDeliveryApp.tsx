import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, ChevronRight, Clock, CreditCard, Delete, MapPin, Minus, Plus, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken iOS food-delivery checkout with a "Delivery time" sheet. Bugs (don't spoil them!):
 *  1. Dragging the list of time slots always drags the sheet (it never scrolls); dragging down closes it.
 *  2. The courier-note field is covered by the on-screen keyboard (the sheet doesn't move up).
 *  3. Swiping the sheet down APPLIES the slot you tapped without pressing Confirm
 *     (while tapping outside discards it): inconsistent, and an unintended change.
 *  4. The scrim lets taps through: tapping the dimmed + / − buttons changes the cart behind the sheet.
 *  5. No non-gesture way to close: no Cancel / X, Esc and the VoiceOver escape gesture do nothing.
 *  6. After a swipe-down dismissal, the sheet reopens cut off at the height where you let go
 *     (the drag offset is never reset).
 */

const SLOTS = ['ASAP · 25–35 min', ...Array.from({ length: 16 }, (_, i) => {
  const s = 12 * 60 + i * 15;
  const f = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  return `${f(s)} – ${f(s + 15)}`;
})];
const ROWS = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']];
const DETENTS = [0.55, 0.92];
const blue = '#007aff';

interface Item {
  name: string;
  price: number;
  qty: number;
}
const START: Item[] = [
  { name: 'Classic burger', price: 9.5, qty: 1 },
  { name: 'Sweet potato fries', price: 4.2, qty: 1 },
];

export function BuggyDeliveryApp() {
  const [items, setItems] = useState<Item[]>(START);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pending, setPending] = useState(SLOTS[0]);
  const [pendingNote, setPendingNote] = useState('');
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [kb, setKb] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const screen = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const g = useRef<{ base: number; t: number; id: number } | null>(null);
  const moved = useRef(false);
  const lastDrag = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 5));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0) + 2.49;

  const openSheet = () => {
    setPending(slot);
    setPendingNote(note);
    setIdx(0);
    // BUG 6: `drag` is not reset here (nor after a swipe-down dismissal).
    setOpen(true);
    setEntered(false);
    timers.current.push(window.setTimeout(() => setEntered(true), 20));
    timers.current.push(window.setTimeout(() => sheet.current?.focus({ preventScroll: true }), 60));
  };

  const closeSheet = (how: 'confirm' | 'swipe' | 'scrim') => {
    setKb(false);
    input.current?.blur();
    if (how === 'confirm') {
      setSlot(pending);
      setNote(pendingNote);
      addLog(`Confirmed: ${pending}`);
    } else if (how === 'swipe') {
      setSlot(pending); // BUG 3: a swipe-down should cancel, not apply
      setNote(pendingNote);
      addLog('Swiped down');
    } else addLog('Tapped outside');
    setEntered(false);
    timers.current.push(
      window.setTimeout(() => {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }, 220),
    );
  };

  /* ---- dragging: BUG 1, the same handler is used for the grabber AND the list ---- */
  const H = () => screen.current?.clientHeight ?? 560;
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input')) return;
    g.current = { base: e.clientY - drag, t: Date.now(), id: e.pointerId };
    moved.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (!s) return;
    const d = e.clientY - s.base;
    if (!moved.current && Math.abs(d - drag) < 6) return;
    if (!moved.current) {
      e.currentTarget.setPointerCapture(s.id);
      moved.current = true;
      setDragging(true);
    }
    const maxUp = (DETENTS[1] - DETENTS[idx]) * H();
    lastDrag.current = Math.max(-maxUp - 20, d);
    setDrag(lastDrag.current);
  };
  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s || !moved.current) return;
    setDragging(false);
    timers.current.push(window.setTimeout(() => (moved.current = false), 0));
    const h = H();
    const current = DETENTS[idx] * h - lastDrag.current;
    if (current < DETENTS[0] * h * 0.6) {
      closeSheet('swipe'); // BUG 6: drag is left as it is
      return;
    }
    const best = Math.abs(DETENTS[0] * h - current) <= Math.abs(DETENTS[1] * h - current) ? 0 : 1;
    setIdx(best);
    setDrag(0);
  };

  const bump = (i: number, delta: number) => setItems((list) => list.map((it, k) => (k === i ? { ...it, qty: Math.max(0, it.qty + delta) } : it)));

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setItems(START);
    setSlot(SLOTS[0]);
    setNote('');
    setOpen(false);
    setEntered(false);
    setIdx(0);
    setDrag(0);
    setKb(false);
    setPlaced(false);
    setLog([]);
  };

  const typeKey = (k: string) => setPendingNote((n) => (k === '⌫' ? n.slice(0, -1) : (n + k).slice(0, 60)));
  const kbH = Math.round(H() * 0.4);
  const height = `max(72px, min(calc(${DETENTS[idx] * 100}% - ${drag}px), calc(100% - 8px)))`;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div
          ref={screen}
          className="absolute inset-0 overflow-hidden bg-[#f2f2f7] text-black"
          style={{ colorScheme: 'light' }}
          onClick={(e) => {
            // BUG 4: "outside" taps are detected here, after they already reached the page behind.
            if (open && entered && !sheet.current?.contains(e.target as Node)) closeSheet('scrim');
          }}
        >
          {placed ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#34c759] text-white">
                <Check size={30} />
              </span>
              <p className="mt-3 text-[20px] font-semibold">Order placed</p>
              <p className="mt-1 text-[13px] text-black/60">
                {slot} · €{total.toFixed(2)}
              </p>
              <button type="button" onClick={restart} className="mt-4 text-[15px]" style={{ color: blue }}>
                Start over
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2">
                <p className="text-[26px] font-bold">Checkout</p>
                <p className="text-[13px] text-black/55">Burger Lab</p>
                <ul className="mt-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-white text-[14px]">
                  {items.map((it, i) => (
                    <li key={it.name} className="flex items-center gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{it.name}</span>
                        <span className="block text-[12px] text-black/50">€{(it.price * it.qty).toFixed(2)}</span>
                      </span>
                      <button type="button" aria-label={`Fewer ${it.name}`} onClick={() => bump(i, -1)} className="grid size-8 place-items-center rounded-full bg-[#f2f2f7]" style={{ color: blue }}>
                        <Minus size={15} />
                      </button>
                      <span className="w-4 text-center font-semibold">{it.qty}</span>
                      <button type="button" aria-label={`More ${it.name}`} onClick={() => bump(i, 1)} className="grid size-8 place-items-center rounded-full bg-[#f2f2f7]" style={{ color: blue }}>
                        <Plus size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white text-[14px]">
                  <li className="flex items-center gap-3 px-3 py-2.5">
                    <MapPin size={16} className="shrink-0 text-black/50" />
                    <span className="min-w-0 flex-1 truncate">Rua Augusta 12, Lisbon</span>
                  </li>
                  <li>
                    <button ref={trigger} type="button" onClick={openSheet} className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:bg-black/5">
                      <Clock size={16} className="shrink-0 text-black/50" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{slot}</span>
                        {note && <span className="block truncate text-[12px] text-black/50">“{note}”</span>}
                      </span>
                      <ChevronRight size={16} className="text-black/30" />
                    </button>
                  </li>
                  <li className="flex items-center gap-3 px-3 py-2.5">
                    <CreditCard size={16} className="shrink-0 text-black/50" />
                    <span className="flex-1">Visa •• 4242</span>
                  </li>
                </ul>
              </div>
              <div className="shrink-0 border-t border-black/10 bg-white px-4 pt-3 pb-6">
                <div className="mb-2 flex justify-between text-[14px]">
                  <span>Total incl. delivery</span>
                  <span className="font-semibold">€{total.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPlaced(true);
                    addLog(`Order placed for ${slot}`);
                  }}
                  className="h-11 w-full rounded-xl text-[16px] font-semibold text-white"
                  style={{ background: blue }}
                >
                  Place order
                </button>
              </div>
            </div>
          )}

          {open && (
            <>
              {/* BUG 4: pointer-events-none, so the scrim doesn't block the page behind */}
              <div className="pointer-events-none absolute inset-0 z-30 bg-black" style={{ opacity: entered ? 0.25 : 0, transition: 'opacity .2s' }} aria-hidden="true" />
              <div
                ref={sheet}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bug-sheet-title"
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') addLog('Esc pressed (nothing happened)'); // BUG 5
                  if (e.key === 'Tab' && sheet.current) {
                    // Focus trap (works correctly)
                    const els = Array.from(sheet.current.querySelectorAll<HTMLElement>('button, input'));
                    const first = els[0];
                    const last = els[els.length - 1];
                    if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet.current)) {
                      e.preventDefault();
                      last?.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                      e.preventDefault();
                      first?.focus();
                    }
                  }
                }}
                className="absolute inset-x-0 z-40 flex flex-col rounded-t-[16px] bg-white shadow-[0_-2px_16px_rgba(0,0,0,.14)] outline-none"
                style={{
                  bottom: 0,
                  height,
                  transform: entered ? 'translateY(0)' : 'translateY(105%)',
                  transition: dragging ? 'transform .22s' : 'height .26s cubic-bezier(.2,0,0,1), transform .22s cubic-bezier(.2,0,0,1)',
                }}
              >
                <div className="shrink-0 touch-none select-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
                  <div className="flex justify-center pt-1.5 pb-1">
                    <span className="h-[5px] w-9 rounded-full bg-black/25" />
                  </div>
                  {/* BUG 5: no Cancel / close button */}
                  <p id="bug-sheet-title" className="pb-2 text-center text-[15px] font-semibold">
                    Delivery time
                  </p>
                </div>
                <div
                  className="min-h-0 flex-1 touch-none overflow-y-auto"
                  onPointerDown={down}
                  onPointerMove={move}
                  onPointerUp={up}
                  onPointerCancel={up}
                  onClickCapture={(e) => {
                    if (moved.current) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }}
                >
                  <ul role="radiogroup" aria-label="Delivery time" className="mx-3 mb-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-[#f2f2f7] text-[14px]">
                    {SLOTS.map((s) => (
                      <li key={s}>
                        <button type="button" role="radio" aria-checked={pending === s} onClick={() => setPending(s)} className="flex w-full items-center justify-between px-3 py-2.5 text-left outline-none focus-visible:bg-black/5">
                          {s}
                          {pending === s && <Check size={16} style={{ color: blue }} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0 space-y-2 border-t border-black/10 p-3">
                  {/* BUG 2: nothing moves this above the keyboard */}
                  <input
                    ref={input}
                    value={pendingNote}
                    onChange={(e) => setPendingNote(e.target.value)}
                    onFocus={() => setKb(true)}
                    onBlur={() => setKb(false)}
                    placeholder="Note for the courier"
                    aria-label="Note for the courier"
                    className="h-10 w-full rounded-lg bg-[#f2f2f7] px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#007aff]"
                  />
                  <button type="button" onClick={() => closeSheet('confirm')} className="h-10 w-full rounded-lg text-[15px] font-semibold text-white" style={{ background: blue }}>
                    Confirm
                  </button>
                </div>
              </div>
            </>
          )}

          {open && kb && (
            <div className="absolute inset-x-0 bottom-0 z-50 flex flex-col justify-center gap-1.5 bg-[#d1d3d9] px-1 pb-4" style={{ height: kbH }} onMouseDown={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()} aria-hidden="true">
              {ROWS.map((r, i) => (
                <div key={i} className="flex justify-center gap-1">
                  {r.map((k) => (
                    <span key={k} onClick={() => typeKey(k)} className="grid h-8 w-[24px] cursor-pointer place-items-center rounded-[5px] bg-white text-[14px] shadow-[0_1px_0_rgba(0,0,0,.3)]">
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
                <span onClick={() => input.current?.blur()} className="grid h-8 cursor-pointer place-items-center rounded-[5px] px-3 text-[13px] text-white" style={{ background: blue }}>
                  done
                </span>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <button
            type="button"
            onClick={() => addLog(open ? 'Esc pressed (nothing happened)' : 'Esc pressed')}
            className="rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand"
          >
            Esc (hardware keyboard)
          </button>
          <button
            type="button"
            onClick={() => addLog(open ? 'VoiceOver escape gesture (nothing happened)' : 'VoiceOver escape gesture')}
            className="rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand"
          >
            VoiceOver: 2-finger Z
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Event log</p>
        <ul className="min-h-[3.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Sheet events appear here…</li>}
          {log.map((e, i) => (
            <li key={i} className="truncate">
              {e}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
