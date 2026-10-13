import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, Bug, ChevronDown, Eye, EyeOff, KeyRound, Loader2, Plus, RotateCcw, Send, Terminal, X } from 'lucide-react';
import { JsonView } from '@/components/demos/web-security-api/JsonView';
import { HOST, createFoodDashServer } from './fooddashServer';
import type { Method, SandboxResponse } from './fooddashServer';
import { SANDBOX_NOW, TOKENS, decodeJwt, fmtTime, forgeJwt, relTime } from './jwt';

/*
 * FoodDash API sandbox: a small Postman-like client wired to a mock server that runs in the browser
 * (fooddashServer.ts). Nothing is sent over the network.
 *
 * When it sits inside a <BugHunt>, a response that exposes a planted bug ticks that bug in the
 * hunt's list by pressing its own "I found this" button, so progress is saved by BugHunt itself
 * (same key and contract as every other hunt on the site).
 */

interface HeaderRow {
  on: boolean;
  key: string;
  value: string;
}
interface Preset {
  name: string;
  method: Method;
  path: string;
  body?: string;
  auth?: AuthChoice;
}
interface HistoryEntry {
  id: number;
  method: Method;
  path: string;
  status: number | 'ERR';
}
type AuthChoice = 'anna' | 'ben' | 'expired' | 'none';

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLOR: Record<Method, string> = { GET: '#0f7a43', POST: '#a85a00', PUT: '#1d4ed8', PATCH: '#7c3aed', DELETE: '#b91c1c' };
const ACCENT = '#e2512b';

const BUG_TITLES = [
  "Anna can read Ben's order (IDOR)",
  'Expired token accepted on the order list',
  'Order with a zero or negative quantity is created',
  'Malformed JSON leaks a stack trace',
  'Missing items crashes with 500',
  'Profile update returns passwordHash',
  'Deleted address still exists',
  'Pagination repeats a restaurant',
];

const PRESETS: Preset[] = [
  { name: 'List restaurants (page 1)', method: 'GET', path: '/v1/restaurants?page=1&limit=3' },
  { name: 'Restaurant details (ETag)', method: 'GET', path: '/v1/restaurants/3' },
  { name: 'My profile', method: 'GET', path: '/v1/users/me' },
  { name: 'Update my profile', method: 'PATCH', path: '/v1/users/me', body: '{\n  "phone": "+1 555 0177"\n}' },
  { name: 'My orders', method: 'GET', path: '/v1/orders' },
  { name: 'Order details', method: 'GET', path: '/v1/orders/1041' },
  {
    name: 'Place an order',
    method: 'POST',
    path: '/v1/orders',
    body: '{\n  "restaurantId": 1,\n  "items": [\n    { "menuItemId": 101, "quantity": 2 }\n  ],\n  "paymentMethod": "card",\n  "note": "Leave at the door"\n}',
  },
  { name: 'My addresses', method: 'GET', path: '/v1/addresses' },
  { name: 'Create address', method: 'POST', path: '/v1/addresses', body: '{\n  "label": "Gym",\n  "street": "15 Oak St",\n  "city": "Springfield",\n  "zip": "62702"\n}' },
  { name: 'Read address {{addressId}}', method: 'GET', path: '/v1/addresses/{{addressId}}' },
  { name: 'Update address {{addressId}}', method: 'PATCH', path: '/v1/addresses/{{addressId}}', body: '{\n  "label": "Gym (side door)"\n}' },
  { name: 'Delete address {{addressId}}', method: 'DELETE', path: '/v1/addresses/{{addressId}}' },
  { name: 'Redeem promo code', method: 'POST', path: '/v1/promo-codes/redeem', body: '{\n  "code": "FOODIE5"\n}' },
  { name: 'Admin: list users', method: 'GET', path: '/v1/admin/users' },
];

