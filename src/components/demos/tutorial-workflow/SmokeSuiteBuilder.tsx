import { useState } from 'react';
import { CircleAlert, CircleCheck, Clock, Flame, ListChecks, RotateCcw, Sparkles } from 'lucide-react';

/**
 * "Build the smoke suite" exercise.
 * The learner picks up to 10 checks out of 30 candidates for a food delivery app release,
 * within a 25-minute budget. Feedback: which critical journeys are covered, time used,
 * and per-check notes on picks that belong in the regression suite instead.
 */

const MAX_PICKS = 10;
const BUDGET = 25;

type JourneyId = 'launch' | 'signin' | 'address' | 'find' | 'cart' | 'pay' | 'track';

const journeys: { id: JourneyId; label: string }[] = [
  { id: 'launch', label: 'App starts' },
  { id: 'signin', label: 'Sign in' },
  { id: 'address', label: 'Delivery address' },
  { id: 'find', label: 'Find food' },
  { id: 'cart', label: 'Build a cart' },
  { id: 'pay', label: 'Pay and place order' },
  { id: 'track', label: 'Track the order' },
];

type Value = 'core' | 'ok' | 'low';

type Candidate = {
  id: number;
  text: string;
  minutes: number;
  journey: JourneyId | null;
  value: Value;
  why: string;
};

