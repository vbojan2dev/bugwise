import { useRef, useState } from 'react';
import { History, MapPin, RotateCcw, Search, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { IOSSearchField, fold } from './SearchBar';

/*
 * A deliberately broken food delivery search. Bugs (don't spoil them for learners!):
 *  1. The clear (×) button empties the text but leaves the old results on screen.
 *  2. The keyboard's Search key (Enter) does nothing; only tapping a suggestion searches.
 *  3. Recent searches are never de-duplicated ("Pizza", "Pizza", "pizza").
 *  4. The field allows auto-capitalization and the search is case-sensitive: "pizza" becomes "Pizza" and finds nothing.
 *  5. Cancel resets the category chip on the home screen to "All".
 *  6. A blank query ("   ") is accepted: it lists every dish and is saved as an empty recent search.
 * Everything else (suggestions, tapping recents, removing a recent, backspacing to empty, home list) works.
 */

const dishes = [
  { name: 'Margherita pizza', place: "Luigi's Pizzeria", cat: 'Pizza', price: 9.5, emoji: '🍕' },
  { name: 'Pepperoni pizza', place: "Luigi's Pizzeria", cat: 'Pizza', price: 11, emoji: '🍕' },
  { name: 'Salmon sushi box', place: 'Tokyo Bento', cat: 'Asian', price: 14.9, emoji: '🍣' },
  { name: 'Chicken ramen', place: 'Tokyo Bento', cat: 'Asian', price: 12.5, emoji: '🍜' },
  { name: 'Pad thai', place: 'Bangkok Street', cat: 'Asian', price: 10.9, emoji: '🍝' },
  { name: 'Poke bowl', place: 'Green Leaf', cat: 'Healthy', price: 12, emoji: '🥗' },
  { name: 'Quinoa salad', place: 'Green Leaf', cat: 'Healthy', price: 9.9, emoji: '🥗' },
  { name: 'Classic burger', place: 'Grill House', cat: 'Burgers', price: 10.5, emoji: '🍔' },
  { name: 'Veggie burger', place: 'Grill House', cat: 'Burgers', price: 10, emoji: '🍔' },
  { name: 'Chocolate brownie', place: 'Sweet Spot', cat: 'Desserts', price: 4.5, emoji: '🍫' },
  { name: 'Tiramisu', place: 'Sweet Spot', cat: 'Desserts', price: 5.5, emoji: '🍰' },
];
const chips = ['All', 'Pizza', 'Asian', 'Healthy', 'Burgers', 'Desserts'];
const initialRecents = ['sushi', 'burger'];

const euro = (n: number) => `€${n.toFixed(2)}`;

function DishRow({ d }: { d: (typeof dishes)[number] }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white p-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f2f2f7] text-[20px]" aria-hidden="true">
        {d.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{d.name}</span>
        <span className="block truncate text-[11px] text-[rgba(60,60,67,.6)]">{d.place}</span>
      </span>
      <span className="text-[13px] font-semibold tabular-nums">{euro(d.price)}</span>
    </li>
  );
}

