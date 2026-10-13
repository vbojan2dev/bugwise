import { useId, useState } from 'react';
import { CircleAlert, CircleCheck, Search, Trophy } from 'lucide-react';
import { Avatar, CURRENT_USER, issues, MockWindow, PRIORITIES, PriorityIcon, TypeIcon, type Issue } from './mockTracker';

/**
 * JQL builder: compose a query from dropdowns, see the JQL text, and see which mock issues match.
 * The filtering really runs on the mock data. Challenges check the result set against a target.
 */

type Opt = { value: string; jql: string; label: string; test: (i: Issue) => boolean };

const ANY: Opt = { value: 'any', jql: '', label: '(any)', test: () => true };

const fields: { id: string; label: string; options: Opt[] }[] = [
  {
    id: 'project',
    label: 'Project',
    options: [
      ANY,
      { value: 'shop', jql: 'project = SHOP', label: 'SHOP', test: (i) => i.project === 'SHOP' },
      { value: 'cour', jql: 'project = COUR', label: 'COUR', test: (i) => i.project === 'COUR' },
    ],
  },
  {
    id: 'type',
    label: 'Issue type',
    options: [
      ANY,
      ...(['Bug', 'Story', 'Task', 'Epic', 'Sub-task'] as const).map((t) => ({ value: t, jql: `type = ${t === 'Sub-task' ? '"Sub-task"' : t}`, label: t, test: (i: Issue) => i.type === t })),
    ],
  },
  {
    id: 'status',
    label: 'Status',
    options: [
      ANY,
      { value: 'notdone', jql: 'status != Done', label: 'is not Done', test: (i) => i.status !== 'Done' },
      { value: 'todo', jql: 'status = "To Do"', label: 'To Do', test: (i) => i.status === 'To Do' },
      { value: 'inprogress', jql: 'status = "In Progress"', label: 'In Progress', test: (i) => i.status === 'In Progress' },
      { value: 'intesting', jql: 'status = "In Testing"', label: 'In Testing', test: (i) => i.status === 'In Testing' },
      { value: 'done', jql: 'status = Done', label: 'Done', test: (i) => i.status === 'Done' },
    ],
  },
  {
    id: 'assignee',
    label: 'Assignee',
    options: [
      ANY,
      { value: 'me', jql: 'assignee = currentUser()', label: 'me (currentUser())', test: (i) => i.assignee === CURRENT_USER },
      { value: 'empty', jql: 'assignee is EMPTY', label: 'unassigned (EMPTY)', test: (i) => i.assignee === null },
      { value: 'notme', jql: 'assignee != currentUser()', label: 'anyone but me', test: (i) => i.assignee !== null && i.assignee !== CURRENT_USER },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    options: [
      ANY,
      { value: 'top', jql: 'priority in (Highest, High)', label: 'Highest or High', test: (i) => i.priority === 'Highest' || i.priority === 'High' },
      { value: 'medium', jql: 'priority = Medium', label: 'Medium', test: (i) => i.priority === 'Medium' },
      { value: 'low', jql: 'priority in (Low, Lowest)', label: 'Low or Lowest', test: (i) => i.priority === 'Low' || i.priority === 'Lowest' },
    ],
  },
  {
    id: 'created',
    label: 'Created',
    options: [
      ANY,
      { value: '7d', jql: 'created >= -7d', label: 'in the last 7 days', test: (i) => i.createdDaysAgo <= 7 },
      { value: '14d', jql: 'created >= -14d', label: 'in the last 14 days', test: (i) => i.createdDaysAgo <= 14 },
    ],
  },
  {
    id: 'fixVersion',
    label: 'Fix version',
    options: [
      ANY,
      { value: '380', jql: 'fixVersion = "3.8.0"', label: '3.8.0 (this release)', test: (i) => i.fixVersion === '3.8.0' },
      { value: '370', jql: 'fixVersion = "3.7.0"', label: '3.7.0 (last release)', test: (i) => i.fixVersion === '3.7.0' },
      { value: 'empty', jql: 'fixVersion is EMPTY', label: 'not planned (EMPTY)', test: (i) => i.fixVersion === null },
    ],
  },
  {
    id: 'labels',
    label: 'Labels',
    options: [
      ANY,
      ...['checkout', 'regression', 'android', 'ios', 'tracking'].map((l) => ({ value: l, jql: `labels = ${l}`, label: l, test: (i: Issue) => i.labels.includes(l) })),
    ],
  },
];

type Sort = 'priority' | 'created' | 'key';
const sorts: { value: Sort; jql: string; label: string }[] = [
  { value: 'priority', jql: 'ORDER BY priority DESC', label: 'priority, highest first' },
  { value: 'created', jql: 'ORDER BY created DESC', label: 'newest first' },
  { value: 'key', jql: 'ORDER BY key ASC', label: 'key' },
];

type State = Record<string, string>;
const empty: State = Object.fromEntries(fields.map((f) => [f.id, 'any']));

const challenges: { title: string; task: string; target: string[]; hint: string }[] = [
  {
    title: 'Open bugs',
    task: 'All SHOP bugs that are not Done yet.',
    target: ['SHOP-150', 'SHOP-151', 'SHOP-152', 'SHOP-153', 'SHOP-154', 'SHOP-156', 'SHOP-160'],
    hint: 'Three conditions: project, issue type and status.',
  },
  {
    title: 'My work',
    task: 'Everything assigned to you that is still open, in any project.',
    target: ['SHOP-142', 'SHOP-154', 'SHOP-156', 'SHOP-158', 'COUR-31'],
    hint: 'Use currentUser(), so the same filter works for every teammate. Leave the project open.',
  },
  {
    title: 'Fresh bugs',
    task: 'SHOP bugs created in the last 7 days.',
    target: ['SHOP-150', 'SHOP-151', 'SHOP-153', 'SHOP-154', 'SHOP-156'],
    hint: 'Relative dates like -7d keep the filter up to date by itself.',
  },
  {
    title: 'Release check',
    task: 'Anything planned for release 3.8.0 that is not Done.',
    target: ['SHOP-120', 'SHOP-142', 'SHOP-150', 'SHOP-151', 'SHOP-153', 'SHOP-154', 'SHOP-158'],
    hint: 'Fix version plus status. Every issue type counts here.',
  },
  {
    title: 'Orphans',
    task: 'Open bugs that nobody is assigned to.',
    target: ['SHOP-152', 'SHOP-160'],
    hint: 'Unassigned is written as "assignee is EMPTY".',
  },
];

const prioRank = (i: Issue) => PRIORITIES.indexOf(i.priority);

export default function JqlBuilder() {
  const uid = useId();
  const [state, setState] = useState<State>({ ...empty, project: 'shop' });
  const [sort, setSort] = useState<Sort>('priority');
  const [text, setText] = useState('');
  const [challenge, setChallenge] = useState(0);

  const active = fields.map((f) => f.options.find((o) => o.value === state[f.id]) ?? ANY).filter((o) => o !== ANY);
  const words = text.trim().toLowerCase();

  const query = [...active.map((o) => o.jql), ...(words ? [`summary ~ "${text.trim().replace(/"/g, '')}"`] : [])].join(' AND ');
  const sortJql = sorts.find((s) => s.value === sort)!.jql;

  const results = (() => {
    const list = issues.filter((i) => active.every((o) => o.test(i)) && (!words || i.summary.toLowerCase().includes(words.replace(/"/g, ''))));
    return [...list].sort((a, b) => {
      if (sort === 'priority') return prioRank(a) - prioRank(b) || a.key.localeCompare(b.key, 'en', { numeric: true });
      if (sort === 'created') return a.createdDaysAgo - b.createdDaysAgo || a.key.localeCompare(b.key, 'en', { numeric: true });
      return a.key.localeCompare(b.key, 'en', { numeric: true });
    });
  })();

  const ch = challenges[challenge];
  const got = new Set(results.map((r) => r.key));
  const missing = ch.target.filter((k) => !got.has(k));
  const extra = results.filter((r) => !ch.target.includes(r.key));
  const solved = missing.length === 0 && extra.length === 0;

  const selectCls =
    'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none';

  return (
    <div className="not-prose my-8 space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Trophy size={16} className="text-brand" aria-hidden="true" /> Challenge {challenge + 1} of {challenges.length}: {ch.title}
        </p>
        <p className="mt-1 text-sm text-fg">{ch.task}</p>
        <p className="mt-1 text-xs text-muted">Hint: {ch.hint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className={`flex items-center gap-1.5 text-sm font-medium ${solved ? 'text-ok' : 'text-muted'}`} role="status" aria-live="polite">
            {solved ? <CircleCheck size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
            {solved
              ? 'Solved! Your filter returns exactly the right issues.'
              : `Not yet: ${missing.length} missing, ${extra.length} extra.`}
          </p>
          <div className="ml-auto flex gap-1.5">
            {challenges.map((c, i) => (
              <button
                key={c.title}
                type="button"
                onClick={() => setChallenge(i)}
                aria-label={`Challenge ${i + 1}: ${c.title}`}
                aria-current={i === challenge ? 'step' : undefined}
                className={`size-7 rounded-full text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                  i === challenge ? 'bg-brand text-brand-fg' : 'border border-line text-muted hover:text-fg'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MockWindow title="Filters · Advanced search">
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {fields.map((f) => (
              <div key={f.id} className="min-w-0">
                <label htmlFor={`${uid}-${f.id}`} className="mb-0.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {f.label}
                </label>
                <select id={`${uid}-${f.id}`} value={state[f.id]} onChange={(e) => setState((prev) => ({ ...prev, [f.id]: e.target.value }))} className={selectCls}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor={`${uid}-text`} className="mb-0.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Summary contains
              </label>
              <div className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/30">
                <Search size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  id={`${uid}-text`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. checkout"
                  className="h-9 w-0 min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor={`${uid}-sort`} className="mb-0.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Order by
              </label>
              <select id={`${uid}-sort`} value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectCls}>
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">JQL</p>
            <code className="mt-0.5 block font-mono text-[13px] break-words text-slate-900" aria-live="polite">
              {query ? (
                <>
                  {query} <span className="text-blue-700">{sortJql}</span>
                </>
              ) : (
                <span className="text-blue-700">{sortJql}</span>
              )}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setState({ ...empty });
                setText('');
              }}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              Clear all
            </button>
          </div>

          <div className="relative overflow-x-auto rounded-md border border-slate-200">
            <p className="sr-only" aria-live="polite">
              {results.length} issues found
            </p>
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
              <caption className="bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-600">{results.length} issues</caption>
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                  <th scope="col" className="px-2 py-1.5 font-semibold">Key</th>
                  <th scope="col" className="px-2 py-1.5 font-semibold">Summary</th>
                  <th scope="col" className="px-2 py-1.5 font-semibold">Status</th>
                  <th scope="col" className="px-2 py-1.5 font-semibold">
                    <span className="sr-only">Priority and assignee</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((i) => (
                  <tr key={i.key} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <TypeIcon type={i.type} />
                        <span className="font-mono text-xs text-blue-700">{i.key}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-slate-900">
                      {i.summary}
                      {i.labels.length > 0 && <span className="ml-1 text-xs text-slate-500">· {i.labels.join(', ')}</span>}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                          i.status === 'Done' ? 'bg-green-100 text-green-800' : i.status === 'To Do' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1.5">
                        <PriorityIcon priority={i.priority} />
                        <Avatar person={i.assignee} />
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                      No issues match. Remove a condition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            You are signed in as Mia Novak (MN). "Today" in this mock is fixed, so relative dates always give the same answer. The mock's text search is a simple "contains"; real JQL text search matches whole words.
          </p>
        </div>
      </MockWindow>
    </div>
  );
}
