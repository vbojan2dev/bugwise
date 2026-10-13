import { AlertCircle } from 'lucide-react';

const parts = [
  { n: 1, name: 'Clear title and note', text: 'Says what the form is for and how required and optional fields are marked.' },
  { n: 2, name: 'Group with a heading', text: 'Related fields sit together under a heading and screen readers announce the heading.' },
  { n: 3, name: 'Visible label', text: 'Above the field and always visible. A placeholder is not a label.' },
  { n: 4, name: 'Help text before typing', text: 'Format and rules up front ("For example 27 3 1995"), not only after a mistake.' },
  { n: 5, name: 'Right input type', text: 'type and inputmode open the right keyboard: email, phone pad, numbers.' },
  { n: 6, name: 'Autocomplete token', text: 'autocomplete="postal-code" lets AutoFill and password managers fill the right value.' },
  { n: 7, name: 'Error next to the field', text: 'Red border plus text and an icon, saying how to fix it. Never color alone.' },
  { n: 8, name: 'Optional marked as optional', text: 'Usually fewer fields are optional, so mark those instead of every required one.' },
  { n: 9, name: 'Specific button text', text: '"Create account" says what happens. "Submit" or "OK" does not.' },
];

function M({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-[3px] ring-[#5b4bff]/25 ${className}`}>
      {n}
    </span>
  );
}

const box = 'relative flex h-10 items-center rounded-lg border bg-white px-3 text-[14px]';

export default function FormAnatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-4 sm:p-8 md:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-4 py-6 text-[#18181b] sm:px-6" style={{ colorScheme: 'light' }} role="img" aria-label="A delivery address form with nine good practices numbered 1 to 9">
        <div className="mx-auto max-w-[19rem] pr-5">
          <div className="relative">
            <p className="text-[19px] font-bold tracking-tight">Where should we deliver?</p>
            <p className="text-[12px] text-[#52525b]">All fields are required unless marked (optional).</p>
            <M n={1} className="top-1 -right-6" />
          </div>

          <div className="relative mt-4 rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
            <p className="text-[11px] font-semibold tracking-wide text-[#52525b] uppercase">Delivery address</p>
            <M n={2} className="-top-2.5 -right-6" />

            <div className="mt-2 space-y-3">
              <div>
                <p className="relative inline-block text-[13px] font-semibold">
                  Postcode
                  <M n={3} className="top-1/2 -right-7 -translate-y-1/2" />
                </p>
                <p className="relative inline-block text-[12px] text-[#52525b]">
                  For example SW1A 1AA
                  <M n={4} className="top-1/2 -right-7 -translate-y-1/2" />
                </p>
                <div className={`${box} mt-1 border-[#c81e1e] shadow-[inset_0_0_0_1px_#c81e1e]`}>
                  <span>SW1A</span>
                  <span className="ml-auto font-mono text-[10px] text-[#71717a]">postal-code</span>
                  <M n={6} className="-top-2.5 -right-6" />
                </div>
                <p className="relative mt-1 flex items-start gap-1 text-[12px] font-medium text-[#c81e1e]">
                  <AlertCircle size={13} className="mt-px shrink-0" /> Enter a full postcode, like SW1A 1AA
                  <M n={7} className="top-1/2 -right-6 -translate-y-1/2" />
                </p>
              </div>

              <div>
                <p className="text-[13px] font-semibold">Mobile number</p>
                <div className={`${box} mt-1 border-[#d0d5dd]`}>
                  <span>+44 7700 900123</span>
                  <span className="ml-auto font-mono text-[10px] text-[#71717a]">type=tel</span>
                  <M n={5} className="-top-2.5 -right-6" />
                </div>
              </div>

              <div>
                <p className="relative inline-block text-[13px] font-semibold">
                  Note for the courier <span className="font-normal text-[#52525b]">(optional)</span>
                  <M n={8} className="top-1/2 -right-7 -translate-y-1/2" />
                </p>
                <div className={`${box} mt-1 border-[#d0d5dd] text-[#a1a1aa]`}>
                  <span>Ring twice</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 grid h-10 place-items-center rounded-lg bg-[#1f7a4d] text-[14px] font-semibold text-white">
            Save address
            <M n={9} className="top-1/2 -right-6 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <ol className="min-w-0 space-y-2.5">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white">{p.n}</span>
            <p className="min-w-0 text-sm leading-snug">
              <strong className="text-fg">{p.name}.</strong> <span className="text-muted">{p.text}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
