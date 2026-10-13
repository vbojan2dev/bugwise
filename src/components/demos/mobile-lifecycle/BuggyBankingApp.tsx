import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bell, CheckCircle2, ChevronLeft, Clock, FileUp, Home, Landmark, Layers, RefreshCw, RotateCcw, ScanFace, Send, Skull, X } from 'lucide-react';
import { Phone } from './Phone';

/*
 * A deliberately broken banking app for the background/foreground bug hunt. Bugs (don't spoil them!):
 *  1. The app switcher snapshot shows the balance and transactions (no privacy cover).
 *  2. Returning from the background never refreshes data: balance and "Updated" time are stale.
 *  3. After the OS kills the app, reopening lands on Home and the transfer draft is gone.
 *  4. Tapping a push notification while the app is killed opens Home instead of the transaction.
 *  5. An upload in progress silently stops when the app goes to the background (stuck forever).
 *  6. When the session expired in the background, the app still shows the logged-in screen
 *     until an action fails with a vague error (401 in the network log).
 */

type View = 'app' | 'home' | 'switcher' | 'splash';
type Proc = 'foreground' | 'background' | 'killed';
type Screen = 'login' | 'home' | 'transfer' | 'sent' | 'upload' | 'tx';

interface Tx {
  id: number;
  name: string;
  amount: number;
  min: number;
}
interface Net {
  id: number;
  method: string;
  path: string;
  status: string;
  tone: 'ok' | 'err' | 'wait';
}
interface Ev {
  id: number;
  min: number;
  text: string;
}
interface S {
  seq: number;
  min: number;
  view: View;
  proc: Proc;
  screen: Screen;
  serverTx: Tx[];
  shownTx: Tx[];
  updatedAt: number;
  sessionUntil: number;
  draft: { to: string; amount: string; ref: string };
  lastSent: { to: string; amount: number } | null;
  upload: { state: 'idle' | 'uploading' | 'done'; pct: number; frozen: boolean; netId: number };
  banner: { txId: number } | null;
  detailId: number | null;
  toast: string | null;
  snapshot: Screen | null;
  incoming: number;
  net: Net[];
  log: Ev[];
}

const START_BALANCE = 4812.5;
const SESSION_MIN = 15;
const incomingList = [
  { name: 'Acme Ltd · Salary', amount: 250 },
  { name: 'Tom Berg', amount: 40 },
  { name: 'Refund · ShopCo', amount: 18.4 },
];

const initialTx: Tx[] = [
  { id: -1, name: 'Coffee Corner', amount: -3.8, min: -20 },
  { id: -2, name: 'City Rent Co', amount: -950, min: -600 },
  { id: -3, name: 'FreshMart', amount: -42.15, min: -900 },
];

const initial = (): S => ({
  seq: 0,
  min: 0,
  view: 'app',
  proc: 'foreground',
  screen: 'home',
  serverTx: initialTx,
  shownTx: initialTx,
  updatedAt: 0,
  sessionUntil: SESSION_MIN,
  draft: { to: '', amount: '', ref: '' },
  lastSent: null,
  upload: { state: 'idle', pct: 0, frozen: false, netId: 0 },
  banner: null,
  detailId: null,
  toast: null,
  snapshot: null,
  incoming: 0,
  net: [],
  log: [],
});

