const parts = [
  { n: 1, name: 'Container (track)', text: 'The background that groups all segments together.' },
  { n: 2, name: 'Segment', text: 'One option. All segments usually have equal width.' },
  { n: 3, name: 'Selected indicator (thumb)', text: 'Shows which segment is active. On iOS it slides.' },
  { n: 4, name: 'Label', text: 'Short text (1-2 words) or an icon describing the option.' },
  { n: 5, name: 'Divider', text: 'Thin line between unselected segments.' },
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
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-[#f2f2f7] px-6 py-14">
        <div className="relative mx-auto max-w-[19rem]">
          <div className="relative flex rounded-[10px] p-[3px] text-[15px] text-black" style={{ background: 'rgba(118,118,128,.12)' }}>
            <span className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-[8px] bg-white shadow-[0_3px_8px_rgba(0,0,0,.12)]" />
            <span className="relative z-10 flex-1 py-2 text-center font-semibold">Day</span>
            <span className="relative z-10 flex-1 py-2 text-center font-medium">Week</span>
            <span className="relative z-10 flex-1 border-l border-black/10 py-2 text-center font-medium">Month</span>
          </div>
          <Marker n={1} className="-top-9 right-2" />
          <span className="absolute -top-3 right-5 h-3 w-px bg-[#5b4bff]" />
          <Marker n={2} className="-bottom-10 left-[46%]" />
          <span className="absolute -bottom-4 left-[50%] h-4 w-px bg-[#5b4bff]" />
          <Marker n={3} className="-top-9 left-3" />
          <span className="absolute -top-3 left-6 h-3 w-px bg-[#5b4bff]" />
          <Marker n={4} className="-bottom-10 left-[12%]" />
          <span className="absolute -bottom-4 left-[16%] h-4 w-px bg-[#5b4bff]" />
          <Marker n={5} className="-bottom-10 left-[64%]" />
          <span className="absolute -bottom-4 left-[67.5%] h-4 w-px bg-[#5b4bff]" />
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
