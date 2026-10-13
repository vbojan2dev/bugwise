import { useRef, useState, type KeyboardEvent } from 'react';
import { ClipboardList, FileText, ListChecks, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * "Zoom" demo: the same testing idea (reorder with sold-out items in a food delivery app)
 * shown at three levels of detail: scenario, checklist, test case.
 */

const levels = [
  {
    key: 'scenario',
    label: 'Scenario',
    icon: FileText,
    detail: 1,
    question: 'What should we test?',
    write: '~10 seconds',
    run: 'Anyone who knows the feature, using their own judgment',
    best: 'Planning coverage, talking with the product owner, the first pass over a user story',
  },
  {
    key: 'checklist',
    label: 'Checklist',
    icon: ListChecks,
    detail: 2,
    question: 'What must I remember to check?',
    write: '~2 minutes',
    run: 'Someone who already knows the app and how to get there',
    best: 'Quick sanity and regression rounds, exploratory reminders, areas that change often',
  },
  {
    key: 'case',
    label: 'Test case',
    icon: ClipboardList,
    detail: 3,
    question: 'How exactly do I check it, and what counts as a pass?',
    write: '~10 minutes',
    run: 'Anyone, even on their first day',
    best: 'Risky or regulated flows, handing tests to new people, proof of what was tested',
  },
] as const;

export default function ArtifactZoom() {
  const [level, setLevel] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = levels[level];

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(levels.length - 1, next));
    setLevel(clamped);
    return clamped;
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (level + 1) % levels.length;
    else if (e.key === 'ArrowLeft') next = (level - 1 + levels.length) % levels.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = levels.length - 1;
    if (next === null) return;
    e.preventDefault();
    setLevel(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Zoom: one idea, three levels of detail</p>
          <p className="text-sm text-muted">FoodDash app · "Reorder a previous order" when some items are sold out</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => go(level - 1)}
            disabled={level === 0}
            aria-label="Zoom out (less detail)"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
          >
            <ZoomOut size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(level + 1)}
            disabled={level === levels.length - 1}
            aria-label="Zoom in (more detail)"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
          >
            <ZoomIn size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div role="tablist" aria-label="Level of detail" className="grid grid-cols-3 gap-1 rounded-xl bg-subtle p-1">
          {levels.map((l, i) => {
            const Icon = l.icon;
            const selected = i === level;
            return (
              <button
                key={l.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`zoom-tab-${l.key}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="zoom-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setLevel(i)}
                onKeyDown={onKey}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:text-sm ${
                  selected ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon size={15} aria-hidden="true" className="hidden shrink-0 sm:block" />
                <span className="truncate">{l.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted" aria-hidden="true">
          <span>Less detail</span>
          <span className="flex flex-1 gap-1">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= current.detail ? 'bg-brand' : 'bg-subtle'}`} />
            ))}
          </span>
          <span>More detail</span>
        </div>

        <div id="zoom-panel" role="tabpanel" aria-labelledby={`zoom-tab-${current.key}`} className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* The artifact itself, drawn like a page in a test management tool */}
          <div className="min-w-0 rounded-2xl border border-line bg-subtle p-4 md:col-span-3">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">{current.question}</p>

            {current.key === 'scenario' && (
              <div className="mt-3 rounded-xl border border-line bg-surface p-3">
                <p className="text-xs text-faint">SC-RO-02</p>
                <p className="mt-0.5 font-semibold text-fg">Reorder a past order when some of its items are sold out</p>
              </div>
            )}

            {current.key === 'checklist' && (
              <div className="mt-3 rounded-xl border border-line bg-surface p-3">
                <p className="text-sm font-semibold text-fg">Reorder: sold-out items</p>
                <ul className="mt-2 space-y-1.5 text-sm text-fg">
                  {[
                    'Available items are added to the cart',
                    'Sold-out items are skipped, not added at 0 €',
                    'Message names how many items were skipped',
                    'Extras (e.g. "no onions") are kept',
                    'Cart total matches the items actually added',
                    'Reorder with ALL items sold out shows a clear message',
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-line-strong" aria-hidden="true" />
                      <span className="min-w-0">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {current.key === 'case' && (
              <div className="mt-3 space-y-2.5 rounded-xl border border-line bg-surface p-3 text-sm">
                <p>
                  <span className="text-xs text-faint">TC-RO-007 · High · Edge</span>
                  <span className="mt-0.5 block font-semibold text-fg">Sold-out items are skipped and named in a message on reorder</span>
                </p>
                <div>
                  <p className="text-xs font-semibold text-muted">Preconditions</p>
                  <p className="text-fg">Signed in as tom@test.com. Order #1042 (Luigi's) delivered 3 days ago: Margherita (no olives), Garlic bread, Tiramisu. Tiramisu and Garlic bread are marked sold out in the admin panel.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted">Steps</p>
                  <ol className="list-decimal space-y-0.5 pl-5 text-fg">
                    <li>Open the Orders tab</li>
                    <li>Tap Reorder on order #1042</li>
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted">Expected result</p>
                  <p className="text-fg">Cart opens with 1 × Margherita (no olives) only. Message: "2 items are no longer available". Total = today's Margherita price + delivery fee.</p>
                </div>
              </div>
            )}
          </div>

          <dl className="min-w-0 space-y-3 text-sm md:col-span-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">Time to write</dt>
              <dd className="text-fg">{current.write}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">Who can run it</dt>
              <dd className="text-fg">{current.run}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">Best for</dt>
              <dd className="text-fg">{current.best}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
