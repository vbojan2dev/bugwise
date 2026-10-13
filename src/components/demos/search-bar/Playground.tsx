import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Keyboard } from 'lucide-react';
import { IOSSearchField, fold } from './SearchBar';

const catalog = ['iPhone case, clear', 'AirPods Pro (2nd gen)', 'Running sneakers', 'Crème brûlée torch', 'Pizza stone', 'Café au lait bowl', 'USB-C charger'];

/** Words the simulated keyboard "corrects" (a realistic autocorrect surprise). */
const corrections: Record<string, string> = { airpods: 'airports' };

const presets = [
  { label: 'iphone case', text: 'iphone case' },
  { label: 'airpods', text: 'airpods' },
  { label: '␣␣sneakers␣␣', text: '  sneakers  ' },
  { label: 'creme brulee', text: 'creme brulee' },
  { label: '🍕 stone', text: '🍕 stone' },
  { label: 'only spaces', text: '   ' },
  { label: 'very long', text: 'wireless noise canceling over-ear headphones with a really long battery life and a carrying case for travel and the gym please' },
];

interface Settings {
  autoCap: boolean;
  autoCorrect: boolean;
  trim: boolean;
  fold: boolean;
  blockBlank: boolean;
}
type Flag = 'cap' | 'correct';

/** Simulates what a phone keyboard does when one character is typed. */
function typeChar(prev: string, ch: string, s: Settings, flags: Set<Flag>): string {
  let next = prev;
  if (ch === ' ' && s.autoCorrect) {
    const m = prev.match(/(\S+)$/);
    const fix = m && corrections[m[1].toLowerCase()];
    if (m && fix) {
      next = prev.slice(0, prev.length - m[1].length) + fix;
      flags.add('correct');
    }
  }
  let c = ch;
  if (s.autoCap && prev.trim() === '' && /[a-z]/.test(ch)) {
    c = ch.toUpperCase();
    flags.add('cap');
  }
  return next + c;
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
      <p className="text-xs font-semibold tracking-wide text-faint uppercase">{title}</p>
      {children}
    </div>
  );
}

interface Sent {
  raw: string;
  query: string | null;
  results: string[];
  wouldMatch: number;
  flags: Flag[];
}

