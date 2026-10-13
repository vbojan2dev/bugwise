/**
 * Traceability data for the FoodDash 2.0 release, matching the run in TestRunSimulator (iPhone, build 412):
 * 11 cases executed: 7 passed, 3 failed, 1 blocked.
 */
import type { Status } from './data';

export type Verdict = 'pass' | 'fail' | 'unverified' | 'none';

export const VERDICTS: { id: Verdict; label: string }[] = [
  { id: 'pass', label: 'Covered, passing' },
  { id: 'fail', label: 'Failing' },
  { id: 'unverified', label: 'Not verified' },
  { id: 'none', label: 'No tests' },
];

export type Req = { id: string; title: string; tests: string[]; answer: Verdict; why: string };

export const REQS: Req[] = [
  { id: 'FD-101', title: 'Sign in with email and password', tests: ['C101', 'C102'], answer: 'fail', why: 'One of its two tests failed (FD-241). A requirement is only as healthy as its worst linked test.' },
  { id: 'FD-102', title: 'Sign in with Face ID (iOS)', tests: ['C103'], answer: 'pass', why: 'Its only test passed on the iPhone run.' },
  { id: 'FD-103', title: 'Add and remove dishes in the cart', tests: ['C201', 'C203'], answer: 'pass', why: 'Both tests passed, including the retest that confirmed the fix for FD-118.' },
  { id: 'FD-104', title: 'Coupon rules: valid and expired codes', tests: ['C202'], answer: 'fail', why: 'Its only test failed (FD-242). This requirement is not met at all yet.' },
  { id: 'FD-105', title: 'Tip the courier at checkout', tests: [], answer: 'none', why: 'No test case traces to it. That is a coverage gap: forward traceability makes it obvious.' },
  { id: 'FD-106', title: 'Pay with a saved card', tests: ['C301'], answer: 'unverified', why: 'It has a test, but the test was blocked by the sandbox outage. Covered on paper, not verified. Do not count it as tested.' },
  { id: 'FD-107', title: 'Choose a delivery time slot', tests: ['C302'], answer: 'fail', why: 'Its only test failed (FD-243): slots after closing time are offered.' },
  { id: 'FD-108', title: 'Track the order status', tests: ['C401', 'C402'], answer: 'pass', why: 'Both linked tests passed. The unrelated logo bug found on the way (FD-244) does not change that.' },
  { id: 'FD-109', title: 'Reorder a past order', tests: [], answer: 'none', why: 'No tests at all. Either write cases or say clearly in the report that it was not tested.' },
  { id: 'FD-110', title: 'Edit profile details', tests: ['C501'], answer: 'pass', why: 'Its test passed.' },
];

export type TestRow = { id: string; title: string; status: Status; bugs: string[]; req: string | null };

export const TESTS: TestRow[] = [
  { id: 'C101', title: 'Sign in with a valid email and password', status: 'passed', bugs: [], req: 'FD-101' },
  { id: 'C102', title: "'Remember me' keeps you signed in", status: 'failed', bugs: ['FD-241'], req: 'FD-101' },
  { id: 'C103', title: 'Sign in with Face ID', status: 'passed', bugs: [], req: 'FD-102' },
  { id: 'C201', title: 'Add a dish; badge and list update', status: 'passed', bugs: [], req: 'FD-103' },
  { id: 'C203', title: 'Remove one dish from the cart', status: 'passed', bugs: ['FD-118'], req: 'FD-103' },
  { id: 'C202', title: 'Expired code SPRING5 is rejected', status: 'failed', bugs: ['FD-242'], req: 'FD-104' },
  { id: 'C301', title: 'Place an order with a saved card', status: 'blocked', bugs: [], req: 'FD-106' },
  { id: 'C302', title: 'Slots respect closing time', status: 'failed', bugs: ['FD-243'], req: 'FD-107' },
  { id: 'C401', title: "New order shows 'Preparing'", status: 'passed', bugs: [], req: 'FD-108' },
  { id: 'C402', title: 'Order history, newest first', status: 'passed', bugs: [], req: 'FD-108' },
  { id: 'C501', title: 'Change the phone number', status: 'passed', bugs: [], req: 'FD-110' },
  { id: 'C601', title: 'Gift card balance on Profile', status: 'untested', bugs: [], req: null },
];

