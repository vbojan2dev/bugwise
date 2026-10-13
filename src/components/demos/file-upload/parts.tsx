import { useEffect, useRef, useState } from 'react';
import { FileText, FileSpreadsheet, FileArchive, File as FileGeneric, FileImage, Folder, X } from 'lucide-react';
import { extensionOf, formatSize, splitName, type TestFile } from './files';

/** Colored document icon by extension (what the user sees, not what the file really is). */
export function FileIcon({ name, size = 20 }: { name: string; size?: number }) {
  const ext = extensionOf(name).toLowerCase();
  const map: Record<string, { Icon: typeof FileText; color: string }> = {
    pdf: { Icon: FileText, color: '#d93025' },
    docx: { Icon: FileText, color: '#2b579a' },
    xlsx: { Icon: FileSpreadsheet, color: '#217346' },
    csv: { Icon: FileSpreadsheet, color: '#217346' },
    zip: { Icon: FileArchive, color: '#8a6d1f' },
    png: { Icon: FileImage, color: '#7b3fe4' },
  };
  const { Icon, color } = map[ext] ?? { Icon: FileGeneric, color: '#6b7280' };
  return <Icon size={size} style={{ color }} className="shrink-0" aria-hidden="true" />;
}

/** File name that truncates in the middle, so the extension stays visible. */
export function FileName({ name, className = '' }: { name: string; className?: string }) {
  const [start, end] = splitName(name);
  return (
    <span className={`flex min-w-0 ${className}`} title={name}>
      <span className="truncate">{start}</span>
      {end && <span className="shrink-0 whitespace-pre">{end}</span>}
    </span>
  );
}

/**
 * A simulated "Open" dialog that lists the test files, so learners can "browse" without real files.
 * Rendered absolutely inside its (relative) demo container.
 */
export function PickerDialog({
  files,
  onPick,
  onClose,
  onReal,
  accept,
  title = 'Open',
}: {
  files: TestFile[];
  onPick: (picked: TestFile[]) => void;
  onClose: () => void;
  /** Optional: offer the device's real file chooser. */
  onReal?: () => void;
  accept?: string;
  title?: string;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/35 p-3"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white text-[#1f2328] shadow-2xl" style={{ colorScheme: 'light' }}>
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Folder size={15} className="text-[#3b82f6]" aria-hidden="true" /> Documents
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md hover:bg-black/5">
            <X size={15} />
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1">
          {files.map((f, i) => (
            <li key={f.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f3f4f6]">
                <input ref={i === 0 ? first : undefined} type="checkbox" checked={sel.includes(f.id)} onChange={() => toggle(f.id)} className="accent-[#2563eb]" />
                <FileIcon name={f.name} size={16} />
                <FileName name={f.name} className="flex-1" />
                <span className="shrink-0 text-[11px] text-[#6b7280] tabular-nums">{formatSize(f.size)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7eb] px-3 py-2">
          {accept ? <span className="text-[10px] text-[#6b7280]">Format: {accept}</span> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-[#d1d5db] px-3 py-1 text-[12px]">
              Cancel
            </button>
            <button
              type="button"
              disabled={!sel.length}
              onClick={() => onPick(files.filter((f) => sel.includes(f.id)))}
              className="rounded-md bg-[#2563eb] px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              Open
            </button>
          </div>
        </div>
        {onReal && (
          <button type="button" onClick={onReal} className="border-t border-[#e5e7eb] px-3 py-1.5 text-left text-[11px] text-[#2563eb] underline">
            Use real files from this device instead
          </button>
        )}
      </div>
    </div>
  );
}

/** Draggable test files, like a desktop folder next to the browser. Tap adds a file (touch screens can't drag). */
export function TestKit({ files, onAdd, label = 'Your test files' }: { files: TestFile[]; onAdd: (f: TestFile) => void; label?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <p className="mt-0.5 text-xs text-muted">Drag a file onto the drop zone, or tap it to add it.</p>
      <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {files.map((f) => (
          <li key={f.id} className="min-w-0">
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/x-test-file', f.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAdd(f)}
              className="flex w-full min-w-0 cursor-grab items-center gap-2 rounded-lg border border-line bg-subtle px-2 py-1.5 text-left hover:border-brand active:cursor-grabbing"
              aria-label={`Add ${f.name}, ${formatSize(f.size)}`}
            >
              <FileIcon name={f.name} size={16} />
              <span className="min-w-0 flex-1">
                <FileName name={f.name} className="text-[12px] font-medium text-fg" />
                <span className="block truncate text-[10px] text-muted">
                  {formatSize(f.size)} · {f.note}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
