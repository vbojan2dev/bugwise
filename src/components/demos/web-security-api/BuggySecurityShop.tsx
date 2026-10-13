import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowRight, Lock, Package, Search, Star, Wrench } from 'lucide-react';
import { JsonView } from './JsonView';

/*
 * A deliberately vulnerable shop in a simulated TEST environment. Bugs (don't spoil them for learners!):
 *  1. IDOR: /orders/<id> shows any customer's order, not only your own.
 *  2. /admin opens for a normal customer (the menu just hides the link).
 *  3. HTML injection: reviews render markup like <b>, <i>, <u>, <h3> instead of showing it as text.
 *     (Simulated safely: only a few harmless tags are turned into React elements, no innerHTML.)
 *  4. An apostrophe in the search box shows a 500 page with the raw SQL error and a stack trace.
 *  5. The reviews API returns every reviewer's email address (the page only shows the name).
 *  6. Login is sent as a GET form: the password ends up in the URL bar (and in the network log).
 *
 * Working on purpose: generic login error, logout, protected pages redirect to login when logged out,
 * unknown orders/pages give 404, search results are shown as plain text.
 */

const ACCOUNT = { email: 'anna@test.com', password: 'Fit-test-42', name: 'Anna Novak' };
const ACCENT = '#0d7a5f';

const PRODUCTS = [
  { id: 1, name: 'Trail Runner shoes', price: '€89.00' },
  { id: 2, name: 'Yoga mat', price: '€34.00' },
  { id: 3, name: 'Steel water bottle', price: '€12.50' },
];
const ORDERS: Record<number, { name: string; email: string; item: string; total: string; address: string }> = {
  1041: { name: 'Anna Novak', email: 'anna@test.com', item: 'Trail Runner shoes', total: '€89.00', address: '21 Baker St, Zagreb' },
  1042: { name: 'Anna Novak', email: 'anna@test.com', item: 'Steel water bottle', total: '€12.50', address: '21 Baker St, Zagreb' },
  1043: { name: 'Ben Okafor', email: 'ben.okafor@test.com', item: 'Yoga mat', total: '€34.00', address: '7 Elm Rd, Split' },
  1044: { name: 'Carla Ruiz', email: 'carla.ruiz@test.com', item: 'Trail Runner shoes', total: '€89.00', address: '3 Harbour Ln, Rijeka' },
};
const MY_ORDERS = [1041, 1042];

interface Review {
  id: number;
  author: string;
  email: string;
  rating: number;
  text: string;
}
const seedReviews = (): Record<number, Review[]> => ({
  1: [
    { id: 1, author: 'Ben O.', email: 'ben.okafor@test.com', rating: 5, text: 'Great grip on wet trails. Runs a bit small.' },
    { id: 2, author: 'Carla R.', email: 'carla.ruiz@test.com', rating: 4, text: 'Comfortable from day one, arrived in two days.' },
  ],
  2: [],
  3: [],
});

interface NetEntry {
  id: number;
  method: 'GET' | 'POST';
  url: string;
  status: number;
  body: unknown;
}

