import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { Bell, ChevronLeft, ChevronRight, MessageCircle, Phone, PhoneIncoming, PhoneMissed, RotateCcw, Settings, ShoppingBag } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { CountBadge } from './Badge';

/*
 * A deliberately broken messenger. Bugs (don't spoil them for learners!):
 *  1. Calls badge shows "0" after the missed calls were seen (checks `!== null` instead of `> 0`).
 *  2. Channels badge shows "1284" uncapped; it spills over the Shop tab.
 *  3. Chats badge is stored once at launch and not updated when chats are read (only after a restart).
 *  4. Tab buttons are named "Chats, tab" without the count (the badge is aria-hidden and nothing replaces it).
 *  5. Shop "Sale" / "New" is shown only with a red or green dot (color only, nothing spoken).
 *  6. With Larger Text, the badge is moved onto the icon (to keep it inside the tab) and hides it.
 */

interface Chat {
  id: number;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread: number;
  messages: string[];
}

const initialChats: Chat[] = [
  { id: 1, name: 'Ana', initials: 'AN', color: '#ffd8a8', preview: 'Are we still on for Saturday?', time: '9:32', unread: 2, messages: ['Hey!', 'Are we still on for Saturday?'] },
  { id: 2, name: 'Family 🏡', initials: 'FA', color: '#bbf7d0', preview: 'Mom: Photos from the weekend', time: '9:05', unread: 5, messages: ['Dad: Dinner at 7?', 'Mom: Photos from the weekend'] },
  { id: 3, name: 'Marko', initials: 'MK', color: '#c7d2fe', preview: 'Sent the invoice', time: '8:47', unread: 1, messages: ['Sent the invoice'] },
  { id: 4, name: 'Luka', initials: 'LU', color: '#fecdd3', preview: 'Thanks, see you!', time: 'Yesterday', unread: 0, messages: ['Thanks, see you!'] },
];
const products = [
  { name: 'Trail runner 2', price: '€79.20', tag: 'sale' },
  { name: 'City sneaker', price: '€89.00', tag: 'new' },
  { name: 'Rain jacket', price: '€96.00', tag: 'sale' },
  { name: 'Wool socks', price: '€14.00', tag: 'new' },
] as const;
const RED = '#e0453a';
const GREEN = '#23853a';
const tabs = [
  { icon: MessageCircle, label: 'Chats' },
  { icon: Phone, label: 'Calls' },
  { icon: Bell, label: 'Channels' },
  { icon: ShoppingBag, label: 'Shop' },
  { icon: Settings, label: 'Settings' },
];
const unreadChats = (cs: Chat[]) => cs.filter((c) => c.unread > 0).length;