const candidates: Candidate[] = [
  { id: 1, text: 'App cold-starts to the Home screen without crashing', minutes: 1, journey: 'launch', value: 'core', why: 'If the app does not even open, nothing else can be tested. Classic smoke check.' },
  { id: 2, text: 'Sign in with an existing email and password', minutes: 2, journey: 'signin', value: 'core', why: 'Almost every journey needs a signed-in user. Cheap and critical.' },
  { id: 3, text: 'Sign in with Apple or Google', minutes: 3, journey: 'signin', value: 'ok', why: 'Important, but one sign-in method proves the build is testable. Keep this in regression.' },
  { id: 4, text: 'Password reset email arrives and the link works', minutes: 4, journey: null, value: 'low', why: 'Slow (waiting for email) and not on the main path. Regression suite.' },
  { id: 5, text: 'Account locks after 5 wrong passwords', minutes: 4, journey: null, value: 'low', why: 'A negative edge case. Valuable in regression, too detailed for smoke.' },
  { id: 6, text: 'Choose a saved delivery address', minutes: 2, journey: 'address', value: 'core', why: 'Without an address there are no restaurants and no order. Critical journey step.' },
  { id: 7, text: 'Add a new address by dropping a map pin', minutes: 4, journey: 'address', value: 'ok', why: 'Useful, but the saved address already proves the address step works. Regression.' },
  { id: 8, text: 'Address outside the delivery zone shows a message', minutes: 3, journey: null, value: 'low', why: 'Negative case. Belongs in regression, not in a "can we test this build?" check.' },
  { id: 9, text: 'Home lists restaurants near the address', minutes: 1, journey: 'find', value: 'core', why: 'The first thing every customer sees. One minute, huge signal.' },
  { id: 10, text: 'Search "pizza" returns matching restaurants', minutes: 2, journey: 'find', value: 'core', why: 'Search is a main entry point and depends on the backend. Good smoke check.' },
  { id: 11, text: 'Combine "Free delivery" filter with sort by rating', minutes: 5, journey: null, value: 'low', why: 'Filter combinations are deep functional testing. Regression suite.' },
  { id: 12, text: 'Restaurant menu opens with prices', minutes: 1, journey: 'find', value: 'core', why: 'You cannot order without a menu. Fast and critical.' },
  { id: 13, text: 'Add an item; the cart badge shows 1', minutes: 2, journey: 'cart', value: 'core', why: 'The core cart action. If it fails, checkout is unreachable.' },
  { id: 14, text: 'Add an item with required options (size, extras)', minutes: 3, journey: 'cart', value: 'ok', why: 'A deeper cart variant. Fine if you have time, otherwise regression.' },
  { id: 15, text: 'Change quantity in the cart; total updates', minutes: 2, journey: 'cart', value: 'ok', why: 'Good regression check. The basic add-to-cart already proves the cart works.' },
  { id: 16, text: 'Warning when adding from a second restaurant', minutes: 3, journey: null, value: 'low', why: 'An edge case of the cart. Regression suite.' },
  { id: 17, text: 'Cart is kept after the app is restarted', minutes: 3, journey: null, value: 'low', why: 'State persistence is worth testing, but in regression, not smoke.' },
  { id: 18, text: 'Place an order with a saved test card', minutes: 3, journey: 'pay', value: 'core', why: 'The money step. A release that cannot take orders is not testable, let alone shippable.' },
  { id: 19, text: 'Pay with Apple Pay or Google Pay', minutes: 3, journey: 'pay', value: 'ok', why: 'A second payment method. Many teams add it to smoke if most customers use it; otherwise regression.' },
  { id: 20, text: 'Apply a valid promo code', minutes: 2, journey: null, value: 'ok', why: 'Common, but not needed to prove the build works. Regression (or smoke during a big campaign).' },
  { id: 21, text: 'Expired promo code shows the right error text', minutes: 2, journey: null, value: 'low', why: 'Negative case with exact wording. Regression.' },
  { id: 22, text: 'Declined card shows an error and no order is created', minutes: 3, journey: null, value: 'ok', why: 'Very important, but it is a negative case. Keep it as a P1 regression check.' },
  { id: 23, text: '3-D Secure challenge completes', minutes: 4, journey: null, value: 'ok', why: 'Slow and provider-dependent. Regression, or smoke right after a payment change.' },
  { id: 24, text: 'New order shows status "Preparing"', minutes: 2, journey: 'track', value: 'core', why: 'Confirms the order actually reached the backend and the tracking screen works.' },
  { id: 25, text: 'Push notification when the courier picks up', minutes: 4, journey: null, value: 'ok', why: 'Takes waiting and setup. Regression suite.' },
  { id: 26, text: 'Courier position moves on the map', minutes: 3, journey: 'track', value: 'ok', why: 'Covers tracking too, but slower than checking the order status. Regression.' },
  { id: 27, text: 'Rate the courier after delivery', minutes: 3, journey: null, value: 'low', why: 'Happens after the main journey. Regression.' },
  { id: 28, text: 'About screen shows the new version number', minutes: 1, journey: null, value: 'low', why: 'Tells you nothing about whether the app works. Many testers glance at it anyway to confirm the build, but it is not a smoke check.' },
  { id: 29, text: 'Dark mode colors on the Settings screen', minutes: 2, journey: null, value: 'low', why: 'Cosmetic. Regression or a visual check.' },
  { id: 30, text: 'Switch the app language to German', minutes: 4, journey: null, value: 'low', why: 'Important for localization, but slow and not on the critical path. Regression.' },
];

const modelAnswer = [1, 2, 6, 9, 10, 12, 13, 18, 24];

