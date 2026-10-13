import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, CheckCircle2, Info } from 'lucide-react';

/* A chip row "lab": layout (wrap vs scroll), scroll hints, selected style, greyscale, screen width and badges. */

const chips = [
  { l: 'Open now', c: 31 },
  { l: 'Free delivery', c: 12 },
  { l: '4.5+ rating', c: 18 },
  { l: 'Under 30 min', c: 22 },
  { l: 'Offers', c: 7 },
  { l: 'Vegan', c: 9 },
  { l: 'Pizza', c: 6 },
  { l: 'Sushi', c: 4 },
  { l: 'Burgers', c: 8 },
  { l: 'Halal', c: 5 },
];

type Layout = 'scroll' | 'wrap';
type Hint = 'none' | 'peek' | 'fade';
type Sel = 'color' | 'check';

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

function Pills<T extends string | number>({ value, options, onChange, render }: { value: T; options: readonly T[]; onChange: (v: T) => void; render: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 whitespace-nowrap ${value === o ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

export default function Playground() {
  const [layout, setLayout] = useState<Layout>('scroll');
  const [hint, setHint] = useState<Hint>('none');
  const [sel, setSel] = useState<Sel>('color');
  const [grey, setGrey] = useState(false);
  const [badges, setBadges] = useState(false);
  const [width, setWidth] = useState(320);
  const [selected, setSelected] = useState<string[]>(['Open now', 'Halal']);
  const [cut, setCut] = useState<number | null>(null);
  const [off, setOff] = useState({ hidden: 0, selHidden: 0, atEnd: false });
  const row = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const r = row.current;
    if (!r) return;
    const kids = Array.from(r.querySelectorAll<HTMLElement>('[data-chip]'));
    const L = r.scrollLeft;
    const R = r.scrollLeft + r.clientWidth;
    let hidden = 0;
    let selHidden = 0;
    if (layout === 'scroll') {
      for (const k of kids) {
        const a = k.offsetLeft;
        const b = a + k.offsetWidth;
        if (a < L - 1 || b > R + 1) {
          hidden++;
          if (k.dataset.selected === 'true') selHidden++;
        }
      }
    }
    const atEnd = r.scrollLeft + r.clientWidth >= r.scrollWidth - 2;
    setOff((p) => (p.hidden === hidden && p.selHidden === selHidden && p.atEnd === atEnd ? p : { hidden, selHidden, atEnd }));
  }, [layout]);

  // "No hint" = the row happens to end exactly between two chips, so it looks complete.
  useLayoutEffect(() => {
    const r = row.current;
    const s = screen.current;
    if (!r || !s) return;
    if (layout !== 'scroll' || hint !== 'none') {
      setCut((c) => (c === null ? c : null));
      return;
    }
    const avail = s.clientWidth;
    let best = 0;
    for (const k of Array.from(r.querySelectorAll<HTMLElement>('[data-chip]'))) {
      const b = k.offsetLeft + k.offsetWidth;
      if (b <= avail - 12) best = Math.max(best, b);
    }
    const next = best ? best + 2 : null;
    setCut((c) => (c === next ? c : next));
  }, [layout, hint, sel, badges, width, selected]);

  useEffect(() => {
    measure();
  });

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  const toggle = (l: string) => setSelected((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const issues: { kind: 'warn' | 'info'; text: string }[] = [];
  if (sel === 'color' && grey) issues.push({ kind: 'warn', text: 'In greyscale the selected chips look exactly like the others. Selection must not rely on color alone (WCAG 1.4.1). Add a checkmark or a clear fill/outline change.' });
  else if (sel === 'color') issues.push({ kind: 'warn', text: 'Selected chips differ only by color. Turn on greyscale to see what color-blind users (and anyone in bright sunlight) see.' });
  if (layout === 'scroll' && hint === 'none' && off.hidden > 0) issues.push({ kind: 'warn', text: `${off.hidden} chip${off.hidden === 1 ? ' is' : 's are'} off-screen, but the row ends cleanly, so it looks complete. Many users will never discover them.` });
  if (layout === 'scroll' && off.selHidden > 0) issues.push({ kind: 'warn', text: `${off.selHidden} selected filter${off.selHidden === 1 ? ' is' : 's are'} scrolled out of view. Users may not realize why the list is so short. Show active filters first or add a "Clear all".` });
  if (layout === 'scroll' && hint !== 'none') issues.push({ kind: 'info', text: 'Can you reach the last chip with a mouse? Without a visible scrollbar, desktop users need Shift + wheel or a trackpad. Consider arrow buttons on the web.' });
  if (layout === 'wrap') issues.push({ kind: 'info', text: 'Wrapping shows every chip, but the row grows with each new filter and pushes the results down. Check small screens and large text.' });
  if (badges) issues.push({ kind: 'info', text: 'Counts must update when other chips change, including when a chip is deselected. Test 0, 1 and 99+.' });

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Chip row lab</p>
        <p className="text-sm text-muted">Restaurant filters on a phone. Change the layout and the hints, toggle greyscale, and scroll the row to its end.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Overflow">
            <Pills value={layout} options={['scroll', 'wrap'] as const} onChange={setLayout} render={(v) => (v === 'scroll' ? 'Scroll row' : 'Wrap')} />
          </Control>
          {layout === 'scroll' && (
            <Control label="Scroll hint">
              <Pills value={hint} options={['none', 'peek', 'fade'] as const} onChange={setHint} render={(v) => (v === 'none' ? 'None' : v === 'peek' ? 'Peek' : 'Fade + peek')} />
            </Control>
          )}
          <Control label="Selected style">
            <Pills value={sel} options={['color', 'check'] as const} onChange={setSel} render={(v) => (v === 'color' ? 'Color only' : 'Fill + checkmark')} />
          </Control>
          <Control label="Screen width">
            <Pills value={width} options={[320, 360, 412] as const} onChange={setWidth} render={(v) => `${v}px`} />
          </Control>
          <label className="flex items-center justify-between text-sm font-medium">
            Greyscale (color filter)
            <input type="checkbox" checked={grey} onChange={(e) => setGrey(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between text-sm font-medium">
            Count badges
            <input type="checkbox" checked={badges} onChange={(e) => setBadges(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid place-items-center bg-subtle px-2 py-8">
            <div
              ref={screen}
              className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10"
              style={{ width, maxWidth: '100%', background: '#fff', color: '#1d1b20', colorScheme: 'light', filter: grey ? 'grayscale(1)' : undefined }}
            >
              <div className="px-4 pt-4 pb-2 text-[18px] font-bold">Restaurants</div>
              <div className="relative">
                <div
                  ref={row}
                  role="group"
                  aria-label="Filters"
                  onScroll={measure}
                  className={`relative flex gap-2 px-4 pb-3 ${layout === 'wrap' ? 'flex-wrap' : 'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'} ${cut ? 'pr-0' : ''}`}
                  style={cut ? { width: cut } : undefined}
                >
                  {chips.map(({ l, c }) => {
                    const on = selected.includes(l);
                    const colourOnly = sel === 'color';
                    return (
                      <button
                        key={l}
                        data-chip
                        data-selected={on}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(l)}
                        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg text-[14px] font-medium whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6750a4] ${on && !colourOnly ? 'pl-2' : 'pl-3.5'} pr-3.5`}
                        style={
                          colourOnly
                            ? { background: on ? '#ffdad6' : '#e2e2e2', color: on ? '#8c1d18' : '#343434' }
                            : { background: on ? '#e8def8' : '#fff', color: on ? '#1d192b' : '#49454f', boxShadow: on ? 'none' : 'inset 0 0 0 1px #79747e' }
                        }
                      >
                        {on && !colourOnly && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                        {l}
                        {badges && (
                          <span className="rounded-full bg-black/[0.07] px-1.5 text-[11px] leading-[18px] font-semibold tabular-nums" aria-hidden="true">
                            {c}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {layout === 'scroll' && hint === 'fade' && !off.atEnd && (
                  <span className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-2 px-4 pt-1 pb-4">
                {['Luigi’s Pizzeria', 'Sakura Sushi Bar', 'Green Bowl'].map((n, i) => (
                  <div key={n} className="flex items-center gap-3 rounded-xl bg-[#f6f2fa] p-2">
                    <span className="size-9 shrink-0 rounded-lg" style={{ background: ['#fecaca', '#bfdbfe', '#bbf7d0'][i] }} />
                    <span className="min-w-0 truncate text-[13px] font-semibold">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Visible / total</p>
              <p className="text-[13px] tabular-nums">
                {chips.length - off.hidden} fully visible of {chips.length} chips · {selected.length} selected
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Screen reader hears</p>
              <p className="text-[13px] break-words">“Open now, toggle button, {selected.includes('Open now') ? 'selected' : 'not selected'}”</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t.text} className="flex items-start gap-2 text-sm text-fg">
                  {t.kind === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-brand" />} <span className="min-w-0">{t.text}</span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Looks fine. Now try the 320px screen with no hint.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
