/*
 * State machine models used by the State Transition Testing lesson.
 * Each model is the *specification* (the correct behavior). The explorer, the diagrams
 * and the buggy order demo all read from here.
 */

export interface StateDef {
  id: string;
  label: string;
  /** Center of the node in the diagram's viewBox. */
  x: number;
  y: number;
  initial?: boolean;
  final?: boolean;
  /** Where to draw the small "start" arrow for the initial state. */
  initialFrom?: 'left' | 'top';
}

export interface EventDef {
  id: string;
  label: string;
}

export interface TransitionDef {
  from: string;
  event: string;
  to: string;
  /** Condition that must be true, e.g. "≤ 30 days". */
  guard?: string;
  /** Key of the guard toggle in the explorer. */
  guardKey?: string;
  /** What the system does while moving, e.g. "charge card". */
  action?: string;
  /** Curve the arrow: perpendicular offset of the control point (px). */
  bend?: number;
  /** Nudge the label. */
  labelDx?: number;
  labelDy?: number;
  /** Override label text in the diagram (defaults to event label + guard). */
  diagramLabel?: string;
}

export interface GuardDef {
  key: string;
  label: string;
  /** Shown when the guard is false and the event is fired. */
  blocked: string;
  initial: boolean;
}

export interface Model {
  id: string;
  name: string;
  blurb: string;
  width: number;
  height: number;
  nodeWidth?: number;
  states: StateDef[];
  events: EventDef[];
  transitions: TransitionDef[];
  guards?: GuardDef[];
  /** What a correct system does when an event is NOT allowed in a state. Key: `${state}:${event}` or `${state}:*`. */
  invalid: Record<string, string>;
}

export const tkey = (from: string, event: string) => `${from}:${event}`;

export function findTransition(model: Model, from: string, event: string) {
  return model.transitions.find((t) => t.from === from && t.event === event);
}

export function invalidMessage(model: Model, state: string, event: string) {
  const s = model.states.find((x) => x.id === state)?.label ?? state;
  return (
    model.invalid[tkey(state, event)] ??
    model.invalid[`${state}:*`] ??
    `This event is not allowed in ${s}. A correct system ignores it, stays in ${s} and, if the user triggered it, explains why.`
  );
}

/** All (state, event) pairs that are NOT valid transitions. */
export function invalidPairs(model: Model) {
  const out: string[] = [];
  for (const s of model.states) for (const e of model.events) if (!findTransition(model, s.id, e.id)) out.push(tkey(s.id, e.id));
  return out;
}

