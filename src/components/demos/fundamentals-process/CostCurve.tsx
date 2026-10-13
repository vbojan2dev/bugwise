/**
 * Static illustration: the later a defect is found, the more it costs to fix.
 * Bar heights show the trend only; there are deliberately no "exact" multipliers.
 */

const stages = [
  { label: 'Requirements', short: 'Reqs', h: 8, fix: 'Edit one sentence after a 5-minute chat.' },
  { label: 'Design', short: 'Design', h: 15, fix: 'Change a mock-up or a diagram.' },
  { label: 'Development', short: 'Build', h: 28, fix: 'Rewrite some code and its unit tests.' },
  { label: 'Testing', short: 'Test', h: 48, fix: 'Bug report, fix, new build, retest, regression.' },
  { label: 'Production', short: 'Live', h: 100, fix: 'Hotfix, app store review, support tickets, refunds, lost trust.' },
];

export default function CostCurve() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">The later a bug is found, the more it costs</p>
        <p className="text-sm text-muted">Example: the coupon rule "one coupon per order" was never written down.</p>
      </div>
      <div className="p-5">
        <div className="flex h-44 items-end gap-2 border-b border-line sm:gap-4" aria-hidden="true">
          {stages.map((s, i) => (
            <div key={s.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                className={`rounded-t-lg ${i === stages.length - 1 ? 'bg-danger' : i >= 3 ? 'bg-warn' : 'bg-ok'}`}
                style={{ height: `${s.h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2 sm:gap-4" aria-hidden="true">
          {stages.map((s) => (
            <p key={s.label} className="min-w-0 flex-1 text-center text-[11px] leading-tight font-semibold text-muted sm:text-xs">
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </p>
          ))}
        </div>
        <ol className="mt-5 space-y-1.5 text-sm text-fg">
          {stages.map((s) => (
            <li key={s.label} className="flex gap-2">
              <span className="w-28 shrink-0 font-semibold">{s.label}</span>
              <span className="min-w-0 text-muted">{s.fix}</span>
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="border-t border-line bg-subtle px-5 py-3 text-xs text-muted">
        Bar heights show the trend, not exact numbers. The real cost depends on the team and the bug, but the direction is almost always the same.
      </figcaption>
    </figure>
  );
}
