/**
 * Capstone project: test the FoodDash 2.0 release from start to finish.
 *
 * This file is the contract between the FoodDash app (src/components/capstone/app/**) and the
 * Capstone pages (src/pages/capstone/**): the bug catalog and the learner's saved state.
 * State lives only in this browser (localStorage), like the rest of the progress.
 */

// ---------- Product facts (the "spec") ----------
// Both the app and the documents the learner reads use these values, so they never disagree.

export const SPEC = {
  app: 'FoodDash',
  version: '2.0.0',
  build: '412',
  testAccount: { email: 'mia@fooddash.test', password: 'Tasty-2024' },
  coupon: { code: 'WELCOME10', percent: 10, oncePerOrder: true },
  deliveryFee: 2.99,
  freeDeliveryFrom: 20, // after discounts
  maxPerDish: 10,
  slotMinutes: 30,
  languages: ['English', 'Deutsch', 'Srpski'] as const,
  currencyByLanguage: { English: 'EUR', Deutsch: 'EUR', Srpski: 'RSD' } as const,
  /** Simulated "now" inside the app, so time-based behavior is deterministic. */
  now: '2026-10-16T18:10:00',
};

// ---------- Bug catalog ----------

export type Screen = 'login' | 'home' | 'menu' | 'cart' | 'checkout' | 'tracking' | 'profile' | 'any';
export type BugCategory = 'functional' | 'ui' | 'accessibility' | 'mobile' | 'security' | 'localization';
export type Severity = 'critical' | 'major' | 'minor' | 'trivial';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export interface CapstoneBug {
  id: string;
  screen: Screen;
  category: BugCategory;
  /** Short, neutral title shown only AFTER the bug was found (or on the results page). */
  title: string;
  /** Nudge shown on the results page for bugs not found yet. Must not give the answer away. */
  hint: string;
  /** What a correct app does, and why it matters. Shown after the capstone. */
  expected: string;
  severity: Severity;
  priority: Priority;
  /** Why this severity/priority; shown when grading the learner's report. */
  rationale: string;
}

