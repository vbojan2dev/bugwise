import { useState, type ReactNode } from 'react';
import {
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Flag,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  Rocket,
  Server,
} from 'lucide-react';

/**
 * Follow one FoodDash bug fix (FD-327) from commit to release and answer what a tester should do at each point.
 * The pipeline strip and the branch diagram show where the fix is. Each step has one best answer;
 * wrong answers explain why and let the learner try again. Score = answers right on the first try.
 * The bug (Order again uses old prices) is deliberately not one of the Capstone bugs.
 * State lives only in this component.
 */

type StageId = 'commit' | 'pr' | 'checks' | 'merge' | 'staging' | 'retest' | 'release';
type StageState = 'todo' | 'active' | 'done' | 'failed';

const STAGES: { id: StageId; label: string; icon: typeof Server }[] = [
  { id: 'commit', label: 'Commit', icon: GitCommitHorizontal },
  { id: 'pr', label: 'Pull request', icon: GitPullRequest },
  { id: 'checks', label: 'CI checks', icon: ListChecks },
  { id: 'merge', label: 'Merge', icon: GitMerge },
  { id: 'staging', label: 'Staging build', icon: Server },
  { id: 'retest', label: 'Retest', icon: ClipboardCheck },
  { id: 'release', label: 'Release', icon: Rocket },
];

type Option = { text: string; correct: boolean; feedback: string };
type Step = {
  stage: StageId;
  /** Stage states shown while this step is open. Stages before `stage` are done unless overridden. */
  override?: Partial<Record<StageId, StageState>>;
  /** Highlight in the branch diagram. */
  focus: 'feature' | 'merge' | 'release';
  title: string;
  situation: ReactNode;
  question: string;
  options: Option[];
};

const card = 'min-w-0 rounded-xl border border-line bg-subtle p-3 text-sm';
const mono = 'font-mono text-[12px]';

function Row({ ok, label, meta }: { ok: boolean | 'run'; label: string; meta: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok === 'run' ? (
        <LoaderCircle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
      ) : ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
      ) : (
        <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      )}
      <span className="sr-only">{ok === 'run' ? 'Running:' : ok ? 'Passed:' : 'Failed:'}</span>
      <span className="min-w-0">
        <span className="font-semibold text-fg">{label}</span> <span className="text-muted">{meta}</span>
      </span>
    </li>
  );
}

