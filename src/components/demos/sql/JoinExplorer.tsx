import { useState } from 'react';

/*
 * Shows how INNER JOIN, LEFT JOIN and "LEFT JOIN ... WHERE right side IS NULL" treat
 * an order that has no items. Pure React, no database needed.
 */

type Mode = 'inner' | 'left' | 'missing';

const ORDERS = [
  { id: 1001, total: '21.40' },
  { id: 1009, total: '9.50' },
  { id: 1010, total: '13.40' },
];
const ITEMS = [
  { id: 1, order_id: 1001, dish: 'Margherita' },
  { id: 2, order_id: 1001, dish: 'Diavola' },
  { id: 17, order_id: 1009, dish: 'Margherita' },
];

const MODES: { id: Mode; label: string; sql: string; text: string }[] = [
  {
    id: 'inner',
    label: 'INNER JOIN',
    sql: 'SELECT o.id, o.total, oi.dish\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id;',
    text: 'Only orders that have a matching item. Order 1010 has none, so it silently disappears from the result.',
  },
  {
    id: 'left',
    label: 'LEFT JOIN',
    sql: 'SELECT o.id, o.total, oi.dish\nFROM orders o\nLEFT JOIN order_items oi ON oi.order_id = o.id;',
    text: 'Every order is kept. Where there is no matching item, the item columns are filled with NULL.',
  },
  {
    id: 'missing',
    label: 'LEFT JOIN + IS NULL',
    sql: 'SELECT o.id, o.total\nFROM orders o\nLEFT JOIN order_items oi ON oi.order_id = o.id\nWHERE oi.id IS NULL;',
    text: 'Keep only the rows where the right side is missing: the classic tester query for "orders without items".',
  },
];

type Row = { id: number; total: string; dish: string | null };

function resultFor(mode: Mode): Row[] {
  const rows: Row[] = [];
  for (const o of ORDERS) {
    const items = ITEMS.filter((i) => i.order_id === o.id);
    if (items.length === 0) {
      if (mode !== 'inner') rows.push({ id: o.id, total: o.total, dish: null });
    } else if (mode !== 'missing') {
      for (const i of items) rows.push({ id: o.id, total: o.total, dish: i.dish });
    }
  }
  return rows;
}

const cell = 'border-b border-line/70 px-2 py-1 whitespace-nowrap';

export default function JoinExplorer() {
  const [mode, setMode] = useState<Mode>('inner');
  const m = MODES.find((x) => x.id === mode)!;
  const rows = resultFor(mode);
  const kept = new Set(rows.map((r) => r.id));
  const showDish = mode !== 'missing';

  return (
    <div className="not-prose @container my-6 w-full min-w-0 rounded-2xl border border-line bg-surface p-3 text-fg @md:p-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Join type">
        {MODES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={mode === x.id}
            onClick={() => setMode(x.id)}
            className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              mode === x.id ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:bg-subtle hover:text-fg'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 @xl:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs font-semibold text-muted">orders</p>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full font-mono text-[12px]">
              <thead className="bg-subtle text-left">
                <tr>
                  <th className={cell}>id</th>
                  <th className={cell}>total</th>
                </tr>
              </thead>
              <tbody>
                {ORDERS.map((o) => (
                  <tr key={o.id} className={kept.has(o.id) ? '' : 'text-faint line-through'}>
                    <td className={cell}>{o.id}</td>
                    <td className={cell}>{o.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs font-semibold text-muted">order_items</p>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full font-mono text-[12px]">
              <thead className="bg-subtle text-left">
                <tr>
                  <th className={cell}>id</th>
                  <th className={cell}>order_id</th>
                  <th className={cell}>dish</th>
                </tr>
              </thead>
              <tbody>
                {ITEMS.map((i) => (
                  <tr key={i.id} className={mode === 'missing' ? 'text-faint' : ''}>
                    <td className={cell}>{i.id}</td>
                    <td className={cell}>{i.order_id}</td>
                    <td className={cell}>{i.dish}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-subtle p-2.5 font-mono text-[12px] leading-relaxed text-fg">{m.sql}</pre>

      <p className="mt-3 mb-1 text-xs font-semibold text-muted">
        Result: {rows.length} row{rows.length === 1 ? '' : 's'}
      </p>
      <div className="overflow-x-auto rounded-lg border border-brand/40">
        <table className="min-w-full font-mono text-[12px]">
          <thead className="bg-brand-soft text-left">
            <tr>
              <th className={cell}>id</th>
              <th className={cell}>total</th>
              {showDish && <th className={cell}>dish</th>}
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map((r, i) => (
              <tr key={`${r.id}-${i}`} className={r.dish === null ? 'bg-warn-soft' : ''}>
                <td className={cell}>{r.id}</td>
                <td className={cell}>{r.total}</td>
                {showDish && <td className={cell}>{r.dish ?? <span className="text-faint italic">NULL</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-muted">{m.text}</p>
    </div>
  );
}
