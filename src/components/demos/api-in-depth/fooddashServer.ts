/*
 * FoodDash API, a mock server that runs entirely in the browser (no network).
 * Used by FoodDashSandbox.tsx in the "API Testing in Depth" lesson.
 *
 * Planted bugs (the index matches the order of the <BugHunt> list in the MDX):
 *  0  IDOR: GET /v1/orders/1043 with Anna's token returns Ben's order (200 instead of 404).
 *  1  GET /v1/orders (the list) accepts an expired token. Every other endpoint rejects it with 401.
 *  2  POST /v1/orders accepts quantity 0 or negative (201, total goes negative). Only the maximum (20) is checked.
 *  3  Malformed JSON gets the right status (400) but the body leaks a stack trace with server paths.
 *  4  POST /v1/orders without "items" crashes: 500 instead of 400. (Other missing fields give a proper 400.)
 *  5  PATCH /v1/users/me returns the whole database row, including passwordHash. GET /v1/users/me is clean.
 *  6  DELETE /v1/addresses/{id} answers 200 "Address deleted", but the address is only flagged:
 *     GET /v1/addresses and GET /v1/addresses/{id} still return it.
 *  7  Pagination on GET /v1/restaurants skips one item too few per page: offset = (page - 1) * (limit - 1),
 *     so the last item of page N is the first item of page N + 1, and the last restaurant only shows up on a
 *     page past totalPages.
 *
 * Everything else is meant to behave correctly (401 vs 403, 404 for other users' addresses, 405, 415,
 * 422, 429 with Retry-After, ETag/304, Idempotency-Key replay, unknown fields ignored, enum validation...).
 * Detection is deterministic: a response carries `bug` only when the request really exposed that bug.
 */

import { SANDBOX_NOW, verifyJwt } from './jwt';
import type { JwtPayload } from './jwt';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SandboxRequest {
  method: Method;
  /** Path with optional query, e.g. /v1/restaurants?page=2 */
  path: string;
  /** Header names in lower case. */
  headers: Record<string, string>;
  body: string;
}

export interface SandboxResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: unknown;
  ms: number;
  /** Index of the planted bug this response exposed, if any. */
  bug?: number;
  /** Variables a test script would save, e.g. the id of a created resource. */
  saved?: Record<string, string>;
}

export const HOST = 'https://api.fooddash.test';

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Content',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  passwordHash: string;
  marketingSegment: string;
  createdAt: string;
  updatedAt: string;
}
interface MenuItem {
  id: number;
  name: string;
  price: number;
}
interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  deliveryFee: number;
  etaMinutes: number;
  menu: MenuItem[];
}
interface OrderItem {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}
interface Order {
  id: number;
  userId: string;
  restaurantId: number;
  items: OrderItem[];
  paymentMethod: string;
  note: string | null;
  status: string;
  deliveryAddress: { street: string; city: string; zip: string };
  createdAt: string;
}
interface Address {
  id: number;
  userId: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  createdAt: string;
  deletedAt?: string;
}

const iso = (offsetSec: number) => new Date((SANDBOX_NOW + offsetSec) * 1000).toISOString();

const RESTAURANTS: Restaurant[] = [
  ['Pizza Piccolo', 'italian', 4.6, 1.99, 30, ['Margherita', 11.5], ['Pepperoni', 13]],
  ['Sushi Kaze', 'japanese', 4.8, 2.99, 40, ['Salmon nigiri set', 16.9], ['Veggie maki', 9.5]],
  ['Taco Loco', 'mexican', 4.3, 0.99, 25, ['Chicken tacos (3)', 10.5], ['Nachos', 7.25]],
  ['Green Bowl', 'healthy', 4.5, 1.49, 20, ['Falafel bowl', 12], ['Green smoothie', 5.5]],
  ['Burger Barn', 'american', 4.1, 1.99, 35, ['Classic burger', 11], ['Sweet potato fries', 4.5]],
  ['Pho Real', 'vietnamese', 4.7, 2.49, 30, ['Beef pho', 13.5], ['Spring rolls', 6]],
  ['Curry Corner', 'indian', 4.4, 1.99, 45, ['Chicken tikka masala', 14], ['Garlic naan', 3.5]],
  ['Bella Pasta', 'italian', 4.2, 2.49, 35, ['Spaghetti carbonara', 13.5], ['Tiramisu', 6.5]],
].map(([name, cuisine, rating, deliveryFee, etaMinutes, a, b], i) => {
  const id = i + 1;
  const [an, ap] = a as [string, number];
  const [bn, bp] = b as [string, number];
  return {
    id,
    name: name as string,
    cuisine: cuisine as string,
    rating: rating as number,
    deliveryFee: deliveryFee as number,
    etaMinutes: etaMinutes as number,
    menu: [
      { id: id * 100 + 1, name: an, price: ap },
      { id: id * 100 + 2, name: bn, price: bp },
    ],
  };
});

