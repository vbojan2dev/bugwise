import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Bug, RefreshCw, Search } from 'lucide-react';

/**
 * Interactive SDLC timeline: switch between Waterfall, V-model, Agile and DevOps,
 * see *when* testing happens on a project timeline, and click any phase to see
 * what the team does there and how a tester gets involved.
 */

type Phase = { id: string; label: string; what: string; tester: string; testing?: boolean };
type Segment = { start: number; end: number; kind: 'early' | 'exec' };
type Model = {
  id: string;
  label: string;
  summary: string;
  good: string;
  risk: string;
  phases: Phase[];
  /** Where testing happens on a 0–100 project timeline. */
  timeline: Segment[];
  timelineNote: string;
};

const waterfall: Model = {
  id: 'waterfall',
  label: 'Waterfall',
  summary: 'Each phase is finished and signed off before the next one starts, like water flowing down steps. Going back up is slow and expensive.',
  good: 'Clear plans and documents. Works when requirements are stable and well understood (for example, a regulated banking back-office system).',
  risk: 'Testers see working software late. A misunderstood requirement can survive for months before anyone runs the app.',
  phases: [
    { id: 'req', label: 'Requirements', what: 'Business analysts write down everything the app must do, often in a long requirements document.', tester: 'Review the document and ask questions: "What happens if the coupon has expired?" Ambiguities found here cost a conversation, not a rewrite.' },
    { id: 'design', label: 'Design', what: 'Architects and designers decide how the system is built: screens, databases, services.', tester: 'Start the test plan, think about test environments and devices, and check that designs match the requirements.' },
    { id: 'dev', label: 'Development', what: 'Developers write the code for the whole system. Usually the longest phase.', tester: 'Write test cases and prepare test data so you are ready when the build arrives.' },
    { id: 'test', label: 'Testing', testing: true, what: 'The finished system is handed to the test team, who run their test cases and report bugs.', tester: 'Execute tests, log bugs, retest fixes, run regression. This is where most testing effort lands in waterfall, often under deadline pressure.' },
    { id: 'deploy', label: 'Deployment', what: 'The app is released to production (or the app stores) for real users.', tester: 'Run a quick smoke test on production right after release to confirm the key flows work.' },
    { id: 'maint', label: 'Maintenance', what: 'The team fixes bugs found by users and makes small changes for years afterwards.', tester: 'Test patches and hotfixes, and run regression tests so a fix does not break something else.' },
  ],
  timeline: [{ start: 62, end: 86, kind: 'exec' }],
  timelineNote: 'Testing is one big block near the end. Bugs found there have to travel all the way back up.',
};

const vmodel: Model = {
  id: 'vmodel',
  label: 'V-model',
  summary: 'Like waterfall, but every development phase on the left has a matching test level on the right. Tests are designed early and run later.',
  good: 'Testers are involved from day one: each document is reviewed with "how will we test this?" in mind.',
  risk: 'Still sequential. Test execution happens late, so changing requirements remain painful.',
  phases: [
    { id: 'req', label: 'Requirements', what: 'What the business and users need: "Customers can apply one coupon per order."', tester: 'Design acceptance tests now. Pairs with: Acceptance testing.' },
    { id: 'sys', label: 'System design', what: 'How the whole system behaves: screens, flows, rules, non-functional needs like speed.', tester: 'Design system tests (end-to-end flows). Pairs with: System testing.' },
    { id: 'arch', label: 'Architecture', what: 'Which parts exist and how they talk: app, cart service, coupon service, payments API.', tester: 'Plan integration tests for each connection. Pairs with: Integration testing.' },
    { id: 'module', label: 'Module design', what: 'Detailed design of each small piece of code, like the discount calculation.', tester: 'Developers plan unit tests for each piece. Pairs with: Unit testing.' },
    { id: 'code', label: 'Coding', what: 'The bottom of the V. Developers write the code.', tester: 'Prepare test data and environments, and finish test cases.' },
    { id: 'unit', label: 'Unit testing', testing: true, what: 'Developers check each small piece of code on its own.', tester: 'Usually done by developers. Checks the module design.' },
    { id: 'int', label: 'Integration testing', testing: true, what: 'Pieces are connected and tested together: does the app talk correctly to the coupon API?', tester: 'Developers and testers. Checks the architecture.' },
    { id: 'systest', label: 'System testing', testing: true, what: 'The full app is tested end to end against the system design and requirements.', tester: 'Mostly the test team. Checks the system design.' },
    { id: 'acc', label: 'Acceptance testing', testing: true, what: 'The business or real users confirm the app solves their problem.', tester: 'Product owners, clients or users, supported by testers. Checks the requirements.' },
  ],
  timeline: [
    { start: 4, end: 14, kind: 'early' },
    { start: 18, end: 26, kind: 'early' },
    { start: 30, end: 38, kind: 'early' },
    { start: 55, end: 92, kind: 'exec' },
  ],
  timelineNote: 'Test design (light) starts with each document. Test execution (dark) still comes after coding.',
};

