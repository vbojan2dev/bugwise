import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Terminal, type TerminalHandle } from './Terminal';
import { ShopPhone } from './ShopPhone';
import { useAdbSession } from './useAdbSession';
import { launch, openProduct } from './adbEngine';

const quick: { label: string; cmd: string }[] = [
  { label: 'List devices', cmd: 'adb devices' },
  { label: 'Clear app data', cmd: 'adb shell pm clear com.shopeasy.app' },
  { label: 'Open deep link', cmd: 'adb shell am start -a android.intent.action.VIEW -d "shopeasy://product/42"' },
  { label: 'Battery 5%', cmd: 'adb shell dumpsys battery set level 5' },
  { label: 'Font 1.3×', cmd: 'adb shell settings put system font_scale 1.3' },
  { label: 'Errors in logcat', cmd: "adb logcat '*:E'" },
];

export const cheatSheet: { group: string; items: { cmd: string; what: string }[] }[] = [
  {
    group: 'Devices',
    items: [
      { cmd: 'adb devices -l', what: 'List connected devices with model names' },
      { cmd: 'adb -s 38121FDJH00ABC shell getprop ro.build.version.release', what: 'Talk to one device when several are connected' },
      { cmd: 'adb shell getprop ro.product.model', what: 'Device model for the bug report' },
    ],
  },
  {
    group: 'Install & reset',
    items: [
      { cmd: 'adb install shopeasy.apk', what: 'Install an APK' },
      { cmd: 'adb install -r shopeasy.apk', what: 'Reinstall / update, keeping app data' },
      { cmd: 'adb uninstall com.shopeasy.app', what: 'Remove the app and its data' },
      { cmd: 'adb shell pm clear com.shopeasy.app', what: 'Reset app data (like a fresh install)' },
      { cmd: 'adb shell pm list packages | grep shop', what: 'Find the package name' },
      { cmd: 'adb shell dumpsys package com.shopeasy.app | grep versionName', what: 'Installed app version' },
    ],
  },
  {
    group: 'Open & control',
    items: [
      { cmd: 'adb shell monkey -p com.shopeasy.app 1', what: 'Launch the app' },
      { cmd: 'adb shell am start -a android.intent.action.VIEW -d "shopeasy://product/42"', what: 'Open a deep link' },
      { cmd: 'adb shell input text "running%sshoes"', what: 'Type text (%s = space)' },
      { cmd: 'adb shell input keyevent KEYCODE_ENTER', what: 'Press Enter (also KEYCODE_BACK, KEYCODE_HOME)' },
      { cmd: 'adb shell am force-stop com.shopeasy.app', what: 'Kill the app' },
    ],
  },
  {
    group: 'Logs',
    items: [
      { cmd: "adb logcat '*:E'", what: 'Only errors (and worse) from everything' },
      { cmd: 'adb logcat --pid=$(adb shell pidof -s com.shopeasy.app)', what: 'Only lines from the running app' },
      { cmd: 'adb logcat | grep -A 15 "FATAL EXCEPTION"', what: 'Find a crash and the 15 lines after it' },
      { cmd: 'adb logcat -b crash', what: 'Only the crash buffer' },
      { cmd: 'adb logcat -c', what: 'Clear the log before reproducing' },
      { cmd: 'adb logcat -d > log.txt', what: 'Save the log to a file' },
    ],
  },
  {
    group: 'Evidence',
    items: [
      { cmd: 'adb exec-out screencap -p > screen.png', what: 'Screenshot to your computer' },
      { cmd: 'adb shell screenrecord /sdcard/bug.mp4', what: 'Record the screen (Ctrl+C to stop)' },
      { cmd: 'adb pull /sdcard/bug.mp4', what: 'Copy the recording to your computer' },
    ],
  },
  {
    group: 'Device conditions',
    items: [
      { cmd: 'adb shell dumpsys battery unplug', what: 'Pretend the charger is unplugged' },
      { cmd: 'adb shell dumpsys battery set level 5', what: 'Fake 5% battery' },
      { cmd: 'adb shell dumpsys battery reset', what: 'Back to the real battery' },
      { cmd: 'adb shell settings put system font_scale 1.3', what: 'Bigger text (1.0 = default)' },
      { cmd: 'adb shell cmd uimode night yes', what: 'Dark theme on (no = off)' },
    ],
  },
  {
    group: 'Wireless & network',
    items: [
      { cmd: 'adb pair 192.168.1.23:37199', what: 'Pair using the code from Wireless debugging' },
      { cmd: 'adb connect 192.168.1.23:41235', what: 'Connect over Wi-Fi after pairing' },
      { cmd: 'adb disconnect', what: 'Drop Wi-Fi connections' },
      { cmd: 'adb reverse tcp:8080 tcp:8080', what: "Phone's localhost:8080 → your computer" },
    ],
  },
];

export default function AdbPlayground() {
  const term = useRef<TerminalHandle>(null);
  const { dev, lines, run, setDev, reset, flash } = useAdbSession([
    { kind: 'note', text: '# A Pixel 8 is plugged in over USB with USB debugging on.' },
    { kind: 'note', text: '# Type a command, or click one in the cheat sheet. Try: adb devices' },
  ]);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">adb playground</p>
          <p className="text-sm text-muted">A safe fake terminal. Every command changes the phone on the right.</p>
        </div>
        <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} aria-hidden /> Reset phone
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => run(q.cmd)}
                className="rounded-full border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {q.label}
              </button>
            ))}
          </div>
          <Terminal ref={term} lines={lines} onRun={run} height={320} />
          <p className="mt-2 text-xs text-faint">Tip: ↑ / ↓ recall earlier commands. Type clear to empty the screen.</p>
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

      <div className="border-t border-line bg-subtle px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">Cheat sheet · click to paste into the terminal</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cheatSheet.map((g) => (
            <div key={g.group} className="min-w-0 rounded-2xl border border-line bg-surface p-3">
              <p className="mb-1.5 text-sm font-semibold">{g.group}</p>
              <ul className="space-y-1">
                {g.items.map((it) => (
                  <li key={it.cmd}>
                    <button
                      type="button"
                      onClick={() => term.current?.fill(it.cmd)}
                      className="block w-full rounded-lg px-2 py-1 text-left hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <code className="block font-mono text-[11.5px] break-all text-fg">{it.cmd}</code>
                      <span className="block text-xs text-muted">{it.what}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