export function BuggyFoodSearch() {
  const [mode, setMode] = useState<'home' | 'search'>('home');
  const [chip, setChip] = useState('All');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'browse' | 'results'>('browse');
  const [submitted, setSubmitted] = useState('');
  const [recents, setRecents] = useState(initialRecents);
  const [autoCap, setAutoCap] = useState(true);
  const input = useRef<HTMLInputElement>(null);

  const onChange = (text: string) => {
    let t = text;
    // Simulated iOS keyboard: the field doesn't turn auto-capitalization off (BUG 4, part 1).
    if (autoCap && query === '' && t.length === 1 && /[a-z]/.test(t)) t = t.toUpperCase();
    setQuery(t);
    setView('browse');
  };

  const submit = (q: string) => {
    // BUG 6: no check for blank queries.
    setSubmitted(q);
    setQuery(q);
    setView('results');
    setRecents((r) => [q, ...r].slice(0, 6)); // BUG 3: no de-duplication
    input.current?.blur();
  };

  const cancel = () => {
    setMode('home');
    setQuery('');
    setSubmitted('');
    setView('browse');
    setChip('All'); // BUG 5
    input.current?.blur();
  };

  const restart = () => {
    setMode('home');
    setChip('All');
    setQuery('');
    setView('browse');
    setSubmitted('');
    setRecents(initialRecents);
  };

  const term = submitted.trim();
  const results = dishes.filter((d) => d.name.includes(term) || d.place.includes(term)); // BUG 4, part 2: case-sensitive
  const suggestions = query.trim() ? dishes.filter((d) => fold(d.name).includes(fold(query))).slice(0, 4) : [];
  const home = chip === 'All' ? dishes : dishes.filter((d) => d.cat === chip);
  const sub = 'rgba(60,60,67,.6)';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="flex h-full flex-col bg-[#f2f2f7] text-black" style={{ colorScheme: 'light' }}>
          <div className="px-4 pt-4 pb-2">
            {mode === 'home' && (
              <>
                <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color: sub }}>
                  <MapPin size={11} /> Deliver to Ilica 10
                </p>
                <p className="mb-2 text-[26px] font-bold tracking-tight">Delivery</p>
              </>
            )}
            <IOSSearchField
              value={query}
              onChange={onChange}
              /* BUG 2: no onSubmit, so the Search key (Enter) does nothing */
              onFocus={() => setMode('search')}
              active={mode === 'search'}
              onCancel={cancel}
              onClear={() => setQuery('')} /* BUG 1: results stay */
              placeholder="Dishes, restaurants"
              inputRef={input}
            />
          </div>

          {mode === 'home' ? (
            <>
              <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" role="radiogroup" aria-label="Category">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={chip === c}
                    onClick={() => setChip(c)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50 ${chip === c ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="px-4 pt-1 pb-1.5 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                Popular near you
              </p>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-6">
                {home.map((d) => (
                  <DishRow key={d.name} d={d} />
                ))}
              </ul>
            </>
          ) : view === 'results' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {results.length ? (
                <p className="truncate px-4 pt-1 pb-1.5 text-[12px] font-semibold whitespace-pre" style={{ color: sub }}>
                  {results.length} result{results.length === 1 ? '' : 's'} for “{submitted}”
                </p>
              ) : null}
              {results.length ? (
                <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-6">
                  {results.map((d) => (
                    <DishRow key={d.name} d={d} />
                  ))}
                </ul>
              ) : (
                <div className="px-6 pt-8 text-center">
                  <p className="text-[15px] font-semibold break-words">No results for “{submitted}”</p>
                  <p className="mt-1 text-[12px]" style={{ color: sub }}>
                    Try another dish or restaurant.
                  </p>
                </div>
              )}
            </div>
          ) : query ? (
            <ul className="min-h-0 flex-1 overflow-y-auto bg-white">
              <li>
                <button type="button" onClick={() => submit(query)} className="flex w-full items-center gap-3 border-b border-black/10 px-4 py-2.5 text-left text-[14px] outline-none focus-visible:bg-black/5">
                  <Search size={16} className="shrink-0 text-[#007aff]" />
                  <span className="min-w-0 truncate">
                    Search for <strong>“{query}”</strong>
                  </span>
                </button>
              </li>
              {suggestions.map((d) => (
                <li key={d.name}>
                  <button type="button" onClick={() => submit(d.name)} className="flex w-full items-center gap-3 border-b border-black/10 px-4 py-2.5 text-left text-[14px] outline-none focus-visible:bg-black/5">
                    <span className="w-4 shrink-0 text-center text-[14px]" aria-hidden="true">
                      {d.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{d.name}</span>
                    <span className="shrink-0 text-[11px]" style={{ color: sub }}>
                      {d.place}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="px-4 pt-1 pb-1.5 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                Recent searches
              </p>
              {recents.length === 0 ? (
                <p className="px-4 text-[13px]" style={{ color: sub }}>
                  No recent searches
                </p>
              ) : (
                <ul className="bg-white">
                  {recents.map((r, i) => (
                    <li key={`${r}-${i}`} className="flex items-center border-b border-black/10">
                      <button type="button" onClick={() => submit(r)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left text-[14px] whitespace-pre outline-none focus-visible:bg-black/5">
                        <History size={16} className="shrink-0" style={{ color: sub }} />
                        <span className="min-w-0 truncate">{r}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${r.trim() || 'search'}`}
                        onClick={() => setRecents((list) => list.filter((_, j) => j !== i))}
                        className="mr-2 grid size-9 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50"
                      >
                        <X size={15} style={{ color: sub }} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
        <label className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm">
          <span>
            Auto-Capitalization <span className="text-muted">(iOS keyboard setting, on by default)</span>
          </span>
          <input type="checkbox" checked={autoCap} onChange={(e) => setAutoCap(e.target.checked)} className="shrink-0 accent-[var(--brand)]" />
        </label>
      </div>
    </div>
  );
}
