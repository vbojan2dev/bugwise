import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronRight, Clock, CreditCard, Crown, Globe, Leaf, Loader2, Lock, Moon, Play, RotateCcw, Smartphone, Tablet, Wind, X, Zap } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken subscription paywall (Stillwater, a meditation app on Android) for the
 * in-app purchases bug hunt. Bugs (don't spoil them!):
 *  1. Restore purchases only looks at purchases made on THIS device: on the tablet (same Google
 *     account) it spins and then does nothing at all, not even "No purchases found".
 *  2. Refunds are ignored: the app treats a refunded subscription as active until its old end date.
 *  3. The paywall always offers "Start 7-day free trial" when the user isn't Premium, even if the
 *     account already used its trial. The store sheet (the truth) charges immediately.
 *  4. After a successful purchase the app shows "Welcome to Premium" but keeps everything locked
 *     until the app is restarted (it only reads the entitlement on launch).
 *  5. Paywall prices are hard-coded in USD; a Serbian Play account is charged in RSD (see the store sheet).
 *  6. "Switch to Yearly" starts a second, separate subscription instead of replacing Monthly:
 *     both stay active and both are charged.
 *
 * Working on purpose: the store sheet shows the correct price and trial eligibility, the store refuses
 * to sell the same product twice, canceling keeps access until the end of the paid period, expiry
 * removes Premium, Restore works on the phone where the purchase was made.
 */

type Product = 'monthly' | 'yearly';
type Country = 'US' | 'RS';
type DeviceId = 'A' | 'B';

interface Sub {
  id: number;
  product: Product;
  status: 'active' | 'expired' | 'refunded';
  autoRenew: boolean;
  expiresAt: number; // day index
  inTrial: boolean;
  country: Country;
  device: DeviceId;
}
interface Tx {
  id: number;
  day: number;
  text: string;
  amount: string;
}
interface DeviceState {
  linked: boolean; // the app on this device knows about the purchase
  premium: boolean; // what the UI currently shows
}

const PERIOD: Record<Product, number> = { monthly: 30, yearly: 365 };
const TRIAL_DAYS = 7;
const PRICE: Record<Country, Record<Product, string>> = {
  US: { monthly: '$4.99', yearly: '$39.99' },
  RS: { monthly: 'RSD 599.00', yearly: 'RSD 4,799.00' },
};
const NAME: Record<Product, string> = { monthly: 'Monthly', yearly: 'Yearly' };
const PER: Record<Product, string> = { monthly: 'month', yearly: 'year' };
const TEAL = '#0f766e';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START = Date.UTC(2026, 9, 15);
function dateLabel(day: number, weekday = false) {
  const d = new Date(START + day * 86400000);
  const s = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  return weekday ? `${DAYS[d.getUTCDay()]}, ${s}` : s;
}

const SESSIONS = [
  { title: 'Morning calm', len: '5 min', icon: Leaf, premium: false },
  { title: 'Breathe in 60 seconds', len: '1 min', icon: Wind, premium: false },
  { title: 'Deep sleep story', len: '22 min', icon: Moon, premium: true },
  { title: 'Focus sounds', len: '45 min', icon: Zap, premium: true },
  { title: 'Anxiety SOS', len: '8 min', icon: Leaf, premium: true },
];

// BUG 2: a refunded subscription still counts until its old end date.
const counts = (s: Sub, now: number) => (s.status === 'active' || s.status === 'refunded') && now < s.expiresAt;

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string; icon?: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-medium text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BuggyPaywall() {
  const timers = useRef<number[]>([]);
  const ids = useRef(1);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const [now, setNow] = useState(0);
  const [country, setCountry] = useState<Country>('US');
  const [device, setDevice] = useState<DeviceId>('A');
  const [subs, setSubs] = useState<Sub[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [trialUsed, setTrialUsed] = useState(false);
  const [devices, setDevices] = useState<Record<DeviceId, DeviceState>>({ A: { linked: false, premium: false }, B: { linked: false, premium: false } });
  const [screen, setScreen] = useState<'home' | 'paywall'>('home');
  const [plan, setPlan] = useState<Product>('yearly');
  const [sheet, setSheet] = useState<{ product: Product; upgrade: boolean } | null>(null);
  const [paying, setPaying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [booting, setBooting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastId = useRef(0);

  const showToast = (msg: string) => {
    const id = ++toastId.current;
    setToast(msg);
    later(() => {
      if (toastId.current === id) setToast(null);
    }, 2600);
  };

  const entitled = (d: DeviceState, list: Sub[], day: number) => d.linked && list.some((s) => counts(s, day));
  const me = devices[device];
  const premium = me.premium;
  const myPlan: Product | null = premium ? (subs.some((s) => s.product === 'yearly' && counts(s, now)) ? 'yearly' : subs.some((s) => counts(s, now)) ? 'monthly' : null) : null;

  const addTx = (day: number, text: string, amount: string) => setTxs((t) => [{ id: ids.current++, day, text, amount }, ...t]);

  // ---------- Store side ----------
  const advance = (days: number) => {
    const target = now + days;
    const newTx: Tx[] = [];
    const next = subs.map((s) => {
      const c = { ...s };
      while (c.status === 'active' && c.expiresAt <= target) {
        if (c.autoRenew) {
          newTx.push({ id: ids.current++, day: c.expiresAt, text: c.inTrial ? `Trial ended, first charge (${NAME[c.product]})` : `Renewal (${NAME[c.product]})`, amount: PRICE[c.country][c.product] });
          c.inTrial = false;
          c.expiresAt += PERIOD[c.product];
        } else {
          c.status = 'expired';
        }
      }
      return c;
    });
    newTx.sort((a, b) => b.day - a.day);
    setSubs(next);
    setTxs((t) => [...newTx, ...t]);
    setNow(target);
    // The app re-checks entitlements when it comes back to the foreground.
    setDevices((ds) => ({ A: { ...ds.A, premium: entitled(ds.A, next, target) }, B: { ...ds.B, premium: entitled(ds.B, next, target) } }));
  };

  const cancelSub = (id: number) => {
    setSubs((list) => list.map((s) => (s.id === id ? { ...s, autoRenew: false } : s)));
    const s = subs.find((x) => x.id === id);
    if (s) addTx(now, `Canceled (${NAME[s.product]})`, '—');
  };

  const refundSub = (id: number) => {
    const s = subs.find((x) => x.id === id);
    if (!s) return;
    setSubs((list) => list.map((x) => (x.id === id ? { ...x, status: 'refunded', autoRenew: false } : x)));
    addTx(now, `Refund (${NAME[s.product]})`, '−' + PRICE[s.country][s.product]);
  };

  const subscribe = () => {
    if (!sheet || paying) return;
    const product = sheet.product;
    setPaying(true);
    later(() => {
      const trial = !trialUsed;
      const sub: Sub = { id: ids.current++, product, status: 'active', autoRenew: true, expiresAt: now + (trial ? TRIAL_DAYS : PERIOD[product]), inTrial: trial, country, device };
      setSubs((list) => [...list, sub]);
      addTx(now, trial ? `Free trial started (${NAME[product]})` : `${NAME[product]} subscription`, trial ? PRICE[country][product].replace(/[\d.,]+/, '0.00') : PRICE[country][product]);
      setTrialUsed(true);
      // BUG 4: the purchase is stored, but the UI flag is only refreshed on launch.
      setDevices((ds) => ({ ...ds, [device]: { ...ds[device], linked: true } }));
      setPaying(false);
      setSheet(null);
      setScreen('home');
      showToast('Purchase complete. Welcome to Premium!');
    }, 900);
  };

  // ---------- App side ----------
  const restart = () => {
    setBooting(true);
    setScreen('home');
    setSheet(null);
    later(() => {
      setDevices((ds) => ({ ...ds, [device]: { ...ds[device], premium: entitled(ds[device], subs, now) } }));
      setBooting(false);
    }, 800);
  };

  const restore = () => {
    if (restoring) return;
    setRestoring(true);
    later(() => {
      setRestoring(false);
      // BUG 1: only purchases made on this device are considered, and "nothing found" shows no message.
      const mine = subs.filter((s) => s.device === device);
      if (mine.length === 0) return;
      setDevices((ds) => {
        const d = { ...ds[device], linked: true };
        return { ...ds, [device]: { ...d, premium: entitled(d, subs, now) } };
      });
      setScreen('home');
      showToast('Purchases restored');
    }, 1200);
  };

  const switchDevice = (d: DeviceId) => {
    setDevice(d);
    setScreen('home');
    setSheet(null);
    setToast(null);
  };

  const openSheet = (product: Product, upgrade = false) => setSheet({ product, upgrade });

  // ---------- Screens ----------
  const home = (
    <div className="h-full overflow-y-auto px-4 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[20px] font-bold tracking-tight" style={{ color: TEAL }}>
          <Leaf size={20} /> Stillwater
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${premium ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e7ebee] text-[#4b5563]'}`}>{premium ? 'Premium' : 'Free'}</span>
      </div>
      <div className="mt-3 rounded-[20px] p-3.5 text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, #134e4a)` }}>
        {premium ? (
          <>
            <p className="flex items-center gap-1.5 text-[15px] font-semibold">
              <Crown size={16} /> Premium is active
            </p>
            <p className="mt-0.5 text-[12px] opacity-85">All sessions and sleep stories are unlocked.</p>
            <button type="button" onClick={() => setScreen('paywall')} className="mt-2.5 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-2 focus-visible:outline-white">
              Manage plan
            </button>
          </>
        ) : (
          <>
            <p className="text-[15px] font-semibold">Sleep better with Premium</p>
            <p className="mt-0.5 text-[12px] opacity-85">120+ sessions, sleep stories and focus sounds.</p>
            <button type="button" onClick={() => setScreen('paywall')} className="mt-2.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={{ color: TEAL }}>
              See plans
            </button>
          </>
        )}
      </div>
      <p className="mt-4 mb-1.5 text-[13px] font-semibold text-[#374151]">Today</p>
      <ul className="overflow-hidden rounded-2xl bg-white">
        {SESSIONS.map((s, i) => {
          const locked = s.premium && !premium;
          return (
            <li key={s.title} style={{ borderTop: i ? '1px solid #eef0f2' : undefined }}>
              <button
                type="button"
                onClick={() => (locked ? setScreen('paywall') : showToast(`Playing "${s.title}"`))}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0f766e]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6f4f1]" style={{ color: TEAL }}>
                  <s.icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{s.title}</span>
                  <span className="block text-[11.5px] text-[#6b7280]">{s.len}</span>
                </span>
                {locked ? <Lock size={16} className="text-[#9ca3af]" aria-label="Locked" /> : <Play size={16} style={{ color: TEAL }} aria-label="Play" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  // BUG 3: trial offer based on the local Premium flag, not on the account's trial eligibility.
  const offerTrial = !premium;
  const paywall = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pt-1">
        <button type="button" aria-label="Close" onClick={() => setScreen('home')} className="grid size-10 place-items-center rounded-full text-[#374151] focus-visible:outline-2 focus-visible:outline-[#0f766e]">
          <X size={20} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
        <p className="flex items-center gap-1.5 text-[22px] leading-tight font-bold tracking-tight">
          <Crown size={20} className="text-[#d97706]" /> Stillwater Premium
        </p>
        <ul className="mt-2 space-y-1 text-[13px] text-[#374151]">
          {['All 120+ guided sessions', 'Sleep stories and focus sounds', 'Offline downloads'].map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check size={14} style={{ color: TEAL }} /> {b}
            </li>
          ))}
        </ul>

        {premium ? (
          <div className="mt-4 rounded-2xl border border-[#d1d5db] bg-white p-3">
            <p className="text-[12px] text-[#6b7280]">Your plan</p>
            <p className="text-[16px] font-semibold">{myPlan ? NAME[myPlan] : 'Premium'}</p>
            {myPlan === 'monthly' ? (
              <button type="button" onClick={() => openSheet('yearly', true)} className="mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]" style={{ background: TEAL }}>
                <span>
                  Switch to Yearly
                  <span className="block text-[11.5px] font-normal opacity-85">$39.99 / year · save 33%</span>
                </span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <p className="mt-1 text-[12.5px] text-[#4b5563]">You're on our best-value plan. Thank you!</p>
            )}
          </div>
        ) : (
          <>
            <div role="radiogroup" aria-label="Plan" className="mt-4 space-y-2">
              {(['yearly', 'monthly'] as Product[]).map((p) => {
                const on = plan === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPlan(p)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 bg-white px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
                    style={{ borderColor: on ? TEAL : '#e5e7eb' }}
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full border-2" style={{ borderColor: on ? TEAL : '#9ca3af' }}>
                      {on && <span className="size-2.5 rounded-full" style={{ background: TEAL }} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold">{NAME[p]}</span>
                      {/* BUG 5: hard-coded USD prices */}
                      <span className="block text-[12px] text-[#4b5563]">{p === 'yearly' ? '$39.99 / year ($3.33 / month)' : '$4.99 / month'}</span>
                    </span>
                    {p === 'yearly' && <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10.5px] font-semibold text-[#92400e]">Save 33%</span>}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => openSheet(plan)} className="mt-4 h-11 w-full rounded-full text-[14.5px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]" style={{ background: TEAL }}>
              {offerTrial ? 'Start 7-day free trial' : 'Subscribe'}
            </button>
            <p className="mt-1.5 text-center text-[11px] leading-snug text-[#6b7280]">
              {offerTrial ? `Free for 7 days, then ${plan === 'yearly' ? '$39.99/year' : '$4.99/month'}. ` : ''}Cancel anytime in Google Play.
            </p>
          </>
        )}
        <button type="button" onClick={restore} disabled={restoring} className="mx-auto mt-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#0f766e]" style={{ color: TEAL }}>
          {restoring && <Loader2 size={13} className="animate-spin" />} Restore purchases
        </button>
      </div>
    </div>
  );

  // ---------- Google Play purchase sheet (the source of truth) ----------
  let sheetUi: ReactNode = null;
  if (sheet) {
    const p = sheet.product;
    const owned = subs.some((s) => s.product === p && s.status === 'active' && now < s.expiresAt);
    const trial = !trialUsed;
    sheetUi = (
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40">
        <button type="button" aria-label="Dismiss" className="min-h-0 flex-1 cursor-default" onClick={() => !paying && setSheet(null)} />
        <div role="dialog" aria-label="Google Play" className="rounded-t-[26px] bg-white px-5 pt-3 pb-7 text-[#1f1f1f]">
          <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-[#c4c7c5]" />
          <p className="text-[12px] font-medium text-[#444746]">Google Play</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: TEAL }}>
              <Leaf size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-medium">Stillwater Premium ({NAME[p]})</p>
              <p className="text-[12px] text-[#444746]">Stillwater Labs</p>
            </div>
          </div>
          {owned ? (
            <>
              <p className="mt-4 text-[14px]">You already own this item.</p>
              <button type="button" onClick={() => setSheet(null)} className="mt-4 h-10 w-full rounded-full bg-[#0b57d0] text-[14px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0]">
                OK
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 space-y-1.5 border-y border-[#e3e3e3] py-3 text-[13px]">
                {trial ? (
                  <>
                    <div className="flex justify-between gap-2">
                      <span>Free trial for 7 days</span>
                      <span className="font-medium">Starting today</span>
                    </div>
                    <div className="flex justify-between gap-2 text-[#444746]">
                      <span>Then {PRICE[country][p]}/{PER[p]}</span>
                      <span>from {dateLabel(now + TRIAL_DAYS)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between gap-2">
                    <span>
                      {PRICE[country][p]}/{PER[p]}
                    </span>
                    <span className="font-medium">Billed today</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 text-[#444746]">
                  <CreditCard size={15} /> Test card, always approves
                </div>
              </div>
              <p className="mt-2 text-[10.5px] leading-snug text-[#444746]">
                Recurring {PER[p]}ly charge. Cancel anytime in Google Play › Payments &amp; subscriptions.
              </p>
              <button type="button" onClick={subscribe} disabled={paying} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#0b57d0] text-[14px] font-medium text-white disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0]">
                {paying && <Loader2 size={15} className="animate-spin" />} {paying ? 'Processing…' : 'Subscribe'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const app = (
    <div className="relative h-full bg-[#f6f8f8] text-[#111827]" style={{ colorScheme: 'light' }}>
      {booting ? (
        <div className="grid h-full place-items-center" style={{ color: TEAL }}>
          <Leaf size={36} />
        </div>
      ) : screen === 'home' ? (
        home
      ) : (
        paywall
      )}
      {sheetUi}
      {toast && (
        <div role="status" className="absolute inset-x-4 bottom-8 z-30 rounded-xl bg-[#303030] px-3 py-2.5 text-[12.5px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );

  const statusOf = (s: Sub) => {
    if (s.status === 'refunded') return 'Refunded';
    if (s.status === 'expired' || now >= s.expiresAt) return 'Expired';
    if (!s.autoRenew) return `Canceled · access until ${dateLabel(s.expiresAt)}`;
    if (s.inTrial) return `Free trial · first charge ${dateLabel(s.expiresAt)}`;
    return `Active · renews ${dateLabel(s.expiresAt)}`;
  };

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290} os="android">
        {app}
      </PhoneFrame>

      <div className="w-full space-y-3 rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <Seg
          label="Same Google account, signed in on"
          value={device}
          onChange={switchDevice}
          options={[
            { v: 'A', label: 'Phone', icon: <Smartphone size={13} /> },
            { v: 'B', label: 'Tablet (new install)', icon: <Tablet size={13} /> },
          ]}
        />
        <Seg
          label="Play account country (license tester)"
          value={country}
          onChange={setCountry}
          options={[
            { v: 'US', label: 'United States', icon: <Globe size={13} /> },
            { v: 'RS', label: 'Serbia', icon: <Globe size={13} /> },
          ]}
        />
      </div>

      <div className="w-full space-y-2 rounded-2xl border border-line bg-surface p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
          <Clock size={13} /> Test clock
        </p>
        <p className="text-sm font-semibold text-fg">{dateLabel(now, true)}</p>
        <div className="flex gap-1.5">
          {[
            { d: 1, l: '+1 day' },
            { d: 7, l: '+1 week' },
            { d: 30, l: '+1 month' },
          ].map((b) => (
            <button key={b.d} type="button" onClick={() => advance(b.d)} className="flex-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-fg hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand">
              {b.l}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-faint">In real license testing, renewals are sped up (a month takes minutes). Here you jump instantly.</p>
      </div>

      <div className="w-full space-y-2 rounded-2xl border border-line bg-surface p-3">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Google Play › Subscriptions</p>
        {subs.length === 0 ? (
          <p className="text-xs text-muted">No subscriptions yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {subs.map((s) => {
              const live = s.status === 'active' && now < s.expiresAt;
              return (
                <li key={s.id} className="rounded-lg bg-subtle px-2.5 py-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg">Stillwater {NAME[s.product]}</span>
                      <span className="block text-muted">{statusOf(s)}</span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {live && s.autoRenew && (
                        <button type="button" onClick={() => cancelSub(s.id)} className="rounded-md border border-line bg-surface px-2 py-1 font-medium text-fg hover:bg-bg">
                          Cancel
                        </button>
                      )}
                      {live && !s.inTrial && (
                        <button type="button" onClick={() => refundSub(s.id)} className="rounded-md border border-line bg-surface px-2 py-1 font-medium text-danger hover:bg-bg">
                          Refund
                        </button>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="pt-1 text-xs font-semibold tracking-wide text-faint uppercase">Order history</p>
        {txs.length === 0 ? (
          <p className="text-xs text-muted">No charges yet.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {txs.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 border-b border-line pb-1 last:border-0">
                <span className="min-w-0 text-muted">
                  <span className="text-fg">{t.text}</span> · {dateLabel(t.day)}
                </span>
                <span className="shrink-0 font-medium text-fg tabular-nums">{t.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <p className="mt-1">
          Premium unlocks right after purchase and works on every device with the same Google account. New subscribers get <strong className="text-fg">one</strong> 7-day free trial. Prices come from Google Play in the user's currency. Switching plans replaces the old plan. Refunds and expiry remove Premium.
        </p>
      </div>
    </div>
  );
}
