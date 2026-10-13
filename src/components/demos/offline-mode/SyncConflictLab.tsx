import { useState } from 'react';
import { ArrowDown, CircleAlert, CircleCheck, Smartphone, TriangleAlert } from 'lucide-react';

/*
 * Conflict lab: two people edit the same shopping-list item while one of them is offline.
 * Pick what each one changes, who syncs last and the conflict strategy, and see what survives.
 * Teaching demo, no bugs.
 */

type Strategy = 'lww' | 'merge' | 'ask';
type Last = 'mia' | 'leo';
type LeoEdit = 'note' | 'qty';
interface Rec {
  qty: number;
  note: string;
}

const BASE: Rec = { qty: 6, note: '' };
const MIA: Partial<Rec> = { qty: 12 };

function fmt(r: Rec) {
  return `Eggs × ${r.qty}${r.note ? ` (${r.note})` : ''}`;
}

function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              value === o.id ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-fg hover:bg-subtle'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function SyncConflictLab() {
  const [leoEdit, setLeoEdit] = useState<LeoEdit>('note');
  const [last, setLast] = useState<Last>('mia');
  const [strategy, setStrategy] = useState<Strategy>('lww');
  const [choice, setChoice] = useState<'mine' | 'theirs' | 'both' | null>(null);

  const leo: Partial<Rec> = leoEdit === 'note' ? { note: 'free range' } : { qty: 10 };
  const miaRec: Rec = { ...BASE, ...MIA };
  const leoRec: Rec = { ...BASE, ...leo };
  const lastRec = last === 'mia' ? miaRec : leoRec;
  const firstName = last === 'mia' ? 'Leo' : 'Mia';
  const lastName = last === 'mia' ? 'Mia' : 'Leo';
  const sameField = leoEdit === 'qty';

  let result: Rec | null;
  let tone: 'ok' | 'warn' | 'bad';
  let verdict: string;

  if (strategy === 'lww') {
    result = lastRec;
    tone = 'bad';
    verdict = `${lastName} synced last, so the whole item is replaced with ${lastName}'s version. ${firstName}'s change is gone, and nobody was told.`;
  } else if (strategy === 'merge') {
    if (!sameField) {
      result = { ...BASE, ...MIA, ...leo };
      tone = 'ok';
      verdict = 'They changed different fields (quantity vs note), so both changes are kept. Nothing is lost.';
    } else {
      result = lastRec;
      tone = 'warn';
      verdict = `Both changed the quantity (12 vs 10). Merging can't decide, so the app falls back to a rule (here: last write wins for that field). ${firstName}'s quantity is lost.`;
    }
  } else {
    if (choice === null) {
      result = null;
      tone = 'warn';
      verdict = `${lastName}'s phone shows a conflict message. Pick an answer in the dialog.`;
    } else {
      const mine = lastRec;
      const theirs = last === 'mia' ? leoRec : miaRec;
      result = choice === 'mine' ? mine : choice === 'theirs' ? theirs : null;
      tone = 'ok';
      verdict = choice === 'both' ? 'Both versions are kept as two items. The user decided, so nothing was lost silently.' : 'The user decided which version to keep, knowing about the other one.';
    }
  }

  const toneCls = { ok: 'border-ok/40 bg-ok-soft', warn: 'border-warn/40 bg-warn-soft', bad: 'border-danger/40 bg-danger-soft' }[tone];
  const ToneIcon = tone === 'ok' ? CircleCheck : tone === 'warn' ? TriangleAlert : CircleAlert;
  const toneText = { ok: 'text-ok', warn: 'text-warn', bad: 'text-danger' }[tone];

  const reset = (fn: () => void) => {
    fn();
    setChoice(null);
  };

  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Pick
          label="Leo (online) changes"
          value={leoEdit}
          options={[
            { id: 'note', label: 'Note: free range' },
            { id: 'qty', label: 'Quantity: 10' },
          ]}
          onChange={(v) => reset(() => setLeoEdit(v))}
        />
        <Pick
          label="Who syncs last"
          value={last}
          options={[
            { id: 'mia', label: 'Mia' },
            { id: 'leo', label: 'Leo' },
          ]}
          onChange={(v) => reset(() => setLast(v))}
        />
        <Pick
          label="Conflict strategy"
          value={strategy}
          options={[
            { id: 'lww', label: 'Last write wins' },
            { id: 'merge', label: 'Merge fields' },
            { id: 'ask', label: 'Ask the user' },
          ]}
          onChange={(v) => reset(() => setStrategy(v))}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="min-w-0 rounded-xl bg-subtle p-3 text-sm">
          <p className="text-xs font-semibold text-muted">Before (both phones)</p>
          <p className="mt-1 font-medium text-fg">{fmt(BASE)}</p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3 text-sm">
          <p className="flex items-center gap-1 text-xs font-semibold text-muted">
            <Smartphone size={12} aria-hidden="true" /> Mia, offline in the shop
          </p>
          <p className="mt-1 font-medium text-fg">{fmt(miaRec)}</p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3 text-sm">
          <p className="flex items-center gap-1 text-xs font-semibold text-muted">
            <Smartphone size={12} aria-hidden="true" /> Leo, online at home
          </p>
          <p className="mt-1 font-medium text-fg">{fmt(leoRec)}</p>
        </div>
      </div>

      <div className="my-2 flex justify-center text-faint">
        <ArrowDown size={18} aria-hidden="true" />
      </div>

      {strategy === 'ask' && choice === null && (
        <div className="mx-auto max-w-xs rounded-2xl bg-[#f2f2f7] p-4 text-center text-black" style={{ colorScheme: 'light' }} role="group" aria-label="Conflict dialog">
          <p className="text-[15px] font-semibold">This item was changed on another phone</p>
          <p className="mt-1 text-[13px] text-black/60">
            You: {fmt(lastRec)}
            <br />
            {firstName}: {fmt(last === 'mia' ? leoRec : miaRec)}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-1.5 text-[14px] font-medium text-[#007aff]">
            <button type="button" onClick={() => setChoice('mine')} className="rounded-lg bg-white py-2 focus-visible:outline-2 focus-visible:outline-[#007aff]">
              Keep mine
            </button>
            <button type="button" onClick={() => setChoice('theirs')} className="rounded-lg bg-white py-2 focus-visible:outline-2 focus-visible:outline-[#007aff]">
              Keep {firstName}&rsquo;s
            </button>
            <button type="button" onClick={() => setChoice('both')} className="rounded-lg bg-white py-2 focus-visible:outline-2 focus-visible:outline-[#007aff]">
              Keep both
            </button>
          </div>
        </div>
      )}

      <div className={`mt-2 rounded-xl border p-3 text-sm ${toneCls}`} aria-live="polite">
        {(result || choice === 'both') && (
          <p className="font-semibold text-fg">
            After sync, both phones show: {choice === 'both' && strategy === 'ask' ? `${fmt(miaRec)} and ${fmt(leoRec)}` : result ? fmt(result) : ''}
          </p>
        )}
        <p className="mt-1 flex items-start gap-1.5 text-fg">
          <ToneIcon size={16} className={`mt-0.5 shrink-0 ${toneText}`} aria-hidden="true" />
          <span className="min-w-0">{verdict}</span>
        </p>
        {strategy === 'ask' && choice !== null && (
          <button type="button" onClick={() => setChoice(null)} className="mt-2 text-xs font-semibold text-brand underline">
            Show the dialog again
          </button>
        )}
      </div>
    </div>
  );
}
