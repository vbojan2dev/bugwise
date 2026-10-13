import { useState } from 'react';
import { Check, AlertTriangle, Flag } from 'lucide-react';

/** Build a charter from Explore <target> with <resources> to discover <information>, with feedback on each part. */

type Rating = 'good' | 'weak';
interface Opt {
  text: string;
  rating: Rating;
  note: string;
}

const parts: { key: string; lead: string; label: string; options: Opt[] }[] = [
  {
    key: 'target',
    lead: 'Explore',
    label: 'Target (where?)',
    options: [
      { text: 'the whole food delivery app', rating: 'weak', note: 'Too broad. You can’t finish “the whole app” in 90 minutes, so the session has no focus.' },
      { text: 'the checkout tip selector', rating: 'good', note: 'A clear, small area you can cover well in one session.' },
      { text: 'the order tracking screen', rating: 'good', note: 'A focused area with lots of state changes. Good target.' },
      { text: 'the Submit button color', rating: 'weak', note: 'Too narrow. You’d be done in two minutes; that’s a check, not a session.' },
    ],
  },
  {
    key: 'resources',
    lead: 'with',
    label: 'Resources (how?)',
    options: [
      { text: 'a slow 3G connection and airplane mode', rating: 'good', note: 'Concrete conditions that change behavior. They tell you what to vary.' },
      { text: 'boundary amounts (0, 0.01, very large) and quick repeated taps', rating: 'good', note: 'Clear heuristics: Goldilocks values and double taps.' },
      { text: 'a phone', rating: 'weak', note: 'Doesn’t guide you. Which phone, which settings, which data?' },
      { text: 'interruptions: calls, lock screen, app switching', rating: 'good', note: 'A proven mobile heuristic with a clear list of things to try.' },
    ],
  },
  {
    key: 'info',
    lead: 'to discover',
    label: 'Information (what for?)',
    options: [
      { text: 'bugs', rating: 'weak', note: 'Every session looks for bugs. Say which kind of information you want.' },
      { text: 'whether totals and tips stay correct', rating: 'good', note: 'A clear risk to investigate, and you’ll know when you’ve learned it.' },
      { text: 'how the status updates recover after losing signal', rating: 'good', note: 'Specific information the team needs.' },
      { text: 'if it works', rating: 'weak', note: 'Too vague to debrief. Works how? For whom?' },
    ],
  },
];

export default function CharterBuilder() {
  const [sel, setSel] = useState<number[]>([1, 0, 2]);
  const chosen = parts.map((p, i) => p.options[sel[i]]);
  const weak = chosen.filter((c) => c.rating === 'weak').length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">Charter builder</p>
        <p className="text-sm text-muted">Combine the three parts and see how strong your charter is.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
        {parts.map((p, i) => (
          <div key={p.key} className="min-w-0">
            <label htmlFor={`cb-${p.key}`} className="text-xs font-semibold tracking-wide text-faint uppercase">
              {p.label}
            </label>
            <select
              id={`cb-${p.key}`}
              value={sel[i]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSel((prev) => prev.map((s, n) => (n === i ? v : s)));
              }}
              className="mt-1 block w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {p.options.map((o, n) => (
                <option key={o.text} value={n}>
                  {o.text}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-line bg-subtle p-5" aria-live="polite">
        <p className="flex items-start gap-2 text-base text-fg">
          <Flag size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0">
            {parts.map((p, i) => (
              <span key={p.key}>
                {p.lead} <strong className={chosen[i].rating === 'good' ? 'text-fg' : 'text-danger'}>{chosen[i].text}</strong>
                {i < parts.length - 1 ? ' ' : '.'}
              </span>
            ))}
          </span>
        </p>
        <ul className="space-y-1.5 text-sm">
          {chosen.map((c, i) => (
            <li key={parts[i].key} className="flex gap-2">
              {c.rating === 'good' ? (
                <Check size={15} className="mt-0.5 shrink-0 text-ok" aria-label="Good" />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" aria-label="Weak" />
              )}
              <span className="min-w-0 text-muted">
                <strong className="text-fg">{parts[i].label.split(' ')[0]}:</strong> {c.note}
              </span>
            </li>
          ))}
        </ul>
        <p className={`text-sm font-semibold ${weak === 0 ? 'text-ok' : 'text-warn'}`}>
          {weak === 0 ? 'Strong charter: focused, with a clear way to explore and a clear goal.' : `${weak} weak part${weak > 1 ? 's' : ''}. Tighten ${weak > 1 ? 'them' : 'it'} before you start.`}
        </p>
      </div>
    </div>
  );
}
