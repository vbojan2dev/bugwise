/**
 * A small, honest all-pairs generator for the Pairwise Testing lesson.
 *
 * Approach (greedy, "best whole row"):
 * 1. Enumerate every full combination that satisfies the constraints.
 * 2. The pairs we must cover are exactly the pairs that appear in at least one valid combination
 *    (a pair that never appears in a valid row is impossible and is not required).
 * 3. Repeatedly pick the valid combination that covers the most still-uncovered pairs
 *    (ties: the first one in enumeration order, so the result is deterministic), until none are left.
 *
 * Every required pair belongs to some valid row, so each step covers at least one new pair and the loop ends
 * with full pair coverage. It is not guaranteed to be the smallest possible set (that problem is hard),
 * but it is close for the small models in the demo. `checkCoverage` re-derives the required pairs
 * independently and confirms the set, so the UI never claims coverage it doesn't have.
 */

export type Param = { name: string; values: string[] };
/** A row holds one value index per parameter. */
export type Row = number[];
/** Returns true when a full row is allowed. */
export type Constraint = (row: Row) => boolean;

export const pairKey = (i: number, a: number, j: number, b: number) => (i < j ? `${i}:${a}|${j}:${b}` : `${j}:${b}|${i}:${a}`);

export function pairsOfRow(row: Row): string[] {
  const out: string[] = [];
  for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) out.push(pairKey(i, row[i], j, row[j]));
  return out;
}

export function allRows(params: Param[], valid: Constraint = () => true): Row[] {
  const rows: Row[] = [];
  const cur: number[] = [];
  const walk = (p: number) => {
    if (p === params.length) {
      if (valid(cur)) rows.push([...cur]);
      return;
    }
    for (let v = 0; v < params[p].values.length; v++) {
      cur[p] = v;
      walk(p + 1);
    }
  };
  if (params.length) walk(0);
  return rows;
}

export function fullCount(params: Param[]): number {
  return params.reduce((n, p) => n * p.values.length, params.length ? 1 : 0);
}

export function requiredPairs(params: Param[], valid: Constraint = () => true): Set<string> {
  const set = new Set<string>();
  for (const row of allRows(params, valid)) for (const k of pairsOfRow(row)) set.add(k);
  return set;
}

export function generatePairwise(params: Param[], valid: Constraint = () => true): Row[] {
  if (params.length < 2) return allRows(params, valid);
  const candidates = allRows(params, valid);
  const uncovered = requiredPairs(params, valid);
  const result: Row[] = [];
  while (uncovered.size > 0) {
    let best: Row | null = null;
    let bestGain = 0;
    for (const row of candidates) {
      let gain = 0;
      for (const k of pairsOfRow(row)) if (uncovered.has(k)) gain++;
      if (gain > bestGain) {
        bestGain = gain;
        best = row;
      }
    }
    if (!best) break; // cannot happen: every required pair comes from a candidate row
    result.push(best);
    for (const k of pairsOfRow(best)) uncovered.delete(k);
  }
  return result;
}

export type Coverage = { required: number; covered: number; missing: string[]; invalidRows: number[] };

/** Independent check: every required pair appears in at least one row, and every row is allowed. */
export function checkCoverage(params: Param[], rows: Row[], valid: Constraint = () => true): Coverage {
  const required = requiredPairs(params, valid);
  const seen = new Set<string>();
  const invalidRows: number[] = [];
  rows.forEach((row, i) => {
    if (!valid(row)) invalidRows.push(i);
    for (const k of pairsOfRow(row)) seen.add(k);
  });
  const missing = [...required].filter((k) => !seen.has(k));
  return { required: required.size, covered: required.size - missing.length, missing, invalidRows };
}

export function describePair(params: Param[], key: string): string {
  return key
    .split('|')
    .map((part) => {
      const [p, v] = part.split(':').map(Number);
      return params[p].values[v];
    })
    .join(' + ');
}
