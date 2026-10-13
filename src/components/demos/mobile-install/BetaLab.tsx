import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, CreditCard, Info, Plane, Settings as SettingsIcon, ShoppingBasket, TriangleAlert, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A TestFlight-like beta install flow for the "TestFlight and Firebase App Distribution" lesson.
 * The learner picks a build, reads its notes, installs it, reproduces a bug and fills in the
 * build field of a bug report. Build 318 has a deliberate bug (Apple Pay sheet shows €0.00),
 * build 317 crashes when Apple Pay is canceled (as its notes say).
 */

interface Build {
  id: string;
  version: string;
  build: number;
  env: 'Staging' | 'Production';
  expires: string;
  expired?: boolean;
  applePay: boolean;
  whatToTest: string[];
}

const BUILDS: Build[] = [
  {
    id: '318',
    version: '2.4.0',
    build: 318,
    env: 'Staging',
    expires: 'Expires in 88 days',
    applePay: true,
    whatToTest: ['New: Apple Pay at checkout. Please pay for a test order end to end.', 'Fixed BUG-412: expired coupon codes were accepted.', 'Fixed BUG-398: order history empty after login.'],
  },
  {
    id: '317',
    version: '2.4.0',
    build: 317,
    env: 'Staging',
    expires: 'Expires in 85 days',
    applePay: true,
    whatToTest: ['First try of Apple Pay at checkout.', 'Known issue: the app crashes when you cancel the Apple Pay sheet.'],
  },
  {
    id: '309',
    version: '2.3.2',
    build: 309,
    env: 'Production',
    expires: 'Expires in 61 days',
    applePay: false,
    whatToTest: ['Release candidate for the App Store (production servers).', 'Fixed: delivery time missing on the order screen.'],
  },
  {
    id: '301',
    version: '2.3.1',
    build: 301,
    env: 'Production',
    expires: 'Expired',
    expired: true,
    applePay: false,
    whatToTest: ['Hotfix for login on iOS 17.'],
  },
];

type Screen = 'tf-app' | 'app' | 'about';

const byId = (id: string) => BUILDS.find((b) => b.id === id)!;

