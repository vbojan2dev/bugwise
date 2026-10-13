import { useState, type ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { PasswordField, RuleList, StrengthMeter, betterStrength, naiveStrength, rulesFor } from './PasswordField';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: string; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface">
      <div className="grid min-h-52 place-items-center rounded-t-2xl px-4 py-6 sm:px-5" style={{ background: bg, color: '#000', colorScheme: 'light' }}>
        <div className="w-full max-w-[18rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

/** iOS login: the QuickType "Passwords" bar offers the saved login. */
function IOSLogin() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [focused, setFocused] = useState(false);
  const filled = pw.length > 0;
  return (
    <div>
      <div className="overflow-hidden rounded-[10px] bg-white">
        <label className="flex h-11 items-center border-b border-[#c6c6c8] px-3">
          <span className="sr-only">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused(true)} placeholder="Email" autoComplete="username" type="email" className="w-0 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#c4c4c6]" />
        </label>
        <PasswordFieldRow value={pw} onChange={setPw} onFocus={() => setFocused(true)} />
      </div>
      <div className={`mt-3 rounded-[10px] bg-[#d1d3d9] px-2 py-1.5 transition-opacity ${focused && !filled ? 'opacity-100' : 'opacity-40'}`}>
        <button
          type="button"
          disabled={filled}
          onClick={() => {
            setEmail('anna@example.com');
            setPw('Blue-Kettle-Sings-42');
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] text-black outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"
        >
          <KeyRound size={14} aria-hidden="true" /> anna@example.com
        </button>
      </div>
      <p className="mt-1 text-center text-[11px] text-[rgba(60,60,67,.6)]">{filled ? 'Filled from Passwords' : 'QuickType bar above the keyboard (tap a field)'}</p>
    </div>
  );
}

function PasswordFieldRow({ value, onChange, onFocus }: { value: string; onChange: (v: string) => void; onFocus: () => void }) {
  return (
    <div className="[&_label]:sr-only [&>div>div]:rounded-none">
      <PasswordField variant="ios" label="Password" placeholder="Password" value={value} onChange={onChange} onFocus={onFocus} />
    </div>
  );
}

/** iOS sign-up: the system suggests a strong password (yellow field). */
function IOSStrongPassword() {
  const [pw, setPw] = useState('');
  const [state, setState] = useState<'ask' | 'used' | 'own'>('ask');
  const suggestion = 'hapzov-4Kuqwe-rydtiX';
  return (
    <div>
      <p className="mb-1 px-1 text-[13px] text-[rgba(60,60,67,.6)]">New password</p>
      {state === 'used' ? (
        <div className="flex h-11 items-center justify-between rounded-[10px] bg-[#fff6c4] px-3">
          <span className="truncate font-mono text-[15px]">{suggestion}</span>
          <span className="ml-2 shrink-0 text-[11px] font-semibold text-[#8a6d00]">Strong Password</span>
        </div>
      ) : (
        <PasswordFieldRow value={pw} onChange={setPw} onFocus={() => {}} />
      )}
      {state === 'ask' && (
        <div className="mt-3 overflow-hidden rounded-[12px] bg-white text-center text-[14px]">
          <p className="px-3 pt-2.5 pb-2 text-[12px] text-[rgba(60,60,67,.6)]">Suggested: {suggestion}. Saved in Passwords.</p>
          <button type="button" onClick={() => setState('used')} className="block w-full border-t border-[#e5e5ea] py-2.5 font-semibold text-[#007aff] outline-none focus-visible:bg-[#007aff]/10">
            Use Strong Password
          </button>
          <button type="button" onClick={() => setState('own')} className="block w-full border-t border-[#e5e5ea] py-2.5 text-[#007aff] outline-none focus-visible:bg-[#007aff]/10">
            Choose My Own Password
          </button>
        </div>
      )}
      {state !== 'ask' && (
        <button
          type="button"
          onClick={() => {
            setState('ask');
            setPw('');
          }}
          className="mt-3 w-full rounded-md py-1 text-[13px] text-[#007aff] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"
        >
          Reset demo
        </button>
      )}
    </div>
  );
}

function MaterialField() {
  const [pw, setPw] = useState('');
  return (
    <div className="pt-2">
      <PasswordField variant="material" surface="#fef7ff" label="Password" value={pw} onChange={setPw} below={<p className="text-[12px] text-[#49454f]">At least 12 characters</p>} />
    </div>
  );
}

function WebLogin() {
  const [pw, setPw] = useState('');
  const [caps, setCaps] = useState(false);
  return (
    <div>
      <PasswordField label="Password" value={pw} onChange={setPw} toggleStyle="text" capsWarning forceCaps={caps} />
      <label className="mt-3 flex items-center gap-2 text-[12px] text-[#4b5563]">
        <input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} className="accent-[#2563eb]" /> Simulate Caps Lock (for phones)
      </label>
    </div>
  );
}

function WebSignUp() {
  const [pw, setPw] = useState('');
  const rules = rulesFor(pw, 'anna@example.com');
  return <PasswordField label="Create a password" value={pw} onChange={setPw} autoComplete="new-password" below={<RuleList rules={rules} />} />;
}

function Meters() {
  const [pw, setPw] = useState('Password1!');
  return (
    <div>
      <PasswordField label="Password" value={pw} onChange={setPw} autoComplete="new-password" />
      <div className="mt-3 space-y-2 rounded-lg bg-[#f9fafb] p-2.5">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Naive meter (character types)</p>
          <StrengthMeter s={naiveStrength(pw)} />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Length + common-password list</p>
          <StrengthMeter s={betterStrength(pw)} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {['Password1!', 'sunflower meadow at dusk', 'Tr0ub4dor&3'].map((p) => (
          <button key={p} type="button" onClick={() => setPw(p)} className="rounded-full border border-[#d1d5db] bg-white px-2 py-0.5 font-mono text-[11px] text-[#374151] outline-none hover:bg-[#f3f4f6] focus-visible:ring-2 focus-visible:ring-[#2563eb]">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every field here works. Type something, reveal it, put the cursor in the middle and reveal again: the cursor should stay where it was.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Login with saved password" platform="iOS" note="With the right content types (.username, .password) iOS offers the saved login in the QuickType bar. One tap fills both fields; nobody types a 20-character password.">
          <IOSLogin />
        </Demo>
        <Demo title="Strong password suggestion" platform="iOS" note="On a sign-up field marked .newPassword, iOS offers a generated password and saves it. The yellow field shows it was filled automatically. Android and browsers have their own version.">
          <IOSStrongPassword />
        </Demo>
        <Demo title="Outlined field with eye icon" platform="Android · Material 3" bg="#fef7ff" note="The trailing icon toggles visibility. The icon changes and so does its name: 'Show password' becomes 'Hide password'. The field keeps focus.">
          <MaterialField />
        </Demo>
        <Demo title="Text toggle + Caps Lock warning" platform="Web" bg="#fff" note="'Show' / 'Hide' text is clearer than an icon for many users. On desktop, the field warns when Caps Lock is on (try it with a keyboard).">
          <WebLogin />
        </Demo>
        <Demo title="Rules up front, ticked off live" platform="Web" bg="#fff" note="Users see the rules before typing and watch them turn green. No guessing, no surprise error after submitting.">
          <WebSignUp />
        </Demo>
        <Demo title="Two strength meters, one password" platform="Web" bg="#fff" note="The naive meter calls 'Password1!' strong and a long passphrase weak. A meter that checks length and common passwords gets both right. Try the chips.">
          <Meters />
        </Demo>
      </div>
    </div>
  );
}
