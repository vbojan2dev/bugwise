import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

/**
 * Exercise for "How QA Hiring Works": match moments from a real hiring process to the stage
 * they usually belong to, then read what that moment is really checking.
 * Some moments fit more than one stage (processes vary), so `accept` can list several.
 */

type Stage = 'apply' | 'recruiter' | 'technical' | 'practical' | 'team' | 'offer';

const stages: { key: Stage; label: string }[] = [
  { key: 'apply', label: 'Application' },
  { key: 'recruiter', label: 'Recruiter call' },
  { key: 'technical', label: 'Technical' },
  { key: 'practical', label: 'Practical task' },
  { key: 'team', label: 'Team fit' },
  { key: 'offer', label: 'Offer' },
];
const labelOf = (s: Stage) => stages.find((x) => x.key === s)!.label;

const moments: { text: string; accept: Stage[]; checks: string }[] = [
  {
    text: 'Software scans your CV for words like "test cases", "Jira" and "mobile" before any person reads it.',
    accept: ['apply'],
    checks: 'Whether your CV matches the job ad closely enough to reach a human. Use the words from the ad that are true for you.',
  },
  {
    text: 'A 20-minute call: Why this job? When could you start? Are you OK with hybrid work? What salary range do you have in mind?',
    accept: ['recruiter'],
    checks: 'Motivation, communication, logistics and whether expectations roughly match. Clear, friendly answers matter more than technical depth.',
  },
  {
    text: '"What is the difference between severity and priority? Give an example where they differ."',
    accept: ['technical'],
    checks: 'That you understand core testing ideas well enough to explain them in your own words, with a concrete example.',
  },
  {
    text: 'You get a link to a staging website and 48 hours to send bug reports and a short summary.',
    accept: ['practical'],
    checks: 'How you actually work: scoping, prioritizing, writing clear reproducible bugs and communicating what you did and did not test.',
  },
  {
    text: '"Share your screen and test this login page. Please think aloud while you do it."',
    accept: ['practical', 'technical'],
    checks: 'Your thinking process more than the bugs you find: do you start with the important paths, ask questions and cover negative cases?',
  },
  {
    text: '"Tell me about a time you disagreed with a colleague. What happened?"',
    accept: ['team', 'recruiter', 'technical'],
    checks: 'How you handle conflict and feedback. Behavioral questions can come up at almost any stage, most often in the team or manager round.',
  },
  {
    text: 'You meet two developers and the product owner you would work with day to day.',
    accept: ['team'],
    checks: 'Collaboration and communication, and whether you would enjoy working together. It is also your chance to judge them.',
  },
  {
    text: 'You receive salary, start date, probation period and benefits in writing.',
    accept: ['offer'],
    checks: 'Nothing about you anymore: now you check the details, ask questions and, if it makes sense, negotiate politely.',
  },
];

const btnBase =
  'inline-flex min-w-0 items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

export default function StageMatcher() {
  const [picks, setPicks] = useState<(Stage | null)[]>(() => moments.map(() => null));
  const answered = picks.filter(Boolean).length;
  const score = picks.filter((p, i) => p && moments[i].accept.includes(p)).length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Which stage is this?</p>
          <p className="text-sm text-muted">Eight moments from a typical QA hiring process. Pick the stage each one usually happens in.</p>
        </div>
        <button
          type="button"
          onClick={() => setPicks(moments.map(() => null))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>
      <ol className="space-y-2.5 p-5">
        {moments.map((m, i) => {
          const pick = picks[i];
          const ok = pick ? m.accept.includes(pick) : false;
          return (
            <li key={i} className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
              <p className="text-sm break-words text-fg">
                <span className="font-semibold">{i + 1}.</span> {m.text}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3" role="group" aria-label={`Moment ${i + 1}: choose a stage`}>
                {stages.map((s) => {
                  const isPick = pick === s.key;
                  const isAnswer = m.accept.includes(s.key);
                  let cls = 'border-line bg-surface text-muted hover:text-fg';
                  if (pick && isPick && isAnswer) cls = 'border-ok bg-ok-soft text-fg';
                  else if (pick && isPick) cls = 'border-danger bg-danger-soft text-fg';
                  else if (pick && !ok && s.key === m.accept[0]) cls = 'border-ok bg-surface text-fg';
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={isPick}
                      onClick={() => setPicks((prev) => prev.map((p, n) => (n === i ? s.key : p)))}
                      className={`${btnBase} ${cls}`}
                    >
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {pick && (
                  <p className="mt-2 flex gap-1.5 text-sm text-fg">
                    {ok ? (
                      <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Correct" />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Not usually" />
                    )}
                    <span className="min-w-0">
                      {!ok && <strong>Usually: {labelOf(m.accept[0])}. </strong>}
                      {ok && m.accept.length > 1 && <strong>Yes, it can be here. </strong>}
                      <span className="text-muted">What it checks:</span> {m.checks}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="border-t border-line px-5 py-3 text-sm text-muted" aria-live="polite">
        {answered < moments.length
          ? `${answered} / ${moments.length} answered.`
          : `${score} of ${moments.length} matched. ${
              score === moments.length
                ? 'You know the map. Now you can prepare for each stage on purpose.'
                : 'Processes vary by company, so do not worry about exact labels. Focus on what each moment is checking.'
            }`}
      </p>
    </div>
  );
}
