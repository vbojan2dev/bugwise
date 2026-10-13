import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Camera, ChevronLeft, ChevronRight, Loader2, LocateFixed, MapPin, Pizza, RotateCcw, Salad, Search, Settings, Smartphone, Soup, Utensils, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { SystemDialog } from './SystemDialog';
import type { Choice } from './SystemDialog';

/*
 * A deliberately broken food delivery app with permission handling bugs. Bugs (don't spoil them for learners!):
 *  1. On first launch the app requests notifications, location and camera back to back, before the user
 *     has seen anything (no context, no priming).
 *  2. Camera denied: "Add photo" opens a black camera screen with a dead shutter button, instead of an
 *     explanation and an "Open Settings" button.
 *  3. Location denied for good (iOS after one "Don't Allow", Android after two): the "Turn on location"
 *     button just calls the request again, which the OS silently ignores. Nothing happens.
 *  4. Approximate location ("Precise: Off" / "Approximate"): address lookup fails with
 *     "Couldn't find your address", even though the app could show the area and let the user confirm.
 *  5. Android: revoking the camera in Settings while the camera screen is open kills the process; when the
 *     user returns, Android restores the camera screen, which opens the camera without checking
 *     -> "Snapbite keeps stopping". (On iOS the app is terminated and starts fresh, which is expected.)
 *  6. Location granted "once" is cached in the app's own storage as granted. On the next launch the app skips
 *     the permission check, the location request never returns, and the spinner runs forever.
 *
 * Working on purpose: the system dialogs and their OS rules (iOS asks once, Android twice), Allow / While using,
 * camera "Only this time" (asked again next launch), precise location, manual address search, Settings panel,
 * iOS restarting the app after a camera permission change.
 */

type OS = 'ios' | 'android';
type Perm = 'notifications' | 'location' | 'camera';
type Status = 'notDetermined' | 'granted' | 'once' | 'denied';
interface PS {
  status: Status;
  denials: number;
  fixed: boolean;
}
type Screen = 'launcher' | 'home' | 'address' | 'camera';
type Loc = 'idle' | 'finding' | 'found' | 'approxError' | 'denied';
interface Dlg {
  perm: Perm;
  reason: 'startup' | 'camera' | 'location';
}
interface State {
  os: OS;
  perms: Record<Perm, PS>;
  precise: boolean;
  screen: Screen;
  dialogs: Dlg[];
  dlgPrecise: boolean;
  asked: Record<Perm, boolean>;
  cachedLocation: boolean;
  address: string | null;
  loc: Loc;
  locReq: number;
  crashed: boolean;
  toast: string;
}
interface LogEntry {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'err';
}

const RED = '#e8432e';
const sub = 'rgba(60,60,67,.6)';
const PERMS: Perm[] = ['notifications', 'location', 'camera'];
const STREETS = ['12 Baker Street', '8 Bakery Lane', '3 Market Square', '21 Mill Road', '5 Park Avenue', '40 River Walk'];
const ps0 = (): PS => ({ status: 'notDetermined', denials: 0, fixed: false });
const fresh = (os: OS): State => ({
  os,
  perms: { notifications: ps0(), location: ps0(), camera: ps0() },
  precise: true,
  screen: 'launcher',
  dialogs: [],
  dlgPrecise: true,
  asked: { notifications: false, location: false, camera: false },
  cachedLocation: false,
  address: null,
  loc: 'idle',
  locReq: 0,
  crashed: false,
  toast: '',
});
const allowed = (p: PS) => p.status === 'granted' || p.status === 'once';
const canPrompt = (os: OS, p: PS) => p.status === 'notDetermined' || (os === 'android' && p.status === 'denied' && !p.fixed);
const statusText = (p: PS) => (p.status === 'notDetermined' ? 'not asked' : p.status === 'once' ? 'allowed once' : p.status === 'denied' ? (p.fixed ? 'denied (final)' : 'denied') : 'allowed');

