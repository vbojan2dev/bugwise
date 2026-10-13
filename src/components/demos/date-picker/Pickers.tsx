import { useState, type ReactNode } from 'react';
import { CalendarDays, Keyboard, Pencil, Clock3, BedDouble } from 'lucide-react';
import { Calendar } from './Calendar';
import { WheelColumn, WheelFrame } from './Wheel';
import { TODAY, daysInMonth, diffDays, fmtDate, parseISO, toISO } from './dateUtils';

const US = 'en-US';
const pretty = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => fmtDate(iso, US, opts);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const two = (n: number) => String(n).padStart(2, '0');
const time12 = (h: number, m: number) => `${h % 12 === 0 ? 12 : h % 12}:${two(m)} ${h < 12 ? 'AM' : 'PM'}`;

/** Parses MM/DD/YYYY strictly. Returns null for impossible dates such as 02/30/2027. */
export function parseUS(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [mo, d, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return toISO(y, mo, d);
}
const toUS = (iso: string) => {
  const { y, m, d } = parseISO(iso);
  return `${two(m)}/${two(d)}/${y}`;
};

/* ------------------------------------------------------------------ iOS */

export function IOSInline() {
  const [date, setDate] = useState(TODAY);
  return (
    <div className="rounded-xl bg-white p-3 text-black">
      <Calendar value={date} onChange={setDate} variant="ios" compact label="Delivery date" />
      <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2.5 text-[15px]">
        <span>Time</span>
        <span className="rounded-md bg-[rgba(118,118,128,.12)] px-2.5 py-1 tabular-nums">9:41 AM</span>
      </div>
    </div>
  );
}

const HOURS12 = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 60 }, (_, i) => two(i));

function TimeWheels({ h, m, onChange }: { h: number; m: number; onChange: (h: number, m: number) => void }) {
  return (
    <WheelFrame>
      <WheelColumn label="Hour" items={HOURS12} value={h % 12} onChange={(i) => onChange((h >= 12 ? 12 : 0) + i, m)} width={56} align="right" />
      <WheelColumn label="Minute" items={MINUTES} value={m} onChange={(i) => onChange(h, i)} width={56} />
      <WheelColumn label="AM or PM" items={['AM', 'PM']} value={h >= 12 ? 1 : 0} onChange={(i) => onChange((h % 12) + i * 12, m)} width={56} align="left" />
    </WheelFrame>
  );
}

