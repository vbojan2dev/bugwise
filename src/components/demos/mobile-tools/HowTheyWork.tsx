/** Static layer diagram: what actually runs where for a simulator, an emulator and a real device. */
const columns = [
  {
    name: 'iOS Simulator',
    sub: 'Imitates the software',
    layers: [
      { t: 'Your app', d: 'compiled for the Mac\'s processor', tone: 'app' },
      { t: 'iOS frameworks', d: 'simulator versions running on macOS', tone: 'os' },
      { t: 'macOS', d: 'your Mac\'s operating system', tone: 'host' },
      { t: 'Mac hardware', d: 'Mac CPU, GPU, RAM, network', tone: 'host' },
    ],
    note: 'No phone hardware is emulated at all. Fast, but not a real iPhone.',
  },
  {
    name: 'Android Emulator',
    sub: 'Imitates the device',
    layers: [
      { t: 'Your app', d: 'the same APK you ship', tone: 'app' },
      { t: 'Android OS', d: 'a real system image (API level)', tone: 'os' },
      { t: 'Virtual hardware', d: 'emulated phone: sensors, modem, battery…', tone: 'virt' },
      { t: 'Your computer', d: 'host CPU, GPU, RAM, network', tone: 'host' },
    ],
    note: 'A full virtual phone. Closer to reality, but still powered by your computer.',
  },
  {
    name: 'Real device',
    sub: 'The real thing',
    layers: [
      { t: 'Your app', d: 'installed build (TestFlight, APK…)', tone: 'app' },
      { t: 'iOS / Android', d: 'plus vendor changes (Samsung, Xiaomi…)', tone: 'os' },
      { t: 'Phone hardware', d: 'camera, GPS, modem, Bluetooth, NFC, sensors', tone: 'real' },
      { t: 'Battery & radio', d: 'real power limits, real signal', tone: 'real' },
    ],
    note: 'What your users have. Slow to scale, but tells the truth.',
  },
];

const toneCls: Record<string, string> = {
  app: 'bg-brand-soft text-fg border-brand/30',
  os: 'bg-info-soft text-fg border-info/30',
  virt: 'bg-warn-soft text-fg border-warn/30',
  host: 'bg-subtle text-muted border-line',
  real: 'bg-ok-soft text-fg border-ok/30',
};

export default function HowTheyWork() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {columns.map((c) => (
        <div key={c.name} className="min-w-0 rounded-2xl border border-line bg-surface p-3">
          <p className="font-semibold">{c.name}</p>
          <p className="text-xs text-faint">{c.sub}</p>
          <ol className="mt-3 space-y-1.5" aria-label={`${c.name} layers, top to bottom`}>
            {c.layers.map((l) => (
              <li key={l.t} className={`rounded-lg border px-2.5 py-1.5 ${toneCls[l.tone]}`}>
                <span className="block text-sm font-semibold">{l.t}</span>
                <span className="block text-xs text-muted">{l.d}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted">{c.note}</p>
        </div>
      ))}
    </div>
  );
}
