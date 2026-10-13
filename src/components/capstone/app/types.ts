export type Lang = 'en' | 'de' | 'sr';
export type Net = 'wifi' | 'slow' | 'offline';
export type RouteName = 'login' | 'home' | 'menu' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'profile';
export interface Route {
  name: RouteName;
  id?: string;
}

export interface CartState {
  restaurantId: string | null;
  items: Record<string, number>;
  /** Applied coupon codes (one entry per successful apply). */
  coupons: string[];
}

export interface Order {
  id: string;
  restaurantId: string;
  items: { dishId: string; qty: number }[];
  currency: 'EUR' | 'RSD';
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
  address: string;
  /** null = as soon as possible, otherwise slot start in minutes since midnight. */
  slot: number | null;
  payment: string;
  /** Device clock (ms) when placed. */
  placedAt: number;
  /** When the kitchen starts on it (progress-time ms: real time + skipped time). */
  startAt: number;
  /** Highest status index a push was sent for. */
  notified: number;
}

export interface Push {
  id: number;
  kind: 'order' | 'promo';
  orderId?: string;
  title: string;
  body: string;
  at: number;
}

export interface Settings {
  orderUpdates: boolean;
  promotions: boolean;
}

export interface LogEntry {
  id: number;
  method: string;
  path: string;
  status: number | 'pending' | 'ERR';
  ms: number;
}

export interface ApiOpts<T> {
  /** Base latency on Wi-Fi in ms. */
  ms?: number;
  /** Runs on the "server" when the request arrives; its return value is the response. */
  server?: () => { status: number; data?: T };
}
export type Api = <T = unknown>(method: string, path: string, opts?: ApiOpts<T>) => Promise<{ status: number; data?: T }>;
