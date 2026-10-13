import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, Eye, Hand, RotateCcw, ScanSearch, XCircle } from 'lucide-react';
import { HEURISTICS } from './heuristics';

/**
 * Heuristic evaluation of a deliberately confusing "Account" screen in a fitness app.
 * Mode "Use it": the screen works (badly). Mode "Evaluate": every area becomes a tap target; the learner
 * tags the violated heuristic (or "No problem here") and gets feedback, plus a model bug report line.
 *
 * Problems (7): no way back (3), two different save styles and words (4), jargon toggle (2),
 * plan code from an email (6), error code instead of a message (9), Save gives no feedback (1),
 * Delete account without confirmation (5). Fine areas (4): email row, units, reminders toggle, help link.
 */

type Region = {
  id: string;
  label: string;
  problem: boolean;
  best?: number;
  also?: number[];
  explain: string;
  hint?: string;
  report?: { evidence: string; impact: string; severity: string };
};

const REGIONS: Region[] = [
  {
    id: 'header',
    label: 'Header',
    problem: true,
    best: 3,
    also: [4],
    explain: 'There is no Back or Close button. On iPhone there is no system Back button, so the only way out is to guess a swipe from the screen edge.',
    hint: 'How do you leave this screen?',
    report: { evidence: 'Account screen has no Back/Close control (iOS 18, iPhone 15).', impact: 'Users who opened it by mistake can’t find a way out except by guessing the edge swipe.', severity: '3, major' },
  },
  {
    id: 'email',
    label: 'Email row',
    problem: false,
    explain: 'Clear label, the value is visible and “Verified” tells the status. Nothing wrong here.',
  },
  {
    id: 'name',
    label: 'Name with Update button',
    problem: true,
    best: 4,
    also: [8],
    explain: 'The name has its own blue “Update” button, while the rest of the screen uses a gray “Save” link at the bottom. Same action, different words and styles: users wonder whether Save also saves the name.',
    hint: 'Compare this button with the one at the bottom of the screen.',
    report: { evidence: 'Name uses a filled blue “Update” button; other fields use a gray “Save” text link.', impact: 'Users are unsure which button saves what and may leave changes unsaved.', severity: '2, minor' },
  },
  {
    id: 'units',
    label: 'Units',
    problem: false,
    explain: 'A clear segmented control with familiar units and a visible selection. Fine.',
  },
  {
    id: 'sync',
    label: 'Sync toggle',
    problem: true,
    best: 2,
    explain: '“Sync telemetry payload (TTL 3600 s)” is developer language. Users can’t tell what turning it off does to their workouts or privacy.',
    hint: 'Would your neighbor understand this label?',
    report: { evidence: 'Toggle label reads “Sync telemetry payload (TTL 3600 s)”.', impact: 'Users can’t make an informed choice about their data; some will switch it off and lose workout sync.', severity: '2, minor' },
  },
  {
    id: 'plan',
    label: 'Plan code',
    problem: true,
    best: 6,
    also: [7],
    explain: 'To change plans, users must remember or dig up a code from a welcome email. The app knows the plans and could simply list them to choose from.',
    hint: 'Where would a user find this code?',
    report: { evidence: 'Changing plan requires typing a code “from your welcome email”; no list of plans is shown.', impact: 'Users must leave the app and search old email; many will give up on upgrading.', severity: '2, minor' },
  },
  {
    id: 'weight',
    label: 'Goal weight error',
    problem: true,
    best: 9,
    also: [2],
    explain: '“ERR_VALIDATION_422” says neither what is wrong (a negative weight) nor how to fix it.',
    hint: 'Does the message tell you what to do?',
    report: { evidence: 'Entering -5 in Goal weight shows “ERR_VALIDATION_422”.', impact: 'Users don’t know what is wrong or how to fix it.', severity: '2, minor' },
  },
  {
    id: 'dark',
    label: 'Workout reminders toggle',
    problem: false,
    explain: 'A standard switch with a plain-language label and a clear on/off state. Fine.',
  },
  {
    id: 'help',
    label: 'Help center link',
    problem: false,
    explain: 'Help is easy to find, clearly labeled and close to the settings it explains. That’s heuristic 10 done right.',
  },
  {
    id: 'save',
    label: 'Save link',
    problem: true,
    best: 1,
    also: [4],
    explain: 'Tapping Save shows nothing: no toast, no checkmark, no change. Users tap it again or leave unsure whether anything was saved. (Try it in “Use it” mode.)',
    hint: 'Use the screen and tap it. What tells you it worked?',
    report: { evidence: 'After tapping Save, nothing on screen changes (data is saved, checked after reopening).', impact: 'Users can’t tell if changes were saved; in a quick hallway test, testers tapped it several times.', severity: '3, major' },
  },
  {
    id: 'delete',
    label: 'Delete account button',
    problem: true,
    best: 5,
    also: [3],
    explain: 'A destructive, permanent action is styled as the main button and runs on a single tap, with no confirmation and no undo.',
    hint: 'What happens if you tap this by accident?',
    report: { evidence: 'One tap on “Delete account” deletes it immediately; no confirmation, no undo.', impact: 'Permanent loss of the account and workout history from one accidental tap.', severity: '4, catastrophe' },
  },
];

