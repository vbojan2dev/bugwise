import { useEffect, useRef, useState } from 'react';
import { Clipboard, ClipboardCheck, RotateCcw, Sparkles } from 'lucide-react';

/**
 * Exercise for "Tell Me About Yourself and Why QA": write a present / past / future pitch,
 * see it assembled, with a word count, an estimated speaking time and gentle warnings.
 * Nothing is stored or sent anywhere.
 */

type Part = 'present' | 'past' | 'future';

const parts: { key: Part; label: string; prompt: string; placeholder: string }[] = [
  {
    key: 'present',
    label: 'Present',
    prompt: 'Who are you now, and what are you doing to become a tester?',
    placeholder: 'I am a customer support specialist at a travel booking company, and for the last six months I have been training to become a manual QA tester...',
  },
  {
    key: 'past',
    label: 'Past',
    prompt: 'What from your background makes you good at testing? One concrete example.',
    placeholder: 'Before that I worked in retail, where I...',
  },
  {
    key: 'future',
    label: 'Future',
    prompt: 'What do you want next, and why this role or company?',
    placeholder: 'I am looking for a junior QA role where I can...',
  },
];

const example: Record<Part, string> = {
  present:
    'I am a customer support specialist at a travel booking company, and for the last six months I have been training to become a manual tester. I finished a full testing course and a practice project where I tested a food delivery app: I wrote a test plan, test cases and bug reports, and a release recommendation.',
  past:
    'In support I spend a lot of my day reproducing problems customers report in our app and writing clear tickets for the developers. Last year I noticed that several complaints about failed bookings all came from users with older Android phones. I collected the details, and the team found a bug in the payment screen. That was the moment I realized I enjoy finding the cause more than closing the ticket.',
  future:
    'Now I am looking for a junior QA role in a product team. Your app is used by millions of people on the go, so mobile quality really matters, and I like that your testers work inside the development teams. I would love to bring my user perspective and keep growing toward API testing.',
};

const WPM = 140;
const apologetic = [/\bonly\b/i, /\bjust\b/i, /unfortunately/i, /\bsorry\b/i, /i know i (don'?t|do not) have/i, /i'?m not sure/i, /\bnot really\b/i];

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function PitchBuilder() {
  const [text, setText] = useState<Record<Part, string>>({ present: '', past: '', future: '' });
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const full = parts
    .map((p) => text[p.key].trim())
    .filter(Boolean)
    .join('\n\n');
  const total = words(full);
  const seconds = Math.round((total / WPM) * 60);
  const flagged = apologetic.filter((re) => re.test(full)).map((re) => full.match(re)?.[0]);
  const missing = parts.filter((p) => !text[p.key].trim());

  let timing: { tone: string; msg: string };
  if (total === 0) timing = { tone: 'text-muted', msg: 'Start writing, or load the example to see how it works.' };
  else if (seconds < 55) timing = { tone: 'text-warn', msg: 'A bit short. Add one concrete example from your past: a moment, a number, a result.' };
  else if (seconds <= 95) timing = { tone: 'text-ok', msg: 'Good length: about one to one and a half minutes when spoken calmly.' };
  else if (seconds <= 130) timing = { tone: 'text-warn', msg: 'A little long. Cut background details; keep one example and your "why".' };
  else timing = { tone: 'text-danger', msg: 'Too long for an opening answer. Aim for 140 to 210 words; they can always ask for more.' };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied('idle'), 2000);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Build your 60 to 90 second pitch</p>
          <p className="text-sm text-muted">Three short parts: present, past, future. Nothing you type leaves this page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setText({ ...example })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Sparkles size={14} aria-hidden="true" /> Load example
          </button>
          <button
            type="button"
            onClick={() => setText({ present: '', past: '', future: '' })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={14} aria-hidden="true" /> Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          {parts.map((p, i) => (
            <div key={p.key} className="min-w-0">
              <label htmlFor={`pitch-${p.key}`} className="block text-sm font-semibold text-fg">
                {i + 1}. {p.label}
                <span className="ml-2 text-xs font-normal text-faint">{words(text[p.key])} words</span>
              </label>
              <p className="text-xs text-muted">{p.prompt}</p>
              <textarea
                id={`pitch-${p.key}`}
                rows={4}
                value={text[p.key]}
                placeholder={p.placeholder}
                onChange={(e) => {
                  const v = e.target.value;
                  setText((prev) => ({ ...prev, [p.key]: v }));
                }}
                className="mt-1.5 block w-full min-w-0 resize-y rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-faint focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-line bg-subtle p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Your pitch</p>
              <button
                type="button"
                onClick={copy}
                disabled={!full}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-40"
              >
                {copied === 'ok' ? <ClipboardCheck size={13} aria-hidden="true" /> : <Clipboard size={13} aria-hidden="true" />}
                {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Select and copy' : 'Copy'}
              </button>
            </div>
            {full ? (
              <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-fg">{full}</p>
            ) : (
              <p className="mt-2 text-sm text-faint">Your three parts appear here as one answer.</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-line p-4 text-sm" aria-live="polite">
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <strong className="text-fg tabular-nums">{total}</strong> <span className="text-muted">words</span>
              </span>
              <span>
                <strong className="text-fg tabular-nums">~{seconds}s</strong> <span className="text-muted">spoken (at about {WPM} words a minute)</span>
              </span>
            </p>
            <p className={timing.tone}>{timing.msg}</p>
            {total > 0 && missing.length > 0 && (
              <p className="text-warn">Missing: {missing.map((m) => m.label).join(', ')}. All three parts make the story feel complete.</p>
            )}
            {flagged.length > 0 && (
              <p className="text-warn">
                Watch the apologetic words: <span className="font-mono">{flagged.map((f) => `"${f}"`).join(', ')}</span>. "I only did a course" sounds weaker than "I completed a course
                and a practice project". State facts with confidence.
              </p>
            )}
            {total > 0 && flagged.length === 0 && missing.length === 0 && (
              <p className="text-ok">No apologetic phrases found. Now say it out loud three times and time yourself.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
