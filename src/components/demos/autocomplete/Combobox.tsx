import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Data + matching helpers shared by the demos                         */
/* ------------------------------------------------------------------ */

export interface City {
  id: string;
  name: string;
  postcode: string;
}

export const CITIES: City[] = [
  ['Beograd', '11000'],
  ['Novi Sad', '21000'],
  ['Niš', '18000'],
  ['Kragujevac', '34000'],
  ['Subotica', '24000'],
  ['Zrenjanin', '23000'],
  ['Pančevo', '26000'],
  ['Čačak', '32000'],
  ['Kraljevo', '36000'],
  ['Novi Pazar', '36300'],
  ['Šabac', '15000'],
  ['Smederevo', '11300'],
  ['Leskovac', '16000'],
  ['Kruševac', '37000'],
  ['Užice', '31000'],
  ['Vranje', '17500'],
  ['Sombor', '25000'],
  ['Valjevo', '14000'],
  ['Sremska Mitrovica', '22000'],
  ['Novi Bečej', '21220'],
  ['Nova Varoš', '31320'],
  ['Nova Pazova', '22330'],
  ['Novi Kneževac', '23330'],
  ['Kikinda', '23300'],
  ['Vršac', '26300'],
  ['Bor', '19210'],
  ['Zaječar', '19000'],
  ['Pirot', '18300'],
  ['Jagodina', '35000'],
  ['Ćuprija', '35230'],
].map(([name, postcode]) => ({ id: postcode, name, postcode }));

const MARKS = /[̀-ͯ]/g;
const SPECIAL: Record<string, string> = { đ: 'd', ł: 'l', ø: 'o', ß: 'ss', æ: 'ae' };

/**
 * Case- and accent-insensitive copy of `s`, plus, for every folded character, the index of the original
 * character it came from. That map lets us highlight the right part of the ORIGINAL label.
 */
export function fold(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const lower = s[i].toLowerCase();
    const f = (SPECIAL[lower] ?? lower.normalize('NFD')).replace(MARKS, '');
    for (const c of f) {
      text += c;
      map.push(i);
    }
  }
  return { text, map };
}

/** Where `query` matches `label` at the start of a word, ignoring case and accents. [start, end) in the original label. */
export function matchRange(label: string, query: string): [number, number] | null {
  const q = fold(query.trim()).text;
  if (!q) return null;
  const { text, map } = fold(label);
  let from = 0;
  while (from <= text.length) {
    const i = text.indexOf(q, from);
    if (i < 0) return null;
    if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '-') return [map[i], map[i + q.length - 1] + 1];
    from = i + 1;
  }
  return null;
}

/** Word-prefix, accent-insensitive search; best (start-of-name) matches first. */
export function searchCities(query: string, limit = 6): City[] {
  const hits = CITIES.map((c) => ({ c, r: matchRange(c.name, query) })).filter((h) => h.r);
  hits.sort((a, b) => a.r![0] - b.r![0] || a.c.name.localeCompare(b.c.name, 'sr-Latn'));
  return hits.slice(0, limit).map((h) => h.c);
}

export function Highlight({ text, range }: { text: string; range: [number, number] | null }) {
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range[0])}
      <strong className="font-bold">{text.slice(range[0], range[1])}</strong>
      {text.slice(range[1])}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* An accessible list-autocomplete combobox                            */
/* ------------------------------------------------------------------ */

export type CbVariant = 'web' | 'material' | 'ios';

interface Props {
  label: string;
  placeholder?: string;
  variant?: CbVariant;
  minChars?: number;
  /** Must the value be one of the options? Then leaving the field with unmatched text shows an error. */
  requireSelection?: boolean;
  /** Free text allowed: the first row lets users keep exactly what they typed. */
  allowFreeText?: boolean;
  /** Simulated server latency (ms). */
  latency?: number;
  value?: City | null;
  onChange?: (c: City | null) => void;
  /** Called with the text in the field whenever it changes. */
  onText?: (t: string) => void;
  surface?: string;
  helper?: ReactNode;
}

