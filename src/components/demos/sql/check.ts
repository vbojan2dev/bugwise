/*
 * Compares a learner's result set with the expected one.
 * Column names and column order are ignored (any column permutation that matches is accepted);
 * row order is ignored unless the exercise asks for ORDER BY.
 */

export type Cell = string | number | null | Uint8Array;
export interface ResultSet {
  columns: string[];
  values: Cell[][];
}

export interface Verdict {
  ok: boolean;
  message: string;
}

const norm = (v: Cell): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return 'n:' + (Math.round(v * 100) / 100).toString();
  if (typeof v === 'string') return 's:' + v;
  return 'b:' + Array.from(v).join(',');
};

const rowKey = (row: Cell[], perm: number[]) => perm.map((i) => norm(row[i])).join('\u0001');

function* permutations(n: number): Generator<number[]> {
  const a = Array.from({ length: n }, (_, i) => i);
  yield a.slice();
  // Heap's algorithm
  const c = new Array(n).fill(0);
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      [a[j], a[i]] = [a[i], a[j]];
      yield a.slice();
      c[i]++;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
}

const sameRows = (expected: string[], actual: string[], ordered: boolean) => {
  if (ordered) return expected.every((k, i) => k === actual[i]);
  const a = [...expected].sort();
  const b = [...actual].sort();
  return a.every((k, i) => k === b[i]);
};

export function compareResults(expected: ResultSet, actual: ResultSet | null, ordered = false): Verdict {
  if (!actual) {
    return { ok: false, message: 'Your query ran but returned no table. Exercises need a SELECT that returns rows.' };
  }
  const ec = expected.columns.length;
  const ac = actual.columns.length;
  if (ec !== ac) {
    return {
      ok: false,
      message: `Expected ${ec} column${ec === 1 ? '' : 's'}, but your query returned ${ac}. Select exactly the columns the task asks for${ac > ec ? ' (SELECT * returns all of them)' : ''}.`,
    };
  }
  const er = expected.values.length;
  const ar = actual.values.length;
  if (er !== ar) {
    return {
      ok: false,
      message: `Expected ${er} row${er === 1 ? '' : 's'}, but your query returned ${ar}. ${ar > er ? 'Your filter lets too much through.' : 'Your filter is too strict, or a join drops rows.'}`,
    };
  }
  const expectedKeys = expected.values.map((r) => rowKey(r, expected.columns.map((_, i) => i)));
  let unorderedMatch = false;
  // Try a name-based mapping first, then every permutation (results here have at most a handful of columns).
  const lower = (s: string) => s.toLowerCase().replace(/^.*\./, '');
  const byName = expected.columns.map((c) => actual.columns.findIndex((a) => lower(a) === lower(c)));
  const candidates: number[][] = [];
  if (byName.every((i) => i >= 0) && new Set(byName).size === byName.length) candidates.push(byName);
  const perms = ac <= 6 ? permutations(ac) : [actual.columns.map((_, i) => i)][Symbol.iterator]();
  for (const p of candidates) {
    const keys = actual.values.map((r) => rowKey(r, p));
    if (sameRows(expectedKeys, keys, ordered)) return { ok: true, message: 'Correct!' };
    if (ordered && sameRows(expectedKeys, keys, false)) unorderedMatch = true;
  }
  for (const p of perms) {
    const keys = actual.values.map((r) => rowKey(r, p));
    if (sameRows(expectedKeys, keys, ordered)) return { ok: true, message: 'Correct!' };
    if (ordered && sameRows(expectedKeys, keys, false)) unorderedMatch = true;
  }
  if (unorderedMatch) {
    return { ok: false, message: 'Right rows, wrong order. The task asks for a specific order: check your ORDER BY (ASC or DESC?).' };
  }
  return {
    ok: false,
    message: `Right number of rows and columns, but some values are different. Compare your result with the task: check the filter values, the join condition and any calculations.`,
  };
}
