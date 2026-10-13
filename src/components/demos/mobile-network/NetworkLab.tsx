import { useEffect, useRef, useState } from 'react';
import { CloudOff, FastForward, Play, RefreshCw, Signal, Star, Wifi, WifiOff, Waves, Clock } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * "Network lab": pick a network profile and watch a food delivery app load its feed.
 * Everything is simulated (no real network). The whole run is planned up front from the
 * profile + resilience settings, then a playhead replays it at 2x speed.
 */

type ProfileId = 'wifi' | '4g' | '3g' | 'edge' | 'lossy' | 'offline';
interface Profile {
  label: string;
  rtt: number; // round-trip time in ms
  kbps: number; // bandwidth
  loss: number; // packet loss %
  icon: typeof Wifi;
  note: string;
}

const profiles: Record<ProfileId, Profile> = {
  wifi: { label: 'Wi-Fi', rtt: 20, kbps: 50000, loss: 0, icon: Wifi, note: 'Fast and stable. The network most testing happens on, and the one real users have least often.' },
  '4g': { label: '4G', rtt: 60, kbps: 12000, loss: 0, icon: Signal, note: 'A good mobile connection. Slightly more latency than Wi-Fi, but still feels instant.' },
  '3g': { label: '3G', rtt: 300, kbps: 750, loss: 0, icon: Signal, note: 'High latency and low bandwidth. Every round trip costs a third of a second.' },
  edge: { label: 'Edge', rtt: 850, kbps: 240, loss: 0, icon: Signal, note: 'Very slow (2G). Common in rural areas, basements and when a network is overloaded.' },
  lossy: { label: 'Lossy', rtt: 150, kbps: 2000, loss: 30, icon: Waves, note: 'Decent speed, but 30% of packets get lost: a crowded festival, a moving train, weak Wi-Fi.' },
  offline: { label: 'Offline', rtt: 0, kbps: 0, loss: 100, icon: WifiOff, note: 'No connection at all: airplane mode, a tunnel, or an elevator.' },
};
const order: ProfileId[] = ['wifi', '4g', '3g', 'edge', 'lossy', 'offline'];

const FEED_KB = 120;
const SPEED = 2; // playback speed
const HANG_LIMIT = 30000; // stop the "no timeout" simulation here
type TimeoutOpt = 0 | 5000 | 15000;

interface Seg {
  kind: 'connect' | 'download' | 'hang';
  start: number;
  end: number;
}
interface Attempt {
  n: number;
  start: number;
  end: number;
  segs: Seg[];
  result: 'ok' | 'timeout' | 'offline' | 'hang';
}
interface Ev {
  t: number;
  text: string;
  tone: 'info' | 'ok' | 'err' | 'warn';
}
interface Plan {
  attempts: Attempt[];
  events: Ev[];
  end: number;
  outcome: 'ok' | 'error' | 'hang';
  lastError: 'timeout' | 'offline' | null;
  cache: boolean;
}

