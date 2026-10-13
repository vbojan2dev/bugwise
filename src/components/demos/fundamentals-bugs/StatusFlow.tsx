import { ArrowDown, CornerDownRight, RotateCcw } from 'lucide-react';

/** Static diagram of a typical bug workflow, colored by who moves the bug at each step. */

type Owner = 'tester' | 'lead' | 'dev';
const owners: Record<Owner, { label: string; dot: string; chip: string }> = {
  tester: { label: 'Tester', dot: 'bg-brand', chip: 'border-brand/40 bg-brand-soft' },
  lead: { label: 'Lead / PO (triage)', dot: 'bg-warn', chip: 'border-warn/40 bg-warn-soft' },
  dev: { label: 'Developer', dot: 'bg-info', chip: 'border-info/40 bg-info-soft' },
};

const main: { status: string; aka?: string; owner: Owner; text: string; exits?: string[] }[] = [
  { status: 'New', owner: 'tester', text: 'Tester files the report. Nobody has reviewed it yet.' },
  {
    status: 'Triaged / Open',
    owner: 'lead',
    text: 'Triage checks it is real and new, confirms severity, sets priority.',
    exits: ['Duplicate', 'Not a bug / Rejected', "Won't fix", 'Deferred / Backlog', 'Needs info'],
  },
  { status: 'Assigned', owner: 'lead', text: 'A developer becomes the owner.' },
  { status: 'In Progress', owner: 'dev', text: 'Developer reproduces, finds the cause, writes the fix.', exits: ['Cannot reproduce', 'Needs info'] },
  { status: 'Fixed / Resolved', aka: 'often merged into the next step', owner: 'dev', text: 'Code is changed, reviewed and merged.' },
  { status: 'Ready for test', aka: 'Retest, In QA', owner: 'dev', text: 'The fix is in a build testers can install.' },
  { status: 'Verified', owner: 'tester', text: 'Tester retested the fix and checked the area around it.' },
  { status: 'Closed', aka: 'Done', owner: 'tester', text: 'Finished. Often closed automatically when the release ships.' },
];

export default function StatusFlow() {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">A typical bug workflow</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {(Object.keys(owners) as Owner[]).map((o) => (
            <span key={o} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${owners[o].dot}`} aria-hidden="true" /> {owners[o].label}
            </span>
          ))}
        </div>
      </div>
      <ol className="space-y-1 p-5">
        {main.map((s, i) => (
          <li key={s.status} className="min-w-0">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
              <div className={`rounded-xl border px-3 py-2 ${owners[s.owner].chip}`}>
                <p className="text-sm font-semibold text-fg">{s.status}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={`size-2 rounded-full ${owners[s.owner].dot}`} aria-hidden="true" />
                  {owners[s.owner].label}
                </p>
              </div>
              <div className="min-w-0 text-sm text-fg sm:pt-1.5">
                <p>
                  {s.text}
                  {s.aka ? <span className="text-muted"> (Also: {s.aka}.)</span> : null}
                </p>
                {s.exits ? (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <CornerDownRight size={13} aria-hidden="true" /> Can leave here as:
                    {s.exits.map((e) => (
                      <span key={e} className="rounded-md border border-line bg-subtle px-1.5 py-0.5 text-fg">
                        {e}
                      </span>
                    ))}
                  </p>
                ) : null}
                {s.status === 'Ready for test' ? (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <RotateCcw size={13} className="text-warn" aria-hidden="true" /> Retest fails:
                    <span className="rounded-md border border-warn/40 bg-warn-soft px-1.5 py-0.5 text-fg">Reopened</span> back to the developer
                  </p>
                ) : null}
              </div>
            </div>
            {i < main.length - 1 ? (
              <div className="flex w-full justify-center py-0.5 sm:w-44">
                <ArrowDown size={16} className="text-faint" aria-hidden="true" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="border-t border-line px-5 py-3 text-xs text-muted">
        Names and steps differ per team and tool. Many teams skip some of these statuses or add their own (for example Code review).
      </p>
    </div>
  );
}