export const BUGS: CapstoneBug[] = [
  // Login
  { id: 'B01', screen: 'login', category: 'security', title: 'Login error reveals whether an account exists', hint: 'Compare the error for a wrong password with the error for an email nobody uses.', expected: 'The same generic message for both, e.g. "Email or password is incorrect".', severity: 'major', priority: 'P2', rationale: 'Lets attackers find valid accounts (account enumeration). Not visible to normal users, but a real security weakness.' },
  { id: 'B02', screen: 'login', category: 'functional', title: 'Login fails when the email has capital letters', hint: 'Phones often capitalize the first letter of what you type.', expected: 'Emails are compared case-insensitively and trimmed.', severity: 'major', priority: 'P1', rationale: 'Many users get "wrong email" on their phone and can\'t log in at all. High impact on a core flow.' },
  // Home
  { id: 'B03', screen: 'home', category: 'functional', title: 'Search ignores dishes with accents', hint: 'Search for a dish the way people type on a phone, without special characters.', expected: '"cevapi" finds "Ćevapi" and "creme" finds "Crème brûlée".', severity: 'minor', priority: 'P3', rationale: 'Users can still browse, but search misses items. Matters more in markets with diacritics.' },
  { id: 'B04', screen: 'home', category: 'functional', title: 'Result count does not match the list', hint: 'Turn filters on and count what you see.', expected: 'The "N restaurants" label always equals the number of cards shown.', severity: 'minor', priority: 'P3', rationale: 'Confusing but harmless; easy to fix.' },
  { id: 'B05', screen: 'home', category: 'ui', title: 'Long restaurant names overlap the rating', hint: 'Look closely at every card on a small screen.', expected: 'Long names truncate or wrap without covering other content.', severity: 'minor', priority: 'P3', rationale: 'Visual defect; information is still mostly readable.' },
  // Menu
  { id: 'B06', screen: 'menu', category: 'functional', title: 'Quantity can exceed the limit of 10 per dish', hint: 'Read the menu rules, then push the + button past them.', expected: '+ is disabled at 10 and the limit is explained.', severity: 'minor', priority: 'P2', rationale: 'Orders the kitchen can\'t fulfil; the restaurant has to call the customer.' },
  { id: 'B07', screen: 'menu', category: 'accessibility', title: 'Add buttons have no accessible name', hint: 'Turn on the screen reader preview and move through a dish.', expected: 'Each button is announced, e.g. "Add Margherita, €9.50".', severity: 'major', priority: 'P2', rationale: 'Blind users can\'t order at all. Accessibility blockers are often legal risks too.' },
  // Cart
  { id: 'B08', screen: 'cart', category: 'functional', title: 'The same coupon can be applied twice', hint: 'What happens if you apply a valid code again?', expected: 'A code applies once; a second attempt says it\'s already applied.', severity: 'major', priority: 'P1', rationale: 'Direct money loss for the business, and easy to abuse once people notice.' },
  { id: 'B09', screen: 'cart', category: 'functional', title: 'Free delivery uses the total before the discount', hint: 'Compare the free-delivery rule in the release notes with a discounted cart just above the threshold.', expected: 'Free delivery applies when the total after discounts is at least €20.', severity: 'minor', priority: 'P2', rationale: 'Small money loss per order, but on every discounted order.' },
  { id: 'B10', screen: 'cart', category: 'ui', title: 'Total shows a floating-point rounding error', hint: 'Try different quantities and watch the total closely.', expected: 'Prices always show two decimals, e.g. €23.90.', severity: 'minor', priority: 'P2', rationale: 'Looks broken and erodes trust at the moment of paying.' },
  // Checkout
  { id: 'B11', screen: 'checkout', category: 'functional', title: 'A delivery time in the past can be chosen', hint: 'Look at the time slots offered for today.', expected: 'Only future slots are offered.', severity: 'major', priority: 'P2', rationale: 'Orders that can never be delivered on time; support tickets and refunds.' },
  { id: 'B12', screen: 'checkout', category: 'functional', title: 'Double tap on Place order creates two orders', hint: 'On a slow connection, impatient people tap twice.', expected: 'The button disables while placing the order; one order is created.', severity: 'critical', priority: 'P1', rationale: 'Customers are charged twice. Money, refunds and trust.' },
  { id: 'B13', screen: 'checkout', category: 'mobile', title: 'Rotating the phone clears the checkout form', hint: 'Fill in the form, then turn the phone.', expected: 'Everything typed is kept after rotation.', severity: 'major', priority: 'P2', rationale: 'Users lose their address and often abandon the order.' },
  { id: 'B14', screen: 'checkout', category: 'functional', title: 'Address can be submitted without picking a suggestion', hint: 'Type part of an address and continue without choosing from the list.', expected: 'The order needs a valid, selected address (or a clear error).', severity: 'major', priority: 'P2', rationale: 'Couriers get incomplete addresses; failed deliveries.' },
  // Tracking
  { id: 'B15', screen: 'tracking', category: 'mobile', title: 'Order status is stale after returning from the background', hint: 'Leave the app for a while during delivery, then come back.', expected: 'The status refreshes when the app returns to the foreground.', severity: 'minor', priority: 'P2', rationale: 'Customers think nothing is happening and call support.' },
  { id: 'B16', screen: 'tracking', category: 'mobile', title: 'Tapping the push notification opens Home, not the order', hint: 'Close the app completely, then tap a notification.', expected: 'The notification opens the tracking screen of that order.', severity: 'minor', priority: 'P3', rationale: 'Annoying extra steps, nothing breaks.' },
  { id: 'B17', screen: 'tracking', category: 'accessibility', title: 'Order progress is shown by color only', hint: 'Look at the progress steps in grayscale.', expected: 'Each step has text or an icon, and the current step is announced.', severity: 'minor', priority: 'P3', rationale: 'Color-blind and screen reader users can\'t tell where the order is.' },
  // Profile / settings
  { id: 'B18', screen: 'profile', category: 'functional', title: 'Turning off promo notifications does not stop them', hint: 'Change a notification setting, then watch what arrives.', expected: 'No promo pushes after the switch is turned off.', severity: 'major', priority: 'P2', rationale: 'Ignoring a user\'s choice; in the EU this can also be a consent issue.' },
  { id: 'B19', screen: 'profile', category: 'security', title: 'After logout, Back shows the profile with personal data', hint: 'Log out, then use the system Back button.', expected: 'Back after logout returns to the login screen; no personal data is shown.', severity: 'critical', priority: 'P1', rationale: 'Personal data (address, phone) exposed on shared devices.' },
  // Cross-cutting
  { id: 'B20', screen: 'any', category: 'localization', title: 'German checkout button text is cut off', hint: 'Switch the language and walk the main flow.', expected: 'Buttons fit or wrap in every supported language.', severity: 'minor', priority: 'P3', rationale: 'Cosmetic, but on the most important button.' },
  { id: 'B21', screen: 'any', category: 'localization', title: 'Serbian prices use English number formatting', hint: 'Compare how prices look in different languages.', expected: 'Serbian shows 1.299,00 RSD style separators.', severity: 'trivial', priority: 'P4', rationale: 'Looks foreign but is understandable.' },
  { id: 'B22', screen: 'any', category: 'ui', title: 'Text is invisible in dark mode', hint: 'Switch the phone to dark mode and look at every screen.', expected: 'All text has enough contrast in both themes.', severity: 'major', priority: 'P2', rationale: 'Information disappears for every dark-mode user.' },
  { id: 'B23', screen: 'any', category: 'accessibility', title: 'Tab bar labels are clipped with large text', hint: 'Turn on large text in the device settings.', expected: 'Labels scale and stay readable, or the layout adapts.', severity: 'minor', priority: 'P3', rationale: 'Low-vision users struggle to navigate.' },
  { id: 'B24', screen: 'any', category: 'mobile', title: 'Offline: adding to cart spins forever', hint: 'Turn the network off and keep using the app.', expected: 'A clear offline message, and the action is queued or can be retried.', severity: 'minor', priority: 'P2', rationale: 'Common in elevators and tunnels; users think the app froze.' },
];

