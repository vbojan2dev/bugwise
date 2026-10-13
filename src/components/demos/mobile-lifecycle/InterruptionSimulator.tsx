import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlarmClock,
  BatteryLow,
  CheckCircle2,
  Clapperboard,
  CreditCard,
  Dumbbell,
  Headphones,
  Lock,
  MessageSquare,
  Pause,
  Phone as PhoneIcon,
  PhoneIncoming,
  PhoneOff,
  Play,
  RotateCcw,
  Smartphone,
  Speaker,
  Volume2,
} from 'lucide-react';
import { Phone, mmss } from './Phone';

/*
 * Interruption simulator. With `buggy` it becomes the bug-hunt app (don't spoil it for learners!):
 *  1. Video keeps playing under an incoming call / alarm (audio interruption ignored).
 *  2. A workout the user paused starts counting again after the interruption ends.
 *  3. The payment form draft (amount + note) is wiped after returning from a call.
 *  4. If the payment is processing when the interruption starts, it is sent AGAIN on return.
 *  5. Disconnecting headphones does not pause the video: it keeps playing through the speaker.
 *  6. Unlocking after the screen was locked for 8+ seconds shows a blank white screen.
 * In buggy mode the timeline only shows system events, not the app's reactions.
 */

type AppKind = 'video' | 'workout' | 'payment';
type Stage = 'form' | 'processing' | 'done';
type Overlay =
  | { kind: 'call'; phase: 'ringing' | 'active'; since: number }
  | { kind: 'alarm' }
  | { kind: 'battery' }
  | { kind: 'lock'; since: number }
  | null;

interface Req {
  id: number;
  key: string;
  amount: number;
  left: number;
  done: boolean;
}
interface Ev {
  id: number;
  t: number;
  kind: 'sys' | 'ok';
  text: string;
}
interface S {
  t: number;
  seq: number;
  app: AppKind;
  playing: boolean;
  pos: number;
  headphones: boolean;
  pausedByInterruption: boolean;
  wRunning: boolean;
  wElapsed: number;
  amount: string;
  note: string;
  stage: Stage;
  balance: number;
  sent: { id: number; amount: number }[];
  reqs: Req[];
  overlay: Overlay;
  banner: number | null;
  battery: number;
  lowPower: boolean;
  blank: boolean;
  snap: { playing: boolean; wRunning: boolean; stage: Stage } | null;
  log: Ev[];
}

const VIDEO_LENGTH = 754;
const REQUEST_SECONDS = 4;

const initial = (app: AppKind = 'video'): S => ({
  t: 0,
  seq: 0,
  app,
  playing: false,
  pos: 72,
  headphones: true,
  pausedByInterruption: false,
  wRunning: true,
  wElapsed: 300,
  amount: '25.00',
  note: 'Concert tickets',
  stage: 'form',
  balance: 1240,
  sent: [],
  reqs: [],
  overlay: null,
  banner: null,
  battery: 0.75,
  lowPower: false,
  blank: false,
  snap: null,
  log: [],
});

