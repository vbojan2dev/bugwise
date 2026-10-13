const parts = [
  { n: 1, name: 'Track (inactive)', text: 'The full line from minimum to maximum. Its length is the whole range of possible values.' },
  { n: 2, name: 'Active track', text: 'The filled part. In a single slider it runs from the minimum to the thumb; in a range slider, between the two thumbs.' },
  { n: 3, name: 'Thumb (handle)', text: 'What you drag. Its visible size can be small, but its touch area should be at least 44 pt / 48 dp.' },
  { n: 4, name: 'Value label', text: 'Shows the current value while dragging, or permanently next to the slider. Needs units and sensible rounding.' },
  { n: 5, name: 'Tick marks (stops)', text: 'Only on discrete sliders. Each tick is one allowed value (one step).' },
  { n: 6, name: 'Min / max labels', text: 'Tell users the limits. Both ends must actually be reachable.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-white px-6 pt-6 pb-14 text-[#1d1b20]" style={{ colorScheme: 'light' }}>
        <div className="relative mx-auto h-[120px] max-w-[19rem]">
          <p className="absolute top-0 left-0 text-[13px] font-semibold">Price per night</p>
          {/* track */}
          <span className="absolute inset-x-0 top-[64px] h-1 rounded-full bg-[#e5e5ea]" />
          <span className="absolute top-[64px] h-1 rounded-full bg-[#007aff]" style={{ left: '20%', width: '50%' }} />
          {ticks.map((t) => (
            <span key={t} className="absolute top-[76px] h-1.5 w-px" style={{ left: `${t}%`, background: t >= 20 && t <= 70 ? '#007aff' : '#c7c7cc' }} />
          ))}
          {[20, 70].map((x) => (
            <span key={x} className="absolute top-[52px] size-7 -translate-x-1/2 rounded-full bg-white shadow-[0_0.5px_4px_rgba(0,0,0,.12),0_6px_13px_rgba(0,0,0,.16)]" style={{ left: `${x}%` }} />
          ))}
          <span className="absolute top-[26px] -translate-x-1/2 rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[11px] font-semibold text-white" style={{ left: '70%' }}>
            €140
          </span>
          <span className="absolute top-[94px] left-0 text-[11px] text-[#6b6b70]">€0</span>
          <span className="absolute top-[94px] right-0 text-[11px] text-[#6b6b70]">€200</span>

          {/* markers above */}
          <Marker n={4} className="top-[-6px] left-[70%] -translate-x-1/2" />
          <span className="absolute top-[18px] left-[70%] h-2 w-px bg-[#5b4bff]" />
          <Marker n={1} className="top-[16px] left-[90%] -translate-x-1/2" />
          <span className="absolute top-[40px] left-[90%] h-6 w-px bg-[#5b4bff]" />
          {/* markers below */}
          <Marker n={6} className="top-[132px] left-[6px] -translate-x-1/2" />
          <span className="absolute top-[110px] left-[6px] h-[22px] w-px bg-[#5b4bff]" />
          <Marker n={3} className="top-[132px] left-[20%] -translate-x-1/2" />
          <span className="absolute top-[80px] left-[20%] h-[52px] w-px bg-[#5b4bff]" />
          <Marker n={2} className="top-[132px] left-[45%] -translate-x-1/2" />
          <span className="absolute top-[68px] left-[45%] h-16 w-px bg-[#5b4bff]" />
          <Marker n={5} className="top-[132px] left-[80%] -translate-x-1/2" />
          <span className="absolute top-[82px] left-[80%] h-[50px] w-px bg-[#5b4bff]" />
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
