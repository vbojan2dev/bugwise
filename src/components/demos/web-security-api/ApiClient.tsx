import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, ChevronDown, Eye, EyeOff, Loader2, Play, Plus, RotateCcw, Send, Terminal, X } from 'lucide-react';
import { BASE_URL, createShopApi } from './mockApi';
import type { ApiResponse, Method } from './mockApi';
import { JsonView } from './JsonView';

/*
 * A mini Postman-like API client that talks to a simulated "Shop API" (see mockApi.ts).
 * `buggy` switches the API to the deliberately broken version used in the bug hunt.
 * Nothing leaves the browser: responses are computed locally and delayed with setTimeout.
 */

interface HeaderRow {
  on: boolean;
  key: string;
  value: string;
}
interface Saved {
  name: string;
  method: Method;
  url: string;
  admin?: boolean;
  body?: string;
}
interface TestResult {
  name: string;
  pass: boolean;
  msg?: string;
}
interface Result {
  res?: ApiResponse;
  error?: string;
  tests: TestResult[];
}
interface HistoryEntry {
  id: number;
  method: Method;
  path: string;
  status: number | 'ERR';
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLOR: Record<Method, string> = { GET: '#0f7a43', POST: '#a85a00', PUT: '#1d4ed8', PATCH: '#7c3aed', DELETE: '#b91c1c' };

const SAVED: Saved[] = [
  { name: 'List products', method: 'GET', url: '{{baseUrl}}/products?category=accessories&limit=10' },
  { name: 'Get product', method: 'GET', url: '{{baseUrl}}/products/1' },
  { name: 'View cart', method: 'GET', url: '{{baseUrl}}/cart' },
  { name: 'Add to cart', method: 'POST', url: '{{baseUrl}}/cart/items', body: '{\n  "productId": 1,\n  "quantity": 2\n}' },
  { name: 'Update cart item', method: 'PUT', url: '{{baseUrl}}/cart/items/1', body: '{\n  "quantity": 3\n}' },
  { name: 'Remove cart item', method: 'DELETE', url: '{{baseUrl}}/cart/items/1' },
  { name: 'Create coupon (admin)', method: 'POST', url: '{{baseUrl}}/coupons', admin: true, body: '{\n  "code": "SPRING10",\n  "percent": 10\n}' },
  { name: 'Delete product (admin)', method: 'DELETE', url: '{{baseUrl}}/products/5', admin: true },
];

const DOCS: { method: Method; path: string; auth: string; text: string; codes: string; saved: number }[] = [
  { method: 'GET', path: '/products', auth: 'Public', text: 'List products. Query: category (string), limit (integer 1–50). Returns { data: Product[], total }. Product = { id: integer, name: string, price: number, category: string, inStock: boolean }.', codes: '200 · 400 bad limit', saved: 0 },
  { method: 'GET', path: '/products/{id}', auth: 'Public', text: 'One product.', codes: '200 Product · 404 if it does not exist', saved: 1 },
  { method: 'DELETE', path: '/products/{id}', auth: 'Admin token', text: 'Delete a product.', codes: '204 · 401 no/invalid token · 403 not an admin · 404', saved: 7 },
  { method: 'GET', path: '/cart', auth: 'Token', text: 'The current user’s cart: { items, total: number }.', codes: '200 · 401', saved: 2 },
  { method: 'POST', path: '/cart/items', auth: 'Token', text: 'Add a product. Body { productId: integer, quantity: integer 1–10 }. Adds to any quantity already in the cart.', codes: '201 · 400 invalid body · 401 · 404 unknown product · 409 out of stock', saved: 3 },
  { method: 'PUT', path: '/cart/items/{productId}', auth: 'Token', text: 'Set the quantity of a cart item. Body { quantity: integer 1–10 }. Idempotent: sending it twice gives the same result.', codes: '200 · 400 · 401 · 404', saved: 4 },
  { method: 'DELETE', path: '/cart/items/{productId}', auth: 'Token', text: 'Remove an item from the cart.', codes: '204 · 401 · 404 not in cart', saved: 5 },
  { method: 'POST', path: '/coupons', auth: 'Admin token', text: 'Create a coupon. Body { code: string, percent: integer 1–90 }. Codes are unique.', codes: '201 · 400 · 401 · 403 · 409 code already exists', saved: 6 },
];

const TESTS: { id: string; name: string; code: string; run: (r: ApiResponse) => string | null }[] = [
  {
    id: 'status200',
    name: 'Status code is 200',
    code: 'pm.test("Status code is 200", () => {\n  pm.response.to.have.status(200);\n});',
    run: (r) => (r.status === 200 ? null : `AssertionError: expected response to have status code 200 but got ${r.status}`),
  },
  {
    id: 'status2xx',
    name: 'Status code is 2xx',
    code: 'pm.test("Status code is 2xx", () => {\n  pm.expect(pm.response.code).to.be.within(200, 299);\n});',
    run: (r) => (r.status >= 200 && r.status <= 299 ? null : `AssertionError: expected ${r.status} to be within 200..299`),
  },
  {
    id: 'time',
    name: 'Response time is below 500 ms',
    code: 'pm.test("Response time is below 500 ms", () => {\n  pm.expect(pm.response.responseTime).to.be.below(500);\n});',
    run: (r) => (r.ms < 500 ? null : `AssertionError: expected ${r.ms} to be below 500`),
  },
  {
    id: 'json',
    name: 'Content-Type is JSON',
    code: 'pm.test("Content-Type is JSON", () => {\n  pm.response.to.have.header("Content-Type");\n  pm.expect(pm.response.headers.get("Content-Type"))\n    .to.include("application/json");\n});',
    run: (r) => (r.headers['Content-Type']?.includes('application/json') ? null : "AssertionError: expected response to have header with key 'Content-Type'"),
  },
  {
    id: 'price',
    name: 'Every product price is a number (product endpoints)',
    code: 'pm.test("Every product price is a number", () => {\n  const json = pm.response.json();\n  const items = Array.isArray(json.data) ? json.data : [json];\n  items.forEach((p) => pm.expect(p.price).to.be.a("number"));\n});',
    run: (r) => {
      if (r.body === undefined) return 'JSONError: No data, empty input at 1:1';
      const json = r.body as Record<string, unknown> | null;
      if (json === null) return "TypeError: Cannot read properties of null (reading 'data')";
      const items = (Array.isArray(json.data) ? json.data : [json]) as Record<string, unknown>[];
      for (const p of items) {
        if (typeof p.price !== 'number') return `AssertionError: expected ${typeof p.price === 'string' ? `'${p.price}'` : String(p.price)} to be a number`;
      }
      return null;
    },
  },
];

const defaultHeaders = (admin = false): HeaderRow[] => [
  { on: true, key: 'Authorization', value: admin ? 'Bearer {{adminToken}}' : 'Bearer {{token}}' },
  { on: true, key: 'Content-Type', value: 'application/json' },
];

function splitUrl(url: string) {
  const i = url.indexOf('?');
  if (i < 0) return { base: url, pairs: [] as [string, string][] };
  const pairs = url
    .slice(i + 1)
    .split('&')
    .filter(Boolean)
    .map((s): [string, string] => {
      const j = s.indexOf('=');
      return j < 0 ? [s, ''] : [s.slice(0, j), s.slice(j + 1)];
    });
  return { base: url.slice(0, i), pairs };
}
const joinUrl = (base: string, pairs: [string, string][]) => (pairs.length ? `${base}?${pairs.map(([k, v]) => `${k}=${v}`).join('&')}` : base);

const statusColor = (s: number) => (s < 300 ? '#0f7a43' : s < 400 ? '#1d4ed8' : s < 500 ? '#b45309' : '#b91c1c');

function TabButton({ active, onClick, children, id }: { active: boolean; onClick: () => void; children: ReactNode; id: string }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className="-mb-px shrink-0 border-b-2 px-2.5 py-2 text-[12.5px] font-medium focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[#5b4bff]"
      style={{ borderColor: active ? '#5b4bff' : 'transparent', color: active ? '#0e1120' : '#5c6178' }}
    >
      {children}
    </button>
  );
}

