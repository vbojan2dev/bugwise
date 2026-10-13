import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import {
  TODAY,
  addDays,
  addMonthsClamped,
  dayOfWeek,
  firstDayOfWeek,
  fmtDate,
  monthGrid,
  monthKey,
  parseISO,
  weekdayLabels,
} from './dateUtils';

export type CalVariant = 'ios' | 'material' | 'web';

export interface Marker {
  label: string;
  color: string;
}

interface Props {
  /** Selected date (single mode). */
  value?: string | null;
  onChange?: (iso: string) => void;
  /** Range mode: both ends are highlighted and the days between get a band. */
  rangeStart?: string | null;
  rangeEnd?: string | null;
  locale?: string;
  firstDay?: number;
  min?: string;
  max?: string;
  today?: string;
  marker?: (iso: string) => Marker | null;
  variant?: CalVariant;
  label?: string;
  /** Month shown first when nothing is selected. */
  initialMonth?: string;
  compact?: boolean;
}

const theme = {
  ios: { accent: '#007aff', accentSoft: 'rgba(0,122,255,.14)', band: 'rgba(0,122,255,.10)', text: '#000', muted: 'rgba(60,60,67,.3)', head: 'rgba(60,60,67,.3)' },
  material: { accent: '#6750a4', accentSoft: '#e8def8', band: '#e8def8', text: '#1d1b20', muted: 'rgba(29,27,32,.38)', head: '#1d1b20' },
  web: { accent: '#2563eb', accentSoft: '#dbeafe', band: '#dbeafe', text: '#111827', muted: '#c4c8d0', head: '#6b7280' },
};

/**
 * An accessible month calendar used by the gallery, the playground and the correct demos.
 * Keyboard: arrows move by day/week, Home/End to week start/end, PageUp/PageDown change month,
 * Enter/Space select.
 */
