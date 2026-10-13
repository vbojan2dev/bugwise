import { useId, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

/* Exercise: for each culprit found in the waterfall, pick the best fix and the metric it helps. */

const fixes = [
  'Resize and compress it (WebP/AVIF, srcset), keep it eager',
  'Add defer, split the bundle, ship less code',
  'Report to backend: speed up or cache the endpoint, show a skeleton',
  'Reserve space (min-height) or show it as an overlay',
  'Request once and share the result (dedupe or cache)',
];
const metrics = ['LCP', 'INP', 'CLS', 'None of the three directly'];

const culprits = [
  {
    title: 'hero-sneakers.jpg is 4.2 MB',
    fix: 0,
    metric: [0],
    why: 'It is the LCP element, so every second it downloads is a second added to LCP. A 1,200 px wide WebP is usually 100–250 KB. Never lazy-load the hero: that delays LCP even more.',
  },
  {
    title: 'app.bundle.js (1.1 MB) is render-blocking',
    fix: 1,
    metric: [0, 1],
    why: 'Nothing is painted until it downloads and runs, which delays FCP and LCP. Less JavaScript also means shorter long tasks, so taps respond faster (INP). Both answers count.',
  },
  {
    title: 'api/recommendations waits 3.1 s for the server',
    fix: 2,
    metric: [3],
    why: 'The recommendations are below the hero, so they are not the LCP element and the Core Web Vitals miss this. Users still see an empty section for 3 seconds. Report the TTFB number to the backend team.',
  },
  {
    title: 'Late promo banner shifts the page by 0.19',
    fix: 3,
    metric: [2],
    why: 'Content that appears late must not push existing content down. Reserving the space (or overlaying the banner) brings CLS back under 0.1.',
  },
  {
    title: 'api/cart/count is requested 20 times',
    fix: 4,
    metric: [3],
    why: 'One answer is enough. The repeats waste data, battery and server capacity, and cost main-thread time on slow phones. It is a real bug even though no Core Web Vital flags it.',
  },
];

export default function FixMatcher() {
  const uid = useId();
  const [answers, setAnswers] = useState<{ fix: number; metric: number }[]>(culprits.map(() => ({ fix: -1, metric: -1 })));
  const [checked, setChecked] = useState(false);

  const set = (i: number, k: 'fix' | 'metric', v: number) => {
    setChecked(false);
    setAnswers((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  };
  const score = culprits.filter((c, i) => answers[i].fix === c.fix && c.metric.includes(answers[i].metric)).length;
  const complete = answers.every((a) => a.fix >= 0 && a.metric >= 0);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🔧 Match the fix</p>
        <p className="text-sm text-muted">For each culprit from the waterfall, choose the best fix and the Core Web Vital it improves.</p>
      </div>
      <ol className="divide-y divide-line">
        {culprits.map((c, i) => {
          const ok = answers[i].fix === c.fix && c.metric.includes(answers[i].metric);
          return (
            <li key={c.title} className="space-y-2 px-5 py-4">
              <p className="flex items-start gap-2 text-sm font-semibold text-fg">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-xs text-muted">{i + 1}</span>
                <span className="min-w-0 pt-0.5">{c.title}</span>
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="block min-w-0">
                  <span className="sr-only">Fix for {c.title}</span>
                  <select
                    id={`${uid}-f${i}`}
                    value={answers[i].fix}
                    onChange={(e) => set(i, 'fix', +e.target.value)}
                    className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
                  >
                    <option value={-1}>Choose a fix…</option>
                    {fixes.map((f, j) => (
                      <option key={f} value={j}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="sr-only">Metric improved by fixing {c.title}</span>
                  <select value={answers[i].metric} onChange={(e) => set(i, 'metric', +e.target.value)} className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-sm text-fg">
                    <option value={-1}>Metric it helps…</option>
                    {metrics.map((m, j) => (
                      <option key={m} value={j}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {checked && (
                <p className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${ok ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
                  {ok ? <CheckCircle2 size={15} className="mt-px shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={15} className="mt-px shrink-0 text-danger" aria-hidden="true" />}
                  <span className="text-fg">
                    {!ok && (
                      <strong>
                        Best fix: {fixes[c.fix]}. Metric: {c.metric.map((m) => metrics[m]).join(' or ')}.{' '}
                      </strong>
                    )}
                    {c.why}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        <button
          type="button"
          disabled={!complete}
          onClick={() => setChecked(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg disabled:opacity-50"
        >
          Check my answers
        </button>
        <button
          type="button"
          onClick={() => {
            setAnswers(culprits.map(() => ({ fix: -1, metric: -1 })));
            setChecked(false);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          <RotateCcw size={13} aria-hidden="true" /> Reset
        </button>
        <p className="text-sm text-muted" aria-live="polite">
          {checked ? `${score} of ${culprits.length} correct${score === culprits.length ? '. Great diagnosis!' : '.'}` : complete ? 'Ready to check.' : 'Answer all five to check.'}
        </p>
      </div>
    </div>
  );
}
