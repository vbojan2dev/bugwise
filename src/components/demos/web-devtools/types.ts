/** Shared types for the fake DevTools demos (DevTools for Testers + Cookies, Sessions and Storage). */

export type Level = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleEntry {
  id: number;
  level: Level;
  text: string;
  /** Shown on the right, e.g. "app.js:214". */
  source?: string;
  /** Optional stack trace lines, shown when the entry is expanded. */
  stack?: string[];
}

export type ReqType = 'doc' | 'fetch' | 'css' | 'js' | 'img';

export interface NetEntry {
  id: number;
  method: string;
  /** Path including query string, e.g. "/api/products?category=all". */
  url: string;
  type: ReqType;
  /** null = pending, 0 = failed / canceled. */
  status: number | null;
  statusText?: string;
  /** Human readable transferred size, e.g. "1.2 kB" or "(disk cache)". */
  size: string;
  /** Duration in ms. */
  time: number;
  fromCache?: boolean;
  requestHeaders?: [string, string][];
  responseHeaders?: [string, string][];
  requestBody?: unknown;
  responseBody?: unknown;
  initiator?: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  /** "Session" or a date string. */
  expires: string;
  httpOnly: boolean;
  secure: boolean;
  /** Empty string = attribute not set (browser default applies). */
  sameSite: '' | 'Lax' | 'Strict' | 'None';
}

/** Ordered key/value list (keeps insertion order like the real Storage panel). */
export type KV = [string, string][];

export const kvSet = (kv: KV, key: string, value: string): KV =>
  kv.some(([k]) => k === key) ? kv.map(([k, v]) => [k, k === key ? value : v] as [string, string]) : [...kv, [key, value]];

export const kvDel = (kv: KV, key: string): KV => kv.filter(([k]) => k !== key);

export const kvGet = (kv: KV, key: string): string | undefined => kv.find(([k]) => k === key)?.[1];
