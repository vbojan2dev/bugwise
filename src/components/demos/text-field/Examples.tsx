/** Small static illustrations used inside <Do>/<Dont> blocks on the text field page. */

export function SplitCardNumber() {
  const parts = ['4111', '1111', '11', ''];
  return (
    <div className="text-[#18181b]">
      <p className="mb-1.5 text-sm font-medium">Card number</p>
      <div className="flex gap-2">
        {parts.map((p, i) => (
          <span key={i} className={`flex h-[42px] min-w-0 flex-1 items-center justify-center rounded-lg border bg-white font-mono text-[15px] tabular-nums ${i === 2 ? 'border-[#2563eb] shadow-[0_0_0_3px_#2563eb33]' : 'border-[#d0d5dd]'}`}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderOnlyForm() {
  return (
    <div className="space-y-2 text-[15px] text-[#18181b]">
      <span className="flex h-[42px] items-center rounded-lg border border-[#d0d5dd] bg-white px-3">Anna Kovač</span>
      <span className="flex h-[42px] items-center rounded-lg border border-[#2563eb] bg-white px-3 shadow-[0_0_0_3px_#2563eb33]">
        anna.kov
        <span className="ml-px inline-block h-[18px] w-[1.5px] animate-pulse bg-[#2563eb]" />
      </span>
      <span className="flex h-[42px] items-center rounded-lg border border-[#d0d5dd] bg-white px-3 text-[#a1a1aa]">Phone</span>
    </div>
  );
}

export function LabelledForm() {
  const row = (label: string, value: string, focus = false, ph = false) => (
    <div>
      <p className="mb-1 text-[13px] font-medium">{label}</p>
      <span className={`flex h-[42px] items-center rounded-lg border bg-white px-3 ${focus ? 'border-[#2563eb] shadow-[0_0_0_3px_#2563eb33]' : 'border-[#d0d5dd]'} ${ph ? 'text-[#a1a1aa]' : ''}`}>
        {value}
        {focus && <span className="ml-px inline-block h-[18px] w-[1.5px] animate-pulse bg-[#2563eb]" />}
      </span>
    </div>
  );
  return (
    <div className="space-y-2 text-[15px] text-[#18181b]">
      {row('Full name', 'Anna Kovač')}
      {row('Email', 'anna.kov', true)}
      {row('Phone', '+385 91 234 5678', false, true)}
    </div>
  );
}
