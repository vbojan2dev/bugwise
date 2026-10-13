import { useState } from 'react';
import { CalendarClock, Clock, Cookie as CookieIcon, LogOut, Power, RotateCcw, RotateCw, ShoppingCart, Timer, X, AppWindow } from 'lucide-react';
import { ApplicationPanel } from './ApplicationPanel';
import { kvDel, kvGet, kvSet, type Cookie, type KV } from './types';

/*
 * "Pantry": a mock shop next to a DevTools Application panel. Logging in, "Remember me",
 * the cart, the consent banner and the browser controls (close tab, quit browser, wait)
 * all read and write cookies, localStorage and sessionStorage.
 * The whole simulation (browser + server) is one pure state object, so quick clicks never
 * see stale data.
 *
 * With buggy={true} the same shop hides six bugs (don't spoil them for learners!):
 *  1. "Reject all" still sets the _ga analytics cookies.
 *  2. Logout leaves auth_token in localStorage, and a reload silently logs you back in.
 *  3. The session cookie has no HttpOnly / Secure flags (and no SameSite).
 *  4. "Remember me" is ignored: the session cookie always gets a 30-day expiry,
 *     so you stay logged in after quitting the browser.
 *  5. The cart lives in localStorage under one shared key and isn't cleared on logout,
 *     so user B sees user A's cart.
 *  6. The server session never expires (no idle timeout).
 */

const ORIGIN = 'pantry.example';
const BASE = Date.UTC(2026, 9, 13, 9, 0); // Tue 13 Oct 2026, 09:00 UTC
const MIN = 1;
const DAY = 24 * 60;
const IDLE_LIMIT = 30 * MIN;
const REMEMBER = 30 * DAY;

const USERS = {
  anna: { name: 'Anna', email: 'anna@test.com' },
  ben: { name: 'Ben', email: 'ben@test.com' },
};
type UserId = keyof typeof USERS;

const PRODUCTS = [
  { id: 'oil', name: 'Olive oil, 750 ml', price: 8.9 },
  { id: 'coffee', name: 'Coffee beans, 1 kg', price: 11.5 },
  { id: 'pasta', name: 'Fusilli pasta, 500 g', price: 1.8 },
];
type Item = { id: string; qty: number };

interface BCookie extends Omit<Cookie, 'expires'> {
  /** Simulated minute when the cookie expires; null = session cookie. */
  expiresAt: number | null;
}

interface Session {
  user: UserId;
  remember: boolean;
  lastSeen: number;
}

interface State {
  clock: number;
  cookies: BCookie[];
  local: KV;
  session: KV;
  server: { sessions: Record<string, Session>; carts: Partial<Record<UserId, Item[]>>; nextSid: number };
  page: { user: UserId | null; cart: Item[]; notice: string | null; banner: boolean; promo: boolean };
  events: { id: number; text: string }[];
}

const initial = (): State => ({
  clock: 0,
  cookies: [],
  local: [],
  session: [],
  server: { sessions: {}, carts: {}, nextSid: 1 },
  page: { user: null, cart: [], notice: null, banner: true, promo: true },
  events: [{ id: 0, text: 'Page loaded. No cookies yet: the consent banner is waiting for your choice.' }],
});

const iso = (min: number) => new Date(BASE + min * 60000).toISOString();
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clockLabel = (min: number) => {
  const d = new Date(BASE + min * 60000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
};

const parseCart = (v: string | undefined): Item[] => {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.id === 'string' && typeof i.qty === 'number') : [];
  } catch {
    return [];
  }
};
const mergeCarts = (a: Item[], b: Item[]): Item[] => {
  const out = a.map((i) => ({ ...i }));
  b.forEach((i) => {
    const hit = out.find((o) => o.id === i.id);
    if (hit) hit.qty += i.qty;
    else out.push({ ...i });
  });
  return out;
};

