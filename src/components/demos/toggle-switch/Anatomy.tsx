import { Switch } from './Switch';

const parts = [
  { n: 1, name: 'Track', text: 'The pill-shaped background. Its color shows on (filled) or off (empty).' },
  { n: 2, name: 'Handle (thumb)', text: 'The circle that slides from one side to the other. On Android it grows when switched on.' },
  { n: 3, name: 'Icon (optional)', text: 'Material 3 can show a check or a cross inside the handle, so the state is not shown by color alone.' },
  { n: 4, name: 'Label', text: 'Names the setting in positive words: "Order updates", not "Disable order updates".' },
  { n: 5, name: 'Supporting text (optional)', text: 'Explains the effect. On Android the whole row is usually tappable.' },
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
      <div className="rounded-2xl bg-[#fef7ff] px-4 py-14 sm:px-6">
        <div className="relative mx-auto flex max-w-[19rem] items-center gap-4 rounded-2xl bg-white px-4 py-3 text-[#1d1b20] shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">Order updates</p>
            <p className="text-[12px] text-[#49454f]">Rider location and arrival time</p>
          </div>
          <Switch platform="material" checked icons decorative />
          <Marker n={1} className="-top-9 right-[48px]" />
          <span className="absolute -top-3 right-[60px] h-[27px] w-px bg-[#5b4bff]" />
          <Marker n={2} className="-bottom-10 right-[28px]" />
          <span className="absolute -bottom-4 right-[40px] h-[35px] w-px bg-[#5b4bff]" />
          <Marker n={3} className="-top-9 right-[20px]" />
          <span className="absolute -top-3 right-[32px] h-[33px] w-px bg-[#5b4bff]" />
          <Marker n={4} className="-top-9 left-4" />
          <span className="absolute -top-3 left-7 h-[24px] w-px bg-[#5b4bff]" />
          <Marker n={5} className="-bottom-10 left-10" />
          <span className="absolute -bottom-4 left-[52px] h-[28px] w-px bg-[#5b4bff]" />
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
