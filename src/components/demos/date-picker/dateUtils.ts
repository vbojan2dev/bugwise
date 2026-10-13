/**
 * Small, dependency-free date helpers for the date picker demos.
 *
 * Calendar dates are plain ISO strings ("2026-10-12") with months 1–12. All arithmetic goes through
 * Date.UTC so the visitor's own device time zone can never shift a day. Time zones are handled
 * explicitly with Intl.DateTimeFormat.
 */

import { useEffect, useState } from 'react';

/** The fixed, simulated "today" used by every demo, so behavior is deterministic. */
export const TODAY = '2026-10-12';

export interface YMD {
  y: number;
  m: number; // 1–12
  d: number;
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

export const toISO = (y: number, m: number, d: number) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;

export function parseISO(iso: string): YMD {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Normalizes overflowing values exactly like JavaScript's Date does (Apr 31 → May 1). */
export function normalize(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const utcMs = (iso: string) => {
  const { y, m, d } = parseISO(iso);
  return Date.UTC(y, m - 1, d);
};

/** 0 = Sunday … 6 = Saturday */
export const dayOfWeek = (iso: string) => new Date(utcMs(iso)).getUTCDay();

export const addDays = (iso: string, n: number) => {
  const { y, m, d } = parseISO(iso);
  return normalize(y, m, d + n);
};

export const diffDays = (from: string, to: string) => Math.round((utcMs(to) - utcMs(from)) / 86_400_000);

/** Correct month navigation: the day is clamped (Jan 31 + 1 month → Feb 28). */
export function addMonthsClamped(iso: string, n: number): string {
  const { y, m, d } = parseISO(iso);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toISO(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export const monthKey = (iso: string) => iso.slice(0, 7);

/** First day of the week per locale (0 = Sunday, 1 = Monday). Kept explicit: Intl's getWeekInfo isn't in every browser yet. */
export function firstDayOfWeek(locale: string): number {
  if (locale === 'en-US' || locale.startsWith('he') || locale.startsWith('ja') || locale === 'en-CA') return 0;
  return 1;
}

/**
 * Builds a month grid: an array of weeks, each with 7 cells (ISO string or null for blank cells).
 */
export function monthGrid(y: number, m: number, firstDay: number): (string | null)[][] {
  const first = toISO(y, m, 1);
  const lead = (dayOfWeek(first) - firstDay + 7) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push(toISO(y, m, d));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ---------- Intl helpers (formatters are cached; creating them is slow) ---------- */

const cache = new Map<string, Intl.DateTimeFormat>();
export function dtf(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    cache.set(key, f);
  }
  return f;
}

/** Formats a calendar date (no time, no time zone involved). */
export const fmtDate = (iso: string, locale: string, opts: Intl.DateTimeFormatOptions) =>
  dtf(locale, { ...opts, timeZone: 'UTC' }).format(utcMs(iso));

export function weekdayLabels(locale: string, firstDay: number, style: 'narrow' | 'short' | 'long' = 'narrow'): string[] {
  // 2026-10-11 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => fmtDate(addDays('2026-10-11', (firstDay + i) % 7), locale, { weekday: style }));
}

/* ---------- Time zones ---------- */

export interface Wall extends YMD {
  h: number;
  mi: number;
}

export function instantToWall(ms: number, tz: string): Wall {
  const parts = dtf('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(ms);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, mi: get('minute') };
}

/** Offset of a time zone from UTC at a given instant, in minutes (Belgrade in summer → 120). */
export function tzOffsetMin(ms: number, tz: string): number {
  const w = instantToWall(ms, tz);
  const asUTC = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi);
  return Math.round((asUTC - Math.floor(ms / 60000) * 60000) / 60000);
}

/** Converts a wall-clock time in a time zone to an instant. Times inside a DST gap resolve forward. */
export function wallToInstant(iso: string, h: number, mi: number, tz: string): number {
  const { y, m, d } = parseISO(iso);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const off1 = tzOffsetMin(guess, tz);
  let t = guess - off1 * 60000;
  const off2 = tzOffsetMin(t, tz);
  if (off2 !== off1) t = guess - off2 * 60000;
  return t;
}

export const wallISO = (w: YMD) => toISO(w.y, w.m, w.d);

export type WallStatus = 'ok' | 'gap' | 'overlap';

/** Does this wall-clock time exist exactly once on that day in that zone? */
export function wallStatus(iso: string, h: number, mi: number, tz: string): WallStatus {
  const { y, m, d } = parseISO(iso);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const offsets = [...new Set([tzOffsetMin(guess - 12 * 3600_000, tz), tzOffsetMin(guess + 12 * 3600_000, tz)])];
  const hits = offsets.filter((off) => {
    const w = instantToWall(guess - off * 60000, tz);
    return w.h === h && w.mi === mi && wallISO(w) === iso;
  }).length;
  if (hits === 0) return 'gap';
  if (hits === 2) return 'overlap';
  return 'ok';
}

/** 'start' | 'end' if clocks change on this calendar day in that zone, otherwise null. */
export function dstChange(iso: string, tz: string): 'start' | 'end' | null {
  const today = tzOffsetMin(utcMs(iso) + 12 * 3600_000, tz);
  const prev = tzOffsetMin(utcMs(iso) - 12 * 3600_000, tz);
  if (today === prev) return null;
  return today > prev ? 'start' : 'end';
}

/** All days in a year where clocks change in a zone. */
export function dstDaysInYear(year: number, tz: string): { iso: string; kind: 'start' | 'end' }[] {
  const out: { iso: string; kind: 'start' | 'end' }[] = [];
  const days = isLeap(year) ? 366 : 365;
  for (let i = 0; i < days; i++) {
    const iso = normalize(year, 1, 1 + i);
    const kind = dstChange(iso, tz);
    if (kind) out.push({ iso, kind });
  }
  return out;
}

export const offsetLabel = (min: number) => {
  const sign = min < 0 ? '−' : '+';
  const a = Math.abs(min);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
};

/** True after the component has mounted in the browser. Used to avoid SSR/browser Intl differences. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
