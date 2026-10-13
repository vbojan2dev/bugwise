import { AlertTriangle, CheckCircle2, CloudUpload, RotateCw, Trash2, X } from 'lucide-react';
import { FileIcon, FileName } from './parts';

const parts = [
  { n: 1, name: 'Label and rules', text: 'Says what to upload and the limits: allowed types, max size, max number of files. Shown before the user picks anything.' },
  { n: 2, name: 'Drop zone', text: 'An area where files can be dropped (web, desktop). A shortcut, never the only way in.' },
  { n: 3, name: 'Browse button', text: 'Opens the system file picker. A real, labelled button that works with touch, mouse, keyboard and screen readers.' },
  { n: 4, name: 'File row', text: 'Icon, name (long names truncate in the middle, so the extension stays visible) and size.' },
  { n: 5, name: 'Per-file progress', text: 'Each file shows its own progress and state: uploading, processing, uploaded, failed.' },
  { n: 6, name: 'Cancel / Remove', text: 'Cancel stops a running upload; Remove takes a file out. Each button names its file for screen readers.' },
  { n: 7, name: 'Error + Retry', text: 'A failed file stays in the list with a reason and a Retry button. It never silently disappears.' },
  { n: 8, name: 'Summary', text: '"2 of 3 uploaded · 1 failed". Tells the user whether it is safe to press Submit.' },
];

function Marker({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-2 ring-white ${className}`}>
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f6f7fb] px-3 py-6 sm:px-5" style={{ colorScheme: 'light' }}>
        <div className="mx-auto max-w-[21rem] rounded-2xl bg-white p-3 text-[#1f2328] shadow-sm" role="img" aria-label="Anatomy of a file upload component with numbered parts">
          <div className="relative pr-6">
            <p className="text-[14px] font-semibold">Receipts</p>
            <p className="text-[11px] text-[#57606a]">PDF or DOCX · up to 10 MB each · max 5 files</p>
            <Marker n={1} className="top-0 right-0" />
          </div>
          <div className="relative mt-2 flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-[#c9ced6] px-3 py-3 text-center">
            <Marker n={2} className="-top-2.5 -left-2.5" />
            <CloudUpload size={20} className="text-[#2563eb]" />
            <p className="text-[12px]">Drag files here, or</p>
            <span className="relative rounded-lg bg-[#2563eb] px-3 py-1.5 text-[12px] font-semibold text-white">
              Browse files
              <Marker n={3} className="-top-2.5 -right-6" />
            </span>
          </div>
          <div className="relative mt-2 flex items-center justify-between pr-6 text-[11px] text-[#57606a]">
            <span>2 of 3 uploaded · 1 failed</span>
            <Marker n={8} className="top-0 right-0" />
          </div>
          <ul className="mt-1.5 space-y-1.5">
            <li className="relative rounded-lg border border-[#e5e7eb] px-2 py-1.5">
              <Marker n={4} className="-top-2.5 -left-2.5" />
              <div className="flex items-center gap-2">
                <FileIcon name="a.pdf" size={18} />
                <div className="min-w-0 flex-1">
                  <FileName name="Hotel_invoice_Grand_Hotel_Europa_Sept.pdf" className="text-[12px] font-medium" />
                  <p className="text-[10px] text-[#57606a]">1.2 MB · Uploading… 64%</p>
                </div>
                <span className="relative grid size-7 place-items-center text-[#57606a]">
                  <X size={14} />
                  <Marker n={6} className="-top-3 -right-2" />
                </span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-[#e5e7eb]">
                <div className="h-full w-[64%] rounded-full bg-[#2563eb]" />
                <Marker n={5} className="-top-2 left-[64%]" />
              </div>
            </li>
            <li className="rounded-lg border border-[#e5e7eb] px-2 py-1.5">
              <div className="flex items-center gap-2">
                <FileIcon name="a.docx" size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium">Taxi receipt.docx</p>
                  <p className="flex items-center gap-1 text-[10px] text-[#1a7f37]">
                    <CheckCircle2 size={10} /> 86 KB · Uploaded
                  </p>
                </div>
                <span className="grid size-7 place-items-center text-[#57606a]">
                  <Trash2 size={14} />
                </span>
              </div>
            </li>
            <li className="relative rounded-lg border border-[#f5c2c7] px-2 py-1.5">
              <div className="flex items-center gap-2">
                <FileIcon name="a.pdf" size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium">Flight_LH1234.pdf</p>
                  <p className="flex items-center gap-1 text-[10px] text-[#cf222e]">
                    <AlertTriangle size={10} /> Connection lost at 40%
                  </p>
                </div>
                <span className="relative grid size-7 place-items-center text-[#2563eb]">
                  <RotateCw size={14} />
                  <Marker n={7} className="-top-3 -left-3" />
                </span>
                <span className="grid size-7 place-items-center text-[#57606a]">
                  <Trash2 size={14} />
                </span>
              </div>
            </li>
          </ul>
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
