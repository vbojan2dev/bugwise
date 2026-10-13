import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, CircleAlert, Search, X } from 'lucide-react';

export interface Opt {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Case-, accent- and space-insensitive form of a string, for searching. "  České " → "ceske". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Close a popup when the user presses outside `ref`. */
export function useOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, onOutside: () => void) {
  const cb = useRef(onOutside);
  cb.current = onOutside;
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open, ref]);
}

const nextEnabled = (opts: Opt[], from: number, dir: 1 | -1) => {
  for (let j = from + dir; j >= 0 && j < opts.length; j += dir) if (!opts[j].disabled) return j;
  return from;
};
const firstEnabled = (opts: Opt[]) => opts.findIndex((o) => !o.disabled);
const lastEnabled = (opts: Opt[]) => {
  for (let j = opts.length - 1; j >= 0; j--) if (!opts[j].disabled) return j;
  return -1;
};

export type SelectVariant = 'web' | 'material';

const theme = {
  web: { accent: '#2563eb', text: '#18181b', sub: '#52525b', faint: '#a1a1aa', line: '#d0d5dd', error: '#dc2626', menu: '#fff', active: '#eff6ff', selected: '#2563eb', optH: 36, radius: 8 },
  material: { accent: '#6750a4', text: '#1d1b20', sub: '#49454f', faint: '#79747e', line: '#79747e', error: '#b3261e', menu: '#f3edf7', active: 'rgba(29,27,32,.08)', selected: '#e8def8', optH: 48, radius: 4 },
};

interface SelectProps {
  label: string;
  options: Opt[];
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  variant?: SelectVariant;
  helper?: string;
  error?: string;
  disabled?: boolean;
  /** Max options visible before the menu scrolls. */
  maxVisible?: number;
  /** Open upwards when there is not enough room below. Set false to reproduce clipping bugs. */
  flip?: boolean;
  /** Render the menu open, in the page flow (for static illustrations). */
  staticOpen?: boolean;
  /** Background behind the field (Material label cut-out). */
  surface?: string;
}

