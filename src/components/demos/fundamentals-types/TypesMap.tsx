import { useState } from 'react';
import { ArrowRight, ChevronDown, Globe, Smartphone } from 'lucide-react';
import { href } from '@/lib/url';
import { groups, kindLabels, stageLabels, types, type Kind, type Stage } from './data';

/** Interactive "map" of testing types, grouped by the question they answer, with filters. */

type KindFilter = 'all' | 'functional' | 'non-functional';
type StageFilter = 'all' | Stage;

const kindStyle: Record<Kind, string> = {
  functional: 'bg-info-soft text-info',
  'non-functional': 'bg-ok-soft text-ok',
  both: 'bg-subtle text-muted',
};

function Pill<T extends string>({ value, current, onPick, children }: { value: T; current: T; onPick: (v: T) => void; children: React.ReactNode }) {
  const on = value === current;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onPick(value)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
        on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

export default function TypesMap() {
  const [kind, setKind] = useState<KindFilter>('all');
  const [stage, setStage] = useState<StageFilter>('all');
  const [open, setOpen] = useState<string | null>('smoke');

  const visible = (t: (typeof types)[number]) =>
    (kind === 'all' || t.kind === kind || t.kind === 'both') && (stage === 'all' || t.stages.includes(stage));
  const count = types.filter(visible).length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">The testing types map</p>
        <p className="text-sm text-muted">Each group answers a different question. Filter the map, then open a card for when it is done and real examples.</p>
      </div>

      <div className="space-y-3 border-b border-line bg-subtle px-5 py-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">What it checks</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by what it checks">
            <Pill value="all" current={kind} onPick={setKind}>All</Pill>
            <Pill value="functional" current={kind} onPick={setKind}>Functional (what it does)</Pill>
            <Pill value="non-functional" current={kind} onPick={setKind}>Non-functional (how well)</Pill>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">When in the release cycle</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by moment in the release cycle">
            <Pill value="all" current={stage} onPick={setStage}>Any time</Pill>
            {(Object.keys(stageLabels) as Stage[]).map((s) => (
              <Pill key={s} value={s} current={stage} onPick={setStage}>
                {stageLabels[s]}
              </Pill>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          Showing {count} of {types.length} types.
        </p>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        {groups.map((g) => {
          const items = types.filter((t) => t.group === g.id);
          const shown = items.filter(visible);
          return (
            <section key={g.id} aria-label={g.title}>
              <div className="mb-2.5 flex items-start gap-2.5">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: g.tone }} aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-fg">{g.title}</h3>
                  <p className="text-xs text-muted">{g.question}</p>
                </div>
              </div>
              {shown.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-2 text-xs text-faint">No types in this group match the filters.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {shown.map((t) => {
                    const isOpen = open === t.id;
                    return (
                      <li
                        key={t.id}
                        className={`min-w-0 rounded-2xl border bg-surface ${isOpen ? 'border-line-strong md:col-span-2' : 'border-line'}`}
                        style={{ borderLeft: `4px solid ${g.tone}` }}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpen((prev) => (prev === t.id ? null : t.id))}
                          className="flex w-full items-start gap-2 rounded-2xl px-3.5 py-3 text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-fg">
                              {t.name}
                              {t.aka ? <span className="ml-1.5 text-xs font-normal text-faint">({t.aka})</span> : null}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t.short}</span>
                            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${kindStyle[t.kind]}`}>{kindLabels[t.kind]}</span>
                          </span>
                          <ChevronDown size={16} className={`mt-0.5 shrink-0 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        {isOpen && (
                          <div className="space-y-3 border-t border-line px-3.5 pt-3 pb-3.5 text-sm">
                            <p className="text-fg">
                              <strong>When: </strong>
                              {t.when}
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div className="min-w-0 rounded-xl bg-subtle p-3">
                                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-faint uppercase">
                                  <Smartphone size={13} aria-hidden="true" /> Mobile example
                                </p>
                                <p className="text-fg">{t.mobile}</p>
                              </div>
                              <div className="min-w-0 rounded-xl bg-subtle p-3">
                                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-faint uppercase">
                                  <Globe size={13} aria-hidden="true" /> Web example
                                </p>
                                <p className="text-fg">{t.web}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-xs text-muted">
                              {t.stages.map((s) => (
                                <span key={s} className="rounded-md border border-line px-2 py-0.5">
                                  {stageLabels[s]}
                                </span>
                              ))}
                            </div>
                            {t.link && (
                              <a href={href(t.link.href)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                                Go deeper: {t.link.label} <ArrowRight size={14} aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
