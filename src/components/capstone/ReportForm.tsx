import { useState } from 'react';
import { ArrowRight, ClipboardCopy, Import, TriangleAlert } from 'lucide-react';
import { completePhase, loadCapstone, SCREEN_LABEL, SEVERITIES, SPEC, type Severity } from '@/lib/capstone';
import { href } from '@/lib/url';
import { CHARTERS } from './ExploreSession';
import { useArtifact, useCapstone } from './useCapstone';
import { TextArea } from './ui';

type Rec = 'go' | 'conditional' | 'no-go';
interface Report {
  tested: string;
  notTested: string;
  risks: string;
  questions: string;
  recommendation: Rec | '';
  justification: string;
  submittedAt?: string;
}
const blank = (): Report => ({ tested: '', notTested: '', risks: '', questions: '', recommendation: '', justification: '' });

const RECS: { id: Rec; label: string; text: string }[] = [
  { id: 'go', label: 'Go', text: 'Ship on Friday as planned.' },
  { id: 'conditional', label: 'Go with conditions', text: 'Ship only if named bugs are fixed and retested first, or with an agreed workaround.' },
  { id: 'no-go', label: 'No-go', text: 'Do not ship on Friday; the risk is too high.' },
];

const SEV_TONE: Record<Severity, string> = {
  critical: 'bg-danger-soft text-danger',
  major: 'bg-warn-soft text-warn',
  minor: 'bg-info-soft text-info',
  trivial: 'bg-subtle text-muted',
};

