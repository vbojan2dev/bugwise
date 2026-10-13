import { useEffect, useRef, useState } from 'react';
import { Car, ChevronLeft, CircleCheck, Clock, MapPin, Minus, Plus, RotateCw, Undo2, Wallet, ParkingSquare, ListChecks, RefreshCcw } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * ParkEasy: a deliberately broken street-parking app for the exploratory testing session.
 * Hidden bugs (don't spoil them for learners!):
 *  zero      The duration stepper goes down to 0 min, and a 0-minute session can be "paid" (€0.00).
 *  back      System Back on the success screen returns to the Confirm screen with Pay enabled; paying again charges twice.
 *  rotate    Rotating the phone recreates the Park screen and clears the zone, duration and vehicle choice.
 *  empty     Sessions tab with no parking shows "Loading…" forever instead of an empty state.
 *  double    Pay isn't disabled while the payment is processing: a double tap charges twice and creates two sessions.
 *  longtext  The vehicle nickname has no length limit and doesn't truncate in the footer: a long one pushes Continue off-screen.
 */

export type BugId = 'zero' | 'back' | 'rotate' | 'empty' | 'double' | 'longtext';
export type AreaId = 'form' | 'confirm' | 'paid' | 'sessions' | 'vehicles' | 'addcar' | 'back' | 'rotate';

interface Vehicle {
  id: number;
  plate: string;
  nick: string;
}
interface Session {
  id: number;
  zone: string;
  vehicle: Vehicle;
  minutes: number;
  price: number;
}

const START_BALANCE = 25;
const RATE = 0.75; // per 15 minutes
const DEFAULT_MIN = 60;
const defaultVehicles: Vehicle[] = [{ id: 1, plate: 'AB-123-CD', nick: 'My car' }];

const euro = (n: number) => `€${n.toFixed(2)}`;
const fmtDur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`);
const until = (m: number) => {
  const t = 9 * 60 + 41 + m;
  return `${Math.floor(t / 60) % 24}:${String(t % 60).padStart(2, '0')}`;
};

const ink = '#000';
const sub = 'rgba(60,60,67,.6)';
const blue = '#0a66d6';

export function ParkEasyApp({
  onBug,
  onCover,
  onRotate,
}: {
  onBug: (id: BugId) => void;
  onCover: (id: AreaId) => void;
  onRotate?: (landscape: boolean) => void;
}) {
  const [tab, setTab] = useState<'park' | 'sessions' | 'vehicles'>('park');
  const [screen, setScreen] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [carsScreen, setCarsScreen] = useState<'list' | 'add'>('list');
  const [landscape, setLandscape] = useState(false);
  const [zone, setZone] = useState('');
  const [zoneError, setZoneError] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_MIN);
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [vehicleId, setVehicleId] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [balance, setBalance] = useState(START_BALANCE);
  const [lastPaid, setLastPaid] = useState<Session | null>(null);
  const [newPlate, setNewPlate] = useState('');
  const [newNick, setNewNick] = useState('');
  const [toast, setToast] = useState('');
  const pending = useRef(0);
  const nextId = useRef(1);
  const nextCar = useRef(2);
  const timers = useRef<number[]>([]);
  const footer = useRef<HTMLDivElement>(null);
  const bugRef = useRef(onBug);
  const coverRef = useRef(onCover);
  const rotateRef = useRef(onRotate);
  bugRef.current = onBug;
  coverRef.current = onCover;
  rotateRef.current = onRotate;

  useEffect(() => {
    rotateRef.current?.(landscape);
  }, [landscape]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  const price = (duration / 15) * RATE;

  // Coverage tracking
  useEffect(() => {
    if (tab === 'park' && screen === 'form') coverRef.current('form');
    if (tab === 'park' && screen === 'confirm') coverRef.current('confirm');
    if (tab === 'park' && screen === 'success') coverRef.current('paid');
    if (tab === 'sessions') coverRef.current('sessions');
    if (tab === 'vehicles') coverRef.current(carsScreen === 'add' ? 'addcar' : 'vehicles');
  }, [tab, screen, carsScreen]);

  // BUG empty: no empty state, the spinner never stops.
  useEffect(() => {
    if (tab === 'sessions' && sessions.length === 0) bugRef.current('empty');
  }, [tab, sessions.length]);

  // BUG longtext: detect when the footer content is wider than the footer (Continue pushed out of view).
  useEffect(() => {
    const el = footer.current;
    if (el && el.scrollWidth > el.clientWidth + 1) bugRef.current('longtext');
  }, [vehicle?.nick, landscape, tab, screen, duration]);

  const showToast = (t: string) => {
    setToast(t);
    later(() => setToast(''), 1800);
  };

  const resetForm = () => {
    setZone('');
    setZoneError(false);
    setDuration(DEFAULT_MIN);
    setVehicleId(vehicles[0]?.id ?? 1);
  };

  const cont = () => {
    if (!/^\d{4}$/.test(zone)) {
      setZoneError(true);
      return;
    }
    setZoneError(false);
    if (duration === 0) bugRef.current('zero');
    setScreen('confirm');
  };

  const pay = () => {
    if (balance < price) return;
    // BUG double: the button stays enabled while processing, every tap is charged.
    pending.current += 1;
    if (pending.current === 2) bugRef.current('double');
    const s: Session = { id: nextId.current++, zone, vehicle, minutes: duration, price };
    setBalance((b) => Math.round((b - price) * 100) / 100);
    if (pending.current === 1) {
      setScreen('processing');
      later(() => {
        const n = pending.current;
        pending.current = 0;
        setSessions((prev) => [...Array.from({ length: n }, (_, i) => ({ ...s, id: s.id + i * 1000 })), ...prev]);
        setLastPaid(s);
        setScreen('success');
      }, 1300);
    }
  };

  const systemBack = () => {
    coverRef.current('back');
    if (tab === 'vehicles' && carsScreen === 'add') return setCarsScreen('list');
    if (tab !== 'park') return setTab('park');
    if (screen === 'confirm') return setScreen('form');
    if (screen === 'processing') return;
    if (screen === 'success') {
      // BUG back: goes back to the already-paid Confirm screen instead of leaving the payment flow.
      bugRef.current('back');
      return setScreen('confirm');
    }
    showToast('Press back again to exit');
  };

  const rotate = () => {
    coverRef.current('rotate');
    // BUG rotate: the Park screen is recreated and its state isn't saved.
    if (tab === 'park' && (screen === 'form' || screen === 'confirm')) {
      const dirty = zone !== '' || duration !== DEFAULT_MIN || vehicleId !== (vehicles[0]?.id ?? 1) || screen === 'confirm';
      if (dirty) bugRef.current('rotate');
      resetForm();
      setScreen('form');
    }
    setLandscape((l) => !l);
  };

  const resetApp = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    pending.current = 0;
    setTab('park');
    setScreen('form');
    setCarsScreen('list');
    setLandscape(false);
    setZone('');
    setZoneError(false);
    setDuration(DEFAULT_MIN);
    setVehicles(defaultVehicles);
    setVehicleId(1);
    setSessions([]);
    setBalance(START_BALANCE);
    setLastPaid(null);
    setNewPlate('');
    setNewNick('');
    setToast('');
  };

  const saveCar = () => {
    const plate = newPlate.trim().toUpperCase();
    if (plate.length < 2) return;
    const id = nextCar.current++;
    const nick = newNick.trim() || plate;
    setVehicles((prev) => [...prev, { id, plate, nick }]);
    setVehicleId(id);
    setNewPlate('');
    setNewNick('');
    setCarsScreen('list');
    showToast('Vehicle saved');
  };

  const card = 'rounded-xl bg-white px-3 py-2.5';
  const label = 'text-[10.5px] font-semibold uppercase tracking-wide';
  const title =
    tab === 'sessions' ? 'Sessions' : tab === 'vehicles' ? (carsScreen === 'add' ? 'Add vehicle' : 'Vehicles') : screen === 'form' ? 'Park' : screen === 'success' ? '' : 'Confirm';
  const showBackChevron = (tab === 'park' && screen === 'confirm') || (tab === 'vehicles' && carsScreen === 'add');

  const screenUi = (
    <div className="relative flex h-full flex-col text-left" style={{ background: '#f2f2f7', color: ink, colorScheme: 'light' }}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-1 px-3 pt-1 pb-1.5">
        {showBackChevron ? (
          <button
            type="button"
            onClick={() => (tab === 'vehicles' ? setCarsScreen('list') : setScreen('form'))}
            className="-ml-1 flex items-center text-[13px]"
            style={{ color: blue }}
          >
            <ChevronLeft size={18} aria-hidden="true" /> Back
          </button>
        ) : (
          <p className="text-[20px] font-bold tracking-tight">{title}</p>
        )}
        {showBackChevron && <p className="flex-1 pr-10 text-center text-[14px] font-semibold">{title}</p>}
        {!showBackChevron && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums">
            <Wallet size={12} aria-hidden="true" style={{ color: blue }} /> {euro(balance)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {tab === 'park' && screen === 'form' && (
          <div className="space-y-2">
            <div className={card}>
              <label htmlFor="pe-zone" className={label} style={{ color: sub }}>
                Zone
              </label>
              <div className="mt-1 flex items-center gap-2">
                <MapPin size={15} aria-hidden="true" style={{ color: blue }} />
                <input
                  id="pe-zone"
                  value={zone}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="e.g. 4127"
                  aria-invalid={zoneError}
                  aria-describedby="pe-zone-help"
                  onChange={(e) => {
                    setZone(e.target.value.replace(/\D/g, ''));
                    setZoneError(false);
                  }}
                  className="w-0 min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-widest outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#c7c7cc]"
                />
              </div>
              <p id="pe-zone-help" className="mt-1 text-[10.5px]" style={{ color: zoneError ? '#d70015' : sub }}>
                {zoneError ? 'Enter the 4-digit zone code from the sign.' : 'The code is on the parking sign.'}
              </p>
            </div>

            <div className={card}>
              <p className={label} style={{ color: sub }}>
                Vehicle
              </p>
              <div className="mt-1 space-y-1" role="radiogroup" aria-label="Vehicle">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={v.id === vehicleId}
                    onClick={() => setVehicleId(v.id)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-lg py-1 text-left text-[12.5px]"
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-full border-2" style={{ borderColor: v.id === vehicleId ? blue : '#c7c7cc' }}>
                      {v.id === vehicleId && <span className="size-2 rounded-full" style={{ background: blue }} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{v.nick}</span>
                    <span className="shrink-0 font-mono text-[10.5px]" style={{ color: sub }}>
                      {v.plate}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={card}>
              <p className={label} style={{ color: sub }}>
                Duration
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Shorter"
                  onClick={() => setDuration((d) => Math.max(0, d - 15))} /* BUG zero: minimum should be 15 */
                  disabled={duration === 0}
                  className="grid size-8 place-items-center rounded-full disabled:opacity-30"
                  style={{ background: '#e5f0fd', color: blue }}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <div className="text-center" aria-live="polite">
                  <p className="text-[16px] font-bold tabular-nums">{fmtDur(duration)}</p>
                  <p className="text-[10.5px]" style={{ color: sub }}>
                    Until {until(duration)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Longer"
                  onClick={() => setDuration((d) => Math.min(240, d + 15))}
                  disabled={duration >= 240}
                  className="grid size-8 place-items-center rounded-full disabled:opacity-30"
                  style={{ background: '#e5f0fd', color: blue }}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-1 text-[10.5px]" style={{ color: sub }}>
                Max 4 h · {euro(RATE)} per 15 min
              </p>
            </div>
          </div>
        )}

        {tab === 'park' && (screen === 'confirm' || screen === 'processing') && (
          <div className="space-y-2">
            <div className={`${card} space-y-1.5 text-[12.5px]`}>
              {[
                ['Zone', zone],
                ['Vehicle', `${vehicle.nick} · ${vehicle.plate}`],
                ['Duration', fmtDur(duration)],
                ['Until', until(duration)],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 justify-between gap-3">
                  <span style={{ color: sub }}>{k}</span>
                  <span className="min-w-0 truncate font-semibold">{v}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#e5e5ea] pt-1.5 text-[14px] font-bold">
                <span>Total</span>
                <span className="tabular-nums">{euro(price)}</span>
              </div>
            </div>
            <div className={`${card} flex items-center gap-2 text-[12px]`}>
              <Wallet size={15} aria-hidden="true" style={{ color: blue }} />
              <span className="min-w-0 flex-1">ParkEasy wallet</span>
              <span className="font-semibold tabular-nums">{euro(balance)}</span>
            </div>
            {balance < price && screen === 'confirm' && (
              <p className="text-[11px]" style={{ color: '#d70015' }}>
                Not enough balance. Top up your wallet to continue.
              </p>
            )}
            <button
              type="button"
              onClick={pay}
              disabled={balance < price && screen === 'confirm'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
              style={{ background: blue }}
            >
              {screen === 'processing' ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" /> Paying…
                </>
              ) : (
                <>Pay {euro(price)}</>
              )}
            </button>
          </div>
        )}

        {tab === 'park' && screen === 'success' && lastPaid && (
          <div className="flex flex-col items-center pt-4 text-center">
            <CircleCheck size={44} aria-hidden="true" style={{ color: '#248a3d' }} />
            <p className="mt-2 text-[18px] font-bold">You’re parked</p>
            <p className="mt-1 text-[12.5px]" style={{ color: sub }}>
              Zone {lastPaid.zone} · until {until(lastPaid.minutes)}
            </p>
            <p className="text-[12.5px]" style={{ color: sub }}>
              Paid {euro(lastPaid.price)} from your wallet
            </p>
            <button
              type="button"
              onClick={() => {
                setTab('sessions');
                resetForm();
                setScreen('form');
              }}
              className="mt-5 w-full rounded-xl py-2.5 text-[14px] font-semibold text-white"
              style={{ background: blue }}
            >
              View session
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setScreen('form');
              }}
              className="mt-2 w-full rounded-xl py-2 text-[13px] font-semibold"
              style={{ color: blue }}
            >
              Done
            </button>
          </div>
        )}

        {tab === 'sessions' &&
          (sessions.length === 0 ? (
            // BUG empty: should be an empty state ("No active parking" + a Park button)
            <div className="flex flex-col items-center gap-2 pt-10 text-[12px]" style={{ color: sub }} role="status">
              <span className="size-5 animate-spin rounded-full border-2 border-[#c7c7cc] border-t-transparent" aria-hidden="true" />
              Loading your parking…
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className={`${card} text-[12px]`}>
                  <div className="flex items-center gap-2">
                    <ParkingSquare size={16} aria-hidden="true" style={{ color: blue }} />
                    <span className="font-semibold">Zone {s.zone}</span>
                    <span className="ml-auto rounded-full bg-[#e3f5e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#1d7a36]">Active</span>
                  </div>
                  <p className="mt-1 truncate" style={{ color: sub }}>
                    {s.vehicle.nick} · {s.vehicle.plate}
                  </p>
                  <p className="mt-0.5 flex justify-between">
                    <span>Until {until(s.minutes)}</span>
                    <span className="font-semibold tabular-nums">{euro(s.price)}</span>
                  </p>
                </div>
              ))}
            </div>
          ))}

        {tab === 'vehicles' && carsScreen === 'list' && (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className={`${card} flex min-w-0 items-center gap-2 text-[12.5px]`}>
                <Car size={16} aria-hidden="true" style={{ color: blue }} />
                <span className="min-w-0 flex-1 truncate font-semibold">{v.nick}</span>
                <span className="shrink-0 font-mono text-[10.5px]" style={{ color: sub }}>
                  {v.plate}
                </span>
              </div>
            ))}
            <button type="button" onClick={() => setCarsScreen('add')} className={`${card} flex w-full items-center gap-2 text-[13px] font-semibold`} style={{ color: blue }}>
              <Plus size={16} aria-hidden="true" /> Add vehicle
            </button>
          </div>
        )}

        {tab === 'vehicles' && carsScreen === 'add' && (
          <div className="space-y-2">
            <div className={card}>
              <label htmlFor="pe-plate" className={label} style={{ color: sub }}>
                License plate
              </label>
              <input
                id="pe-plate"
                value={newPlate}
                maxLength={10}
                autoCapitalize="characters"
                placeholder="e.g. ZG-456-AB"
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                className="mt-1 block w-full bg-transparent font-mono text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-[#c7c7cc]"
              />
            </div>
            <div className={card}>
              <label htmlFor="pe-nick" className={label} style={{ color: sub }}>
                Nickname (optional)
              </label>
              <input
                id="pe-nick"
                value={newNick}
                placeholder="e.g. Work van"
                onChange={(e) => setNewNick(e.target.value)}
                className="mt-1 block w-full bg-transparent text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-[#c7c7cc]"
              />
            </div>
            <button
              type="button"
              onClick={saveCar}
              disabled={newPlate.trim().length < 2}
              className="w-full rounded-xl py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
              style={{ background: blue }}
            >
              Save vehicle
            </button>
          </div>
        )}
      </div>

      {/* Footer summary on the Park form. BUG longtext: nickname doesn't truncate, the right side gets clipped. */}
      {tab === 'park' && screen === 'form' && (
        <div ref={footer} className="flex shrink-0 items-center gap-2 overflow-hidden border-t border-[#e5e5ea] bg-white px-3 py-2">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap">
            <Car size={14} aria-hidden="true" style={{ color: blue }} />
            {vehicle.nick}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            <span className="text-right leading-tight">
              <span className="block text-[9.5px]" style={{ color: sub }}>
                Total
              </span>
              <span className="block text-[13px] font-bold tabular-nums">{euro(price)}</span>
            </span>
            <button type="button" onClick={cont} className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white" style={{ background: blue }}>
              Continue
            </button>
          </span>
        </div>
      )}

      {/* Tab bar */}
      {!(tab === 'park' && screen !== 'form') && (
        <nav className="flex shrink-0 border-t border-[#e5e5ea] bg-white/95 pt-1 pb-4" aria-label="ParkEasy tabs">
          {(
            [
              ['park', 'Park', ParkingSquare],
              ['sessions', 'Sessions', Clock],
              ['vehicles', 'Vehicles', ListChecks],
            ] as const
          ).map(([id, l, Icon]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => {
                setTab(id);
                if (id === 'vehicles') setCarsScreen('list');
              }}
              className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium"
              style={{ color: tab === id ? blue : '#8e8e93' }}
            >
              <Icon size={18} aria-hidden="true" />
              {l}
            </button>
          ))}
        </nav>
      )}

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center" role="status">
          <span className="rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11.5px] text-white">{toast}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3">
      {landscape ? (
        <div className="w-full max-w-[520px] rounded-[30px] bg-[#0c0d12] p-[10px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]">
          <div className="relative h-[290px] overflow-hidden rounded-[22px] bg-white">{screenUi}</div>
        </div>
      ) : (
        <PhoneFrame width={270}>{screenUi}</PhoneFrame>
      )}
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Device controls">
        <button
          type="button"
          onClick={systemBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <Undo2 size={14} aria-hidden="true" /> System back
        </button>
        <button
          type="button"
          onClick={rotate}
          aria-pressed={landscape}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
            landscape ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-fg hover:bg-subtle'
          }`}
        >
          <RotateCw size={14} aria-hidden="true" /> Rotate
        </button>
        <button
          type="button"
          onClick={resetApp}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RefreshCcw size={14} aria-hidden="true" /> Reset app
        </button>
      </div>
    </div>
  );
}
