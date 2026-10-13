import type { ReactNode } from 'react';
import { Info, Trash2, Pencil, Share2 } from 'lucide-react';

/* Static pictures for the Do / Don't comparisons on the Tooltip page. */

const bubble = 'rounded-md bg-[#1f2330] px-2.5 py-1.5 text-[12px] leading-4 text-white shadow-lg';

function Shell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="rounded-xl bg-white p-3 text-[#0e1120] shadow-sm" style={{ colorScheme: 'light' }}>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="mb-1 flex items-center gap-1 text-[12px] font-medium text-[#3c4150]">{label}</p>
      <div className="flex h-10 items-center rounded-lg border border-black/20 px-3 text-[14px] tracking-widest">{value}</div>
    </>
  );
}

export function InlineHelp() {
  return (
    <Shell label="A password field with the rules written below it: At least 8 characters, including a number.">
      <Field label="New password" value="••••••" />
      <p className="mt-1.5 text-[12px] text-[#3c4150]">At least 8 characters, including a number.</p>
    </Shell>
  );
}

export function RulesInTooltip() {
  return (
    <Shell label="A password field where the rules are only available in a tooltip behind a small info icon next to the label.">
      <div className="relative">
        <p className="mb-1 flex items-center gap-1 text-[12px] font-medium text-[#3c4150]">
          New password <Info size={13} className="text-[#5a5f70]" />
        </p>
        <div className="flex h-10 items-center rounded-lg border border-[#b3261e] px-3 text-[14px] tracking-widest">••••••</div>
        <p className="mt-1.5 text-[12px] text-[#b3261e]">Password doesn’t meet the requirements.</p>
      </div>
    </Shell>
  );
}

export function PlainTooltip() {
  return (
    <Shell label="Icon buttons for edit, share and delete. A dark tooltip above the delete button reads 'Delete address'.">
      <div className="relative pt-9">
        <span className={`absolute top-0 right-0 ${bubble}`}>Delete address</span>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="min-w-0 flex-1 truncate">Lindenstraße 12, Berlin</span>
          <Pencil size={16} className="text-[#5a5f70]" />
          <Share2 size={16} className="text-[#5a5f70]" />
          <span className="grid size-7 place-items-center rounded-md ring-2 ring-[#2f6bff]">
            <Trash2 size={16} className="text-[#5a5f70]" />
          </span>
        </div>
      </div>
    </Shell>
  );
}

export function InteractiveTooltip() {
  return (
    <Shell label="A tooltip that contains a paragraph, a 'Learn more' link and a 'Got it' button. It disappears when the pointer moves towards the buttons.">
      <div className="relative">
        <div className={`${bubble} p-3`}>
          <p className="font-semibold">Points expire</p>
          <p className="mt-1">Points expire 12 months after you earn them, unless you shop again.</p>
          <div className="mt-2 flex gap-3">
            <span className="underline">Learn more</span>
            <span className="rounded bg-white/15 px-2 py-0.5">Got it</span>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-[13px]">
          1,250 points <Info size={14} className="text-[#5a5f70]" />
        </p>
      </div>
    </Shell>
  );
}
