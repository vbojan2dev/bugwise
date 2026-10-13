import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Lock,
  Menu,
  Minus,
  Moon,
  PanelLeft,
  Plus,
  RotateCw,
  Share,
  Shield,
  ShoppingBasket,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';

/** "Same page, different browsers": one dark delivery form rendered the way three browsers would draw it. */

type BrowserId = 'chrome' | 'safari' | 'firefox';
type Verdict = 'ok' | 'minor' | 'bug';

const browsers: { id: BrowserId; name: string; os: string; engine: string }[] = [
  { id: 'chrome', name: 'Chrome', os: 'Windows', engine: 'Blink' },
  { id: 'safari', name: 'Safari', os: 'macOS', engine: 'WebKit' },
  { id: 'firefox', name: 'Firefox', os: 'Windows', engine: 'Gecko' },
];

const diffs: { name: string; per: Record<BrowserId, { v: Verdict; text: string }> }[] = [
  {
    name: 'Date input',
    per: {
      chrome: {
        v: 'minor',
        text: 'Chrome shows mm/dd/yyyy segments and a calendar icon. The icon is almost invisible here: the dark page never declares color-scheme: dark, so Chrome draws it in black. A small but real bug.',
      },
      safari: { v: 'ok', text: 'Safari on macOS shows editable segments with no icon; clicking opens a small calendar. Different look, same value: the form always sends 2026-10-24.' },
      firefox: { v: 'ok', text: 'Firefox shows the segments plus its own calendar button and popup. Different look, works fine.' },
    },
  },
  {
    name: 'Dropdown (select)',
    per: {
      chrome: { v: 'ok', text: 'Chrome keeps the site’s dark styling and draws its own arrow. The opened list uses the system style.' },
      safari: {
        v: 'ok',
        text: 'Safari on macOS draws a native pop-up button with a double arrow and ignores most of the site’s styling. Only a bug if the design spec demands a custom look.',
      },
      firefox: { v: 'ok', text: 'Firefox keeps the dark styling with its own arrow icon.' },
    },
  },
  {
    name: 'Scrollbars & page width',
    per: {
      chrome: {
        v: 'bug',
        text: 'Windows shows a classic scrollbar that takes about 15–17 px. The blue promo strip uses width: 100vw, and 100vw includes the scrollbar, so the page is slightly too wide and a horizontal scrollbar appears.',
      },
      safari: { v: 'ok', text: 'macOS uses overlay scrollbars that take no space, so 100vw happens to fit. That’s exactly why this bug is invisible if you only test on a Mac.' },
      firefox: { v: 'bug', text: 'Same as Chrome on Windows: the 100vw strip is wider than the space left next to the classic scrollbar, so the page scrolls sideways.' },
    },
  },
  {
    name: 'Autofill colors',
    per: {
      chrome: { v: 'bug', text: 'Chrome paints autofilled fields light blue. The site forces white text (-webkit-text-fill-color), so name and email turn white on light blue: unreadable.' },
      safari: { v: 'bug', text: 'Safari paints autofilled fields yellow. With the forced white text, the values are almost invisible.' },
      firefox: { v: 'ok', text: 'Firefox tints autofilled fields with a color filter but keeps the dark background, so the text stays readable.' },
    },
  },
  {
    name: 'Font rendering',
    per: {
      chrome: { v: 'ok', text: 'The page uses the system font: Segoe UI on Windows, a bit wider than on a Mac. Fine, as long as nothing wraps or gets cut off.' },
      safari: { v: 'ok', text: 'On a Mac the system font is San Francisco, rendered slightly thinner and smoother. Expected difference.' },
      firefox: { v: 'ok', text: 'Same Segoe UI as Chrome on Windows, with tiny anti-aliasing differences. Expected difference.' },
    },
  },
];

const verdictStyle: Record<Verdict, { label: string; badge: string; pill: string }> = {
  ok: { label: 'Acceptable', badge: '#16a34a', pill: 'bg-ok-soft text-ok' },
  minor: { label: 'Minor bug', badge: '#d97706', pill: 'bg-warn-soft text-warn' },
  bug: { label: 'Bug', badge: '#dc2626', pill: 'bg-danger-soft text-danger' },
};

