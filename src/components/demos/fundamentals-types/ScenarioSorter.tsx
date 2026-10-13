import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';

/** Scenario trainer: read a realistic situation, pick the testing type that fits best, get feedback on every option. */

interface Scenario {
  app: string;
  situation: string;
  options: { label: string; why: string }[];
  answer: number;
}

const scenarios: Scenario[] = [
  {
    app: 'Food delivery app',
    situation: 'A new build arrives 10 minutes before the sprint demo. You need to know quickly whether it is safe to show it at all.',
    options: [
      { label: 'Full regression testing', why: 'Too slow. A full regression run takes hours or days, and you have 10 minutes.' },
      { label: 'Smoke testing', why: 'Right. A smoke test runs the critical flows (open, log in, order) to decide if the build is stable enough to use.' },
      { label: 'Usability testing', why: 'Usability matters, but it will not tell you in 10 minutes whether the build crashes on login.' },
      { label: 'Performance testing', why: 'Speed is not the question here. You first need to know whether the basics work at all.' },
    ],
    answer: 1,
  },
  {
    app: 'Shopping website',
    situation: 'The developer marked BUG-207 "Coupon applies twice on double-click" as fixed in build 512.',
    options: [
      { label: 'Exploratory testing', why: 'Useful later around the coupon area, but the first job is to confirm this specific bug is gone.' },
      { label: 'Smoke testing', why: 'Smoke testing checks overall build health, not one specific fix.' },
      { label: 'Retesting (confirmation testing)', why: 'Right. You repeat the exact steps from BUG-207 on build 512 to confirm the fix. Then you look around for regressions.' },
      { label: 'Compatibility testing', why: 'Only relevant if the bug was browser-specific. First, repeat the original steps.' },
    ],
    answer: 2,
  },
  {
    app: 'Banking app',
    situation: 'The release candidate is ready after 3 weeks of changes by five developers. It ships to the stores on Monday.',
    options: [
      { label: 'Regression testing', why: 'Right. After many changes you re-check that everything that used to work still works: login, transfers, statements, notifications.' },
      { label: 'Retesting', why: 'Retesting confirms individual fixes. It does not cover the side effects of three weeks of changes.' },
      { label: 'Ad-hoc testing', why: 'Unplanned poking around is not enough evidence to release a banking app.' },
      { label: 'Sanity testing', why: 'Sanity checks one narrow area after a small change. Three weeks of changes need a broad regression run.' },
    ],
    answer: 0,
  },
  {
    app: 'Food delivery app',
    situation: 'A one-line fix changed how the delivery fee is rounded. Before spending a day on regression, the lead asks you to quickly check the fee and totals still look right.',
    options: [
      { label: 'Security testing', why: 'Nothing here touches access or data protection.' },
      { label: 'Localization testing', why: 'Only if the rounding differs by currency. The main question is whether the change works at all.' },
      { label: 'Installation testing', why: 'The change is in the fee logic, not in how the app installs or updates.' },
      { label: 'Sanity testing', why: 'Right (in the most common usage). A narrow, quick check of the changed area to decide if deeper testing is worth it.' },
    ],
    answer: 3,
  },
  {
    app: 'Restaurant app',
    situation: 'A brand-new "Split the bill" feature has just been built. There are no written test cases yet, and you have 90 minutes to find what breaks.',
    options: [
      { label: 'Regression testing', why: 'Regression checks old features. This feature is brand new.' },
      { label: 'Exploratory testing', why: 'Right. With a charter like "split odd amounts between people who leave the group" you learn and test at the same time.' },
      { label: 'Retesting', why: 'There is no bug fix to confirm yet.' },
      { label: 'Smoke testing', why: 'A smoke test only checks that the build is basically alive. You want to dig into the new feature.' },
    ],
    answer: 1,
  },
  {
    app: 'Travel booking website',
    situation: 'Marketing is launching the site in Germany and Japan next month.',
    options: [
      { label: 'Performance testing', why: 'Could matter for traffic, but the new risk is language, currency and date formats.' },
      { label: 'Localization testing', why: 'Right. Check translations, text that does not fit, euro and yen prices, date formats and Japanese characters in names.' },
      { label: 'Retesting', why: 'There is no specific fixed bug to confirm.' },
      { label: 'Interruption testing', why: 'Interruptions are not related to launching in new countries.' },
    ],
    answer: 1,
  },
  {
    app: 'Banking app',
    situation: 'A customer who is blind writes in: with VoiceOver on, they cannot tell which button sends money.',
    options: [
      { label: 'Usability testing', why: 'Close, but this is specifically about people using assistive technology. That has its own type and standard (WCAG).' },
      { label: 'Accessibility testing', why: 'Right. Test with VoiceOver and TalkBack: every control needs a clear label, and the order must make sense.' },
      { label: 'Compatibility testing', why: 'The app works on the device. The problem is that the screen reader gets no useful labels.' },
      { label: 'Smoke testing', why: 'A smoke test would not usually include a screen reader.' },
    ],
    answer: 1,
  },
  {
    app: 'Grocery app',
    situation: 'Version 4.0 moves saved addresses into a new database. Millions of people will update from 3.x.',
    options: [
      { label: 'Ad-hoc testing', why: 'Too risky to leave to chance. Upgrade paths need a deliberate plan.' },
      { label: 'Usability testing', why: 'Ease of use is not the main risk here. Losing customer data is.' },
      { label: 'Upgrade testing', why: 'Right. Install 3.x, add data, update to 4.0 and check that addresses, login and settings survive.' },
      { label: 'Negative testing', why: 'Negative tests feed in invalid input. The risk here is the data migration during the update.' },
    ],
    answer: 2,
  },
  {
    app: 'Fitness app',
    situation: 'Runners say the app sometimes loses a workout when a phone call comes in mid-run.',
    options: [
      { label: 'Interruption testing', why: 'Right. Start a run, then trigger a call, an alarm, a notification and screen lock, and check the workout keeps recording.' },
      { label: 'Localization testing', why: 'Language and region have nothing to do with incoming calls.' },
      { label: 'Security testing', why: 'Nothing here exposes data to the wrong person.' },
      { label: 'Smoke testing', why: 'A smoke test is too shallow to catch a problem that needs a call at the right moment.' },
    ],
    answer: 0,
  },
  {
    app: 'Shopping website',
    situation: 'Black Friday is coming and the team expects 20 times the normal traffic.',
    options: [
      { label: 'Exploratory testing', why: 'Exploring by hand cannot create thousands of shoppers at once.' },
      { label: 'Accessibility testing', why: 'Important, but it does not answer "will the site stay up under heavy traffic?".' },
      { label: 'Retesting', why: 'There is no fixed bug to confirm.' },
      { label: 'Load testing (a type of performance testing)', why: 'Right. Specialists simulate thousands of users with tools. Manual testers help by reporting slow pages and checking the site during the test.' },
    ],
    answer: 3,
  },
  {
    app: 'Banking app',
    situation: 'You are testing the "Send money" amount field. You try -50, 0, letters, and more than the account balance.',
    options: [
      { label: 'Positive testing', why: 'Positive tests use valid input. All of these inputs should be rejected.' },
      { label: 'Smoke testing', why: 'Smoke tests check the happy path of critical flows, not invalid input.' },
      { label: 'Upgrade testing', why: 'Nothing here involves updating the app.' },
      { label: 'Negative testing', why: 'Right. You feed invalid input and expect a clear, safe error and no money moved.' },
    ],
    answer: 3,
  },
  {
    app: 'Shopping website',
    situation: 'Analytics show 30% of shoppers use Safari on iPhone, but the team only tested in Chrome on laptops.',
    options: [
      { label: 'Retesting', why: 'There is no specific fix to confirm.' },
      { label: 'Sanity testing', why: 'Sanity checks a recent change. The gap here is browser coverage.' },
      { label: 'Compatibility (cross-browser) testing', why: 'Right. Test the key flows in the browsers and devices your users actually have, starting with Safari on iOS.' },
      { label: 'Security testing', why: 'The risk is layout and behavior differences between browsers, not data protection.' },
    ],
    answer: 2,
  },
];

