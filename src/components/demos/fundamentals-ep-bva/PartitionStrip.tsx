/**
 * Static diagram: a horizontal strip of partitions (valid / invalid / output classes),
 * with optional boundary chips drawn at the joins between partitions.
 * Renders without a client directive.
 */
export type StripSegment = {
  /** Short range label, e.g. "18–60" */
  range: string;
  /** What happens, e.g. "Accepted" */
  label: string;
  kind: 'valid' | 'invalid' | 'output';
  /** Relative width (default 1) */
  grow?: number;
};

const tone = {
  valid: 'bg-ok-soft text-ok border-ok/40',
  invalid: 'bg-danger-soft text-danger border-danger/40',
  output: 'bg-info-soft text-info border-info/40',
} as const;

export default function PartitionStrip({
  title,
  segments,
  junctions,
  caption,
}: {
  title?: string;
  segments: StripSegment[];
  /** Values to show at each join between segment i and i+1 (length = segments.length - 1). */
  junctions?: string[][];
  caption?: string;
}) {
  const total = segments.reduce((s, x) => s + (x.grow ?? 1), 0);
  let acc = 0;
  const joins = segments.slice(0, -1).map((s) => {
    acc += s.grow ?? 1;
    return (acc / total) * 100;
  });

  return (
    <figure className="not-prose my-6 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      {title && <p className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">{title}</p>}
      <div className="flex min-w-0 gap-1">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`min-w-0 rounded-lg border px-1.5 py-2 text-center ${tone[s.kind]}`}
            style={{ flexGrow: s.grow ?? 1, flexBasis: 0 }}
          >
            <p className="truncate font-mono text-[13px] font-semibold sm:text-sm">{s.range}</p>
            <p className="mt-0.5 text-[11px] leading-tight break-words opacity-90 sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>
      {junctions && (
        <div className="relative mt-2 h-14">
          {junctions.map((vals, i) => (
            <div key={i} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `clamp(3.25rem, ${joins[i]}%, calc(100% - 3.25rem))` }}>
              <span className="h-3 w-px bg-line-strong" />
              <span className="flex gap-0.5">
                {vals.map((v) => (
                  <span key={v} className="rounded-md bg-brand-soft px-1 py-0.5 font-mono text-[11px] font-semibold text-brand sm:px-1.5 sm:text-xs">
                    {v}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
