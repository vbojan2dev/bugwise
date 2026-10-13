import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronRight, Landmark, Lock, LogOut, RotateCcw, ScanFace, Settings, Smartphone, UserPlus } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken Face ID unlock for a banking app. Bugs (don't spoil them for learners!):
 *  1. Adding a new face (Alternate Appearance) in Settings doesn't invalidate Face ID login:
 *     the new face unlocks the app without the password (token stored with "biometryAny").
 *  2. After 5 failed scans iOS locks Face ID (biometryLockout). The app then shows a dead-end
 *     "Face ID is locked" screen with no password fallback.
 *  3. Face ID login is switched on silently after the first password login (no opt-in question).
 *  4. Canceling the Face ID sheet unlocks the app (userCancel is treated like success).
 *  5. When Face ID is not enrolled or not allowed for the app, errors are swallowed:
 *     "Unlock with Face ID" does nothing and nothing explains why.
 *  6. The locked screen is a thin, semi-transparent layer over the home screen: the balance and
 *     transactions are readable before unlocking.
 *
 * Working on purpose: password login, matching face unlocks, non-matching face shows "Face Not Recognized",
 * the system Face ID permission prompt, the in-app Face ID switch, logout, locking/unlocking the phone
 * (the device passcode clears the OS lockout).
 */

type Phase = 'login' | 'home' | 'locked' | 'lockedOut';
type Sheet = null | 'permission' | 'scanning' | 'failed' | 'success';
interface State {
  phase: Phase;
  phoneLocked: boolean;
  bioOn: boolean;
  enrolled: boolean;
  appAllowed: boolean | null;
  altAdded: boolean;
  fails: number;
  sheet: Sheet;
}
interface LogEntry {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'err';
}

const BRAND = '#3b2fc9';
const sub = 'rgba(60,60,67,.6)';
const initial: State = { phase: 'login', phoneLocked: false, bioOn: false, enrolled: true, appAllowed: null, altAdded: false, fails: 0, sheet: null };

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b2fc9] disabled:opacity-40"
      style={{ background: on ? '#34c759' : '#d1d1d6' }}
    >
      <span className="absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-[left]" style={{ left: on ? 20 : 2 }} />
    </button>
  );
}

