import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

/** Interactive bug life cycle: click a status to see what it means and who acts on it. */

type State = { id: string; label: string; who: string; text: string; tone: 'main' | 'loop' | 'end' | 'side' };

const main: State[] = [
  { id: 'new', label: 'New', who: 'Tester', tone: 'main', text: 'You just filed the report. Nobody has looked at it yet. A lead or triage meeting will review it, check it is not a duplicate, and set priority.' },
  { id: 'assigned', label: 'Assigned', who: 'Lead / triage', tone: 'main', text: 'The bug is accepted as valid and given to a developer. This is the moment your report gets read closely, so clear steps pay off here.' },
  { id: 'progress', label: 'In progress', who: 'Developer', tone: 'main', text: 'The developer is reproducing the bug, finding the cause and writing a fix. They may comment with questions. Answer quickly.' },
  { id: 'fixed', label: 'Fixed', who: 'Developer', tone: 'main', text: 'The code change is done and merged. It is not verified yet. "Fixed" means "the developer thinks it is fixed".' },
  { id: 'retest', label: 'Ready for test', who: 'Tester', tone: 'main', text: 'A new build with the fix is ready. You repeat the original steps on the same environment, and also check nearby features for regressions.' },
  { id: 'closed', label: 'Closed', who: 'Tester', tone: 'end', text: 'The retest passed: the bug no longer happens. Note the build you verified on, for example "Verified in 4.12.1 (build 815) on iPhone 15, iOS 18.0.1".' },
];

const reopened: State = {
  id: 'reopened',
  label: 'Reopened',
  who: 'Tester',
  tone: 'loop',
  text: 'The retest failed: the bug still happens (or came back later). Add a comment with the build you tested and fresh evidence. The bug goes back to the developer.',
};

const side: State[] = [
  { id: 'rejected', label: 'Rejected', who: 'Lead / developer', tone: 'side', text: 'Not a bug: the app works as designed, or the report is based on a misunderstanding. Read the reason; if you still disagree, point to the requirement.' },
  { id: 'duplicate', label: 'Duplicate', who: 'Lead / developer', tone: 'side', text: 'The same bug is already reported. Your ticket is linked to the original and closed. Search before filing to avoid this.' },
  { id: 'wontfix', label: "Won't fix", who: 'Product owner', tone: 'side', text: 'It is a real bug, but the team decided not to fix it: too rare, too costly, or the feature is being removed. That is a business decision, not a judgment of your report.' },
  { id: 'cannot', label: 'Cannot reproduce', who: 'Developer', tone: 'side', text: 'The developer followed your steps and did not see the bug. Usually means a missing detail: device, OS, account state, data. Try again and add what was missing.' },
];

const all = [...main, reopened, ...side];

const toneClass: Record<State['tone'], string> = {
  main: 'border-line bg-surface text-fg',
  end: 'border-ok/40 bg-ok-soft text-fg',
  loop: 'border-warn/40 bg-warn-soft text-fg',
  side: 'border-line bg-subtle text-muted',
};

export default function LifeCycle() {
  const [sel, setSel] = useState('new');
  const current = all.find((s) => s.id === sel)!;

  const btn = (s: State) => (
    <button
      key={s.id}
      type="button"
      onClick={() => setSel(s.id)}
      aria-pressed={sel === s.id}
      className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${toneClass[s.tone]} ${
        sel === s.id ? 'shadow-[0_0_0_2px_var(--brand)]' : 'hover:shadow-[0_0_0_1px_var(--line-strong)]'
      }`}
    >
      {s.label}
    </button>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">Bug life cycle</p>
        <p className="text-sm text-muted">Click a status to see what it means and who moves the bug on.</p>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Happy path</p>
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {main.map((s, i) => (
              <li key={s.id} className="flex items-center gap-1.5">
                {btn(s)}
                {i < main.length - 1 ? <ArrowRight size={15} className="text-faint" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <RotateCcw size={15} className="text-warn" aria-hidden="true" />
          <span>Retest fails?</span>
          {btn(reopened)}
          <span>then back to Assigned.</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Other ways a bug can end</p>
          <div className="flex flex-wrap gap-2">
            {side.map((s) => (
              btn(s)
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-subtle p-4" aria-live="polite">
          <p className="flex flex-wrap items-baseline gap-x-2 font-semibold text-fg">
            {current.label}
            <span className="text-xs font-medium text-muted">Owner: {current.who}</span>
          </p>
          <p className="mt-1 text-sm text-fg">{current.text}</p>
        </div>
      </div>
    </div>
  );
}