export function IOSCompact() {
  const [date, setDate] = useState('2026-10-16');
  const [h, setH] = useState(19);
  const [m, setM] = useState(30);
  const [open, setOpen] = useState<'date' | 'time' | null>(null);
  const pill = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-[15px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] ${active ? 'bg-[rgba(0,122,255,.14)] text-[#007aff]' : 'bg-[rgba(118,118,128,.12)] text-black'}`;
  return (
    <div className="text-black">
      <p className="px-4 pb-1 text-[12px] text-[rgba(60,60,67,.6)] uppercase">Table reservation</p>
      <div className="rounded-xl bg-white">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-[15px]">
          <span>Date</span>
          <span className="flex gap-1.5">
            <button type="button" aria-expanded={open === 'date'} onClick={() => setOpen(open === 'date' ? null : 'date')} className={pill(open === 'date')}>
              {pretty(date)}
            </button>
            <button type="button" aria-expanded={open === 'time'} onClick={() => setOpen(open === 'time' ? null : 'time')} className={pill(open === 'time')}>
              {time12(h, m)}
            </button>
          </span>
        </div>
      </div>
      {open && (
        <div className="mt-2 rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,.18)]">
          {open === 'date' ? (
            <Calendar
              value={date}
              onChange={(d) => {
                setDate(d);
                setOpen(null);
              }}
              variant="ios"
              compact
              min={TODAY}
              label="Reservation date"
            />
          ) : (
            <TimeWheels
              h={h}
              m={m}
              onChange={(nh, nm) => {
                setH(nh);
                setM(nm);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

const YEARS = Array.from({ length: 13 }, (_, i) => String(2020 + i));

export function IOSWheels() {
  const [mo, setMo] = useState(1); // February (0-based index)
  const [d, setD] = useState(26);
  const [yi, setYi] = useState(6); // 2026
  const y = 2020 + yi;
  const dim = daysInMonth(y, mo + 1);
  // Like iOS: impossible days stay visible but greyed, and the wheel snaps back to the last valid day.
  const day = Math.min(d, dim);
  return (
    <div className="text-black">
      <WheelFrame>
        <WheelColumn label="Month" items={MONTHS} value={mo} onChange={setMo} width={118} align="right" />
        <WheelColumn
          label="Day"
          items={Array.from({ length: 31 }, (_, i) => String(i + 1))}
          value={day - 1}
          onChange={(i) => setD(Math.min(i + 1, dim))}
          isDisabled={(i) => i + 1 > dim}
          width={48}
        />
        <WheelColumn label="Year" items={YEARS} value={yi} onChange={setYi} width={64} align="left" />
      </WheelFrame>
      <p className="mt-2 text-center text-[12px] text-[rgba(60,60,67,.6)]">{pretty(toISO(y, mo + 1, day), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  );
}

/* ------------------------------------------------------------- Material 3 */

function OutlinedField({
  label,
  value,
  onChange,
  onBlur,
  error,
  trailing,
  id,
  hint = 'MM/DD/YYYY',
  bg,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  trailing?: ReactNode;
  id: string;
  hint?: string;
  bg: string;
}) {
  const color = error ? '#b3261e' : '#6750a4';
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          inputMode="numeric"
          aria-invalid={!!error}
          aria-describedby={`${id}-hint`}
          className={`h-12 w-full rounded-[4px] border bg-transparent px-3 pr-10 text-[15px] text-[#1d1b20] outline-none focus:border-2 ${error ? 'border-[#b3261e]' : 'border-[#79747e] focus:border-[#6750a4]'}`}
        />
        <label htmlFor={id} className="absolute -top-2 left-2 px-1 text-[11px]" style={{ color, background: bg }}>
          {label}
        </label>
        {trailing && <span className="absolute top-1/2 right-1 -translate-y-1/2">{trailing}</span>}
      </div>
      <p id={`${id}-hint`} className="mt-1 px-3 text-[11px]" style={{ color: error ? '#b3261e' : '#49454f' }}>
        {error ?? hint}
      </p>
    </div>
  );
}

