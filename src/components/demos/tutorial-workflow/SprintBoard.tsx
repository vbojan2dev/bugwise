import { useEffect, useId, useRef, useState } from 'react';
import { CircleCheck, Circle, Link2, MessageSquare, Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import BugTicketForm, { type BugDraft } from './BugTicketForm';
import { Avatar, MockWindow, PriorityIcon, STATUSES, TypeIcon, type PersonId, type Priority, type Status } from './mockTracker';

/**
 * Sprint board exercise (simplified Jira-like mock).
 * Story SHOP-142 sits in "In Testing". The learner finds a bug, creates it with the form,
 * links it, moves it through the workflow (playing the developer too), retests, and closes the story.
 * Team rules enforced by the mock: a story can't be Done while a blocking bug is open,
 * and a bug can't be Done without passing a retest in "In Testing".
 */

type Card = {
  key: string;
  type: 'Story' | 'Bug';
  summary: string;
  status: Status;
  priority: Priority;
  assignee: PersonId | null;
  link?: string;
};

type Log = { who: string; text: string; tone?: 'ok' | 'warn' | 'info' };

const STORY: Card = { key: 'SHOP-142', type: 'Story', summary: 'Add a tip for the courier at checkout', status: 'In Testing', priority: 'High', assignee: 'mia' };

const startLog: Log[] = [
  { who: 'Luka Petrov', text: 'Moved SHOP-142 to In Testing. Ready on staging, build 409. @Mia Novak over to you!', tone: 'info' },
];

export default function SprintBoard() {
  const uid = useId();
  const [story, setStory] = useState<Card>(STORY);
  const [bug, setBug] = useState<Card | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [log, setLog] = useState<Log[]>(startLog);
  const [reopened, setReopened] = useState(0);
  const [fixedOnce, setFixedOnce] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);
  /** Each reopen means another fix in a newer build. */
  const build = 412 + reopened;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  const add = (...entries: Log[]) => setLog((prev) => [...prev, ...entries]);

  function reset() {
    setStory(STORY);
    setBug(null);
    setFormOpen(false);
    setLog(startLog);
    setReopened(0);
    setFixedOnce(false);
  }

  function create(d: BugDraft) {
    setBug({ key: 'SHOP-150', type: 'Bug', summary: d.summary.trim(), status: 'To Do', priority: d.priority, assignee: 'luka', link: d.linkType });
    setFormOpen(false);
    add(
      { who: 'You', text: `Created SHOP-150 and linked it: SHOP-150 ${d.linkType} SHOP-142. Assigned to Luka (the developer of the story).`, tone: 'ok' },
      { who: 'Luka Petrov', text: 'Thanks for the clear steps and the video, I can reproduce it. Picking it up.', tone: 'info' },
    );
  }

  function moveStory(to: Status) {
    if (to === story.status) return;
    if (to === 'Done') {
      if (!bug) {
        add({ who: 'Tracker', text: 'Not so fast: while testing you found that a custom tip is not added to the total. Report it first with "Create bug".', tone: 'warn' });
        return;
      }
      if (bug.status !== 'Done') {
        add({ who: 'Tracker', text: `Team rule: SHOP-142 cannot be Done while ${bug.key} (${bug.link}) is still open. Get the bug fixed and retested first.`, tone: 'warn' });
        return;
      }
      setStory((s) => ({ ...s, status: 'Done' }));
      add({ who: 'You', text: `Retested the whole story on build ${build}: preset tips, custom tip, no tip, and the total. All acceptance criteria pass. Moved SHOP-142 to Done.`, tone: 'ok' });
      return;
    }
    setStory((s) => ({ ...s, status: to }));
    add({ who: 'Tracker', text: `SHOP-142 moved to ${to}. In real teams developers usually move stories until In Testing; testers move them on from there. Some teams send a story back instead of raising bugs, so ask what yours prefers.`, tone: 'info' });
  }

  function moveBug(to: Status) {
    if (!bug || to === bug.status) return;
    const from = bug.status;
    if (to === 'Done') {
      if (from !== 'In Testing') {
        add({ who: 'Tracker', text: 'A bug should not be closed until a tester has retested it on a build that contains the fix. Move it through In Review and In Testing first.', tone: 'warn' });
        return;
      }
      passRetest();
      return;
    }
    if (to === 'In Testing' && (from === 'To Do' || from === 'In Progress')) {
      add({ who: 'Tracker', text: 'Nothing to retest yet: the fix has not been written and reviewed. (You are playing the developer here: move it to In Progress, then In Review.)', tone: 'warn' });
      return;
    }
    setBug((b) => (b ? { ...b, status: to } : b));
    if (to === 'In Progress') add({ who: 'Luka Petrov', text: 'Found it: the custom tip was saved but not included when the total is recalculated. Working on a fix.', tone: 'info' });
    else if (to === 'In Review') add({ who: 'Luka Petrov', text: 'Fix is in code review.', tone: 'info' });
    else if (to === 'In Testing') {
      setFixedOnce(true);
      add({ who: 'Luka Petrov', text: `@Mia Novak fixed in build ${build} on staging, ready for retest.`, tone: 'info' });
    } else if (to === 'To Do') add({ who: 'Tracker', text: 'SHOP-150 moved back to To Do.', tone: 'info' });
  }

  function passRetest() {
    setBug((b) => (b ? { ...b, status: 'Done' } : b));
    add({ who: 'You', text: `Retested on Pixel 8, Android 15, build ${build}: custom tip €2.50 now gives total €23.40${reopened > 0 ? ', also after rotating' : ''}. Checked preset tips and no tip too. Fixed, closing.`, tone: 'ok' });
  }

  function failRetest() {
    setBug((b) => (b ? { ...b, status: 'To Do' } : b));
    setReopened((n) => n + 1);
    add({
      who: 'You',
      text: `Reopened: on build ${build} the total is right after entering the tip, but goes back to €20.90 after rotating the phone. Steps and video in the next comment.`,
      tone: 'warn',
    });
  }

  const goals = [
    { done: !!bug, text: 'Report the bug and link it to the story' },
    { done: fixedOnce, text: 'Get the bug through the fix (play the developer)' },
    { done: bug?.status === 'Done', text: 'Retest the bug and close it' },
    { done: story.status === 'Done', text: 'Close the story' },
  ];

  const cards = [story, ...(bug ? [bug] : [])];

  return (
    <div className="not-prose my-8 space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-fg">Your sprint goals</p>
        <ol className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {goals.map((g, i) => (
            <li key={g.text} className="flex items-start gap-2 text-sm text-fg">
              {g.done ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Done" /> : <Circle size={16} className="mt-0.5 shrink-0 text-faint" aria-label="Not done" />}
              <span>
                {i + 1}. {g.text}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 rounded-xl bg-subtle p-3 text-sm text-fg">
          <p className="font-semibold">What you found while testing SHOP-142</p>
          <p className="mt-1 text-muted">
            Pixel 8, Android 15, QuickBite 3.8.0 build 409 on staging. Cart subtotal €18.40 + delivery €2.50. Checkout, then <em>Tip your courier</em> → Custom → 2.50 → Done. The tip row says €2.50 but
            the total stays €20.90 (should be €23.40). Preset tips work. Happens every time. You recorded a short video.
          </p>
        </div>
      </div>

      <MockWindow title="SHOP board · Sprint 14">
        <div className="@container relative p-3">
          <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-5">
            {STATUSES.map((col) => {
              const inCol = cards.filter((c) => c.status === col);
              return (
                <section key={col} aria-label={`${col} column`} className="min-w-0 rounded-lg bg-slate-100 p-2 @3xl:min-h-40">
                  <h4 className="mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                    {col} <span className="text-slate-400">{inCol.length}</span>
                  </h4>
                  {inCol.length === 0 && <p className="text-[11px] text-slate-400 @3xl:hidden">No issues</p>}
                  <ul className="space-y-2">
                    {inCol.map((c) => (
                      <li key={c.key} className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                        <p className="text-sm leading-snug text-slate-900">{c.summary}</p>
                        {c.link && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                            <Link2 size={11} aria-hidden="true" /> {c.link} SHOP-142
                          </p>
                        )}
                        {c.type === 'Story' && bug && bug.status !== 'Done' && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-red-700">
                            <Link2 size={11} aria-hidden="true" /> {bug.link === 'blocks' ? 'is blocked by' : 'relates to'} {bug.key}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5">
                          <TypeIcon type={c.type} />
                          <span className={`font-mono text-[11px] whitespace-nowrap ${c.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{c.key}</span>
                          <span className="ml-auto flex items-center gap-1">
                            <PriorityIcon priority={c.priority} />
                            <Avatar person={c.assignee} />
                          </span>
                        </div>
                        <label htmlFor={`${uid}-${c.key}`} className="sr-only">
                          Status of {c.key}
                        </label>
                        <select
                          id={`${uid}-${c.key}`}
                          value={c.status}
                          onChange={(e) => (c.type === 'Story' ? moveStory(e.target.value as Status) : moveBug(e.target.value as Status))}
                          className="mt-2 h-8 w-full rounded border border-slate-300 bg-slate-50 px-1.5 text-xs font-semibold text-slate-800 uppercase focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {c.type === 'Story' && !bug && !formOpen && (
                          <button
                            type="button"
                            onClick={() => setFormOpen(true)}
                            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus-visible:outline-none"
                          >
                            <Plus size={12} aria-hidden="true" /> Create bug
                          </button>
                        )}
                        {c.type === 'Bug' && c.status === 'In Testing' && (
                          <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                            <p className="text-[11px] text-slate-600">Retest on build {build}:</p>
                            <button type="button" onClick={passRetest} className="w-full rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-1 focus-visible:outline-none">
                              Fixed: close it
                            </button>
                            <button type="button" onClick={failRetest} className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
                              Still broken: reopen
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        {formOpen && <BugTicketForm onCreate={create} onCancel={() => setFormOpen(false)} />}

        <div className="border-t border-slate-200 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <MessageSquare size={13} aria-hidden="true" /> Activity
            </p>
            {reopened > 0 && <span className="text-[11px] text-slate-500">Reopened {reopened}×</span>}
            <button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
              <RotateCcw size={12} aria-hidden="true" /> Start over
            </button>
          </div>
          <ol ref={logRef} className="relative max-h-56 space-y-1.5 overflow-y-auto" aria-live="polite">
            {log.map((l, i) => (
              <li
                key={i}
                className={`rounded-md px-2.5 py-1.5 text-xs ${l.tone === 'warn' ? 'bg-amber-50 text-amber-900' : l.tone === 'ok' ? 'bg-green-50 text-green-900' : 'bg-slate-50 text-slate-800'}`}
              >
                {l.tone === 'warn' && <TriangleAlert size={12} className="mr-1 inline align-[-2px]" aria-hidden="true" />}
                <strong>{l.who}:</strong> {l.text}
              </li>
            ))}
          </ol>
        </div>
      </MockWindow>
    </div>
  );
}
