import { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, Star, Bike, WifiOff, BatteryLow, Search, Lightbulb, LocateOff } from 'lucide-react';
import { AndroidFrame, type Network } from './AndroidFrame';

/*
 * A mock of the Android Emulator's "Extended controls" window driving a food delivery app.
 * Nothing here is a bug hunt: the app behaves correctly so learners can see what each control changes.
 */

type LocId = 'berlin' | 'munich' | 'rural' | 'none';
const locations: Record<LocId, { name: string; coords: string; area?: string }> = {
  berlin: { name: 'Berlin, Alexanderplatz', coords: '52.5219, 13.4132', area: 'Alexanderplatz' },
  munich: { name: 'Munich, Marienplatz', coords: '48.1374, 11.5755', area: 'Marienplatz' },
  rural: { name: 'Rural village (outside zone)', coords: '53.9120, 12.0310', area: 'Wiesenthal' },
  none: { name: 'No GPS fix / location off', coords: '—' },
};
const restaurants: Record<'berlin' | 'munich', { name: string; kind: string; eta: string; rating: string; color: string }[]> = {
  berlin: [
    { name: 'Curry Corner', kind: 'Street food', eta: '20–30 min', rating: '4.6', color: '#f97316' },
    { name: 'Spree Sushi', kind: 'Japanese', eta: '25–35 min', rating: '4.8', color: '#0ea5e9' },
    { name: 'Döner Lab', kind: 'Turkish', eta: '15–25 min', rating: '4.5', color: '#a855f7' },
  ],
  munich: [
    { name: 'Brezn & Co', kind: 'Bavarian', eta: '20–30 min', rating: '4.7', color: '#eab308' },
    { name: 'Isar Pizza', kind: 'Italian', eta: '30–40 min', rating: '4.4', color: '#ef4444' },
    { name: 'Green Bowl', kind: 'Healthy', eta: '15–20 min', rating: '4.9', color: '#22c55e' },
  ],
};
const networks: { id: Network; label: string }[] = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: '5g', label: '5G' },
  { id: 'lte', label: 'LTE' },
  { id: '3g', label: '3G (slow)' },
  { id: 'offline', label: 'Airplane mode' },
];

const tips: Record<string, string> = {
  start: 'Change a control on the right. Each one is a real setting in the emulator\'s Extended controls (the "…" button on its toolbar).',
  berlin: 'Location changed: the address and restaurant list should update without restarting the app.',
  munich: 'Different city, different restaurants. Check prices, currency and delivery fees update too.',
  rural: 'Outside the delivery zone: the app should show a friendly empty state, not a blank list or a spinner forever.',
  none: 'No location: the app must ask for permission or offer manual address entry, never crash or show "null".',
  battery: 'At 15% or lower (and not charging) Android warns about low battery. Does the app reduce background work, and does it still work?',
  charging: 'Plugging in a charger clears the warning. Bugs hide in the transitions: unplug at 5%, plug in at 5%.',
  wifi: 'Fast network: everything should load instantly. This is the "happy path" most developers test on.',
  '5g': 'Mobile data: watch for large downloads that should wait for Wi-Fi (videos, image packs).',
  lte: 'Mobile data: watch for large downloads that should wait for Wi-Fi (videos, image packs).',
  '3g': 'Slow network: you should see loading skeletons, not frozen screens. Do buttons stay disabled until data arrives?',
  offline: 'Offline: a clear banner, cached content where possible, and ordering disabled with an explanation.',
  dark: 'Dark theme: check every text has enough contrast and no white "flash" appears between screens.',
  light: 'Back to light theme: make sure the app follows the system setting live, without a restart.',
};