export function BuggySnapbiteApp() {
  const st = useRef<State>(fresh('ios'));
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [query, setQuery] = useState('');
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const set = (patch: Partial<State>) => {
    st.current = { ...st.current, ...patch };
    force();
  };
  const setPerm = (perm: Perm, p: PS) => set({ perms: { ...st.current.perms, [perm]: p } });
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (text: string, tone: LogEntry['tone'] = 'info') => {
    const id = nextId.current++;
    setLog((l) => [{ id, text, tone }, ...l].slice(0, 10));
  };
  const showToast = (t: string) => {
    set({ toast: t });
    later(() => {
      if (st.current.toast === t) set({ toast: '' });
    }, 2200);
  };

  const s = st.current;

  // ---------- permission plumbing (the OS side behaves correctly) ----------
  const request = (perm: Perm, reason: Dlg['reason']) => {
    const c = st.current;
    addLog(`request(${perm})`);
    if (canPrompt(c.os, c.perms[perm])) {
      set({ dialogs: [...st.current.dialogs, { perm, reason }] });
    } else {
      addLog(`→ no dialog (${statusText(c.perms[perm])})`, allowed(c.perms[perm]) ? 'ok' : 'err');
      after(perm, reason);
    }
  };

  const answer = (choice: Choice) => {
    const c = st.current;
    const d = c.dialogs[0];
    if (!d) return;
    const prev = c.perms[d.perm];
    let next: PS;
    if (choice === 'deny') {
      const denials = prev.denials + 1;
      next = { status: 'denied', denials, fixed: c.os === 'ios' || denials >= 2 };
    } else if (choice === 'once') {
      next = { status: 'once', denials: 0, fixed: false };
    } else {
      next = { status: 'granted', denials: 0, fixed: false };
    }
    const isLoc = d.perm === 'location' && choice !== 'deny';
    addLog(`→ ${d.perm}: ${statusText(next)}${isLoc ? (c.dlgPrecise ? ' · precise' : ' · approximate') : ''}`, choice === 'deny' ? 'err' : 'ok');
    st.current = {
      ...c,
      perms: { ...c.perms, [d.perm]: next },
      precise: isLoc ? c.dlgPrecise : c.precise,
      // BUG 6: the app stores "location granted" in its own storage, also for a one-time grant.
      cachedLocation: isLoc ? true : c.cachedLocation,
      dialogs: c.dialogs.slice(1),
      dlgPrecise: true,
    };
    force();
    after(d.perm, d.reason);
  };

  const after = (perm: Perm, reason: Dlg['reason']) => {
    if (reason === 'camera') {
      set({ screen: 'camera' });
    } else if (reason === 'location') {
      if (allowed(st.current.perms.location)) fetchLocation();
      else set({ loc: 'denied' });
    }
    void perm;
  };

  // ---------- app code (this is where the bugs live) ----------
  const startup = () => {
    const c = st.current;
    const toAsk = PERMS.filter((p) => !c.asked[p]);
    if (toAsk.length === 0) return;
    // BUG 1: everything is requested at launch, before the user sees the app.
    addLog('App start: requesting all permissions');
    set({ asked: { notifications: true, location: true, camera: true } });
    toAsk.forEach((p) => request(p, 'startup'));
  };

  const launch = () => {
    set({ screen: 'home', crashed: false, loc: 'idle', dialogs: [], toast: '' });
    startup();
  };

  const relaunch = () => {
    const c = st.current;
    if (c.screen === 'launcher') {
      launch();
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const perms = { ...c.perms };
    let expired = false;
    PERMS.forEach((p) => {
      if (perms[p].status === 'once') {
        perms[p] = { ...perms[p], status: 'notDetermined' };
        expired = true;
      }
    });
    addLog('App closed and reopened');
    if (expired) addLog('One-time permissions expired');
    st.current = { ...c, perms };
    setQuery('');
    launch();
  };

  const openCamera = () => {
    const p = st.current.perms.camera;
    if (p.status === 'notDetermined') {
      request('camera', 'camera');
      return;
    }
    // BUG 2: denied goes to the camera screen anyway.
    addLog(`Camera: ${statusText(p)} → open camera`, allowed(p) ? 'ok' : 'err');
    set({ screen: 'camera' });
  };

  const fetchLocation = () => {
    const c = st.current;
    const req = c.locReq + 1;
    set({ loc: 'finding', locReq: req });
    addLog('requestLocation()');
    if (!allowed(c.perms.location)) {
      // BUG 6 (effect): not authorized, the callback never comes.
      addLog('→ not authorized · no callback', 'err');
      return;
    }
    later(() => {
      const n = st.current;
      if (n.locReq !== req || n.screen !== 'address') return;
      if (n.precise) {
        addLog('→ 51.3397, 12.3731 ±12 m → 12 Baker Street', 'ok');
        set({ loc: 'found' });
      } else {
        // BUG 4: approximate location is treated as an error.
        addLog('→ 51.34, 12.37 ±3,000 m → no street found', 'err');
        set({ loc: 'approxError' });
      }
    }, 900);
  };

  const useMyLocation = () => {
    const c = st.current;
    if (c.cachedLocation) {
      // BUG 6: trusts its own cached flag instead of checking the real status.
      addLog('Location: cached as granted → skip check');
      fetchLocation();
      return;
    }
    if (allowed(c.perms.location)) {
      fetchLocation();
      return;
    }
    request('location', 'location');
  };

  // ---------- system Settings ----------
  const applySetting = (perm: Perm, value: 'granted' | 'ask' | 'denied') => {
    const c = st.current;
    const prev = c.perms[perm];
    let next: PS;
    if (value === 'granted') next = { status: 'granted', denials: 0, fixed: false };
    else if (value === 'ask') next = { status: prev.status === 'once' ? 'once' : 'notDetermined', denials: 0, fixed: false };
    else next = { status: 'denied', denials: prev.denials, fixed: true };
    if (next.status === prev.status && next.fixed === prev.fixed) return;
    addLog(`Settings: ${perm} → ${statusText(next)}`);
    st.current = { ...c, perms: { ...c.perms, [perm]: next } };
    force();
    const revoked = allowed(prev) && !allowed(next);
    const running = c.screen !== 'launcher' && !c.crashed;
    if (!revoked || !running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (c.os === 'android') {
      addLog('Android: Snapbite process killed (permission revoked)');
      addLog(`User returns · process restarted, restoring "${c.screen}" screen`);
      if (c.screen === 'camera') {
        // BUG 5: the restored camera screen opens the camera without checking.
        addLog('FATAL EXCEPTION: SecurityException: camera permission not granted', 'err');
        set({ crashed: true, dialogs: [] });
      } else {
        set({ dialogs: [], loc: 'idle', toast: '' });
      }
    } else if (perm === 'camera') {
      addLog('iOS: Snapbite terminated (privacy setting changed)');
      addLog('User returns · app starts fresh');
      setQuery('');
      set({ dialogs: [], loc: 'idle', toast: '', screen: 'home' });
    } else {
      addLog(`iOS: authorization changed (${perm}) · app keeps running`);
    }
  };

  const switchOs = (os: OS) => {
    if (st.current.os === os) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    st.current = fresh(os);
    setQuery('');
    setLog([]);
    force();
  };
  const reinstall = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    st.current = fresh(st.current.os);
    setQuery('');
    setLog([]);
    addLog('App deleted and installed again · permissions reset');
    force();
  };

  // ---------- screens ----------
  const ios = s.os === 'ios';
  const btn = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8432e]';
  let body: ReactNode;

  if (s.screen === 'launcher') {
    body = (
      <div className="flex h-full flex-col items-center bg-gradient-to-b from-[#ffd6c9] to-[#ffb199] pt-16">
        <button type="button" onClick={launch} className={`flex flex-col items-center gap-1.5 rounded-2xl p-1 ${btn}`} aria-label="Open Snapbite">
          <span className="grid size-[60px] place-items-center rounded-[16px] text-white shadow-md" style={{ background: RED }}>
            <Utensils size={28} />
          </span>
          <span className="text-[12px] font-medium text-black">Snapbite</span>
        </button>
        <p className="mt-6 px-8 text-center text-[12px] text-black/60">Freshly installed. Tap the icon to open the app for the first time.</p>
      </div>
    );
  } else if (s.screen === 'home') {
    body = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f6f5f3] px-4 pt-2 pb-8">
        <button type="button" onClick={() => set({ screen: 'address', loc: 'idle' })} className={`flex items-center gap-1.5 self-start rounded-lg text-left ${btn}`}>
          <MapPin size={16} style={{ color: RED }} />
          <span>
            <span className="block text-[11px]" style={{ color: sub }}>
              Deliver to
            </span>
            <span className="flex items-center text-[14px] font-semibold">
              {s.address ?? 'Set your address'} <ChevronRight size={14} />
            </span>
          </span>
        </button>
        <p className="mt-3 text-[20px] font-bold tracking-tight">Hungry, Sam?</p>
        <div className="mt-2 space-y-2">
          {[
            [Pizza, 'Forno Rosso', 'Pizza · 25 min'],
            [Soup, 'Pho Hanoi', 'Vietnamese · 30 min'],
            [Salad, 'Green Bowl', 'Salads · 20 min'],
          ].map(([Icon, name, meta]) => {
            const I = Icon as typeof Pizza;
            return (
              <div key={name as string} className="flex items-center gap-3 rounded-2xl bg-white p-2.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fde8e4]" style={{ color: RED }}>
                  <I size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{name as string}</span>
                  <span className="block text-[11px]" style={{ color: sub }}>
                    {meta as string}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-2xl border border-black/5 bg-white p-3">
          <p className="text-[13px] font-semibold">How was Pho Hanoi?</p>
          <p className="text-[11px]" style={{ color: sub }}>
            Add a photo to your review.
          </p>
          <button type="button" onClick={openCamera} className={`mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-white ${btn}`} style={{ background: RED }}>
            <Camera size={15} /> Add photo
          </button>
        </div>
      </div>
    );
  } else if (s.screen === 'address') {
    const q = query.trim().toLowerCase();
    const results = q.length >= 2 ? STREETS.filter((x) => x.toLowerCase().includes(q)) : [];
    const pick = (a: string) => {
      addLog(`Address set: ${a}`, 'ok');
      setQuery('');
      set({ address: a, screen: 'home', loc: 'idle', locReq: st.current.locReq + 1 });
    };
    body = (
      <div className="relative flex h-full flex-col overflow-y-auto bg-white px-4 pt-1 pb-8">
        <button type="button" onClick={() => set({ screen: 'home', loc: 'idle', locReq: st.current.locReq + 1 })} className="-ml-1.5 flex items-center self-start text-[15px]" style={{ color: RED }}>
          <ChevronLeft size={22} /> Back
        </button>
        <p className="mt-1 text-[19px] font-bold">Delivery address</p>
        <label className="mt-3 flex items-center gap-2 rounded-xl bg-[#f2f2f7] px-3">
          <Search size={15} style={{ color: sub }} />
          <span className="sr-only">Search street</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search street" className="h-10 w-0 min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </label>
        {results.length > 0 && (
          <ul className="mt-1 divide-y divide-black/5 rounded-xl border border-black/5">
            {results.map((r) => (
              <li key={r}>
                <button type="button" onClick={() => pick(r)} className="w-full px-3 py-2 text-left text-[13px]">
                  {r}
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.length >= 2 && results.length === 0 && (
          <p className="mt-2 text-[12px]" style={{ color: sub }}>
            No streets found. Try “mill” or “park”.
          </p>
        )}

        <button type="button" onClick={useMyLocation} disabled={s.loc === 'finding'} className={`mt-3 flex items-center gap-2 rounded-xl px-1 py-2 text-[14px] font-semibold ${btn}`} style={{ color: RED }}>
          <LocateFixed size={17} /> Use my current location
        </button>

        {s.loc === 'finding' && (
          <p className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: sub }}>
            <Loader2 size={15} className="animate-spin" /> Finding your location…
          </p>
        )}
        {s.loc === 'found' && (
          <div className="mt-2 rounded-xl bg-[#f2f2f7] p-3">
            <p className="text-[11px]" style={{ color: sub }}>
              You're here
            </p>
            <p className="text-[14px] font-semibold">12 Baker Street</p>
            <button type="button" onClick={() => pick('12 Baker Street')} className="mt-2 h-9 w-full rounded-xl text-[13px] font-semibold text-white" style={{ background: RED }}>
              Deliver here
            </button>
          </div>
        )}
        {s.loc === 'approxError' && (
          <div role="alert" className="mt-2 rounded-xl bg-[#fdecec] p-3 text-[12px] text-[#b42318]">
            Couldn't find your address. Please try again.
            <button type="button" onClick={fetchLocation} className="mt-1.5 block font-semibold underline">
              Try again
            </button>
          </div>
        )}
        {s.loc === 'denied' && (
          <div className="mt-2 rounded-xl bg-[#f2f2f7] p-3 text-[12px]">
            <p className="font-semibold">Location is off</p>
            <p style={{ color: sub }}>Turn on location to find your address automatically.</p>
            {/* BUG 3: requests again; the OS ignores it once the denial is final. */}
            <button type="button" onClick={() => request('location', 'location')} className="mt-2 h-8 rounded-lg px-3 text-[12px] font-semibold text-white" style={{ background: RED }}>
              Turn on location
            </button>
          </div>
        )}
      </div>
    );
  } else {
    const ok = allowed(s.perms.camera);
    body = (
      <div className="relative flex h-full flex-col bg-black text-white">
        <button type="button" aria-label="Close camera" onClick={() => set({ screen: 'home' })} className="absolute top-2 left-3 z-10 grid size-9 place-items-center rounded-full bg-white/15">
          <X size={18} />
        </button>
        <div className="relative mx-3 mt-12 flex-1 overflow-hidden rounded-xl">
          {ok ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#5b3a29] via-[#8a5a3c] to-[#3b2a20]">
              <div className="absolute top-1/2 left-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#f4efe6] shadow-2xl">
                <Soup size={56} className="text-[#c2410c]" />
              </div>
              <span className="absolute top-2 right-2 rounded bg-black/40 px-1.5 text-[10px]">LIVE</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}
        </div>
        <div className="flex h-28 items-center justify-center">
          <button
            type="button"
            aria-label="Take photo"
            onClick={() => {
              if (!allowed(st.current.perms.camera)) return; // BUG 2: dead button, no message
              addLog('Photo captured', 'ok');
              set({ screen: 'home' });
              showToast('Photo added to your review');
            }}
            className="size-16 rounded-full border-4 border-white/80 bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </div>
      </div>
    );
  }

  const dlg = s.dialogs[0];
  const sel = (p: Perm): 'granted' | 'ask' | 'denied' => {
    const x = s.perms[p];
    return x.status === 'granted' ? 'granted' : x.status === 'denied' ? 'denied' : 'ask';
  };
  const selectCls = 'h-8 w-full min-w-0 rounded-lg border border-line bg-surface px-1.5 text-xs text-fg';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <div className="shrink-0">
        <PhoneFrame width={280} os={s.os}>
          <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
            {body}
            {s.toast && (
              <div role="status" className="absolute inset-x-4 bottom-8 z-10 rounded-xl bg-[#1c1c1e] px-3 py-2 text-center text-[12px] text-white">
                {s.toast}
              </div>
            )}
            {dlg && !s.crashed && (
              <SystemDialog key={`${dlg.perm}-${s.dialogs.length}`} os={s.os} perm={dlg.perm} precise={s.dlgPrecise} onPrecise={(v) => set({ dlgPrecise: v })} onAnswer={answer} />
            )}
            {s.crashed && (
              <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-10">
                <div role="alertdialog" aria-labelledby="crash-title" className="w-full rounded-[26px] bg-[#ece6f0] p-4 text-[#1d1b20]">
                  <p id="crash-title" className="text-[16px]">
                    Snapbite keeps stopping
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <button type="button" onClick={relaunch} className="h-10 w-full rounded-full bg-[#f7f2fa] text-[13px] font-medium text-[#4f378b]">
                      Close app
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <Smartphone size={13} /> Device
            </p>
            <button type="button" onClick={reinstall} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCcw size={12} /> Reinstall
            </button>
          </div>
          <div role="group" aria-label="Operating system" className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1">
            {(['ios', 'android'] as OS[]).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={s.os === o}
                onClick={() => switchOs(o)}
                className={`rounded-md py-1.5 text-xs font-semibold ${s.os === o ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {o === 'ios' ? 'iOS 18' : 'Android 15'}
              </button>
            ))}
          </div>
          <button type="button" onClick={relaunch} className="mt-2 w-full rounded-lg bg-subtle px-2.5 py-2 text-xs font-semibold text-fg hover:bg-brand-soft">
            Close &amp; reopen app
          </button>
          <p className="mt-1.5 text-[11px] text-faint">Switching OS installs the app fresh on that phone.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Settings size={13} /> {ios ? 'Settings › Snapbite' : 'App info › Permissions'}
          </p>
          <p className="mt-1 text-[11px] text-faint">Changing a value here means: leave the app, change it in Settings, come back.</p>
          <div className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-2 text-xs">
            <label htmlFor="set-loc" className="text-fg">
              Location
            </label>
            <select id="set-loc" className={selectCls} value={sel('location')} onChange={(e) => applySetting('location', e.target.value as 'granted' | 'ask' | 'denied')}>
              <option value="denied">{ios ? 'Never' : 'Don’t allow'}</option>
              <option value="ask">{ios ? 'Ask Next Time Or When I Share' : 'Ask every time'}</option>
              <option value="granted">{ios ? 'While Using the App' : 'Allow only while using the app'}</option>
            </select>
            <span className="text-fg">{ios ? 'Precise Location' : 'Use precise location'}</span>
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={s.precise}
                onChange={(e) => {
                  addLog(`Settings: precise location ${e.target.checked ? 'on' : 'off'}`);
                  set({ precise: e.target.checked });
                }}
                className="size-4 accent-[var(--brand)]"
              />
              {s.precise ? 'On' : 'Off'}
            </label>
            <label htmlFor="set-cam" className="text-fg">
              Camera
            </label>
            {ios ? (
              <select id="set-cam" className={selectCls} value={sel('camera') === 'granted' ? 'granted' : sel('camera') === 'denied' ? 'denied' : 'ask'} disabled={s.perms.camera.status === 'notDetermined'} onChange={(e) => applySetting('camera', e.target.value as 'granted' | 'denied')}>
                {s.perms.camera.status === 'notDetermined' && <option value="ask">Not asked yet</option>}
                <option value="granted">On</option>
                <option value="denied">Off</option>
              </select>
            ) : (
              <select id="set-cam" className={selectCls} value={sel('camera')} onChange={(e) => applySetting('camera', e.target.value as 'granted' | 'ask' | 'denied')}>
                <option value="denied">Don’t allow</option>
                <option value="ask">Ask every time</option>
                <option value="granted">Allow only while using the app</option>
              </select>
            )}
            <label htmlFor="set-notif" className="text-fg">
              Notifications
            </label>
            <select id="set-notif" className={selectCls} value={allowed(s.perms.notifications) ? 'granted' : 'denied'} onChange={(e) => applySetting('notifications', e.target.value as 'granted' | 'denied')}>
              <option value="granted">On</option>
              <option value="denied">Off</option>
            </select>
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Now: location {statusText(s.perms.location)}
            {allowed(s.perms.location) ? (s.precise ? ' (precise)' : ' (approximate)') : ''}, camera {statusText(s.perms.camera)}, notifications {statusText(s.perms.notifications)}.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-brand-soft p-3">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">From the spec</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted">
            <li>Ask for each permission only when the user starts the feature that needs it.</li>
            <li>If camera or location is denied, explain why it helps and offer “Open Settings”.</li>
            <li>Approximate location must still work: show the area and let the user confirm the street.</li>
            <li>Check the real permission status every time; a one-time grant means asking again later.</li>
            <li>Changing permissions in Settings must never crash the app.</li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Device log</p>
          <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Open the app on the phone…</li>}
            {log.map((e) => (
              <li key={e.id} className="leading-snug break-words" style={{ color: e.tone === 'ok' ? '#34d399' : e.tone === 'err' ? '#f87171' : undefined }}>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
