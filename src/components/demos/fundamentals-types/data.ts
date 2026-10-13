/** Shared data for the "Types of Testing" lesson demos. */

export type Kind = 'functional' | 'non-functional' | 'both';
export type Stage = 'build' | 'fix' | 'feature' | 'release';

export interface TestingType {
  id: string;
  name: string;
  aka?: string;
  group: GroupId;
  kind: Kind;
  stages: Stage[];
  /** One-line definition. */
  short: string;
  when: string;
  mobile: string;
  web: string;
  link?: { href: string; label: string };
}

export type GroupId = 'health' | 'change' | 'quality' | 'mobile' | 'approach';

export const groups: { id: GroupId; title: string; question: string; tone: string }[] = [
  { id: 'health', title: 'Build health checks', question: 'Is this build even worth testing?', tone: '#2563eb' },
  { id: 'change', title: 'Change-related testing', question: 'Did the fix work, and did anything else break?', tone: '#7c3aed' },
  { id: 'quality', title: 'Quality attributes', question: 'Is it usable, inclusive, fast, safe and ready for every market?', tone: '#059669' },
  { id: 'mobile', title: 'Life on a real device', question: 'Does it survive installs, updates and real-world interruptions?', tone: '#d97706' },
  { id: 'approach', title: 'Approaches and styles', question: 'How do you design and run the tests?', tone: '#db2777' },
];

export const stageLabels: Record<Stage, string> = {
  build: 'New build arrives',
  fix: 'After a fix or change',
  feature: 'While testing a feature',
  release: 'Before a release',
};

export const kindLabels: Record<Kind, string> = {
  functional: 'Functional',
  'non-functional': 'Non-functional',
  both: 'Functional + non-functional',
};

