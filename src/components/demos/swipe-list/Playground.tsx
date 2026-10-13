import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Coffee, Headphones, Lamp, RotateCcw, Share, ShoppingCart, Shirt, Trash2, Watch, Footprints, Vibrate } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { SwipeRow, type Side } from './SwipeRow';

/*
 * Swipe lab: a correct iOS-style wishlist with swipe actions.
 * Learners can switch full swipe on/off, choose Undo vs confirmation vs nothing, try the largest text size
 * and use Edit mode (the non-gesture alternative). An event log shows what the row decided and when a haptic would play.
 */

interface Item {
  id: number;
  name: string;
  note: string;
  price: string;
  icon: LucideIcon;
  tint: string;
}

const seed: Item[] = [
  { id: 1, name: 'Noise-canceling headphones', note: 'Back in stock', price: '€199', icon: Headphones, tint: '#5856d6' },
  { id: 2, name: 'Trail runner 2', note: 'Size 42 · Blue', price: '€89', icon: Footprints, tint: '#ff9500' },
  { id: 3, name: 'Pour-over coffee set', note: 'Price dropped 15%', price: '€34', icon: Coffee, tint: '#a2845e' },
  { id: 4, name: 'Linen shirt', note: 'Only 2 left', price: '€49', icon: Shirt, tint: '#34c759' },
  { id: 5, name: 'Smart watch S3', note: 'Ships in 3 days', price: '€249', icon: Watch, tint: '#ff2d55' },
  { id: 6, name: 'Desk lamp', note: 'Warm white', price: '€39', icon: Lamp, tint: '#007aff' },
];

type DeleteMode = 'undo' | 'confirm' | 'none';

