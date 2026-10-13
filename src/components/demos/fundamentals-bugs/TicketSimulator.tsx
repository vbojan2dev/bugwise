import { useState } from 'react';
import { ArrowRight, Bug, CheckCircle2, ClipboardCheck, Code2, History, MessageSquare, RotateCcw, Users, XCircle } from 'lucide-react';

/**
 * Bug ticket simulator: follow one bug (SHOP-2087, "Apple Pay sheet shows €0.00") through its life.
 * The learner acts as tester, QA lead and developer. Poor choices give feedback and can be retried;
 * "branch" choices are realistic detours (wrong duplicate closure, retest too narrow) that the story absorbs.
 * The ticket on the right is a Jira-like light surface with fixed colors.
 */

type Role = 'tester' | 'lead' | 'dev';
type Entry = { time: string; who: string; text: string };
type Comment = { time: string; who: string; role: Role; text: string };
type Ticket = {
  created: boolean;
  status: string;
  resolution: string;
  severity: string;
  priority: string;
  assignee: string;
  fixVersion: string;
  links: string[];
  history: Entry[];
  comments: Comment[];
};
type Flags = { escaped: boolean };
type Choice = {
  id: string;
  label: string;
  kind: 'good' | 'bad' | 'branch';
  feedback: string;
  apply?: (t: Ticket, f: Flags) => Ticket;
  next?: string;
  branch?: string;
  setEscaped?: boolean;
};
type Node = { id: string; role: Role; actor: string; time: (f: Flags) => string; situation: string; choices: Choice[] };

const YOU = 'You (QA)';
const SARA = 'Sara (QA lead)';
const MARKO = 'Marko (iOS dev)';

const empty: Ticket = {
  created: false,
  status: '',
  resolution: 'Unresolved',
  severity: '',
  priority: '',
  assignee: 'Unassigned',
  fixVersion: '',
  links: [],
  history: [],
  comments: [],
};

/** Change the status and log it in the history. */
function move(t: Ticket, time: string, who: string, to: string, extra = ''): Ticket {
  return { ...t, status: to, history: [...t.history, { time, who, text: `Status: ${t.status} → ${to}${extra ? ` · ${extra}` : ''}` }] };
}
function log(t: Ticket, time: string, who: string, text: string): Ticket {
  return { ...t, history: [...t.history, { time, who, text }] };
}
function say(t: Ticket, time: string, who: string, role: Role, text: string): Ticket {
  return { ...t, comments: [...t.comments, { time, who, role, text }] };
}

