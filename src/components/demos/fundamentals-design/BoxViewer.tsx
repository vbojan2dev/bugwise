import { useId, useState } from 'react';
import { Box, CheckCircle2, Code2, Database, Eye, Network, RotateCcw, Play, Info } from 'lucide-react';

/**
 * "See inside the box": one small checkout feature (a food delivery promo-code calculator),
 * shown three ways. Black box = only the app UI. Grey box = plus the API call and database rows.
 * White box = plus the source code, with statement and branch coverage that grows as the learner runs tests.
 *
 * The code deliberately contains a STAFF50 branch that no requirement mentions. Black-box testers can't know
 * about it; grey box hints at it (promo_codes table); white box shows it as an uncovered branch.
 */

type Mode = 'black' | 'grey' | 'white';

type Line = { n: number; text: string; stmt?: boolean; decision?: string };

const CODE: Line[] = [
  { n: 1, text: 'function checkout(subtotal, code, member) {' },
  { n: 2, text: '  let discount = 0', stmt: true },
  { n: 3, text: '  let delivery = 2.99', stmt: true },
  { n: 4, text: '  if (code == "SAVE10") {', stmt: true, decision: 'D1' },
  { n: 5, text: '    if (subtotal >= 50) {', stmt: true, decision: 'D2' },
  { n: 6, text: '      discount = subtotal * 0.10', stmt: true },
  { n: 7, text: '    } else {' },
  { n: 8, text: '      return error("MIN_ORDER_NOT_MET")', stmt: true },
  { n: 9, text: '    }' },
  { n: 10, text: '  } else if (code == "FREESHIP") {', stmt: true, decision: 'D3' },
  { n: 11, text: '    delivery = 0', stmt: true },
  { n: 12, text: '  } else if (code == "STAFF50") {', stmt: true, decision: 'D4' },
  { n: 13, text: '    discount = subtotal * 0.50', stmt: true },
  { n: 14, text: '  } else if (code != "") {', stmt: true, decision: 'D5' },
  { n: 15, text: '    return error("INVALID_CODE")', stmt: true },
  { n: 16, text: '  }' },
  { n: 17, text: '  if (member) {', stmt: true, decision: 'D6' },
  { n: 18, text: '    delivery = 0', stmt: true },
  { n: 19, text: '  }' },
  { n: 20, text: '  return subtotal - discount + delivery', stmt: true },
  { n: 21, text: '}' },
];
const STMTS = CODE.filter((l) => l.stmt).map((l) => l.n);
const DECISIONS = CODE.filter((l) => l.decision).map((l) => l.decision!) as string[];
const BRANCH_TOTAL = DECISIONS.length * 2;

type Trace = { lines: number[]; branches: string[] };
type Outcome = { ok: true; discount: number; delivery: number; total: number } | { ok: false; error: 'MIN_ORDER_NOT_MET' | 'INVALID_CODE' };
type Run = { id: number; subtotal: number; code: string; member: boolean; outcome: Outcome; trace: Trace };

