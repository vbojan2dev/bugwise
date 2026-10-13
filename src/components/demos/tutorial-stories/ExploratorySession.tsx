import { useCallback, useEffect, useRef, useState } from 'react';
import { Bug, Check, ClipboardCopy, Compass, Flag, HelpCircle, Lightbulb, Pause, Play, RotateCcw, Timer, Trash2, X } from 'lucide-react';
import { ParkEasyApp, type AreaId, type BugId } from './ParkEasyApp';

/**
 * A full mini exploratory session: pick a charter, start a time-boxed session, explore the
 * ParkEasy app while taking notes (bugs / questions / ideas), then debrief: which hidden bugs
 * you triggered vs missed, coverage, and a generated session report.
 */

const TIME_BOX = 10 * 60;

const charters = [
  {
    id: 'money',
    title: 'The money tour',
    text: 'Explore the parking payment flow with boundary values and fast repeated taps to discover how ParkEasy handles money.',
    tips: ['Goldilocks: try the smallest and largest duration', 'Tap Pay twice, quickly', 'After paying, try to get back to Pay'],
    scope: ['zero', 'double', 'back'] as BugId[],
  },
  {
    id: 'nav',
    title: 'Back button and rotation tour',
    text: 'Explore navigation with the system back button and rotation to discover lost or repeated state.',
    tips: ['Press System back on every screen', 'Fill in the form, then rotate', 'Visit every tab, even when you have no data yet'],
    scope: ['back', 'rotate', 'empty'] as BugId[],
  },
  {
    id: 'data',
    title: 'Data tour: empty and too big',
    text: 'Explore vehicles and sessions with empty and very long data to discover display problems.',
    tips: ['Look at each screen before you have any data', 'Add a vehicle with a very long nickname', 'Check where that data shows up later'],
    scope: ['empty', 'longtext', 'zero'] as BugId[],
  },
];

const bugInfo: { id: BugId; title: string; hint: string; detail: string; heuristic: string }[] = [
  {
    id: 'zero',
    title: 'Duration can be set to 0 min and paid',
    hint: 'Push the duration stepper to its smallest value.',
    detail: 'The minus button stops at 0 instead of 15 minutes. You can “pay” €0.00 for a session that ends right now. A Goldilocks “too small” bug.',
    heuristic: 'Goldilocks / boundaries',
  },
  {
    id: 'double',
    title: 'Double-tapping Pay charges twice',
    hint: 'Tap Pay twice in quick succession.',
    detail: 'Pay stays enabled while “Paying…” is shown. Each tap takes money from the wallet and creates another session. A classic double submit on the money tour.',
    heuristic: 'Money tour / double tap',
  },
  {
    id: 'back',
    title: 'Back after paying returns to the Pay screen',
    hint: 'Pay for parking, then press System back.',
    detail: 'Back from “You’re parked” returns to Confirm with Pay enabled. Tapping it pays again for the same parking. Back should leave the finished payment flow.',
    heuristic: 'Back button tour',
  },
  {
    id: 'rotate',
    title: 'Rotating clears the parking form',
    hint: 'Fill in a zone and change the duration, then rotate.',
    detail: 'Rotation recreates the Park screen without restoring its state: zone, duration and vehicle are lost. On Android this is a configuration change; users rotate by accident all the time.',
    heuristic: 'Interruptions / rotation',
  },
  {
    id: 'empty',
    title: 'Sessions shows “Loading…” forever with no parking',
    hint: 'Open Sessions before you have paid for anything.',
    detail: 'With zero sessions the spinner never stops. There should be an empty state like “No active parking” with a button to start parking.',
    heuristic: 'Empty states / CRUD (read nothing)',
  },
  {
    id: 'longtext',
    title: 'A long vehicle nickname hides the Continue button',
    hint: 'Add a vehicle with a very long nickname and go back to Park.',
    detail: 'The nickname has no length limit and doesn’t truncate in the footer, so the total and Continue are pushed off-screen. Users can’t continue unless they rotate or rename the car.',
    heuristic: 'Long text / Goldilocks too big',
  },
];

const areaLabels: Record<AreaId, string> = {
  form: 'Park form',
  confirm: 'Confirm & pay',
  paid: 'Success screen',
  sessions: 'Sessions tab',
  vehicles: 'Vehicles list',
  addcar: 'Add vehicle',
  back: 'System back',
  rotate: 'Rotation',
};

type Kind = 'bug' | 'question' | 'idea';
interface Note {
  id: number;
  kind: Kind;
  text: string;
  at: number;
}

