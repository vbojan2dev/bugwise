import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Combobox, Highlight, matchRange, searchCities, type City } from './Combobox';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: string; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface">
      <div className="flex min-h-[19rem] justify-center rounded-t-2xl px-4 pt-6 pb-4 sm:px-5" style={{ background: bg, color: '#000', colorScheme: 'light' }}>
        <div className="w-full max-w-[18rem]">{children}</div>
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

function Picked({ city }: { city: City | null }) {
  return (
    <p className="mt-3 text-[12px] text-[#4b5563]">
      Form value: {city ? <code className="font-mono text-[#15803d]">{`{ city: "${city.name}", postcode: "${city.postcode}" }`}</code> : <code className="font-mono text-[#b45309]">null</code>}
    </p>
  );
}

function WebCity() {
  const [city, setCity] = useState<City | null>(null);
  return (
    <div>
      <Combobox label="City" placeholder="Start typing, e.g. nis" onChange={setCity} />
      <Picked city={city} />
    </div>
  );
}

function MaterialCity() {
  const [city, setCity] = useState<City | null>(null);
  return (
    <div className="pt-2">
      <Combobox variant="material" surface="#fef7ff" label="City" onChange={setCity} helper="Type 2 letters to see suggestions" />
      <Picked city={city} />
    </div>
  );
}

function FreeTextTown() {
  const [city, setCity] = useState<City | null>(null);
  const [text, setText] = useState('');
  return (
    <div>
      <Combobox label="Town or village" placeholder="e.g. Mokrin" allowFreeText requireSelection={false} onChange={setCity} onText={setText} />
      <p className="mt-3 text-[12px] text-[#4b5563]">
        Form value:{' '}
        <code className="font-mono break-all text-[#15803d]">{city ? `{ town: "${city.name}", postcode: "${city.postcode}" }` : text.trim() ? `{ town: "${text.trim()}", postcode: null }` : 'null'}</code>
      </p>
    </div>
  );
}

const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com', 'proton.me'];

/** Inline completion: the rest of the word is typed for you and selected, so typing on simply replaces it. */
function InlineEmail() {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const sel = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    if (sel.current && ref.current) {
      ref.current.setSelectionRange(sel.current[0], sel.current[1]);
      sel.current = null;
    }
  }, [value]);
  return (
    <div className="text-[#111827]">
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium">
        Email
      </label>
      <input
        ref={ref}
        id={id}
        type="text" /* type="email" doesn't support setSelectionRange */
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="inline"
        aria-expanded={false}
        autoComplete="email"
        value={value}
        placeholder="name@gm…"
        onChange={(e) => {
          const v = e.target.value;
          const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith('delete');
          const at = v.lastIndexOf('@');
          if (!deleting && at >= 0) {
            const part = v.slice(at + 1).toLowerCase();
            const hit = part && DOMAINS.find((d) => d.startsWith(part) && d !== part);
            if (hit) {
              const full = v.slice(0, at + 1) + hit;
              sel.current = [v.length, full.length];
              setValue(full);
              return;
            }
          }
          setValue(v);
        }}
        className="h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-[16px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30"
      />
      <p className="mt-2 text-[12px] text-[#6b7280]">
        Type <code className="font-mono">anna@g</code>. Press <kbd>→</kbd> or <kbd>Tab</kbd> to accept, keep typing to overrule, <kbd>Backspace</kbd> to drop the suggestion.
      </p>
    </div>
  );
}

