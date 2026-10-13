/*
 * A tiny in-browser "Shop API" used by the Postman-like demo. No network calls: requests are
 * handled by plain functions and the latency is simulated by the caller with setTimeout.
 *
 * With `buggy: true` the API has six deliberate bugs (used by the API bug hunt):
 *  1. POST /cart/items accepts quantity <= 0 (e.g. -5): only the upper limit is checked.
 *  2. GET /products/999 returns 200 with a `null` body instead of 404.
 *  3. DELETE /cart/items/:id has no auth check: it works without a token.
 *  4. Creating the same coupon twice returns 500 (database error leaks) instead of 409.
 *  5. `price` is returned as a string ("19.99") although the docs say number.
 *  6. PUT /cart/items/:id is not idempotent: every call adds the quantity again.
 * Everything else behaves the same in both versions.
 */

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: Method;
  url: string; // fully resolved URL
  headers: Record<string, string>; // lower-case keys
  body: string; // raw body text
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown; // undefined = no body
  ms: number;
}

export const BASE_URL = 'https://api.shop.test/v1';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

const seedProducts = (): Product[] => [
  { id: 1, name: 'Wireless Mouse', price: 19.99, category: 'accessories', stock: 42 },
  { id: 2, name: 'USB-C Cable', price: 9.5, category: 'accessories', stock: 120 },
  { id: 3, name: 'Mechanical Keyboard', price: 89, category: 'keyboards', stock: 15 },
  { id: 4, name: '27" Monitor', price: 249.99, category: 'monitors', stock: 7 },
  { id: 5, name: 'Laptop Stand', price: 34.9, category: 'accessories', stock: 0 },
];

const TOKENS: Record<string, { user: string; role: 'customer' | 'admin' }> = {
  'test-anna-123': { user: 'anna', role: 'customer' },
  'test-admin-999': { user: 'admin', role: 'admin' },
};

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  500: 'Internal Server Error',
};

