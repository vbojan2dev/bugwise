import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MapPin, RotateCcw, ShoppingBasket } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { searchCities, type City } from './Combobox';

/*
 * A deliberately broken delivery-address form for a grocery shop. Bugs (don't spoil them for learners!):
 *  1. The city text is submitted even if no option was chosen: {"city":"novi","cityId":null,"postcode":""} is saved (201).
 *  2. Arrow keys don't move through the options (no active option, no aria-activedescendant); Enter submits the form.
 *  3. No debounce and no stale check: short queries answer slower, so typing fast lets the "no" response overwrite "novi".
 *  4. Esc clears the whole field instead of just closing the list.
 *  5. The list doesn't close on blur or outside click; it stays over the form.
 *  6. Highlighting uses a raw, case-insensitive indexOf: "sabac" finds Šabac (search ignores accents) but nothing
 *     is bold; "nóvi" finds Novi Sad with no bold part.
 * Everything else works: search ignores case and accents, choosing with mouse/tap fills the postcode, the result
 * count is announced, name and street validation, network log.
 */

const latencyFor = (q: string) => Math.max(300, 1600 - 400 * (q.trim().length - 2));

function NaiveHighlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1; // BUG 6
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

interface LogEntry {
  id: number;
  text: string;
  status: string;
}

