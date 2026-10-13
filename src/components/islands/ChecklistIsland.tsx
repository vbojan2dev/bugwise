import { useEffect, useState } from 'react';
import { Check, Copy, ListChecks, RotateCcw } from 'lucide-react';

interface Props {
  title?: string;
  items: string[];
  /** Saves progress in the browser when set. */
  storageKey?: string;
}

export default function ChecklistIsland({ title = 'Checklist', items, storageKey }: Props) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const [copied, setCopied] = useState(false);
  const key = storageKey ? `checklist:${storageKey}` : null;

  useEffect(() => {
    if (!key) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (Array.isArray(saved) && saved.length === items.length) setDone(saved);
    } catch {}
  }, [key, items.length]);

  const persist = (next: boolean[]) => {
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    }
  };
  const update = (next: boolean[]) => {
    setDone(next);
    persist(next);
  };
  // Functional update, so quick successive clicks never work from stale state.
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = prev.map((d, j) => (j === i ? !d : d));
      persist(next);
      return next;
    });

  const count = done.filter(Boolean).length;
  const pct = Math.round((count / items.length) * 100);

  const copy = async () => {
    const text = `${title}\n` + items.map((i) => `- [ ] ${i}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <ListChecks size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted">
            {count} of {items.length} checked
          </p>
        </div>
        <button
          type="button"
          onClick={() => update(items.map(() => false))}
          className="grid size-8 place-items-center rounded-lg text-faint hover:bg-subtle hover:text-fg"
          aria-label="Reset checklist"
          title="Reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-muted hover:text-fg"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="h-1 bg-subtle">
        <div className="h-full bg-gradient-to-r from-brand to-brand-2 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-subtle/60">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={done[i]}
                onChange={() => toggle(i)}
              />
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${
                  done[i] ? 'border-ok bg-ok text-white' : 'border-line-strong'
                }`}
              >
                {done[i] && <Check size={13} strokeWidth={3.5} />}
              </span>
              <span className={`text-[0.95rem] leading-relaxed transition-colors ${done[i] ? 'text-faint line-through' : 'text-fg'}`}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
