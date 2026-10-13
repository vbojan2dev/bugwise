const parts = [
  { n: 1, name: 'Scrim', text: 'Dims and blocks the page behind a modal sheet. Tapping it means “cancel”, never “confirm”.' },
  { n: 2, name: 'Container', text: 'The sheet itself, attached to the bottom edge with rounded top corners.' },
  { n: 3, name: 'Grabber / drag handle', text: 'Shows the sheet can be dragged. Must also work with a tap or screen reader.' },
  { n: 4, name: 'Header', text: 'Title plus a visible way out: Cancel, Done or an X.' },
  { n: 5, name: 'Content', text: 'Scrolls inside the sheet. Dragging it must scroll first, and move the sheet only at the top.' },
  { n: 6, name: 'Detents', text: 'The heights the sheet snaps to, such as medium (about half) and large (almost full).' },
  { n: 7, name: 'Footer action', text: 'The main button, pinned so it stays visible, even above the keyboard.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-10 py-6">
        <div className="relative mx-auto w-full max-w-[220px]">
          <div
            role="img"
            aria-label="An iPhone screen dimmed by a scrim, with a sheet at medium height: grabber, header with Cancel and the title Delivery time, a list of time slots, and a Confirm button. A dashed line near the top marks the large height."
            className="relative h-[380px] overflow-hidden rounded-[26px] border-[6px] border-[#0c0d12] bg-[#f2f2f7] text-black"
          >
            <div className="space-y-2 p-3" aria-hidden="true">
              <div className="h-3 w-20 rounded bg-black/20" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 rounded-lg bg-white" />
              ))}
            </div>
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-x-0 top-[22px] border-t-2 border-dashed border-white/80" />
            <div className="absolute inset-x-0 top-[150px] border-t-2 border-dashed border-white/80" />
            <div className="absolute inset-x-0 bottom-0 flex h-[218px] flex-col rounded-t-[14px] bg-white">
              <div className="flex justify-center pt-1.5 pb-1">
                <span className="h-[5px] w-9 rounded-full bg-black/25" />
              </div>
              <div className="flex items-center justify-between px-3 pb-2 text-[11px]">
                <span className="text-[#007aff]">Cancel</span>
                <span className="font-semibold">Delivery time</span>
                <span className="w-8" />
              </div>
              <div className="flex-1 space-y-1 overflow-hidden px-3">
                {['ASAP · 25–35 min', '12:00 – 12:15', '12:15 – 12:30', '12:30 – 12:45'].map((t, i) => (
                  <div key={t} className="flex items-center justify-between rounded-md bg-[#f2f2f7] px-2 py-1.5 text-[10px]">
                    {t}
                    {i === 1 && <span className="text-[#007aff]">✓</span>}
                  </div>
                ))}
              </div>
              <div className="p-2.5">
                <div className="rounded-lg bg-[#007aff] py-1.5 text-center text-[11px] font-semibold text-white">Confirm</div>
              </div>
            </div>
          </div>
          <Marker n={1} className="top-[60px] -left-9" />
          <span className="absolute top-[72px] -left-3 h-px w-5 bg-[#5b4bff]" />
          <Marker n={6} className="top-[138px] -right-9" />
          <span className="absolute top-[150px] -right-3 h-px w-5 bg-[#5b4bff]" />
          <Marker n={3} className="top-[124px] left-[calc(50%-12px)]" />
          <span className="absolute top-[148px] left-1/2 h-3 w-px bg-[#5b4bff]" />
          <Marker n={2} className="top-[200px] -left-9" />
          <span className="absolute top-[212px] -left-3 h-px w-5 bg-[#5b4bff]" />
          <Marker n={4} className="top-[178px] -right-9" />
          <span className="absolute top-[190px] -right-3 h-px w-8 bg-[#5b4bff]" />
          <Marker n={5} className="top-[262px] -right-9" />
          <span className="absolute top-[274px] -right-3 h-px w-6 bg-[#5b4bff]" />
          <Marker n={7} className="top-[338px] -left-9" />
          <span className="absolute top-[350px] -left-3 h-px w-6 bg-[#5b4bff]" />
        </div>
        <p className="mt-3 text-center text-[11px] text-[#5a5f70]">iOS sheet at the medium detent</p>
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