const inputCls = 'w-0 min-w-0 flex-1 rounded-md border border-[#d9dce6] bg-white px-2 py-1.5 font-mono text-[12px] text-[#0e1120] outline-none focus:border-[#5b4bff] focus:ring-2 focus:ring-[#5b4bff]/25';

export default function ApiClient({ buggy = false, showDocs = false, docsOpen = false }: { buggy?: boolean; showDocs?: boolean; docsOpen?: boolean }) {
  const api = useRef(createShopApi(buggy));
  const timer = useRef<number | undefined>(undefined);
  const nextId = useRef(1);

  const [envOn, setEnvOn] = useState(true);
  const [vars, setVars] = useState({ baseUrl: BASE_URL, token: 'test-anna-123', adminToken: 'test-admin-999' });
  const [showEnv, setShowEnv] = useState(false);
  const [savedIdx, setSavedIdx] = useState(0);
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState(SAVED[0].url);
  const [headers, setHeaders] = useState<HeaderRow[]>(defaultHeaders());
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'params' | 'headers' | 'body' | 'tests'>('params');
  const [tests, setTests] = useState<Record<string, boolean>>({ status200: true, time: true });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [resTab, setResTab] = useState<'body' | 'headers' | 'tests'>('body');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCurl, setShowCurl] = useState(false);
  const [showDocsPanel, setShowDocsPanel] = useState(docsOpen);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const resolve = (s: string) =>
    s.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, name: string) => (envOn && name in vars ? vars[name as keyof typeof vars] : match));
  const unresolved = (s: string) => [...s.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)].map((m) => m[1]).filter((n) => !envOn || !(n in vars));

  const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
  const activeHeaders = headers.filter((h) => h.on && h.key.trim());
  const resolvedUrl = resolve(url.trim());
  const missingVars = [...new Set([url, ...(hasBody ? [body] : []), ...activeHeaders.map((h) => h.value)].flatMap(unresolved))];
  const { base, pairs } = splitUrl(url);

  const loadSaved = (i: number) => {
    const s = SAVED[i];
    setSavedIdx(i);
    setMethod(s.method);
    setUrl(s.url);
    setHeaders(defaultHeaders(s.admin));
    setBody(s.body ?? '');
    setTab(s.body ? 'body' : 'params');
  };

  const curl = () => {
    const lines = [`curl${method === 'GET' ? '' : ` -X ${method}`} '${resolvedUrl}'`];
    activeHeaders.forEach((h) => lines.push(`  -H '${h.key.trim()}: ${resolve(h.value)}'`));
    if (hasBody && body.trim()) lines.push(`  -d '${resolve(body).replace(/\s*\n\s*/g, ' ')}'`);
    return lines.join(' \\\n');
  };

  const send = () => {
    if (sending) return;
    const id = nextId.current++;
    const finish = (r: Result, delay: number, status: number | 'ERR', path: string) => {
      setSending(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSending(false);
        setResult(r);
        setHistory((h) => [{ id, method, path, status }, ...h].slice(0, 5));
      }, delay);
    };
    const shortPath = resolvedUrl.startsWith(BASE_URL) ? resolvedUrl.slice(BASE_URL.length) || '/' : resolvedUrl;
    const urlVars = unresolved(url);
    if (!url.trim() || urlVars.length) {
      const msg = !url.trim()
        ? 'Error: Invalid URL. Enter a request URL first.'
        : `Error: getaddrinfo ENOTFOUND ${url.trim().split('/')[0].toLowerCase()}. The variable {{${urlVars[0]}}} is not defined in the selected environment.`;
      finish({ error: msg, tests: [] }, 120, 'ERR', url.trim() || '(empty)');
      return;
    }
    const hdrs: Record<string, string> = {};
    activeHeaders.forEach((h) => (hdrs[h.key.trim().toLowerCase()] = resolve(h.value)));
    try {
      const res = api.current.handle({ method, url: resolvedUrl, headers: hdrs, body: hasBody ? resolve(body) : '' });
      const results = TESTS.filter((t) => tests[t.id]).map((t) => {
        const msg = t.run(res);
        return { name: t.name, pass: msg === null, msg: msg ?? undefined };
      });
      finish({ res, tests: results }, res.ms, res.status, shortPath);
    } catch (e) {
      finish({ error: `Error: ${(e as Error).message}. Could not send request.`, tests: [] }, 300, 'ERR', resolvedUrl);
    }
  };

  const resetAll = () => {
    window.clearTimeout(timer.current);
    api.current.reset();
    setSending(false);
    setResult(null);
    setHistory([]);
    setVars({ baseUrl: BASE_URL, token: 'test-anna-123', adminToken: 'test-admin-999' });
    setEnvOn(true);
    loadSaved(0);
  };

  const res = result?.res;
  const bodyText = res && res.body !== undefined ? JSON.stringify(res.body) : '';
  const passed = result?.tests.filter((t) => t.pass).length ?? 0;

  return (
    <div className="@container w-full min-w-0 overflow-hidden rounded-2xl border border-[#d9dce6] bg-white text-[#0e1120] shadow-[0_18px_40px_-20px_rgba(16,18,35,.35)]">
      {/* Top bar: collection + environment */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2">
        <label className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] text-[#5c6178]">
          <span className="shrink-0 font-semibold">Shop API ›</span>
          <span className="relative min-w-0 flex-1">
            <select
              aria-label="Saved request in the collection"
              value={savedIdx}
              onChange={(e) => loadSaved(Number(e.target.value))}
              className="w-full min-w-0 appearance-none truncate rounded-md border border-[#d9dce6] bg-white py-1 pr-6 pl-2 text-[12px] font-medium text-[#0e1120] focus:border-[#5b4bff] focus:outline-none"
            >
              {SAVED.map((s, i) => (
                <option key={s.name} value={i}>
                  {s.method} · {s.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2" />
          </span>
        </label>
        <div className="flex items-center gap-1">
          <select
            aria-label="Environment"
            value={envOn ? 'test' : 'none'}
            onChange={(e) => setEnvOn(e.target.value === 'test')}
            className="rounded-md border border-[#d9dce6] bg-white py-1 pl-2 text-[12px] font-medium focus:border-[#5b4bff] focus:outline-none"
          >
            <option value="test">Shop – Test</option>
            <option value="none">No environment</option>
          </select>
          <button
            type="button"
            onClick={() => setShowEnv((v) => !v)}
            aria-expanded={showEnv}
            aria-label="Show environment variables"
            className="grid size-7 place-items-center rounded-md text-[#5c6178] hover:bg-white focus-visible:outline-2 focus-visible:outline-[#5b4bff]"
          >
            {showEnv ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {showEnv && (
        <div className="border-b border-[#e5e7ef] bg-[#fbfbfe] px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Environment: {envOn ? 'Shop – Test' : 'none selected'}</p>
          {envOn ? (
            <div className="space-y-1.5">
              {(Object.keys(vars) as (keyof typeof vars)[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-[12px]">
                  <span className="w-[84px] shrink-0 font-mono text-[#5c6178]">{k}</span>
                  <input className={inputCls} value={vars[k]} onChange={(e) => setVars((v) => ({ ...v, [k]: e.target.value }))} />
                </label>
              ))}
              <p className="text-[11px] text-[#5c6178]">
                Use them as <code className="font-mono">{'{{baseUrl}}'}</code> or <code className="font-mono">{'{{token}}'}</code>. Try breaking the token to see a 401.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-[#5c6178]">No variables. Every {'{{variable}}'} stays unresolved.</p>
          )}
        </div>
      )}

      {/* Request line */}
      <form
        className="flex gap-2 px-3 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <select
          aria-label="HTTP method"
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="w-[86px] shrink-0 rounded-md border border-[#d9dce6] bg-white px-1.5 py-1.5 font-mono text-[12px] font-bold focus:border-[#5b4bff] focus:outline-none"
          style={{ color: METHOD_COLOR[method] }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLOR[m] }}>
              {m}
            </option>
          ))}
        </select>
        <input aria-label="Request URL" spellCheck={false} className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="submit"
          disabled={sending}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#5b4bff] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#4a3bf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4bff] disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </form>
      <p className="px-3 pt-1.5 font-mono text-[11px] break-all text-[#5c6178]">
        <span style={{ color: METHOD_COLOR[method] }}>{method}</span> {resolvedUrl || '…'}
      </p>
      {missingVars.length > 0 && (
        <p className="px-3 pt-1 text-[11px] font-medium text-[#b91c1c]">Unresolved: {missingVars.map((v) => `{{${v}}}`).join(', ')}</p>
      )}

      {/* Request tabs */}
      <div className="mt-2 flex items-center border-b border-[#e5e7ef] px-1.5">
        <div role="tablist" aria-label="Request" className="flex min-w-0 flex-1 overflow-x-auto">
          <TabButton id="rq-params" active={tab === 'params'} onClick={() => setTab('params')}>
            Params{pairs.length ? <sup className="ml-0.5 text-[#0f7a43]">{pairs.length}</sup> : null}
          </TabButton>
          <TabButton id="rq-headers" active={tab === 'headers'} onClick={() => setTab('headers')}>
            Headers<sup className="ml-0.5 text-[#0f7a43]">{activeHeaders.length}</sup>
          </TabButton>
          <TabButton id="rq-body" active={tab === 'body'} onClick={() => setTab('body')}>
            Body
          </TabButton>
          <TabButton id="rq-tests" active={tab === 'tests'} onClick={() => setTab('tests')}>
            Tests<sup className="ml-0.5 text-[#0f7a43]">{Object.values(tests).filter(Boolean).length}</sup>
          </TabButton>
        </div>
        <button
          type="button"
          onClick={() => setShowCurl((v) => !v)}
          aria-pressed={showCurl}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium text-[#5c6178] hover:text-[#0e1120] focus-visible:outline-2 focus-visible:outline-[#5b4bff]"
        >
          <Terminal size={13} /> curl
        </button>
      </div>

      <div role="tabpanel" aria-labelledby={`rq-${tab}`} className="min-h-[120px] px-3 py-2.5">
        {tab === 'params' && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#5c6178]">Query parameters are added after a ? in the URL. Edit here or in the URL bar.</p>
            {pairs.map(([k, v], i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input aria-label={`Param ${i + 1} key`} placeholder="key" className={inputCls} value={k} onChange={(e) => setUrl(joinUrl(base, pairs.map((p, j) => (j === i ? [e.target.value, p[1]] : p))))} />
                <input aria-label={`Param ${i + 1} value`} placeholder="value" className={inputCls} value={v} onChange={(e) => setUrl(joinUrl(base, pairs.map((p, j) => (j === i ? [p[0], e.target.value] : p))))} />
                <button type="button" aria-label={`Remove param ${k || i + 1}`} onClick={() => setUrl(joinUrl(base, pairs.filter((_, j) => j !== i)))} className="grid size-7 shrink-0 place-items-center rounded text-[#5c6178] hover:bg-[#f2f3f8]">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setUrl(joinUrl(base, [...pairs, ['', '']]))} className="flex items-center gap-1 text-[12px] font-medium text-[#5b4bff]">
              <Plus size={13} /> Add param
            </button>
          </div>
        )}
        {tab === 'headers' && (
          <div className="space-y-1.5">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input type="checkbox" aria-label={`Send header ${h.key || i + 1}`} checked={h.on} onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} className="size-3.5 shrink-0 accent-[#5b4bff]" />
                <input aria-label={`Header ${i + 1} name`} placeholder="Header" className={inputCls} value={h.key} onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                <input aria-label={`Header ${i + 1} value`} placeholder="Value" className={`${inputCls} flex-[1.6]`} value={h.value} onChange={(e) => setHeaders((hs) => hs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" aria-label={`Remove header ${h.key || i + 1}`} onClick={() => setHeaders((hs) => hs.filter((_, j) => j !== i))} className="grid size-7 shrink-0 place-items-center rounded text-[#5c6178] hover:bg-[#f2f3f8]">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setHeaders((hs) => [...hs, { on: true, key: '', value: '' }])} className="flex items-center gap-1 text-[12px] font-medium text-[#5b4bff]">
              <Plus size={13} /> Add header
            </button>
            <p className="text-[11px] text-[#5c6178]">Untick Authorization to send the request without a token.</p>
          </div>
        )}
        {tab === 'body' &&
          (hasBody ? (
            <div>
              <p className="mb-1 text-[11px] text-[#5c6178]">
                raw · <strong>JSON</strong>
              </p>
              <textarea
                aria-label="Request body (raw JSON)"
                spellCheck={false}
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="block w-full min-w-0 resize-y rounded-md border border-[#d9dce6] bg-[#fbfbfe] px-2 py-1.5 font-mono text-[12px] text-[#0e1120] outline-none focus:border-[#5b4bff] focus:ring-2 focus:ring-[#5b4bff]/25"
              />
            </div>
          ) : (
            <p className="py-6 text-center text-[12px] text-[#5c6178]">{method} requests usually have no body. Switch to POST, PUT or PATCH to send JSON.</p>
          ))}
        {tab === 'tests' && (
          <div className="space-y-2">
            <p className="text-[11px] text-[#5c6178]">Tests run after the response arrives. Tick the ones to run:</p>
            {TESTS.map((t) => (
              <label key={t.id} className="block cursor-pointer rounded-lg border border-[#e5e7ef] p-2 has-[:checked]:border-[#5b4bff]/50 has-[:checked]:bg-[#f5f4ff]">
                <span className="flex items-center gap-2 text-[12.5px] font-medium">
                  <input type="checkbox" checked={!!tests[t.id]} onChange={(e) => setTests((s) => ({ ...s, [t.id]: e.target.checked }))} className="size-3.5 accent-[#5b4bff]" />
                  {t.name}
                </span>
                <pre className="mt-1.5 overflow-x-auto rounded bg-[#0e1120] p-2 font-mono text-[11px] leading-snug text-[#c9cde0]">{t.code}</pre>
              </label>
            ))}
          </div>
        )}
      </div>

      {showCurl && (
        <div className="border-t border-[#e5e7ef] bg-[#0e1120] px-3 py-2">
          <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-white/50 uppercase">Same request with curl</p>
          <pre className="font-mono text-[11px] break-all whitespace-pre-wrap text-[#c9cde0]">{curl()}</pre>
        </div>
      )}

      {/* Response */}
      <div className="border-t border-[#e5e7ef] bg-[#fbfbfe]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-2.5 text-[12px]">
          <span className="font-semibold">Response</span>
          {res && (
            <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px]">
              <span className="rounded px-1.5 py-0.5 font-bold text-white" style={{ background: statusColor(res.status) }}>
                {res.status} {res.statusText}
              </span>
              <span className="text-[#5c6178]">{res.ms} ms</span>
              <span className="text-[#5c6178]">{bodyText.length} B</span>
            </span>
          )}
        </div>
        {!result && !sending && <p className="px-3 py-8 text-center text-[12px] text-[#5c6178]">Click Send to get a response.</p>}
        {sending && (
          <p className="flex items-center justify-center gap-2 px-3 py-8 text-[12px] text-[#5c6178]">
            <Loader2 size={14} className="animate-spin" /> Sending request…
          </p>
        )}
        {result?.error && !sending && <p className="m-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 font-mono text-[12px] text-[#991b1b]">{result.error}</p>}
        {res && !sending && (
          <>
            <div role="tablist" aria-label="Response" className="mt-1 flex border-b border-[#e5e7ef] px-1.5">
              <TabButton id="rs-body" active={resTab === 'body'} onClick={() => setResTab('body')}>
                Body
              </TabButton>
              <TabButton id="rs-headers" active={resTab === 'headers'} onClick={() => setResTab('headers')}>
                Headers
              </TabButton>
              <TabButton id="rs-tests" active={resTab === 'tests'} onClick={() => setResTab('tests')}>
                Test Results{' '}
                {result.tests.length > 0 && (
                  <span style={{ color: passed === result.tests.length ? '#0f7a43' : '#b91c1c' }}>
                    ({passed}/{result.tests.length})
                  </span>
                )}
              </TabButton>
            </div>
            <div role="tabpanel" aria-labelledby={`rs-${resTab}`} className="p-3">
              {resTab === 'body' &&
                (res.body === undefined ? (
                  <p className="rounded-lg bg-[#0e1120] p-3 font-mono text-[12px] text-white/50">(empty body)</p>
                ) : (
                  <div className="max-h-[260px] overflow-auto rounded-lg bg-[#0e1120] p-3">
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
              {resTab === 'tests' &&
                (result.tests.length === 0 ? (
                  <p className="text-[12px] text-[#5c6178]">No tests ran. Tick some in the Tests tab, then send again.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.tests.map((t) => (
                      <li key={t.name} className="text-[12px]">
                        <span className="mr-2 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-white" style={{ background: t.pass ? '#0f7a43' : '#b91c1c' }}>
                          {t.pass ? 'PASS' : 'FAIL'}
                        </span>
                        {t.name}
                        {t.msg && <span className="mt-0.5 block font-mono text-[11px] break-all text-[#b91c1c]">{t.msg}</span>}
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="border-t border-[#e5e7ef] px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold tracking-wide text-[#5c6178] uppercase">History</p>
          <button type="button" onClick={resetAll} className="flex items-center gap-1 text-[11px] font-medium text-[#5c6178] hover:text-[#0e1120]">
            <RotateCcw size={11} /> Reset data
          </button>
        </div>
        {history.length === 0 ? (
          <p className="py-1 text-[11.5px] text-[#8a8fa3]">Requests you send appear here.</p>
        ) : (
          <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <span className="w-[46px] shrink-0 font-bold" style={{ color: METHOD_COLOR[h.method] }}>
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

      {showDocs && (
        <div className="border-t border-[#e5e7ef] bg-[#f6f7fb]">
          <button
            type="button"
            onClick={() => setShowDocsPanel((v) => !v)}
            aria-expanded={showDocsPanel}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:outline-[#5b4bff]"
          >
            <BookOpen size={15} className="text-[#5b4bff]" /> API docs (what the API promises)
            <ChevronDown size={15} className={`ml-auto transition-transform ${showDocsPanel ? 'rotate-180' : ''}`} />
          </button>
          {showDocsPanel && (
            <ul className="space-y-2 px-3 pb-3">
              {DOCS.map((d) => (
                <li key={d.method + d.path} className="rounded-lg border border-[#e5e7ef] bg-white p-2.5 text-[12px]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono font-bold" style={{ color: METHOD_COLOR[d.method] }}>
                      {d.method}
                    </span>
                    <span className="min-w-0 font-mono break-all">{d.path}</span>
                    <span className="rounded bg-[#f2f3f8] px-1.5 text-[10.5px] text-[#5c6178]">{d.auth}</span>
                    <button type="button" onClick={() => loadSaved(d.saved)} className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#5b4bff] hover:bg-[#f5f4ff]">
                      <Play size={11} /> Try it
                    </button>
                  </div>
                  <p className="mt-1 text-[#3d4257]">{d.text}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#5c6178]">{d.codes}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
