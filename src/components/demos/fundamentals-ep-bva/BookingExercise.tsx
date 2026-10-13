import { useState } from 'react';
import { BedDouble, CheckCircle2, Circle, Eye, RotateCcw } from 'lucide-react';

/**
 * Practical exercise: derive EP + BVA test values for a small hotel booking spec,
 * then compare them with a model answer. Values are analyzed per field.
 */

type Token = { raw: string; kind: 'empty' | 'text' | 'num'; n?: number };
type Check = { label: string; hit: (t: Token[]) => boolean };
type FieldSpec = {
  id: string;
  name: string;
  rule: string;
  hint: string;
  partitions: Check[];
  boundaries2: number[];
  boundaries3: number[];
};

const nums = (t: Token[]) => t.filter((x) => x.kind === 'num').map((x) => x.n!);
const has = (t: Token[], f: (n: number) => boolean) => nums(t).some(f);

const FIELDS: FieldSpec[] = [
  {
    id: 'nights',
    name: 'Nights',
    rule: '1 to 30 whole nights',
    hint: 'e.g. 0, 1, 15',
    partitions: [
      { label: 'Valid: 1–30', hit: (t) => has(t, (n) => Number.isInteger(n) && n >= 1 && n <= 30) },
      { label: 'Invalid: 0 or less', hit: (t) => has(t, (n) => n <= 0) },
      { label: 'Invalid: 31 or more', hit: (t) => has(t, (n) => n >= 31) },
      { label: 'Invalid: empty', hit: (t) => t.some((x) => x.kind === 'empty') },
      { label: 'Invalid: not a whole number (abc, 2.5)', hit: (t) => t.some((x) => x.kind === 'text') || has(t, (n) => !Number.isInteger(n)) },
    ],
    boundaries2: [0, 1, 30, 31],
    boundaries3: [2, 29],
  },
  {
    id: 'guests',
    name: 'Guests',
    rule: '1 to 4 guests per room',
    hint: 'e.g. 0, 1, 4, 5',
    partitions: [
      { label: 'Valid: 1–4', hit: (t) => has(t, (n) => Number.isInteger(n) && n >= 1 && n <= 4) },
      { label: 'Invalid: 0 or less', hit: (t) => has(t, (n) => n <= 0) },
      { label: 'Invalid: 5 or more', hit: (t) => has(t, (n) => n >= 5) },
      { label: 'Invalid: empty', hit: (t) => t.some((x) => x.kind === 'empty') },
      { label: 'Invalid: not a whole number (two, 1.5)', hit: (t) => t.some((x) => x.kind === 'text') || has(t, (n) => !Number.isInteger(n)) },
    ],
    boundaries2: [0, 1, 4, 5],
    boundaries3: [2, 3],
  },
  {
    id: 'checkin',
    name: 'Check-in',
    rule: 'today up to 365 days ahead (enter days from today: -1 = yesterday, 0 = today)',
    hint: 'e.g. -1, 0, 30',
    partitions: [
      { label: 'Valid: today to +365 days', hit: (t) => has(t, (n) => n >= 0 && n <= 365) },
      { label: 'Invalid: in the past', hit: (t) => has(t, (n) => n < 0) },
      { label: 'Invalid: more than 365 days ahead', hit: (t) => has(t, (n) => n > 365) },
      { label: 'Invalid: no date chosen', hit: (t) => t.some((x) => x.kind === 'empty') },
    ],
    boundaries2: [-1, 0, 365, 366],
    boundaries3: [1, 364],
  },
];

function parse(raw: string): Token[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (/^(empty|blank|none|\(blank\))$/i.test(s)) return { raw: s, kind: 'empty' as const };
      const n = Number(s.replace(/^\+/, ''));
      return /^[+-]?\d+(\.\d+)?$/.test(s) && Number.isFinite(n) ? { raw: s, kind: 'num' as const, n } : { raw: s, kind: 'text' as const };
    });
}

const MODEL = [
  { id: 'TC-01', what: 'Valid booking (all valid partitions combined)', data: '3 nights · 2 guests · check-in +7 days', exp: 'Booking summary shown' },
  { id: 'TC-02', what: 'Shortest and smallest valid stay', data: '1 night · 1 guest · check-in today', exp: 'Accepted' },
  { id: 'TC-03', what: 'Longest and largest valid stay', data: '30 nights · 4 guests · check-in +365', exp: 'Accepted' },
  { id: 'TC-04', what: 'Nights below minimum', data: '0 nights', exp: '"Choose at least 1 night"' },
  { id: 'TC-05', what: 'Nights above maximum', data: '31 nights', exp: '"Max 30 nights"' },
  { id: 'TC-06', what: 'Nights empty / not a number', data: 'blank · "abc" · 2.5', exp: 'Error, no crash (one test each)' },
  { id: 'TC-07', what: 'Guests below minimum', data: '0 guests', exp: '"At least 1 guest"' },
  { id: 'TC-08', what: 'Guests above maximum', data: '5 guests', exp: '"Max 4 guests per room"' },
  { id: 'TC-09', what: 'Guests empty / not a number', data: 'blank · "two" · 1.5', exp: 'Error, no crash (one test each)' },
  { id: 'TC-10', what: 'Check-in in the past', data: 'yesterday (-1)', exp: 'Date disabled or error' },
  { id: 'TC-11', what: 'Check-in too far ahead', data: '+366 days', exp: 'Date disabled or error' },
  { id: 'TC-12', what: 'No check-in date', data: 'blank', exp: '"Choose a check-in date"' },
];

