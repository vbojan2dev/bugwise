import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Copy, Home, Lock, Menu, RotateCcw, RotateCw, Share, Star, Zap, CheckCircle2, X } from 'lucide-react';
import { ChromeBar, FirefoxBar } from './BrowserComparator';

/*
 * Cross-browser bug hunt: a dark running-shoe checkout. Bugs (don't spoil them for learners!):
 *  1. Safari iOS 15: "Choose date" calls input.showPicker(), which iOS 15 doesn't have -> TypeError, no picker.
 *  2. Safari iOS: the bottom bar is positioned with 100vh, so the iOS toolbar covers "Place order".
 *  3. Firefox: "Express pay" uses the Payment Request API without a feature check -> ReferenceError.
 *  4. Samsung Internet 12 (Chromium 79): flexbox `gap` isn't supported -> sections, fields and cards stick together.
 *  5. Autofill: the site forces white text, Chromium (blue) and WebKit (yellow) autofill backgrounds make it unreadable.
 *  6. Firefox: naive user-agent check (/Chrome|Safari/) shows "Your browser is not supported".
 */

type BrowserId = 'chrome' | 'safari' | 'firefox' | 'samsung';
interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error';
  text: string;
}

const browsers: { id: BrowserId; name: string; sub: string; ua: string }[] = [
  {
    id: 'chrome',
    name: 'Chrome',
    sub: 'Windows desktop',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  },
  {
    id: 'safari',
    name: 'Safari',
    sub: 'iPhone, iOS 15.8',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'firefox',
    name: 'Firefox',
    sub: 'Windows desktop',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
  },
  {
    id: 'samsung',
    name: 'Samsung Internet 12',
    sub: 'Galaxy S10, Android 10',
    ua: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/12.1 Chrome/79.0.3945.136 Mobile Safari/537.36',
  },
];

const dates = ['Mon, Oct 19', 'Tue, Oct 20', 'Wed, Oct 21', 'Thu, Oct 22'];
const saved = { name: 'Marko Ilić', email: 'marko@example.com', address: '12 Harbour Street, Split' };
const PAGE_URL = 'nightrun.example.com/checkout';

function initialLog(b: BrowserId): Omit<LogEntry, 'id'>[] {
  const ua = browsers.find((x) => x.id === b)!.ua;
  const base: Omit<LogEntry, 'id'>[] = [{ level: 'info', text: `Navigated to https://${PAGE_URL}` }];
  if (!/Chrome|Safari/.test(ua)) base.push({ level: 'warn', text: '[compat] Unsupported browser detected, showing banner' });
  return base;
}

