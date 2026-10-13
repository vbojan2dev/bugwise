import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Archive, ChevronLeft, ChevronRight, MailOpen, MessageCircle, RotateCcw, Trash2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken chat list with swipe actions. Bugs (don't spoil them for learners!):
 *  1. Several rows can be open at once, and an action button always acts on the FIRST open row,
 *     so tapping Archive on one chat archives another one.
 *  2. Open rows stay open while scrolling, and tapping an open row opens the chat instead of closing the row.
 *  3. Swipe "Archive" deletes the chat: it never reaches the Archived folder (the Archive button inside a chat works).
 *  4. With large text, the message preview no longer truncates and runs over the revealed buttons.
 *  5. The swipe actions are not exposed as accessibility actions: VoiceOver never says "Actions available".
 *  6. Open state is stored by row INDEX: after Delete, the next chat slides into that index and shows up already open.
 * Swiping uses Pointer Events with a direction lock, so it works with a mouse (drag) and a finger.
 */

interface Chat {
  id: number;
  name: string;
  preview: string;
  time: string;
  unread: number;
  color: string;
}

const seed: Chat[] = [
  { id: 1, name: 'Emma Clarke', preview: 'Booked the ramen place for 8pm, see you there!', time: '9:41', unread: 2, color: '#ff9500' },
  { id: 2, name: 'Mom', preview: 'Did you get the parcel I sent last week?', time: '9:30', unread: 1, color: '#ff2d55' },
  { id: 3, name: 'Running club', preview: 'Marco: Saturday 9am at the park entrance, bring water', time: '9:12', unread: 0, color: '#34c759' },
  { id: 4, name: 'Daniel Novak', preview: 'Can you review the sprint slides before lunch?', time: '8:55', unread: 0, color: '#5856d6' },
  { id: 5, name: 'Landlord (Mia)', preview: 'The plumber comes Tuesday between 10 and 12', time: '8:20', unread: 0, color: '#af52de' },
  { id: 6, name: 'FreshCart support', preview: 'Your refund of €12.40 has been processed', time: 'Yesterday', unread: 0, color: '#30b0c7' },
  { id: 7, name: 'Sofia Rossi', preview: 'Photos from the trip are in the shared album', time: 'Yesterday', unread: 0, color: '#ff3b30' },
  { id: 8, name: 'Book club', preview: 'Next pick: The Pragmatic Programmer. Thoughts?', time: 'Mon', unread: 0, color: '#a2845e' },
  { id: 9, name: 'Leo (Flatmate)', preview: 'We are out of coffee again…', time: 'Mon', unread: 0, color: '#007aff' },
  { id: 10, name: 'Grandpa', preview: 'Happy birthday! Call me when you can', time: 'Sun', unread: 0, color: '#8e8e93' },
  { id: 11, name: 'Team lunch', preview: 'Anna: Thai or pizza on Friday?', time: 'Sat', unread: 0, color: '#ffcc00' },
  { id: 12, name: 'CityRide', preview: 'Your verification code is 482 913', time: 'Fri', unread: 0, color: '#34c759' },
];

type Side = 'leading' | 'trailing';
const AW = 72;
const TRAIL_W = AW * 2;
const SLOP = 8;

interface Gesture {
  pid: number;
  x: number;
  y: number;
  index: number;
  base: number;
  lock: 'h' | 'v' | null;
}

export function BuggyChatsApp() {
  const [chats, setChats] = useState<Chat[]>(seed);
  const [archived, setArchived] = useState<Chat[]>([]);
  // BUG 1 + 6: a list of open rows (nothing closes the others), keyed by index instead of chat id.
  const [open, setOpen] = useState<{ index: number; side: Side }[]>([]);
  const [drag, setDragState] = useState<{ index: number; dx: number } | null>(null);
  const [view, setView] = useState<'list' | 'archived' | number>('list');
  const [snack, setSnack] = useState<{ text: string; undo: () => void } | null>(null);
  const [large, setLarge] = useState(false);
  const [vo, setVo] = useState(false);
  const [voIndex, setVoIndex] = useState<number | null>(null);
  const [caption, setCaption] = useState('');

  const g = useRef<Gesture | null>(null);
  const dragRef = useRef<{ index: number; dx: number } | null>(null);
  const suppress = useRef(false);
  const snackTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(snackTimer.current), []);

  const setDrag = (v: { index: number; dx: number } | null) => {
    dragRef.current = v;
    setDragState(v);
  };

  const showSnack = (text: string, undo: () => void) => {
    clearTimeout(snackTimer.current);
    setSnack({ text, undo });
    snackTimer.current = window.setTimeout(() => setSnack(null), 4500);
  };
  const hideSnack = () => {
    clearTimeout(snackTimer.current);
    setSnack(null);
  };

  const reinsert = (chat: Chat, index: number) => setChats((cs) => (cs.some((c) => c.id === chat.id) ? cs : [...cs.slice(0, index), chat, ...cs.slice(index)]));

  const offsetOf = (i: number) => {
    if (drag?.index === i) return drag.dx;
    const o = open.find((r) => r.index === i);
    return o ? (o.side === 'trailing' ? -TRAIL_W : AW) : 0;
  };

  const act = (kind: 'read' | 'archive' | 'delete') => {
    const target = open[0]; // BUG 1: assumes only one row can be open
    if (!target) return;
    const chat = chats[target.index];
    if (!chat) return;
    const idx = target.index;
    if (kind === 'read') {
      setChats((cs) => cs.map((c) => (c.id === chat.id ? { ...c, unread: c.unread ? 0 : 1 } : c)));
      setOpen((o) => o.filter((r) => r.index !== idx));
    } else if (kind === 'archive') {
      // BUG 3: "archive" just removes the chat. Nothing is added to `archived`.
      setChats((cs) => cs.filter((c) => c.id !== chat.id));
      setOpen((o) => o.filter((r) => r.index !== idx));
      showSnack('Chat archived', () => {
        reinsert(chat, idx);
        hideSnack();
      });
    } else {
      setChats((cs) => cs.filter((c) => c.id !== chat.id));
      // BUG 6: the open entry for this index is not removed, so the next chat inherits it.
      showSnack('Chat deleted', () => {
        reinsert(chat, idx);
        hideSnack();
      });
    }
  };

  const openChat = (id: number) => {
    setView(id);
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    setVoIndex(null);
    setCaption('');
  };

  const announce = (i: number) => {
    const c = chats[i];
    if (!c) return;
    setVoIndex(i);
    // BUG 5: no accessibility custom actions, so there is no "Actions available" hint.
    setCaption(`${c.name}, ${c.unread ? `${c.unread} unread, ` : ''}${c.preview}, ${c.time}, Button`);
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>, i: number) => {
    suppress.current = false;
    if (vo || g.current) return; // VoiceOver handles gestures itself
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    g.current = { pid: e.pointerId, x: e.clientX, y: e.clientY, index: i, base: offsetOf(i), lock: null };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    const dx = e.clientX - cur.x;
    const dy = e.clientY - cur.y;
    if (!cur.lock) {
      if (Math.hypot(dx, dy) < SLOP) return;
      cur.lock = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (cur.lock === 'h') {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone */
        }
      }
    }
    if (cur.lock !== 'h') return;
    let next = cur.base + dx;
    if (next < -TRAIL_W) next = -TRAIL_W + (next + TRAIL_W) * 0.25;
    if (next > AW) next = AW + (next - AW) * 0.25;
    setDrag({ index: cur.index, dx: next });
  };

  const onUp = (canceled: boolean) => {
    const cur = g.current;
    g.current = null;
    if (!cur || cur.lock !== 'h') return;
    suppress.current = true;
    const final = dragRef.current?.dx ?? cur.base;
    setDrag(null);
    if (canceled) return;
    const i = cur.index;
    const rest = (o: { index: number; side: Side }[]) => o.filter((r) => r.index !== i);
    if (final < -TRAIL_W / 2) setOpen((o) => [...rest(o), { index: i, side: 'trailing' }]);
    else if (final > AW / 2) setOpen((o) => [...rest(o), { index: i, side: 'leading' }]);
    else setOpen(rest);
  };

  const onRowClick = (i: number) => {
    if (suppress.current) {
      suppress.current = false;
      return;
    }
    if (vo) {
      announce(i);
      return;
    }
    const c = chats[i];
    if (c) openChat(c.id); // BUG 2: opens the chat even when the row is open (expected: close the row)
  };

  const archiveFromChat = (chat: Chat) => {
    const idx = chats.findIndex((c) => c.id === chat.id);
    setChats((cs) => cs.filter((c) => c.id !== chat.id));
    setArchived((a) => [chat, ...a.filter((c) => c.id !== chat.id)]);
    setOpen([]);
    setView('list');
    showSnack('Chat archived', () => {
      setArchived((a) => a.filter((c) => c.id !== chat.id));
      reinsert(chat, idx);
      hideSnack();
    });
  };

  const restart = () => {
    clearTimeout(snackTimer.current);
    g.current = null;
    setChats(seed);
    setArchived([]);
    setOpen([]);
    setDrag(null);
    setView('list');
    setSnack(null);
    setVoIndex(null);
    setCaption('');
  };

  const blue = '#007aff';
  const sub = 'rgba(60,60,67,.6)';
  const current = typeof view === 'number' ? chats.find((c) => c.id === view) : undefined;

  const avatar = (c: Chat) => (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${large ? 'size-12 text-[20px]' : 'size-11 text-[17px]'}`} style={{ background: c.color }}>
      {c.name[0]}
    </span>
  );

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full overflow-hidden bg-white text-black">
          {current ? (
            <div className="flex h-full flex-col bg-[#f2f2f7]">
              <div className="flex shrink-0 items-center gap-1 border-b border-[#d1d1d6] bg-[#f9f9f9] px-2 py-2">
                <button type="button" onClick={() => setView('list')} className="flex items-center text-[15px]" style={{ color: blue }}>
                  <ChevronLeft size={22} /> Chats
                </button>
                <span className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold">{current.name}</span>
                <button type="button" aria-label="Archive chat" onClick={() => archiveFromChat(current)} className="grid size-9 place-items-center rounded-full" style={{ color: blue }}>
                  <Archive size={19} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 text-[14px]">
                <p className="mr-10 w-fit rounded-2xl rounded-bl-md bg-white px-3 py-2">Hey! Quick question about the weekend</p>
                <p className="ml-10 w-fit rounded-2xl rounded-br-md bg-[#007aff] px-3 py-2 text-white" style={{ marginLeft: 'auto' }}>
                  Sure, what’s up?
                </p>
                <p className="mr-10 w-fit rounded-2xl rounded-bl-md bg-white px-3 py-2">{current.preview}</p>
              </div>
              <div className="shrink-0 border-t border-[#d1d1d6] bg-[#f9f9f9] px-3 pt-2 pb-6">
                <div className="rounded-full border border-[#d1d1d6] bg-white px-3 py-1.5 text-[13px]" style={{ color: sub }}>
                  Message
                </div>
              </div>
            </div>
          ) : view === 'archived' ? (
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-center px-2 pt-2">
                <button type="button" onClick={() => setView('list')} className="flex items-center text-[15px]" style={{ color: blue }}>
                  <ChevronLeft size={22} /> Chats
                </button>
              </div>
              <p className="shrink-0 px-4 pt-1 pb-2 text-[26px] font-bold tracking-tight">Archived</p>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {archived.length === 0 && (
                  <p className="px-6 py-10 text-center text-[14px]" style={{ color: sub }}>
                    No archived chats
                  </p>
                )}
                {archived.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 border-b border-[#e5e5ea] px-3 py-2.5">
                    {avatar(c)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{c.name}</span>
                      <span className="block truncate text-[13px]" style={{ color: sub }}>
                        {c.preview}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className={`shrink-0 px-4 pt-3 pb-2 font-bold tracking-tight ${large ? 'text-[30px]' : 'text-[26px]'}`}>Chats</p>
              <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-8">
                <button
                  type="button"
                  onClick={() => setView('archived')}
                  className={`flex w-full items-center gap-3 border-b border-[#e5e5ea] px-4 py-2 text-left ${large ? 'text-[19px]' : 'text-[15px]'}`}
                >
                  <Archive size={18} style={{ color: sub }} aria-hidden="true" />
                  <span className="flex-1 font-medium">Archived</span>
                  <span style={{ color: sub }}>{archived.length}</span>
                  <ChevronRight size={16} color="#c4c4c7" aria-hidden="true" />
                </button>
                {chats.length === 0 && (
                  <p className="px-6 py-10 text-center text-[14px]" style={{ color: sub }}>
                    No chats yet
                  </p>
                )}
                {chats.map((c, i) => {
                  const offset = offsetOf(i);
                  const dragging = drag?.index === i;
                  const focused = vo && voIndex === i;
                  return (
                    <div key={c.id} className="relative overflow-hidden border-b border-[#e5e5ea]">
                      {offset > 0 && (
                        <div className="absolute inset-y-0 left-0 flex" style={{ width: AW }}>
                          <button type="button" onClick={() => act('read')} className="flex flex-1 flex-col items-center justify-center gap-1 bg-[#007aff] text-[12px] font-medium text-white">
                            <MailOpen size={18} /> {c.unread ? 'Read' : 'Unread'}
                          </button>
                        </div>
                      )}
                      {offset < 0 && (
                        <div className="absolute inset-y-0 right-0 flex" style={{ width: TRAIL_W }}>
                          <button type="button" onClick={() => act('archive')} className="flex flex-1 flex-col items-center justify-center gap-1 bg-[#5856d6] text-[12px] font-medium text-white">
                            <Archive size={18} /> Archive
                          </button>
                          <button type="button" onClick={() => act('delete')} className="flex flex-1 flex-col items-center justify-center gap-1 bg-[#ff3b30] text-[12px] font-medium text-white">
                            <Trash2 size={18} /> Delete
                          </button>
                        </div>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${c.name}, ${c.preview}`}
                        onPointerDown={(e) => onDown(e, i)}
                        onPointerMove={onMove}
                        onPointerUp={() => onUp(false)}
                        onPointerCancel={() => onUp(true)}
                        onClick={() => onRowClick(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openChat(c.id);
                          }
                        }}
                        className={`relative flex cursor-default items-center gap-3 bg-white px-3 outline-none select-none focus-visible:bg-[#e8f1ff] ${large ? 'py-3' : 'py-2.5'}`}
                        style={{
                          transform: `translateX(${offset}px)`,
                          transition: dragging ? 'none' : 'transform 200ms cubic-bezier(.2,.8,.2,1)',
                          touchAction: 'pan-y',
                          WebkitUserSelect: 'none',
                          boxShadow: focused ? 'inset 0 0 0 3px #000' : undefined,
                        }}
                      >
                        {avatar(c)}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className={`min-w-0 flex-1 truncate font-semibold ${large ? 'text-[19px]' : 'text-[15px]'}`}>{c.name}</span>
                            <span className={`shrink-0 ${large ? 'text-[15px]' : 'text-[12px]'}`} style={{ color: sub }}>
                              {c.time}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            {/* BUG 4: large text swaps `truncate` for `whitespace-nowrap`, so the preview overflows its box */}
                            <span className={`min-w-0 flex-1 ${large ? 'text-[17px] whitespace-nowrap' : 'truncate text-[13px]'}`} style={{ color: sub }}>
                              {c.preview}
                            </span>
                            {c.unread > 0 && (
                              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#007aff] px-1.5 text-[12px] font-semibold text-white">{c.unread}</span>
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {snack && (
            <div className="absolute inset-x-3 bottom-6 z-10 flex items-center gap-2 rounded-xl bg-[#1c1c1e]/95 px-3 py-2.5 text-[13px] text-white shadow-lg" role="status">
              <span className="min-w-0 flex-1 truncate">{snack.text}</span>
              <button type="button" onClick={snack.undo} className="shrink-0 font-semibold text-[#0a84ff]">
                Undo
              </button>
            </div>
          )}
          {vo && caption && (
            <div className="absolute inset-x-2 top-1 z-20 rounded-lg bg-black/85 px-3 py-2 text-[12px] leading-snug text-white" aria-live="polite">
              {caption}
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
        <div className="mt-2 space-y-2 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">Larger text (accessibility size)</span>
            <input type="checkbox" checked={large} onChange={(e) => setLarge(e.target.checked)} className="size-4 accent-[#5b4bff]" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted">VoiceOver (simulated)</span>
            <input
              type="checkbox"
              checked={vo}
              onChange={(e) => {
                setVo(e.target.checked);
                setVoIndex(null);
                setCaption(e.target.checked ? 'VoiceOver on. Tap a chat to focus it.' : '');
              }}
              className="size-4 accent-[#5b4bff]"
            />
          </label>
          {vo && (
            <div className="space-y-2 rounded-xl bg-subtle p-2.5">
              <p className="text-xs text-muted">With VoiceOver on, a tap only focuses a row. Swiping a row does nothing; use these VoiceOver gestures instead:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={voIndex === null}
                  onClick={() => setCaption('(VoiceOver plays the "boop" sound: this row has no actions)')}
                  className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium ring-1 ring-line hover:text-fg disabled:opacity-40"
                >
                  Swipe down (next action)
                </button>
                <button
                  type="button"
                  disabled={voIndex === null}
                  onClick={() => {
                    const c = voIndex !== null ? chats[voIndex] : undefined;
                    if (c) openChat(c.id);
                  }}
                  className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium ring-1 ring-line hover:text-fg disabled:opacity-40"
                >
                  Double-tap (open)
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-faint">
          <MessageCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Drag a chat left or right with your mouse or finger. Scroll with the wheel or by swiping up and down.
        </p>
      </div>
    </div>
  );
}