export function BuggyBiometricBank() {
  const st = useRef<State>({ ...initial });
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const set = (patch: Partial<State>) => {
    st.current = { ...st.current, ...patch };
    force();
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const addLog = (text: string, tone: LogEntry['tone'] = 'info') => {
    const id = nextId.current++;
    setLog((l) => [{ id, text, tone }, ...l].slice(0, 9));
  };

  const s = st.current;

  const login = () => {
    addLog('POST /api/login → 200 · session started', 'ok');
    // BUG 3: Face ID login is switched on without asking the user.
    addLog('Keychain: saved refresh token (access: biometryAny)');
    set({ phase: 'home', bioOn: true });
  };

  const tryFaceId = () => {
    const c = st.current;
    if (c.sheet || c.phoneLocked) return;
    addLog('LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)');
    if (!c.enrolled) {
      // BUG 5: error swallowed, nothing shown.
      addLog('→ error: biometryNotEnrolled (unhandled)', 'err');
      return;
    }
    if (c.appAllowed === false) {
      // BUG 5: error swallowed, nothing shown.
      addLog('→ error: biometryNotAvailable (unhandled)', 'err');
      return;
    }
    if (c.fails >= 5) {
      addLog('→ error: biometryLockout', 'err');
      // BUG 2: dead-end screen without a password fallback.
      set({ phase: 'lockedOut' });
      return;
    }
    if (c.appAllowed === null) {
      set({ sheet: 'permission' });
      return;
    }
    set({ sheet: 'scanning' });
  };

  const answerPermission = (allow: boolean) => {
    if (st.current.sheet !== 'permission') return;
    if (allow) {
      addLog('iOS: Face ID allowed for Kestrel', 'ok');
      set({ appAllowed: true, sheet: 'scanning' });
    } else {
      addLog('iOS: Face ID not allowed for Kestrel');
      addLog('→ error: biometryNotAvailable (unhandled)', 'err');
      set({ appAllowed: false, sheet: null });
    }
  };

  const scan = (kind: 'match' | 'nomatch' | 'alt') => {
    const c = st.current;
    if (c.sheet !== 'scanning') return;
    if (kind === 'nomatch') {
      const fails = c.fails + 1;
      addLog(`→ Face not recognized (failed attempts: ${fails})`, 'err');
      if (fails >= 5) {
        addLog('→ error: biometryLockout (passcode required)', 'err');
        // BUG 2: dead-end screen without a password fallback.
        set({ fails, sheet: null, phase: 'lockedOut' });
      } else {
        set({ fails, sheet: 'failed' });
      }
      return;
    }
    // BUG 1: the app never compares evaluatedPolicyDomainState, so a newly added face works too.
    addLog(kind === 'alt' ? '→ success (alternate appearance)' : '→ success', 'ok');
    set({ fails: 0, sheet: 'success' });
    later(() => {
      if (st.current.sheet !== 'success') return;
      addLog('Keychain: token released · app unlocked', 'ok');
      set({ sheet: null, phase: 'home' });
    }, 650);
  };

  const cancelSheet = () => {
    if (st.current.sheet !== 'scanning' && st.current.sheet !== 'failed') return;
    addLog('→ error: userCancel');
    // BUG 4: any result other than "failed" unlocks the app.
    addLog('app unlocked', 'ok');
    set({ sheet: null, phase: 'home' });
  };

  const lockPhone = () => {
    if (st.current.phoneLocked) return;
    if (st.current.sheet) addLog('→ error: systemCancel (phone locked)');
    set({ phoneLocked: true, sheet: null });
  };

  const unlockPhone = () => {
    const c = st.current;
    if (!c.phoneLocked) return;
    if (c.fails > 0) addLog('Device passcode entered · Face ID attempts reset');
    const loggedIn = c.phase !== 'login';
    if (loggedIn && c.bioOn) {
      set({ phoneLocked: false, fails: 0, phase: 'locked' });
      later(tryFaceId, 500);
    } else {
      set({ phoneLocked: false, fails: 0, phase: loggedIn ? 'login' : c.phase });
    }
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    st.current = { ...initial };
    setLog([]);
    force();
  };

  // ---------- screens ----------
  const home = (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-3 pb-8">
      <div className="flex items-center justify-between">
        <p className="text-[24px] font-bold tracking-tight">Hi, Maya</p>
        <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: BRAND }}>
          <Landmark size={16} />
        </span>
      </div>
      <div className="mt-3 rounded-2xl p-4 text-white" style={{ background: BRAND }}>
        <p className="text-[12px] opacity-85">Everyday account</p>
        <p className="text-[25px] font-semibold tracking-tight">€4,218.55</p>
        <p className="text-[11px] opacity-75">DE89 •••• 3000</p>
      </div>
      <p className="mt-4 mb-1.5 px-1 text-[12px] font-semibold uppercase" style={{ color: sub }}>
        Recent
      </p>
      <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white text-[13px]">
        {[
          ['Salary · Lumio GmbH', '+€3,150.00'],
          ['Rent · Stadtwohnen', '−€1,240.00'],
          ['FreshCart groceries', '−€86.40'],
        ].map(([a, b]) => (
          <div key={a} className="flex items-center justify-between px-3 py-2.5">
            <span className="min-w-0 truncate">{a}</span>
            <span className={b.startsWith('+') ? 'font-medium text-[#1a7f37]' : 'font-medium'}>{b}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 mb-1.5 px-1 text-[12px] font-semibold uppercase" style={{ color: sub }}>
        Security
      </p>
      <div className="overflow-hidden rounded-2xl bg-white text-[14px]">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <span>Unlock with Face ID</span>
          <Switch
            on={s.bioOn}
            label="Unlock with Face ID"
            onChange={() => {
              const on = !st.current.bioOn;
              addLog(`Setting: Face ID login ${on ? 'on' : 'off'}`);
              set({ bioOn: on });
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            addLog('POST /api/logout → 200 · Keychain token deleted');
            set({ phase: 'login', bioOn: false });
          }}
          className="flex w-full items-center gap-2 border-t border-black/5 px-3 py-2.5 text-left text-[#d70015]"
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );

  let body: ReactNode;
  if (s.phase === 'login') {
    body = (
      <div className="flex h-full flex-col px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: BRAND }}>
            <Landmark size={20} />
          </span>
          <p className="text-[20px] font-bold tracking-tight">Kestrel Bank</p>
        </div>
        <div className="mt-6 space-y-2 text-[14px]">
          <div className="rounded-xl bg-[#f2f2f7] px-3 py-2.5">maya@test.com</div>
          <div className="rounded-xl bg-[#f2f2f7] px-3 py-2.5 tracking-widest">••••••••••</div>
        </div>
        <button
          type="button"
          onClick={login}
          className="mt-4 h-11 w-full rounded-xl text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b2fc9]"
          style={{ background: BRAND }}
        >
          Log in
        </button>
        <p className="mt-3 text-center text-[12px]" style={{ color: sub }}>
          The password is already filled in.
        </p>
      </div>
    );
  } else if (s.phase === 'home') {
    body = home;
  } else if (s.phase === 'locked') {
    // BUG 6: the lock layer is translucent, the account is readable behind it.
    body = (
      <div className="relative h-full">
        <div inert className="h-full">{home}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-white/45 px-5 pb-10">
          <div className="w-full rounded-2xl bg-white/85 p-4 text-center shadow-lg">
            <Lock size={20} className="mx-auto" style={{ color: BRAND }} />
            <p className="mt-1.5 text-[15px] font-semibold">Kestrel is locked</p>
            <button
              type="button"
              onClick={tryFaceId}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b2fc9]"
              style={{ background: BRAND }}
            >
              <ScanFace size={17} /> Unlock with Face ID
            </button>
            <button type="button" onClick={() => set({ phase: 'login' })} className="mt-2 text-[13px] font-semibold" style={{ color: BRAND }}>
              Use password instead
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col items-center px-6 pt-20 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[#fdecec] text-[#d70015]">
          <Lock size={26} />
        </span>
        <p className="mt-4 text-[19px] font-bold">Face ID is locked</p>
        <p className="mt-1.5 text-[13px] leading-snug" style={{ color: sub }}>
          Too many failed attempts. Please try again later.
        </p>
        <button type="button" onClick={tryFaceId} className="mt-5 h-10 w-full rounded-xl bg-[#f2f2f7] text-[14px] font-semibold" style={{ color: BRAND }}>
          Try again
        </button>
      </div>
    );
  }

  const sheetOpen = s.sheet === 'scanning' || s.sheet === 'failed' || s.sheet === 'success';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <div className="shrink-0">
        <PhoneFrame width={280}>
          <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
            {body}

            {s.sheet === 'permission' && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/30 px-7">
                <div role="alertdialog" aria-labelledby="fid-perm-title" aria-describedby="fid-perm-msg" className="w-full overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center">
                  <p id="fid-perm-title" className="px-4 pt-4 text-[14px] leading-snug font-semibold">
                    Do you want to allow “Kestrel” to use Face ID?
                  </p>
                  <p id="fid-perm-msg" className="px-4 pt-1 pb-3 text-[12px] leading-snug">
                    Unlock Kestrel quickly and securely with Face ID.
                  </p>
                  <div className="grid grid-cols-2 border-t border-black/15 text-[15px] text-[#007aff]">
                    <button type="button" onClick={() => answerPermission(false)} className="h-11 border-r border-black/15">
                      Don’t Allow
                    </button>
                    <button type="button" onClick={() => answerPermission(true)} className="h-11 font-semibold">
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sheetOpen && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/10 px-10">
                <div role="dialog" aria-label="Face ID" className="w-full max-w-[170px] overflow-hidden rounded-[22px] bg-[#e9e9ee]/95 text-center shadow-xl">
                  <div className="flex flex-col items-center px-3 pt-5 pb-4">
                    {s.sheet === 'success' ? (
                      <span className="grid size-14 place-items-center rounded-full bg-[#34c759] text-white">
                        <Check size={30} strokeWidth={3} />
                      </span>
                    ) : (
                      <ScanFace size={56} strokeWidth={1.4} className={s.sheet === 'failed' ? 'text-[#d70015]' : 'text-[#007aff] motion-safe:animate-pulse'} />
                    )}
                    <p className="mt-2 text-[14px] font-semibold">{s.sheet === 'failed' ? 'Face Not Recognized' : 'Face ID'}</p>
                    {s.sheet === 'scanning' && (
                      <p className="mt-0.5 text-[11px]" style={{ color: sub }}>
                        Use the scan buttons below the phone
                      </p>
                    )}
                  </div>
                  {s.sheet === 'failed' && (
                    <button type="button" onClick={() => set({ sheet: 'scanning' })} className="h-10 w-full border-t border-black/10 text-[14px] text-[#007aff]">
                      Try Face ID Again
                    </button>
                  )}
                  {s.sheet !== 'success' && (
                    <button type="button" onClick={cancelSheet} className="h-10 w-full border-t border-black/10 text-[14px] text-[#007aff]">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {s.phoneLocked && (
              <div className="absolute inset-0 z-30 flex flex-col items-center bg-gradient-to-b from-[#1e1b4b] to-[#4c1d95] px-6 pt-10 text-white">
                <Lock size={18} />
                <p className="mt-2 text-[13px] opacity-80">Wednesday 15 October</p>
                <p className="text-[64px] leading-none font-semibold tracking-tight">9:41</p>
                <button type="button" onClick={unlockPhone} className="mt-auto mb-12 rounded-full bg-white/20 px-5 py-2.5 text-[13px] font-semibold backdrop-blur focus-visible:outline-2 focus-visible:outline-white">
                  Unlock with passcode
                </button>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <Smartphone size={13} /> Simulator · Features › Face ID
            </p>
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCcw size={12} /> Restart
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-fg">Enrolled</span>
            <Switch
              on={s.enrolled}
              label="Face ID enrolled"
              onChange={() => {
                const on = !st.current.enrolled;
                addLog(on ? 'Device: Face ID set up' : 'Device: Face ID removed');
                set({ enrolled: on, altAdded: on ? st.current.altAdded : false });
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{s.sheet === 'scanning' ? 'The Face ID sheet is waiting. Scan:' : 'Scan buttons work while the Face ID sheet is open.'}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button type="button" disabled={s.sheet !== 'scanning'} onClick={() => scan('match')} className="rounded-lg bg-subtle px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-40">
              Matching face
            </button>
            <button type="button" disabled={s.sheet !== 'scanning'} onClick={() => scan('nomatch')} className="rounded-lg bg-subtle px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-40">
              Non-matching face
            </button>
            {s.altAdded && (
              <button type="button" disabled={s.sheet !== 'scanning'} onClick={() => scan('alt')} className="rounded-lg bg-subtle px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-40">
                New face (alternate)
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Settings size={13} /> Settings › Face ID &amp; Passcode
          </p>
          <button
            type="button"
            disabled={!s.enrolled || s.altAdded}
            onClick={() => {
              addLog('Device: alternate appearance added (Face ID data changed)');
              set({ altAdded: true });
            }}
            className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg bg-subtle px-2.5 py-2 text-left text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <UserPlus size={14} /> {s.altAdded ? 'Alternate appearance added' : 'Set up an alternate appearance'}
            </span>
            {s.altAdded ? <Check size={14} /> : <ChevronRight size={14} />}
          </button>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="min-w-0 text-fg">
              Other apps: Kestrel
              <span className="block text-xs text-faint">{s.appAllowed === null ? 'Not asked yet' : s.appAllowed ? 'Allowed' : 'Not allowed'}</span>
            </span>
            <Switch
              on={s.appAllowed === true}
              disabled={s.appAllowed === null}
              label="Allow Face ID for Kestrel"
              onChange={() => {
                const on = !st.current.appAllowed;
                addLog(`Settings: Face ID for Kestrel ${on ? 'on' : 'off'}`);
                set({ appAllowed: on });
              }}
            />
          </div>
          <button
            type="button"
            onClick={lockPhone}
            disabled={s.phoneLocked}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-subtle px-2.5 py-2 text-xs font-semibold text-fg hover:bg-brand-soft disabled:opacity-50"
          >
            <Lock size={13} /> Lock phone
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-brand-soft p-3">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">From the spec</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted">
            <li>After the first password login, ask “Use Face ID next time?”. Turn it on only if the user agrees.</li>
            <li>When the app opens again, nothing from the account is visible until it's unlocked.</li>
            <li>Canceling Face ID keeps the app locked.</li>
            <li>“Use password” is always available, also after Face ID locks.</li>
            <li>If Face ID is off, not set up or not allowed, say so and show the password login.</li>
            <li>If the device's Face ID data changes, turn Face ID login off and ask for the password.</li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Device log</p>
          <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Log in, then lock the phone…</li>}
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
