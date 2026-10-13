import { useId, useState, type ReactNode } from 'react';
import { CircleAlert, CircleX, Paperclip, Sparkles, X } from 'lucide-react';
import { PRIORITIES, type Priority } from './mockTracker';

/**
 * "Create issue" form for the mock tracker, with validation hints.
 * Errors block creating the ticket; warnings are advice (like a reviewer's comments).
 */

export type BugDraft = {
  summary: string;
  description: string;
  environment: string;
  component: string;
  affects: string;
  fixVersion: string;
  priority: Priority;
  labels: string[];
  attachment: boolean;
  linkType: '' | 'blocks' | 'relates to' | 'duplicates';
};

const TEMPLATE = 'Preconditions:\n\nSteps:\n1. \n2. \n3. \n\nExpected:\n\nActual:\n';

const blank: BugDraft = {
  summary: '',
  description: TEMPLATE,
  environment: '',
  component: '',
  affects: '',
  fixVersion: '',
  priority: 'Medium',
  labels: [],
  attachment: false,
  linkType: '',
};

const weak: BugDraft = {
  ...blank,
  summary: 'Tip broken!!',
  description: 'Tip does not work. Please fix.',
  environment: 'my phone',
  priority: 'Highest',
};

export const model: BugDraft = {
  summary: 'Checkout: order total ignores custom tip on Android',
  description:
    'Preconditions:\nSigned in as qa.mia@quickbite.test, cart with 1 item (subtotal €18.40, delivery €2.50)\n\nSteps:\n1. Open the cart and tap Checkout\n2. In "Tip your courier", tap Custom\n3. Enter 2.50 and tap Done\n\nExpected:\nTip row shows €2.50 and Total shows €23.40\n\nActual:\nTip row shows €2.50 but Total stays €20.90. Preset tips (€1, €2, €3) are added correctly. Happens 5/5 times.',
  environment: 'Pixel 8, Android 15, QuickBite 3.8.0 (build 409), Staging',
  component: 'Checkout',
  affects: '3.8.0',
  fixVersion: '',
  priority: 'High',
  labels: ['android', 'checkout'],
  attachment: true,
  linkType: 'blocks',
};