const euro = (n: number) => `€${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const parseAmount = (a: string) => {
  const n = parseFloat(a.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

export default function InterruptionSimulator({ buggy = false }: { buggy?: boolean }) {
  const [s, setS] = useState<S>(() => initial());
  const logBox = useRef<HTMLOListElement>(null);
  const lastLogId = s.log.length ? s.log[s.log.length - 1].id : 0;
  useEffect(() => {
    const el = logBox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastLogId]);

  /* ---------- pure state helpers (operate on a shallow copy `n`) ---------- */
  const log = (n: S, kind: Ev['kind'], text: string) => {
    if (buggy && kind !== 'sys') return; // the bug hunt does not tell you how the app reacted
    n.seq += 1;
    n.log = [...n.log, { id: n.seq, t: n.t, kind, text }].slice(-40);
  };

  const sendRequest = (n: S, amount: number) => {
    n.seq += 1;
    const key = Math.random().toString(16).slice(2, 6);
    n.reqs = [{ id: n.seq, key, amount, left: REQUEST_SECONDS, done: false }, ...n.reqs].slice(0, 6);
    n.stage = 'processing';
  };

  /** Something takes over the screen or audio: call, alarm or lock. */
  const begin = (n: S, audio: boolean) => {
    n.snap = { playing: n.playing, wRunning: n.wRunning, stage: n.stage };
    // Video: the OS stops video when the screen locks; audio interruptions must be handled by the app.
    if (n.playing && (!audio || !buggy)) {
      n.playing = false;
      n.pausedByInterruption = true;
      log(n, 'ok', `Video paused at ${mmss(n.pos)} so it doesn't play under the ${audio ? 'interruption' : 'lock screen'}.`);
    } else if (n.app === 'video' && !n.playing) {
      log(n, 'ok', 'Video was already paused. Nothing to do.');
    }
    if (n.app === 'workout') {
      log(n, 'ok', n.wRunning ? `Workout keeps timing on the real clock (${mmss(n.wElapsed)}).` : `Workout stays paused at ${mmss(n.wElapsed)}.`);
    }
    if (n.app === 'payment') {
      if (n.stage === 'form') log(n, 'ok', `Draft saved: ${n.amount || '(empty)'} · "${n.note || 'no note'}".`);
      if (n.stage === 'processing') log(n, 'ok', 'Payment request keeps running. The app remembers it is waiting for that one request.');
    }
  };

  /** The interruption is over and the app is visible again. */
  const finish = (n: S) => {
    const snap = n.snap;
    n.snap = null;
    if (buggy) {
      if (n.app === 'workout' && snap && !snap.wRunning) n.wRunning = true; // BUG 2
      if (n.app === 'payment') {
        if (n.stage === 'form') {
          n.amount = ''; // BUG 3
          n.note = '';
        }
        if (snap?.stage === 'processing') {
          const amount = n.reqs[0]?.amount ?? parseAmount(n.amount);
          if (amount) sendRequest(n, amount); // BUG 4: "resume" re-submits the payment
        }
      }
      return;
    }
    if (n.app === 'video') {
      log(n, 'ok', n.pausedByInterruption ? `Video waits paused at ${mmss(n.pos)}. The user decides when to continue.` : 'Video state unchanged.');
    }
    if (n.app === 'workout') {
      log(n, 'ok', n.wRunning ? `Timer is correct: ${mmss(n.wElapsed)}, no freeze and no jump.` : `Workout is still paused at ${mmss(n.wElapsed)}.`);
    }
    if (n.app === 'payment') {
      if (n.stage === 'form') log(n, 'ok', 'Draft restored exactly as it was.');
      if (n.stage === 'processing') log(n, 'ok', 'Still waiting for the same request. Nothing is sent again.');
      if (n.stage === 'done' && snap?.stage !== 'done') log(n, 'ok', 'Shows the result of the one payment. No second charge.');
    }
  };

  const tick = (p: S): S => {
    const n: S = { ...p, t: p.t + 1 };
    if (n.playing) {
      n.pos = Math.min(VIDEO_LENGTH, n.pos + 1);
      if (n.pos >= VIDEO_LENGTH) n.playing = false;
    }
    if (n.wRunning) n.wElapsed += 1;
    if (n.reqs.some((r) => !r.done)) {
      n.reqs = n.reqs.map((r) => {
        if (r.done) return r;
        const left = r.left - 1;
        if (left > 0) return { ...r, left };
        n.balance = Math.round((n.balance - r.amount) * 100) / 100;
        n.sent = [{ id: r.id, amount: r.amount }, ...n.sent].slice(0, 4);
        log(n, 'ok', `Server confirmed the payment (201). Balance updated once.`);
        return { ...r, left: 0, done: true };
      });
      if (n.stage === 'processing' && n.reqs.every((r) => r.done)) n.stage = 'done';
    }
    if (n.banner !== null && n.t >= n.banner) n.banner = null;
    return n;
  };

  useEffect(() => {
    const id = window.setInterval(() => setS(tick), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buggy]);

  const act = (fn: (n: S) => void) =>
    setS((p) => {
      const n: S = { ...p };
      fn(n);
      return n;
    });

  /* ---------- interruption triggers ---------- */
  const fire = {
    call: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        n.overlay = { kind: 'call', phase: 'ringing', since: n.t };
        log(n, 'sys', 'Incoming call from Mom. Ringtone plays.');
        begin(n, true);
      }),
    notification: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        n.banner = n.t + 4;
        log(n, 'sys', 'Notification banner: new message from Sam.');
        log(n, 'ok', 'Banner only: app stays active, nothing pauses, nothing is lost.');
      }),
    alarm: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        n.overlay = { kind: 'alarm' };
        log(n, 'sys', 'Alarm "Leave for work" goes off. Alarm sound plays.');
        begin(n, true);
      }),
    battery: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        n.overlay = { kind: 'battery' };
        n.battery = 0.2;
        log(n, 'sys', 'Low Battery alert: 20% remaining.');
      }),
    headphones: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        if (n.headphones) {
          n.headphones = false;
          log(n, 'sys', 'Headphones disconnected. Audio route switches to the phone speaker.');
          if (n.playing && !buggy) {
            n.playing = false;
            n.pausedByInterruption = false;
            log(n, 'ok', `Video paused at ${mmss(n.pos)} so it doesn't suddenly blast from the speaker.`);
          } else if (!n.playing) log(n, 'ok', 'Nothing is playing, so nothing to do.');
        } else {
          n.headphones = true;
          log(n, 'sys', 'Headphones connected.');
          log(n, 'ok', 'App does not auto-play. It waits for the user to press Play.');
        }
      }),
    lock: () =>
      act((n) => {
        if (n.overlay || n.blank) return;
        n.overlay = { kind: 'lock', since: n.t };
        log(n, 'sys', 'Screen locked (side button). App goes to the background.');
        begin(n, false);
      }),
  };

  /* ---------- in-phone actions ---------- */
  const acceptCall = () =>
    act((n) => {
      if (n.overlay?.kind !== 'call') return;
      n.overlay = { kind: 'call', phase: 'active', since: n.t };
      log(n, 'sys', 'Call accepted. Call audio uses the earpiece.');
    });
  const endCall = (declined: boolean) =>
    act((n) => {
      if (n.overlay?.kind !== 'call') return;
      const dur = n.t - n.overlay.since;
      n.overlay = null;
      log(n, 'sys', declined ? 'Call declined. App is back on screen.' : `Call ended after ${mmss(dur)}. App is back on screen.`);
      finish(n);
    });
  const stopAlarm = (snooze: boolean) =>
    act((n) => {
      if (n.overlay?.kind !== 'alarm') return;
      n.overlay = null;
      log(n, 'sys', snooze ? 'Alarm snoozed for 9 minutes.' : 'Alarm stopped.');
      finish(n);
    });
  const closeBattery = (lowPower: boolean) =>
    act((n) => {
      if (n.overlay?.kind !== 'battery') return;
      n.overlay = null;
      if (lowPower) {
        n.lowPower = true;
        log(n, 'sys', 'Low Power Mode turned on (battery icon turns yellow).');
        log(n, 'ok', 'App keeps working, but pauses background refresh and heavy animations to save power.');
      } else {
        log(n, 'sys', 'Alert closed.');
        log(n, 'ok', 'App carried on. A system alert must never reset the screen.');
      }
    });
  const unlock = () =>
    act((n) => {
      if (n.overlay?.kind !== 'lock') return;
      const lockedFor = n.t - n.overlay.since;
      n.overlay = null;
      log(n, 'sys', `Screen unlocked after ${lockedFor} s. App returns to the foreground.`);
      if (buggy && lockedFor >= 8) {
        n.blank = true; // BUG 6
        n.snap = null;
        return;
      }
      finish(n);
    });

  const togglePlay = () =>
    act((n) => {
      if (n.pos >= VIDEO_LENGTH) n.pos = 0;
      n.playing = !n.playing;
      n.pausedByInterruption = false;
    });
  const toggleWorkout = () => act((n) => void (n.wRunning = !n.wRunning));
  const resetWorkout = () =>
    act((n) => {
      n.wRunning = false;
      n.wElapsed = 0;
    });
  const pay = () =>
    act((n) => {
      const amount = parseAmount(n.amount);
      if (n.stage !== 'form' || !amount || amount > n.balance) return;
      sendRequest(n, amount);
    });
  const newPayment = () =>
    act((n) => {
      n.stage = 'form';
      n.amount = '';
      n.note = '';
    });
  const pickApp = (app: AppKind) =>
    act((n) => {
      if (n.overlay || n.blank || n.app === app) return;
      if (n.app === 'video') {
        n.playing = false; // leaving the player stops the video
        n.pausedByInterruption = false;
      }
      n.app = app;
    });
  const restart = () => setS((p) => ({ ...initial(p.app), seq: p.seq + 1 }));

  /* ---------- derived ---------- */
  const ov = s.overlay;
  const audio: { label: string; icon: ReactNode }[] = [];
  if (ov?.kind === 'call' && ov.phase === 'ringing') audio.push({ label: 'Ringtone · speaker', icon: <PhoneIncoming size={13} /> });
  if (ov?.kind === 'call' && ov.phase === 'active') audio.push({ label: `Call audio · ${s.headphones ? 'headphones' : 'earpiece'}`, icon: <PhoneIcon size={13} /> });
  if (ov?.kind === 'alarm') audio.push({ label: 'Alarm sound · speaker', icon: <AlarmClock size={13} /> });
  if (s.playing) audio.push({ label: `Video audio · ${s.headphones ? 'headphones' : 'phone speaker'}`, icon: s.headphones ? <Headphones size={13} /> : <Speaker size={13} /> });

  const busy = !!ov || s.blank;
  const darkScreen = !s.blank && (ov?.kind === 'call' || ov?.kind === 'alarm' || ov?.kind === 'lock');

  /* ---------- phone screen ---------- */
  const appScreen = (() => {
    if (s.blank) return <div className="h-full bg-white" aria-label="Blank screen" />;
    if (s.app === 'video')
      return (
        <div className="flex h-full flex-col bg-white px-3 pt-2 text-black">
          <p className="text-[20px] font-bold tracking-tight">StreamBox</p>
          <div className="relative mt-2 aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-[#ff9a62] via-[#d9468f] to-[#3b1d6e]">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              type="button"
              onClick={togglePlay}
              aria-label={s.playing ? 'Pause video' : 'Play video'}
              className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur focus-visible:outline-2 focus-visible:outline-white"
            >
              {s.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="absolute inset-x-2.5 bottom-2 flex items-center gap-2 text-[10px] font-medium text-white tabular-nums">
              <span>{mmss(s.pos)}</span>
              <span className="relative h-[3px] flex-1 rounded-full bg-white/35">
                <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${(s.pos / VIDEO_LENGTH) * 100}%` }} />
              </span>
              <span>{mmss(VIDEO_LENGTH)}</span>
            </div>
          </div>
          {!buggy && s.pausedByInterruption && !s.playing && (
            <p className="mt-2 rounded-lg bg-[#f2f2f7] px-2.5 py-1.5 text-[11px] text-[#3c3c43]">Paused while you were interrupted. Tap play to continue.</p>
          )}
          <p className="mt-3 text-[15px] font-semibold">Sunset Yoga Flow</p>
          <p className="text-[11px] text-[#3c3c4399]">Episode 3 · Relax &amp; stretch</p>
          <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide text-[#3c3c4399] uppercase">Up next</p>
          {['Morning Energy · 9:12', 'Core Basics · 14:05'].map((t) => (
            <div key={t} className="mb-1.5 flex items-center gap-2 rounded-lg bg-[#f2f2f7] p-2 text-[12px]">
              <span className="h-7 w-11 shrink-0 rounded-md bg-gradient-to-br from-[#7ad3ff] to-[#5b4bff]" />
              {t}
            </div>
          ))}
        </div>
      );
    if (s.app === 'workout')
      return (
        <div className="flex h-full flex-col items-center bg-black px-4 pt-3 text-white">
          <p className="self-start text-[20px] font-bold tracking-tight">Interval Run</p>
          <p className="self-start text-[11px] text-white/55">Round 3 of 6 · Run 2 min, walk 1 min</p>
          <div className="mt-6 grid size-44 place-items-center rounded-full border-[6px]" style={{ borderColor: s.wRunning ? '#a6ff00' : '#3a3a3c' }}>
            <div className="text-center">
              <p className="text-[38px] font-semibold tabular-nums" aria-live="off">
                {mmss(s.wElapsed)}
              </p>
              <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: s.wRunning ? '#a6ff00' : '#ff9f0a' }}>
                {s.wRunning ? 'Running' : 'Paused'}
              </p>
            </div>
          </div>
          <div className="mt-6 flex w-full gap-2">
            <button type="button" onClick={resetWorkout} className="h-11 flex-1 rounded-full bg-[#2c2c2e] text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-white">
              End
            </button>
            <button
              type="button"
              onClick={toggleWorkout}
              className="h-11 flex-1 rounded-full text-[13px] font-semibold text-black focus-visible:outline-2 focus-visible:outline-white"
              style={{ background: s.wRunning ? '#ff9f0a' : '#a6ff00' }}
            >
              {s.wRunning ? 'Pause' : s.wElapsed === 0 ? 'Start' : 'Resume'}
            </button>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-[#1c1c1e] p-2">
              <p className="text-[10px] text-white/55">Distance</p>
              <p className="text-[14px] font-semibold tabular-nums">{(s.wElapsed / 380).toFixed(2)} km</p>
            </div>
            <div className="rounded-xl bg-[#1c1c1e] p-2">
              <p className="text-[10px] text-white/55">Heart rate</p>
              <p className="text-[14px] font-semibold">{s.wRunning ? 148 : 112} bpm</p>
            </div>
          </div>
        </div>
      );
    const amount = parseAmount(s.amount);
    return (
      <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
        <p className="text-[20px] font-bold tracking-tight">Send money</p>
        <p className="text-[11px] text-[#3c3c4399]">
          Balance <span className="font-semibold text-black tabular-nums">{euro(s.balance)}</span>
        </p>
        {s.stage === 'form' && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#5b4bff] text-[12px] font-semibold text-white">AL</span>
              <span className="min-w-0 flex-1 text-[12px]">
                <span className="block font-semibold">Anna Lee</span>
                <span className="block text-[#3c3c4399]">IBAN ••• 4821</span>
              </span>
            </div>
            <label className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[12px]">
              <span className="w-12 shrink-0 text-[#3c3c4399]">Amount</span>
              <input
                value={s.amount}
                inputMode="decimal"
                onChange={(e) => {
                  const v = e.target.value;
                  act((n) => void (n.amount = v));
                }}
                placeholder="0.00"
                className="w-0 min-w-0 flex-1 bg-transparent text-[14px] font-semibold tabular-nums outline-none"
              />
              <span className="text-[#3c3c4399]">EUR</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[12px]">
              <span className="w-12 shrink-0 text-[#3c3c4399]">Note</span>
              <input
                value={s.note}
                onChange={(e) => {
                  const v = e.target.value;
                  act((n) => void (n.note = v));
                }}
                placeholder="What's it for?"
                className="w-0 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={pay}
              disabled={!amount || amount > s.balance}
              className="h-10 w-full rounded-xl bg-[#5b4bff] text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4bff] disabled:opacity-40"
            >
              Send {amount ? euro(amount) : ''}
            </button>
          </div>
        )}
        {s.stage === 'processing' && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center" role="status">
            <span className="size-8 animate-spin rounded-full border-[3px] border-[#5b4bff] border-t-transparent" />
            <p className="text-[13px] font-semibold">Sending payment…</p>
            <p className="text-[11px] text-[#3c3c4399]">Please don't close the app.</p>
          </div>
        )}
        {s.stage === 'done' && (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center" role="status">
            <CheckCircle2 size={34} className="text-[#34c759]" />
            <p className="text-[13px] font-semibold">Payment sent to Anna Lee</p>
            <button type="button" onClick={newPayment} className="mt-1 text-[12px] font-semibold text-[#5b4bff]">
              New payment
            </button>
          </div>
        )}
        <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide text-[#3c3c4399] uppercase">Recent</p>
        {s.sent.length === 0 && <p className="text-[11px] text-[#3c3c4399]">No payments yet today.</p>}
        {s.sent.map((x) => (
          <div key={x.id} className="mb-1.5 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-[12px]">
            <span>Anna Lee</span>
            <span className="font-semibold tabular-nums">−{euro(x.amount)}</span>
          </div>
        ))}
      </div>
    );
  })();

  const overlay = (() => {
    if (s.blank || !ov) return null;
    if (ov.kind === 'call')
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-gradient-to-b from-[#3a4a5c] to-[#12161c] px-5 pt-14 pb-10 text-white">
          <span className="grid size-16 place-items-center rounded-full bg-white/20 text-[22px] font-semibold">M</span>
          <p className="mt-3 text-[24px] font-normal">Mom</p>
          <p className="text-[12px] text-white/65">{ov.phase === 'ringing' ? 'mobile' : mmss(s.t - ov.since)}</p>
          <div className="mt-auto flex w-full justify-around">
            {ov.phase === 'ringing' ? (
              <>
                <RoundBtn color="#ff3b30" label="Decline" onClick={() => endCall(true)}>
                  <PhoneOff size={24} />
                </RoundBtn>
                <RoundBtn color="#34c759" label="Accept" onClick={acceptCall}>
                  <PhoneIcon size={24} />
                </RoundBtn>
              </>
            ) : (
              <RoundBtn color="#ff3b30" label="End" onClick={() => endCall(false)}>
                <PhoneOff size={24} />
              </RoundBtn>
            )}
          </div>
        </div>
      );
    if (ov.kind === 'alarm')
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-black px-5 pt-16 pb-10 text-white">
          <AlarmClock size={30} className="text-[#ff9f0a]" />
          <p className="mt-2 text-[56px] leading-none font-light tabular-nums">7:30</p>
          <p className="mt-2 text-[14px] text-white/70">Leave for work</p>
          <div className="mt-auto flex w-full flex-col gap-2">
            <button type="button" onClick={() => stopAlarm(true)} className="h-11 rounded-full bg-[#ff9f0a] text-[15px] font-semibold text-black focus-visible:outline-2 focus-visible:outline-white">
              Snooze
            </button>
            <button type="button" onClick={() => stopAlarm(false)} className="h-11 rounded-full bg-[#2c2c2e] text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-white">
              Stop
            </button>
          </div>
        </div>
      );
    if (ov.kind === 'lock')
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-gradient-to-b from-[#1d2b53] to-[#0b0f1d] px-4 pt-8 pb-10 text-white">
          <Lock size={14} className="opacity-80" />
          <p className="mt-1 text-[12px] font-medium opacity-80">Tuesday 13 October</p>
          <p className="text-[60px] leading-none font-semibold tabular-nums">9:41</p>
          {s.app === 'workout' && (
            <div className="mt-5 flex w-full items-center justify-between rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
              <span className="flex items-center gap-2 text-[12px]">
                <Dumbbell size={14} /> Interval Run
              </span>
              <span className="text-[16px] font-semibold tabular-nums">{mmss(s.wElapsed)}</span>
            </div>
          )}
          <button type="button" onClick={unlock} className="mt-auto rounded-full bg-white/20 px-6 py-2.5 text-[13px] font-semibold backdrop-blur focus-visible:outline-2 focus-visible:outline-white">
            Unlock (Face ID)
          </button>
        </div>
      );
    // Low battery alert (iOS style)
    return (
      <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 px-6">
        <div role="alertdialog" aria-label="Low Battery" className="w-full max-w-[220px] overflow-hidden rounded-2xl bg-[#f2f2f7]/95 text-center text-black backdrop-blur">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[15px] font-semibold">Low Battery</p>
            <p className="mt-1 text-[12px]">20% of battery remaining</p>
          </div>
          <button type="button" onClick={() => closeBattery(true)} className="block h-10 w-full border-t border-black/15 text-[15px] text-[#007aff]">
            Low Power Mode
          </button>
          <button type="button" onClick={() => closeBattery(false)} className="block h-10 w-full border-t border-black/15 text-[15px] font-semibold text-[#007aff]">
            Close
          </button>
        </div>
      </div>
    );
  })();

  const phone = (
    <Phone width={260} lowPower={s.lowPower} battery={s.battery} darkStatus={darkScreen || (!s.blank && s.app === 'workout')} screenBg={s.blank ? '#fff' : s.app === 'workout' ? '#000' : s.app === 'payment' ? '#f2f2f7' : '#fff'}>
      {appScreen}
      {overlay}
      {s.banner !== null && !s.blank && (
        <div className="absolute inset-x-2 top-1 z-40 flex items-start gap-2 rounded-2xl bg-[#f6f6f8]/95 p-2.5 text-black shadow-lg ring-1 ring-black/5 backdrop-blur" role="status">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#34c759] text-white">
            <MessageSquare size={15} fill="currentColor" />
          </span>
          <span className="min-w-0 flex-1 text-[11px] leading-snug">
            <span className="flex justify-between font-semibold">
              Sam <span className="font-normal text-[#3c3c4399]">now</span>
            </span>
            <span className="block truncate">Are we still on for 7?</span>
          </span>
        </div>
      )}
    </Phone>
  );

  const appPicker = (
    <div className="flex w-full max-w-[300px] rounded-xl bg-surface p-1 ring-1 ring-line" role="group" aria-label="Sample app">
      {(
        [
          ['video', 'Video', Clapperboard],
          ['workout', 'Workout', Dumbbell],
          ['payment', 'Payment', CreditCard],
        ] as const
      ).map(([k, label, Icon]) => (
        <button
          key={k}
          type="button"
          aria-pressed={s.app === k}
          disabled={busy}
          onClick={() => pickApp(k)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${s.app === k ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg'}`}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );

  const triggers = (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Fire an interruption</p>
        <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Restart app
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Trigger icon={<PhoneIncoming size={15} />} label="Incoming call" onClick={fire.call} disabled={busy} />
        <Trigger icon={<MessageSquare size={15} />} label="Notification" onClick={fire.notification} disabled={busy} />
        <Trigger icon={<AlarmClock size={15} />} label="Alarm" onClick={fire.alarm} disabled={busy} />
        <Trigger icon={<BatteryLow size={15} />} label="Low battery" onClick={fire.battery} disabled={busy} />
        <Trigger icon={<Headphones size={15} />} label={s.headphones ? 'Unplug headphones' : 'Plug in headphones'} onClick={fire.headphones} disabled={busy} />
        <Trigger icon={<Lock size={15} />} label="Lock screen" onClick={fire.lock} disabled={busy} />
      </div>
      {busy && !s.blank && <p className="mt-2 text-xs text-muted">Answer the interruption on the phone first (decline, end, stop, close or unlock).</p>}
    </div>
  );

  const audioPanel = (
    <div className="w-full rounded-2xl border border-line bg-surface p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
        <Volume2 size={13} /> What you'd hear
      </p>
      {audio.length === 0 ? (
        <p className="text-sm text-muted">Silence</p>
      ) : (
        <ul className="space-y-1">
          {audio.map((a) => (
            <li key={a.label} className="flex items-center gap-2 text-sm">
              <span className="text-brand">{a.icon}</span>
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const network =
    s.app === 'payment' ? (
      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[3rem] space-y-1 px-3 py-2">
          {s.reqs.length === 0 && <li className="text-white/35">Tap Send to see the payment request…</li>}
          {s.reqs.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">POST</span>
              <span className="min-w-0 flex-1 truncate">
                /payments {euro(r.amount)} key={r.key}
              </span>
              {r.done ? <span className="text-[#34d399]">201</span> : <span className="text-[#fbbf24]">pending…</span>}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const timeline = (
    <div className="w-full rounded-2xl border border-line bg-surface">
      <p className="border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-faint uppercase">Event timeline</p>
      <ol ref={logBox} className="max-h-64 min-h-[5rem] space-y-2 overflow-y-auto px-3 py-2.5" aria-live="polite">
        {s.log.length === 0 && <li className="text-sm text-faint">Fire an interruption to see what happens…</li>}
        {s.log.map((e) => (
          <li key={e.id} className="flex items-start gap-2 text-[13px] leading-snug">
            <span className="mt-0.5 w-9 shrink-0 font-mono text-[11px] text-faint tabular-nums">{mmss(e.t)}</span>
            {e.kind === 'sys' ? <Smartphone size={14} className="mt-0.5 shrink-0 text-muted" aria-label="System" /> : <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" aria-label="App" />}
            <span className={`min-w-0 flex-1 ${e.kind === 'sys' ? 'text-muted' : 'text-fg'}`}>{e.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  if (buggy)
    return (
      <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
        {appPicker}
        {phone}
        {triggers}
        {audioPanel}
        {network}
        {timeline}
      </div>
    );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">Interruption simulator</p>
        <p className="text-sm text-muted">Pick a sample app, start something (play the video, run the workout, send a payment), then fire interruptions. The timeline shows what the system did and how a well-behaved app reacted.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-center gap-4 border-b border-line bg-subtle p-4 sm:p-6 lg:border-r lg:border-b-0">
          {appPicker}
          {phone}
        </div>
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          {triggers}
          {audioPanel}
          {network}
          {timeline}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
            <span className="flex items-center gap-1">
              <Smartphone size={12} /> what the system did
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-ok" /> how the app reacted
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Trigger({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:bg-surface"
    >
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="min-w-0 leading-tight">{label}</span>
    </button>
  );
}

function RoundBtn({ color, label, onClick, children }: { color: string; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 text-[12px] text-white focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-white">
      <span className="grid size-14 place-items-center rounded-full text-white" style={{ background: color }}>
        {children}
      </span>
      {label}
    </button>
  );
}
