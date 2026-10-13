import type { Order } from './types';
import { clockOf, hhmm } from './i18n';

/** Server-side status timeline (ms of progress time after the kitchen starts; see FoodDashApp). */
export const STEP_AT = [0, 30_000, 240_000, 1_080_000];
export const DELIVERY_MS = STEP_AT[3];

export function orderStep(o: Order, now: number) {
  const dt = now - o.startAt;
  let s = 0;
  for (let i = 1; i < STEP_AT.length; i++) if (dt >= STEP_AT[i]) s = i;
  return s;
}

/** Arrival window text, e.g. "18:28–18:38" or the chosen slot. */
export function arrivalWindow(o: Order, slotMinutes: number) {
  if (o.slot != null) return `${hhmm(o.slot)}–${hhmm(o.slot + slotMinutes)}`;
  const at = clockOf(o.placedAt + DELIVERY_MS);
  return `${hhmm(at - 5)}–${hhmm(at + 5)}`;
}
