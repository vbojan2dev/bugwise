import { useId, type ReactNode } from 'react';

export const inputCls =
  'w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30';

export function Field({ label, hint, children, id }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="min-w-0">
      <label htmlFor={fid} className="block text-sm font-semibold">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
      <div className="mt-1.5">{children(fid)}</div>
    </div>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 4, placeholder }: { label: string; hint?: ReactNode; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls + ' resize-y leading-relaxed'} />}
    </Field>
  );
}

/** Small buttons that append a suggestion line to a textarea value. */
export function Suggestions({ items, value, onAdd, label = 'Ideas:' }: { items: string[]; value: string; onAdd: (line: string) => void; label?: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-faint">{label}</span>
      {items.map((it) => {
        const used = value.includes(it);
        return (
          <button
            key={it}
            type="button"
            disabled={used}
            onClick={() => onAdd(it)}
            className="rounded-full border border-line bg-subtle px-2.5 py-1 text-xs text-muted hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted"
          >
            + {it}
          </button>
        );
      })}
    </div>
  );
}

export const appendLine = (value: string, line: string) => (value.trim() ? value.replace(/\s+$/, '') + '\n' : '') + '- ' + line;

export function Rubric({ items, checked, onToggle, title = 'Self-check rubric' }: { items: { id: string; text: ReactNode }[]; checked: Record<string, boolean>; onToggle: (id: string) => void; title?: string }) {
  const n = items.filter((i) => checked[i.id]).length;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted tabular-nums">
          {n} / {items.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Compare honestly with the model and tick what your version already does.</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--brand)]" checked={!!checked[i.id]} onChange={() => onToggle(i.id)} />
              <span>{i.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
