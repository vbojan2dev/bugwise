import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Globe2, Info } from 'lucide-react';
import { Calendar, type Marker } from './Calendar';
import {
  TODAY,
  daysInMonth,
  dstChange,
  dstDaysInYear,
  dtf,
  firstDayOfWeek,
  fmtDate,
  instantToWall,
  isLeap,
  offsetLabel,
  parseISO,
  tzOffsetMin,
  useMounted,
  wallISO,
  wallStatus,
  wallToInstant,
} from './dateUtils';

const LOCALES = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'de-DE', name: 'Deutsch' },
  { id: 'sr-Latn', name: 'Srpski (latinica)' },
];

const ZONES = [
  { id: 'America/Los_Angeles', name: 'Los Angeles' },
  { id: 'America/New_York', name: 'New York' },
  { id: 'Europe/London', name: 'London' },
  { id: 'Europe/Belgrade', name: 'Belgrade' },
  { id: 'Asia/Kolkata', name: 'Kolkata' },
  { id: 'Asia/Tokyo', name: 'Tokyo' },
  { id: 'Pacific/Auckland', name: 'Auckland' },
];
const zoneName = (id: string) => ZONES.find((z) => z.id === id)?.name ?? id;

const COLORS = { monthEnd: '#d97706', leap: '#7c3aed', dst: '#dc2626', year: '#059669' };

const two = (n: number) => String(n).padStart(2, '0');

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

const selectCls = 'h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm text-fg';