const agile: Model = {
  id: 'agile',
  label: 'Agile sprints',
  summary: 'Work is split into short sprints (often 2 weeks). Each sprint plans, builds, tests and demos a small, working slice of the product.',
  good: 'Feedback every couple of weeks. Testers work alongside developers, so bugs are found days (not months) after they are written.',
  risk: 'Less upfront documentation and constant change. Regression testing grows every sprint, so teams need a smart regression set and often automation.',
  phases: [
    { id: 'refine', label: 'Backlog refinement', what: 'The team discusses upcoming user stories and sharpens their acceptance criteria.', tester: 'Ask "what if...?" questions and suggest missing acceptance criteria. One of the highest-value moments for a tester.' },
    { id: 'plan', label: 'Sprint planning', what: 'The team picks the stories it can finish in this sprint.', tester: 'Estimate testing effort, flag risky stories, and note devices, data and environments you will need.' },
    { id: 'build', label: 'Build + test daily', testing: true, what: 'Developers build stories one by one. Each story is tested as soon as it is ready, not at the end.', tester: 'Write test cases, test each story on the test environment, log bugs, retest fixes, explore.' },
    { id: 'review', label: 'Sprint review', what: 'The team demos finished work to stakeholders and gathers feedback.', tester: 'Help show the features and share what was tested and any known issues.' },
    { id: 'retro', label: 'Retrospective', what: 'The team discusses what went well and what to improve next sprint.', tester: 'Raise process issues, like "stories arrived for testing on the last day".' },
    { id: 'release', label: 'Release', testing: true, what: 'The tested increment ships, every sprint or every few sprints.', tester: 'Regression and smoke tests on the release candidate, then a quick check in production.' },
  ],
  timeline: [
    { start: 3, end: 22, kind: 'exec' },
    { start: 28, end: 47, kind: 'exec' },
    { start: 53, end: 72, kind: 'exec' },
    { start: 78, end: 97, kind: 'exec' },
  ],
  timelineNote: 'Testing happens inside every sprint. Each block is a sprint where stories are built and tested together.',
};

const devops: Model = {
  id: 'devops',
  label: 'DevOps / CD',
  summary: 'Development and operations work as one team. Small changes flow through an automated pipeline and can reach users many times a week, or even a day.',
  good: 'Tiny changes are easy to test and easy to roll back. Automated checks run on every change, and production is monitored closely.',
  risk: 'Speed only works with good automated tests and monitoring. Manual testing focuses on new features, exploration and risky areas.',
  phases: [
    { id: 'plan', label: 'Plan', what: 'A small change is described as a story or task.', tester: 'Review the story and acceptance criteria. Point out risks early.' },
    { id: 'code', label: 'Code', what: 'A developer writes the change and its unit tests.', tester: 'Pair with the developer on test ideas; review which cases the automated tests cover.' },
    { id: 'build', label: 'Build', testing: true, what: 'The pipeline (CI) builds the app and runs unit tests automatically on every change.', tester: 'Watch for failed pipelines; a red build means the change is not ready.' },
    { id: 'test', label: 'Test', testing: true, what: 'Automated integration and UI tests run on a test environment. People test new features by hand.', tester: 'Exploratory and manual testing of the new feature on staging or a feature environment.' },
    { id: 'release', label: 'Release + deploy', what: 'The change goes to production, often to a small percentage of users first.', tester: 'Smoke test in production; check feature flags show the right thing to the right users.' },
    { id: 'monitor', label: 'Operate + monitor', testing: true, what: 'The team watches crash reports, error logs and user feedback.', tester: 'Investigate crash reports and user complaints, turn them into bug reports and new tests.' },
  ],
  timeline: Array.from({ length: 16 }, (_, i) => ({ start: i * 6.25 + 1, end: i * 6.25 + 4.5, kind: 'exec' as const })),
  timelineNote: 'Testing never stops: every small change is checked automatically, and new features get manual attention.',
};

const models: Model[] = [waterfall, vmodel, agile, devops];

