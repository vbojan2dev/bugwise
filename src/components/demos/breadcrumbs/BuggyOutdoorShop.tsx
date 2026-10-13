import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Flame, Lamp, Moon, RotateCw, Search, ShoppingCart, Sun, Tent, Volume2 } from 'lucide-react';

/*
 * A deliberately broken outdoor shop (web). Bugs (don't spoil them!):
 *  1. The current page (last crumb) is a link to itself. Clicking it reloads the page and adds a duplicate
 *     history entry, and screen readers announce it as a link instead of "current page".
 *  2. Product breadcrumbs are built from the LAST category the user browsed, not from the product's real category.
 *     Browse Tents, then search for "lantern": the Storm Lantern appears under Camping › Tents.
 *  3. Separators are real "/" text inside the list items, so screen readers read "slash" between every level.
 *  4. Phone width: the middle levels collapse into "…", but the "…" is plain text, so Camping can't be reached.
 *  5. Top-level category crumbs link to /camping and /lighting (404). The real routes are /c/camping and /c/lighting.
 *  6. Coming from a filtered list (?people=2&sort=price), the category crumb on the product page drops the filters.
 */

const HOST = 'shop.example.com';

type CatId = 'camping' | 'lighting';
interface Sub {
  id: string;
  label: string;
  cat: CatId;
}
interface Product {
  slug: string;
  name: string;
  price: number;
  sub: string;
  people?: number;
  hue: number;
}

const CATS: Record<CatId, { label: string; subs: Sub[] }> = {
  camping: {
    label: 'Camping',
    subs: [
      { id: 'tents', label: 'Tents', cat: 'camping' },
      { id: 'stoves', label: 'Stoves', cat: 'camping' },
    ],
  },
  lighting: {
    label: 'Lighting',
    subs: [
      { id: 'lanterns', label: 'Lanterns', cat: 'lighting' },
      { id: 'headlamps', label: 'Headlamps', cat: 'lighting' },
    ],
  },
};
const SUBS: Sub[] = [...CATS.camping.subs, ...CATS.lighting.subs];

const PRODUCTS: Product[] = [
  { slug: 'trailhead-2p-tent', name: 'Trailhead 2P Tent', price: 189, sub: 'tents', people: 2, hue: 150 },
  { slug: 'summit-1p-bivy', name: 'Summit 1P Bivy', price: 149, sub: 'tents', people: 1, hue: 200 },
  { slug: 'ridgeline-ultralight-2p', name: 'Ridgeline UltraLight 2-Person Backpacking Tent', price: 279, sub: 'tents', people: 2, hue: 30 },
  { slug: 'basecamp-4p-dome', name: 'Basecamp 4P Dome', price: 329, sub: 'tents', people: 4, hue: 260 },
  { slug: 'family-cabin-6p', name: 'Family Cabin 6P', price: 459, sub: 'tents', people: 6, hue: 100 },
  { slug: 'pocket-stove', name: 'Pocket Gas Stove', price: 45, sub: 'stoves', hue: 10 },
  { slug: 'storm-lantern', name: 'Storm Lantern', price: 39, sub: 'lanterns', hue: 45 },
  { slug: 'solar-lantern-duo', name: 'Solar Lantern Duo', price: 45, sub: 'lanterns', hue: 55 },
  { slug: 'trail-400-headlamp', name: 'Trail 400 Headlamp', price: 29, sub: 'headlamps', hue: 220 },
];

const subOf = (p: Product) => SUBS.find((s) => s.id === p.sub)!;
const iconFor = (sub: string) => (sub === 'tents' ? Tent : sub === 'stoves' ? Flame : sub === 'lanterns' ? Lamp : sub === 'headlamps' ? Sun : Moon);

interface Route {
  kind: 'home' | 'cat' | 'sub' | 'product' | 'search' | '404';
  cat?: CatId;
  sub?: Sub;
  product?: Product;
  q?: string;
  people?: string;
  sort?: string;
}

function parse(url: string): Route {
  const [path, qs = ''] = url.split('?');
  const params = new URLSearchParams(qs);
  const seg = path.split('/').filter(Boolean);
  if (seg.length === 0) return { kind: 'home' };
  if (seg[0] === 'search') return { kind: 'search', q: params.get('q') ?? '' };
  if (seg[0] === 'c' && seg[1] && seg[1] in CATS) {
    const cat = seg[1] as CatId;
    if (!seg[2]) return { kind: 'cat', cat };
    const sub = CATS[cat].subs.find((s) => s.id === seg[2]);
    if (sub) return { kind: 'sub', cat, sub, people: params.get('people') ?? 'any', sort: params.get('sort') ?? 'popular' };
  }
  if (seg[0] === 'p' && seg[1]) {
    const product = PRODUCTS.find((p) => p.slug === seg[1]);
    if (product) return { kind: 'product', product };
  }
  return { kind: '404' };
}

