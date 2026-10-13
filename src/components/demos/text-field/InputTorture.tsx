import { useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Lightbulb, Wrench } from 'lucide-react';
import { TextField, graphemes } from './TextField';

type FieldKind = 'name' | 'email';

interface Preset {
  key: string;
  label: string;
  name: string;
  email: string;
  why: string;
}

const presets: Preset[] = [
  { key: 'empty', label: 'Empty', name: '', email: '', why: 'The most basic negative test. Is the field required, and does the message say so clearly?' },
  { key: 'spaces', label: 'Spaces only', name: '    ', email: '   ', why: 'A field that only checks "is it empty?" happily accepts four spaces, and you get a customer with no name.' },
  {
    key: 'long',
    label: 'Very long',
    name: 'Maria Anna Sofia Gabriela Alexandra Konstantina Papadopoulou-Vasilakopoulou',
    email: `${'a'.repeat(64)}@${'very-long-subdomain-name-for-testing.'.repeat(5)}example.com`,
    why: 'Long values reveal missing limits, silent truncation, broken layouts and database errors.',
  },
  { key: 'emoji', label: 'Emoji 👩‍💻', name: 'Ana 👩‍💻🇭🇷', email: '👩‍💻@test.com', why: 'One emoji can be 2–11 code units. Counters, limits and databases that count the wrong thing break here.' },
  { key: 'latin', label: 'č ć ž đ š', name: 'Đurđica Šćepanović-Žižić', email: 'zoran.čolić@test.hr', why: 'Real names use letters outside A–Z. They must be accepted, saved and shown back without turning into "?" or "Ä‘".' },
  { key: 'cyrillic', label: 'Cyrillic', name: 'Јована Петровић', email: 'јована@test.rs', why: 'A different alphabet tests encoding, fonts and sorting all the way to the database and back.' },
  { key: 'trim', label: 'Leading / trailing spaces', name: '  Anna Kovač  ', email: '  anna@test.com  ', why: 'Autofill and copy-paste often add spaces. A valid email with a trailing space must still be accepted.' },
  { key: 'apostrophe', label: "O'Brien", name: "Seán O'Brien", email: "sean.o'brien@test.ie", why: 'Apostrophes are valid in names AND in email addresses. Badly built apps reject them or crash on them.' },
  { key: 'hyphen', label: 'Hyphen & plus', name: 'Anna-Marie Kovač-Horvat', email: 'anna+shop@test.com', why: 'Double-barrelled names and "plus addresses" are valid. Over-strict rules wrongly block real people.' },
  { key: 'case', label: 'MiXeD CaSe', name: 'ANNA KOVAČ', email: 'Anna.Kovac@Test.COM', why: 'Users type in any case. Login and duplicate checks must treat Anna@Test.com and anna@test.com as the same.' },
  { key: 'html', label: '<b>html</b>', name: '<b>Anna</b>', email: '<b>anna</b>@test.com', why: 'If this shows up bold anywhere later, the app renders user input as HTML. That is the door to XSS attacks.' },
  { key: 'sql', label: 'SQL-like', name: "Robert'); DROP TABLE users;--", email: "admin'--@test.com", why: 'Quotes and semicolons should be saved as plain text. A server error here hints at an SQL injection risk.' },
  { key: 'newline', label: 'Pasted with newline', name: 'Anna Kovač\n', email: 'anna@test.com\n', why: 'Copying from a spreadsheet or an email often grabs a line break. A single-line field should drop it quietly.' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function check(kind: FieldKind, raw: string): { saved: string; error: string } {
  if (kind === 'name') {
    const clean = raw.replace(/[\r\n\t]+/g, ' ').trim().replace(/\s{2,}/g, ' ');
    if (!clean) return { saved: '', error: 'Enter your name' };
    if (graphemes(clean) > 50) return { saved: '', error: `Name must be 50 characters or fewer (this one has ${graphemes(clean)})` };
    return { saved: clean, error: '' };
  }
  const clean = raw.replace(/[\r\n\t]+/g, '').trim();
  if (!clean) return { saved: '', error: 'Enter your email address' };
  if (clean.length > 254) return { saved: '', error: `Email address is too long (${clean.length} characters, max 254)` };
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(clean)) return { saved: '', error: 'Use Latin letters without accents, e.g. zoran.colic@test.hr' };
  const bad = [...new Set(clean.match(/[\s<>()[\]\\,;:"]/g) ?? [])];
  if (bad.length) return { saved: '', error: `Remove ${bad.map((b) => (b === ' ' ? 'the space' : `"${b}"`)).join(', ')}. ${bad.length > 1 ? "They aren't" : "It isn't"} allowed in email addresses` };
  if (!EMAIL.test(clean)) return { saved: '', error: 'Enter an email address like name@example.com' };
  const at = clean.lastIndexOf('@');
  return { saved: clean.slice(0, at) + clean.slice(at).toLowerCase(), error: '' };
}

function Visible({ text }: { text: string }) {
  if (!text) return <span className="text-faint italic">(nothing)</span>;
  const out: ReactNode[] = [];
  [...text].forEach((ch, i) => {
    if (ch === ' ') out.push(<span key={i} className="text-brand opacity-70">·</span>);
    else if (ch === '\n') out.push(<span key={i} className="rounded bg-brand-soft px-0.5 text-brand">⏎</span>);
    else out.push(ch);
  });
  return <>{out}</>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-semibold tracking-wide text-faint uppercase sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-fg">{children}</dd>
    </div>
  );
}

export default function InputTorture() {
  const [kind, setKind] = useState<FieldKind>('name');
  const [raw, setRaw] = useState('');
  const [preset, setPreset] = useState<Preset | null>(null);
  const [tried, setTried] = useState(false);

  const res = check(kind, raw);
  const presetActive = preset && (kind === 'name' ? preset.name : preset.email) === raw ? preset : null;

  const apply = (p: Preset) => {
    setPreset(p);
    setRaw(kind === 'name' ? p.name : p.email);
    setTried(true);
  };
  const switchKind = (k: FieldKind) => {
    setKind(k);
    setRaw(preset ? (k === 'name' ? preset.name : preset.email) : '');
  };

  const len = raw.length;
  const g = graphemes(raw);
  const notes: string[] = [];
  if (/^ | $/.test(raw) && raw.trim()) notes.push('Trimmed the spaces at the start and end before checking the value.');
  if (/\n/.test(raw)) notes.push('Dropped the line break from the pasted text. This is a single-line field.');
  if (raw && !raw.trim()) notes.push('Treated "spaces only" as empty, so the required-field message appears.');
  if (len !== g) notes.push(`Counts ${g} characters, the way people see them. A naive String.length says ${len}, because emoji and flags are built from several code units.`);
  if (/<\/?[a-z]/i.test(raw)) notes.push(kind === 'name' ? 'Shows the < and > as plain text in the greeting below. If it showed bold text, the app would be rendering HTML (XSS risk).' : 'Rejects < and > with a clear message instead of crashing or saving them.');
  if (/'|;|--/.test(raw) && res.saved) notes.push('Saves quotes, semicolons and dashes as plain text. The server uses parameterised queries, so nothing gets executed.');
  if (kind === 'name' && /[^\x00-\x7F]/.test(raw) && res.saved) notes.push('Accepts letters outside A–Z (č, ć, ž, đ, š, Cyrillic, emoji). Real people have these names.');
  if (kind === 'email' && res.saved && res.saved !== raw.trim()) notes.push('Saves the domain in lowercase. Logging in later should work in any letter case.');
  if (res.error.includes('characters') || res.error.includes('too long')) notes.push('Tells the user about the limit instead of silently cutting the text.');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Input torture playground</p>
        <p className="text-sm text-muted">Testers feed fields the inputs developers forget. Pick a test input (it is pasted into the field) or type your own, and see how a well-built field handles it.</p>
      </div>
      <div className="space-y-3 border-b border-line px-5 py-4">
        <div role="group" aria-label="Field to test" className="inline-flex gap-1 rounded-lg bg-subtle p-1 text-sm font-medium">
          {(['name', 'email'] as FieldKind[]).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => switchKind(k)} className={`rounded-md px-3 py-1 ${kind === k ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>
              {k === 'name' ? 'Full name field' : 'Email field'}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Test inputs" className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={presetActive?.key === p.key}
              onClick={() => apply(p)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${presetActive?.key === p.key ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="bg-[#f6f7fb] p-5 text-[#18181b] sm:p-6">
          <div className="mx-auto max-w-[300px] rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="mb-4 text-lg font-bold">Checkout details</p>
            <TextField
              key={kind}
              variant="web"
              label={kind === 'name' ? 'Full name' : 'Email'}
              type="text"
              inputMode={kind === 'email' ? 'email' : 'text'}
              autoComplete={kind === 'name' ? 'name' : 'email'}
              autoCapitalize={kind === 'name' ? 'words' : 'none'}
              value={raw}
              onChange={(v) => {
                setRaw(v);
                setTried(true);
              }}
              error={tried && res.error ? res.error : undefined}
            />
            <div className="mt-4 rounded-lg bg-[#f4f4f5] p-3 text-[13px] break-words text-[#3f3f46]">
              <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-[#71717a] uppercase">Preview on next screen</p>
              {res.saved ? (kind === 'name' ? <>Hi, {res.saved}! Your order is on its way.</> : <>Receipt will be sent to {res.saved}</>) : <span className="text-[#a1a1aa]">Nothing valid to show yet</span>}
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-line p-5 lg:border-t-0 lg:border-l">
          <dl className="space-y-3">
            <Row label="Typed / pasted">
              <span className="font-mono break-all">
                <Visible text={raw.length > 160 ? raw.slice(0, 160) + '…' : raw} />
              </span>
            </Row>
            <Row label="Length">
              {g} characters{len !== g && <span className="text-muted"> (String.length = {len})</span>}
            </Row>
            <Row label="Result">
              {!tried ? (
                <span className="text-faint">Waiting for input…</span>
              ) : res.error ? (
                <span className="flex items-start gap-1.5 text-danger">
                  <CircleAlert size={15} className="mt-0.5 shrink-0" /> {res.error}
                </span>
              ) : (
                <span className="flex items-start gap-1.5 text-ok">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> <span>
                    Accepted. Saved as <span className="font-mono break-all text-fg">&quot;{res.saved}&quot;</span>
                  </span>
                </span>
              )}
            </Row>
          </dl>
          {notes.length > 0 && (
            <div className="rounded-xl bg-subtle p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Wrench size={13} /> What the good field did
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-fg">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-xl bg-brand-soft p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase">
              <Lightbulb size={13} /> Why testers try this
            </p>
            <p className="leading-relaxed text-fg">{presetActive ? presetActive.why : 'Pick a test input above. Each one targets a different kind of bug.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
