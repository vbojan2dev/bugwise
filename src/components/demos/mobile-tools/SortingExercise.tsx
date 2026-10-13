import { useState } from 'react';
import { Laptop, Smartphone, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

type Bucket = 'virtual' | 'real';
const ideas: { text: string; answer: Bucket; why: string }[] = [
  {
    text: 'Check the checkout screen layout on iPhone SE, iPhone 16 Pro Max and iPad.',
    answer: 'virtual',
    why: 'Pure layout across sizes. Spin up three simulators in a minute instead of borrowing three devices.',
  },
  {
    text: 'Scan the QR code printed on a paper receipt to collect loyalty points.',
    answer: 'real',
    why: 'The iOS Simulator has no camera and the emulator\'s virtual camera can\'t show your physical receipt with real focus and glare.',
  },
  {
    text: 'Check that the "Low battery: tracking paused" banner appears at 10% on Android.',
    answer: 'virtual',
    why: 'Extended controls › Battery sets any charge level and charger state instantly. Waiting for a real phone to drain takes hours.',
  },
  {
    text: 'Check that scrolling the product feed stays smooth on a 3-year-old budget Android.',
    answer: 'real',
    why: 'Virtual devices use your computer\'s powerful CPU and GPU, so they hide jank that real low-end phones show.',
  },
  {
    text: 'Look for truncated labels in the German translation.',
    answer: 'virtual',
    why: 'Change the language (or the scheme\'s App Language in Xcode) on a simulator. Text layout is the same as on a phone.',
  },
  {
    text: 'Pair the fitness app with a heart-rate chest strap over Bluetooth.',
    answer: 'real',
    why: 'Neither the iOS Simulator nor a standard emulator setup can talk to your physical Bluetooth accessory. Use a real phone and the real strap.',
  },
  {
    text: 'Check every screen in dark mode for unreadable text.',
    answer: 'virtual',
    why: 'Toggle Appearance (Shift+Cmd+A) in the Simulator or Dark theme in the emulator and walk through the screens.',
  },
  {
    text: 'Check that the link shopapp://product/42 opens the right product page.',
    answer: 'virtual',
    why: 'xcrun simctl openurl booted "shopapp://product/42" or adb shell am start -d "shopapp://product/42" fires the deep link in seconds.',
  },
  {
    text: 'Track a 45-minute outdoor run with GPS and check battery drain.',
    answer: 'real',
    why: 'A simulated route proves the logic, but real GPS accuracy, signal loss and battery drain only exist on a real phone outside.',
  },
  {
    text: 'Receive a phone call on an iPhone while a payment is processing.',
    answer: 'real',
    why: 'The iOS Simulator cannot receive calls. (On Android the emulator could fake the call, but this one says iPhone.)',
  },
];

export default function SortingExercise() {
  const [picks, setPicks] = useState<(Bucket | null)[]>(() => ideas.map(() => null));
  const answered = picks.filter((p) => p !== null).length;
  const correct = picks.filter((p, i) => p === ideas[i].answer).length;

  const pick = (i: number, b: Bucket) => setPicks((prev) => prev.map((p, j) => (j === i ? b : p)));

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Sort the test ideas</p>
          <p className="text-sm text-muted">Is a simulator/emulator enough, or do you need a real device?</p>
        </div>
        <span className="rounded-lg bg-subtle px-2 py-0.5 font-mono text-sm font-semibold ring-1 ring-line" aria-live="polite">
          {correct}/{ideas.length}
        </span>
        <button
          type="button"
          onClick={() => setPicks(ideas.map(() => null))}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
        >
          <RotateCcw size={12} aria-hidden /> Reset
        </button>
      </div>
      <ol className="divide-y divide-line">
        {ideas.map((idea, i) => {
          const p = picks[i];
          const ok = p === idea.answer;
          return (
            <li key={i} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <p className="min-w-0 flex-1 text-sm">
                  <span className="mr-1.5 font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
                  {idea.text}
                </p>
                <div className="flex shrink-0 gap-1.5" role="group" aria-label={`Where to test idea ${i + 1}`}>
                  {(['virtual', 'real'] as Bucket[]).map((b) => {
                    const chosen = p === b;
                    const tone = chosen ? (ok ? 'border-ok bg-ok-soft text-fg' : 'border-danger bg-danger-soft text-fg') : 'border-line text-muted hover:text-fg';
                    return (
                      <button
                        key={b}
                        type="button"
                        aria-pressed={chosen}
                        onClick={() => pick(i, b)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${tone}`}
                      >
                        {b === 'virtual' ? <Laptop size={14} aria-hidden /> : <Smartphone size={14} aria-hidden />}
                        {b === 'virtual' ? 'Sim / emulator' : 'Real device'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {p && (
                <p className={`mt-2 flex gap-1.5 text-sm ${ok ? 'text-ok' : 'text-danger'}`}>
                  {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden />}
                  <span className="text-muted">
                    <strong className={ok ? 'text-ok' : 'text-danger'}>{ok ? 'Right.' : 'Not quite.'}</strong> {idea.why}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered === ideas.length && (
        <div className="border-t border-line bg-subtle px-5 py-4 text-sm" role="status">
          <strong>
            {correct}/{ideas.length} correct.
          </strong>{' '}
          {correct >= 9
            ? 'Excellent. You know when virtual devices save time and when only real hardware tells the truth.'
            : 'Read the explanations for the ones you missed. The rule of thumb: virtual for layout, logic and fake-able conditions; real for hardware, performance and the physical world.'}
        </div>
      )}
    </div>
  );
}