export default function ExtendedControls() {
  const [loc, setLoc] = useState<LocId>('berlin');
  const [battery, setBattery] = useState(80);
  const [charging, setCharging] = useState(false);
  const [net, setNet] = useState<Network>('wifi');
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('start');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Simulate a slow reload on 3G whenever something that triggers a refresh changes.
  const refresh = (nextNet: Network) => {
    window.clearTimeout(timer.current);
    if (nextNet === '3g') {
      setLoading(true);
      timer.current = window.setTimeout(() => setLoading(false), 2200);
    } else {
      setLoading(false);
    }
  };

  const changeLoc = (l: LocId) => {
    setLoc(l);
    setTip(l);
    refresh(net);
  };
  const changeNet = (n: Network) => {
    setNet(n);
    setTip(n);
    refresh(n);
  };

  const low = battery <= 15 && !charging;
  const offline = net === 'offline';
  const fg = dark ? '#e3e2e9' : '#1a1b20';
  const sub = dark ? '#c4c6d0' : '#5d5e67';
  const card = dark ? '#1e2026' : '#f1f0f7';
  const accent = '#e8590c';
  const l = locations[loc];
  const list = loc === 'berlin' || loc === 'munich' ? restaurants[loc] : [];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">Extended controls playground</p>
        <p className="text-sm text-muted">A food delivery app running in an Android Emulator. Fake the world around it.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex justify-center">
          <AndroidFrame dark={dark} battery={battery} charging={charging} network={net} width={236} label="Emulated Android phone">
            <div className="flex h-full flex-col px-3.5 pt-2" style={{ color: fg }}>
              {low && (
                <div className="absolute inset-x-2 top-1 z-20 rounded-2xl p-2.5 shadow-lg" style={{ background: dark ? '#2b2d35' : '#fff' }} role="status">
                  <p className="flex items-center gap-1.5 text-[10px]" style={{ color: sub }}>
                    <BatteryLow size={12} className="text-[#e5484d]" aria-hidden /> System UI · now
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold">Battery low · {battery}% left</p>
                  <p className="text-[11px]" style={{ color: sub }}>
                    Turn on Battery Saver to extend battery life
                  </p>
                </div>
              )}
              {offline && (
                <div className="-mx-3.5 mb-2 flex items-center gap-1.5 bg-[#3b3d45] px-3.5 py-1.5 text-[11px] text-white">
                  <WifiOff size={12} aria-hidden /> You're offline. Showing saved results.
                </div>
              )}
              <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: sub }}>
                Deliver to
              </p>
              <p className="flex items-center gap-1 text-[15px] font-bold">
                <MapPin size={14} style={{ color: accent }} aria-hidden />
                <span className="min-w-0 truncate">{l.area ?? 'Set your address'}</span>
                <ChevronDown size={14} aria-hidden />
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]" style={{ background: card, color: sub }}>
                <Search size={12} aria-hidden /> Search dishes or restaurants
              </div>

              <div className="mt-3 rounded-2xl p-2.5 text-[11px]" style={{ background: dark ? '#3a2416' : '#fff1e8' }}>
                <p className="flex items-center gap-1.5 font-semibold" style={{ color: dark ? '#ffb38a' : '#b54708' }}>
                  <Bike size={13} aria-hidden /> Order #4821 is on the way
                </p>
                <p className="mt-0.5" style={{ color: sub }}>
                  {offline ? 'Live tracking unavailable offline' : low ? 'Battery Saver: map updates every 60 s' : 'Live tracking · courier 1.2 km away'}
                </p>
              </div>

              {list.length > 0 && <p className="mt-3 mb-1.5 text-[12px] font-semibold">Near you</p>}
              {loading ? (
                <div className={`space-y-2 ${list.length ? "" : "mt-3"}`} aria-label="Loading">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-2 rounded-xl p-2" style={{ background: card }}>
                      <div className="size-9 rounded-lg" style={{ background: dark ? '#2f323a' : '#e2e1ea' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-2/3 rounded" style={{ background: dark ? '#2f323a' : '#e2e1ea' }} />
                        <div className="h-2 w-1/3 rounded" style={{ background: dark ? '#2f323a' : '#e2e1ea' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : loc === 'none' ? (
                <div className="mt-2 rounded-2xl p-3 text-center text-[11px]" style={{ background: card }}>
                  <LocateOff size={22} className="mx-auto" style={{ color: sub }} aria-hidden />
                  <p className="mt-1.5 text-[12px] font-semibold">We can't find you</p>
                  <p style={{ color: sub }}>Turn on location or enter your address.</p>
                  <span className="mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold text-white" style={{ background: accent }}>
                    Enter address
                  </span>
                </div>
              ) : loc === 'rural' ? (
                <div className="mt-2 rounded-2xl p-3 text-center text-[11px]" style={{ background: card }}>
                  <p className="text-[22px]" aria-hidden>
                    🛵
                  </p>
                  <p className="text-[12px] font-semibold">We don't deliver to Wiesenthal yet</p>
                  <p style={{ color: sub }}>Try another address or get notified when we arrive.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((r) => (
                    <li key={r.name} className="flex items-center gap-2 rounded-xl p-2" style={{ background: card, opacity: offline ? 0.55 : 1 }}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white" style={{ background: r.color }}>
                        {r.name[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold">{r.name}</span>
                        <span className="block truncate text-[10px]" style={{ color: sub }}>
                          {r.kind} · {offline ? 'Ordering unavailable' : r.eta}
                        </span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold">
                        <Star size={10} fill="currentColor" className="text-[#f59e0b]" aria-hidden />
                        {r.rating}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AndroidFrame>
        </div>

        <div className="min-w-0 space-y-4">
          <fieldset className="rounded-2xl border border-line bg-subtle p-3">
            <legend className="px-1 text-xs font-semibold tracking-wide text-faint uppercase">Location</legend>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(Object.keys(locations) as LocId[]).map((id) => (
                <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${loc === id ? 'border-brand bg-brand-soft' : 'border-line bg-surface'}`}>
                  <input type="radio" name="emu-loc" checked={loc === id} onChange={() => changeLoc(id)} className="accent-[var(--brand)]" />
                  <span className="min-w-0">{locations[id].name}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 font-mono text-xs text-muted">Lat, long: {l.coords}</p>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-subtle p-3">
            <legend className="px-1 text-xs font-semibold tracking-wide text-faint uppercase">Battery</legend>
            <label className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0">Charge level</span>
              <input
                type="range"
                min={1}
                max={100}
                value={battery}
                onChange={(e) => {
                  setBattery(Number(e.target.value));
                  setTip('battery');
                }}
                className="w-0 min-w-0 flex-1 accent-[var(--brand)]"
              />
              <span className="w-10 text-right font-mono tabular-nums">{battery}%</span>
            </label>
            <label className="mt-2 flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0">Charger</span>
              <select
                value={charging ? 'ac' : 'none'}
                onChange={(e) => {
                  setCharging(e.target.value === 'ac');
                  setTip('charging');
                }}
                className="w-0 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1"
              >
                <option value="none">None</option>
                <option value="ac">AC charger</option>
              </select>
            </label>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-subtle p-3">
            <legend className="px-1 text-xs font-semibold tracking-wide text-faint uppercase">Cellular / network</legend>
            <div className="flex flex-wrap gap-1.5">
              {networks.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={net === n.id}
                  onClick={() => changeNet(n.id)}
                  className={`rounded-lg border px-2.5 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${net === n.id ? 'border-brand bg-brand-soft font-semibold' : 'border-line bg-surface text-muted hover:text-fg'}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-subtle p-3">
            <legend className="px-1 text-xs font-semibold tracking-wide text-faint uppercase">Display</legend>
            <label className="flex items-center justify-between text-sm">
              Dark theme
              <input
                type="checkbox"
                checked={dark}
                onChange={(e) => {
                  setDark(e.target.checked);
                  setTip(e.target.checked ? 'dark' : 'light');
                }}
                className="accent-[var(--brand)]"
              />
            </label>
          </fieldset>

          <p className="flex gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm" aria-live="polite">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <span>{tips[tip]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
