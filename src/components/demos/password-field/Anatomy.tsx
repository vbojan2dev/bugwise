import { ArrowBigUp, Check, EyeOff, KeyRound, X } from 'lucide-react';

const parts = [
  { n: 1, name: 'Label', text: 'A visible, permanent label ("Password", "New password"). The placeholder is not a label.' },
  { n: 2, name: 'Masked value', text: 'Each character is shown as a dot. The field must still accept typing, paste and autofill.' },
  { n: 3, name: 'Show / hide toggle', text: 'Reveals the password. Needs a name ("Show password"), a state, a 44 pt / 48 dp touch area, and must keep the cursor where it was.' },
  { n: 4, name: 'Password rules', text: 'Shown before the user types, then ticked off live. Not a surprise after the first failed attempt.' },
  { n: 5, name: 'Caps Lock warning', text: 'Web and desktop: a hint when Caps Lock is on, so users don’t lock themselves out by accident.' },
  { n: 6, name: 'Autofill / password manager', text: 'The system offers a saved or a generated strong password. Only works if the field is marked up correctly.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-white p-5 pr-9 text-[#111827] sm:p-6 sm:pr-10" style={{ colorScheme: 'light' }}>
        <div className="relative mx-auto max-w-[18rem]">
          <Marker n={1} className="-top-2 -right-8" />
          <p className="mb-1 text-[13px] font-medium">New password</p>
          <div className="relative flex h-11 items-center rounded-lg border border-[#2563eb] bg-white pl-3 ring-2 ring-[#2563eb]/25">
            <span className="flex-1 truncate text-[18px] tracking-[0.2em] text-[#111827]">••••••••••<span className="ml-px inline-block h-4 w-px bg-[#2563eb] align-middle" /></span>
            <span className="grid size-11 place-items-center text-[#6b7280]">
              <EyeOff size={20} aria-hidden="true" />
            </span>
            <Marker n={2} className="-bottom-3 left-12" />
            <Marker n={3} className="-top-3 right-1" />
          </div>
          <div className="relative mt-2 flex items-center gap-1 rounded-md bg-[#fffbeb] px-2 py-1 text-[12px] font-medium text-[#b45309]">
            <ArrowBigUp size={14} aria-hidden="true" /> Caps Lock is on
            <Marker n={5} className="top-0 -right-8" />
          </div>
          <ul className="relative mt-2 space-y-0.5 text-[12px]">
            <li className="flex items-center gap-1.5 text-[#15803d]">
              <Check size={13} strokeWidth={3} aria-hidden="true" /> At least 12 characters
            </li>
            <li className="flex items-center gap-1.5 text-[#15803d]">
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Not a commonly used password
            </li>
            <li className="flex items-center gap-1.5 text-[#4b5563]">
              <X size={13} aria-hidden="true" className="text-[#9ca3af]" /> Doesn&rsquo;t contain your email name
            </li>
            <Marker n={4} className="top-4 -right-8" />
          </ul>
          <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[12px]">
            <KeyRound size={15} className="shrink-0 text-[#2563eb]" aria-hidden="true" />
            <span className="min-w-0">
              <strong>Use suggested password</strong>
              <span className="block truncate font-mono text-[11px] text-[#6b7280]">kQ7v-mzxp-T3rw-hB9e</span>
            </span>
            <Marker n={6} className="top-1 -right-8" />
          </div>
        </div>
      </div>
      <ol className="min-w-0 space-y-3">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{p.n}</span>
            <div className="min-w-0">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
