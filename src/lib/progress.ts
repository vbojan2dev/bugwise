/**
 * Learning progress, stored only in this browser (localStorage). No account needed.
 * Every write dispatches a `progress-change` event on window so any UI can refresh.
 *
 * Page keys are paths without the site base and slashes, e.g. "components/segmented-control".
 */

const STORAGE_KEY = 'bugwise:progress:v1';
const CHECKLIST_PREFIX = 'checklist:';

export interface QuizResult {
  best: number;
  last: number;
  total: number;
}
export interface BugResult {
  found: number[];
  total: number;
}
export interface Progress {
  /** page key → ISO date when completed */
  completed: Record<string, string>;
  /** page key → quiz score */
  quizzes: Record<string, QuizResult>;
  /** bug hunt key (page key, plus "#n" for extra hunts on a page) → found bug indexes */
  bugs: Record<string, BugResult>;
  last?: { key: string; title: string; at: string };
}

export interface ExportFile {
  app: 'bugwise';
  version: 1;
  exportedAt: string;
  progress: Progress;
  checklists: Record<string, boolean[]>;
  /** Bites card state (see lib/bites.ts); optional for files exported before Bites existed. */
  bites?: { cards: Record<string, { box: number; due: number; seen: number; last: number }>; days: Record<string, number> };
  /** Capstone state, saved as is; optional for older files. */
  capstone?: { phases?: Record<string, string>; reports?: unknown[] } & Record<string, unknown>;
}

const BITES_KEY = 'bugwise:bites:v1';
/** Capstone project state (see lib/capstone.ts). Kept here as a plain key so progress doesn't import the capstone module. */
const CAPSTONE_KEY = 'bugwise:capstone:v1';

const empty = (): Progress => ({ completed: {}, quizzes: {}, bugs: {} });

export function load(): Progress {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (data && typeof data === 'object') return { ...empty(), ...data };
  } catch {}
  return empty();
}

function save(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
  window.dispatchEvent(new CustomEvent('progress-change'));
}

export function update(fn: (p: Progress) => void) {
  const p = load();
  fn(p);
  save(p);
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function keyFromPath(path: string) {
  const p = base && path.startsWith(base) ? path.slice(base.length) : path;
  return p.replace(/^\/+|\/+$/g, '');
}

export const currentKey = () => keyFromPath(location.pathname);

export function setComplete(key: string, done: boolean) {
  update((p) => {
    if (done) p.completed[key] ??= new Date().toISOString();
    else delete p.completed[key];
  });
}

/** Saves a finished quiz. Scoring 60% or more also marks the page as complete. */
export function recordQuiz(key: string, correct: number, total: number) {
  update((p) => {
    const prev = p.quizzes[key];
    p.quizzes[key] = { best: Math.max(prev?.best ?? 0, correct), last: correct, total };
    if (total > 0 && correct / total >= 0.6) p.completed[key] ??= new Date().toISOString();
  });
}

export function recordBugs(huntKey: string, found: number[], total: number) {
  update((p) => {
    p.bugs[huntKey] = { found: [...new Set(found)].sort((a, b) => a - b), total };
  });
}

export function setLastVisited(key: string, title: string) {
  update((p) => {
    p.last = { key, title, at: new Date().toISOString() };
  });
}

/** Bug hunt totals for a page, summed over all hunts on it. */
export function bugsForPage(p: Progress, key: string) {
  return Object.entries(p.bugs)
    .filter(([k]) => k === key || k.startsWith(key + '#'))
    .reduce((acc, [, v]) => ({ found: acc.found + v.found.length, total: acc.total + v.total }), { found: 0, total: 0 });
}

// ---------- Export / import ----------

function readChecklists() {
  const out: Record<string, boolean[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(CHECKLIST_PREFIX)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? 'null');
      if (Array.isArray(v)) out[k] = v.map(Boolean);
    }
  } catch {}
  return out;
}