export function Calendar({
  value = null,
  onChange,
  rangeStart = null,
  rangeEnd = null,
  locale = 'en-US',
  firstDay,
  min,
  max,
  today = TODAY,
  marker,
  variant = 'ios',
  label = 'Choose a date',
  initialMonth,
  compact = false,
}: Props) {
  const fd = firstDay ?? firstDayOfWeek(locale);
  const anchor = value ?? rangeStart ?? initialMonth ?? today;
  const [view, setView] = useState(() => monthKey(anchor) + '-01');
  const [focus, setFocus] = useState(anchor);
  const wantFocus = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const t = theme[variant];

  // Follow the selection when it changes from outside (e.g. "jump to" buttons).
  const followed = value ?? rangeStart;
  useEffect(() => {
    if (followed) {
      setView(monthKey(followed) + '-01');
      setFocus(followed);
    }
  }, [followed]);

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
  }, [focus, view]);

  const { y, m } = parseISO(view);
  const weeks = monthGrid(y, m, fd);
  const heads = weekdayLabels(locale, fd, 'narrow');
  const headsLong = weekdayLabels(locale, fd, 'long');
  const headsShort = weekdayLabels(locale, fd, 'short');
  const disabled = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);
  const inView = (iso: string) => monthKey(iso) === monthKey(view);
  const tabbable = inView(focus) ? focus : value && inView(value) ? value : inView(today) ? today : view;

  const canPrev = !min || monthKey(addMonthsClamped(view, -1)) >= monthKey(min);
  const canNext = !max || monthKey(addMonthsClamped(view, 1)) <= monthKey(max);

  const moveFocus = (iso: string) => {
    wantFocus.current = true;
    setFocus(iso);
    if (!inView(iso)) setView(monthKey(iso) + '-01');
  };

  const onKey = (e: KeyboardEvent) => {
    const cur = tabbable;
    const col = (dayOfWeek(cur) - fd + 7) % 7;
    const map: Record<string, () => string> = {
      ArrowLeft: () => addDays(cur, -1),
      ArrowRight: () => addDays(cur, 1),
      ArrowUp: () => addDays(cur, -7),
      ArrowDown: () => addDays(cur, 7),
      Home: () => addDays(cur, -col),
      End: () => addDays(cur, 6 - col),
      PageUp: () => addMonthsClamped(cur, e.shiftKey ? -12 : -1),
      PageDown: () => addMonthsClamped(cur, e.shiftKey ? 12 : 1),
    };
    if (map[e.key]) {
      e.preventDefault();
      moveFocus(map[e.key]());
    }
  };

  const select = (iso: string) => {
    if (disabled(iso)) return;
    setFocus(iso);
    onChange?.(iso);
  };

  const lo = rangeStart && rangeEnd && rangeStart < rangeEnd ? rangeStart : null;
  const hi = lo ? rangeEnd : null;
  const cell = compact ? 34 : 40;
  const monthTitle = fmtDate(view, locale, { month: 'long', year: 'numeric' });

  return (
    <div className="w-full select-none" style={{ color: t.text }}>
      <div className="mb-1 flex items-center justify-between px-1">
        {variant === 'ios' ? (
          <p className="flex items-center gap-1 text-[16px] font-semibold" aria-live="polite">
            {monthTitle} <ChevronRight size={16} style={{ color: t.accent }} aria-hidden="true" />
          </p>
        ) : variant === 'material' ? (
          <p className="flex items-center gap-1 text-[14px] font-medium" style={{ color: '#49454f' }} aria-live="polite">
            {monthTitle} <ChevronDown size={16} aria-hidden="true" />
          </p>
        ) : (
          <p className="text-[14px] font-semibold" aria-live="polite">
            {monthTitle}
          </p>
        )}
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => setView(addMonthsClamped(view, -1))}
            className="grid size-9 place-items-center rounded-full outline-none focus-visible:ring-2 disabled:opacity-30"
            style={{ color: variant === 'ios' ? t.accent : '#49454f', ['--tw-ring-color' as string]: t.accent }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => setView(addMonthsClamped(view, 1))}
            className="grid size-9 place-items-center rounded-full outline-none focus-visible:ring-2 disabled:opacity-30"
            style={{ color: variant === 'ios' ? t.accent : '#49454f', ['--tw-ring-color' as string]: t.accent }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div ref={grid} role="grid" aria-label={`${label}, ${monthTitle}`} onKeyDown={onKey} className="w-full">
        <div role="row" className="grid grid-cols-7">
          {heads.map((h, i) => (
            <span
              key={i}
              role="columnheader"
              aria-label={headsLong[i]}
              className={`grid h-7 place-items-center text-[11px] font-semibold ${variant === 'ios' ? 'uppercase' : ''}`}
              style={{ color: t.head }}
            >
              {variant === 'ios' ? headsShort[i].slice(0, 3) : h}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7">
            {week.map((iso, di) => {
              if (!iso) return <span key={di} role="gridcell" style={{ height: cell }} />;
              const isSel = iso === value || iso === rangeStart || iso === rangeEnd;
              const isToday = iso === today;
              const off = disabled(iso);
              const mk = marker?.(iso) ?? null;
              const between = lo && hi && iso > lo && iso < hi;
              const band = lo && hi ? (iso === lo ? 'right' : iso === hi ? 'left' : between ? 'full' : null) : null;
              const bandBg =
                band === 'full' ? t.band : band === 'right' ? `linear-gradient(to right, transparent 50%, ${t.band} 50%)` : band === 'left' ? `linear-gradient(to left, transparent 50%, ${t.band} 50%)` : undefined;

              let bg = 'transparent';
              let fg = off ? t.muted : t.text;
              let border = 'transparent';
              let weight = 400;
              if (isSel) {
                if (variant === 'ios' && !isToday && !rangeStart) {
                  bg = t.accentSoft;
                  fg = t.accent;
                } else {
                  bg = t.accent;
                  fg = '#fff';
                }
                weight = 600;
              } else if (isToday) {
                fg = t.accent;
                weight = 600;
                if (variant !== 'ios') border = t.accent;
              }
              const name = fmtDate(iso, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <div key={iso} role="gridcell" aria-selected={isSel} className="relative grid place-items-center" style={{ height: cell, background: bandBg }}>
                  <button
                    type="button"
                    data-iso={iso}
                    tabIndex={iso === tabbable ? 0 : -1}
                    aria-disabled={off || undefined}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={`${name}${isToday ? ', today' : ''}${mk ? `, ${mk.label}` : ''}`}
                    onClick={() => select(iso)}
                    onFocus={() => setFocus(iso)}
                    className={`relative grid place-items-center tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${variant === 'web' ? 'rounded-lg' : 'rounded-full'} ${off ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      width: cell - 4,
                      height: cell - 4,
                      background: bg,
                      color: fg,
                      fontWeight: weight,
                      fontSize: compact ? 14 : variant === 'ios' ? 18 : 14,
                      border: `1px solid ${border}`,
                      textDecoration: off ? 'line-through' : undefined,
                      textDecorationColor: off ? 'rgba(0,0,0,.25)' : undefined,
                      ['--tw-ring-color' as string]: t.accent,
                    }}
                  >
                    {parseISO(iso).d}
                    {mk && (
                      <span
                        aria-hidden="true"
                        title={mk.label}
                        className="absolute bottom-[3px] left-1/2 size-[5px] -translate-x-1/2 rounded-full"
                        style={{ background: isSel ? '#fff' : mk.color }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