export function Combobox({ label, placeholder, variant = 'web', minChars = 2, requireSelection = true, allowFreeText = false, latency = 250, value = null, onChange, onText, surface = '#fff', helper }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value?.name ?? '');
  const [selected, setSelected] = useState<City | null>(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const [resultsFor, setResultsFor] = useState('');
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const latest = useRef(0);
  const debounce = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      clearTimeout(debounce.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const choose = (c: City) => {
    setText(c.name);
    onText?.(c.name);
    setSelected(c);
    setOpen(false);
    setActive(-1);
    setError('');
    onChange?.(c);
  };

  const query = (q: string) => {
    clearTimeout(debounce.current);
    if (q.trim().length < minChars) {
      latest.current++; // drop any request still in flight
      setResults([]);
      setResultsFor(q);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = window.setTimeout(() => {
      const reqId = ++latest.current;
      timers.current.push(
        window.setTimeout(() => {
          if (reqId !== latest.current) return; // ignore stale responses
          setResults(searchCities(q));
          setResultsFor(q);
          setActive(-1);
          setLoading(false);
        }, latency),
      );
    }, 200);
  };

  const onType = (v: string) => {
    setText(v);
    onText?.(v);
    setOpen(true);
    setError('');
    if (selected && v !== selected.name) {
      setSelected(null);
      onChange?.(null);
    }
    query(v);
  };

  const rows = allowFreeText && text.trim() ? results.length + 1 : results.length;
  const rowAt = (i: number): City | 'free' => (allowFreeText && text.trim() ? (i === 0 ? 'free' : results[i - 1]) : results[i]);
  const optId = (i: number) => `${id}-opt-${i}`;
  const enough = text.trim().length >= minChars;
  const showList = open && (enough || (allowFreeText && text.trim()));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (rows) setActive((a) => (a + 1) % rows);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rows) setActive((a) => (a <= 0 ? rows - 1 : a - 1));
    } else if (e.key === 'Enter') {
      if (showList && active >= 0 && active < rows) {
        e.preventDefault();
        const r = rowAt(active);
        if (r === 'free') {
          setOpen(false);
          setActive(-1);
        } else choose(r);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (text) {
        e.preventDefault();
        onType('');
      }
    }
  };

  const onBlur = () => {
    setFocused(false);
    setOpen(false);
    setActive(-1);
    if (!text.trim() || selected) return;
    // Exact (accent-insensitive) match typed in full: accept it.
    const exact = CITIES.find((c) => fold(c.name).text === fold(text.trim()).text);
    if (exact) choose(exact);
    else if (requireSelection) setError('Choose a city from the list.');
  };

  const status = !open || !enough ? '' : loading ? 'Searching…' : results.length === 0 ? 'No results.' : `${results.length} result${results.length === 1 ? '' : 's'} available. Use up and down arrows to choose.`;

  const accent = variant === 'ios' ? '#007aff' : variant === 'material' ? '#6750a4' : '#2563eb';
  const hasValue = text.length > 0;

  const input = (
    <input
      ref={inputRef}
      id={id}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={!!showList}
      aria-controls={listId}
      aria-activedescendant={showList && active >= 0 ? optId(active) : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-err` : undefined}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={text}
      placeholder={variant === 'material' ? undefined : placeholder}
      onChange={(e) => onType(e.target.value)}
      onKeyDown={onKey}
      onFocus={() => {
        setFocused(true);
        if (text && !selected) setOpen(true);
      }}
      onBlur={onBlur}
      className="h-11 w-0 min-w-0 flex-1 bg-transparent px-3 text-[16px] outline-none placeholder:text-[#9ca3af]"
    />
  );

  const trailing = (
    <span className="flex shrink-0 items-center pr-1">
      {loading && <Loader2 size={16} className="mr-1 animate-spin text-[#9ca3af]" aria-hidden="true" />}
      {hasValue && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onType('');
            inputRef.current?.focus();
          }}
          className="grid size-9 place-items-center rounded-full text-[#6b7280] outline-none focus-visible:ring-2"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </span>
  );

  const box =
    variant === 'material' ? (
      <div className={`relative flex items-center rounded-[4px] border ${error ? 'border-[#b3261e]' : focused ? 'border-[#6750a4]' : 'border-[#79747e]'}`} style={{ boxShadow: focused ? `inset 0 0 0 1px ${error ? '#b3261e' : '#6750a4'}` : undefined }}>
        <label htmlFor={id} className={`pointer-events-none absolute left-3 px-1 transition-all ${focused || hasValue ? '-top-2.5 text-[12px]' : 'top-1/2 -translate-y-1/2 text-[16px]'}`} style={{ background: surface, color: error ? '#b3261e' : focused ? '#6750a4' : '#49454f' }}>
          {label}
        </label>
        <span className="flex h-14 min-w-0 flex-1 items-center pl-1">{input}</span>
        {trailing}
      </div>
    ) : (
      <>
        <label htmlFor={id} className={variant === 'ios' ? 'mb-1 block px-1 text-[13px] text-[rgba(60,60,67,.6)]' : 'mb-1 block text-[13px] font-medium'}>
          {label}
        </label>
        <div className={`flex items-center bg-white ${variant === 'ios' ? 'rounded-[10px]' : 'rounded-lg border focus-within:ring-2'} ${error ? 'border-[#dc2626] focus-within:ring-[#dc2626]/30' : 'border-[#d1d5db] focus-within:border-[#2563eb] focus-within:ring-[#2563eb]/30'}`}>
          {input}
          {trailing}
        </div>
      </>
    );

  return (
    <div className={`relative ${variant === 'material' ? 'text-[#1d1b20]' : 'text-[#111827]'}`}>
      {box}
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[12px] text-[#dc2626]">
          {error}
        </p>
      )}
      {!error && helper && <div className="mt-1 px-1 text-[12px] text-[#6b7280]">{helper}</div>}
      <div role="status" className="sr-only">
        {status}
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!showList}
        className={`absolute inset-x-0 z-30 mt-1 max-h-56 overflow-y-auto py-1 shadow-[0_8px_24px_rgba(0,0,0,.16)] ${variant === 'material' ? 'rounded-[4px] bg-[#f3edf7]' : variant === 'ios' ? 'rounded-[12px] bg-white' : 'rounded-lg border border-[#e5e7eb] bg-white'}`}
      >
        {allowFreeText && text.trim() && (
          <li id={optId(0)} role="option" aria-selected={active === 0} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(false)} className="cursor-pointer px-3 py-2.5 text-[14px]" style={{ background: active === 0 ? `${accent}1f` : undefined }}>
            Use “{text.trim()}”
          </li>
        )}
        {results.map((c, i) => {
          const idx = allowFreeText && text.trim() ? i + 1 : i;
          return (
            <li
              key={c.id}
              id={optId(idx)}
              role="option"
              aria-selected={active === idx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c)}
              onMouseMove={() => setActive(idx)}
              className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-[14px]"
              style={{ background: active === idx ? `${accent}1f` : undefined }}
            >
              <MapPin size={15} className="shrink-0 text-[#9ca3af]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                <Highlight text={c.name} range={matchRange(c.name, text)} />
              </span>
              <span className="shrink-0 text-[12px] text-[#6b7280] tabular-nums">{c.postcode}</span>
            </li>
          );
        })}
        {!loading && !allowFreeText && results.length === 0 && enough && resultsFor === text && (
          <li role="presentation" className="px-3 py-3 text-[13px] text-[#6b7280]">
            No cities match “{text.trim()}”. Check the spelling.
          </li>
        )}
        {loading && results.length === 0 && (
          <li role="presentation" className="px-3 py-3 text-[13px] text-[#6b7280]">
            Searching…
          </li>
        )}
      </ul>
      {open && !enough && !allowFreeText && text.length > 0 && (
        <p className="mt-1 px-1 text-[12px] text-[#6b7280]">Type at least {minChars} characters.</p>
      )}
    </div>
  );
}