export function MaterialDocked() {
  const [date, setDate] = useState<string>('2026-10-20');
  const [text, setText] = useState(toUS('2026-10-20'));
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(true);
  const commit = () => {
    const iso = parseUS(text);
    if (!iso) return setError('Invalid date. Use MM/DD/YYYY, e.g. 10/20/2026');
    setError(undefined);
    setDate(iso);
  };
  return (
    <div className="rounded-xl bg-[#fef7ff] p-3">
      <OutlinedField
        bg="#fef7ff"
        id="m3-docked"
        label="Departure date"
        value={text}
        onChange={setText}
        onBlur={commit}
        error={error}
        trailing={
          <button
            type="button"
            aria-label={open ? 'Hide calendar' : 'Show calendar'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full text-[#49454f] outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
          >
            <CalendarDays size={20} />
          </button>
        }
      />
      {open && (
        <div className="mt-1 rounded-2xl bg-[#ece6f0] p-2 shadow-[0_2px_6px_rgba(0,0,0,.15)]">
          <Calendar
            value={date}
            onChange={(d) => {
              setDate(d);
              setText(toUS(d));
              setError(undefined);
            }}
            variant="material"
            compact
            label="Departure date"
          />
        </div>
      )}
    </div>
  );
}

export function MaterialModal() {
  const [committed, setCommitted] = useState('2026-10-20');
  const [draft, setDraft] = useState(committed);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState(toUS(committed));
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const cancel = () => {
    setDraft(committed);
    setText(toUS(committed));
    setError(undefined);
    setToast('Canceled. Date unchanged.');
  };
  const ok = () => {
    let next = draft;
    if (typing) {
      const iso = parseUS(text);
      if (!iso) return setError('Invalid date');
      next = iso;
    }
    setCommitted(next);
    setDraft(next);
    setToast(`Saved: ${pretty(next)}`);
  };

  return (
    <div className="rounded-[28px] bg-[#ece6f0] pb-2 text-[#1d1b20]" role="group" aria-label="Select date dialog">
      <div className="px-5 pt-4 pb-3">
        <p className="text-[12px] font-medium text-[#49454f]">{typing ? 'Enter date' : 'Select date'}</p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[26px] leading-none">{pretty(draft, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <button
            type="button"
            onClick={() => {
              setTyping((t) => !t);
              setText(toUS(draft));
              setError(undefined);
            }}
            aria-label={typing ? 'Switch to calendar input' : 'Switch to text input'}
            className="grid size-10 place-items-center rounded-full text-[#49454f] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]"
          >
            {typing ? <CalendarDays size={20} /> : <Pencil size={18} />}
          </button>
        </div>
      </div>
      <div className="h-px bg-[#cac4d0]" />
      <div className="px-3 pt-2">
        {typing ? (
          <div className="px-2 pt-3 pb-2">
            <OutlinedField
              bg="#ece6f0"
              id="m3-modal-input"
              label="Date"
              value={text}
              onChange={(v) => {
                setText(v);
                const iso = parseUS(v);
                if (iso) setDraft(iso);
              }}
              error={error}
            />
          </div>
        ) : (
          <Calendar value={draft} onChange={setDraft} variant="material" compact label="Select date" />
        )}
      </div>
      <div className="flex items-center justify-between px-4 pt-1">
        <span className="text-[11px] text-[#49454f]" role="status">
          {toast}
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={cancel} className="rounded-full px-3 py-2 text-[14px] font-medium text-[#6750a4] outline-none hover:bg-[#6750a4]/10 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
            Cancel
          </button>
          <button type="button" onClick={ok} className="rounded-full px-3 py-2 text-[14px] font-medium text-[#6750a4] outline-none hover:bg-[#6750a4]/10 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
            OK
          </button>
        </span>
      </div>
    </div>
  );
}

export function MaterialTime() {
  const [h, setH] = useState(9); // 1–12
  const [m, setM] = useState(41);
  const [pm, setPm] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [typing, setTyping] = useState(false);
  const size = 200;
  const r = 78;
  const values = mode === 'hour' ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)) : Array.from({ length: 12 }, (_, i) => i * 5);
  const current = mode === 'hour' ? h : m;
  const angleOf = (v: number) => (mode === 'hour' ? (v % 12) / 12 : v / 60) * Math.PI * 2 - Math.PI / 2;
  const a = angleOf(current);
  const box = (active: boolean) =>
    `grid h-14 w-16 place-items-center rounded-lg text-[34px] leading-none tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4] ${active ? 'bg-[#eaddff] text-[#21005d]' : 'bg-[#e6e0e9] text-[#1d1b20]'}`;

  return (
    <div className="rounded-[28px] bg-[#ece6f0] p-5 pb-3 text-[#1d1b20]" role="group" aria-label="Select time dialog">
      <p className="text-[12px] font-medium text-[#49454f]">{typing ? 'Enter time' : 'Select time'}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {typing ? (
          <>
            <label className="text-center text-[11px] text-[#49454f]">
              <input aria-label="Hour" inputMode="numeric" value={two(h)} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, '').slice(-2)); if (v >= 1 && v <= 12) setH(v); }} className={`${box(true)} text-center`} />
              Hour
            </label>
            <span className="pb-4 text-[34px]">:</span>
            <label className="text-center text-[11px] text-[#49454f]">
              <input aria-label="Minute" inputMode="numeric" value={two(m)} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, '').slice(-2)); if (v >= 0 && v <= 59) setM(v); }} className={`${box(false)} text-center`} />
              Minute
            </label>
          </>
        ) : (
          <>
            <button type="button" aria-label={`Hour, ${h}`} aria-pressed={mode === 'hour'} onClick={() => setMode('hour')} className={box(mode === 'hour')}>
              {two(h)}
            </button>
            <span className="text-[34px]">:</span>
            <button type="button" aria-label={`Minute, ${m}`} aria-pressed={mode === 'minute'} onClick={() => setMode('minute')} className={box(mode === 'minute')}>
              {two(m)}
            </button>
          </>
        )}
        <div className={`ml-1 flex flex-col overflow-hidden rounded-lg border border-[#79747e] text-[13px] font-medium ${typing ? 'mb-4' : ''}`} role="radiogroup" aria-label="AM or PM">
          {['AM', 'PM'].map((p, i) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={pm === (i === 1)}
              onClick={() => setPm(i === 1)}
              className={`h-7 w-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6750a4] ${i === 1 ? 'border-t border-[#79747e]' : ''} ${pm === (i === 1) ? 'bg-[#ffd8e4] text-[#31111d]' : 'text-[#49454f]'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {!typing && (
        <div className="relative mx-auto mt-4 rounded-full bg-[#e6e0e9]" style={{ width: size, height: size }}>
          <svg className="pointer-events-none absolute inset-0" width={size} height={size} aria-hidden="true">
            <line x1={size / 2} y1={size / 2} x2={size / 2 + Math.cos(a) * r} y2={size / 2 + Math.sin(a) * r} stroke="#6750a4" strokeWidth={2} />
            <circle cx={size / 2} cy={size / 2} r={3} fill="#6750a4" />
          </svg>
          {values.map((v) => {
            const ang = angleOf(v);
            const sel = v === current;
            return (
              <button
                key={v}
                type="button"
                aria-label={mode === 'hour' ? `${v} o'clock` : `${v} minutes`}
                aria-pressed={sel}
                onClick={() => {
                  if (mode === 'hour') {
                    setH(v);
                    setMode('minute');
                  } else setM(v);
                }}
                className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
                style={{ left: size / 2 + Math.cos(ang) * r, top: size / 2 + Math.sin(ang) * r, background: sel ? '#6750a4' : 'transparent', color: sel ? '#fff' : '#1d1b20' }}
              >
                {mode === 'minute' ? two(v) : v}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setTyping((t) => !t)}
          aria-label={typing ? 'Switch to clock dial' : 'Switch to keyboard input'}
          className="grid size-10 place-items-center rounded-full text-[#49454f] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]"
        >
          {typing ? <Clock3 size={20} /> : <Keyboard size={20} />}
        </button>
        <span className="text-[13px] font-medium text-[#6750a4]">
          {h}:{two(m)} {pm ? 'PM' : 'AM'}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Web */

export function WebNative() {
  const [date, setDate] = useState('2026-10-12');
  const [time, setTime] = useState('19:30');
  return (
    <div className="rounded-xl bg-white p-4 text-[#111827]">
      <div className="grid gap-3">
        <label className="block text-[13px] font-medium">
          Pickup date
          <input type="date" value={date} min="2026-10-12" onChange={(e) => setDate(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-[#d1d5db] bg-white px-2 text-[14px] text-[#111827] [color-scheme:light] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30 focus:outline-none" />
        </label>
        <label className="block text-[13px] font-medium">
          Pickup time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-[#d1d5db] bg-white px-2 text-[14px] text-[#111827] [color-scheme:light] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30 focus:outline-none" />
        </label>
      </div>
      <p className="mt-3 rounded-lg bg-[#f3f4f6] px-3 py-2 font-mono text-[12px] text-[#374151]">
        value sent: date=<strong>{date || '""'}</strong> time=<strong>{time || '""'}</strong>
      </p>
    </div>
  );
}

export function WebRange() {
  const [start, setStart] = useState<string | null>('2026-10-23');
  const [end, setEnd] = useState<string | null>('2026-10-26');
  const pick = (iso: string) => {
    if (!start || end) {
      setStart(iso);
      setEnd(null);
    } else if (iso <= start) {
      setStart(iso);
    } else setEnd(iso);
  };
  const nights = start && end ? diffDays(start, end) : 0;
  const field = (label: string, v: string | null, active: boolean) => (
    <div className={`rounded-lg border px-3 py-1.5 ${active ? 'border-[#2563eb] ring-2 ring-[#2563eb]/25' : 'border-[#d1d5db]'}`}>
      <p className="text-[10px] font-semibold tracking-wide text-[#6b7280] uppercase">{label}</p>
      <p className="text-[13px] font-medium">{v ? pretty(v, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Add date'}</p>
    </div>
  );
  return (
    <div className="rounded-xl bg-white p-3 text-[#111827]">
      <div className="grid grid-cols-2 gap-2">
        {field('Check-in', start, !start || !!end)}
        {field('Check-out', end, !!start && !end)}
      </div>
      <div className="mt-2">
        <Calendar rangeStart={start} rangeEnd={end} onChange={pick} variant="web" compact min={TODAY} label="Stay dates" />
      </div>
      <p className="mt-1 flex items-center gap-1.5 border-t border-[#e5e7eb] pt-2 text-[12px] text-[#374151]" role="status">
        <BedDouble size={14} className="text-[#2563eb]" />
        {start && end ? (
          <span>
            <strong>
              {nights} night{nights === 1 ? '' : 's'}
            </strong>{' '}
            · {pretty(start, { month: 'short', day: 'numeric' })} – {pretty(end, { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span>Select your check-out date</span>
        )}
      </p>
    </div>
  );
}