const DOCS: { m: Method; path: string; auth: string; text: string }[] = [
  { m: 'GET', path: '/v1/restaurants', auth: 'Public', text: 'Query: page (≥ 1, default 1), limit (1–20, default 3), sort (name, rating, deliveryFee; prefix - for descending), cuisine. Returns { data, page, limit, total, totalPages }. Every restaurant appears exactly once across pages.' },
  { m: 'GET', path: '/v1/restaurants/{id}', auth: 'Public', text: 'One restaurant with its menu. Sends an ETag; send it back in If-None-Match to get 304 if nothing changed.' },
  { m: 'GET', path: '/v1/users/me', auth: 'Token', text: 'Your public profile: id, name, email, phone, createdAt.' },
  { m: 'PATCH', path: '/v1/users/me', auth: 'Token', text: 'Change name (1–60 chars) and/or phone. Unknown fields are ignored. Returns the same public profile as GET.' },
  { m: 'GET', path: '/v1/orders', auth: 'Token', text: 'Your orders. 401 if the token is missing, invalid or expired.' },
  { m: 'GET', path: '/v1/orders/{id}', auth: 'Token', text: 'One of your orders. Another customer’s order must look like a missing one: 404.' },
  { m: 'POST', path: '/v1/orders', auth: 'Token', text: 'Body: restaurantId (integer, required), items (required, 1–20 lines of { menuItemId, quantity 1–20 }), paymentMethod (card | cash | paypal, required), note (string ≤ 200 or null). Optional header Idempotency-Key. 201 + Location. 400 for invalid input, 415 if not JSON, 422 for unknown restaurant or menu item.' },
  { m: 'GET', path: '/v1/addresses', auth: 'Token', text: 'Your saved addresses.' },
  { m: 'POST', path: '/v1/addresses', auth: 'Token', text: 'Body: label, street, city (required strings), zip (optional). 201 + Location.' },
  { m: 'GET', path: '/v1/addresses/{id}', auth: 'Token', text: 'One of your addresses. 404 if it does not exist, was deleted, or belongs to someone else. PATCH changes it, DELETE removes it for good.' },
  { m: 'POST', path: '/v1/promo-codes/redeem', auth: 'Token', text: 'Body: { code }. Max 5 attempts per minute, then 429 with Retry-After.' },
  { m: 'GET', path: '/v1/admin/users', auth: 'Admin', text: 'All users. Customers get 403.' },
];

const AUTH_VALUE: Record<Exclude<AuthChoice, 'none'>, string> = {
  anna: 'Bearer {{annaToken}}',
  ben: 'Bearer {{benToken}}',
  expired: 'Bearer {{expiredToken}}',
};
const AUTH_LABEL: Record<AuthChoice, string> = { anna: 'Anna', ben: 'Ben', expired: 'Anna (expired)', none: 'No token' };

const defaultHeaders = (auth: AuthChoice = 'anna'): HeaderRow[] => [
  { on: auth !== 'none', key: 'Authorization', value: auth === 'none' ? 'Bearer {{annaToken}}' : AUTH_VALUE[auth] },
  { on: true, key: 'Content-Type', value: 'application/json' },
];

const BASE_VARS = { annaToken: TOKENS.anna, benToken: TOKENS.ben, expiredToken: TOKENS.annaExpired };

const statusColor = (s: number) => (s < 300 ? '#0f7a43' : s < 400 ? '#1d4ed8' : s < 500 ? '#b45309' : '#b91c1c');
const inputCls =
  'w-0 min-w-0 flex-1 rounded-md border border-[#d9dce6] bg-white px-2 py-1.5 font-mono text-[12px] text-[#0e1120] outline-none focus:border-[#e2512b] focus:ring-2 focus:ring-[#e2512b]/25';

function TabButton({ active, onClick, children, id }: { active: boolean; onClick: () => void; children: ReactNode; id: string }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className="-mb-px shrink-0 border-b-2 px-2.5 py-2 text-[12.5px] font-medium focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[#e2512b]"
      style={{ borderColor: active ? ACCENT : 'transparent', color: active ? '#0e1120' : '#5c6178' }}
    >
      {children}
    </button>
  );
}