export default function Playground() {
  const [s, setS] = useState<Settings>({ autoCap: true, autoCorrect: true, trim: false, fold: false, blockBlank: false });
  const [value, setValue] = useState('');
  const [flags, setFlags] = useState<Set<Flag>>(new Set());
  const [sent, setSent] = useState<Sent | null>(null);
  const set = (k: keyof Settings) => (v: boolean) => setS((p) => ({ ...p, [k]: v }));

  const onType = (next: string) => {
    // Appending exactly one character = typing; anything else (paste, delete, clear) is taken as is.
    if (next.length === value.length + 1 && next.startsWith(value)) {
      const f = new Set(flags);
      setValue(typeChar(value, next.slice(-1), s, f));
      setFlags(f);
    } else {
      setValue(next);
      if (next === '') setFlags(new Set());
    }
  };

  const typePreset = (text: string) => {
    const f = new Set<Flag>();
    let v = '';
    for (const ch of text) v = typeChar(v, ch, s, f);
    setValue(v);
    setFlags(f);
    setSent(null);
  };

  const submit = () => {
    const f = new Set(flags);
    let raw = value;
    // Pressing Search also accepts a pending autocorrection of the last word.
    if (s.autoCorrect) {
      const m = raw.match(/(\S+)$/);
      const fix = m && corrections[m[1].toLowerCase()];
      if (m && fix) {
        raw = raw.slice(0, raw.length - m[1].length) + fix;
        f.add('correct');
      }
    }
    setValue(raw);
    setFlags(f);
    const q = s.trim ? raw.trim().replace(/\s+/g, ' ') : raw;
    if (s.blockBlank && q.trim() === '') {
      setSent({ raw, query: null, results: [], wouldMatch: 0, flags: [...f] });
      return;
    }
    const results = catalog.filter((c) => (s.fold ? fold(c).includes(fold(q)) : c.includes(q)));
    const wouldMatch = q.trim() ? catalog.filter((c) => fold(c).includes(fold(q))).length : catalog.length;
    setSent({ raw, query: q, results, wouldMatch, flags: [...f] });
  };

  const issues: string[] = [];
  if (sent) {
    const q = sent.query;
    if (sent.flags.includes('cap')) issues.push('The keyboard capitalized the first letter. Search fields should turn auto-capitalization off (autocapitalize="none" on the web, .none on iOS).');
    if (sent.flags.includes('correct')) issues.push('Autocorrect changed what the user typed ("airpods" → "airports"). Product names, brands and codes get "fixed" into other words. Turn autocorrect off for search.');
    if (q !== null && q.trim() === '') issues.push(`A blank query was sent (q="${q}"). Ignore it, or keep showing recent searches.`);
    else if (q !== null && q !== q.trim()) issues.push('Leading or trailing spaces were sent to the server (look at the %20s). Trim the query first.');
    if (q !== null && q.trim() && sent.results.length < sent.wouldMatch) issues.push(`${sent.results.length} result${sent.results.length === 1 ? '' : 's'}, but ${sent.wouldMatch} product${sent.wouldMatch === 1 ? ' matches' : 's match'} if case, accents and extra spaces are ignored.`);
    if (sent.raw.length > 100) issues.push(`${sent.raw.length} characters. Check that the field scrolls, the × stays reachable, and the server and URL still handle it.`);
    if ([...sent.raw].length !== sent.raw.length) issues.push(`Emoji: "${sent.raw}" is ${[...sent.raw].length} characters for a person but ${sent.raw.length} for JavaScript. Length limits and counters can be off by one per emoji.`);
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Query lab</p>
        <p className="text-sm text-muted">The left side is how the developer configured the field. Type (or tap a preset), press Enter, and see what the server receives. Then fix the settings until every query works.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Field settings</p>
          <Toggle label="Auto-capitalize" hint="Keyboard capitalizes the first letter" checked={s.autoCap} onChange={set('autoCap')} />
          <Toggle label="Autocorrect" hint="Keyboard replaces “misspelled” words" checked={s.autoCorrect} onChange={set('autoCorrect')} />
          <Toggle label="Trim spaces" hint="Remove spaces at the start and end" checked={s.trim} onChange={set('trim')} />
          <Toggle label="Ignore case & accents" hint="“creme” finds “Crème”" checked={s.fold} onChange={set('fold')} />
          <Toggle label="Ignore blank queries" hint="Search key does nothing when empty" checked={s.blockBlank} onChange={set('blockBlank')} />
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="space-y-3 p-5" style={{ background: '#f2f2f7', color: '#000', colorScheme: 'light' }}>
            <IOSSearchField value={value} onChange={onType} onSubmit={submit} placeholder="Search products" label="Search products" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[12px] text-[#6b6b70]">
                <Keyboard size={13} /> Type:
              </span>
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => typePreset(p.text)}
                  className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[12px] font-medium text-[#1c1c1e] outline-none hover:border-[#007aff] focus-visible:ring-2 focus-visible:ring-[#007aff]/50"
                >
                  {p.label}
                </button>
              ))}
              <button type="button" onClick={submit} className="ml-auto rounded-full bg-[#007aff] px-3 py-1 text-[12px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50 focus-visible:ring-offset-1">
                search ↵
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
            <Panel title="Request sent">
              <p className="font-mono text-[12px] break-all">{sent ? (sent.query === null ? '(nothing: blank query ignored)' : `GET /search?q=${encodeURIComponent(sent.query)}`) : '—'}</p>
            </Panel>
            <Panel title="Results">
              {sent && sent.query !== null ? (
                sent.results.length ? (
                  <ul className="text-[13px]">
                    {sent.results.slice(0, 4).map((r) => (
                      <li key={r} className="truncate">
                        {r}
                      </li>
                    ))}
                    {sent.results.length > 4 && <li className="text-muted">+ {sent.results.length - 4} more</li>}
                  </ul>
                ) : (
                  <p className="text-[13px]">No results</p>
                )
              ) : (
                <p className="text-[13px] text-muted">—</p>
              )}
            </Panel>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {!sent ? (
              <p className="text-sm text-muted">Tap a preset, then “search ↵” (or press Enter in the field).</p>
            ) : issues.length ? (
              issues.map((t) => (
                <p key={t} className="flex items-start gap-2 text-sm text-fg">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> <span className="min-w-0 break-words">{t}</span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Clean query, sensible results. Try another preset.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