export const types: TestingType[] = [
  {
    id: 'smoke',
    name: 'Smoke testing',
    aka: 'Build verification test',
    group: 'health',
    kind: 'functional',
    stages: ['build'],
    short: 'A quick, shallow pass over the most important flows to decide if a build is stable enough to test further.',
    when: 'Every time a new build lands, before any deeper testing. Usually 10 to 30 minutes.',
    mobile: 'Install build 4.2.0 (311): app opens, you can log in, search a restaurant, add a dish and reach checkout.',
    web: 'The shop home page loads, search returns results, a product can be added to the cart, login works.',
  },
  {
    id: 'sanity',
    name: 'Sanity testing',
    group: 'health',
    kind: 'functional',
    stages: ['build', 'fix'],
    short: 'A narrow, slightly deeper check of one area after a small change, to decide if it is sensible to go on.',
    when: 'After a small fix or tweak, before committing time to a full regression run. Often unscripted.',
    mobile: 'The tip calculation was changed: you check tips at 0%, 10%, 15% and custom, and that the total updates.',
    web: 'The currency formatter was patched: you check prices on product, cart and checkout pages in EUR and USD.',
  },
  {
    id: 'retesting',
    name: 'Retesting',
    aka: 'Confirmation testing',
    group: 'change',
    kind: 'both',
    stages: ['fix'],
    short: 'Repeating the exact steps of a bug report on the new build to confirm the bug is really fixed.',
    when: 'When a developer marks a bug as fixed. Same steps, same data, same device type as the original report.',
    mobile: 'BUG-482 said the app crashed when rotating the payment screen. You rotate it again on the same Pixel model.',
    web: 'BUG-207 said the coupon applied twice on double-click. You double-click "Apply" again and check the total.',
    link: { href: '/tutorials/writing-bug-reports', label: 'Writing bug reports' },
  },
  {
    id: 'regression',
    name: 'Regression testing',
    group: 'change',
    kind: 'both',
    stages: ['fix', 'release'],
    short: 'Re-running tests on things that used to work, to catch side effects of new changes.',
    when: 'After any change, and always before a release. The bigger the change, the wider the regression run.',
    mobile: 'A new payment library was added. You re-check saved cards, Apple Pay, refunds and order history.',
    web: 'The header was redesigned. You re-check search, the cart badge, login and the language switcher.',
  },
  {
    id: 'usability',
    name: 'Usability testing',
    group: 'quality',
    kind: 'non-functional',
    stages: ['feature', 'release'],
    short: 'Checking how easy, clear and pleasant the product is for real people to use.',
    when: 'Early with prototypes, during feature testing, and with real users before big launches.',
    mobile: 'Five users try to reschedule a fitness class. Three of them cannot find the option hidden behind a long press.',
    web: 'Shoppers hesitate on checkout because "Continue" and "Place order" look identical.',
  },
  {
    id: 'accessibility',
    name: 'Accessibility testing',
    aka: 'a11y',
    group: 'quality',
    kind: 'non-functional',
    stages: ['feature', 'release'],
    short: 'Checking that people with disabilities can use the product, for example with a screen reader or keyboard.',
    when: 'For every new screen, and in a fuller audit before release. Often measured against WCAG.',
    mobile: 'With VoiceOver on, the "Transfer" button is read as "button" with no label.',
    web: 'You cannot reach the "Accept" button in the cookie banner with the Tab key.',
    link: { href: '/web/accessibility-basics', label: 'Accessibility basics' },
  },
  {
    id: 'compatibility',
    name: 'Compatibility testing',
    aka: 'Cross-browser / cross-device',
    group: 'quality',
    kind: 'non-functional',
    stages: ['feature', 'release'],
    short: 'Checking the product works across the browsers, devices, OS versions and screen sizes your users have.',
    when: 'While testing features (on a few key devices) and before release (across the full device or browser matrix).',
    mobile: 'The booking calendar works on iOS 18 but the dates overlap on a small Android phone running Android 12.',
    web: 'The date input works in Chrome but shows a plain text box in an older Safari.',
    link: { href: '/web/cross-browser-testing', label: 'Cross-browser testing' },
  },
  {
    id: 'localization',
    name: 'Localization & internationalization',
    aka: 'L10n / i18n',
    group: 'quality',
    kind: 'both',
    stages: ['feature', 'release'],
    short: 'Checking the product adapts correctly to other languages, regions, currencies, dates and text directions.',
    when: 'When a new language or market is added, and on every screen with text, prices or dates.',
    mobile: 'In German, the "Add to basket" button text is cut off: "In den Warenk…".',
    web: 'Prices show "$1,299.00" for French users instead of "1 299,00 €", and Arabic pages are not mirrored.',
  },
  {
    id: 'performance',
    name: 'Performance testing',
    aka: 'Load and stress are specialist forms',
    group: 'quality',
    kind: 'non-functional',
    stages: ['feature', 'release'],
    short: 'Checking speed and responsiveness. Load testing checks expected traffic, stress testing goes beyond it to find the breaking point.',
    when: 'Manual testers spot slowness every day. Load and stress tests are usually planned by specialists with tools before big events.',
    mobile: 'The menu takes 6 seconds to appear on a 3G connection, and scrolling the order history stutters.',
    web: 'The product page scores poorly on Core Web Vitals; on Black Friday the server must survive 20 times the normal traffic.',
    link: { href: '/web/performance-basics', label: 'Performance basics' },
  },
  {
    id: 'security',
    name: 'Security testing',
    group: 'quality',
    kind: 'non-functional',
    stages: ['feature', 'release'],
    short: 'Checking that data and accounts are protected from people who should not see or change them.',
    when: 'For anything touching logins, payments or personal data. Deep penetration testing is a specialist job.',
    mobile: 'After logging out, pressing Back shows the account balance again.',
    web: 'Changing /orders/1001 to /orders/1002 in the address bar shows another customer\'s order.',
    link: { href: '/web/security-basics', label: 'Security basics' },
  },
  {
    id: 'install',
    name: 'Installation & upgrade testing',
    group: 'mobile',
    kind: 'both',
    stages: ['release'],
    short: 'Checking fresh installs, updates from older versions and uninstalls, without losing user data.',
    when: 'Before every app release, especially when the data storage changes.',
    mobile: 'Updating from 3.9 to 4.0 logs everyone out and deletes their saved delivery addresses.',
    web: 'A new site release keeps serving the old JavaScript from the cache, so the cart breaks until a hard refresh.',
    link: { href: '/mobile/install-update-uninstall', label: 'Install, update and uninstall' },
  },
  {
    id: 'interruption',
    name: 'Interruption testing',
    group: 'mobile',
    kind: 'both',
    stages: ['feature', 'release'],
    short: 'Checking the app copes when something interrupts it: a call, a notification, the screen locking, low battery.',
    when: 'While testing any flow that takes more than a few seconds, especially payments and forms.',
    mobile: 'A phone call arrives during card payment. After the call, the app shows a blank screen and the order is lost.',
    web: 'You switch tabs during a 3-D Secure check and come back to "Session expired" with the money already taken.',
    link: { href: '/mobile/interruptions', label: 'Interruptions' },
  },
  {
    id: 'exploratory',
    name: 'Exploratory testing',
    group: 'approach',
    kind: 'both',
    stages: ['feature', 'release'],
    short: 'Learning, designing and testing at the same time, guided by a goal (a charter) and a time box.',
    when: 'On new features, risky areas, or whenever written test cases run out of ideas.',
    mobile: 'Charter: "Explore the split-bill feature with odd amounts and people leaving the group, for 60 minutes."',
    web: 'Charter: "Explore the returns form with partial refunds and multiple browser tabs, for 45 minutes."',
  },
  {
    id: 'adhoc',
    name: 'Ad-hoc testing',
    group: 'approach',
    kind: 'both',
    stages: ['feature'],
    short: 'Informal, unplanned testing with no documentation, relying on intuition and experience.',
    when: 'Spare moments, quick "let me try something" checks. Unlike exploratory testing, it has no charter or notes.',
    mobile: 'While waiting for a build, you rapidly tap "Order again" five times and get five orders.',
    web: 'You paste an emoji into the postcode field just to see what happens.',
  },
  {
    id: 'posneg',
    name: 'Positive vs negative testing',
    group: 'approach',
    kind: 'functional',
    stages: ['feature'],
    short: 'Positive tests use valid input and expect success. Negative tests use invalid input and expect a clear, safe error.',
    when: 'For every feature with inputs. A good test set has both.',
    mobile: 'Positive: transfer $50 to a saved payee. Negative: transfer -$50, $0, or more than the balance.',
    web: 'Positive: sign up with a valid email. Negative: "anna@", an email already in use, a 300-character name.',
    link: { href: '/tutorials/writing-test-cases', label: 'Writing test cases' },
  },
  {
    id: 'manualauto',
    name: 'Manual vs automated testing',
    group: 'approach',
    kind: 'both',
    stages: ['build', 'fix', 'feature', 'release'],
    short: 'Manual: a person runs the checks. Automated: scripts run them. Most of the types above can be done either way.',
    when: 'All the time. Stable, repetitive checks (like regression suites) are often automated; new features and usability stay manual.',
    mobile: 'A script runs 300 login and checkout checks on 10 devices every night; you explore the new loyalty screen by hand.',
    web: 'An automated smoke suite runs on every deploy; you check that the new banner looks right on a real iPhone.',
    link: { href: '/fundamentals/what-is-software-testing', label: 'What is software testing?' },
  },
];
