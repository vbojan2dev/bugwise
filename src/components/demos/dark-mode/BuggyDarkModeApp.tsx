import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Check, Flame, Footprints, Globe, Home, Moon, RotateCcw, RotateCw, Ruler, Settings, Smartphone, Sun, Timer } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken fitness app (PulseFit) for the dark mode bug hunt. Bugs (don't spoil them!):
 *  1. The "Weekly summary" card body text is hard-coded near-black: invisible on the dark card.
 *  2. The logo is a black wordmark on a transparent background: it vanishes on the dark header
 *     (only the pink pulse icon remains).
 *  3. Today / Week / Month chips: in dark mode selected and unselected chips use the same colors.
 *  4. The "Sponsored" partner web view always renders white with dark text (no dark styles).
 *  5. The in-app Appearance setting is saved, but on a cold start the app ignores it and follows
 *     the phone again (Settings still shows the saved choice).
 *  6. The website applies its dark theme with JavaScript after the page has rendered,
 *     so every load in dark mode flashes white first.
 *
 * Working on purpose: the status bar adapts, the stats card, tab bar and Settings screen use
 * semantic colors, switching the in-app setting applies immediately, the website updates live
 * when the system appearance changes.
 */

type Mode = 'light' | 'dark';
type AppSetting = 'system' | 'light' | 'dark';
type Range = 'today' | 'week' | 'month';

const PINK = '#ff375f';
const palette = {
  light: { bg: '#f2f2f7', card: '#ffffff', text: '#000000', sub: 'rgba(60,60,67,.6)', sep: 'rgba(60,60,67,.12)', bar: 'rgba(249,249,249,.94)' },
  dark: { bg: '#000000', card: '#1c1c1e', text: '#ffffff', sub: 'rgba(235,235,245,.6)', sep: 'rgba(84,84,88,.6)', bar: 'rgba(22,22,24,.94)' },
};

const stats: Record<Range, { steps: string; kcal: string; active: string }> = {
  today: { steps: '6,240', kcal: '410', active: '38 min' },
  week: { steps: '48,910', kcal: '2,950', active: '4 h 10 min' },
  month: { steps: '201,300', kcal: '12,480', active: '17 h 25 min' },
};

function Logo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 118 28" width="98" height="23" role="img" aria-label="PulseFit">
      <path d="M2 15h6l3-8 5 15 3-7h5" stroke={PINK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="29" y="20.5" fontSize="17" fontWeight="800" fill={color} fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.4">
        PulseFit
      </text>
    </svg>
  );
}

