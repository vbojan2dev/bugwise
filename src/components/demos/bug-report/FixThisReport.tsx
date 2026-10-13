import { useState } from 'react';
import { Bug, Check, CircleCheck, Eye, EyeOff, Flag, RotateCcw } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { BugReportCard } from './BugReportCard';

/**
 * "Fix this bug report" exercise.
 * A deliberately bad ticket where every part is a button. Learners click the parts they think
 * are problems. Real problems turn red and explain why; fine parts turn green and say so.
 *
 * Problems (9): shouty vague title, vague environment, vague steps, missing expected result,
 * vague actual result, blaming tone, second bug merged in, unclear reproducibility, no evidence.
 * Fine parts (3): reporter, component, severity.
 */

type Part = {
  id: string;
  text: string;
  problem?: { title: string; explain: string };
  fine?: string;
};

type Row = { label: string; parts: Part[] };

const rows: Row[] = [
  {
    label: 'Title',
    parts: [
      {
        id: 'title',
        text: 'Payment broken!!! FIX ASAP',
        problem: {
          title: 'Vague, shouty title',
          explain:
            'It says nothing about where, what or when, so nobody can tell it apart from the other 20 payment tickets. Capitals and "!!!" add pressure, not information. Better: "Checkout: Pay button stays disabled after entering a valid card on iOS 18".',
        },
      },
    ],
  },
  {
    label: 'Reporter',
    parts: [{ id: 'reporter', text: 'Mia R.', fine: 'The reporter is filled in automatically, so the developer knows who to ask. Nothing to fix.' }],
  },
  {
    label: 'Component',
    parts: [{ id: 'component', text: 'Checkout', fine: 'Correct component. It routes the ticket to the right team. Nothing to fix.' }],
  },
  {
    label: 'Environment',
    parts: [
      {
        id: 'env',
        text: 'My phone, latest version',
        problem: {
          title: 'Environment is missing',
          explain:
            'Which device? Which OS version? Which app version and build? "Latest" changes every week. The developer needs e.g. "iPhone 15, iOS 18.0.1, ShopFast 4.12.0 (build 812), Staging".',
        },
      },
    ],
  },
  {
    label: 'Steps',
    parts: [
      {
        id: 'steps',
        text: 'Go to checkout and try to pay with a card.',
        problem: {
          title: 'Steps are too vague to follow',
          explain:
            'What is in the cart? Which payment option? Which card number? A developer following this could easily do something different and not see the bug. Write numbered, specific steps with exact test data.',
        },
      },
    ],
  },
  {
    label: 'Expected',
    parts: [
      {
        id: 'expected',
        text: '(empty)',
        problem: {
          title: 'No expected result',
          explain:
            'Without it, the developer has to guess what "correct" means. Say exactly what should happen: "The Pay $54.97 button becomes enabled and tapping it places the order."',
        },
      },
    ],
  },
  {
    label: 'Actual',
    parts: [
      {
        id: 'actual',
        text: "It doesn't work.",
        problem: {
          title: '"Doesn\'t work" is not an actual result',
          explain:
            'Describe what you saw: "The Pay button stays grey and cannot be tapped. No error is shown." Does it crash? Spin forever? Show an error? Each points to a different cause.',
        },
      },
      {
        id: 'tone',
        text: 'Seriously, did anyone even test this before release??',
        problem: {
          title: 'Blaming, emotional tone',
          explain:
            'It adds no information and puts people on the defensive. Bug reports describe the product, not the people. Stay factual and friendly; you will work with these developers every day.',
        },
      },
      {
        id: 'merged',
        text: 'Also the profile photo on the Account screen looks blurry.',
        problem: {
          title: 'Two bugs in one report',
          explain:
            'The blurry photo is a different bug, on a different screen, probably for a different developer. If the payment fix ships, this ticket gets closed and the photo bug is forgotten. Report it separately.',
        },
      },
    ],
  },
  {
    label: 'Severity',
    parts: [
      {
        id: 'severity',
        text: 'Critical',
        fine: 'Debatable (Apple Pay still works, so many teams would call it Major), but it is set and the team can adjust it during triage. Not one of the real problems here.',
      },
    ],
  },
  {
    label: 'Reproducible',
    parts: [
      {
        id: 'repro',
        text: 'Happens sometimes I think',
        problem: {
          title: 'Unclear reproducibility',
          explain:
            'Try the steps again and count: "5/5 attempts" or "3/5 attempts". That number tells the developer whether to expect the bug every time or to hunt for a timing issue.',
        },
      },
    ],
  },
  {
    label: 'Attachments',
    parts: [
      {
        id: 'attach',
        text: 'None',
        problem: {
          title: 'No evidence attached',
          explain:
            'A 20-second screen recording or a screenshot shows the bug instantly. Logs (device console, browser console, network requests) often show the cause. Always attach something.',
        },
      },
    ],
  },
];

const allParts = rows.flatMap((r) => r.parts);
const problems = allParts.filter((p) => p.problem);
const TOTAL = problems.length;