const nodes: Record<string, Node> = {
  start: {
    id: 'start',
    role: 'tester',
    actor: YOU,
    time: () => 'Tue 10:14',
    situation:
      'You are testing ShopFast iOS 5.3.0 (build 812) on staging, on an iPhone 15 with iOS 18.1. Your test account is in the Germany store. Cart: 2 items, €49.90. You apply the code SPRING20 (20% off, campaign starts Friday) and tap Apple Pay. The Apple Pay sheet says "Pay ShopFast €0.00", and confirming fails with "Payment not completed". Paying by card works.',
    choices: [
      {
        id: 'file',
        kind: 'good',
        label: 'Reproduce it twice more, search the tracker for duplicates, then file a bug with exact steps, build, device and a screen recording.',
        feedback:
          'Good start. 3/3 reproducible, recording attached. The search showed one similar-looking ticket (SHOP-1990, Google Pay on Android), but not this bug. You propose severity Major: payment fails, but card payment is a workaround. Priority is left for triage.',
        apply: (t) => ({
          ...t,
          created: true,
          status: 'New',
          severity: 'Major',
          priority: 'Not set',
          history: [{ time: 'Tue 10:14', who: YOU, text: 'Created the issue · Status: New' }],
        }),
        next: 'triage',
      },
      {
        id: 'shout',
        kind: 'bad',
        label: 'File it straight away as "APPLE PAY BROKEN!!!". It is urgent, details can come later.',
        feedback:
          'Urgency belongs in the priority discussion and in facts ("blocks every Apple Pay order with a discount code"), not in capital letters. Without steps, build and device, triage will send it back or a developer will mark it Cannot reproduce.',
      },
      {
        id: 'chat',
        kind: 'bad',
        label: 'Send the iOS developer a quick chat message instead of filing a ticket.',
        feedback:
          'Chat messages get lost. Without a ticket nobody can prioritize the bug, link the fix to a build, or retest it later. A chat message is fine in addition to a ticket, never instead of one.',
      },
    ],
  },
  triage: {
    id: 'triage',
    role: 'lead',
    actor: SARA,
    time: () => 'Tue 14:00',
    situation:
      'Tuesday triage meeting. Sara (QA lead) and the product owner go through new bugs. SHOP-2087 is on the list. A search also shows SHOP-1990 "Google Pay: total shows 0 when paying with gift card" (Android, Open). What does Sara do?',
    choices: [
      {
        id: 'accept',
        kind: 'good',
        label: 'Accept it: keep severity Major, set priority High (the SPRING20 campaign starts Friday) and assign it to Marko, the iOS developer.',
        feedback:
          'Exactly what triage is for: confirm it is a real, new bug, decide how urgent it is, and give it an owner. Priority High comes from the business context (a paid campaign in three days), not from the severity alone.',
        apply: (t) => {
          let n = move(t, 'Tue 14:00', SARA, 'Open', 'triaged');
          n = { ...n, priority: 'High', assignee: 'Marko' };
          n = log(n, 'Tue 14:00', SARA, 'Priority: Not set → High');
          n = move(n, 'Tue 14:01', SARA, 'Assigned', 'Assignee: Marko');
          return say(n, 'Tue 14:02', SARA, 'lead', 'Confirmed in triage. Must be fixed before the SPRING20 campaign goes live on Friday.');
        },
        next: 'dev',
        branch: 'triage-ok',
      },
      {
        id: 'dupe',
        kind: 'branch',
        label: 'Close it as a Duplicate of SHOP-1990. "Total shows 0" sounds like the same bug.',
        feedback:
          'Sara closes it as a duplicate. This happens a lot in real triage when titles look alike. Let\'s see what you do as the tester when you get the notification.',
        apply: (t) => {
          let n = move(t, 'Tue 14:00', SARA, 'Closed', 'Resolution: Duplicate');
          n = { ...n, resolution: 'Duplicate', links: ['duplicates SHOP-1990'] };
          return say(n, 'Tue 14:01', SARA, 'lead', 'Duplicate of SHOP-1990.');
        },
        next: 'dupTester',
        branch: 'duplicate',
      },
      {
        id: 'defer',
        kind: 'bad',
        label: 'Defer it to the backlog. Apple Pay is only 12% of orders.',
        feedback:
          'Deferring is a real option for low-impact bugs. But a paid campaign starts on Friday and every Apple Pay customer who uses the code is stuck at payment. 12% of orders during a campaign is a lot of money, so this needs a fix now.',
      },
    ],
  },
  dupTester: {
    id: 'dupTester',
    role: 'tester',
    actor: YOU,
    time: () => 'Tue 14:20',
    situation:
      'You get a notification: SHOP-2087 was closed as a Duplicate of SHOP-1990. You open SHOP-1990: Android 14, Google Pay, paying with a gift card balance, reported a month ago. What do you do?',
    choices: [
      {
        id: 'explain',
        kind: 'good',
        label: 'Comment with the differences (iOS vs Android, Apple Pay vs Google Pay, discount code vs gift card), suggest linking them as "relates to", and politely ask Sara to reopen.',
        feedback:
          'Sara agrees, reopens the ticket, links the two as related and assigns it to Marko with priority High. Calm, evidence-based pushback is part of the job, and it just saved this bug from being forgotten.',
        apply: (t) => {
          let n = say(
            t,
            'Tue 14:25',
            YOU,
            'tester',
            'I don\'t think this is the same bug: SHOP-1990 is Android + Google Pay + gift card. SHOP-2087 is iOS + Apple Pay + discount code (SPRING20), card payment works. Could we reopen and link them as "relates to"? The root cause might still be shared.',
          );
          n = move(n, 'Tue 15:05', SARA, 'Reopened', 'Resolution cleared');
          n = { ...n, resolution: 'Unresolved', links: ['relates to SHOP-1990'], priority: 'High', assignee: 'Marko' };
          n = log(n, 'Tue 15:05', SARA, 'Link: duplicates → relates to SHOP-1990 · Priority: High');
          return move(n, 'Tue 15:06', SARA, 'Assigned', 'Assignee: Marko');
        },
        next: 'dev',
      },
      {
        id: 'refile',
        kind: 'bad',
        label: 'Create a new ticket with the same content so the bug does not get lost.',
        feedback: 'Now there really is a duplicate, and the history (evidence, comments) is split across two tickets. Discuss on the existing ticket instead.',
      },
      {
        id: 'accept',
        kind: 'bad',
        label: 'Leave it. The triage lead knows best.',
        feedback:
          'If SHOP-1990 gets fixed for Android only, your iOS bug ships to customers. You have the evidence, so speak up, politely and with facts.',
      },
    ],
  },
  dev: {
    id: 'dev',
    role: 'dev',
    actor: MARKO,
    time: () => 'Wed 09:30',
    situation:
      'Marko picks up SHOP-2087. He installs build 812 on the iOS Simulator, signs in with his own test account, applies SPRING20 and opens Apple Pay. The sheet shows €39.92, which is correct. He cannot see the bug. What does he do?',
    choices: [
      {
        id: 'cnr',
        kind: 'good',
        label: 'Resolve it as "Cannot reproduce" with a comment listing exactly what he tried, and assign it back to the tester.',
        feedback:
          'A fair move, as long as the comment says exactly what was tried. That gives the tester something to compare with.',
        apply: (t) => {
          let n = move(t, 'Wed 09:30', MARKO, 'In Progress');
          n = say(n, 'Wed 10:50', MARKO, 'dev', 'Tried build 812 on Simulator (iPhone 15, iOS 18.1), my account marko.t@test, code SPRING20: Apple Pay sheet shows $39.92 and payment succeeds. Can\'t reproduce.');
          n = move(n, 'Wed 10:51', MARKO, 'Resolved', 'Resolution: Cannot reproduce');
          return { ...n, resolution: 'Cannot reproduce', assignee: 'You' };
        },
        next: 'cnrTester',
        branch: 'cnr',
      },
      {
        id: 'ask',
        kind: 'good',
        label: 'Ask the tester for the missing details in a comment, move it to "Needs info" and assign it back, without resolving it.',
        feedback:
          'Also a fair move, and some teams prefer it: the ticket stays unresolved while the details are collected. Which one is used depends on your team\'s workflow.',
        apply: (t) => {
          let n = move(t, 'Wed 09:30', MARKO, 'In Progress');
          n = say(n, 'Wed 10:50', MARKO, 'dev', 'Tried build 812 on Simulator (iPhone 15, iOS 18.1), my account marko.t@test, code SPRING20: sheet shows $39.92 and payment works. What am I missing?');
          n = move(n, 'Wed 10:51', MARKO, 'Needs info', 'Assignee: You');
          return { ...n, assignee: 'You' };
        },
        next: 'cnrTester',
        branch: 'needinfo',
      },
      {
        id: 'guess',
        kind: 'bad',
        label: 'Guess the cause and push a "fix" anyway.',
        feedback:
          'A fix for a bug you cannot see cannot be checked. It might change nothing, or break something else. First find out why the tester sees it and you don\'t.',
      },
    ],
  },
  cnrTester: {
    id: 'cnrTester',
    role: 'tester',
    actor: YOU,
    time: () => 'Wed 11:10',
    situation:
      'Marko could not reproduce it. You compare his comment with your setup and spot it: his total was in dollars ($39.92), so his account is in the US store. Your account is in the Germany store (EUR). You try a US account: no bug. A fresh Germany account: bug, 3/3. What now?',
    choices: [
      {
        id: 'precise',
        kind: 'good',
        label: 'Add the missing precondition (store: Germany, EUR), the test account, and a new recording, and send it back to Marko.',
        feedback:
          'That missing precondition was the whole story. Most "Cannot reproduce" results are a missing detail, not an imaginary bug. You also updated the report itself, so it stays correct for whoever reads it later.',
        apply: (t) => {
          let n = say(
            t,
            'Wed 11:40',
            YOU,
            'tester',
            'Found the difference: only happens in EUR stores. US account: OK. Fresh DE account qa.de.07@test: €0.00, 3/3 (recording attached). Added "Store: Germany (EUR)" to the preconditions.',
          );
          n = log(n, 'Wed 11:40', YOU, 'Description edited: added precondition "Store: Germany (EUR)"');
          n = t.status === 'Resolved' ? move(n, 'Wed 11:41', YOU, 'Reopened', 'Resolution cleared') : n;
          n = move(n, 'Wed 11:42', YOU, 'Assigned', 'Assignee: Marko');
          return { ...n, resolution: 'Unresolved', assignee: 'Marko' };
        },
        next: 'fix',
      },
      {
        id: 'again',
        kind: 'bad',
        label: 'Send it back with the comment "Still happens for me. Please check again."',
        feedback: 'Without new information Marko will follow the same steps and get the same result. Find the difference between your setups and write it down.',
      },
      {
        id: 'close',
        kind: 'bad',
        label: 'Accept "Cannot reproduce" and let it close.',
        feedback: 'You can reproduce it 3/3 on your phone. Closing it means customers will find it instead, on campaign day.',
      },
    ],
  },
  fix: {
    id: 'fix',
    role: 'dev',
    actor: MARKO,
    time: () => 'Wed 16:20',
    situation:
      'With a Germany account Marko sees €0.00 immediately. The cause: when a percentage discount is applied, the Apple Pay total is built with the wrong currency format and ends up as 0. He fixes it, a colleague reviews the code, and the change goes into build 5.3.0 (815). What does he do with the ticket?',
    choices: [
      {
        id: 'rft',
        kind: 'good',
        label: 'Move it to "Ready for test", set Fix version to 5.3.0 (815), explain what changed, and assign it to QA.',
        feedback: 'This is the hand-over. "Fixed" only means the developer believes it is fixed. Now someone else has to check it on a real build.',
        apply: (t) => {
          let n = move(t, 'Wed 13:05', MARKO, 'In Progress');
          n = say(n, 'Wed 16:20', MARKO, 'dev', 'Fixed in build 815. Changed how the Apple Pay total is built when a discount is applied (EUR formatting).');
          n = move(n, 'Wed 16:21', MARKO, 'Ready for test', 'Fix version: 5.3.0 (815) · Assignee: You');
          return { ...n, fixVersion: '5.3.0 (815)', assignee: 'You' };
        },
        next: 'retest',
      },
      {
        id: 'self',
        kind: 'bad',
        label: 'Close the ticket himself. It works on his Simulator now.',
        feedback:
          'Developers checking their own fix is great, but it is not independent verification, and the Simulator is not the build customers get. In most teams only QA moves a bug to Verified or Closed.',
      },
    ],
  },
  retest: {
    id: 'retest',
    role: 'tester',
    actor: YOU,
    time: () => 'Thu 10:00',
    situation:
      'Build 815 is on TestFlight. SHOP-2087 is in "Ready for test" and assigned to you. The campaign starts tomorrow. What do you check?',
    choices: [
      {
        id: 'around',
        kind: 'good',
        label: 'Install build 815 on the iPhone, run the original steps with the Germany account, then test around the fix: a fixed-amount code (WELCOME5, €5 off), no code, card payment, the US store, and the total on the order confirmation.',
        feedback:
          'Nice catch. SPRING20 now works, but WELCOME5 still shows €0.00: the fix only covered percentage codes. Because you tested around the fix, this is found before release instead of by customers.',
        apply: (t) => {
          let n = say(
            t,
            'Thu 10:40',
            YOU,
            'tester',
            'Retest on 5.3.0 (815), iPhone 15, iOS 18.1, DE store. SPRING20 (−20%): sheet €39.92, payment OK. WELCOME5 (−€5 fixed): sheet still €0.00, payment fails (recording attached). No code, card payment, US store: OK.',
          );
          n = move(n, 'Thu 10:41', YOU, 'Reopened', 'Assignee: Marko');
          return { ...n, assignee: 'Marko' };
        },
        next: 'fix2',
        branch: 'caught',
      },
      {
        id: 'narrow',
        kind: 'branch',
        label: 'Run exactly the original steps with SPRING20. They pass, so mark it Verified and close it.',
        feedback: 'The original steps pass, so you verify and close it. Let\'s see how Friday goes…',
        apply: (t) => {
          let n = say(t, 'Thu 10:15', YOU, 'tester', 'Verified on 5.3.0 (815), iPhone 15, iOS 18.1, DE store: SPRING20 shows €39.92, payment OK.');
          n = move(n, 'Thu 10:16', YOU, 'Verified');
          n = move(n, 'Thu 10:16', YOU, 'Closed', 'Resolution: Fixed');
          return { ...n, resolution: 'Fixed' };
        },
        next: 'escaped',
        branch: 'escaped',
        setEscaped: true,
      },
      {
        id: 'sim',
        kind: 'bad',
        label: 'Ask Marko to show it working on his Simulator. That is faster than installing a build.',
        feedback:
          'Verify on the build that will actually ship, on a device like the one where you found the bug. A demo on someone else\'s machine proves very little.',
      },
    ],
  },
  escaped: {
    id: 'escaped',
    role: 'tester',
    actor: YOU,
    time: () => 'Fri 09:15',
    situation:
      'Friday, campaign day. Build 815 is live in the App Store. Customer support writes: "Customers using the WELCOME5 voucher see €0.00 in Apple Pay and can\'t pay." It is the same bug with a fixed-amount code: the fix only covered percentage codes. What do you do?',
    choices: [
      {
        id: 'reopen',
        kind: 'good',
        label: 'Reopen SHOP-2087 (same cause, same symptom), add the new steps, the support ticket link and production evidence, and alert Sara so priority can be raised.',
        feedback:
          'Right call. Some teams open a new bug linked to the old one once the old fix has been released; either way, the link matters. The lesson: retest the exact steps AND the area around the fix. Five minutes with a second code type would have caught this on Thursday.',
        apply: (t) => {
          let n = say(
            t,
            'Fri 09:20',
            YOU,
            'tester',
            'Reproduced in production 5.3.0 (815), DE store: WELCOME5 (−€5 fixed) → Apple Pay sheet €0.00, payment fails. SPRING20 OK. Linked support ticket CS-5521. My retest only covered SPRING20, sorry.',
          );
          n = move(n, 'Fri 09:21', YOU, 'Reopened', 'Resolution cleared');
          n = { ...n, resolution: 'Unresolved', priority: 'Highest', assignee: 'Marko', links: [...n.links, 'relates to CS-5521 (support)'] };
          return log(n, 'Fri 09:25', SARA, 'Priority: High → Highest · Assignee: Marko');
        },
        next: 'fix2',
      },
      {
        id: 'blame',
        kind: 'bad',
        label: 'Post in the team channel that the developer\'s fix was sloppy.',
        feedback:
          'Blame helps nobody and the retest was yours too. Focus on facts: reopen with evidence, help get a hotfix out, and talk about how to retest wider next time.',
      },
    ],
  },
  fix2: {
    id: 'fix2',
    role: 'dev',
    actor: MARKO,
    time: (f) => (f.escaped ? 'Fri 11:30' : 'Thu 15:30'),
    situation:
      'Marko finds that fixed-amount codes go through a different code path. He fixes both paths, adds an automated unit test for each discount type, and the change goes into build 5.3.1 (818).',
    choices: [
      {
        id: 'rft2',
        kind: 'good',
        label: 'Move it to "Ready for test" with Fix version 5.3.1 (818), describe the root cause and which discount types are affected, and assign it to QA.',
        feedback: 'A comment that names the root cause and the affected area tells the tester exactly where to look during the retest.',
        apply: (t, f) => {
          const time = f.escaped ? 'Fri 11:30' : 'Thu 15:30';
          let n = move(t, f.escaped ? 'Fri 09:40' : 'Thu 11:00', MARKO, 'In Progress');
          n = say(n, time, MARKO, 'dev', 'Root cause: percentage and fixed-amount discounts build the Apple Pay total in two places; only one was fixed. Both fixed in 818, unit tests added for both. Please check all discount types.');
          n = move(n, time, MARKO, 'Ready for test', 'Fix version: 5.3.1 (818) · Assignee: You');
          return { ...n, fixVersion: '5.3.1 (818)', assignee: 'You' };
        },
        next: 'retest2',
      },
      {
        id: 'quiet',
        kind: 'bad',
        label: 'Push the change without a comment. QA will figure it out.',
        feedback: 'Without knowing what changed, the tester has to guess where the risk is. Two sentences in the ticket save an hour of testing.',
      },
    ],
  },
  retest2: {
    id: 'retest2',
    role: 'tester',
    actor: YOU,
    time: (f) => (f.escaped ? 'Fri 13:00' : 'Thu 17:00'),
    situation: 'Build 5.3.1 (818) is ready. Last check.',
    choices: [
      {
        id: 'full',
        kind: 'good',
        label: 'Retest SPRING20 and WELCOME5, then the area around it: no code, card payment, US and Germany stores, order confirmation. All pass. Verify with a comment listing build, device and what you checked.',
        feedback: 'Verified. The comment means anyone can see later exactly what was checked, on which build.',
        apply: (t, f) => {
          const time = f.escaped ? 'Fri 13:40' : 'Thu 17:40';
          let n = say(t, time, YOU, 'tester', 'Verified on 5.3.1 (818), iPhone 15 iOS 18.1 + iPhone SE iOS 17.6. SPRING20, WELCOME5, no code, card, US + DE stores, confirmation totals: all OK.');
          n = move(n, time, YOU, 'Verified');
          n = move(n, f.escaped ? 'Fri 16:00' : 'Fri 08:00', SARA, 'Closed', 'Resolution: Fixed · released in 5.3.1');
          return { ...n, resolution: 'Fixed' };
        },
        next: 'done',
      },
      {
        id: 'only5',
        kind: 'bad',
        label: 'Check only WELCOME5, since that was the part that failed.',
        feedback: 'The new change touched both code paths, so SPRING20 could break again. Retest the original steps, the new ones, and the area around them.',
      },
    ],
  },
};