/** iOS-style address search: results fill the screen above the keyboard instead of floating over the form. */
function IOSFullScreen() {
  const id = useId();
  const [q, setQ] = useState('no');
  const [picked, setPicked] = useState<City | null>(null);
  const [active, setActive] = useState(-1);
  const results = q.trim().length >= 2 ? searchCities(q, 4) : [];
  return (
    <div className="flex h-[17rem] flex-col overflow-hidden rounded-[18px] bg-[#f2f2f7] ring-1 ring-black/5">
      <div className="px-3 pt-3 pb-2">
        <div className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[rgba(118,118,128,.12)] px-2">
          <Search size={15} className="shrink-0 text-[rgba(60,60,67,.6)]" aria-hidden="true" />
          <label htmlFor={id} className="sr-only">
            City
          </label>
          <input
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-controls={`${id}-l`}
            aria-activedescendant={active >= 0 && results[active] ? `${id}-${active}` : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPicked(null);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && results.length) {
                e.preventDefault();
                setActive((a) => (a + 1) % results.length);
              } else if (e.key === 'ArrowUp' && results.length) {
                e.preventDefault();
                setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
              } else if (e.key === 'Enter' && results[active]) {
                setPicked(results[active]);
                setQ(results[active].name);
              }
            }}
            placeholder="Search city"
            className="w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[rgba(60,60,67,.6)]"
          />
        </div>
      </div>
      <ul id={`${id}-l`} role="listbox" aria-label="Cities" className="min-h-0 flex-1 overflow-y-auto bg-white">
        {picked ? (
          <li role="presentation" className="px-4 py-3 text-[14px]">
            Selected: <strong>{picked.name}</strong> {picked.postcode}
          </li>
        ) : results.length === 0 ? (
          <li role="presentation" className="px-4 py-3 text-[13px] text-[rgba(60,60,67,.6)]">
            {q.trim().length < 2 ? 'Type at least 2 letters' : 'No results'}
          </li>
        ) : (
          results.map((c, i) => (
            <li
              key={c.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={active === i}
              onClick={() => {
                setPicked(c);
                setQ(c.name);
              }}
              className={`flex cursor-pointer items-center gap-3 border-b border-[#e5e5ea] px-4 py-2 ${active === i ? 'bg-[#007aff]/10' : ''}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ff3b30] text-white">
                <MapPin size={14} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px]">
                  <Highlight text={c.name} range={matchRange(c.name, q)} />
                </span>
                <span className="block text-[12px] text-[rgba(60,60,67,.6)]">{c.postcode}, Serbia</span>
              </span>
            </li>
          ))
        )}
      </ul>
      <div aria-hidden="true" className="grid h-16 shrink-0 grid-cols-10 gap-1 bg-[#d1d3d9] p-1.5">
        {'qwertyuiop'.split('').map((k) => (
          <span key={k} className="grid place-items-center rounded-[4px] bg-white text-[11px] text-black shadow-[0_1px_0_rgba(0,0,0,.3)]">
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every field here works. Type a few letters (try <code>nis</code>, <code>sabac</code> or <code>novi</code>), use the arrow keys, Enter and Esc, then click outside.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="List autocomplete, must pick" platform="Web" bg="#fff" note="A combobox: type to filter, choose with arrows + Enter or a click. Leave the field with text that isn't a city and you get an error, not a silently invalid address.">
          <WebCity />
        </Demo>
        <Demo title="Exposed dropdown menu" platform="Android · Material 3" bg="#fef7ff" note="Material's text field with a filtered menu (AutoCompleteTextView / ExposedDropdownMenuBox). Same rules: arrows, Enter, Esc, and the menu closes when focus leaves.">
          <MaterialCity />
        </Demo>
        <Demo title="Full-screen search" platform="iOS" note="On phones, apps often move the field to the top and show results as a full list above the keyboard. A small floating list would be hidden behind the keyboard.">
          <IOSFullScreen />
        </Demo>
        <Demo title="Inline completion" platform="Web" bg="#fff" note="The rest of the text is filled in and selected: the browser address bar and email-domain helpers work like this. Typing on replaces the suggestion; deleting must not bring it back.">
          <InlineEmail />
        </Demo>
        <Demo title="Suggestions + free text" platform="Web" bg="#fff" note="When the list can't know every answer (small villages, new streets), the first row keeps exactly what the user typed. Then the form must accept a value without an id.">
          <FreeTextTown />
        </Demo>
      </div>
    </div>
  );
}