const PAYMENT_METHODS = ['card', 'cash', 'paypal'];
const SORTS = ['name', '-name', 'rating', '-rating', 'deliveryFee', '-deliveryFee'];
const PROMO_LIMIT = 5;
const PROMO_WINDOW = 60_000;

const round2 = (n: number) => Math.round(n * 100) / 100;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function initialState() {
  const users: Record<string, User> = {
    u_1001: {
      id: 'u_1001',
      name: 'Anna Novak',
      email: 'anna@test.fooddash.dev',
      phone: '+1 555 0101',
      role: 'customer',
      passwordHash: '$2b$12$Qm7c9VhR1tYw0pZ3kX8eUe4b1H3rT6sNq9Lx2aF7dG5jK0mP8vW2y',
      marketingSegment: 'high-value-lapsed',
      createdAt: iso(-86400 * 210),
      updatedAt: iso(-86400 * 3),
    },
    u_1002: {
      id: 'u_1002',
      name: 'Ben Okafor',
      email: 'ben@test.fooddash.dev',
      phone: '+1 555 0102',
      role: 'customer',
      passwordHash: '$2b$12$Lr2Kd8Wq5Nv3Xz7Pb1Yc0uJ6tE9hS4mA2oG8fR1kD3lV7nB5xC6q',
      marketingSegment: 'new',
      createdAt: iso(-86400 * 40),
      updatedAt: iso(-86400 * 40),
    },
    u_9001: {
      id: 'u_9001',
      name: 'Support Admin',
      email: 'admin@test.fooddash.dev',
      phone: '+1 555 0199',
      role: 'admin',
      passwordHash: '$2b$12$Zx9Cv8Bn7Mm6Ll5Kk4Jj3Hh2Gg1Ff0Ee9Dd8Cc7Bb6Aa5Zz4Yy3Xx',
      marketingSegment: 'internal',
      createdAt: iso(-86400 * 400),
      updatedAt: iso(-86400 * 10),
    },
  };
  const orders: Order[] = [
    {
      id: 1041,
      userId: 'u_1001',
      restaurantId: 1,
      items: [{ menuItemId: 101, name: 'Margherita', quantity: 2, unitPrice: 11.5 }],
      paymentMethod: 'card',
      note: null,
      status: 'delivered',
      deliveryAddress: { street: '7 Maple Ave, Apt 3', city: 'Springfield', zip: '62704' },
      createdAt: iso(-86400 * 6),
    },
    {
      id: 1042,
      userId: 'u_1001',
      restaurantId: 6,
      items: [
        { menuItemId: 601, name: 'Beef pho', quantity: 1, unitPrice: 13.5 },
        { menuItemId: 602, name: 'Spring rolls', quantity: 1, unitPrice: 6 },
      ],
      paymentMethod: 'cash',
      note: 'Ring twice',
      status: 'preparing',
      deliveryAddress: { street: '7 Maple Ave, Apt 3', city: 'Springfield', zip: '62704' },
      createdAt: iso(-900),
    },
    {
      id: 1043,
      userId: 'u_1002',
      restaurantId: 2,
      items: [{ menuItemId: 201, name: 'Salmon nigiri set', quantity: 1, unitPrice: 16.9 }],
      paymentMethod: 'paypal',
      note: 'Gate code 4512',
      status: 'delivered',
      deliveryAddress: { street: '48 Harbor Rd', city: 'Springfield', zip: '62711' },
      createdAt: iso(-86400 * 2),
    },
  ];
  const addresses: Address[] = [
    { id: 11, userId: 'u_1001', label: 'Home', street: '7 Maple Ave, Apt 3', city: 'Springfield', zip: '62704', createdAt: iso(-86400 * 200) },
    { id: 12, userId: 'u_1001', label: 'Work', street: '200 Main St, Floor 5', city: 'Springfield', zip: '62701', createdAt: iso(-86400 * 90) },
    { id: 21, userId: 'u_1002', label: 'Home', street: '48 Harbor Rd', city: 'Springfield', zip: '62711', createdAt: iso(-86400 * 39) },
  ];
  return {
    users,
    orders,
    addresses,
    nextOrderId: 1044,
    nextAddressId: 31,
    requestCount: 0,
    /** Idempotency-Key → stored first response */
    idem: new Map<string, { userId: string; body: string; res: SandboxResponse }>(),
    /** userId → timestamps of promo attempts */
    promo: new Map<string, number[]>(),
    /** "limit|sort|cuisine" → page → restaurant ids returned */
    pages: new Map<string, Map<number, number[]>>(),
  };
}

