import { useRef, useState } from 'react';
import { RotateCcw, CheckCircle2, Circle, Ticket, MousePointerClick, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { Terminal, type TerminalHandle } from './Terminal';
import { ShopPhone } from './ShopPhone';
import { useAdbSession } from './useAdbSession';
import { launch, openProduct } from './adbEngine';

const DEEPLINK = 'adb shell am start -a android.intent.action.VIEW -d "shopeasy://product/summer-sale"';

const pickFeedback: Record<string, { tone: 'ok' | 'warn' | 'bad'; text: string }> = {
  fatal: { tone: 'warn', text: '"FATAL EXCEPTION: main" is the headline: it tells you a crash happened on the main thread, not where. Read further down.' },
  process: { tone: 'bad', text: 'This line names the process and its PID. Useful context, but it does not say what broke.' },
  wrapper: { tone: 'warn', text: 'This is a wrapper exception ("Unable to start activity"). The real reason is in the last "Caused by:" block further down.' },
  fw1: { tone: 'bad', text: 'android.app.* lines are Android framework code. Developers rarely need these. Look for lines from com.shopeasy.app.' },
  fw2: { tone: 'bad', text: 'android.app.* lines are Android framework code. Look for lines from com.shopeasy.app.' },
  fw3: { tone: 'bad', text: 'android.os.* is framework code that runs every app. Not the cause.' },
  fw4: { tone: 'bad', text: 'android.os.* is framework code that runs every app. Not the cause.' },
  fw5: { tone: 'bad', text: 'ActivityThread.main is where every Android app starts. It appears in almost every crash.' },
  fw6: { tone: 'bad', text: 'android.app.Activity is framework code that called the app. Look just above it.' },
  more: { tone: 'bad', text: '"... 11 more" just means the rest of the stack is the same as above.' },
  causedby: { tone: 'warn', text: 'Very close! This is the root cause: a NumberFormatException for "summer-sale". Now click the first line below it that is the app\'s own code (com.shopeasy.app…).' },
  parseint1: { tone: 'warn', text: 'java.lang.Integer.parseInt is Java\'s own code. It threw the exception because the app passed it text that is not a number. Keep going down to the first com.shopeasy.app line.' },
  parseint2: { tone: 'warn', text: 'Still Java\'s own code. The app called it with bad input. The next line down is the app.' },
  caller: { tone: 'warn', text: 'ProductActivity.onCreate called the parser, so it is involved, but the line just above it is more precise: where the app actually failed.' },
  cause: { tone: 'ok', text: 'Exactly. DeepLinkParser.kt line 27 tries to turn the ID from the link into a number. "summer-sale" is not a number, so it throws, and nothing catches it.' },
};

const evidence: { id: string; label: string; good: boolean; why: string }[] = [
  { id: 'steps', label: 'Exact steps, including the deep link (or the adb command that opens it)', good: true, why: 'Anyone can reproduce it in seconds.' },
  { id: 'expected', label: 'Expected vs actual result', good: true, why: 'States what should happen (a sale page or a friendly "not found") vs the crash.' },
  { id: 'env', label: 'Device, Android version and app version', good: true, why: 'Pixel 8, Android 15, ShopEasy 2.4.1 (from getprop and dumpsys package).' },
  { id: 'trace', label: 'Stack trace excerpt from FATAL EXCEPTION through the Caused by block', good: true, why: 'Points the developer to DeepLinkParser.kt:27 straight away.' },
  { id: 'rate', label: 'Reproduction rate (e.g. 5/5)', good: true, why: 'Shows it is not a one-off.' },
  { id: 'video', label: 'Screen recording or screenshot of the crash', good: true, why: 'Shows the impact at a glance.' },
  { id: 'fulllog', label: 'The full, unfiltered logcat pasted into the description', good: false, why: 'Thousands of lines bury the important ones. Paste the excerpt; attach the full log as a file if needed.' },
  { id: 'fix', label: 'Title: "Use toIntOrNull in DeepLinkParser"', good: false, why: 'Describe the problem, not your guess at the fix. A good title: "Crash when opening a product deep link with a non-numeric ID".' },
  { id: 'customer', label: 'The customer\'s name and email from the support ticket', good: false, why: 'Personal data doesn\'t belong in a bug tracker. Link the ticket ID (SUP-2291) instead.' },
];

const steps = ['Reproduce the crash', 'Find the FATAL EXCEPTION', 'Pinpoint the cause line', 'Assemble the evidence'];

export default function CrashChallenge() {
  const term = useRef<TerminalHandle>(null);
  const { dev, lines, run, setDev, reset, flash } = useAdbSession([{ kind: 'note', text: '# Pixel 8 connected over USB. ShopEasy 2.4.1 is open on the home screen.' }]);
  const [sawFatal, setSawFatal] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [solvedPick, setSolvedPick] = useState(false);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);

  const exec = (cmd: string) => {
    const { out } = run(cmd);
    if (out.some((l) => l.key === 'fatal')) setSawFatal(true);
  };

  const reproduced = dev.crashes > 0;
  const evidenceOk = checked && evidence.every((e) => !!chosen[e.id] === e.good);
  const done = [reproduced, reproduced && sawFatal, solvedPick, evidenceOk];
  const current = done.findIndex((d) => !d);

  const restart = () => {
    reset();
    setSawFatal(false);
    setPicked(null);
    setSolvedPick(false);
    setChosen({});
    setChecked(false);
  };

  const onPick = (key: string) => {
    setPicked(key);
    if (key === 'cause') setSolvedPick(true);
  };

  const chip = (cmd: string) => (
    <button
      key={cmd}
      type="button"
      onClick={() => term.current?.fill(cmd)}
      className="block w-full rounded-lg border border-line bg-surface px-2 py-1 text-left font-mono text-[11.5px] break-all text-fg hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      {cmd}
    </button>
  );

  const fb = picked ? pickFeedback[picked] : null;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Investigate the crash</p>
          <p className="text-sm text-muted">Reproduce it, read the log, and build the evidence for a bug report.</p>
        </div>
        <span className="rounded-lg bg-subtle px-2 py-0.5 font-mono text-sm font-semibold ring-1 ring-line">{done.filter(Boolean).length}/4</span>
        <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} aria-hidden /> Start over
        </button>
      </div>

      <div className="border-b border-line bg-subtle px-5 py-4 text-sm">
        <p className="flex items-center gap-1.5 font-semibold">
          <Ticket size={15} className="text-brand" aria-hidden /> Support ticket SUP-2291
        </p>
        <p className="mt-1 text-muted">
          "I tapped the <strong className="text-fg">Summer Sale</strong> link in your newsletter and the app closed. Tried 3 times." The newsletter link is{' '}
          <code className="rounded bg-surface px-1 font-mono text-[12px] break-all text-fg">shopeasy://product/summer-sale</code>.
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-2 px-5 pt-4 sm:grid-cols-4" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${done[i] ? 'border-ok/40 bg-ok-soft text-fg' : i === current ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted'}`}
            aria-current={i === current ? 'step' : undefined}
          >
            {done[i] ? <CheckCircle2 size={14} className="shrink-0 text-ok" aria-hidden /> : <Circle size={14} className="shrink-0" aria-hidden />}
            <span className="min-w-0">
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-line bg-subtle p-3 text-sm" aria-live="polite">
            {current === 0 && (
              <>
                <p className="font-semibold">Step 1 · Reproduce the crash</p>
                <p className="mt-1 text-muted">Clear the old log first, so the crash is easy to find. Then open the newsletter link on the phone. Click a command to paste it, then press Enter.</p>
                <div className="mt-2 space-y-1.5">{[`adb logcat -c`, DEEPLINK].map(chip)}</div>
              </>
            )}
            {current === 1 && (
              <>
                <p className="font-semibold">Step 2 · Find the FATAL EXCEPTION in logcat</p>
                <p className="mt-1 text-muted">
                  Reproduced! Now read the log. Any of these works. (Why not <code className="font-mono text-[12px]">--pid</code>? Try it and see: the process died in the crash.)
                </p>
                <div className="mt-2 space-y-1.5">{["adb logcat '*:E'", 'adb logcat -b crash', 'adb logcat | grep -A 15 "FATAL EXCEPTION"'].map(chip)}</div>
              </>
            )}
            {current === 2 && (
              <>
                <p className="flex items-center gap-1.5 font-semibold">
                  <MousePointerClick size={15} className="text-brand" aria-hidden /> Step 3 · Pinpoint the cause line
                </p>
                <p className="mt-1 text-muted">
                  The crash block is in the terminal. <strong className="text-fg">Click the line</strong> that shows where the app's own code failed. Developers will open that file first.
                </p>
                {fb && (
                  <p className={`mt-2 flex gap-1.5 rounded-lg px-2.5 py-2 ${fb.tone === 'ok' ? 'bg-ok-soft' : fb.tone === 'warn' ? 'bg-warn-soft' : 'bg-danger-soft'}`}>
                    {fb.tone === 'ok' ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                    ) : fb.tone === 'warn' ? (
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" aria-hidden />
                    ) : (
                      <XCircle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                    )}
                    <span>{fb.text}</span>
                  </p>
                )}
                {!lines.some((l) => l.key === 'cause') && <p className="mt-2 text-xs text-muted">Cleared the screen? Run the logcat command again to bring the crash back.</p>}
              </>
            )}
            {current === 3 && (
              <>
                <p className="font-semibold">Step 4 · What goes into the bug report?</p>
                <p className="mt-1 text-ok">{pickFeedback.cause.text}</p>
                <p className="mt-1 text-muted">Select everything that belongs in a good crash report, then check. Handy commands for the facts:</p>
                <div className="mt-2 space-y-1.5">
                  {['adb shell getprop ro.product.model', 'adb shell getprop ro.build.version.release', 'adb shell dumpsys package com.shopeasy.app | grep versionName', 'adb logcat -d > logcat.txt'].map(chip)}
                </div>
              </>
            )}
            {current === -1 && (
              <p className="flex items-center gap-1.5 font-semibold text-ok">
                <CheckCircle2 size={16} aria-hidden /> Investigation complete. Your bug report is ready below.
              </p>
            )}
          </div>

          <Terminal
            ref={term}
            lines={lines}
            onRun={exec}
            height={300}
            onPick={current === 2 ? onPick : undefined}
            picked={picked}
            pickedTone={fb?.tone}
          />
        </div>
        <div className="flex justify-center">
          <ShopPhone
            dev={dev}
            flash={flash}
            width={210}
            onLaunch={() => setDev((d) => launch(d))}
            onCloseCrash={() => setDev((d) => ({ ...d, screen: 'launcher' }))}
            onOpenProduct={(id) => setDev((d) => openProduct(d, id))}
            onBack={() => setDev((d) => ({ ...d, screen: 'home' }))}
          />
        </div>
      </div>

      {(current === 3 || current === -1) && (
        <div className="border-t border-line px-5 py-4">
          <fieldset>
            <legend className="text-sm font-semibold">Evidence for the bug report</legend>
            <ul className="mt-2 space-y-1.5">
              {evidence.map((e) => {
                const on = !!chosen[e.id];
                const right = on === e.good;
                return (
                  <li key={e.id} className="rounded-xl border border-line bg-subtle px-3 py-2 text-sm">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(ev) => {
                          const v = ev.target.checked;
                          setChosen((prev) => ({ ...prev, [e.id]: v }));
                          setChecked(false);
                        }}
                        className="mt-1 accent-[var(--brand)]"
                      />
                      <span className="min-w-0">{e.label}</span>
                    </label>
                    {checked && (on || e.good) && (
                      <p className={`mt-1 ml-6 text-xs ${right ? 'text-ok' : 'text-danger'}`}>
                        {right ? '✓ ' : on ? '✗ Leave this out. ' : '✗ Missing. '}
                        <span className="text-muted">{e.why}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Check my evidence
          </button>

          {evidenceOk && (
            <div className="mt-4 rounded-2xl border border-line bg-subtle p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold">
                <FileText size={15} className="text-brand" aria-hidden /> Bug report draft
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-muted">Title</dt>
                <dd className="font-medium">Crash when opening a product deep link with a non-numeric ID (shopeasy://product/summer-sale)</dd>
                <dt className="text-muted">Environment</dt>
                <dd>Pixel 8 · Android 15 (API 35) · ShopEasy 2.4.1 (241)</dd>
                <dt className="text-muted">Steps</dt>
                <dd>
                  1. Install ShopEasy 2.4.1 and log in. 2. Open the newsletter link, or run:{' '}
                  <code className="font-mono text-[11.5px] break-all">{DEEPLINK}</code>
                </dd>
                <dt className="text-muted">Expected</dt>
                <dd>The Summer Sale page opens (or a friendly "Product not found" screen).</dd>
                <dt className="text-muted">Actual</dt>
                <dd>The app crashes immediately: "ShopEasy keeps stopping".</dd>
                <dt className="text-muted">Reproducible</dt>
                <dd>5/5 · Severity: High · Linked: SUP-2291</dd>
                <dt className="text-muted">Log excerpt</dt>
                <dd className="min-w-0">
                  <pre className="overflow-x-auto rounded-lg bg-[#0e1120] p-2 font-mono text-[11px] leading-relaxed text-[#ff8f8f]">
                    {`FATAL EXCEPTION: main
Process: com.shopeasy.app, PID: 4821
Caused by: java.lang.NumberFormatException: For input string: "summer-sale"
  at java.lang.Integer.parseInt(Integer.java:747)
  at com.shopeasy.app.product.DeepLinkParser.productId(DeepLinkParser.kt:27)
  at com.shopeasy.app.product.ProductActivity.onCreate(ProductActivity.kt:58)`}
                  </pre>
                </dd>
                <dt className="text-muted">Attachments</dt>
                <dd>crash.mp4, logcat.txt</dd>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
