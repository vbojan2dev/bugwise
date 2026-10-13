import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { SettingRow } from './SettingRow';

/*
 * A deliberately broken Android settings screen. Bugs (don't spoil them for learners!):
 *  1. Silent failure: when the server returns 500, the switch stays flipped. No rollback, no message.
 *  2. Dark theme is never saved, so it resets after restarting the app.
 *  3. Tapping the row text does nothing; only the small switch reacts (Android rows should be tappable).
 *  4. Child switches stay enabled when "Push notifications" is off.
 *  5. Race condition: "Offers & promotions" applies whatever response arrives last, so quick on/off ends ON.
 *  6. Confusing negative label: "Turn off personalized ads" (ON means ads are off).
 */

type Key = 'push' | 'orders' | 'offers' | 'location' | 'adsOff';
type Settings = Record<Key, boolean>;

const initialServer: Settings = { push: true, orders: true, offers: false, location: true, adsOff: false };
const paramName: Record<Key, string> = { push: 'push', orders: 'orderUpdates', offers: 'offers', location: 'preciseLocation', adsOff: 'adPersonalisationOff' };

interface LogEntry {
  id: number;
  text: string;
  status: number | null;
}

export function BuggySettingsApp() {
  const server = useRef<Settings>({ ...initialServer });
  const [ui, setUi] = useState<Settings>({ ...initialServer });
  const [dark, setDark] = useState(false);
  const [serverErrors, setServerErrors] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const change = (key: Key) => (value: boolean) => {
    setUi((s) => ({ ...s, [key]: value })); // optimistic update
    const id = nextId.current++;
    const fail = serverErrors;
    // Turning offers ON hits a slower endpoint (it also subscribes the user to a mailing list).
    const ms = key === 'offers' ? (value ? 1500 : 400) : 600;
    setLog((l) => [{ id, text: `${paramName[key]}=${value}`, status: null }, ...l].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        setLog((l) => l.map((e) => (e.id === id ? { ...e, status: fail ? 500 : 200 } : e)));
        if (fail) return; // BUG 1: no rollback, no error message.
        server.current = { ...server.current, [key]: value };
        // BUG 5: the UI is overwritten with whichever response arrives last.
        if (key === 'offers') setUi((s) => ({ ...s, offers: value }));
      }, ms),
    );
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setUi({ ...server.current });
    setDark(false); // BUG 2: dark theme was never stored anywhere.
    setLog([]);
  };

  const bg = dark ? '#141218' : '#fef7ff';
  const fg = dark ? '#e6e0e9' : '#1d1b20';
  const primary = dark ? '#d0bcff' : '#6750a4';
  const line = dark ? '#49454f' : '#cac4d0';
  const row = { platform: 'material' as const, dark, rowTap: false }; // BUG 3
  const Header = ({ children }: { children: string }) => (
    <p className="px-4 pt-3 pb-0.5 text-[13px] font-medium" style={{ color: primary }}>
      {children}
    </p>
  );

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os="android" dark={dark} width={290}>
        <div className="flex h-full flex-col" style={{ background: bg, color: fg }}>
          <div className="flex h-14 shrink-0 items-center gap-4 px-4">
            <ArrowLeft size={22} aria-hidden="true" />
            <p className="text-[20px]">Settings</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-5">
            <Header>Notifications</Header>
            <SettingRow {...row} label="Push notifications" checked={ui.push} onChange={change('push')} />
            {/* BUG 4: children are not disabled when push is off. */}
            <SettingRow {...row} label="Order updates" sub="Rider location and arrival time" checked={ui.orders} onChange={change('orders')} />
            <SettingRow {...row} label="Offers & promotions" sub="Deals from restaurants" checked={ui.offers} onChange={change('offers')} />
            <div className="mx-4 mt-1 border-t" style={{ borderColor: line }} />
            <Header>Privacy</Header>
            <SettingRow {...row} label="Share precise location" sub="Helps riders find your door" checked={ui.location} onChange={change('location')} />
            {/* BUG 6 */}
            <SettingRow {...row} label="Turn off personalized ads" checked={ui.adsOff} onChange={change('adsOff')} />
            <div className="mx-4 mt-1 border-t" style={{ borderColor: line }} />
            <Header>Appearance</Header>
            <SettingRow {...row} label="Dark theme" checked={dark} onChange={setDark} />
          </div>
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Test controls</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <label className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 text-sm">
          <span>
            Server errors <span className="text-[11px] text-faint">(API returns 500)</span>
          </span>
          <input type="checkbox" checked={serverErrors} onChange={(e) => setServerErrors(e.target.checked)} className="accent-[var(--brand)]" />
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Flip a switch to see API requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-[#c4b5fd]">PATCH</span>
              <span className="min-w-0 flex-1 truncate">/api/settings {e.text}</span>
              {e.status === null ? (
                <span className="text-[#fbbf24]">pending…</span>
              ) : (
                <span className={e.status === 200 ? 'text-[#34d399]' : 'text-[#f87171]'}>{e.status}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
