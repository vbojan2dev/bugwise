import { BookmarkCheck, ListChecks, User, Target, Sparkles } from 'lucide-react';

/** Static anatomy of a user story ticket: the three parts of the story plus its acceptance criteria. */

const parts = [
  { icon: User, label: 'As a…', text: 'runner using the FitTrack app', note: 'WHO: a real type of user, not "the system" or "the developer".' },
  { icon: Target, label: 'I want…', text: 'to pause my workout', note: 'WHAT: the goal in the user’s words. No buttons, screens or tech yet.' },
  { icon: Sparkles, label: 'so that…', text: 'a red traffic light doesn’t ruin my pace and time', note: 'WHY: the value. It tells you what “working” really means to the user.' },
];

const criteria = [
  'Tapping Pause stops the timer and the distance within 1 second.',
  'Paused time is not counted in moving time or average pace.',
  'Resume continues from the exact time and distance where I paused.',
  'A workout paused for 60 minutes is saved and ended automatically.',
];

export default function StoryAnatomy() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle px-5 py-3">
        <BookmarkCheck size={16} className="text-brand" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold text-muted">FIT-482</span>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Story</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">Pause a workout</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">3 points</span>
      </div>
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div className="min-w-0 space-y-3 p-5">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">The story (the conversation starter)</p>
          {parts.map((p) => (
            <div key={p.label} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <p.icon size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-fg">
                  <strong>{p.label}</strong> {p.text}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{p.note}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="min-w-0 border-t border-line p-5 md:border-t-0 md:border-l">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <ListChecks size={14} aria-hidden="true" /> Acceptance criteria (the rules)
          </p>
          <ol className="mt-3 space-y-2">
            {criteria.map((c, i) => (
              <li key={c} className="flex gap-2.5 rounded-xl border border-line bg-subtle px-3 py-2 text-sm text-fg">
                <span className="font-mono text-xs font-semibold text-brand">AC{i + 1}</span>
                <span className="min-w-0">{c}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Each rule can only pass or fail. That is what makes it <strong className="text-fg">testable</strong>, and it is exactly what you turn into test cases.
          </p>
        </div>
      </div>
      <figcaption className="sr-only">Anatomy of a user story: who, what and why, followed by four testable acceptance criteria.</figcaption>
    </figure>
  );
}