export function BuggyCrossBrowserCheckout() {
  const [browser, setBrowser] = useState<BrowserId>('chrome');
  const [session, setSession] = useState(0);
  const [autofillTick, setAutofillTick] = useState(0);
  const nextId = useRef(1);
  const [log, setLog] = useState<LogEntry[]>(() => initialLog('chrome').map((e) => ({ ...e, id: nextId.current++ })));

  const reload = (b: BrowserId) => {
    setBrowser(b);
    setSession((s) => s + 1);
    setAutofillTick(0);
    setLog(initialLog(b).map((e) => ({ ...e, id: nextId.current++ })));
  };
  const addLog = (level: LogEntry['level'], text: string) => setLog((l) => [...l, { id: nextId.current++, level, text }].slice(-6));

  const info = browsers.find((x) => x.id === browser)!;
  const page = <CheckoutPage key={`${browser}-${session}`} browser={browser} autofillTick={autofillTick} onLog={addLog} onRestart={() => reload(browser)} />;

  return (
    <div className="flex w-full max-w-[400px] min-w-0 flex-col items-center gap-3">
      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Open the page in…</p>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Browser">
          {browsers.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={browser === b.id}
              onClick={() => reload(b.id)}
              className={`min-w-0 rounded-xl border px-2.5 py-1.5 text-left transition-colors ${browser === b.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'}`}
            >
              <span className={`block truncate text-sm font-semibold ${browser === b.id ? 'text-brand' : ''}`}>{b.name}</span>
              <span className="block truncate text-[11px] text-muted">{b.sub}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setAutofillTick((t) => t + 1)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-fg">
            Autofill saved address
          </button>
          <button type="button" onClick={() => reload(browser)} className="ml-auto flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} aria-hidden="true" /> Reload page
          </button>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-snug break-all text-faint">
          <span className="font-sans font-semibold">User agent:</span> {info.ua}
        </p>
      </div>

      {browser === 'chrome' || browser === 'firefox' ? (
        <div className="w-full overflow-hidden rounded-xl border border-line-strong shadow-[0_16px_32px_-16px_rgba(16,18,35,.3)]">
          {browser === 'chrome' ? <ChromeBar url={PAGE_URL} title="Checkout · NightRun" /> : <FirefoxBar url={PAGE_URL} title="Checkout · NightRun" />}
          <div className="relative h-[520px]">{page}</div>
        </div>
      ) : (
        <PhoneShell browser={browser}>{page}</PhoneShell>
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Console</p>
        <ul className="min-h-[4.5rem] space-y-1 px-3 py-2">
          {log.map((e) => (
            <li key={e.id} className={`break-words ${e.level === 'error' ? 'text-[#fca5a5]' : e.level === 'warn' ? 'text-[#fcd34d]' : 'text-white/45'}`}>
              {e.level === 'error' ? '✖ ' : e.level === 'warn' ? '⚠ ' : '› '}
              {e.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PhoneShell({ browser, children }: { browser: 'safari' | 'samsung'; children: ReactNode }) {
  return (
    <div className="rounded-[40px] bg-[#0c0d12] p-[9px] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]" style={{ width: 300 }}>
      <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[32px] bg-[#0b0b0f]">
        <div className="flex h-9 shrink-0 items-center justify-between bg-[#0b0b0f] px-6 text-[12px] font-semibold text-white">
          <span>9:41</span>
          {browser === 'safari' ? <span className="h-[22px] w-[80px] rounded-full bg-black" /> : <span className="size-2.5 rounded-full bg-black ring-1 ring-white/10" />}
          <span className="h-[9px] w-[18px] rounded-[3px] border border-white p-[1px]">
            <span className="block h-full w-3/4 rounded-[1px] bg-white" />
          </span>
        </div>
        {browser === 'samsung' && (
          <div className="flex h-11 shrink-0 items-center gap-2 bg-white px-3 text-[#3c4043]" aria-hidden="true">
            <Home size={16} className="shrink-0" />
            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[#eef0f3] px-3 py-1.5 text-[12px]">
              <Lock size={10} className="shrink-0" />
              <span className="truncate">nightrun.example.com</span>
            </span>
            <RotateCw size={14} className="shrink-0" />
          </div>
        )}
        <div className="relative min-h-0 flex-1">
          {children}
          {browser === 'safari' && (
            // iOS 15 Safari bottom toolbar: overlays the page
            <div className="absolute inset-x-0 bottom-0 z-30 h-[78px] border-t border-black/10 bg-[#f2f2f7]/95 px-3 pt-2 text-[#007aff] backdrop-blur" aria-hidden="true">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] text-[#1c1c1e] shadow-sm">
                <span className="text-[12px] font-semibold">AA</span>
                <span className="flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                  <Lock size={10} className="shrink-0" /> nightrun.example.com
                </span>
                <RotateCw size={13} className="shrink-0" />
              </div>
              <div className="mt-2 flex justify-between px-2">
                <ChevronLeft size={20} />
                <ChevronRight size={20} className="opacity-40" />
                <Share size={18} />
                <BookOpen size={18} />
                <Copy size={18} />
              </div>
            </div>
          )}
        </div>
        {browser === 'samsung' && (
          <div className="flex h-11 shrink-0 items-center justify-around bg-white text-[#3c4043]" aria-hidden="true">
            <ChevronLeft size={20} />
            <ChevronRight size={20} className="opacity-40" />
            <Home size={18} />
            <Star size={18} />
            <Copy size={17} />
            <Menu size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutPage({
  browser,
  autofillTick,
  onLog,
  onRestart,
}: {
  browser: BrowserId;
  autofillTick: number;
  onLog: (level: LogEntry['level'], text: string) => void;
  onRestart: () => void;
}) {
  const ua = browsers.find((x) => x.id === browser)!.ua;
  const [fields, setFields] = useState({ name: '', email: '', address: '' });
  const [filled, setFilled] = useState({ name: false, email: false, address: false });
  const [date, setDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');
  const [banner, setBanner] = useState(() => !/Chrome|Safari/.test(ua)); // BUG 6: naive UA sniffing
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (autofillTick === 0) return;
    setFields({ ...saved });
    setFilled({ name: true, email: true, address: true });
  }, [autofillTick]);

  const noGap = browser === 'samsung'; // BUG 4: flex gap unsupported in Chromium 79
  const gap = (px: number): CSSProperties => ({ display: 'flex', flexDirection: 'column', gap: noGap ? 0 : px });
  const total = 129 + (shipping === 'express' ? 9 : 0);

  // BUG 5: forced white text + browser autofill background
  const autofillStyle: CSSProperties =
    browser === 'firefox'
      ? { filter: 'grayscale(21%) brightness(88%) contrast(161%) invert(10%) sepia(40%) saturate(206%)' }
      : browser === 'safari'
        ? { background: '#fbf3b5', borderColor: '#e8dc8c' }
        : { background: '#e8f0fe', borderColor: '#c6d4f2' };

  const openPicker = () => {
    if (browser === 'safari') {
      // BUG 1: HTMLInputElement.showPicker() only exists from Safari 16
      onLog('error', "TypeError: dateInput.showPicker is not a function. (In 'dateInput.showPicker()', 'dateInput.showPicker' is undefined)");
      return;
    }
    setPickerOpen((o) => !o);
  };

  const expressPay = () => {
    if (browser === 'firefox') {
      // BUG 3: no `if ('PaymentRequest' in window)` check, no fallback
      onLog('error', 'Uncaught ReferenceError: PaymentRequest is not defined');
      return;
    }
    setSheet(true);
  };

  const placeOrder = () => {
    if (!fields.name.trim() || !fields.email.trim() || !fields.address.trim()) return setError('Please fill in your contact and delivery details.');
    if (!date) return setError('Please choose a delivery date.');
    setError('');
    setPlaced(true);
  };

  const safari = browser === 'safari';
  const barBottom = 0; // BUG 2: the bar sits at the bottom of a 100vh box, which on iOS Safari extends under the toolbar

  if (placed)
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0b0f] px-6 text-center text-white">
        <CheckCircle2 size={44} className="text-[#a3e635]" aria-hidden="true" />
        <p className="mt-3 text-[20px] font-bold">Order placed!</p>
        <p className="mt-1 text-[13px] text-white/60">
          Night Sprint 3 arrives {date}. Total ${total}.00
        </p>
        <button type="button" onClick={onRestart} className="mt-5 rounded-xl border border-white/20 px-4 py-2 text-[13px] font-semibold">
          Start over
        </button>
      </div>
    );

  const input = (key: keyof typeof fields, label: string, type = 'text') => (
    <label className="block text-[11px] font-medium text-white/55">
      {label}
      <input
        type={type}
        autoComplete="off"
        value={fields[key]}
        onChange={(e) => {
          const v = e.target.value;
          setFields((f) => ({ ...f, [key]: v }));
          setFilled((f) => ({ ...f, [key]: false }));
        }}
        className="mt-1 block w-full rounded-lg border border-[#2e3240] bg-[#171922] px-3 py-2 text-[14px] outline-none focus:border-[#a3e635]"
        style={{ color: '#fff', WebkitTextFillColor: '#fff', ...(filled[key] ? autofillStyle : {}) }}
      />
    </label>
  );

  return (
    <div className="absolute inset-0 bg-[#0b0b0f] text-white" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div className="absolute inset-0 overflow-y-auto" style={{ paddingBottom: 104 + (safari ? 78 : 0) }}>
        {banner && (
          <div className="flex items-start gap-2 bg-[#fde047] px-3 py-2 text-[12px] leading-snug text-[#422006]">
            <span className="min-w-0 flex-1">
              ⚠️ <strong>Your browser is not supported.</strong> For the best experience, please use Chrome or Safari.
            </span>
            <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="shrink-0 rounded p-0.5 hover:bg-black/10">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[17px] font-black tracking-tight italic">
            NIGHT<span className="text-[#a3e635]">RUN</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/55">
            <Lock size={11} aria-hidden="true" /> Secure checkout
          </span>
        </div>

        <div className="px-4" style={gap(18)}>
          <section>
            <button type="button" onClick={expressPay} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[14px] font-bold text-black">
              <Zap size={15} aria-hidden="true" /> Express pay
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">or check out below</p>
          </section>

          <section style={gap(8)}>
            <h3 className="text-[14px] font-bold">Contact & delivery</h3>
            {input('name', 'Full name')}
            {input('email', 'Email', 'email')}
            {input('address', 'Street address')}
          </section>

          <section className="relative">
            <h3 className="mb-2 text-[14px] font-bold">Delivery date</h3>
            <button
              type="button"
              onClick={openPicker}
              aria-expanded={pickerOpen}
              className="flex w-full items-center justify-between rounded-lg border border-[#2e3240] bg-[#171922] px-3 py-2 text-left text-[14px]"
            >
              <span className={date ? '' : 'text-white/40'}>{date ?? 'Choose date'}</span>
              <Calendar size={15} className="text-white/60" aria-hidden="true" />
            </button>
            {pickerOpen && (
              <div className="absolute inset-x-0 top-full z-20 mt-1 grid grid-cols-2 gap-1 rounded-xl border border-[#2e3240] bg-[#1d2030] p-1.5 shadow-xl" role="listbox" aria-label="Delivery date">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="option"
                    aria-selected={date === d}
                    onClick={() => {
                      setDate(d);
                      setPickerOpen(false);
                    }}
                    className={`rounded-lg px-2 py-2 text-[13px] ${date === d ? 'bg-[#a3e635] font-semibold text-black' : 'hover:bg-white/10'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={gap(8)} role="radiogroup" aria-label="Shipping">
            <h3 className="text-[14px] font-bold">Shipping</h3>
            {(
              [
                ['standard', 'Standard', '3–5 days', 'Free'],
                ['express', 'Express', 'Next day', '$9.00'],
              ] as const
            ).map(([id, name, time, price]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={shipping === id}
                onClick={() => setShipping(id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${shipping === id ? 'border-[#a3e635] bg-[#a3e635]/10' : 'border-[#2e3240] bg-[#171922]'}`}
              >
                <span className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${shipping === id ? 'border-[#a3e635]' : 'border-white/30'}`}>
                  {shipping === id && <span className="size-1.5 rounded-full bg-[#a3e635]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">{name}</span>
                  <span className="block text-[11px] text-white/50">{time}</span>
                </span>
                <span className="text-[13px] font-semibold">{price}</span>
              </button>
            ))}
          </section>

          <section>
            <h3 className="mb-2 text-[14px] font-bold">We accept</h3>
            <div className="flex flex-wrap" style={{ gap: noGap ? 0 : 6 }}>
              {['Card', 'Wallet', 'Bank transfer', 'Gift card'].map((m) => (
                <span key={m} className="rounded-md border border-[#2e3240] bg-[#171922] px-2.5 py-1 text-[11px] text-white/70">
                  {m}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#2e3240] p-3 text-[13px]">
            <p className="flex justify-between">
              <span>Night Sprint 3 · EU 42</span>
              <span>$129.00</span>
            </p>
            <p className="mt-1 flex justify-between text-white/50">
              <span>Shipping</span>
              <span>{shipping === 'express' ? '$9.00' : 'Free'}</span>
            </p>
          </section>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 z-10 border-t border-white/10 bg-[#13151d] px-4 pt-2 pb-3" style={{ bottom: barBottom }}>
        {error && <p className="mb-1 text-[12px] text-[#fca5a5]">{error}</p>}
        <p className="mb-2 flex justify-between text-[13px]">
          <span className="text-white/60">Total</span>
          <span className="font-bold">${total}.00</span>
        </p>
        <button type="button" onClick={placeOrder} className="w-full rounded-xl bg-[#a3e635] py-2.5 text-[15px] font-bold text-black">
          Place order
        </button>
      </div>

      {sheet && (
        <div className="absolute inset-0 z-40 flex items-end bg-black/50">
          <div className="w-full rounded-t-2xl bg-white p-4 text-[#111]" role="dialog" aria-label="Payment sheet">
            <p className="text-[15px] font-bold">Browser payment sheet</p>
            <p className="mt-1 text-[12px] text-[#555]">Simulated: here the browser would show your saved cards or wallet. Total ${total}.00</p>
            <button type="button" onClick={() => setSheet(false)} className="mt-3 w-full rounded-xl bg-[#111] py-2 text-[13px] font-semibold text-white">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
