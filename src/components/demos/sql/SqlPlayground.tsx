import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  Bug,
  Check,
  CircleAlert,
  Database as DbIcon,
  Eye,
  EyeOff,
  KeyRound,
  Lightbulb,
  Link2,
  Loader2,
  Play,
  RotateCcw,
  Table2,
  TriangleAlert,
} from 'lucide-react';
import { EXERCISES, TABLES } from './data';
import { compareResults } from './check';
import type { ResultSet } from './check';
import { MAX_ROWS, createDb, friendlyError, loadSqlJs, runQuery } from './engine';
import type { Database, SqlJs } from './engine';

/*
 * SQL playground with a FoodDash practice database (SQLite via sql.js, all in the browser).
 * - Run (Ctrl/Cmd+Enter) executes on a working copy that the learner may change; Reset database restores it.
 * - Check answer runs the query on a fresh copy of the original data and compares it with the
 *   exercise's solution (see check.ts). Exercise progress lives in component state only.
 */

type Output =
  | {
      kind: 'result';
      result: ResultSet | null;
      ms: number;
      changed: number;
      writes: string[];
      totalRows: number;
      label?: string;
    }
  | { kind: 'error'; message: string };

type Verdict = { ok: boolean; message: string; nudge?: string };

const STARTER = '-- Exercise 1: change this query, then press Run (Ctrl/Cmd + Enter)\nSELECT *\nFROM restaurants;';
const starterFor = (i: number) => (i === 0 ? STARTER : `-- Exercise ${i + 1}: ${EXERCISES[i].title}\n`);

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';
const ghostBtn = `${btn} border border-line bg-surface text-fg hover:bg-subtle`;

