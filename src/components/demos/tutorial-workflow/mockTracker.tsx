import type { ReactNode } from 'react';
import { Bookmark, Bug, CheckSquare, ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown, Layers, ListTree } from 'lucide-react';

/**
 * Shared bits for the simplified Jira-like mock used in the "Working with Jira" tutorial.
 * Deliberately generic: no Atlassian logos or product styling, and clearly labeled as a mock.
 */

export type IssueType = 'Epic' | 'Story' | 'Task' | 'Sub-task' | 'Bug';
export type Status = 'To Do' | 'In Progress' | 'In Review' | 'In Testing' | 'Done';
export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

export const STATUSES: Status[] = ['To Do', 'In Progress', 'In Review', 'In Testing', 'Done'];
export const PRIORITIES: Priority[] = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

export const people = {
  mia: { name: 'Mia Novak', initials: 'MN', color: '#7c3aed' },
  luka: { name: 'Luka Petrov', initials: 'LP', color: '#0891b2' },
  sara: { name: 'Sara Kim', initials: 'SK', color: '#db2777' },
} as const;
export type PersonId = keyof typeof people;
/** The signed-in user in the mock, i.e. what currentUser() returns. */
export const CURRENT_USER: PersonId = 'mia';

export type Issue = {
  key: string;
  project: 'SHOP' | 'COUR';
  type: IssueType;
  summary: string;
  status: Status;
  priority: Priority;
  assignee: PersonId | null;
  /** Days before "today" in the mock. */
  createdDaysAgo: number;
  fixVersion: string | null;
  labels: string[];
};

export const issues: Issue[] = [
  { key: 'SHOP-120', project: 'SHOP', type: 'Epic', summary: 'Courier tipping', status: 'In Progress', priority: 'Medium', assignee: null, createdDaysAgo: 40, fixVersion: '3.8.0', labels: ['checkout'] },
  { key: 'SHOP-142', project: 'SHOP', type: 'Story', summary: 'Add a tip for the courier at checkout', status: 'In Testing', priority: 'High', assignee: 'mia', createdDaysAgo: 12, fixVersion: '3.8.0', labels: ['checkout'] },
  { key: 'SHOP-143', project: 'SHOP', type: 'Sub-task', summary: 'Tip selector UI', status: 'Done', priority: 'Medium', assignee: 'sara', createdDaysAgo: 12, fixVersion: '3.8.0', labels: ['checkout'] },
  { key: 'SHOP-144', project: 'SHOP', type: 'Task', summary: 'Send tip amount to the order API', status: 'Done', priority: 'Medium', assignee: 'luka', createdDaysAgo: 11, fixVersion: '3.8.0', labels: ['checkout', 'backend'] },
  { key: 'SHOP-150', project: 'SHOP', type: 'Bug', summary: 'Checkout: order total ignores custom tip on Android', status: 'To Do', priority: 'Highest', assignee: 'luka', createdDaysAgo: 2, fixVersion: '3.8.0', labels: ['checkout', 'android'] },
  { key: 'SHOP-151', project: 'SHOP', type: 'Bug', summary: 'Search: results flicker while typing fast', status: 'In Progress', priority: 'Medium', assignee: 'sara', createdDaysAgo: 5, fixVersion: '3.8.0', labels: ['search'] },
  { key: 'SHOP-152', project: 'SHOP', type: 'Bug', summary: 'Tracking: map pin one street off on first load', status: 'To Do', priority: 'Low', assignee: null, createdDaysAgo: 9, fixVersion: null, labels: ['tracking'] },
  { key: 'SHOP-153', project: 'SHOP', type: 'Bug', summary: 'Checkout: Pay button text cut off in German', status: 'In Review', priority: 'High', assignee: 'sara', createdDaysAgo: 4, fixVersion: '3.8.0', labels: ['checkout', 'l10n'] },
  { key: 'SHOP-154', project: 'SHOP', type: 'Bug', summary: 'Push: "Courier picked up" arrives twice on iOS', status: 'In Testing', priority: 'Medium', assignee: 'mia', createdDaysAgo: 3, fixVersion: '3.8.0', labels: ['tracking', 'ios'] },
  { key: 'SHOP-155', project: 'SHOP', type: 'Bug', summary: 'Profile: avatar upload fails above 5 MB', status: 'Done', priority: 'Medium', assignee: 'luka', createdDaysAgo: 20, fixVersion: '3.7.0', labels: ['profile'] },
  { key: 'SHOP-156', project: 'SHOP', type: 'Bug', summary: 'Promo: expired code still accepted on web', status: 'To Do', priority: 'High', assignee: 'mia', createdDaysAgo: 1, fixVersion: null, labels: ['checkout', 'web', 'regression'] },
  { key: 'SHOP-157', project: 'SHOP', type: 'Story', summary: 'Save favorite restaurants', status: 'To Do', priority: 'Medium', assignee: null, createdDaysAgo: 6, fixVersion: '3.9.0', labels: ['search'] },
  { key: 'SHOP-158', project: 'SHOP', type: 'Task', summary: 'Update the regression suite for tipping', status: 'In Progress', priority: 'Medium', assignee: 'mia', createdDaysAgo: 4, fixVersion: '3.8.0', labels: ['regression'] },
  { key: 'SHOP-159', project: 'SHOP', type: 'Bug', summary: 'Cart: badge shows 0 after app restart', status: 'Done', priority: 'High', assignee: 'mia', createdDaysAgo: 15, fixVersion: '3.7.0', labels: ['cart', 'regression'] },
  { key: 'SHOP-160', project: 'SHOP', type: 'Bug', summary: 'Settings: dark mode toggle label misaligned', status: 'To Do', priority: 'Lowest', assignee: null, createdDaysAgo: 30, fixVersion: null, labels: ['ui'] },
  { key: 'COUR-31', project: 'COUR', type: 'Bug', summary: 'Courier app: sign-in spinner never stops offline', status: 'To Do', priority: 'High', assignee: 'mia', createdDaysAgo: 2, fixVersion: null, labels: ['android'] },
  { key: 'COUR-32', project: 'COUR', type: 'Story', summary: 'Weekly earnings screen', status: 'In Progress', priority: 'Medium', assignee: 'luka', createdDaysAgo: 8, fixVersion: null, labels: [] },
];

