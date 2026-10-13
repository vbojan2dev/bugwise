import { SPEC } from '@/lib/capstone';
import { DISHES, RSD_RATE } from './data';
import type { Currency } from './i18n';
import type { CartState } from './types';

export const toRsd = (eur: number) => Math.round((eur * RSD_RATE) / 10) * 10;
export const priceIn = (eur: number, cur: Currency) => (cur === 'RSD' ? toRsd(eur) : eur);
export const dishPrice = (dishId: string, cur: Currency) => priceIn(DISHES[dishId]?.eur ?? 0, cur);
export const feeIn = (cur: Currency) => priceIn(SPEC.deliveryFee, cur);
export const thresholdIn = (cur: Currency) => priceIn(SPEC.freeDeliveryFrom, cur);
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Totals {
  count: number;
  subtotal: number;
  discountEach: number;
  discount: number;
  free: boolean;
  fee: number;
  total: number;
  /** How much more is needed for free delivery (by the app's own rule). */
  missing: number;
  /** True when free delivery is granted although the discounted total is below the threshold (B09). */
  freeByBug: boolean;
}

export function totals(cart: CartState, cur: Currency): Totals {
  let subtotal = 0;
  let count = 0;
  for (const [id, qty] of Object.entries(cart.items)) {
    subtotal += dishPrice(id, cur) * qty;
    count += qty;
  }
  const discountEach = round2((subtotal * SPEC.coupon.percent) / 100);
  const discount = round2(discountEach * cart.coupons.length);
  const threshold = thresholdIn(cur);
  // BUG B09: the free-delivery rule looks at the subtotal BEFORE the discount.
  const free = count > 0 && subtotal >= threshold;
  const fee = count === 0 || free ? 0 : feeIn(cur);
  // BUG B10 (display): the raw float sum is not rounded; the cart prints it as-is.
  const total = subtotal - discount + fee;
  return {
    count,
    subtotal,
    discountEach,
    discount,
    free,
    fee,
    total,
    missing: Math.max(0, threshold - subtotal),
    freeByBug: free && subtotal - discount < threshold,
  };
}
