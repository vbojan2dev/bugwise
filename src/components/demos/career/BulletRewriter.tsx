import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';

/**
 * Exercise for "A QA CV and Portfolio Without Experience": for each weak CV line, pick the best rewrite.
 * Each round has one honest-and-specific option, one vague option and one overstated option.
 */

type Kind = 'good' | 'vague' | 'overstated';

const rounds: { before: string; context: string; options: { text: string; kind: Kind; why: string }[] }[] = [
  {
    before: 'Customer support agent, 2022–2025.',
    context: 'Support job at a mobile banking app.',
    options: [
      {
        text: 'Customer-oriented team player with excellent communication and problem-solving skills.',
        kind: 'vague',
        why: 'Anyone can write this, so recruiters skip it. It names no action, no tool and no result.',
      },
      {
        text: 'Reproduced customer-reported app problems, wrote step-by-step tickets for the dev team in Jira and confirmed fixes with customers.',
        kind: 'good',
        why: 'Real testing work in plain words: reproducing, writing steps, using Jira, checking fixes. Only write it if it is what you actually did.',
      },
      {
        text: 'Performed QA for the mobile banking app as part of the support team.',
        kind: 'overstated',
        why: '"Performed QA" suggests a testing role you did not have. An interviewer will ask about test plans and regression, and the story falls apart.',
      },
    ],
  },
  {
    before: 'Completed an online software testing course.',
    context: 'You finished Bugwise, including the Capstone.',
    options: [
      {
        text: '1 year of experience testing food delivery apps.',
        kind: 'overstated',
        why: 'This is simply untrue. A practice project is not a year of work experience, and background checks or one follow-up question will show it.',
      },
      {
        text: 'Familiar with software testing concepts.',
        kind: 'vague',
        why: 'Too weak to stand out. It hides the real work you did in the project.',
      },
      {
        text: 'Practice project (Bugwise Capstone): planned and tested a food delivery app release; wrote a one-page risk-based test plan, test cases and bug reports, and a go/no-go summary.',
        kind: 'good',
        why: 'Clearly labeled as a practice project, and it lists concrete deliverables an interviewer can ask about. Add your own numbers only if they are true.',
      },
    ],
  },
  {
    before: 'Skills: Selenium, Cypress, Appium, Java, Python, JMeter, SQL, Postman, Jira',
    context: 'You have used Jira and Postman, written a few SQL SELECT queries, and watched one Selenium video.',
    options: [
      {
        text: 'Manual testing (web and mobile), test cases, bug reports in Jira, exploratory testing, basic API testing with Postman, basic SQL (SELECT, WHERE, JOIN).',
        kind: 'good',
        why: 'All true, full of the keywords recruiters search for, and honest about levels with the word "basic".',
      },
      {
        text: 'Keep the list as it is: more keywords means more interviews.',
        kind: 'overstated',
        why: 'It might pass a keyword filter, but a technical interviewer will ask about Selenium or JMeter and the interview is over. List tools you could talk about for two minutes.',
      },
      {
        text: 'Skills: testing, computers, Microsoft Office.',
        kind: 'vague',
        why: 'Too generic for software filters and for people. Name the testing activities and tools you actually used.',
      },
    ],
  },
  {
    before: 'Primary school teacher.',
    context: 'Six years of teaching, including preparing tests and grading.',
    options: [
      {
        text: 'Responsible for quality assurance of education.',
        kind: 'overstated',
        why: 'It borrows the words "quality assurance" to sound like testing. Recruiters notice this, and it makes you look less trustworthy, not more.',
      },
      {
        text: 'Wrote and reviewed tests and worksheets for 120 students a year, catching unclear or wrong questions before they were used; explained complex topics in simple words to children and parents.',
        kind: 'good',
        why: 'Reviewing for mistakes and explaining clearly are real tester skills. The example is concrete and true, and it does not pretend to be a testing job.',
      },
      {
        text: 'Good with people and patient.',
        kind: 'vague',
        why: 'Nice, but impossible to check and the same as every other CV. Show it with an example instead.',
      },
    ],
  },
  {
    before: 'Beta tester.',
    context: 'You joined two public beta programs (one through TestFlight) and sent feedback.',
    options: [
      {
        text: 'Joined public beta programs for two mobile apps (iOS via TestFlight, Android via Google Play testing); reported 9 issues with steps and screenshots, 3 confirmed and fixed.',
        kind: 'good',
        why: 'Specific, checkable and honest about the setting. Bring a sample report to the interview. Use your real numbers, never invented ones.',
      },
      {
        text: 'QA Engineer (freelance), 2025–present.',
        kind: 'overstated',
        why: 'A job title you never held. Unpaid beta feedback is valuable, but call it what it is.',
      },
      {
        text: 'Tested many apps.',
        kind: 'vague',
        why: 'No numbers, no platforms, no outcome. The reader cannot tell what you can do.',
      },
    ],
  },
];

export default function BulletRewriter() {
  const [picks, setPicks] = useState<(number | null)[]>(() => rounds.map(() => null));
  const answered = picks.filter((p) => p !== null).length;
  const score = picks.filter((p, i) => p !== null && rounds[i].options[p].kind === 'good').length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Rewrite the CV line</p>
          <p className="text-sm text-muted">Each weak line has three rewrites: one honest and specific, one vague, one overstated. Pick the one you would send.</p>
        </div>
        <button
          type="button"
          onClick={() => setPicks(rounds.map(() => null))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>
      <ol className="space-y-4 p-5">
        {rounds.map((r, i) => {
          const pick = picks[i];
          return (
            <li key={i} className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Before</p>
              <p className="mt-0.5 text-sm break-words text-fg line-through decoration-danger/60">{r.before}</p>
              <p className="mt-1 text-xs text-muted">{r.context}</p>
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold tracking-wide text-faint uppercase">
                <ArrowRight size={12} aria-hidden="true" /> After: pick one
              </p>
              <div className="mt-1.5 space-y-1.5" role="group" aria-label={`Line ${i + 1}: choose a rewrite`}>
                {r.options.map((o, n) => {
                  const isPick = pick === n;
                  let cls = 'border-line bg-surface hover:border-line-strong';
                  if (pick !== null && o.kind === 'good') cls = 'border-ok bg-ok-soft';
                  else if (isPick) cls = 'border-danger bg-danger-soft';
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={isPick}
                      onClick={() => setPicks((prev) => prev.map((p, k) => (k === i ? n : p)))}
                      className={`block w-full min-w-0 rounded-xl border px-3 py-2 text-left text-sm break-words text-fg transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${cls}`}
                    >
                      {o.text}
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {pick !== null && (
                  <p className="mt-2 flex gap-1.5 text-sm text-fg">
                    {r.options[pick].kind === 'good' ? (
                      <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Good choice" />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Not this one" />
                    )}
                    <span className="min-w-0">
                      <strong>
                        {r.options[pick].kind === 'good' ? 'Honest and specific. ' : r.options[pick].kind === 'vague' ? 'Too vague. ' : 'Overstated. '}
                      </strong>
                      {r.options[pick].why}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="border-t border-line px-5 py-3 text-sm text-muted" aria-live="polite">
        {answered < rounds.length
          ? `${answered} / ${rounds.length} lines rewritten.`
          : `${score} of ${rounds.length} honest and specific picks. ${
              score === rounds.length
                ? 'The pattern: action + tool or method + result, and never a claim you could not defend in an interview.'
                : 'The pattern to aim for: action + tool or method + result, and never a claim you could not defend in an interview.'
            }`}
      </p>
    </div>
  );
}
