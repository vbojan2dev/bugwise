import { Fragment, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, X, XCircle } from 'lucide-react';
import { allRows, checkCoverage, describePair, fullCount, generatePairwise, pairsOfRow, type Param, type Row } from './allPairs';

/**
 * Pairwise lab: choose parameters and values, compare "every combination" with a generated all-pairs set,
 * optionally show which pairs each row covers, remove rows to watch the independent coverage check fail,
 * and switch on two simple constraints.
 */

type CatalogParam = { id: string; name: string; values: string[]; defaultOn: string[]; defaultIncluded: boolean };

const CATALOG: CatalogParam[] = [
  { id: 'browser', name: 'Browser', values: ['Chrome', 'Safari', 'Firefox', 'Edge'], defaultOn: ['Chrome', 'Safari', 'Firefox', 'Edge'], defaultIncluded: true },
  { id: 'os', name: 'OS', values: ['Windows', 'macOS', 'Android', 'iOS'], defaultOn: ['Windows', 'macOS', 'Android', 'iOS'], defaultIncluded: true },
  { id: 'lang', name: 'Language', values: ['English', 'German', 'Spanish', 'Japanese'], defaultOn: ['English', 'German', 'Spanish'], defaultIncluded: true },
  { id: 'pay', name: 'Payment', values: ['Card', 'PayPal', 'Apple Pay', 'Google Pay'], defaultOn: ['Card', 'PayPal', 'Apple Pay'], defaultIncluded: true },
  { id: 'account', name: 'Account', values: ['Guest', 'Signed in'], defaultOn: ['Guest', 'Signed in'], defaultIncluded: false },
];

const APPLE = ['macOS', 'iOS'];