export const CATEGORY_LABEL: Record<BugCategory, string> = {
  functional: 'Functional',
  ui: 'UI & visual',
  accessibility: 'Accessibility',
  mobile: 'Mobile-specific',
  security: 'Security & privacy',
  localization: 'Localization',
};

export const SCREEN_LABEL: Record<Screen, string> = {
  login: 'Login',
  home: 'Home',
  menu: 'Restaurant menu',
  cart: 'Cart',
  checkout: 'Checkout',
  tracking: 'Order tracking',
  profile: 'Profile & settings',
  any: 'Anywhere',
};

// ---------- Learner state ----------

export type PhaseId = 'brief' | 'plan' | 'cases' | 'explore' | 'report';

export interface BugReport {
  id: string; // R1, R2, ...
  createdAt: string;
  screen: Screen;
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
  priority: Priority;
  /** Catalog bug this report was matched to, or null if it didn't match a known bug. */
  matched: string | null;
}

export interface CapstoneState {
  startedAt?: string;
  phases: Partial<Record<PhaseId, string>>; // phase -> ISO date completed
  /** Bug id -> ISO date the learner triggered/exposed it in the app. */
  observed: Record<string, string>;
  /** Bug id -> screen it was last observed on, to match reports. */
  observedOn: Record<string, Screen>;
  reports: BugReport[];
  /** Free-form artifacts the learner wrote (test plan JSON, test cases, final report). */
  artifacts: Record<string, unknown>;
  learnerName?: string;
}

const KEY = 'bugwise:capstone:v1';
const empty = (): CapstoneState => ({ phases: {}, observed: {}, observedOn: {}, reports: [], artifacts: {} });

export function loadCapstone(): CapstoneState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s && typeof s === 'object') return { ...empty(), ...s };
  } catch {}
  return empty();
}

function save(s: CapstoneState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  window.dispatchEvent(new CustomEvent('capstone-change'));
}

export function updateCapstone(fn: (s: CapstoneState) => void) {
  const s = loadCapstone();
  s.startedAt ??= new Date().toISOString();
  fn(s);
  save(s);
}

/** Called by the app whenever a bug manifests (or a visual bug becomes visible). Idempotent. */
export function observeBug(id: string, screen: Screen) {
  updateCapstone((s) => {
    s.observed[id] ??= new Date().toISOString();
    s.observedOn[id] = screen;
  });
}

/**
 * Files a bug report and matches it to the most recently observed, not-yet-reported bug on the same
 * screen (or a cross-cutting "any" bug observed while on that screen). Returns the matched bug id or null.
 */
/**
 * Word stems that point to a bug in a learner's report (lowercase, accents removed).
 * When several bugs were seen on the same screen, the report goes to the one it describes best;
 * only when the text matches none of them does the most recently seen bug win.
 */