const setCookie = (cookies: BCookie[], c: BCookie) => [...cookies.filter((x) => x.name !== c.name), c];
const delCookie = (cookies: BCookie[], name: string) => cookies.filter((x) => x.name !== name);
const getCookie = (st: State, name: string) => st.cookies.find((c) => c.name === name);
const purge = (st: State): State => ({ ...st, cookies: st.cookies.filter((c) => c.expiresAt === null || c.expiresAt > st.clock) });
const ev = (st: State, text: string): State => ({ ...st, events: [{ id: (st.events[0]?.id ?? 0) + 1, text }, ...st.events].slice(0, 4) });

const ANALYTICS = ['_ga', '_ga_K7Q2PL', 'IDE'];

export default function StorageLab({ buggy = false }: { buggy?: boolean }) {
  const [st, setSt] = useState<State>(initial);
  const [loginAs, setLoginAs] = useState<UserId>('anna');
  const [remember, setRemember] = useState(false);
  const act = (fn: (s: State) => State) => setSt((s) => fn(s));

  /* ───────── Server side ───────── */

  /** Validates the session cookie like the server would. Returns the new state and the user (or null). */
  const auth = (s0: State): { s: State; user: UserId | null; expired: boolean } => {
    const sid = getCookie(s0, 'session_id')?.value;
    if (!sid) return { s: s0, user: null, expired: false };
    const sess = s0.server.sessions[sid];
    if (!sess) return { s: { ...s0, cookies: delCookie(s0.cookies, 'session_id') }, user: null, expired: false };
    const limit = sess.remember ? REMEMBER : IDLE_LIMIT;
    if (!buggy && s0.clock - sess.lastSeen > limit) {
      const sessions = { ...s0.server.sessions };
      delete sessions[sid];
      return { s: { ...s0, server: { ...s0.server, sessions }, cookies: delCookie(s0.cookies, 'session_id') }, user: null, expired: true };
    }
    // BUG 6 (buggy): no idle check at all.
    return { s: { ...s0, server: { ...s0.server, sessions: { ...s0.server.sessions, [sid]: { ...sess, lastSeen: s0.clock } } } }, user: sess.user, expired: false };
  };

  const createSession = (s0: State, user: UserId, rememberMe: boolean): State => {
    const sid = `s_${(0x9f2c00 + s0.server.nextSid * 7919).toString(16)}${s0.server.nextSid}`;
    const cookie: BCookie = buggy
      ? // BUG 3 + BUG 4: no flags, always persistent
        { name: 'session_id', value: sid, domain: ORIGIN, path: '/', expiresAt: s0.clock + REMEMBER, httpOnly: false, secure: false, sameSite: '' }
      : { name: 'session_id', value: sid, domain: ORIGIN, path: '/', expiresAt: rememberMe ? s0.clock + REMEMBER : null, httpOnly: true, secure: true, sameSite: 'Lax' };
    return {
      ...s0,
      cookies: setCookie(s0.cookies, cookie),
      server: { ...s0.server, nextSid: s0.server.nextSid + 1, sessions: { ...s0.server.sessions, [sid]: { user, remember: rememberMe, lastSeen: s0.clock } } },
    };
  };

  /** A full page load: the browser drops expired cookies, the app reads storage and asks the server who you are. */
  const navigate = (s0: State, reason: string): State => {
    let s = purge(s0);
    const r = auth(s);
    s = r.s;
    let user = r.user;
    let notice: string | null = r.expired ? 'Your session expired. Please log in again.' : null;
    const token = kvGet(s.local, 'auth_token');
    if (buggy && !user && token) {
      // BUG 2: the app "restores" the login from a token that logout never removed.
      const tokenUser = (token.includes('YmVu') ? 'ben' : 'anna') as UserId;
      s = createSession(s, tokenUser, false);
      user = tokenUser;
      notice = null;
    }
    return ev(
      {
        ...s,
        page: {
          user,
          cart: parseCart(kvGet(s.local, 'cart')),
          notice,
          banner: !getCookie(s, 'cookie_consent'),
          promo: kvGet(s.session, 'promo_dismissed') !== '1',
        },
      },
      reason + (r.expired ? ' The server said the session had expired (401).' : ''),
    );
  };

  /* ───────── Page actions ───────── */

  const login = () =>
    act((s0) => {
      let s = createSession(s0, loginAs, remember);
      let cart = s.page.cart;
      if (buggy) {
        // BUG 2 setup: token in localStorage. BUG 5: cart is neither loaded per user nor cleared.
        const payload = loginAs === 'ben' ? 'eyJzdWIiOiJiZW4iLCJyb2xlIjoiY3VzdG9tZXIifQ' : 'eyJzdWIiOiJhbm5hIiwicm9sZSI6ImN1c3RvbWVyIn0';
        const tokenUser = loginAs === 'ben' ? 'YmVu' : 'YW5uYQ';
        s = { ...s, local: kvSet(s.local, 'auth_token', `eyJhbGciOiJIUzI1NiJ9.${payload}.${tokenUser}Xk9`) };
      } else {
        cart = mergeCarts(s.server.carts[loginAs] ?? [], parseCart(kvGet(s.local, 'cart')));
        s = { ...s, server: { ...s.server, carts: { ...s.server.carts, [loginAs]: cart } } };
        s = { ...s, local: cart.length ? kvSet(s.local, 'cart', JSON.stringify(cart)) : kvDel(s.local, 'cart') };
      }
      return ev(
        { ...s, page: { ...s.page, user: loginAs, cart, notice: null } },
        `Logged in as ${USERS[loginAs].email}${remember ? ' with "Remember me"' : ''}. The server sent Set-Cookie: session_id.`,
      );
    });

  const logout = () =>
    act((s0) => {
      const sid = getCookie(s0, 'session_id')?.value;
      const sessions = { ...s0.server.sessions };
      if (sid) delete sessions[sid];
      let s: State = { ...s0, server: { ...s0.server, sessions }, cookies: delCookie(s0.cookies, 'session_id') };
      if (!buggy) s = { ...s, local: kvDel(s.local, 'cart') };
      return ev({ ...s, page: { ...s.page, user: null, cart: buggy ? s.page.cart : [], notice: 'You have been logged out.' } }, 'Logged out. The server deleted the session and cleared the session_id cookie.');
    });

  const addToCart = (id: string) =>
    act((s0) => {
      let s = s0;
      let user = s.page.user;
      let notice = s.page.notice;
      let expiredMsg = '';
      if (user) {
        const r = auth(s);
        s = r.s;
        if (!r.user) {
          user = null;
          notice = 'Your session expired. Please log in again.';
          expiredMsg = ' The request came back 401: you are logged out now.';
        }
      }
      const cart = mergeCarts(s.page.cart, [{ id, qty: 1 }]);
      s = { ...s, local: kvSet(s.local, 'cart', JSON.stringify(cart)) };
      if (user) s = { ...s, server: { ...s.server, carts: { ...s.server.carts, [user]: cart } } };
      const name = PRODUCTS.find((p) => p.id === id)?.name ?? id;
      return ev({ ...s, page: { ...s.page, user, cart, notice } }, `Added ${name}. The cart was written to localStorage.${expiredMsg}`);
    });

  const consent = (accept: boolean) =>
    act((s0) => {
      let cookies = setCookie(s0.cookies, {
        name: 'cookie_consent',
        value: accept ? 'necessary:1|analytics:1|ads:1' : 'necessary:1|analytics:0|ads:0',
        domain: ORIGIN,
        path: '/',
        expiresAt: s0.clock + 180 * DAY,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      });
      const ga: BCookie[] = [
        { name: '_ga', value: 'GA1.1.902114387.1760346000', domain: `.${ORIGIN}`, path: '/', expiresAt: s0.clock + 400 * DAY, httpOnly: false, secure: false, sameSite: '' },
        { name: '_ga_K7Q2PL', value: 'GS1.1.1760346000.1.0.1760346000.0.0.0', domain: `.${ORIGIN}`, path: '/', expiresAt: s0.clock + 400 * DAY, httpOnly: false, secure: false, sameSite: '' },
      ];
      if (accept) {
        ga.forEach((c) => (cookies = setCookie(cookies, c)));
        cookies = setCookie(cookies, { name: 'IDE', value: 'AHWqTUk3r9-0bX2', domain: '.adnet.example', path: '/', expiresAt: s0.clock + 390 * DAY, httpOnly: true, secure: true, sameSite: 'None' });
      } else if (buggy) {
        ga.forEach((c) => (cookies = setCookie(cookies, c))); // BUG 1
      } else {
        cookies = cookies.filter((c) => !ANALYTICS.includes(c.name));
      }
      return ev({ ...s0, cookies, page: { ...s0.page, banner: false } }, accept ? 'Accepted all cookies: consent saved, analytics and ad cookies set.' : 'Rejected optional cookies: only the consent choice itself is saved.');
    });

  const dismissPromo = () => act((s) => ev({ ...s, session: kvSet(s.session, 'promo_dismissed', '1'), page: { ...s.page, promo: false } }, 'Promo dismissed: saved in sessionStorage (this tab only).'));

  /* ───────── Browser controls ───────── */

  const reload = () => act((s) => navigate(s, 'Page reloaded.'));
  const closeTab = () => act((s) => navigate({ ...s, session: [] }, 'Tab closed and reopened: sessionStorage is gone, cookies and localStorage survived.'));
  const quitBrowser = () =>
    act((s) => navigate({ ...s, session: [], cookies: s.cookies.filter((c) => c.expiresAt !== null) }, 'Browser quit and reopened: session cookies and sessionStorage were deleted.'));
  const wait = (mins: number, label: string) => act((s) => navigate({ ...s, clock: s.clock + mins }, `${label} later, you come back and reload.`));
  const restart = () => {
    setSt(initial());
    setRemember(false);
    setLoginAs('anna');
  };

  /* ───────── Render ───────── */

  const p = st.page;
  const cartCount = p.cart.reduce((a, i) => a + i.qty, 0);
  const cartTotal = p.cart.reduce((a, i) => a + (PRODUCTS.find((x) => x.id === i.id)?.price ?? 0) * i.qty, 0);
  const uid = buggy ? 'b' : 'p';
  const cookiesForPanel: Cookie[] = st.cookies.map(({ expiresAt, ...c }) => ({ ...c, expires: expiresAt === null ? 'Session' : iso(expiresAt) }));

  const ctrl = 'flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand';

  return (
    <div className="not-prose @container w-full min-w-0">
      <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Browser + page */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-white text-[#0f172a] shadow-[0_18px_40px_-18px_rgba(16,18,35,.3)]" style={{ colorScheme: 'light' }}>
          <div className="flex items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2">
            <div className="flex shrink-0 gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <button type="button" onClick={reload} aria-label="Reload page" title="Reload page" className="grid size-7 shrink-0 place-items-center rounded-md text-[#5f6368] hover:bg-[#e8eaed] focus-visible:outline-2 focus-visible:outline-[#1a73e8]">
              <RotateCw size={14} />
            </button>
            <div className="min-w-0 flex-1 truncate rounded-lg border border-[#e5e7ef] bg-white px-3 py-1 font-mono text-[11px] text-[#5f6368]">{ORIGIN}</div>
          </div>
          <div className="relative h-[400px]">
            <div className="h-full overflow-auto bg-[#fafaf7]">
              {p.promo && (
                <div className="flex items-center gap-2 bg-[#1e3a2f] px-3 py-1.5 text-[11px] text-white">
                  <span className="min-w-0 flex-1">Free delivery on orders over €40</span>
                  <button type="button" onClick={dismissPromo} aria-label="Dismiss promotion" className="rounded p-0.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white">
                    <X size={12} />
                  </button>
                </div>
              )}
              <header className="flex items-center justify-between gap-2 border-b border-[#e7e5e4] bg-white px-3 py-2">
                <span className="font-serif text-[17px] font-bold text-[#1e3a2f]">Pantry</span>
                <div className="flex min-w-0 items-center gap-2 text-[12px]">
                  <span className="truncate font-medium">{p.user ? `Hi, ${USERS[p.user].name}` : 'Guest'}</span>
                  <span className="flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 font-semibold text-[#065f46]" aria-label={`Cart, ${cartCount} items`}>
                    <ShoppingCart size={12} /> {cartCount}
                  </span>
                </div>
              </header>
              <div className="space-y-3 p-3">
                {p.notice && (
                  <div role="status" className="flex items-start gap-2 rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-2.5 py-1.5 text-[12px] text-[#78350f]">
                    <span className="min-w-0 flex-1">{p.notice}</span>
                    <button type="button" aria-label="Dismiss message" onClick={() => act((s) => ({ ...s, page: { ...s.page, notice: null } }))} className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-[#78350f]">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {p.user ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[#e7e5e4] bg-white p-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1e3a2f] text-[13px] font-semibold text-white">{USERS[p.user].name[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold">{USERS[p.user].name}</p>
                      <p className="truncate text-[11px] text-[#57534e]">{USERS[p.user].email}</p>
                    </div>
                    <button type="button" onClick={logout} className="flex items-center gap-1 rounded-lg border border-[#d6d3d1] px-2 py-1 text-[12px] font-medium hover:bg-[#f5f5f4] focus-visible:outline-2 focus-visible:outline-[#1e3a2f]">
                      <LogOut size={12} /> Log out
                    </button>
                  </div>
                ) : (
                  <form
                    className="space-y-2 rounded-xl border border-[#e7e5e4] bg-white p-2.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      login();
                    }}
                  >
                    <p className="text-[13px] font-semibold">Log in</p>
                    <div className="grid grid-cols-1 gap-2 @xs:grid-cols-2">
                      <label className="block min-w-0 text-[11px] font-medium text-[#57534e]">
                        Email
                        <select
                          value={loginAs}
                          onChange={(e) => setLoginAs(e.target.value as UserId)}
                          className="mt-0.5 block w-full min-w-0 rounded-lg border border-[#d6d3d1] bg-white px-2 py-1.5 text-[12px] text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#1e3a2f]"
                        >
                          <option value="anna">anna@test.com</option>
                          <option value="ben">ben@test.com</option>
                        </select>
                      </label>
                      <label className="block min-w-0 text-[11px] font-medium text-[#57534e]">
                        Password
                        <input type="password" value="test-only" readOnly className="mt-0.5 block w-full min-w-0 rounded-lg border border-[#d6d3d1] bg-[#f5f5f4] px-2 py-1.5 text-[12px] text-[#0f172a]" aria-describedby={`pw-note-${uid}`} />
                      </label>
                    </div>
                    <p id={`pw-note-${uid}`} className="text-[10px] text-[#78716c]">
                      Test accounts, password pre-filled.
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[12px]">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#1e3a2f]" /> Remember me
                      </label>
                      <button type="submit" className="rounded-lg bg-[#1e3a2f] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#14532d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a2f]">
                        Log in
                      </button>
                    </div>
                  </form>
                )}

                <ul className="divide-y divide-[#e7e5e4] rounded-xl border border-[#e7e5e4] bg-white">
                  {PRODUCTS.map((pr) => (
                    <li key={pr.id} className="flex items-center gap-2 px-2.5 py-2">
                      <span className="min-w-0 flex-1 text-[12px] font-medium">{pr.name}</span>
                      <span className="text-[12px] tabular-nums">€{pr.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(pr.id)}
                        aria-label={`Add ${pr.name} to cart`}
                        className="min-h-8 rounded-lg border border-[#1e3a2f] px-2.5 text-[12px] font-semibold text-[#1e3a2f] hover:bg-[#ecfdf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a2f]"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-[#e7e5e4] bg-white p-2.5 text-[12px]">
                  <p className="font-semibold">Your cart</p>
                  {p.cart.length === 0 ? (
                    <p className="text-[#78716c]">Empty</p>
                  ) : (
                    <>
                      <ul className="mt-1 space-y-0.5">
                        {p.cart.map((i) => (
                          <li key={i.id} className="flex justify-between gap-2">
                            <span className="min-w-0 truncate">
                              {i.qty} × {PRODUCTS.find((x) => x.id === i.id)?.name ?? i.id}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 border-t border-[#e7e5e4] pt-1 font-semibold tabular-nums">Total €{cartTotal.toFixed(2)}</p>
                    </>
                  )}
                </div>

                <footer className="pb-24 text-center text-[11px] text-[#78716c]">
                  <button type="button" onClick={() => act((s) => ({ ...s, page: { ...s.page, banner: true } }))} className="underline hover:text-[#1e3a2f] focus-visible:outline-2 focus-visible:outline-[#1e3a2f]">
                    Cookie settings
                  </button>
                </footer>
              </div>
            </div>

            {p.banner && (
              <div role="dialog" aria-label="Cookie consent" className="absolute inset-x-2 bottom-2 rounded-xl border border-[#d6d3d1] bg-white p-3 text-[12px] shadow-[0_10px_30px_-8px_rgba(0,0,0,.35)]">
                <p className="flex items-center gap-1.5 font-semibold">
                  <CookieIcon size={14} /> We value your privacy
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[#57534e]">We use necessary cookies to run the shop. With your OK we also use analytics and advertising cookies.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => consent(false)} className="rounded-lg border border-[#1e3a2f] px-2 py-1.5 font-semibold text-[#1e3a2f] hover:bg-[#ecfdf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a2f]">
                    Reject all
                  </button>
                  <button type="button" onClick={() => consent(true)} className="rounded-lg bg-[#1e3a2f] px-2 py-1.5 font-semibold text-white hover:bg-[#14532d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a2f]">
                    Accept all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DevTools Application panel */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line-strong bg-white" style={{ colorScheme: 'light' }}>
          <div className="flex items-center gap-2 border-b border-[#d7dae0] bg-[#f1f3f4] px-3 py-1.5 text-[12px] text-[#1f1f1f]">
            <span className="font-semibold">DevTools</span>
            <span className="text-[#5f6368]">›</span>
            <span>Application</span>
          </div>
          <ApplicationPanel
            origin={ORIGIN}
            cookies={cookiesForPanel}
            local={st.local}
            session={st.session}
            initialArea="cookies"
            height={220}
            onDeleteCookie={(name) => act((s) => ev({ ...s, cookies: delCookie(s.cookies, name) }, `Deleted cookie ${name}. The page doesn't know yet: reload or add something to the cart.`))}
            onDeleteLocal={(k) => act((s) => ev({ ...s, local: kvDel(s.local, k) }, `Deleted localStorage "${k}". Reload to see the effect.`))}
            onDeleteSession={(k) => act((s) => ev({ ...s, session: kvDel(s.session, k) }, `Deleted sessionStorage "${k}". Reload to see the effect.`))}
            onClearSite={() => act((s) => ev({ ...s, cookies: [], local: [], session: [] }, 'Cleared all site data (cookies, localStorage, sessionStorage). Reload to see the effect.'))}
          />
        </div>
      </div>

      {/* Browser controls */}
      <div className="mt-3 rounded-2xl border border-line bg-subtle p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Browser controls</p>
          <p className="flex items-center gap-1 font-mono text-xs text-muted">
            <Clock size={12} /> {clockLabel(st.clock)}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={ctrl} onClick={reload}>
            <RotateCw size={13} /> Reload
          </button>
          <button type="button" className={ctrl} onClick={closeTab}>
            <AppWindow size={13} /> Close &amp; reopen tab
          </button>
          <button type="button" className={ctrl} onClick={quitBrowser}>
            <Power size={13} /> Quit &amp; reopen browser
          </button>
          <button type="button" className={ctrl} onClick={() => wait(31 * MIN, '31 minutes')}>
            <Timer size={13} /> Wait 31 min
          </button>
          <button type="button" className={ctrl} onClick={() => wait(31 * DAY, '31 days')}>
            <CalendarClock size={13} /> Wait 31 days
          </button>
          <button type="button" className={`${ctrl} ml-auto text-muted`} onClick={restart}>
            <RotateCcw size={13} /> Restart demo
          </button>
        </div>
        <ul className="mt-3 space-y-1 text-xs" aria-live="polite">
          {st.events.map((e, i) => (
            <li key={e.id} className={i === 0 ? 'text-fg' : 'text-faint'}>
              {i === 0 ? '→ ' : ''}
              {e.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
