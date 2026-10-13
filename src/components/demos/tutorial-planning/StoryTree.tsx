import { ClipboardList, FileText, ListChecks, BookOpen } from 'lucide-react';

/** Static diagram: one user story fans out into scenarios, scenarios into test cases; checklists sit alongside. */

const tree = [
  {
    scenario: 'Reorder with all items available',
    cases: ['TC-RO-001 One item, no extras', 'TC-RO-002 Several items with extras kept'],
  },
  {
    scenario: 'Reorder when some items are sold out',
    cases: ['TC-RO-007 2 of 3 items sold out', 'TC-RO-008 Every item sold out'],
  },
  {
    scenario: 'Reorder when the cart has another restaurant',
    cases: ['TC-RO-011 Tap Cancel keeps old cart', 'TC-RO-012 Tap Start new replaces cart'],
  },
];

export default function StoryTree() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start gap-2 rounded-2xl border border-brand bg-brand-soft p-3">
        <BookOpen size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <p className="min-w-0 text-sm text-fg">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">User story</span>
          As a returning customer, I want to reorder a previous order so I can get my usual meal in two taps.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ul className="min-w-0 space-y-3 lg:col-span-2">
          {tree.map((t) => (
            <li key={t.scenario} className="min-w-0 border-l-2 border-line pl-3">
              <p className="flex items-start gap-1.5 text-sm font-semibold text-fg">
                <FileText size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="sr-only">Scenario: </span>
                  {t.scenario}
                </span>
              </p>
              <ul className="mt-1.5 space-y-1 pl-5">
                {t.cases.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-sm text-muted">
                    <ClipboardList size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="sr-only">Test case: </span>
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="pl-3.5 text-sm text-faint">…and three more scenarios</li>
        </ul>

        <div className="min-w-0 rounded-2xl border border-dashed border-line-strong bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <ListChecks size={15} className="shrink-0 text-brand" aria-hidden="true" /> Checklists alongside
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Reorder smoke check (every build)</li>
            <li>Mobile heuristics: rotate, interrupt, offline, dark mode</li>
            <li>Accessibility quick check</li>
          </ul>
        </div>
      </div>
      <figcaption className="mt-4 text-xs text-muted">
        One story → a handful of scenarios → two or more test cases each. Checklists are not a lower level of the tree: they cut across it.
      </figcaption>
    </figure>
  );
}