const roleInfo: Record<Role, { label: string; Icon: typeof Bug; cls: string }> = {
  tester: { label: 'Tester', Icon: ClipboardCheck, cls: 'bg-brand-soft text-brand' },
  lead: { label: 'QA lead / triage', Icon: Users, cls: 'bg-warn-soft text-warn' },
  dev: { label: 'Developer', Icon: Code2, cls: 'bg-info-soft text-info' },
};

const statusStyle = (s: string) => {
  if (s === 'Closed' || s === 'Verified') return { background: '#dcfff1', color: '#216e4e' };
  if (s === 'Reopened') return { background: '#fff3d6', color: '#7f5f01' };
  if (s === 'In Progress' || s === 'Ready for test' || s === 'Needs info' || s === 'Resolved') return { background: '#e9f2ff', color: '#0055cc' };
  return { background: '#ebecf0', color: '#44546f' };
};

const branchLabels: [string, string][] = [
  ['duplicate', 'Wrongly closed as a duplicate'],
  ['cnr', 'Resolved as Cannot reproduce'],
  ['needinfo', 'Sent back as Needs info'],
  ['caught', 'Caught the incomplete fix in retest'],
  ['escaped', 'Incomplete fix escaped to production'],
];

type State = { node: string; ticket: Ticket; flags: Flags; feedback: { kind: Choice['kind']; text: string } | null; tried: string[]; next: string | null; picked: string | null };
const initial: State = { node: 'start', ticket: empty, flags: { escaped: false }, feedback: null, tried: [], next: null, picked: null };

