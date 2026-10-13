import { useState, type ReactNode } from 'react';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import { Stepper } from './Stepper';

function Demo({ title, platform, note, bg, children }: { title: string; platform: string; note: string; bg: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-36 place-items-center px-4 py-7" style={{ background: bg }}>
        <div className="w-full max-w-[19rem] min-w-0">{children}</div>
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

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [guests, setGuests] = useState(2);
  const [milk, setMilk] = useState(2);
  const [removed, setRemoved] = useState(false);
  const [servings, setServings] = useState(4);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [qty, setQty] = useState(3);
  const [native, setNative] = useState('2');

  const ios = { bg: dark ? '#000' : '#f2f2f7', card: dark ? '#1c1c1e' : '#fff', text: dark ? '#fff' : '#000', sub: dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)' };

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">All of these work. Hold + or − to repeat, and try the editable ones with the keyboard (↑ ↓ Home End).</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="UIStepper" platform="iOS" bg={ios.bg} note="Apple's native stepper: two buttons in a grey capsule, no value inside. The app must show the value in a label next to it.">
          <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: ios.card, color: ios.text, colorScheme: dark ? 'dark' : 'light' }}>
            <span className="text-[16px]">
              Guests: <strong className="tabular-nums">{guests}</strong>
            </span>
            <Stepper variant="ios" dark={dark} label="Guests" value={guests} min={1} max={8} onChange={setGuests} valueText={(v) => `${v} guest${v === 1 ? '' : 's'}`} />
          </div>
        </Demo>

        <Demo title="Cart quantity" platform="iOS · Android · Web" bg={ios.bg} note="The shopping classic. At 1, the − turns into a trash icon, so removing is a clear, deliberate action. + stops at the stock limit.">
          <div className="rounded-xl px-3 py-3" style={{ background: ios.card, color: ios.text, colorScheme: dark ? 'dark' : 'light' }}>
            {removed ? (
              <div className="flex items-center justify-between gap-2 text-[14px]">
                <span>Oat milk removed.</span>
                <button type="button" onClick={() => (setRemoved(false), setMilk(1))} className="flex items-center gap-1 font-semibold text-[#007aff]">
                  <RotateCcw size={14} /> Undo
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">Oat milk 1 L</p>
                  <p className="text-[12px]" style={{ color: milk >= 4 ? '#c2410c' : ios.sub }}>
                    {milk >= 4 ? 'Max 4 per order' : '€2.49 · 4 in stock'}
                  </p>
                </div>
                <Stepper dark={dark} label="Quantity of Oat milk" value={milk} min={1} max={4} onChange={setMilk} onRemove={() => setRemoved(true)} />
              </div>
            )}
          </div>
        </Demo>

        <Demo title="Outlined buttons" platform="Android · Material 3" bg={dark ? '#141218' : '#fef7ff'} note="Material has no stepper component, so Android apps build one from icon buttons and a text. Each team's version behaves a little differently.">
          <div className="flex items-center justify-between gap-3" style={{ color: dark ? '#e6e0e9' : '#1d1b20', colorScheme: dark ? 'dark' : 'light' }}>
            <span className="text-[16px]">Servings</span>
            <Stepper variant="material" dark={dark} label="Servings" value={servings} min={1} max={12} onChange={setServings} />
          </div>
        </Demo>

        <Demo title="Editable quantity" platform="Web" bg="#ffffff" note="Users can type 12 instead of clicking 11 times. Typed values are validated: digits only, clamped to the limits, the old value is kept if it's invalid.">
          <div className="flex items-center justify-between gap-3 text-[#0e1120]" style={{ colorScheme: 'light' }}>
            <span className="text-[15px] font-medium">Quantity</span>
            <Stepper variant="web" editable label="Quantity" value={qty} min={1} max={50} onChange={setQty} valueText={(v) => `${v} items`} />
          </div>
        </Demo>

        <Demo title="Several counters" platform="All" bg={ios.bg} note="Travel and ticket apps stack counters. Each needs its own limits (0 children is fine, 0 adults isn't) and its own name for screen readers.">
          <div className="divide-y rounded-xl px-4" style={{ background: ios.card, color: ios.text, borderColor: dark ? '#38383a' : '#e5e5ea', colorScheme: dark ? 'dark' : 'light' }}>
            <div className="flex items-center justify-between gap-3 py-2.5" style={{ borderColor: 'inherit' }}>
              <div>
                <p className="text-[15px]">Adults</p>
                <p className="text-[12px]" style={{ color: ios.sub }}>
                  Age 16+
                </p>
              </div>
              <Stepper variant="material" dark={dark} label="Adults" value={adults} min={1} max={9 - kids} onChange={setAdults} />
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5" style={{ borderColor: 'inherit' }}>
              <div>
                <p className="text-[15px]">Children</p>
                <p className="text-[12px]" style={{ color: ios.sub }}>
                  Age 2–15 · max 9 travellers
                </p>
              </div>
              <Stepper variant="material" dark={dark} label="Children" value={kids} min={0} max={9 - adults} onChange={setKids} />
            </div>
          </div>
        </Demo>

        <Demo title="Native number input" platform="Web" bg="#ffffff" note="<input type=number> gives you tiny spin arrows for free, plus quirks: 'e' is allowed, the mouse wheel can change it, and an invalid value reads as empty.">
          <label className="flex items-center justify-between gap-3 text-[15px] text-[#0e1120]" style={{ colorScheme: 'light' }}>
            Tickets
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={native}
              onChange={(e) => setNative(e.target.value)}
              className="h-9 w-24 rounded-md border border-[#c7c7cc] px-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
            />
          </label>
          <p className="mt-2 font-mono text-[11px] text-[#5b6070]">input.value = "{native}"</p>
        </Demo>
      </div>
    </div>
  );
}
