import { useState } from 'react';
import { ArrowRight, Bug, CheckCircle2, CircleDashed, RotateCcw, XCircle } from 'lucide-react';

/**
 * "Guess where it breaks": each round shows a small spec and a pool of test inputs or conditions.
 * The learner has a limited budget of tests, picks the ones they'd try first, then sees which ones
 * would have exposed the (fictional) defects hidden in that build. Every option has an explanation.
 *
 * Hidden defects per round:
 * 1 Display name: spaces-only accepted, apostrophe escaped as \', emoji split by truncation, HTML rendered.
 * 2 Transfer amount: €0 transfer sent, negative amount accepted, "1.250,50" read as €1.25, "1e3" read as €1,000.
 * 3 Profile photo: denied camera permission gives a black screen, lock mid-upload loses the photo silently,
 *   slow network shows "File too large", panorama photo crops to a strip.
 * 4 Birthday reward: 29 February never rewarded in non-leap years, voucher sent in UTC instead of local time,
 *   US month-first format stores day and month swapped.
 */

type Option = { id: string; label: string; tag: string; defect: boolean; result: string };
type Round = { id: string; tab: string; app: string; feature: string; spec: string[]; budget: number; options: Option[]; lesson: string };

const ROUNDS: Round[] = [
  {
    id: 'name',
    tab: 'Display name',
    app: 'Fitness app · Profile',
    feature: 'Display name',
    spec: ['1 to 30 characters.', 'Shown on the weekly leaderboard and in friend invites.'],
    budget: 5,
    options: [
      { id: 'sam', label: '“Sam”', tag: 'Typical value', defect: false, result: 'Saved and shown correctly. A good first sanity check, but it rarely finds bugs.' },
      { id: 'empty', label: '(empty)', tag: 'Empty', defect: false, result: 'Save stays disabled and a hint says “Enter a display name”. Handled well.' },
      { id: 'spaces', label: '“     ” (5 spaces)', tag: 'Whitespace only', defect: true, result: 'Bug: accepted as a valid name. The leaderboard shows a row with no name at all. The check counts characters but never trims spaces.' },
      { id: 'apos', label: '“Ana O’Neil”', tag: 'Special characters', defect: true, result: 'Bug: friend invites read “Ana O\\’Neil”. The apostrophe is escaped twice on its way to the invite text.' },
      { id: 'b30', label: '30 characters exactly', tag: 'Boundary', defect: false, result: 'Saved. Boundaries matter, but boundary value analysis already covers them; this build handles them.' },
      { id: 'b31', label: '31 characters', tag: 'Boundary', defect: false, result: 'Blocked, and the counter shows 31/30 in red. Correct.' },
      { id: 'emoji', label: '“Leo 🏃‍♂️🔥”', tag: 'Emoji', defect: true, result: 'Bug: the leaderboard shortens names by code units and cuts the runner emoji in half, leaving a “�” box. Emoji are made of several code units.' },
      { id: 'html', label: '“<b>Max</b>”', tag: 'Markup / injection', defect: true, result: 'Bug: everyone sees a bold “Max” on the leaderboard. The name is inserted as HTML, so the same hole could run a script (XSS).' },
      { id: 'dup', label: 'A name another user has', tag: 'Duplicates', defect: false, result: 'Allowed, and that’s what the spec wants: display names don’t have to be unique. Good test, no bug.' },
    ],
    lesson: 'Text fields break on what developers forget to imagine: blank-looking input, apostrophes, emoji and markup. Lengths were fine here because someone had already tested the boundaries.',
  },
  {
    id: 'amount',
    tab: 'Transfer amount',
    app: 'Banking app · Send money',
    feature: 'Amount (€)',
    spec: ['From €0.01 to €5,000.00 per transfer.', 'At most two decimals.', 'Customers type amounts in their phone’s number format.'],
    budget: 5,
    options: [
      { id: '25', label: '25.00', tag: 'Typical value', defect: false, result: 'Sent correctly. A fine first test, no bug.' },
      { id: 'zero', label: '0', tag: 'Zero', defect: true, result: 'Bug: a €0.00 transfer is sent and the recipient gets a “You received €0.00” notification. The minimum is never checked.' },
      { id: 'neg', label: '-50', tag: 'Negative', defect: true, result: 'Bug: accepted. The confirmation says “Send -€50.00” and the sender’s balance goes up by €50. Money flows the wrong way.' },
      { id: 'tiny', label: '0.001', tag: 'Too many decimals', defect: false, result: 'Rejected with “Use at most two decimals”. Correct.' },
      { id: 'max', label: '5000.00', tag: 'Boundary', defect: false, result: 'Sent. The upper boundary works.' },
      { id: 'over', label: '5000.01', tag: 'Boundary', defect: false, result: 'Rejected with “The limit is €5,000 per transfer”. Correct.' },
      { id: 'de', label: '1.250,50 (German format)', tag: 'Locale format', defect: true, result: 'Bug: read as €1.25. In German, “.” groups thousands and “,” marks decimals, but the app always treats “.” as the decimal point.' },
      { id: 'sci', label: '1e3', tag: 'Odd notation', defect: true, result: 'Bug: accepted and sent as €1,000.00. A generic number parser understands scientific notation, which no bank customer means.' },
      { id: 'blank', label: '(empty)', tag: 'Empty', defect: false, result: 'The Continue button stays disabled. Handled.' },
    ],
    lesson: 'Numbers break on zero, negatives, too many decimals and other people’s number formats. Two of the four bugs here move money the wrong way, so they’d be critical.',
  },
  {
    id: 'photo',
    tab: 'Profile photo',
    app: 'Fitness app · Edit profile',
    feature: 'Profile photo upload',
    spec: ['Take a photo or pick one from the gallery.', 'JPEG, PNG or HEIC, up to 10 MB.', 'A progress bar shows the upload.'],
    budget: 5,
    options: [
      { id: 'jpeg', label: 'A normal 2 MB JPEG', tag: 'Typical value', defect: false, result: 'Uploaded with a progress bar. Works.' },
      { id: 'perm', label: 'Deny camera permission, then tap Take photo', tag: 'Permission denied', defect: true, result: 'Bug: the camera screen stays black with no message and no way to open Settings. Users think the app is broken.' },
      { id: 'lock', label: 'Lock the phone halfway through the upload', tag: 'Interrupted action', defect: true, result: 'Bug: the upload stops silently. After unlocking, the old photo is still there and no error or retry is shown.' },
      { id: 'slow', label: 'Upload on a very slow connection', tag: 'Slow network', defect: true, result: 'Bug: after 10 seconds the upload times out and the app says “File too large”, a misleading message for a timeout.' },
      { id: 'big', label: 'A 12 MB photo', tag: 'Too large', defect: false, result: 'Blocked before uploading: “Photos must be under 10 MB”. Correct.' },
      { id: 'heic', label: 'A HEIC photo from an iPhone', tag: 'Format', defect: false, result: 'Converted and uploaded. The spec lists HEIC, and the team tested it.' },
      { id: 'gif', label: 'An animated GIF', tag: 'Unsupported format', defect: false, result: 'Rejected with “Use a JPEG, PNG or HEIC photo”. Clear.' },
      { id: 'pano', label: 'A panorama (8000 × 1500 px)', tag: 'Extreme shape', defect: true, result: 'Bug: the round avatar shows a thin, stretched strip. The crop assumes roughly square photos.' },
      { id: 'twice', label: 'Upload the same photo twice', tag: 'Duplicates', defect: false, result: 'The second upload simply replaces the first. Fine.' },
    ],
    lesson: 'For features, the classic guesses are about the world around the input: permissions, interruptions, slow networks and unusual files. Format and size limits were already covered by the spec.',
  },
  {
    id: 'birthday',
    tab: 'Birthday reward',
    app: 'Smoothie bar app · Rewards',
    feature: 'Birthday (day and month)',
    spec: ['Members get a free smoothie voucher on their birthday.', 'It arrives at 9:00 in the member’s local time.'],
    budget: 4,
    options: [
      { id: 'may', label: '14 May', tag: 'Typical value', defect: false, result: 'Voucher arrives at 9:00 on 14 May. Works.' },
      { id: 'leap', label: '29 February', tag: 'Leap day', defect: true, result: 'Bug: in years without 29 February, no voucher is ever sent. The job looks for an exact date match. The team must decide: 28 Feb or 1 Mar?' },
      { id: 'jan1', label: '1 January', tag: 'Start of year', defect: false, result: 'Voucher arrives on 1 January. Fine.' },
      { id: 'dec31', label: '31 December', tag: 'End of year', defect: false, result: 'Voucher arrives on 31 December and is valid into January. Fine.' },
      { id: 'tz', label: 'Member in Tokyo (UTC+9)', tag: 'Time zone', defect: true, result: 'Bug: the voucher arrives at 9:00 UTC, which is 18:00 in Tokyo. The server uses its own clock, not the member’s time zone.' },
      { id: 'us', label: 'Phone region: United States', tag: 'Date format', defect: true, result: 'Bug: the US shows dates month first. A birthday entered as 03/04 (March 4) is stored as 3 April, because the server reads it day first.' },
      { id: 'notif', label: 'Notifications turned off for the app', tag: 'Permission denied', defect: false, result: 'No push, but the voucher still appears in the Rewards tab. That matches the spec.' },
      { id: 'dst', label: 'Birthday on the night clocks change (DST)', tag: 'Daylight saving', defect: false, result: 'Arrives at 9:00 local time as promised. The team uses a proper time zone library.' },
    ],
    lesson: 'Dates hide classic traps: leap days, time zones and day/month order. Daylight saving was fine here, which is why you keep a checklist and pick by risk instead of testing everything every time.',
  },
];