const typeIcon: Record<IssueType, { icon: typeof Bug; color: string }> = {
  Epic: { icon: Layers, color: '#7c3aed' },
  Story: { icon: Bookmark, color: '#16a34a' },
  Task: { icon: CheckSquare, color: '#2563eb' },
  'Sub-task': { icon: ListTree, color: '#0891b2' },
  Bug: { icon: Bug, color: '#dc2626' },
};

export function TypeIcon({ type, size = 14 }: { type: IssueType; size?: number }) {
  const { icon: Icon, color } = typeIcon[type];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[3px]" style={{ backgroundColor: color, width: size + 2, height: size + 2 }} title={type}>
      <Icon size={size - 4} color="#fff" strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">{type}</span>
    </span>
  );
}

const prioIcon: Record<Priority, { icon: typeof Bug; color: string }> = {
  Highest: { icon: ChevronsUp, color: '#dc2626' },
  High: { icon: ChevronUp, color: '#ea580c' },
  Medium: { icon: Equal, color: '#ca8a04' },
  Low: { icon: ChevronDown, color: '#2563eb' },
  Lowest: { icon: ChevronsDown, color: '#64748b' },
};

export function PriorityIcon({ priority }: { priority: Priority }) {
  const { icon: Icon, color } = prioIcon[priority];
  return (
    <span className="inline-flex shrink-0" title={`Priority: ${priority}`}>
      <Icon size={15} color={color} strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">Priority {priority}</span>
    </span>
  );
}

export function Avatar({ person }: { person: PersonId | null }) {
  if (!person)
    return (
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-400 text-[9px] text-slate-500" title="Unassigned">
        <span aria-hidden="true">?</span>
        <span className="sr-only">Unassigned</span>
      </span>
    );
  const p = people[person];
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: p.color }} title={p.name}>
      <span aria-hidden="true">{p.initials}</span>
      <span className="sr-only">Assignee {p.name}</span>
    </span>
  );
}

/** Light "app window" around the mock, with a clear "simplified mock" label. */
export function MockWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-sm" style={{ colorScheme: 'light' }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <span aria-hidden="true" className="inline-block size-4 rounded bg-slate-700" />
          Tracker
        </span>
        <span className="min-w-0 truncate text-sm text-slate-500">{title}</span>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">Simplified mock, not the real Jira</span>
      </div>
      {children}
    </div>
  );
}
