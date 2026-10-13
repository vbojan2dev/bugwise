export const site = {
  name: 'Bugwise',
  tagline: 'Learn manual QA for mobile apps and websites',
  description:
    'Free, hands-on tutorials for aspiring manual testers: testing fundamentals, interactive UI components, mobile and web testing, test cases and interview prep.',
};

/**
 * Newsletter signup (Kit, kit.com). Paste the number of the Kit form here (Publish → HTML: `.../forms/<id>/subscriptions`).
 * While it's empty, every signup form on the site is hidden.
 */
export const newsletter = {
  kitFormId: '10055501',
};

export type SectionId =
  | 'fundamentals'
  | 'components'
  | 'features'
  | 'mobile'
  | 'web'
  | 'tutorials'
  | 'career'
  | 'glossary'
  | 'interview';

export interface Section {
  id: SectionId;
  title: string;
  short: string;
  description: string;
  icon: string;
  /** Tailwind-free accent; used through CSS variable --accent. */
  accent: string;
  /** Topics not written yet; shown as "coming soon" on the section page. */
  planned?: string[];
}

export const sections: Section[] = [
  {
    id: 'fundamentals',
    title: 'Testing Fundamentals',
    short: 'Fundamentals',
    description: 'What testing is, how it fits into software development, and the core vocabulary every tester uses.',
    icon: 'graduation-cap',
    accent: '#3b82f6',
    planned: [
      'SDLC and STLC',
      'Levels of testing',
      'Types of testing',
      'Black, white and grey box',
      'Equivalence partitioning',
      'Boundary value analysis',
      'Decision tables',
      'State transition testing',
      'Bug life cycle',
      'Severity vs priority',
      'Verification vs validation',
    ],
  },
  {
    id: 'components',
    title: 'UI Components',
    short: 'Components',
    description: 'Interactive guides to the building blocks of every app: designs, when to use them, common bugs and how to test them.',
    icon: 'component',
    accent: '#8b5cf6',
  },
  {
    id: 'features',
    title: 'Features & Flows',
    short: 'Features',
    description: 'Real product features like login, checkout and push notifications, with test scenarios and edge cases.',
    icon: 'workflow',
    accent: '#f59e0b',
    planned: [
      'Login and sign up',
      'Password reset',
      'Two-factor authentication (OTP)',
      'Biometric login',
      'Search, filters and sorting',
      'Shopping cart and checkout',
      'Push notifications',
      'Deep links',
      'App permissions',
      'Onboarding',
      'Dark mode',
      'Localization and RTL',
      'Offline mode',
      'In-app purchases and subscriptions',
      'Image upload',
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile Testing',
    short: 'Mobile',
    description: 'Everything specific to phones and tablets: gestures, interruptions, networks, devices and tools.',
    icon: 'smartphone',
    accent: '#10b981',
    planned: [
      'iOS vs Android differences',
      'Device fragmentation',
      'Gestures',
      'Orientation and screen sizes',
      'Interruptions (calls, SMS, alarms)',
      'Network conditions',
      'Background and foreground',
      'Install, update and uninstall',
      'Simulators and emulators',
      'TestFlight and Firebase App Distribution',
      'Proxy tools: Charles and Proxyman',
      'adb basics',
    ],
  },
  {
    id: 'web',
    title: 'Web Testing',
    short: 'Web',
    description: 'Browsers, responsive layouts, DevTools, cookies, accessibility and the basics of API testing.',
    icon: 'globe',
    accent: '#06b6d4',
    planned: [
      'Cross-browser testing',
      'Responsive design testing',
      'DevTools for testers',
      'Cookies, sessions and storage',
      'Accessibility basics (WCAG)',
      'Performance basics',
      'Security basics for testers',
      'API testing with Postman',
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutorials',
    short: 'Tutorials',
    description: 'Step-by-step lessons on the daily work of a tester, each with a quick and a detailed version.',
    icon: 'notebook-pen',
    accent: '#ec4899',
    planned: [
      'How to write a bug report',
      'Test scenarios vs test cases vs checklists',
      'Writing a test plan',
      'User stories and acceptance criteria',
      'Exploratory testing',
      'Regression and smoke suites',
      'Working with Jira',
      'Testing without documentation',
    ],
  },
  {
    id: 'career',
    title: 'QA Career',
    short: 'Career',
    description: 'Get your first QA job: how hiring works, take-home assignments, a CV and portfolio without experience, and where ISTQB fits.',
    icon: 'briefcase',
    accent: '#14b8a6',
    planned: [],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    short: 'Glossary',
    description: 'Every testing term explained in plain English, with real examples.',
    icon: 'book-a',
    accent: '#64748b',
  },
  {
    id: 'interview',
    title: 'Interview Prep',
    short: 'Interview',
    description: 'Common QA interview questions with model answers, what interviewers look for, and flashcards.',
    icon: 'messages-square',
    accent: '#f97316',
  },
];

export const lessonSections = ['fundamentals', 'tutorials', 'features', 'mobile', 'web', 'career'] as const;
export type LessonSection = (typeof lessonSections)[number];

export const getSection = (id: string) => sections.find((s) => s.id === id)!;

export const componentCategories = {
  input: { title: 'Inputs & selection', icon: 'text-cursor-input' },
  navigation: { title: 'Navigation', icon: 'navigation' },
  feedback: { title: 'Feedback & overlays', icon: 'message-square-warning' },
  content: { title: 'Content & layout', icon: 'layout-grid' },
} as const;

/** Components that don't have a page yet, shown greyed out in the gallery. */
export const plannedComponents: { title: string; category: keyof typeof componentCategories }[] = [
  { title: 'Button', category: 'input' },
  { title: 'Text field', category: 'input' },
  { title: 'Password field', category: 'input' },
  { title: 'Dropdown / Select', category: 'input' },
  { title: 'Autocomplete', category: 'input' },
  { title: 'Checkbox', category: 'input' },
  { title: 'Radio button', category: 'input' },
  { title: 'Toggle switch', category: 'input' },
  { title: 'Slider', category: 'input' },
  { title: 'Stepper (+/−)', category: 'input' },
  { title: 'Date & time picker', category: 'input' },
  { title: 'File upload', category: 'input' },
  { title: 'Search bar', category: 'input' },
  { title: 'Chips / Tags', category: 'input' },
  { title: 'Tabs', category: 'navigation' },
  { title: 'Navigation bar', category: 'navigation' },
  { title: 'Drawer / Hamburger menu', category: 'navigation' },
  { title: 'Breadcrumbs', category: 'navigation' },
  { title: 'Pagination', category: 'navigation' },
  { title: 'Wizard / Stepper', category: 'navigation' },
  { title: 'Toast / Snackbar', category: 'feedback' },
  { title: 'Modal', category: 'feedback' },
  { title: 'Bottom sheet', category: 'feedback' },
  { title: 'Tooltip', category: 'feedback' },
  { title: 'Badge', category: 'feedback' },
  { title: 'Progress & spinners', category: 'feedback' },
  { title: 'Empty & error states', category: 'feedback' },
  { title: 'Card', category: 'content' },
  { title: 'List with swipe actions', category: 'content' },
  { title: 'Accordion', category: 'content' },
  { title: 'Carousel', category: 'content' },
  { title: 'Infinite scroll', category: 'content' },
  { title: 'Pull to refresh', category: 'content' },
  { title: 'Image gallery', category: 'content' },
];
