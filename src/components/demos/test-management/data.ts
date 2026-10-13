/**
 * Shared mock data for the test management lessons: a small FoodDash 2.0 test case repository
 * and what the learner "sees" when executing each case on build 412.
 * Product facts match the Capstone (src/lib/capstone.ts), but the defects here are deliberately NOT Capstone bugs
 * (never reuse anything from BUGS in capstone.ts: it would spoil the Capstone).
 */

export type Status = 'untested' | 'passed' | 'failed' | 'blocked' | 'retest' | 'skipped';
export type Device = 'ios' | 'android';
export type Priority = 'P1' | 'P2' | 'P3';
export type Section = 'Login' | 'Cart' | 'Checkout' | 'Tracking' | 'Profile';

export const SECTIONS: Section[] = ['Login', 'Cart', 'Checkout', 'Tracking', 'Profile'];
export const PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];

export const DEVICES: Record<Device, string> = {
  ios: 'iPhone 15 · iOS 18',
  android: 'Pixel 8 · Android 15',
};

export const STATUS_META: Record<Status, { label: string; dot: string; text: string; soft: string }> = {
  passed: { label: 'Passed', dot: 'bg-ok', text: 'text-ok', soft: 'bg-ok-soft' },
  failed: { label: 'Failed', dot: 'bg-danger', text: 'text-danger', soft: 'bg-danger-soft' },
  blocked: { label: 'Blocked', dot: 'bg-warn', text: 'text-warn', soft: 'bg-warn-soft' },
  retest: { label: 'Retest', dot: 'bg-info', text: 'text-info', soft: 'bg-info-soft' },
  skipped: { label: 'Skipped (N/A)', dot: 'bg-faint', text: 'text-muted', soft: 'bg-subtle' },
  untested: { label: 'Untested', dot: 'bg-line-strong', text: 'text-faint', soft: 'bg-subtle' },
};

export type RepoCase = {
  id: string;
  section: Section;
  title: string;
  priority: Priority;
  automation: 'Manual' | 'Automated' | 'To automate';
  preconditions?: string;
  steps: string[];
  expected: string;
  /** Status the case starts with in a new run (default: untested). */
  initial?: 'retest';
  retestNote?: string;
  observed: (d: Device) => string;
  answer: (d: Device) => Status;
  why: (d: Device) => string;
};

