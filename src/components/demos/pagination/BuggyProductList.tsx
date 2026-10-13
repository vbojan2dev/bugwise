import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Link2, LoaderCircle, RotateCw, ShoppingCart } from 'lucide-react';
import { catalog, pageItems, type Product } from './data';

/*
 * A deliberately broken web shop product list (312 products, 20 per page). Bugs (don't spoil them!):
 *  1. Offset off-by-one: offset = max(0, (page - 1) * size - 1). Every page after page 1 starts one item early,
 *     so the last product of page 1 appears again at the top of page 2.
 *  2. Range text uses page * size without clamping: the last page says "Showing 301–320 of 312".
 *  3. Next is disabled only when page > totalPages, so it is enabled on the last page and leads to an empty page.
 *  4. Opening ?page=999 directly: the API answers 404, the initial-load code ignores errors -> endless spinner.
 *  5. Changing the page size keeps the current page number (page 8 with 50 per page = page that doesn't exist -> empty).
 *  6. The page is never written to the URL: refresh, or Back from a product, lands on page 1.
 */

const TOTAL = 312;
const ALL = catalog(TOTAL);
const HOST = 'shop.example.com';

function parse(input: string): string {
  let p = input.trim().replace(/^https?:\/\//, '');
  if (p.startsWith(HOST)) p = p.slice(HOST.length);
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.startsWith('/product/') || p.startsWith('/products')) return p;
  return '/products';
}