function plan(p: ProfileId, timeout: TimeoutOpt, retry: boolean, cache: boolean): Plan {
  const prof = profiles[p];
  const events: Ev[] = [{ t: 0, text: 'User opens the app: GET /api/restaurants', tone: 'info' }];
  if (cache) events.push({ t: 0, text: 'Cache: showing restaurants saved 2 h ago while loading', tone: 'info' });
  const attempts: Attempt[] = [];
  const maxAttempts = retry ? 3 : 1;
  let t = 0;
  let lastError: Plan['lastError'] = null;

  for (let n = 1; n <= maxAttempts; n++) {
    const start = t;
    if (n > 1) events.push({ t: start, text: `Retry: GET /api/restaurants (attempt ${n})`, tone: 'info' });
    let a: Attempt;
    if (p === 'offline') {
      a = { n, start, end: start + 20, segs: [], result: 'offline' };
      events.push({ t: a.end, text: 'Failed instantly: no internet connection (error -1009)', tone: 'err' });
    } else {
      const connect = prof.rtt * 3; // DNS + TCP + TLS handshakes, roughly
      const lost = p === 'lossy' && n === 1;
      const download = (FEED_KB * 8 * 1000) / prof.kbps + (p === 'lossy' ? 900 : 0); // lossy: retransmissions
      const natural = lost ? Infinity : connect + download;
      if (lost) events.push({ t: start + connect, text: 'Packets lost on the way. The app is waiting for a reply…', tone: 'warn' });
      else events.push({ t: start + connect, text: `Connected after 3 round trips (${connect} ms of latency)`, tone: 'info' });

      if (timeout && natural > timeout) {
        const end = start + timeout;
        const segs: Seg[] = [{ kind: 'connect', start, end: Math.min(start + connect, end) }];
        if (start + connect < end) segs.push({ kind: lost ? 'hang' : 'download', start: start + connect, end });
        a = { n, start, end, segs, result: 'timeout' };
        events.push({ t: end, text: `Timed out after ${timeout / 1000} s`, tone: 'err' });
      } else if (natural === Infinity) {
        a = {
          n,
          start,
          end: HANG_LIMIT,
          segs: [
            { kind: 'connect', start, end: start + connect },
            { kind: 'hang', start: start + connect, end: HANG_LIMIT },
          ],
          result: 'hang',
        };
      } else {
        const end = Math.round(start + natural);
        a = {
          n,
          start,
          end,
          segs: [
            { kind: 'connect', start, end: start + connect },
            { kind: 'download', start: start + connect, end },
          ],
          result: 'ok',
        };
        events.push({ t: end, text: `200 OK · ${FEED_KB} KB downloaded at ${prof.kbps >= 1000 ? `${prof.kbps / 1000} Mbps` : `${prof.kbps} kbps`}`, tone: 'ok' });
      }
    }
    attempts.push(a);
    if (a.result === 'ok' || a.result === 'hang') break;
    lastError = a.result === 'offline' ? 'offline' : 'timeout';
    if (n < maxAttempts) {
      const wait = 1000 * 2 ** (n - 1);
      events.push({ t: a.end, text: `Waiting ${wait / 1000} s before retrying (backoff)`, tone: 'warn' });
      t = a.end + wait;
    } else t = a.end;
  }

  const last = attempts[attempts.length - 1];
  const outcome: Plan['outcome'] = last.result === 'ok' ? 'ok' : last.result === 'hang' ? 'hang' : 'error';
  if (outcome === 'hang') {
    events.push({
      t: HANG_LIMIT,
      text: retry ? 'Still spinning after 30 s. Retry never kicks in: without a timeout the app never learns the request failed.' : 'Still spinning after 30 s. No timeout, so the user waits forever.',
      tone: 'err',
    });
  }
  if (outcome === 'error') events.push({ t: last.end, text: cache ? 'Gave up. Keeping the saved restaurants on screen with an offline banner.' : 'Gave up. Showing an error screen with "Try again".', tone: 'err' });
  return { attempts, events, end: outcome === 'hang' ? HANG_LIMIT : last.end, outcome, lastError, cache };
}

const restaurants = [
  { name: 'Nonna’s Pizza', meta: 'Italian · 1.2 km', eta: '20–30 min', rating: 4.7, hue: '#f97316' },
  { name: 'Sushi Go', meta: 'Japanese · 2.0 km', eta: '25–35 min', rating: 4.8, hue: '#ef4444' },
  { name: 'Green Bowl', meta: 'Salads · 0.8 km', eta: '15–25 min', rating: 4.5, hue: '#22c55e' },
  { name: 'Taco Loco', meta: 'Mexican · 1.6 km', eta: '20–30 min', rating: 4.6, hue: '#eab308' },
];
const cachedRestaurants = [
  { ...restaurants[0], eta: '30–40 min' },
  { ...restaurants[1], eta: '35–45 min' },
  { ...restaurants[2], eta: '20–30 min' },
];

const fmt = (ms: number) => `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)} s`;
const axisSteps = [1000, 2000, 5000, 10000, 20000, 30000, 40000];

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-subtle px-3 py-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </label>
  );
}

