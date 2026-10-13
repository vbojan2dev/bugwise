import type { PhaseId } from '@/lib/capstone';

export interface PhaseMeta {
  id: PhaseId;
  n: number;
  title: string;
  short: string;
  path: string;
  minutes: string;
  summary: string;
}

/** The five phases of the capstone, in order. Paths are root-relative (wrap with href()). */
export const PHASES: PhaseMeta[] = [
  { id: 'brief', n: 1, title: 'Read the brief', short: 'Brief', path: '/capstone/brief', minutes: '10–15 min', summary: 'Product overview, release notes, user stories with acceptance criteria, test account and known issues.' },
  { id: 'plan', n: 2, title: 'Write a test plan', short: 'Plan', path: '/capstone/plan', minutes: '20 min', summary: 'A one-page plan: scope, risks, devices, test data, entry and exit criteria. Then compare with a model plan.' },
  { id: 'cases', n: 3, title: 'Write test cases', short: 'Cases', path: '/capstone/cases', minutes: '25 min', summary: 'Five test cases for the cart and checkout, checked against a rubric and eight model cases.' },
  { id: 'explore', n: 4, title: 'Test the app', short: 'Explore', path: '/capstone/test', minutes: '45–60 min', summary: 'An exploratory session in the FoodDash 2.0 build. Report every bug you find, right inside the app.' },
  { id: 'report', n: 5, title: 'Report and recommend', short: 'Report', path: '/capstone/report', minutes: '15 min', summary: 'A test summary report with a go / no-go recommendation for Friday\'s release.' },
];

export const RESULTS_PATH = '/capstone/results';

/** Ordered pages for prev/next navigation. */
export const CAPSTONE_PAGES = [
  { title: 'Capstone overview', path: '/capstone' },
  ...PHASES.map((p) => ({ title: `${p.n}. ${p.title}`, path: p.path })),
  { title: 'Results and certificate', path: RESULTS_PATH },
];