export function BuggyAddressForm() {
  const [name, setName] = useState('Ana Petrović');
  const [street, setStreet] = useState('Bulevar oslobođenja 12');
  const [cityText, setCityText] = useState('');
  const [city, setCity] = useState<City | null>(null);
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; street?: string }>({});
  const [saved, setSaved] = useState<null | { city: string; postcode: string }>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addLog = (text: string, status = '…') => {
    const id = nextId.current++;
    setLog((l) => [{ id, text, status }, ...l].slice(0, 6));
    return id;
  };
  const setStatus = (id: number, status: string) => setLog((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));

  const onType = (v: string) => {
    setCityText(v);
    setCity(null);
    setOpen(true);
    if (v.trim().length < 2) {
      setResults([]);
      setAnswered(false);
      return;
    }
    // BUG 3: a request per keystroke, and whatever arrives last wins.
    const id = addLog(`GET /api/cities?q=${encodeURIComponent(v)}`);
    timers.current.push(
      window.setTimeout(() => {
        const r = searchCities(v);
        setResults(r);
        setAnswered(true);
        setStatus(id, `200 · ${r.length}`);
      }, latencyFor(v)),
    );
  };

  const choose = (c: City) => {
    setCity(c);
    setCityText(c.name);
    setOpen(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Enter the recipient’s name.';
    if (!street.trim()) errs.street = 'Enter a street and house number.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setOpen(false);
    // BUG 1: typed text is accepted without a chosen city.
    const body = { city: city?.name ?? cityText, cityId: city?.id ?? null, postcode: city?.postcode ?? '' };
    const id = addLog(`POST /api/address ${JSON.stringify(body)}`);
    timers.current.push(
      window.setTimeout(() => {
        setStatus(id, '201');
        setSaved({ city: body.city, postcode: body.postcode });
      }, 400),
    );
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setName('Ana Petrović');
    setStreet('Bulevar oslobođenja 12');
    setCityText('');
    setCity(null);
    setResults([]);
    setAnswered(false);
    setOpen(false);
    setErrors({});
    setSaved(null);
    setLog([]);
  };

  const showList = open && cityText.trim().length >= 2;
  const status = showList ? (results.length ? `${results.length} results available.` : '') : '';
  const field = 'h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-[15px] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/30';

  return (
    <div className="flex w-full max-w-[440px] min-w-0 flex-col gap-4">
      <BrowserFrame url="shop.example.com">
        <div className="relative min-h-[460px] bg-[#f8fafc] px-4 py-4 text-[14px] text-[#111827] sm:px-6" style={{ colorScheme: 'light' }}>
          <p className="mb-1 flex items-center gap-2 font-bold text-[#15803d]">
            <ShoppingBasket size={18} aria-hidden="true" /> FreshBasket
            <span className="ml-auto text-[11px] font-medium text-[#6b7280]">Checkout · 1 of 3</span>
          </p>
          {saved ? (
            <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
              <p className="text-[17px] font-bold">Delivery address saved</p>
              <p className="mt-2 text-[14px] leading-relaxed">
                {name}
                <br />
                {street}
                <br />
                {saved.postcode || '—'} {saved.city}
              </p>
              <p className="mt-3 text-[12px] text-[#6b7280]">Next: payment. Your groceries arrive tomorrow, 8–10 am.</p>
              <button type="button" onClick={() => setSaved(null)} className="mt-4 rounded-lg border border-[#d1d5db] px-3 py-1.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]/50">
                Edit address
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-3 space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[16px] font-bold">Where should we deliver?</p>
              <div>
                <label htmlFor="ba-name" className="mb-1 block text-[13px] font-medium">
                  Full name
                </label>
                <input id="ba-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                {errors.name && <p className="mt-1 text-[12px] text-[#dc2626]">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="ba-street" className="mb-1 block text-[13px] font-medium">
                  Street and number
                </label>
                <input id="ba-street" autoComplete="address-line1" value={street} onChange={(e) => setStreet(e.target.value)} className={field} />
                {errors.street && <p className="mt-1 text-[12px] text-[#dc2626]">{errors.street}</p>}
              </div>
              <div className="relative grid grid-cols-1 gap-2 min-[380px]:grid-cols-[minmax(0,1fr)_6.5rem]">
                <div className="relative min-w-0">
                  <label htmlFor="ba-city" className="mb-1 block text-[13px] font-medium">
                    City
                  </label>
                  <input
                    id="ba-city"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showList}
                    aria-controls="ba-city-list"
                    autoComplete="off"
                    spellCheck={false}
                    value={cityText}
                    placeholder="Start typing…"
                    onChange={(e) => onType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        // BUG 4: clears everything instead of closing the list
                        setCityText('');
                        setCity(null);
                        setResults([]);
                        setAnswered(false);
                        setOpen(false);
                      }
                      // BUG 2: arrow keys are not handled at all
                    }}
                    /* BUG 5: no onBlur, no outside-click handling */
                    className={field}
                  />
                  <div role="status" className="sr-only">
                    {status}
                  </div>
                  <ul id="ba-city-list" role="listbox" aria-label="Cities" hidden={!showList} className="absolute inset-x-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.16)]">
                    {results.length === 0 ? (
                      <li role="presentation" className="px-3 py-2.5 text-[13px] text-[#6b7280]">
                        {answered ? `No cities match “${cityText.trim()}”.` : 'Searching…'}
                      </li>
                    ) : (
                      results.map((c) => (
                        <li key={c.id} role="option" aria-selected={city?.id === c.id} onClick={() => choose(c)} className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-[14px] hover:bg-[#f0fdf4]">
                          <MapPin size={14} className="shrink-0 text-[#9ca3af]" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">
                            <NaiveHighlight text={c.name} q={cityText} />
                          </span>
                          <span className="text-[12px] text-[#6b7280] tabular-nums">{c.postcode}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="min-w-0">
                  <label htmlFor="ba-pc" className="mb-1 block text-[13px] font-medium">
                    Postcode
                  </label>
                  <input id="ba-pc" readOnly value={city?.postcode ?? ''} placeholder="auto" className={`${field} bg-[#f3f4f6] text-[#4b5563]`} />
                </div>
              </div>
              <button type="submit" className="h-11 w-full rounded-lg bg-[#16a34a] font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#16a34a]/30">
                Continue to payment
              </button>
            </form>
          )}
        </div>
      </BrowserFrame>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
          <span>Network log</span>
          <button type="button" onClick={restart} className="flex items-center gap-1 font-medium normal-case hover:text-white">
            <RotateCcw size={12} /> Restart
          </button>
        </div>
        <ul className="min-h-[6rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Type a city to see requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex items-start gap-2">
              <span className="min-w-0 flex-1 break-all">{e.text}</span>
              <span className={e.status === '…' ? 'shrink-0 text-[#fbbf24]' : 'shrink-0 text-[#34d399]'}>{e.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
