import { CircleX, Mic, Search, SlidersHorizontal } from 'lucide-react';

const parts = [
  { n: 1, name: 'Search icon', text: 'The magnifying glass that tells everyone "this field searches". Usually decorative, so screen readers skip it.' },
  { n: 2, name: 'Placeholder', text: 'Hint text like "Dishes, restaurants". It disappears as you type, so it can\'t be the only label.' },
  { n: 3, name: 'Voice search', text: 'Optional microphone, shown while the field is empty. Needs microphone permission.' },
  { n: 4, name: 'Scope / filter button', text: 'Optional. Narrows what is searched (All, Dishes, Restaurants) or opens filters.' },
  { n: 5, name: 'Query', text: 'What the user typed. Single line, scrolls sideways when it gets long.' },
  { n: 6, name: 'Clear button (×)', text: 'Appears when there is text. Empties the field and keeps the keyboard open.' },
  { n: 7, name: 'Cancel', text: 'iOS only. Leaves search mode and returns to the screen as it was before.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}
const Line = ({ className }: { className: string }) => <span className={`absolute w-px bg-[#5b4bff] ${className}`} />;

export default function Anatomy() {
  const grey = 'rgba(60,60,67,.6)';
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-white px-4 py-12 text-black sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto max-w-[19rem] space-y-24">
          {/* idle */}
          <div className="relative">
            <p className="absolute -top-9 left-0 text-[11px] font-semibold tracking-wide text-[#8e8e93] uppercase">Idle</p>
            <div className="flex items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-2" style={{ background: 'rgba(118,118,128,.12)' }}>
                <Search size={16} strokeWidth={2.4} style={{ color: grey }} />
                <span className="flex-1 truncate text-[16px]" style={{ color: grey }}>
                  Dishes, restaurants
                </span>
                <Mic size={17} style={{ color: grey }} />
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: 'rgba(118,118,128,.12)' }}>
                <SlidersHorizontal size={16} className="text-[#007aff]" />
              </span>
            </div>
            <Marker n={1} className="-bottom-10 left-0" />
            <Line className="-bottom-4 left-[0.75rem] h-4" />
            <Marker n={2} className="-bottom-10 left-[30%]" />
            <Line className="-bottom-4 left-[calc(30%+0.75rem)] h-4" />
            <Marker n={3} className="-top-9 right-[3.4rem]" />
            <Line className="-top-3 right-[4.15rem] h-3" />
            <Marker n={4} className="-top-9 right-1.5" />
            <Line className="-top-3 right-[1.1rem] h-3" />
          </div>
          {/* active */}
          <div className="relative">
            <p className="absolute -top-9 left-0 text-[11px] font-semibold tracking-wide text-[#8e8e93] uppercase">Typing</p>
            <div className="flex items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-2" style={{ background: 'rgba(118,118,128,.12)' }}>
                <Search size={16} strokeWidth={2.4} style={{ color: grey }} />
                <span className="flex flex-1 items-center text-[16px]">
                  pizza
                  <span className="ml-px inline-block h-5 w-[2px] rounded bg-[#007aff]" />
                </span>
                <CircleX size={17} fill="#a3a3a8" color="#fff" strokeWidth={2.2} />
              </div>
              <span className="shrink-0 text-[16px] text-[#007aff]">Cancel</span>
            </div>
            <Marker n={5} className="-bottom-10 left-[22%]" />
            <Line className="-bottom-4 left-[calc(22%+0.75rem)] h-4" />
            <Marker n={6} className="-bottom-10 right-[4.25rem]" />
            <Line className="-bottom-4 right-[5rem] h-4" />
            <Marker n={7} className="-bottom-10 right-3" />
            <Line className="-bottom-4 right-[1.5rem] h-4" />
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
