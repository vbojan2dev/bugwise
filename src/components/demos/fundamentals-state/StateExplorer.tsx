import { useMemo, useState } from 'react';
import { CheckCircle2, Lock, RotateCcw, ShieldAlert, Trash2, XCircle } from 'lucide-react';
import StateDiagram from './StateDiagram';
import { explorerModels, findTransition, invalidMessage, invalidPairs, tkey, type Model } from './models';

/*
 * State machine explorer: pick a model, fire events, watch the current state move,
 * and track coverage (states visited, valid transitions covered, invalid pairs tried).
 */

type Outcome = 'valid' | 'guard' | 'invalid';
interface LogEntry {
  n: number;
  from: string;
  event: string;
  to: string;
  outcome: Outcome;
}
interface Result {
  outcome: Outcome;
  title: string;
  body: string;
  action?: string;
}

interface Progress {
  current: string;
  visited: Set<string>;
  covered: Set<string>;
  invalidTried: Set<string>;
  guardFalse: Set<string>;
  last: string | null;
  log: LogEntry[];
  result: Result | null;
  n: number;
}

const initialState = (m: Model) => m.states.find((s) => s.initial)!.id;
const fresh = (m: Model): Progress => ({
  current: initialState(m),
  visited: new Set([initialState(m)]),
  covered: new Set(),
  invalidTried: new Set(),
  guardFalse: new Set(),
  last: null,
  log: [],
  result: null,
  n: 0,
});

function Meter({ label, value, total, tone, sub }: { label: string; value: number; total: number; tone: 'brand' | 'ok' | 'warn'; sub?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const color = tone === 'brand' ? 'var(--brand)' : tone === 'ok' ? 'var(--ok)' : 'var(--warn)';
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="font-mono text-xs text-muted">
          {value}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle ring-1 ring-line" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
    </div>
  );
}

