import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * A tiny in-memory "proxy" used by the proxy-tools demos. The phone app calls `send()`
 * instead of fetch; the proxy records the request, applies the active tools
 * (breakpoint, map local, throttle) and asks a fake server for the response.
 * Nothing touches the real network.
 */

export interface ProxyRow {
  id: number;
  method: string;
  host: string;
  path: string;
  reqHeaders: Record<string, string>;
  reqBody?: unknown;
  status?: number;
  resHeaders?: Record<string, string>;
  resBody?: unknown;
  ms?: number;
  state: 'pending' | 'paused-request' | 'paused-response' | 'done' | 'aborted';
  tags: string[];
}
export interface ServerResult {
  status: number;
  body: unknown;
}
export type FakeServer = (method: string, path: string, body: unknown) => ServerResult;
export interface ProxyTools {
  breakpoint: boolean;
  bpRequest: boolean;
  bpResponse: boolean;
  mapLocal: boolean;
  throttle: boolean;
}
export interface FakeProxyOptions {
  server: FakeServer;
  /** Only requests to this host hit breakpoints (analytics etc. pass through). */
  apiHost: string;
  /** GET path (without query) that Map Local replaces. */
  mapLocalPath: string;
  mapLocalBody: unknown;
  userAgent: string;
  initialTools?: Partial<ProxyTools>;
}
type Resume = (v: ServerResult | { body: unknown } | null) => void;

const statusText: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable' };
export const describeStatus = (s?: number) => (s ? `${s} ${statusText[s] ?? ''}`.trim() : '');

export function useFakeProxy(opts: FakeProxyOptions) {
  const [rows, setRows] = useState<ProxyRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [tools, setToolsState] = useState<ProxyTools>({ breakpoint: false, bpRequest: false, bpResponse: true, mapLocal: false, throttle: false, ...opts.initialTools });
  const toolsRef = useRef(tools);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const resumers = useRef(new Map<number, Resume>());
  const alive = useRef(true);
  const token = useRef<string | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
      resumers.current.clear();
    };
  }, []);

  const setTools = useCallback((patch: Partial<ProxyTools>) => {
    setToolsState((prev) => {
      const next = { ...prev, ...patch };
      toolsRef.current = next;
      return next;
    });
  }, []);

  const update = (id: number, patch: Partial<ProxyRow> | ((r: ProxyRow) => Partial<ProxyRow>)) => {
    if (!alive.current) return;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)));
  };
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      timers.current.push(window.setTimeout(resolve, ms));
    });
  const pause = (id: number) =>
    new Promise<ServerResult | { body: unknown } | null>((resolve) => {
      resumers.current.set(id, resolve);
    });

  /** Remember an auth token so later requests carry an Authorization header. */
  const setAuthToken = useCallback((t: string | null) => {
    token.current = t;
  }, []);

  const send = useCallback(async (method: string, host: string, path: string, body?: unknown): Promise<ServerResult | null> => {
    const o = optsRef.current;
    const id = nextId.current++;
    const t0 = performance.now();
    const reqHeaders: Record<string, string> = { Host: host, Accept: 'application/json', 'User-Agent': o.userAgent };
    if (token.current && host === o.apiHost) reqHeaders.Authorization = `Bearer ${token.current}`;
    if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';
    const throttled = toolsRef.current.throttle;
    setRows((rs) => [{ id, method, host, path, reqHeaders, reqBody: body, state: 'pending', tags: throttled ? ['Throttled'] : [] }, ...rs].slice(0, 40));

    let reqBody = body;
    const isApi = host === o.apiHost;
    if (toolsRef.current.breakpoint && toolsRef.current.bpRequest && isApi && body !== undefined) {
      update(id, { state: 'paused-request' });
      setSelected(id);
      const edited = await pause(id);
      if (!alive.current) return null;
      if (!edited) {
        update(id, { state: 'aborted', ms: Math.round(performance.now() - t0) });
        return null;
      }
      const changed = JSON.stringify(edited.body) !== JSON.stringify(body);
      reqBody = edited.body;
      update(id, (r) => ({ state: 'pending', reqBody, tags: changed ? [...r.tags, 'Edited request'] : r.tags }));
    }

    const base = 160 + ((id * 97) % 260);
    await wait(throttled ? base * 8 + 700 : base);
    if (!alive.current) return null;

    let res: ServerResult;
    const bare = path.split('?')[0];
    if (toolsRef.current.mapLocal && method === 'GET' && isApi && bare === o.mapLocalPath) {
      res = { status: 200, body: o.mapLocalBody };
      update(id, (r) => ({ tags: [...r.tags, 'Map Local'] }));
    } else {
      res = o.server(method, path, reqBody);
    }

    if (toolsRef.current.breakpoint && toolsRef.current.bpResponse && isApi) {
      update(id, { state: 'paused-response', status: res.status, resBody: res.body, resHeaders: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
      setSelected(id);
      const edited = await pause(id);
      if (!alive.current) return null;
      if (!edited) {
        update(id, { state: 'aborted', ms: Math.round(performance.now() - t0) });
        return null;
      }
      const e = edited as ServerResult;
      const changed = e.status !== res.status || JSON.stringify(e.body) !== JSON.stringify(res.body);
      res = { status: e.status, body: e.body };
      if (changed) update(id, (r) => ({ tags: [...r.tags, 'Edited response'] }));
    }

    const bytes = res.body === '' || res.body === undefined ? 0 : (typeof res.body === 'string' ? res.body : JSON.stringify(res.body)).length;
    update(id, {
      state: 'done',
      status: res.status,
      resBody: res.body,
      resHeaders: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': String(bytes), 'Cache-Control': 'no-store' },
      ms: Math.round(performance.now() - t0),
    });
    return res;
  }, []);

  const resume = useCallback((id: number, value: ServerResult | { body: unknown } | null) => {
    const r = resumers.current.get(id);
    resumers.current.delete(id);
    r?.(value);
  }, []);

  const clear = useCallback(() => {
    // Keep paused rows (the app is still waiting for them).
    setRows((rs) => rs.filter((r) => r.state === 'paused-request' || r.state === 'paused-response' || r.state === 'pending'));
    setSelected(null);
  }, []);

  return { rows, selected, setSelected, tools, setTools, send, resume, clear, setAuthToken };
}

export type FakeProxy = ReturnType<typeof useFakeProxy>;
