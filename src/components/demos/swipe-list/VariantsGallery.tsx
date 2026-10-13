import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, Flag, Mail, MailOpen, MapPin, MoreVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { SwipeRow, type Side } from './SwipeRow';

function Card({ title, platform, note, chips, children, bg = '#e9ebf2' }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid place-items-center px-3 py-5" style={{ background: bg, colorScheme: 'light' }}>
        <div className="relative h-[330px] w-full max-w-[290px] overflow-hidden rounded-[22px] border border-black/10 shadow-sm">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

/** A short-lived message with an optional Undo, like a snackbar / toast. */
function useToast() {
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (text: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setToast({ text, undo });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setToast(null);
  };
  return { toast, show, hide };
}

/* ───────── 1. iOS: reveal buttons + full swipe ───────── */

interface IosMail {
  id: number;
  from: string;
  subject: string;
  time: string;
  unread: boolean;
  flagged: boolean;
}

const iosSeed: IosMail[] = [
  { id: 1, from: 'FreshCart', subject: 'Your groceries are on the way', time: '9:38', unread: true, flagged: false },
  { id: 2, from: 'Northwind Bank', subject: 'Your statement is ready', time: '8:47', unread: false, flagged: false },
  { id: 3, from: 'SkyTrail Airlines', subject: 'Check-in is open', time: '8:02', unread: true, flagged: false },
  { id: 4, from: 'PulseFit', subject: '5-day streak, nice!', time: 'Yesterday', unread: false, flagged: false },
  { id: 5, from: 'StayWell Hotels', subject: 'Booking confirmed', time: 'Sun', unread: false, flagged: false },
];

function IosDemo() {
  const [items, setItems] = useState(iosSeed);
  const [open, setOpen] = useState<{ id: number; side: Side } | null>(null);
  const { toast, show, hide } = useToast();

  const act = (m: IosMail, key: string) => {
    if (key === 'read') setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, unread: !x.unread } : x)));
    if (key === 'flag') setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, flagged: !x.flagged } : x)));
    if (key === 'trash') {
      let index = 0;
      setItems((xs) => {
        index = xs.findIndex((x) => x.id === m.id);
        return xs.filter((x) => x.id !== m.id);
      });
      show('Moved to Trash', () => {
        setItems((xs) => (xs.some((x) => x.id === m.id) ? xs : [...xs.slice(0, index), m, ...xs.slice(index)]));
        hide();
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-white text-black">
      <div className="shrink-0 px-4 pt-4 pb-2">
        <p className="text-[24px] leading-none font-bold tracking-tight">Inbox</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={() => setOpen(null)}>
        {items.map((m) => (
          <div key={m.id} className="border-b border-[#e5e5ea]">
            <SwipeRow
              label={`${m.unread ? 'Unread, ' : ''}${m.from}, ${m.subject}`}
              leading={[{ key: 'read', label: m.unread ? 'Read' : 'Unread', icon: m.unread ? MailOpen : Mail, bg: '#007aff' }]}
              trailing={[
                { key: 'trash', label: 'Trash', icon: Trash2, bg: '#ff3b30' },
                { key: 'flag', label: m.flagged ? 'Unflag' : 'Flag', icon: Flag, bg: '#ff9500' },
              ]}
              fullSwipe
              open={open?.id === m.id ? open.side : null}
              onOpenChange={(side) => setOpen(side ? { id: m.id, side } : null)}
              onDragStart={() => setOpen((o) => (o && o.id !== m.id ? null : o))}
              onAction={(k) => act(m, k)}
              onTap={() => setOpen(null)}
            >
              <div className="flex gap-2 py-2.5 pr-3 pl-2">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: m.unread ? '#007aff' : 'transparent' }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{m.from}</span>
                    {m.flagged && <Flag size={11} className="shrink-0 fill-[#ff9500] text-[#ff9500]" />}
                    <span className="shrink-0 text-[11px] text-[rgba(60,60,67,.6)]">{m.time}</span>
                  </span>
                  <span className="block truncate text-[13px]">{m.subject}</span>
                </span>
              </div>
            </SwipeRow>
          </div>
        ))}
        {items.length === 0 && <p className="py-10 text-center text-[13px] text-[rgba(60,60,67,.6)]">No mail</p>}
      </div>
      {toast && (
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-[#1c1c1e]/95 px-3 py-2.5 text-[13px] text-white shadow-lg" role="status">
          <span className="min-w-0 flex-1 truncate">{toast.text}</span>
          {toast.undo && (
            <button type="button" onClick={toast.undo} className="shrink-0 font-semibold text-[#0a84ff]">
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── 2. Android (Gmail style): swipe to dismiss + selection mode ───────── */

const andSeed = [
  { id: 1, from: 'CityRide', subject: 'Your weekend trips', color: '#7e57c2' },
  { id: 2, from: 'Emma Clarke', subject: 'Dinner on Friday?', color: '#ef6c00' },
  { id: 3, from: 'BookNook', subject: 'Your loan is due soon', color: '#00897b' },
  { id: 4, from: 'Daniel Novak', subject: 'Re: Sprint review slides', color: '#3949ab' },
  { id: 5, from: 'Tax Office', subject: 'Reminder: file by Oct 31', color: '#6d4c41' },
];

function AndroidDemo() {
  const [items, setItems] = useState(andSeed);
  const [selected, setSelected] = useState<number[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const { toast, show, hide } = useToast();

  const archive = (ids: number[]) => {
    let before: typeof andSeed = [];
    setItems((xs) => {
      before = xs;
      return xs.filter((x) => !ids.includes(x.id));
    });
    setSelected([]);
    show(`${ids.length} archived`, () => {
      setItems(before);
      hide();
    });
  };

  return (
    <div className="flex h-full flex-col bg-[#f6f8fc] text-[#1f1f1f]">
      {selected.length > 0 ? (
        <div className="flex h-12 shrink-0 items-center gap-2 bg-[#d3e3fd] px-3">
          <button type="button" onClick={() => setSelected([])} className="rounded-full px-2 py-1 text-[13px] font-medium">
            Cancel
          </button>
          <span className="flex-1 text-[15px] font-medium">{selected.length} selected</span>
          <button type="button" aria-label="Archive selected" onClick={() => archive(selected)} className="grid size-9 place-items-center rounded-full hover:bg-black/5">
            <Archive size={19} />
          </button>
        </div>
      ) : (
        <div className="flex h-12 shrink-0 items-center px-4">
          <span className="flex-1 rounded-full bg-[#e9eef6] px-4 py-2 text-[13px] text-[#444746]">Search in mail</span>
        </div>
      )}
      <p className="px-4 pt-1 pb-1 text-[11px] font-medium text-[#444746]">{opened ? `Opened: ${opened}` : 'Primary'}</p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.map((m) => {
          const isSel = selected.includes(m.id);
          return (
            <SwipeRow
              key={m.id}
              label={`${m.from}, ${m.subject}`}
              mode="dismiss"
              leading={[{ key: 'archive', label: 'Archive', icon: Archive, bg: '#188038' }]}
              trailing={[{ key: 'archive', label: 'Archive', icon: Archive, bg: '#188038' }]}
              open={null}
              onOpenChange={() => {}}
              onAction={() => archive([m.id])}
              contentClassName={isSel ? 'bg-[#d3e3fd]' : 'bg-[#f6f8fc]'}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`Select ${m.from}`}
                  onClick={() => setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-medium text-white"
                  style={{ background: isSel ? '#0b57d0' : m.color }}
                >
                  {isSel ? '✓' : m.from[0]}
                </button>
                <button type="button" onClick={() => setOpened(m.from)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[14px] font-medium">{m.from}</span>
                  <span className="block truncate text-[13px] text-[#444746]">{m.subject}</span>
                </button>
              </div>
            </SwipeRow>
          );
        })}
        {items.length === 0 && <p className="py-10 text-center text-[13px] text-[#444746]">Nothing in Primary</p>}
      </div>
      {toast && (
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-[4px] bg-[#313033] px-4 py-3 text-[13px] text-[#f4eff4] shadow-lg" role="status">
          <span className="min-w-0 flex-1 truncate">{toast.text}</span>
          {toast.undo && (
            <button type="button" onClick={toast.undo} className="shrink-0 font-medium text-[#a8c7fa]">
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── 3. Web: visible buttons, confirm for permanent delete ───────── */

const webSeed = [
  { id: 1, name: 'Home', line: '12 Baker Street, London' },
  { id: 2, name: 'Office', line: '5 Canal Road, Leeds' },
  { id: 3, name: 'Mom', line: '88 Elm Avenue, York' },
];

function WebDemo() {
  const [items, setItems] = useState(webSeed);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  return (
    <div className="flex h-full flex-col bg-white text-[#0e1120]">
      <div className="flex items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto truncate rounded-md border border-[#e5e7ef] bg-white px-2 py-0.5 font-mono text-[10px] opacity-70">shop.example.com</span>
      </div>
      <p className="px-4 pt-3 pb-2 text-[16px] font-semibold">Saved addresses</p>
      <ul className="min-h-0 flex-1 overflow-y-auto px-3">
        {items.map((a) => (
          <li key={a.id} className="relative mb-2 rounded-xl border border-[#e5e7ef] p-3">
            {confirm === a.id ? (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="w-full">Delete “{a.name}”? This can’t be undone.</span>
                <button type="button" onClick={() => { setItems((xs) => xs.filter((x) => x.id !== a.id)); setConfirm(null); }} className="rounded-lg bg-[#d92d20] px-3 py-1.5 font-medium text-white">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-[#d0d4e0] px-3 py-1.5 font-medium">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#5b4bff]" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{a.name}</span>
                  <span className="block truncate text-[12px] text-[#5a5f70]">{a.line}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Actions for ${a.name}`}
                  aria-expanded={menu === a.id}
                  aria-haspopup="menu"
                  onClick={() => setMenu((m) => (m === a.id ? null : a.id))}
                  className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#5b4bff]"
                >
                  <MoreVertical size={16} />
                </button>
                {menu === a.id && (
                  <div role="menu" aria-label={`Actions for ${a.name}`} className="absolute top-11 right-3 z-10 w-32 overflow-hidden rounded-lg border border-[#e5e7ef] bg-white text-[13px] shadow-lg">
                    <button type="button" role="menuitem" onClick={() => setMenu(null)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5">
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setMenu(null); setConfirm(a.id); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#d92d20] hover:bg-black/5">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-[13px] text-[#5a5f70]">No saved addresses</p>}
      </ul>
    </div>
  );
}

export default function VariantsGallery() {
  const [k, setK] = useState(0);
  return (
    <div className="not-prose my-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" key={k}>
        <Card
          title="Reveal buttons + full swipe"
          platform="iOS"
          note="Swipe a little to reveal buttons, then tap one. Swipe all the way to trigger the outermost action (Trash). Only one row opens at a time; scrolling or tapping the row closes it."
          chips={['Leading + trailing', 'Full swipe', 'Undo toast']}
          bg="#f2f2f7"
        >
          <IosDemo />
        </Card>
        <Card
          title="Swipe to dismiss"
          platform="Android"
          note="Gmail style: no buttons. The color and icon tell you what will happen; past about 40% of the width the email is archived. Tap an avatar to select instead, then use the toolbar."
          chips={['One action', 'Snackbar Undo', 'Selection mode']}
          bg="#e8eaf0"
        >
          <AndroidDemo />
        </Card>
        <Card
          title="Visible actions menu"
          platform="Web"
          note="On the web, swipe is rare. Each row has a visible ⋮ menu that works with mouse, touch and keyboard. Deleting is permanent here, so it asks first."
          chips={['No gesture needed', 'Keyboard', 'Confirmation']}
          bg="#eef0f6"
        >
          <WebDemo />
        </Card>
      </div>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={() => setK((x) => x + 1)} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Reset all three
        </button>
      </div>
    </div>
  );
}
