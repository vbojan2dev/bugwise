import { useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ChevronLeft, CircleHelp, FileText, Inbox, Menu, RotateCcw, Send, Settings, Star, Trash2, Triangle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { DrawerList, MD, ModalDrawer, type CloseHow, type DrawerItem } from './Drawer';

/*
 * Drawer lab: open and close a navigation drawer every way, and see how an edge swipe
 * competes with the iOS back swipe and Android's system Back gesture.
 */

type EdgeMode = 'off' | 'root' | 'every';
type Platform = 'ios' | 'android';
interface Log {
  text: string;
  tone: 'ok' | 'warn' | 'info';
}

const FOLDERS: DrawerItem[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 12 },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText, badge: 2 },
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'More' },
  { id: 'help', label: 'Help', icon: CircleHelp },
];
const SENDERS = ['Anna', 'Travelly', 'Bank', 'Mila', 'Shop', 'Gym', 'Leo', 'Pizza Roma', 'Landlord', 'Newsletter', 'Dad', 'Team'];
const SUBJECTS = ['Flight to Lisbon', 'Your booking is confirmed', 'Statement ready', 'Lunch Friday?', 'Parcel on its way', 'New class times', 'Photos from Sunday', 'Your receipt', 'Rent reminder', 'Weekly digest', 'Call me later', 'Sprint notes'];
const EDGE = 22;
const HOLD_MS = 350;