export default function StateExplorer() {
  const [modelId, setModelId] = useState(explorerModels[0].id);
  const model = explorerModels.find((m) => m.id === modelId)!;
  const [byModel, setByModel] = useState<Record<string, Progress>>(() => Object.fromEntries(explorerModels.map((m) => [m.id, fresh(m)])));
  const [guards, setGuards] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(explorerModels.flatMap((m) => (m.guards ?? []).map((g) => [g.key, g.initial]))),
  );
  const [view, setView] = useState<'diagram' | 'table'>('diagram');

  const p = byModel[modelId];
  const invalidAll = useMemo(() => invalidPairs(model), [model]);
  const guarded = model.transitions.filter((t) => t.guardKey);
  const name = (id: string) => model.states.find((s) => s.id === id)?.label ?? id;
  const evName = (id: string) => model.events.find((e) => e.id === id)?.label ?? id;

  const fire = (eventId: string) => {
    setByModel((all) => {
      const prev = all[model.id];
      const from = prev.current;
      const k = tkey(from, eventId);
      const t = findTransition(model, from, eventId);
      const n = prev.n + 1;
      const label = (id: string) => model.states.find((s) => s.id === id)?.label ?? id;
      const ev = model.events.find((e) => e.id === eventId)?.label ?? eventId;
      let next: Progress;
      if (t && t.guardKey && !guards[t.guardKey]) {
        const g = model.guards?.find((x) => x.key === t.guardKey);
        const guardFalse = new Set(prev.guardFalse).add(k);
        next = {
          ...prev,
          n,
          guardFalse,
          last: null,
          log: [{ n, from, event: eventId, to: from, outcome: 'guard' as Outcome }, ...prev.log].slice(0, 30),
          result: { outcome: 'guard', title: `Guard is false: stays in ${label(from)}`, body: g?.blocked ?? 'The guard is false, so the transition must not happen.' },
        };
      } else if (t) {
        next = {
          ...prev,
          n,
          current: t.to,
          visited: new Set(prev.visited).add(t.to),
          covered: new Set(prev.covered).add(k),
          last: k,
          log: [{ n, from, event: eventId, to: t.to, outcome: 'valid' as Outcome }, ...prev.log].slice(0, 30),
          result: {
            outcome: 'valid',
            title: `Valid: ${label(from)} → ${ev} → ${label(t.to)}`,
            body: t.guard ? `The guard [${t.guard}] is true, so the transition is allowed.` : 'This transition is in the spec.',
            action: t.action,
          },
        };
      } else {
        next = {
          ...prev,
          n,
          invalidTried: new Set(prev.invalidTried).add(k),
          last: null,
          log: [{ n, from, event: eventId, to: from, outcome: 'invalid' as Outcome }, ...prev.log].slice(0, 30),
          result: { outcome: 'invalid', title: `Invalid: "${ev}" is not allowed in ${label(from)}`, body: invalidMessage(model, from, eventId) },
        };
      }
      return { ...all, [model.id]: next };
    });
  };

  const restart = () =>
    setByModel((all) => {
      const prev = all[model.id];
      const start = initialState(model);
      return { ...all, [model.id]: { ...prev, current: start, visited: new Set(prev.visited).add(start), last: null, result: null } };
    });
  const clear = () => setByModel((all) => ({ ...all, [model.id]: fresh(model) }));

  const total = model.transitions.length;
  const isFinal = model.states.find((s) => s.id === p.current)?.final;
  const done = p.visited.size === model.states.length && p.covered.size === total && p.invalidTried.size === invalidAll.length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧭 State machine explorer</p>
        <p className="text-sm text-muted">Pick a model, fire events and watch where the system goes. Try to fill all three coverage meters.</p>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Model">
          {explorerModels.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === modelId}
              onClick={() => setModelId(m.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] ${
                m.id === modelId ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Left: diagram / table */}
        <div className="min-w-0 border-b border-line p-4 sm:p-5 xl:border-r xl:border-b-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-sm text-muted">{model.blurb}</p>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium" role="group" aria-label="View">
              {(['diagram', 'table'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 capitalize focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${view === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
                >
                  {v === 'diagram' ? 'Diagram' : 'State table'}
                </button>
              ))}
            </div>
          </div>

          {view === 'diagram' ? (
            <>
              <StateDiagram model={model} current={p.current} visited={p.visited} covered={p.covered} last={p.last} coverage />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded bg-brand" /> current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded border border-brand bg-brand-soft" /> visited
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 bg-ok" /> covered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 border-t-2 border-dashed border-faint" /> not yet
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded border border-line-strong outline outline-1 outline-offset-1 outline-line-strong" /> final state
                </span>
              </div>
            </>
          ) : (
            <div className="relative overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[22rem] border-collapse text-xs">
                <caption className="sr-only">State table for {model.name}: rows are current states, columns are events, cells show the next state or that the event is invalid.</caption>
                <thead>
                  <tr className="bg-subtle">
                    <th scope="col" className="px-2 py-2 text-left font-semibold text-muted">
                      State ↓ / Event →
                    </th>
                    {model.events.map((e) => (
                      <th key={e.id} scope="col" className="px-2 py-2 text-left font-semibold text-fg">
                        {e.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.states.map((s) => (
                    <tr key={s.id} className={`border-t border-line ${s.id === p.current ? 'bg-brand-soft' : ''}`}>
                      <th scope="row" className="px-2 py-2 text-left font-semibold whitespace-nowrap text-fg">
                        {s.label}
                        {s.id === p.current && <span className="sr-only"> (current)</span>}
                      </th>
                      {model.events.map((e) => {
                        const k = tkey(s.id, e.id);
                        const t = findTransition(model, s.id, e.id);
                        const hit = t ? p.covered.has(k) : p.invalidTried.has(k);
                        return (
                          <td key={e.id} className="px-1 py-1">
                            <span
                              className={`block rounded-md px-1.5 py-1 ${
                                t ? (hit ? 'bg-ok-soft font-semibold text-ok' : 'text-fg') : hit ? 'bg-warn-soft font-semibold text-warn' : 'text-faint'
                              }`}
                            >
                              {t ? `${name(t.to)}${t.guard ? ` [${t.guard}]` : ''}` : '✕ invalid'}
                              {hit && <span className="sr-only"> (tested)</span>}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Current state</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-fg">
              {name(p.current)}
              {isFinal && <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-line">final</span>}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Fire an event</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
              {model.events.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => fire(e.id)}
                  className="min-h-11 rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm font-medium text-fg shadow-sm transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] active:scale-[.98]"
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {model.guards?.map((g) => (
            <label key={g.key} className="flex items-start gap-2.5 rounded-xl bg-subtle p-3 text-sm ring-1 ring-line">
              <input
                type="checkbox"
                checked={guards[g.key]}
                onChange={(e) => {
                  const v = e.target.checked;
                  setGuards((prev) => ({ ...prev, [g.key]: v }));
                }}
                className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
              />
              <span className="min-w-0">
                <span className="font-medium text-fg">Guard: {g.label}</span>
                <span className="block text-xs text-muted">Untick it to test the "guard is false" path.</span>
              </span>
            </label>
          ))}

          <div aria-live="polite" className="min-h-[5.5rem]">
            {p.result ? (
              <div
                className={`rounded-xl p-3 text-sm ring-1 ${
                  p.result.outcome === 'valid' ? 'bg-ok-soft ring-ok/30' : p.result.outcome === 'guard' ? 'bg-info-soft ring-info/30' : 'bg-warn-soft ring-warn/30'
                }`}
              >
                <p className="flex items-start gap-2 font-semibold text-fg">
                  {p.result.outcome === 'valid' ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
                  ) : p.result.outcome === 'guard' ? (
                    <Lock size={16} className="mt-0.5 shrink-0 text-info" />
                  ) : (
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warn" />
                  )}
                  <span className="min-w-0">{p.result.title}</span>
                </p>
                {p.result.action && (
                  <p className="mt-1.5 text-muted">
                    <strong className="text-fg">Action:</strong> {p.result.action}
                  </p>
                )}
                <p className="mt-1.5 text-muted">
                  {p.result.outcome === 'invalid' && <strong className="text-fg">A correct system: </strong>}
                  {p.result.body}
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line p-3 text-sm text-muted">
                Tip: don't only follow the happy path. Fire events that "shouldn't" work, like <strong className="text-fg">{model.id === 'order' ? 'Refund' : model.id === 'login' ? 'Right password while Locked' : model.id === 'music' ? 'Play while Playing' : 'Pay while Blocked'}</strong>.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <RotateCcw size={14} /> Back to start state
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <Trash2 size={14} /> Clear coverage
            </button>
          </div>
        </div>
      </div>

      {/* Coverage + log */}
      <div className="grid grid-cols-1 border-t border-line md:grid-cols-2">
        <div className="min-w-0 space-y-4 border-b border-line p-4 sm:p-5 md:border-r md:border-b-0">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Coverage</p>
          <Meter label="States visited" value={p.visited.size} total={model.states.length} tone="brand" />
          <Meter
            label="Valid transitions covered"
            value={p.covered.size}
            total={total}
            tone="ok"
            sub={guarded.length ? `Guards tested as false: ${guarded.filter((t) => p.guardFalse.has(tkey(t.from, t.event))).length}/${guarded.length}` : undefined}
          />
          <Meter label="Invalid transitions tried" value={p.invalidTried.size} total={invalidAll.length} tone="warn" sub="Every ✕ cell in the state table." />
          {done && (
            <p className="flex items-start gap-2 rounded-xl bg-ok-soft p-3 text-sm text-fg ring-1 ring-ok/30">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> Full coverage: every state, every valid transition and every invalid pair. That's a thorough tester!
            </p>
          )}
          {isFinal && !done && (
            <p className="text-xs text-muted">You're in a final state. Use "Back to start state" to explore other paths; your coverage is kept.</p>
          )}
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Event log</p>
          {p.log.length === 0 ? (
            <p className="text-sm text-muted">No events yet. Each line here is one test step.</p>
          ) : (
            <ol className="relative max-h-56 space-y-1 overflow-y-auto pr-1 text-xs" aria-label="Event log, newest first">
              {p.log.map((l) => (
                <li key={l.n} className="flex items-start gap-2 rounded-lg bg-subtle px-2 py-1.5">
                  <span className="w-5 shrink-0 font-mono text-faint">{l.n}</span>
                  {l.outcome === 'valid' ? (
                    <CheckCircle2 size={14} className="shrink-0 text-ok" aria-label="valid" />
                  ) : l.outcome === 'guard' ? (
                    <Lock size={14} className="shrink-0 text-info" aria-label="blocked by guard" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-warn" aria-label="invalid" />
                  )}
                  <span className="min-w-0 text-fg">
                    {name(l.from)} <span className="text-muted">+ {evName(l.event)} →</span> {l.outcome === 'valid' ? name(l.to) : <em className="text-muted">stays {name(l.to)}</em>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
