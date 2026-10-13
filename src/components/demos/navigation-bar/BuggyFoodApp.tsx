import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, House, Receipt, RotateCcw, Search, Share, Star, User } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { IOSTabBar, IOS_BAR, IOS_BLUE, IOS_SEP, type Dest } from './Bars';

/*
 * A deliberately broken iOS food delivery app ("Snackr"). Bugs (don't spoil them!):
 *  1. The back button always shows the tab's ROOT title instead of the previous screen's title
 *     (Restaurants › Pizza Roma › Margherita shows "‹ Restaurants" but goes back to Pizza Roma).
 *  2. The small inline title is centered with no width limit, so a long restaurant name
 *     runs over the back button and the heart/share buttons once you scroll.
 *  3. Tapping the already selected tab does nothing (expected: pop to the tab's root, then scroll to top).
 *  4. The tab bar ignores the bottom safe area: its labels sit under the home indicator.
 *  5. The Orders badge decrements every time an update is opened, even one already read,
 *     so it reaches 0 while an unread update is still waiting.
 */

interface Restaurant {
  name: string;
  cuisine: string;
  rating: string;
  eta: string;
  color: string;
}
interface Update {
  id: string;
  title: string;
  body: string;
}
type Screen =
  | { kind: 'root' }
  | { kind: 'restaurant'; r: Restaurant }
  | { kind: 'dish'; r: Restaurant; dish: string }
  | { kind: 'update'; u: Update };

const RESTAURANTS: Restaurant[] = [
  { name: 'Pizza Roma', cuisine: 'Italian', rating: '4.7', eta: '20–30 min', color: '#f4c7a1' },
  { name: 'Sushi Kai', cuisine: 'Japanese', rating: '4.8', eta: '25–35 min', color: '#c9dfe8' },
  { name: 'Golden Dragon Noodle House & Dumplings', cuisine: 'Chinese', rating: '4.6', eta: '30–40 min', color: '#f2d27c' },
  { name: 'Green Bowl', cuisine: 'Salads', rating: '4.5', eta: '15–25 min', color: '#cfe6c4' },
  { name: 'Burger Barn', cuisine: 'Burgers', rating: '4.3', eta: '20–30 min', color: '#e8c1b0' },
  { name: 'Taco Loco', cuisine: 'Mexican', rating: '4.4', eta: '25–35 min', color: '#f6d0a8' },
  { name: 'Curry Leaf', cuisine: 'Indian', rating: '4.7', eta: '30–40 min', color: '#efd9a3' },
  { name: 'Café Mila', cuisine: 'Breakfast', rating: '4.9', eta: '10–20 min', color: '#e7dccd' },
  { name: 'Pho Saigon', cuisine: 'Vietnamese', rating: '4.6', eta: '25–35 min', color: '#d6e4cf' },
  { name: 'Falafel Corner', cuisine: 'Lebanese', rating: '4.5', eta: '15–25 min', color: '#ead8b5' },
];
const MENU: Record<string, string[]> = {
  Italian: ['Margherita', 'Diavola', 'Quattro formaggi', 'Funghi', 'Calzone', 'Tiramisu'],
  Chinese: ['Pork dumplings', 'Dan dan noodles', 'Kung pao chicken', 'Spring rolls', 'Fried rice', 'Mango pudding'],
};
const menuFor = (r: Restaurant) => MENU[r.cuisine] ?? ['House special', 'Chef’s salad', 'Soup of the day', 'Lemonade', 'Brownie', 'Side of fries'];

const UPDATES: Update[] = [
  { id: 'u1', title: 'Your Pizza Roma order is on its way', body: 'Marco picked up your order and will arrive in about 12 minutes.' },
  { id: 'u2', title: 'Rate your Sushi Kai order', body: 'How was your food yesterday? Your rating helps other customers.' },
];
const OLD = ['Order #4801 delivered', 'Order #4777 delivered', 'Refund of €4.50 processed', 'Order #4730 delivered'];

const TABS: Dest[] = [
  { label: 'Home', icon: House },
  { label: 'Search', icon: Search },
  { label: 'Orders', icon: Receipt },
  { label: 'Account', icon: User },
];
const ROOT_TITLES = ['Restaurants', 'Search', 'Orders', 'Account'];

function titleOf(s: Screen, tab: number) {
  if (s.kind === 'root') return ROOT_TITLES[tab];
  if (s.kind === 'restaurant') return s.r.name;
  if (s.kind === 'dish') return s.dish;
  return 'Update';
}

const fresh = (): Screen[][] => [[{ kind: 'root' }], [{ kind: 'root' }], [{ kind: 'root' }], [{ kind: 'root' }]];