function Seg<T extends string>({ label, options, value, onChange }: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={o.v === value}
            onClick={() => onChange(o.v)}
            className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium ${o.v === value ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Playground() {
  const [platform, setPlatform] = useState<Platform>('android');
  const [edge, setEdge] = useState<EdgeMode>('root');
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState('inbox');
  const [mail, setMail] = useState<number | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const gesture = useRef<{ x: number; y: number; t: number; done: boolean } | null>(null);
  const hamburger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const swallow = useRef(false);

  const ios = platform === 'ios';
  const folderLabel = FOLDERS.find((f) => f.id === folder)?.label ?? 'Inbox';
  const add = (text: string, tone: Log['tone'] = 'info') => setLog((l) => [{ text, tone }, ...l].slice(0, 5));

  const openDrawer = (how: string) => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    add(`Drawer opened (${how})`, 'ok');
  };
  const closeDrawer = (how: CloseHow) => {
    setOpen(false);
    const names: Record<CloseHow, string> = { scrim: 'tap on the scrim', swipe: 'swipe', esc: 'Esc', select: 'destination chosen', back: 'system Back' };
    if (how !== 'select') add(`Drawer closed (${names[how]})`, 'ok');
    window.setTimeout(() => {
      const r = returnTo.current;
      if (r && r.isConnected && r.offsetParent !== null) r.focus();
      else (hamburger.current ?? heading.current)?.focus();
    }, 0);
  };
  const select = (id: string) => {
    setFolder(id);
    setMail(null);
    returnTo.current = null;
    add(`Opened ${FOLDERS.find((f) => f.id === id)?.label}, drawer closed`, 'ok');
    closeDrawer('select');
  };

  const systemBack = () => {
    if (open) return closeDrawer('back');
    if (mail !== null) {
      setMail(null);
      add('System Back: back to the list', 'ok');
      return;
    }
    add('System Back on the first screen: the app would close', 'info');
  };

  const allowed = (onDetail: boolean) => edge === 'every' || (edge === 'root' && !onDetail);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    swallow.current = false;
    if (open || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left > EDGE) return;
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), done: false };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.done) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (dx > 8 && !e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
    if (dx < 40 || Math.abs(dy) > dx) return;
    g.done = true;
    swallow.current = true;
    const held = performance.now() - g.t > HOLD_MS;
    const onDetail = mail !== null;
    if (ios) {
      if (onDetail) {
        if (allowed(true)) add('Conflict! Your back swipe opened the drawer. On iOS the left edge means Back.', 'warn');
        else {
          setMail(null);
          add('iOS back swipe: back to the list', 'ok');
          return;
        }
        openDrawer('edge swipe');
        return;
      }
      if (allowed(false)) openDrawer('edge swipe');
      else add('Edge swipe: nothing to go back to, and the drawer swipe is off', 'info');
      return;
    }
    // Android, gesture navigation: a swipe from the edge is system Back, unless the user holds first.
    if (held && allowed(onDetail)) {
      openDrawer('press, hold, then drag at the edge');
      return;
    }
    add(held ? 'Hold + drag, but the drawer swipe is off here: system Back' : 'Quick edge swipe = system Back', 'info');
    systemBack();
  };
  const up = () => {
    gesture.current = null;
    window.setTimeout(() => (swallow.current = false), 0);
  };

  const restart = () => {
    setOpen(false);
    setFolder('inbox');
    setMail(null);
    setLog([]);
  };

  return (
    <div className="not-prose my-8 grid grid-cols-1 items-start gap-6 rounded-3xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[auto_1fr]">
      <div className="flex min-w-0 justify-center">
        <PhoneFrame os={platform} width={280}>
          <div
            className="absolute inset-0 flex flex-col select-none"
            style={{ colorScheme: 'light', background: ios ? '#fff' : MD.surface, color: MD.onSurface, touchAction: 'pan-y' }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onClickCapture={(e) => {
              if (swallow.current) {
                swallow.current = false;
                e.stopPropagation();
              }
            }}
          >
            <div className="flex h-14 shrink-0 items-center gap-1 px-1" aria-hidden={open}>
              {mail === null ? (
                <button ref={hamburger} type="button" aria-label="Open navigation menu" aria-expanded={open} onClick={() => openDrawer('menu button')} className="grid size-12 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
                  <Menu size={22} />
                </button>
              ) : ios ? (
                <button type="button" onClick={() => { setMail(null); add('Back button: back to the list', 'ok'); }} className="flex items-center pr-2 text-[16px] text-[#007aff]">
                  <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" /> {folderLabel}
                </button>
              ) : (
                <button type="button" aria-label="Back" onClick={() => { setMail(null); add('App bar ←: back to the list', 'ok'); }} className="grid size-12 place-items-center rounded-full hover:bg-black/5">
                  <ArrowLeft size={22} />
                </button>
              )}
              <p ref={heading} tabIndex={-1} className="min-w-0 flex-1 truncate text-[19px] outline-none">
                {mail === null ? folderLabel : ''}
              </p>
            </div>
            <div className="relative min-h-0 flex-1" aria-hidden={open}>
              {mail === null ? (
                <ul className="absolute inset-0 space-y-1 overflow-y-auto px-2 pb-6" style={{ overflowY: open ? 'hidden' : 'auto' }}>
                  {SENDERS.map((s, i) => (
                    <li key={s}>
                      <button type="button" onClick={() => setMail(i)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-black/[0.04]">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold" style={{ background: ['#d0bcff', '#ffd8e4', '#c8e6c9', '#ffe0b2'][i % 4] }}>
                          {s[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{s}</span>
                          <span className="block truncate text-[12px]" style={{ color: MD.variant }}>
                            {folder === 'inbox' ? SUBJECTS[i] : `${folderLabel}: ${SUBJECTS[(i + 3) % SUBJECTS.length]}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3 px-5 pt-1 text-[14px]">
                  <p className="text-[20px]">{SUBJECTS[mail]}</p>
                  <p style={{ color: MD.variant }}>From {SENDERS[mail]}</p>
                  <div className="space-y-1.5">
                    {[90, 100, 80, 95, 60].map((w, i) => (
                      <div key={i} className="h-2 rounded bg-black/10" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <p className="text-[12px]" style={{ color: MD.variant }}>
                    Now swipe in from the left edge.
                  </p>
                </div>
              )}
            </div>
            {/* the edge zone, made visible */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-30 border-r border-dashed border-[#5b4bff]/50 bg-[#5b4bff]/10" style={{ width: EDGE }} aria-hidden="true" />
            <ModalDrawer open={open} onClose={closeDrawer} label="Mail folders">
              <DrawerList items={FOLDERS} current={folder} headline="Mail" onSelect={select} />
            </ModalDrawer>
          </div>
        </PhoneFrame>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Seg label="Platform" value={platform} onChange={(p) => { setPlatform(p); restart(); }} options={[{ v: 'android', l: 'Android' }, { v: 'ios', l: 'iOS' }]} />
          <Seg label="Edge swipe opens the drawer" value={edge} onChange={setEdge} options={[{ v: 'off', l: 'Off' }, { v: 'root', l: 'First screen only' }, { v: 'every', l: 'Every screen' }]} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <button type="button" onClick={systemBack} disabled={ios} className="flex items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand disabled:opacity-50">
            <Triangle size={12} className="-rotate-90 fill-current" /> System Back
          </button>
          <button type="button" onClick={restart} className="flex items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand">
            <RotateCcw size={13} /> Restart
          </button>
        </div>
        <p className="text-sm text-muted">
          The shaded strip is the <strong>edge zone</strong>. Drag from it to the right with your finger or mouse. {ios ? 'iOS has no system Back button: the left edge swipe is how people go back.' : 'On Android with gesture navigation, a quick swipe from the edge is system Back. Press and hold at the edge first, then drag, to pull the drawer out.'} Also try <kbd>Tab</kbd> and <kbd>Esc</kbd> while the drawer is open.
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Event log</p>
          <ul className="min-h-[6rem] space-y-1 px-3 py-2" aria-live="polite">
            {log.length === 0 && <li className="text-white/35">Opens, closes, swipes and Back presses appear here…</li>}
            {log.map((e, i) => (
              <li key={i} className={e.tone === 'warn' ? 'text-[#ffb4a9]' : e.tone === 'ok' ? 'text-[#a8e6b4]' : ''}>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
