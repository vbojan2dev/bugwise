import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, KeyRound, XCircle } from 'lucide-react';
import { PasswordField, RuleList, StrengthMeter, betterStrength, charCount, naiveStrength, rulesFor } from './PasswordField';

type LimitMode = 'none' | 'login16';
type SpaceMode = 'keep' | 'trimSignup' | 'trimAll';
type Feedback = 'rules' | 'naive' | 'better';
type AutoMode = 'current-password' | 'new-password' | 'off';

const presets = ['sunflower meadow at dusk ', 'Password1!', ' Secret123', 'Blue-Kettle-Sings-42', 'Žuta kuća 🏠 na brdu', 'aaaaaaaaaaaa'];

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </div>
  );
}

function Pills<T extends string>({ value, options, onChange }: { value: T; options: readonly { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Shows spaces as a visible middle dot so leading and trailing spaces can be seen. */
function Visible({ s }: { s: string }) {
  if (!s) return <span className="text-faint">(empty)</span>;
  return (
    <span className="font-mono break-all">
      {Array.from(s).map((c, i) =>
        c === ' ' ? (
          <span key={i} className="text-warn">
            ·
          </span>
        ) : (
          <span key={i}>{c}</span>
        ),
      )}
    </span>
  );
}

const native: Record<AutoMode, { ios: string; android: string; manager: string }> = {
  'current-password': { ios: '.password', android: 'password', manager: 'Offers the saved password for anna@example.com.' },
  'new-password': { ios: '.newPassword', android: 'newPassword', manager: 'Suggests a strong generated password and offers to save it.' },
  off: { ios: '(none)', android: 'importantForAutofill="no"', manager: 'Unpredictable: many browsers still fill passwords, some password managers skip the field. Never use it to "block" managers.' },
};

export default function Playground() {
  const [pw, setPw] = useState(presets[0]);
  const [limit, setLimit] = useState<LimitMode>('login16');
  const [spaces, setSpaces] = useState<SpaceMode>('trimSignup');
  const [feedback, setFeedback] = useState<Feedback>('naive');
  const [auto, setAuto] = useState<AutoMode>('off');
  const [caps, setCaps] = useState(false);

  const trim = (s: string) => s.trim();
  const stored = spaces === 'keep' ? pw : trim(pw);
  let sent = spaces === 'trimAll' ? trim(pw) : pw;
  if (limit === 'login16') sent = Array.from(sent).slice(0, 16).join('');
  const match = stored === sent;

  const issues: { kind: 'warn' | 'info'; text: string }[] = [];
  if (limit === 'login16' && charCount(spaces === 'trimAll' ? trim(pw) : pw) > 16)
    issues.push({ kind: 'warn', text: `The login field silently cuts the password to 16 characters. Sign-up saved ${charCount(stored)}, so this user can never log in with the password they chose.` });
  if (spaces === 'trimSignup' && pw !== trim(pw)) issues.push({ kind: 'warn', text: 'Sign-up trims leading/trailing spaces but login doesn’t. Same password, different values: login fails.' });
  if (spaces === 'trimAll' && pw !== trim(pw)) issues.push({ kind: 'info', text: 'Trimming on both sides is consistent, so login works. But the user’s space was dropped without telling them; many teams prefer to keep spaces as typed.' });
  if (feedback === 'naive' && naiveStrength(pw).label !== betterStrength(pw).label)
    issues.push({ kind: 'warn', text: `The naive meter says "${naiveStrength(pw).label}", a length + blocklist check says "${betterStrength(pw).label}". Users trust the meter, so a wrong one teaches bad passwords.` });
  if (auto === 'off') issues.push({ kind: 'warn', text: 'autocomplete="off" on a password field: password managers may ignore the field or save the wrong thing. Use current-password on login and new-password on sign-up.' });
  if (auto === 'new-password') issues.push({ kind: 'info', text: 'new-password is right for sign-up and "change password". On a login form it makes managers suggest a new password instead of filling the saved one.' });

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Password lab</p>
        <p className="text-sm text-muted">One account, two forms: what sign-up saves and what login later sends. Change how each side treats the password and see if the user can still get in.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Maximum length">
            <Pills value={limit} onChange={setLimit} options={[{ v: 'none', label: '64 on both forms' }, { v: 'login16', label: 'Login cuts at 16' }] as const} />
          </Control>
          <Control label="Leading / trailing spaces">
            <Pills value={spaces} onChange={setSpaces} options={[{ v: 'keep', label: 'Keep' }, { v: 'trimSignup', label: 'Trim at sign-up only' }, { v: 'trimAll', label: 'Trim both' }] as const} />
          </Control>
          <Control label="Feedback while typing">
            <Pills value={feedback} onChange={setFeedback} options={[{ v: 'rules', label: 'Rules checklist' }, { v: 'naive', label: 'Naive meter' }, { v: 'better', label: 'Better meter' }] as const} />
          </Control>
          <Control label="autocomplete attribute">
            <select value={auto} onChange={(e) => setAuto(e.target.value as AutoMode)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 font-mono text-sm">
              <option value="current-password">current-password</option>
              <option value="new-password">new-password</option>
              <option value="off">off</option>
            </select>
          </Control>
          <label className="flex items-center justify-between text-sm font-medium">
            Simulate Caps Lock on
            <input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="px-5 py-6 sm:px-8" style={{ background: '#fff', color: '#111827', colorScheme: 'light' }}>
            <div className="mx-auto max-w-[22rem]">
              <PasswordField
                label="Password"
                value={pw}
                onChange={setPw}
                autoComplete={auto}
                capsWarning
                forceCaps={caps}
                below={feedback === 'rules' ? <RuleList rules={rulesFor(pw, 'anna@example.com')} /> : <StrengthMeter s={feedback === 'naive' ? naiveStrength(pw) : betterStrength(pw)} />}
              />
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[12px] text-[#374151]">
                <KeyRound size={15} className="mt-0.5 shrink-0 text-[#2563eb]" aria-hidden="true" />
                <span className="min-w-0">
                  <strong>Password manager:</strong> {native[auto].manager}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {presets.map((p) => (
                  <button key={p} type="button" onClick={() => setPw(p)} className="rounded-full border border-[#d1d5db] bg-white px-2 py-0.5 font-mono text-[11px] whitespace-pre text-[#374151] outline-none hover:bg-[#f3f4f6] focus-visible:ring-2 focus-visible:ring-[#2563eb]">
                    {p.replace(/ /g, (m, i) => (i === 0 || i === p.length - 1 ? '·' : m))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Sign-up saves ({charCount(stored)})</p>
              <p className="text-[13px]">
                <Visible s={stored} />
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Login sends ({charCount(sent)})</p>
              <p className="text-[13px]">
                <Visible s={sent} />
              </p>
            </div>
            <div className={`min-w-0 rounded-xl px-3 py-2 sm:col-span-2 ${match ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                {match ? <CheckCircle2 size={16} className="shrink-0 text-ok" /> : <XCircle size={16} className="shrink-0 text-danger" />}
                {match ? 'Values match: the user can log in.' : 'Values differ: "Email or password is incorrect", forever.'}
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-subtle px-3 py-2 sm:col-span-2">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Same intent in native apps</p>
              <p className="text-[13px]">
                iOS <code className="font-mono">textContentType</code>: <code className="font-mono">{native[auto].ios}</code> · Android: <code className="font-mono break-all">{native[auto].android}</code>
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t.text} className="flex items-start gap-2 text-sm text-fg">
                  {t.kind === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-brand" />} <span className="min-w-0">{t.text}</span>
                </p>
              ))
            ) : (
              <p className="flex items-center gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="shrink-0 text-ok" /> Looks fine. Now try the presets: the leading space, the 20-character one, and Password1! with each meter.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
