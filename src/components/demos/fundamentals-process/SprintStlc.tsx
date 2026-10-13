/**
 * Static illustration: how the STLC phases overlap inside a 2-week (10 working day) sprint.
 * Each row is a phase; filled cells are the days it is active.
 */

const days = ['M', 'T', 'W', 'T', 'F', 'M', 'T', 'W', 'T', 'F'];

const rows: { label: string; from: number; to: number; note: string; tone: string }[] = [
  { label: 'Requirement analysis', from: 1, to: 2, note: 'Read the sprint stories, ask questions in planning and refinement.', tone: 'bg-info' },
  { label: 'Test planning', from: 1, to: 2, note: 'A light plan: which stories are risky, which devices, what regression to run.', tone: 'bg-info' },
  { label: 'Test case design', from: 2, to: 6, note: 'Write cases for each story while developers build it.', tone: 'bg-brand' },
  { label: 'Environment setup', from: 3, to: 9, note: 'Install each new build on the test environment, smoke test it.', tone: 'bg-warn' },
  { label: 'Test execution', from: 4, to: 9, note: 'Test stories as soon as each one is ready; retest fixes; regression at the end.', tone: 'bg-ok' },
  { label: 'Test closure', from: 10, to: 10, note: 'Share results in the sprint review, raise process issues in the retro.', tone: 'bg-danger' },
];

export default function SprintStlc() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">The STLC inside one 2-week sprint</p>
        <p className="text-sm text-muted">Phases overlap. Each story goes through its own mini cycle while the sprint moves on.</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-10 gap-1 text-center text-[11px] font-semibold text-faint" aria-hidden="true">
          {days.map((d, i) => (
            <span key={i} className={i === 5 ? 'border-l border-line' : ''}>
              {d}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <p className="text-sm font-semibold text-fg">{r.label}</p>
            <div
              className="mt-1 grid grid-cols-10 gap-1"
              role="img"
              aria-label={`${r.label}: day ${r.from}${r.to !== r.from ? ` to day ${r.to}` : ''}`}
            >
              {days.map((_, i) => {
                const on = i + 1 >= r.from && i + 1 <= r.to;
                return <span key={i} className={`h-3 rounded-sm ${on ? r.tone : 'bg-subtle'}`} />;
              })}
            </div>
            <p className="mt-1 text-xs text-muted">{r.note}</p>
          </div>
        ))}
      </div>
      <figcaption className="border-t border-line bg-subtle px-5 py-3 text-xs text-muted">
        A typical shape, not a rule. Some teams run regression on a separate release branch, and many keep a "test-ready by day 8" agreement so stories don't all land on the last day.
      </figcaption>
    </figure>
  );
}
