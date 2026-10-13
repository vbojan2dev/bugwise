import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, RotateCcw, Star } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import {
  TODAY,
  diffDays,
  firstDayOfWeek,
  fmtDate,
  instantToWall,
  monthGrid,
  monthKey,
  normalize,
  parseISO,
  wallISO,
  wallToInstant,
  weekdayLabels,
} from './dateUtils';

/*
 * A deliberately broken hotel booking screen. Simulated today: Monday, 12 October 2026.
 * Bugs (don't spoil them for learners!):
 *  1. Check-out can be before check-in: the second tap always becomes check-out.
 *  2. Night count is off by one: it counts calendar days (diff + 1) instead of nights.
 *  3. Typed dates only check "day <= 31": 31/04/2027 or 29/02/2027 silently roll over to the next month.
 *  4. Month navigation adds 1 to the month of the check-in date and keeps the day: from the 31st it skips a month.
 *  5. Dates are stored as "local midnight" instants: changing the device time zone westwards moves both dates back a day.
 *  6. Weekday header follows the region (Monday first in UK/Serbia) but the grid is always laid out Sunday-first.
 * Past dates are correctly disabled.
 */

const PRICE = 120;
const REGIONS = {
  US: { name: 'United States', locale: 'en-US', hint: 'MM/DD/YYYY' },
  UK: { name: 'United Kingdom', locale: 'en-GB', hint: 'DD/MM/YYYY' },
  RS: { name: 'Srbija', locale: 'sr-Latn', hint: 'D.M.YYYY' },
} as const;
type Region = keyof typeof REGIONS;

const ZONES = [
  { id: 'Europe/Belgrade', name: 'Belgrade' },
  { id: 'Europe/London', name: 'London' },
  { id: 'America/New_York', name: 'New York' },
  { id: 'Asia/Tokyo', name: 'Tokyo' },
];

const two = (n: number) => String(n).padStart(2, '0');

function formatField(iso: string, region: Region) {
  const { y, m, d } = parseISO(iso);
  if (region === 'US') return `${two(m)}/${two(d)}/${y}`;
  if (region === 'UK') return `${two(d)}/${two(m)}/${y}`;
  return `${d}.${m}.${y}`;
}

/** BUG 3: only checks the day is between 1 and 31, then lets Date "fix" impossible dates. */
function parseField(text: string, region: Region): string | null {
  const t = text.trim().replace(/\.$/, '');
  const m = region === 'RS' ? t.match(/^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})$/) : t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const y = Number(m[3]);
  const [month, day] = region === 'US' ? [a, b] : [b, a];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return normalize(y, month, day);
}

interface LogEntry {
  id: number;
  body: string;
}