const WIN_FONT = '"Segoe UI", Tahoma, Arial, sans-serif';
const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const FIREFOX_AUTOFILL_FILTER = 'grayscale(21%) brightness(88%) contrast(161%) invert(10%) sepia(40%) saturate(206%)';

function WindowControls() {
  return (
    <span className="ml-auto flex self-start text-[#3c4043]" aria-hidden="true">
      {[Minus, Square, X].map((I, i) => (
        <span key={i} className="grid h-7 w-8 place-items-center">
          <I size={i === 1 ? 10 : 13} />
        </span>
      ))}
    </span>
  );
}

export function ChromeBar({ url = 'grocer.example.com/checkout', title = 'Checkout · Midnight Grocer' }: { url?: string; title?: string }) {
  return (
    <div className="bg-[#dee1e6] text-[#3c4043]" aria-hidden="true">
      <div className="flex h-9 items-end gap-1 pl-2">
        <span className="flex h-[30px] max-w-[190px] min-w-0 items-center gap-2 rounded-t-lg bg-white px-3 text-[11px]">
          <Moon size={11} className="shrink-0 text-[#2563eb]" />
          <span className="truncate">{title}</span>
          <X size={11} className="shrink-0" />
        </span>
        <Plus size={14} className="mb-2 shrink-0" />
        <WindowControls />
      </div>
      <div className="flex items-center gap-2 bg-white px-2 py-1.5">
        <ArrowLeft size={14} className="shrink-0" />
        <ArrowRight size={14} className="shrink-0 opacity-40" />
        <RotateCw size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1 text-[12px]">
          <SlidersHorizontal size={11} className="shrink-0" />
          <span className="truncate">{url}</span>
        </span>
      </div>
    </div>
  );
}

function SafariBar() {
  return (
    <div className="flex h-11 items-center gap-2.5 border-b border-[#d9d9d9] bg-[#f6f6f6] px-3 text-[#6e6e73]" aria-hidden="true">
      <span className="flex shrink-0 gap-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <PanelLeft size={15} className="hidden shrink-0 sm:block" />
      <ChevronLeft size={16} className="shrink-0" />
      <ChevronRight size={16} className="shrink-0 opacity-40" />
      <span className="mx-auto flex max-w-[260px] min-w-0 flex-1 items-center justify-center gap-1 rounded-md bg-[#e5e5e7] px-2 py-1 text-[12px] text-[#1d1d1f]">
        <Lock size={10} className="shrink-0" />
        <span className="truncate">grocer.example.com</span>
      </span>
      <Share size={14} className="hidden shrink-0 sm:block" />
      <Plus size={15} className="shrink-0" />
    </div>
  );
}