interface BC {
  label: string;
  url: string;
}

const fmt = (n: number) => `$${n}`;

export function BuggyOutdoorShop() {
  const [hist, setHist] = useState<{ entries: string[]; i: number }>({ entries: ['/'], i: 0 });
  const [reloads, setReloads] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [phone, setPhone] = useState(false);
  const [sr, setSr] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');
  // BUG 2 + 6 source: the app remembers the last list the user browsed (but only uses part of it)
  const [lastSub, setLastSub] = useState<Sub | null>(null);

  const url = hist.entries[hist.i];
  const route = parse(url);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 6));
  const logFor = (u: string) => addLog(`GET ${u} → ${parse(u).kind === '404' ? '404 Not Found' : '200 OK'}`);

  const navigate = (u: string) => {
    setHist((h) => {
      const entries = [...h.entries.slice(0, h.i + 1), u];
      return { entries, i: entries.length - 1 };
    });
    const r = parse(u);
    if (r.kind === 'sub' && r.sub) setLastSub(r.sub);
    setSr(null);
    logFor(u);
  };
  const move = (d: -1 | 1) => {
    const ni = hist.i + d;
    if (ni < 0 || ni >= hist.entries.length) return;
    setHist((h) => ({ ...h, i: ni }));
    setSr(null);
    logFor(hist.entries[ni]);
  };
  const reload = () => {
    setReloads((r) => r + 1);
    setSr(null);
    logFor(url);
  };
  const restart = () => {
    setHist({ entries: ['/'], i: 0 });
    setLog([]);
    setLastSub(null);
    setSr(null);
    setQuery('');
    setPhone(false);
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // ---- breadcrumb (buggy) ----
  let crumbs: BC[] = [];
  if (route.kind === 'cat' && route.cat) crumbs = [{ label: 'Home', url: '/' }, { label: CATS[route.cat].label, url: `/c/${route.cat}` }];
  if (route.kind === 'sub' && route.sub && route.cat)
    crumbs = [
      { label: 'Home', url: '/' },
      { label: CATS[route.cat].label, url: `/${route.cat}` }, // BUG 5: should be /c/<cat>
      { label: route.sub.label, url },
    ];
  if (route.kind === 'product' && route.product) {
    const sub = lastSub ?? subOf(route.product); // BUG 2: should always be subOf(product)
    crumbs = [
      { label: 'Home', url: '/' },
      { label: CATS[sub.cat].label, url: `/${sub.cat}` }, // BUG 5
      { label: sub.label, url: `/c/${sub.cat}/${sub.id}` }, // BUG 6: the filters of the list the user came from are dropped
      { label: route.product.name, url }, // BUG 1: rendered as a link below
    ];
  }
  if (route.kind === 'search') crumbs = [{ label: 'Home', url: '/' }, { label: `Search: “${route.q}”`, url }];

  const collapsed = phone && crumbs.length > 3;
  const shown: (BC | 'more')[] = collapsed ? [crumbs[0], 'more', ...crumbs.slice(-2)] : crumbs;

  const readAloud = () => {
    if (crumbs.length === 0) {
      setSr(['(This page has no breadcrumb.)']);
      return;
    }
    const out = ['Breadcrumb, navigation', `list, ${shown.length} items`];
    shown.forEach((c, i) => {
      if (i > 0) out.push('slash'); // BUG 3
      out.push(c === 'more' ? 'dot dot dot' : `${c.label}, link`); // BUG 1 + 4
    });
    out.push('end of list');
    setSr(out);
  };

  const link = 'text-[#1d4ed8] hover:underline';
  const ProductCard = ({ p }: { p: Product }) => {
    const Icon = iconFor(p.sub);
    return (
      <li className="min-w-0">
        <button type="button" onClick={() => navigate(`/p/${p.slug}`)} className="w-full overflow-hidden rounded-lg border border-black/10 text-left hover:border-black/25">
          <span className="grid h-14 place-items-center text-white" style={{ background: `hsl(${p.hue} 45% 45%)` }}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <span className="line-clamp-2 block px-2 pt-1.5 text-[12px] leading-tight font-medium">{p.name}</span>
          <span className="block px-2 pb-1.5 text-[12px] text-black/55">{fmt(p.price)}</span>
        </button>
      </li>
    );
  };

  let body;
  if (route.kind === 'home') {
    body = (
      <>
        <p className="text-[18px] font-bold">Gear up for the weekend</p>
        <p className="mt-3 text-[12px] font-semibold tracking-wide text-black/50 uppercase">Shop by category</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(CATS) as CatId[]).map((c) => (
            <button key={c} type="button" onClick={() => navigate(`/c/${c}`)} className="rounded-lg bg-[#f1f5f2] px-3 py-3 text-left text-[14px] font-semibold hover:bg-[#e4ece6]">
              {CATS[c].label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[12px] font-semibold tracking-wide text-black/50 uppercase">Popular right now</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[PRODUCTS[0], PRODUCTS[6], PRODUCTS[8]].map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </ul>
      </>
    );
  } else if (route.kind === 'cat' && route.cat) {
    body = (
      <>
        <p className="text-[18px] font-bold">{CATS[route.cat].label}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CATS[route.cat].subs.map((s) => (
            <button key={s.id} type="button" onClick={() => navigate(`/c/${route.cat}/${s.id}`)} className="rounded-lg bg-[#f1f5f2] px-3 py-3 text-left text-[14px] font-semibold hover:bg-[#e4ece6]">
              {s.label}
            </button>
          ))}
        </div>
      </>
    );
  } else if (route.kind === 'sub' && route.sub && route.cat) {
    const sub = route.sub;
    const people = route.people ?? 'any';
    const sort = route.sort ?? 'popular';
    let list = PRODUCTS.filter((p) => p.sub === sub.id);
    if (sub.id === 'tents' && people !== 'any') list = list.filter((p) => (people === '4' ? (p.people ?? 0) >= 4 : String(p.people) === people));
    if (sort === 'price') list = [...list].sort((a, b) => a.price - b.price);
    const setParams = (np: string, ns: string) => {
      const qs = new URLSearchParams();
      if (np !== 'any') qs.set('people', np);
      if (ns !== 'popular') qs.set('sort', ns);
      const s = qs.toString();
      navigate(`/c/${route.cat}/${sub.id}${s ? `?${s}` : ''}`);
    };
    const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-[12px] font-medium ${on ? 'border-[#1f5f45] bg-[#1f5f45] text-white' : 'border-black/15 hover:bg-black/5'}`;
    body = (
      <>
        <p className="text-[18px] font-bold">{sub.label}</p>
        {sub.id === 'tents' && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Sleeps">
            <span className="text-[12px] text-black/55">Sleeps</span>
            {[
              ['any', 'Any'],
              ['1', '1'],
              ['2', '2'],
              ['4', '4+'],
            ].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={people === v} onClick={() => setParams(v, sort)} className={chip(people === v)}>
                {l}
              </button>
            ))}
          </div>
        )}
        <label className="mt-2 flex items-center gap-1.5 text-[12px] text-black/55">
          Sort
          <select value={sort} onChange={(e) => setParams(people, e.target.value)} className="rounded-md border border-black/15 bg-white px-1.5 py-1 text-[12px] text-black">
            <option value="popular">Popular</option>
            <option value="price">Price: low to high</option>
          </select>
        </label>
        <p className="mt-2 text-[12px] text-black/55">{list.length} products</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </ul>
      </>
    );
  } else if (route.kind === 'product' && route.product) {
    const p = route.product;
    const Icon = iconFor(p.sub);
    body = (
      <>
        <div className="grid h-32 place-items-center rounded-xl text-white" style={{ background: `hsl(${p.hue} 45% 45%)` }}>
          <Icon size={48} aria-hidden="true" />
        </div>
        <p className="mt-3 text-[19px] leading-snug font-bold">{p.name}</p>
        <p className="text-[14px] text-black/60">
          {fmt(p.price)}
          {p.people ? ` · sleeps ${p.people}` : ''}
        </p>
        <button type="button" className="mt-3 flex h-11 items-center gap-2 rounded-lg bg-[#1f5f45] px-5 text-[14px] font-semibold text-white">
          <ShoppingCart size={16} /> Add to cart
        </button>
      </>
    );
  } else if (route.kind === 'search') {
    const q = (route.q ?? '').toLowerCase();
    const list = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || subOf(p).label.toLowerCase().includes(q));
    body = (
      <>
        <p className="text-[18px] font-bold">Results for “{route.q}”</p>
        <p className="mt-1 text-[12px] text-black/55">{list.length} products</p>
        {list.length === 0 ? (
          <p className="mt-4 text-[13px] text-black/60">No products found. Try “tent” or “lantern”.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </ul>
        )}
      </>
    );
  } else {
    body = (
      <div className="py-8 text-center">
        <p className="text-[40px] font-black text-black/15">404</p>
        <p className="text-[16px] font-bold">Page not found</p>
        <p className="mt-1 font-mono text-[12px] break-all text-black/50">{url}</p>
        <button type="button" onClick={() => navigate('/')} className={`mt-3 text-[13px] font-medium ${link}`}>
          Go to the home page
        </button>
      </div>
    );
  }

  const iconBtn = 'grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30';
  const sideBtn = (on: boolean) => `min-w-0 flex-1 rounded-md px-2 py-1 text-xs font-medium ${on ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-[#e9ebf2] shadow-[0_24px_48px_-16px_rgba(16,18,35,.25)]" style={{ colorScheme: 'light' }}>
        <div className="flex items-center gap-1 border-b border-[#e5e7ef] bg-[#f6f7fb] px-2 py-1.5 text-[#0e1120]">
          <button type="button" onClick={() => move(-1)} disabled={hist.i === 0} aria-label="Back" className={iconBtn}>
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => move(1)} disabled={hist.i >= hist.entries.length - 1} aria-label="Forward" className={iconBtn}>
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={reload} aria-label="Reload" className={iconBtn}>
            <RotateCw size={15} />
          </button>
          <p className="min-w-0 flex-1 truncate rounded-md border border-[#e5e7ef] bg-white px-2 py-1 font-mono text-[11px]">
            {HOST}
            {url === '/' ? '' : url}
          </p>
        </div>
        <div className="mx-auto bg-white text-[#0e1120] transition-[max-width]" style={{ maxWidth: phone ? 340 : undefined }}>
          <div className="flex items-center gap-2 border-b border-black/10 px-3 py-2">
            <button type="button" onClick={() => navigate('/')} className="shrink-0 text-[15px] font-black tracking-tight text-[#1f5f45]">
              TrailBase
            </button>
            <form onSubmit={search} role="search" className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-black/[0.05] px-2.5">
              <Search size={13} className="shrink-0 text-black/45" aria-hidden="true" />
              <label className="flex min-w-0 flex-1">
                <span className="sr-only">Search products</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gear" className="w-0 min-w-0 flex-1 bg-transparent py-1.5 text-[12px] outline-none" />
              </label>
            </form>
          </div>
          <div key={`${hist.i}-${reloads}`} className="h-[420px] overflow-y-auto p-3 sm:p-4">
            {crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-3 text-[12px]">
                <ol className="flex flex-wrap items-center gap-y-1">
                  {shown.map((c, i) => (
                    <li key={c === 'more' ? 'more' : c.url + i} className="flex min-w-0 items-center">
                      {i > 0 && <span className="px-1.5 text-black/35">/</span>}
                      {c === 'more' ? (
                        <span className="px-0.5 text-black/45">…</span>
                      ) : (
                        <a
                          href={`#${c.url}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(c.url);
                          }}
                          className={i === shown.length - 1 ? 'min-w-0 truncate font-semibold text-black/80 hover:underline' : `min-w-0 truncate ${link}`}
                        >
                          {c.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {body}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-w-0 space-y-3 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCw size={12} /> Restart
            </button>
          </div>
          <div className="flex rounded-lg bg-subtle p-0.5" role="group" aria-label="Screen width">
            <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)} className={sideBtn(!phone)}>
              Desktop
            </button>
            <button type="button" aria-pressed={phone} onClick={() => setPhone(true)} className={sideBtn(phone)}>
              Phone width
            </button>
          </div>
          <button type="button" onClick={readAloud} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand hover:opacity-90">
            <Volume2 size={14} /> Read the breadcrumb (screen reader)
          </button>
          {sr && (
            <ol className="space-y-1 text-[12px]" aria-live="polite">
              {sr.map((l, i) => (
                <li key={i} className="rounded-md bg-subtle px-2 py-1 text-fg">
                  {l}
                </li>
              ))}
            </ol>
          )}
          <details className="rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
            <summary className="cursor-pointer font-semibold text-fg">Acceptance criteria (from the ticket)</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>The breadcrumb shows where the page really lives in the catalog.</li>
              <li>Every level opens a working page. The current page is plain text, not a link.</li>
              <li>From a filtered list, the category level on the product page returns to that list with its filters and sort.</li>
              <li>On phones, hidden middle levels stay reachable.</li>
              <li>Screen readers hear “Breadcrumb”, the levels and “current page”, nothing else.</li>
            </ul>
          </details>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network</p>
          <ul className="min-h-[5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Page requests appear here…</li>}
            {log.map((e, i) => (
              <li key={i} className={`break-all ${e.includes('404') ? 'text-[#ff8a8a]' : ''}`}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
