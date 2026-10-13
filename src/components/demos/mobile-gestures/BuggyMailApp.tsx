import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ChevronLeft, CornerUpLeft, CornerUpRight, Flag, Mail, MailOpen, RotateCcw, Trash2 } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken mail inbox with swipe actions. Bugs (don't spoil them for learners!):
 *  1. Swipe to delete removes the email immediately: no Undo, no confirmation, no trash.
 *  2. The delete threshold is tiny: a 24 px nudge deletes (expected: reveal the action, delete only past ~50% or a deliberate fling).
 *  3. Delete is only possible by swiping: not in the long-press menu, not in the opened email (no button alternative).
 *  4. A long press opens the context menu AND the email (the tap action also fires on release).
 *  5. Pull to refresh fires twice (once while pulling, once on release) and the spinner never stops.
 *  6. No direction lock: a mostly vertical scroll with a slight sideways drift swipes (and deletes) a row.
 * Everything uses Pointer Events, so all bugs reproduce with a mouse too.
 */

interface MailItem {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  flagged: boolean;
}

const seed: Omit<MailItem, 'id'>[] = [
  { from: 'FreshCart', subject: 'Your order is on its way', preview: 'Rider Marco is 8 minutes away with your groceries…', time: '9:38', unread: true, flagged: false },
  { from: 'Emma Clarke', subject: 'Dinner on Friday?', preview: 'There is a new ramen place near the station, want to…', time: '9:12', unread: true, flagged: false },
  { from: 'Northwind Bank', subject: 'Your statement is ready', preview: 'Your September statement for account ending 4821…', time: '8:47', unread: false, flagged: true },
  { from: 'SkyTrail Airlines', subject: 'Check-in is open: LIS → BER', preview: 'Your flight ST 482 departs tomorrow at 07:15…', time: '8:02', unread: true, flagged: false },
  { from: 'PulseFit', subject: 'You hit your step goal 5 days in a row', preview: 'Keep the streak going! This week you walked 52 km…', time: 'Yesterday', unread: false, flagged: false },
  { from: 'Daniel Novak', subject: 'Re: Sprint review slides', preview: 'Looks good, I added two screenshots of the new…', time: 'Yesterday', unread: false, flagged: false },
  { from: 'CityRide', subject: 'Your weekend trips', preview: 'You took 3 rides this weekend. Total: €18.40…', time: 'Yesterday', unread: false, flagged: false },
  { from: 'Mia (Landlord)', subject: 'Plumber visit on Tuesday', preview: 'Hi! The plumber will come between 10 and 12, please…', time: 'Mon', unread: false, flagged: true },
  { from: 'BookNook', subject: 'Your library loan is due soon', preview: '"The Pragmatic Programmer" is due back on Oct 18…', time: 'Mon', unread: false, flagged: false },
  { from: 'StayWell Hotels', subject: 'Booking confirmed #HX-20931', preview: 'Thanks for booking 2 nights in Porto. Check-in from…', time: 'Sun', unread: false, flagged: false },
  { from: 'Gym Buddies', subject: 'Saturday 9am run', preview: 'Meeting point is the park entrance, bring water…', time: 'Sat', unread: false, flagged: false },
  { from: 'Tax Office', subject: 'Reminder: file by Oct 31', preview: 'This is a friendly reminder that the deadline for…', time: 'Fri', unread: false, flagged: false },
];

const incoming: Omit<MailItem, 'id'>[] = [
  { from: 'FreshCart', subject: 'Delivered! Rate your rider', preview: 'Your groceries were delivered at 9:46. How was…', time: 'Now', unread: true, flagged: false },
  { from: 'Emma Clarke', subject: 'Re: Dinner on Friday?', preview: 'Booked a table for 8pm 🍜 see you there!', time: 'Now', unread: true, flagged: false },
  { from: 'SkyTrail Airlines', subject: 'Your boarding pass', preview: 'Seat 14C · Gate opens 06:30 · Boarding group B…', time: 'Now', unread: true, flagged: false },
];

const fresh = () => seed.map((m, i) => ({ ...m, id: i + 1 }));

const SLOP = 8;
const LONG_PRESS = 500;
const DELETE_AT = 24; // BUG 2: far too low
const PULL_AT = 60;

interface LogEntry {
  id: number;
  status: 'pending' | 'ok' | 'canceled';
}

interface Gesture {
  pid: number;
  x: number;
  y: number;
  t: number;
  rowId: number | null;
  scroll: number;
  moved: boolean;
  longFired: boolean;
  pullFired: boolean;
}

export function BuggyMailApp() {
  const [mails, setMails] = useState<MailItem[]>(fresh);
  const [openId, setOpenId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [swipe, setSwipe] = useState<{ id: number; dx: number } | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const list = useRef<HTMLDivElement>(null);
  const g = useRef<Gesture | null>(null);
  const swipeRef = useRef<{ id: number; dx: number } | null>(null);
  const pullRef = useRef(0);
  const longTimer = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const latest = useRef(0);
  const inFlight = useRef(false);
  const nextIncoming = useRef(0);
  const nextId = useRef(100);
  const lastUp = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(longTimer.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const setSwipeBoth = (v: { id: number; dx: number } | null) => {
    swipeRef.current = v;
    setSwipe(v);
  };
  const setPullBoth = (v: number) => {
    pullRef.current = v;
    setPull(v);
  };

  const openMail = (id: number) => {
    setOpenId(id);
    setMails((ms) => ms.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  };

  const refresh = () => {
    const id = ++seq.current;
    latest.current = id; // BUG 5: "latest request" is updated before the duplicate check below
    if (inFlight.current) {
      setLog((l) => [{ id, status: 'canceled' as const }, ...l].slice(0, 5));
      return;
    }
    inFlight.current = true;
    setRefreshing(true);
    setLog((l) => [{ id, status: 'pending' as const }, ...l].slice(0, 5));
    timers.current.push(
      window.setTimeout(() => {
        inFlight.current = false;
        const next = incoming[nextIncoming.current];
        if (next) {
          nextIncoming.current++;
          setMails((ms) => [{ ...next, id: nextId.current++ }, ...ms]);
        }
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: 'ok' } : e)));
        if (id === latest.current) setRefreshing(false); // never true when a duplicate was dropped
      }, 1200),
    );
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (g.current) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    const rowId = row ? Number(row.dataset.row) : null;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    g.current = { pid: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), rowId, scroll: list.current?.scrollTop ?? 0, moved: false, longFired: false, pullFired: false };
    clearTimeout(longTimer.current);
    if (rowId !== null) {
      longTimer.current = window.setTimeout(() => {
        const cur = g.current;
        if (cur && !cur.moved) {
          cur.longFired = true;
          setMenuId(rowId);
        }
      }, LONG_PRESS);
    }
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    const dx = e.clientX - cur.x;
    const dy = e.clientY - cur.y;
    if (!cur.moved && Math.hypot(dx, dy) > SLOP) {
      cur.moved = true;
      clearTimeout(longTimer.current);
    }
    if (!cur.moved || cur.longFired) return;

    // BUG 6: no direction lock. Horizontal (row swipe) and vertical (scroll / pull) are handled at the same time.
    if (cur.rowId !== null) setSwipeBoth({ id: cur.rowId, dx: Math.min(0, dx) });

    if (cur.scroll <= 0 && dy > 0) {
      const p = Math.min(dy * 0.5, 90);
      setPullBoth(p);
      if (p >= PULL_AT && !cur.pullFired) {
        cur.pullFired = true;
        refresh(); // BUG 5: fires while still pulling…
      }
    } else if (list.current) {
      list.current.scrollTop = cur.scroll - dy;
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cur = g.current;
    if (!cur || e.pointerId !== cur.pid) return;
    lastUp.current = performance.now();
    g.current = null;
    clearTimeout(longTimer.current);
    const duration = performance.now() - cur.t;

    if (cur.rowId !== null && !cur.moved && (cur.longFired || duration < LONG_PRESS)) {
      openMail(cur.rowId); // BUG 4: also runs after a long press, so the email opens under the menu
    }

    const s = swipeRef.current;
    if (s && s.dx <= -DELETE_AT && e.type !== 'pointercancel') {
      setMails((ms) => ms.filter((m) => m.id !== s.id)); // BUG 1: gone for good, no Undo
    }
    setSwipeBoth(null);

    if (pullRef.current >= PULL_AT) refresh(); // BUG 5: …and again on release
    setPullBoth(0);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(longTimer.current);
    g.current = null;
    inFlight.current = false;
    seq.current = 0;
    latest.current = 0;
    nextIncoming.current = 0;
    setMails(fresh());
    setOpenId(null);
    setMenuId(null);
    setSwipeBoth(null);
    setPullBoth(0);
    setRefreshing(false);
    setLog([]);
    if (list.current) list.current.scrollTop = 0;
  };

  const toggle = (id: number, key: 'unread' | 'flagged') => {
    setMails((ms) => ms.map((m) => (m.id === id ? { ...m, [key]: !m[key] } : m)));
    setMenuId(null);
  };

  const open = mails.find((m) => m.id === openId);
  const menuMail = mails.find((m) => m.id === menuId);
  const unreadCount = mails.filter((m) => m.unread).length;
  const blue = '#007aff';
  const sub = 'rgba(60,60,67,.6)';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full overflow-hidden bg-white text-black">
          {open ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center px-2 pt-2">
                <button type="button" onClick={() => setOpenId(null)} className="flex items-center text-[15px]" style={{ color: blue }}>
                  <ChevronLeft size={22} /> Inbox
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
                <p className="text-[20px] leading-tight font-bold">{open.subject}</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-[#e5e5ea] text-[14px] font-semibold" style={{ color: '#3a3a3c' }}>
                    {open.from[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">{open.from}</span>
                    <span className="block text-[12px]" style={{ color: sub }}>
                      To: me · {open.time}
                    </span>
                  </span>
                  {open.flagged && <Flag size={16} className="ml-auto shrink-0 fill-[#ff9500] text-[#ff9500]" />}
                </div>
                <p className="mt-4 text-[14px] leading-relaxed">{open.preview.replace('…', '.')}</p>
                <p className="mt-3 text-[14px] leading-relaxed" style={{ color: sub }}>
                  This is a demo email. Look at the toolbar below: which actions can you take from here?
                </p>
              </div>
              {/* BUG 3: no Delete / Archive button here */}
              <div className="flex shrink-0 items-center justify-around border-t border-[#e5e5ea] px-4 pt-2 pb-6">
                <button type="button" aria-label="Reply" className="p-2" style={{ color: blue }}>
                  <CornerUpLeft size={20} />
                </button>
                <button type="button" aria-label="Forward" className="p-2" style={{ color: blue }}>
                  <CornerUpRight size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="shrink-0 px-4 pt-3 pb-2">
                <p className="text-[26px] leading-none font-bold tracking-tight">Inbox</p>
                <p className="mt-1 text-[12px]" style={{ color: sub }}>
                  {unreadCount} unread · {mails.length} emails
                </p>
              </div>
              <div
                ref={list}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onContextMenu={(e) => e.preventDefault()}
                className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6 select-none"
                style={{ touchAction: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              >
                {(pull > 0 || refreshing) && (
                  <div className="flex items-center justify-center gap-2 text-[12px]" style={{ height: refreshing ? 44 : pull, color: sub }}>
                    {refreshing ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-[#8e8e93] border-t-transparent" /> Checking for mail…
                      </>
                    ) : (
                      <>
                        <ArrowDown size={14} className="transition-transform" style={{ transform: pull >= PULL_AT ? 'rotate(180deg)' : undefined }} />
                        {pull >= PULL_AT ? 'Release to refresh' : 'Pull to refresh'}
                      </>
                    )}
                  </div>
                )}
                {mails.length === 0 && (
                  <p className="px-4 py-10 text-center text-[13px]" style={{ color: sub }}>
                    No emails. Inbox zero!
                  </p>
                )}
                {mails.map((m) => {
                  const dx = swipe?.id === m.id ? swipe.dx : 0;
                  return (
                    <div key={m.id} className="relative border-b border-[#e5e5ea]">
                      {dx < 0 && (
                        <div className="absolute inset-0 flex items-center justify-end bg-[#ff3b30] pr-4 text-[12px] font-semibold text-white">
                          <span className="flex flex-col items-center gap-0.5">
                            <Trash2 size={16} /> Delete
                          </span>
                        </div>
                      )}
                      <div
                        data-row={m.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${m.unread ? 'Unread. ' : ''}${m.from}. ${m.subject}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openMail(m.id);
                          }
                        }}
                        className="relative flex cursor-default gap-2 bg-white py-2.5 pr-3 pl-2 outline-none focus-visible:bg-[#e8f1ff]"
                        style={{ transform: `translateX(${dx}px)` }}
                      >
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: m.unread ? blue : 'transparent' }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className={`min-w-0 flex-1 truncate text-[14px] ${m.unread ? 'font-bold' : 'font-semibold'}`}>{m.from}</span>
                            {m.flagged && <Flag size={11} className="shrink-0 fill-[#ff9500] text-[#ff9500]" />}
                            <span className="shrink-0 text-[11px]" style={{ color: sub }}>
                              {m.time}
                            </span>
                          </span>
                          <span className="block truncate text-[13px]">{m.subject}</span>
                          <span className="block truncate text-[12px]" style={{ color: sub }}>
                            {m.preview}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {menuMail && (
            <div className="absolute inset-0 z-20 flex flex-col justify-center gap-2 bg-black/35 px-4 backdrop-blur-[3px]" onClick={() => setMenuId(null)}
              onClickCapture={(e) => {
                // Ignore the click the browser sends right after the press that opened the menu.
                if (performance.now() - lastUp.current < 150) e.stopPropagation();
              }}
            >
              <div className="rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <p className="truncate text-[13px] font-semibold">{menuMail.from}</p>
                <p className="truncate text-[12px]">{menuMail.subject}</p>
                <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: sub }}>
                  {menuMail.preview}
                </p>
              </div>
              {/* BUG 3: no Delete here either */}
              <div role="menu" aria-label="Email actions" className="w-52 self-end overflow-hidden rounded-2xl bg-white/95 text-[14px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                {[
                  { label: 'Reply', icon: CornerUpLeft, run: () => setMenuId(null) },
                  { label: 'Forward', icon: CornerUpRight, run: () => setMenuId(null) },
                  { label: menuMail.unread ? 'Mark as Read' : 'Mark as Unread', icon: menuMail.unread ? MailOpen : Mail, run: () => toggle(menuMail.id, 'unread') },
                  { label: menuMail.flagged ? 'Unflag' : 'Flag', icon: Flag, run: () => toggle(menuMail.id, 'flagged') },
                ].map((a, i) => (
                  <button key={a.label} type="button" role="menuitem" onClick={a.run} className={`flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-black/5 ${i ? 'border-t border-[#e5e5ea]' : ''}`}>
                    {a.label}
                    <a.icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">How to interact</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Mouse or finger: <strong className="text-fg">drag</strong> rows sideways to swipe, drag the list up/down to scroll, pull down at the top to refresh, <strong className="text-fg">press and hold</strong> a row for the menu.
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Pull to refresh to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">GET</span>
              <span className="min-w-0 flex-1 truncate">/api/inbox?since=latest</span>
              {e.status === 'ok' && <span className="text-[#34d399]">200 · 1.2s</span>}
              {e.status === 'pending' && <span className="text-[#fbbf24]">pending…</span>}
              {e.status === 'canceled' && <span className="text-[#f87171]">canceled</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