export type BugRow = { key: string; title: string; severity: 'Critical' | 'Major' | 'Minor'; state: 'Open' | 'Closed'; test: string | null };

export const BUGS: BugRow[] = [
  { key: 'FD-241', title: "'Remember me' is ignored after restarting the app", severity: 'Major', state: 'Open', test: 'C102' },
  { key: 'FD-242', title: 'Expired coupon SPRING5 is still accepted', severity: 'Major', state: 'Open', test: 'C202' },
  { key: 'FD-243', title: 'Delivery slots offered after closing time', severity: 'Major', state: 'Open', test: 'C302' },
  { key: 'FD-244', title: 'Restaurant logo stretched in the Orders list', severity: 'Minor', state: 'Open', test: null },
  { key: 'FD-118', title: "'Remove' deleted the wrong dish", severity: 'Minor', state: 'Closed', test: 'C203' },
];

export type ImpactItem = { id: string; label: string; affected: boolean; why: string };

export const IMPACT_CHANGE = 'Product changes FD-104: from 2.1, a coupon needs a minimum order of €15.';

export const IMPACT: ImpactItem[] = [
  { id: 'C202', label: 'C202 Expired code SPRING5 is rejected', affected: true, why: 'Directly linked to FD-104. Its cart is €12, so after the change the code would be refused for the minimum order too, and the case no longer isolates expiry. Raise the cart above €15 and add a case for the new rule.' },
  { id: 'FD-242', label: 'FD-242 Expired coupon SPRING5 is still accepted', affected: true, why: 'Linked through C202. Still a bug, but its steps use a €12 cart. Update them so developers reproduce the expiry problem, not the new minimum.' },
  { id: 'FD-109', label: 'FD-109 Reorder a past order', affected: true, why: 'Not linked to FD-104, but reorder copies an old cart with its coupon, and old orders under €15 would now be refused. A matrix shows direct links; impact analysis still needs your thinking.' },
  { id: 'C201', label: 'C201 Add a dish; badge and list update', affected: false, why: 'Adding a dish has nothing to do with coupons.' },
  { id: 'C102', label: "C102 'Remember me' keeps you signed in", affected: false, why: 'Staying signed in has nothing to do with coupons.' },
];

export type Claim = { text: string; fair: boolean; why: string };

export const CLAIMS: Claim[] = [
  {
    text: '7 of 11 test cases passed (64%), so the release is about two-thirds ready.',
    fair: false,
    why: 'A pass rate is not readiness. One failing payment case can matter more than all the passes together. Say which requirements fail and what that means for users.',
  },
  {
    text: 'All requirements in scope were tested.',
    fair: false,
    why: 'FD-105 and FD-109 have no tests, and FD-106 was blocked. Better: "8 of 10 requirements have tests and 7 of those were run. Courier tips and reorder have no tests; card payment was blocked."',
  },
  {
    text: 'Paying with a saved card (FD-106) is not verified because the payment sandbox was down. It is the biggest open risk.',
    fair: true,
    why: 'Honest about what was not tested, why, and how much it matters. That is exactly what a reader needs.',
  },
  {
    text: 'No critical bugs were found, so the release is safe.',
    fair: false,
    why: 'Nothing critical was found in what was tested, but payment was not tested and three Major bugs are open. And "safe to release" is a decision for the product owner, based on your facts.',
  },
  {
    text: "Three Major bugs are open. FD-241 signs users out every time they restart the app, even with 'Remember me' on.",
    fair: true,
    why: 'Counts by severity plus the user impact of the worst one. Specific and checkable.',
  },
];
