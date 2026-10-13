import { useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from './Switch';
import { SettingRow } from './SettingRow';

function Demo({ title, platform, note, bg, children }: { title: string; platform: string; note: string; bg: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-40 place-items-center px-4 py-6" style={{ background: bg }}>
        <div className="w-full max-w-[19rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

function useToggles(initial: boolean[]) {
  const [v, setV] = useState(initial);
  const set = (i: number) => (x: boolean) => setV((arr) => arr.map((a, j) => (j === i ? x : a)));
  return [v, set] as const;
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [ios, setIos] = useToggles([true, false]);
  const [m3, setM3] = useToggles([true, false]);
  const [m3i, setM3i] = useToggles([true, false]);
  const [web, setWeb] = useToggles([true, false]);
  const [parent, setParent] = useState(true);
  const [kids, setKids] = useToggles([true, false]);

  const iosBg = dark ? '#000' : '#f2f2f7';
  const iosCard = dark ? '#1c1c1e' : '#fff';
  const mBg = dark ? '#141218' : '#fef7ff';
  const mCard = dark ? '#211f26' : '#f7f2fa';
  const webBg = dark ? '#111827' : '#f9fafb';
  const webCard = dark ? '#1f2937' : '#fff';

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Every switch here works. Try tapping the labels too: the platforms behave differently.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="iOS switch" platform="iOS" bg={iosBg} note="Green when on, grey when off. In the iOS Settings app only the switch itself reacts; tapping the row text does nothing.">
          <div className="overflow-hidden rounded-xl" style={{ background: iosCard }}>
            <SettingRow platform="ios" dark={dark} label="Wi-Fi" checked={ios[0]} onChange={setIos(0)} />
            <SettingRow platform="ios" dark={dark} label="Low Power Mode" checked={ios[1]} onChange={setIos(1)} divider />
          </div>
        </Demo>
        <Demo title="Material 3 switch" platform="Android" bg={mBg} note="The handle is small when off and grows when on. In Android lists the whole row is tappable.">
          <div className="overflow-hidden rounded-2xl" style={{ background: mCard }}>
            <SettingRow platform="material" dark={dark} label="Order updates" sub="Rider location, arrival time" checked={m3[0]} onChange={setM3(0)} />
            <SettingRow platform="material" dark={dark} label="Offers & promotions" checked={m3[1]} onChange={setM3(1)} />
          </div>
        </Demo>
        <Demo title="Material 3 with icons" platform="Android" bg={mBg} note="A check or a cross inside the handle shows the state without relying on color alone.">
          <div className="overflow-hidden rounded-2xl" style={{ background: mCard }}>
            <SettingRow platform="material" dark={dark} icons label="Use location" checked={m3i[0]} onChange={setM3i(0)} />
            <SettingRow platform="material" dark={dark} icons label="Backup over mobile data" checked={m3i[1]} onChange={setM3i(1)} />
          </div>
        </Demo>
        <Demo title="Web switch" platform="Web" bg={webBg} note={'Usually custom-built. It needs role="switch", a label you can click, and a visible focus ring. Press Tab, then Space.'}>
          <div className="space-y-1 rounded-xl px-4 py-2" style={{ background: webCard, border: `1px solid ${dark ? '#374151' : '#e5e7eb'}` }}>
            <SettingRow platform="web" dark={dark} switchFirst label="Email me receipts" checked={web[0]} onChange={setWeb(0)} />
            <SettingRow platform="web" dark={dark} switchFirst label="Weekly newsletter" checked={web[1]} onChange={setWeb(1)} />
          </div>
        </Demo>
        <Demo title="Disabled" platform="All" bg={iosBg} note="A disabled switch keeps showing its state (on or off) but can't be changed. Tell the user why, if you can.">
          <div className="flex items-center justify-center gap-6">
            <Switch platform="ios" dark={dark} checked disabled ariaLabel="Disabled, on" />
            <Switch platform="ios" dark={dark} checked={false} disabled ariaLabel="Disabled, off" />
            <Switch platform="material" dark={dark} checked disabled ariaLabel="Disabled, on" />
            <Switch platform="material" dark={dark} checked={false} disabled ariaLabel="Disabled, off" />
          </div>
          <p className="mt-4 text-center text-[12px]" style={{ color: dark ? '#8e8e93' : '#6b6b70' }}>
            iOS on · off · Android on · off
          </p>
        </Demo>
        <Demo title="Parent and child switches" platform="All" bg={iosBg} note="When the main switch is off, the dependent switches become disabled (or hidden). A classic place for bugs.">
          <div className="overflow-hidden rounded-xl" style={{ background: iosCard }}>
            <SettingRow platform="ios" dark={dark} label="Allow notifications" checked={parent} onChange={setParent} />
            <SettingRow platform="ios" dark={dark} label="Sounds" checked={kids[0]} onChange={setKids(0)} disabled={!parent} divider />
            <SettingRow platform="ios" dark={dark} label="Badges" checked={kids[1]} onChange={setKids(1)} disabled={!parent} divider />
          </div>
        </Demo>
      </div>
    </div>
  );
}