function DeviceSeg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string; icon: ReactNode }[]; onChange: (v: T) => void }) {
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
            {o.icon} {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BuggyDarkModeApp() {
  const timers = useRef<number[]>([]);
  const [system, setSystem] = useState<Mode>('light');
  const [view, setView] = useState<'app' | 'web'>('app');
  const [tab, setTab] = useState<'home' | 'settings'>('home');
  const [range, setRange] = useState<Range>('today');
  const [saved, setSaved] = useState<AppSetting>('system'); // persisted "on disk"
  const [applied, setApplied] = useState<AppSetting>('system'); // what the running app uses
  const [booting, setBooting] = useState(false);
  const [webLoading, setWebLoading] = useState(false);
  const [webLoads, setWebLoads] = useState(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const theme: Mode = applied === 'system' ? system : applied;
  const c = palette[theme];
  const dark = theme === 'dark';

  const chooseAppearance = (v: AppSetting) => {
    setSaved(v);
    setApplied(v);
  };

  const restart = () => {
    setBooting(true);
    setTab('home');
    // BUG 5: the saved preference is never read on launch, the app falls back to "follow the system".
    setApplied('system');
    later(() => setBooting(false), 900);
  };

  const loadWebsite = () => {
    setWebLoading(true);
    setWebLoads((n) => n + 1);
    later(() => setWebLoading(false), 750);
  };

  const openView = (v: 'app' | 'web') => {
    setView(v);
    if (v === 'web') loadWebsite();
  };

  // ---------- App screens ----------
  const chips = (
    <div role="radiogroup" aria-label="Time range" className="flex gap-1.5">
      {(['today', 'week', 'month'] as Range[]).map((r) => {
        const on = range === r;
        // BUG 3: in dark mode both states get the same colors.
        const style = dark ? { background: '#2c2c2e', color: '#ffffff' } : on ? { background: '#000000', color: '#ffffff' } : { background: '#ffffff', color: '#000000' };
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setRange(r)}
            className={`h-8 flex-1 rounded-full text-[12.5px] capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff375f] ${on ? 'font-semibold' : 'font-medium'}`}
            style={style}
          >
            {r}
          </button>
        );
      })}
    </div>
  );

  const s = stats[range];
  const home = (
    <div className="h-full overflow-y-auto px-4 pt-2 pb-20">
      <div className="flex items-center justify-between">
        {/* BUG 2: the wordmark is hard-coded black on a transparent background. */}
        <Logo color="#111111" />
        <span className="grid size-8 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: PINK }}>
          MK
        </span>
      </div>
      <p className="mt-3 text-[22px] leading-tight font-bold tracking-tight">Good morning, Mia</p>
      <p className="mb-3 text-[13px]" style={{ color: c.sub }}>
        Tuesday, 14 October
      </p>
      {chips}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl p-3" style={{ background: c.card }}>
        {[
          { icon: Footprints, k: 'Steps', v: s.steps },
          { icon: Flame, k: 'kcal', v: s.kcal },
          { icon: Timer, k: 'Active', v: s.active },
        ].map((m) => (
          <div key={m.k} className="min-w-0">
            <m.icon size={15} style={{ color: PINK }} />
            <p className="mt-1 truncate text-[14px] font-semibold">{m.v}</p>
            <p className="text-[11px]" style={{ color: c.sub }}>
              {m.k}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl p-3" style={{ background: c.card }}>
        <p className="text-[14px] font-semibold">Weekly summary</p>
        {/* BUG 1: body text color is hard-coded. */}
        <p className="mt-1 text-[13px] leading-snug" style={{ color: '#1a1a1a' }}>
          You were active 5 of 7 days. Two more workouts and you hit your monthly goal!
        </p>
      </div>
      <p className="mt-4 mb-1 px-1 text-[11px] font-semibold tracking-wide uppercase" style={{ color: c.sub }}>
        Sponsored
      </p>
      {/* BUG 4: embedded partner web view has no dark styles. */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-3 text-[#111]" aria-label="Partner offer">
        <p className="text-[10px] font-semibold tracking-wide text-[#6b7280] uppercase">FuelBox</p>
        <p className="mt-0.5 text-[14px] font-bold">Protein bars, 20% off</p>
        <p className="mt-0.5 text-[12px] text-[#374151]">Code PULSE20 at checkout. Ends Sunday.</p>
        <span className="mt-2 inline-block rounded-lg bg-[#111] px-3 py-1.5 text-[12px] font-semibold text-white">Shop now</span>
      </div>
    </div>
  );

  const appearanceRows: { v: AppSetting; label: string }[] = [
    { v: 'system', label: 'System' },
    { v: 'light', label: 'Light' },
    { v: 'dark', label: 'Dark' },
  ];
  const settings = (
    <div className="h-full overflow-y-auto px-4 pt-2 pb-20">
      <p className="text-[28px] font-bold tracking-tight">Settings</p>
      <p className="mt-3 mb-1.5 px-1 text-[12px] uppercase" style={{ color: c.sub }}>
        Appearance
      </p>
      <div role="radiogroup" aria-label="Appearance" className="overflow-hidden rounded-xl" style={{ background: c.card }}>
        {appearanceRows.map((r, i) => (
          <button
            key={r.v}
            type="button"
            role="radio"
            aria-checked={saved === r.v}
            onClick={() => chooseAppearance(r.v)}
            className="flex h-11 w-full items-center px-3 text-left text-[15px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff375f]"
            style={{ borderTop: i ? `0.5px solid ${c.sep}` : undefined }}
          >
            <span className="flex-1">{r.label}</span>
            {saved === r.v && <Check size={18} style={{ color: PINK }} />}
          </button>
        ))}
      </div>
      <p className="mt-1.5 px-1 text-[12px]" style={{ color: c.sub }}>
        System matches your phone's Light or Dark setting.
      </p>
      <p className="mt-5 mb-1.5 px-1 text-[12px] uppercase" style={{ color: c.sub }}>
        General
      </p>
      <div className="overflow-hidden rounded-xl text-[15px]" style={{ background: c.card }}>
        <div className="flex h-11 items-center gap-2 px-3">
          <Ruler size={16} style={{ color: PINK }} />
          <span className="flex-1">Units</span>
          <span style={{ color: c.sub }}>Metric</span>
        </div>
        <div className="flex h-11 items-center gap-2 px-3" style={{ borderTop: `0.5px solid ${c.sep}` }}>
          <Bell size={16} style={{ color: PINK }} />
          <span className="flex-1">Reminders</span>
          <span style={{ color: c.sub }}>On</span>
        </div>
      </div>
    </div>
  );

  const app = (
    <div className="relative h-full" style={{ background: c.bg, color: c.text, colorScheme: theme }}>
      {booting ? (
        <div className="grid h-full place-items-center">
          <Logo color={dark ? '#ffffff' : '#111111'} />
        </div>
      ) : (
        <>
          {tab === 'home' ? home : settings}
          <nav className="absolute inset-x-0 bottom-0 flex border-t pt-1.5 pb-5 backdrop-blur" style={{ background: c.bar, borderColor: c.sep }} aria-label="Tabs">
            {[
              { id: 'home' as const, label: 'Today', icon: Home },
              { id: 'settings' as const, label: 'Settings', icon: Settings },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-[#ff375f]"
                style={{ color: tab === t.id ? PINK : c.sub }}
              >
                <t.icon size={20} /> {t.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );

  // ---------- Website ----------
  // BUG 6: the dark class is added by a script after first paint, so loading shows the light page.
  const webDark = system === 'dark' && !webLoading;
  const w = webDark ? { bg: '#0f1115', text: '#f3f4f6', sub: '#9ca3af', card: '#1a1d24', line: '#2a2e38' } : { bg: '#ffffff', text: '#111827', sub: '#4b5563', card: '#f3f4f6', line: '#e5e7eb' };
  const website = (
    <BrowserFrame url="pulsefit.example.com" dark={system === 'dark'}>
      <div key={webLoads} className="min-h-[360px] px-4 py-3" style={{ background: w.bg, color: w.text, colorScheme: webDark ? 'dark' : 'light' }}>
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: w.line }}>
          <Logo color="currentColor" />
          <span className="text-[12px] font-medium" style={{ color: w.sub }}>
            Log in
          </span>
        </div>
        <p className="mt-5 text-[24px] leading-tight font-extrabold tracking-tight">Train smarter, not longer.</p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: w.sub }}>
          Plans that adapt to your week. Track steps, workouts and sleep in one place.
        </p>
        <span className="mt-4 inline-block rounded-lg px-4 py-2 text-[13px] font-semibold text-white" style={{ background: PINK }}>
          Start free trial
        </span>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {['12-week plans', 'Apple Health & Health Connect'].map((f) => (
            <div key={f} className="rounded-xl p-2.5 text-[12px] font-medium" style={{ background: w.card }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      {view === 'app' ? (
        <PhoneFrame width={290} dark={dark}>
          {app}
        </PhoneFrame>
      ) : (
        <div className="w-full">{website}</div>
      )}

      <div className="w-full space-y-3 rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          {view === 'app' ? (
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCcw size={12} /> Restart app
            </button>
          ) : (
            <button type="button" onClick={loadWebsite} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCw size={12} /> Reload page
            </button>
          )}
        </div>
        <DeviceSeg
          label="System appearance (Control Center / Quick Settings)"
          value={system}
          onChange={setSystem}
          options={[
            { v: 'light', label: 'Light', icon: <Sun size={13} /> },
            { v: 'dark', label: 'Dark', icon: <Moon size={13} /> },
          ]}
        />
        <DeviceSeg
          label="Open"
          value={view}
          onChange={openView}
          options={[
            { v: 'app', label: 'App', icon: <Smartphone size={13} /> },
            { v: 'web', label: 'Website', icon: <Globe size={13} /> },
          ]}
        />
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <p className="mt-1">
          The app and website support light and dark themes. By default they follow the system. In the app, <strong className="text-fg">Settings › Appearance</strong> can force Light or Dark, and the choice is remembered.
        </p>
      </div>
    </div>
  );
}