type State = ReturnType<typeof initialState>;

const restaurantName = (id: number) => RESTAURANTS.find((r) => r.id === id)?.name ?? 'Unknown';
const orderTotal = (o: Order) => round2(o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0) + (RESTAURANTS.find((r) => r.id === o.restaurantId)?.deliveryFee ?? 0));

function orderView(o: Order, users: Record<string, User>) {
  const u = users[o.userId];
  const subtotal = round2(o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0));
  return {
    id: o.id,
    status: o.status,
    restaurant: { id: o.restaurantId, name: restaurantName(o.restaurantId) },
    customer: { name: u?.name, phone: u?.phone },
    items: o.items,
    subtotal,
    deliveryFee: RESTAURANTS.find((r) => r.id === o.restaurantId)?.deliveryFee ?? 0,
    total: orderTotal(o),
    currency: 'USD',
    paymentMethod: o.paymentMethod,
    note: o.note,
    deliveryAddress: o.deliveryAddress,
    createdAt: o.createdAt,
  };
}

const addressView = (a: Address) => ({ id: a.id, label: a.label, street: a.street, city: a.city, zip: a.zip, createdAt: a.createdAt });
const restaurantSummary = (r: Restaurant) => ({ id: r.id, name: r.name, cuisine: r.cuisine, rating: r.rating, deliveryFee: r.deliveryFee, etaMinutes: r.etaMinutes });

