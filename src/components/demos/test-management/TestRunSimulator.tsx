import { useState } from 'react';
import { Bug, ChevronDown, CircleAlert, CircleCheck, ClipboardList, Eye, Play, RotateCcw, Smartphone } from 'lucide-react';
import { BUG_KEY, DEVICES, PRIORITIES, REPO, SECTIONS, STATUS_META, type Device, type Priority, type RepoCase, type Section, type Status } from './data';

/**
 * A mini test management tool for the FoodDash 2.0 release.
 * 1. Create a run: choose build, device, assignee and pick cases from the repository (by priority, section or one by one).
 * 2. Execute: open each case, read what happens on the build, set a status. Failed asks for a bug key, Blocked for a reason.
 *    The summary bar updates as you go. C203 starts as Retest (its bug was fixed).
 * 3. Close the run: compare every status with the expected one, with an explanation.
 * State lives only in this component.
 */

type Result = { status: Status; bug: string; reason: string };
type Phase = 'setup' | 'run' | 'review';

const BUILDS = [
  { id: '412', label: '412 · 2.0.0 candidate' },
  { id: '398', label: '398 · 1.9.3 live' },
];

const ASSIGNEES = ['You', 'Luka', 'Sara'];

const CHOICES: Status[] = ['passed', 'failed', 'blocked', 'retest', 'skipped'];

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-brand-fg hover:opacity-90`;
const btnGhost = `${btn} border border-line bg-surface text-muted hover:text-fg font-medium`;
const select =
  'w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

function initialResults(ids: string[]): Record<string, Result> {
  const r: Record<string, Result> = {};
  for (const id of ids) {
    const c = REPO.find((x) => x.id === id)!;
    r[id] = { status: c.initial ?? 'untested', bug: '', reason: '' };
  }
  return r;
}

function StatusPill({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${m.soft} ${status === 'untested' ? 'text-muted' : 'text-fg'}`}>
      <span className={`size-2 rounded-full ${m.dot}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function PriorityTag({ p }: { p: Priority }) {
  const cls = p === 'P1' ? 'border-danger/40 text-danger' : p === 'P2' ? 'border-warn/50 text-warn' : 'border-line-strong text-muted';
  return <span className={`shrink-0 rounded border px-1 text-[11px] font-bold tabular-nums ${cls}`}>{p}</span>;
}

function SummaryBar({ ids, results }: { ids: string[]; results: Record<string, Result> }) {
  const order: Status[] = ['passed', 'failed', 'blocked', 'retest', 'skipped', 'untested'];
  const counts = Object.fromEntries(order.map((s) => [s, ids.filter((id) => results[id]?.status === s).length])) as Record<Status, number>;
  const done = ids.length - counts.untested - counts.retest;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-subtle p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-fg">Run progress</p>
        <p className="text-sm text-muted tabular-nums" aria-live="polite">
          {done} / {ids.length} executed · {pct}%
        </p>
      </div>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-surface" aria-hidden="true">
        {order.map((s) =>
          counts[s] ? <div key={s} className={`${STATUS_META[s].dot} h-full transition-[width]`} style={{ width: `${(counts[s] / ids.length) * 100}%` }} /> : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {order.map((s) => (
          <li key={s} className="inline-flex items-center gap-1 tabular-nums">
            <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} aria-hidden="true" />
            {STATUS_META[s].label}: <span className="font-semibold text-fg">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TestRunSimulator() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [build, setBuild] = useState('412');
  const [device, setDevice] = useState<Device>('ios');
  const [assignee, setAssignee] = useState('You');
  const [picked, setPicked] = useState<string[]>([]);
  const [runIds, setRunIds] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [nextBug, setNextBug] = useState(241);

  const runCases = REPO.filter((c) => runIds.includes(c.id));
  const allOfPriority = (p: Priority) => REPO.filter((c) => c.priority === p).every((c) => picked.includes(c.id));
  const allOfSection = (s: Section) => REPO.filter((c) => c.section === s).every((c) => picked.includes(c.id));

  function toggleGroup(ids: string[], allOn: boolean) {
    setPicked((prev) => (allOn ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))));
  }
  function toggleOne(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function createRun() {
    const ids = REPO.map((c) => c.id).filter((id) => picked.includes(id));
    setRunIds(ids);
    setResults(initialResults(ids));
    setOpen(ids[0] ?? null);
    setPhase('run');
  }

  function setStatus(c: RepoCase, status: Status) {
    setResults((prev) => ({ ...prev, [c.id]: { ...prev[c.id], status } }));
    if (status === 'passed' || status === 'skipped') {
      // Move on to the next case that still needs work.
      const idx = runIds.indexOf(c.id);
      const next = [...runIds.slice(idx + 1), ...runIds.slice(0, idx)].find((id) => {
        const st = results[id]?.status;
        return st === 'untested' || st === 'retest';
      });
      setOpen(next ?? null);
    }
  }

  function setField(id: string, field: 'bug' | 'reason', value: string) {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function createBug(id: string) {
    setField(id, 'bug', `FD-${nextBug}`);
    setNextBug((n) => n + 1);
  }

  function reset() {
    setPhase('setup');
    setPicked([]);
    setRunIds([]);
    setResults({});
    setOpen(null);
    setNextBug(241);
  }

  const runName = `FoodDash 2.0.0 regression · build ${build} · ${DEVICES[device]}`;
  const wrongBuild = build !== '412';

  // ---------- Review ----------
  const graded = runCases.map((c) => {
    const r = results[c.id];
    const want = c.answer(device);
    const statusOk = r.status === want;
    const bugOk = r.status !== 'failed' || BUG_KEY.test(r.bug.trim().toUpperCase());
    const reasonOk = r.status !== 'blocked' || r.reason.trim().length >= 3;
    return { c, r, want, statusOk, bugOk, reasonOk };
  });
  const score = graded.filter((g) => g.statusOk).length;
  const missingP1 = REPO.filter((c) => c.priority === 'P1' && !runIds.includes(c.id));
  const leftOpen = graded.filter((g) => g.r.status === 'untested' || g.r.status === 'retest');

  return (
    <div className="not-prose my-8 overflow-clip rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <ClipboardList size={17} className="text-brand" aria-hidden="true" /> Test run simulator
        </p>
        <p className="text-sm text-muted">A mini test management tool. Create a run for the FoodDash 2.0 release, execute it, then compare your statuses with ours.</p>
        <ol className="mt-3 flex flex-wrap gap-1.5 text-xs" aria-label="Steps">
          {(['setup', 'run', 'review'] as Phase[]).map((p, i) => (
            <li
              key={p}
              aria-current={phase === p ? 'step' : undefined}
              className={`rounded-full px-2.5 py-1 font-semibold ${phase === p ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted'}`}
            >
              {i + 1}. {p === 'setup' ? 'Create the run' : p === 'run' ? 'Execute' : 'Close and review'}
            </li>
          ))}
        </ol>
      </div>

      {phase === 'setup' && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="min-w-0 text-sm">
              <span className="mb-1 block font-semibold text-fg">Build</span>
              <select className={select} value={build} onChange={(e) => setBuild(e.target.value)}>
                {BUILDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-sm">
              <span className="mb-1 block font-semibold text-fg">Device</span>
              <select className={select} value={device} onChange={(e) => setDevice(e.target.value as Device)}>
                {(Object.keys(DEVICES) as Device[]).map((d) => (
                  <option key={d} value={d}>
                    {DEVICES[d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-sm">
              <span className="mb-1 block font-semibold text-fg">Assign to</span>
              <select className={select} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {ASSIGNEES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
          {wrongBuild && (
            <p className="flex gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-fg" role="status">
              <CircleAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              Build 398 is what customers already have. Release testing for 2.0 runs on the release candidate, build 412.
            </p>
          )}

          <div>
            <p className="mb-1.5 text-sm font-semibold text-fg">Pick cases from the repository</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select by priority">
              <span className="self-center text-xs text-faint">Priority:</span>
              {PRIORITIES.map((p) => {
                const on = allOfPriority(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleGroup(REPO.filter((c) => c.priority === p).map((c) => c.id), on)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${on ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'}`}
                  >
                    All {p}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Select by section">
              <span className="self-center text-xs text-faint">Section:</span>
              {SECTIONS.map((s) => {
                const on = allOfSection(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleGroup(REPO.filter((c) => c.section === s).map((c) => c.id), on)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${on ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            {SECTIONS.map((s) => (
              <div key={s} className="min-w-0 border-b border-line last:border-b-0">
                <p id={`sec-${s}`} className="bg-subtle px-3 py-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{s}</p>
                <ul aria-labelledby={`sec-${s}`}>
                  {REPO.filter((c) => c.section === s).map((c) => (
                    <li key={c.id} className="border-t border-line first:border-t-0">
                      <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm hover:bg-subtle">
                        <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--brand)]" checked={picked.includes(c.id)} onChange={() => toggleOne(c.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-mono text-xs text-faint">{c.id}</span>
                            <PriorityTag p={c.priority} />
                            <span className="text-xs text-faint">{c.automation}</span>
                          </span>
                          <span className="block break-words text-fg">{c.title}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={btnPrimary} disabled={picked.length === 0 || wrongBuild} onClick={createRun}>
              <Play size={14} aria-hidden="true" /> Create run ({picked.length} {picked.length === 1 ? 'case' : 'cases'})
            </button>
            <p className="min-w-0 text-xs text-muted">
              {picked.length === 0 ? 'Tip: start with All P1, then add P2 if there is time.' : <span className="break-words">Run name: {runName}</span>}
            </p>
          </div>
        </div>
      )}

      {phase === 'run' && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold break-words text-fg">{runName}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Smartphone size={12} aria-hidden="true" /> Assigned to {assignee} · {runIds.length} cases
              </p>
            </div>
          </div>
          <SummaryBar ids={runIds} results={results} />

          <ul className="space-y-2">
            {runCases.map((c) => {
              const r = results[c.id];
              const isOpen = open === c.id;
              const bugInvalid = r.status === 'failed' && r.bug.trim() !== '' && !BUG_KEY.test(r.bug.trim().toUpperCase());
              return (
                <li key={c.id} className={`rounded-xl border ${isOpen ? 'border-brand' : 'border-line'}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((o) => (o === c.id ? null : c.id))}
                    className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-xs text-faint">{c.id}</span>
                        <PriorityTag p={c.priority} />
                        <StatusPill status={r.status} />
                        {r.status === 'failed' && r.bug && <span className="font-mono text-xs text-danger">{r.bug.toUpperCase()}</span>}
                      </span>
                      <span className="mt-0.5 block text-sm break-words text-fg">{c.title}</span>
                    </span>
                    <ChevronDown size={16} className={`mt-1 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-line px-3 py-3 text-sm">
                      {c.initial === 'retest' && c.retestNote && <p className="rounded-lg bg-info-soft px-3 py-2 text-fg">{c.retestNote}</p>}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="min-w-0">
                          {c.preconditions && (
                            <p className="mb-1 text-muted">
                              <span className="font-semibold text-fg">Preconditions:</span> {c.preconditions}
                            </p>
                          )}
                          <p className="font-semibold text-fg">Steps</p>
                          <ol className="ml-5 list-decimal text-muted">
                            {c.steps.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ol>
                          <p className="mt-1 text-muted">
                            <span className="font-semibold text-fg">Expected:</span> {c.expected}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-lg border border-dashed border-line-strong bg-subtle px-3 py-2">
                          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
                            <Eye size={13} aria-hidden="true" /> What you see on build {build}
                          </p>
                          <p className="mt-1 break-words text-fg">{c.observed(device)}</p>
                        </div>
                      </div>

                      <div role="group" aria-label={`Status for ${c.id}`} className="flex flex-wrap gap-1.5">
                        {CHOICES.map((s) => {
                          const on = r.status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setStatus(c, s)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                                on ? `border-transparent ${STATUS_META[s].soft} text-fg ring-1 ring-current` : 'border-line text-muted hover:text-fg'
                              }`}
                            >
                              <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} aria-hidden="true" />
                              {STATUS_META[s].label}
                            </button>
                          );
                        })}
                      </div>

                      {r.status === 'failed' && (
                        <div className="rounded-lg bg-danger-soft px-3 py-2">
                          <label htmlFor={`bug-${c.id}`} className="flex items-center gap-1.5 font-semibold text-fg">
                            <Bug size={14} aria-hidden="true" /> Linked bug (required for Failed)
                          </label>
                          <div className="mt-1.5 flex gap-2">
                            <input
                              id={`bug-${c.id}`}
                              value={r.bug}
                              onChange={(e) => setField(c.id, 'bug', e.target.value)}
                              placeholder="e.g. FD-241"
                              autoComplete="off"
                              aria-invalid={bugInvalid}
                              aria-describedby={`bughelp-${c.id}`}
                              className="w-0 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                            />
                            <button type="button" className={`${btnGhost} shrink-0 px-3`} onClick={() => createBug(c.id)} disabled={BUG_KEY.test(r.bug.trim().toUpperCase())}>
                              Create bug
                            </button>
                          </div>
                          <p id={`bughelp-${c.id}`} className={`mt-1 text-xs ${bugInvalid ? 'text-danger' : 'text-muted'}`}>
                            {bugInvalid
                              ? 'Use a Jira key like FD-241.'
                              : BUG_KEY.test(r.bug.trim().toUpperCase())
                                ? 'Linked. In a real tool the bug would carry the steps, the actual result and your screenshot.'
                                : 'Type the key of an existing bug, or create a new one.'}
                          </p>
                        </div>
                      )}
                      {r.status === 'blocked' && (
                        <div className="rounded-lg bg-warn-soft px-3 py-2">
                          <label htmlFor={`reason-${c.id}`} className="font-semibold text-fg">
                            What blocks it? (required for Blocked)
                          </label>
                          <input
                            id={`reason-${c.id}`}
                            value={r.reason}
                            onChange={(e) => setField(c.id, 'reason', e.target.value)}
                            placeholder="e.g. Payment sandbox down until 15:00"
                            className="mt-1.5 block w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => setPhase('review')}>
              <CircleCheck size={14} aria-hidden="true" /> Close run and compare
            </button>
            <button type="button" className={btnGhost} onClick={() => setPhase('setup')}>
              Back to setup
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-4 p-4 sm:p-5" role="region" aria-label="Run review">
          <SummaryBar ids={runIds} results={results} />
          <div className="rounded-xl border border-line bg-subtle p-3 text-sm text-fg">
            <p className="font-semibold">
              {score} of {runIds.length} statuses match ours.
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
              {leftOpen.length > 0 && (
                <li>
                  {leftOpen.length} {leftOpen.length === 1 ? 'case is' : 'cases are'} still Untested or Retest ({leftOpen.map((g) => g.c.id).join(', ')}). A closed run with open cases must say so in the report.
                </li>
              )}
              {graded.some((g) => !g.bugOk) && <li>Some failures have no valid bug key. Every Failed case should point to a bug, otherwise nobody fixes it and nobody knows when to retest.</li>}
              {graded.some((g) => !g.reasonOk) && <li>A Blocked case has no reason. Write what blocks it so the team can unblock it and you know when to re-run.</li>}
              {missingP1.length > 0 && (
                <li>
                  You left out P1 cases ({missingP1.map((c) => c.id).join(', ')}). In a release run, the P1 cases are the last ones to drop.
                </li>
              )}
              {device === 'android' && runIds.includes('C103') && <li>C103 is iOS-only. Next time leave it out of an Android run rather than skipping it.</li>}
              {score === runIds.length && leftOpen.length === 0 && graded.every((g) => g.bugOk && g.reasonOk) && <li>Clean run: every status, bug link and reason is right.</li>}
            </ul>
          </div>

          <ul className="space-y-2">
            {graded.map(({ c, r, want, statusOk, bugOk, reasonOk }) => (
              <li key={c.id} className="rounded-xl border border-line p-3 text-sm">
                <p className="flex items-start gap-2">
                  {statusOk ? (
                    <CircleCheck size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Correct" />
                  ) : (
                    <CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Different" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-faint">{c.id}</span> <span className="break-words text-fg">{c.title}</span>
                  </span>
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-xs text-muted">
                  You: <StatusPill status={r.status} />
                  {!statusOk && (
                    <>
                      Expected: <StatusPill status={want} />
                    </>
                  )}
                  {r.status === 'failed' && (bugOk ? <span className="font-mono text-fg">{r.bug.trim().toUpperCase()}</span> : <span className="text-danger">no valid bug key</span>)}
                  {r.status === 'blocked' && !reasonOk && <span className="text-danger">no reason given</span>}
                </p>
                <p className="mt-1.5 pl-6 text-muted">{c.why(device)}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => setPhase('run')}>
              Back to the run
            </button>
            <button type="button" className={btnGhost} onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" /> Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