export default function NetworkLab() {
  const [profile, setProfile] = useState<ProfileId>('3g');
  const [timeout, setTimeoutOpt] = useState<TimeoutOpt>(0);
  const [retry, setRetry] = useState(false);
  const [cache, setCache] = useState(false);
  const [run, setRun] = useState<{ plan: Plan; id: number } | null>(null);
  const [now, setNow] = useState(0);
  const runId = useRef(0);

  const start = (p = profile, to = timeout, r = retry, c = cache) => {
    runId.current += 1;
    setRun({ plan: plan(p, to, r, c), id: runId.current });
    setNow(0);
  };

  // Auto-start once on mount.
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Playback clock for the current run.
  useEffect(() => {
    if (!run) return;
    const t0 = performance.now();
    const end = run.plan.end;
    const iv = window.setInterval(() => {
      const t = Math.min((performance.now() - t0) * SPEED, end);
      setNow((prev) => (prev >= end ? prev : t));
      if (t >= end) window.clearInterval(iv);
    }, 50);
    return () => window.clearInterval(iv);
  }, [run]);

  const p = run?.plan;
  const done = !!p && now >= p.end;
  const axis = axisSteps.find((s) => s >= (p?.end ?? 0)) ?? 40000;

  // What the phone shows right now
  let screen: 'loading' | 'fresh' | 'cached' | 'error' = 'loading';
  if (p) {
    if (done && p.outcome === 'ok') screen = 'fresh';
    else if (p.cache) screen = 'cached';
    else if (done && p.outcome === 'error') screen = 'error';
  }
  const stillLoading = !done || p?.outcome === 'hang';
  const contentAt = p ? (p.cache ? 0 : p.outcome === 'ok' ? p.end : null) : null;
  const requests = p ? p.attempts.filter((a) => a.start <= now).length : 0;

  const pick = (id: ProfileId) => {
    setProfile(id);
    start(id);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Network lab</p>
        <p className="text-sm text-muted">Pick a network, then switch the app’s resilience features on and off. Each change reloads the feed.</p>
      </div>

      <div className="space-y-4 border-b border-line p-4 sm:p-5">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Network profile</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" role="radiogroup" aria-label="Network profile">
            {order.map((id) => {
              const pr = profiles[id];
              const active = id === profile;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pick(id)}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:outline-none ${
                    active ? 'border-transparent bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'
                  }`}
                >
                  <pr.icon size={16} aria-hidden />
                  {pr.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            {profile !== 'offline' && (
              <span className="mr-1 font-mono text-fg">
                RTT {profiles[profile].rtt} ms · {profiles[profile].kbps >= 1000 ? `${profiles[profile].kbps / 1000} Mbps` : `${profiles[profile].kbps} kbps`}
                {profiles[profile].loss ? ` · ${profiles[profile].loss}% loss` : ''} ·
              </span>
            )}
            {profiles[profile].note}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-xl bg-subtle px-3 py-2.5">
            <p className="text-sm font-semibold text-fg">Timeout</p>
            <p className="mb-2 text-xs text-muted">Give up on a request after…</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1 text-xs font-medium" role="radiogroup" aria-label="Timeout">
              {([0, 5000, 15000] as TimeoutOpt[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={timeout === v}
                  onClick={() => {
                    setTimeoutOpt(v);
                    start(profile, v);
                  }}
                  className={`rounded-md py-1 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:outline-none ${timeout === v ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg'}`}
                >
                  {v === 0 ? 'Never' : `${v / 1000} s`}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Retry with backoff"
            desc="After a failure, try again after 1 s, then 2 s."
            checked={retry}
            onChange={(v) => {
              setRetry(v);
              start(profile, timeout, v);
            }}
          />
          <Toggle
            label="Cache last result"
            desc="Show the restaurants saved on the last visit while loading."
            checked={cache}
            onChange={(v) => {
              setCache(v);
              start(profile, timeout, retry, v);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex justify-center border-b border-line p-5 lg:border-r lg:border-b-0" style={{ background: '#f2f2f7' }}>
          <PhoneFrame width={250}>
            <div className="flex h-full flex-col bg-white text-black">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div>
                  <p className="text-[11px] font-medium text-[#8e8e93]">Deliver to · Home</p>
                  <p className="text-[20px] leading-tight font-bold tracking-tight">Near you</p>
                </div>
                <button
                  type="button"
                  onClick={() => start()}
                  aria-label="Refresh"
                  className="grid size-8 place-items-center rounded-full bg-[#f2f2f7] text-[#ff5a1f] focus-visible:ring-2 focus-visible:ring-[#ff5a1f] focus-visible:outline-none"
                >
                  <RefreshCw size={15} className={stillLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {screen === 'cached' && (
                <div className={`mx-3 mb-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10.5px] font-medium ${done ? 'bg-[#fff4e5] text-[#8a4b00]' : 'bg-[#f2f2f7] text-[#3c3c43]'}`}>
                  {done ? <CloudOff size={12} /> : <Clock size={12} />}
                  {done ? (p?.lastError === 'offline' ? 'You’re offline. Showing results from 2 h ago.' : 'Couldn’t refresh. Showing results from 2 h ago.') : 'Saved 2 h ago · updating…'}
                </div>
              )}
              {screen === 'fresh' && <div className="mx-3 mb-2 rounded-lg bg-[#e8f8ee] px-2.5 py-1.5 text-[10.5px] font-medium text-[#13652e]">Updated just now</div>}

              <div className="min-h-0 flex-1 overflow-hidden px-3">
                {screen === 'loading' && (
                  <div className="space-y-2.5" aria-label="Loading">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-[#f2f2f7]">
                        <div className="h-16 bg-[#e5e5ea]" />
                        <div className="space-y-1.5 p-2.5">
                          <div className="h-2.5 w-2/3 rounded bg-[#e5e5ea]" />
                          <div className="h-2 w-1/3 rounded bg-[#e5e5ea]" />
                        </div>
                      </div>
                    ))}
                    {done && p?.outcome === 'hang' && <p className="pt-1 text-center text-[10.5px] text-[#8e8e93]">Still loading…</p>}
                  </div>
                )}
                {(screen === 'fresh' || screen === 'cached') && (
                  <div className="space-y-2.5">
                    {(screen === 'fresh' ? restaurants : cachedRestaurants).map((r) => (
                      <div key={r.name} className={`overflow-hidden rounded-xl border border-[#e5e5ea] ${screen === 'cached' && done ? 'opacity-80' : ''}`}>
                        <div className="h-14" style={{ background: `linear-gradient(135deg, ${r.hue}, ${r.hue}99)` }} />
                        <div className="flex items-start justify-between gap-2 p-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold">{r.name}</p>
                            <p className="truncate text-[10.5px] text-[#8e8e93]">
                              {r.meta} · {r.eta}
                            </p>
                          </div>
                          <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold">
                            <Star size={11} className="fill-[#ff9f0a] text-[#ff9f0a]" />
                            {r.rating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {screen === 'error' && (
                  <div className="flex h-full flex-col items-center justify-center px-3 pb-10 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-[#f2f2f7] text-[#8e8e93]">
                      {p?.lastError === 'offline' ? <WifiOff size={22} /> : <Clock size={22} />}
                    </span>
                    <p className="mt-3 text-[15px] font-semibold">{p?.lastError === 'offline' ? 'You’re offline' : 'This is taking too long'}</p>
                    <p className="mt-1 text-[11.5px] text-[#6b6b70]">Check your connection and try again. Your basket is saved.</p>
                    <button
                      type="button"
                      onClick={() => start()}
                      className="mt-4 rounded-full bg-[#ff5a1f] px-5 py-2 text-[13px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#ff5a1f] focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-subtle p-2.5">
              <p className="text-[11px] text-muted">Content visible</p>
              <p className="font-mono text-sm font-semibold text-fg">{contentAt === null ? '—' : contentAt === 0 ? '0.00 s*' : done ? fmt(contentAt) : '…'}</p>
            </div>
            <div className="rounded-xl bg-subtle p-2.5">
              <p className="text-[11px] text-muted">Requests sent</p>
              <p className="font-mono text-sm font-semibold text-fg">{requests}</p>
            </div>
            <div className="rounded-xl bg-subtle p-2.5">
              <p className="text-[11px] text-muted">Result</p>
              <p className={`text-sm font-semibold ${!done ? 'text-muted' : p?.outcome === 'ok' ? 'text-ok' : 'text-danger'}`}>
                {!done ? 'Loading' : p?.outcome === 'ok' ? 'Loaded' : p?.outcome === 'hang' ? 'Stuck' : 'Error'}
              </p>
            </div>
          </div>
          {p?.cache && <p className="-mt-2 text-[11px] text-faint">* Saved (possibly outdated) content from the cache.</p>}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Request timeline</p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => start()}
                  className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:outline-none"
                >
                  <Play size={12} /> Replay
                </button>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => p && setNow(p.end)}
                  className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:outline-none disabled:opacity-40"
                >
                  <FastForward size={12} /> Skip
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="space-y-2">
                {p?.attempts.map((a) => (
                  <div key={a.n} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[11px] text-muted">Attempt {a.n}</span>
                    <div className="relative h-4 min-w-0 flex-1 overflow-hidden rounded bg-subtle">
                      {a.start <= now &&
                        (a.result === 'offline' ? (
                          <span className="absolute inset-y-0 w-1 rounded bg-[#ef4444]" style={{ left: `${(a.start / axis) * 100}%` }} />
                        ) : (
                          a.segs.map((s, i) => {
                            const e = Math.min(s.end, now);
                            if (e <= s.start) return null;
                            return (
                              <span
                                key={i}
                                className="absolute inset-y-0"
                                style={{
                                  left: `${(s.start / axis) * 100}%`,
                                  width: `max(2px, ${((e - s.start) / axis) * 100}%)`,
                                  background:
                                    s.kind === 'connect' ? '#f59e0b' : s.kind === 'download' ? '#10b981' : 'repeating-linear-gradient(45deg, #9ca3af 0 4px, #d1d5db 4px 8px)',
                                }}
                              />
                            );
                          })
                        ))}
                      {a.result === 'timeout' && now >= a.end && <span className="absolute inset-y-0 w-1 bg-[#ef4444]" style={{ left: `calc(${(a.end / axis) * 100}% - 2px)` }} />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between pl-[4.5rem] font-mono text-[10px] text-faint">
                <span>0 s</span>
                <span>{axis / 2000} s</span>
                <span>{axis / 1000} s</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-[#f59e0b]" /> Latency (handshakes)
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-[#10b981]" /> Download
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #9ca3af 0 3px, #d1d5db 3px 6px)' }} /> Waiting, nothing arrives
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-1 rounded-sm bg-[#ef4444]" /> Failed / timed out
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
            <p className="flex justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
              <span>Event log</span>
              <span className="font-mono normal-case">{fmt(now)}</span>
            </p>
            <ul className="max-h-48 min-h-[6rem] space-y-1 overflow-y-auto px-3 py-2" aria-live="polite">
              {p?.events
                .filter((e) => e.t <= now)
                .map((e, i) => (
                  <li key={`${run?.id}-${i}`} className="flex gap-2">
                    <span className="shrink-0 text-white/40">{fmt(e.t)}</span>
                    <span className={`min-w-0 ${e.tone === 'ok' ? 'text-[#34d399]' : e.tone === 'err' ? 'text-[#f87171]' : e.tone === 'warn' ? 'text-[#fbbf24]' : ''}`}>{e.text}</span>
                  </li>
                ))}
            </ul>
          </div>
          <p className="text-[11px] text-faint">Simulated, replayed at {SPEED}× speed. Times are typical, not exact.</p>
        </div>
      </div>
    </div>
  );
}