export function FirefoxBar({ url = 'grocer.example.com/checkout', title = 'Checkout · Midnight Grocer' }: { url?: string; title?: string }) {
  return (
    <div className="bg-[#f0f0f4] text-[#15141a]" aria-hidden="true">
      <div className="flex h-9 items-center gap-1 pl-2">
        <span className="flex h-7 max-w-[190px] min-w-0 items-center gap-2 rounded-md bg-white px-2.5 text-[11px] shadow-[0_0_4px_rgba(0,0,0,.18)]">
          <Moon size={11} className="shrink-0 text-[#2563eb]" />
          <span className="truncate">{title}</span>
          <X size={11} className="shrink-0" />
        </span>
        <Plus size={14} className="shrink-0" />
        <WindowControls />
      </div>
      <div className="flex items-center gap-2 bg-[#f9f9fb] px-2 py-1.5">
        <ArrowLeft size={14} className="shrink-0" />
        <ArrowRight size={14} className="shrink-0 opacity-40" />
        <RotateCw size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-[#f0f0f4] px-2 py-1 text-[12px]">
          <Shield size={11} className="shrink-0" />
          <Lock size={11} className="shrink-0" />
          <span className="truncate">{url}</span>
        </span>
        <Menu size={15} className="shrink-0" />
      </div>
    </div>
  );
}

export default function BrowserComparator() {
  const [browser, setBrowser] = useState<BrowserId>('chrome');
  const [markers, setMarkers] = useState(true);
  const [autofill, setAutofill] = useState(true);
  const [focus, setFocus] = useState<number | null>(null);

  const b = browsers.find((x) => x.id === browser)!;
  const windows = browser !== 'safari';
  const font = windows ? WIN_FONT : MAC_FONT;

  const field: CSSProperties = { background: '#1a1d24', border: '1px solid #2c313c', color: '#fff', WebkitTextFillColor: '#fff' };
  const autofillStyle: CSSProperties =
    browser === 'chrome'
      ? { background: '#e8f0fe', border: '1px solid #c6d4f2' }
      : browser === 'safari'
        ? { background: '#fbf3b5', border: '1px solid #e8dc8c' }
        : { filter: FIREFOX_AUTOFILL_FILTER };

  const Marked = ({ i, children, className = '' }: { i: number; children: ReactNode; className?: string }) => {
    const v = diffs[i].per[browser].v;
    return (
      <div className={`relative ${className}`} style={focus === i ? { outline: '2px dashed #f59e0b', outlineOffset: 3, borderRadius: 8 } : undefined}>
        {children}
        {markers && (
          <span
            className="absolute -top-2 -right-2 z-10 grid size-5 place-items-center rounded-full text-[11px] font-bold text-white shadow"
            style={{ background: verdictStyle[v].badge }}
            aria-hidden="true"
          >
            {i + 1}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">Same page, different browsers</p>
        <p className="text-sm text-muted">One delivery form, three browsers. Switch between them and compare. Which differences are fine, and which are bugs?</p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap rounded-xl border border-line p-1" role="group" aria-label="Browser">
            {browsers.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={browser === x.id}
                onClick={() => setBrowser(x.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${browser === x.id ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg'}`}
              >
                {x.name} <span className="text-xs opacity-75">· {x.os}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-muted">
            <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} className="accent-[var(--brand)]" /> Markers
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted">
            <input type="checkbox" checked={autofill} onChange={(e) => setAutofill(e.target.checked)} className="accent-[var(--brand)]" /> Autofilled
          </label>
          <span className="ml-auto rounded-full bg-subtle px-2.5 py-0.5 font-mono text-xs text-muted">engine: {b.engine}</span>
        </div>

        {/* Browser window */}
        <div className="overflow-hidden rounded-xl border border-line-strong shadow-[0_16px_32px_-16px_rgba(16,18,35,.3)]">
          {browser === 'chrome' ? <ChromeBar /> : browser === 'safari' ? <SafariBar /> : <FirefoxBar />}
          <div className="relative overflow-hidden" style={{ background: '#0f1115', color: '#e7e9ee', fontFamily: font, WebkitFontSmoothing: windows ? 'auto' : 'antialiased' }}>
            <div style={{ paddingRight: windows ? 15 : 0, paddingBottom: windows ? 15 : 0 }}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-1.5 text-[15px] font-bold">
                  <Moon size={16} className="text-[#60a5fa]" aria-hidden="true" /> Midnight Grocer
                </span>
                <ShoppingBasket size={18} aria-hidden="true" />
              </div>
              <Marked i={2}>
                <p className="bg-[#1d4ed8] px-4 py-1.5 text-[12px] text-white" style={{ width: windows ? 'calc(100% + 15px)' : '100%' }}>
                  Free delivery after 8 pm · width: 100vw
                </p>
              </Marked>

              <div className="mx-auto max-w-[440px] space-y-3 px-4 py-4">
                <h3 className="text-[17px] font-semibold">Delivery details</h3>
                <Marked i={3} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Name', 'Ana Petrović'],
                    ['Email', 'ana@example.com'],
                  ].map(([l, v]) => (
                    <label key={l} className="block min-w-0 text-[12px] text-[#9aa1ad]">
                      {l}
                      <span className="mt-1 block truncate rounded-md px-2.5 py-2 text-[14px]" style={{ ...field, ...(autofill ? autofillStyle : {}) }}>
                        {autofill ? v : <span style={{ color: '#6b7280', WebkitTextFillColor: '#6b7280' }}>{l}</span>}
                      </span>
                    </label>
                  ))}
                </Marked>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Marked i={0} className="min-w-0">
                    <span className="block text-[12px] text-[#9aa1ad]">Delivery date</span>
                    <span className="mt-1 flex items-center rounded-md px-2.5 py-2 text-[14px] tabular-nums" style={field}>
                      <span className="flex-1">
                        {browser === 'safari' ? (
                          <>
                            <span className="rounded-sm bg-[#2563eb] px-0.5">10</span>/24/2026
                          </>
                        ) : (
                          '10/24/2026'
                        )}
                      </span>
                      {browser === 'chrome' && <CalendarDays size={16} style={{ color: '#23262d' }} aria-hidden="true" />}
                      {browser === 'firefox' && <CalendarDays size={16} style={{ color: '#d1d5db' }} aria-hidden="true" />}
                    </span>
                  </Marked>
                  <Marked i={1} className="min-w-0">
                    <span className="block text-[12px] text-[#9aa1ad]">Time slot</span>
                    {browser === 'safari' ? (
                      <span className="mt-1 flex items-center rounded-md border border-[#c7c7cc] bg-[#f2f2f7] py-[5px] pr-1 pl-2.5 text-[13px] text-[#1d1d1f] shadow-sm">
                        <span className="flex-1">20:00 – 22:00</span>
                        <span className="grid size-5 place-items-center rounded bg-[#007aff] text-white">
                          <ChevronsUpDown size={12} aria-hidden="true" />
                        </span>
                      </span>
                    ) : (
                      <span className="mt-1 flex items-center rounded-md px-2.5 py-2 text-[14px]" style={field}>
                        <span className="flex-1">20:00 – 22:00</span>
                        <ChevronDown size={browser === 'chrome' ? 14 : 16} strokeWidth={browser === 'chrome' ? 2.5 : 2} aria-hidden="true" />
                      </span>
                    )}
                  </Marked>
                </div>

                <div className="rounded-lg border border-[#2c313c] p-3 text-[13px]">
                  <p className="flex justify-between">
                    <span>Groceries (14 items)</span>
                    <span>€38.90</span>
                  </p>
                  <p className="mt-1 flex justify-between text-[#9aa1ad]">
                    <span>Delivery</span>
                    <span>€3.90</span>
                  </p>
                </div>

                <Marked i={4}>
                  <span className="block w-full rounded-lg bg-[#2563eb] py-2.5 text-center text-[15px] font-semibold text-white">Place order · €42.80</span>
                </Marked>
              </div>
            </div>

            {/* Scrollbars */}
            {windows ? (
              <>
                <span className="absolute top-0 right-0 bottom-[15px] w-[15px] border-l border-[#d4d4d4] bg-[#f1f1f1]" aria-hidden="true">
                  <span className="absolute inset-x-[3px] top-3 h-1/2 rounded-sm bg-[#c1c1c1]" />
                </span>
                <span className="absolute right-0 bottom-0 left-0 h-[15px] border-t border-[#d4d4d4] bg-[#f1f1f1]" aria-hidden="true">
                  <span className="absolute inset-y-[3px] left-3 right-8 rounded-sm bg-[#c1c1c1]" />
                </span>
              </>
            ) : (
              <span className="absolute top-2 right-[3px] h-1/3 w-[6px] rounded-full bg-white/35" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Differences */}
        <ol className="space-y-2">
          {diffs.map((d, i) => {
            const p = d.per[browser];
            const s = verdictStyle[p.v];
            return (
              <li key={d.name}>
                <button
                  type="button"
                  aria-pressed={focus === i}
                  onClick={() => setFocus((f) => (f === i ? null : i))}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${focus === i ? 'border-brand bg-brand-soft' : 'border-line bg-subtle hover:border-line-strong'}`}
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: s.badge }}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{d.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.pill}`}>{s.label}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{p.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Summary matrix */}
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Verdict per browser</caption>
            <thead className="bg-subtle text-xs text-faint">
              <tr>
                <th className="px-3 py-2 font-semibold">Difference</th>
                {browsers.map((x) => (
                  <th key={x.id} className="px-3 py-2 font-semibold">
                    {x.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diffs.map((d) => (
                <tr key={d.name} className="border-t border-line">
                  <td className="px-3 py-2 text-muted">{d.name}</td>
                  {browsers.map((x) => {
                    const v = d.per[x.id].v;
                    return (
                      <td key={x.id} className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${verdictStyle[v].pill}`}>{verdictStyle[v].label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