const kinds: { id: Kind; label: string; icon: typeof Bug; cls: string }[] = [
  { id: 'bug', label: 'Bug', icon: Bug, cls: 'text-danger' },
  { id: 'question', label: 'Question', icon: HelpCircle, cls: 'text-info' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, cls: 'text-warn' },
];

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function ExploratorySession() {
  const [phase, setPhase] = useState<'setup' | 'running' | 'debrief'>('setup');
  const [charterId, setCharterId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [kind, setKind] = useState<Kind>('bug');
  const [draft, setDraft] = useState('');
  const [triggered, setTriggered] = useState<BugId[]>([]);
  const [covered, setCovered] = useState<AreaId[]>([]);
  const [copied, setCopied] = useState(false);
  const [appKey, setAppKey] = useState(0);
  const [wide, setWide] = useState(false);
  const nextNote = useRef(1);
  const debriefHeading = useRef<HTMLHeadingElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, paused]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  useEffect(() => {
    if (phase === 'debrief') debriefHeading.current?.focus();
  }, [phase]);

  const onBug = useCallback((id: BugId) => setTriggered((prev) => (prev.includes(id) ? prev : [...prev, id])), []);
  const onCover = useCallback((id: AreaId) => setCovered((prev) => (prev.includes(id) ? prev : [...prev, id])), []);

  const charter = charters.find((c) => c.id === charterId) ?? null;
  const remaining = Math.max(0, TIME_BOX - elapsed);
  const over = elapsed >= TIME_BOX;

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes((prev) => [...prev, { id: nextNote.current++, kind, text, at: elapsed }]);
    setDraft('');
  };

  const restart = () => {
    setPhase('setup');
    setCharterId(null);
    setElapsed(0);
    setPaused(false);
    setNotes([]);
    setDraft('');
    setTriggered([]);
    setCovered([]);
    setAppKey((k) => k + 1);
  };

  const byKind = (k: Kind) => notes.filter((n) => n.kind === k);

  const report = () => {
    const lines: string[] = [];
    lines.push('EXPLORATORY SESSION REPORT');
    lines.push('App: ParkEasy (iOS test build)');
    lines.push(`Charter: ${charter?.text ?? '-'}`);
    lines.push(`Duration: ${mmss(elapsed)} of a ${mmss(TIME_BOX)} time box`);
    lines.push('');
    lines.push(`Covered: ${covered.length ? covered.map((a) => areaLabels[a]).join(', ') : 'nothing yet'}`);
    const notCovered = (Object.keys(areaLabels) as AreaId[]).filter((a) => !covered.includes(a));
    lines.push(`Not covered: ${notCovered.length ? notCovered.map((a) => areaLabels[a]).join(', ') : 'none'}`);
    (['bug', 'question', 'idea'] as Kind[]).forEach((k) => {
      const list = byKind(k);
      lines.push('');
      lines.push(`${k === 'bug' ? 'Bugs' : k === 'question' ? 'Questions' : 'Ideas'} (${list.length}):`);
      if (!list.length) lines.push('- none');
      list.forEach((n) => lines.push(`- [${mmss(n.at)}] ${n.text}`));
    });
    lines.push('');
    lines.push('Next: write bug reports for the bugs above, ask the questions at stand-up,');
    lines.push('and plan a follow-up session for the areas not covered.');
    return lines.join('\n');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report());
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const btnPrimary =
    'inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40';
  const btnGhost =
    'inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Compass size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-semibold text-fg">Exploratory session: ParkEasy</p>
          <p className="text-sm text-muted">A street-parking app with 6 hidden bugs. Pick a charter, explore, take notes, debrief.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-semibold tabular-nums ${over ? 'bg-warn-soft text-warn' : 'bg-subtle text-fg'}`}
            role="timer"
            aria-label={`Time left ${mmss(remaining)}`}
          >
            <Timer size={14} aria-hidden="true" /> {mmss(remaining)}
          </span>
          {phase === 'running' && (
            <button type="button" onClick={() => setPaused((p) => !p)} className={btnGhost} aria-label={paused ? 'Resume timer' : 'Pause timer'}>
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${wide ? '' : 'lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)]'}`}>
        {/* App column */}
        <div className={`relative min-w-0 border-b border-line bg-subtle p-4 sm:p-5 ${wide ? '' : 'lg:border-r lg:border-b-0'}`}>
          <div inert={phase === 'setup'}>
            <ParkEasyApp key={appKey} onBug={onBug} onCover={onCover} onRotate={setWide} />
          </div>
          {phase === 'setup' && (
            <div className="absolute inset-0 grid place-items-center bg-surface/85 p-6 text-center backdrop-blur-[2px]">
              <p className="max-w-[240px] text-sm font-semibold text-fg">Pick a charter and press Start to unlock the app.</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="min-w-0 p-4 sm:p-5">
          {phase === 'setup' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-fg">1. Pick your charter</p>
              <div className="space-y-2" role="radiogroup" aria-label="Charter">
                {charters.map((c) => {
                  const on = c.id === charterId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setCharterId(c.id)}
                      className={`block w-full min-w-0 rounded-2xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        on ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                        <Flag size={14} className="text-brand" aria-hidden="true" /> {c.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted">{c.text}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted">
                2. You get a <strong className="text-fg">10-minute time box</strong>. Real sessions usually run 60 to 120 minutes; this one is a short practice round. Use
                the device buttons under the phone too.
              </p>
              <button type="button" disabled={!charter} onClick={() => setPhase('running')} className={btnPrimary}>
                <Play size={15} aria-hidden="true" /> Start session
              </button>
            </div>
          )}

          {phase === 'running' && charter && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-subtle p-3.5 text-sm">
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">Charter</p>
                <p className="mt-1 text-fg">{charter.text}</p>
                <p className="mt-2 text-xs font-semibold tracking-wide text-faint uppercase">Heuristics to try</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                  {charter.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              {over && (
                <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn" role="status">
                  Time box over. Wrap up your notes and debrief (or keep going, and say so in the report).
                </p>
              )}

              <div>
                <p className="text-sm font-semibold text-fg">Session notes</p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Note type">
                  {kinds.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      role="radio"
                      aria-checked={kind === k.id}
                      onClick={() => setKind(k.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        kind === k.id ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'
                      }`}
                    >
                      <k.icon size={13} className={k.cls} aria-hidden="true" /> {k.label}
                    </button>
                  ))}
                </div>
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addNote();
                  }}
                >
                  <label htmlFor="es-note" className="sr-only">
                    Note text
                  </label>
                  <input
                    id="es-note"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={kind === 'bug' ? 'e.g. Pay charged twice after a double tap' : kind === 'question' ? 'e.g. What is the max parking time per zone?' : 'e.g. Try with no network next session'}
                    className="w-0 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-faint focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  />
                  <button type="submit" disabled={!draft.trim()} className={btnPrimary}>
                    Add
                  </button>
                </form>
                <ul className="mt-3 space-y-1.5" aria-live="polite">
                  {notes.length === 0 && <li className="text-sm text-faint">No notes yet. Write down bugs, questions and ideas as you go.</li>}
                  {notes.map((n) => {
                    const k = kinds.find((x) => x.id === n.kind)!;
                    return (
                      <li key={n.id} className="flex items-start gap-2 rounded-xl border border-line bg-subtle px-3 py-2 text-sm">
                        <k.icon size={14} className={`mt-0.5 shrink-0 ${k.cls}`} aria-label={k.label} />
                        <span className="font-mono text-xs text-faint">{mmss(n.at)}</span>
                        <span className="min-w-0 flex-1 break-words text-fg">{n.text}</span>
                        <button
                          type="button"
                          onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                          className="shrink-0 rounded text-faint hover:text-danger focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          aria-label={`Delete note: ${n.text}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setPhase('debrief');
                }}
                className={btnPrimary}
              >
                <Flag size={15} aria-hidden="true" /> End session and debrief
              </button>
            </div>
          )}

          {phase === 'debrief' && charter && (
            <div className="space-y-4">
              <h4 ref={debriefHeading} tabIndex={-1} className="text-base font-semibold text-fg focus:outline-none">
                Debrief: you triggered {triggered.length} of {bugInfo.length} hidden bugs
              </h4>
              <p className="text-sm text-muted">
                “Triggered” means you made the bug happen in the app. Compare it with your <strong className="text-fg">{byKind('bug').length} bug notes</strong>: a bug you
                saw but didn’t write down is a bug the team will never hear about.
              </p>
              <ul className="space-y-2">
                {bugInfo.map((b) => {
                  const hit = triggered.includes(b.id);
                  const inScope = charter.scope.includes(b.id);
                  return (
                    <li key={b.id} className={`rounded-2xl border p-3.5 text-sm ${hit ? 'border-ok bg-ok-soft' : 'border-line bg-subtle'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {hit ? <Check size={16} className="text-ok" aria-hidden="true" /> : <X size={16} className="text-faint" aria-hidden="true" />}
                        <span className="sr-only">{hit ? 'Triggered:' : 'Missed:'}</span>
                        <span className="min-w-0 flex-1 font-semibold text-fg">{hit ? b.title : `Missed: ${b.hint}`}</span>
                        {inScope && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">in your charter</span>}
                      </div>
                      {hit ? (
                        <p className="mt-1 text-muted">{b.detail}</p>
                      ) : (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-muted hover:text-fg">Reveal the bug</summary>
                          <p className="mt-1 font-semibold text-fg">{b.title}</p>
                          <p className="mt-0.5 text-muted">{b.detail}</p>
                        </details>
                      )}
                      <p className="mt-1.5 text-xs text-faint">Heuristic: {b.heuristic}</p>
                    </li>
                  );
                })}
              </ul>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">Your session report</p>
                  <button type="button" onClick={copy} className={btnGhost}>
                    <ClipboardCopy size={14} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-subtle p-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-fg">
                  {report()}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaused(false);
                    setPhase('running');
                  }}
                  className={btnGhost}
                >
                  <Play size={14} aria-hidden="true" /> Back to the session
                </button>
                <button type="button" onClick={restart} className={btnGhost}>
                  <RotateCcw size={14} aria-hidden="true" /> New session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
