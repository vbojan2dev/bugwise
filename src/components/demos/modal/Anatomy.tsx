import { X } from 'lucide-react';

const parts = [
  { n: 1, name: 'Scrim (backdrop)', text: 'A dark layer over the page. It shows that the page behind is blocked until you finish.' },
  { n: 2, name: 'Container', text: 'The dialog surface itself. It must fit the screen, even on a small phone with large text.' },
  { n: 3, name: 'Title', text: 'A short question or statement: "Delete 3 photos?", not "Are you sure?".' },
  { n: 4, name: 'Supporting text', text: 'Explains the consequence. Long content must scroll inside the container.' },
  { n: 5, name: 'Dismissive action', text: 'Cancel / Keep editing. Closes the dialog without changing anything.' },
  { n: 6, name: 'Confirming action', text: 'The verb from the title ("Delete"). Red when it destroys data.' },
  { n: 7, name: 'Close button', text: 'Optional X (common on web). Behaves exactly like Cancel.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/25 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div
        role="img"
        aria-label="A web dialog titled 'Delete 3 photos?' over a dimmed page, with numbered markers for each part"
        className="relative overflow-hidden rounded-2xl bg-[#e9ebf2] px-4 py-10 sm:px-8"
      >
        <div aria-hidden="true" className="absolute inset-0 space-y-2 p-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-white/80" />
          ))}
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <Marker n={1} className="right-2 bottom-2" />
        <div aria-hidden="true" className="relative mx-auto max-w-[17rem] rounded-xl bg-white text-[#0e1120] shadow-xl">
          <Marker n={2} className="-top-3 -left-3" />
          <div className="relative flex items-start gap-2 px-4 pt-4">
            <p className="relative flex-1 text-[15px] font-semibold">
              Delete 3 photos?
              <Marker n={3} className="-top-1 right-6" />
            </p>
            <span className="relative grid size-7 place-items-center rounded-md text-[#6b7080]">
              <X size={16} />
              <Marker n={7} className="-top-4 -right-4" />
            </span>
          </div>
          <p className="relative px-4 pt-1 pb-4 text-[13px] leading-snug text-[#4a4f60]">
            They will be removed from all your devices. You can restore them from Recently deleted for 30 days.
            <Marker n={4} className="-right-3 bottom-2" />
          </p>
          <div className="relative flex justify-end gap-2 rounded-b-xl border-t border-[#eceef3] bg-[#f8f9fb] px-4 py-3">
            <span className="relative rounded-lg border border-[#d0d4de] bg-white px-3 py-1.5 text-[13px] font-medium">
              Cancel
              <Marker n={5} className="-bottom-4 left-1/2 -translate-x-1/2" />
            </span>
            <span className="relative rounded-lg bg-[#d92d20] px-3 py-1.5 text-[13px] font-medium text-white">
              Delete
              <Marker n={6} className="-bottom-4 left-1/2 -translate-x-1/2" />
            </span>
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