export default function SmokeSuiteBuilder() {
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState('');

  const pickedItems = candidates.filter((c) => picked.includes(c.id));
  const used = pickedItems.reduce((s, c) => s + c.minutes, 0);
  const overBudget = used > BUDGET;
  const covered = new Set(pickedItems.map((c) => c.journey).filter(Boolean) as JourneyId[]);

  function toggle(id: number) {
    setChecked(false);
    setPicked((prev) => {
      if (prev.includes(id)) {
        setNotice('');
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_PICKS) {
        setNotice(`A smoke suite should stay small. You already have ${MAX_PICKS} checks: remove one first.`);
        return prev;
      }
      setNotice('');
      return [...prev, id];
    });
  }

  const lowPicks = pickedItems.filter((c) => c.value === 'low');
  const okPicks = pickedItems.filter((c) => c.value === 'ok');
  const missing = journeys.filter((j) => !covered.has(j.id));
  const perfect = missing.length === 0 && !overBudget && lowPicks.length === 0;

  return (
    <div className="not-prose my-8 overflow-clip rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Flame size={17} className="text-brand" aria-hidden="true" /> Build the smoke suite
        </p>
        <p className="text-sm text-muted">
          QuickBite 3.8.0 just landed on staging. Pick at most {MAX_PICKS} checks that fit in {BUDGET} minutes and answer: is this build testable?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 border-line p-4 lg:border-r">
          <p className={`sticky top-[4.5rem] z-10 mb-2 rounded-full border border-line bg-surface/95 px-3 py-1 text-center text-xs tabular-nums shadow-sm backdrop-blur lg:hidden ${overBudget ? 'font-semibold text-danger' : 'text-muted'}`} aria-hidden="true">
            {used} / {BUDGET} min · {picked.length} / {MAX_PICKS} checks · {covered.size}/{journeys.length} journeys
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-label="Candidate checks">
            {candidates.map((c) => {
              const on = picked.includes(c.id);
              const verdict = checked && on ? c.value : null;
              return (
                <li key={c.id} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(c.id)}
                    className={`flex h-full w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                      on ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-surface text-fg hover:bg-subtle'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                        on ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words">{c.text}</span>
                      {verdict && (
                        <span className={`mt-1 block text-xs ${verdict === 'core' ? 'text-ok' : verdict === 'ok' ? 'text-warn' : 'text-danger'}`}>
                          {verdict === 'core' ? 'Great smoke check. ' : verdict === 'ok' ? 'Debatable. ' : 'Not smoke. '}
                          <span className="text-muted">{c.why}</span>
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-faint tabular-nums">{c.minutes}m</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 space-y-4 border-t border-line bg-subtle p-4 lg:border-t-0">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <Clock size={13} aria-hidden="true" /> Time budget
            </p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true">
              <div className={`h-full rounded-full ${overBudget ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${Math.min(100, (used / BUDGET) * 100)}%` }} />
            </div>
            <p className={`mt-1 text-sm tabular-nums ${overBudget ? 'font-semibold text-danger' : 'text-fg'}`} aria-live="polite">
              {used} / {BUDGET} min · {picked.length} / {MAX_PICKS} checks
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <ListChecks size={13} aria-hidden="true" /> Critical journeys
            </p>
            <ul className="mt-1.5 space-y-1">
              {journeys.map((j) => (
                <li key={j.id} className="flex items-center gap-2 text-sm text-fg">
                  {covered.has(j.id) ? (
                    <CircleCheck size={15} className="shrink-0 text-ok" aria-label="Covered" />
                  ) : (
                    <CircleAlert size={15} className="shrink-0 text-faint" aria-label="Not covered" />
                  )}
                  {j.label}
                </li>
              ))}
            </ul>
          </div>

          {notice && (
            <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-fg" role="status">
              {notice}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChecked(true)}
              disabled={picked.length === 0}
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
            >
              Check my suite
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked(modelAnswer);
                setChecked(true);
                setNotice('');
              }}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Sparkles size={14} aria-hidden="true" /> Model answer
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked([]);
                setChecked(false);
                setNotice('');
              }}
              aria-label="Reset"
              className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1.5 text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>
          </div>

          {checked && (
            <div className="space-y-2 rounded-xl border border-line bg-surface p-3 text-sm text-fg" role="status">
              <p className="font-semibold">
                {perfect ? 'Solid smoke suite.' : 'Feedback'} {covered.size}/{journeys.length} journeys, {used} min.
              </p>
              {missing.length > 0 && <p>Missing journeys: {missing.map((m) => m.label).join(', ')}. If one of these is broken, the build is not testable and your suite would not notice.</p>}
              {overBudget && <p>Over budget by {used - BUDGET} min. Smoke runs on every build, so every minute counts many times over.</p>}
              {lowPicks.length > 0 && <p>{lowPicks.length} check(s) marked red are regression material, not smoke. Swap them for a missing journey.</p>}
              {okPicks.length > 0 && missing.length === 0 && !overBudget && <p>The amber picks are fine if you have spare time; teams disagree on those.</p>}
              {perfect && <p className="text-muted">Every critical journey is touched once, quickly. Everything else waits for the regression run.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