/** Runs the "real" code and records which lines and branch outcomes were executed. */
function execute(subtotal: number, code: string, member: boolean): { outcome: Outcome; trace: Trace } {
  const lines = [2, 3, 4];
  const branches: string[] = [];
  let discount = 0;
  let delivery = 2.99;
  const fail = (error: 'MIN_ORDER_NOT_MET' | 'INVALID_CODE') => ({ outcome: { ok: false as const, error }, trace: { lines, branches } });

  if (code === 'SAVE10') {
    branches.push('D1:T');
    lines.push(5);
    if (subtotal >= 50) {
      branches.push('D2:T');
      lines.push(6);
      discount = round(subtotal * 0.1);
    } else {
      branches.push('D2:F');
      lines.push(8);
      return fail('MIN_ORDER_NOT_MET');
    }
  } else {
    branches.push('D1:F');
    lines.push(10);
    if (code === 'FREESHIP') {
      branches.push('D3:T');
      lines.push(11);
      delivery = 0;
    } else {
      branches.push('D3:F');
      lines.push(12);
      if (code === 'STAFF50') {
        branches.push('D4:T');
        lines.push(13);
        discount = round(subtotal * 0.5);
      } else {
        branches.push('D4:F');
        lines.push(14);
        if (code !== '') {
          branches.push('D5:T');
          lines.push(15);
          return fail('INVALID_CODE');
        }
        branches.push('D5:F');
      }
    }
  }
  lines.push(17);
  if (member) {
    branches.push('D6:T');
    lines.push(18);
    delivery = 0;
  } else branches.push('D6:F');
  lines.push(20);
  return { outcome: { ok: true, discount, delivery, total: round(subtotal - discount + delivery) }, trace: { lines, branches } };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
const eur = (n: number) => `€${n.toFixed(2)}`;

const MODES: { id: Mode; label: string; icon: typeof Box; blurb: string }[] = [
  { id: 'black', label: 'Black box', icon: Box, blurb: 'You see only what a customer sees: the screen, your inputs and the result. Your tests come from the requirements.' },
  { id: 'grey', label: 'Grey box', icon: Network, blurb: 'You also see the API request/response and the database, like a tester with DevTools, a proxy and read access to the test database.' },
  { id: 'white', label: 'White box', icon: Code2, blurb: 'You see the code itself. Every test you run lights up the lines and branches it executed, and coverage goes up.' },
];

const SUGGESTIONS = [
  { subtotal: '60', code: 'SAVE10', member: false },
  { subtotal: '40', code: 'SAVE10', member: false },
  { subtotal: '25', code: 'FREESHIP', member: false },
  { subtotal: '30', code: '', member: true },
  { subtotal: '30', code: 'HELLO', member: false },
];

function Pct({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.round((value / total) * 100);
  const color = pct === 100 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--danger)';
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-fg">{label}</span>
        <span className="font-mono text-muted">
          {value}/{total} · <strong className="text-fg">{pct}%</strong>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function BoxViewer() {
  const [mode, setMode] = useState<Mode>('black');
  const [subtotal, setSubtotal] = useState('60');
  const [code, setCode] = useState('SAVE10');
  const [member, setMember] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const ids = useId();

  const parsed = Number(subtotal.replace(',', '.'));
  const valid = subtotal.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 10000;

  const run = () => {
    if (!valid) return;
    const normalized = code.trim().toUpperCase();
    const amount = round(parsed);
    const { outcome, trace } = execute(amount, normalized, member);
    setRuns((prev) => [{ id: (prev[0]?.id ?? 0) + 1, subtotal: amount, code: normalized, member, outcome, trace }, ...prev].slice(0, 30));
  };

  const last = runs[0];
  const coveredLines = new Set(runs.flatMap((r) => r.trace.lines));
  const coveredBranches = new Set(runs.flatMap((r) => r.trace.branches));
  const stmtCovered = STMTS.filter((n) => coveredLines.has(n)).length;
  const lastLines = new Set(last?.trace.lines ?? []);
  const current = MODES.find((m) => m.id === mode)!;
  const staffFound = runs.some((r) => r.code === 'STAFF50');

  // Deliberately the same vague text for both API errors: a grey-box tester can see the difference, a user can't.
  const uiMessage = 'This code can’t be used for this order.';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Eye size={18} className="text-brand" /> See inside the box
        </p>
        <p className="text-sm text-muted">
          One feature, three views. Run a few tests in each mode and notice what extra information you get as the box becomes transparent.
        </p>
      </div>

      {/* Mode switch */}
      <div className="border-b border-line p-4">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-subtle p-1" role="group" aria-label="How much can you see?">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(m.id)}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:text-sm ${
                  active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon size={15} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {current.blurb}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Left: requirements + the app UI */}
        <div className="min-w-0 space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
          <div className="rounded-xl border border-line bg-subtle p-3 text-xs text-muted">
            <p className="mb-1 font-semibold tracking-wide text-faint uppercase">Requirements (all you get in black box)</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Delivery costs €2.99.</li>
              <li>
                <code className="font-mono">SAVE10</code> gives 10% off orders of €50 or more.
              </li>
              <li>
                <code className="font-mono">FREESHIP</code> makes delivery free.
              </li>
              <li>Members always get free delivery.</li>
              <li>Unknown codes show an error.</li>
            </ul>
          </div>

          {/* The app screen: own light surface */}
          <div className="rounded-2xl p-3 shadow-sm" style={{ background: '#f2f2f7', color: '#1c1c1e', colorScheme: 'light' }}>
            <p className="mb-2 text-center text-[13px] font-semibold">Checkout · PizzaGo</p>
            <div className="space-y-2 rounded-xl bg-white p-3">
              <label htmlFor={`${ids}-sub`} className="block text-[12px] font-medium" style={{ color: '#3c3c43' }}>
                Basket subtotal (€)
              </label>
              <input
                id={`${ids}-sub`}
                inputMode="decimal"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                aria-invalid={!valid}
                className="h-9 w-full rounded-lg border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                style={{ borderColor: valid ? '#d1d1d6' : '#ff3b30', background: '#fff', color: '#1c1c1e' }}
              />
              <label htmlFor={`${ids}-code`} className="block text-[12px] font-medium" style={{ color: '#3c3c43' }}>
                Promo code
              </label>
              <input
                id={`${ids}-code`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Optional"
                autoCapitalize="characters"
                className="h-9 w-full rounded-lg border px-2 text-sm uppercase focus-visible:ring-2 focus-visible:outline-none"
                style={{ borderColor: '#d1d1d6', background: '#fff', color: '#1c1c1e' }}
              />
              <label className="flex cursor-pointer items-center justify-between gap-2 pt-1 text-[13px]">
                <span>PizzaGo+ member</span>
                <input type="checkbox" checked={member} onChange={(e) => setMember(e.target.checked)} className="size-4" style={{ accentColor: '#34c759' }} />
              </label>
              <button
                type="button"
                onClick={run}
                disabled={!valid}
                className="mt-1 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
                style={{ background: '#ff6b2c' }}
              >
                <Play size={14} aria-hidden="true" /> Calculate total (run test)
              </button>
            </div>

            <div className="mt-2 rounded-xl bg-white p-3 text-[13px]" aria-live="polite">
              {!last ? (
                <p style={{ color: '#8e8e93' }}>Run a test to see the result.</p>
              ) : last.outcome.ok ? (
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{eur(last.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Discount</dt>
                    <dd style={{ color: last.outcome.discount ? '#248a3d' : undefined }}>−{eur(last.outcome.discount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Delivery</dt>
                    <dd>{last.outcome.delivery === 0 ? 'Free' : eur(last.outcome.delivery)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold" style={{ borderColor: '#e5e5ea' }}>
                    <dt>Total</dt>
                    <dd>{eur(last.outcome.total)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="rounded-lg px-2 py-1.5" style={{ background: '#fff1f0', color: '#c4291c' }}>
                  {uiMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-faint">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={`${s.subtotal}${s.code}${s.member}`}
                type="button"
                onClick={() => {
                  setSubtotal(s.subtotal);
                  setCode(s.code);
                  setMember(s.member);
                }}
                className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-muted hover:border-brand hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                €{s.subtotal} {s.code || '—'} {s.member ? '★' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Right: what each mode reveals */}
        <div className="min-w-0 space-y-4 p-4">
          {mode === 'black' && (
            <div className="space-y-3">
              <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-subtle px-4 py-8 text-center">
                <Box size={40} className="text-fg" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-fg">The inside is hidden</p>
                <p className="mt-1 max-w-sm text-xs text-muted">
                  You know the inputs (subtotal, code, member) and the output (the total or an error). Is the error message helpful? Is €50 exactly accepted? You can only find out by trying.
                </p>
              </div>
              <RunLog runs={runs} />
            </div>
          )}

          {mode === 'grey' && (
            <div className="space-y-3">
              <div className="min-w-0 rounded-xl border border-line bg-[#1e1e1e] p-3 font-mono text-[11px] leading-relaxed text-[#d4d4d4]" style={{ colorScheme: 'dark', fontVariantLigatures: 'none' }}>
                <p className="mb-1 flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wide text-[#9da5b4] uppercase">
                  <Network size={13} aria-hidden="true" /> Network (latest request)
                </p>
                {!last ? (
                  <p className="text-[#9da5b4]">No requests yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <p>
                      <span className="text-[#c586c0]">POST</span> /api/checkout{' '}
                      <span style={{ color: last.outcome.ok ? '#89d185' : '#f48771' }}>{last.outcome.ok ? '200 OK' : '422 Unprocessable'}</span>
                    </p>
                    <pre className="mt-1 whitespace-pre">
                      <span className="text-[#9da5b4]">{'// request\n'}</span>
                      {JSON.stringify({ subtotal: last.subtotal, promoCode: last.code || null, member: last.member })}
                      <span className="text-[#9da5b4]">{'\n// response\n'}</span>
                      {last.outcome.ok
                        ? JSON.stringify({ discount: last.outcome.discount, deliveryFee: last.outcome.delivery, total: last.outcome.total }, null, 1)
                        : JSON.stringify(
                            last.outcome.error === 'MIN_ORDER_NOT_MET'
                              ? { error: 'MIN_ORDER_NOT_MET', minSubtotal: 50 }
                              : { error: 'INVALID_CODE', code: last.code },
                            null,
                            1,
                          )}
                    </pre>
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-xl border border-line bg-subtle p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">
                  <Database size={13} aria-hidden="true" /> Test database · SELECT * FROM promo_codes
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[17rem] text-left font-mono text-[11px] text-fg">
                    <thead className="text-faint">
                      <tr>
                        <th className="py-1 pr-2 font-medium">code</th>
                        <th className="py-1 pr-2 font-medium">type</th>
                        <th className="py-1 pr-2 font-medium">value</th>
                        <th className="py-1 font-medium">active</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-line">
                        <td className="py-1 pr-2">SAVE10</td>
                        <td className="pr-2">percent</td>
                        <td className="pr-2">10 (min 50)</td>
                        <td>true</td>
                      </tr>
                      <tr className="border-t border-line">
                        <td className="py-1 pr-2">FREESHIP</td>
                        <td className="pr-2">delivery</td>
                        <td className="pr-2">0</td>
                        <td>true</td>
                      </tr>
                      <tr className="border-t border-line" style={{ background: 'var(--warn-soft)' }}>
                        <td className="py-1 pr-2">STAFF50</td>
                        <td className="pr-2">percent</td>
                        <td className="pr-2">50</td>
                        <td>true</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Insight>
                Two grey-box findings a black-box tester would miss: the app shows the <em>same</em> vague message for “order too small” and “unknown code”, although the API returns
                two different errors (try €40 SAVE10, then HELLO). And there is an active <code className="font-mono">STAFF50</code> code that no requirement mentions. Is it
                supposed to work for customers?
              </Insight>
              <RunLog runs={runs} />
            </div>
          )}

          {mode === 'white' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Pct label="Statement coverage" value={stmtCovered} total={STMTS.length} />
                <Pct label="Branch coverage" value={coveredBranches.size} total={BRANCH_TOTAL} />
              </div>

              <div className="min-w-0 overflow-x-auto rounded-xl border border-line bg-[#1e1e1e] py-2 font-mono text-[11px] leading-[1.6] text-[#d4d4d4]" style={{ colorScheme: 'dark', fontVariantLigatures: 'none' }}>
                {CODE.map((l) => {
                  const hit = coveredLines.has(l.n);
                  const missed = l.stmt && !hit && runs.length > 0;
                  const inLast = lastLines.has(l.n);
                  const bg = hit ? 'rgba(80, 200, 120, 0.16)' : missed ? 'rgba(244, 135, 113, 0.16)' : 'transparent';
                  return (
                    <div key={l.n} className="flex min-w-max items-center pr-3" style={{ background: bg, boxShadow: inLast ? 'inset 3px 0 0 #4fc1ff' : undefined }}>
                      <span className="w-8 shrink-0 pr-2 text-right text-[#6e7681] select-none">{l.n}</span>
                      <span className="whitespace-pre">{l.text}</span>
                      {l.decision && (
                        <span className="ml-3 flex gap-1 font-sans text-[10px] font-semibold">
                          {(['T', 'F'] as const).map((o) => {
                            const got = coveredBranches.has(`${l.decision}:${o}`);
                            return (
                              <span
                                key={o}
                                className="rounded px-1"
                                style={{ background: got ? '#2ea043' : '#3a3a3a', color: got ? '#fff' : '#9da5b4' }}
                                title={`${o === 'T' ? 'True' : 'False'} branch ${got ? 'covered' : 'not covered yet'}`}
                              >
                                {o}
                                {got ? '✓' : ''}
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                <span>
                  <span className="mr-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: 'rgba(80,200,120,0.5)' }} />
                  executed by some test
                </span>
                <span>
                  <span className="mr-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: 'rgba(244,135,113,0.5)' }} />
                  never executed
                </span>
                <span>
                  <span className="mr-1 inline-block h-2.5 w-0.5 align-middle" style={{ background: '#4fc1ff' }} />
                  latest test
                </span>
                <span>T / F = true / false branch of a decision</span>
              </p>

              {coveredBranches.size === BRANCH_TOTAL ? (
                <Insight ok>
                  100% branch coverage! Every decision went both ways. But notice what coverage can’t tell you: whether <code className="font-mono">STAFF50</code> should exist at
                  all, or whether “order too small” deserves a clearer message. Coverage measures what you ran, not whether the requirements are right.
                </Insight>
              ) : (
                <Insight>
                  {runs.length === 0
                    ? 'Run a test and watch which lines light up. Goal: make every decision go both ways (100% branch coverage) with as few tests as possible.'
                    : !staffFound && coveredBranches.has('D3:F')
                      ? 'Look at line 12. A black-box tester would never test that branch, because no requirement mentions it. White box shows you exactly what is untested.'
                      : `Grey chips are branches no test has taken yet. Which input would send each one the other way? (${BRANCH_TOTAL - coveredBranches.size} to go)`}
                </Insight>
              )}
              <RunLog runs={runs} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setRuns([])}
            disabled={!runs.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
          >
            <RotateCcw size={13} aria-hidden="true" /> Clear test runs
          </button>
        </div>
      </div>
    </div>
  );
}

function Insight({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <p className={`flex items-start gap-2 rounded-xl p-3 text-sm text-fg ${ok ? 'bg-ok-soft' : 'bg-info-soft'}`}>
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <Info size={16} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

function RunLog({ runs }: { runs: Run[] }) {
  if (!runs.length) return null;
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">Your test runs ({runs.length})</p>
      <ol className="max-h-40 space-y-1 overflow-y-auto pr-1 text-xs">
        {runs.map((r) => (
          <li key={r.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-subtle px-2 py-1">
            <span className="truncate font-mono text-muted">
              #{r.id} €{r.subtotal} · {r.code || 'no code'} · {r.member ? 'member' : 'guest'}
            </span>
            <span className={`shrink-0 font-medium ${r.outcome.ok ? 'text-fg' : 'text-danger'}`}>{r.outcome.ok ? eur(r.outcome.total) : 'error'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