function StatusPill({ s }: { s: string }) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase" style={statusStyle(s)}>
      {s}
    </span>
  );
}

function TicketView({ t }: { t: Ticket }) {
  const [tab, setTab] = useState<'history' | 'comments'>('history');
  if (!t.created) {
    return (
      <div className="grid h-full min-h-60 place-items-center p-6 text-center text-sm" style={{ color: '#626f86' }}>
        <div>
          <Bug size={28} className="mx-auto mb-2" style={{ color: '#c9372c' }} aria-hidden="true" />
          No ticket yet. Your first decision creates it.
        </div>
      </div>
    );
  }
  const fields: [string, string][] = [
    ['Severity', t.severity],
    ['Priority', t.priority],
    ['Assignee', t.assignee],
    ['Reporter', 'You (QA)'],
    ['Resolution', t.resolution],
    ['Fix version', t.fixVersion || 'None'],
  ];
  const items = tab === 'history' ? [...t.history].reverse() : [...t.comments].reverse();
  return (
    <div className="p-4 text-[13px]" style={{ color: '#172b4d' }}>
      <p className="flex items-center gap-1.5 text-xs" style={{ color: '#626f86' }}>
        <span className="grid size-4 place-items-center rounded-sm" style={{ background: '#e2483d' }} aria-hidden="true">
          <span className="size-1.5 rounded-full bg-white" />
        </span>
        SHOP / SHOP-2087
      </p>
      <p className="mt-1 text-[15px] leading-snug font-semibold">Checkout: Apple Pay sheet shows €0.00 when a discount code is applied (iOS)</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs" style={{ color: '#626f86' }}>Status</span>
        <span aria-live="polite">
          <StatusPill s={t.status} />
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border p-3" style={{ borderColor: '#dcdfe4' }}>
        {fields.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] font-semibold" style={{ color: '#626f86' }}>
              {k}
            </dt>
            <dd className="truncate" style={k === 'Resolution' && v !== 'Unresolved' ? { color: '#216e4e', fontWeight: 600 } : undefined}>
              {v}
            </dd>
          </div>
        ))}
        <div className="col-span-2 min-w-0">
          <dt className="text-[11px] font-semibold" style={{ color: '#626f86' }}>
            Environment
          </dt>
          <dd>ShopFast iOS 5.3.0 (812), iPhone 15, iOS 18.1, Staging</dd>
        </div>
        {t.links.length ? (
          <div className="col-span-2 min-w-0">
            <dt className="text-[11px] font-semibold" style={{ color: '#626f86' }}>
              Links
            </dt>
            <dd>{t.links.join(' · ')}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 flex gap-1 border-b" style={{ borderColor: '#dcdfe4' }} role="tablist" aria-label="Activity">
        {(
          [
            ['history', 'History', History, t.history.length],
            ['comments', 'Comments', MessageSquare, t.comments.length],
          ] as const
        ).map(([id, label, Icon, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="-mb-px flex items-center gap-1 border-b-2 px-2 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#0c66e4] focus-visible:outline-none"
            style={{ borderColor: tab === id ? '#0c66e4' : 'transparent', color: tab === id ? '#0c66e4' : '#44546f' }}
          >
            <Icon size={13} aria-hidden="true" /> {label} ({count})
          </button>
        ))}
      </div>
      <ol className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1" role="tabpanel" aria-label={tab === 'history' ? 'History' : 'Comments'}>
        {items.length === 0 ? <li style={{ color: '#626f86' }}>Nothing yet.</li> : null}
        {items.map((e, i) => (
          <li key={`${tab}-${items.length - i}`} className="rounded-md p-2" style={{ background: i === 0 ? '#f1f7ff' : '#f7f8f9' }}>
            <p className="text-[11px]" style={{ color: '#626f86' }}>
              <strong style={{ color: '#172b4d' }}>{e.who}</strong> · {e.time}
            </p>
            <p className="mt-0.5 leading-snug">{e.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function TicketSimulator() {
  const [s, setS] = useState<State>(initial);
  const [explored, setExplored] = useState<string[]>([]);
  const node = nodes[s.node];

  const choose = (c: Choice) => {
    if (c.kind === 'bad') {
      setS((p) => (p.next || p.tried.includes(c.id) ? p : { ...p, feedback: { kind: 'bad', text: c.feedback }, tried: [...p.tried, c.id] }));
      return;
    }
    setS((p) => {
      if (p.next) return p;
      const flags = c.setEscaped ? { ...p.flags, escaped: true } : p.flags;
      return { ...p, flags, ticket: c.apply ? c.apply(p.ticket, flags) : p.ticket, feedback: { kind: c.kind, text: c.feedback }, next: c.next ?? 'done', picked: c.id };
    });
    if (c.branch) setExplored((e) => (e.includes(c.branch!) ? e : [...e, c.branch!]));
  };

  const advance = () => setS((p) => (p.next ? { ...p, node: p.next, feedback: null, tried: [], next: null, picked: null } : p));
  const restart = () => setS(initial);

  const statuses = s.ticket.history
    .filter((h) => h.text.startsWith('Status:'))
    .map((h) => /→ ([^·]+)/.exec(h.text)?.[1]?.trim())
    .filter((x): x is string => Boolean(x));
  const path = s.ticket.created ? ['New', ...statuses] : [];
  const reopens = path.filter((p) => p === 'Reopened').length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Bug ticket simulator</p>
          <p className="text-sm text-muted">Follow SHOP-2087 from discovery to Closed. You play every role. Watch the status, history and comments change.</p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RotateCcw size={14} aria-hidden="true" /> Restart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-line p-5 lg:border-r lg:border-b-0">
          {s.node === 'done' ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 font-semibold text-fg">
                <CheckCircle2 size={18} className="text-ok" aria-hidden="true" /> SHOP-2087 is Closed (Fixed)
              </p>
              <p className="text-sm text-fg">
                Statuses it went through: <strong>{path.join(' → ')}</strong>
              </p>
              <p className="text-sm text-fg">
                Reopened {reopens} {reopens === 1 ? 'time' : 'times'}.{' '}
                {s.flags.escaped
                  ? 'One fix reached customers before the bug was really gone. In a real team that means a hotfix release and some unhappy customers.'
                  : 'The incomplete first fix was caught before release. That is what a good retest is for.'}
              </p>
              <div className="rounded-2xl border border-line bg-subtle p-4">
                <p className="text-xs font-semibold tracking-wide text-faint uppercase">Paths you have explored</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {branchLabels.map(([id, label]) => (
                    <li key={id} className={`flex items-center gap-2 ${explored.includes(id) ? 'text-fg' : 'text-muted'}`}>
                      {explored.includes(id) ? (
                        <CheckCircle2 size={15} className="shrink-0 text-ok" aria-label="Explored" />
                      ) : (
                        <span className="size-[15px] shrink-0 rounded-full border border-line-strong" aria-label="Not explored yet" />
                      )}
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">Restart and choose differently (for example in triage or at the first retest) to see the other paths.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${roleInfo[node.role].cls}`}>
                  {(() => {
                    const I = roleInfo[node.role].Icon;
                    return <I size={13} aria-hidden="true" />;
                  })()}
                  {roleInfo[node.role].label}
                </span>
                <span className="text-muted">
                  {node.actor} · {node.time(s.flags)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-fg">{node.situation}</p>
              <ul className="space-y-2">
                {node.choices.map((c) => {
                  const tried = s.tried.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        disabled={Boolean(s.next) || tried}
                        onClick={() => choose(c)}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                          tried
                            ? 'border-danger/40 bg-danger-soft text-muted line-through'
                            : s.picked === c.id
                              ? 'border-ok/50 bg-ok-soft font-medium text-fg'
                              : 'border-line bg-surface text-fg enabled:hover:border-brand enabled:hover:bg-brand-soft disabled:opacity-60'
                        }`}
                      >
                        {c.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div aria-live="polite">
                {s.feedback ? (
                  <div
                    className={`rounded-2xl border p-3 text-sm text-fg ${
                      s.feedback.kind === 'bad' ? 'border-danger/40 bg-danger-soft' : s.feedback.kind === 'branch' ? 'border-warn/40 bg-warn-soft' : 'border-ok/40 bg-ok-soft'
                    }`}
                  >
                    <p className="flex items-start gap-2">
                      {s.feedback.kind === 'bad' ? (
                        <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${s.feedback.kind === 'branch' ? 'text-warn' : 'text-ok'}`} aria-hidden="true" />
                      )}
                      <span>
                        {s.feedback.kind === 'bad' ? <strong>Not the best move. </strong> : null}
                        {s.feedback.text}
                        {s.feedback.kind === 'bad' ? ' Try another option.' : null}
                      </span>
                    </p>
                    {s.next ? (
                      <button
                        type="button"
                        onClick={advance}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Continue <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {path.length ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Status path so far</p>
              <ol className="flex flex-wrap items-center gap-1 text-xs">
                {path.map((p, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <StatusPill s={p} />
                    {i < path.length - 1 ? <ArrowRight size={12} className="text-faint" aria-hidden="true" /> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 bg-[#f7f8f9] p-3 sm:p-4" style={{ colorScheme: 'light' }}>
          <div className="h-full overflow-hidden rounded-xl border bg-white shadow-sm" style={{ borderColor: '#dcdfe4' }}>
            <TicketView t={s.ticket} />
          </div>
        </div>
      </div>
    </div>
  );
}