export default function PairwiseLab() {
  const [included, setIncluded] = useState<Record<string, boolean>>(() => Object.fromEntries(CATALOG.map((p) => [p.id, p.defaultIncluded])));
  const [on, setOn] = useState<Record<string, string[]>>(() => Object.fromEntries(CATALOG.map((p) => [p.id, p.defaultOn])));
  const [constraints, setConstraints] = useState(false);
  const [showPairs, setShowPairs] = useState(false);
  const [removed, setRemoved] = useState<number[]>([]);

  const params: Param[] = useMemo(
    () =>
      CATALOG.filter((p) => included[p.id]).map((p) => ({
        name: p.name,
        values: p.values.filter((v) => on[p.id].includes(v)),
      })),
    [included, on],
  );

  // Constraints are expressed on full rows by looking up parameter positions by name.
  const valid = useMemo(() => {
    if (!constraints) return () => true;
    const idx = (name: string) => params.findIndex((p) => p.name === name);
    const b = idx('Browser');
    const o = idx('OS');
    const pay = idx('Payment');
    return (row: Row) => {
      const os = o >= 0 ? params[o].values[row[o]] : null;
      if (os && b >= 0 && params[b].values[row[b]] === 'Safari' && !APPLE.includes(os)) return false;
      if (os && pay >= 0 && params[pay].values[row[pay]] === 'Apple Pay' && !APPLE.includes(os)) return false;
      return true;
    };
  }, [constraints, params]);

  const generated = useMemo(() => generatePairwise(params, valid), [params, valid]);
  const rows = useMemo(() => generated.filter((_, i) => !removed.includes(i)), [generated, removed]);
  const coverage = useMemo(() => checkCoverage(params, rows, valid), [params, rows, valid]);
  const total = fullCount(params);
  const validTotal = useMemo(() => (constraints ? allRows(params, valid).length : total), [constraints, params, valid, total]);

  // How many rows cover each pair, to mark pairs that only one row covers.
  const pairCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) for (const k of pairsOfRow(r)) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, [rows]);

  const resetRows = () => setRemoved([]);
  const changeModel = (fn: () => void) => {
    fn();
    setRemoved([]);
  };

  const toggleParam = (id: string) =>
    changeModel(() =>
      setIncluded((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        return Object.values(next).filter(Boolean).length < 2 ? prev : next;
      }),
    );
  const toggleValue = (id: string, v: string) =>
    changeModel(() =>
      setOn((prev) => {
        const cur = prev[id];
        if (cur.includes(v)) return cur.length <= 1 ? prev : { ...prev, [id]: cur.filter((x) => x !== v) };
        const order = CATALOG.find((p) => p.id === id)!.values;
        return { ...prev, [id]: order.filter((x) => x === v || cur.includes(x)) };
      }),
    );
  const resetAll = () => {
    setIncluded(Object.fromEntries(CATALOG.map((p) => [p.id, p.defaultIncluded])));
    setOn(Object.fromEntries(CATALOG.map((p) => [p.id, p.defaultOn])));
    setConstraints(false);
    setShowPairs(false);
    setRemoved([]);
  };

  const ok = coverage.missing.length === 0 && coverage.invalidRows.length === 0;
  const pct = total ? Math.max(2, Math.round((rows.length / total) * 100)) : 0;
  const hasAppleRules = params.some((p) => p.name === 'OS') && params.some((p) => p.name === 'Browser' || p.name === 'Payment');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <p className="font-semibold text-fg">🧮 Pairwise lab</p>
        <p className="text-sm text-muted">
          Pick the parameters and values for a web shop's checkout test. Compare testing every combination with a set where every <strong>pair</strong> of values appears at least once.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {/* Model editor */}
        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">1. Parameters and values</legend>
          {CATALOG.map((p) => {
            const inc = included[p.id];
            return (
              <div key={p.id} className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <label className="flex w-32 shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                  <input type="checkbox" checked={inc} onChange={() => toggleParam(p.id)} className="size-4 accent-[var(--brand)]" />
                  {p.name}
                </label>
                <div className={`flex min-w-0 flex-wrap gap-1.5 ${inc ? '' : 'opacity-40'}`} role="group" aria-label={`${p.name} values`}>
                  {p.values.map((v) => {
                    const active = on[p.id].includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        disabled={!inc}
                        aria-pressed={active}
                        onClick={() => toggleValue(p.id, v)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                          active ? 'border-brand bg-brand-soft text-fg' : 'border-line text-faint line-through hover:text-fg'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-subtle p-3 text-sm text-fg">
            <input type="checkbox" checked={constraints} onChange={() => changeModel(() => setConstraints((c) => !c))} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
            <span>
              <strong>Add constraints</strong>: Safari runs only on macOS and iOS, and this shop offers Apple Pay only on Apple devices.
              {constraints && !hasAppleRules && <span className="block text-xs text-warn">Include OS plus Browser or Payment to see the constraints change anything.</span>}
            </span>
          </label>
        </fieldset>

        {/* Numbers */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-line p-3">
            <p className="text-xs text-muted">Every combination</p>
            <p className="text-2xl font-bold text-fg tabular-nums">{total.toLocaleString('en-US')}</p>
            <p className="truncate text-xs text-faint">
              {params.map((p) => p.values.length).join(' × ')}
              {constraints && validTotal !== total ? ` · ${validTotal.toLocaleString('en-US')} allowed` : ''}
            </p>
          </div>
          <div className="min-w-0 rounded-xl border border-brand bg-brand-soft p-3">
            <p className="text-xs text-muted">Pairwise set</p>
            <p className="text-2xl font-bold text-fg tabular-nums">{generated.length} tests</p>
            <p className="text-xs text-faint">{coverage.required} pairs to cover{constraints ? ' (valid pairs only)' : ''}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-line p-3">
            <p className="text-xs text-muted">Size compared with all</p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-faint">{total ? `${Math.round((generated.length / total) * 1000) / 10}% of all combinations` : '–'}</p>
          </div>
        </div>

        {/* Coverage check */}
        <div className={`rounded-xl p-3 text-sm ${ok ? 'bg-ok-soft' : 'bg-danger-soft'}`} role="status" aria-live="polite">
          <p className="flex items-start gap-2 font-semibold text-fg">
            {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
            <span>
              Coverage check: {coverage.covered} of {coverage.required} pairs covered by {rows.length} rows.
              {ok ? ' Every pair appears at least once.' : ` ${coverage.missing.length} pair${coverage.missing.length === 1 ? ' is' : 's are'} never tested.`}
            </span>
          </p>
          {!ok && (
            <>
              <p className="mt-1 text-xs text-muted">Missing:</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {coverage.missing.slice(0, 12).map((k) => (
                  <li key={k} className="rounded-md border border-danger px-1.5 py-0.5 text-xs text-fg">
                    {describePair(params, k)}
                  </li>
                ))}
                {coverage.missing.length > 12 && <li className="text-xs text-muted">and {coverage.missing.length - 12} more</li>}
              </ul>
            </>
          )}
          <p className="mt-2 text-xs text-muted">
            The check recomputes every pair that can occur{constraints ? ' under the constraints' : ''} and looks for it in the table. Remove a row (×) to see what breaks.
          </p>
        </div>

        {/* Table controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={showPairs} onChange={() => setShowPairs((s) => !s)} className="size-4 accent-[var(--brand)]" />
            Show which pairs each row covers
          </label>
          {removed.length > 0 && (
            <button
              type="button"
              onClick={resetRows}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <RotateCcw size={12} aria-hidden="true" /> Restore {removed.length} removed row{removed.length === 1 ? '' : 's'}
            </button>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={12} aria-hidden="true" /> Reset lab
          </button>
        </div>
        {showPairs && (
          <p className="-mt-2 text-xs text-muted">
            <span className="rounded bg-brand px-1 text-brand-fg">Highlighted</span> pairs are covered by that row only, so removing the row loses them.
          </p>
        )}

        {/* Table */}
        <div className="relative overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[19rem] border-collapse text-left text-xs sm:text-sm">
            <thead className="bg-subtle text-muted">
              <tr>
                <th scope="col" className="px-2 py-2 font-semibold">#</th>
                {params.map((p) => (
                  <th key={p.name} scope="col" className="px-2 py-2 font-semibold">
                    {p.name}
                  </th>
                ))}
                <th scope="col" className="px-2 py-2">
                  <span className="sr-only">Remove row</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {generated.map((row, i) => {
                if (removed.includes(i)) return null;
                const pairs = pairsOfRow(row);
                return (
                  <Fragment key={row.join('-')}>
                    <tr className="border-t border-line text-fg">
                      <td className="px-2 py-1.5 text-faint tabular-nums">{i + 1}</td>
                      {row.map((v, p) => (
                        <td key={p} className="px-2 py-1.5 whitespace-nowrap">
                          {params[p].values[v]}
                        </td>
                      ))}
                      <td className="px-1 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => setRemoved((prev) => (prev.includes(i) ? prev : [...prev, i]))}
                          aria-label={`Remove row ${i + 1}`}
                          className="inline-flex size-7 items-center justify-center rounded-md text-faint hover:bg-subtle hover:text-danger focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                    {showPairs && (
                      <tr className="text-fg">
                        <td />
                        <td colSpan={params.length + 1} className="px-2 pb-2">
                          <ul className="flex flex-wrap gap-1" aria-label={`Pairs covered by row ${i + 1}`}>
                            {pairs.map((k) => {
                              const only = (pairCount.get(k) ?? 0) === 1;
                              return (
                                <li
                                  key={k}
                                  className={`rounded px-1.5 py-0.5 text-[11px] ${only ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted'}`}
                                >
                                  {describePair(params, k)}
                                  {only && <span className="sr-only"> (only this row)</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint">
          Generated with a simple greedy algorithm: it keeps adding the allowed combination that covers the most untested pairs. Real tools like PICT use smarter
          strategies, but the idea is the same.
        </p>
      </div>
    </div>
  );
}
