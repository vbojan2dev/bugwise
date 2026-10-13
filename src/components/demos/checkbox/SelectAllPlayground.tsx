import { useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { Checkbox } from './Checkbox';

const MAILS = [
  { from: 'SkyJet', subject: 'Your boarding pass for Lisbon' },
  { from: 'FreshCart', subject: 'Your groceries are on the way' },
  { from: 'City Gym', subject: 'New spin classes this week' },
  { from: 'Bank of Nowhere', subject: 'Your monthly statement is ready' },
  { from: 'BookNest', subject: '3 hotels you might like' },
];

export default function SelectAllPlayground() {
  const [items, setItems] = useState(MAILS.map((m, i) => ({ ...m, id: i, checked: i === 1 || i === 3 })));
  const total = items.length;
  const count = items.filter((i) => i.checked).length;
  const parent: boolean | 'mixed' = count === 0 ? false : count === total ? true : 'mixed';

  const toggleOne = (id: number) => (v: boolean) => setItems((arr) => arr.map((m) => (m.id === id ? { ...m, checked: v } : m)));
  // Rule used here: unchecked or mixed -> select all; checked -> clear all.
  const toggleAll = () =>
    setItems((arr) => {
      const allOn = arr.length > 0 && arr.every((m) => m.checked);
      return arr.map((m) => ({ ...m, checked: !allOn }));
    });
  const archive = () => setItems((arr) => arr.filter((m) => !m.checked));
  const reset = () => setItems(MAILS.map((m, i) => ({ ...m, id: i, checked: i === 1 || i === 3 })));

  const stateText = parent === 'mixed' ? 'mixed' : String(parent);

  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#fef7ff] text-[#1d1b20]" style={{ colorScheme: 'light' }}>
        <div className="flex items-center gap-1 border-b border-[#cac4d0] bg-white px-2 py-1">
          <Checkbox
            checked={total === 0 ? false : parent}
            disabled={total === 0}
            onChange={toggleAll}
            label={<span className="text-[14px] font-medium">{count > 0 ? `${count} selected` : 'Select all'}</span>}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={archive}
            disabled={count === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#6750a4] hover:bg-[#6750a4]/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Archive size={15} aria-hidden="true" /> Archive
          </button>
        </div>
        <ul className="bg-white px-2 pb-1" aria-label="Inbox">
          {items.map((m) => (
            <li key={m.id} className="border-b border-[#eee8f4] last:border-0">
              <Checkbox
                checked={m.checked}
                onChange={toggleOne(m.id)}
                label={<span className="block truncate font-medium">{m.from}</span>}
                sub={<span className="block truncate">{m.subject}</span>}
              />
            </li>
          ))}
          {items.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-[#49454f]">Inbox zero. Nothing left to select.</li>}
        </ul>
      </div>
      <div className="min-w-0 space-y-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">What the parent should show</p>
        <div className="space-y-1.5 text-sm">
          {[
            { k: 'none', when: 'No child checked', show: 'Unchecked', on: count === 0 },
            { k: 'some', when: 'Some children checked', show: 'Mixed (dash)', on: parent === 'mixed' },
            { k: 'all', when: 'All children checked', show: 'Checked', on: total > 0 && count === total },
          ].map((r) => (
            <div key={r.k} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${r.on ? 'bg-brand-soft font-semibold text-fg' : 'bg-subtle text-muted'}`}>
              <span className="min-w-0">{r.when}</span>
              <span className="shrink-0">{r.show}</span>
            </div>
          ))}
        </div>
        <p className="rounded-lg bg-[#0e1120] px-3 py-2 font-mono text-[12px] break-words text-[#c9cde0]">
          {count}/{total} selected · aria-checked=&quot;{total === 0 ? 'false' : stateText}&quot;
        </p>
        <p className="text-sm text-muted">
          Try: uncheck one email, check them all one by one, click the parent while it shows a dash, archive everything. The count, the parent and the Archive button must always agree.
        </p>
        <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}
