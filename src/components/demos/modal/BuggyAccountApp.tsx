import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, CreditCard, Home, MapPin, Package, Pencil, RotateCcw, Trash2, User, HelpCircle, Bell, Triangle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken Android (Material 3) "Account" screen. Bugs (don't spoil them for learners!):
 *  1. Tapping the scrim of "Discard changes?" discards the edits (it should just close the dialog = keep editing).
 *  2. The system Back button is ignored while a dialog is open.
 *  3. Tapping "Delete" twice sends two DELETE requests; the second gets 404 and the app shows an error
 *     although the account was already deleted.
 *  4. The "Delete account?" scrim lets taps through: the bottom navigation behind it still works
 *     and the dialog stays open over another tab.
 *  5. With Large text the delete dialog grows taller than the screen; its buttons are cut off and it can't scroll.
 *  6. After discarding changes, opening "Edit profile" again shows the "Discard changes?" dialog immediately
 *     (its state is never reset).
 */

type Screen = 'home' | 'orders' | 'account' | 'edit' | 'deleted';
interface LogEntry {
  id: number;
  method: string;
  path: string;
  status?: number;
  ms: number;
}

const purple = '#6750a4';

function Dialog({ title, scale, children, actions, onScrim, passThrough }: { title: string; scale: number; children: ReactNode; actions: ReactNode; onScrim?: () => void; passThrough?: boolean }) {
  return (
    // BUG 4 (delete dialog): pointer-events-none on the whole layer lets taps reach the screen behind.
    <div className={`absolute inset-0 z-40 flex items-center justify-center p-5 ${passThrough ? 'pointer-events-none' : ''}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onScrim} aria-hidden="true" />
      {/* BUG 5: no max-height and no scrolling body */}
      <div role="alertdialog" aria-modal="true" aria-label={title} className="pointer-events-auto relative w-full rounded-[28px] bg-[#ece6f0] p-6 text-[#1d1b20] shadow-lg">
        <p style={{ fontSize: 22 * scale, lineHeight: 1.25 }}>{title}</p>
        <div className="mt-3 text-[#49454f]" style={{ fontSize: 14 * scale, lineHeight: 1.45 }}>
          {children}
        </div>
        <div className="mt-5 flex justify-end gap-1">{actions}</div>
      </div>
    </div>
  );
}

function TextBtn({ children, onClick, color = purple, scale = 1 }: { children: ReactNode; onClick: () => void; color?: string; scale?: number }) {
  return (
    <button type="button" onClick={onClick} className="h-10 rounded-full px-3 font-medium hover:bg-black/5 active:bg-black/10" style={{ color, fontSize: 14 * scale }}>
      {children}
    </button>
  );
}

export function BuggyAccountApp() {
  const [screen, setScreen] = useState<Screen>('account');
  const [profile, setProfile] = useState({ name: 'Maya Lopez', bio: 'Coffee, cycling and spicy ramen.' });
  const [draft, setDraft] = useState(profile);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [snack, setSnack] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const timers = useRef<number[]>([]);
  const pending = useRef(0);
  const deletedOnServer = useRef(false);
  const nextId = useRef(1);
  const snackTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(snackTimer.current);
    },
    [],
  );

  const scale = largeText ? 1.8 : 1;
  const dirty = draft.name !== profile.name || draft.bio !== profile.bio;

  const showSnack = (text: string) => {
    setSnack(text);
    clearTimeout(snackTimer.current);
    snackTimer.current = window.setTimeout(() => setSnack(''), 4000);
  };

  const request = (method: string, path: string, ms: number, done: (status: number) => void, status: () => number) => {
    const id = nextId.current++;
    setLog((l) => [{ id, method, path, ms }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        const st = status();
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: st } : e)));
        done(st);
      }, ms),
    );
  };

  /* ---------- edit profile ---------- */
  const openEdit = () => {
    setDraft(profile);
    setScreen('edit');
    // BUG 6: discardOpen is never reset here (or when discarding).
  };
  const leaveEdit = () => {
    if (dirty) setDiscardOpen(true);
    else setScreen('account');
  };
  const discard = () => {
    setDraft(profile);
    setScreen('account'); // BUG 6: setDiscardOpen(false) is missing
  };
  const keepEditing = () => setDiscardOpen(false);
  const save = () => {
    request('PATCH', '/api/me/profile', 600, () => {
      setProfile(draft);
      setScreen('account');
      showSnack('Profile saved');
    }, () => 200);
  };

  /* ---------- delete account ---------- */
  const confirmDelete = () => {
    // BUG 3: no guard against a second tap while the first request is running.
    pending.current++;
    setDeleting(true);
    request('DELETE', '/api/me', 1200, (status) => {
      pending.current--;
      if (pending.current > 0) return;
      setDeleting(false);
      setDeleteOpen(false);
      if (status === 200) setScreen('deleted');
      else showSnack("Couldn't delete account. Try again.");
    }, () => {
      if (deletedOnServer.current) return 404;
      deletedOnServer.current = true;
      return 200;
    });
  };

  /* ---------- system back ---------- */
  const systemBack = () => {
    if (discardOpen && screen === 'edit') return; // BUG 2
    if (deleteOpen) return; // BUG 2
    if (screen === 'edit') leaveEdit();
    else if (screen === 'home' || screen === 'orders') setScreen('account');
    else if (screen === 'account') showSnack('Press back again to exit');
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    pending.current = 0;
    deletedOnServer.current = false;
    clearTimeout(snackTimer.current);
    setScreen('account');
    setProfile({ name: 'Maya Lopez', bio: 'Coffee, cycling and spicy ramen.' });
    setDiscardOpen(false);
    setDeleteOpen(false);
    setDeleting(false);
    setSnack('');
    setLog([]);
  };

  const tabs: { id: Screen; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'account', label: 'Account', icon: User },
  ];
  const rows = [
    { icon: Pencil, label: 'Edit profile', onClick: openEdit },
    { icon: MapPin, label: 'Addresses' },
    { icon: CreditCard, label: 'Payment methods' },
    { icon: Bell, label: 'Notifications' },
    { icon: HelpCircle, label: 'Help & support' },
  ];

  const topBar = (title: string, left?: ReactNode, right?: ReactNode) => (
    <div className="flex h-14 shrink-0 items-center gap-1 px-1">
      {left}
      <p className={`flex-1 text-[20px] ${left ? '' : 'pl-3'}`}>{title}</p>
      {right}
    </div>
  );

  let content: ReactNode;
  if (screen === 'deleted') {
    content = (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <Trash2 size={36} className="text-[#b3261e]" />
        <p className="mt-3 text-[20px]">Account deleted</p>
        <p className="mt-1 text-[13px] text-[#49454f]">We’re sorry to see you go. Use “Restart app” below to try again.</p>
      </div>
    );
  } else if (screen === 'edit') {
    content = (
      <div className="flex h-full flex-col">
        {topBar(
          'Edit profile',
          <button type="button" onClick={leaveEdit} aria-label="Back" className="grid size-12 place-items-center rounded-full hover:bg-black/5">
            <ArrowLeft size={22} />
          </button>,
          <button type="button" onClick={save} className="mr-2 h-10 rounded-full px-3 text-[14px] font-medium" style={{ color: purple }}>
            Save
          </button>,
        )}
        <div className="space-y-5 px-4 pt-3">
          {(['name', 'bio'] as const).map((k) => (
            <label key={k} className="relative block">
              <span className="absolute -top-2 left-3 bg-[#fef7ff] px-1 text-[12px]" style={{ color: purple }}>
                {k === 'name' ? 'Name' : 'Bio'}
              </span>
              <input
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                className="h-12 w-full rounded-[4px] border border-[#79747e] bg-transparent px-4 text-[15px] outline-none focus:border-2 focus:border-[#6750a4]"
              />
            </label>
          ))}
          <p className="text-[12px] text-[#49454f]">Change something, then tap the back arrow.</p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex h-full flex-col">
        {topBar(screen === 'home' ? 'Home' : screen === 'orders' ? 'Orders' : 'Account')}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {screen === 'home' && (
            <div className="space-y-3 px-4">
              <p className="text-[15px]">Good morning, {profile.name.split(' ')[0]} 👋</p>
              {['Your order is on the way', '20% off sushi tonight', 'New: grocery delivery'].map((t, i) => (
                <div key={t} className="rounded-2xl p-4" style={{ background: ['#eaddff', '#ffd8e4', '#d0f0e0'][i] }}>
                  <p className="text-[14px] font-medium">{t}</p>
                  <p className="text-[12px] opacity-70">Tap to see details</p>
                </div>
              ))}
            </div>
          )}
          {screen === 'orders' && (
            <ul className="px-2">
              {['Pizza Roma · €18.40', 'Green Bowl · €11.90', 'Sushi Kaito · €26.00', 'Burger Lab · €14.50'].map((o) => (
                <li key={o} className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <Package size={18} className="text-[#49454f]" />
                  <span className="text-[14px]">{o}</span>
                </li>
              ))}
            </ul>
          )}
          {screen === 'account' && (
            <>
              <div className="flex items-center gap-3 px-4 pb-3">
                <span className="grid size-12 place-items-center rounded-full bg-[#eaddff] text-[18px] font-medium" style={{ color: '#21005d' }}>
                  {profile.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium" style={{ fontSize: 16 * Math.min(scale, 1.3) }}>
                    {profile.name}
                  </p>
                  <p className="truncate text-[12px] text-[#49454f]">{profile.bio}</p>
                </div>
              </div>
              <ul>
                {rows.map((r) => (
                  <li key={r.label}>
                    <button type="button" onClick={r.onClick} className="flex h-12 w-full items-center gap-4 px-4 text-left hover:bg-black/5">
                      <r.icon size={20} className="text-[#49454f]" />
                      <span className="flex-1" style={{ fontSize: 15 * Math.min(scale, 1.3) }}>
                        {r.label}
                      </span>
                      <ChevronRight size={18} className="text-[#79747e]" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => setDeleteOpen(true)} className="flex h-12 w-full items-center gap-4 px-4 text-left text-[#b3261e] hover:bg-black/5">
                    <Trash2 size={20} />
                    <span className="flex-1" style={{ fontSize: 15 * Math.min(scale, 1.3) }}>
                      Delete account
                    </span>
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
        <nav className="flex h-16 shrink-0 items-center justify-around bg-[#f3edf7] pb-2">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setScreen(t.id)} className="flex flex-col items-center gap-0.5 text-[11px] font-medium">
              <span className="grid h-7 w-14 place-items-center rounded-full" style={{ background: screen === t.id ? '#e8def8' : 'transparent' }}>
                <t.icon size={18} />
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os="android" width={290}>
        <div className="absolute inset-0 bg-[#fef7ff] text-[#1d1b20]">
          {content}

          {screen === 'edit' && discardOpen && (
            <Dialog
              title="Discard changes?"
              scale={scale}
              onScrim={discard} /* BUG 1: should be keepEditing */
              actions={
                <>
                  <TextBtn onClick={keepEditing} scale={scale}>
                    Keep editing
                  </TextBtn>
                  <TextBtn onClick={discard} scale={scale}>
                    Discard
                  </TextBtn>
                </>
              }
            >
              Your changes to your profile will be lost.
            </Dialog>
          )}

          {deleteOpen && (
            <Dialog
              title="Delete account?"
              scale={scale}
              passThrough
              actions={
                <>
                  <TextBtn onClick={() => setDeleteOpen(false)} scale={scale}>
                    Cancel
                  </TextBtn>
                  <TextBtn onClick={confirmDelete} color="#b3261e" scale={scale}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </TextBtn>
                </>
              }
            >
              <p>This permanently deletes your Foodly account. This can’t be undone. You will lose:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>38 past orders and receipts</li>
                <li>Saved addresses and cards</li>
                <li>1,240 loyalty points</li>
                <li>Your restaurant reviews</li>
              </ul>
            </Dialog>
          )}

          {snack && (
            <div className="absolute inset-x-3 bottom-[76px] z-50 flex min-h-12 items-center rounded-[4px] bg-[#322f35] px-4 py-2 text-[14px] text-[#f5eff7] shadow-lg">{snack}</div>
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
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <button type="button" onClick={systemBack} className="flex items-center justify-center gap-2 rounded-lg bg-subtle px-3 py-2 font-medium hover:text-brand">
            <Triangle size={12} className="-rotate-90 fill-current" /> System Back
          </button>
          <label className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
            Large text
            <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="accent-[var(--brand)]" />
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Requests will appear here…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className={e.method === 'DELETE' ? 'text-[#fca5a5]' : 'text-[#7dd3fc]'}>{e.method}</span>
              <span className="min-w-0 flex-1 truncate">{e.path}</span>
              {e.status === undefined ? (
                <span className="text-[#fbbf24]">pending…</span>
              ) : (
                <span className={e.status < 300 ? 'text-[#34d399]' : 'text-[#f87171]'}>
                  {e.status} · {(e.ms / 1000).toFixed(1)}s
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
