import { useState } from 'react';
import { CheckCircle2, Eraser, Eye, RotateCcw, XCircle } from 'lucide-react';

/*
 * Practical exercise: fill in the state table for a parking app session.
 * Pick a "brush" (a next state or ✕ invalid), then tap cells to fill them.
 */

const states = ['Active', 'Extended', 'Expired', 'Ended'] as const;
const events = ['Extend', 'Stop', 'Time runs out'] as const;
type Val = (typeof states)[number] | 'invalid';
const brushes: Val[] = ['Active', 'Extended', 'Expired', 'Ended', 'invalid'];

const answer: Record<string, Val> = {
  'Active:Extend': 'Extended',
  'Active:Stop': 'Ended',
  'Active:Time runs out': 'Expired',
  'Extended:Extend': 'invalid',
  'Extended:Stop': 'Ended',
  'Extended:Time runs out': 'Expired',
  'Expired:Extend': 'invalid',
  'Expired:Stop': 'Ended',
  'Expired:Time runs out': 'invalid',
  'Ended:Extend': 'invalid',
  'Ended:Stop': 'invalid',
  'Ended:Time runs out': 'invalid',
};
const why: Record<string, string> = {
  'Active:Extend': 'Rule 2: one extension is allowed from Active.',
  'Active:Stop': 'Rule 4: the driver can stop an active session.',
  'Active:Time runs out': 'Rule 5: when the paid time ends, the session expires.',
  'Extended:Extend': 'Rule 3: only one extension per session, so a second Extend is rejected.',
  'Extended:Stop': 'Rule 4: stopping works in Extended too.',
  'Extended:Time runs out': 'Rule 5: the extended time can also run out.',
  'Expired:Extend': 'Rule 6: an expired session can’t be extended; the driver must start a new one.',
  'Expired:Stop': 'Rule 6: Stop closes an expired session and creates the receipt.',
  'Expired:Time runs out': 'Time already ran out. Nothing changes.',
  'Ended:Extend': 'Rule 7: Ended is final. Extending a finished session would charge for parking nobody uses.',
  'Ended:Stop': 'Rule 7: Ended is final.',
  'Ended:Time runs out': 'Rule 7: Ended is final. A late timer must not flip it to Expired (and send a fine warning).',
};

const show = (v: Val) => (v === 'invalid' ? '✕' : v);