const asLines = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export default function ReportForm() {
  const state = useCapstone();
  const [r, setR, loaded] = useArtifact<Report>('report', blank);
  const [problems, setProblems] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const set = <K extends keyof Report>(k: K, v: Report[K]) => setR((p) => ({ ...p, [k]: v }));
  const reports = state?.reports ?? [];
  const bySev = SEVERITIES.map((s) => ({ s, n: reports.filter((x) => x.severity === s).length }));
  const submitted = !!r.submittedAt;

  const prefill = () => {
    const s = loadCapstone();
    const plan = (s.artifacts.plan ?? {}) as { scopeIn?: string; scopeOut?: string };
    const ex = (s.artifacts.explore ?? {}) as { done?: number[]; elapsed?: number; runningSince?: number | null };
    const mins = Math.round(((ex.elapsed ?? 0) + (ex.runningSince ? Date.now() - ex.runningSince : 0)) / 60000);
    const charters = (ex.done ?? []).map((i) => CHARTERS[i]?.area).filter(Boolean);
    setR((p) => ({
      ...p,
      tested:
        p.tested ||
        [
          `${SPEC.app} ${SPEC.version} (build ${SPEC.build}) on staging.`,
          mins ? `Exploratory testing: about ${mins} minutes${charters.length ? `, charters: ${charters.join(', ')}` : ''}.` : charters.length ? `Charters covered: ${charters.join(', ')}.` : '',
          asLines(plan.scopeIn) ? `Planned scope:\n${asLines(plan.scopeIn)}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      notTested: p.notTested || asLines(plan.scopeOut),
    }));
  };

  const submit = (force = false) => {
    const out: string[] = [];
    if (!r.tested.trim()) out.push('Say what you tested.');
    if (!r.recommendation) out.push('Choose a recommendation.');
    if (r.justification.trim().length < 30) out.push('Justify your recommendation in a sentence or two.');
    if (out.length && !force) return setProblems(out);
    setProblems([]);
    setR((p) => ({ ...p, submittedAt: p.submittedAt ?? new Date().toISOString() }));
    completePhase('report');
    setTimeout(() => document.getElementById('report-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const asText = () =>
    [
      `Test summary: ${SPEC.app} ${SPEC.version} (build ${SPEC.build})`,
      '',
      `Recommendation: ${RECS.find((x) => x.id === r.recommendation)?.label ?? '(none)'}`,
      r.justification,
      '',
      'What was tested:',
      r.tested,
      '',
      'Not tested:',
      r.notTested || '-',
      '',
      `Bugs reported (${reports.length}): ${bySev.map((b) => `${b.n} ${b.s}`).join(', ')}`,
      ...reports.map((x) => `- ${x.id} [${x.severity}/${x.priority}] ${x.title} (${SCREEN_LABEL[x.screen]})`),
      '',
      'Open risks:',
      r.risks || '-',
      '',
      'Open questions:',
      r.questions || '-',
    ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied('Copied. Paste it into an email or chat.');
    } catch {
      setCopied('Could not copy in this browser.');
    }
    setTimeout(() => setCopied(''), 3000);
  };

  const hasCritical = reports.some((x) => x.severity === 'critical');
  const hasMajor = reports.some((x) => x.severity === 'major');

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-subtle" />;

  return (
    <div className="not-prose space-y-8">
      <form
        className="card space-y-7 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Test summary report: {SPEC.app} {SPEC.version}
          </h2>
          <button type="button" onClick={prefill} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
            <Import size={15} aria-hidden /> Fill from my plan and session
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextArea label="1. What was tested" hint="Build, areas, devices and settings, time spent." value={r.tested} onChange={(v) => set('tested', v)} rows={6} />
          <TextArea label="2. What was not tested, and why" hint="Out of scope, blocked, or no time. Be honest: this is risk the team accepts." value={r.notTested} onChange={(v) => set('notTested', v)} rows={6} />
        </div>

        <div>
          <p className="text-sm font-semibold">3. Bugs by severity</p>
          <p className="mt-0.5 text-xs text-muted">Filled in automatically from the reports you filed in the app, with your own ratings.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {bySev.map(({ s, n }) => (
              <div key={s} className={['rounded-xl p-3', SEV_TONE[s]].join(' ')}>
                <p className="text-2xl font-bold tabular-nums">{n}</p>
                <p className="text-xs font-medium capitalize">{s}</p>
              </div>
            ))}
          </div>
          {reports.length ? (
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
              {reports.map((x) => (
                <li key={x.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-faint">{x.id}</span>
                  <span className="min-w-0 flex-1 break-words">{x.title || '(untitled)'}</span>
                  <span className="text-xs text-muted">{SCREEN_LABEL[x.screen]}</span>
                  <span className={['rounded-md px-1.5 py-0.5 text-xs font-medium capitalize', SEV_TONE[x.severity]].join(' ')}>{x.severity}</span>
                  <span className="rounded-md bg-subtle px-1.5 py-0.5 text-xs font-medium">{x.priority}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              No bug reports yet. File them from the app on <a className="text-brand underline" href={href('/capstone/test')}>Test the app</a>.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextArea label="4. Open risks" hint="What could still hurt users after release? Include bugs you couldn't reproduce and areas tested lightly." value={r.risks} onChange={(v) => set('risks', v)} rows={5} />
          <TextArea label="5. Open questions" hint="Gaps in the brief that need a decision (see the brief's open questions)." value={r.questions} onChange={(v) => set('questions', v)} rows={5} />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">6. Recommendation for Friday</legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {RECS.map((o) => (
              <label key={o.id} className="flex min-w-0 cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="radio" name="rec" className="mt-1 size-4 shrink-0 accent-[var(--brand)]" checked={r.recommendation === o.id} onChange={() => set('recommendation', o.id)} />
                <span className="min-w-0">
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-xs leading-relaxed text-muted">{o.text}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <TextArea
              label="Justification"
              hint="Two or three sentences a product owner can act on: which bugs or risks drive your call, and what would change it."
              value={r.justification}
              onChange={(v) => set('justification', v)}
              rows={4}
            />
          </div>
        </fieldset>

        {problems.length > 0 && (
          <div role="alert" className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
            <p className="font-semibold">Before you send it:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <button type="button" onClick={() => submit(true)} className="mt-2 font-medium text-brand underline">
              Submit anyway
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
            {submitted ? 'Update report' : 'Submit report'}
          </button>
          <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium hover:border-brand hover:text-brand">
            <ClipboardCopy size={16} aria-hidden /> Copy as text
          </button>
          <span className="text-sm text-muted" aria-live="polite">
            {copied}
          </span>
        </div>
      </form>

      {submitted && (
        <section id="report-feedback" className="scroll-mt-24 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-ok uppercase">Report sent to Sara</p>
          <h2 className="text-2xl font-bold tracking-tight">How a lead reads your report</h2>
          {r.recommendation === 'go' && (hasCritical || hasMajor) && (
            <p className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />
              <span>
                You recommend <strong>Go</strong> while your own reports include {hasCritical ? 'a Critical' : 'Major'} bug{hasCritical ? '' : 's'}. That can be right (with a
                workaround or a business reason), but your justification needs to say why the risk is acceptable.
              </span>
            </p>
          )}
          {reports.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />
              <span>You filed no bug reports. A release with zero bugs found usually means it wasn't tested deeply enough, not that it has none.</span>
            </p>
          )}
          <ul className="grid grid-cols-1 gap-3 text-sm leading-relaxed md:grid-cols-2">
            <li className="card p-4"><strong>Recommendation first.</strong> Busy people read the first two lines. Lead with go / no-go and the one reason that matters most.</li>
            <li className="card p-4"><strong>Facts, not feelings.</strong> "2 Critical bugs open in checkout (R3, R7)" beats "checkout felt buggy".</li>
            <li className="card p-4"><strong>Name what you didn't test.</strong> Untested areas are risks the team accepts by shipping. Make that choice visible.</li>
            <li className="card p-4"><strong>Conditions must be checkable.</strong> "Go if R3 and R7 are fixed and retested on Thursday" is clear; "Go if things improve" is not.</li>
            <li className="card p-4 md:col-span-2">
              <strong>The usual call:</strong> any open Critical bug in payment or checkout, or a bug that exposes personal data, normally means <em>No-go</em> or <em>Go with conditions</em>
              (fix and retest first). Majors are weighed one by one; Minors and Trivials rarely block a release on their own. The product owner makes the final decision; you
              give them the facts to make it well.
            </li>
          </ul>
          <a href={href('/capstone/results')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
            See your results <ArrowRight size={18} aria-hidden />
          </a>
        </section>
      )}
    </div>
  );
}