export const orderModel: Model = {
  id: 'order',
  name: 'Online order',
  blurb: 'A shop order from checkout to doorstep. Two final states: Canceled and Refunded.',
  width: 380,
  height: 232,
  states: [
    { id: 'placed', label: 'Placed', x: 58, y: 52, initial: true, initialFrom: 'top' },
    { id: 'paid', label: 'Paid', x: 190, y: 52 },
    { id: 'shipped', label: 'Shipped', x: 322, y: 52 },
    { id: 'canceled', label: 'Canceled', x: 58, y: 190, final: true },
    { id: 'refunded', label: 'Refunded', x: 190, y: 190, final: true },
    { id: 'delivered', label: 'Delivered', x: 322, y: 190 },
  ],
  events: [
    { id: 'pay', label: 'Pay' },
    { id: 'ship', label: 'Ship' },
    { id: 'deliver', label: 'Deliver' },
    { id: 'cancel', label: 'Cancel' },
    { id: 'refund', label: 'Refund' },
  ],
  transitions: [
    { from: 'placed', event: 'pay', to: 'paid', action: 'charge card, send receipt', labelDy: -10 },
    { from: 'placed', event: 'cancel', to: 'canceled', action: 'release reserved stock', labelDx: -26 },
    { from: 'paid', event: 'ship', to: 'shipped', action: 'send tracking number', labelDy: -10 },
    { from: 'paid', event: 'cancel', to: 'canceled', action: 'refund the payment', diagramLabel: 'cancel / refund', labelDx: 22 },
    { from: 'shipped', event: 'deliver', to: 'delivered', action: 'notify customer', labelDx: 30 },
    {
      from: 'delivered',
      event: 'refund',
      to: 'refunded',
      guard: '≤ 30 days',
      guardKey: 'window',
      action: 'refund after the return arrives',
      labelDy: 24,
    },
  ],
  guards: [
    {
      key: 'window',
      label: 'Within the 30-day return window',
      blocked: 'The guard "within 30 days" is false, so the refund transition must NOT happen. A correct system stays in Delivered and says "The return window closed on 12 May".',
      initial: true,
    },
  ],
  invalid: {
    'placed:ship': 'Shipping an unpaid order gives goods away. Stay in Placed; the warehouse should see "Awaiting payment".',
    'placed:deliver': 'Nothing has shipped, so nothing can be delivered. Stay in Placed.',
    'placed:refund': 'Nothing was paid, so there is nothing to refund. Stay in Placed. Allowing it hands out free money.',
    'paid:pay': 'Already paid. The customer must NOT be charged a second time. Stay in Paid and show "This order is already paid".',
    'paid:deliver': 'Skipping Shipped breaks tracking and the warehouse flow. Stay in Paid.',
    'paid:refund': 'Not delivered yet. The right way out is Cancel, which refunds automatically. Stay in Paid.',
    'shipped:pay': 'Already paid. Never charge twice. Stay in Shipped.',
    'shipped:ship': 'Already shipped. Must not create a second shipment. Stay in Shipped.',
    'shipped:cancel': 'The parcel is on its way. Stay in Shipped and offer a return after delivery instead.',
    'shipped:refund': 'Refunds happen only after delivery and return. Stay in Shipped.',
    'delivered:pay': 'Already paid. Stay in Delivered.',
    'delivered:ship': 'Already delivered. Stay in Delivered.',
    'delivered:deliver': 'Already delivered. Stay in Delivered and don’t send a second "Delivered" notification.',
    'delivered:cancel': 'Too late to cancel: the customer has the goods. Stay in Delivered and offer Return & refund instead.',
    'canceled:pay': 'Canceled is a final state. An old payment link must NOT take money or bring the order back to life.',
    'canceled:refund': 'If the order was paid, Cancel already refunded it. A second refund pays out twice. Stay in Canceled.',
    'canceled:*': 'Canceled is a final state: no event may move the order anywhere. Stay in Canceled.',
    'refunded:refund': 'Already refunded. Never refund twice. Stay in Refunded.',
    'refunded:*': 'Refunded is a final state: no event may move the order anywhere. Stay in Refunded.',
  },
};

