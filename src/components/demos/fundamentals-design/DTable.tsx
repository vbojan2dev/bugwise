/**
 * Static decision table for lesson text (no client directive needed).
 * Each row is [label, ...cells]. Condition cells: 'Y' | 'N' | '-'. Action cells: any short text ('✓' marks an action that happens).
 */
type Row = string[];

export default function DTable({
  conditions,
  actions,
  caption,
  highlight = [],
  ruleLabels,
}: {
  conditions: Row[];
  actions: Row[];
  caption?: string;
  /** 0-based column indexes to highlight (e.g. a gap). */
  highlight?: number[];
  ruleLabels?: string[];
}) {
  const cols = conditions[0].length - 1;
  const labels = ruleLabels ?? Array.from({ length: cols }, (_, i) => `R${i + 1}`);
  const hl = (c: number) => (highlight.includes(c) ? 'bg-warn-soft' : '');
  const condColor = (v: string) => (v === 'Y' ? 'text-ok' : v === 'N' ? 'text-danger' : 'text-faint');

  return (
    <figure className="not-prose my-6">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-subtle">
              <th scope="col" className="sticky left-0 z-10 min-w-[8.5rem] bg-subtle px-3 py-2 text-left text-xs font-semibold text-faint">
                Conditions
              </th>
              {labels.map((l, c) => (
                <th key={l} scope="col" className={`border-l border-line px-2 py-2 text-center text-xs font-semibold text-muted ${hl(c)}`}>
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conditions.map(([label, ...cells]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left text-xs font-medium text-fg">
                  {label}
                </th>
                {cells.map((v, c) => (
                  <td key={c} className={`min-w-[2.75rem] border-l border-line px-2 py-1.5 text-center font-mono text-xs font-bold ${condColor(v)} ${hl(c)}`}>
                    {v === '-' ? '–' : v}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-line-strong bg-subtle">
              <th scope="row" colSpan={cols + 1} className="px-3 py-1 text-left text-xs font-semibold text-faint">
                Actions
              </th>
            </tr>
            {actions.map(([label, ...cells]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left text-xs font-medium text-fg">
                  {label}
                </th>
                {cells.map((v, c) => (
                  <td key={c} className={`border-l border-line px-2 py-1.5 text-center text-xs font-semibold whitespace-nowrap text-fg ${hl(c)}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-2 text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
