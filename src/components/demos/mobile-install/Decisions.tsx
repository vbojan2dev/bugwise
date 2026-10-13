import { useState, type ReactNode } from 'react';
import { Check, RotateCcw, TriangleAlert } from 'lucide-react';

/* Generic "pick an answer for each card, then check" board, used by TrackSorter and RetestPlanner. */

interface Option {
  value: string;
  label: string;
}
interface Item {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  answer: string;
  explain: ReactNode;
}

function DecisionBoard({ items, options, prompt, header }: { items: Item[]; options: Option[]; prompt: string; header?: ReactNode }) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const answered = items.filter((i) => picks[i.id]).length;
  const score = items.filter((i) => picks[i.id] === i.answer).length;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line bg-subtle">
      {header}
      <ul className="space-y-2.5 p-3 sm:p-4">
        {items.map((item, n) => {
          const pick = picks[item.id] ?? '';
          const ok = pick === item.answer;
          return (
            <li key={item.id} className={`rounded-xl border bg-surface p-3 ${checked ? (ok ? 'border-ok' : 'border-danger') : 'border-line'}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">
                    <span className="mr-1.5 text-faint">{n + 1}.</span>
                    {item.title}
                  </p>
                  {item.meta && <div className="mt-1 text-xs text-muted">{item.meta}</div>}
                </div>
                <select
                  value={pick}
                  aria-label={`${prompt} (item ${n + 1})`}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPicks((p) => ({ ...p, [item.id]: val }));
                    setChecked(false);
                  }}
                  className="w-full shrink-0 rounded-lg border border-line bg-subtle px-2 py-1.5 text-sm text-fg sm:w-56"
                >
                  <option value="">{prompt}…</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {checked && (
                <div className={`mt-2 flex gap-1.5 text-xs leading-relaxed ${ok ? 'text-ok' : 'text-danger'}`}>
                  {ok ? <Check size={14} className="mt-0.5 shrink-0" /> : <TriangleAlert size={14} className="mt-0.5 shrink-0" />}
                  <span className="min-w-0">
                    {!ok && (
                      <strong>
                        Better: {options.find((o) => o.value === item.answer)?.label}.{' '}
                      </strong>
                    )}
                    <span className="text-muted">{item.explain}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface px-4 py-3">
        <button type="button" onClick={() => setChecked(true)} disabled={answered === 0} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg hover:opacity-90 disabled:opacity-50">
          Check answers
        </button>
        <button
          type="button"
          onClick={() => {
            setPicks({});
            setChecked(false);
          }}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <span className="ml-auto text-sm text-muted" aria-live="polite">
          {checked ? (
            <>
              <strong className="text-fg">
                {score}/{items.length}
              </strong>{' '}
              correct
            </>
          ) : (
            `${answered}/${items.length} answered`
          )}
        </span>
      </div>
    </div>
  );
}

/* ---------- Which track would you use? ---------- */

const TRACKS: Option[] = [
  { value: 'tf-int', label: 'TestFlight internal' },
  { value: 'tf-ext', label: 'TestFlight external' },
  { value: 'play-int', label: 'Play internal testing' },
  { value: 'play-closed', label: 'Play closed testing' },
  { value: 'play-open', label: 'Play open testing' },
  { value: 'firebase', label: 'Firebase App Distribution' },
];

export function TrackSorter() {
  return (
    <DecisionBoard
      prompt="Choose a channel"
      options={TRACKS}
      items={[
        {
          id: 'a',
          title: 'Five QA engineers on your team need the new iOS build today. They all have App Store Connect accounts.',
          answer: 'tf-int',
          explain: 'Internal testers are members of your App Store Connect team (up to 100). Builds are available as soon as they finish processing, with no Beta App Review.',
        },
        {
          id: 'b',
          title: '2,000 newsletter subscribers should try the iOS beta. You want to share one link.',
          answer: 'tf-ext',
          explain: 'External testing supports up to 10,000 testers, invited by email or a public link. The first build of a version needs Beta App Review.',
        },
        {
          id: 'c',
          title: 'Your 8-person QA team needs the Android build through the Play Store, minutes after upload, exactly like the store version.',
          answer: 'play-int',
          explain: 'Internal testing (up to 100 testers) is the fastest Play track and installs through the real Play Store, including Play features like in-app purchases.',
        },
        {
          id: 'd',
          title: '300 invited customers from a Google Group should test the Android beta before it goes public.',
          answer: 'play-closed',
          explain: 'Closed testing is for a list of invited testers (email lists or Google Groups). New personal developer accounts must also run a closed test before their first production release.',
        },
        {
          id: 'e',
          title: 'Anyone who finds the app on Google Play should be able to join the beta.',
          answer: 'play-open',
          explain: 'Open testing lets anyone join from the store listing. Testers can leave the program at any time to get the store version back.',
        },
        {
          id: 'f',
          title: 'Two testers need a debug APK from a feature branch, without uploading it to the Play Console.',
          answer: 'firebase',
          explain: 'Firebase App Distribution sends APKs (and iOS ad hoc builds) straight to invited testers by email, without any store review or track.',
        },
      ]}
    />
  );
}

/* ---------- Practical exercise: which bugs do you retest on this build? ---------- */

const DECISIONS: Option[] = [
  { value: 'retest', label: 'Retest the fix now' },
  { value: 'wait', label: 'Fix not in this build: wait' },
  { value: 'known', label: 'Known issue: don’t re-report' },
  { value: 'env', label: 'Environment mix-up: check production' },
  { value: 'repro', label: 'Old report: reproduce on 318' },
];

function Meta({ build, status, fix }: { build: string; status: string; fix?: string }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      <span>
        Reported on <span className="font-mono text-fg">{build}</span>
      </span>
      <span>
        Status: <span className="text-fg">{status}</span>
      </span>
      {fix && (
        <span>
          Fix version: <span className="font-mono text-fg">{fix}</span>
        </span>
      )}
    </span>
  );
}

export function RetestPlanner() {
  const header = (
    <div className="border-b border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[#ff9f0a] px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-black">STAGING</span>
        <p className="font-semibold text-fg">FreshCart 2.4.0 (318) has arrived in TestFlight</p>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-subtle p-3 text-sm">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">What to Test</p>
        <ul className="mt-1.5 space-y-1 text-muted">
          <li>• New: Apple Pay at checkout</li>
          <li>• Fixed <strong className="text-fg">BUG-412</strong>: expired coupon codes were accepted</li>
          <li>• Fixed <strong className="text-fg">BUG-398</strong>: order history empty after login</li>
          <li>• Known issue: <strong className="text-fg">BUG-420</strong> receipt colors are wrong in dark mode (fix planned for 319)</li>
          <li>• This build uses the <strong className="text-fg">staging</strong> server and its test content</li>
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted">Your bug tracker shows these six bugs. For each one, decide what you do with this build.</p>
    </div>
  );

  return (
    <DecisionBoard
      header={header}
      prompt="Decide"
      options={DECISIONS}
      items={[
        {
          id: '412',
          title: 'BUG-412 Expired coupon code is accepted at checkout',
          meta: <Meta build="2.3.2 (309)" status="Ready for QA" fix="2.4.0 (318)" />,
          answer: 'retest',
          explain: 'The fix is listed in the notes and the fix version matches the build on your phone. Retest with the original steps, then close it or reopen it with the build number.',
        },
        {
          id: '405',
          title: 'BUG-405 App crashes when you cancel Apple Pay',
          meta: <Meta build="2.4.0 (317)" status="Ready for QA" fix="2.4.0 (319)" />,
          answer: 'wait',
          explain: 'The fix version is 319, and you have 318. It is "Ready for QA" in the tracker, but the code isn’t in your build. Retesting now would fail and create noise. Wait for 319 (or ask the developer if it was really meant for 318).',
        },
        {
          id: '420',
          title: 'Receipt screen text is unreadable in dark mode',
          meta: <span>Found by you today on 2.4.0 (318)</span>,
          answer: 'known',
          explain: 'This is BUG-420, already listed as a known issue with a fix planned. Don’t open a duplicate; add a comment to BUG-420 if you found something new about it.',
        },
        {
          id: '431',
          title: 'BUG-431 Home banner says "TEST PROMO, do not ship"',
          meta: <Meta build="2.4.0 (318) · Staging" status="Open" />,
          answer: 'env',
          explain: 'Staging servers often hold test content. Banners come from the server, not the build. Check the same screen against production content (for example a production-config build) before calling it an app bug.',
        },
        {
          id: '377',
          title: 'BUG-377 Search finds nothing for "oat milk"',
          meta: <Meta build="2.2.0 (260)" status="Open" />,
          answer: 'repro',
          explain: 'It was reported four months and many builds ago, with no fix linked. Try to reproduce it on 318 and update the report: still happening (with the new build number) or no longer reproducible.',
        },
        {
          id: '398',
          title: 'BUG-398 Order history is empty after logging in',
          meta: <Meta build="2.3.2 (309)" status="Ready for QA" fix="2.4.0 (318)" />,
          answer: 'retest',
          explain: 'Listed as fixed in 318 and the fix version matches. Retest it, and also check nearby areas (log out and in again, reinstall) as a small regression check.',
        },
      ]}
    />
  );
}
