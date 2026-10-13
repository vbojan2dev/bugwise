import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Volume2 } from 'lucide-react';
import { catalog } from './data';
import { Pagination } from './Pagination';

/*
 * Pagination lab: a CORRECT paginated product list. The page and page size live in the URL,
 * so Back / Forward / Refresh keep them. Invalid and out-of-range pages are handled gracefully,
 * and changing the page size keeps the first visible item on screen.
 */

const ALL = catalog(312);
const TOTALS = [0, 7, 312, 5000];
const SIZES = [10, 20, 50];

interface Entry {
  page: number;
  size: number;
  status: string;
  note: string;
}

function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold text-faint">{label}</legend>
      <div className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-medium ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const fmt = (n: number) => n.toLocaleString('en-US');

export default function Playground() {
  const [total, setTotal] = useState(312);
  const [layout, setLayout] = useState<'desktop' | 'phone'>('desktop');
  const [hist, setHist] = useState<{ entries: Entry[]; i: number }>({ entries: [{ page: 1, size: 20, status: '200 OK', note: '' }], i: 0 });
  const [draft, setDraft] = useState('?page=1&size=20');
  const [reloads, setReloads] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const cur = hist.entries[hist.i];
  const totalPages = Math.max(1, Math.ceil(total / cur.size));
  const outOfRange = cur.page > totalPages;
  const query = (e: { page: number; size: number }) => `?page=${e.page}&size=${e.size}`;

  const push = (e: Entry) => {
    setHist((h) => {
      const entries = [...h.entries.slice(0, h.i + 1), e];
      return { entries, i: entries.length - 1 };
    });
    setDraft(query(e));
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const goPage = (p: number) => push({ page: p, size: cur.size, status: '200 OK', note: '' });

  const changeSize = (s: number) => {
    const firstItem = (Math.min(cur.page, totalPages) - 1) * cur.size; // 0-based index of the first visible item
    const page = Math.floor(firstItem / s) + 1;
    push({ page, size: s, status: '200 OK', note: `Per page ${cur.size} → ${s}. You were looking at item ${fmt(firstItem + 1)}, so you are now on page ${page}.` });
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const params = new URLSearchParams(draft.trim().replace(/^.*\?/, ''));
    const rawPage = params.get('page') ?? '1';
    const rawSize = params.get('size') ?? '20';
    let size = Number(rawSize);
    let note = '';
    if (!SIZES.includes(size)) {
      note = `size=${rawSize} is not allowed. Using 20. `;
      size = 20;
    }
    const n = Number(rawPage);
    if (!/^\d+$/.test(rawPage) || n < 1) {
      push({ page: 1, size, status: '301 → ?page=1', note: `${note}page=${rawPage} is not a valid page number, so the server redirected to page 1.` });
      return;
    }
    const tp = Math.max(1, Math.ceil(total / size));
    push({ page: n, size, status: n > tp ? '404 Not Found' : '200 OK', note });
  };

  const back = () => {
    if (hist.i === 0) return;
    setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) }));
    setDraft(query(hist.entries[hist.i - 1]));
  };
  const forward = () => {
    if (hist.i >= hist.entries.length - 1) return;
    setHist((h) => ({ ...h, i: Math.min(h.entries.length - 1, h.i + 1) }));
    setDraft(query(hist.entries[hist.i + 1]));
  };

  const start = (cur.page - 1) * cur.size;
  const end = Math.min(total, start + cur.size);
  const rows = Array.from({ length: Math.max(0, end - start) }, (_, k) => ALL[(start + k) % ALL.length]);
  const iconBtn = 'grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-3">
        <Seg label="Results" value={total} onChange={setTotal} options={TOTALS.map((t) => ({ v: t, l: fmt(t) }))} />
        <Seg label="Per page" value={cur.size} onChange={changeSize} options={SIZES.map((s) => ({ v: s, l: String(s) }))} />
        <Seg label="Layout" value={layout} onChange={setLayout} options={[{ v: 'desktop', l: 'Desktop' }, { v: 'phone', l: 'Phone' }]} />
      </div>

      <div className="bg-[#e9ebf2] px-3 py-5 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm" style={{ maxWidth: layout === 'phone' ? 340 : 640 }}>
          <form onSubmit={submit} className="flex items-center gap-1 border-b border-black/10 bg-[#f6f7fb] px-2 py-1.5">
            <button type="button" onClick={back} disabled={hist.i === 0} aria-label="Browser back" className={iconBtn}>
              <ArrowLeft size={16} />
            </button>
            <button type="button" onClick={forward} disabled={hist.i >= hist.entries.length - 1} aria-label="Browser forward" className={iconBtn}>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => setReloads((r) => r + 1)} aria-label="Reload" className={iconBtn}>
              <RotateCw size={15} />
            </button>
            <label className="flex min-w-0 flex-1 items-center rounded-md border border-black/10 bg-white px-2 font-mono text-[11px]">
              <span className="hidden shrink-0 text-black/45 sm:inline">shop.example.com/products</span>
              <span className="shrink-0 text-black/45 sm:hidden">…/products</span>
              <span className="sr-only">Query string</span>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} className="w-0 min-w-0 flex-1 bg-transparent py-1 outline-none" />
            </label>
            <button type="submit" className="shrink-0 rounded-md bg-[#2f6bff] px-2 py-1 text-[11px] font-semibold text-white">
              Go
            </button>
          </form>

          <div key={reloads} className="p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[16px] font-bold">Outdoor gear</p>
              <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] text-black/60">HTTP {outOfRange ? "404 Not Found" : cur.status}</span>
            </div>
            {cur.note && <p className="mb-3 rounded-lg bg-[#eef3ff] px-3 py-2 text-[12px] text-[#1d3d91]">{cur.note}</p>}

            {total === 0 ? (
              <div className="rounded-lg bg-black/[0.03] px-4 py-8 text-center">
                <p className="text-[15px] font-semibold">No products match</p>
                <p className="mt-1 text-[13px] text-black/55">Try removing a filter. (No pager is shown: there is nothing to page through.)</p>
              </div>
            ) : outOfRange ? (
              <div className="rounded-lg bg-black/[0.03] px-4 py-8 text-center">
                <p className="text-[15px] font-semibold">Page {fmt(cur.page)} doesn’t exist</p>
                <p className="mt-1 text-[13px] text-black/55">
                  There {totalPages === 1 ? 'is 1 page' : `are ${fmt(totalPages)} pages`} of results.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => goPage(totalPages)} className="h-11 rounded-lg bg-[#2f6bff] px-4 text-[14px] font-semibold text-white">
                    Go to last page
                  </button>
                  <button type="button" onClick={() => goPage(1)} className="h-11 rounded-lg px-4 text-[14px] font-semibold text-[#2f6bff] hover:bg-black/5">
                    First page
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-2 text-[13px] text-black/60" aria-live="polite">
                  Showing <strong className="text-black">{fmt(start + 1)}–{fmt(end)}</strong> of {fmt(total)}
                </p>
                <div ref={listRef} className="relative max-h-[230px] overflow-y-auto rounded-lg border border-black/10">
                  <ul className="divide-y divide-black/5">
                    {rows.map((p, k) => (
                      <li key={k} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
                        <span className="w-10 shrink-0 font-mono text-[11px] text-black/40">#{start + k + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <span className="shrink-0 text-black/55">{p.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <Pagination page={cur.page} totalPages={totalPages} onChange={goPage} compact={layout === 'phone'} />
                  {totalPages === 1 && <p className="text-center text-[12px] text-black/45">Only one page, so no pager is shown.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader on the pager
          </p>
          <p className="mt-1 text-sm text-fg">
            {total === 0 || outOfRange || totalPages === 1
              ? 'No pager on this screen.'
              : layout === 'phone'
                ? `“Pagination, navigation” … “Previous page, button” … “Page ${cur.page} of ${totalPages}” … “Next page, button”`
                : `“Pagination, navigation” … “Page ${cur.page}, current page, button”`}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3 text-sm">
          <p className="text-xs font-semibold text-faint">Try these</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted">
            <li>Go to page 3, then browser Back and Reload</li>
            <li>Type <code className="text-fg">?page=999</code>, <code className="text-fg">?page=0</code> or <code className="text-fg">?page=abc</code></li>
            <li>Open the last page, then switch Per page to 50</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