export default function Playground() {
  const mounted = useMounted();
  const [locale, setLocale] = useState('en-US');
  const [tz, setTz] = useState('Europe/Belgrade');
  const [date, setDate] = useState(TODAY);
  const [hour, setHour] = useState(23);
  const [minute, setMinute] = useState(30);
  const [clock, setClock] = useState<'auto' | 'h12' | 'h23'>('auto');

  const year = parseISO(date).y;
  const dstDays = useMemo(() => (mounted ? dstDaysInYear(year, tz) : []), [mounted, year, tz]);

  const marker = (iso: string): Marker | null => {
    const { y, m, d } = parseISO(iso);
    if (m === 2 && d === 29) return { label: 'leap day', color: COLORS.leap };
    const dst = dstChange(iso, tz);
    if (dst) return { label: dst === 'start' ? 'clocks go forward' : 'clocks go back', color: COLORS.dst };
    if ((m === 12 && d === 31) || (m === 1 && d === 1)) return { label: 'year boundary', color: COLORS.year };
    if (d === daysInMonth(y, m)) return { label: 'last day of the month', color: COLORS.monthEnd };
    return null;
  };

  if (!mounted) {
    return <div className="not-prose my-8 h-[40rem] animate-pulse rounded-3xl border border-line bg-subtle" aria-hidden="true" />;
  }

  const status = wallStatus(date, hour, minute, tz);
  const instant = wallToInstant(date, hour, minute, tz);
  const shown = instantToWall(instant, tz);
  const offset = tzOffsetMin(instant, tz);
  const hourOpt: Intl.DateTimeFormatOptions = clock === 'auto' ? {} : { hourCycle: clock };
  const fmt = (opts: Intl.DateTimeFormatOptions, zone = tz) => dtf(locale, { ...opts, ...hourOpt, timeZone: zone }).format(instant);
  const fd = firstDayOfWeek(locale);
  const weekStart = fmtDate('2026-10-11', locale, { weekday: 'long' });
  const weekStartMon = fmtDate('2026-10-12', locale, { weekday: 'long' });

  const rows: [string, string][] = [
    ['Short date', fmtDate(date, locale, { dateStyle: 'short' })],
    ['Numeric', fmtDate(date, locale, { year: 'numeric', month: '2-digit', day: '2-digit' })],
    ['Long date', fmtDate(date, locale, { dateStyle: 'full' })],
    ['Time', fmt({ timeStyle: 'short' })],
    ['Date + time', fmt({ dateStyle: 'medium', timeStyle: 'short' })],
    ['Week starts on', fd === 0 ? weekStart : weekStartMon],
    ['Stored by the server (UTC)', new Date(instant).toISOString().replace('.000', '')],
  ];

  const { y, m, d } = parseISO(date);
  const notes: { tone: 'warn' | 'info'; text: string }[] = [];
  if (status === 'gap')
    notes.push({
      tone: 'warn',
      text: `${two(hour)}:${two(minute)} does not exist on this day in ${zoneName(tz)}: the clocks jump forward. A good app moves it to ${two(shown.h)}:${two(shown.mi)} or warns the user. A buggy one crashes or saves the wrong hour.`,
    });
  if (status === 'overlap')
    notes.push({
      tone: 'warn',
      text: `${two(hour)}:${two(minute)} happens twice on this day in ${zoneName(tz)}: the clocks go back one hour. Which one did the user mean? A reminder could fire twice, or not at all.`,
    });
  if (m === 2 && d === 29) notes.push({ tone: 'info', text: `${y} is a leap year. Check anything yearly: a birthday or subscription on Feb 29 renews on Feb 28 or Mar 1 in ${y + 1}?` });
  if (m === 2 && d === 28 && !isLeap(y)) notes.push({ tone: 'info', text: `${y} is not a leap year, so Feb 28 is the last day of February. Typing 29/02/${y} must be rejected.` });
  if (d === daysInMonth(y, m) && !(m === 12)) notes.push({ tone: 'info', text: 'Last day of the month: test "next month" navigation, ranges that cross into the next month, and monthly repeats (when is a payment due on the 31st in a 30-day month?).' });
  if (m === 12 && d === 31) notes.push({ tone: 'info', text: 'Dec 31 → Jan 1: check the year changes in headers, ranges spanning New Year and "this year" statistics.' });
  if (wallISO(instantToWall(instant, 'UTC')) !== date)
    notes.push({ tone: 'warn', text: `In UTC this moment is already ${fmtDate(wallISO(instantToWall(instant, 'UTC')), locale, { dateStyle: 'medium' })}. If the app saves only the UTC date, the user sees the wrong day.` });

  const jumps: { label: string; date: string; h?: number; mi?: number }[] = [
    { label: 'Jan 31 (month end)', date: `${year}-01-31` },
    { label: `Feb 28, 2027 (no Feb 29)`, date: '2027-02-28' },
    { label: 'Feb 29, 2028 (leap day)', date: '2028-02-29' },
    { label: 'Apr 30 (30-day month)', date: `${year}-04-30` },
    { label: 'Dec 31 → New Year', date: `${year}-12-31`, h: 23, mi: 45 },
  ];
  for (const dd of dstDays) {
    // Find the hour on that day that is skipped (spring) or repeated (autumn).
    let h = 2;
    for (let i = 0; i < 24; i++) {
      const s = wallStatus(dd.iso, i, 30, tz);
      if ((dd.kind === 'start' && s === 'gap') || (dd.kind === 'end' && s === 'overlap')) {
        h = i;
        break;
      }
    }
    jumps.push({ label: `${fmtDate(dd.iso, 'en-US', { month: 'short', day: 'numeric' })}: clocks go ${dd.kind === 'start' ? 'forward' : 'back'}`, date: dd.iso, h, mi: 30 });
  }

  const elsewhere = ['UTC', ...ZONES.map((z) => z.id).filter((z) => z !== tz)];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Date & time playground</p>
        <p className="text-sm text-muted">Pick a date and time, then switch the language and the device time zone. Same moment, many different displays.</p>
      </div>
      <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Language / region">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium" role="radiogroup" aria-label="Language">
              {LOCALES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={locale === l.id}
                  onClick={() => setLocale(l.id)}
                  className={`rounded-md px-1 py-1.5 ${locale === l.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
                >
                  {l.id}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-faint">{LOCALES.find((l) => l.id === locale)?.name}</p>
          </Control>
          <Control label="Device time zone">
            <select aria-label="Device time zone" value={tz} onChange={(e) => setTz(e.target.value)} className={selectCls}>
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({offsetLabel(tzOffsetMin(instant, z.id))})
                </option>
              ))}
            </select>
          </Control>
          <Control label="Time (in that zone)">
            <div className="flex items-center gap-1">
              <select aria-label="Hour" value={hour} onChange={(e) => setHour(+e.target.value)} className={selectCls}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {two(i)}
                  </option>
                ))}
              </select>
              <span className="font-semibold">:</span>
              <select aria-label="Minute" value={minute} onChange={(e) => setMinute(+e.target.value)} className={selectCls}>
                {[0, 15, 30, 45, 59].map((i) => (
                  <option key={i} value={i}>
                    {two(i)}
                  </option>
                ))}
              </select>
            </div>
          </Control>
          <Control label="Device clock setting">
            <select aria-label="12 or 24 hour clock" value={clock} onChange={(e) => setClock(e.target.value as typeof clock)} className={selectCls}>
              <option value="auto">Follow language</option>
              <option value="h12">Force 12-hour</option>
              <option value="h23">Force 24-hour</option>
            </select>
          </Control>
          <Control label="Jump to a boundary date">
            <div className="flex flex-wrap gap-1.5">
              {jumps.map((j) => (
                <button
                  key={j.label}
                  type="button"
                  onClick={() => {
                    setDate(j.date);
                    if (j.h !== undefined) setHour(j.h);
                    if (j.mi !== undefined) setMinute(j.mi);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${date === j.date ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
                >
                  {j.label}
                </button>
              ))}
              {dstDays.length === 0 && <span className="text-xs text-faint">{zoneName(tz)} has no daylight saving time.</span>}
            </div>
          </Control>
        </div>

        <div className="min-w-0">
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            <div>
              <div className="rounded-2xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,.08)]">
                <Calendar key={locale} value={date} onChange={setDate} locale={locale} variant="web" marker={marker} label="Playground date" />
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                {[
                  ['Month end', COLORS.monthEnd],
                  ['Leap day', COLORS.leap],
                  ['DST change', COLORS.dst],
                  ['Year boundary', COLORS.year],
                ].map(([l, c]) => (
                  <li key={l} className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: c }} /> {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k} className="border-b border-line last:border-0">
                      <th scope="row" className="py-1.5 pr-3 text-left align-top text-xs font-medium text-muted">
                        {k}
                      </th>
                      <td className="py-1.5 text-right font-mono text-[13px] break-words text-fg">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-faint">
                {zoneName(tz)} is {offsetLabel(offset)} at this moment.
              </p>
            </div>
          </div>

          <div className="border-t border-line p-4 sm:p-5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <Globe2 size={14} /> The same moment around the world
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {elsewhere.map((z) => {
                const other = wallISO(instantToWall(instant, z));
                const diff = other !== date;
                return (
                  <li key={z} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm ${diff ? 'bg-warn-soft' : 'bg-subtle'}`}>
                    <span className="text-muted">{z === 'UTC' ? 'UTC' : zoneName(z)}</span>
                    <span className="text-right font-mono text-[12px] text-fg">
                      {fmt({ weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }, z)}
                      {diff && <span className="ml-1.5 font-sans text-[11px] font-semibold text-warn">{other > date ? 'next day' : 'previous day'}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2 border-t border-line p-4 sm:p-5" aria-live="polite">
            {notes.length ? (
              notes.map((n) => (
                <p key={n.text} className="flex items-start gap-2 text-sm text-fg">
                  {n.tone === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-info" />} {n.text}
                </p>
              ))
            ) : (
              <p className="flex items-start gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> An ordinary date. Now try a boundary date, switch to en-US vs en-GB, or move the time zone to Auckland.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