/** An accessible custom "select-only combobox" (WAI-ARIA APG pattern). */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  variant = 'web',
  helper,
  error,
  disabled = false,
  maxVisible = 6,
  flip = true,
  staticOpen = false,
  surface = '#fff',
}: SelectProps) {
  const id = useId();
  const t = theme[variant];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [up, setUp] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ s: '', at: 0 });
  const sel = options.findIndex((o) => o.value === value);
  const isOpen = open || staticOpen;
  const menuH = Math.min(options.length, maxVisible) * t.optH + 8;

  useOutside(wrap, open, () => setOpen(false));

  useEffect(() => {
    if (!open || active < 0) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    const l = list.current;
    if (el && l) {
      if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop - 4;
      else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 4;
    }
  }, [open, active]);

  const openMenu = (start?: number) => {
    if (disabled) return;
    const r = trigger.current?.getBoundingClientRect();
    if (r && flip) {
      const below = window.innerHeight - r.bottom;
      setUp(below < menuH + 8 && r.top > below);
    } else setUp(false);
    setActive(start ?? (sel >= 0 ? sel : firstEnabled(options)));
    setOpen(true);
  };
  const choose = (i: number) => {
    if (i < 0 || options[i]?.disabled) return;
    onChange?.(options[i].value);
    setOpen(false);
    trigger.current?.focus();
  };
  const typeahead = (ch: string) => {
    const now = Date.now();
    typed.current = { s: now - typed.current.at > 600 ? ch : typed.current.s + ch, at: now };
    const q = normalize(typed.current.s);
    const start = typed.current.s.length === 1 ? active + 1 : active;
    for (let n = 0; n < options.length; n++) {
      const j = (Math.max(start, 0) + n) % options.length;
      if (!options[j].disabled && normalize(options[j].label).startsWith(q)) return j;
    }
    return -1;
  };

  const onKey = (e: KeyboardEvent) => {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
        e.preventDefault();
        openMenu();
      } else if (k.length === 1 && /\S/.test(k)) {
        const j = typeahead(k);
        if (j >= 0) openMenu(j);
      }
      return;
    }
    if (k === 'ArrowDown') setActive((a) => nextEnabled(options, a, 1));
    else if (k === 'ArrowUp') setActive((a) => nextEnabled(options, a, -1));
    else if (k === 'Home') setActive(firstEnabled(options));
    else if (k === 'End') setActive(lastEnabled(options));
    else if (k === 'Enter' || k === ' ') choose(active);
    else if (k === 'Escape') setOpen(false);
    else if (k === 'Tab') {
      setOpen(false);
      return;
    } else if (k.length === 1 && /\S/.test(k)) {
      const j = typeahead(k);
      if (j >= 0) setActive(j);
      return;
    } else return;
    e.preventDefault();
  };

  const material = variant === 'material';
  const floated = isOpen || sel >= 0;
  const borderColor = error ? t.error : isOpen ? t.accent : t.line;
  const labelId = `${id}-label`;
  const listId = `${id}-list`;

  return (
    <div className="relative" ref={wrap} style={{ color: t.text, opacity: disabled ? 0.45 : 1 }}>
      {!material && (
        <span id={labelId} className="mb-1.5 block text-sm font-medium" onClick={() => trigger.current?.focus()}>
          {label}
        </span>
      )}
      <div className="relative">
      <div
        ref={trigger}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open && active >= 0 ? `${id}-o${active}` : undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={helper || error ? `${id}-help` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
        className={`relative flex cursor-pointer items-center gap-2 outline-none select-none ${disabled ? 'cursor-not-allowed' : ''}`}
        style={{
          minHeight: material ? 56 : 42,
          paddingInline: material ? 16 : 12,
          borderRadius: t.radius,
          border: `1px solid ${borderColor}`,
          boxShadow: isOpen ? (material ? `inset 0 0 0 1px ${t.accent}` : `0 0 0 3px ${t.accent}33`) : undefined,
          background: material ? 'transparent' : '#fff',
        }}
      >
        {material && (
          <span
            id={labelId}
            className="pointer-events-none absolute whitespace-nowrap transition-all duration-150"
            style={floated ? { left: 12, top: 0, transform: 'translateY(-50%)', fontSize: 12, padding: '0 4px', background: surface, color: error ? t.error : isOpen ? t.accent : t.sub } : { left: 16, top: 16, fontSize: 16, color: t.sub }}
          >
            {label}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate" style={{ fontSize: material ? 16 : 15, color: sel >= 0 ? t.text : t.faint }}>
          {sel >= 0 ? options[sel].label : material ? '' : placeholder}
        </span>
        <ChevronDown size={material ? 22 : 18} className="shrink-0 transition-transform" style={{ color: t.sub, transform: isOpen ? 'rotate(180deg)' : undefined }} aria-hidden />
      </div>
      {isOpen && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className={`${staticOpen ? 'relative mt-1' : `absolute inset-x-0 z-30 ${up ? 'bottom-full mb-1' : 'top-full mt-1'}`} overflow-y-auto py-1`}
          style={{
            maxHeight: menuH,
            background: t.menu,
            borderRadius: material ? 4 : 10,
            boxShadow: material ? '0 2px 6px 2px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.3)' : '0 12px 32px -8px rgba(16,24,40,.25), 0 0 0 1px rgba(16,24,40,.08)',
          }}
        >
          {options.map((o, i) => {
            const isSel = i === sel;
            const isActive = i === active && !staticOpen;
            return (
              <li
                key={o.value}
                id={`${id}-o${i}`}
                data-i={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className="mx-1 flex cursor-pointer items-center gap-2 px-3"
                style={{
                  minHeight: t.optH,
                  borderRadius: material ? 0 : 6,
                  marginInline: material ? 0 : 4,
                  fontSize: material ? 15 : 14,
                  fontWeight: isSel && !material ? 600 : 400,
                  background: isSel && material ? t.selected : isActive ? t.active : undefined,
                  outline: isActive && !material ? `2px solid ${t.accent}55` : undefined,
                  outlineOffset: -2,
                  opacity: o.disabled ? 0.4 : 1,
                  cursor: o.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {isSel && !material && <Check size={16} style={{ color: t.selected }} aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
      </div>
      {(helper || error) && (
        <p id={`${id}-help`} className="mt-1.5 flex items-start gap-1 text-[13px]" style={{ color: error ? t.error : t.sub, paddingInline: material ? 16 : 0, fontSize: material ? 12 : 13 }}>
          {error && !material && <CircleAlert size={14} className="mt-[2px] shrink-0" aria-hidden />}
          {error ?? helper}
        </p>
      )}
    </div>
  );
}

interface ComboProps {
  label: string;
  options: Opt[];
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  /** How options are matched against the query. Defaults to a case- and accent-insensitive "contains". */
  filter?: (label: string, query: string) => boolean;
  maxVisible?: number;
}

const defaultFilter = (label: string, q: string) => normalize(label).includes(normalize(q));

/** An editable combobox with list autocomplete (type to filter, then pick). */
export function Combobox({ label, options, value, onChange, placeholder = 'Type to search…', helper, error, filter = defaultFilter, maxVisible = 6 }: ComboProps) {
  const id = useId();
  const t = theme.web;
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // Keep the text in sync when the value is changed from outside.
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    if (!typing) setQuery(selected?.label ?? '');
  }

  const q = typing ? query : '';
  const results = q.trim()
    ? options
        .filter((o) => filter(o.label, q))
        .sort((a, b) => Number(normalize(b.label).startsWith(normalize(q))) - Number(normalize(a.label).startsWith(normalize(q))))
    : options;

  const close = () => {
    setOpen(false);
    setTyping(false);
    setQuery(selected?.label ?? '');
  };
  useOutside(wrap, open, close);

  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    const l = list.current;
    if (el && l) {
      if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop - 4;
      else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 4;
    }
  }, [active, open]);

  const choose = (o: Opt | undefined) => {
    if (!o || o.disabled) return;
    onChange?.(o.value);
    setQuery(o.label);
    setTyping(false);
    setOpen(false);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
      } else setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === 'Escape') {
      if (open) close();
      else if (query) {
        setQuery('');
        setTyping(true);
      }
    } else if (e.key === 'Tab') {
      if (open) close();
    }
  };

  return (
    <div className="relative" ref={wrap} style={{ color: t.text }}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div
        className="flex h-[42px] items-center gap-2 rounded-lg border bg-white px-3"
        style={{ borderColor: error ? t.error : open ? t.accent : t.line, boxShadow: open ? `0 0 0 3px ${t.accent}33` : undefined }}
      >
        <Search size={16} className="shrink-0" style={{ color: t.sub }} aria-hidden />
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && results[active] ? `${id}-o${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={helper || error ? `${id}-help` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setTyping(true);
            setOpen(true);
            setActive(0);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKey}
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#a1a1aa]"
        />
        {query && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setQuery('');
              setTyping(true);
              setOpen(true);
              setActive(0);
              input.current?.focus();
            }}
            className="-m-1 grid size-7 shrink-0 place-items-center rounded-full text-[#71717a] hover:bg-black/5"
          >
            <X size={15} />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close list' : 'Open list'}
          onClick={() => {
            if (open) close();
            else {
              setOpen(true);
              setActive(0);
              input.current?.focus();
            }
          }}
          className="-mr-1 grid size-7 shrink-0 place-items-center"
          style={{ color: t.sub }}
        >
          <ChevronDown size={18} className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      {(helper || error) && (
        <p id={`${id}-help`} className="mt-1.5 flex items-start gap-1 text-[13px]" style={{ color: error ? t.error : t.sub }}>
          {error && <CircleAlert size={14} className="mt-[2px] shrink-0" aria-hidden />}
          {error ?? helper}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {open && typing ? `${results.length} result${results.length === 1 ? '' : 's'}` : ''}
      </span>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-y-auto rounded-[10px] bg-white py-1"
          style={{ maxHeight: maxVisible * 36 + 8, boxShadow: '0 12px 32px -8px rgba(16,24,40,.25), 0 0 0 1px rgba(16,24,40,.08)' }}
        >
          {results.length === 0 && <li className="px-4 py-2.5 text-[14px] text-[#71717a]">No matches for &quot;{query.trim()}&quot;</li>}
          {results.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              className="mx-1 flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-[14px]"
              style={{ background: i === active ? t.active : undefined, outline: i === active ? `2px solid ${t.accent}55` : undefined, outlineOffset: -2, fontWeight: o.value === value ? 600 : 400 }}
            >
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.value === value && <Check size={16} style={{ color: t.accent }} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Multi-select dropdown: a listbox with checkboxes that stays open while you pick. */
export function MultiSelect({ label, options, value, onChange, placeholder = 'Select…' }: { label: string; options: Opt[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const id = useId();
  const t = theme.web;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLDivElement>(null);
  useOutside(wrap, open, () => setOpen(false));

  const toggle = (i: number) => {
    const v = options[i].value;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : options.filter((o) => o.value === v || value.includes(o.value)).map((o) => o.value));
  };
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
        e.preventDefault();
        setOpen(true);
        setActive(0);
      }
      return;
    }
    if (k === 'ArrowDown') setActive((a) => Math.min(a + 1, options.length - 1));
    else if (k === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
    else if (k === ' ' || k === 'Enter') toggle(active);
    else if (k === 'Escape') setOpen(false);
    else if (k === 'Tab') {
      setOpen(false);
      return;
    } else return;
    e.preventDefault();
  };
  const chosen = options.filter((o) => value.includes(o.value));
  const shown: ReactNode =
    chosen.length === 0 ? (
      <span style={{ color: t.faint }}>{placeholder}</span>
    ) : (
      <span className="flex min-w-0 flex-wrap gap-1">
        {chosen.slice(0, 2).map((o) => (
          <span key={o.value} className="rounded-md bg-[#eff6ff] px-1.5 py-0.5 text-[13px] font-medium text-[#1d4ed8]">
            {o.label}
          </span>
        ))}
        {chosen.length > 2 && <span className="rounded-md bg-[#f4f4f5] px-1.5 py-0.5 text-[13px] font-medium text-[#52525b]">+{chosen.length - 2}</span>}
      </span>
    );

  return (
    <div className="relative" ref={wrap} style={{ color: t.text }}>
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium" onClick={() => trigger.current?.focus()}>
        {label}
      </span>
      <div
        ref={trigger}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label`}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-[15px] outline-none select-none"
        style={{ borderColor: open ? t.accent : t.line, boxShadow: open ? `0 0 0 3px ${t.accent}33` : undefined }}
      >
        <span className="min-w-0 flex-1">{shown}</span>
        <ChevronDown size={18} className="shrink-0 transition-transform" style={{ color: t.sub, transform: open ? 'rotate(180deg)' : undefined }} aria-hidden />
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] bg-white" style={{ boxShadow: '0 12px 32px -8px rgba(16,24,40,.25), 0 0 0 1px rgba(16,24,40,.08)' }}>
          <ul id={`${id}-list`} role="listbox" aria-multiselectable="true" aria-labelledby={`${id}-label`} className="max-h-56 overflow-y-auto py-1">
            {options.map((o, i) => {
              const on = value.includes(o.value);
              return (
                <li
                  key={o.value}
                  id={`${id}-o${i}`}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(i)}
                  className="mx-1 flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 text-[14px]"
                  style={{ background: i === active ? t.active : undefined, outline: i === active ? `2px solid ${t.accent}55` : undefined, outlineOffset: -2 }}
                >
                  <span className="grid size-4 shrink-0 place-items-center rounded-[4px] border" style={{ background: on ? t.accent : '#fff', borderColor: on ? t.accent : '#a1a1aa' }}>
                    {on && <Check size={12} strokeWidth={3} className="text-white" />}
                  </span>
                  {o.label}
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-[#e4e4e7] px-3 py-2 text-[13px]">
            <span className="text-[#71717a]">{value.length} selected</span>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange([])} className="font-medium text-[#2563eb] disabled:opacity-40" disabled={!value.length}>
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A real, native <select>. The browser / OS draws the option list. */
export function NativeSelect({ label, options, value, onChange, placeholder = 'Select…' }: { label: string; options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div className="text-[#18181b]">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[42px] w-full cursor-pointer appearance-none rounded-lg border border-[#d0d5dd] bg-white pr-9 pl-3 text-[15px] outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_#2563eb33]"
          style={{ color: value ? '#18181b' : '#a1a1aa' }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled} style={{ color: '#18181b' }}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#52525b]" aria-hidden />
      </div>
    </div>
  );
}
