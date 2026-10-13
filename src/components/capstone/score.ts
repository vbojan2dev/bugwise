import { BUGS, PRIORITIES, ratingScore, SEVERITIES, type CapstoneBug, type CapstoneState, type BugReport } from '@/lib/capstone';
import { PHASES } from './phases';

export const WEIGHTS = { bugs: 60, accuracy: 20, phases: 20 };

export interface MatchedReport {
  report: BugReport;
  bug: CapstoneBug;
  sev: number;
  pri: number;
}

/** Everything the results page needs, derived from the saved state. */
export function computeScore(s: CapstoneState) {
  const matched: MatchedReport[] = [];
  const unmatched: BugReport[] = [];
  for (const r of s.reports) {
    const bug = r.matched ? BUGS.find((b) => b.id === r.matched) : undefined;
    if (bug) matched.push({ report: r, bug, sev: ratingScore(r.severity, bug.severity, SEVERITIES), pri: ratingScore(r.priority, bug.priority, PRIORITIES) });
    else unmatched.push(r);
  }
  const found = new Set(matched.map((m) => m.bug.id));
  const nearMiss = BUGS.filter((b) => s.observed[b.id] && !found.has(b.id));
  const notFound = BUGS.filter((b) => !found.has(b.id));
  const accuracy = matched.length ? matched.reduce((a, m) => a + (m.sev + m.pri) / 2, 0) / matched.length : 0;
  const phasesDone = PHASES.filter((p) => s.phases[p.id]).length;
  const parts = {
    bugs: (WEIGHTS.bugs * found.size) / BUGS.length,
    accuracy: WEIGHTS.accuracy * accuracy,
    phases: (WEIGHTS.phases * phasesDone) / PHASES.length,
  };
  const total = Math.round(parts.bugs + parts.accuracy + parts.phases);
  return { matched, unmatched, found, nearMiss, notFound, accuracy, phasesDone, parts, total };
}

export function level(total: number) {
  if (total >= 85) return { label: 'Release-ready tester', text: 'You found most of what matters and rated it like a seasoned tester.' };
  if (total >= 65) return { label: 'Solid tester', text: 'A strong result. A few areas slipped past you; the hints show where to look.' };
  if (total >= 40) return { label: 'Getting there', text: 'Good foundations. Try the hints and the charters you skipped, then come back.' };
  return { label: 'Warm-up round', text: 'Every tester starts somewhere. Use the hints, pick a charter and explore one screen deeply.' };
}
