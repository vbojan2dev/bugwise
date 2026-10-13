import { useState } from 'react';
import { ArrowRight, Minus, Plus, RotateCcw } from 'lucide-react';

/*
 * Offset vs cursor pagination when the data changes between page loads.
 * Page 1 is a fixed snapshot (what the user saw). Then new listings are added at the top
 * or a listing from page 1 sells out. "Next page" shows what each strategy returns.
 */

interface Item {
  id: number;
  name: string;
}
const NAMES = ['City bike', 'Desk chair', 'Coffee grinder', 'Guitar', 'Snowboard', 'Air fryer', 'Bookshelf', 'Camera lens', 'Kayak paddle', 'Lamp', 'Monitor 27"', 'Rice cooker'];
const NEW_NAMES = ['Road helmet', 'Gaming mouse', 'Plant pot', 'Yoga mat'];
const INITIAL: Item[] = NAMES.map((name, i) => ({ id: i + 1, name }));
const SIZE = 4;

export default function ShiftingData() {
  const [data, setData] = useState<Item[]>(INITIAL);
  const [page, setPage] = useState<1 | 2>(1);
  const [added, setAdded] = useState(0);
  const [removed, setRemoved] = useState<number | null>(null);
  const page1 = INITIAL.slice(0, SIZE);
  const seen = new Set(page1.map((i) => i.id));
  const lastSeen = page1[SIZE - 1].id;

  const add = () => {
    if (page !== 1 || added >= NEW_NAMES.length) return;
    setAdded((a) => a + 1);
    setData((d) => {
      const n = d.filter((x) => x.id >= 100).length;
      return [{ id: 100 + n, name: `${NEW_NAMES[n]} (new)` }, ...d];
    });
  };
  const remove = () => {
    if (page !== 1 || removed !== null) return;
    const victim = page1[1].id;
    setRemoved(victim);
    setData((d) => d.filter((x) => x.id !== victim));
  };
  const reset = () => {
    setData(INITIAL);
    setPage(1);
    setAdded(0);
    setRemoved(null);
  };

  const offsetPage = data.slice(SIZE, SIZE * 2);
  const idx = data.findIndex((x) => x.id === lastSeen);
  const cursorPage = data.slice(idx + 1, idx + 1 + SIZE);
  const firstOffsetIdx = data.findIndex((x) => x.id === offsetPage[0]?.id);
  const missing = firstOffsetIdx > idx ? data.slice(idx + 1, firstOffsetIdx).filter((x) => !seen.has(x.id)) : [];

  const column = (title: string, sub: string, items: Item[], showProblems: boolean) => (
    <div className="min-w-0 rounded-xl bg-white p-3 text-[#0e1120]">
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mb-2 truncate font-mono text-[11px] text-black/50">{sub}</p>
      <ol className="space-y-1">
        {items.map((it) => {
          const dup = showProblems && seen.has(it.id);
          return (
            <li key={it.id} className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[13px] ${dup ? 'bg-[#fde8e8] text-[#9b1c1c]' : 'bg-black/[0.04]'}`}>
              <span className="min-w-0 truncate">{it.name}</span>
              {dup && <span className="shrink-0 text-[10px] font-semibold uppercase">seen on page 1</span>}
            </li>
          );
        })}
      </ol>
      {showProblems && missing.length > 0 && (
        <p className="mt-2 rounded-md bg-[#fff4e5] px-2 py-1 text-[12px] text-[#8a4b00]">Never shown: {missing.map((m) => m.name).join(', ')}</p>
      )}
      {showProblems && missing.length === 0 && items.every((i) => !seen.has(i.id)) && <p className="mt-2 text-[12px] text-[#1f7a3f]">No duplicates, nothing skipped.</p>}
      {!showProblems && <p className="mt-2 text-[12px] text-[#1f7a3f]">Continues right after “{page1[SIZE - 1].name}”.</p>}
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 text-sm">
        <button type="button" onClick={add} disabled={page !== 1 || added >= NEW_NAMES.length} className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-1.5 font-medium hover:text-brand disabled:opacity-40">
          <Plus size={14} /> New listing posted
        </button>
        <button type="button" onClick={remove} disabled={page !== 1 || removed !== null} className="flex items-center gap-1.5 rounded-lg bg-subtle px-3 py-1.5 font-medium hover:text-brand disabled:opacity-40">
          <Minus size={14} /> A page-1 item sells out
        </button>
        <button type="button" onClick={() => setPage(2)} disabled={page === 2} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 font-medium text-brand-fg disabled:opacity-40">
          Next page <ArrowRight size={14} />
        </button>
        <button type="button" onClick={reset} className="ml-auto flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
      <div className="bg-[#e9ebf2] p-4" style={{ colorScheme: 'light' }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-xl bg-white p-3 text-[#0e1120]">
            <p className="text-[13px] font-semibold">Page 1 (what you saw)</p>
            <p className="mb-2 font-mono text-[11px] text-black/50">newest first</p>
            <ol className="space-y-1">
              {page1.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 rounded-md bg-black/[0.04] px-2 py-1 text-[13px]">
                  <span className={`min-w-0 truncate ${removed === it.id ? 'line-through opacity-50' : ''}`}>{it.name}</span>
                  {removed === it.id && <span className="shrink-0 text-[10px] font-semibold text-black/50 uppercase">sold</span>}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[12px] text-black/55">
              Since then: {added} new, {removed !== null ? 1 : 0} removed
            </p>
          </div>
          {page === 2 ? (
            <>
              {column('Page 2 by offset', '?page=2 → skip 4, take 4', offsetPage, true)}
              {column('Page 2 by cursor', `?after=${lastSeen} → items after “${page1[SIZE - 1].name}”`, cursorPage, false)}
            </>
          ) : (
            <div className="grid min-w-0 place-items-center rounded-xl border-2 border-dashed border-black/15 p-4 text-center text-[13px] text-black/55 md:col-span-2">
              Change the data with the buttons above, then press “Next page”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