export const loginModel: Model = {
  id: 'login',
  name: 'Login lockout',
  blurb: 'A banking app locks the account for 15 minutes after 3 wrong passwords in a row.',
  width: 380,
  height: 290,
  nodeWidth: 92,
  states: [
    { id: 'in', label: 'Logged in', x: 190, y: 40 },
    { id: 'ready', label: '0 wrong', x: 58, y: 150, initial: true, initialFrom: 'left' },
    { id: 'one', label: '1 wrong', x: 190, y: 150 },
    { id: 'two', label: '2 wrong', x: 322, y: 150 },
    { id: 'locked', label: 'Locked', x: 322, y: 250 },
  ],
  events: [
    { id: 'correct', label: 'Right password' },
    { id: 'wrong', label: 'Wrong password' },
    { id: 'wait', label: '15 min pass' },
    { id: 'logout', label: 'Log out' },
  ],
  transitions: [
    { from: 'ready', event: 'wrong', to: 'one', action: 'show "Wrong email or password"', diagramLabel: 'wrong', labelDy: -10 },
    { from: 'one', event: 'wrong', to: 'two', action: 'warn "1 attempt left"', diagramLabel: 'wrong', labelDy: -10 },
    { from: 'two', event: 'wrong', to: 'locked', action: 'lock for 15 min, email the owner', diagramLabel: 'wrong / lock', labelDx: -40 },
    { from: 'ready', event: 'correct', to: 'in', action: 'open the dashboard', diagramLabel: 'right', bend: 18 },
    { from: 'one', event: 'correct', to: 'in', action: 'reset the counter to 0', diagramLabel: 'right', labelDx: 18 },
    { from: 'two', event: 'correct', to: 'in', action: 'reset the counter to 0', diagramLabel: 'right', labelDx: 18, labelDy: -2 },
    { from: 'in', event: 'logout', to: 'ready', action: 'end the session', diagramLabel: 'log out', bend: 18 },
    { from: 'locked', event: 'wait', to: 'ready', action: 'unlock, counter back to 0', diagramLabel: '15 min pass', bend: -46, labelDy: 4 },
  ],
  invalid: {
    'locked:correct': 'The big one: even the RIGHT password must not log in while locked. Stay in Locked and show "Too many attempts. Try again in 15 minutes."',
    'locked:wrong': 'Stay in Locked. Don’t reveal whether the password was right, and don’t restart the timer unless the spec says so.',
    'locked:logout': 'Nobody is logged in, so there is nothing to log out. Stay in Locked.',
    'ready:wait': 'Waiting only matters while locked. Stay in 0 wrong.',
    'one:wait': 'The counter stays at 1. (Do failed attempts expire after a while? The spec doesn’t say. That is a great question to ask!)',
    'two:wait': 'The counter stays at 2: the next wrong password still locks the account. Stay in 2 wrong.',
    'ready:logout': 'Not logged in. Ignore it and stay in 0 wrong.',
    'one:logout': 'Not logged in. Ignore it and stay in 1 wrong.',
    'two:logout': 'Not logged in. Ignore it and stay in 2 wrong.',
    'in:correct': 'Already logged in: the login form isn’t even shown. Stay in Logged in.',
    'in:wrong': 'Already logged in. A stray login request must not log the user out or count as a failure.',
    'in:wait': 'The lockout timer has nothing to do with an active session. Stay in Logged in. (Session timeout is a separate rule.)',
  },
};

export const musicModel: Model = {
  id: 'music',
  name: 'Music player',
  blurb: 'A podcast or music player with Play, Pause and Stop.',
  width: 380,
  height: 180,
  states: [
    { id: 'stopped', label: 'Stopped', x: 62, y: 130, initial: true, initialFrom: 'left' },
    { id: 'playing', label: 'Playing', x: 190, y: 40 },
    { id: 'paused', label: 'Paused', x: 318, y: 130 },
  ],
  events: [
    { id: 'play', label: 'Play' },
    { id: 'pause', label: 'Pause' },
    { id: 'stop', label: 'Stop' },
  ],
  transitions: [
    { from: 'stopped', event: 'play', to: 'playing', action: 'start from 0:00', bend: 16 },
    { from: 'playing', event: 'stop', to: 'stopped', action: 'reset position to 0:00', bend: 16 },
    { from: 'playing', event: 'pause', to: 'paused', action: 'remember the position', bend: 16 },
    { from: 'paused', event: 'play', to: 'playing', action: 'resume from the same position', bend: 16 },
    { from: 'paused', event: 'stop', to: 'stopped', action: 'reset position to 0:00', labelDy: 14 },
  ],
  invalid: {
    'stopped:pause': 'Nothing is playing, so there is nothing to pause. Stay in Stopped (the Pause button is usually hidden or disabled).',
    'stopped:stop': 'Already stopped. Ignore it.',
    'playing:play': 'Already playing. It must NOT restart the track or start a second audio stream on top (two songs at once).',
    'paused:pause': 'Already paused. Ignore it and keep the position.',
  },
};