function Seg<T extends string | boolean>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${value === o.v ? 'bg-brand text-white ring-brand' : 'bg-surface text-muted ring-line hover:text-fg'}`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Playground() {
  const [items, setItems] = useState(seed);
  const [open, setOpen] = useState<{ id: number; side: Side } | null>(null);
  const [fullSwipe, setFullSwipe] = useState(true);
  const [mode, setMode] = useState<DeleteMode>('undo');
  const [large, setLarge] = useState(false);
  const [edit, setEdit] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);
  const [buzz, setBuzz] = useState(0);
  const logId = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const buzzTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(buzzTimer.current);
    },
    [],
  );

  const note = (text: string) => setLog((l) => [{ id: ++logId.current, text }, ...l].slice(0, 6));
  const showToast = (text: string, undo?: () => void) => {
    clearTimeout(toastTimer.current);
    setToast({ text, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  };

  const remove = (it: Item) => {
    let index = 0;
    setItems((xs) => {
      index = xs.findIndex((x) => x.id === it.id);
      return xs.filter((x) => x.id !== it.id);
    });
    if (mode === 'undo') {
      showToast(`Removed “${it.name}”`, () => {
        setItems((xs) => (xs.some((x) => x.id === it.id) ? xs : [...xs.slice(0, index), it, ...xs.slice(index)]));
        clearTimeout(toastTimer.current);
        setToast(null);
        note(`Undo: “${it.name}” is back in place`);
      });
      note(`Removed “${it.name}” · Undo shown for 4.5 s`);
    } else {
      note(`Removed “${it.name}” · no way back`);
    }
  };

  const act = (it: Item, key: string) => {
    if (key === 'cart') {
      note(`Added “${it.name}” to cart`);
      showToast('Added to cart');
    } else if (key === 'share') {
      note(`Share sheet for “${it.name}”`);
    } else if (key === 'remove') {
      if (mode === 'confirm') {
        setConfirm(it);
        note(`Asked to confirm removing “${it.name}”`);
      } else remove(it);
    }
  };

  const haptic = () => {
    setBuzz((b) => b + 1);
    clearTimeout(buzzTimer.current);
    buzzTimer.current = window.setTimeout(() => setBuzz(0), 500);
    note('Haptic tick: release now to run the full-swipe action');
  };

  const reset = () => {
    setItems(seed);
    setOpen(null);
    setEdit(false);
    setSelected([]);
    setConfirm(null);
    setToast(null);
    setLog([]);
  };

  const sub = 'rgba(60,60,67,.6)';
  const aw = large ? 92 : 72;

  const rowBody = (it: Item) => (
    <div className={`flex items-center gap-3 pr-2 pl-3 ${large ? 'py-3' : 'py-2.5'}`}>
      <span className={`grid shrink-0 place-items-center rounded-lg ${large ? 'size-12' : 'size-10'}`} style={{ background: `${it.tint}1f` }}>
        <it.icon size={large ? 22 : 18} color={it.tint} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold ${large ? 'text-[20px] leading-tight' : 'truncate text-[15px]'}`}>{it.name}</span>
        <span className={`block ${large ? 'mt-0.5 text-[17px] leading-snug' : 'truncate text-[13px]'}`} style={{ color: sub }}>
          {it.note}
          {large && ` · ${it.price}`}
        </span>
      </span>
      {!large && (
        <span className="shrink-0 text-[14px]" style={{ color: sub }}>
          {it.price}
        </span>
      )}
      <ChevronRight size={18} color="#c4c4c7" className="shrink-0" aria-hidden="true" />
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 justify-center bg-subtle p-4 sm:p-6" style={{ colorScheme: 'light' }}>
          <PhoneFrame width={290}>
            <div className="relative flex h-full flex-col bg-[#f2f2f7] text-black">
              <div className="flex shrink-0 items-center justify-end px-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEdit((e) => !e);
                    setSelected([]);
                    setOpen(null);
                    note(edit ? 'Left Edit mode' : 'Edit mode: select rows, then Remove (no gesture needed)');
                  }}
                  className="rounded px-1 text-[16px] text-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]"
                >
                  {edit ? 'Done' : 'Edit'}
                </button>
              </div>
              <p className={`shrink-0 px-4 pb-2 font-bold tracking-tight ${large ? 'text-[30px]' : 'text-[26px]'}`}>Wishlist</p>
              <div
                className="min-h-0 flex-1 overflow-y-auto pb-4"
                onScroll={() => {
                  if (open) {
                    setOpen(null);
                    note('List scrolled: open row closed');
                  }
                }}
              >
                <div className="mx-3 overflow-hidden rounded-xl bg-white">
                  {items.map((it, i) => (
                    <div key={it.id} className={i ? 'border-t border-[#e5e5ea]' : ''}>
                      {edit ? (
                        <button
                          type="button"
                          aria-pressed={selected.includes(it.id)}
                          onClick={() => setSelected((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : [...s, it.id]))}
                          className="flex w-full items-center text-left outline-none focus-visible:bg-[#e8f1ff]"
                        >
                          <span
                            className="ml-3 grid size-[22px] shrink-0 place-items-center rounded-full border-2"
                            style={{ borderColor: selected.includes(it.id) ? '#007aff' : '#c4c4c7', background: selected.includes(it.id) ? '#007aff' : 'transparent' }}
                          >
                            {selected.includes(it.id) && <Check size={14} color="#fff" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">{rowBody(it)}</span>
                        </button>
                      ) : (
                        <SwipeRow
                          label={`${it.name}, ${it.note}, ${it.price}`}
                          leading={[{ key: 'cart', label: 'Add to cart', icon: ShoppingCart, bg: '#34c759' }]}
                          trailing={[
                            { key: 'remove', label: 'Remove', icon: Trash2, bg: '#ff3b30' },
                            { key: 'share', label: 'Share', icon: Share, bg: '#8e8e93' },
                          ]}
                          fullSwipe={fullSwipe}
                          actionWidth={aw}
                          actionTextClassName={large ? 'text-[14px]' : 'text-[12px]'}
                          open={open?.id === it.id ? open.side : null}
                          onOpenChange={(side) => {
                            setOpen(side ? { id: it.id, side } : null);
                            if (side) note(`Opened ${side} actions on “${it.name}”`);
                          }}
                          onDragStart={() => {
                            if (open && open.id !== it.id) {
                              setOpen(null);
                              note('Another row was open: closed it first');
                            }
                          }}
                          onAction={(k) => act(it, k)}
                          onTap={() => note(`Tapped “${it.name}”: opens the product page`)}
                          onHaptic={haptic}
                        >
                          {rowBody(it)}
                        </SwipeRow>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && <p className="py-10 text-center text-[14px]" style={{ color: sub }}>Your wishlist is empty</p>}
                </div>
              </div>
              {edit && (
                <div className="flex shrink-0 items-center justify-between border-t border-[#d1d1d6] bg-[#f9f9f9] px-4 pt-2 pb-6">
                  <span className="text-[13px]" style={{ color: sub }}>
                    {selected.length} selected
                  </span>
                  <button
                    type="button"
                    disabled={selected.length === 0}
                    onClick={() => {
                      const removed = items.filter((x) => selected.includes(x.id));
                      const before = items;
                      setItems((xs) => xs.filter((x) => !selected.includes(x.id)));
                      setSelected([]);
                      note(`Edit mode removed ${removed.length} item(s)`);
                      if (mode === 'undo')
                        showToast(`Removed ${removed.length} item${removed.length === 1 ? '' : 's'}`, () => {
                          setItems(before);
                          setToast(null);
                        });
                    }}
                    className="text-[15px] font-medium text-[#ff3b30] disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              )}
              {toast && (
                <div className="absolute inset-x-3 bottom-6 z-10 flex items-center gap-2 rounded-xl bg-[#1c1c1e]/95 px-3 py-2.5 text-[13px] text-white shadow-lg" role="status">
                  <span className="min-w-0 flex-1 truncate">{toast.text}</span>
                  {toast.undo && (
                    <button type="button" onClick={toast.undo} className="shrink-0 font-semibold text-[#0a84ff]">
                      Undo
                    </button>
                  )}
                </div>
              )}
              {confirm && (
                <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/30 p-2 pb-6">
                  <div role="alertdialog" aria-label="Remove item" className="overflow-hidden rounded-xl bg-white/95 text-center">
                    <p className="px-4 py-3 text-[13px]" style={{ color: sub }}>
                      Remove “{confirm.name}” from your wishlist?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        remove(confirm);
                        setConfirm(null);
                      }}
                      className="w-full border-t border-[#d1d1d6] py-3 text-[17px] text-[#ff3b30]"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => {
                      setConfirm(null);
                      note('Canceled: nothing removed');
                    }}
                    className="mt-2 w-full rounded-xl bg-white py-3 text-[17px] font-semibold text-[#007aff]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 border-t border-line p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Seg label="Full swipe" value={fullSwipe} onChange={setFullSwipe} options={[{ v: true, t: 'On' }, { v: false, t: 'Off' }]} />
            <Seg label="Text size" value={large} onChange={setLarge} options={[{ v: false, t: 'Default' }, { v: true, t: 'Largest' }]} />
            <div className="sm:col-span-2">
              <Seg<DeleteMode>
                label="After Remove"
                value={mode}
                onChange={setMode}
                options={[
                  { v: 'undo', t: 'Undo toast' },
                  { v: 'confirm', t: 'Confirm first' },
                  { v: 'none', t: 'Nothing (risky)' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-subtle px-3 py-2 text-sm">
            <Vibrate size={16} className={buzz ? 'text-brand' : 'text-faint'} style={{ transform: buzz ? 'rotate(-12deg) scale(1.15)' : undefined, transition: 'transform 120ms' }} aria-hidden="true" />
            <span className={buzz ? 'font-semibold text-fg' : 'text-muted'}>{buzz ? 'Bzz! Haptic tick' : 'Haptic: waiting for a full swipe'}</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Event log</p>
              <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <ul className="mt-2 min-h-[8rem] space-y-1.5 text-[13px]" aria-live="polite">
              {log.length === 0 && <li className="text-faint">Drag a row left or right with your finger or mouse…</li>}
              {log.map((e) => (
                <li key={e.id} className="rounded-lg bg-subtle px-2.5 py-1.5 text-muted">
                  {e.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-faint">
            Try: open one row, then swipe another. Scroll while a row is open. Tab through the list with a keyboard: focusing an action reveals it.
          </p>
        </div>
      </div>
    </div>
  );
}