export function createFoodDashServer() {
  let s: State = initialState();

  function handle(req: SandboxRequest): SandboxResponse {
    s.requestCount++;
    const requestId = `req_${(4810 + s.requestCount).toString(36)}${(s.requestCount * 7919).toString(36).slice(-3)}`;
    const ms = 38 + ((s.requestCount * 37) % 90);

    const reply = (status: number, body?: unknown, extra: Record<string, string> = {}, more: Partial<SandboxResponse> = {}): SandboxResponse => {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['X-Request-Id'] = requestId;
      Object.assign(headers, extra);
      return { status, statusText: STATUS_TEXT[status] ?? '', headers, body, ms, ...more };
    };
    const err = (status: number, error: string, message: string, extra: Record<string, string> = {}, details?: unknown) =>
      reply(status, details ? { error, message, details, requestId } : { error, message, requestId }, extra);

    // ---- Parse URL --------------------------------------------------------
    let raw = req.path.trim();
    if (raw.startsWith(HOST)) raw = raw.slice(HOST.length);
    if (!raw.startsWith('/')) raw = '/' + raw;
    const qi = raw.indexOf('?');
    const pathname = (qi < 0 ? raw : raw.slice(0, qi)).replace(/\/+$/, '') || '/';
    const query = new URLSearchParams(qi < 0 ? '' : raw.slice(qi + 1));

    const vm = pathname.match(/^\/(v\d+)(\/.*)?$/);
    if (!vm) return err(404, 'not_found', 'Paths start with an API version, e.g. /v1/restaurants.');
    if (vm[1] !== 'v1') return err(404, 'not_found', `API version ${vm[1]} does not exist. Supported versions: v1.`);
    const p = vm[2] ?? '/';
    const seg = p.split('/').filter(Boolean);

    // ---- Route table ------------------------------------------------------
    type Route = { pattern: RegExp; methods: Method[] };
    const routes: Record<string, Route> = {
      restaurants: { pattern: /^\/restaurants$/, methods: ['GET'] },
      restaurant: { pattern: /^\/restaurants\/[^/]+$/, methods: ['GET'] },
      me: { pattern: /^\/users\/me$/, methods: ['GET', 'PATCH'] },
      orders: { pattern: /^\/orders$/, methods: ['GET', 'POST'] },
      order: { pattern: /^\/orders\/[^/]+$/, methods: ['GET'] },
      addresses: { pattern: /^\/addresses$/, methods: ['GET', 'POST'] },
      address: { pattern: /^\/addresses\/[^/]+$/, methods: ['GET', 'PATCH', 'DELETE'] },
      promo: { pattern: /^\/promo-codes\/redeem$/, methods: ['POST'] },
      adminUsers: { pattern: /^\/admin\/users$/, methods: ['GET'] },
    };
    const routeName = Object.keys(routes).find((k) => routes[k].pattern.test(p));
    if (!routeName) return err(404, 'not_found', `No endpoint matches ${req.method} /${vm[1]}${p === '/' ? '' : p}.`);
    const route = routes[routeName];
    if (!route.methods.includes(req.method)) {
      return err(405, 'method_not_allowed', `${req.method} is not supported on this endpoint.`, { Allow: route.methods.join(', ') });
    }

    // ---- Body parsing (JSON middleware) ----------------------------------
    let body: unknown = {};
    const hasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
    if (hasBody && req.body.trim()) {
      const ct = (req.headers['content-type'] ?? '').toLowerCase();
      if (!ct.includes('application/json')) {
        return err(415, 'unsupported_media_type', `Send the body as JSON with the header Content-Type: application/json. Received: ${ct || '(none)'}.`);
      }
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        // BUG 3: correct status, but the raw error and stack trace are returned to the client.
        const msg = (e as Error).message;
        const handler = routeName === 'orders' ? 'OrdersController.create (/srv/fooddash-api/src/orders/orders.controller.js:42:9)' : routeName === 'me' ? 'UsersController.updateMe (/srv/fooddash-api/src/users/users.controller.js:77:13)' : routeName === 'promo' ? 'PromoController.redeem (/srv/fooddash-api/src/promo/promo.controller.js:19:11)' : 'AddressesController.save (/srv/fooddash-api/src/addresses/addresses.controller.js:31:7)';
        return reply(
          400,
          {
            error: 'SyntaxError',
            message: msg,
            stack: [
              `SyntaxError: ${msg}`,
              '    at JSON.parse (<anonymous>)',
              '    at parseJsonBody (/srv/fooddash-api/src/middleware/json-body.js:18:21)',
              `    at ${handler}`,
              '    at Layer.handle (/srv/fooddash-api/node_modules/express/lib/router/layer.js:95:5)',
              '    at next (/srv/fooddash-api/node_modules/express/lib/router/route.js:149:13)',
            ].join('\n'),
            env: 'staging',
            nodeVersion: 'v20.11.1',
          },
          {},
          { bug: 3 },
        );
      }
    }

    // ---- Auth -------------------------------------------------------------
    const authenticate = (opts: { ignoreExpiration?: boolean } = {}): { user: User; payload: JwtPayload; expired: boolean } | SandboxResponse => {
      const h = req.headers['authorization'];
      if (!h || !h.trim()) {
        return err(401, 'unauthorized', 'Missing Authorization header. Send Authorization: Bearer <token>.', { 'WWW-Authenticate': 'Bearer realm="fooddash"' });
      }
      const m = h.trim().match(/^Bearer\s+(\S+)$/i);
      if (!m) {
        return err(401, 'unauthorized', 'The Authorization header must look like: Bearer <token>.', { 'WWW-Authenticate': 'Bearer realm="fooddash", error="invalid_request"' });
      }
      const v = verifyJwt(m[1], opts);
      if (!v.ok) {
        const desc = v.reason === 'expired' ? 'The access token expired' : v.reason === 'signature' ? 'The token signature is invalid' : 'The token is malformed';
        return err(401, 'invalid_token', `${desc}.`, { 'WWW-Authenticate': `Bearer realm="fooddash", error="invalid_token", error_description="${desc}"` });
      }
      const user = s.users[v.payload.sub];
      if (!user) return err(401, 'invalid_token', 'Unknown user.', { 'WWW-Authenticate': 'Bearer realm="fooddash", error="invalid_token"' });
      return { user, payload: v.payload, expired: !(v.payload.exp > SANDBOX_NOW) };
    };
    const isRes = (x: unknown): x is SandboxResponse => isObj(x) && 'status' in x && 'ms' in x;
    const noStore = { 'Cache-Control': 'no-store' };

    // ---- Public: restaurants ---------------------------------------------
    if (routeName === 'restaurants') {
      const details: { field: string; message: string }[] = [];
      const pageRaw = query.get('page') ?? '1';
      const limitRaw = query.get('limit') ?? '3';
      const sort = query.get('sort') ?? 'id';
      const cuisine = (query.get('cuisine') ?? '').trim().toLowerCase();
      const page = /^\d+$/.test(pageRaw) ? Number(pageRaw) : NaN;
      const limit = /^\d+$/.test(limitRaw) ? Number(limitRaw) : NaN;
      if (!(page >= 1)) details.push({ field: 'page', message: 'must be an integer of 1 or more' });
      if (!(limit >= 1 && limit <= 20)) details.push({ field: 'limit', message: 'must be an integer from 1 to 20' });
      if (sort !== 'id' && !SORTS.includes(sort)) details.push({ field: 'sort', message: `must be one of: ${SORTS.join(', ')}` });
      if (details.length) return err(400, 'validation_error', 'Invalid query parameters.', {}, details);

      let list = RESTAURANTS.filter((r) => !cuisine || r.cuisine === cuisine);
      if (sort !== 'id') {
        const key = sort.replace('-', '') as 'name' | 'rating' | 'deliveryFee';
        const dir = sort.startsWith('-') ? -1 : 1;
        list = [...list].sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : a.id - b.id));
      }
      // BUG 7: should be (page - 1) * limit.
      const offset = (page - 1) * (limit - 1);
      const data = list.slice(offset, offset + limit).map(restaurantSummary);
      const total = list.length;

      // Deterministic detection: an id appears on two neighboring pages that the learner fetched.
      const key = `${limit}|${sort}|${cuisine}`;
      const seen = s.pages.get(key) ?? new Map<number, number[]>();
      s.pages.set(key, seen);
      const ids = data.map((r) => r.id);
      seen.set(page, ids);
      const overlap = [page - 1, page + 1].some((n) => (seen.get(n) ?? []).some((id) => ids.includes(id)));

      return reply(200, { data, page, limit, total, totalPages: Math.ceil(total / limit) }, { 'Cache-Control': 'public, max-age=60' }, overlap ? { bug: 7 } : {});
    }

    if (routeName === 'restaurant') {
      const id = Number(seg[1]);
      const r = /^\d+$/.test(seg[1]) ? RESTAURANTS.find((x) => x.id === id) : undefined;
      if (!r) return err(404, 'not_found', `Restaurant ${seg[1]} does not exist.`);
      const etag = `"r${r.id}-v3"`;
      const inm = req.headers['if-none-match'];
      const cache = { ETag: etag, 'Cache-Control': 'public, max-age=60' };
      if (inm && inm.split(',').some((t) => t.trim() === '*' || t.trim().replace(/^W\//, '') === etag)) {
        return reply(304, undefined, cache);
      }
      return reply(200, { ...restaurantSummary(r), menu: r.menu }, cache);
    }

    // ---- Everything below needs a token ----------------------------------
    // BUG 1: the order list was written with a different auth helper that skips the expiry check.
    const a = authenticate({ ignoreExpiration: routeName === 'orders' && req.method === 'GET' });
    if (isRes(a)) return a;
    const { user } = a;

    if (routeName === 'adminUsers') {
      if (user.role !== 'admin') return err(403, 'forbidden', 'This endpoint requires the admin role.');
      return reply(200, { data: Object.values(s.users).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })) }, noStore);
    }

    if (routeName === 'me') {
      if (req.method === 'GET') {
        return reply(200, { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt }, noStore);
      }
      if (!isObj(body)) return err(400, 'validation_error', 'The body must be a JSON object.');
      const details: { field: string; message: string }[] = [];
      const b = body;
      if ('name' in b && (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 60)) details.push({ field: 'name', message: 'must be a non-empty string of up to 60 characters' });
      if ('phone' in b && (typeof b.phone !== 'string' || !/^\+?[0-9 ()-]{7,20}$/.test(b.phone))) details.push({ field: 'phone', message: 'must be a phone number like +1 555 0101' });
      if ('email' in b) details.push({ field: 'email', message: 'cannot be changed here. Use the email change flow.' });
      if (details.length) return err(400, 'validation_error', 'Some fields are invalid.', {}, details);
      // Unknown fields (e.g. "role") are ignored on purpose: no mass assignment.
      const updated: User = { ...user, updatedAt: iso(s.requestCount * 5) };
      if (typeof b.name === 'string') updated.name = b.name.trim();
      if (typeof b.phone === 'string') updated.phone = b.phone;
      s.users[user.id] = updated;
      // BUG 5: returns the full database row instead of the public profile.
      return reply(200, { ...updated }, noStore, { bug: 5 });
    }

    if (routeName === 'orders' && req.method === 'GET') {
      const mine = s.orders.filter((o) => o.userId === user.id);
      return reply(
        200,
        { data: mine.map((o) => ({ id: o.id, restaurant: restaurantName(o.restaurantId), total: orderTotal(o), status: o.status, createdAt: o.createdAt })), total: mine.length },
        noStore,
        a.expired ? { bug: 1 } : {},
      );
    }

    if (routeName === 'order') {
      const id = Number(seg[1]);
      const o = /^\d+$/.test(seg[1]) ? s.orders.find((x) => x.id === id) : undefined;
      if (!o) return err(404, 'not_found', `Order ${seg[1]} not found.`);
      // BUG 0: no ownership check. Should be 404 (or 403) when o.userId !== user.id.
      return reply(200, orderView(o, s.users), noStore, o.userId !== user.id ? { bug: 0 } : {});
    }

    if (routeName === 'orders' && req.method === 'POST') {
      const idemKey = req.headers['idempotency-key']?.trim();
      const bodyKey = JSON.stringify(body);
      if (idemKey) {
        const prev = s.idem.get(`${user.id}|${idemKey}`);
        if (prev) {
          if (prev.body !== bodyKey) return err(422, 'idempotency_key_reused', 'This Idempotency-Key was already used with a different body.');
          return { ...prev.res, headers: { ...prev.res.headers, 'X-Request-Id': requestId, 'Idempotent-Replayed': 'true' }, ms, bug: undefined };
        }
      }
      if (!isObj(body)) return err(400, 'validation_error', 'The body must be a JSON object.');
      const b = body;
      const details: { field: string; message: string }[] = [];
      if (b.restaurantId === undefined || b.restaurantId === null) details.push({ field: 'restaurantId', message: 'is required' });
      else if (!Number.isInteger(b.restaurantId)) details.push({ field: 'restaurantId', message: 'must be an integer' });
      if (b.paymentMethod === undefined || b.paymentMethod === null || b.paymentMethod === '') details.push({ field: 'paymentMethod', message: `is required. Allowed: ${PAYMENT_METHODS.join(', ')}` });
      else if (typeof b.paymentMethod !== 'string' || !PAYMENT_METHODS.includes(b.paymentMethod)) details.push({ field: 'paymentMethod', message: `must be one of: ${PAYMENT_METHODS.join(', ')}` });
      if (b.note !== undefined && b.note !== null && (typeof b.note !== 'string' || b.note.length > 200)) details.push({ field: 'note', message: 'must be a string of up to 200 characters, or null' });
      if (details.length) return err(400, 'validation_error', 'Some fields are invalid.', {}, details);

      // BUG 4: `items` is used before it's validated. Missing or null items crash with a TypeError → 500.
      if (b.items === undefined || b.items === null) {
        return { ...err(500, 'internal_error', 'Something went wrong. Please try again later.'), bug: 4 };
      }
      if (!Array.isArray(b.items) || b.items.length === 0) return err(400, 'validation_error', 'Some fields are invalid.', {}, [{ field: 'items', message: 'must be a non-empty array' }]);
      if (b.items.length > 20) return err(400, 'validation_error', 'Some fields are invalid.', {}, [{ field: 'items', message: 'can contain at most 20 lines' }]);
      const itemErrors: { field: string; message: string }[] = [];
      b.items.forEach((it: unknown, i: number) => {
        if (!isObj(it)) return itemErrors.push({ field: `items[${i}]`, message: 'must be an object' });
        if (!Number.isInteger(it.menuItemId)) itemErrors.push({ field: `items[${i}].menuItemId`, message: 'must be an integer' });
        if (!Number.isInteger(it.quantity)) itemErrors.push({ field: `items[${i}].quantity`, message: 'must be an integer' });
        // BUG 2: only the upper limit is checked. Should be 1–20.
        else if ((it.quantity as number) > 20) itemErrors.push({ field: `items[${i}].quantity`, message: 'must be 20 or less' });
      });
      if (itemErrors.length) return err(400, 'validation_error', 'Some fields are invalid.', {}, itemErrors);

      const r = RESTAURANTS.find((x) => x.id === b.restaurantId);
      if (!r) return err(422, 'unprocessable', `Restaurant ${String(b.restaurantId)} does not exist.`);
      const items: OrderItem[] = [];
      for (const it of b.items as { menuItemId: number; quantity: number }[]) {
        const mi = r.menu.find((m) => m.id === it.menuItemId);
        if (!mi) return err(422, 'unprocessable', `Menu item ${it.menuItemId} is not on the menu of ${r.name}.`);
        items.push({ menuItemId: mi.id, name: mi.name, quantity: it.quantity, unitPrice: mi.price });
      }
      // Unknown fields such as "total", "status" or "discount" are ignored: the server computes them.
      const o: Order = {
        id: s.nextOrderId++,
        userId: user.id,
        restaurantId: r.id,
        items,
        paymentMethod: b.paymentMethod as string,
        note: typeof b.note === 'string' ? b.note : null,
        status: 'placed',
        deliveryAddress: user.id === 'u_1001' ? { street: '7 Maple Ave, Apt 3', city: 'Springfield', zip: '62704' } : { street: '48 Harbor Rd', city: 'Springfield', zip: '62711' },
        createdAt: iso(s.requestCount * 5),
      };
      s.orders.push(o);
      const res = reply(201, orderView(o, s.users), { Location: `/v1/orders/${o.id}`, ...noStore }, { saved: { orderId: String(o.id) } });
      if (idemKey) s.idem.set(`${user.id}|${idemKey}`, { userId: user.id, body: bodyKey, res });
      return items.some((it) => it.quantity <= 0) ? { ...res, bug: 2 } : res;
    }

    if (routeName === 'addresses' || routeName === 'address') {
      const validate = (b: Record<string, unknown>, partial: boolean) => {
        const details: { field: string; message: string }[] = [];
        const rules: [string, number, boolean][] = [
          ['label', 30, true],
          ['street', 100, true],
          ['city', 60, true],
          ['zip', 10, false],
        ];
        for (const [f, max, req2] of rules) {
          const v = b[f];
          if (v === undefined) {
            if (req2 && !partial) details.push({ field: f, message: 'is required' });
          } else if (v === null) {
            if (req2) details.push({ field: f, message: 'cannot be null' });
          } else if (typeof v !== 'string') details.push({ field: f, message: 'must be a string' });
          else if (req2 && !v.trim()) details.push({ field: f, message: 'cannot be empty' });
          else if (v.length > max) details.push({ field: f, message: `must be at most ${max} characters` });
        }
        return details;
      };
      if (routeName === 'addresses') {
        if (req.method === 'GET') {
          // BUG 6: soft-deleted rows are not filtered out.
          const mine = s.addresses.filter((x) => x.userId === user.id);
          return reply(200, { data: mine.map(addressView), total: mine.length }, noStore, mine.some((x) => x.deletedAt) ? { bug: 6 } : {});
        }
        if (!isObj(body)) return err(400, 'validation_error', 'The body must be a JSON object.');
        const details = validate(body, false);
        if (details.length) return err(400, 'validation_error', 'Some fields are invalid.', {}, details);
        const ad: Address = {
          id: s.nextAddressId++,
          userId: user.id,
          label: (body.label as string).trim(),
          street: (body.street as string).trim(),
          city: (body.city as string).trim(),
          zip: typeof body.zip === 'string' ? body.zip : '',
          createdAt: iso(s.requestCount * 5),
        };
        s.addresses.push(ad);
        return reply(201, addressView(ad), { Location: `/v1/addresses/${ad.id}`, ...noStore }, { saved: { addressId: String(ad.id) } });
      }
      const id = Number(seg[1]);
      const ad = /^\d+$/.test(seg[1]) ? s.addresses.find((x) => x.id === id) : undefined;
      // Correct ownership check here: another user's address looks exactly like a missing one.
      if (!ad || ad.userId !== user.id) return err(404, 'not_found', `Address ${seg[1]} not found.`);
      if (req.method === 'GET') return reply(200, addressView(ad), noStore, ad.deletedAt ? { bug: 6 } : {});
      if (req.method === 'DELETE') {
        ad.deletedAt ??= iso(s.requestCount * 5);
        return reply(200, { message: 'Address deleted' }, noStore);
      }
      if (!isObj(body)) return err(400, 'validation_error', 'The body must be a JSON object.');
      const details = validate(body, true);
      if (details.length) return err(400, 'validation_error', 'Some fields are invalid.', {}, details);
      for (const f of ['label', 'street', 'city', 'zip'] as const) if (typeof body[f] === 'string') ad[f] = (body[f] as string).trim();
      return reply(200, addressView(ad), noStore, ad.deletedAt ? { bug: 6 } : {});
    }

    if (routeName === 'promo') {
      const now = Date.now();
      const hits = (s.promo.get(user.id) ?? []).filter((t) => now - t < PROMO_WINDOW);
      if (hits.length >= PROMO_LIMIT) {
        const retry = Math.max(1, Math.ceil((hits[0] + PROMO_WINDOW - now) / 1000));
        s.promo.set(user.id, hits);
        return err(429, 'too_many_requests', `Too many attempts. Try again in ${retry} seconds.`, { 'Retry-After': String(retry), 'X-RateLimit-Limit': String(PROMO_LIMIT), 'X-RateLimit-Remaining': '0' });
      }
      hits.push(now);
      s.promo.set(user.id, hits);
      const rl = { 'X-RateLimit-Limit': String(PROMO_LIMIT), 'X-RateLimit-Remaining': String(PROMO_LIMIT - hits.length) };
      if (!isObj(body) || typeof body.code !== 'string' || !body.code.trim()) return err(400, 'validation_error', 'Some fields are invalid.', rl, [{ field: 'code', message: 'is required and must be a string' }]);
      if (body.code.trim().toUpperCase() !== 'FOODIE5') return err(422, 'invalid_code', 'This promo code is not valid.', rl);
      return reply(200, { code: 'FOODIE5', discountPercent: 5, validUntil: iso(86400 * 14) }, rl);
    }

    return err(404, 'not_found', 'Not found.');
  }

  return {
    handle,
    reset() {
      s = initialState();
    },
  };
}
