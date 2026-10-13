/*
 * Thin wrapper around sql.js (SQLite compiled to WebAssembly).
 * The JS glue is a separate chunk loaded with a dynamic import, and the .wasm file
 * (copied to public/sql/sql-wasm.wasm) is fetched from a URL that respects the site base,
 * so nothing is downloaded until the playground island hydrates (client:visible).
 */
import { SCHEMA_SQL, SEED_SQL } from './data';
import type { Cell, ResultSet } from './check';

export interface Statement {
  getColumnNames(): string[];
  step(): boolean;
  get(): Cell[];
  free(): boolean;
}
export interface Database {
  exec(sql: string): unknown;
  iterateStatements(sql: string): Iterable<Statement>;
  getRowsModified(): number;
  close(): void;
}
export interface SqlJs {
  Database: new () => Database;
}
type InitSqlJs = (config: { locateFile: (file: string) => string }) => Promise<SqlJs>;

let sqlPromise: Promise<SqlJs> | null = null;

export function wasmUrl() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/sql/sql-wasm.wasm`;
}

export function loadSqlJs(): Promise<SqlJs> {
  if (!sqlPromise) {
    sqlPromise = import('sql.js')
      .then((mod) => {
        const m = mod as unknown as { default?: InitSqlJs } & InitSqlJs;
        const init = (typeof m === 'function' ? m : m.default) as InitSqlJs;
        return init({ locateFile: () => wasmUrl() });
      })
      .catch((err) => {
        sqlPromise = null; // allow a retry
        throw err;
      });
  }
  return sqlPromise;
}

export function createDb(SQL: SqlJs): Database {
  const db = new SQL.Database();
  db.exec(SCHEMA_SQL + SEED_SQL);
  return db;
}

export interface RunOutput {
  /** The last statement that returns columns (a SELECT), even when it has zero rows. */
  result: ResultSet | null;
  /** Rows changed by INSERT/UPDATE/DELETE statements. */
  changed: number;
  /** Number of statements executed. */
  statements: number;
  /** Kinds of write statements that ran, e.g. ['UPDATE']. */
  writes: string[];
  /** Total rows of the last result, when more than MAX_ROWS were returned. */
  totalRows: number;
}

export const MAX_ROWS = 500;

export function runQuery(db: Database, sql: string): RunOutput {
  let result: ResultSet | null = null;
  let changed = 0;
  let statements = 0;
  let totalRows = 0;
  const writes: string[] = [];
  for (const stmt of db.iterateStatements(sql)) {
    statements++;
    try {
      const columns = stmt.getColumnNames();
      const values: Cell[][] = [];
      let count = 0;
      while (stmt.step()) {
        count++;
        if (values.length < MAX_ROWS) values.push(stmt.get());
      }
      if (columns.length > 0) {
        result = { columns, values };
        totalRows = count;
      } else {
        changed += db.getRowsModified();
      }
    } finally {
      stmt.free();
    }
  }
  const kinds = sql
    .replace(/--[^\n]*/g, '')
    .match(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/gi);
  if (kinds) for (const k of kinds) if (!writes.includes(k.toUpperCase())) writes.push(k.toUpperCase());
  return { result, changed, statements, writes, totalRows };
}

/** Turns SQLite's terse errors into something a beginner can act on. */
export function friendlyError(message: string): string {
  const m = message.replace(/^Error:\s*/, '');
  if (/no such column/i.test(m)) {
    return `${m}. Check the spelling against the schema. Text values need single quotes ('Belgrade'); without quotes SQLite reads them as column names.`;
  }
  if (/no such table/i.test(m)) return `${m}. The tables are users, restaurants, coupons, orders and order_items.`;
  if (/ambiguous column name/i.test(m)) {
    return `${m}. More than one joined table has this column. Prefix it with the table or alias, like o.id or u.name.`;
  }
  if (/misuse of aggregate/i.test(m)) {
    return `${m}. You can't use COUNT, SUM and friends in WHERE. Filter groups with HAVING instead.`;
  }
  if (/incomplete input/i.test(m)) return `${m}. The query ends too early: check for a missing closing bracket or quote.`;
  if (/syntax error/i.test(m)) {
    return `${m}. Check the clause order (SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT), commas between columns, and quotes.`;
  }
  return m;
}