const KEYWORDS: Record<string, string[]> = {
  B01: ['exist', 'no account', 'enumerat', 'incorrect password', 'wrong password', 'reveal', 'security', 'generic'],
  B02: ['capital', 'uppercase', 'upper case', 'case', 'mia@', 'space', 'trim'],
  B03: ['accent', 'diacritic', 'cevapi', 'creme', 'special char', 'search'],
  B04: ['count', 'number of', 'open now', 'label', 'filter', 'restaurants'],
  B05: ['overlap', 'long name', 'sushi', 'rating', 'truncat', 'cut'],
  B06: ['limit', '10', '11', 'quantity', 'max', 'more than'],
  B07: ['screen reader', 'voiceover', 'talkback', 'accessible', 'label', 'announc', 'just "button"', 'only "button"'],
  B08: ['twice', 'again', 'double', 'second', 'coupon', 'welcome10', 'discount'],
  B09: ['free delivery', 'delivery fee', 'delivery', 'free', '20', 'before discount', 'threshold'],
  B10: ['decimal', 'rounding', 'float', '999', '.259', 'total', 'format'],
  B11: ['past', 'already passed', 'time slot', 'slot', '17:00', '17:30', 'earlier'],
  B12: ['double', 'twice', 'two orders', 'duplicate', 'tap', 'place order'],
  B13: ['rotat', 'landscape', 'orientation', 'turn', 'cleared', 'empty', 'lost'],
  B14: ['suggestion', 'autocomplete', 'address', 'kastani', 'invalid', 'incomplete'],
  B15: ['background', 'stale', 'old status', 'not updat', 'refresh', 'return'],
  B16: ['push', 'notification', 'home', 'closed', 'kill', 'deep link'],
  B17: ['color', 'colour', 'grayscale', 'greyscale', 'progress', 'colorblind'],
  B18: ['promo', 'promotion', 'marketing', 'turned off', 'switch', 'still'],
  B19: ['logout', 'log out', 'logged out', 'back', 'personal', 'session'],
  B20: ['german', 'deutsch', 'cut off', 'clipped', 'truncat', 'bestellung'],
  B21: ['serbian', 'srpski', 'rsd', 'separator', 'comma', 'dot', 'number format'],
  B22: ['dark', 'invisible', 'contrast', 'black', 'cannot see', "can't see"],
  B23: ['large text', 'font size', 'tab bar', 'tab label', 'clipped', 'dynamic type'],
  B24: ['offline', 'spinner', 'spin', 'loading', 'no network', 'no internet', 'forever'],
};

const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function fileReport(r: Omit<BugReport, 'id' | 'createdAt' | 'matched'>): string | null {
  let matched: string | null = null;
  const text = normalize([r.title, r.steps, r.expected, r.actual].join(' '));
  updateCapstone((s) => {
    const reported = new Set(s.reports.map((x) => x.matched).filter(Boolean));
    const candidates = Object.entries(s.observed)
      .filter(([id]) => !reported.has(id))
      .filter(([id]) => {
        const bug = BUGS.find((b) => b.id === id);
        return bug && (bug.screen === r.screen || s.observedOn[id] === r.screen);
      })
      .map(([id, at]) => ({ id, at, score: (KEYWORDS[id] ?? []).filter((k) => text.includes(k)).length }))
      .sort((a, b) => b.score - a.score || b.at.localeCompare(a.at));
    matched = candidates[0]?.id ?? null;
    s.reports.push({ ...r, id: `R${s.reports.length + 1}`, createdAt: new Date().toISOString(), matched });
  });
  return matched;
}

export function completePhase(id: PhaseId) {
  updateCapstone((s) => {
    s.phases[id] ??= new Date().toISOString();
  });
}

export function resetCapstone() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('capstone-change'));
}

/** Points for severity/priority agreement: 1 for exact, 0.5 for one step off, 0 otherwise. */
export function ratingScore(given: string, expected: string, scale: readonly string[]) {
  const d = Math.abs(scale.indexOf(given) - scale.indexOf(expected));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}
export const SEVERITIES: readonly Severity[] = ['critical', 'major', 'minor', 'trivial'];
export const PRIORITIES: readonly Priority[] = ['P1', 'P2', 'P3', 'P4'];