const PROBLEMS = REGIONS.filter((r) => r.problem).length;
type Answer = { choice: number; verdict: 'right' | 'partial' | 'wrong' };

export default function HeuristicEvaluation() {
  const [mode, setMode] = useState<'use' | 'eval'>('use');
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState(false);
  // "Use it" state
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');
  const [dark, setDark] = useState(false);
  const [sync, setSync] = useState(true);
  const [weight, setWeight] = useState('-5');
  const [deleted, setDeleted] = useState(false);
  const [taps, setTaps] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const found = REGIONS.filter((r) => r.problem && (answers[r.id]?.verdict === 'right' || answers[r.id]?.verdict === 'partial')).length;
  const region = REGIONS.find((r) => r.id === selected) ?? null;

  useEffect(() => {
    if (!selected || !panelRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) panelRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const choose = (choice: number) => {
    if (!region) return;
    let verdict: Answer['verdict'];
    if (!region.problem) verdict = choice === 0 ? 'right' : 'wrong';
    else if (choice === region.best) verdict = 'right';
    else if (region.also?.includes(choice)) verdict = 'partial';
    else verdict = 'wrong';
    setAnswers((prev) => ({ ...prev, [region.id]: { choice, verdict } }));
  };

  const resetAll = () => {
    setAnswers({});
    setSelected(null);
    setRevealed(false);
    setDeleted(false);
    setUnits('kg');
    setDark(false);
    setSync(true);
    setWeight('-5');
    setTaps(0);
  };

  const evalMode = mode === 'eval';

  const ctx: AreaCtx = { evalMode, selected, answers, revealed, select: setSelected };
  const weightBad = weight.trim() === '' || !(Number(weight) > 0);
  const field = 'w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-2.5 py-1.5 text-[13px] text-[#111827]';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <p className="font-semibold text-fg">🔎 Heuristic evaluation: a fitness app’s Account screen</p>
        <p className="text-sm text-muted">
          First <strong>use</strong> the screen for a minute. Then switch to <strong>Evaluate</strong>, tap each area that bothers you and tag the heuristic it breaks.
          Some areas are fine.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-line p-0.5" role="group" aria-label="Mode">
            {(
              [
                ['use', 'Use it', Hand],
                ['eval', 'Evaluate', ScanSearch],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  setSelected(null);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                  mode === m ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon size={13} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-fg tabular-nums" aria-live="polite">
            Problems found: {found}/{PROBLEMS}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* The device */}
        <div className="mx-auto w-full max-w-[20rem] min-w-0">
          <div className="rounded-[2rem] bg-[#0c0d12] p-2 shadow-lg">
            <div className="overflow-hidden rounded-[1.6rem] bg-[#f2f2f7] text-[#111827]" style={{ colorScheme: 'light' }}>
              <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[11px] font-semibold">
                <span>9:41</span>
                <span aria-hidden="true">▮▮▮ ◔</span>
              </div>
              {deleted ? (
                <div className="flex min-h-[26rem] flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="text-base font-semibold">Your account has been deleted.</p>
                  <p className="text-[13px] text-[#4b5563]">All workouts and history were removed.</p>
                  <p className="text-[11px] text-[#6b7280]">(One tap. No “Are you sure?”, no undo.)</p>
                </div>
              ) : (
                <div className="space-y-2.5 px-3 pt-1 pb-4">
                  <Area ctx={ctx} id="header">
                    <div className="py-1.5 text-center text-[15px] font-semibold">Account</div>
                  </Area>

                  <div className="space-y-2.5 rounded-xl bg-white p-3">
                    <Area ctx={ctx} id="email">
                      <div className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="text-[#6b7280]">Email</span>
                        <span className="min-w-0 truncate">
                          mia.chen@mail.com <span className="ml-1 rounded bg-[#dcfce7] px-1 text-[10px] font-semibold text-[#166534]">Verified</span>
                        </span>
                      </div>
                    </Area>
                    <Area ctx={ctx} id="name">
                      <label className="block text-[12px] text-[#6b7280]" htmlFor="he-name">
                        Name
                      </label>
                      <div className="mt-0.5 flex gap-1.5">
                        <input id="he-name" defaultValue="Mia Chen" className={`${field} w-0 flex-1`} />
                        <button type="button" className="shrink-0 rounded-lg bg-[#2563eb] px-2.5 text-[12px] font-semibold text-white">
                          Update
                        </button>
                      </div>
                    </Area>
                    <Area ctx={ctx} id="units">
                      <div className="flex items-center justify-between gap-2 text-[13px]">
                        <span id="he-units" className="text-[#6b7280]">
                          Units
                        </span>
                        <div className="inline-flex rounded-lg bg-[#e5e7eb] p-0.5" role="radiogroup" aria-labelledby="he-units">
                          {(['kg', 'lb'] as const).map((u) => (
                            <button
                              key={u}
                              type="button"
                              role="radio"
                              aria-checked={units === u}
                              onClick={() => setUnits(u)}
                              className={`rounded-md px-3 py-0.5 text-[12px] font-semibold ${units === u ? 'bg-white shadow-sm' : 'text-[#4b5563]'}`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Area>
                    <Area ctx={ctx} id="weight">
                      <label className="block text-[12px] text-[#6b7280]" htmlFor="he-weight">
                        Goal weight ({units})
                      </label>
                      <input
                        id="he-weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        inputMode="decimal"
                        aria-invalid={weightBad}
                        aria-describedby="he-weight-err"
                        className={`${field} mt-0.5 ${weightBad ? 'border-[#dc2626]' : ''}`}
                      />
                      {weightBad && (
                        <p id="he-weight-err" className="mt-0.5 font-mono text-[11px] text-[#b91c1c]">
                          ERR_VALIDATION_422
                        </p>
                      )}
                    </Area>
                  </div>

                  <div className="space-y-2.5 rounded-xl bg-white p-3">
                    <Area ctx={ctx} id="sync">
                      <Switch label="Sync telemetry payload (TTL 3600 s)" on={sync} onChange={() => setSync((s) => !s)} />
                    </Area>
                    <Area ctx={ctx} id="dark">
                      <Switch label="Workout reminders" on={dark} onChange={() => setDark((d) => !d)} />
                    </Area>
                    <Area ctx={ctx} id="plan">
                      <label className="block text-[12px] text-[#6b7280]" htmlFor="he-plan">
                        Change plan
                      </label>
                      <input id="he-plan" placeholder="Plan code from your welcome email" className={`${field} mt-0.5`} />
                    </Area>
                  </div>

                  <Area ctx={ctx} id="help">
                    <a
                      href="#help"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[13px] text-[#111827]"
                    >
                      Help center <ChevronRight size={15} className="text-[#9ca3af]" aria-hidden="true" />
                    </a>
                  </Area>

                  <div className="flex items-center justify-between gap-2 px-1">
                    <Area ctx={ctx} id="save">
                      <button type="button" onClick={() => setTaps((t) => t + 1)} className="px-1 py-1 text-[13px] text-[#6b7280] underline">
                        Save
                      </button>
                    </Area>
                    <Area ctx={ctx} id="delete" className="min-w-0 flex-1">
                      <button type="button" onClick={() => setDeleted(true)} className="w-full rounded-xl bg-[#2563eb] px-3 py-2.5 text-[14px] font-semibold text-white">
                        Delete account
                      </button>
                    </Area>
                  </div>
                </div>
              )}
              <div className="flex justify-center pb-2" aria-hidden="true">
                <span className="h-1 w-24 rounded-full bg-[#111827]/80" />
              </div>
            </div>
          </div>
          {deleted && (
            <button
              type="button"
              onClick={() => setDeleted(false)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={13} aria-hidden="true" /> Restore the demo account
            </button>
          )}
          {!evalMode && taps > 0 && !deleted && (
            <p className="mt-2 text-center text-xs text-muted" role="status">
              You tapped Save {taps} time{taps === 1 ? '' : 's'}. Did anything tell you it worked?
            </p>
          )}
        </div>

        {/* Panel */}
        <div ref={panelRef} className="min-w-0 space-y-3">
          {!evalMode ? (
            <div className="rounded-xl bg-subtle p-4 text-sm text-fg">
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <Hand size={15} aria-hidden="true" /> Use it like a real user
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                <li>Change your name, then save it.</li>
                <li>Fix the goal weight.</li>
                <li>Switch to a yearly plan.</li>
                <li>Leave this screen.</li>
              </ul>
              <p className="mt-2 text-muted">Notice where you hesitate. Then switch to <strong>Evaluate</strong>.</p>
            </div>
          ) : !region ? (
            <div className="rounded-xl bg-subtle p-4 text-sm text-muted">
              <p className="flex items-center gap-1.5 font-semibold text-fg">
                <ScanSearch size={15} aria-hidden="true" /> Tap any dashed area on the screen
              </p>
              <p className="mt-1">You’ll pick the heuristic it violates, or say it’s fine. {REGIONS.length} areas, {PROBLEMS} problems.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-line p-3">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Inspecting</p>
              <p className="font-semibold text-fg">{region.label}</p>
              <p className="mt-2 mb-1.5 text-xs text-muted">Which heuristic does it violate?</p>
              <div className="grid grid-cols-1 gap-1" role="group" aria-label="Pick a heuristic">
                <OptionButton active={answers[region.id]?.choice === 0} onClick={() => choose(0)}>
                  <span className="font-semibold">No problem here</span>
                </OptionButton>
                {HEURISTICS.map((h) => (
                  <OptionButton key={h.n} active={answers[region.id]?.choice === h.n} onClick={() => choose(h.n)}>
                    <span className="mr-1 font-mono text-faint">{h.n}.</span>
                    {h.name}
                  </OptionButton>
                ))}
              </div>
              <Feedback region={region} answer={answers[region.id]} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRevealed(true);
                setMode('eval');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Eye size={13} aria-hidden="true" /> Show where the problems are
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={13} aria-hidden="true" /> Start over
            </button>
          </div>
          {revealed && <p className="text-xs text-muted">Problem areas now have an orange dashed outline. Tap one to tag it.</p>}
          {found === PROBLEMS && (
            <p className="rounded-xl bg-ok-soft p-3 text-sm text-fg" role="status">
              <strong>All {PROBLEMS} problems found.</strong> In a real evaluation, two or three evaluators work separately and then merge their lists, because each person spots
              different problems.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type AreaCtx = { evalMode: boolean; selected: string | null; answers: Record<string, Answer>; revealed: boolean; select: (id: string) => void };

/** Wraps a screen area. In evaluate mode the content is inert and an overlay button covers it. */
function Area({ id, ctx, children, className = '' }: { id: string; ctx: AreaCtx; children: ReactNode; className?: string }) {
  const { evalMode, selected, answers, revealed, select } = ctx;
  const r = REGIONS.find((x) => x.id === id)!;
  const a = answers[id];
  const isSel = selected === id;
  const show = revealed && r.problem;
  const ring = isSel
    ? 'outline outline-2 outline-offset-1 outline-[#4f46e5]'
    : a
      ? a.verdict === 'wrong'
        ? 'outline outline-2 outline-offset-1 outline-[#dc2626]'
        : 'outline outline-2 outline-offset-1 outline-[#16a34a]'
      : show
        ? 'outline outline-2 outline-offset-1 outline-dashed outline-[#d97706]'
        : evalMode
          ? 'outline outline-1 outline-offset-1 outline-dashed outline-[#94a3b8]'
          : '';
  return (
    <div className={`relative rounded-lg ${ring} ${className}`}>
      <div inert={evalMode}>{children}</div>
      {evalMode && (
        <button
          type="button"
          onClick={() => select(id)}
          aria-pressed={isSel}
          aria-label={`Inspect: ${r.label}${a ? (a.verdict === 'wrong' ? ' (try again)' : ' (tagged)') : ''}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-lg hover:bg-[#4f46e5]/10 focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:outline-none"
        >
          {a && a.verdict !== 'wrong' && (
            <span className="absolute -top-2 -right-2 inline-flex size-5 items-center justify-center rounded-full bg-[#16a34a] text-[10px] font-bold text-white" aria-hidden="true">
              {r.problem ? a.choice : '✓'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="min-w-0">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${on ? 'bg-[#34c759]' : 'bg-[#d1d5db]'}`}
      >
        <span className={`absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-[left] ${on ? 'left-[20px]' : 'left-[2px]'}`} />
      </button>
    </div>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
        active ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg hover:bg-subtle'
      }`}
    >
      {children}
    </button>
  );
}

function Feedback({ region, answer }: { region: Region; answer?: Answer }) {
  if (!answer) return null;
  const bestName = region.best ? HEURISTICS[region.best - 1].name : '';
  if (answer.verdict === 'wrong') {
    return (
      <div className="mt-3 rounded-lg bg-danger-soft p-2.5 text-xs text-fg" role="status">
        <p className="flex items-start gap-1.5">
          <XCircle size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <span>
            {region.problem ? (
              answer.choice === 0 ? (
                <>
                  <strong>Look again.</strong> {region.hint}
                </>
              ) : (
                <>
                  <strong>Not the best fit.</strong> {region.hint}
                </>
              )
            ) : (
              <>
                <strong>This area is fine.</strong> {region.explain}
              </>
            )}
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-ok-soft p-2.5 text-xs text-fg" role="status">
      <p className="flex items-start gap-1.5">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
        <span>
          {region.problem ? (
            <>
              <strong>{answer.verdict === 'right' ? 'Yes!' : `Fair. The best fit is ${region.best}. ${bestName}.`}</strong> {region.explain}
            </>
          ) : (
            <>
              <strong>Right, no problem.</strong> {region.explain}
            </>
          )}
        </span>
      </p>
      {region.report && (
        <dl className="grid grid-cols-1 gap-x-2 gap-y-0.5 rounded-md bg-surface p-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <dt className="font-semibold text-muted">Evidence</dt>
          <dd className="min-w-0">{region.report.evidence}</dd>
          <dt className="font-semibold text-muted">User impact</dt>
          <dd className="min-w-0">{region.report.impact}</dd>
          <dt className="font-semibold text-muted">Heuristic</dt>
          <dd className="min-w-0">
            {region.best}. {bestName}
          </dd>
          <dt className="font-semibold text-muted">Severity</dt>
          <dd className="min-w-0">{region.report.severity} (Nielsen’s 0–4 scale)</dd>
        </dl>
      )}
    </div>
  );
}
