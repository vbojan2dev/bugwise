import { createContext, useContext } from 'react';
import type { Screen } from '@/lib/capstone';
import type { Currency, TKey } from './i18n';
import type { Api, CartState, Lang, Net, Order, Settings } from './types';

export interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  cur: Currency;
  money: (n: number, cur?: Currency) => string;
  /** Device clock (ms since epoch). Frozen at SPEC.now; moves only when time is skipped. */
  now: number;
  /** Progress time used by the order timeline: real elapsed time + skipped time. */
  progressNow: number;
  net: Net;
  api: Api;
  dark: boolean;
  largeText: boolean;
  landscape: boolean;
  /** App is in the foreground and visible. */
  active: boolean;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  cart: CartState;
  setCart: (fn: (c: CartState) => CartState) => void;
  orders: Order[];
  addOrder: (o: Omit<Order, 'id' | 'notified' | 'startAt'>) => Order;
  settings: Settings;
  setSettings: (s: Settings) => void;
  /** Report that a catalog bug manifested (deduplicated per screen). */
  seen: (id: string, screen: Screen) => void;
}

export const Ctx = createContext<AppCtx | null>(null);
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('FoodDash context missing');
  return c;
}
