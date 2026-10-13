import { useState } from 'react';
import { Bell, ScanLine, LayoutGrid, Gauge, MapPin, ScanFace, Phone, Laptop, Monitor, Smartphone, CheckCircle2, CircleDot, XCircle, Lightbulb } from 'lucide-react';

type Fit = 'great' | 'partly' | 'no';
interface Env {
  fit: Fit;
  note: string;
}
interface Scenario {
  id: string;
  label: string;
  icon: typeof Bell;
  verdict: string;
  why: string;
  sim: Env;
  emu: Env;
  real: Env;
  tip: string;
}

const scenarios: Scenario[] = [
  {
    id: 'push',
    label: 'Push notifications',
    icon: Bell,
    verdict: 'Start on the simulator/emulator, sign off on a real device',
    why: 'You can check the content, the tap action and the permission prompt without a phone. But the real delivery path (APNs or FCM), lock-screen behavior, Focus / Do Not Disturb and battery optimization that kills background apps only show their true colors on real hardware.',
    sim: { fit: 'partly', note: 'Drag an .apns file onto the window or use xcrun simctl push. Real remote push works on Apple silicon / T2 Macs with macOS 13+.' },
    emu: { fit: 'great', note: 'Images with Google Play or Google APIs receive real FCM pushes.' },
    real: { fit: 'great', note: 'The only way to see real delivery timing, Focus modes and vendor battery savers.' },
    tip: 'Test the "app killed" case: swipe the app away, send a push, then tap it. Deep-link-from-push bugs love this path.',
  },
  {
    id: 'camera',
    label: 'Camera scan (QR, card, receipt)',
    icon: ScanLine,
    verdict: 'Real device',
    why: 'The iOS Simulator has no camera at all. The Android Emulator can show a virtual 3D room or your webcam, which proves the camera screen opens, but not that a real QR code on a crumpled receipt scans in bad light with autofocus.',
    sim: { fit: 'no', note: 'No camera. You can only test the permission prompt and the "no camera" fallback.' },
    emu: { fit: 'partly', note: 'Virtual scene or host webcam (set in the AVD camera settings).' },
    real: { fit: 'great', note: 'Real lenses, autofocus, glare, low light, torch.' },
    tip: 'Also test denying camera permission, then enabling it later in Settings.',
  },
  {
    id: 'layout',
    label: 'Layout check on 10 screen sizes',
    icon: LayoutGrid,
    verdict: 'Simulator / emulator',
    why: 'Nobody owns ten phones. Virtual devices give you every screen size, notch, Dynamic Island, tablet and foldable in minutes, for free. Spot-check the two most popular sizes on real phones at the end.',
    sim: { fit: 'great', note: 'Every current iPhone and iPad, from iPhone SE to iPad Pro.' },
    emu: { fit: 'great', note: 'Small and large phones, tablets, foldables, custom resolutions.' },
    real: { fit: 'partly', note: 'Great for a final look, but slow and expensive to cover 10 sizes.' },
    tip: 'Combine sizes with the largest text size and a long language like German to find truncation fast.',
  },
  {
    id: 'perf',
    label: 'Performance on a low-end device',
    icon: Gauge,
    verdict: 'Real device (an actual budget phone)',
    why: 'The simulator runs on your Mac\'s fast processor, and the emulator borrows your computer\'s CPU, RAM and GPU. Scrolling that feels smooth there can stutter on a 3-year-old budget Android with 3 GB of RAM. Performance numbers from virtual devices are not meaningful.',
    sim: { fit: 'no', note: 'Usually much faster than any iPhone. Hides slowness.' },
    emu: { fit: 'no', note: 'You can lower RAM in the AVD, but CPU and GPU are still your computer\'s.' },
    real: { fit: 'great', note: 'Keep one old, cheap phone in the test lab for exactly this.' },
    tip: 'Test cold start time, long lists with images, and what happens after the OS kills the app in the background.',
  },
  {
    id: 'location',
    label: 'Location-based feature',
    icon: MapPin,
    verdict: 'Mostly simulator / emulator, then a real walk outside',
    why: 'Virtual devices let you "teleport" to any city and even play a route, which is perfect for checking delivery zones, store finders and maps. Real GPS drift, indoor accuracy, and background location after the app is closed need a real phone.',
    sim: { fit: 'great', note: 'Features › Location: Custom Location, City Run, Freeway Drive.' },
    emu: { fit: 'great', note: 'Extended controls › Location: single points, routes, GPX/KML import.' },
    real: { fit: 'partly', note: 'Needed for real accuracy, tunnels, indoors and battery impact.' },
    tip: 'Test "location permission denied" and "Allow once" too. The happy path is the least interesting one.',
  },
  {
    id: 'faceid',
    label: 'Face ID / fingerprint login',
    icon: ScanFace,
    verdict: 'Simulator / emulator for the flow, real device to sign off',
    why: 'Virtual devices simulate a matching or non-matching face/finger, so you can test success, failure and the fallback to password. They cannot test the real sensor, a face with glasses or a mask, or the lockout after too many failed attempts on real hardware.',
    sim: { fit: 'partly', note: 'Features › Face ID › Enrolled, then Matching Face / Non-matching Face.' },
    emu: { fit: 'partly', note: 'Enroll a fingerprint in Settings, then "touch" it in Extended controls › Fingerprint.' },
    real: { fit: 'great', note: 'Real sensor, real lockout rules, real passcode fallback.' },
    tip: 'Check what happens when the user removes Face ID in Settings after enabling it in your app.',
  },
  {
    id: 'call',
    label: 'Phone call interrupts the app',
    icon: Phone,
    verdict: 'Android Emulator or a real device. Not the iOS Simulator.',
    why: 'This is where the two virtual tools differ. The Android Emulator can fake an incoming call or SMS from its extended controls. The iOS Simulator has no phone at all, so for iPhone you need a real device (and a second phone to call it).',
    sim: { fit: 'no', note: 'No phone calls or SMS. Use a real iPhone.' },
    emu: { fit: 'great', note: 'Extended controls › Phone: Call device, Send message.' },
    real: { fit: 'great', note: 'Covers calls, alarms, FaceTime / WhatsApp calls, Siri.' },
    tip: 'Interrupt in the worst moment: during payment, while recording a video, or in the middle of a workout.',
  },
];