function RestaurantRow({ r, onOpen }: { r: Restaurant; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-black/[0.03]">
        <span className="size-10 shrink-0 rounded-lg" style={{ background: r.color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">{r.name}</span>
          <span className="block truncate text-[12px] text-black/55">
            {r.cuisine} · ★ {r.rating} · {r.eta}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-black/30" aria-hidden="true" />
      </button>
    </li>
  );
}

export function BuggyFoodApp() {
  const [tab, setTab] = useState(0);
  const [stacks, setStacks] = useState<Screen[][]>(fresh);
  const [scrolled, setScrolled] = useState<Record<string, boolean>>({});
  const [unread, setUnread] = useState<Record<string, boolean>>({ u1: true, u2: true });
  const [badge, setBadge] = useState(2);
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const push = (t: number, s: Screen) => setStacks((st) => st.map((x, i) => (i === t ? [...x, s] : x)));
  const pop = (t: number) => setStacks((st) => st.map((x, i) => (i === t && x.length > 1 ? x.slice(0, -1) : x)));

  const selectTab = (i: number) => {
    if (i === tab) return; // BUG 3: re-tapping the selected tab is ignored
    setTab(i);
  };

  const openUpdate = (u: Update) => {
    setUnread((m) => ({ ...m, [u.id]: false }));
    setBadge((b) => Math.max(0, b - 1)); // BUG 5: decrements even if this update was already read
    push(2, { kind: 'update', u });
  };

  const restart = () => {
    setTab(0);
    setStacks(fresh());
    setScrolled({});
    setUnread({ u1: true, u2: true });
    setBadge(2);
    setQuery('');
    setLiked({});
  };

  const renderBody = (s: Screen, t: number) => {
    if (s.kind === 'root' && t === 0)
      return (
        <ul className="mx-3 mb-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
          {RESTAURANTS.map((r) => (
            <RestaurantRow key={r.name} r={r} onOpen={() => push(0, { kind: 'restaurant', r })} />
          ))}
        </ul>
      );
    if (s.kind === 'root' && t === 1) {
      const list = RESTAURANTS.filter((r) => `${r.name} ${r.cuisine}`.toLowerCase().includes(query.trim().toLowerCase()));
      return (
        <div className="px-3 pb-4">
          <label className="flex items-center gap-2 rounded-[10px] bg-[#e3e3e8] px-2 py-1.5 text-[14px]">
            <Search size={15} className="shrink-0 text-black/45" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Restaurants or dishes" aria-label="Search restaurants" className="w-0 min-w-0 flex-1 bg-transparent outline-none placeholder:text-black/45" />
          </label>
          <p className="mt-3 mb-1 px-1 text-[12px] font-semibold text-black/50 uppercase">{query ? 'Results' : 'Popular near you'}</p>
          {list.length ? (
            <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
              {list.map((r) => (
                <RestaurantRow key={r.name} r={r} onOpen={() => push(1, { kind: 'restaurant', r })} />
              ))}
            </ul>
          ) : (
            <p className="px-1 pt-4 text-center text-[13px] text-black/55">No results for “{query}”</p>
          )}
        </div>
      );
    }
    if (s.kind === 'root' && t === 2)
      return (
        <div className="px-3 pb-4">
          <p className="mb-1 px-1 text-[12px] font-semibold text-black/50 uppercase">Updates</p>
          <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
            {UPDATES.map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => openUpdate(u)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] hover:bg-black/[0.03]">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: unread[u.id] ? IOS_BLUE : 'transparent' }} aria-hidden="true" />
                  <span className={`min-w-0 flex-1 ${unread[u.id] ? 'font-semibold' : ''}`}>
                    {u.title}
                    {unread[u.id] && <span className="sr-only"> (unread)</span>}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-black/30" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 mb-1 px-1 text-[12px] font-semibold text-black/50 uppercase">Earlier</p>
          <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
            {OLD.map((o) => (
              <li key={o} className="px-3 py-2.5 text-[14px] text-black/70">
                {o}
              </li>
            ))}
          </ul>
        </div>
      );
    if (s.kind === 'root')
      return (
        <ul className="mx-3 mb-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white text-[14px]">
          {['Personal details', 'Addresses', 'Payment methods', 'Notifications', 'Language', 'Help', 'Log out'].map((x) => (
            <li key={x} className="px-3 py-2.5">
              {x}
            </li>
          ))}
        </ul>
      );
    if (s.kind === 'restaurant')
      return (
        <div className="pb-4">
          <p className="px-4 pb-2 text-[13px] text-black/55">
            <Star size={12} className="inline fill-current align-[-1px]" aria-hidden="true" /> {s.r.rating} · {s.r.cuisine} · {s.r.eta}
          </p>
          <ul className="mx-3 divide-y divide-black/10 overflow-hidden rounded-xl bg-white">
            {menuFor(s.r).map((d, i) => (
              <li key={d}>
                <button type="button" onClick={() => push(t, { kind: 'dish', r: s.r, dish: d })} className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-[14px] hover:bg-black/[0.03]">
                  <span className="min-w-0 truncate">{d}</span>
                  <span className="shrink-0 text-black/55">€{(7.5 + i * 1.8).toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    if (s.kind === 'dish')
      return (
        <div className="space-y-3 px-4 pt-3 pb-4 text-[14px]">
          <div className="h-28 rounded-xl" style={{ background: s.r.color }} />
          <p className="text-[22px] font-bold">{s.dish}</p>
          <p className="text-black/60">From {s.r.name}. Freshly made, ready in about 15 minutes.</p>
          <button type="button" className="h-11 w-full rounded-xl text-[15px] font-semibold text-white" style={{ background: IOS_BLUE }}>
            Add to basket
          </button>
        </div>
      );
    return (
      <div className="space-y-2 px-4 pt-3 text-[14px]">
        <p className="text-[18px] font-semibold">{s.u.title}</p>
        <p className="text-black/65">{s.u.body}</p>
      </div>
    );
  };

  const items = TABS.map((t, i) => (i === 2 ? { ...t, badge } : t));

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os="ios" width={290}>
        <div className="absolute inset-0 flex flex-col bg-[#f2f2f7] text-black" style={{ colorScheme: 'light' }}>
          <div className="relative min-h-0 flex-1">
            {stacks.map((stack, t) =>
              stack.map((s, depth) => {
                const key = `${t}-${depth}`;
                const top = t === tab && depth === stack.length - 1;
                const title = titleOf(s, t);
                const large = s.kind === 'root' || s.kind === 'restaurant';
                const showInline = !large || scrolled[key];
                const backLabel = depth > 0 ? titleOf(stack[0], t) : ''; // BUG 1: should be titleOf(stack[depth - 1], t)
                return (
                  <div key={key} className="absolute inset-0 flex flex-col bg-[#f2f2f7]" style={{ visibility: top ? 'visible' : 'hidden' }} aria-hidden={!top}>
                    <div className="relative flex h-11 shrink-0 items-center border-b px-1" style={{ background: showInline ? IOS_BAR : '#f2f2f7', borderColor: showInline ? IOS_SEP : 'transparent' }}>
                      {depth > 0 ? (
                        <button type="button" onClick={() => pop(t)} className="flex max-w-[45%] items-center text-[15px]" style={{ color: IOS_BLUE }}>
                          <ChevronLeft size={22} strokeWidth={2.4} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{backLabel}</span>
                        </button>
                      ) : null}
                      {/* BUG 2: centered, no max width, no truncation */}
                      <p className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15px] font-semibold whitespace-nowrap transition-opacity" style={{ opacity: showInline ? 1 : 0 }} aria-hidden={!showInline}>
                        {title}
                      </p>
                      <span className="flex-1" />
                      {s.kind === 'restaurant' && (
                        <span className="flex items-center" style={{ color: IOS_BLUE }}>
                          <button type="button" aria-label={liked[s.r.name] ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={!!liked[s.r.name]} onClick={() => setLiked((m) => ({ ...m, [s.r.name]: !m[s.r.name] }))} className="grid size-9 place-items-center">
                            <Heart size={19} className={liked[s.r.name] ? 'fill-current' : ''} />
                          </button>
                          <button type="button" aria-label="Share" className="grid size-9 place-items-center">
                            <Share size={19} />
                          </button>
                        </span>
                      )}
                    </div>
                    <div
                      className="min-h-0 flex-1 overflow-y-auto"
                      onScroll={(e) => {
                        const v = e.currentTarget.scrollTop > 40;
                        setScrolled((m) => (!!m[key] === v ? m : { ...m, [key]: v }));
                      }}
                    >
                      {s.kind === 'restaurant' && <div className="mx-3 mb-2 h-20 rounded-xl" style={{ background: s.r.color }} />}
                      {large && <h3 className="px-4 pt-0.5 pb-2 text-[28px] leading-tight font-bold">{title}</h3>}
                      {renderBody(s, t)}
                    </div>
                  </div>
                );
              }),
            )}
          </div>
          {/* BUG 4: no bottom safe-area padding */}
          <IOSTabBar items={items} value={tab} onSelect={selectTab} safeArea={false} />
        </div>
      </PhoneFrame>

      <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 py-2.5">
        <p className="text-xs text-muted">iPhone with Face ID · iOS</p>
        <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Restart app
        </button>
      </div>
    </div>
  );
}