export default function ScenarioSorter() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => scenarios.map(() => null));
  const done = index >= scenarios.length;
  const heading = useRef<HTMLParagraphElement>(null);
  const moved = useRef(false);
  // Move keyboard focus to the new scenario (or the results) after "Next", not on first render.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [index]);
  const score = picks.filter((p, i) => p === scenarios[i].answer).length;

  const restart = () => {
    setPicks(scenarios.map(() => null));
    moved.current = true;
    setIndex(0);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Scenario sorter: what would you run?</p>
          <p className="text-sm text-muted">Pick the testing type that fits best. Every option has an explanation.</p>
        </div>
        <p className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-muted">
          Score {score} / {scenarios.length}
        </p>
      </div>

      <div className="flex gap-1 px-5 pt-4" aria-hidden="true">
        {scenarios.map((s, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              picks[i] === null ? (i === index ? 'bg-brand' : 'bg-subtle') : picks[i] === s.answer ? 'bg-ok' : 'bg-danger'
            }`}
          />
        ))}
      </div>

      {done ? (
        <div className="space-y-4 p-5">
          <p ref={heading} tabIndex={-1} className="text-lg font-semibold text-fg focus:outline-none">
            You got {score} of {scenarios.length} right.
          </p>
          <p className="text-sm text-muted">
            {score >= 10
              ? 'Excellent. You can match the situation to the testing type like a working tester.'
              : score >= 7
                ? 'Good. Review the ones you missed below, then try again.'
                : 'A good start. Open the testing types map above, then try again.'}
          </p>
          <ul className="space-y-2">
            {scenarios.map((s, i) => (
              <li key={i} className="flex gap-2 rounded-xl border border-line bg-subtle p-3 text-sm">
                {picks[i] === s.answer ? <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <X size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
                <span className="min-w-0">
                  <span className="sr-only">{picks[i] === s.answer ? 'Correct: ' : 'Missed: '}</span>
                  <span className="text-fg">{s.situation}</span>
                  <span className="mt-0.5 block font-semibold text-fg">{s.options[s.answer].label}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} aria-hidden="true" /> Try again
          </button>
        </div>
      ) : (
        (() => {
          const s = scenarios[index];
          const pick = picks[index];
          const answered = pick !== null;
          return (
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">
                  Scenario {index + 1} of {scenarios.length} · {s.app}
                </p>
                <p ref={heading} tabIndex={-1} className="mt-1.5 text-base font-medium text-fg focus:outline-none">
                  {s.situation}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Choose a testing type">
                {s.options.map((o, i) => {
                  const isAnswer = i === s.answer;
                  const isPick = i === pick;
                  let cls = 'border-line bg-surface text-fg hover:border-line-strong';
                  if (answered && isAnswer) cls = 'border-ok bg-ok-soft text-fg';
                  else if (answered && isPick) cls = 'border-danger bg-danger-soft text-fg';
                  else if (answered) cls = 'border-line bg-surface text-muted';
                  return (
                    <button
                      key={o.label}
                      type="button"
                      aria-disabled={answered}
                      aria-pressed={isPick}
                      onClick={() => setPicks((prev) => (prev[index] !== null ? prev : prev.map((p, n) => (n === index ? i : p))))}
                      className={`min-w-0 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${answered ? 'cursor-default' : ''} ${cls}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {answered && (
                  <div className="space-y-2">
                    <p className={`flex items-center gap-1.5 font-semibold ${pick === s.answer ? 'text-ok' : 'text-danger'}`}>
                      {pick === s.answer ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
                      {pick === s.answer ? 'Correct' : `Not quite. Best fit: ${s.options[s.answer].label}`}
                    </p>
                    <ul className="space-y-1.5 rounded-2xl border border-line bg-subtle p-3.5 text-sm">
                      {s.options.map((o, i) => (
                        <li key={o.label} className={i === s.answer ? 'text-fg' : 'text-muted'}>
                          <strong className={i === s.answer ? 'text-ok' : 'text-fg'}>{o.label}:</strong> {o.why}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        moved.current = true;
                        setIndex((prev) => Math.min(prev + 1, scenarios.length));
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {index === scenarios.length - 1 ? 'See results' : 'Next scenario'} <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