export function BuggyHotelBooking() {
  const [region, setRegion] = useState<Region>('UK');
  const [tz, setTz] = useState('Europe/Belgrade');
  const [checkIn, setCheckIn] = useState<number | null>(null); // instants (ms)
  const [checkOut, setCheckOut] = useState<number | null>(null);
  const [anchor, setAnchor] = useState(TODAY);
  const [drafts, setDrafts] = useState<{ in: string | null; out: string | null }>({ in: null, out: null });
  const [errors, setErrors] = useState<{ in?: string; out?: string }>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [booked, setBooked] = useState<string | null>(null);
  const nextId = useRef(1);

  const { locale, hint } = REGIONS[region];
  // BUG 5: the stored instant is converted back with whatever zone the device has *now*.
  const inISO = checkIn !== null ? wallISO(instantToWall(checkIn, tz)) : null;
  const outISO = checkOut !== null ? wallISO(instantToWall(checkOut, tz)) : null;
  const nights = inISO && outISO ? diffDays(inISO, outISO) + 1 : 0; // BUG 2

  const toInstant = (iso: string) => wallToInstant(iso, 0, 0, tz);

  const pick = (iso: string) => {
    if (iso < TODAY) return;
    setBooked(null);
    setErrors({});
    if (checkIn === null || checkOut !== null) {
      setCheckIn(toInstant(iso));
      setCheckOut(null);
      setAnchor(iso);
    } else {
      setCheckOut(toInstant(iso)); // BUG 1: no check that it is after check-in
    }
  };

  const commit = (which: 'in' | 'out') => {
    const text = drafts[which];
    setDrafts((d) => ({ ...d, [which]: null }));
    if (text === null || text.trim() === '') return;
    const iso = parseField(text, region);
    if (!iso) return setErrors((e) => ({ ...e, [which]: `Use the format ${hint}` }));
    if (iso < TODAY) return setErrors((e) => ({ ...e, [which]: which === 'in' ? "Check-in can't be in the past" : "Check-out can't be in the past" }));
    setErrors((e) => ({ ...e, [which]: undefined }));
    setBooked(null);
    if (which === 'in') {
      setCheckIn(toInstant(iso));
      setAnchor(iso);
    } else setCheckOut(toInstant(iso));
  };

  // BUG 4: keeps the day of the anchor date, so Oct 31 + 1 month = "Nov 31" = Dec 1.
  const shift = (n: number) => {
    const { y, m, d } = parseISO(anchor);
    setAnchor(normalize(y, m + n, d));
  };
  const { y: vy, m: vm } = parseISO(anchor);
  const canPrev = monthKey(anchor) > monthKey(TODAY);
  const weeks = monthGrid(vy, vm, 0); // BUG 6: always Sunday-first…
  const heads = weekdayLabels(locale, firstDayOfWeek(locale)); // …but the labels follow the region

  const reserve = () => {
    if (!inISO || !outISO) return;
    const body = JSON.stringify({ hotel: 'adria-split', checkIn: inISO, checkOut: outISO, nights, total: nights * PRICE });
    const id = nextId.current++;
    setLog((l) => [{ id, body }, ...l].slice(0, 3));
    setBooked(`SB-${4820 + id}`);
  };

  const reset = () => {
    setCheckIn(null);
    setCheckOut(null);
    setAnchor(TODAY);
    setDrafts({ in: null, out: null });
    setErrors({});
    setLog([]);
    setBooked(null);
  };

  const short = (iso: string) => fmtDate(iso, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const field = (which: 'in' | 'out', label: string, iso: string | null) => (
    <label className="block min-w-0">
      <span className="block text-[10px] font-semibold tracking-wide text-[#6b7280] uppercase">{label}</span>
      <input
        value={drafts[which] ?? (iso ? formatField(iso, region) : '')}
        placeholder={hint}
        inputMode="numeric"
        onChange={(e) => setDrafts((d) => ({ ...d, [which]: e.target.value }))}
        onBlur={() => commit(which)}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
        className={`mt-0.5 h-9 w-full rounded-lg border bg-white px-2 text-[13px] text-[#111827] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 ${errors[which] ? 'border-[#dc2626]' : 'border-[#d1d5db]'}`}
      />
      {errors[which] && <span className="mt-0.5 block text-[10px] leading-tight text-[#dc2626]">{errors[which]}</span>}
    </label>
  );

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={274}>
        <div className="flex h-full flex-col overflow-y-auto bg-[#f8fafc] px-3.5 pt-3 pb-6 text-[#111827]">
          <div className="flex items-center gap-2">
            <div className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-[#5eead4] to-[#0f766e]" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">Hotel Adria</p>
              <p className="flex items-center gap-1 text-[11px] text-[#6b7280]">
                <MapPin size={11} /> Split · <Star size={11} className="fill-[#f59e0b] text-[#f59e0b]" /> 4.6 · €{PRICE}/night
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {field('in', 'Check-in', inISO)}
            {field('out', 'Check-out', outISO)}
          </div>

          <div className="mt-3 rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between px-1">
              <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-full text-[#0f766e] disabled:opacity-25">
                <ChevronLeft size={18} />
              </button>
              <p className="text-[13px] font-semibold">{fmtDate(anchor, locale, { month: 'long', year: 'numeric' })}</p>
              <button type="button" aria-label="Next month" onClick={() => shift(1)} className="grid size-8 place-items-center rounded-full text-[#0f766e]">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#9ca3af]">
              {heads.map((h, i) => (
                <span key={i} className="py-1">
                  {h}
                </span>
              ))}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {w.map((iso, di) => {
                  if (!iso) return <span key={di} className="h-8" />;
                  const past = iso < TODAY;
                  const end = iso === inISO || iso === outISO;
                  const mid = inISO && outISO && iso > inISO && iso < outISO;
                  return (
                    <div key={iso} className={`grid h-8 place-items-center ${mid ? 'bg-[#ccfbf1]' : ''}`}>
                      <button
                        type="button"
                        disabled={past}
                        onClick={() => pick(iso)}
                        aria-label={fmtDate(iso, locale, { dateStyle: 'full' })}
                        className={`grid size-7 place-items-center rounded-full text-[12px] tabular-nums ${end ? 'bg-[#0f766e] font-semibold text-white' : past ? 'text-[#d1d5db]' : iso === TODAY ? 'font-bold text-[#0f766e]' : ''}`}
                      >
                        {parseISO(iso).d}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-white p-3 text-[12px] shadow-[0_1px_3px_rgba(0,0,0,.08)]">
            {inISO && outISO ? (
              <>
                <p className="text-[#374151]">
                  {short(inISO)} → {short(outISO)}
                </p>
                <p className="mt-1 flex items-baseline justify-between">
                  <span className="font-semibold">
                    {nights} night{Math.abs(nights) === 1 ? '' : 's'}
                  </span>
                  <span className="text-[15px] font-bold">€{nights * PRICE}</span>
                </p>
              </>
            ) : (
              <p className="text-[#6b7280]">{inISO ? `Check-in ${short(inISO)}. Now pick check-out.` : 'Pick your check-in date.'}</p>
            )}
            <button
              type="button"
              disabled={!inISO || !outISO}
              onClick={reserve}
              className="mt-2 h-9 w-full rounded-lg bg-[#0f766e] text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {booked ? `Booked · ${booked}` : 'Reserve'}
            </button>
          </div>
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <label className="block rounded-lg bg-subtle px-3 py-2">
            <span className="block text-[11px] text-muted">Region</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="w-full bg-transparent text-sm text-fg">
              {(Object.keys(REGIONS) as Region[]).map((r) => (
                <option key={r} value={r}>
                  {REGIONS[r].name}
                </option>
              ))}
            </select>
          </label>
          <label className="block rounded-lg bg-subtle px-3 py-2">
            <span className="block text-[11px] text-muted">Time zone</span>
            <select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full bg-transparent text-sm text-fg">
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[11px] text-faint">Simulated today: Monday, 12 October 2026</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[4.5rem] space-y-2 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Tap Reserve to see the request…</li>}
          {log.map((e) => (
            <li key={e.id}>
              <span className="text-[#7dd3fc]">POST</span> /api/bookings <span className="text-[#34d399]">201</span>
              <span className="mt-0.5 block break-all text-white/60">{e.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
