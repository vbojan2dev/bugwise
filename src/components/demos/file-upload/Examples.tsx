import { AlertTriangle, CloudUpload, Trash2 } from 'lucide-react';
import { FileIcon, FileName } from './parts';

/* Small static examples for the Do / Don't blocks. Each renders on its own light surface. */

const wrap = 'rounded-xl bg-white p-3 text-[#1f2328] shadow-sm';

export function DropArea({ good = false }: { good?: boolean }) {
  return (
    <div className={wrap} style={{ colorScheme: 'light' }}>
      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#c9ced6] px-3 py-4 text-center">
        <CloudUpload size={22} className="text-[#2563eb]" aria-hidden="true" />
        <p className="text-[12px]">{good ? 'Drag files here, or' : 'Drop your files here'}</p>
        {good && <span className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-[12px] font-semibold text-white">Browse files</span>}
      </div>
    </div>
  );
}

export function Rules({ good = false }: { good?: boolean }) {
  return (
    <div className={wrap} style={{ colorScheme: 'light' }}>
      <p className="text-[13px] font-semibold">Upload your bank statement</p>
      {good && <p className="text-[11px] text-[#57606a]">PDF or CSV · up to 10 MB</p>}
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-2 py-1.5">
        <FileIcon name="a.pdf" size={18} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium">statement_2025_full_year.pdf</p>
          {good ? (
            <p className="flex items-center gap-1 text-[10px] text-[#cf222e]">
              <AlertTriangle size={10} aria-hidden="true" /> 24.3 MB is over the 10 MB limit. Not uploaded.
            </p>
          ) : (
            <p className="flex items-center gap-1 text-[10px] text-[#cf222e]">
              <AlertTriangle size={10} aria-hidden="true" /> Upload failed (after 2 min 10 s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const longName = 'Hotel_invoice_Grand_Hotel_Europa_Innsbruck_2026-09-14_booking_884213.pdf';

export function LongName({ good = false }: { good?: boolean }) {
  return (
    <div className={`${wrap} overflow-hidden`} style={{ colorScheme: 'light' }}>
      <div className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-2 py-1.5">
        <FileIcon name="a.pdf" size={18} />
        {good ? (
          <div className="min-w-0 flex-1">
            <FileName name={longName} className="text-[12px] font-medium" />
            <p className="text-[10px] text-[#57606a]">1.4 MB · Uploaded</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-[12px] font-medium whitespace-nowrap">{longName}</p>
            <p className="text-[10px] text-[#57606a]">1.4 MB · Uploaded</p>
          </div>
        )}
        <span className="grid size-7 shrink-0 place-items-center text-[#57606a]" aria-hidden="true">
          <Trash2 size={14} />
        </span>
      </div>
    </div>
  );
}