export default function BookingExercise() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState(false);

  return (
    <div className="not-prose relative my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <BedDouble size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">✍️ Exercise: hotel booking form</p>
          <p className="text-sm text-muted">Write the EP and BVA values you would test for each field, then compare with the model answer.</p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="rounded-2xl bg-brand-soft p-4 text-sm text-fg">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Spec · Travel app · "Book a room"</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            <li>
              <strong>Nights:</strong> 1 to 30 whole nights.
            </li>
            <li>
              <strong>Guests:</strong> 1 to 4 guests per room.
            </li>
            <li>
              <strong>Check-in date:</strong> not in the past; at most 365 days ahead.
            </li>
            <li>All three fields are required.</li>
          </ul>
        </div>
        <p className="text-xs text-muted">
          Separate values with commas. Type <code className="rounded bg-subtle px-1">empty</code> for a blank field and any word (like{' '}
          <code className="rounded bg-subtle px-1">abc</code>) for non-numeric input.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.id} className="block min-w-0">
              <span className="block text-sm font-semibold">{f.name}</span>
              <span className="block text-xs text-muted">{f.rule}</span>
              <textarea
                value={values[f.id] ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setValues((p) => ({ ...p, [f.id]: v }));
                }}
                rows={2}
                placeholder={f.hint}
                className="mt-1.5 w-full min-w-0 resize-y rounded-lg border border-line bg-surface p-2 font-mono text-sm text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShown(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Eye size={15} /> Compare with model answer
          </button>
          <button
            type="button"
            onClick={() => {
              setValues({});
              setShown(false);
            }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted ring-1 ring-line hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <RotateCcw size={15} /> Clear
          </button>
        </div>

        {shown && (
          <div className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {FIELDS.map((f) => {
                const t = parse(values[f.id] ?? '');
                const ns = nums(t);
                const pHit = f.partitions.filter((p) => p.hit(t)).length;
                const b2Hit = f.boundaries2.filter((b) => ns.includes(b)).length;
                return (
                  <div key={f.id} className="min-w-0 rounded-2xl border border-line bg-subtle p-3 text-sm">
                    <p className="font-semibold">{f.name}</p>
                    <p className="mt-2 text-xs font-semibold tracking-wide text-faint uppercase">
                      Partitions {pHit}/{f.partitions.length}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {f.partitions.map((p) => {
                        const ok = p.hit(t);
                        return (
                          <li key={p.label} className={`flex items-start gap-1.5 ${ok ? 'text-fg' : 'text-muted'}`}>
                            {ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" /> : <Circle size={14} className="mt-0.5 shrink-0 text-faint" />}
                            <span className="min-w-0">{p.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">
                      Boundaries (2-value) {b2Hit}/{f.boundaries2.length}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f.boundaries2.map((b) => (
                        <span
                          key={b}
                          className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${ns.includes(b) ? 'bg-ok-soft text-ok' : 'bg-surface text-muted ring-1 ring-line'}`}
                        >
                          {b}
                        </span>
                      ))}
                      {f.boundaries3.map((b) => (
                        <span
                          key={b}
                          title="3-value extra"
                          className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${ns.includes(b) ? 'bg-ok-soft text-ok' : 'bg-surface text-faint ring-1 ring-line'}`}
                        >
                          +{b}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-faint">Values marked + are the extra 3-value BVA neighbors.</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold">Model answer: 12 test cases</p>
              <p className="mt-1 text-sm text-muted">
                Valid values are combined (TC-01 to TC-03). Each invalid value gets its own test, with the other fields valid, so you know exactly which
                one caused the error.
              </p>
              <ol className="mt-3 space-y-2">
                {MODEL.map((m) => (
                  <li key={m.id} className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-2 border-t border-line pt-2 text-sm first:border-t-0 first:pt-0">
                    <span className="font-mono text-xs font-semibold text-brand">{m.id}</span>
                    <span className="min-w-0">
                      <span className="font-medium text-fg">{m.what}</span>
                      <span className="block text-muted">
                        <span className="font-mono text-xs">{m.data}</span> → {m.exp}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted">
                3-value BVA would add 2 and 29 nights, 2 and 3 guests, and check-in +1 and +364 days. They fit nicely into extra valid combinations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
