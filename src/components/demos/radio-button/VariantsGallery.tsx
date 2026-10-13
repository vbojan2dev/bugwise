import { useId, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IosChoiceRow, Radio, RadioDot } from './Radio';

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

const SHIPPING = [
  { v: 'standard', l: 'Standard', s: 'Arrives Tue–Thu', p: 'Free' },
  { v: 'express', l: 'Express', s: 'Arrives tomorrow', p: '€6.99' },
  { v: 'pickup', l: 'Pick up in store', s: 'Ready in 2 hours · Main St', p: 'Free' },
];

export default function VariantsGallery() {
  const id = useId();
  const [dark, setDark] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [lock, setLock] = useState('30s');
  const [plan, setPlan] = useState('yearly');
  const [ship, setShip] = useState('standard');
  const [pay, setPay] = useState('');

  const mBg = dark ? '#141218' : '#fef7ff';
  const mCard = dark ? '#211f26' : '#ffffff';
  const mLabel = dark ? '#d0bcff' : '#6750a4';
  const webBg = dark ? '#111827' : '#f9fafb';
  const webCard = dark ? '#1f2937' : '#ffffff';
  const webText = dark ? '#f3f4f6' : '#111827';
  const webBorder = dark ? '#374151' : '#e5e7eb';
  const iosBg = dark ? '#000' : '#f2f2f7';
  const iosCard = dark ? '#1c1c1e' : '#fff';
  const iosSub = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';
  const scheme = dark ? 'dark' : 'light';

  const states: { label: string; node: ReactNode }[] = [
    { label: 'Unselected', node: <RadioDot selected={false} dark={dark} /> },
    { label: 'Selected', node: <RadioDot selected dark={dark} /> },
    { label: 'Focused', node: <RadioDot selected dark={dark} focused /> },
    { label: 'Disabled', node: <RadioDot selected={false} dark={dark} disabled /> },
    { label: 'Disabled on', node: <RadioDot selected dark={dark} disabled /> },
    { label: 'Error', node: <RadioDot selected={false} dark={dark} error /> },
  ];

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted">
          Every group here works. Click the labels, and try <kbd>Tab</kbd> + arrow keys.
        </p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Material 3 radio button" platform="Android" bg={mBg} note="A 20 dp circle inside a 48 dp touch target. The whole row is usually tappable, and a round highlight shows hover, press and focus.">
          <fieldset className="rounded-2xl px-2 py-2" style={{ background: mCard, colorScheme: scheme }}>
            <legend className="sr-only">Sort restaurants by</legend>
            <p aria-hidden="true" className="px-2 pb-1 text-[13px] font-medium" style={{ color: mLabel }}>
              Sort restaurants by
            </p>
            {[
              ['recommended', 'Recommended'],
              ['distance', 'Distance'],
              ['rating', 'Rating'],
            ].map(([v, l]) => (
              <Radio key={v} name={`${id}-sort`} value={v} label={l} checked={sort === v} onSelect={setSort} dark={dark} />
            ))}
          </fieldset>
        </Demo>
        <Demo title="iOS: checkmark list" platform="iOS" bg={iosBg} note="iOS has no radio button control. Single choice is a list with a checkmark on the selected row, like Settings › Display & Brightness › Auto-Lock, or a menu.">
          <p className="px-4 pb-1.5 text-[12px] uppercase" style={{ color: iosSub }} id={`${id}-lock`}>
            Auto-Lock
          </p>
          <div role="radiogroup" aria-labelledby={`${id}-lock`} className="overflow-hidden rounded-xl" style={{ background: iosCard, colorScheme: scheme }}>
            {[
              ['30s', '30 seconds'],
              ['1m', '1 minute'],
              ['2m', '2 minutes'],
              ['never', 'Never'],
            ].map(([v, l], i) => (
              <IosChoiceRow key={v} name={`${id}-lock`} value={v} label={l} checked={lock === v} onSelect={setLock} dark={dark} divider={i > 0} />
            ))}
          </div>
        </Demo>
        <Demo title="Native web radios" platform="Web" bg={webBg} note={'<input type="radio"> elements that share one name, inside a <fieldset> with a <legend>. Grouping, arrow keys and screen reader support come for free.'}>
          <fieldset className="space-y-2 rounded-xl px-4 py-3 text-[14px]" style={{ background: webCard, color: webText, border: `1px solid ${webBorder}`, colorScheme: scheme }}>
            <legend className="px-1 text-[13px] font-semibold">Billing</legend>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name={`${id}-plan`} value="monthly" checked={plan === 'monthly'} onChange={() => setPlan('monthly')} className="size-4 accent-[#2563eb]" />
              Monthly · €9.99 / month
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name={`${id}-plan`} value="yearly" checked={plan === 'yearly'} onChange={() => setPlan('yearly')} className="size-4 accent-[#2563eb]" />
              Yearly · €95.90 / year (save 20%)
            </label>
          </fieldset>
        </Demo>
        <Demo title="Radio cards with details" platform="Web · Apps" bg={webBg} note="Each option is a card with a description and a price. The whole card is the label, so tapping the text selects it. One option is disabled, with the reason shown.">
          <fieldset className="space-y-2" style={{ colorScheme: scheme }}>
            <legend className="sr-only">Delivery</legend>
            {SHIPPING.map((o) => {
              const disabled = o.v === 'pickup';
              const on = ship === o.v;
              return (
                <div key={o.v} className="rounded-xl" style={{ background: webCard, border: `${on ? 2 : 1}px solid ${on ? '#2563eb' : webBorder}`, margin: on ? 0 : 1 }}>
                  <Radio
                    platform="web"
                    dark={dark}
                    name={`${id}-ship`}
                    value={o.v}
                    checked={on}
                    onSelect={setShip}
                    disabled={disabled}
                    label={<span className="font-medium">{o.l}</span>}
                    sub={disabled ? 'Not available for this address' : o.s}
                    trailing={<span style={{ color: webText }}>{o.p}</span>}
                    className="pr-3"
                  />
                </div>
              );
            })}
          </fieldset>
        </Demo>
        <Demo title="Required group with an error" platform="All" bg={mBg} note="No option is preselected, so the user must choose. If they skip it, the error text names the problem and is linked to the group.">
          <fieldset
            className="rounded-2xl px-2 py-2"
            style={{ background: mCard, colorScheme: scheme }}
            aria-describedby={pay ? undefined : `${id}-pay-err`}
          >
            <legend className="sr-only">Payment method</legend>
            <p aria-hidden="true" className="px-2 pb-1 text-[13px] font-medium" style={{ color: pay ? mLabel : dark ? '#f2b8b5' : '#b3261e' }}>
              Payment method *
            </p>
            {[
              ['card', 'Card'],
              ['paypal', 'PayPal'],
            ].map(([v, l]) => (
              <Radio key={v} name={`${id}-pay`} value={v} label={l} checked={pay === v} onSelect={setPay} dark={dark} error={!pay} />
            ))}
            {!pay && (
              <p id={`${id}-pay-err`} className="px-2 pb-1 text-[12px]" style={{ color: dark ? '#f2b8b5' : '#b3261e' }}>
                Choose a payment method to continue.
              </p>
            )}
          </fieldset>
        </Demo>
        <Demo title="All the states" platform="All" bg={mBg} note="Disabled radios keep showing whether they are selected. A focused radio needs a visible ring for keyboard users.">
          <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
            {states.map((s) => (
              <li key={s.label} className="flex min-w-0 flex-col items-center gap-2">
                <span className="grid size-10 place-items-center">{s.node}</span>
                <span className="text-center text-[11px] leading-tight" style={{ color: dark ? '#cac4d0' : '#49454f' }}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </Demo>
      </div>
    </div>
  );
}
