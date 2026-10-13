import { CircleAlert, CircleX, Eye, Mail } from 'lucide-react';

const parts = [
  { n: 1, name: 'Label', text: 'Tells the user what to enter. Always visible, even after typing.' },
  { n: 2, name: 'Input area (container)', text: 'The box you tap or click. Holds the value the user types.' },
  { n: 3, name: 'Placeholder', text: 'Optional example text inside an empty field. Disappears when you type, so it is not a label.' },
  { n: 4, name: 'Helper text', text: 'Extra guidance below the field: format, why we need it, if it is optional.' },
  { n: 5, name: 'Error message', text: 'Replaces the helper text when the value is wrong. Says what to fix.' },
  { n: 6, name: 'Character counter', text: 'Shows how many characters are used out of the limit.' },
  { n: 7, name: 'Leading / trailing icon', text: 'A hint icon (mail) or an action icon (show password).' },
  { n: 8, name: 'Clear button', text: 'Empties the field in one tap. Shown only when there is text.' },
];

function M({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-[3px] ring-[#5b4bff]/25 ${className}`}>
      {n}
    </span>
  );
}

const box = 'relative flex h-[42px] items-center gap-2 rounded-lg border bg-white px-3 text-[15px]';

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#f2f2f7] px-5 py-7 text-[#18181b] sm:px-7" role="img" aria-label="Three example text fields with their parts numbered 1 to 8">
        <div className="mx-auto max-w-[19rem] space-y-6">
          {/* Field A: empty, with placeholder and helper text */}
          <div>
            <p className="relative mb-1.5 inline-block text-sm font-medium">
              Email
              <M n={1} className="top-1/2 -right-7 -translate-y-1/2" />
            </p>
            <div className={`${box} border-[#2563eb] shadow-[0_0_0_3px_#2563eb33]`}>
              <span className="relative">
                <Mail size={18} className="text-[#52525b]" />
                <M n={7} className="-top-5 -left-4" />
              </span>
              <span className="relative text-[#71717a]">
                <span className="mr-[1px] inline-block h-[18px] w-[1.5px] translate-y-[3px] animate-pulse bg-[#2563eb]" />
                name@example.com
                <M n={3} className="-top-5 left-1/2" />
              </span>
              <M n={2} className="top-1/2 -right-3 -translate-y-1/2" />
            </div>
            <p className="relative mt-1.5 inline-block text-[13px] text-[#52525b]">
              We&apos;ll send your receipt here.
              <M n={4} className="top-1/2 -right-7 -translate-y-1/2" />
            </p>
          </div>

          {/* Field B: filled in, with clear button and counter */}
          <div>
            <p className="mb-1.5 text-sm font-medium">Display name</p>
            <div className={`${box} border-[#d0d5dd]`}>
              <span className="flex-1">Anna 🌸</span>
              <span className="relative">
                <CircleX size={20} fill="#a1a1aa" stroke="#fff" />
                <M n={8} className="-top-5 -right-1" />
              </span>
            </div>
            <div className="mt-1.5 flex text-[13px] text-[#52525b]">
              <span>Shown on your reviews.</span>
              <span className="relative ml-auto tabular-nums">
                6/20
                <M n={6} className="top-1/2 -left-7 -translate-y-1/2" />
              </span>
            </div>
          </div>

          {/* Field C: error state */}
          <div>
            <p className="mb-1.5 text-sm font-medium">Password</p>
            <div className={`${box} border-[#dc2626]`}>
              <span className="flex-1 tracking-[3px]">•••••</span>
              <span className="relative">
                <Eye size={20} className="text-[#52525b]" />
                <M n={7} className="-top-5 -right-1" />
              </span>
            </div>
            <p className="relative mt-1.5 inline-flex items-center gap-1 text-[13px] text-[#dc2626]">
              <CircleAlert size={14} /> Use at least 8 characters.
              <M n={5} className="top-1/2 -right-7 -translate-y-1/2" />
            </p>
          </div>
        </div>
      </div>
      <ol className="space-y-3">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{p.n}</span>
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