function PhaseChip({ phase, selected, onSelect }: { phase: Phase; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-xl border px-3 py-1.5 text-left text-sm font-semibold transition-shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${
        phase.testing ? 'border-ok/40 bg-ok-soft text-fg' : 'border-line bg-surface text-fg'
      } ${selected ? 'shadow-[0_0_0_2px_var(--brand)]' : 'hover:shadow-[0_0_0_1px_var(--line-strong)]'}`}
    >
      {phase.testing ? <Bug size={14} className="shrink-0 text-ok" aria-hidden="true" /> : null}
      <span className="min-w-0">{phase.label}</span>
    </button>
  );
}

function VLayout({ model, sel, setSel }: { model: Model; sel: string; setSel: (id: string) => void }) {
  const left = model.phases.slice(0, 4);
  const right = model.phases.slice(5).reverse(); // acceptance, system, integration, unit
  const bottom = model.phases[4];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-3 text-xs font-semibold tracking-wide text-faint uppercase">
        <span className="flex items-center gap-1">
          <ArrowDown size={13} aria-hidden="true" /> Define + design
        </span>
        <span className="flex items-center justify-end gap-1">
          Test + verify <ArrowUp size={13} aria-hidden="true" />
        </span>
      </div>
      {left.map((l, i) => (
        <div key={l.id} className="grid grid-cols-2 items-center gap-x-3">
          <div className="min-w-0" style={{ paddingLeft: `${i * 6}%` }}>
            <PhaseChip phase={l} selected={sel === l.id} onSelect={() => setSel(l.id)} />
          </div>
          <div className="flex min-w-0 justify-end" style={{ paddingRight: `${i * 6}%` }}>
            <PhaseChip phase={right[i]} selected={sel === right[i].id} onSelect={() => setSel(right[i].id)} />
          </div>
        </div>
      ))}
      <div className="flex justify-center pt-1">
        <PhaseChip phase={bottom} selected={sel === bottom.id} onSelect={() => setSel(bottom.id)} />
      </div>
      <p className="text-center text-xs text-muted">Each row is a pair: the document on the left is checked by the test level on the right.</p>
    </div>
  );
}

export default function LifecycleModels() {
  const [modelId, setModelId] = useState('waterfall');
  const model = models.find((m) => m.id === modelId)!;
  const [sel, setSel] = useState<string>('req');
  const phase = model.phases.find((p) => p.id === sel) ?? model.phases[0];

  const pickModel = (id: string) => {
    setModelId(id);
    const m = models.find((x) => x.id === id)!;
    setSel(m.phases[0].id);
  };

  const loop = model.id === 'agile' || model.id === 'devops';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">When does testing happen?</p>
        <p className="text-sm text-muted">Switch the development model, then click any phase to see what testers do there.</p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-subtle p-1" role="group" aria-label="Development model">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pickModel(m.id)}
              aria-pressed={modelId === m.id}
              className={`flex-auto rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                modelId === m.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-fg">{model.summary}</p>

        {/* Timeline */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="font-semibold tracking-wide text-faint uppercase">Project timeline</span>
            <span className="flex flex-wrap items-center gap-3">
              {model.id === 'vmodel' ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block size-3 rounded-sm bg-ok/35" aria-hidden="true" /> test design
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-ok" aria-hidden="true" /> testing
              </span>
            </span>
          </div>
          <div
            className="relative h-8 overflow-hidden rounded-lg border border-line bg-subtle"
            role="img"
            aria-label={`Timeline for ${model.label}: ${model.timelineNote}`}
          >
            {model.timeline.map((s, i) => (
              <span
                key={i}
                className={`absolute inset-y-1 rounded ${s.kind === 'early' ? 'bg-ok/35' : 'bg-ok'}`}
                style={{ left: `${s.start}%`, width: `${s.end - s.start}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>Project start</span>
            <span>Release</span>
          </div>
          <p className="mt-1 text-sm text-muted">{model.timelineNote}</p>
        </div>

        {/* Phases */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            {loop ? <RefreshCw size={13} aria-hidden="true" /> : null}
            {loop ? (model.id === 'agile' ? 'One sprint (repeats)' : 'The pipeline (repeats for every change)') : 'Phases'}
          </p>
          {model.id === 'vmodel' ? (
            <VLayout model={model} sel={sel} setSel={setSel} />
          ) : (
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
              {model.phases.map((p, i) => (
                <li key={p.id} className="flex max-w-full min-w-0 items-center gap-1.5">
                  <PhaseChip phase={p} selected={sel === p.id} onSelect={() => setSel(p.id)} />
                  {i < model.phases.length - 1 ? (
                    <ArrowRight size={15} className="shrink-0 text-faint" aria-hidden="true" />
                  ) : loop ? (
                    <RefreshCw size={15} className="shrink-0 text-faint" aria-hidden="true" />
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-subtle p-4" aria-live="polite">
          <p className="font-semibold text-fg">{phase.label}</p>
          <p className="mt-1 text-sm text-fg">{phase.what}</p>
          <p className="mt-3 flex gap-2 text-sm text-fg">
            <Search size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Tester's role: </strong>
              {phase.tester}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-ok/30 bg-ok-soft p-3 text-sm text-fg">
            <p className="font-semibold">Works well</p>
            <p className="mt-0.5">{model.good}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-warn/30 bg-warn-soft p-3 text-sm text-fg">
            <p className="font-semibold">Watch out</p>
            <p className="mt-0.5">{model.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
