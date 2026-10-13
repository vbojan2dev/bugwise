import { MapPin, X } from 'lucide-react';

const parts = [
  { n: 1, name: 'Label', text: 'Says what to type ("City"). Visible and connected to the input, like any text field.' },
  { n: 2, name: 'Input (the combobox)', text: 'What the user typed. Its text is not the value yet: the value is set when an option is chosen.' },
  { n: 3, name: 'Clear button', text: 'Empties the field and the selection. Needs a name ("Clear city") and a 44 pt / 48 dp touch area.' },
  { n: 4, name: 'Suggestion list (listbox)', text: 'Opens below the field after enough characters. Must close on Esc, on selection and when focus leaves.' },
  { n: 5, name: 'Active option', text: 'Moved with the arrow keys, chosen with Enter. Clearly visible, and different from "selected".' },
  { n: 6, name: 'Matched part', text: 'The part of each option that matches the query, in bold. Must match the same way as the search (case, accents).' },
  { n: 7, name: 'Result count (status)', text: 'Invisible on screen but announced: "4 results available". Also says "No results".' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/20 ${className}`}>
      {n}
    </span>
  );
}

const rows = [
  { b: 'Novi', rest: ' Sad', pc: '21000' },
  { b: 'Novi', rest: ' Pazar', pc: '36300' },
  { b: 'Novi', rest: ' Bečej', pc: '21220' },
  { b: 'Novi', rest: ' Kneževac', pc: '23330' },
];

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-white p-5 pr-9 text-[#111827] sm:p-6 sm:pr-10" style={{ colorScheme: 'light' }}>
        <div className="relative mx-auto max-w-[18rem]">
          <p className="relative mb-1 text-[13px] font-medium">
            City
            <Marker n={1} className="-top-1 left-10" />
          </p>
          <div className="relative flex h-11 items-center rounded-lg border border-[#2563eb] bg-white pl-3 ring-2 ring-[#2563eb]/25">
            <span className="flex-1 text-[16px]">
              novi<span className="ml-px inline-block h-4 w-px bg-[#2563eb] align-middle" />
            </span>
            <span className="grid size-9 place-items-center text-[#6b7280]">
              <X size={16} aria-hidden="true" />
            </span>
            <Marker n={2} className="top-1/2 -left-3 -translate-y-1/2" />
            <Marker n={3} className="-top-3 right-1" />
          </div>
          <div className="relative mt-1 rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
            {rows.map((r, i) => (
              <div key={r.rest} className={`flex items-center gap-2 px-3 py-2 text-[14px] ${i === 1 ? 'bg-[#2563eb]/12' : ''}`}>
                <MapPin size={14} className="shrink-0 text-[#9ca3af]" aria-hidden="true" />
                <span className="flex-1">
                  <strong>{r.b}</strong>
                  {r.rest}
                </span>
                <span className="text-[12px] text-[#6b7280]">{r.pc}</span>
              </div>
            ))}
            <Marker n={4} className="top-1/2 -right-8 -translate-y-1/2" />
            <Marker n={5} className="top-[46px] -left-3" />
            <Marker n={6} className="top-[6px] -left-3" />
          </div>
          <p className="relative mt-2 inline-block rounded-md border border-dashed border-[#9ca3af] px-2 py-0.5 text-[11px] text-[#4b5563]">
            🔊 “4 results available”
            <Marker n={7} className="top-0 -right-8" />
          </p>
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