export function createShopApi(buggy: boolean) {
  let products = seedProducts();
  let carts = new Map<string, Map<number, number>>();
  let coupons = new Map<string, { id: number; code: string; percent: number }>();
  let counter = 0;

  const round = (n: number) => Math.round(n * 100) / 100;
  const priceOut = (p: number) => (buggy ? p.toFixed(2) : p); // BUG 5
  const productOut = (p: Product) => ({ id: p.id, name: p.name, price: priceOut(p.price), category: p.category, inStock: p.stock > 0 });
  const cartOf = (user: string) => {
    if (!carts.has(user)) carts.set(user, new Map());
    return carts.get(user)!;
  };
  const cartOut = (user: string) => {
    const items = [...cartOf(user).entries()].map(([productId, quantity]) => {
      const p = products.find((x) => x.id === productId);
      const unit = p ? p.price : 0;
      return { productId, name: p ? p.name : 'Unknown', quantity, unitPrice: priceOut(unit), lineTotal: priceOut(round(unit * quantity)) };
    });
    const total = round([...cartOf(user).entries()].reduce((s, [id, q]) => s + (products.find((x) => x.id === id)?.price ?? 0) * q, 0));
    return { items, total: priceOut(total) };
  };

  function reset() {
    products = seedProducts();
    carts = new Map();
    coupons = new Map();
  }

  function handle(req: ApiRequest): ApiResponse {
    counter++;
    const ms = 70 + ((counter * 37) % 140) + (req.method === 'GET' ? 0 : 40);
    const reqId = `req_${(1000 + counter * 7).toString(36)}`;

    const send = (status: number, body?: unknown, extra: Record<string, string> = {}): ApiResponse => {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Cache-Control'] = 'no-store';
      headers['X-Request-Id'] = reqId;
      Object.assign(headers, extra);
      return { status, statusText: STATUS_TEXT[status] ?? '', headers, body, ms };
    };
    const error = (status: number, message: string, extra?: Record<string, string>) => send(status, { error: STATUS_TEXT[status], message }, extra);

    // URL
    if (!req.url.startsWith(BASE_URL)) {
      throw new Error(`getaddrinfo ENOTFOUND ${req.url.replace(/^https?:\/\//, '').split('/')[0] || req.url}`);
    }
    const rest = req.url.slice(BASE_URL.length);
    const [rawPath, rawQuery = ''] = rest.split('?');
    const path = rawPath.replace(/\/+$/, '') || '/';
    const query = new URLSearchParams(rawQuery);
    const seg = path.split('/').filter(Boolean);

    // Auth
    const authHeader = req.headers['authorization'];
    let auth: { user: string; role: 'customer' | 'admin' } | null = null;
    let authError: string | null = null;
    if (!authHeader) authError = 'Authentication required. Send an Authorization: Bearer <token> header.';
    else {
      const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
      if (!m) authError = 'Authorization header must use the Bearer scheme.';
      else if (!TOKENS[m[1].trim()]) authError = 'Invalid or expired token.';
      else auth = TOKENS[m[1].trim()];
    }
    const unauthorized = () => error(401, authError ?? 'Authentication required.', { 'WWW-Authenticate': 'Bearer' });

    // Body
    let body: unknown = undefined;
    const needsBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
    if (needsBody && req.body.trim()) {
      try {
        body = JSON.parse(req.body);
      } catch {
        return error(400, 'Request body is not valid JSON.');
      }
    }
    const obj = (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
    const notAllowed = (allow: string) => error(405, `${req.method} is not supported on ${path}.`, { Allow: allow });
    const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v);

    // ---- /products
    if (seg[0] === 'products' && seg.length === 1) {
      if (req.method !== 'GET') return notAllowed('GET');
      let list = products;
      const cat = query.get('category');
      if (cat) list = list.filter((p) => p.category === cat.toLowerCase());
      const limitRaw = query.get('limit');
      if (limitRaw !== null) {
        const limit = Number(limitRaw);
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) return error(400, 'limit must be an integer between 1 and 50.');
        list = list.slice(0, limit);
      }
      return send(200, { data: list.map(productOut), total: list.length });
    }
    if (seg[0] === 'products' && seg.length === 2) {
      const id = Number(seg[1]);
      if (req.method === 'GET') {
        if (!Number.isInteger(id)) return error(400, 'Product id must be a number.');
        const p = products.find((x) => x.id === id);
        if (!p) return buggy ? send(200, null) : error(404, `Product ${id} not found.`); // BUG 2
        return send(200, productOut(p));
      }
      if (req.method === 'DELETE') {
        if (!auth) return unauthorized();
        if (auth.role !== 'admin') return error(403, 'Only admins can delete products.');
        if (!products.some((x) => x.id === id)) return error(404, `Product ${seg[1]} not found.`);
        products = products.filter((x) => x.id !== id);
        return send(204);
      }
      return notAllowed('GET, DELETE');
    }

    // ---- /cart
    if (seg[0] === 'cart' && seg.length === 1) {
      if (req.method !== 'GET') return notAllowed('GET');
      if (!auth) return unauthorized();
      return send(200, cartOut(auth.user));
    }
    const validQuantity = (q: unknown): string | null => {
      if (q === undefined) return 'quantity is required.';
      if (!isInt(q)) return 'quantity must be an integer.';
      if ((q as number) > 10) return 'quantity must be between 1 and 10.';
      if (!buggy && (q as number) < 1) return 'quantity must be between 1 and 10.'; // BUG 1: lower bound skipped
      return null;
    };
    if (seg[0] === 'cart' && seg[1] === 'items' && seg.length === 2) {
      if (req.method !== 'POST') return notAllowed('POST');
      if (!auth) return unauthorized();
      if (obj.productId === undefined) return error(400, 'productId is required.');
      if (!isInt(obj.productId)) return error(400, 'productId must be an integer.');
      const qErr = validQuantity(obj.quantity);
      if (qErr) return error(400, qErr);
      const p = products.find((x) => x.id === obj.productId);
      if (!p) return error(404, `Product ${obj.productId} not found.`);
      if (p.stock === 0) return error(409, `${p.name} is out of stock.`);
      const cart = cartOf(auth.user);
      cart.set(p.id, (cart.get(p.id) ?? 0) + (obj.quantity as number));
      return send(201, cartOut(auth.user), { Location: `/v1/cart/items/${p.id}` });
    }
    if (seg[0] === 'cart' && seg[1] === 'items' && seg.length === 3) {
      const id = Number(seg[2]);
      if (req.method === 'PUT') {
        if (!auth) return unauthorized();
        const qErr = validQuantity(obj.quantity);
        if (qErr) return error(400, qErr);
        const p = products.find((x) => x.id === id);
        if (!p) return error(404, `Product ${seg[2]} not found.`);
        const cart = cartOf(auth.user);
        cart.set(id, buggy ? (cart.get(id) ?? 0) + (obj.quantity as number) : (obj.quantity as number)); // BUG 6
        return send(200, cartOut(auth.user));
      }
      if (req.method === 'DELETE') {
        if (!auth && !buggy) return unauthorized(); // BUG 3
        const user = auth ? auth.user : 'anna';
        const cart = cartOf(user);
        if (!cart.has(id)) return error(404, `Product ${seg[2]} is not in the cart.`);
        cart.delete(id);
        return send(204);
      }
      return notAllowed('PUT, DELETE');
    }

    // ---- /coupons
    if (seg[0] === 'coupons' && seg.length === 1) {
      if (req.method !== 'POST') return notAllowed('POST');
      if (!auth) return unauthorized();
      if (auth.role !== 'admin') return error(403, 'Only admins can create coupons.');
      if (typeof obj.code !== 'string' || !obj.code.trim()) return error(400, 'code is required and must be a string.');
      if (!isInt(obj.percent) || (obj.percent as number) < 1 || (obj.percent as number) > 90) return error(400, 'percent must be an integer between 1 and 90.');
      const code = obj.code.trim().toUpperCase();
      if (coupons.has(code)) {
        if (buggy) {
          // BUG 4
          return send(500, { error: 'Internal Server Error', message: 'duplicate key value violates unique constraint "coupons_code_key"' });
        }
        return error(409, `Coupon ${code} already exists.`);
      }
      const c = { id: coupons.size + 101, code, percent: obj.percent as number };
      coupons.set(code, c);
      return send(201, c, { Location: `/v1/coupons/${c.id}` });
    }

    return error(404, `No route for ${req.method} ${path}.`);
  }

  return { handle, reset };
}