type Phase = 'pick' | 'done';

export default function GuessWhereItBreaks() {
  const [r, setR] = useState(0);
  const round = ROUNDS[r];
  const [picked, setPicked] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('pick');
  const [scores, setScores] = useState<(number | null)[]>(() => ROUNDS.map(() => null));

  const defects = round.options.filter((o) => o.defect);
  const caught = round.options.filter((o) => o.defect && picked.includes(o.id)).length;

  const goTo = (i: number) => {
    setR(i);
    setPicked([]);
    setPhase('pick');
  };

  const toggle = (id: string) => {
    if (phase === 'done') return;
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= ROUNDS[r].budget ? prev : [...prev, id]));
  };

  const run = () => {
    setPhase('done');
    setScores((prev) => prev.map((s, i) => (i === r ? caught : s)));
  };

  const totalCaught = scores.reduce<number>((n, s) => n + (s ?? 0), 0);
  const totalDefects = ROUNDS.reduce((n, x) => n + x.options.filter((o) => o.defect).length, 0);
  const played = scores.filter((s) => s !== null).length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <p className="font-semibold text-fg">🎯 Guess where it breaks</p>
        <p className="text-sm text-muted">
          Each build hides a few bugs. You only have time for a handful of tests: pick the ones you'd try first, then run them and see what your experience caught.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Round">
          {ROUNDS.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={i === r}
              onClick={() => goTo(i)}
              className={`rounded-full border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                i === r ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {i + 1}. {x.tab}
              {scores[i] !== null && <span className="ml-1 text-faint">({scores[i]}/{x.options.filter((o) => o.defect).length})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
          <div className="min-w-0 rounded-xl border-l-4 border-brand bg-subtle p-3">
            <p className="text-xs font-semibold text-faint">{round.app}</p>
            <p className="mt-0.5 text-sm font-semibold text-fg">Spec: {round.feature}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-fg">
              {round.spec.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="flex min-w-0 flex-col justify-center rounded-xl border border-line p-3 text-sm">
            <p className="text-muted">Test budget</p>
            <p className="text-xl font-bold text-fg tabular-nums" aria-live="polite">
              {picked.length} / {round.budget} picked
            </p>
            <p className="text-xs text-faint">{round.options.length} ideas, {round.budget} tests of time</p>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Test ideas">
          {round.options.map((o) => {
            const isPicked = picked.includes(o.id);
            let state = '';
            let Icon = CircleDashed;
            let label = '';
            if (phase === 'done') {
              if (o.defect && isPicked) {
                state = 'border-ok bg-ok-soft';
                Icon = Bug;
                label = 'Caught a bug';
              } else if (o.defect) {
                state = 'border-danger bg-danger-soft';
                Icon = XCircle;
                label = 'Missed bug';
              } else if (isPicked) {
                state = 'border-line bg-subtle';
                Icon = CheckCircle2;
                label = 'Passed';
              } else {
                state = 'border-line opacity-80';
                Icon = CircleDashed;
                label = 'Not tried';
              }
            } else {
              state = isPicked ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong';
            }
            return (
              <li key={o.id} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => toggle(o.id)}
                  aria-disabled={phase === 'done' || (!isPicked && picked.length >= round.budget)}
                  className={`flex h-full w-full min-w-0 flex-col items-start gap-1 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${state} ${
                    phase === 'pick' && !isPicked && picked.length >= round.budget ? 'cursor-not-allowed opacity-60' : ''
                  } ${phase === 'done' ? 'cursor-default' : ''}`}
                >
                  <span className="flex w-full min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0 font-mono text-sm break-words text-fg">{o.label}</span>
                    {phase === 'pick' ? (
                      <span
                        className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${isPicked ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'}`}
                        aria-hidden="true"
                      >
                        {isPicked ? '✓' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fg">
                        <Icon size={13} aria-hidden="true" className={o.defect ? (isPicked ? 'text-ok' : 'text-danger') : 'text-muted'} />
                        {label}
                      </span>
                    )}
                  </span>
                  {phase === 'done' && (
                    <>
                      <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">{o.tag}</span>
                      <span className="text-xs text-fg">{o.result}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          {phase === 'pick' ? (
            <>
              <button
                type="button"
                onClick={run}
                disabled={picked.length === 0}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
              >
                Run my {picked.length || ''} test{picked.length === 1 ? '' : 's'}
              </button>
              {picked.length === 0 && <span className="text-xs text-faint">Pick at least one idea.</span>}
              {picked.length >= round.budget && <span className="text-xs text-faint">Budget used. Unpick one to swap.</span>}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => goTo(r)}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <RotateCcw size={13} aria-hidden="true" /> Try again
              </button>
              {r < ROUNDS.length - 1 && (
                <button
                  type="button"
                  onClick={() => goTo(r + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-ok px-3 py-2 text-sm font-semibold text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  Next round <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>

        {phase === 'done' && (
          <div className={`rounded-xl p-3 text-sm text-fg ${caught === defects.length ? 'bg-ok-soft' : 'bg-subtle'}`} role="status">
            <p>
              <strong>
                You caught {caught} of {defects.length} bugs
              </strong>{' '}
              with {picked.length} test{picked.length === 1 ? '' : 's'}.{' '}
              {caught === defects.length ? 'Perfect guesses.' : caught >= defects.length / 2 ? 'Good instincts.' : 'Those misses are exactly what a checklist is for.'}
            </p>
            <p className="mt-1">{round.lesson}</p>
            {played > 1 && (
              <p className="mt-1 text-xs text-muted">
                Total so far: {totalCaught} of {totalDefects} bugs across all rounds ({played} of {ROUNDS.length} rounds played).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
