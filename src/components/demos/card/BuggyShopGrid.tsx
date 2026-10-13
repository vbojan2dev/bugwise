import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Heart, ImageOff, RotateCcw, ShoppingBag, Star } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { ProductImage, eur, products, type Product } from './Cards';

/*
 * A deliberately broken iOS shop grid. Bugs (don't spoil them for learners!):
 *  1. Tapping the heart also opens the product (the click bubbles up to the card).
 *  2. A long product name overflows its fixed-height title box and overlaps the price.
 *  3. A product without a photo shows a broken-image icon + file name and the card collapses.
 *  4. The tent's sale price and old price are swapped: "€249.00" with "€199.00" struck through and "-20%".
 *  5. The boots are "Sold out", but Add to cart on the card still adds them to the bag.
 *  6. Screen reader: every fragment is read separately, the photo is read as a file name,
 *     the heart is just "button", and the same product link is announced twice per card.
 */

interface Item {
  p: Product;
  name: string;
  /** What the card shows (bug 4: swapped for the tent). */
  shownPrice: number;
  shownOld?: number;
  /** The real price, shown on the product page. */
  realPrice: number;
  badge?: string;
  noImage?: boolean;
  file: string;
}

const [jacket, backpack, boots, tent, watch, fleece] = products;

const items: Item[] = [
  { p: jacket, name: jacket.name, shownPrice: 89, shownOld: 119, realPrice: 89, badge: '-25%', file: 'trail-jacket-blue.jpg' },
  { p: backpack, name: backpack.name, shownPrice: 74.5, realPrice: 74.5, noImage: true, file: 'backpack_30l.jpg' },
  { p: boots, name: 'Ridge Mid Gore-Tex Waterproof Hiking Boots, Wide Fit', shownPrice: 139, realPrice: 139, badge: 'Sold out', file: 'ridge-mid.jpg' },
  { p: tent, name: tent.name, shownPrice: 249, shownOld: 199, realPrice: 199, badge: '-20%', file: 'dome-2p.jpg' }, // BUG 4
  { p: watch, name: watch.name, shownPrice: 249, realPrice: 249, file: 'peak-watch.jpg' },
  { p: fleece, name: fleece.name, shownPrice: 59.99, realPrice: 59.99, file: 'alpine-fleece.jpg' },
];

/** What VoiceOver says, swipe by swipe, starting at the top of the grid (BUG 6). */
const voiceOver = [
  'Hiking gear, heading',
  'trail-jacket-blue.jpg, link',
  '-25%',
  'button',
  'Trail Rain Jacket, link',
  '4.6',
  '(182)',
  '€89.00',
  '€119.00',
  'View Trail Rain Jacket, link',
  'Add to cart, button',
  'backpack_30l.jpg, link',
  'button',
  'Summit Backpack 30 L, link',
  '4.8',
  '(96)',
  '€74.50',
  'View Summit Backpack 30 L, link',
  'Add to cart, button',
];

function press(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };
}