export function exportData(): ExportFile {
  let bites: ExportFile['bites'];
  let capstone: ExportFile['capstone'];
  try {
    bites = JSON.parse(localStorage.getItem(BITES_KEY) ?? 'null') ?? undefined;
    capstone = JSON.parse(localStorage.getItem(CAPSTONE_KEY) ?? 'null') ?? undefined;
  } catch {}
  return { app: 'bugwise', version: 1, exportedAt: new Date().toISOString(), progress: load(), checklists: readChecklists(), bites, capstone };
}

/** A compact text code that can be copied to another device. */
export function toCode(data: ExportFile) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return 'BW1.' + btoa(bin);
}

/** Accepts either a code from toCode() or the contents of an exported .json file. */
export function parseImport(text: string): ExportFile {
  let raw = text.trim();
  if (raw.startsWith('BW1.')) {
    const bin = atob(raw.slice(4));
    raw = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  const data = JSON.parse(raw);
  if (data?.app !== 'bugwise' || !data.progress) throw new Error('This is not a Bugwise progress file.');
  return data as ExportFile;
}

/** Merges imported progress into the current one, never losing anything already done here. */
export function importData(data: ExportFile) {
  const incoming = { ...empty(), ...data.progress };
  update((p) => {
    for (const [k, v] of Object.entries(incoming.completed)) p.completed[k] ??= v;
    for (const [k, v] of Object.entries(incoming.quizzes)) {
      const cur = p.quizzes[k];
      p.quizzes[k] = cur ? { best: Math.max(cur.best, v.best), last: cur.last, total: v.total } : v;
    }
    for (const [k, v] of Object.entries(incoming.bugs)) {
      p.bugs[k] = { found: [...new Set([...(p.bugs[k]?.found ?? []), ...v.found])].sort((a, b) => a - b), total: v.total };
    }
    if (incoming.last && (!p.last || incoming.last.at > p.last.at)) p.last = incoming.last;
  });
  try {
    for (const [k, v] of Object.entries(data.checklists ?? {})) {
      if (!k.startsWith(CHECKLIST_PREFIX) || !Array.isArray(v)) continue;
      const cur = JSON.parse(localStorage.getItem(k) ?? 'null');
      const merged = Array.isArray(cur) && cur.length === v.length ? cur.map((c: boolean, i: number) => c || v[i]) : v;
      localStorage.setItem(k, JSON.stringify(merged));
    }
  } catch {}
  if (data.bites) {
    try {
      const cur = JSON.parse(localStorage.getItem(BITES_KEY) ?? 'null') ?? { cards: {}, days: {} };
      for (const [id, c] of Object.entries(data.bites.cards ?? {})) {
        const mine = cur.cards[id];
        if (!mine || c.last > mine.last) cur.cards[id] = c;
      }
      for (const [d, n] of Object.entries(data.bites.days ?? {})) cur.days[d] = Math.max(cur.days[d] ?? 0, n);
      localStorage.setItem(BITES_KEY, JSON.stringify(cur));
    } catch {}
  }
  if (data.capstone) {
    // A capstone run can't be merged sensibly, so keep whichever one got further (phases done, then reports filed).
    try {
      const cur = JSON.parse(localStorage.getItem(CAPSTONE_KEY) ?? 'null');
      const rank = (c: ExportFile['capstone'] | null) => (c ? Object.keys(c.phases ?? {}).length * 1000 + (c.reports?.length ?? 0) : -1);
      if (rank(data.capstone) > rank(cur)) {
        localStorage.setItem(CAPSTONE_KEY, JSON.stringify(data.capstone));
        window.dispatchEvent(new CustomEvent('capstone-change'));
      }
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('progress-change'));
}

export function resetAll() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BITES_KEY);
    localStorage.removeItem(CAPSTONE_KEY);
    for (const k of Object.keys(readChecklists())) localStorage.removeItem(k);
  } catch {}
  window.dispatchEvent(new CustomEvent('progress-change'));
}
