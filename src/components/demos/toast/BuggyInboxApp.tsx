import { useEffect, useRef, useState } from 'react';
import { Archive, Inbox, Menu, Pencil, RefreshCw, RotateCcw, Star, Users, Video } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Snackbar } from './Toasts';

/*
 * A deliberately broken Android (Material 3) mail app. Bugs (don't spoil them for learners!):
 *  1. Undo restores the OLDEST archived email of the session, not the one the snackbar is about.
 *  2. Snackbars disappear after 2 s: too fast to read and press Undo.
 *  3. Snackbars stack on top of each other instead of replacing the previous one.
 *  4. The snackbar sits on top of the bottom navigation (and the FAB doesn't move up).
 *  5. With "Poor connection", the archive request fails (500) but the app still says "Conversation archived";
 *     a refresh brings the email back.
 *  6. With Large text the message is clipped mid-word (no wrapping, no ellipsis).
 */

interface Mail {
  id: number;
  from: string;
  subject: string;
  color: string;
}
interface Snack {
  id: number;
  mailId: number;
}
interface LogEntry {
  id: number;
  method: string;
  path: string;
  status?: number;
}

const allMails: Mail[] = [
  { id: 1, from: 'TAP Air Portugal', subject: 'Your Lisbon trip itinerary', color: '#ffd8e4' },
  { id: 2, from: 'Peak Outdoor', subject: 'Your order has shipped', color: '#d0f0e0' },
  { id: 3, from: 'Ana Silva', subject: 'Team lunch on Friday?', color: '#eaddff' },
  { id: 4, from: 'CityBank', subject: 'Your October statement', color: '#ffdcc1' },
  { id: 5, from: 'RunClub', subject: 'Weekly running summary', color: '#cde5ff' },
  { id: 6, from: 'Foodly', subject: '20% off sushi tonight', color: '#fff1b8' },
];

export function BuggyInboxApp() {
  const [mails, setMails] = useState(allMails);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [poor, setPoor] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const archived = useRef<Mail[]>([]); // in archive order, oldest first
  const serverArchived = useRef(new Set<number>());
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const request = (method: string, path: string, ms: number, status: number, done?: () => void) => {
    const id = nextId.current++;
    setLog((l) => [{ id, method, path }, ...l].slice(0, 6));
    later(() => {
      setLog((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));
      done?.();
    }, ms);
  };

  const byId = (list: Mail[]) => [...list].sort((a, b) => a.id - b.id);

  const archive = (m: Mail) => {
    setMails((l) => l.filter((x) => x.id !== m.id));
    archived.current.push(m);
    const failed = poor;
    request('POST', `/api/threads/${m.id}/archive`, failed ? 900 : 500, failed ? 500 : 200, () => {
      if (!failed) serverArchived.current.add(m.id);
      // BUG 5: no rollback and no error message when the request fails
    });
    const sid = nextId.current++;
    setSnacks((s) => [...s, { id: sid, mailId: m.id }]); // BUG 3: should replace, not append
    later(() => setSnacks((s) => s.filter((x) => x.id !== sid)), 2000); // BUG 2: 2 s
  };

  const undo = (snackId: number) => {
    // BUG 1: restores the oldest archived mail instead of the one this snackbar refers to
    const m = archived.current.shift();
    setSnacks((s) => s.filter((x) => x.id !== snackId));
    if (!m) return;
    setMails((l) => byId([...l.filter((x) => x.id !== m.id), m]));
    request('POST', `/api/threads/${m.id}/unarchive`, 400, 200, () => serverArchived.current.delete(m.id));
  };

  const refresh = () => {
    request('GET', '/api/inbox', 700, 200, () => {
      const list = allMails.filter((m) => !serverArchived.current.has(m.id));
      setMails(list);
      archived.current = archived.current.filter((m) => serverArchived.current.has(m.id));
    });
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    archived.current = [];
    serverArchived.current = new Set();
    setMails(allMails);
    setSnacks([]);
    setLog([]);
  };

  const scale = largeText ? 1.5 : 1;

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os="android" width={290}>
        <div className="absolute inset-0 flex flex-col bg-[#fef7ff] text-[#1d1b20]">
          <div className="flex h-14 shrink-0 items-center gap-2 px-3">
            <div className="flex h-11 flex-1 items-center gap-3 rounded-full bg-[#ece6f0] px-4 text-[14px] text-[#49454f]">
              <Menu size={18} /> Search in mail
            </div>
            <button type="button" onClick={refresh} aria-label="Refresh" className="grid size-10 place-items-center rounded-full hover:bg-black/5">
              <RefreshCw size={18} />
            </button>
          </div>
          <p className="px-4 pt-1 pb-1 text-[12px] font-medium text-[#49454f]">Primary</p>
          <ul className="min-h-0 flex-1 overflow-y-auto pb-28">
            {mails.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-medium" style={{ background: m.color }}>
                  {m.from.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold" style={{ fontSize: 13 * Math.min(scale, 1.2) }}>
                    {m.from}
                  </span>
                  <span className="block truncate text-[#49454f]" style={{ fontSize: 12 * Math.min(scale, 1.2) }}>
                    {m.subject}
                  </span>
                </span>
                <button type="button" onClick={() => archive(m)} aria-label={`Archive ${m.subject}`} className="grid size-10 shrink-0 place-items-center rounded-full text-[#49454f] hover:bg-black/5">
                  <Archive size={18} />
                </button>
              </li>
            ))}
            {mails.length === 0 && <li className="p-6 text-center text-[13px] text-[#49454f]">Inbox zero 🎉</li>}
          </ul>

          {/* FAB: BUG 4 — it never moves up for the snackbar */}
          <div aria-hidden="true" className="absolute right-4 bottom-[76px] flex h-14 items-center gap-2 rounded-2xl bg-[#eaddff] px-4 text-[14px] font-medium text-[#21005d] shadow-md">
            <Pencil size={18} /> Compose
          </div>

          <nav className="flex h-16 shrink-0 items-center justify-around bg-[#f3edf7] pb-2 text-[11px] font-medium">
            {[
              { icon: Inbox, label: 'Mail', badge: mails.length },
              { icon: Users, label: 'Chat' },
              { icon: Video, label: 'Meet' },
              { icon: Star, label: 'Starred' },
            ].map((t, i) => (
              <span key={t.label} className="relative flex flex-col items-center gap-0.5">
                <span className="grid h-7 w-14 place-items-center rounded-full" style={{ background: i === 0 ? '#e8def8' : 'transparent' }}>
                  <t.icon size={18} />
                </span>
                {t.label}
                {t.badge ? <span className="absolute -top-1 right-2 rounded-full bg-[#b3261e] px-1 text-[9px] text-white">{t.badge}</span> : null}
              </span>
            ))}
          </nav>

          {/* BUG 3 + 4: snackbars stack upwards from 8 px above the screen bottom, covering the navigation bar */}
          <div role="status" className="absolute inset-x-2 bottom-2 z-40 flex flex-col-reverse gap-2">
            {snacks.map((s) => (
              <Snackbar key={s.id} text="Conversation archived" action="Undo" onAction={() => undo(s.id)} scale={scale} wrap={false} />
            ))}
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
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Poor connection
            <input type="checkbox" checked={poor} onChange={(e) => setPoor(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
            Large text
            <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Archive an email to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className={e.method === 'GET' ? 'text-[#7dd3fc]' : 'text-[#c4b5fd]'}>{e.method}</span>
              <span className="min-w-0 flex-1 truncate">{e.path}</span>
              {e.status === undefined ? <span className="text-[#fbbf24]">pending…</span> : <span className={e.status < 300 ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