export function BuggyChatApp() {
  const [tab, setTab] = useState(0);
  const [chats, setChats] = useState(initialChats);
  const [chatBadge, setChatBadge] = useState(() => unreadChats(initialChats)); // BUG 3: stored once
  const [missed, setMissed] = useState(2);
  const [open, setOpen] = useState<number | null>(null);
  const [largeText, setLargeText] = useState(false);
  const [gray, setGray] = useState(false);
  const [sr, setSr] = useState(false);
  const [spoken, setSpoken] = useState('VoiceOver on. Tap once to hear an item, tap again to open it.');
  const srFocus = useRef<string | null>(null);

  useEffect(() => {
    if (tab === 1) setMissed(0);
  }, [tab]);

  // Simulated VoiceOver: first tap (or keyboard focus) reads the item, second tap activates it.
  const a11y = (id: string, speech: string, run: () => void) => ({
    onClick: () => {
      if (!sr || srFocus.current === id) {
        run();
        return;
      }
      srFocus.current = id;
      setSpoken(speech);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (sr && e.currentTarget.matches(':focus-visible')) {
        srFocus.current = id;
        setSpoken(speech);
      }
    },
  });

  const restart = () => {
    setChatBadge(unreadChats(chats));
    setOpen(null);
    setTab(0);
    srFocus.current = null;
  };
  const resetDemo = () => {
    setChats(initialChats);
    setChatBadge(unreadChats(initialChats));
    setMissed(2);
    setOpen(null);
    setTab(0);
    srFocus.current = null;
  };

  const s = largeText ? 1.35 : 1;
  const sub = 'rgba(60,60,67,.6)';
  const chat = chats.find((c) => c.id === open);

  const badgeFor = (i: number): string | null => {
    if (i === 0) return chatBadge > 0 ? String(chatBadge) : null;
    if (i === 1) return missed !== null ? String(missed) : null; // BUG 1
    if (i === 2) return String(1284); // BUG 2: no cap
    return null;
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="flex h-full flex-col bg-white text-black" style={{ colorScheme: 'light', filter: gray ? 'grayscale(1)' : undefined }}>
          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-3" style={{ fontSize: 13 * s }}>
            {tab === 0 && !chat && (
              <>
                <p className="font-bold tracking-tight" style={{ fontSize: 26 * s }}>
                  Chats
                </p>
                <ul className="mt-2">
                  {chats.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        {...a11y(`chat-${c.id}`, `${c.name}${c.unread ? `, ${c.unread} unread messages` : ''}, ${c.preview}, button`, () => {
                          setOpen(c.id);
                          setChats((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
                        })}
                        className="flex w-full items-center gap-2.5 border-b border-black/5 py-2 text-left"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-[#1f2937]" style={{ background: c.color }}>
                          {c.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-1">
                            <span className={`truncate ${c.unread ? 'font-bold' : 'font-medium'}`}>{c.name}</span>
                            <span className="shrink-0 text-[10px]" style={{ color: sub }}>
                              {c.time}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="min-w-0 flex-1 truncate text-[0.85em]" style={{ color: c.unread ? '#000' : sub }}>
                              {c.preview}
                            </span>
                            {c.unread > 0 && <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-[#007aff] px-1 text-[11px] font-semibold text-white">{c.unread}</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {tab === 0 && chat && (
              <div>
                <button type="button" {...a11y('back', 'Chats, back button', () => setOpen(null))} className="-ml-1 flex items-center text-[#007aff]" style={{ fontSize: 15 * s }}>
                  <ChevronLeft size={22} /> Chats
                </button>
                <p className="mt-2 text-center font-semibold">{chat.name}</p>
                <div className="mt-3 space-y-1.5">
                  {chat.messages.map((m) => (
                    <p key={m} className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-[#e9e9eb] px-3 py-1.5">
                      {m}
                    </p>
                  ))}
                  <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#007aff] px-3 py-1.5 text-white">👍</p>
                </div>
              </div>
            )}
            {tab === 1 && (
              <>
                <p className="font-bold tracking-tight" style={{ fontSize: 26 * s }}>
                  Calls
                </p>
                <ul className="mt-2">
                  {[
                    ['Ana', 'Missed', true],
                    ['Marko', 'Missed', true],
                    ['Mom', 'Incoming · 12 min', false],
                  ].map(([n, m, isMissed]) => (
                    <li key={n as string} className="flex items-center gap-2.5 border-b border-black/5 py-2">
                      {isMissed ? <PhoneMissed size={16} className="text-[#ff3b30]" /> : <PhoneIncoming size={16} style={{ color: sub }} />}
                      <span className="flex-1">
                        <span className={`block font-medium ${isMissed ? 'text-[#ff3b30]' : ''}`}>{n as string}</span>
                        <span className="block text-[0.8em]" style={{ color: sub }}>
                          {m as string}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {tab === 2 && (
              <>
                <p className="font-bold tracking-tight" style={{ fontSize: 26 * s }}>
                  Channels
                </p>
                <ul className="mt-2">
                  {[
                    ['Running club', 1042],
                    ['City news', 242],
                    ['Deals & coupons', 0],
                  ].map(([n, c]) => (
                    <li key={n as string} className="flex items-center justify-between border-b border-black/5 py-2.5">
                      <span className="font-medium">{n as string}</span>
                      {(c as number) > 0 && <span className="rounded-full bg-[#e9e9eb] px-2 text-[11px] tabular-nums">{(c as number).toLocaleString('en-US')}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {tab === 3 && (
              <>
                <p className="font-bold tracking-tight" style={{ fontSize: 26 * s }}>
                  Shop
                </p>
                <p className="mt-1 flex items-center gap-3 text-[11px]" style={{ color: sub }}>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: RED }} /> Sale
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: GREEN }} /> New
                  </span>
                </p>
                <ul className="mt-2 grid grid-cols-2 gap-2">
                  {products.map((p) => (
                    <li key={p.name}>
                      <button type="button" {...a11y(`p-${p.name}`, `${p.name}, ${p.price}, button`, () => setSpoken(sr ? `${p.name} opened` : spoken))} className="relative w-full rounded-xl bg-[#f2f2f7] p-2 text-left">
                        <span className="absolute top-2 right-2 size-2.5 rounded-full" style={{ background: p.tag === 'sale' ? RED : GREEN }} aria-hidden="true" />
                        <span className="mb-1.5 block h-12 rounded-lg bg-gradient-to-br from-[#e0e7ff] to-[#fce7f3]" />
                        <span className="block truncate text-[0.85em] font-medium">{p.name}</span>
                        <span className="block text-[0.8em]" style={{ color: sub }}>
                          {p.price}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {tab === 4 && (
              <>
                <p className="font-bold tracking-tight" style={{ fontSize: 26 * s }}>
                  Settings
                </p>
                <ul className="mt-2 overflow-hidden rounded-xl bg-[#f2f2f7]">
                  {['Notifications', 'Privacy', 'Chats', 'Storage and data'].map((r) => (
                    <li key={r} className="flex items-center justify-between border-b border-black/5 px-3 py-2.5 last:border-0">
                      {r} <ChevronRight size={14} style={{ color: sub }} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div role="tablist" aria-label="Main" className="flex shrink-0 border-t border-black/10 bg-[#f9f9f9] pt-1.5 pb-5">
            {tabs.map((t, i) => {
              const badge = badgeFor(i);
              return (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={tab === i}
                  aria-label={t.label /* BUG 4: no count */}
                  {...a11y(`tab-${i}`, `${t.label}${tab === i ? ', selected' : ''}, tab, ${i + 1} of 5`, () => {
                    setTab(i);
                    setOpen(null);
                  })}
                  className="relative flex min-w-0 flex-1 flex-col items-center"
                  style={{ color: tab === i ? '#007aff' : '#8e8e93' }}
                >
                  <span className="relative">
                    <t.icon size={24} />
                    {badge !== null && (
                      <span className="absolute z-10" style={largeText ? { left: -4, top: -2 } /* BUG 6 */ : { left: 14, top: -6 }}>
                        <CountBadge label={badge} scale={largeText ? 1.6 : 1} ring="#f9f9f9" />
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 max-w-full truncate px-0.5 font-medium" style={{ fontSize: largeText ? 12 : 10 }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {sr && (
            <div className="absolute inset-x-2 bottom-16 z-20 rounded-xl bg-black/85 px-3 py-2 text-[12px] leading-snug text-white" aria-live="off">
              <span className="mr-1 font-semibold text-[#64d2ff]">VoiceOver:</span>
              {spoken}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <div className="flex gap-3">
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCcw size={12} /> Restart app
            </button>
            <button type="button" onClick={resetDemo} className="text-xs font-medium text-muted underline hover:text-fg">
              Reset demo
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Larger text
            <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Color filter: grayscale
            <input type="checkbox" checked={gray} onChange={(e) => setGray(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 sm:col-span-2">
            Screen reader (VoiceOver captions)
            <input
              type="checkbox"
              checked={sr}
              onChange={(e) => {
                setSr(e.target.checked);
                srFocus.current = null;
                setSpoken('VoiceOver on. Tap once to hear an item, tap again to open it.');
              }}
              className="accent-[var(--brand)]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
