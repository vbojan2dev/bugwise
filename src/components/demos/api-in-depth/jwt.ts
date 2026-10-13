/*
 * Tiny JWT helpers for the FoodDash sandbox. Everything runs in the browser.
 *
 * The tokens are real JWT *shape* (base64url header . base64url payload . signature), so any JWT
 * decoder can read them. The signature is NOT real cryptography: it's a deterministic hash of
 * "header.payload" plus a server secret, which is enough to show that editing the payload
 * breaks the signature. Never use this for anything real.
 */

/** The sandbox has its own fixed clock so tokens behave the same for every learner. */
export const SANDBOX_NOW = Date.UTC(2026, 9, 17, 9, 0, 0) / 1000; // 2026-10-17 09:00:00 UTC

const SECRET = 'fooddash-staging-secret';

export interface JwtPayload {
  sub: string;
  name: string;
  role: string;
  iss: string;
  iat: number;
  exp: number;
  [k: string]: unknown;
}

function b64urlEncode(s: string) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string) {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('not base64url');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

/** Deterministic 256-bit-looking hash (cyrb53, repeated with different seeds). Not secure. */
function fakeHmac(input: string) {
  const parts: string[] = [];
  for (let seed = 1; seed <= 4; seed++) {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    const str = SECRET + '|' + input;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    parts.push((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'));
  }
  const hex = parts.join('');
  let bin = '';
  for (let i = 0; i < hex.length; i += 2) bin += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return b64urlEncode(bin);
}

export function signJwt(payload: JwtPayload) {
  const head = b64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64urlEncode(JSON.stringify(payload));
  return `${head}.${body}.${fakeHmac(`${head}.${body}`)}`;
}

/** Re-encodes a payload but keeps the old signature, like an attacker editing a token by hand. */
export function forgeJwt(token: string, changes: Record<string, unknown>) {
  const [head, body, sig] = token.split('.');
  const payload = JSON.parse(b64urlDecode(body));
  return `${head}.${b64urlEncode(JSON.stringify({ ...payload, ...changes }))}.${sig}`;
}

export interface Decoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

/** Decoding only reads the token. It does not prove anything about who made it. */
export function decodeJwt(token: string): Decoded | { error: string } {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { error: `A JWT has 3 parts separated by dots. This one has ${parts.length}.` };
  try {
    const header = JSON.parse(b64urlDecode(parts[0]));
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return { header, payload, signature: parts[2] };
  } catch {
    return { error: 'The header or payload is not valid base64url-encoded JSON.' };
  }
}

export type VerifyResult = { ok: true; payload: JwtPayload } | { ok: false; reason: 'malformed' | 'signature' | 'expired'; payload?: JwtPayload };

/** What the server does: check the signature first, then the expiry. */
export function verifyJwt(token: string, opts: { ignoreExpiration?: boolean } = {}): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  let payload: JwtPayload;
  try {
    payload = JSON.parse(b64urlDecode(parts[1]));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (fakeHmac(`${parts[0]}.${parts[1]}`) !== parts[2]) return { ok: false, reason: 'signature' };
  if (!opts.ignoreExpiration && !(typeof payload.exp === 'number' && payload.exp > SANDBOX_NOW)) return { ok: false, reason: 'expired', payload };
  return { ok: true, payload };
}

const ISS = 'https://auth.fooddash.test';

export const TOKENS = {
  anna: signJwt({ sub: 'u_1001', name: 'Anna Novak', role: 'customer', iss: ISS, iat: SANDBOX_NOW - 600, exp: SANDBOX_NOW + 3000 }),
  ben: signJwt({ sub: 'u_1002', name: 'Ben Okafor', role: 'customer', iss: ISS, iat: SANDBOX_NOW - 1200, exp: SANDBOX_NOW + 2400 }),
  annaExpired: signJwt({ sub: 'u_1001', name: 'Anna Novak', role: 'customer', iss: ISS, iat: SANDBOX_NOW - 7200, exp: SANDBOX_NOW - 3600 }),
};

export function fmtTime(sec: number) {
  return new Date(sec * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function relTime(sec: number) {
  const d = sec - SANDBOX_NOW;
  const m = Math.round(Math.abs(d) / 60);
  const txt = m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim() : `${m} min`;
  return d >= 0 ? `in ${txt}` : `${txt} ago`;
}
