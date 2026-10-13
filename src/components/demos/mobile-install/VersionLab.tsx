import { useState, type ReactNode } from 'react';
import { Bell, Database, HardDrive, Heart, Info, KeyRound, RotateCcw, Server, Settings as SettingsIcon, ShoppingBasket, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * "Version timeline" simulator for the Install, Update and Uninstall lesson.
 * The same engine powers the correct demo and the bug hunt (buggy = true).
 *
 * Bugs in buggy mode (don't spoil them for learners!):
 *  1. Updating from 1.0 logs the user out: 1.1+ reads the token from a new Keychain key, but nobody moves the old one.
 *  2. Settings (dark mode, deals email) reset to defaults when the database moves from schema 1 to 2 (1.9+).
 *  3. Skipping versions (1.0/1.1 -> 2.0) loses all favorites: only the migration from the previous schema runs.
 *  4. Forced update compares versions as strings, so 1.10 is "older" than 1.9 and the prompt never goes away.
 *  5. 2.0 checks a new onboarding flag, so existing users see the full onboarding (and welcome) again.
 *  6. After uninstall + reinstall, the old Keychain token is not cleared, so the previous user's name shows up.
 */

interface Version {
  v: string;
  build: number;
  schema: number;
  size: number;
  notes: string;
}

const VERSIONS: Version[] = [
  { v: '1.0', build: 41, schema: 1, size: 38, notes: 'First release' },
  { v: '1.1', build: 48, schema: 1, size: 39, notes: 'Sign-in token moved to new secure storage' },
  { v: '1.9', build: 77, schema: 2, size: 46, notes: 'New database: favorites become "saved items"' },
  { v: '1.10', build: 83, schema: 2, size: 47, notes: 'Bug fixes' },
  { v: '2.0', build: 105, schema: 3, size: 64, notes: 'Redesign, new onboarding, saved-item folders' },
];

const PRODUCTS = [
  { id: 'oat', name: 'Oat milk', price: '€2.49' },
  { id: 'bread', name: 'Sourdough bread', price: '€3.90' },
  { id: 'avo', name: 'Avocados (2)', price: '€2.99' },
  { id: 'choc', name: 'Dark chocolate', price: '€1.79' },
];

const FREE_MB_LOW = 30;

type Perm = 'notDetermined' | 'allowed' | 'denied';
interface AppSettings {
  dark: boolean;
  deals: boolean;
}
interface Sandbox {
  schema: number;
  favorites: string[];
  settings: AppSettings;
  onboarding: { v1: boolean; v2: boolean };
  whatsNewSeen: boolean;
}
interface Keychain {
  session?: string;
  session_v2?: string;
}
type LogKind = 'info' | 'ok' | 'warn' | 'error';
interface LogLine {
  id: number;
  kind: LogKind;
  text: string;
}
interface Ui {
  onboardingStep: 0 | 1;
  systemPrompt: boolean;
  tab: 'shop' | 'settings';
  newerData: boolean;
  storeHint: boolean;
}
interface World {
  installed: number | null;
  sandbox: Sandbox | null;
  keychain: Keychain;
  permission: Perm;
  minVersion: string;
  lowStorage: boolean;
  ui: Ui;
  log: LogLine[];
  nextLog: number;
}

const DEFAULT_SETTINGS: AppSettings = { dark: false, deals: false };
const FRESH_UI: Ui = { onboardingStep: 0, systemPrompt: false, tab: 'shop', newerData: false, storeHint: false };
const INITIAL: World = {
  installed: null,
  sandbox: null,
  keychain: {},
  permission: 'notDetermined',
  minVersion: 'off',
  lowStorage: false,
  ui: FRESH_UI,
  log: [],
  nextLog: 1,
};

const label = (v: Version) => `${v.v} (${v.build})`;

function addLog(w: World, kind: LogKind, text: string): World {
  return { ...w, log: [{ id: w.nextLog, kind, text }, ...w.log].slice(0, 9), nextLog: w.nextLog + 1 };
}

/** Is version a older than version b? The buggy app compares the strings. */
function isOlder(a: string, b: string, buggy: boolean) {
  if (buggy) return a < b;
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

/** Everything the app does when it starts: first-run setup, migrations, token move. */
function launch(w: World, buggy: boolean): World {
  if (w.installed === null) return w;
  const idx = w.installed;
  const v = VERSIONS[idx];
  let n: World = { ...w, ui: { ...FRESH_UI } };
  let sb = n.sandbox;
  let kc: Keychain = { ...n.keychain };

  if (!sb) {
    if (!buggy && (kc.session || kc.session_v2)) {
      kc = {};
      n = addLog(n, 'ok', 'First launch after install: removed leftover Keychain items');
    }
    sb = { schema: v.schema, favorites: [], settings: { ...DEFAULT_SETTINGS }, onboarding: { v1: false, v2: false }, whatsNewSeen: false };
    n = addLog(n, 'info', `Created empty app data (database schema ${v.schema})`);
  } else if (sb.schema > v.schema) {
    n = addLog({ ...n, ui: { ...n.ui, newerData: true } }, 'error', `App data uses schema ${sb.schema}, this build only understands schema ${v.schema}`);
    return { ...n, keychain: kc };
  } else if (sb.schema < v.schema) {
    if (!buggy) {
      for (let s = sb.schema; s < v.schema; s++) {
        n =
          s === 1
            ? addLog(n, 'ok', `Migration 1 → 2: moved ${sb.favorites.length} favorites to saved_items, kept settings`)
            : addLog(n, 'ok', `Migration 2 → 3: added folders to saved_items (${sb.favorites.length} items)`);
      }
      sb = { ...sb, schema: v.schema };
    } else if (v.schema - sb.schema === 1) {
      if (sb.schema === 1) {
        n = addLog(n, 'ok', `Migration 1 → 2: moved ${sb.favorites.length} favorites to saved_items`);
        sb = { ...sb, settings: { ...DEFAULT_SETTINGS } }; // BUG 2
      } else {
        n = addLog(n, 'ok', `Migration 2 → 3: added folders to saved_items (${sb.favorites.length} items)`);
      }
      sb = { ...sb, schema: v.schema };
    } else {
      // BUG 3 (and 2): only the last migration runs, and it expects a saved_items table that doesn't exist yet
      n = addLog(n, 'ok', 'Migration 2 → 3: added folders to saved_items (0 items)');
      sb = { ...sb, schema: v.schema, favorites: [], settings: { ...DEFAULT_SETTINGS } };
    }
  }

  if (idx >= 1 && kc.session && !kc.session_v2 && !buggy) {
    // BUG 1: the buggy app never moves the old token
    kc = { session_v2: kc.session };
    n = addLog(n, 'ok', 'Moved sign-in token to the new Keychain key');
  }

  n = addLog(n, 'info', `Launched FreshCart ${label(v)}`);
  return { ...n, sandbox: sb, keychain: kc };
}

function install(w: World, idx: number, buggy: boolean): World {
  const v = VERSIONS[idx];
  const from = w.installed;
  if (from === idx) return w;
  const verb = from === null ? 'Install' : idx > from ? 'Update' : 'Install';
  if (w.lowStorage) {
    return addLog(w, 'error', `${verb} failed: ${v.v} needs ${v.size} MB, only ${FREE_MB_LOW} MB free. Nothing changed.`);
  }
  let n: World = { ...w, installed: idx };
  if (from === null) n = addLog(n, 'info', `Installed FreshCart ${label(v)} · ${v.size} MB`);
  else if (idx > from) n = addLog(n, 'info', `Updated ${label(VERSIONS[from])} → ${label(v)}`);
  else n = addLog(n, 'warn', `Installed older test build ${label(v)} over ${label(VERSIONS[from])} (stores never offer this)`);
  return launch(n, buggy);
}

const userKey = (idx: number): keyof Keychain => (idx >= 1 ? 'session_v2' : 'session');

/* ---------- small iOS pieces ---------- */

function IosSwitch({ on, onChange, label: text, accent }: { on: boolean; onChange: () => void; label: string; accent: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={text}
      onClick={onChange}
      className="relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]"
      style={{ background: on ? accent : 'rgba(120,120,128,.32)' }}
    >
      <span className="absolute top-[2px] size-[20px] rounded-full bg-white shadow transition-[left]" style={{ left: on ? 18 : 2 }} />
    </button>
  );
}

const logColor: Record<LogKind, string> = { info: 'text-[#c9cde0]', ok: 'text-[#34d399]', warn: 'text-[#fbbf24]', error: 'text-[#f87171]' };

export default function VersionLab({ buggy = false }: { buggy?: boolean }) {
  const [w, setW] = useState<World>(INITIAL);

  const idx = w.installed;
  const v = idx === null ? null : VERSIONS[idx];
  const sb = w.sandbox;
  const major2 = v?.v === '2.0';
  const accent = major2 ? '#047857' : '#c2410c';
  const user = idx === null ? undefined : w.keychain[userKey(idx)];
  const needOnboarding = !!sb && (buggy && major2 ? !sb.onboarding.v2 : !(sb.onboarding.v1 || sb.onboarding.v2));
  const forced = v !== null && w.minVersion !== 'off' && isOlder(v.v, w.minVersion, buggy);
  const showWhatsNew = !buggy && major2 && !!sb && !needOnboarding && !!user && !sb.whatsNewSeen && !w.ui.newerData;
  const dark = !!sb?.settings.dark && idx !== null && !w.ui.newerData;

  const fg = dark ? '#fff' : '#000';
  const sub = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';
  const card = dark ? '#1c1c1e' : '#f2f2f7';
  const sep = dark ? 'rgba(84,84,88,.6)' : 'rgba(60,60,67,.18)';

  /* ---------- actions (all functional updates) ---------- */
  const updSandbox = (fn: (s: Sandbox) => Sandbox) => setW((p) => (p.sandbox ? { ...p, sandbox: fn(p.sandbox) } : p));
  const setUi = (patch: Partial<Ui>) => setW((p) => ({ ...p, ui: { ...p.ui, ...patch } }));

  const finishOnboarding = () =>
    setW((p) => {
      if (!p.sandbox || p.installed === null) return p;
      const is2 = VERSIONS[p.installed].v === '2.0';
      const onboarding = is2 ? { ...p.sandbox.onboarding, v2: true } : { ...p.sandbox.onboarding, v1: true };
      return addLog({ ...p, sandbox: { ...p.sandbox, onboarding, whatsNewSeen: is2 ? true : p.sandbox.whatsNewSeen }, ui: { ...p.ui, systemPrompt: false, onboardingStep: 0 } }, 'info', 'Onboarding completed');
    });

  const askNotifications = () =>
    setW((p) => {
      if (p.permission === 'notDetermined') return { ...p, ui: { ...p.ui, systemPrompt: true } };
      return p;
    });

  const answerPrompt = (allow: boolean) => {
    setW((p) => addLog({ ...p, permission: allow ? 'allowed' : 'denied' }, 'info', `Notification permission: ${allow ? 'allowed' : "don't allow"}`));
    finishOnboarding();
  };

  const signIn = () =>
    setW((p) => (p.installed === null ? p : addLog({ ...p, keychain: { ...p.keychain, [userKey(p.installed)]: 'Anna' } }, 'info', 'Signed in as Anna (token saved in Keychain)')));

  const signOut = () => setW((p) => addLog({ ...p, keychain: {}, ui: { ...p.ui, tab: 'shop' } }, 'info', 'Signed out (Keychain cleared)'));

  const toggleFav = (id: string) => updSandbox((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] }));

  const uninstall = () =>
    setW((p) =>
      p.installed === null
        ? p
        : addLog({ ...p, installed: null, sandbox: null, permission: 'notDetermined', ui: FRESH_UI }, 'warn', 'Uninstalled: app data and permissions deleted. Keychain items stay on the device (iOS).'),
    );

  const restart = () => setW((p) => (p.installed === null ? p : launch(addLog(p, 'info', 'App closed (swiped away)'), buggy)));

  const deleteDataAndContinue = () => setW((p) => launch(addLog({ ...p, sandbox: null }, 'warn', 'User deleted app data'), buggy));

  const resetDemo = () => setW(INITIAL);

  /* ---------- phone content ---------- */
  let screen: ReactNode;
  if (idx === null || !v || !sb) {
    screen = (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: 'linear-gradient(160deg,#dbeafe,#fde68a)' }}>
        <div className="grid size-16 place-items-center rounded-[18px] border-2 border-dashed border-black/30 text-black/40">
          <ShoppingBasket size={28} />
        </div>
        <p className="text-[13px] font-semibold text-black/70">FreshCart is not installed</p>
        <p className="text-[11px] text-black/55">Pick a version on the timeline to install it.</p>
      </div>
    );
  } else if (w.ui.newerData) {
    screen = (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: fg }}>
        <TriangleAlert size={34} className="text-[#ff9f0a]" />
        <p className="text-[16px] font-semibold">Can't open your data</p>
        <p className="text-[12px]" style={{ color: sub }}>
          Your data was saved by a newer version of FreshCart. Update the app, or delete the data to start over.
        </p>
        <button type="button" onClick={deleteDataAndContinue} className="mt-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white" style={{ background: '#ff3b30' }}>
          Delete app data
        </button>
      </div>
    );
  } else if (needOnboarding) {
    const step = w.ui.onboardingStep;
    screen = (
      <div className="flex h-full flex-col px-5 pt-10 pb-8 text-center" style={{ color: fg }}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="grid size-16 place-items-center rounded-full text-white" style={{ background: accent }}>
            {step === 0 ? <ShoppingBasket size={30} /> : <Bell size={28} />}
          </div>
          <p className="text-[19px] font-bold tracking-tight">{step === 0 ? (major2 ? 'Welcome to the new FreshCart' : 'Welcome to FreshCart') : 'Get delivery updates'}</p>
          <p className="text-[12px]" style={{ color: sub }}>
            {step === 0 ? 'Groceries at your door in 30 minutes.' : "We'll tell you when your rider is on the way."}
          </p>
        </div>
        <div className="mb-1 flex justify-center gap-1.5" aria-hidden>
          {[0, 1].map((i) => (
            <span key={i} className="size-1.5 rounded-full" style={{ background: i === step ? accent : sep }} />
          ))}
        </div>
        {step === 0 ? (
          <button type="button" onClick={() => setUi({ onboardingStep: 1 })} className="mt-3 rounded-xl py-2.5 text-[14px] font-semibold text-white" style={{ background: accent }}>
            Continue
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => (w.permission === 'notDetermined' ? askNotifications() : finishOnboarding())}
              className="mt-3 rounded-xl py-2.5 text-[14px] font-semibold text-white"
              style={{ background: accent }}
            >
              Turn on notifications
            </button>
            <button type="button" onClick={finishOnboarding} className="mt-1 py-2 text-[13px] font-medium" style={{ color: accent }}>
              Not now
            </button>
          </>
        )}
      </div>
    );
  } else if (!user) {
    screen = (
      <div className="flex h-full flex-col px-5 pt-8" style={{ color: fg }}>
        <p className="text-[24px] font-bold tracking-tight">Sign in</p>
        <p className="mt-1 text-[12px]" style={{ color: sub }}>
          Welcome! Sign in to see your favorites.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl text-[13px]" style={{ background: card }}>
          <div className="flex justify-between px-3 py-2.5" style={{ borderBottom: `0.5px solid ${sep}` }}>
            <span style={{ color: sub }}>Email</span>
            <span>anna@example.com</span>
          </div>
          <div className="flex justify-between px-3 py-2.5">
            <span style={{ color: sub }}>Password</span>
            <span>••••••••</span>
          </div>
        </div>
        <button type="button" onClick={signIn} className="mt-4 rounded-xl py-2.5 text-[14px] font-semibold text-white" style={{ background: accent }}>
          Sign in
        </button>
        <p className="mt-2 text-center text-[10px]" style={{ color: sub }}>
          Demo account, no typing needed
        </p>
      </div>
    );
  } else {
    const favCount = sb.favorites.length;
    screen = (
      <div className="flex h-full flex-col" style={{ color: fg }}>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-2">
          {w.ui.tab === 'shop' ? (
            <>
              <p className="text-[12px]" style={{ color: sub }}>
                Hi, {user}
              </p>
              <p className="text-[22px] font-bold tracking-tight">FreshCart</p>
              <p className="mt-3 mb-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                {major2 ? 'Saved items' : 'Favorites'} · {favCount}
              </p>
              <ul className="overflow-hidden rounded-xl" style={{ background: card }}>
                {PRODUCTS.map((p, i) => {
                  const on = sb.favorites.includes(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-2 px-3 py-2" style={{ borderTop: i ? `0.5px solid ${sep}` : undefined }}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{p.name}</span>
                        <span className="block text-[11px]" style={{ color: sub }}>
                          {p.price}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${major2 ? 'Save' : 'Favorite'} ${p.name}`}
                        onClick={() => toggleFav(p.id)}
                        className="grid size-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#007aff]"
                      >
                        <Heart size={18} fill={on ? '#ff375f' : 'none'} color={on ? '#ff375f' : sub} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold tracking-tight">Settings</p>
              <div className="mt-3 overflow-hidden rounded-xl text-[13px]" style={{ background: card }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `0.5px solid ${sep}` }}>
                  <span>Dark mode</span>
                  <IosSwitch on={sb.settings.dark} accent="#34c759" label="Dark mode" onChange={() => updSandbox((s) => ({ ...s, settings: { ...s.settings, dark: !s.settings.dark } }))} />
                </div>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `0.5px solid ${sep}` }}>
                  <span>Weekly deals email</span>
                  <IosSwitch on={sb.settings.deals} accent="#34c759" label="Weekly deals email" onChange={() => updSandbox((s) => ({ ...s, settings: { ...s.settings, deals: !s.settings.deals } }))} />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span>Notifications</span>
                  <span style={{ color: sub }}>{w.permission === 'allowed' ? 'On' : w.permission === 'denied' ? 'Off' : 'Not asked'}</span>
                </div>
              </div>
              <p className="mt-4 mb-1.5 px-1 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                About
              </p>
              <div className="overflow-hidden rounded-xl text-[13px]" style={{ background: card }}>
                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `0.5px solid ${sep}` }}>
                  <span>Version</span>
                  <span className="tabular-nums" style={{ color: sub }}>
                    {v.v} ({v.build})
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span>Signed in as</span>
                  <span style={{ color: sub }}>{user}</span>
                </div>
              </div>
              <button type="button" onClick={signOut} className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-medium text-[#ff3b30]" style={{ background: card }}>
                Sign out
              </button>
            </>
          )}
        </div>
        <div className="flex shrink-0 pb-5" style={{ borderTop: `0.5px solid ${sep}` }} role="tablist" aria-label="FreshCart sections">
          {(
            [
              ['shop', 'Shop', ShoppingBasket],
              ['settings', 'Settings', SettingsIcon],
            ] as const
          ).map(([id, text, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={w.ui.tab === id}
              onClick={() => setUi({ tab: id })}
              className="flex flex-1 flex-col items-center gap-0.5 pt-1.5 text-[10px] font-medium"
              style={{ color: w.ui.tab === id ? accent : sub }}
            >
              <Icon size={20} />
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const overlay =
    idx !== null && v && sb ? (
      <>
        {w.ui.systemPrompt && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/35 px-7">
            <div role="alertdialog" aria-label="Notification permission" className="w-full overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black backdrop-blur">
              <p className="px-4 pt-4 text-[14px] leading-snug font-semibold">"FreshCart" Would Like to Send You Notifications</p>
              <p className="px-4 pt-1 pb-3 text-[11px] text-black/70">Notifications may include alerts, sounds and icon badges.</p>
              <div className="grid grid-cols-2 border-t border-black/15 text-[14px] text-[#007aff]">
                <button type="button" onClick={() => answerPrompt(false)} className="border-r border-black/15 py-2.5">
                  Don't Allow
                </button>
                <button type="button" onClick={() => answerPrompt(true)} className="py-2.5 font-semibold">
                  Allow
                </button>
              </div>
            </div>
          </div>
        )}
        {showWhatsNew && (
          <div className="absolute inset-0 z-10 flex items-end bg-black/35">
            <div role="dialog" aria-label="What's new" className="w-full rounded-t-[18px] px-5 pt-5 pb-8" style={{ background: dark ? '#1c1c1e' : '#fff', color: fg }}>
              <Sparkles size={22} style={{ color: accent }} />
              <p className="mt-2 text-[17px] font-bold">What's new in 2.0</p>
              <ul className="mt-2 space-y-1 text-[12px]" style={{ color: sub }}>
                <li>• A fresh new look</li>
                <li>• Favorites are now "Saved items"</li>
                <li>• Organize saved items in folders</li>
              </ul>
              <button type="button" onClick={() => updSandbox((s) => ({ ...s, whatsNewSeen: true }))} className="mt-4 w-full rounded-xl py-2.5 text-[14px] font-semibold text-white" style={{ background: accent }}>
                Continue
              </button>
            </div>
          </div>
        )}
        {forced && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/45 px-7">
            <div role="alertdialog" aria-label="Update required" className="w-full overflow-hidden rounded-[14px] bg-[#f2f2f2] text-center text-black">
              <p className="px-4 pt-4 text-[15px] font-semibold">Update required</p>
              <p className="px-4 pt-1 pb-3 text-[11px] text-black/70">This version of FreshCart is no longer supported. Please update to continue.</p>
              <button type="button" onClick={() => setUi({ storeHint: true })} className="w-full border-t border-black/15 py-2.5 text-[14px] font-semibold text-[#007aff]">
                Update
              </button>
              {w.ui.storeHint && <p className="bg-[#fff7d6] px-3 py-2 text-[10px] text-black/75">Demo: this would open the App Store. Use the version timeline to update.</p>}
            </div>
          </div>
        )}
      </>
    ) : null;

  /* ---------- panels ---------- */
  const favNames = sb ? sb.favorites.map((id) => PRODUCTS.find((p) => p.id === id)?.name ?? id) : [];
  const kcKeys = Object.entries(w.keychain).filter(([, val]) => !!val);

  return (
    <div className="not-prose @container w-full">
      <div className="flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start">
        <div className="shrink-0">
          <PhoneFrame dark={dark} width={270}>
            {screen}
            {overlay}
          </PhoneFrame>
        </div>

        <div className="w-full max-w-[460px] min-w-0 flex-1 space-y-3 @2xl:max-w-none">
          {/* Timeline */}
          <div className="rounded-2xl border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Version timeline</p>
              <button type="button" onClick={resetDemo} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
                <RotateCcw size={12} /> Reset demo
              </button>
            </div>
            <ol className="relative mt-3 flex justify-between">
              <span className="absolute top-[15px] right-5 left-5 h-0.5 bg-line" aria-hidden />
              {VERSIONS.map((ver, i) => {
                const current = idx === i;
                const action = idx === null ? `Install ${ver.v}` : i > idx ? `Update to ${ver.v}` : i < idx ? `Install older test build ${ver.v}` : `${ver.v} is installed`;
                return (
                  <li key={ver.v} className="relative flex w-12 flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setW((p) => install(p, i, buggy))}
                      disabled={current}
                      aria-label={action}
                      aria-current={current ? 'step' : undefined}
                      title={action}
                      className={`grid size-8 place-items-center rounded-full border-2 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        current ? 'border-brand bg-brand text-brand-fg' : idx !== null && i < idx ? 'border-line-strong bg-subtle text-faint hover:border-brand' : 'border-line-strong bg-surface text-fg hover:border-brand'
                      }`}
                    >
                      {ver.v}
                    </button>
                    <span className="mt-1 text-[10px] text-faint tabular-nums">build {ver.build}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-muted">
              {v ? (
                <>
                  Installed: <strong className="text-fg">{label(v)}</strong> · {v.notes}
                </>
              ) : (
                'Nothing installed. Tap a version to install it.'
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={restart} disabled={idx === null} className="flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-fg hover:border-brand disabled:opacity-50">
                <RotateCcw size={13} /> Restart app
              </button>
              <button type="button" onClick={uninstall} disabled={idx === null} className="flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-danger hover:border-danger disabled:opacity-50">
                <Trash2 size={13} /> Uninstall
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-faint">Real stores only offer the newest version. Here you can pick any version to play users who update late, skip releases, or test older builds.</p>
          </div>

          {/* Device + server */}
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-line bg-surface p-3 text-sm @sm:grid-cols-2">
            <label className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <HardDrive size={14} className="shrink-0 text-muted" /> Low storage
              </span>
              <input type="checkbox" checked={w.lowStorage} onChange={(e) => {
                const on = e.target.checked;
                setW((p) => addLog({ ...p, lowStorage: on }, 'info', on ? `Device storage almost full (${FREE_MB_LOW} MB free)` : 'Storage freed up'));
              }} className="accent-[var(--brand)]" />
            </label>
            <label className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <Server size={14} className="shrink-0 text-muted" /> Min version
              </span>
              <select
                value={w.minVersion}
                onChange={(e) => {
                  const val = e.target.value;
                  setW((p) => addLog({ ...p, minVersion: val }, 'info', val === 'off' ? 'Server: forced update turned off' : `Server: minimum supported version is now ${val}`));
                }}
                className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs text-fg"
                aria-label="Minimum supported version (server config)"
              >
                <option value="off">Off</option>
                <option value="1.9">1.9</option>
                <option value="1.10">1.10</option>
              </select>
            </label>
          </div>

          {/* Storage inspector */}
          <div className="rounded-2xl border border-line bg-surface p-3 text-xs">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Storage inspector</p>
            <div className="mt-2 grid grid-cols-1 gap-2 @sm:grid-cols-2">
              <div className="min-w-0 rounded-lg bg-subtle p-2.5">
                <p className="flex items-center gap-1.5 font-semibold text-fg">
                  <Database size={13} /> App data
                </p>
                <p className="text-[11px] text-faint">Deleted on uninstall</p>
                {sb ? (
                  <dl className="mt-1.5 space-y-0.5 text-muted">
                    <div className="flex justify-between gap-2"><dt>Schema</dt><dd className="font-mono text-fg">{sb.schema}</dd></div>
                    <div className="flex justify-between gap-2"><dt>Favorites</dt><dd className="min-w-0 truncate text-right text-fg">{favNames.length ? favNames.join(', ') : 'none'}</dd></div>
                    <div className="flex justify-between gap-2"><dt>Dark mode</dt><dd className="text-fg">{sb.settings.dark ? 'on' : 'off'}</dd></div>
                    <div className="flex justify-between gap-2"><dt>Deals email</dt><dd className="text-fg">{sb.settings.deals ? 'on' : 'off'}</dd></div>
                    <div className="flex justify-between gap-2"><dt>Onboarding seen</dt><dd className="text-fg">{sb.onboarding.v1 || sb.onboarding.v2 ? 'yes' : 'no'}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-1.5 text-faint italic">empty</p>
                )}
              </div>
              <div className="min-w-0 rounded-lg bg-subtle p-2.5">
                <p className="flex items-center gap-1.5 font-semibold text-fg">
                  <KeyRound size={13} /> Keychain
                </p>
                <p className="text-[11px] text-faint">Can survive uninstall on iOS</p>
                {kcKeys.length ? (
                  <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-fg">
                    {kcKeys.map(([k, val]) => (
                      <li key={k} className="truncate">
                        {k} = "{val}"
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-faint italic">empty</p>
                )}
                <p className="mt-2 flex items-center gap-1.5 font-semibold text-fg">
                  <Bell size={13} /> Permission
                </p>
                <p className="text-muted">Notifications: <span className="text-fg">{w.permission === 'allowed' ? 'allowed' : w.permission === 'denied' ? 'denied' : 'not asked yet'}</span></p>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px]">
            <p className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
              <Info size={12} /> Device log
            </p>
            <ul className="min-h-[6rem] space-y-1 px-3 py-2" aria-live="polite">
              {w.log.length === 0 && <li className="text-white/35">Install a version to start…</li>}
              {w.log.map((l) => (
                <li key={l.id} className={`leading-snug ${logColor[l.kind]}`}>
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
