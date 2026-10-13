import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageItems } from './data';

/**
 * A correct, accessible web pagination bar.
 * - <nav aria-label> landmark, a list of pages, aria-current="page" on the current one
 * - Prev / Next are real buttons, disabled on the first / last page
 * - every target is at least 44×44 px
 * - `compact` shows "Page 3 of 16" between Prev and Next (good on phones)
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  compact = false,
  label = 'Pagination',
  accent = '#2f6bff',
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  compact?: boolean;
  label?: string;
  accent?: string;
}) {
  if (totalPages <= 1) return null;
  const btn =
    'grid h-11 min-w-11 place-items-center rounded-lg px-2 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-35';
  const ring = { ['--tw-ring-color' as string]: accent };

  const prev = (
    <button type="button" className={`${btn} gap-1 hover:bg-black/5`} style={ring} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
      <span className="flex items-center gap-0.5">
        <ChevronLeft size={18} aria-hidden="true" />
        {compact && <span>Prev</span>}
      </span>
    </button>
  );
  const next = (
    <button type="button" className={`${btn} gap-1 hover:bg-black/5`} style={ring} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
      <span className="flex items-center gap-0.5">
        {compact && <span>Next</span>}
        <ChevronRight size={18} aria-hidden="true" />
      </span>
    </button>
  );

  if (compact) {
    return (
      <nav aria-label={label} className="flex items-center justify-between gap-2">
        {prev}
        <p className="text-[14px] text-black/70" aria-live="polite">
          Page <strong className="text-black">{page}</strong> of {totalPages}
        </p>
        {next}
      </nav>
    );
  }

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>{prev}</li>
        {pageItems(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="grid h-11 w-6 place-items-center text-black/45">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`${btn} ${p === page ? 'text-white' : 'hover:bg-black/5'}`}
                style={{ ...ring, background: p === page ? accent : undefined }}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>{next}</li>
      </ul>
    </nav>
  );
}