/** BUG 3 (simulated): a few harmless tags are rendered as real formatting instead of text. */
function renderUnsafe(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /<(b|strong|i|em|u|s|mark|h3)>([\s\S]*?)<\/\1>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tag = m[1].toLowerCase();
    const inner = m[2];
    if (tag === 'b' || tag === 'strong') out.push(<strong key={k++}>{inner}</strong>);
    else if (tag === 'i' || tag === 'em') out.push(<em key={k++}>{inner}</em>);
    else if (tag === 'u') out.push(<u key={k++}>{inner}</u>);
    else if (tag === 's') out.push(<s key={k++}>{inner}</s>);
    else if (tag === 'mark') out.push(<mark key={k++}>{inner}</mark>);
    else
      out.push(
        <span key={k++} className="block text-[20px] font-bold">
          {inner}
        </span>,
      );
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

const btn = 'rounded-lg px-3 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4bff]';
const field = 'w-full min-w-0 rounded-lg border border-[#d0d4df] bg-white px-3 py-2 text-[13px] text-[#0e1120] outline-none focus:border-[#0d7a5f] focus:ring-2 focus:ring-[#0d7a5f]/25';

export function BuggySecurityShop() {
  const [path, setPath] = useState('/login');
  const [input, setInput] = useState('/login');
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reviews, setReviews] = useState(seedReviews);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [net, setNet] = useState<NetEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const nextId = useRef(1);

  const log = (entries: Omit<NetEntry, 'id'>[]) => {
    const withIds = entries.map((e) => ({ ...e, id: nextId.current++ }));
    setNet((n) => [...withIds.reverse(), ...n].slice(0, 8));
  };

  /** Works out which API call a page makes, and logs it. Returns the final path (after redirects). */
  const navigate = (raw: string, loggedIn = user, extra: Omit<NetEntry, 'id'>[] = []) => {
    let p = raw.trim().replace(/^https?:\/\//, '').replace(/^fitshop\.test/, '');
    if (!p.startsWith('/')) p = `/${p}`;
    const [pathname, qs = ''] = p.split('?');
    const clean = pathname.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(qs);
    const entries = [...extra];
    const protectedPage = clean === '/account' || clean === '/admin' || clean.startsWith('/orders');
    let final = clean + (qs ? `?${qs}` : '');

    if (protectedPage && !loggedIn) {
      entries.push({ method: 'GET', url: '/api/me', status: 401, body: { error: 'Not logged in' } });
      final = '/login';
    } else if (clean === '/account') {
      entries.push({ method: 'GET', url: '/api/me', status: 200, body: { id: 7, name: ACCOUNT.name, email: ACCOUNT.email } });
    } else if (clean.startsWith('/orders/')) {
      const id = Number(clean.split('/')[2]);
      const o = ORDERS[id];
      entries.push(o ? { method: 'GET', url: `/api/orders/${id}`, status: 200, body: { id, ...o } } : { method: 'GET', url: `/api/orders/${clean.split('/')[2]}`, status: 404, body: { error: 'Order not found' } });
    } else if (clean === '/admin') {
      entries.push({ method: 'GET', url: '/api/admin/users', status: 200, body: [ACCOUNT.email, 'ben.okafor@test.com', 'carla.ruiz@test.com'].map((e, i) => ({ id: i + 7, email: e })) });
    } else if (clean.startsWith('/products/')) {
      const id = Number(clean.split('/')[2]);
      if (PRODUCTS.some((x) => x.id === id)) {
        entries.push({ method: 'GET', url: `/api/products/${id}/reviews`, status: 200, body: reviews[id] }); // BUG 5
      }
    } else if (clean === '/search') {
      const q = params.get('q') ?? '';
      entries.push(
        q.includes("'")
          ? { method: 'GET', url: `/api/search?q=${encodeURIComponent(q)}`, status: 500, body: { error: 'SQLSyntaxErrorException' } }
          : { method: 'GET', url: `/api/search?q=${encodeURIComponent(q)}`, status: 200, body: PRODUCTS.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())) },
      );
    }
    setPath(final);
    setInput(final);
    if (entries.length) log(entries);
  };

  const login = (e: FormEvent) => {
    e.preventDefault();
    // BUG 6: the form uses method="GET", so the credentials become query parameters.
    const qs = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const ok = email.trim().toLowerCase() === ACCOUNT.email && password === ACCOUNT.password;
    const request: Omit<NetEntry, 'id'> = { method: 'GET', url: `/login?${qs}`, status: ok ? 302 : 401, body: ok ? { redirect: '/account' } : { error: 'Email or password is incorrect.' } };
    if (ok) {
      setUser(ACCOUNT.name);
      setLoginError('');
      setPassword('');
      navigate(`/account?${qs}`, ACCOUNT.name, [request]);
    } else {
      setLoginError('Email or password is incorrect.');
      setPath(`/login?${qs}`);
      setInput(`/login?${qs}`);
      log([request]);
    }
  };

  const logout = () => {
    setUser(null);
    setEmail('');
    navigate('/login', null, [{ method: 'POST', url: '/api/logout', status: 204, body: undefined }]);
  };

  const postReview = (productId: number) => (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const review: Review = { id: Date.now(), author: 'Anna N.', email: ACCOUNT.email, rating: 5, text };
    setReviews((r) => ({ ...r, [productId]: [...r[productId], review] }));
    setDraft('');
    log([{ method: 'POST', url: '/api/reviews', status: 201, body: { id: review.id, productId, text } }]);
  };

  // ---- Page rendering
  const [pathname, qs = ''] = path.split('?');
  const params = new URLSearchParams(qs);
  let page: ReactNode;

  if (pathname === '/login') {
    page = (
      <form onSubmit={login} className="space-y-3">
        <p className="text-[18px] font-bold">Log in</p>
        <div className="rounded-lg bg-[#eef7f3] px-3 py-2 text-[11.5px] text-[#2f5d50]">
          Test account: <strong>{ACCOUNT.email}</strong> / <strong>{ACCOUNT.password}</strong>
        </div>
        <div>
          <label htmlFor="sec-email" className="mb-1 block text-[12px] font-medium text-[#5c6178]">
            Email
          </label>
          <input id="sec-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="sec-pass" className="mb-1 block text-[12px] font-medium text-[#5c6178]">
            Password
          </label>
          <input id="sec-pass" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </div>
        {loginError && (
          <p role="alert" className="text-[12px] font-medium text-[#b91c1c]">
            {loginError}
          </p>
        )}
        <button type="submit" className={`${btn} w-full`} style={{ background: ACCENT }}>
          Log in
        </button>
      </form>
    );
  } else if (pathname === '/account' && user) {
    page = (
      <div>
        <p className="text-[18px] font-bold">Hi, Anna</p>
        <p className="text-[12px] text-[#5c6178]">{ACCOUNT.email}</p>
        <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Your orders</p>
        <div className="space-y-1.5">
          {MY_ORDERS.map((id) => (
            <button key={id} type="button" onClick={() => navigate(`/orders/${id}`)} className="flex w-full items-center gap-2 rounded-lg border border-[#e5e7ef] px-3 py-2 text-left text-[13px] hover:bg-[#f6f7fb]">
              <Package size={15} style={{ color: ACCENT }} />
              <span className="min-w-0 flex-1">
                Order #{id} · {ORDERS[id].item}
              </span>
              <ArrowRight size={14} className="text-[#8a8fa3]" />
            </button>
          ))}
        </div>
      </div>
    );
  } else if (pathname.startsWith('/orders/') && user) {
    const id = Number(pathname.split('/')[2]);
    const o = ORDERS[id]; // BUG 1: no ownership check
    page = o ? (
      <div>
        <p className="text-[11px] text-[#5c6178]">Order #{id}</p>
        <p className="text-[18px] font-bold">{o.item}</p>
        <dl className="mt-3 space-y-1.5 text-[13px]">
          {[
            ['Customer', o.name],
            ['Ship to', o.address],
            ['Total', o.total],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-[#f0f1f5] pb-1.5">
              <dt className="text-[#5c6178]">{k}</dt>
              <dd className="min-w-0 text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    ) : (
      <p className="py-8 text-center text-[13px] text-[#5c6178]">404 · Order not found</p>
    );
  } else if (pathname === '/admin' && user) {
    // BUG 2: no role check
    page = (
      <div>
        <p className="flex items-center gap-1.5 text-[18px] font-bold">
          <Wrench size={17} style={{ color: ACCENT }} /> Admin
        </p>
        <p className="mt-3 mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Customers</p>
        <ul className="space-y-1 text-[12.5px]">
          {[ACCOUNT.email, 'ben.okafor@test.com', 'carla.ruiz@test.com'].map((e) => (
            <li key={e} className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e7ef] px-3 py-1.5">
              <span className="min-w-0 truncate">{e}</span>
              <span className="shrink-0 rounded bg-[#fee2e2] px-1.5 text-[11px] font-semibold text-[#b91c1c]">Delete</span>
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (pathname === '/shop' || pathname === '/') {
    page = (
      <div>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/search?q=${encodeURIComponent(query)}`);
          }}
        >
          <input aria-label="Search products" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className={`${field} w-0 flex-1`} />
          <button type="submit" aria-label="Search" className={btn} style={{ background: ACCENT }}>
            <Search size={15} />
          </button>
        </form>
        <div className="mt-3 space-y-1.5">
          {PRODUCTS.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/products/${p.id}`)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e5e7ef] px-3 py-2 text-left text-[13px] hover:bg-[#f6f7fb]">
              <span className="min-w-0">{p.name}</span>
              <span className="shrink-0 font-semibold">{p.price}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (pathname === '/search') {
    const q = params.get('q') ?? '';
    page = q.includes("'") ? (
      // BUG 4
      <div className="font-mono text-[11px] leading-relaxed text-[#7f1d1d]">
        <p className="font-sans text-[16px] font-bold text-[#b91c1c]">500 Internal Server Error</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-[#fef2f2] p-2.5 break-all whitespace-pre-wrap">
          {`SQLSyntaxErrorException: You have an error in your SQL syntax near '${q.slice(q.indexOf("'") + 1)}%'' at line 1
    at ProductRepository.search (/srv/fitshop/src/repo/products.js:48:13)
    at SearchController.get (/srv/fitshop/src/controllers/search.js:22:5)
Query: SELECT * FROM products WHERE name LIKE '%${q}%'`}
        </pre>
      </div>
    ) : (
      <div>
        <p className="text-[13px] text-[#5c6178]">
          Results for “<span className="font-semibold text-[#0e1120]">{q}</span>”
        </p>
        <div className="mt-2 space-y-1.5">
          {PRODUCTS.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/products/${p.id}`)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e5e7ef] px-3 py-2 text-left text-[13px] hover:bg-[#f6f7fb]">
              <span className="min-w-0">{p.name}</span>
              <span className="shrink-0 font-semibold">{p.price}</span>
            </button>
          ))}
          {!PRODUCTS.some((x) => x.name.toLowerCase().includes(q.toLowerCase())) && <p className="py-4 text-center text-[13px] text-[#5c6178]">No products found.</p>}
        </div>
      </div>
    );
  } else if (pathname.startsWith('/products/') && PRODUCTS.some((x) => x.id === Number(pathname.split('/')[2]))) {
    const id = Number(pathname.split('/')[2]);
    const p = PRODUCTS.find((x) => x.id === id)!;
    page = (
      <div>
        <p className="text-[18px] font-bold">{p.name}</p>
        <p className="text-[14px] font-semibold" style={{ color: ACCENT }}>
          {p.price}
        </p>
        <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Reviews ({reviews[id].length})</p>
        <ul className="space-y-1.5">
          {reviews[id].map((r) => (
            <li key={r.id} className="rounded-lg bg-[#f6f7fb] px-3 py-2 text-[13px]">
              <p className="flex items-center gap-1 text-[11.5px] font-semibold">
                {r.author}
                <span className="flex text-[#f59e0b]">
                  {Array.from({ length: r.rating }, (_, i) => (
                    <Star key={i} size={10} fill="currentColor" />
                  ))}
                </span>
              </p>
              <p className="mt-0.5 break-words">{renderUnsafe(r.text)}</p>
            </li>
          ))}
          {reviews[id].length === 0 && <li className="text-[12.5px] text-[#5c6178]">No reviews yet.</li>}
        </ul>
        {user ? (
          <form onSubmit={postReview(id)} className="mt-3 flex gap-2">
            <input aria-label="Write a review" placeholder="Write a review…" value={draft} onChange={(e) => setDraft(e.target.value)} className={`${field} w-0 flex-1`} />
            <button type="submit" className={btn} style={{ background: ACCENT }}>
              Post
            </button>
          </form>
        ) : (
          <p className="mt-3 text-[12px] text-[#5c6178]">Log in to write a review.</p>
        )}
      </div>
    );
  } else {
    page = <p className="py-8 text-center text-[13px] text-[#5c6178]">404 · Page not found</p>;
  }

  const sel = net.find((n) => n.id === selected);

  return (
    <div className="flex w-full max-w-[440px] min-w-0 flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-white text-[#0e1120] shadow-sm">
        <form
          className="flex items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(input);
          }}
        >
          <Lock size={13} className="shrink-0 text-[#5c6178]" />
          <span className="shrink-0 font-mono text-[11.5px] text-[#5c6178]">fitshop.test</span>
          <input
            aria-label="Address bar path"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-0 min-w-0 flex-1 rounded-md border border-[#d9dce6] bg-white px-2 py-1 font-mono text-[11.5px] outline-none focus:border-[#5b4bff] focus:ring-2 focus:ring-[#5b4bff]/25"
          />
          <button type="submit" className="shrink-0 rounded-md bg-[#0e1120] px-2.5 py-1 text-[12px] font-semibold text-white">
            Go
          </button>
        </form>
        <div className="flex items-center gap-3 border-b border-[#f0f1f5] px-4 py-2 text-[12.5px]">
          <span className="font-bold" style={{ color: ACCENT }}>
            FitShop
          </span>
          <button type="button" onClick={() => navigate('/shop')} className="text-[#3d4257] hover:underline">
            Shop
          </button>
          {user && (
            <button type="button" onClick={() => navigate('/account')} className="text-[#3d4257] hover:underline">
              Account
            </button>
          )}
          {user ? (
            <button type="button" onClick={logout} className="ml-auto text-[#3d4257] hover:underline">
              Log out
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/login')} className="ml-auto text-[#3d4257] hover:underline">
              Log in
            </button>
          )}
        </div>
        <div className="min-h-[260px] px-4 py-4">{page}</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold tracking-wide text-white/50 uppercase">DevTools · Network</p>
        <ul className="min-h-[4.5rem] px-1.5 py-1.5 font-mono">
          {net.length === 0 && <li className="px-1.5 py-1 text-white/35">Requests appear here. Click one to see its response.</li>}
          {net.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setSelected((s) => (s === n.id ? null : n.id))}
                aria-pressed={selected === n.id}
                className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-white/5 ${selected === n.id ? 'bg-white/10' : ''}`}
              >
                <span className={`w-9 shrink-0 ${n.method === 'GET' ? 'text-[#7dd3fc]' : 'text-[#fcd34d]'}`}>{n.method}</span>
                <span className="min-w-0 flex-1 truncate">{n.url}</span>
                <span className={n.status < 300 ? 'text-[#34d399]' : n.status < 400 ? 'text-[#93c5fd]' : 'text-[#f87171]'}>{n.status}</span>
              </button>
            </li>
          ))}
        </ul>
        {sel && (
          <div className="border-t border-white/10 px-3 py-2">
            <p className="mb-1 font-mono break-all text-white/60">
              {sel.method} {sel.url}
            </p>
            {sel.body === undefined ? <p className="text-white/40">(no response body)</p> : <JsonView value={sel.body} />}
          </div>
        )}
      </div>
    </div>
  );
}
