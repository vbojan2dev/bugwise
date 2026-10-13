/** Static 2×2 of severity vs priority with mobile and web examples. */

const quads = [
  {
    sev: 'High severity',
    pri: 'High priority',
    tone: 'border-danger/40 bg-danger-soft',
    title: 'Checkout crashes for everyone',
    text: 'Tapping "Place order" crashes the shopping app on every Android phone. No workaround, money lost every minute. Fix now, ship a hotfix.',
  },
  {
    sev: 'High severity',
    pri: 'Low priority',
    tone: 'border-warn/40 bg-warn-soft',
    title: 'Crash in a rarely used legacy export',
    text: 'The banking app crashes when exporting transactions as CSV, but only on Android 9 (2% of installs), and the website export works. Serious, rare, has a workaround.',
  },
  {
    sev: 'Low severity',
    pri: 'High priority',
    tone: 'border-warn/40 bg-warn-soft',
    title: 'Brand name typo before launch',
    text: '"FitPluse" instead of "FitPulse" in the homepage banner, the day before the launch campaign. Nothing is broken, but every visitor sees it.',
  },
  {
    sev: 'Low severity',
    pri: 'Low priority',
    tone: 'border-line bg-subtle',
    title: 'Misaligned icon in Settings',
    text: 'One icon sits 3 px lower than its neighbors on a screen people rarely open. Log it and fix it when someone is in that code anyway.',
  },
];

export default function Quadrants() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {quads.map((q) => (
        <div key={q.title} className={`min-w-0 rounded-2xl border p-4 ${q.tone}`}>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {q.sev} · {q.pri}
          </p>
          <p className="mt-1 font-semibold text-fg">{q.title}</p>
          <p className="mt-1 text-sm text-fg">{q.text}</p>
        </div>
      ))}
    </div>
  );
}