const fitStyle: Record<Fit, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  great: { label: 'Good fit', cls: 'text-ok bg-ok-soft', Icon: CheckCircle2 },
  partly: { label: 'Partly', cls: 'text-warn bg-warn-soft', Icon: CircleDot },
  no: { label: 'Can\'t do it', cls: 'text-danger bg-danger-soft', Icon: XCircle },
};

export default function EnvironmentPicker() {
  const [sel, setSel] = useState('push');
  const s = scenarios.find((x) => x.id === sel)!;
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const i = scenarios.findIndex((x) => x.id === sel);
    const next = scenarios[(i + d + scenarios.length) % scenarios.length].id;
    setSel(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next}"]`)?.focus();
  };
  const cols: { key: 'sim' | 'emu' | 'real'; name: string; Icon: typeof Laptop }[] = [
    { key: 'sim', name: 'iOS Simulator', Icon: Laptop },
    { key: 'emu', name: 'Android Emulator', Icon: Monitor },
    { key: 'real', name: 'Real device', Icon: Smartphone },
  ];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">Simulator, emulator or real device?</p>
        <p className="text-sm text-muted">Pick what you need to test and see where to test it.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[13rem_minmax(0,1fr)]">
        <div role="radiogroup" aria-label="Test scenario" onKeyDown={onKey} className="flex flex-wrap gap-2 border-b border-line p-4 md:flex-col md:flex-nowrap md:border-r md:border-b-0">
          {scenarios.map((x) => {
            const active = x.id === sel;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                data-id={x.id}
                onClick={() => setSel(x.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  active ? 'border-brand bg-brand-soft font-semibold text-fg' : 'border-line text-muted hover:text-fg'
                }`}
              >
                <x.icon size={16} className={active ? 'text-brand' : ''} aria-hidden />
                <span className="min-w-0">{x.label}</span>
              </button>
            );
          })}
        </div>
        <div className="min-w-0 p-5" aria-live="polite">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Recommendation</p>
          <p className="mt-1 text-lg font-semibold text-balance">{s.verdict}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.why}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {cols.map((c) => {
              const env = s[c.key];
              const f = fitStyle[env.fit];
              return (
                <div key={c.key} className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <c.Icon size={15} aria-hidden /> {c.name}
                  </div>
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${f.cls}`}>
                    <f.Icon size={12} aria-hidden /> {f.label}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{env.note}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <span>
              <strong>Tester tip:</strong> {s.tip}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
