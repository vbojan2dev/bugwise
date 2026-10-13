import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Keyboard, MapPin, RotateCcw } from 'lucide-react';
import { CITIES, Highlight, matchRange, searchCities, type City } from './Combobox';

type Matching = 'exact' | 'smart';
type HighlightMode = 'off' | 'naive' | 'aware';
type Stale = 'ignore' | 'last';

interface Req {
  id: number;
  q: string;
  ms: number;
  state: 'pending' | 'shown' | 'ignored';
  order?: number;
}

const latencyFor = (q: string) => Math.max(250, 1150 - 250 * q.trim().length);

function search(q: string, m: Matching): City[] {
  if (m === 'smart') return searchCities(q, 8);
  const t = q.trim().toLowerCase();
  return CITIES.filter((c) => c.name.toLowerCase().startsWith(t)).slice(0, 8);
}

function naiveRange(label: string, q: string): [number, number] | null {
  if (!q) return null;
  const i = label.toLowerCase().indexOf(q.toLowerCase());
  return i < 0 ? null : [i, i + q.length];
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

function Pills<T extends string | number>({ value, options, onChange }: { value: T; options: readonly { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Playground() {
  const id = useId();
  const [text, setText] = useState('sa');
  const [resultsFor, setResultsFor] = useState('sa');
  const [minChars, setMinChars] = useState(2);
  const [debounce, setDebounce] = useState<'off' | 'on'>('off');
  const [stale, setStale] = useState<Stale>('last');
  const [matching, setMatching] = useState<Matching>('smart');
  const [hl, setHl] = useState<HighlightMode>('naive');
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<City | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [keystrokes, setKeystrokes] = useState(0);
  const seq = useRef(0);
  const latestSent = useRef(0);
  const arrived = useRef(0);
  const staleRef = useRef(stale);
  staleRef.current = stale;
  const timers = useRef<number[]>([]);
  const debounceT = useRef<number | undefined>(undefined);
  const typing = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      typing.current.forEach(clearTimeout);
      clearTimeout(debounceT.current);
    },
    [],
  );

  const send = (q: string) => {
    const reqId = ++seq.current;
    latestSent.current = reqId;
    const ms = latencyFor(q);
    setReqs((r) => [{ id: reqId, q, ms, state: 'pending' as const }, ...r].slice(0, 6));
    timers.current.push(
      window.setTimeout(() => {
        const order = ++arrived.current;
        if (staleRef.current === 'ignore' && reqId !== latestSent.current) {
          setReqs((r) => r.map((x) => (x.id === reqId ? { ...x, state: 'ignored', order } : x)));
          return;
        }
        setResultsFor(q);
        setActive(-1);
        setReqs((r) => r.map((x) => (x.id === reqId ? { ...x, state: 'shown', order } : x)));
      }, ms),
    );
  };

  const onType = (v: string) => {
    setText(v);
    setOpen(true);
    setSelected(null);
    setKeystrokes((k) => k + 1);
    clearTimeout(debounceT.current);
    if (v.trim().length < minChars) {
      latestSent.current = -1;
      return;
    }
    if (debounce === 'on') debounceT.current = window.setTimeout(() => send(v), 300);
    else send(v);
  };

  const autoType = (word: string) => {
    typing.current.forEach(clearTimeout);
    typing.current = [];
    setReqs([]);
    setKeystrokes(0);
    arrived.current = 0;
    setText('');
    setResultsFor('');
    for (let i = 1; i <= word.length; i++) typing.current.push(window.setTimeout(() => onTypeRef.current(word.slice(0, i)), i * 110));
  };
  const onTypeRef = useRef(onType);
  onTypeRef.current = onType;

  const enough = text.trim().length >= minChars;
  const results = enough && resultsFor.trim().length >= minChars ? search(resultsFor, matching) : [];
  const showList = open && enough;
  const rangeFor = (label: string) => (hl === 'off' ? null : hl === 'naive' ? naiveRange(label, text) : matchRange(label, text));

  const choose = (c: City) => {
    setSelected(c);
    setText(c.name);
    setResultsFor(c.name);
    setOpen(false);
    setActive(-1);
  };

  const status = !showList ? '(silent)' : results.length === 0 ? '“No results.”' : `“${results.length} result${results.length === 1 ? '' : 's'} available.”`;

  const issues: { kind: 'warn' | 'info'; text: string }[] = [];
  if (!enough && text) issues.push({ kind: 'info', text: `Below the minimum of ${minChars} characters: no request, no list. Tell users to keep typing.` });
  if (showList && resultsFor.trim() && resultsFor !== text)
    issues.push({ kind: 'warn', text: `Stale results: the list belongs to "${resultsFor}", but the field says "${text}". An older, slower response arrived last and overwrote the newer one.` });
  if (showList && matching === 'exact' && search(text, 'smart').length > search(text, 'exact').length)
    issues.push({ kind: 'warn', text: `Strict matching misses ${search(text, 'smart').length - search(text, 'exact').length} cit${search(text, 'smart').length - search(text, 'exact').length === 1 ? 'y' : 'ies'}: accents (Š, Č, ć) and words in the middle ("Sad" in Novi Sad) don't match.` });
  if (showList && hl === 'naive' && results.some((c) => JSON.stringify(naiveRange(c.name, text)) !== JSON.stringify(matchRange(c.name, text))))
    issues.push({ kind: 'warn', text: 'Naive highlighting compares raw letters, so options found through accents (Šabac for "sa", Niš for "nis") get no bold part, or the wrong one.' });
  if (showList && hl === 'off' && results.length) issues.push({ kind: 'info', text: 'No highlighting: users can’t see why each option matched.' });
  if (debounce === 'off' && reqs.length > 1) issues.push({ kind: 'info', text: `No debounce: one request per keystroke (${reqs.length} shown in the log). With a 300 ms debounce, fast typing sends one.` });
  if (text && !selected) issues.push({ kind: 'info', text: 'Nothing is selected yet. If the user leaves the field now, the form must not treat the typed text as a valid city.' });

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Autocomplete lab</p>
        <p className="text-sm text-muted">Short queries answer slowly here (like a real server searching more rows). Use the auto-type buttons to type fast, then change the settings and type again.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Minimum characters">
            <Pills value={minChars} onChange={setMinChars} options={[{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }] as const} />
          </Control>
          <Control label="Matching">
            <Pills value={matching} onChange={setMatching} options={[{ v: 'exact', label: 'Starts with (strict)' }, { v: 'smart', label: 'Any word, ignore accents' }] as const} />
          </Control>
          <Control label="Highlighting">
            <Pills value={hl} onChange={setHl} options={[{ v: 'off', label: 'None' }, { v: 'naive', label: 'Naive' }, { v: 'aware', label: 'Accent-aware' }] as const} />
          </Control>
          <Control label="Debounce">
            <Pills value={debounce} onChange={setDebounce} options={[{ v: 'off', label: 'Off' }, { v: 'on', label: '300 ms' }] as const} />
          </Control>
          <Control label="Late responses">
            <Pills value={stale} onChange={setStale} options={[{ v: 'last', label: 'Show whatever arrives' }, { v: 'ignore', label: 'Ignore stale' }] as const} />
          </Control>
          <p className="text-xs text-muted">Debounce and late responses only matter while typing: use the auto-type buttons.</p>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="px-5 pt-6 pb-5 sm:px-8" style={{ background: '#fff', color: '#111827', colorScheme: 'light' }}>
            <div className="mx-auto max-w-[22rem]">
              <label htmlFor={id} className="mb-1 block text-[13px] font-medium">
                City
              </label>
              <input
                id={id}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={`${id}-list`}
                aria-activedescendant={showList && active >= 0 ? `${id}-o${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
                value={text}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!open) setOpen(true);
                    else if (results.length) setActive((a) => (a + 1) % results.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (results.length) setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
                  } else if (e.key === 'Enter' && showList && results[active]) {
                    e.preventDefault();
                    choose(results[active]);
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                    setActive(-1);
                  }
                }}
                className="h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-[16px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30"
              />
              <ul id={`${id}-list`} role="listbox" aria-label="Cities" hidden={!showList} className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
                {results.length === 0 ? (
                  <li role="presentation" className="px-3 py-2.5 text-[13px] text-[#6b7280]">
                    No cities match “{resultsFor.trim() || text.trim()}”.
                  </li>
                ) : (
                  results.map((c, i) => (
                    <li
                      key={c.id}
                      id={`${id}-o${i}`}
                      role="option"
                      aria-selected={active === i}
                      onClick={() => choose(c)}
                      className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-[14px] ${active === i ? 'bg-[#2563eb]/12' : 'hover:bg-[#f3f4f6]'}`}
                    >
                      <MapPin size={14} className="shrink-0 text-[#9ca3af]" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        <Highlight text={c.name} range={rangeFor(c.name)} />
                      </span>
                      <span className="text-[12px] text-[#6b7280] tabular-nums">{c.postcode}</span>
                    </li>
                  ))
                )}
              </ul>
              {!enough && text && <p className="mt-1 text-[12px] text-[#6b7280]">Type at least {minChars} characters.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <Keyboard size={14} className="mr-0.5 text-[#6b7280]" aria-hidden="true" />
                {['novi', 'nis', 'sabac', 'nóvi', 'kra'].map((w) => (
                  <button key={w} type="button" onClick={() => autoType(w)} className="rounded-full border border-[#d1d5db] bg-white px-2 py-0.5 font-mono text-[11px] text-[#374151] outline-none hover:bg-[#f3f4f6] focus-visible:ring-2 focus-visible:ring-[#2563eb]">
                    type “{w}”
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Field text / form value</p>
              <p className="text-[13px] break-words">
                “{text}” · {selected ? <span className="text-ok">{`${selected.name} (${selected.postcode})`}</span> : <span className="text-warn">no city selected</span>}
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Screen reader hears</p>
              <p className="text-[13px]">{status}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">
                  Requests · {keystrokes} keystrokes, {reqs.length >= 6 ? '6+' : reqs.length} requests
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReqs([]);
                    setKeystrokes(0);
                    arrived.current = 0;
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
              <ul className="mt-1 space-y-0.5 font-mono text-[12px]">
                {reqs.length === 0 && <li className="font-sans text-muted">Type or use an auto-type button…</li>}
                {reqs.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <span className="min-w-0 flex-1 truncate">?q={encodeURIComponent(r.q)}</span>
                    <span className="text-muted">{r.ms} ms</span>
                    <span className={`w-28 shrink-0 text-right ${r.state === 'shown' ? 'text-ok' : r.state === 'ignored' ? 'text-muted' : 'text-warn'}`}>
                      {r.state === 'pending' ? 'pending…' : `#${r.order} ${r.state}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t.text} className="flex items-start gap-2 text-sm text-fg">
                  {t.kind === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-brand" />} <span className="min-w-0">{t.text}</span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Looks fine. Now switch off the debounce, show whatever arrives, and auto-type “novi”.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