const euro = (n: number) => `€${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clock = (min: number) => {
  const total = 9 * 60 + 41 + min;
  const h = Math.floor(total / 60) % 24;
  return `${h}:${String(total % 60).padStart(2, '0')}`;
};
const balanceOf = (tx: Tx[]) => Math.round((START_BALANCE + tx.reduce((a, t) => a + t.amount, 0) - initialTx.reduce((a, t) => a + t.amount, 0)) * 100) / 100;
const parseAmount = (a: string) => {
  const n = parseFloat(a.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

/* ---------- pure helpers on a shallow copy ---------- */
function addLog(n: S, text: string) {
  n.seq += 1;
  n.log = [...n.log, { id: n.seq, min: n.min, text }].slice(-30);
}
function addNet(n: S, method: string, path: string, status: string, tone: Net['tone']) {
  n.seq += 1;
  n.net = [{ id: n.seq, method, path, status, tone }, ...n.net].slice(0, 6);
  return n.seq;
}
const sessionOk = (n: S) => n.min < n.sessionUntil;
/** GET /accounts. Returns false on 401. */
function fetchAccounts(n: S) {
  if (!sessionOk(n)) {
    addNet(n, 'GET', '/accounts', '401', 'err');
    return false;
  }
  addNet(n, 'GET', '/accounts', '200', 'ok');
  n.shownTx = n.serverTx;
  n.updatedAt = n.min;
  n.sessionUntil = n.min + SESSION_MIN;
  return true;
}
function serverIncoming(n: S, name?: string, amount?: number) {
  const item = name && amount ? { name, amount } : incomingList[n.incoming % incomingList.length];
  if (!name) n.incoming += 1;
  n.seq += 1;
  const tx = { id: n.seq, name: item.name, amount: item.amount, min: n.min };
  n.serverTx = [tx, ...n.serverTx];
  return tx;
}
/** The app leaves the screen (Home or app switcher). */
function toBackground(n: S) {
  if (n.proc !== 'foreground') return;
  n.proc = 'background';
  n.snapshot = n.screen; // BUG 1: snapshot of the real screen, balance included
  n.toast = null;
  if (n.upload.state === 'uploading' && !n.upload.frozen) {
    n.upload = { ...n.upload, frozen: true }; // BUG 5: upload tied to the screen
    n.net = n.net.map((x) => (x.id === n.upload.netId ? { ...x, status: 'aborted', tone: 'err' } : x));
  }
}
/** Warm resume: BUG 2 + BUG 6, nothing is refreshed or re-checked. */
function warmResume(n: S) {
  n.view = 'app';
  n.proc = 'foreground';
}

export function BuggyBankingApp() {
  const [s, setS] = useState<S>(initial);
  const timers = useRef<number[]>([]);
  const logBox = useRef<HTMLOListElement>(null);
  const lastLogId = s.log.length ? s.log[s.log.length - 1].id : 0;
  useEffect(() => {
    const el = logBox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastLogId]);

  useEffect(() => {
    const id = window.setInterval(
      () =>
        setS((p) => {
          if (p.upload.state !== 'uploading' || p.upload.frozen) return p;
          const pct = Math.min(100, p.upload.pct + 8);
          const n: S = { ...p, upload: { ...p.upload, pct } };
          if (pct >= 100) {
            n.upload = { ...n.upload, state: 'done', pct: 100 };
            n.net = n.net.map((x) => (x.id === n.upload.netId ? { ...x, status: '200', tone: 'ok' } : x));
          } else {
            n.net = n.net.map((x) => (x.id === n.upload.netId ? { ...x, status: `${pct}%` } : x));
          }
          return n;
        }),
      700,
    );
    return () => {
      window.clearInterval(id);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const act = (fn: (n: S) => void) =>
    setS((p) => {
      const n: S = { ...p };
      fn(n);
      return n;
    });
  const toast = (n: S, text: string) => {
    n.toast = text;
    later(() => setS((p) => (p.toast === text ? { ...p, toast: null } : p)), 3000);
  };

  /** Cold start: splash, then login (session expired) or Home. */
  const coldStart = (n: S, fromPush: boolean) => {
    n.view = 'splash';
    n.proc = 'foreground';
    later(
      () =>
        act((m) => {
          if (m.view !== 'splash') return;
          m.view = 'app';
          m.draft = { to: '', amount: '', ref: '' }; // BUG 3: nothing restored after an OS kill
          m.upload = { state: 'idle', pct: 0, frozen: false, netId: 0 };
          m.detailId = null;
          if (sessionOk(m)) {
            fetchAccounts(m);
            m.screen = 'home'; // BUG 3 + BUG 4: always Home, even when opened from a push
          } else {
            m.screen = 'login';
          }
          addLog(m, fromPush ? 'Northbank launched from the notification.' : 'Northbank launched (cold start).');
        }),
      900,
    );
  };

  /* ---------- device controls ---------- */
  const goHome = () =>
    act((n) => {
      if (n.view !== 'app' && n.view !== 'switcher') return;
      const wasApp = n.view === 'app';
      toBackground(n);
      n.view = 'home';
      if (wasApp) addLog(n, 'Went to the Home screen. Northbank is in the background.');
    });
  const openSwitcher = () =>
    act((n) => {
      if (n.view === 'switcher' || n.view === 'splash') return;
      toBackground(n);
      n.view = 'switcher';
      addLog(n, 'Opened the app switcher.');
    });
  const wait = (minutes: number) =>
    act((n) => {
      if (n.view === 'app' || n.view === 'splash') return;
      n.min += minutes;
      const tx = serverIncoming(n);
      addLog(n, `${minutes} minutes passed. Meanwhile ${tx.name} sent you ${euro(tx.amount)} (server side).`);
      if (!sessionOk(n) && n.min - minutes < n.sessionUntil) addLog(n, 'Server: the session timed out (15 min without activity).');
    });
  const osKill = () =>
    act((n) => {
      if (n.proc !== 'background') return;
      n.proc = 'killed';
      addLog(n, 'The OS killed Northbank to free memory (no warning to the app).');
    });
  const push = () =>
    act((n) => {
      if (n.view === 'splash') return;
      const tx = serverIncoming(n, 'Lisa Park', 120);
      n.banner = { txId: tx.id };
      addLog(n, 'Push notification: "You received €120.00 from Lisa Park".');
      const id = tx.id;
      later(() => setS((p) => (p.banner?.txId === id ? { ...p, banner: null } : p)), 6000);
    });
  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setS(initial());
  };

  /* ---------- phone actions ---------- */
  const tapIcon = () =>
    act((n) => {
      if (n.view !== 'home') return;
      if (n.proc === 'killed') coldStart(n, false);
      else {
        warmResume(n);
        addLog(n, 'Opened Northbank from the Home screen (it was still in memory).');
      }
    });
  const tapCard = () =>
    act((n) => {
      if (n.view !== 'switcher' || !n.snapshot) return;
      if (n.proc === 'killed') coldStart(n, false);
      else {
        warmResume(n);
        addLog(n, 'Returned to Northbank from the app switcher.');
      }
    });
  const swipeAway = () =>
    act((n) => {
      if (n.view !== 'switcher' || !n.snapshot) return;
      n.proc = 'killed';
      n.snapshot = null;
      addLog(n, 'Swiped Northbank away in the app switcher (force quit).');
    });
  const tapBanner = () =>
    act((n) => {
      if (!n.banner || n.view === 'splash') return;
      const id = n.banner.txId;
      n.banner = null;
      addLog(n, 'Tapped the notification.');
      if (n.proc === 'killed') {
        coldStart(n, true);
        return;
      }
      warmResume(n);
      if (n.screen === 'login') return;
      if (!sessionOk(n)) {
        addNet(n, 'GET', `/transactions/${id}`, '401', 'err');
        toast(n, 'Something went wrong. Please try again.');
        return;
      }
      addNet(n, 'GET', `/transactions/${id}`, '200', 'ok');
      n.sessionUntil = n.min + SESSION_MIN;
      n.detailId = id;
      n.screen = 'tx';
    });

  const refresh = () =>
    act((n) => {
      if (!fetchAccounts(n)) toast(n, 'Something went wrong. Please try again.');
    });
  const login = () =>
    act((n) => {
      addNet(n, 'POST', '/session', '200', 'ok');
      n.sessionUntil = n.min + SESSION_MIN;
      fetchAccounts(n);
      n.screen = 'home';
    });
  const sendTransfer = () =>
    act((n) => {
      const amount = parseAmount(n.draft.amount);
      if (!amount || !n.draft.to.trim()) return;
      if (!sessionOk(n)) {
        addNet(n, 'POST', '/transfers', '401', 'err');
        toast(n, 'Something went wrong. Please try again.');
        return;
      }
      addNet(n, 'POST', '/transfers', '201', 'ok');
      n.seq += 1;
      n.serverTx = [{ id: n.seq, name: n.draft.to.trim(), amount: -amount, min: n.min }, ...n.serverTx];
      n.shownTx = n.serverTx;
      n.updatedAt = n.min;
      n.sessionUntil = n.min + SESSION_MIN;
      n.lastSent = { to: n.draft.to.trim(), amount };
      n.draft = { to: '', amount: '', ref: '' };
      n.screen = 'sent';
    });
  const startUpload = () =>
    act((n) => {
      if (n.upload.state === 'uploading') return;
      const netId = addNet(n, 'PUT', '/documents/passport.jpg', '0%', 'wait');
      n.upload = { state: 'uploading', pct: 0, frozen: false, netId };
    });
  const nav = (screen: Screen) => act((n) => void (n.screen = screen));
  const setDraft = (k: keyof S['draft'], v: string) => act((n) => void (n.draft = { ...n.draft, [k]: v }));

  /* ---------- app screens ---------- */
  const balance = balanceOf(s.shownTx);
  const navy = '#0b2545';

  const screenUi = (screen: Screen, snap = false): ReactNode => {
    const inert = snap ? { tabIndex: -1, 'aria-hidden': true as const } : {};
    if (screen === 'login')
      return (
        <div className="flex h-full flex-col items-center bg-white px-5 pt-16 text-black">
          <span className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: navy }}>
            <Landmark size={26} />
          </span>
          <p className="mt-3 text-[18px] font-bold">Welcome back, Alex</p>
          <p className="text-[12px] text-[#3c3c4399]">Please log in to continue</p>
          <button type="button" onClick={login} {...inert} className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: navy }}>
            <ScanFace size={16} /> Log in with Face ID
          </button>
        </div>
      );
    if (screen === 'transfer') {
      const amount = parseAmount(s.draft.amount);
      return (
        <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
          <button type="button" onClick={() => nav('home')} {...inert} className="-ml-1 flex items-center self-start text-[13px] text-[#007aff]">
            <ChevronLeft size={18} /> Accounts
          </button>
          <p className="mt-1 text-[20px] font-bold tracking-tight">New transfer</p>
          <div className="mt-3 space-y-2 text-[12px]">
            {(
              [
                ['to', 'To', 'Name or IBAN', 'text'],
                ['amount', 'Amount', '0.00', 'decimal'],
                ['ref', 'Reference', 'Optional', 'text'],
              ] as const
            ).map(([k, label, ph, mode]) => (
              <label key={k} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
                <span className="w-16 shrink-0 text-[#3c3c4399]">{label}</span>
                <input
                  value={s.draft[k]}
                  inputMode={mode}
                  placeholder={ph}
                  onChange={(e) => setDraft(k, e.target.value)}
                  {...inert}
                  className="w-0 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={sendTransfer}
            disabled={!amount || !s.draft.to.trim()}
            {...inert}
            className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: navy }}
          >
            <Send size={14} /> Send {amount ? euro(amount) : ''}
          </button>
        </div>
      );
    }
    if (screen === 'sent')
      return (
        <div className="flex h-full flex-col items-center bg-[#f2f2f7] px-4 pt-16 text-center text-black">
          <CheckCircle2 size={40} className="text-[#34c759]" />
          <p className="mt-2 text-[15px] font-semibold">{s.lastSent ? `${euro(s.lastSent.amount)} sent to ${s.lastSent.to}` : 'Transfer sent'}</p>
          <button type="button" onClick={() => nav('home')} {...inert} className="mt-4 h-10 w-full rounded-xl text-[13px] font-semibold text-white" style={{ background: navy }}>
            Done
          </button>
        </div>
      );
    if (screen === 'upload')
      return (
        <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
          <button type="button" onClick={() => nav('home')} {...inert} className="-ml-1 flex items-center self-start text-[13px] text-[#007aff]">
            <ChevronLeft size={18} /> Accounts
          </button>
          <p className="mt-1 text-[20px] font-bold tracking-tight">Verify your identity</p>
          <p className="text-[11px] text-[#3c3c4399]">Upload a photo of your passport.</p>
          <div className="mt-4 rounded-xl bg-white p-3 text-[12px]">
            <div className="flex items-center gap-2">
              <FileUp size={18} className="text-[#007aff]" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">passport.jpg</span>
                <span className="text-[#3c3c4399]">4.2 MB</span>
              </span>
              {s.upload.state === 'done' && <CheckCircle2 size={18} className="text-[#34c759]" />}
            </div>
            {s.upload.state !== 'idle' && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e5ea]" role="progressbar" aria-valuenow={s.upload.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <div className="h-full rounded-full bg-[#007aff] transition-[width] duration-500" style={{ width: `${s.upload.pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[#3c3c4399]">{s.upload.state === 'done' ? 'Uploaded. We will review it within 24 hours.' : `Uploading… ${s.upload.pct}%`}</p>
              </div>
            )}
          </div>
          {s.upload.state === 'idle' && (
            <button type="button" onClick={startUpload} {...inert} className="mt-3 h-10 rounded-xl text-[13px] font-semibold text-white" style={{ background: navy }}>
              Upload
            </button>
          )}
        </div>
      );
    if (screen === 'tx') {
      const tx = s.serverTx.find((t) => t.id === s.detailId);
      return (
        <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
          <button type="button" onClick={() => nav('home')} {...inert} className="-ml-1 flex items-center self-start text-[13px] text-[#007aff]">
            <ChevronLeft size={18} /> Accounts
          </button>
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-5 text-center">
            <ArrowDownLeft size={22} className="text-[#34c759]" />
            <p className="mt-1 text-[26px] font-bold text-[#248a3d] tabular-nums">+{euro(tx?.amount ?? 0)}</p>
            <p className="text-[13px] font-semibold">From {tx?.name ?? '—'}</p>
            <p className="text-[11px] text-[#3c3c4399]">Today, {clock(tx?.min ?? 0)} · Reference: Dinner</p>
          </div>
        </div>
      );
    }
    // Home / accounts
    return (
      <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
        <p className="text-[12px] text-[#3c3c4399]">Good morning,</p>
        <p className="text-[20px] leading-tight font-bold tracking-tight">Alex</p>
        <div className="mt-3 rounded-2xl p-3.5 text-white" style={{ background: navy }}>
          <p className="text-[11px] text-white/70">Main account · ••• 2210</p>
          <p className="mt-0.5 text-[26px] font-semibold tabular-nums">{euro(balance)}</p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/70">
            <span>Updated {clock(s.updatedAt)}</span>
            <button type="button" onClick={refresh} {...inert} aria-label="Refresh balance" className="grid size-7 place-items-center rounded-full bg-white/15 focus-visible:outline-2 focus-visible:outline-white">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => nav('transfer')} {...inert} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-[12px] font-semibold">
            <ArrowUpRight size={14} className="text-[#007aff]" /> Transfer
          </button>
          <button type="button" onClick={() => nav('upload')} {...inert} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-[12px] font-semibold">
            <FileUp size={14} className="text-[#007aff]" /> Verify ID
          </button>
        </div>
        <p className="mt-3 mb-1 text-[11px] font-semibold tracking-wide text-[#3c3c4399] uppercase">Recent</p>
        <div className="overflow-hidden rounded-xl bg-white">
          {s.shownTx.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b border-black/5 px-2.5 py-1.5 text-[11px] last:border-0">
              <span className="min-w-0 truncate">{t.name}</span>
              <span className={`shrink-0 pl-2 font-semibold tabular-nums ${t.amount > 0 ? 'text-[#248a3d]' : ''}`}>
                {t.amount > 0 ? '+' : '−'}
                {euro(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const phoneScreen = (() => {
    if (s.view === 'splash')
      return (
        <div className="grid h-full place-items-center text-white" style={{ background: navy }}>
          <Landmark size={40} />
        </div>
      );
    if (s.view === 'app') return screenUi(s.screen);
    if (s.view === 'switcher')
      return (
        <div className="flex h-full flex-col bg-[#1c1c1e]/95 px-3 pt-4">
          <div className="flex min-h-0 flex-1 items-center gap-2 overflow-hidden">
            {s.snapshot ? (
              <div className="relative h-[78%] w-[66%] shrink-0">
                <div className="mb-1 flex items-center justify-between text-[10px] text-white">
                  <span className="flex items-center gap-1">
                    <Landmark size={11} /> Northbank
                  </span>
                  <button type="button" onClick={swipeAway} aria-label="Swipe Northbank away (force quit)" className="grid size-5 place-items-center rounded-full bg-white/20">
                    <X size={11} />
                  </button>
                </div>
                <div className="relative h-full w-full overflow-hidden rounded-xl ring-1 ring-white/20">
                  <div className="pointer-events-none" aria-hidden="true" style={{ width: '152%', height: '152%', transform: 'scale(0.66)', transformOrigin: 'top left' }}>
                    {screenUi(s.snapshot, true)}
                  </div>
                  <button type="button" onClick={tapCard} aria-label="Open Northbank" className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-white" />
                </div>
              </div>
            ) : (
              <p className="w-full text-center text-[12px] text-white/60">No recent apps</p>
            )}
            <div className="h-[78%] w-[66%] shrink-0 rounded-xl bg-[#e9f6ec]" />
          </div>
          <button type="button" onClick={goHome} className="mx-auto mb-6 rounded-full bg-white/15 px-4 py-1.5 text-[11px] text-white">
            Close switcher
          </button>
        </div>
      );
    return (
      <div className="h-full bg-gradient-to-b from-[#355c7d] to-[#6c5b7b] px-4 pt-4">
        <div className="grid grid-cols-4 gap-3">
          {['#34c759', '#ff9500', '#007aff', navy, '#ff2d55', '#af52de', '#ffcc00', '#8e8e93'].map((c, i) =>
            i === 3 ? (
              <button key={c} type="button" onClick={tapIcon} className="flex flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-white">
                <span className="grid aspect-square w-full place-items-center rounded-[22%] text-white ring-1 ring-white/30" style={{ background: c }}>
                  <Landmark size={18} />
                </span>
                <span className="text-[8px] text-white">Northbank</span>
              </button>
            ) : (
              <div key={c} className="flex flex-col items-center gap-0.5" aria-hidden="true">
                <span className="aspect-square w-full rounded-[22%]" style={{ background: c }} />
                <span className="text-[8px] text-white">{['Messages', 'Photos', 'Mail', '', 'Music', 'Maps', 'Notes', 'Settings'][i]}</span>
              </div>
            ),
          )}
        </div>
      </div>
    );
  })();

  const darkStatus = s.view !== 'app';
  const ctl = (label: string, icon: ReactNode, onClick: () => void, enabled: boolean) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface"
    >
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="min-w-0 leading-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <Phone width={260} time={clock(s.min)} darkStatus={darkStatus} screenBg={s.view === 'app' ? (s.screen === 'login' ? '#fff' : '#f2f2f7') : '#000'}>
        {phoneScreen}
        {s.banner && s.view !== 'splash' && (
          <button
            type="button"
            onClick={tapBanner}
            className="absolute inset-x-2 top-1 z-40 flex items-start gap-2 rounded-2xl bg-[#f6f6f8]/95 p-2.5 text-left text-black shadow-lg ring-1 ring-black/5 backdrop-blur"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: navy }}>
              <Landmark size={14} />
            </span>
            <span className="min-w-0 flex-1 text-[11px] leading-snug">
              <span className="flex justify-between font-semibold">
                Northbank <span className="font-normal text-[#3c3c4399]">now</span>
              </span>
              You received €120.00 from Lisa Park. Tap to view.
            </span>
          </button>
        )}
        {s.toast && s.view === 'app' && (
          <div className="absolute inset-x-4 bottom-8 z-40 rounded-xl bg-[#1c1c1e]/90 px-3 py-2 text-center text-[11px] text-white" role="alert">
            {s.toast}
          </div>
        )}
      </Phone>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device controls</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ctl('Go Home', <Home size={15} />, goHome, s.view === 'app' || s.view === 'switcher')}
          {ctl('App switcher', <Layers size={15} />, openSwitcher, s.view === 'app' || s.view === 'home')}
          {ctl('Wait 2 min', <Clock size={15} />, () => wait(2), s.view === 'home' || s.view === 'switcher')}
          {ctl('Wait 30 min', <Clock size={15} />, () => wait(30), s.view === 'home' || s.view === 'switcher')}
          {ctl('OS kills app', <Skull size={15} />, osKill, s.proc === 'background')}
          {ctl('Send push', <Bell size={15} />, push, s.view !== 'splash')}
        </div>
        <p className="mt-2 text-xs text-muted">
          Northbank: <strong className="text-fg">{s.proc === 'foreground' ? 'in the foreground' : s.proc === 'background' ? 'in the background' : 'not running'}</strong>. Tap its icon on the Home screen to open it.
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[3rem] space-y-1 px-3 py-2">
          {s.net.length === 0 && <li className="text-white/35">Requests the app sends appear here…</li>}
          {s.net.map((x) => (
            <li key={x.id} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[#7dd3fc]">{x.method}</span>
              <span className="min-w-0 flex-1 truncate">{x.path}</span>
              <span className={x.tone === 'ok' ? 'text-[#34d399]' : x.tone === 'err' ? 'text-[#f87171]' : 'text-[#fbbf24]'}>{x.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full rounded-2xl border border-line bg-surface">
        <p className="border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-faint uppercase">What happened</p>
        <ol ref={logBox} className="max-h-52 min-h-[4rem] space-y-1.5 overflow-y-auto px-3 py-2.5" aria-live="polite">
          {s.log.length === 0 && <li className="text-sm text-faint">Use the device controls to send the app to the background…</li>}
          {s.log.map((e) => (
            <li key={e.id} className="flex gap-2 text-[13px] leading-snug text-muted">
              <span className="w-9 shrink-0 font-mono text-[11px] text-faint tabular-nums">{clock(e.min)}</span>
              <span className="min-w-0 flex-1">{e.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
