import { useId, useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { normalize } from './Dropdown';

const cities = [
  'Zagreb',
  'Šibenik',
  'Split',
  'Čakovec',
  'Đakovo',
  'Osijek',
  'Beograd',
  'Niš',
  'Novi Sad',
  'Ljubljana',
  'Kraków',
  'Łódź',
  'Gdańsk',
  'Zürich',
  'München',
  'Köln',
  'Malmö',
  'Wien',
  'Brno',
  'Plzeň',
  'České Budějovice',
  'São Paulo',
  'Ćuprija',
  'Antwerpen',
];

const presets = ['ceske', 'ZAGREB', 'lodz', 'dakovo', ' split ', 'sao paulo', 'munchen', 'nis'];

type SortMode = 'stored' | 'codepoint' | 'locale';
const sorts: { key: SortMode; label: string; note: string }[] = [
  { key: 'stored', label: 'As stored', note: 'The order the data came from the database. Users can\'t predict where anything is.' },
  { key: 'codepoint', label: 'A–Z (naive)', note: 'Sorted by character code: Č, Ć, Đ, Ł and Š land after Z, at the very bottom.' },
  { key: 'locale', label: 'A–Z (locale-aware)', note: 'Sorted with the language\'s rules, so Čakovec comes right after the C… cities.' },
];

function sortList(list: string[], mode: SortMode) {
  if (mode === 'stored') return list;
  const copy = [...list];
  return mode === 'codepoint' ? copy.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)) : copy.sort((a, b) => a.localeCompare(b, 'hr'));
}

export default function SearchLab() {
  const id = useId();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortMode>('stored');

  const naive = sortList(
    cities.filter((c) => c.includes(q)),
    sort,
  );
  const good = sortList(
    cities.filter((c) => normalize(c).includes(normalize(q))),
    sort,
  );
  const missed = good.filter((c) => !naive.includes(c));

  const Col = ({ title, code, items, ok }: { title: string; code: string; items: string[]; ok: boolean }) => (
    <div className="min-w-0 rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <p className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-ok' : 'text-danger'}`}>
          {ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {title}
        </p>
        <p className="mt-0.5 font-mono text-[11px] break-words text-faint">{code}</p>
      </div>
      <ul className="max-h-64 overflow-y-auto p-2 text-sm">
        {items.length === 0 && <li className="px-2 py-1.5 text-muted italic">No results</li>}
        {items.map((c) => (
          <li key={c} className="rounded-md px-2 py-1 text-fg">
            {c}
            {ok && missed.includes(c) && <span className="ml-2 rounded bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-danger">missed by naive</span>}
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        {items.length} of {cities.length} cities
      </p>
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Search &amp; sort lab</p>
        <p className="text-sm text-muted">A long list needs search, and search is where dropdowns break. Type a query (or pick one) and compare a naive search with a robust one.</p>
      </div>
      <div className="space-y-3 border-b border-line bg-subtle px-5 py-4">
        <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-faint uppercase">
          Search query
        </label>
        <div className="flex h-10 max-w-sm items-center gap-2 rounded-lg border border-line bg-surface px-3">
          <Search size={16} className="text-faint" aria-hidden />
          <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. ceske" className="h-full w-0 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none" autoComplete="off" spellCheck={false} />
        </div>
        <div role="group" aria-label="Example queries" className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={q === p}
              onClick={() => setQ(p)}
              className={`rounded-full border px-2.5 py-1 font-mono text-xs whitespace-pre transition-colors ${q === p ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'}`}
            >
              &quot;{p}&quot;
            </button>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Sort order</p>
          <div role="group" aria-label="Sort order" className="inline-flex flex-wrap gap-1 rounded-lg bg-surface p-1 text-xs font-medium ring-1 ring-line">
            {sorts.map((s) => (
              <button key={s.key} type="button" aria-pressed={sort === s.key} onClick={() => setSort(s.key)} className={`rounded-md px-2.5 py-1.5 ${sort === s.key ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-muted">{sorts.find((s) => s.key === sort)!.note}</p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Col title="Naive search" code="label.includes(query)" items={naive} ok={false} />
        <Col title="Robust search" code="ignore case + accents + extra spaces" items={good} ok />
      </div>
      <p className="border-t border-line px-5 py-3 text-sm text-fg">
        {q.trim() === '' ? (
          <span className="text-muted">Empty query: both show the whole list. Now try &quot;ceske&quot; or &quot;lodz&quot;.</span>
        ) : missed.length ? (
          <>
            The naive search <strong className="text-danger">missed {missed.length}</strong> {missed.length === 1 ? 'city' : 'cities'} a real user was looking for. That&apos;s a bug report.
          </>
        ) : (
          <>Both searches agree for this query. Try lowercase, missing accents or extra spaces.</>
        )}
      </p>
    </div>
  );
}