export const REPO: RepoCase[] = [
  {
    id: 'C101',
    section: 'Login',
    title: 'Sign in with a valid email and password',
    priority: 'P1',
    automation: 'Automated',
    steps: ['Open FoodDash', 'Enter mia@fooddash.test and Tasty-2024', "Tap 'Sign in'"],
    expected: "Home opens and greets the user with 'Hi, Mia'.",
    observed: () => "Home opens with 'Hi, Mia' and the restaurant list.",
    answer: () => 'passed',
    why: () => 'The actual result matches the expected result exactly. That is a pass.',
  },
  {
    id: 'C102',
    section: 'Login',
    title: "'Remember me' keeps you signed in",
    priority: 'P1',
    automation: 'Manual',
    steps: ["Sign in with 'Remember me' turned on", 'Close FoodDash completely (swipe it away)', 'Open FoodDash again'],
    expected: "Home opens and the user is still signed in.",
    observed: () => 'The Sign in screen appears again and the email field is empty. Signing in works, but every restart signs you out.',
    answer: () => 'failed',
    why: () => "The product does something different from the expected result, so the case fails. Link the bug: users who chose 'Remember me' have to sign in again every time.",
  },
  {
    id: 'C103',
    section: 'Login',
    title: 'Sign in with Face ID',
    priority: 'P2',
    automation: 'Manual',
    preconditions: 'iPhone with Face ID set up; Face ID turned on in FoodDash settings',
    steps: ['Open FoodDash while signed out', 'Wait for the Face ID prompt', 'Look at the phone'],
    expected: 'Home opens without typing a password.',
    observed: (d) =>
      d === 'ios'
        ? 'The Face ID prompt appears, the check succeeds and Home opens.'
        : "Your run is on a Pixel 8. The precondition says 'iPhone with Face ID'. Android fingerprint sign-in has its own case in the Android suite.",
    answer: (d) => (d === 'ios' ? 'passed' : 'skipped'),
    why: (d) =>
      d === 'ios'
        ? 'The precondition is met and the result matches. Pass.'
        : 'The case does not apply to this device, so it is Skipped / N/A. Blocked would claim something is broken, and Passed would claim something was checked. Even better: leave iOS-only cases out when you build an Android run.',
  },
  {
    id: 'C201',
    section: 'Cart',
    title: 'Add a dish; the cart badge and list update',
    priority: 'P1',
    automation: 'Automated',
    steps: ['Open Pizza Place', "Tap 'Add' on Margherita (€9.50)"],
    expected: 'The cart badge shows 1 and the cart lists Margherita, €9.50.',
    observed: () => 'The badge shows 1. The cart lists Margherita × 1, €9.50.',
    answer: () => 'passed',
    why: () => 'Matches the expected result. Pass.',
  },
  {
    id: 'C202',
    section: 'Cart',
    title: 'An expired code (SPRING5) is rejected',
    priority: 'P1',
    automation: 'Manual',
    preconditions: 'Cart worth €12.00; SPRING5 (5% off) expired on 30 September',
    steps: ['Open the cart', 'Enter SPRING5', 'Tap Apply'],
    expected: "'This code has expired' appears. No discount is applied; the total stays €12.00.",
    observed: () => "'Code applied' appears, the discount line shows −€0.60 and the total is €11.40.",
    answer: () => 'failed',
    why: () => 'A product defect with direct money loss: expired promotions keep costing money. Fail it, link the bug and attach a screenshot of the −€0.60 line as evidence.',
  },
  {
    id: 'C203',
    section: 'Cart',
    title: 'Remove one dish from the cart',
    priority: 'P2',
    automation: 'To automate',
    preconditions: 'Cart with Margherita (€9.50) and Tiramisu (€5.00)',
    steps: ['Open the cart', "Tap 'Remove' next to Tiramisu"],
    expected: 'Only Tiramisu disappears. Margherita stays and the total is €9.50.',
    initial: 'retest',
    retestNote: "Failed in the build 405 run with bug FD-118 ('Remove' deleted the wrong dish). FD-118 is marked fixed in build 412, so the tool set this case to Retest.",
    observed: () => 'Tiramisu disappears, Margherita stays, and the total shows €9.50.',
    answer: () => 'passed',
    why: () => 'This is retesting: you confirmed the fix, so the case passes and FD-118 can be closed. Leaving it on Retest would mean nobody checked the fix.',
  },
  {
    id: 'C301',
    section: 'Checkout',
    title: 'Place an order with a saved test card',
    priority: 'P1',
    automation: 'Manual',
    preconditions: 'Saved test card 4242 4242 4242 4242; cart worth €25.00',
    steps: ['Open the cart and tap Checkout', 'Choose the saved card', "Tap 'Place order'"],
    expected: 'The confirmation screen shows the order number and €25.00.',
    observed: () =>
      "A spinner runs, then 'Payment service unavailable'. The network log shows 503 from sandbox.payco.test. The team channel says: 'PayCo sandbox is down for maintenance until 15:00.'",
    answer: () => 'blocked',
    why: () =>
      "You couldn't reach the thing this case checks, and the cause is the payment provider's test environment, not FoodDash. Blocked, with the reason, and re-run after 15:00. If it still fails then, it becomes Failed.",
  },
  {
    id: 'C302',
    section: 'Checkout',
    title: "Delivery slots respect the restaurant's closing time",
    priority: 'P2',
    automation: 'Manual',
    preconditions: 'Late Night Noodles closes at 23:00; device time is 22:10',
    steps: ['Add a dish from Late Night Noodles and tap Checkout', 'Open the delivery time list'],
    expected: 'The last slot offered is 22:30–23:00.',
    observed: () => 'The list continues with 23:00–23:30 and 23:30–00:00, and you can select them.',
    answer: () => 'failed',
    why: () => 'Slots after closing time are offered, which contradicts the expected result. Fail it and link a bug. Nothing outside FoodDash stopped you, so it is not Blocked.',
  },
  {
    id: 'C401',
    section: 'Tracking',
    title: "A new order shows the status 'Preparing'",
    priority: 'P1',
    automation: 'Manual',
    preconditions: 'Test order #5012 exists (created by the seed script)',
    steps: ['Open Orders', 'Tap order #5012'],
    expected: "Tracking shows 'Preparing' and the restaurant name.",
    observed: () =>
      "Tracking shows 'Preparing' and 'Sushi Corner'. On your way there, in the Orders list, you notice that the restaurant logo next to order #4980 is stretched.",
    answer: () => 'passed',
    why: () =>
      'This case checks the tracking status, and it matched. The stretched logo is a real bug in a different place: report it separately, but do not fail an unrelated case.',
  },
  {
    id: 'C402',
    section: 'Tracking',
    title: 'Order history lists past orders, newest first',
    priority: 'P3',
    automation: 'To automate',
    steps: ['Open Profile', 'Tap Order history'],
    expected: 'Orders are listed newest first, each with date, restaurant and total.',
    observed: () => 'Orders #5012, #4980 and #4911 appear newest first, each with date, restaurant and total.',
    answer: () => 'passed',
    why: () => 'Matches the expected result. Pass.',
  },
  {
    id: 'C501',
    section: 'Profile',
    title: 'Change the phone number in Profile',
    priority: 'P3',
    automation: 'Manual',
    steps: ['Open Profile and tap Phone', 'Enter +49 151 2345 6789', 'Tap Save'],
    expected: "'Profile saved' appears and the new number is shown.",
    observed: () => "'Profile saved' appears. The profile shows +49 151 2345 6789.",
    answer: () => 'passed',
    why: () => 'Matches the expected result. Pass.',
  },
];

export const BUG_KEY = /^[A-Z][A-Z0-9]{1,9}-\d{1,6}$/;
