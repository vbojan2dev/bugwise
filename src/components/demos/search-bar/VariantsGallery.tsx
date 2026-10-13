import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpLeft, CircleX, History, Menu, Search, X } from 'lucide-react';
import { IOSSearchField, fold } from './SearchBar';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: string; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface">
      {/* Every example gets the same screen height so they can be compared side by side. */}
      <div className="h-[22rem] rounded-t-2xl px-4 py-5" style={{ background: bg, color: '#000', colorScheme: 'light' }}>
        <div className="mx-auto h-full w-full max-w-[18rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

/* ---------- iOS: live filtering + scope bar ---------- */
const recipes = [
  { name: 'Spaghetti carbonara', scope: 'Mains' },
  { name: 'Chicken tikka masala', scope: 'Mains' },
  { name: 'Pad thai', scope: 'Mains' },
  { name: 'Crème brûlée', scope: 'Desserts' },
  { name: 'Tiramisu', scope: 'Desserts' },
  { name: 'Apple crumble', scope: 'Desserts' },
];
const scopes = ['All', 'Mains', 'Desserts'] as const;

function IOSDemo() {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(false);
  const [scope, setScope] = useState<(typeof scopes)[number]>('All');
  const input = useRef<HTMLInputElement>(null);
  const list = recipes.filter((r) => (scope === 'All' || r.scope === scope) && fold(r.name).includes(fold(q)));
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-3 shadow-sm">
      {/* Large title: collapses (animated) while searching so the field moves up, like iOS. */}
      <div className="grid transition-[grid-template-rows,opacity] duration-300 ease-out" style={{ gridTemplateRows: active ? '0fr' : '1fr', opacity: active ? 0 : 1 }} aria-hidden={active}>
        <p className="overflow-hidden pb-2 text-[30px] leading-tight font-bold tracking-tight">Recipes</p>
      </div>
      <IOSSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => input.current?.blur()}
        onFocus={() => setActive(true)}
        active={active}
        onCancel={() => {
          setQ('');
          setScope('All');
          setActive(false);
          input.current?.blur();
        }}
        placeholder="Search recipes"
        inputRef={input}
      />
      {active && (
        <div role="radiogroup" aria-label="Search scope" className="mt-2 flex rounded-[9px] p-[2px] text-[13px]" style={{ background: 'rgba(118,118,128,.12)' }}>
          {scopes.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={scope === s}
              onClick={() => setScope(s)}
              className={`flex-1 rounded-[7px] py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50 ${scope === s ? 'bg-white font-semibold shadow-sm' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-2 min-h-0 flex-1 divide-y divide-black/10 overflow-y-auto text-[15px]">
        {list.map((r) => (
          <li key={r.name} className="py-1.5">
            {r.name}
          </li>
        ))}
        {list.length === 0 && (
          <li className="pt-5 text-center">
            <p className="font-semibold">No Results for “{q.trim()}”</p>
            <p className="text-[13px] text-[rgba(60,60,67,.6)]">Check the spelling or try a new search.</p>
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- Material 3: search bar that expands into a search view ---------- */
const mails = [
  { from: 'Ana', subject: 'Flight to Lisbon: boarding pass' },
  { from: 'FoodNow', subject: 'Your pizza is on its way' },
  { from: 'Marko', subject: 'Photos from the hike' },
  { from: 'Bank', subject: 'Monthly statement' },
];

function MaterialDemo() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [history, setHistory] = useState(['boarding pass', 'invoice', 'pizza']);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setQ(t);
    setSubmitted(t);
    setHistory((h) => [t, ...h.filter((x) => fold(x) !== fold(t))].slice(0, 4));
    setOpen(false);
  };
  const close = () => {
    setOpen(false);
    setQ(submitted);
    setTimeout(() => opener.current?.focus(), 0);
  };
  const shown = submitted ? mails.filter((m) => fold(`${m.from} ${m.subject}`).includes(fold(submitted))) : mails;
  const suggestions = q.trim() ? mails.map((m) => m.subject).filter((s) => fold(s).includes(fold(q))) : [];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#fef7ff] text-[#1d1b20]">
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex h-14 items-center gap-1 rounded-full bg-[#ece6f0] pr-2 pl-1">
          {submitted ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSubmitted('');
                setQ('');
              }}
              className="grid size-12 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
            >
              <ArrowLeft size={22} className="text-[#49454f]" />
            </button>
          ) : (
            <span className="grid size-12 place-items-center">
              <Menu size={22} className="text-[#49454f]" aria-hidden="true" />
            </span>
          )}
          <button ref={opener} type="button" onClick={() => setOpen(true)} className="h-full min-w-0 flex-1 truncate rounded-full text-left text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]">
            {submitted ? <span>{submitted}</span> : <span className="text-[#49454f]">Search in mail</span>}
          </button>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#6750a4] text-[13px] font-semibold text-white" aria-hidden="true">
            A
          </span>
        </div>
        <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {shown.map((m) => (
            <li key={m.subject} className="rounded-xl bg-white px-3 py-1.5">
              <p className="text-[13px] font-semibold">{m.from}</p>
              <p className="truncate text-[12px] text-[#49454f]">{m.subject}</p>
            </li>
          ))}
          {shown.length === 0 && <li className="pt-6 text-center text-[13px] text-[#49454f]">No messages match “{submitted}”</li>}
        </ul>
      </div>

      {open && (
        <div className="absolute inset-0 z-10 flex flex-col bg-[#ece6f0]" role="dialog" aria-label="Search in mail">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submit(q);
            }}
            className="flex h-14 shrink-0 items-center gap-1 px-1"
          >
            <button type="button" aria-label="Back" onClick={close} className="grid size-12 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]">
              <ArrowLeft size={22} className="text-[#49454f]" />
            </button>
            <input
              ref={input}
              type="search"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search in mail"
              placeholder="Search in mail"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
              className="h-full w-0 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#49454f] [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear text"
                onClick={() => {
                  setQ('');
                  input.current?.focus();
                }}
                className="grid size-12 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
              >
                <X size={22} className="text-[#49454f]" />
              </button>
            )}
          </form>
          <div className="h-px bg-[#cac4d0]" />
          <ul className="min-h-0 flex-1 overflow-y-auto py-1 text-[15px]">
            {(q.trim() ? suggestions : history).map((s) => (
              <li key={s} className="flex items-center">
                <button type="button" onClick={() => submit(s)} className="flex min-w-0 flex-1 items-center gap-4 px-4 py-2.5 text-left outline-none focus-visible:bg-black/5">
                  {q.trim() ? <Search size={20} className="shrink-0 text-[#49454f]" aria-hidden="true" /> : <History size={20} className="shrink-0 text-[#49454f]" aria-hidden="true" />}
                  <span className="truncate">{s}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Use “${s}” as search text`}
                  onClick={() => {
                    setQ(s + ' ');
                    input.current?.focus();
                  }}
                  className="mr-2 grid size-10 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
                >
                  <ArrowUpLeft size={18} className="text-[#49454f]" />
                </button>
              </li>
            ))}
            {q.trim() !== '' && suggestions.length === 0 && <li className="px-4 py-3 text-[14px] text-[#49454f]">Press Enter to search for “{q.trim()}”</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Web: labeled search form with a suggestion listbox ---------- */
const articles = [
  { title: 'Track my order', text: 'See where your parcel is and when it arrives.' },
  { title: 'Return an item', text: 'Start a return within 30 days and print the label.' },
  { title: 'Refund status', text: 'How long refunds take and where to see them.' },
  { title: 'Change delivery address', text: 'Update the address before the order ships.' },
  { title: 'Cancel my order', text: 'Cancel for free until the order is packed.' },
  { title: 'Payment methods', text: 'Cards, PayPal and gift cards we accept.' },
  { title: 'Gift cards', text: 'Buy, redeem and check a gift card balance.' },
  { title: 'Order never arrived', text: 'What to do if tracking says delivered but it isn\'t.' },
];

function WebDemo() {
  const id = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [result, setResult] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Suggestions use the same matching as the search itself (title + text), with title matches first,
  // so a word that finds articles never shows "no suggestions".
  const matches = q.trim()
    ? [...articles.filter((a) => fold(a.title).includes(fold(q))), ...articles.filter((a) => !fold(a.title).includes(fold(q)) && fold(a.text).includes(fold(q)))]
        .map((a) => a.title)
        .slice(0, 5)
    : [];
  const expanded = open && matches.length > 0;
  const found = result === null ? [] : articles.filter((a) => fold(`${a.title} ${a.text}`).includes(fold(result)));
  const count = found.length;

  const submit = (text: string) => {
    const t = text.trim();
    setOpen(false);
    setHi(-1);
    if (!t) {
      input.current?.focus();
      return;
    }
    setQ(t);
    setResult(t);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && matches.length) {
      e.preventDefault();
      setOpen(true);
      setHi((h) => (h + 1) % matches.length);
    } else if (e.key === 'ArrowUp' && matches.length) {
      e.preventDefault();
      setHi((h) => (h <= 0 ? matches.length - 1 : h - 1));
    } else if (e.key === 'Enter' && expanded && hi >= 0) {
      e.preventDefault();
      submit(matches[hi]);
    } else if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
        setHi(-1);
      }
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-3 text-[#111827]">
      <p className="mb-2 text-[15px] font-bold">Help center</p>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="relative"
      >
        <label htmlFor={`${id}-q`} className="mb-1 block text-[13px] font-medium text-[#374151]">
          Search help articles
        </label>
        <div className="flex gap-1.5">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-2.5 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/30">
            <Search size={16} className="shrink-0 text-[#6b7280]" aria-hidden="true" />
            <input
              ref={input}
              id={`${id}-q`}
              type="search"
              role="combobox"
              aria-expanded={expanded}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={expanded && hi >= 0 ? `${id}-opt-${hi}` : undefined}
              autoComplete="off"
              enterKeyHint="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setHi(-1);
              }}
              onKeyDown={onKey}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              placeholder="e.g. refund"
              className="w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQ('');
                  setResult(null);
                  input.current?.focus();
                }}
                className="grid size-6 shrink-0 place-items-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
              >
                <CircleX size={16} className="text-[#6b7280]" />
              </button>
            )}
          </div>
          <button type="submit" className="h-10 shrink-0 rounded-lg bg-[#2563eb] px-3 text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/50 focus-visible:ring-offset-2">
            Search
          </button>
        </div>
        <ul id={`${id}-list`} role="listbox" aria-label="Suggestions" hidden={!expanded} className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit(m)}
              onMouseEnter={() => setHi(i)}
              className={`cursor-pointer px-3 py-1.5 text-[14px] ${i === hi ? 'bg-[#eff6ff] text-[#1d4ed8]' : ''}`}
            >
              {m}
            </li>
          ))}
        </ul>
      </form>
      <p className="mt-3 shrink-0 text-[13px] text-[#4b5563]" aria-live="polite">
        {result !== null && (
          <>
            {count > 0 ? (
              <>
                {count} article{count === 1 ? '' : 's'} for <strong className="text-[#111827]">“{result}”</strong>
              </>
            ) : (
              <>
                No articles match <strong className="text-[#111827]">“{result}”</strong>. Try a different word, like “refund”.
              </>
            )}
          </>
        )}
        {result === null && 'Type a question and press Search.'}
      </p>
      {count > 0 && (
        <ul aria-label="Search results" className="mt-2 min-h-0 flex-1 divide-y divide-[#e5e7eb] overflow-y-auto">
          {found.map((a) => (
            <li key={a.title} className="py-1.5">
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[14px] font-semibold text-[#1d4ed8] underline-offset-2 outline-none hover:underline focus-visible:underline">
                {a.title}
              </a>
              <p className="text-[12px] leading-snug text-[#4b5563]">{a.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Web: icon that expands into a field ---------- */
function ExpandDemo() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const close = () => {
    setOpen(false);
    setQ('');
    setTimeout(() => btn.current?.focus(), 0);
  };
  return (
    <div className="h-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-[#111827]">
      <div className="flex h-12 items-center gap-2 border-b border-[#e5e7eb] px-3">
        {open ? (
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex min-w-0 flex-1 items-center gap-2">
            <Search size={18} className="shrink-0 text-[#6b7280]" aria-hidden="true" />
            <input
              ref={input}
              type="search"
              aria-label="Search the shop"
              placeholder="Search the shop"
              enterKeyHint="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
              className="h-9 w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" aria-label="Close search" onClick={close} className="grid size-9 shrink-0 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2563eb]">
              <X size={18} />
            </button>
          </form>
        ) : (
          <>
            <span className="flex-1 text-[16px] font-extrabold tracking-tight">SHOPLY</span>
            <button
              ref={btn}
              type="button"
              aria-label="Search"
              aria-expanded={false}
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2563eb]"
            >
              <Search size={18} />
            </button>
          </>
        )}
      </div>
      {/* Placeholder page content (a product grid), so the header sits on a realistic page. */}
      <div aria-hidden="true" className="p-3">
        <div className="mb-3 h-3 w-1/2 rounded bg-[#e5e7eb]" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-[4.5rem] rounded-lg bg-[#f3f4f6]" />
              <div className="h-2.5 w-4/5 rounded bg-[#f3f4f6]" />
              <div className="h-2.5 w-2/5 rounded bg-[#e5e7eb]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">All four work correctly. Type, clear, cancel, and try them with only the keyboard (Tab, arrows, Enter, Esc).</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="iOS search bar" platform="iOS" note="Tap the field: the large “Recipes” title slides away to make room, and Cancel and a scope bar (All / Mains / Desserts) appear. The list filters as you type. Like on iOS, Cancel stays even after the keyboard closes; tapping it clears the text and scope and brings the title back.">
          <IOSDemo />
        </Demo>
        <Demo title="Search bar → search view" platform="Android · Material 3" bg="#fef7ff" note="The pill-shaped bar opens a full search view with history. The ↖ arrow copies a suggestion into the field so you can refine it. Back (or Esc) closes the view.">
          <MaterialDemo />
        </Demo>
        <Demo title="Labeled search form" platform="Web" bg="#f9fafb" note="A real form with role=search, a visible label, a submit button and a suggestion listbox. Arrow keys move through suggestions, Esc closes them. Search shows the matching articles and announces how many were found.">
          <WebDemo />
        </Demo>
        <Demo title="Expandable search" platform="Web · mobile headers" bg="#f9fafb" note="An icon that turns into a field to save space. Focus must jump into the field on open and back to the icon when it closes.">
          <ExpandDemo />
        </Demo>
      </div>
    </div>
  );
}