function CellView({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-faint italic">NULL</span>;
  if (value instanceof Uint8Array) return <span className="text-faint italic">BLOB</span>;
  return <>{String(value)}</>;
}

function ResultsTable({ result }: { result: ResultSet }) {
  if (result.values.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
        No rows. The query worked, but nothing matched{' '}
        <span className="font-mono text-[12.5px]">({result.columns.join(', ')})</span>.
      </p>
    );
  }
  return (
    <div
      className="relative max-h-80 max-w-full overflow-auto rounded-lg border border-line"
      tabIndex={0}
      role="region"
      aria-label="Query results (scrollable)"
    >
      <table className="min-w-full border-collapse text-left font-mono text-[12.5px]">
        <thead className="sticky top-0 z-[1] bg-subtle">
          <tr>
            <th scope="col" className="w-10 border-b border-line px-2 py-1.5 text-right font-medium text-faint">
              #
            </th>
            {result.columns.map((c, i) => (
              <th key={i} scope="col" className="border-b border-line px-3 py-1.5 font-semibold whitespace-nowrap text-fg">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.values.map((row, r) => (
            <tr key={r} className="odd:bg-surface even:bg-subtle/50">
              <td className="border-b border-line/60 px-2 py-1 text-right text-faint">{r + 1}</td>
              {row.map((v, c) => (
                <td
                  key={c}
                  className={`border-b border-line/60 px-3 py-1 whitespace-nowrap ${typeof v === 'number' ? 'text-right tabular-nums' : ''}`}
                >
                  <CellView value={v} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchemaPanel({ onPreview, disabled }: { onPreview: (table: string) => void; disabled: boolean }) {
  return (
    <div className="space-y-2">
      {TABLES.map((t) => (
        <details key={t.name} className="group rounded-lg border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
            <Table2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono font-semibold">{t.name}</span>
            <span className="text-xs text-faint group-open:rotate-90" aria-hidden="true">
              ›
            </span>
          </summary>
          <div className="border-t border-line px-2.5 pt-1.5 pb-2.5">
            <p className="mb-1.5 text-xs text-muted">{t.about}</p>
            <ul className="space-y-1">
              {t.columns.map((c) => (
                <li key={c.name} className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-[12px] leading-snug">
                  <span className="font-semibold text-fg">{c.name}</span>
                  <span className="text-faint">{c.type}</span>
                  {c.pk && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-warn-soft px-1 text-[10.5px] font-semibold text-warn" title="Primary key">
                      <KeyRound className="size-3" aria-hidden="true" />
                      PK
                    </span>
                  )}
                  {c.fk && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-info-soft px-1 text-[10.5px] font-semibold text-info" title={`Foreign key to ${c.fk}`}>
                      <Link2 className="size-3" aria-hidden="true" />
                      FK → {c.fk}
                    </span>
                  )}
                  {c.nullable && <span className="text-[10.5px] text-faint">nullable</span>}
                  {c.note && <span className="basis-full pl-2 font-sans text-[11px] text-muted">{c.note}</span>}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPreview(t.name)}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Preview rows
            </button>
          </div>
        </details>
      ))}
    </div>
  );
}

function Banner({ tone, icon, children }: { tone: 'ok' | 'warn' | 'danger' | 'info'; icon: ReactNode; children: ReactNode }) {
  const cls = {
    ok: 'border-ok/40 bg-ok-soft',
    warn: 'border-warn/40 bg-warn-soft',
    danger: 'border-danger/40 bg-danger-soft',
    info: 'border-info/40 bg-info-soft',
  }[tone];
  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 text-sm text-fg ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

export default function SqlPlayground() {
  const sqlRef = useRef<SqlJs | null>(null);
  const dbRef = useRef<Database | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [current, setCurrent] = useState(0);
  const [drafts, setDrafts] = useState<string[]>(() => EXERCISES.map((_, i) => starterFor(i)));
  const [solved, setSolved] = useState<boolean[]>(() => EXERCISES.map(() => false));
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showSchema, setShowSchema] = useState(true);
  const [resetNote, setResetNote] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadSqlJs()
      .then((SQL) => {
        if (cancelled) return;
        sqlRef.current = SQL;
        dbRef.current?.close();
        dbRef.current = createDb(SQL);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(
    () => () => {
      dbRef.current?.close();
      dbRef.current = null;
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const ex = EXERCISES[current];
  const sql = drafts[current];
  const solvedCount = solved.filter(Boolean).length;
  const ready = status === 'ready';

  const setSql = (value: string) => setDrafts((prev) => prev.map((d, i) => (i === current ? value : d)));

  const execute = useCallback((db: Database, text: string, label?: string): Output => {
    const t0 = performance.now();
    try {
      const out = runQuery(db, text);
      return { kind: 'result', ...out, ms: Math.max(1, Math.round(performance.now() - t0)), label };
    } catch (err) {
      return { kind: 'error', message: friendlyError(err instanceof Error ? err.message : String(err)) };
    }
  }, []);

  const run = () => {
    if (!dbRef.current) return;
    if (!sql.replace(/--[^\n]*/g, '').trim()) {
      setOutput({ kind: 'error', message: 'The editor has only comments. Write a query below the comment line, for example SELECT * FROM orders;' });
      setVerdict(null);
      return;
    }
    setOutput(execute(dbRef.current, sql));
    setVerdict(null);
  };

  const check = () => {
    const SQL = sqlRef.current;
    if (!SQL) return;
    if (!sql.replace(/--[^\n]*/g, '').trim()) {
      setOutput(null);
      setVerdict({ ok: false, message: 'Write a query first, then check it.' });
      return;
    }
    // Both queries run on a fresh copy of the original data, so earlier UPDATEs can't affect the check.
    const db = createDb(SQL);
    try {
      const expected = runQuery(db, ex.solution).result;
      const out = execute(db, sql, 'Checked against the original data');
      setOutput(out);
      if (out.kind === 'error' || !expected) {
        setVerdict(null);
        return;
      }
      const v = compareResults(expected, out.result, ex.ordered);
      const nudge = v.ok ? undefined : ex.nudges?.find((n) => n.test(sql))?.message;
      setVerdict({ ...v, nudge });
      if (v.ok) setSolved((prev) => prev.map((s, i) => (i === current ? true : s)));
    } finally {
      db.close();
    }
  };

  const preview = (table: string) => {
    if (!dbRef.current) return;
    setOutput(execute(dbRef.current, `SELECT * FROM ${table};`, `Preview: SELECT * FROM ${table};`));
    setVerdict(null);
  };

  const reset = () => {
    const SQL = sqlRef.current;
    if (!SQL) return;
    dbRef.current?.close();
    dbRef.current = createDb(SQL);
    setOutput(null);
    setVerdict(null);
    setResetNote(true);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setResetNote(false), 2500);
  };

  const go = (i: number) => {
    setCurrent(i);
    setShowHint(false);
    setShowSolution(false);
    setVerdict(null);
    setOutput(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (ready) run();
    }
  };

  const levelCls = { Easy: 'bg-ok-soft text-ok', Medium: 'bg-warn-soft text-warn', Hard: 'bg-danger-soft text-danger' }[ex.level];

  return (
    <div className="not-prose @container my-6 w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-sm">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle px-3 py-2">
        <DbIcon className="size-4 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-[11rem] flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">FoodDash practice DB</p>
          <p className="truncate text-xs text-muted">SQLite, running in your browser</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSchema((s) => !s)}
          aria-expanded={showSchema}
          aria-controls="sql-schema"
          className={`${ghostBtn} px-2.5 py-1.5 text-xs`}
        >
          {showSchema ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
          Schema
        </button>
        <button type="button" onClick={reset} disabled={!ready} className={`${ghostBtn} px-2.5 py-1.5 text-xs`}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset database
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm text-muted" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading the database engine (about 700 KB, once)…
        </div>
      )}
      {status === 'error' && (
        <div className="border-b border-line p-3">
          <Banner tone="danger" icon={<CircleAlert className="size-4 text-danger" aria-hidden="true" />}>
            <p className="font-semibold">The database engine didn't load.</p>
            <p className="text-muted">Check your connection and try again. ({loadError})</p>
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className={`${ghostBtn} mt-2 px-2.5 py-1 text-xs`}>
              Try again
            </button>
          </Banner>
        </div>
      )}
      {resetNote && (
        <div className="border-b border-line px-3 py-2 text-sm text-ok" role="status">
          Database reset to the original FoodDash data.
        </div>
      )}

      <div className={`grid grid-cols-1 ${showSchema ? '@3xl:grid-cols-[230px_minmax(0,1fr)]' : ''}`}>
        {showSchema && (
          <aside id="sql-schema" aria-label="Database schema" className="min-w-0 border-b border-line bg-subtle/60 p-3 @3xl:border-r @3xl:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Tables</p>
            <SchemaPanel onPreview={preview} disabled={!ready} />
          </aside>
        )}

        <div className="min-w-0 space-y-3 p-3 @md:p-4">
          {/* Exercise picker */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Exercises">
            {EXERCISES.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`Exercise ${i + 1}: ${e.title}${solved[i] ? ' (solved)' : ''}`}
                className={`relative inline-flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  i === current
                    ? 'border-brand bg-brand text-brand-fg'
                    : solved[i]
                      ? 'border-ok/50 bg-ok-soft text-ok'
                      : 'border-line bg-surface text-muted hover:bg-subtle hover:text-fg'
                }`}
              >
                {solved[i] && i !== current ? <Check className="size-4" aria-hidden="true" /> : i + 1}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted" aria-live="polite">
              {solvedCount} / {EXERCISES.length} solved
            </span>
          </div>

          {/* Task */}
          <div className="rounded-xl border border-line bg-subtle/60 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-muted">Exercise {current + 1}</span>
              <span className={`rounded px-1.5 py-0.5 font-semibold ${levelCls}`}>{ex.level}</span>
              {ex.bug && (
                <span className="inline-flex items-center gap-1 rounded bg-danger-soft px-1.5 py-0.5 font-semibold text-danger">
                  <Bug className="size-3" aria-hidden="true" />
                  Find the bug
                </span>
              )}
              {ex.ordered && <span className="rounded bg-info-soft px-1.5 py-0.5 font-semibold text-info">Order matters</span>}
              {solved[current] && (
                <span className="inline-flex items-center gap-1 rounded bg-ok-soft px-1.5 py-0.5 font-semibold text-ok">
                  <Check className="size-3" aria-hidden="true" />
                  Solved
                </span>
              )}
            </div>
            <p className="mt-1.5 font-semibold">{ex.title}</p>
            <p className="mt-0.5 text-sm text-fg">{ex.task}</p>
            <p className="mt-1.5 text-xs text-muted">
              Return:{' '}
              {ex.columns.map((c, i) => (
                <span key={c}>
                  <span className="rounded bg-surface px-1 py-0.5 font-mono text-[11.5px] text-fg">{c}</span>
                  {i < ex.columns.length - 1 ? ' ' : ''}
                </span>
              ))}{' '}
              <span className="text-faint">(column names and order don't matter)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowHint((s) => !s)} aria-expanded={showHint} className={`${ghostBtn} px-2.5 py-1 text-xs`}>
                <Lightbulb className="size-3.5" aria-hidden="true" />
                {showHint ? 'Hide hint' : 'Hint'}
              </button>
              <button
                type="button"
                onClick={() => setShowSolution((s) => !s)}
                aria-expanded={showSolution}
                className={`${ghostBtn} px-2.5 py-1 text-xs`}
              >
                {showSolution ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
                {showSolution ? 'Hide solution' : 'Show solution'}
              </button>
            </div>
            {showHint && (
              <div className="mt-2">
                <Banner tone="info" icon={<Lightbulb className="size-4 text-info" aria-hidden="true" />}>
                  {ex.hint}
                </Banner>
              </div>
            )}
            {showSolution && (
              <div className="mt-2 rounded-lg border border-line bg-surface">
                <pre className="overflow-x-auto p-2.5 font-mono text-[12.5px] leading-relaxed whitespace-pre text-fg">{ex.solution}</pre>
                <div className="border-t border-line px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => setSql(ex.solution)}
                    className="text-xs font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    Copy into the editor
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Editor */}
          <div>
            <label htmlFor="sql-editor" className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold text-muted">
              <span>Your query</span>
              <span className="font-normal text-faint">
                <kbd className="rounded border border-line px-1 font-mono text-[10.5px]">Ctrl</kbd> /{' '}
                <kbd className="rounded border border-line px-1 font-mono text-[10.5px]">⌘</kbd> +{' '}
                <kbd className="rounded border border-line px-1 font-mono text-[10.5px]">Enter</kbd> runs it
              </span>
            </label>
            <textarea
              id="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={onKeyDown}
              rows={7}
              wrap="off"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="block w-full resize-y rounded-lg border border-line bg-bg p-2.5 font-mono text-base leading-relaxed text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/25 @md:text-[13px]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={run} disabled={!ready} className={`${btn} bg-brand text-brand-fg hover:opacity-90`}>
                <Play className="size-4" aria-hidden="true" />
                Run
              </button>
              <button type="button" onClick={check} disabled={!ready} className={ghostBtn}>
                <Check className="size-4" aria-hidden="true" />
                Check answer
              </button>
              {current < EXERCISES.length - 1 && solved[current] && (
                <button type="button" onClick={() => go(current + 1)} className={`${ghostBtn} ml-auto`}>
                  Next exercise →
                </button>
              )}
            </div>
          </div>

          {/* Verdict */}
          <div aria-live="polite">
            {verdict &&
              (verdict.ok ? (
                <Banner tone="ok" icon={<Check className="size-4 text-ok" aria-hidden="true" />}>
                  <p className="font-semibold">Correct!</p>
                  <p>{ex.explain}</p>
                </Banner>
              ) : (
                <Banner tone="warn" icon={<TriangleAlert className="size-4 text-warn" aria-hidden="true" />}>
                  <p className="font-semibold">Not quite yet.</p>
                  <p>{verdict.message}</p>
                  {verdict.nudge && <p className="mt-1">{verdict.nudge}</p>}
                </Banner>
              ))}
          </div>

          {/* Results */}
          <div aria-live="polite" className="min-w-0 space-y-2">
            {output?.kind === 'error' && (
              <Banner tone="danger" icon={<CircleAlert className="size-4 text-danger" aria-hidden="true" />}>
                <p className="font-semibold">Error</p>
                <p className="font-mono text-[12.5px]">{output.message}</p>
              </Banner>
            )}
            {output?.kind === 'result' && (
              <>
                <p className="text-xs text-muted">
                  {output.label && <span className="font-semibold">{output.label} · </span>}
                  {output.result
                    ? `${output.totalRows} row${output.totalRows === 1 ? '' : 's'}${output.totalRows > MAX_ROWS ? ` (showing the first ${MAX_ROWS})` : ''} · ${output.ms} ms`
                    : `Done in ${output.ms} ms`}
                </p>
                {output.writes.length > 0 && (
                  <Banner tone="warn" icon={<TriangleAlert className="size-4 text-warn" aria-hidden="true" />}>
                    <p>
                      {output.writes.join(' / ')} ran
                      {output.changed > 0 ? ` and changed ${output.changed} row${output.changed === 1 ? '' : 's'}` : ''}. This is your own
                      practice copy, so nothing real was harmed.{' '}
                      {output.label ? 'Checks always use a fresh copy.' : 'Use Reset database to get the original data back.'} On a
                      shared or production database, never run this without permission.
                    </p>
                  </Banner>
                )}
                {output.result ? (
                  <ResultsTable result={output.result} />
                ) : (
                  !output.writes.length && <p className="text-sm text-muted">The query ran but returned no table.</p>
                )}
              </>
            )}
            {!output && ready && (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
                Results appear here. Tip: open a table in the schema and press <strong>Preview rows</strong> to see its data.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