export default function BetaLab() {
  const [screen, setScreen] = useState<Screen>('tf-app');
  const [selected, setSelected] = useState('318');
  const [installed, setInstalled] = useState('309');
  const [progress, setProgress] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'none' | 'pay' | 'crash'>('none');
  const [sawBug, setSawBug] = useState(false);
  const [reportBuild, setReportBuild] = useState('');
  const [reportEnv, setReportEnv] = useState('');
  const [checked, setChecked] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearInterval(timer.current);
    },
    [],
  );

  const sel = byId(selected);
  const inst = byId(installed);
  const staging = inst.env === 'Staging';

  const install = () => {
    if (progress !== null || sel.expired) return;
    const target = selected;
    setProgress(0);
    let step = 0;
    timer.current = window.setInterval(() => {
      step += 1;
      if (step >= 5) {
        if (timer.current !== null) clearInterval(timer.current);
        timer.current = null;
        setProgress(null);
        setInstalled(target);
        setSheet('none');
      } else {
        setProgress(step * 20);
      }
    }, 220);
  };

  const openApp = () => {
    setSheet('none');
    setScreen('app');
  };

  const payApple = () => {
    setSheet('pay');
    if (installed === '318') setSawBug(true);
  };

  const cancelPay = () => setSheet(installed === '317' ? 'crash' : 'none');

  /* ---------- feedback ---------- */
  const buildOk = reportBuild === installed && installed === '318';
  const envOk = reportEnv === inst.env && installed === '318';
  let buildMsg = '';
  if (reportBuild === '') buildMsg = 'Pick the build you tested.';
  else if (reportBuild === 'latest') buildMsg = '"Latest" changes every day. Write the exact version and build number.';
  else if (reportBuild !== installed) buildMsg = `Your phone has ${inst.version} (${inst.build}) installed. Check FreshCart › Settings › About.`;
  else if (installed !== '318') buildMsg = 'That matches your phone, but the task was to test the newest build, 2.4.0 (318).';
  else buildMsg = 'Correct: 2.4.0 (318), exactly what the About screen shows.';
  let envMsg = '';
  if (reportEnv === '') envMsg = 'Pick the environment.';
  else if (reportEnv !== inst.env) envMsg = `The About screen of the installed build says ${inst.env}.`;
  else if (installed !== '318') envMsg = 'Matches your phone, but re-check after installing build 318.';
  else envMsg = 'Correct: build 318 talks to the staging servers.';
  const allOk = sawBug && buildOk && envOk;

  /* ---------- phone screens ---------- */
  let content: ReactNode;
  if (screen === 'tf-app') {
    content = (
      <div className="flex h-full flex-col bg-[#f2f2f7] text-black">
        <div className="flex items-center gap-1 px-3 pt-3 text-[15px] text-[#007aff]">
          <ChevronLeft size={20} /> Apps
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="mt-2 flex items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-[#c2410c] text-white">
              <ShoppingBasket size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold">FreshCart</p>
              <p className="text-[11px] text-black/55">FreshCart Ltd.</p>
            </div>
            {sel.expired ? (
              <span className="rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold text-black/40">EXPIRED</span>
            ) : installed === selected && progress === null ? (
              <button type="button" onClick={openApp} className="rounded-full bg-[#007aff] px-4 py-1 text-[12px] font-bold text-white">
                OPEN
              </button>
            ) : progress !== null ? (
              <span className="relative grid size-7 place-items-center" role="progressbar" aria-label="Installing" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <svg viewBox="0 0 36 36" className="size-7 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#007aff" strokeWidth="3" strokeDasharray={`${(progress / 100) * 94} 94`} />
                </svg>
                <span className="absolute size-2 rounded-[2px] bg-[#007aff]" />
              </span>
            ) : (
              <button type="button" onClick={install} className="rounded-full bg-[#007aff] px-3.5 py-1 text-[12px] font-bold text-white">
                INSTALL
              </button>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-white p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold">
                Version {sel.version} ({sel.build})
              </p>
              <p className={`text-[10px] ${sel.expired ? 'text-[#ff3b30]' : 'text-black/50'}`}>{sel.expires}</p>
            </div>
            <p className="mt-2 text-[11px] font-semibold tracking-wide text-black/45 uppercase">What to Test</p>
            <ul className="mt-1 space-y-1 text-[12px] leading-snug text-black/80">
              {sel.whatToTest.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 mb-1 px-1 text-[11px] font-semibold tracking-wide text-black/45 uppercase">Builds</p>
          <ul className="overflow-hidden rounded-xl bg-white" aria-label="Available builds">
            {BUILDS.map((b, i) => (
              <li key={b.id} style={{ borderTop: i ? '0.5px solid rgba(60,60,67,.18)' : undefined }}>
                <button
                  type="button"
                  onClick={() => setSelected(b.id)}
                  aria-pressed={selected === b.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007aff]"
                  style={{ background: selected === b.id ? 'rgba(0,122,255,.08)' : undefined }}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-medium ${b.expired ? 'text-black/40' : ''}`}>
                      {b.version} ({b.build})
                    </span>
                    <span className="block text-[10px] text-black/50">
                      {b.expires}
                      {installed === b.id ? ' · Installed' : ''}
                    </span>
                  </span>
                  <ChevronRight size={14} className="text-black/30" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } else if (screen === 'about') {
    content = (
      <div className="flex h-full flex-col bg-[#f2f2f7] px-4 pt-3 text-black">
        <button type="button" onClick={() => setScreen('app')} className="-ml-1 flex items-center text-[15px] text-[#007aff]">
          <ChevronLeft size={20} /> Back
        </button>
        <p className="mt-2 text-[22px] font-bold tracking-tight">About</p>
        <div className="mt-3 overflow-hidden rounded-xl bg-white text-[13px]">
          {[
            ['Version', `${inst.version} (${inst.build})`],
            ['Environment', inst.env],
            ['Server', inst.env === 'Staging' ? 'api-staging.freshcart.app' : 'api.freshcart.app'],
            ['Installed via', 'TestFlight'],
          ].map(([k, val], i) => (
            <div key={k} className="flex items-center justify-between gap-2 px-3 py-2.5" style={{ borderTop: i ? '0.5px solid rgba(60,60,67,.18)' : undefined }}>
              <span>{k}</span>
              <span className="min-w-0 truncate text-black/55">{val}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-[10px] text-black/45">Tip: copy this line into every bug report.</p>
      </div>
    );
  } else {
    content = (
      <div className="relative flex h-full flex-col bg-white text-black">
        {staging && <div className="bg-[#ff9f0a] py-0.5 text-center text-[9px] font-bold tracking-widest text-black">STAGING</div>}
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-[22px] font-bold tracking-tight">Checkout</p>
          <button type="button" onClick={() => setScreen('about')} aria-label="Settings and About" className="grid size-9 place-items-center rounded-full text-black/60 focus-visible:outline-2 focus-visible:outline-[#007aff]">
            <SettingsIcon size={18} />
          </button>
        </div>
        <div className="mx-4 mt-3 space-y-1.5 rounded-xl bg-[#f2f2f7] p-3 text-[13px]">
          {[
            ['Oat milk ×2', '€4.98'],
            ['Sourdough bread', '€3.90'],
            ['Avocados (2)', '€2.99'],
            ['Delivery', '€2.50'],
          ].map(([k, val]) => (
            <div key={k} className="flex justify-between">
              <span className="text-black/70">{k}</span>
              <span className="tabular-nums">{val}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-black/10 pt-1.5 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">€14.37</span>
          </div>
        </div>
        <div className="mt-auto space-y-2 px-4 pb-8">
          {inst.applePay && (
            <button type="button" onClick={payApple} className="flex w-full items-center justify-center gap-1 rounded-xl bg-black py-2.5 text-[14px] font-semibold text-white">
              Pay with Apple Pay
            </button>
          )}
          <button type="button" onClick={() => setSheet('none')} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#c2410c] py-2.5 text-[14px] font-semibold text-white">
            <CreditCard size={16} /> Pay with card
          </button>
        </div>
        {sheet === 'pay' && (
          <div className="absolute inset-0 z-10 flex items-end bg-black/30">
            <div role="dialog" aria-label="Apple Pay" className="w-full rounded-t-[16px] bg-[#f2f2f7] px-4 pt-3 pb-8">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">Apple Pay</p>
                <button type="button" onClick={cancelPay} aria-label="Cancel" className="grid size-7 place-items-center rounded-full bg-black/10">
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-white p-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-black/55">Card</span>
                  <span>Test Visa •••• 4242</span>
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between rounded-xl bg-white p-3">
                <span className="text-[12px] text-black/55">Pay FreshCart</span>
                <span className="text-[20px] font-semibold tabular-nums">{installed === '318' ? '€0.00' : '€14.37'}</span>
              </div>
              <p className="mt-3 text-center text-[11px] text-black/45">Double-click side button to pay</p>
            </div>
          </div>
        )}
        {sheet === 'crash' && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/55 px-7">
            <div role="alertdialog" aria-label="App crashed" className="w-full overflow-hidden rounded-[14px] bg-[#f2f2f2] text-center">
              <p className="px-4 pt-4 text-[14px] font-semibold">"FreshCart" crashed</p>
              <p className="px-4 pt-1 pb-3 text-[11px] text-black/65">Do you want to share additional information with the developer?</p>
              <div className="grid grid-cols-2 border-t border-black/15 text-[14px] text-[#007aff]">
                <button type="button" onClick={() => { setSheet('none'); setScreen('tf-app'); }} className="border-r border-black/15 py-2.5">
                  Don't Share
                </button>
                <button type="button" onClick={() => { setSheet('none'); setScreen('tf-app'); }} className="py-2.5 font-semibold">
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const homeBtn = (target: Screen, text: string, icon: ReactNode, color: string) => {
    const active = target === 'tf-app' ? screen === 'tf-app' : screen !== 'tf-app';
    return (
      <button
        type="button"
        onClick={() => {
          setSheet('none');
          setScreen(target);
        }}
        aria-pressed={active}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-colors ${active ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-subtle text-muted hover:text-fg'}`}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: color }}>
          {icon}
        </span>
        <span className="min-w-0 truncate">{text}</span>
      </button>
    );
  };

  return (
    <div className="not-prose @container w-full">
      <div className="flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <PhoneFrame width={270}>{content}</PhoneFrame>
          <div className="flex w-[290px] max-w-full gap-2" role="group" aria-label="Home screen apps">
            {homeBtn('tf-app', 'TestFlight', <Plane size={15} />, '#007aff')}
            {homeBtn('app', staging ? 'FreshCart STG' : 'FreshCart', <ShoppingBasket size={15} />, staging ? '#ff9f0a' : '#c2410c')}
          </div>
        </div>

        <div className="w-full max-w-[460px] min-w-0 flex-1 space-y-3 @2xl:max-w-none">
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Your task</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>In TestFlight, read the <strong className="text-fg">What to Test</strong> notes of the newest build.</li>
              <li>Install it, then open FreshCart.</li>
              <li>Do what the notes ask: pay with Apple Pay. Something is wrong.</li>
              <li>Check <strong className="text-fg">Settings › About</strong> and fill in your bug report.</li>
            </ol>
            <p className={`mt-3 flex items-center gap-1.5 text-xs ${sawBug ? 'text-ok' : 'text-faint'}`}>
              {sawBug ? <Check size={14} /> : <Info size={14} />}
              {sawBug ? 'Bug reproduced: the Apple Pay sheet shows €0.00 instead of €14.37.' : 'Bug not reproduced yet.'}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Bug report</p>
            <p className="mt-2 font-medium text-fg">Apple Pay sheet shows €0.00 instead of the order total</p>
            <div className="mt-3 grid grid-cols-1 gap-2 @sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
                Build
                <select
                  value={reportBuild}
                  onChange={(e) => {
                    setReportBuild(e.target.value);
                    setChecked(false);
                  }}
                  className="rounded-lg border border-line bg-subtle px-2 py-1.5 text-sm text-fg"
                >
                  <option value="">Choose…</option>
                  <option value="latest">Latest</option>
                  {BUILDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.version} ({b.build})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
                Environment
                <select
                  value={reportEnv}
                  onChange={(e) => {
                    setReportEnv(e.target.value);
                    setChecked(false);
                  }}
                  className="rounded-lg border border-line bg-subtle px-2 py-1.5 text-sm text-fg"
                >
                  <option value="">Choose…</option>
                  <option value="Staging">Staging</option>
                  <option value="Production">Production</option>
                </select>
              </label>
            </div>
            <button type="button" onClick={() => setChecked(true)} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg hover:opacity-90">
              Check report
            </button>
            {checked && (
              <ul className="mt-3 space-y-1.5 text-xs" aria-live="polite">
                <li className={`flex gap-1.5 ${sawBug ? 'text-ok' : 'text-danger'}`}>
                  {sawBug ? <Check size={14} className="shrink-0" /> : <TriangleAlert size={14} className="shrink-0" />}
                  {sawBug ? 'You reproduced the bug before reporting it.' : 'Reproduce the bug first: it only appears in the newest build.'}
                </li>
                <li className={`flex gap-1.5 ${buildOk ? 'text-ok' : 'text-danger'}`}>
                  {buildOk ? <Check size={14} className="shrink-0" /> : <TriangleAlert size={14} className="shrink-0" />}
                  {buildMsg}
                </li>
                <li className={`flex gap-1.5 ${envOk ? 'text-ok' : 'text-danger'}`}>
                  {envOk ? <Check size={14} className="shrink-0" /> : <TriangleAlert size={14} className="shrink-0" />}
                  {envMsg}
                </li>
                {allOk && <li className="rounded-lg bg-ok-soft px-2.5 py-2 font-medium text-ok">Great report. A developer can install exactly the build you used.</li>}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