export default function ParkingStateTable() {
  const [brush, setBrush] = useState<Val>('Active');
  const [cells, setCells] = useState<Record<string, Val | undefined>>({});
  const [checked, setChecked] = useState(false);

  const paint = (k: string) => {
    setChecked(false);
    setCells((c) => ({ ...c, [k]: c[k] === brush ? undefined : brush }));
  };
  const keys = Object.keys(answer);
  const filled = keys.filter((k) => cells[k]).length;
  const correct = keys.filter((k) => cells[k] === answer[k]).length;
  const wrong = keys.filter((k) => cells[k] && cells[k] !== answer[k]);
  const empty = keys.filter((k) => !cells[k]);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🅿️ Exercise: the parking session state table</p>
        <p className="text-sm text-muted">Read the spec, then fill every cell: which state does the session move to? Use ✕ when the event must be rejected.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-line p-4 sm:p-5 lg:border-r lg:border-b-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Spec: ParkEasy app</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg marker:text-faint">
            <li>Tapping <strong>Start</strong> creates a session in <strong>Active</strong>.</li>
            <li>An Active session can be <strong>extended once</strong> → Extended.</li>
            <li>Only one extension per session is allowed.</li>
            <li>The driver can <strong>Stop</strong> an Active or Extended session → Ended.</li>
            <li>When the paid time <strong>runs out</strong> in Active or Extended → Expired.</li>
            <li>An Expired session can't be extended. <strong>Stop</strong> closes it → Ended (receipt is created).</li>
            <li>Ended is final: nothing changes it.</li>
          </ol>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">1. Pick a value</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Value to fill">
            {brushes.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={brush === b}
                onClick={() => setBrush(b)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] ${
                  brush === b ? 'border-brand bg-brand text-brand-fg' : 'border-line text-fg hover:border-brand'
                }`}
              >
                {b === 'invalid' ? '✕ Invalid' : b}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-faint uppercase">2. Tap cells to fill them</p>
          <div className="relative overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[19rem] border-collapse text-sm">
              <caption className="sr-only">Parking session state table. Rows are current states, columns are events.</caption>
              <thead>
                <tr className="bg-subtle">
                  <th scope="col" className="px-2 py-2 text-left text-xs font-semibold text-muted">
                    State
                  </th>
                  {events.map((e) => (
                    <th key={e} scope="col" className="px-2 py-2 text-left text-xs font-semibold text-fg">
                      {e}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {states.map((s) => (
                  <tr key={s} className="border-t border-line">
                    <th scope="row" className="px-2 py-1.5 text-left font-semibold whitespace-nowrap text-fg">
                      {s}
                    </th>
                    {events.map((e) => {
                      const k = `${s}:${e}`;
                      const v = cells[k];
                      const state = !checked || !v ? 'none' : v === answer[k] ? 'ok' : 'bad';
                      return (
                        <td key={e} className="p-1">
                          <button
                            type="button"
                            onClick={() => paint(k)}
                            aria-label={`${s}, ${e}: ${v ? show(v) : 'empty'}${state === 'ok' ? ', correct' : state === 'bad' ? ', wrong' : ''}. Fill with ${brush === 'invalid' ? 'invalid' : brush}.`}
                            className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border px-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)] ${
                              state === 'ok'
                                ? 'border-ok/40 bg-ok-soft text-ok'
                                : state === 'bad'
                                  ? 'border-danger/40 bg-danger-soft text-danger'
                                  : v
                                    ? 'border-brand/40 bg-brand-soft text-fg'
                                    : 'border-dashed border-line-strong text-faint hover:border-brand'
                            }`}
                          >
                            {state === 'ok' && <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />}
                            {state === 'bad' && <XCircle size={13} className="shrink-0" aria-hidden="true" />}
                            {v ? show(v) : '?'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChecked(true)}
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            >
              Check my table
            </button>
            <button
              type="button"
              onClick={() => {
                setCells({ ...answer });
                setChecked(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <Eye size={15} /> Show solution
            </button>
            <button
              type="button"
              onClick={() => {
                setCells({});
                setChecked(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <RotateCcw size={15} /> Reset
            </button>
            <span className="ml-auto text-xs text-muted">
              <Eraser size={12} className="mr-1 inline" aria-hidden="true" />
              Tap a cell again with the same value to clear it.
            </span>
          </div>

          <div aria-live="polite">
            {checked && (
              <div className="mt-4 space-y-2 rounded-xl bg-subtle p-3 text-sm ring-1 ring-line">
                <p className="font-semibold text-fg">
                  {correct === keys.length ? '🎉 All 12 cells are right!' : `${correct} of ${keys.length} cells correct${empty.length ? `, ${empty.length} still empty` : ''}.`}
                </p>
                {wrong.length > 0 && (
                  <ul className="space-y-1.5">
                    {wrong.map((k) => (
                      <li key={k} className="flex items-start gap-2 text-muted">
                        <XCircle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                        <span className="min-w-0">
                          <strong className="text-fg">{k.replace(':', ' + ')}:</strong> you put {show(cells[k]!)}. {why[k]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {correct === keys.length && (
                  <p className="text-muted">
                    That gives you <strong className="text-fg">6 valid transitions</strong> and <strong className="text-fg">6 invalid cells</strong>. Every one of the 12 cells is
                    a test case. The ✕ cells, like "Extend in Ended" and "Time runs out in Ended", are where real parking apps charge people twice or send wrong fine
                    warnings.
                  </p>
                )}
                {filled === 0 && <p className="text-muted">Pick a value above and start tapping cells.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
