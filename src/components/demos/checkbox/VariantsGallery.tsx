import { useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { CheckBox, Checkbox, IosCheckRow } from './Checkbox';

function Demo({ title, platform, note, bg, children }: { title: string; platform: string; note: string; bg: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
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

function useChecks(initial: boolean[]) {
  const [v, setV] = useState(initial);
  const set = (i: number) => (x: boolean) => setV((arr) => arr.map((a, j) => (j === i ? x : a)));
  return [v, set] as const;
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [m3, setM3] = useChecks([true, false, false]);
  const [web, setWeb] = useChecks([true, false]);
  const [cw, setCw] = useChecks([false, true]);
  const [ios, setIos] = useChecks([true, false, true, false]);

  const mBg = dark ? '#141218' : '#fef7ff';
  const mCard = dark ? '#211f26' : '#ffffff';
  const webBg = dark ? '#111827' : '#f9fafb';
  const webCard = dark ? '#1f2937' : '#ffffff';
  const webText = dark ? '#f3f4f6' : '#111827';
  const iosBg = dark ? '#000' : '#f2f2f7';
  const iosCard = dark ? '#1c1c1e' : '#fff';
  const iosSub = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';

  const states: { label: string; node: ReactNode }[] = [
    { label: 'Unchecked', node: <CheckBox state={false} dark={dark} /> },
    { label: 'Checked', node: <CheckBox state={true} dark={dark} /> },
    { label: 'Mixed', node: <CheckBox state="mixed" dark={dark} /> },
    { label: 'Focused', node: <CheckBox state={false} dark={dark} focused /> },
    { label: 'Disabled', node: <CheckBox state={false} dark={dark} disabled /> },
    { label: 'Disabled on', node: <CheckBox state={true} dark={dark} disabled /> },
    { label: 'Error', node: <CheckBox state={false} dark={dark} error /> },
    { label: 'Error on', node: <CheckBox state={true} dark={dark} error /> },
  ];

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted">Every checkbox here works. Click the label text too, and try <kbd>Tab</kbd> + <kbd>Space</kbd>.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Material 3 checkbox" platform="Android" bg={mBg} note="An 18 dp box with rounded corners inside a 48 dp touch target. A round highlight (state layer) appears on hover, press and focus.">
          <div className="rounded-2xl px-2 py-1" style={{ background: mCard, colorScheme: dark ? 'dark' : 'light' }}>
            <Checkbox platform="material" dark={dark} label="Leave at the door" checked={m3[0]} onChange={setM3(0)} />
            <Checkbox platform="material" dark={dark} label="Cutlery and napkins" sub="Help us cut down on plastic" checked={m3[1]} onChange={setM3(1)} />
            <Checkbox platform="material" dark={dark} label="Ring the bell" checked={m3[2]} onChange={setM3(2)} />
          </div>
        </Demo>
        <Demo title="Native web checkbox" platform="Web" bg={webBg} note={'A plain <input type="checkbox"> with a <label>. It looks slightly different in every browser, but keyboard, label clicks and screen readers work for free.'}>
          <div className="space-y-2 rounded-xl px-4 py-3 text-[14px]" style={{ background: webCard, color: webText, border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`, colorScheme: dark ? 'dark' : 'light' }}>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="size-4 accent-[#2563eb]" checked={web[0]} onChange={(e) => setWeb(0)(e.target.checked)} />
              Remember me
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="size-4 accent-[#2563eb]" checked={web[1]} onChange={(e) => setWeb(1)(e.target.checked)} />
              Gift wrap this order (+€3.00)
            </label>
          </div>
        </Demo>
        <Demo title="Custom web checkbox" platform="Web" bg={webBg} note="Styled to match the brand. Built on a hidden real input, so it still works with the keyboard. Many custom checkboxes are just a <div>, and that's where the bugs live.">
          <div className="rounded-xl px-2 py-1" style={{ background: webCard, border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`, colorScheme: dark ? 'dark' : 'light' }}>
            <Checkbox platform="web" dark={dark} label="Save this card for next time" checked={cw[0]} onChange={setCw(0)} />
            <Checkbox platform="web" dark={dark} label="Billing address is the same as delivery" checked={cw[1]} onChange={setCw(1)} />
          </div>
        </Demo>
        <Demo title="iOS: checkmarks in a list" platform="iOS" bg={iosBg} note="iOS has no checkbox control. Multi-select lists show a blue checkmark on the right of each selected row, and the whole row is tappable.">
          <p className="px-4 pb-1.5 text-[12px] uppercase" style={{ color: iosSub }}>
            Cuisines
          </p>
          <div className="overflow-hidden rounded-xl" style={{ background: iosCard }}>
            {['Italian', 'Japanese', 'Mexican', 'Vegan'].map((c, i) => (
              <IosCheckRow key={c} label={c} dark={dark} checked={ios[i]} onChange={setIos(i)} divider={i > 0} />
            ))}
          </div>
        </Demo>
      </div>
      <figure className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="px-4 py-6" style={{ background: mBg }}>
          <ul className="mx-auto grid max-w-xl grid-cols-4 gap-x-2 gap-y-4">
            {states.map((s) => (
              <li key={s.label} className="flex min-w-0 flex-col items-center gap-2">
                <span className="grid size-10 place-items-center">{s.node}</span>
                <span className="text-center text-[11px] leading-tight" style={{ color: dark ? '#cac4d0' : '#49454f' }}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <figcaption className="border-t border-line p-4">
          <p className="font-semibold">All the states</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Test each one, in light and dark mode. Disabled boxes keep showing their value. "Mixed" (indeterminate) only appears on a parent checkbox whose children are partly checked.
          </p>
        </figcaption>
      </figure>
    </div>
  );
}