function AboutScreen({ build, commit, flag }: { build: string; commit: string; flag?: 'on' | 'off' }) {
  return (
    <div className="demo-screen min-w-0 rounded-2xl border border-black/10 bg-[#f2f2f7] p-3 text-[13px] text-[#1c1c1e]" style={{ colorScheme: 'light' }}>
      <p className="text-center text-[11px] font-semibold tracking-wide text-[#8e8e93] uppercase">FoodDash STG · Settings › About</p>
      <dl className="mt-2 divide-y divide-black/10 rounded-xl bg-white px-3">
        <div className="flex justify-between gap-3 py-2">
          <dt>Version</dt>
          <dd className="text-[#636366] tabular-nums">2.1.0 ({build})</dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt>Environment</dt>
          <dd className="text-[#636366]">Staging</dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt>Commit</dt>
          <dd className={`${mono} text-[#636366]`}>{commit}</dd>
        </div>
        {flag && (
          <div className="flex justify-between gap-3 py-2">
            <dt className={mono}>reorder_current_prices</dt>
            <dd className={flag === 'on' ? 'font-semibold text-[#248a3d]' : 'font-semibold text-[#c93400]'}>{flag === 'on' ? 'ON' : 'OFF'}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function CartScreen({ price, note }: { price: string; note: string }) {
  return (
    <div className="demo-screen min-w-0 rounded-2xl border border-black/10 bg-[#f2f2f7] p-3 text-[13px] text-[#1c1c1e]" style={{ colorScheme: 'light' }}>
      <p className="text-center text-[11px] font-semibold tracking-wide text-[#8e8e93] uppercase">Cart · after "Order again" on #8841</p>
      <div className="mt-2 space-y-1 rounded-xl bg-white p-3">
        <div className="flex justify-between gap-3">
          <span>1 × Margherita</span>
          <span className="font-semibold tabular-nums">{price}</span>
        </div>
        <p className="text-[12px] text-[#636366]">{note}</p>
      </div>
    </div>
  );
}

const STEPS: Step[] = [
  {
    stage: 'pr',
    focus: 'feature',
    title: 'The fix is in a pull request',
    situation: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className={card}>
          <p className="font-semibold text-fg">Marko (developer)</p>
          <p className="mt-1 text-muted">
            "Fix for FD-327 (Order again adds dishes at their old prices) is in PR #418, branch <code className={mono}>fix/FD-327-reorder-prices</code>.
            Want to check it before I merge?"
          </p>
        </div>
        <div className={card}>
          <p className="font-semibold text-fg">Builds you can install</p>
          <ul className="mt-1 space-y-1.5 text-muted">
            <li>
              <span className="font-semibold text-fg">2.1.0 (411)</span> · staging · from <code className={mono}>main</code> @ <code className={mono}>5b2e9c4</code>, yesterday
            </li>
            <li>
              <span className="font-semibold text-fg">2.1.0 (PR-418)</span> · dev · from <code className={mono}>fix/FD-327-reorder-prices</code> @{' '}
              <code className={mono}>a1c9e2f</code>, 20 min ago
            </li>
            <li>
              <span className="font-semibold text-fg">2.0.0 (398)</span> · production · the store version
            </li>
          </ul>
        </div>
      </div>
    ),
    question: 'Which build can show you whether the fix works?',
    options: [
      {
        text: '2.1.0 (411) on staging: it is the newest numbered build',
        correct: false,
        feedback: 'Build 411 was made from main yesterday. The fix only exists on the feature branch so far, so 411 cannot contain it. Newest is not the same as "contains the fix".',
      },
      {
        text: 'The PR-418 build from the feature branch',
        correct: true,
        feedback: 'Right. PR builds are made from the branch with the change. Testing here finds problems before they reach main. In your comment, name the build and commit: "Checked on PR-418 build, a1c9e2f".',
      },
      {
        text: '2.0.0 (398), the production app, because that is what customers use',
        correct: false,
        feedback: 'Production has none of the 2.1 work, let alone this fix. You would only confirm the bug still exists there, which you already know.',
      },
    ],
  },
  {
    stage: 'checks',
    override: { checks: 'failed' },
    focus: 'feature',
    title: 'The pipeline is red',
    situation: (
      <div className={card}>
        <p className="font-semibold text-fg">PR #418 · Checks</p>
        <ul className="mt-2 space-y-1.5">
          <Row ok label="Build" meta="2 min 41 s" />
          <Row ok label="Unit tests" meta="1,204 passed" />
          <Row ok label="Lint" meta="no problems" />
          <Row ok={false} label="UI tests" meta="1 failed, 86 passed" />
        </ul>
        <pre className={`${mono} mt-2 overflow-x-auto rounded-lg bg-surface p-2 whitespace-pre-wrap text-fg`}>
          {'FAILED TrackingMapTest.showsCourierPin\nTimed out after 30 s waiting for map tiles'}
        </pre>
        <p className="mt-2 text-muted">
          Test history: this test failed 3 times in the last 20 runs on <code className={mono}>main</code>, including runs with no changes near the
          map. The fix only touches reorder pricing.
        </p>
      </div>
    ),
    question: "What's your best move?",
    options: [
      {
        text: 'Reopen FD-327: the pipeline says the fix is broken',
        correct: false,
        feedback: 'The failing test is about the tracking map, not reordering, and it fails on main without related changes too. A red pipeline is not automatically a verdict on the fix.',
      },
      {
        text: 'Say it looks like the known flaky map test, ask for a re-run, and check the flaky test has its own ticket',
        correct: true,
        feedback: 'Right. You read which check failed, what it tests and its history. One re-run is reasonable for a known flaky test, but the flakiness itself is a bug: it needs a ticket and an owner.',
      },
      {
        text: 'Keep re-running the pipeline until it turns green, and say nothing',
        correct: false,
        feedback: 'Silent re-runs teach the team to ignore red. One day the "flaky" failure will be a real bug. Re-run once if you must, and make the flakiness visible.',
      },
      {
        text: 'Ignore it: pipelines are the developers’ business',
        correct: false,
        feedback: 'You don’t have to fix pipelines, but reading one at a basic level (which check, which test, which change) is part of a tester’s job. It tells you whether there is anything to test yet.',
      },
    ],
  },
  {
    stage: 'merge',
    focus: 'merge',
    title: 'Merged, but which build has it?',
    situation: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className={card}>
          <p className="font-semibold text-fg">Jira · FD-327</p>
          <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-muted">
            <dt>Status</dt>
            <dd className="font-semibold text-fg">Resolved</dd>
            <dt>Resolution</dt>
            <dd className="text-fg">Fixed</dd>
            <dt>Fixed in build</dt>
            <dd className="text-fg">412</dd>
            <dt>Development</dt>
            <dd className="text-fg">PR #418 merged into main</dd>
          </dl>
        </div>
        <AboutScreen build="411" commit="5b2e9c4" />
      </div>
    ),
    question: 'The ticket waits for you. Your staging app says build 411. What do you do?',
    options: [
      {
        text: 'Retest now on 411 and reopen the bug if prices are still old',
        correct: false,
        feedback: '411 was built before the merge, so of course the bug is still there. Reopening would send Marko after a fix that is fine, and costs trust in your reports.',
      },
      {
        text: 'Close the ticket: Resolved means the developer checked it',
        correct: false,
        feedback: 'Resolved means a developer finished their part. Verifying it on a real build is your part. A fix nobody checked is not a fixed bug.',
      },
      {
        text: 'Check whether build 412 is on staging yet, install it, then retest',
        correct: true,
        feedback: 'Right. Match the build in the ticket with the build on your device. If 412 isn’t out yet, look at the pipeline or ask when the next staging build lands.',
      },
    ],
  },
  {
    stage: 'staging',
    focus: 'merge',
    title: 'Build 412 is on staging',
    situation: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className={card}>
          <p className="font-semibold text-fg">Release notes · 2.1.0 (412)</p>
          <p className="mt-1 text-muted">
            Built from <code className={mono}>main</code> @ <code className={mono}>7f3d0b1</code> · deployed to staging 10:42
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>#418 FD-327 Order again uses today’s prices</li>
            <li>#421 FD-330 Faster restaurant list loading</li>
          </ul>
        </div>
        <AboutScreen build="412" commit="7f3d0b1" />
      </div>
    ),
    question: 'What is the strongest evidence that this build contains the fix?',
    options: [
      {
        text: 'FD-327 moved to Resolved yesterday',
        correct: false,
        feedback: 'A status says someone finished work. It doesn’t say which build the work is in.',
      },
      {
        text: 'The release notes for 412 list PR #418, and the About screen shows build 412',
        correct: true,
        feedback: 'Right. The build’s own notes (or the CI page for that build) link it to the PR, and your device confirms you have that build. Two independent checks.',
      },
      {
        text: '412 is the newest build, and newer builds contain every earlier fix',
        correct: false,
        feedback: 'Not always. A newer build can come from a different branch, for example a hotfix branch made from an old release, without your fix. Check the notes or the commit.',
      },
    ],
  },
  {
    stage: 'retest',
    override: { retest: 'failed' },
    focus: 'merge',
    title: 'Retest on 412: still old prices?',
    situation: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CartScreen price="€9.50" note="Today the menu says €10.50. €9.50 was the price two weeks ago." />
        <AboutScreen build="412" commit="7f3d0b1" flag="off" />
      </div>
    ),
    question: 'You follow the original steps on 412 and still get the old price. The About screen also lists a flag. What now?',
    options: [
      {
        text: 'Reopen FD-327: the fix doesn’t work on 412',
        correct: false,
        feedback: 'Too fast. The new code is in the build but switched off. Reopening would be a false alarm. Check the flag first.',
      },
      {
        text: 'Ask Marko whether the fix is behind reorder_current_prices, turn it on for your test account and retest',
        correct: true,
        feedback: 'Right. Feature flags let code ship switched off. Test with the flag on, and write the flag state in the ticket so nobody is surprised when production behaves differently.',
      },
      {
        text: 'Mark the retest as passed, since the code is in the build',
        correct: false,
        feedback: 'You saw the old price with your own eyes. Never pass what you didn’t see working.',
      },
    ],
  },
  {
    stage: 'retest',
    focus: 'merge',
    title: 'Flag on: the fix works',
    situation: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CartScreen price="€10.50" note="Today’s price. The cart total and delivery fee match the menu." />
        <AboutScreen build="412" commit="7f3d0b1" flag="on" />
      </div>
    ),
    question: 'The fix works on 412 with the flag on. What else before you close FD-327?',
    options: [
      {
        text: 'Nothing. Close it and move on',
        correct: false,
        feedback: 'Closing is right, but a pricing change can break things next to it. Retesting confirms the fix; regression checks that nothing else broke.',
      },
      {
        text: 'Run the full 600-case regression suite before closing the ticket',
        correct: false,
        feedback: 'Far more than this change needs, and it blocks the ticket for days. Pick a focused regression set around what the change touched.',
      },
      {
        text: 'Close it with build and flag noted, then a short regression: cart totals, coupons, a dish no longer on the menu',
        correct: true,
        feedback: 'Right. Record "Verified on 2.1.0 (412), staging, flag ON", then check the neighbors of the change. "A dish that is no longer on the menu" is exactly the edge case a pricing fix can trip over.',
      },
    ],
  },
  {
    stage: 'release',
    focus: 'release',
    title: 'Release candidate 415',
    situation: (
      <div className={card}>
        <p className="font-semibold text-fg">Release branch</p>
        <p className="mt-1 text-muted">
          <code className={mono}>release/2.1.0</code> was cut from <code className={mono}>main</code> after <code className={mono}>7f3d0b1</code>. Two
          small fixes were added on the release branch. CI built <span className="font-semibold text-fg">2.1.0 (415)</span>, the release candidate.
        </p>
      </div>
    ),
    question: 'You verified FD-327 on 412. Does it need any attention on 415?',
    options: [
      {
        text: 'No. Verified once means verified in every build',
        correct: false,
        feedback: 'The release candidate is the build users will get, and it came from a different branch with extra changes. A quick look is cheap; a surprise in production is not.',
      },
      {
        text: 'Yes, briefly: confirm 415 includes #418, agree the flag’s production setting, and include Order again in the RC check',
        correct: true,
        feedback: 'Right. Check the notes, make sure someone decided whether the flag is on at release, and let the RC smoke or regression run cover the flow once more.',
      },
      {
        text: 'Yes: retest every bug fixed in 2.1 again from scratch, in full detail',
        correct: false,
        feedback: 'That repeats days of work for little new information. Focus on what changed between 412 and 415, plus a smoke and regression pass of the candidate.',
      },
    ],
  },
];

