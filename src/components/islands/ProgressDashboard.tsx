import { useEffect, useRef, useState } from 'react';
import { Bug, Check, CircleCheckBig, ClipboardCopy, Download, FileUp, Flag, RotateCcw, Trophy, Upload } from 'lucide-react';
import { loadCapstone, type CapstoneState } from '@/lib/capstone';
import { PHASES, RESULTS_PATH } from '@/components/capstone/phases';
import { bugsForPage, exportData, importData, load, parseImport, resetAll, toCode, type Progress } from '@/lib/progress';

interface CatalogItem {
  title: string;
  key: string;
  href: string;
}
interface CatalogGroup {
  id: string;
  title: string;
  accent: string;
  href: string;
  items: CatalogItem[];
}

function Ring({ value, total }: { value: number; total: number }) {
  const pct = total ? value / total : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="size-32 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="url(#ring)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className="transition-[stroke-dashoffset] duration-700"
      />
      <defs>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProgressDashboard({ catalog }: { catalog: CatalogGroup[] }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    const refresh = () => setProgress(load());
    refresh();
    addEventListener('progress-change', refresh);
    addEventListener('storage', refresh);
    return () => {
      removeEventListener('progress-change', refresh);
      removeEventListener('storage', refresh);
    };
  }, []);

  if (!progress) return <div className="h-64 animate-pulse rounded-3xl bg-subtle" />;

  const all = catalog.flatMap((g) => g.items);
  const done = all.filter((i) => progress.completed[i.key]).length;
  const quizzes = Object.values(progress.quizzes);
  const bugTotals = all.reduce(
    (acc, i) => {
      const b = bugsForPage(progress, i.key);
      return { found: acc.found + b.found, total: acc.total + b.total };
    },
    { found: 0, total: 0 },
  );
  const next = all.find((i) => !progress.completed[i.key]);

  const flash = (type: 'ok' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bugwise-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(toCode(exportData()));
      flash('ok', 'Progress code copied. Paste it on your other device.');
    } catch {
      flash('error', 'Could not copy. Use "Download file" instead.');
    }
  };

  const doImport = (text: string) => {
    try {
      importData(parseImport(text));
      setCode('');
      flash('ok', 'Progress imported and merged with what you already had here.');
    } catch (e) {
      flash('error', e instanceof Error && e.message.includes('Bugwise') ? e.message : 'That code or file could not be read.');
    }
  };

  const onFile = async (f?: File) => {
    if (f) doImport(await f.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = () => {
    if (confirm('Delete all your progress in this browser, including Bites and the capstone? This cannot be undone. Tip: export it first.')) {
      resetAll();
      flash('ok', 'Progress reset.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="card flex min-w-0 items-center gap-5 p-6 sm:col-span-3 lg:col-span-1">
          <div className="relative grid shrink-0 place-items-center">
            <Ring value={done} total={all.length} />
            <div className="absolute text-center">
              <p className="text-3xl font-bold tabular-nums">{all.length ? Math.round((done / all.length) * 100) : 0}%</p>
              <p className="text-xs text-faint">complete</p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold">
              {done} of {all.length} pages done
            </p>
            {next ? (
              <a href={base + next.href} className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                <span className="truncate">Next up: {next.title}</span> →
              </a>
            ) : (
              <p className="mt-2 text-sm text-ok">You've finished everything published so far! 🎉</p>
            )}
          </div>
        </div>
        {[
          { icon: CircleCheckBig, label: 'Pages completed', value: `${done}`, tone: 'text-ok bg-ok-soft' },
          {
            icon: Trophy,
            label: 'Quizzes taken',
            value: `${quizzes.length}`,
            sub: quizzes.length ? `${Math.round((quizzes.reduce((a, q) => a + q.best / q.total, 0) / quizzes.length) * 100)}% avg. best score` : undefined,
            tone: 'text-warn bg-warn-soft',
          },
          { icon: Bug, label: 'Bugs found', value: `${bugTotals.found}`, sub: bugTotals.total ? `in bug hunts you've opened` : undefined, tone: 'text-danger bg-danger-soft' },
        ].map((s) => (
          <div key={s.label} className="card min-w-0 p-6">
            <span className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon size={19} />
            </span>
            <p className="mt-4 text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            {s.sub && <p className="mt-1 text-xs text-faint">{s.sub}</p>}
          </div>
        ))}
      </section>

      <CapstoneSummary base={base} />

      {/* Per section */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {catalog
          .filter((g) => g.items.length)
          .map((g) => {
            const gDone = g.items.filter((i) => progress.completed[i.key]).length;
            return (
              <div key={g.id} className="card overflow-hidden" style={{ ['--accent' as string]: g.accent }}>
                <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                  <span className="size-2.5 rounded-full" style={{ background: g.accent }} />
                  <a href={base + g.href} className="font-semibold hover:underline">
                    {g.title}
                  </a>
                  <span className="ml-auto text-sm text-muted tabular-nums">
                    {gDone}/{g.items.length}
                  </span>
                </div>
                <div className="h-1 bg-subtle">
                  <div className="h-full transition-all duration-500" style={{ width: `${(gDone / g.items.length) * 100}%`, background: g.accent }} />
                </div>
                <ul className="divide-y divide-line">
                  {g.items.map((i) => {
                    const complete = !!progress.completed[i.key];
                    const quiz = progress.quizzes[i.key];
                    const bugs = bugsForPage(progress, i.key);
                    return (
                      <li key={i.key}>
                        <a href={base + i.href} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-subtle/60">
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${complete ? 'border-ok bg-ok text-white' : 'border-line-strong'}`}
                          >
                            {complete && <Check size={12} strokeWidth={3.5} />}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${complete ? 'text-muted' : 'font-medium'}`}>{i.title}</span>
                          {quiz && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn" title="Best quiz score">
                              <Trophy size={11} /> {quiz.best}/{quiz.total}
                            </span>
                          )}
                          {bugs.total > 0 && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger" title="Bugs found">
                              <Bug size={11} /> {bugs.found}/{bugs.total}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </section>

      {/* Data */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Move or back up your progress</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Your progress lives only in this browser, so there's no account to create. To continue on another device or browser, export it here and import it
          there. Importing merges with what's already saved, so nothing is lost.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-faint uppercase">Export</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyCode} className="flex h-10 items-center gap-2 rounded-xl bg-fg px-4 text-sm font-medium text-bg">
                <ClipboardCopy size={16} /> Copy progress code
              </button>
              <button type="button" onClick={download} className="flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-subtle">
                <Download size={16} /> Download file
              </button>
            </div>
            <p className="mt-2 text-xs text-faint">Includes completed pages, quiz scores, bugs found and checklists.</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-faint uppercase">Import</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste a progress code (BW1.…)"
                aria-label="Progress code"
                className="h-10 w-0 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-mono text-xs outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => doImport(code)}
                disabled={!code.trim()}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-fg px-4 text-sm font-medium text-bg disabled:opacity-40"
              >
                <Upload size={16} /> Import
              </button>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
              <FileUp size={15} /> or choose an exported .json file
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </div>

        {message && (
          <p role="status" className={`mt-5 rounded-xl px-4 py-2.5 text-sm ${message.type === 'ok' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
            {message.text}
          </p>
        )}

        <div className="mt-6 border-t border-line pt-5">
          <button type="button" onClick={reset} className="flex items-center gap-1.5 text-sm font-medium text-danger hover:underline">
            <RotateCcw size={15} /> Reset all progress
          </button>
        </div>
      </section>
    </div>
  );
}

/** A one-line summary of the capstone project, linking to where the learner left off. */
function CapstoneSummary({ base }: { base: string }) {
  const [c, setC] = useState<CapstoneState | null>(null);
  useEffect(() => {
    const refresh = () => setC(loadCapstone());
    refresh();
    addEventListener('capstone-change', refresh);
    addEventListener('progress-change', refresh);
    return () => {
      removeEventListener('capstone-change', refresh);
      removeEventListener('progress-change', refresh);
    };
  }, []);
  if (!c) return null;
  const done = PHASES.filter((p) => c.phases[p.id]).length;
  const next = PHASES.find((p) => !c.phases[p.id]);
  const target = !c.startedAt && done === 0 ? '/capstone' : next ? next.path : RESULTS_PATH;
  const label = done === 0 && !c.startedAt ? 'Start the capstone' : next ? `Continue: ${next.title}` : 'See results and certificate';
  return (
    <section className="card flex min-w-0 flex-col gap-4 p-6 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Flag size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Capstone: FoodDash 2.0 release</p>
        <p className="text-sm text-muted">
          {done} of {PHASES.length} phases done · {c.reports.length} {c.reports.length === 1 ? 'bug report' : 'bug reports'} filed
        </p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {PHASES.map((p) => (
            <span key={p.id} className={`h-1.5 flex-1 rounded-full ${c.phases[p.id] ? 'bg-brand' : 'bg-subtle'}`} />
          ))}
        </div>
      </div>
      <a href={base + target} className="shrink-0 text-sm font-medium text-brand hover:underline">
        {label} →
      </a>
    </section>
  );
}
