import { useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp, Coffee, CreditCard, Eye, EyeOff, FileText, Map as MapIcon, Plus, RotateCcw, Bell, Star, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Feature map builder.
 * The learner "explores" the undocumented Brewly coffee app area by area. Each explored area reveals the
 * features found there (with the source they were found in) and any open question. The learner rates risk
 * (High / Medium / Low), can add features they noticed themselves, and can compare with an experienced
 * tester's ratings. A "notes" view turns the map into lightweight documentation.
 */

type Risk = 'high' | 'medium' | 'low';
type Feature = { id: string; label: string; source: string; model?: Risk; why?: string; question?: string };
type Area = { id: string; label: string; icon: LucideIcon; features: Feature[] };

const areas: Area[] = [
  {
    id: 'rewards',
    label: 'Rewards (loyalty beans)',
    icon: Star,
    features: [
      { id: 'earn', label: 'Earning beans per purchase', source: 'App Store listing', model: 'high', why: 'Touches money-like value on every order. Errors affect every customer.', question: 'How are partial dollars rounded?' },
      { id: 'balance', label: 'Balance on Home and Rewards', source: 'App', model: 'high', why: 'Shown everywhere; a wrong number destroys trust and floods support.' },
      { id: 'redeem', label: 'Redeeming a free drink', source: 'Figma "Rewards v3"', model: 'high', why: 'Core promise of the feature; costs the business real drinks if it misfires.', question: 'Can a free drink be any size?' },
      { id: 'refund', label: 'Refunds and canceled orders', source: 'Support tickets', model: 'high', why: 'Classic place for points to be added twice or never removed. Support already sees complaints.' },
      { id: 'expiry', label: 'Bean expiry', source: 'Swagger: expiresAt field', model: 'medium', why: 'Annoying and support-heavy if wrong, but it happens rarely and is easy to correct.', question: 'When do beans expire, and is the user warned?' },
      { id: 'history', label: 'Activity history', source: 'App', model: 'low', why: 'Read-only list; mistakes are visible but do not change the balance.' },
    ],
  },
  {
    id: 'ordering',
    label: 'Menu and ordering',
    icon: Coffee,
    features: [
      { id: 'menu', label: 'Menu and drink customization', source: 'App', model: 'medium', why: 'Used constantly, but problems are visible and usually cosmetic.' },
      { id: 'cart', label: 'Cart and order total', source: 'App', model: 'high', why: 'Wrong totals mean wrong charges and wrong bean amounts.' },
      { id: 'pickup', label: 'Store and pickup time', source: 'Developer chat', model: 'medium', why: 'A wrong store sends the customer to the wrong place, but it is easy to notice.', question: 'What happens if the store closes before pickup?' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    features: [
      { id: 'card', label: 'Card, Apple Pay, Google Pay', source: 'App', model: 'high', why: 'Money. Failures block every order and can double-charge.' },
      { id: 'giftcard', label: 'Gift card balance', source: 'Marketing page', model: 'medium', why: 'Fewer users, but it is money and must earn beans like other payments.', question: 'Do gift card payments earn beans?' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserRound,
    features: [
      { id: 'login', label: 'Sign up and sign in', source: 'App', model: 'high', why: 'If it fails, nobody can collect beans at all.' },
      { id: 'profile', label: 'Profile and preferences', source: 'App', model: 'low', why: 'Low impact; mistakes are easy to see and fix.' },
      { id: 'delete', label: 'Delete account', source: 'App Store requirement', model: 'medium', why: 'Rare, but has legal and data implications, and what happens to unused beans is unclear.', question: 'What happens to beans when an account is deleted?' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    features: [
      { id: 'ready', label: '"Order ready" push', source: 'Previous bug reports', model: 'medium', why: 'Old bug reports show it broke twice before; a missed push means a cold coffee.' },
      { id: 'promo', label: 'Promo and bonus-bean offers', source: 'Marketing page', model: 'low', why: 'Nice to have; a missed promo is unlikely to hurt anyone.' },
    ],
  },
];

const riskStyle: Record<Risk, string> = {
  high: 'border-danger/50 bg-danger-soft text-danger',
  medium: 'border-warn/50 bg-warn-soft text-warn',
  low: 'border-ok/50 bg-ok-soft text-ok',
};
const riskLabel: Record<Risk, string> = { high: 'High', medium: 'Medium', low: 'Low' };

type Custom = { id: string; label: string };

export default function FeatureMapBuilder() {
  const [explored, setExplored] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [risks, setRisks] = useState<Record<string, Risk>>({});
  const [custom, setCustom] = useState<Record<string, Custom[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState(false);
  const [notes, setNotes] = useState(false);

  const toggleArea = (id: string) => {
    if (!explored.includes(id)) {
      setExplored((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setCollapsed((prev) => prev.filter((x) => x !== id));
    } else {
      setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const addCustom = (areaId: string) => {
    const text = (drafts[areaId] ?? '').trim();
    if (!text) return;
    setCustom((prev) => {
      const list = prev[areaId] ?? [];
      return { ...prev, [areaId]: [...list, { id: `${areaId}-c${list.length + 1}-${Date.now()}`, label: text.slice(0, 60) }] };
    });
    setDrafts((prev) => ({ ...prev, [areaId]: '' }));
  };

  const exploredAreas = areas.filter((a) => explored.includes(a.id));
  const visible = exploredAreas.flatMap((a) => [...a.features, ...(custom[a.id] ?? []).map((c) => ({ ...c, source: 'You' }) as Feature)]);
  const rated = visible.filter((f) => risks[f.id]);
  const modelRated = visible.filter((f) => f.model && risks[f.id]);
  const matches = modelRated.filter((f) => risks[f.id] === f.model).length;
  const testFirst = visible.filter((f) => risks[f.id] === 'high');
  const questions = exploredAreas.flatMap((a) => a.features.filter((f) => f.question).map((f) => f.question!));
  const allExplored = explored.length === areas.length;

  const notesText = [
    'Brewly app: feature map (exploratory notes)',
    '',
    ...exploredAreas.flatMap((a) => [
      `${a.label}`,
      ...[...a.features, ...(custom[a.id] ?? []).map((c) => ({ ...c, source: 'You' }) as Feature)].map(
        (f) => `  - ${f.label} [risk: ${risks[f.id] ? riskLabel[risks[f.id]] : '?'}] (source: ${f.source})`,
      ),
      '',
    ]),
    'Open questions',
    ...(questions.length ? questions.map((q) => `  - ${q}`) : ['  - (none yet)']),
  ].join('\n');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <MapIcon size={17} className="text-brand" aria-hidden="true" /> Feature map builder
        </p>
        <p className="text-sm text-muted">
          Explore the Brewly app one area at a time. Rate the risk of each feature you find, add anything else you would expect to see, then compare with an experienced tester.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg">
            <Coffee size={15} aria-hidden="true" /> Brewly app
          </div>
          <ul className="mt-2 ml-3 space-y-2 border-l-2 border-line pl-4">
            {areas.map((area) => {
              const isExplored = explored.includes(area.id);
              const open = isExplored && !collapsed.includes(area.id);
              const Icon = area.icon;
              const list: Feature[] = [...area.features, ...(custom[area.id] ?? []).map((c) => ({ ...c, source: 'You' }) as Feature)];
              const ratedHere = list.filter((f) => risks[f.id]).length;
              return (
                <li key={area.id} className="relative min-w-0">
                  <span className="absolute top-[18px] -left-4 h-0.5 w-4 bg-line" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    aria-expanded={open}
                    aria-controls={`fm-${area.id}`}
                    className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isExplored ? 'border-line bg-surface text-fg' : 'border-dashed border-line-strong bg-subtle text-muted hover:text-fg'
                    }`}
                  >
                    {open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                    <Icon size={15} className="shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0 flex-1 font-semibold">{area.label}</span>
                    <span className="shrink-0 text-xs text-faint">{isExplored ? `${ratedHere}/${list.length} rated` : 'Explore'}</span>
                  </button>

                  {open ? (
                    <div id={`fm-${area.id}`} className="mt-2 ml-3 border-l-2 border-line pl-4">
                      <ul className="space-y-2">
                        {list.map((f) => (
                          <li key={f.id} className="relative min-w-0 rounded-xl border border-line bg-surface p-2.5">
                            <span className="absolute top-[18px] -left-[18px] h-0.5 w-4 bg-line" aria-hidden="true" />
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                              <p className="min-w-0 text-sm font-medium text-fg">{f.label}</p>
                              <p className="text-[11px] text-faint">found in: {f.source}</p>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`Risk of ${f.label}`}>
                              {(['high', 'medium', 'low'] as Risk[]).map((r) => {
                                const on = risks[f.id] === r;
                                return (
                                  <button
                                    key={r}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    onClick={() => setRisks((prev) => ({ ...prev, [f.id]: r }))}
                                    className={`rounded-lg border px-2 py-0.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                                      on ? riskStyle[r] : 'border-line text-muted hover:bg-subtle'
                                    }`}
                                  >
                                    {riskLabel[r]}
                                  </button>
                                );
                              })}
                              {compare && f.model ? (
                                <span className={`ml-auto text-xs ${risks[f.id] === f.model ? 'text-ok' : 'text-muted'}`}>
                                  Tester: <strong>{riskLabel[f.model]}</strong>
                                </span>
                              ) : null}
                            </div>
                            {compare && f.why ? <p className="mt-1.5 text-xs text-muted">{f.why}</p> : null}
                            {f.question ? (
                              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-fg">
                                <CircleHelp size={13} className="mt-px shrink-0 text-brand" aria-hidden="true" />
                                <span>
                                  <span className="font-semibold">Open question:</span> {f.question}
                                </span>
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <form
                        className="mt-2 flex gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          addCustom(area.id);
                        }}
                      >
                        <label className="sr-only" htmlFor={`fm-add-${area.id}`}>
                          Add a feature you noticed in {area.label}
                        </label>
                        <input
                          id={`fm-add-${area.id}`}
                          value={drafts[area.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDrafts((prev) => ({ ...prev, [area.id]: v }));
                          }}
                          maxLength={60}
                          placeholder="Add a feature you noticed…"
                          className="w-0 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg placeholder:text-faint focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        />
                        <button
                          type="submit"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-sm text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                          <Plus size={14} aria-hidden="true" /> Add
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="min-w-0 space-y-4 border-t border-line bg-subtle p-4 sm:p-5 lg:border-t-0 lg:border-l" aria-label="Map summary">
          <div aria-live="polite" className="text-sm">
            <p className="font-semibold text-fg">
              {explored.length} of {areas.length} areas explored
            </p>
            <p className="text-muted">
              {rated.length} of {visible.length} features rated
              {compare && modelRated.length ? ` · ${matches}/${modelRated.length} match the tester` : ''}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Test first (High risk)</p>
            {testFirst.length ? (
              <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-sm text-fg">
                {testFirst.map((f) => (
                  <li key={f.id}>{f.label}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-muted">Rate features High to build your plan.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Questions to confirm</p>
            {questions.length ? (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-fg">
                {questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">Explore areas to collect questions.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setCompare((v) => !v)}
              aria-pressed={compare}
              disabled={!explored.length}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {compare ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              {compare ? 'Hide tester ratings' : 'Compare with a tester'}
            </button>
            <button
              type="button"
              onClick={() => setNotes((v) => !v)}
              aria-pressed={notes}
              disabled={!explored.length}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={15} aria-hidden="true" /> {notes ? 'Hide notes' : 'Turn into notes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setExplored([]);
                setCollapsed([]);
                setRisks({});
                setCustom({});
                setDrafts({});
                setCompare(false);
                setNotes(false);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={15} aria-hidden="true" /> Start over
            </button>
          </div>

          {allExplored && rated.length === visible.length && visible.length > 0 && !compare ? (
            <p className="text-sm text-fg">Every feature is rated. Now compare with the tester and read their reasons.</p>
          ) : null}
        </aside>
      </div>

      {notes && explored.length ? (
        <div className="border-t border-line p-4 sm:p-5">
          <p className="mb-2 text-sm font-semibold text-fg">Your map as lightweight documentation</p>
          <pre className="max-h-80 overflow-auto rounded-xl border border-line bg-subtle p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-fg">{notesText}</pre>
          <p className="mt-2 text-xs text-muted">Paste this into your team's wiki or test management tool. Update it every session; it becomes the spec nobody wrote.</p>
        </div>
      ) : null}
    </div>
  );
}
