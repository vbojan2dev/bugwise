import { useState, type ReactNode } from 'react';
import { CalendarPlus, Moon, Navigation, Phone, RotateCcw, Sun, Clock, Bike, Star } from 'lucide-react';
import { ActionChip, FilterChip, InputChip, Tag, chipPalette } from './Chip';

function Demo({ title, platform, note, dark, children, plain }: { title: string; platform: string; note: string; dark: boolean; children: ReactNode; plain?: boolean }) {
  const p = chipPalette(dark);
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div
        className="grid min-h-36 place-items-center px-4 py-7"
        style={{ background: plain ? (dark ? '#000' : '#f2f2f7') : p.surface, color: p.text, colorScheme: dark ? 'dark' : 'light' }}
      >
        <div className="w-full max-w-[20rem] min-w-0">{children}</div>
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

function Feedback({ text, dark }: { text: string; dark: boolean }) {
  return (
    <p aria-live="polite" className="mt-3 min-h-5 text-[12px]" style={{ color: dark ? '#cac4d0' : '#49454f' }}>
      {text}
    </p>
  );
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [filters, setFilters] = useState<string[]>(['Open now']);
  const [cuisines, setCuisines] = useState(['Italian', 'Thai', 'Mexican']);
  const [assist, setAssist] = useState('');
  const [reply, setReply] = useState('');
  const [ios, setIos] = useState<string[]>(['Coffee']);
  const [size, setSize] = useState('M');
  const [counted, setCounted] = useState<string[]>([]);

  const toggle = (set: (f: (prev: string[]) => string[]) => void, v: string) => set((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const p = chipPalette(dark);

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Every chip below works. Try them with the mouse, then with Tab and Space.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo
          title="Filter chips"
          platform="Material 3"
          dark={dark}
          note="Multi-select toggles that narrow down a list. Selected chips fill in and get a checkmark, so the state is clear even without color."
        >
          <div role="group" aria-label="Restaurant filters" className="flex flex-wrap gap-2">
            {[
              { l: 'Open now', i: Clock },
              { l: 'Free delivery', i: Bike },
              { l: '4.5+', i: Star },
            ].map(({ l, i }) => (
              <FilterChip key={l} label={l} icon={i} dark={dark} selected={filters.includes(l)} onToggle={() => toggle(setFilters, l)} />
            ))}
          </div>
        </Demo>

        <Demo
          title="Input chips"
          platform="Material 3 · Web"
          dark={dark}
          note="Pieces of information the user entered: recipients, cuisines, skills. Each has its own remove (×) button."
        >
          <div className="flex flex-wrap gap-2">
            {cuisines.map((c) => (
              <InputChip key={c} label={c} dark={dark} onRemove={() => setCuisines((prev) => prev.filter((x) => x !== c))} />
            ))}
            {cuisines.length === 0 && (
              <button
                type="button"
                onClick={() => setCuisines(['Italian', 'Thai', 'Mexican'])}
                className="flex items-center gap-1 text-[13px] font-medium underline"
                style={{ color: dark ? '#d0bcff' : '#6750a4' }}
              >
                <RotateCcw size={13} /> Bring them back
              </button>
            )}
          </div>
        </Demo>

        <Demo
          title="Assist chips"
          platform="Material 3"
          dark={dark}
          note="Smart shortcuts to an action related to the content, like the buttons under a place in Google Maps. They behave like small buttons."
        >
          <div className="flex flex-wrap gap-2">
            <ActionChip label="Directions" icon={Navigation} dark={dark} onClick={() => setAssist('Opening directions to Luigi’s Pizzeria…')} />
            <ActionChip label="Call" icon={Phone} dark={dark} onClick={() => setAssist('Calling +44 20 7946 0000…')} />
            <ActionChip label="Add to calendar" icon={CalendarPlus} dark={dark} onClick={() => setAssist('Table for 2 added to your calendar.')} />
          </div>
          <Feedback dark={dark} text={assist} />
        </Demo>

        <Demo
          title="Suggestion chips"
          platform="Material 3"
          dark={dark}
          note="Suggestions the app generated for you: smart replies, search ideas. Tapping one fills it in or sends it."
        >
          <div className="mb-3 w-fit max-w-full rounded-2xl rounded-bl-sm px-3 py-2 text-[14px]" style={{ background: dark ? '#2b2930' : '#ece6f0' }}>
            Your rider is outside. Can you come down?
          </div>
          <div className="flex flex-wrap gap-2">
            {['On my way!', 'Give me 2 min', 'Leave it at the door'].map((s) => (
              <ActionChip key={s} label={s} dark={dark} onClick={() => setReply(s)} />
            ))}
          </div>
          <Feedback dark={dark} text={reply ? `Sent: “${reply}”` : ''} />
        </Demo>

        <Demo
          title="Capsule filters"
          platform="iOS apps · Web"
          dark={dark}
          plain
          note="iOS has no native chip, so apps draw capsule buttons, often in a horizontal row. Here the next chip peeks in at the edge: a hint that you can scroll."
        >
          <div className="relative">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Café filters">
              {['Coffee', 'Breakfast', 'Vegan', 'Wi-Fi', 'Outdoor seating', 'Dog friendly'].map((l) => (
                <FilterChip key={l} look="ios" dark={dark} label={l} selected={ios.includes(l)} onToggle={() => toggle(setIos, l)} />
              ))}
            </div>
          </div>
        </Demo>

        <Demo
          title="Tags (labels, not controls)"
          platform="All"
          dark={dark}
          plain
          note="Tags only describe something. They aren't tappable, so they shouldn't look like buttons, and screen readers read them as plain text."
        >
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-black shadow-sm">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#fde68a] text-2xl" aria-hidden="true">
              🥗
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">Green Bowl Kitchen</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Tag tone="green">Vegan</Tag>
                <Tag tone="blue">New</Tag>
                <Tag tone="red">−20%</Tag>
              </div>
            </div>
          </div>
        </Demo>

        <Demo
          title="Single-select chips"
          platform="Material 3 · Web"
          dark={dark}
          note="Filter chips can also be used for one choice (sizes, time slots). For 2–5 fixed options, a segmented control or radio buttons are usually clearer."
        >
          <div role="radiogroup" aria-label="Pizza size" className="flex flex-wrap gap-2">
            {['S', 'M', 'L', 'XL'].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                tabIndex={size === s ? 0 : -1}
                onClick={() => setSize(s)}
                onKeyDown={(e) => {
                  const all = ['S', 'M', 'L', 'XL'];
                  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  const next = all[(all.indexOf(size) + d + all.length) % all.length];
                  setSize(next);
                  (e.currentTarget.parentElement?.querySelectorAll('button')[all.indexOf(next)] as HTMLButtonElement | undefined)?.focus();
                }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg ${size === s ? 'pl-2' : 'pl-4'} pr-4 text-[14px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${p.focus}`}
                style={{ background: size === s ? p.selBg : 'transparent', color: size === s ? p.selText : p.muted, boxShadow: size === s ? 'none' : `inset 0 0 0 1px ${p.outline}` }}
              >
                {size === s && <span aria-hidden="true">✓</span>}
                {s}
              </button>
            ))}
          </div>
        </Demo>

        <Demo
          title="Chips with counts"
          platform="Material 3 · Web"
          dark={dark}
          note="A badge shows how many results each filter has. The numbers must change when other filters change. Test 0, 1 and 99+."
        >
          <div role="group" aria-label="Order status" className="flex flex-wrap gap-2">
            {[
              { l: 'Delivered', c: 24 },
              { l: 'On the way', c: 2 },
              { l: 'Refunded', c: 0 },
              { l: 'All', c: 128 },
            ].map(({ l, c }) => (
              <FilterChip key={l} label={l} count={c} dark={dark} selected={counted.includes(l)} onToggle={() => toggle(setCounted, l)} />
            ))}
          </div>
        </Demo>
      </div>
    </div>
  );
}
