import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowUpCircle, BellRing, Check, ChevronLeft, Download, Dumbbell, Flame, LogOut, RotateCcw, Sparkles, Trash2, Type } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately buggy first-run onboarding for a fitness app ("Pulse"), with device controls
 * (restart, update, reinstall, log out, large text) and a view of what the app stored on the device.
 * Bugs (don't spoil them for learners!):
 *  1. The "onboarding done" flag is stored per app version (onboarding_done_v2.3.0), so after an
 *     update existing, logged-in users see the whole onboarding again.
 *  2. "Skip" on the welcome carousel skips the required setup too: Home shows "Hi, undefined",
 *     an empty plan, and "Start workout" fails. There is no way back to the setup.
 *  3. The carousel has 3 slides but shows 4 progress dots (the last dot never fills).
 *  4. Back on setup step 3 jumps to step 1 and clears every choice (Back on step 2 works).
 *  5. The system notification prompt appears on first launch before any explanation, and after
 *     "Don't Allow" the "Turn on reminders" button does nothing (no explanation, no link to Settings).
 *  6. With large text, the carousel text is cut off (fixed-height box with overflow hidden).
 *
 * Working on purpose: Restart keeps the user out of onboarding, Log out shows a login screen
 * (not the onboarding), Reinstall shows onboarding again (expected for a fresh install),
 * "Step x of 3" and the progress bar in setup, required-field validation, Back on step 2.
 */

type Phase = 'carousel' | 'setup' | 'reminders' | 'home' | 'login';
type Permission = 'notDetermined' | 'granted' | 'denied';
interface Profile {
  name: string;
  goal: string;
  level: string;
  days: string[];
}
interface Device {
  version: string;
  done: string[]; // versions for which "onboarding_done_v<version>" is stored
  session: boolean;
  profile: Profile | null;
  permission: Permission;
}

const PURPLE = '#7c3aed';
const SUB = 'rgba(60,60,67,.6)';
const VERSIONS = ['2.3.0', '2.4.0', '2.5.0', '2.6.0', '2.7.0'];
const GOALS = ['Lose weight', 'Build strength', 'Stay active'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLIDES = [
  { icon: Dumbbell, color: '#ede9fe', title: 'Track every workout', body: 'Log runs, rides and gym sessions in one place. Pulse adds up your weekly minutes for you.' },
  { icon: Sparkles, color: '#fce7f3', title: 'Plans that adapt to you', body: 'Tell us your goal and level, and we build a weekly plan that gets harder as you get stronger.' },
  { icon: Flame, color: '#ffedd5', title: 'Celebrate your streaks', body: 'Get a gentle reminder on workout days and watch your streak grow week after week.' },
];
const DOTS = 4; // BUG 3: should be SLIDES.length

const fresh = (version: string): Device => ({ version, done: [], session: false, profile: null, permission: 'notDetermined' });

function Choice({ label, selected, onSelect, z }: { label: string; selected: boolean; onSelect: () => void; z: number }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-white px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
      style={{ borderColor: selected ? PURPLE : 'transparent', fontSize: 14 * z }}
    >
      <span className="min-w-0">{label}</span>
      {selected && <Check size={16} className="shrink-0" style={{ color: PURPLE }} />}
    </button>
  );
}

export function BuggyOnboardingApp() {
  const timers = useRef<number[]>([]);
  const serverProfile = useRef<Profile | null>(null);

  const [device, setDevice] = useState<Device>(() => fresh(VERSIONS[0]));
  const [phase, setPhase] = useState<Phase>('carousel');
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(true); // BUG 5: asked on first launch, before any explanation
  const [large, setLarge] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const flash = (msg: string) => {
    setToast(msg);
    timers.current.push(window.setTimeout(() => setToast(''), 2400));
  };

  const z = large ? 1.5 : 1;
  const fs = (n: number): CSSProperties => ({ fontSize: n * z });

  const resetForm = () => {
    setName('');
    setGoal('');
    setLevel('');
    setDays([]);
    setSlide(0);
    setStep(1);
  };

  const launch = (d: Device) => {
    resetForm();
    setPrompt(false);
    // BUG 1: the flag is looked up for the current version only.
    if (d.done.includes(d.version)) {
      setPhase(d.session ? 'home' : 'login');
    } else {
      setPhase('carousel');
      if (d.permission === 'notDetermined') setPrompt(true); // BUG 5
    }
  };

  const answerPrompt = (allow: boolean) => {
    setDevice((d) => ({ ...d, permission: allow ? 'granted' : 'denied' }));
    setPrompt(false);
  };

  const skip = () => {
    // BUG 2: marks onboarding as done and logs in without the required setup.
    setDevice((d) => ({ ...d, done: d.done.includes(d.version) ? d.done : [...d.done, d.version], session: true }));
    setPhase('home');
  };

  const finish = () => {
    const p: Profile = { name: name.trim(), goal, level, days: DAYS.filter((x) => days.includes(x)) };
    serverProfile.current = p;
    setDevice((d) => ({ ...d, done: d.done.includes(d.version) ? d.done : [...d.done, d.version], session: true, profile: p }));
    setPhase('home');
    flash("You're all set!");
  };

  const turnOnReminders = () => {
    if (device.permission === 'notDetermined') setPrompt(true);
    // BUG 5: when denied, iOS won't show the dialog again, and the app does nothing at all.
  };

  const restart = () => launch(device);
  const update = () => {
    const i = VERSIONS.indexOf(device.version);
    const next = VERSIONS[Math.min(i + 1, VERSIONS.length - 1)];
    if (next === device.version) {
      flash('You already have the latest version.');
      return;
    }
    const nd = { ...device, version: next };
    setDevice(nd);
    launch(nd);
    flash(`Updated to ${next}`);
  };
  const reinstall = () => {
    const nd = fresh(device.version);
    setDevice(nd);
    launch(nd);
  };
  const logout = () => {
    setDevice((d) => ({ ...d, session: false, profile: null }));
    resetForm();
    setPrompt(false);
    setPhase('login');
  };
  const login = () => {
    setDevice((d) => ({ ...d, session: true, profile: serverProfile.current }));
    setPhase('home');
  };

  const primaryBtn = 'flex h-11 w-full shrink-0 items-center justify-center rounded-xl font-semibold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]';

  // ---------- Screens ----------
  let body: ReactNode;

  if (phase === 'carousel') {
    const s = SLIDES[slide];
    const last = slide === SLIDES.length - 1;
    body = (
      <div className="flex h-full flex-col px-5 pt-2 pb-8">
        <div className="flex h-9 shrink-0 items-center justify-between">
          {slide > 0 ? (
            <button type="button" onClick={() => setSlide((x) => Math.max(0, x - 1))} aria-label="Previous" className="-ml-2 grid size-9 place-items-center" style={{ color: PURPLE }}>
              <ChevronLeft size={22} />
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={skip} className="font-semibold" style={{ color: PURPLE, ...fs(14) }}>
            Skip
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center">
          <span className="grid size-36 place-items-center rounded-full" style={{ background: s.color, color: PURPLE }}>
            <s.icon size={64} strokeWidth={1.6} />
          </span>
        </div>
        {/* BUG 6: fixed height + overflow hidden cuts the text at large sizes */}
        <div className="shrink-0 overflow-hidden text-center" style={{ height: 104 }}>
          <p className="leading-tight font-bold tracking-tight" style={fs(21)}>
            {s.title}
          </p>
          <p className="mt-1.5 leading-snug" style={{ color: SUB, ...fs(13) }}>
            {s.body}
          </p>
        </div>
        <div className="my-4 flex shrink-0 justify-center gap-1.5" aria-label={`Page ${slide + 1} of ${DOTS}`} role="img">
          {Array.from({ length: DOTS }, (_, i) => (
            <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === slide ? 18 : 8, background: i === slide ? PURPLE : 'rgba(120,120,128,.3)' }} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (last ? setPhase('setup') : setSlide((x) => Math.min(SLIDES.length - 1, x + 1)))}
          className={primaryBtn}
          style={{ background: PURPLE, ...fs(15) }}
        >
          {last ? 'Get started' : 'Next'}
        </button>
      </div>
    );
  } else if (phase === 'setup') {
    const canContinue = step === 1 ? name.trim() !== '' && goal !== '' : step === 2 ? level !== '' : days.length > 0;
    const back = () => {
      if (step === 1) {
        setPhase('carousel');
        setSlide(SLIDES.length - 1);
      } else if (step === 2) {
        setStep(1);
      } else {
        // BUG 4: jumps to step 1 and throws away every choice.
        setName('');
        setGoal('');
        setLevel('');
        setDays([]);
        setStep(1);
      }
    };
    const next = () => (step < 3 ? setStep((s) => s + 1) : setPhase('reminders'));
    body = (
      <div className="flex h-full flex-col bg-[#f2f2f7] px-4 pt-2 pb-8">
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={back} aria-label="Back" className="-ml-2 grid size-9 shrink-0 place-items-center" style={{ color: PURPLE }}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= step ? PURPLE : 'rgba(120,120,128,.25)' }} />
            ))}
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <p className="font-semibold tracking-wide uppercase" style={{ color: PURPLE, ...fs(11) }}>
            Step {step} of 3
          </p>
          {step === 1 && (
            <>
              <p className="mt-1 leading-tight font-bold tracking-tight" style={fs(22)}>
                About you
              </p>
              <label htmlFor="ob-name" className="mt-3 mb-1 block font-medium" style={{ color: SUB, ...fs(12) }}>
                What should we call you?
              </label>
              <input
                id="ob-name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="h-10 w-full rounded-xl border border-transparent bg-white px-3 text-black outline-none placeholder:text-[#3c3c43]/40 focus:border-[#7c3aed]"
                style={fs(14)}
              />
              <p className="mt-3 mb-1 font-medium" style={{ color: SUB, ...fs(12) }} id="ob-goal">
                Your main goal
              </p>
              <div role="radiogroup" aria-labelledby="ob-goal" className="space-y-1.5">
                {GOALS.map((g) => (
                  <Choice key={g} label={g} selected={goal === g} onSelect={() => setGoal(g)} z={z} />
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="mt-1 leading-tight font-bold tracking-tight" style={fs(22)} id="ob-level">
                Your fitness level
              </p>
              <div role="radiogroup" aria-labelledby="ob-level" className="mt-3 space-y-1.5">
                {LEVELS.map((l) => (
                  <Choice key={l} label={l} selected={level === l} onSelect={() => setLevel(l)} z={z} />
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="mt-1 leading-tight font-bold tracking-tight" style={fs(22)}>
                Workout days
              </p>
              <p className="mt-1" style={{ color: SUB, ...fs(12) }}>
                Pick at least one day.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {DAYS.map((d) => {
                  const on = days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                      className="rounded-full border-2 px-3 py-1.5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
                      style={{ borderColor: on ? PURPLE : 'transparent', background: on ? '#ede9fe' : '#fff', color: on ? PURPLE : '#000', ...fs(13) }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {(goal || level) && (
                <p className="mt-3" style={{ color: SUB, ...fs(12) }}>
                  So far: {name || '—'} · {goal || '—'} · {level || '—'}
                </p>
              )}
            </>
          )}
        </div>
        <button type="button" onClick={next} disabled={!canContinue} className={`${primaryBtn} mt-3`} style={{ background: PURPLE, ...fs(15) }}>
          Continue
        </button>
      </div>
    );
  } else if (phase === 'reminders') {
    const granted = device.permission === 'granted';
    body = (
      <div className="flex h-full flex-col px-5 pt-6 pb-8">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#ede9fe]" style={{ color: PURPLE }}>
            <BellRing size={28} />
          </span>
          <p className="mt-4 leading-tight font-bold tracking-tight" style={fs(22)}>
            Stay on track
          </p>
          <p className="mt-1.5 leading-snug" style={{ color: SUB, ...fs(13) }}>
            We'll remind you on your workout days ({DAYS.filter((x) => days.includes(x)).join(', ')}). Nothing else.
          </p>
          {granted && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#ecfdf3] px-3 py-2 font-medium text-[#166534]" style={fs(13)}>
              <Check size={16} /> Reminders are on
            </p>
          )}
        </div>
        {granted ? (
          <button type="button" onClick={finish} className={primaryBtn} style={{ background: PURPLE, ...fs(15) }}>
            Continue
          </button>
        ) : (
          <>
            <button type="button" onClick={turnOnReminders} className={primaryBtn} style={{ background: PURPLE, ...fs(15) }}>
              Turn on reminders
            </button>
            <button type="button" onClick={finish} className="mt-2 h-10 w-full shrink-0 font-semibold" style={{ color: PURPLE, ...fs(14) }}>
              Maybe later
            </button>
          </>
        )}
      </div>
    );
  } else if (phase === 'login') {
    body = (
      <div className="flex h-full flex-col px-5 pt-10 pb-8">
        <span className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: PURPLE }}>
          <Flame size={28} />
        </span>
        <p className="mt-4 leading-tight font-bold tracking-tight" style={fs(24)}>
          Welcome back
        </p>
        <p className="mt-1" style={{ color: SUB, ...fs(13) }}>
          Log in to see your plan and streak.
        </p>
        <p className="mt-5 rounded-xl bg-[#f2f2f7] px-3 py-2.5 text-black" style={fs(14)}>
          sam@test.com
        </p>
        <p className="mt-2 rounded-xl bg-[#f2f2f7] px-3 py-2.5 tracking-widest text-black" style={fs(14)}>
          ••••••••
        </p>
        <button type="button" onClick={login} className={`${primaryBtn} mt-4`} style={{ background: PURPLE, ...fs(15) }}>
          Log in
        </button>
      </div>
    );
  } else {
    const p = device.profile;
    body = (
      <div className="flex h-full flex-col overflow-y-auto bg-[#f2f2f7] px-4 pt-3 pb-8">
        {/* BUG 2 (consequence): no profile after Skip → "Hi, undefined" */}
        <p className="leading-tight font-bold tracking-tight" style={fs(24)}>
          Hi, {String(p?.name)}
        </p>
        <p className="mt-0.5" style={{ color: SUB, ...fs(12) }}>
          Week 1 · 0-day streak
        </p>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="font-semibold tracking-wide uppercase" style={{ color: SUB, ...fs(11) }}>
            Your plan
          </p>
          <p className="mt-0.5 font-semibold" style={fs(15)}>
            {String(p?.goal)} · {String(p?.level)}
          </p>
          <p className="mt-0.5" style={{ color: SUB, ...fs(12) }}>
            {p?.days.length ? p.days.join(', ') : 'No days chosen'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (p ? flash(`Starting a ${p.level.toLowerCase()} workout…`) : flash('Something went wrong. (plan_not_found)'))}
          className={`${primaryBtn} mt-3`}
          style={{ background: PURPLE, ...fs(15) }}
        >
          Start today's workout
        </button>
        <p className="mt-3 flex items-center gap-1.5" style={{ color: SUB, ...fs(12) }}>
          <BellRing size={13} /> Reminders: {device.permission === 'granted' ? 'on' : 'off'}
        </p>
      </div>
    );
  }

  const permLabel = { notDetermined: 'not asked yet', granted: 'allowed', denied: 'denied' }[device.permission];
  const ctl = 'flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-subtle px-2 py-2 text-xs font-medium text-fg hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-subtle';

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {body}
          {prompt && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/35 px-8">
              <div role="alertdialog" aria-modal="true" aria-labelledby="ob-alert-title" aria-describedby="ob-alert-text" className="w-full overflow-hidden rounded-[14px] bg-[#f2f2f7]/95 text-center text-black shadow-xl">
                <div className="px-4 pt-4 pb-3">
                  <p id="ob-alert-title" className="text-[14px] leading-snug font-semibold">
                    “Pulse” Would Like to Send You Notifications
                  </p>
                  <p id="ob-alert-text" className="mt-1 text-[12px] leading-snug">
                    Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.
                  </p>
                </div>
                <div className="grid grid-cols-2 border-t border-black/15 text-[15px]">
                  <button type="button" onClick={() => answerPrompt(false)} className="border-r border-black/15 py-2.5 text-[#007aff] focus-visible:bg-black/5 focus-visible:outline-none">
                    Don’t Allow
                  </button>
                  <button type="button" onClick={() => answerPrompt(true)} className="py-2.5 font-semibold text-[#007aff] focus-visible:bg-black/5 focus-visible:outline-none">
                    Allow
                  </button>
                </div>
              </div>
            </div>
          )}
          {toast && (
            <div role="status" className="absolute inset-x-4 bottom-6 z-30 rounded-xl bg-black/85 px-3 py-2 text-center text-[12px] text-white">
              {toast}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button type="button" onClick={restart} className={ctl}>
            <RotateCcw size={13} /> Restart app
          </button>
          <button type="button" onClick={update} className={ctl}>
            <ArrowUpCircle size={13} /> Update app
          </button>
          <button type="button" onClick={reinstall} className={ctl}>
            <Trash2 size={13} /> Reinstall
          </button>
          <button type="button" onClick={logout} disabled={!device.session || phase !== 'home'} className={ctl}>
            <LogOut size={13} /> Log out
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-fg">
          <span className="flex min-w-0 items-center gap-1.5">
            <Type size={14} className="shrink-0 text-muted" /> Larger text (accessibility)
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={large}
            aria-label="Larger text"
            onClick={() => setLarge((v) => !v)}
            className="relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            style={{ background: large ? '#34c759' : 'rgba(120,120,128,.32)' }}
          >
            <span className="absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow transition-transform" style={{ transform: large ? 'translateX(16px)' : 'none' }} />
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <Download size={12} /> App storage on device
        </p>
        <ul className="space-y-1 px-3 py-2">
          <li>
            app_version = <span className="text-white">{device.version}</span>
          </li>
          {device.done.map((v) => (
            <li key={v}>
              onboarding_done_v{v} = <span className="text-[#34d399]">true</span>
            </li>
          ))}
          <li>
            session = <span className="text-white">{device.session ? 'active' : '—'}</span>
          </li>
          <li>
            notification permission = <span className="text-white">{permLabel}</span>
          </li>
        </ul>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Onboarding shows once, on the first launch after install.</li>
          <li>Skip skips the intro slides. Setup (name, goal, level, days) is required.</li>
          <li>Explain reminders before asking for notification permission.</li>
          <li>Text must stay readable with the largest text sizes.</li>
        </ul>
      </div>
    </div>
  );
}