const VAGUE = /\b(broken|doesn'?t work|does not work|not working|issue|problem|bug|weird)\b/i;

/** Text under a "Heading:" line, up to the next known heading. */
function section(desc: string, name: string) {
  const m = desc.match(new RegExp(`(?:^|\\n)[ \\t]*${name}:([\\s\\S]*?)(?=\\n[ \\t]*(?:preconditions|steps|expected|actual|notes):|$)`, 'i'));
  return m ? m[1].trim() : '';
}

type Finding = { field: keyof BugDraft; level: 'error' | 'warn'; text: string };

export function validate(d: BugDraft): Finding[] {
  const f: Finding[] = [];
  const s = d.summary.trim();
  if (!s) f.push({ field: 'summary', level: 'error', text: 'Summary is required.' });
  else if (s.length < 20 || VAGUE.test(s) || /!!/.test(s))
    f.push({ field: 'summary', level: 'error', text: 'Make the summary specific: where + what goes wrong + when. Avoid "broken" and "!!".' });

  const desc = d.description;
  const steps = (desc.match(/^[ \t]*\d+\.[ \t]*\S.*$/gm) ?? []).length;
  if (steps < 2) f.push({ field: 'description', level: 'error', text: 'Add at least 2 numbered steps (1. 2. …) that someone else can follow.' });
  if (!section(desc, 'expected')) f.push({ field: 'description', level: 'error', text: 'Fill in "Expected:" with what should happen.' });
  if (!section(desc, 'actual')) f.push({ field: 'description', level: 'error', text: 'Fill in "Actual:" with what really happens.' });

  const env = d.environment.trim();
  if (!env) f.push({ field: 'environment', level: 'error', text: 'Environment is required: device, OS version, app version and build.' });
  else if (env.length < 12 || !/\d/.test(env)) f.push({ field: 'environment', level: 'error', text: 'Too vague. Name the device, OS version and the app build (numbers!).' });

  if (d.linkType === '') f.push({ field: 'linkType', level: 'error', text: 'Link the bug to the story SHOP-142, so the team sees it belongs to this work.' });
  else if (d.linkType === 'duplicates')
    f.push({ field: 'linkType', level: 'error', text: '"Duplicates" means the same bug was already reported. This is a new bug found while testing the story: use "blocks" or "relates to".' });
  else if (d.linkType === 'relates to')
    f.push({ field: 'linkType', level: 'warn', text: '"Relates to" works. If the story should not ship with this bug, "blocks" says that more clearly.' });

  if (!d.component) f.push({ field: 'component', level: 'warn', text: 'Pick a component so the bug reaches the right team.' });
  else if (d.component !== 'Checkout') f.push({ field: 'component', level: 'warn', text: `The tip is on the checkout screen. "${d.component}" would route the bug to the wrong team.` });
  if (!d.affects) f.push({ field: 'affects', level: 'warn', text: 'Set "Affects version" to the version you tested (3.8.0).' });
  if (d.fixVersion) f.push({ field: 'fixVersion', level: 'warn', text: 'Fix version is usually set by the lead or product owner during triage. Most teams want testers to leave it empty.' });
  if (!d.attachment) f.push({ field: 'attachment', level: 'warn', text: 'Attach the screen recording. A 10-second video saves a lot of back-and-forth.' });
  if (d.priority === 'Highest')
    f.push({ field: 'priority', level: 'warn', text: '"Highest" is for blockers like crashes at checkout for everyone. Wrong totals with custom tips is serious; High is a fair proposal.' });
  return f;
}

function Row({ label, htmlFor, children, findings }: { label: string; htmlFor?: string; children: ReactNode; findings: Finding[] }) {
  return (
    <div className="min-w-0">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-0.5 block text-xs font-semibold text-slate-600">
          {label}
        </label>
      ) : (
        <p className="mb-0.5 text-xs font-semibold text-slate-600">{label}</p>
      )}
      {children}
      {findings.map((f) => (
        <p key={f.text} className={`mt-1 flex items-start gap-1 text-xs ${f.level === 'error' ? 'text-red-700' : 'text-amber-800'}`}>
          {f.level === 'error' ? <CircleX size={13} className="mt-px shrink-0" aria-hidden="true" /> : <CircleAlert size={13} className="mt-px shrink-0" aria-hidden="true" />}
          <span>{f.text}</span>
        </p>
      ))}
    </div>
  );
}

const input =
  'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none';