function ListScreen({ url, onOpen, log, viewport }: { url: string; onOpen: (p: Product) => void; log: (s: string) => void; viewport: RefObject<HTMLDivElement | null> }) {
  const initialPage = Math.max(1, parseInt(new URLSearchParams(url.split('?')[1] ?? '').get('page') ?? '1', 10) || 1);
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(20);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const req = useRef(0);

  const load = (p: number, s: number, isInitial: boolean) => {
    const offset = Math.max(0, (p - 1) * s - 1); // BUG 1: should be (p - 1) * s
    const id = ++req.current;
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (id !== req.current) return;
      const ok = offset < TOTAL;
      const res = ok ? ALL.slice(offset, offset + s) : [];
      log(`GET /api/products?offset=${offset}&limit=${s} → ${ok ? `200 OK · ${res.length} items` : '404 {"error":"out_of_range"}'}`);
      if (isInitial) {
        // BUG 4: errors on the first load are not handled, so the spinner never stops
        if (ok) {
          setItems(res);
          setLoading(false);
          setInitial(false);
        }
      } else {
        setItems(res); // BUG 3/5: an error just shows an empty grid
        setLoading(false);
      }
    }, 450);
  };

  useEffect(() => {
    load(initialPage, 20, true);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(TOTAL / size);
  const go = (p: number) => {
    setPage(p); // BUG 6: the URL is not updated (no ?page=)
    load(p, size, false);
    if (viewport.current) viewport.current.scrollTop = 0;
  };
  const changeSize = (s: number) => {
    setSize(s);
    load(page, s, false); // BUG 5: keeps the old page number
  };

  if (initial) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-2 text-black/50">
        <LoaderCircle size={28} className="animate-spin" />
        <p className="text-[13px]">Loading products…</p>
      </div>
    );
  }

  const cell = 'grid h-9 min-w-9 place-items-center rounded-md px-1.5 text-[13px] font-medium disabled:opacity-30';

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[18px] font-bold">Outdoor gear</p>
          {/* BUG 2: end is not clamped to TOTAL */}
          <p className="text-[12px] text-black/55">
            Showing {(page - 1) * size + 1}–{page * size} of {TOTAL}
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-black/60">
          Per page
          <select value={size} onChange={(e) => changeSize(Number(e.target.value))} className="rounded-md border border-black/15 bg-white px-1.5 py-1 text-[12px] text-black">
            {[20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`relative mt-3 min-h-[200px] transition-opacity ${loading ? 'opacity-40' : ''}`}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onOpen(p)} className="w-full overflow-hidden rounded-lg border border-black/10 text-left hover:border-black/25">
                <span className="grid h-16 place-items-center text-white" style={{ background: `hsl(${p.hue} 50% 55%)` }}>
                  <p.icon size={24} aria-hidden="true" />
                </span>
                <span className="block px-2 pt-1.5 text-[12px] leading-tight font-medium">{p.name}</span>
                <span className="block px-2 pb-1.5 text-[12px] text-black/55">{p.price}</span>
              </button>
            </li>
          ))}
        </ul>
        {loading && (
          <span className="absolute inset-x-0 top-6 flex justify-center">
            <LoaderCircle size={24} className="animate-spin text-black/60" />
          </span>
        )}
      </div>

      <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-center gap-1">
        <button type="button" className={cell} disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pageItems(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`g${i}`} className="px-1 text-black/40" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${cell} ${p === page ? 'bg-[#0f766e] text-white' : 'hover:bg-black/5'}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => go(p)}
            >
              {p}
            </button>
          ),
        )}
        {/* BUG 3: should be page >= totalPages */}
        <button type="button" className={cell} disabled={page > totalPages} onClick={() => go(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}

export function BuggyProductList() {
  const [hist, setHist] = useState<{ entries: string[]; i: number }>({ entries: ['/products'], i: 0 });
  const [draft, setDraft] = useState(`${HOST}/products`);
  const [reload, setReload] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const url = hist.entries[hist.i];

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 6));

  const navigate = (path: string) => {
    setHist((h) => {
      const entries = [...h.entries.slice(0, h.i + 1), path];
      return { entries, i: entries.length - 1 };
    });
    setDraft(`${HOST}${path}`);
    if (viewport.current) viewport.current.scrollTop = 0;
  };
  const move = (d: -1 | 1) => {
    const ni = hist.i + d;
    if (ni < 0 || ni >= hist.entries.length) return;
    setHist((h) => ({ ...h, i: ni }));
    setDraft(`${HOST}${hist.entries[ni]}`);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(parse(draft));
  };
  const restart = () => {
    setHist({ entries: ['/products'], i: 0 });
    setDraft(`${HOST}/products`);
    setLog([]);
    setReload((r) => r + 1);
  };

  const productId = url.startsWith('/product/') ? Number(url.split('/')[2]) : null;
  const product = productId !== null ? ALL.find((p) => p.id === productId) : undefined;
  const iconBtn = 'grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30';

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-white text-[#0e1120] shadow-[0_24px_48px_-16px_rgba(16,18,35,.25)]" style={{ colorScheme: 'light' }}>
        <form onSubmit={submit} className="flex items-center gap-1 border-b border-[#e5e7ef] bg-[#f6f7fb] px-2 py-1.5">
          <button type="button" onClick={() => move(-1)} disabled={hist.i === 0} aria-label="Back" className={iconBtn}>
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => move(1)} disabled={hist.i >= hist.entries.length - 1} aria-label="Forward" className={iconBtn}>
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={() => setReload((r) => r + 1)} aria-label="Reload" className={iconBtn}>
            <RotateCw size={15} />
          </button>
          <label className="flex min-w-0 flex-1">
            <span className="sr-only">Address</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} className="w-0 min-w-0 flex-1 rounded-md border border-[#e5e7ef] bg-white px-2 py-1 font-mono text-[11px] outline-none focus:border-[#0f766e]" />
          </label>
        </form>
        <div ref={viewport} className="relative h-[460px] overflow-y-auto">
          {product ? (
            <div className="p-4">
              <div className="grid h-40 place-items-center rounded-xl text-white" style={{ background: `hsl(${product.hue} 50% 55%)` }}>
                <product.icon size={56} aria-hidden="true" />
              </div>
              <p className="mt-3 text-[20px] font-bold">{product.name}</p>
              <p className="text-[15px] text-black/60">{product.price}</p>
              <p className="mt-2 text-[13px] text-black/60">Item no. {product.id}. Free returns within 30 days.</p>
              <button type="button" className="mt-4 flex h-11 items-center gap-2 rounded-lg bg-[#0f766e] px-5 text-[14px] font-semibold text-white">
                <ShoppingCart size={16} /> Add to cart
              </button>
              <p className="mt-6 text-[12px] text-black/45">Use the browser’s Back button to return to the list.</p>
            </div>
          ) : (
            <ListScreen key={`${hist.i}-${url}-${reload}`} url={url} onOpen={(p) => navigate(`/product/${p.id}`)} log={addLog} viewport={viewport} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Links from emails & bookmarks</p>
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCw size={12} /> Restart
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {['/products?page=3', '/products?page=999'].map((p) => (
              <button key={p} type="button" onClick={() => navigate(p)} className="flex min-w-0 items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-left font-mono text-xs hover:text-brand">
                <Link2 size={14} className="shrink-0" /> <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network</p>
          <ul className="min-h-[5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">API requests appear here…</li>}
            {log.map((e, i) => (
              <li key={i} className="break-all">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