export default function FixThisReport() {
  const [flagged, setFlagged] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [improved, setImproved] = useState(false);

  const found = flagged.filter((id) => allParts.find((p) => p.id === id)?.problem).length;
  const falseFlags = flagged.length - found;
  const done = found === TOTAL;

  const click = (id: string) => {
    if (!flagged.includes(id)) {
      setFlagged((f) => [...f, id]);
      setOpen(id);
    } else {
      setOpen((o) => (o === id ? null : id));
    }
  };

  const revealAll = () => {
    setFlagged((f) => [...f, ...problems.map((p) => p.id).filter((id) => !f.includes(id))]);
    setOpen(null);
  };

  const reset = () => {
    setFlagged([]);
    setOpen(null);
    setImproved(false);
  };

  // Number problems in the order the learner found them.
  const foundOrder = flagged.filter((id) => allParts.find((p) => p.id === id)?.problem);
  const problemNumber = (id: string) => foundOrder.indexOf(id) + 1;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Flag size={17} className="text-brand" aria-hidden="true" /> Fix this bug report
        </p>
        <p className="text-sm text-muted">
          A new teammate filed this ticket. Click every part you think is a problem. Some parts are fine, so think before you click.
        </p>
      </div>

      <div className="p-3 sm:p-5" style={{ background: '#f2f2f7' }}>
        <BrowserFrame url="tracker.shopfast.dev/browse/SHOP-1422">
          <div className="p-4 text-[#0e1120] sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-[#5b6170]">
              <span className="grid size-5 place-items-center rounded bg-[#e5484d] text-white">
                <Bug size={12} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-mono font-semibold">SHOP-1422</span>
            </div>
            <dl className="divide-y divide-[#eceef4]">
              {rows.map((row) => (
                <div key={row.label} className="grid gap-1 py-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3">
                  <dt className="pt-1 text-[11px] font-semibold tracking-wide text-[#6b7180] uppercase">{row.label}</dt>
                  <dd className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {row.parts.map((p) => {
                        const isFlagged = flagged.includes(p.id);
                        const isProblem = !!p.problem;
                        const base =
                          'rounded-lg border px-2 py-1 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3b6cf6] focus-visible:ring-offset-1';
                        const look = !isFlagged
                          ? 'border-dashed border-[#c5c9d6] bg-white hover:border-[#3b6cf6] hover:bg-[#f2f5ff]'
                          : isProblem
                            ? 'border-[#f0a3a3] bg-[#fdecec] text-[#7a1212]'
                            : 'border-[#a6dcb9] bg-[#ecf8f0] text-[#14532d]';
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => click(p.id)}
                            aria-expanded={isFlagged ? open === p.id : undefined}
                            aria-controls={isFlagged ? `fix-${p.id}` : undefined}
                            aria-label={
                              isFlagged ? `${p.text}. ${isProblem ? `Problem: ${p.problem!.title}` : 'Fine'}. Toggle explanation.` : `Flag "${p.text}" as a problem`
                            }
                            className={`${base} ${look} ${p.text === '(empty)' && !isFlagged ? 'italic text-[#8a90a0]' : ''}`}
                          >
                            {isFlagged ? (
                              <span className="mr-1.5 inline-flex translate-y-[-1px] align-middle">
                                {isProblem ? (
                                  <span className="grid size-4 place-items-center rounded-full bg-[#c4262e] text-[10px] font-bold text-white">
                                    {problemNumber(p.id)}
                                  </span>
                                ) : (
                                  <Check size={14} strokeWidth={3} className="text-[#18794e]" aria-hidden="true" />
                                )}
                              </span>
                            ) : null}
                            {p.text}
                          </button>
                        );
                      })}
                    </div>
                    {row.parts.map((p) =>
                      flagged.includes(p.id) && open === p.id ? (
                        <div
                          key={p.id}
                          id={`fix-${p.id}`}
                          className={`mt-2 rounded-lg border p-3 text-sm ${p.problem ? 'border-[#f6c9c9] bg-[#fff7f7]' : 'border-[#bfe5cc] bg-[#f3fbf6]'}`}
                        >
                          {p.problem ? (
                            <>
                              <p className="font-semibold text-[#b42318]">{p.problem.title}</p>
                              <p className="mt-1 text-[#3d4352]">{p.problem.explain}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-[#18794e]">This part is fine</p>
                              <p className="mt-1 text-[#3d4352]">{p.fine}</p>
                            </>
                          )}
                        </div>
                      ) : null,
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </BrowserFrame>
      </div>

      <div className="space-y-3 border-t border-line p-5">
        <div aria-live="polite" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="font-semibold text-fg">
              {found} of {TOTAL} problems found
            </p>
            {falseFlags > 0 ? (
              <p className="text-muted">
                {falseFlags} fine {falseFlags === 1 ? 'part' : 'parts'} flagged
              </p>
            ) : null}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(found / TOTAL) * 100}%` }} />
          </div>
          {done ? (
            <p className="flex items-start gap-2 text-sm text-fg">
              <CircleCheck size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
              All {TOTAL} found. Now compare with the improved version below.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImproved((v) => !v)}
            aria-pressed={improved}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {improved ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            {improved ? 'Hide improved version' : 'Show improved version'}
          </button>
          {!done ? (
            <button
              type="button"
              onClick={revealAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Flag size={15} aria-hidden="true" /> Reveal all problems
            </button>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} aria-hidden="true" /> Start over
          </button>
        </div>
      </div>

      {improved ? (
        <div className="border-t border-line p-3 sm:p-5" style={{ background: '#f2f2f7' }}>
          <p className="px-1 text-sm font-semibold text-[#0e1120]">Improved: the payment bug, on its own</p>
          <div className="-my-4">
            <BugReportCard />
          </div>
          <div className="mt-6 rounded-2xl border border-[#e5e7ef] bg-white p-4 text-sm text-[#0e1120]">
            <p className="font-semibold">…and the photo bug gets its own ticket</p>
            <p className="mt-1 flex items-start gap-2 text-[#3d4352]">
              <Bug size={15} className="mt-0.5 shrink-0 text-[#e5484d]" aria-hidden="true" />
              <span>
                <span className="font-mono text-xs font-semibold">SHOP-1424</span> Account: Profile photo looks blurry after uploading a new photo on iOS 18
              </span>
            </p>
            <p className="mt-2 text-xs text-[#6b7180]">With its own environment, steps, expected and actual result, and a screenshot of the blurry photo.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
