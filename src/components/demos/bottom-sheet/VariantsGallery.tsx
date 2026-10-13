import { useRef, useState, type ReactNode } from 'react';
import { ArrowDownAZ, Check, Coffee, MapPin, Minus, Plus, SlidersHorizontal, Star, Tag, TrendingUp, X } from 'lucide-react';
import { Sheet, type CloseHow } from './Sheet';

const HOW: Record<CloseHow, string> = { swipe: 'Swipe down', scrim: 'Tap outside', esc: 'Esc', button: 'Button' };

function Card({ title, platform, note, chips, status, children }: { title: string; platform: string; note: string; chips: string[]; status: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid place-items-center bg-[#e9ebf2] px-4 py-5" style={{ colorScheme: 'light' }}>
        <div className="relative h-[340px] w-full max-w-[280px] overflow-hidden rounded-[22px] border border-black/10 shadow-sm">{children}</div>
        <p className="mt-2 h-4 text-[11px] text-[#5a5f70]" aria-live="polite">
          {status}
        </p>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function Behind({ bg, title, children }: { bg: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[#111]" style={{ background: bg }}>
      <p className="text-[17px] font-bold">{title}</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl bg-black/[0.05] p-2" aria-hidden="true">
          <div className="size-8 rounded-lg bg-black/10" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-3/4 rounded bg-black/15" />
            <div className="h-2 w-1/2 rounded bg-black/10" />
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}

/* 1. iOS sheet with medium + large detents */
const CITIES = ['Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Brussels', 'Budapest', 'Copenhagen', 'Dublin', 'Lisbon', 'London', 'Madrid', 'Milan', 'Paris', 'Prague', 'Rome', 'Vienna', 'Warsaw', 'Zagreb'];

function IOSSheetDemo() {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState('Lisbon');
  const [status, setStatus] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<((how: CloseHow) => void) | null>(null);
  return (
    <Card
      title="Sheet with detents"
      platform="iOS"
      note="Opens at medium height. Drag the grabber (or the list when it's at the top) to large, or down to close. Cancel is always there for people who can't swipe."
      chips={['Grabber', 'Medium / large', 'Swipe down', 'Tap outside', 'Cancel']}
      status={status}
    >
      <div className="h-full" inert={open}>
      <Behind bg="#f2f2f7" title="Flights">
        <button
          ref={trigger}
          type="button"
          onClick={() => {
            setOpen(true);
            setStatus('');
          }}
          className="mt-1 flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"
        >
          <span className="text-black/60">From</span>
          <span className="font-semibold text-[#007aff]">{city}</span>
        </button>
      </Behind>
      </div>
      {open && (
        <Sheet
          id="gal-ios-sheet"
          title="Departure city"
          variant="ios"
          detents={[0.55, 0.94]}
          returnFocus={trigger}
          closeRef={closeRef}
          onDetentChange={(_, l) => setStatus(`Height: ${l}`)}
          onClose={(how) => {
            setOpen(false);
            setStatus(`Closed with: ${HOW[how]}`);
          }}
          showTitle={false}
          header={
            <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pb-2">
              <button type="button" onClick={() => closeRef.current?.('button')} className="justify-self-start rounded px-1 text-[15px] text-[#007aff] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]">
                Cancel
              </button>
              <p id="gal-ios-sheet-title" className="text-[15px] font-semibold">
                Departure city
              </p>
              <span />
            </div>
          }
        >
          <ul className="mx-3 mb-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-[#f2f2f7] text-[15px]">
            {CITIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setCity(c);
                    closeRef.current?.('button');
                  }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left outline-none focus-visible:bg-black/5"
                >
                  {c}
                  {c === city && <Check size={16} className="text-[#007aff]" />}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </Card>
  );
}

/* 2. Material modal bottom sheet */
function M3ModalDemo() {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('Recommended');
  const [status, setStatus] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<((how: CloseHow) => void) | null>(null);
  const options = [
    { icon: Star, label: 'Recommended' },
    { icon: TrendingUp, label: 'Most popular' },
    { icon: Tag, label: 'Price: low to high' },
    { icon: ArrowDownAZ, label: 'Name A–Z' },
  ];
  return (
    <Card
      title="Modal bottom sheet"
      platform="Android"
      note="Material 3: drag handle, rounded 28 dp top corners and a scrim. The page behind is blocked. Back, tapping the scrim and dragging down all close it without changing anything."
      chips={['Drag handle', 'Scrim', 'Back / Esc', 'Swipe down']}
      status={status}
    >
      <div className="h-full" inert={open}>
      <Behind bg="#fef7ff" title="Restaurants">
        <button
          ref={trigger}
          type="button"
          onClick={() => {
            setOpen(true);
            setStatus('');
          }}
          className="mt-1 flex items-center gap-2 self-start rounded-lg border border-[#79747e] px-3 py-1.5 text-[13px] font-medium text-[#1d1b20] outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
        >
          <SlidersHorizontal size={14} /> Sort: {sort}
        </button>
      </Behind>
      </div>
      {open && (
        <Sheet
          id="gal-m3-sheet"
          title="Sort by"
          variant="material"
          detents={[0.5]}
          returnFocus={trigger}
          closeRef={closeRef}
          onClose={(how) => {
            setOpen(false);
            if (how !== 'button') setStatus(`Closed with: ${how === 'esc' ? 'Back / Esc' : HOW[how]}`);
          }}
        >
          <ul className="text-[#1d1b20]">
            {options.map((o) => (
              <li key={o.label}>
                <button
                  type="button"
                  onClick={() => {
                    setSort(o.label);
                    setStatus(`Picked: ${o.label}`);
                    closeRef.current?.('button');
                  }}
                  className="flex h-12 w-full items-center gap-4 px-6 text-left text-[15px] outline-none hover:bg-black/5 focus-visible:bg-black/10"
                >
                  <o.icon size={18} className="text-[#49454f]" /> <span className="flex-1">{o.label}</span>
                  {o.label === sort && <Check size={18} className="text-[#6750a4]" />}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </Card>
  );
}

/* 3. Material standard (persistent) bottom sheet over a map */
function StandardDemo() {
  const [zoom, setZoom] = useState(14);
  const [status, setStatus] = useState('Height: peek');
  const cafes = ['Café Mila · 4.7 · 200 m', 'Bean There · 4.5 · 350 m', 'Kaffeehaus · 4.6 · 400 m', 'Roastery 9 · 4.8 · 650 m', 'Little Cup · 4.3 · 700 m', 'Oat & Co · 4.4 · 900 m', 'Brew Lab · 4.6 · 1.1 km'];
  return (
    <Card
      title="Standard (persistent) bottom sheet"
      platform="Android"
      note="Lives next to the main content instead of on top of it: no scrim, and the map still works. Drag between peek, half and full. It can't be dismissed, only collapsed."
      chips={['No scrim', 'Page stays usable', 'Peek / half / full']}
      status={status}
    >
      <div className="relative h-full overflow-hidden bg-[#e8f0e3]" aria-label={`Map, zoom ${zoom}`} role="img">
        <svg viewBox="0 0 280 340" className="absolute inset-0 h-full w-full" aria-hidden="true" style={{ transform: `scale(${1 + (zoom - 14) * 0.08})`, transition: 'transform .2s' }}>
          <path d="M-10 90 C 80 60, 150 140, 300 100" stroke="#fff" strokeWidth="10" fill="none" />
          <path d="M60 -10 C 90 120, 40 220, 120 360" stroke="#fff" strokeWidth="8" fill="none" />
          <path d="M180 -10 L 210 360" stroke="#f9e7a8" strokeWidth="9" fill="none" />
          <rect x="200" y="150" width="60" height="40" rx="6" fill="#cfe3c4" />
        </svg>
        {[[70, 70], [150, 115], [215, 60], [110, 170]].map(([x, y], i) => (
          <MapPin key={i} size={22} className="absolute fill-[#b3261e] text-white" style={{ left: x, top: y }} aria-hidden="true" />
        ))}
      </div>
      <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-xl bg-white shadow">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(18, z + 1))} className="grid size-9 place-items-center text-[#1d1b20] hover:bg-black/5">
          <Plus size={16} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(10, z - 1))} className="grid size-9 place-items-center border-t border-black/10 text-[#1d1b20] hover:bg-black/5">
          <Minus size={16} />
        </button>
      </div>
      <Sheet
        id="gal-std-sheet"
        title="7 cafés nearby"
        variant="material"
        modal={false}
        dismissible={false}
        detents={[0.2, 0.5, 0.92]}
        detentLabels={['peek', 'half', 'full']}
        onDetentChange={(_, l) => setStatus(`Height: ${l}`)}
      >
        <ul className="text-[#1d1b20]">
          {cafes.map((c) => (
            <li key={c} className="flex items-center gap-3 px-5 py-2.5 text-[14px]">
              <Coffee size={16} className="text-[#6750a4]" /> {c}
            </li>
          ))}
        </ul>
      </Sheet>
    </Card>
  );
}

/* 4. iOS action sheet (confirmation dialog) */
function ActionSheetDemo() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const close = (how: string) => {
    setOpen(false);
    setStatus(how);
    window.setTimeout(() => trigger.current?.focus({ preventScroll: true }), 30);
  };
  return (
    <Card
      title="Action sheet"
      platform="iOS"
      note="A short list of actions about one thing, with a separate Cancel. Not draggable. Destructive actions are red. Tapping outside cancels."
      chips={['Cancel button', 'Tap outside', 'Destructive in red']}
      status={status}
    >
      <div className="h-full" inert={open}>
      <Behind bg="#f2f2f7" title="Photo">
        <div className="h-24 rounded-xl bg-gradient-to-br from-[#9ec5ff] to-[#5b8def]" aria-hidden="true" />
        <button
          ref={trigger}
          type="button"
          onClick={() => {
            setOpen(true);
            setStatus('');
          }}
          className="mt-1 rounded-full bg-[#007aff] py-2 text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2"
        >
          Delete photo…
        </button>
      </Behind>
      </div>
      {open && (
        <div
          className="absolute inset-0 z-40 flex items-end"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close('Closed with: Esc');
          }}
        >
          <div className="absolute inset-0 bg-black/25" aria-hidden="true" onClick={() => close('Closed with: Tap outside')} />
          <div role="dialog" aria-modal="true" aria-labelledby="gal-as-t" className="relative w-full space-y-2 p-2">
            <div className="overflow-hidden rounded-[14px] bg-white/95 text-center backdrop-blur">
              <p id="gal-as-t" className="px-4 py-3 text-[12px] text-black/50">
                This photo will be deleted from all your devices.
              </p>
              <button type="button" onClick={() => close('Picked: Delete')} className="w-full border-t border-black/10 py-3 text-[17px] text-[#ff3b30] outline-none focus-visible:bg-black/5">
                Delete Photo
              </button>
            </div>
            <button type="button" autoFocus onClick={() => close('Closed with: Cancel')} className="w-full rounded-[14px] bg-white py-3 text-[17px] font-semibold text-[#007aff] outline-none focus-visible:bg-[#e5e5ea]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* 5. Web: mobile filter sheet */
function WebDemo() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<((how: CloseHow) => void) | null>(null);
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  return (
    <Card
      title="Filter sheet on mobile web"
      platform="Web"
      note="A dialog that slides up on small screens (often a side panel or centered dialog on desktop). It needs a visible close button, Esc, a focus trap and a clear apply button."
      chips={['Close (X)', 'Esc', 'Focus trap', 'Apply button']}
      status={status}
    >
      <div className="flex h-full flex-col bg-white text-[#0e1120]" inert={open}>
        <div className="flex h-7 shrink-0 items-center justify-center border-b border-black/10 bg-[#f6f7fb]" aria-hidden="true">
          <span className="rounded bg-white px-2 font-mono text-[9px] text-black/50 ring-1 ring-black/10">shop.example.com</span>
        </div>
        <div className="flex items-center justify-between p-3">
          <p className="text-[15px] font-bold">T-shirts · 42</p>
          <button
            ref={trigger}
            type="button"
            onClick={() => {
              setOpen(true);
              setStatus('');
            }}
            className="flex items-center gap-1.5 rounded-full border border-black/20 px-3 py-1 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
          >
            <SlidersHorizontal size={13} /> Filters{picked.length ? ` (${picked.length})` : ''}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-black/[0.06]" />
          ))}
        </div>
      </div>
      {open && (
        <Sheet
          id="gal-web-sheet"
          title="Filters"
          variant="web"
          detents={[0.8]}
          handle={false}
          returnFocus={trigger}
          closeRef={closeRef}
          onClose={(how) => {
            setOpen(false);
            setStatus(how === 'button' ? `Closed with: button · ${picked.length} filter(s)` : `Closed with: ${HOW[how]}`);
          }}
          showTitle={false}
          header={
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 text-[#0e1120]">
              <p id="gal-web-sheet-title" className="text-[16px] font-bold">
                Filters
              </p>
              <button type="button" aria-label="Close filters" onClick={() => closeRef.current?.('button')} className="grid size-8 place-items-center rounded-full hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff] outline-none">
                <X size={18} />
              </button>
            </div>
          }
          footer={
            <div className="border-t border-black/10 p-3">
              <button type="button" onClick={() => closeRef.current?.('button')} className="w-full rounded-lg bg-[#2f6bff] py-2.5 text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2">
                Show {Math.max(4, 42 - picked.length * 9)} results
              </button>
            </div>
          }
        >
          <div className="p-4 text-[#0e1120]">
            <p className="text-[13px] font-semibold">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const on = picked.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
                    className={`h-9 min-w-11 rounded-lg border px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] ${on ? 'border-[#2f6bff] bg-[#2f6bff]/10 text-[#2f6bff]' : 'border-black/20'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[13px] font-semibold">Color</p>
            <div className="mt-2 flex gap-2" aria-hidden="true">
              {['#111', '#fff', '#2f6bff', '#d92d20', '#16a34a'].map((c) => (
                <span key={c} className="size-7 rounded-full ring-1 ring-black/20" style={{ background: c }} />
              ))}
            </div>
          </div>
        </Sheet>
      )}
    </Card>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every demo works. Open each sheet and try every way out: the buttons, tapping outside, <kbd>Esc</kbd>, and dragging the handle down. Drag the handles up too.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <IOSSheetDemo />
        <M3ModalDemo />
        <StandardDemo />
        <ActionSheetDemo />
        <WebDemo />
      </div>
    </div>
  );
}