function Section({ title, icon, open, onToggle, children }: { title: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="border-t border-[#e5e7ef] bg-[#f6f7fb]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e2512b]"
      >
        {icon} {title}
        <ChevronDown size={15} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

/** Token split into its three colored parts. */
function TokenParts({ token }: { token: string }) {
  const [h, p, s] = token.split('.');
  return (
    <p className="font-mono text-[11px] leading-relaxed break-all">
      <span className="text-[#b91c1c]">{h}</span>.<span className="text-[#7c3aed]">{p}</span>
      {s !== undefined && (
        <>
          .<span className="text-[#0369a1]">{s}</span>
        </>
      )}
    </p>
  );
}

function JwtDecoder({ authToken, onUse }: { authToken: string | null; onUse: (token: string) => void }) {
  const [src, setSrc] = useState<'anna' | 'ben' | 'expired' | 'header' | 'paste'>('anna');
  const [pasted, setPasted] = useState('');
  const token = src === 'anna' ? TOKENS.anna : src === 'ben' ? TOKENS.ben : src === 'expired' ? TOKENS.annaExpired : src === 'header' ? (authToken ?? '') : pasted.trim();
  const decoded = token ? decodeJwt(token) : null;
  const ok = decoded && !('error' in decoded) ? decoded : null;
  const exp = ok && typeof ok.payload.exp === 'number' ? ok.payload.exp : null;
  const iat = ok && typeof ok.payload.iat === 'number' ? ok.payload.iat : null;

  return (
    <div className="space-y-2.5 text-[12px]">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="fd-jwt-src" className="font-medium text-[#3d4257]">
          Token
        </label>
        <select
          id="fd-jwt-src"
          value={src}
          onChange={(e) => setSrc(e.target.value as typeof src)}
          className="min-w-0 rounded-md border border-[#d9dce6] bg-white py-1 pl-2 text-[12px] focus:border-[#e2512b] focus:outline-none"
        >
          <option value="anna">annaToken</option>
          <option value="ben">benToken</option>
          <option value="expired">expiredToken</option>
          <option value="header">From the Authorization header</option>
          <option value="paste">Paste a token</option>
        </select>
      </div>
      {src === 'paste' && (
        <textarea
          aria-label="Paste a JWT"
          rows={3}
          spellCheck={false}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="eyJhbGciOi..."
          className="block w-full min-w-0 resize-y rounded-md border border-[#d9dce6] bg-white px-2 py-1.5 font-mono text-[11px] text-[#0e1120] outline-none focus:border-[#e2512b]"
        />
      )}
      {!token && <p className="text-[#5c6178]">{src === 'header' ? 'The Authorization header is off or has no Bearer token.' : 'Paste a token to decode it.'}</p>}
      {token && (
        <div className="rounded-lg border border-[#e5e7ef] bg-white p-2.5">
          <TokenParts token={token} />
          <p className="mt-1.5 text-[11px] text-[#5c6178]">
            <span className="font-semibold text-[#b91c1c]">header</span> . <span className="font-semibold text-[#7c3aed]">payload</span> . <span className="font-semibold text-[#0369a1]">signature</span>, each base64url-encoded
          </p>
        </div>
      )}
      {decoded && 'error' in decoded && <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-2.5 text-[#991b1b]">{decoded.error}</p>}
      {ok && (
        <>
          <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-[#5c6178] uppercase">Header</p>
              <div className="overflow-auto rounded-lg bg-[#0e1120] p-2.5">
                <JsonView value={ok.header} />
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-[#5c6178] uppercase">Payload (claims)</p>
              <div className="overflow-auto rounded-lg bg-[#0e1120] p-2.5">
                <JsonView value={ok.payload} />
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg border border-[#e5e7ef] bg-white p-2.5">
            <dt className="font-mono text-[#5c6178]">sub</dt>
            <dd className="min-w-0 break-words">{String(ok.payload.sub ?? '–')} (the user id)</dd>
            <dt className="font-mono text-[#5c6178]">role</dt>
            <dd className="min-w-0 break-words">{String(ok.payload.role ?? '–')}</dd>
            <dt className="font-mono text-[#5c6178]">iat</dt>
            <dd className="min-w-0 break-words">{iat ? `${fmtTime(iat)} (issued ${relTime(iat)})` : '–'}</dd>
            <dt className="font-mono text-[#5c6178]">exp</dt>
            <dd className="min-w-0 break-words">
              {exp ? (
                <>
                  {fmtTime(exp)}{' '}
                  <span className="font-semibold" style={{ color: exp > SANDBOX_NOW ? '#0f7a43' : '#b91c1c' }}>
                    {exp > SANDBOX_NOW ? `(valid, expires ${relTime(exp)})` : `(expired ${relTime(exp)})`}
                  </span>
                </>
              ) : (
                '– (no expiry: ask why)'
              )}
            </dd>
          </dl>
          <p className="text-[11px] text-[#5c6178]">Sandbox clock: {fmtTime(SANDBOX_NOW)}. Decoding only reads the token. Only the server, with its secret key, can check the signature.</p>
          <div className="rounded-lg border border-dashed border-[#d9dce6] bg-white p-2.5">
            <p className="text-[#3d4257]">
              <strong>Experiment:</strong> change <code className="font-mono">role</code> to <code className="font-mono">admin</code> but keep the old signature, then call the admin endpoint.
            </p>
            <button
              type="button"
              onClick={() => onUse(forgeJwt(token, { role: 'admin' }))}
              className="mt-2 rounded-md border border-[#e2512b]/50 bg-[#fff4ef] px-2.5 py-1 text-[11.5px] font-semibold text-[#9a3412] hover:bg-[#ffe9df] focus-visible:outline-2 focus-visible:outline-[#e2512b]"
            >
              Put an edited token in the Authorization header
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function FoodDashSandbox() {
  const server = useRef(createFoodDashServer());
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const noticeTimer = useRef<number | undefined>(undefined);
  const nextId = useRef(1);

  const [preset, setPreset] = useState(0);
  const [method, setMethod] = useState<Method>(PRESETS[0].method);
  const [path, setPath] = useState(PRESETS[0].path);
  const [headers, setHeaders] = useState<HeaderRow[]>(defaultHeaders());
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'headers' | 'body'>('headers');
  const [vars, setVars] = useState<{ addressId: string; orderId: string }>({ addressId: '', orderId: '' });
  const [showEnv, setShowEnv] = useState(false);
  const [sending, setSending] = useState(false);
  const [res, setRes] = useState<SandboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resTab, setResTab] = useState<'body' | 'headers'>('body');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCurl, setShowCurl] = useState(false);
  const [showJwt, setShowJwt] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [notice, setNotice] = useState<{ n: number; fresh: boolean } | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const allVars: Record<string, string> = { ...BASE_VARS, ...(vars.addressId ? { addressId: vars.addressId } : {}), ...(vars.orderId ? { orderId: vars.orderId } : {}) };
  const resolve = (s: string) => s.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (m, n: string) => (n in allVars ? allVars[n] : m));
  const unresolved = (s: string) => [...s.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)].map((m) => m[1]).filter((n) => !(n in allVars));

  const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
  const activeHeaders = headers.filter((h) => h.on && h.key.trim());
  const authRow = activeHeaders.find((h) => h.key.trim().toLowerCase() === 'authorization');
  const authToken = authRow ? (resolve(authRow.value).match(/^\s*Bearer\s+(\S+)/i)?.[1] ?? null) : null;
  const currentAuth: AuthChoice | 'custom' = !authRow
    ? 'none'
    : ((Object.keys(AUTH_VALUE) as Exclude<AuthChoice, 'none'>[]).find((k) => AUTH_VALUE[k] === authRow.value.trim()) ?? 'custom');
  const missing = [...new Set([path, ...(hasBody ? [body] : []), ...activeHeaders.map((h) => h.value)].flatMap(unresolved))];

  const loadPreset = (i: number) => {
    const p = PRESETS[i];
    setPreset(i);
    setMethod(p.method);
    setPath(p.path);
    setBody(p.body ?? '');
    setTab(p.body ? 'body' : 'headers');
    // Keep the user's current auth choice when switching requests.
    setHeaders((hs) => {
      const hasCt = hs.some((h) => h.key.trim().toLowerCase() === 'content-type');
      return hasCt ? hs : [...hs, { on: true, key: 'Content-Type', value: 'application/json' }];
    });
  };

  const setAuth = (choice: AuthChoice) => {
    setHeaders((hs) => {
      const i = hs.findIndex((h) => h.key.trim().toLowerCase() === 'authorization');
      const row: HeaderRow = choice === 'none' ? { on: false, key: 'Authorization', value: i >= 0 ? hs[i].value : AUTH_VALUE.anna } : { on: true, key: 'Authorization', value: AUTH_VALUE[choice] };
      return i >= 0 ? hs.map((h, j) => (j === i ? row : h)) : [row, ...hs];
    });
  };

  const applyToken = (token: string) => {
    setHeaders((hs) => {
      const i = hs.findIndex((h) => h.key.trim().toLowerCase() === 'authorization');
      const row = { on: true, key: 'Authorization', value: `Bearer ${token}` };
      return i >= 0 ? hs.map((h, j) => (j === i ? row : h)) : [row, ...hs];
    });
    const admin = PRESETS.findIndex((p) => p.path === '/v1/admin/users');
    setPreset(admin);
    setMethod('GET');
    setPath(PRESETS[admin].path);
    setBody('');
    setTab('headers');
  };

  /** Ticks bug i in the surrounding <BugHunt> through its own button. Returns true if it was new. */
  const markFound = (i: number) => {
    const hunt = rootRef.current?.closest('[data-bughunt]');
    const item = hunt?.querySelectorAll<HTMLElement>('[data-bug]')[i];
    if (!item || item.classList.contains('is-found')) return false;
    item.querySelector<HTMLButtonElement>('[data-found-btn]')?.click();
    return true;
  };

  const curl = () => {
    const lines = [`curl${method === 'GET' ? '' : ` -X ${method}`} '${HOST}${resolve(path.trim())}'`];
    activeHeaders.forEach((h) => lines.push(`  -H '${h.key.trim()}: ${resolve(h.value)}'`));
    if (hasBody && body.trim()) lines.push(`  --data-raw '${resolve(body).replace(/\s*\n\s*/g, ' ').replace(/'/g, "'\\''")}'`);
    return lines.join(' \\\n');
  };

  const send = () => {
    if (sending) return;
    const id = nextId.current++;
    const reqMethod = method;
    const shown = resolve(path.trim()) || '(empty)';
    window.clearTimeout(timer.current);
    setSending(true);
    setNotice(null);
    const pathVars = unresolved(path);
    if (!path.trim() || pathVars.length || missing.length) {
      const v = pathVars[0] ?? missing[0];
      const msg = !path.trim() ? 'Enter a path first, e.g. /v1/restaurants.' : `The variable {{${v}}} has no value yet.${v === 'addressId' ? ' Send "Create address" first: its 201 response saves the new id as {{addressId}}.' : v === 'orderId' ? ' Send "Place an order" first: its 201 response saves the new id as {{orderId}}.' : ''}`;
      timer.current = window.setTimeout(() => {
        setSending(false);
        setRes(null);
        setError(msg);
        setHistory((h) => [{ id, method: reqMethod, path: shown, status: 'ERR' as const }, ...h].slice(0, 6));
      }, 120);
      return;
    }
    const hdrs: Record<string, string> = {};
    activeHeaders.forEach((h) => (hdrs[h.key.trim().toLowerCase()] = resolve(h.value)));
    const r = server.current.handle({ method: reqMethod, path: resolve(path.trim()), headers: hdrs, body: hasBody ? resolve(body) : '' });
    timer.current = window.setTimeout(() => {
      setSending(false);
      setError(null);
      setRes(r);
      setResTab('body');
      setHistory((h) => [{ id, method: reqMethod, path: shown, status: r.status }, ...h].slice(0, 6));
      if (r.saved) setVars((v) => ({ ...v, ...(r.saved as Partial<typeof v>) }));
      if (r.bug !== undefined) {
        const fresh = markFound(r.bug);
        setNotice({ n: r.bug, fresh });
        window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => setNotice(null), 9000);
      }
    }, r.ms);
  };

  const resetAll = () => {
    window.clearTimeout(timer.current);
    server.current.reset();
    setSending(false);
    setRes(null);
    setError(null);
    setHistory([]);
    setVars({ addressId: '', orderId: '' });
    setNotice(null);
    setHeaders(defaultHeaders());
    loadPreset(0);
  };

  const bodyText = res && res.body !== undefined ? JSON.stringify(res.body) : '';

  return (
    <div
      ref={rootRef}
      className="fd-sandbox @container w-full min-w-0 overflow-hidden rounded-2xl border border-[#d9dce6] bg-white text-[#0e1120] shadow-[0_18px_40px_-20px_rgba(16,18,35,.35)]"
      style={{ colorScheme: 'light' }}
    >
      {/* Show the sandbox full width inside the bug hunt, with the bug list below it. */}
      <style>{`.bughunt:has(.fd-sandbox) > div.grid{grid-template-columns:minmax(0,1fr)!important}.bughunt:has(.fd-sandbox) > div.grid > ol{border-left-width:0!important;border-top-width:1px!important}`}</style>

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2">
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold">
          <span className="grid size-5 place-items-center rounded bg-[#e2512b] text-[10px] font-bold text-white" aria-hidden="true">
            FD
          </span>
          FoodDash API ›
        </span>
        <span className="relative min-w-0 flex-1 basis-40">
          <select
            aria-label="Saved request"
            value={preset}
            onChange={(e) => loadPreset(Number(e.target.value))}
            className="w-full min-w-0 appearance-none truncate rounded-md border border-[#d9dce6] bg-white py-1 pr-6 pl-2 text-[12px] font-medium focus:border-[#e2512b] focus:outline-none"
          >
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.method} · {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2" />
        </span>
        <button
          type="button"
          onClick={() => setShowEnv((v) => !v)}
          aria-expanded={showEnv}
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-[#5c6178] hover:bg-white focus-visible:outline-2 focus-visible:outline-[#e2512b]"
        >
          {showEnv ? <EyeOff size={14} /> : <Eye size={14} />} Staging vars
        </button>
      </div>

      {showEnv && (
        <div className="space-y-1 border-b border-[#e5e7ef] bg-[#fbfbfe] px-3 py-2.5 text-[12px]">
          <p className="text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Environment: FoodDash Staging (sandbox)</p>
          {[
            ['baseUrl', HOST],
            ['annaToken', 'JWT for test user Anna (valid)'],
            ['benToken', 'JWT for test user Ben (valid)'],
            ['expiredToken', 'JWT for Anna that expired 1 h ago'],
            ['addressId', vars.addressId || '(empty: set by Create address)'],
            ['orderId', vars.orderId || '(empty: set by Place an order)'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="w-[92px] shrink-0 font-mono text-[#5c6178]">{k}</span>
              <span className="min-w-0 break-all">{v}</span>
            </div>
          ))}
          <p className="text-[11px] text-[#5c6178]">
            A 201 response saves the new id as <code className="font-mono">{'{{addressId}}'}</code> or <code className="font-mono">{'{{orderId}}'}</code>, like <code className="font-mono">pm.environment.set</code> in Postman.
          </p>
        </div>
      )}

      {/* Auth quick switch */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3 text-[12px]" role="group" aria-label="Send the request as">
        <span className="mr-1 font-medium text-[#3d4257]">Send as</span>
        {(['anna', 'ben', 'expired', 'none'] as AuthChoice[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={currentAuth === c}
            onClick={() => setAuth(c)}
            className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e2512b]"
            style={currentAuth === c ? { borderColor: ACCENT, background: '#fff4ef', color: '#9a3412' } : { borderColor: '#d9dce6', color: '#3d4257' }}
          >
            {AUTH_LABEL[c]}
          </button>
        ))}
        {currentAuth === 'custom' && <span className="rounded-full bg-[#f2f3f8] px-2 py-0.5 text-[11px] text-[#5c6178]">custom token</span>}
      </div>

      {/* Request line */}
      <form
        className="flex gap-2 px-3 pt-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <select
          aria-label="HTTP method"
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="w-[84px] shrink-0 rounded-md border border-[#d9dce6] bg-white px-1.5 py-1.5 font-mono text-[12px] font-bold focus:border-[#e2512b] focus:outline-none"
          style={{ color: METHOD_COLOR[method] }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLOR[m] }}>
              {m}
            </option>
          ))}
        </select>
        <input aria-label="Request path" spellCheck={false} autoComplete="off" className={inputCls} value={path} onChange={(e) => setPath(e.target.value)} />
        <button
          type="submit"
          disabled={sending}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#c2410c] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#9a3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2512b] disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </form>
      <p className="px-3 pt-1.5 font-mono text-[11px] break-all text-[#5c6178]">
        <span style={{ color: METHOD_COLOR[method] }}>{method}</span> {HOST}
        {resolve(path.trim()).length > 120 ? resolve(path.trim()).slice(0, 120) + '…' : resolve(path.trim())}
      </p>
      {missing.length > 0 && <p className="px-3 pt-1 text-[11px] font-medium text-[#b91c1c]">No value yet: {missing.map((v) => `{{${v}}}`).join(', ')}</p>}

      {/* Request tabs */}
      <div className="mt-2 flex items-center border-b border-[#e5e7ef] px-1.5">
        <div role="tablist" aria-label="Request" className="flex min-w-0 flex-1 overflow-x-auto">
          <TabButton id="fd-rq-headers" active={tab === 'headers'} onClick={() => setTab('headers')}>
            Headers<sup className="ml-0.5 text-[#0f7a43]">{activeHeaders.length}</sup>
          </TabButton>
          <TabButton id="fd-rq-body" active={tab === 'body'} onClick={() => setTab('body')}>
            Body
          </TabButton>
        </div>
        <button
          type="button"
          onClick={() => setShowCurl((v) => !v)}
          aria-pressed={showCurl}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium text-[#5c6178] hover:text-[#0e1120] focus-visible:outline-2 focus-visible:outline-[#e2512b]"
        >
          <Terminal size={13} /> curl
        </button>
      </div>

      <div role="tabpanel" aria-labelledby={`fd-rq-${tab}`} className="min-h-[110px] px-3 py-2.5">
        {tab === 'headers' && (
          <div className="space-y-1.5">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  aria-label={`Send header ${h.key || i + 1}`}
                  checked={h.on}
                  onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))}
                  className="size-3.5 shrink-0 accent-[#e2512b]"
                />
                <input aria-label={`Header ${i + 1} name`} placeholder="Header" className={inputCls} value={h.key} onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                <input
                  aria-label={`Header ${i + 1} value`}
                  placeholder="Value"
                  className={`${inputCls} flex-[1.6]`}
                  value={h.value}
                  onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                />
                <button
                  type="button"
                  aria-label={`Remove header ${h.key || i + 1}`}
                  onClick={() => setHeaders((hs) => hs.filter((_, j) => j !== i))}
                  className="grid size-7 shrink-0 place-items-center rounded text-[#5c6178] hover:bg-[#f2f3f8] focus-visible:outline-2 focus-visible:outline-[#e2512b]"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setHeaders((hs) => [...hs, { on: true, key: '', value: '' }])} className="flex items-center gap-1 text-[12px] font-medium text-[#c2410c]">
              <Plus size={13} /> Add header
            </button>
            <p className="text-[11px] text-[#5c6178]">
              Try <code className="font-mono">Idempotency-Key</code> on POST /v1/orders, or <code className="font-mono">If-None-Match</code> with an ETag on a restaurant.
            </p>
          </div>
        )}
        {tab === 'body' &&
          (hasBody ? (
            <div>
              <p className="mb-1 text-[11px] text-[#5c6178]">
                raw · <strong>JSON</strong> (sent exactly as typed, so you can break it on purpose)
              </p>
              <textarea
                aria-label="Request body"
                spellCheck={false}
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="block w-full min-w-0 resize-y rounded-md border border-[#d9dce6] bg-[#fbfbfe] px-2 py-1.5 font-mono text-[12px] text-[#0e1120] outline-none focus:border-[#e2512b] focus:ring-2 focus:ring-[#e2512b]/25"
              />
            </div>
          ) : (
            <p className="py-6 text-center text-[12px] text-[#5c6178]">{method} requests have no body here. Switch to POST or PATCH to send JSON.</p>
          ))}
      </div>

      {showCurl && (
        <div className="border-t border-[#e5e7ef] bg-[#0e1120] px-3 py-2">
          <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-white/60 uppercase">Same request with curl (paste it into a bug report, with the token masked)</p>
          <pre className="max-h-[200px] overflow-auto font-mono text-[11px] whitespace-pre text-[#c9cde0]">{curl()}</pre>
        </div>
      )}

      {/* Response */}
      <div className="border-t border-[#e5e7ef] bg-[#fbfbfe]" aria-live="polite">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-2.5 text-[12px]">
          <span className="font-semibold">Response</span>
          {res && !sending && (
            <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px]">
              <span className="rounded px-1.5 py-0.5 font-bold text-white" style={{ background: statusColor(res.status) }}>
                {res.status} {res.statusText}
              </span>
              <span className="text-[#5c6178]">{res.ms} ms</span>
              <span className="text-[#5c6178]">{bodyText.length} B</span>
            </span>
          )}
        </div>
        {notice && (
          <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg border border-[#86efac] bg-[#f0fdf4] p-2.5 text-[12px] text-[#14532d]" role="status">
            <Bug size={15} className="mt-px shrink-0" />
            <span className="min-w-0">
              {notice.fresh ? 'You exposed bug' : 'This request shows bug'} #{notice.n + 1}: <strong>{BUG_TITLES[notice.n]}</strong>.{' '}
              {notice.fresh ? 'It is now ticked in the bug list.' : 'You already found this one.'}
            </span>
          </div>
        )}
        {!res && !error && !sending && <p className="px-3 py-8 text-center text-[12px] text-[#5c6178]">Pick a request and click Send.</p>}
        {sending && (
          <p className="flex items-center justify-center gap-2 px-3 py-8 text-[12px] text-[#5c6178]">
            <Loader2 size={14} className="animate-spin" /> Sending request…
          </p>
        )}
        {error && !sending && <p className="m-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 font-mono text-[12px] break-words text-[#991b1b]">{error}</p>}
        {res && !sending && (
          <>
            <div role="tablist" aria-label="Response" className="mt-1 flex border-b border-[#e5e7ef] px-1.5">
              <TabButton id="fd-rs-body" active={resTab === 'body'} onClick={() => setResTab('body')}>
                Body
              </TabButton>
              <TabButton id="fd-rs-headers" active={resTab === 'headers'} onClick={() => setResTab('headers')}>
                Headers<sup className="ml-0.5 text-[#0f7a43]">{Object.keys(res.headers).length}</sup>
              </TabButton>
            </div>
            <div role="tabpanel" aria-labelledby={`fd-rs-${resTab}`} className="p-3">
              {resTab === 'body' &&
                (res.body === undefined ? (
                  <p className="rounded-lg bg-[#0e1120] p-3 font-mono text-[12px] text-white/60">(empty body{res.status === 304 ? ': use your cached copy' : ''})</p>
                ) : (
                  <div className="max-h-[300px] overflow-auto rounded-lg bg-[#0e1120] p-3">
                    <JsonView value={res.body} />
                  </div>
                ))}
              {resTab === 'headers' && (
                <dl className="space-y-1 font-mono text-[11.5px]">
                  {Object.entries(res.headers).map(([k, v]) => (
                    <div key={k} className="flex flex-wrap gap-x-2">
                      <dt className="font-semibold text-[#5c6178]">{k}:</dt>
                      <dd className="min-w-0 break-all">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="border-t border-[#e5e7ef] px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold tracking-wide text-[#5c6178] uppercase">History</p>
          <button type="button" onClick={resetAll} className="flex items-center gap-1 text-[11px] font-medium text-[#5c6178] hover:text-[#0e1120] focus-visible:outline-2 focus-visible:outline-[#e2512b]">
            <RotateCcw size={11} /> Reset data
          </button>
        </div>
        {history.length === 0 ? (
          <p className="py-1 text-[11.5px] text-[#6b7085]">Requests you send appear here.</p>
        ) : (
          <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <span className="w-[50px] shrink-0 font-bold" style={{ color: METHOD_COLOR[h.method] }}>
                  {h.method}
                </span>
                <span className="min-w-0 flex-1 truncate">{h.path}</span>
                <span className="shrink-0 font-semibold" style={{ color: h.status === 'ERR' ? '#b91c1c' : statusColor(h.status) }}>
                  {h.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Section title="JWT decoder" icon={<KeyRound size={15} className="text-[#c2410c]" />} open={showJwt} onToggle={() => setShowJwt((v) => !v)}>
        <JwtDecoder authToken={authToken} onUse={applyToken} />
      </Section>

      <Section title="API docs (what the API promises)" icon={<BookOpen size={15} className="text-[#c2410c]" />} open={showDocs} onToggle={() => setShowDocs((v) => !v)}>
        <ul className="space-y-2">
          {DOCS.map((d) => (
            <li key={d.m + d.path} className="rounded-lg border border-[#e5e7ef] bg-white p-2.5 text-[12px]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono font-bold" style={{ color: METHOD_COLOR[d.m] }}>
                  {d.m}
                </span>
                <span className="min-w-0 font-mono break-all">{d.path}</span>
                <span className="rounded bg-[#f2f3f8] px-1.5 text-[10.5px] text-[#5c6178]">{d.auth}</span>
              </div>
              <p className="mt-1 text-[#3d4257]">{d.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-[#5c6178]">All errors use {'{ error, message, requestId }'}, plus details for validation errors. Tokens: 401 if missing, invalid or expired; 403 if valid but not allowed.</p>
      </Section>
    </div>
  );
}
