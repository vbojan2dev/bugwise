import { useState } from 'react';
import { ArrowUpDown, RotateCcw, Search, Star, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken food delivery screen (Android / Material look). Bugs (don't spoil them for learners!):
 *  1. Selected filter chips differ from unselected ones by color only (no checkmark, same luminance):
 *     with the greyscale color filter on, you can't tell them apart.
 *  2. The horizontal chip row has no scroll hint (it ends cleanly under the Sort button) and the last chip,
 *     "Halal", always stays hidden under the Sort button, even when scrolled to the end: unreachable.
 *  3. The dish chips are shown sorted A–Z, but × removes by index in the (unsorted) insertion order,
 *     so it removes a different chip.
 *  4. Backspace in the empty dish field removes ALL chips instead of the last one.
 *  5. Duplicates are allowed: "Pizza" and "pizza " become two chips (no trim, case-sensitive check).
 *  6. The "N restaurants" count updates when a filter chip is selected, but not when it's deselected.
 * Everything else (list filtering, sort, typing, Enter to add) works.
 */

interface Restaurant {
  id: number;
  name: string;
  rating: number;
  minutes: number;
  fee: number;
  open: boolean;
  offer: boolean;
  dishes: string[];
  diet: string[];
  tint: string;
  emoji: string;
}

const restaurants: Restaurant[] = [
  { id: 1, name: 'Luigi’s Pizzeria', rating: 4.6, minutes: 25, fee: 0, open: true, offer: false, dishes: ['pizza', 'pasta'], diet: ['vegan'], tint: '#fecaca', emoji: '🍕' },
  { id: 2, name: 'Sakura Sushi Bar', rating: 4.8, minutes: 40, fee: 2.99, open: true, offer: true, dishes: ['sushi', 'ramen'], diet: [], tint: '#bfdbfe', emoji: '🍣' },
  { id: 3, name: 'Green Bowl Kitchen', rating: 4.4, minutes: 20, fee: 0, open: true, offer: true, dishes: ['salad', 'burgers'], diet: ['vegan', 'halal'], tint: '#bbf7d0', emoji: '🥗' },
  { id: 4, name: 'Smash Burger Co.', rating: 4.2, minutes: 15, fee: 1.49, open: true, offer: false, dishes: ['burgers'], diet: ['halal'], tint: '#fed7aa', emoji: '🍔' },
  { id: 5, name: 'Bangkok Street', rating: 4.7, minutes: 35, fee: 0, open: false, offer: false, dishes: ['curry', 'noodles'], diet: ['vegan'], tint: '#fde68a', emoji: '🍜' },
  { id: 6, name: 'Napoli Express', rating: 3.9, minutes: 30, fee: 0.99, open: true, offer: true, dishes: ['pizza'], diet: [], tint: '#fbcfe8', emoji: '🍕' },
  { id: 7, name: 'Istanbul Grill', rating: 4.5, minutes: 28, fee: 0, open: true, offer: false, dishes: ['kebab', 'salad'], diet: ['halal'], tint: '#ddd6fe', emoji: '🥙' },
  { id: 8, name: 'Taco Loco', rating: 4.1, minutes: 45, fee: 1.99, open: false, offer: true, dishes: ['tacos', 'burritos'], diet: ['vegan'], tint: '#a5f3fc', emoji: '🌮' },
];

const filterDefs: { id: string; label: string; test: (r: Restaurant) => boolean }[] = [
  { id: 'open', label: 'Open now', test: (r) => r.open },
  { id: 'free', label: 'Free delivery', test: (r) => r.fee === 0 },
  { id: 'rating', label: 'Rating 4.5+', test: (r) => r.rating >= 4.5 },
  { id: 'fast', label: 'Under 30 min', test: (r) => r.minutes < 30 },
  { id: 'offers', label: 'Offers', test: (r) => r.offer },
  { id: 'vegan', label: 'Vegan', test: (r) => r.diet.includes('vegan') },
  { id: 'halal', label: 'Halal', test: (r) => r.diet.includes('halal') },
];

const initialDishes = ['Sushi', 'Burgers'];

function compute(active: string[], dishes: string[]) {
  return restaurants.filter(
    (r) =>
      active.every((id) => filterDefs.find((f) => f.id === id)!.test(r)) &&
      (dishes.length === 0 || dishes.some((d) => r.dishes.includes(d.trim().toLowerCase()))),
  );
}

export function BuggyRestaurantFilters() {
  const [active, setActive] = useState<string[]>([]);
  const [dishes, setDishes] = useState<string[]>(initialDishes);
  const [text, setText] = useState('');
  const [byRating, setByRating] = useState(false);
  const [count, setCount] = useState(() => compute([], initialDishes).length);
  const [grey, setGrey] = useState(false);

  const results = compute(active, dishes).sort((a, b) => (byRating ? b.rating - a.rating : a.minutes - b.minutes));

  const toggle = (id: string) => {
    if (active.includes(id)) {
      setActive((prev) => prev.filter((x) => x !== id)); // BUG 6: count not recalculated on deselect
    } else {
      const next = [...active, id];
      setActive(next);
      setCount(compute(next, dishes).length);
    }
  };

  const addDish = () => {
    if (!text.trim()) return;
    const next = dishes.includes(text) ? dishes : [...dishes, text]; // BUG 5: no trim / case-insensitive check
    setDishes(next);
    setCount(compute(active, next).length);
    setText('');
  };

  // BUG 3: displayed A–Z, removed by index in the original array
  const shown = [...dishes].sort((a, b) => a.trim().localeCompare(b.trim()));
  const removeAt = (i: number) => {
    const next = dishes.filter((_, j) => j !== i);
    setDishes(next);
    setCount(compute(active, next).length);
  };

  const restart = () => {
    setActive([]);
    setDishes(initialDishes);
    setText('');
    setByRating(false);
    setCount(compute([], initialDishes).length);
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290} os="android">
        <div className="flex h-full flex-col bg-[#fef7ff] text-[#1d1b20]" style={{ colorScheme: 'light', filter: grey ? 'grayscale(1)' : undefined }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[20px] font-semibold">Delivery near you</p>
            <p className="text-[12px] text-[#49454f]">12 Baker Street · ASAP</p>
          </div>

          {/* Filter chip row: BUG 2 (no hint, last chip under the Sort button) */}
          <div className="relative">
            <div role="group" aria-label="Filters" className="flex gap-2 overflow-x-auto pr-0 pb-2 pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterDefs.map((f) => {
                const on = active.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(f.id)}
                    className="inline-flex h-8 shrink-0 items-center rounded-lg px-3.5 text-[13px] font-medium whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6750a4]"
                    /* BUG 1: color only, same grey value */
                    style={{ background: on ? '#ffdad6' : '#e2e2e2', color: on ? '#8c1d18' : '#343434' }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setByRating((v) => !v)}
              aria-label={byRating ? 'Sort: rating' : 'Sort: fastest'}
              className="absolute top-0 right-0 flex h-8 w-[76px] items-center justify-center gap-1 border-l border-[#e7e0ec] bg-[#fef7ff] text-[12px] font-medium text-[#6750a4] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6750a4]"
            >
              <ArrowUpDown size={14} /> Sort
            </button>
          </div>

          {/* Input chips: dishes */}
          <div className="mx-3 mt-1 rounded-xl bg-white px-2 py-2 ring-1 ring-[#cac4d0]">
            <div className="flex flex-wrap items-center gap-1.5">
              <Search size={15} className="ml-1 shrink-0 text-[#49454f]" aria-hidden="true" />
              {shown.map((d, i) => (
                <span key={`${d}-${i}`} className="inline-flex h-7 max-w-full min-w-0 items-center gap-0.5 rounded-lg pr-0.5 pl-2.5 text-[13px] font-medium text-[#49454f] ring-1 ring-[#79747e] ring-inset">
                  <span className="min-w-0 truncate whitespace-pre">{d}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${d.trim()}`}
                    onClick={() => removeAt(i)}
                    className="grid size-6 shrink-0 place-items-center rounded-full outline-none hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#6750a4]"
                  >
                    <X size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDish();
                  } else if (e.key === 'Backspace' && text === '' && dishes.length) {
                    e.preventDefault();
                    setDishes([]); // BUG 4: should remove only the last chip
                    setCount(compute(active, []).length);
                  }
                }}
                aria-label="Add a dish"
                placeholder={dishes.length ? 'Add dish' : 'Search a dish, e.g. pizza'}
                enterKeyHint="done"
                className="h-7 w-0 min-w-[5.5rem] flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-[#79747e]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <p className="text-[12px] font-semibold text-[#49454f]">{count} restaurants</p>
            <p className="text-[11px] text-[#79747e]">{byRating ? 'Top rated first' : 'Fastest first'}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
            {results.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-[14px] font-semibold">No restaurants match</p>
                <p className="mt-1 text-[12px] text-[#49454f]">Try removing a filter or a dish.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,.08)]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg text-[18px]" style={{ background: r.tint }} aria-hidden="true">
                      {r.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{r.name}</span>
                      <span className="flex items-center gap-1 text-[11px] text-[#49454f]">
                        <Star size={10} className="fill-[#e8a200] text-[#e8a200]" /> {r.rating.toFixed(1)} · {r.minutes} min · {r.fee === 0 ? 'Free delivery' : `£${r.fee.toFixed(2)}`}
                        {!r.open && ' · Closed'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm">
          Color filter: greyscale
          <input type="checkbox" checked={grey} onChange={(e) => setGrey(e.target.checked)} className="accent-[var(--brand)]" />
        </label>
      </div>
    </div>
  );
}