function stageStates(step: Step | null): Record<StageId, StageState> {
  const out = {} as Record<StageId, StageState>;
  const idx = step ? STAGES.findIndex((s) => s.id === step.stage) : STAGES.length;
  STAGES.forEach((s, i) => {
    out[s.id] = i < idx ? 'done' : i === idx ? 'active' : 'todo';
  });
  if (step?.override) Object.assign(out, step.override);
  return out;
}

function PipelineStrip({ states }: { states: Record<StageId, StageState> }) {
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="Where the fix is">
      {STAGES.map((s, i) => {
        const st = states[s.id];
        const Icon = s.icon;
        const tone =
          st === 'done'
            ? 'bg-ok-soft text-ok border-ok/30'
            : st === 'failed'
              ? 'bg-danger-soft text-danger border-danger/40'
              : st === 'active'
                ? 'bg-brand-soft text-brand border-brand/50 ring-2 ring-brand/30'
                : 'bg-subtle text-faint border-line';
        const word = st === 'done' ? 'done' : st === 'failed' ? 'problem' : st === 'active' ? 'current step' : 'not yet';
        return (
          <li key={s.id} className="relative flex min-w-0 flex-col items-center gap-1 text-center">
            {i > 0 && <span className="absolute top-4 right-1/2 h-0.5 w-full bg-line" aria-hidden="true" />}
            <span className={`relative grid size-8 place-items-center rounded-full border ${tone}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className={`hidden text-[11px] leading-tight sm:block ${st === 'active' ? 'font-semibold text-fg' : 'text-muted'}`}>{s.label}</span>
            <span className="sr-only">
              {s.label}: {word}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function BranchDiagram({ focus, done }: { focus: Step['focus']; done: boolean }) {
  const on = (f: Step['focus']) => done || focus === f;
  const node = (active: boolean) => (active ? 'fill-brand stroke-brand' : 'fill-surface stroke-line-strong');
  const text = 'fill-muted text-[10px]';
  const strong = 'fill-fg text-[10px] font-semibold';
  return (
    <svg viewBox="0 0 320 112" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="Branch diagram: the fix branch leaves main, is merged back, and a release branch is cut from main.">
      {/* main */}
      <line x1="10" y1="22" x2="310" y2="22" className="stroke-line-strong" strokeWidth="2" />
      <text x="10" y="12" className={strong}>
        main
      </text>
      {/* feature branch */}
      <path d="M40 22 C 60 22, 60 58, 80 58 L 150 58 C 170 58, 170 22, 190 22" fill="none" className="stroke-info" strokeWidth="2" />
      <text x="70" y="76" className={text}>
        fix/FD-327-reorder-prices
      </text>
      <circle cx="115" cy="58" r="6" strokeWidth="2" className={node(on('feature'))} />
      <text x="96" y="48" className={text}>
        a1c9e2f
      </text>
      {/* merge commit = build 412 */}
      <circle cx="190" cy="22" r="6" strokeWidth="2" className={node(on('merge'))} />
      <text x="174" y="12" className={text}>
        7f3d0b1 · 412
      </text>
      <circle cx="150" cy="22" r="4" strokeWidth="2" className={node(false)} />
      <text x="142" y="12" className={text}>
        411
      </text>
      {/* release branch */}
      <path d="M220 22 C 240 22, 240 94, 260 94 L 305 94" fill="none" className="stroke-warn" strokeWidth="2" />
      <text x="232" y="108" className={text}>
        release/2.1.0
      </text>
      <circle cx="285" cy="94" r="6" strokeWidth="2" className={node(on('release'))} />
      <text x="266" y="82" className={text}>
        RC 415
      </text>
    </svg>
  );
}

export default function PipelineSimulator() {
  const [stepIdx, setStepIdx] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);

  const finished = stepIdx >= STEPS.length;
  const step = finished ? null : STEPS[stepIdx];
  const solved = !!step && tried.some((i) => step.options[i].correct);
  const last = tried.length ? tried[tried.length - 1] : null;
  const score = firstTry.filter(Boolean).length;

  const choose = (i: number) => {
    if (!step || solved || tried.includes(i)) return;
    setTried((prev) => (prev.includes(i) ? prev : [...prev, i]));
    const correct = step.options[i].correct;
    setFirstTry((prev) => {
      if (prev[stepIdx] !== undefined) return prev;
      const next = [...prev];
      next[stepIdx] = correct;
      return next;
    });
  };

  const next = () => {
    setStepIdx((i) => i + 1);
    setTried([]);
  };

  const restart = () => {
    setStepIdx(0);
    setTried([]);
    setFirstTry([]);
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="space-y-3 border-b border-line bg-subtle p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-fg">FD-327 · Order again adds dishes at their old prices</p>
          <p className="text-xs text-muted tabular-nums">{finished ? 'Done' : `Step ${stepIdx + 1} of ${STEPS.length}`}</p>
        </div>
        <PipelineStrip states={stageStates(step)} />
        <div className="rounded-xl border border-line bg-surface px-2 py-1">
          <BranchDiagram focus={step?.focus ?? 'release'} done={finished} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {step ? (
          <>
            <h3 className="text-base font-semibold text-fg">{step.title}</h3>
            {step.situation}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-fg">{step.question}</legend>
              {step.options.map((o, i) => {
                const picked = tried.includes(i);
                const tone = picked ? (o.correct ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : 'border-line bg-surface hover:border-brand';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => choose(i)}
                    disabled={solved && !picked}
                    aria-pressed={picked}
                    className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50 ${tone}`}
                  >
                    {picked ? (
                      o.correct ? (
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                      ) : (
                        <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                      )
                    ) : (
                      <span className="mt-0.5 size-4 shrink-0 rounded-full border border-line-strong" aria-hidden="true" />
                    )}
                    <span className="min-w-0">{o.text}</span>
                  </button>
                );
              })}
            </fieldset>
            <div aria-live="polite">
              {last !== null && (
                <div className={`rounded-xl p-3 text-sm text-fg ${step.options[last].correct ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
                  <p className="font-semibold">{step.options[last].correct ? 'Good call' : 'Not quite. Try another option.'}</p>
                  <p className="mt-1">{step.options[last].feedback}</p>
                </div>
              )}
            </div>
            {solved && (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {stepIdx === STEPS.length - 1 ? 'See the summary' : 'Next step'}
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="flex items-center gap-2 text-base font-semibold text-fg">
              <Rocket className="size-5 text-brand" aria-hidden="true" /> 2.1.0 (415) is on its way to the stores
            </h3>
            <p className="text-sm text-fg" aria-live="polite">
              You got <strong>{score} of {STEPS.length}</strong> right on the first try.{' '}
              {score === STEPS.length ? 'Spotless. You followed the fix the whole way.' : score >= 5 ? 'Solid. Re-read the steps you missed below.' : 'Worth another round: the trail below is the habit to build.'}
            </p>
            <div className={card}>
              <p className="font-semibold text-fg">The trail of one fix</p>
              <ol className="mt-2 space-y-1 text-muted">
                <li>
                  Commit <code className={mono}>a1c9e2f</code> on <code className={mono}>fix/FD-327-reorder-prices</code>
                </li>
                <li>PR #418 · PR build tested · checks green after a re-run (flaky map test ticketed)</li>
                <li>
                  Merged into <code className={mono}>main</code> as <code className={mono}>7f3d0b1</code> → build 412 on staging
                </li>
                <li>Verified on 2.1.0 (412), staging, flag reorder_current_prices ON · focused regression</li>
                <li>
                  <code className={mono}>release/2.1.0</code> → RC 415 → stores
                </li>
              </ol>
            </div>
            <ul className="space-y-1 text-sm">
              {STEPS.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  {firstTry[i] ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                  ) : (
                    <Flag className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
                  )}
                  <span className="min-w-0 text-fg">
                    <span className="sr-only">{firstTry[i] ? 'Right first time:' : 'Needed another try:'}</span>
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Play again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