export default function BugTicketForm({ onCreate, onCancel }: { onCreate: (d: BugDraft) => void; onCancel: () => void }) {
  const uid = useId();
  const [d, setD] = useState<BugDraft>(blank);
  const [tried, setTried] = useState(false);

  const findings = validate(d);
  const errors = findings.filter((f) => f.level === 'error');
  const show = (field: keyof BugDraft) => (tried ? findings.filter((f) => f.field === field) : []);
  const set = <K extends keyof BugDraft>(k: K, v: BugDraft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-3" role="group" aria-label="Create bug">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-900">Create issue · Bug · SHOP</p>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { setD(weak); setTried(true); }} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
            Load a weak draft
          </button>
          <button type="button" onClick={() => { setD(model); setTried(true); }} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
            <Sparkles size={12} aria-hidden="true" /> Model answer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-w-0 space-y-3 md:col-span-2">
          <Row label="Summary *" htmlFor={`${uid}-summary`} findings={show('summary')}>
            <input id={`${uid}-summary`} value={d.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Where: what goes wrong, when" className={`${input} h-9`} />
          </Row>
          <Row label="Description *" htmlFor={`${uid}-desc`} findings={show('description')}>
            <textarea id={`${uid}-desc`} value={d.description} onChange={(e) => set('description', e.target.value)} rows={9} className={`${input} py-1.5 font-mono text-[13px]`} />
          </Row>
        </div>
        <Row label="Environment *" htmlFor={`${uid}-env`} findings={show('environment')}>
          <input id={`${uid}-env`} value={d.environment} onChange={(e) => set('environment', e.target.value)} placeholder="Device, OS, app version (build), server" className={`${input} h-9`} />
        </Row>
        <Row label="Component" htmlFor={`${uid}-comp`} findings={show('component')}>
          <select id={`${uid}-comp`} value={d.component} onChange={(e) => set('component', e.target.value)} className={`${input} h-9`}>
            <option value="">None</option>
            {['Checkout', 'Cart', 'Search', 'Tracking', 'Profile'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Row>
        <Row label="Affects version" htmlFor={`${uid}-aff`} findings={show('affects')}>
          <select id={`${uid}-aff`} value={d.affects} onChange={(e) => set('affects', e.target.value)} className={`${input} h-9`}>
            <option value="">None</option>
            <option>3.7.0</option>
            <option>3.8.0</option>
          </select>
        </Row>
        <Row label="Fix version" htmlFor={`${uid}-fix`} findings={show('fixVersion')}>
          <select id={`${uid}-fix`} value={d.fixVersion} onChange={(e) => set('fixVersion', e.target.value)} className={`${input} h-9`}>
            <option value="">None</option>
            <option>3.8.0</option>
            <option>3.9.0</option>
          </select>
        </Row>
        <Row label="Priority (your proposal)" htmlFor={`${uid}-prio`} findings={show('priority')}>
          <select id={`${uid}-prio`} value={d.priority} onChange={(e) => set('priority', e.target.value as Priority)} className={`${input} h-9`}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Row>
        <Row label="Linked issue *" htmlFor={`${uid}-link`} findings={show('linkType')}>
          <div className="flex items-center gap-2">
            <select id={`${uid}-link`} value={d.linkType} onChange={(e) => set('linkType', e.target.value as BugDraft['linkType'])} className={`${input} h-9 w-0 flex-1`}>
              <option value="">Choose link type…</option>
              <option value="blocks">blocks</option>
              <option value="relates to">relates to</option>
              <option value="duplicates">duplicates</option>
            </select>
            <span className="shrink-0 font-mono text-xs text-blue-700">SHOP-142</span>
          </div>
        </Row>
        <Row label="Labels" findings={[]}>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Labels">
            {['android', 'ios', 'checkout', 'regression'].map((l) => {
              const on = d.labels.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setD((prev) => ({ ...prev, labels: prev.labels.includes(l) ? prev.labels.filter((x) => x !== l) : [...prev.labels, l] }))}
                  className={`rounded px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${on ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="Attachments" findings={show('attachment')}>
          {d.attachment ? (
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800">
              <Paperclip size={12} aria-hidden="true" /> tip-total-wrong.mp4
              <button type="button" onClick={() => set('attachment', false)} aria-label="Remove attachment" className="rounded text-slate-500 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => set('attachment', true)} className="inline-flex items-center gap-1.5 rounded border border-dashed border-slate-400 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
              <Paperclip size={12} aria-hidden="true" /> Attach screen recording
            </button>
          )}
        </Row>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTried(true);
            if (errors.length === 0) onCreate(d);
          }}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Create
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none">
          Cancel
        </button>
        {tried && (
          <p className={`text-xs ${errors.length ? 'text-red-700' : 'text-slate-600'}`} role="status">
            {errors.length
              ? `${errors.length} thing(s) to fix before you can create the bug.`
              : findings.length
                ? `Ready to create. ${findings.length} optional tip(s) above.`
                : 'Looks great. Ready to create.'}
          </p>
        )}
      </div>
    </div>
  );
}