export const cardModel: Model = {
  id: 'card',
  name: 'Bank card',
  blurb: 'A debit card in a banking app: the user can freeze it, and it expires one day.',
  width: 380,
  height: 236,
  states: [
    { id: 'active', label: 'Active', x: 70, y: 84, initial: true, initialFrom: 'left' },
    { id: 'blocked', label: 'Blocked', x: 310, y: 84 },
    { id: 'expired', label: 'Expired', x: 190, y: 200, final: true },
  ],
  events: [
    { id: 'pay', label: 'Pay' },
    { id: 'block', label: 'Block' },
    { id: 'unblock', label: 'Unblock' },
    { id: 'expire', label: 'Expiry date' },
  ],
  transitions: [
    { from: 'active', event: 'pay', to: 'active', action: 'approve the payment' },
    { from: 'active', event: 'block', to: 'blocked', action: 'decline all payments', bend: 16 },
    {
      from: 'blocked',
      event: 'unblock',
      to: 'active',
      guard: 'ID check',
      guardKey: 'id',
      action: 'allow payments again',
      bend: 16,
    },
    { from: 'active', event: 'expire', to: 'expired', action: 'order a new card', diagramLabel: 'expiry date', labelDx: -34 },
    { from: 'blocked', event: 'expire', to: 'expired', diagramLabel: 'expiry date', labelDx: 34 },
  ],
  guards: [
    {
      key: 'id',
      label: 'User passed the Face ID / PIN check',
      blocked: 'The guard "ID check passed" is false, so the card must stay Blocked. Unblocking without re-authentication would let a thief unfreeze a stolen phone’s card.',
      initial: true,
    },
  ],
  invalid: {
    'active:unblock': 'Already active. Ignore it.',
    'blocked:pay': 'The payment must be DECLINED and the card stays Blocked. A frozen card that still pays is a critical bug.',
    'blocked:block': 'Already blocked. Ignore it (and don’t send a second "Card frozen" notification).',
    'expired:pay': 'Decline: the card has expired. Stay in Expired.',
    'expired:block': 'An expired card can’t be frozen or unfrozen. Stay in Expired.',
    'expired:unblock': 'Unblocking must never bring an expired card back to life. Stay in Expired.',
    'expired:expire': 'Already expired. Ignore it.',
  },
};

/** Used only for a static diagram in the lesson. */
export const rideModel: Model = {
  id: 'ride',
  name: 'Ride-hailing trip',
  blurb: 'A taxi app trip from request to drop-off.',
  width: 380,
  height: 220,
  nodeWidth: 96,
  states: [
    { id: 'requested', label: 'Requested', x: 60, y: 46, initial: true, initialFrom: 'top' },
    { id: 'assigned', label: 'Driver assigned', x: 190, y: 120 },
    { id: 'ontrip', label: 'On trip', x: 320, y: 46 },
    { id: 'completed', label: 'Completed', x: 320, y: 186, final: true },
    { id: 'canceled', label: 'Canceled', x: 60, y: 186, final: true },
  ],
  events: [
    { id: 'accept', label: 'Driver accepts' },
    { id: 'pickup', label: 'Pick up' },
    { id: 'dropoff', label: 'Drop off' },
    { id: 'cancel', label: 'Cancel' },
  ],
  transitions: [
    { from: 'requested', event: 'accept', to: 'assigned', diagramLabel: 'accept', labelDx: 10, labelDy: -10 },
    { from: 'assigned', event: 'pickup', to: 'ontrip', diagramLabel: 'pick up', labelDx: -8, labelDy: -10 },
    { from: 'ontrip', event: 'dropoff', to: 'completed', action: 'charge fare', diagramLabel: 'drop off', labelDx: 30 },
    { from: 'requested', event: 'cancel', to: 'canceled', diagramLabel: 'cancel', labelDx: -24 },
    { from: 'assigned', event: 'cancel', to: 'canceled', action: 'late fee after 2 min', diagramLabel: 'cancel / fee', labelDx: 20, labelDy: 10 },
  ],
  invalid: {},
};

export const explorerModels: Model[] = [orderModel, loginModel, musicModel, cardModel];
export const allModels: Record<string, Model> = { order: orderModel, login: loginModel, music: musicModel, card: cardModel, ride: rideModel };
