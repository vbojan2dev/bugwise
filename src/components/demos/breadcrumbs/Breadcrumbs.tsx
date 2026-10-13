import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/*
 * A CORRECT, accessible web breadcrumb:
 *  - <nav aria-label="Breadcrumb"> landmark with an ordered list
 *  - separators drawn as decoration (aria-hidden), never read aloud
 *  - the current page is plain text with aria-current="page", not a link
 *  - optional collapse: Home › … › parent › current, where "…" is a real button that opens a menu
 *    with the hidden levels (so every level stays reachable on small screens)
 */

export interface Crumb {
  label: string;
  path: string;
}

export type SmallScreen = 'wrap' | 'collapse' | 'parent' | 'scroll';

interface Props {
  items: Crumb[];
  mode?: SmallScreen;
  /** Draw separators as real text characters that screen readers read (the anti-pattern), instead of decoration. */
  textSeparators?: boolean;
  onNavigate?: (c: Crumb) => void;
  accent?: string;
  className?: string;
}

function Sep({ text }: { text: boolean }) {
  return text ? (
    <span className="px-1 text-black/35">/</span>
  ) : (
    <ChevronRight size={14} className="mx-0.5 shrink-0 text-black/35" aria-hidden="true" />
  );
}

function CrumbLink({ c, onNavigate, accent }: { c: Crumb; onNavigate?: (c: Crumb) => void; accent: string }) {
  return (
    <a
      href={`#${c.path}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate?.(c);
      }}
      className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ color: accent, outlineColor: accent }}
    >
      {c.label}
    </a>
  );
}

function Overflow({ hidden, onNavigate, accent }: { hidden: Crumb[]; onNavigate?: (c: Crumb) => void; accent: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline-flex"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          btn.current?.focus();
        }
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Show ${hidden.length} more level${hidden.length === 1 ? '' : 's'}`}
        onClick={() => setOpen((o) => !o)}
        className="grid h-6 min-w-6 place-items-center rounded-md bg-black/[0.06] px-1.5 font-bold text-black/70 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: accent }}
      >
        …
      </button>
      {open && (
        <ul id={id} className="absolute top-full left-0 z-20 mt-1 min-w-44 rounded-lg border border-black/10 bg-white py-1 text-[13px] shadow-lg">
          {hidden.map((c) => (
            <li key={c.path}>
              <a
                href={`#${c.path}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  onNavigate?.(c);
                }}
                className="block px-3 py-2 hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none"
                style={{ color: accent }}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

export function Breadcrumbs({ items, mode = 'wrap', textSeparators = false, onNavigate, accent = '#1d4ed8', className = '' }: Props) {
  const scroller = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (mode === 'scroll' && scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [mode, items]);

  if (items.length === 0) return null;
  const current = items[items.length - 1];

  if (mode === 'parent' && items.length > 1) {
    const parent = items[items.length - 2];
    return (
      <nav aria-label="Breadcrumb" className={`text-[13px] ${className}`}>
        <a
          href={`#${parent.path}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate?.(parent);
          }}
          className="inline-flex min-h-6 max-w-full items-center gap-0.5 rounded-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: accent, outlineColor: accent }}
        >
          <ChevronLeft size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            <span className="sr-only">Back to </span>
            {parent.label}
          </span>
        </a>
      </nav>
    );
  }

  const collapse = mode === 'collapse' && items.length > 3;
  const visible: (Crumb | 'more')[] = collapse ? [items[0], 'more', ...items.slice(-2)] : items;
  const hidden = collapse ? items.slice(1, -2) : [];

  return (
    <nav aria-label="Breadcrumb" className={`relative text-[13px] ${className}`}>
      <ol
        ref={scroller}
        className={`flex items-center gap-y-1 ${mode === 'scroll' ? 'overflow-x-auto whitespace-nowrap pb-1' : 'flex-wrap'}`}
      >
        {visible.map((c, i) => (
          <li key={c === 'more' ? 'more' : c.path} className={`flex min-w-0 items-center ${mode === 'scroll' ? 'shrink-0' : ''}`}>
            {i > 0 && <Sep text={textSeparators} />}
            {c === 'more' ? (
              <Overflow hidden={hidden} onNavigate={onNavigate} accent={accent} />
            ) : c === current ? (
              <span aria-current="page" className={`min-w-0 font-semibold text-black/80 ${mode === 'scroll' ? '' : 'line-clamp-2'}`}>
                {c.label}
              </span>
            ) : (
              <CrumbLink c={c} onNavigate={onNavigate} accent={accent} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** What a screen reader would announce for the trail, in reading order. */
export function announce(items: Crumb[], mode: SmallScreen, textSeparators: boolean): string[] {
  if (items.length === 0) return [];
  const out = ['Breadcrumb, navigation'];
  if (mode === 'parent' && items.length > 1) {
    out.push(`Back to ${items[items.length - 2].label}, link`);
    return out;
  }
  const collapse = mode === 'collapse' && items.length > 3;
  const visible: (Crumb | 'more')[] = collapse ? [items[0], 'more', ...items.slice(-2)] : items;
  out.push(`list, ${visible.length} items`);
  visible.forEach((c, i) => {
    if (i > 0 && textSeparators) out.push('slash');
    if (c === 'more') {
      const n = items.length - 3;
      out.push(`Show ${n} more level${n === 1 ? '' : 's'}, button, collapsed`);
    } else if (i === visible.length - 1) out.push(`${c.label}, current page`);
    else out.push(`${c.label}, link`);
  });
  out.push('end of list');
  return out;
}