export function BuggyShopGrid() {
  const [open, setOpen] = useState<Item | null>(null);
  const [favs, setFavs] = useState<number[]>([]);
  const [bag, setBag] = useState<string[]>([]);
  const [vo, setVo] = useState(false);
  const [voIndex, setVoIndex] = useState(0);
  const [flash, setFlash] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const notify = (text: string) => {
    setFlash(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(''), 1800);
  };

  const toggleFav = (id: number) => setFavs((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const addToBag = (it: Item) => {
    setBag((b) => [...b, it.name]);
    notify('Added to bag');
  };

  const restart = () => {
    setOpen(null);
    setFavs([]);
    setBag([]);
    setVoIndex(0);
    setFlash('');
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="absolute inset-0 flex flex-col bg-[#f2f2f7] text-[#000]" style={{ colorScheme: 'light' }}>
          {open ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex h-11 shrink-0 items-center px-2">
                <button type="button" onClick={() => setOpen(null)} className="flex items-center text-[16px] text-[#007aff]">
                  <ChevronLeft size={22} /> Hiking gear
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-white pb-6">
                {open.noImage ? (
                  <div className="grid aspect-square place-items-center bg-[#eceef3] text-[#a3a8b8]">
                    <ImageOff size={34} strokeWidth={1.5} />
                  </div>
                ) : (
                  <ProductImage p={open.p} ratio={1} />
                )}
                <div className="space-y-2 p-4">
                  <p className="text-[18px] leading-tight font-bold">{open.name}</p>
                  <p className="flex items-center gap-1 text-[12px] text-[#6c6c70]">
                    <Star size={12} className="fill-[#f5a524] text-[#f5a524]" /> {open.p.rating.toFixed(1)} · {open.p.reviews} reviews
                  </p>
                  <p className="text-[20px] font-bold">{eur(open.realPrice)}</p>
                  {open.p.soldOut ? (
                    <p className="grid h-11 place-items-center rounded-xl bg-[#e5e5ea] text-[15px] font-semibold text-[#8e8e93]">Sold out</p>
                  ) : (
                    <button type="button" onClick={() => addToBag(open)} className="h-11 w-full rounded-xl bg-[#007aff] text-[15px] font-semibold text-white">
                      Add to bag
                    </button>
                  )}
                  <p className="text-[12px] leading-relaxed text-[#6c6c70]">Free returns within 30 days. Ships in 1–2 business days.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-end justify-between px-4 pt-2 pb-2">
                <p className={`rounded text-[26px] leading-none font-bold ${vo && voIndex === 0 ? 'outline-2 outline-offset-2 outline-black' : ''}`}>Hiking gear</p>
                <span className="relative grid size-9 place-items-center text-[#007aff]" aria-label={`Bag, ${bag.length} items`}>
                  <ShoppingBag size={22} />
                  {bag.length > 0 && <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">{bag.length}</span>}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
                <div className="grid grid-cols-2 items-start gap-2.5">
                  {items.map((it, i) => {
                    const voOnCard = vo && ((i === 0 && voIndex >= 1 && voIndex <= 10) || (i === 1 && voIndex >= 11));
                    return (
                      // BUG 1: the whole card is clickable, and the heart inside doesn't stop the click from bubbling up
                      <div
                        key={it.p.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => setOpen(it)}
                        onKeyDown={press(() => setOpen(it))}
                        className={`relative min-w-0 cursor-pointer overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,.08)] ${voOnCard ? 'outline-2 outline-offset-2 outline-black' : ''}`}
                      >
                        <div className="relative overflow-hidden rounded-t-xl">
                          {it.noImage ? (
                            // BUG 3: broken image with no fallback and no reserved space
                            <span className="flex items-center gap-1 p-1 text-[10px] text-[#6c6c70]">
                              <ImageOff size={14} /> {it.file}
                            </span>
                          ) : (
                            <ProductImage p={it.p} ratio={1} />
                          )}
                          {it.badge && !it.noImage && (
                            <span className={`absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-white uppercase ${it.badge === 'Sold out' ? 'bg-[#1f2230]' : 'bg-[#ff3b30]'}`}>{it.badge}</span>
                          )}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleFav(it.p.id)}
                            onKeyDown={press(() => toggleFav(it.p.id))}
                            className={`grid size-8 place-items-center rounded-full bg-white/90 ${it.noImage ? 'absolute top-0.5 right-0.5 size-6' : 'absolute top-1 right-1'}`}
                          >
                            <Heart size={15} className={favs.includes(it.p.id) ? 'fill-[#ff2d55] text-[#ff2d55]' : 'text-[#1c1c1e]'} />
                          </span>
                        </div>
                        <div className="p-2">
                          {/* BUG 2: fixed two-line height, no clamp, overflow visible */}
                          <p className="h-[32px] overflow-visible text-[12px] leading-4 font-semibold">{it.name}</p>
                          <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-[#6c6c70]">
                            <Star size={10} className="fill-[#f5a524] text-[#f5a524]" /> {it.p.rating.toFixed(1)} ({it.p.reviews})
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1">
                            <span className={`text-[13px] font-bold ${it.shownOld ? 'text-[#ff3b30]' : ''}`}>{eur(it.shownPrice)}</span>
                            {it.shownOld && <s className="text-[10px] text-[#8e8e93]">{eur(it.shownOld)}</s>}
                          </p>
                          {/* BUG 5: the button ignores the Sold out state */}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBag(it);
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              press(() => addToBag(it))(e);
                            }}
                            className="mt-1.5 grid h-8 place-items-center rounded-full bg-[#007aff] text-[11px] font-semibold text-white"
                          >
                            Add to cart
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {flash && (
            <div role="status" className="absolute inset-x-6 bottom-8 z-30 rounded-full bg-black/80 px-4 py-2 text-center text-[13px] font-medium text-white">
              {flash}
            </div>
          )}

          {vo && (
            <div className="absolute inset-x-2 bottom-5 z-40 rounded-lg bg-black/85 px-3 py-2 text-center text-[13px] text-white" aria-live="polite">
              {voIndex < voiceOver.length ? voiceOver[voIndex] : '…and the same again for every card'}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2">
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            VoiceOver
            <input
              type="checkbox"
              checked={vo}
              onChange={(e) => {
                setVo(e.target.checked);
                setVoIndex(0);
              }}
              className="accent-[var(--brand)]"
            />
          </label>
          <button
            type="button"
            disabled={!vo}
            onClick={() => setVoIndex((i) => (i >= voiceOver.length ? 0 : i + 1))}
            className="flex items-center justify-center gap-1 rounded-lg bg-subtle px-3 py-2 font-medium disabled:opacity-50"
          >
            Swipe right <ChevronRight size={14} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          In bag: {bag.length === 0 ? 'nothing yet' : bag.join(', ')}
        </p>
      </div>
    </div>
  );
}
