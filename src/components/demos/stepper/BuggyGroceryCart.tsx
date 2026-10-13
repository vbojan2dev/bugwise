import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, ShoppingBasket } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken grocery cart (web). Bugs (don't spoil them for learners!):
 *  1. + stays enabled at the stock limit (Oat milk: 4 left). The server rejects 5 with 409 and the UI jumps back.
 *  2. The quantity field accepts anything and keeps it as a string: "05" then + gives "051";
 *     "1e2" is sent as qty=1e2, the server answers 400 and the app silently ignores it,
 *     while the row shows a line total for 100 items.
 *  3. Every tap sends a request; responses can arrive out of order (later requests are answered faster),
 *     and the subtotal uses whichever response arrived last. Tap + quickly: the field says 6, the subtotal is for 3.
 *  4. − at 1 removes the item immediately: no trash icon, no confirmation, no undo.
 *  5. −/+ are icon-only buttons without a name ("button"), and the new value is never announced.
 *  6. Scrolling the mouse wheel over the focused quantity field changes the quantity while the page scrolls
 *     (simulates Chromium's native <input type="number"> behavior, without preventDefault/blur).
 * Everything else (removing via −, checkout total math, the toast, the network log) works.
 */

interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  tint: string;
}

const items: Item[] = [
  { id: 'bananas', name: 'Organic bananas', price: 1.99, stock: 20, emoji: '🍌', tint: '#fef3c7' },
  { id: 'oat-milk', name: 'Oat milk 1 L', price: 2.49, stock: 4, emoji: '🥛', tint: '#e0f2fe' },
  { id: 'sourdough', name: 'Sourdough loaf', price: 3.8, stock: 10, emoji: '🍞', tint: '#ffedd5' },
];

type Qty = Record<string, number | string>;
const initialQty: Qty = { bananas: 2, 'oat-milk': 3, sourdough: 1 };
const initialConfirmed: Record<string, number> = { bananas: 2, 'oat-milk': 3, sourdough: 1 };

interface LogEntry {
  id: number;
  text: string;
  status: string;
}

const money = (n: number) => `€${n.toFixed(2)}`;

export function BuggyGroceryCart() {
  const [qty, setQty] = useState<Qty>(initialQty);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [removed, setRemoved] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [sr, setSr] = useState(false);
  const [spoken, setSpoken] = useState('VoiceOver on. Tab to an element to hear it.');
  const qtyRef = useRef<Qty>(initialQty);
  const confirmedRef = useRef(initialConfirmed);
  const pending = useRef(0);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const toastTimer = useRef<number | undefined>(undefined);
  const lastWheel = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(toastTimer.current);
    },
    [],
  );

  const setLocal = (id: string, v: number | string) => {
    qtyRef.current = { ...qtyRef.current, [id]: v };
    setQty(qtyRef.current);
  };

  const showToast = (t: string) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };

  const addLog = (text: string) => {
    const id = nextId.current++;
    setTotal((t) => t + 1);
    setLog((l) => [{ id, text, status: '…' }, ...l].slice(0, 6));
    return id;
  };
  const setStatus = (id: number, status: string) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));

  // BUG 3: one request per change; the more requests are pending, the faster the server answers the new one.
  const send = (item: Item, q: number | string) => {
    const raw = String(q);
    const id = addLog(`PATCH /cart/${item.id} qty=${raw}`);
    const latency = Math.max(150, 900 - 300 * pending.current);
    pending.current++;
    timers.current.push(
      window.setTimeout(() => {
        pending.current--;
        if (!/^\d+$/.test(raw)) {
          setStatus(id, '400'); // BUG 2: error ignored, field keeps the invalid text
          return;
        }
        const n = parseInt(raw, 10);
        if (n > item.stock) {
          setStatus(id, '409');
          showToast(`Sorry, only ${item.stock} × ${item.name} in stock.`);
          setLocal(item.id, confirmedRef.current[item.id]);
          return;
        }
        setStatus(id, '200');
        confirmedRef.current = { ...confirmedRef.current, [item.id]: n };
        setConfirmed(confirmedRef.current);
      }, latency),
    );
  };

  const plus = (item: Item) => {
    const q = qtyRef.current[item.id];
    const next = (q as number) + 1; // BUG 2: q can be a string ("05" + 1 = "051"). BUG 1: no stock check
    setLocal(item.id, next);
    send(item, next);
  };

  const minus = (item: Item) => {
    const q = qtyRef.current[item.id];
    if (Number(q) <= 1) {
      // BUG 4: removed at once, no confirmation or undo
      setRemoved((r) => [...r, item.id]);
      const id = addLog(`DELETE /cart/${item.id}`);
      timers.current.push(window.setTimeout(() => setStatus(id, '204'), 300));
      return;
    }
    const next = (q as number) - 1;
    setLocal(item.id, next);
    send(item, next);
  };

  const announce = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !box.current?.contains(el)) return;
    if (el.tagName === 'BUTTON') setSpoken(`${el.getAttribute('aria-label') ?? (el.textContent?.trim() || '')}${el.textContent?.trim() || el.getAttribute('aria-label') ? ', ' : ''}button`);
    else if (el.tagName === 'INPUT') setSpoken(`${el.getAttribute('aria-label')}, ${(el as HTMLInputElement).value}, text field`);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    pending.current = 0;
    qtyRef.current = initialQty;
    confirmedRef.current = initialConfirmed;
    setQty(initialQty);
    setConfirmed(initialConfirmed);
    setRemoved([]);
    setToast('');
    setLog([]);
    setTotal(0);
  };

  const inCart = items.filter((i) => !removed.includes(i.id));
  const count = inCart.reduce((s, i) => s + confirmed[i.id], 0);
  const subtotal = inCart.reduce((s, i) => s + confirmed[i.id] * i.price, 0);
  const delivery = subtotal >= 25 || subtotal === 0 ? 0 : 2.99;

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-4">
      <BrowserFrame url="grocer.example.com">
        <div ref={box} onFocus={() => sr && announce()} className="relative bg-[#f7f7f5] px-3 pt-4 pb-4 text-[#1c1917] sm:px-4" style={{ colorScheme: 'light' }}>
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBasket size={20} className="text-[#15803d]" />
            <p className="text-[18px] font-bold">Your basket</p>
          </div>

          {inCart.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-[14px]">
              <p className="font-semibold">Your basket is empty</p>
              <p className="mt-1 text-[12px] text-[#78716c]">Use “Restart app” to refill it.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {inCart.map((item) => {
                const q = qty[item.id];
                return (
                  <li key={item.id} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg text-[20px]" style={{ background: item.tint }} aria-hidden="true">
                      {item.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{item.name}</p>
                      <p className="truncate text-[12px] text-[#78716c]">
                        {money(item.price)} · {item.stock <= 5 ? <span className="text-[#c2410c]">only {item.stock} left</span> : 'in stock'}
                      </p>
                      <p className="truncate text-[12px] font-semibold tabular-nums">{money(Number(q) * item.price || 0)}</p>
                    </div>
                    <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-[#d6d3d1] bg-white">
                      <button
                        type="button"
                        onClick={() => minus(item)}
                        className="grid size-9 place-items-center text-[#15803d] outline-none hover:bg-[#f5f5f4] focus-visible:bg-[#dcfce7]"
                      >
                        <Minus size={16} strokeWidth={2.4} />
                      </button>
                      <input
                        aria-label="Quantity"
                        type="text"
                        inputMode="numeric"
                        value={String(q)}
                        onChange={(e) => setLocal(item.id, e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value !== String(confirmedRef.current[item.id])) send(item, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        onWheel={(e) => {
                          // BUG 6: the wheel changes a focused field (and the page keeps scrolling)
                          if (document.activeElement !== e.currentTarget || !e.deltaY) return;
                          const now = Date.now();
                          if (now - lastWheel.current < 120) return;
                          lastWheel.current = now;
                          if (e.deltaY < 0) plus(item);
                          else if (Number(qtyRef.current[item.id]) > 1) minus(item);
                        }}
                        className="h-9 w-10 min-w-0 border-x border-[#e7e5e4] text-center text-[14px] font-semibold tabular-nums outline-none focus-visible:bg-[#f0fdf4]"
                      />
                      <button
                        type="button"
                        onClick={() => plus(item)}
                        className="grid size-9 place-items-center text-[#15803d] outline-none hover:bg-[#f5f5f4] focus-visible:bg-[#dcfce7]"
                      >
                        <Plus size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 space-y-1 rounded-xl bg-white p-3 text-[13px]">
            <div className="flex justify-between">
              <span>Subtotal ({count} items)</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#78716c]">
              <span>Delivery {delivery === 0 && subtotal > 0 ? '(free over €25)' : ''}</span>
              <span className="tabular-nums">{money(delivery)}</span>
            </div>
            <div className="flex justify-between border-t border-[#e7e5e4] pt-1.5 text-[15px] font-bold">
              <span>Total</span>
              <span className="tabular-nums">{money(subtotal + delivery)}</span>
            </div>
            <button
              type="button"
              disabled={inCart.length === 0}
              className="mt-2 h-10 w-full rounded-lg bg-[#15803d] text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]/40 focus-visible:ring-offset-2 disabled:opacity-40"
            >
              Checkout · {money(subtotal + delivery)}
            </button>
          </div>

          {toast && (
            <div role="status" className="absolute inset-x-3 bottom-3 z-20 rounded-lg bg-[#292524] px-3 py-2.5 text-[13px] text-white shadow-lg">
              {toast}
            </div>
          )}
          {sr && (
            <div className="absolute inset-x-3 top-3 z-20 rounded-xl bg-black/85 px-3 py-2 text-[12px] leading-snug text-white" aria-live="off">
              <span className="mr-1 font-semibold text-[#64d2ff]">VoiceOver:</span>
              {spoken}
            </div>
          )}
        </div>
      </BrowserFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm">
          Screen reader (VoiceOver captions)
          <input
            type="checkbox"
            checked={sr}
            onChange={(e) => {
              setSr(e.target.checked);
              setSpoken('VoiceOver on. Tab to an element to hear it.');
            }}
            className="accent-[var(--brand)]"
          />
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network log</span>
          <span className="tabular-nums normal-case">{total} requests</span>
        </div>
        <ul className="min-h-[6.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Change a quantity to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate">{e.text}</span>
              <span className={e.status === '…' ? 'text-[#fbbf24]' : e.status.startsWith('2') ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
