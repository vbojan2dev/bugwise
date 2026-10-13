import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, RotateCcw, X } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { formatSize, extensionOf, type TestFile } from './files';
import { FileIcon, PickerDialog, TestKit } from './parts';

/*
 * A deliberately broken expense claim form. Bugs (don't spoil them for learners!):
 *  1. "browse" is a <span> with a click handler: not focusable, so keyboard users can't pick files.
 *  2. The type check is case-sensitive: SCAN_0042.PDF is rejected.
 *  3. The 10 MB limit is not shown anywhere; a 14 MB file uploads completely, then fails.
 *  4. The list is shown newest-first, but Remove uses the index of the unreversed array: the wrong file goes.
 *  5. On an unstable network, failed uploads are silently removed from the list (no error, no retry).
 *  6. Long file names don't truncate (no min-w-0 / truncate) and push the Remove button out of view.
 */

const KB = 1024;
const MB = KB * 1024;
const kit: TestFile[] = [
  { id: 'taxi', name: 'Taxi_receipt.pdf', size: 86 * KB, real: 'pdf', note: 'Normal PDF' },
  { id: 'flight', name: 'Flight_LH1234.pdf', size: 420 * KB, real: 'pdf', note: 'Normal PDF' },
  { id: 'scan', name: 'SCAN_0042.PDF', size: 1.8 * MB, real: 'pdf', note: 'From an office scanner' },
  { id: 'dinner', name: 'team-dinner.xlsx', size: 64 * KB, real: 'xlsx', note: 'Spreadsheet' },
  { id: 'hotel', name: 'Hotel_invoice_Grand_Hotel_Europa_Innsbruck_2026-09-14_booking_884213.pdf', size: 1.4 * MB, real: 'pdf', note: 'Very long name' },
  { id: 'folio', name: 'Hotel_folio_scan_600dpi.pdf', size: 14.2 * MB, real: 'pdf', note: 'High-res scan' },
];
const allowed = ['pdf', 'docx', 'xlsx', 'csv'];

interface Entry {
  uid: number;
  file: TestFile;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}
interface Req {
  id: number;
  name: string;
  result?: string;
  ok?: boolean;
}

export function BuggyExpenseApp() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [over, setOver] = useState(false);
  const [unstable, setUnstable] = useState(false);
  const [desc, setDesc] = useState('Client visit, Innsbruck');
  const [submitted, setSubmitted] = useState<string[] | null>(null);
  const [log, setLog] = useState<Req[]>([]);
  const uid = useRef(1);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  const unstableRef = useRef(unstable);
  unstableRef.current = unstable;

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const upload = (file: TestFile, id: number) => {
    const reqId = ++seq.current;
    const willFail = unstableRef.current && reqId % 2 === 0;
    const ms = Math.max(700, (file.size / (4 * MB)) * 1000);
    setLog((l) => [{ id: reqId, name: file.name }, ...l].slice(0, 6));
    let p = 0;
    const t = window.setInterval(() => {
      p = Math.min(100, p + 10000 / ms);
      if (willFail && p >= 60) {
        clearInterval(t);
        setEntries((es) => es.filter((e) => e.uid !== id)); // BUG 5: the file just vanishes
        setLog((l) => l.map((r) => (r.id === reqId ? { ...r, result: 'ERR connection reset', ok: false } : r)));
        return;
      }
      if (p >= 100) {
        clearInterval(t);
        const tooBig = file.size > 10 * MB; // BUG 3: checked only by the server, after the upload
        setEntries((es) => es.map((e) => (e.uid === id ? { ...e, progress: 100, status: tooBig ? 'error' : 'done', error: tooBig ? 'Upload failed: file too large (max 10 MB).' : undefined } : e)));
        setLog((l) => l.map((r) => (r.id === reqId ? { ...r, result: tooBig ? '413 Payload Too Large' : '201 Created', ok: !tooBig } : r)));
        return;
      }
      setEntries((es) => es.map((e) => (e.uid === id ? { ...e, progress: p } : e)));
    }, 100);
    timers.current.push(t);
  };

  const add = (files: TestFile[]) => {
    setSubmitted(null);
    const ok: Entry[] = [];
    const bad: string[] = [];
    for (const f of files) {
      if (!allowed.includes(extensionOf(f.name))) bad.push(f.name); // BUG 2: case-sensitive
      else ok.push({ uid: uid.current++, file: f, status: 'uploading', progress: 0 });
    }
    setNotice(bad.length ? `${bad.join(', ')}: file type not supported. Allowed: PDF, DOCX, XLSX, CSV.` : null);
    if (ok.length) setEntries((es) => [...es, ...ok]);
    ok.forEach((e) => upload(e.file, e.uid));
  };

  const shown = [...entries].reverse(); // newest first
  const removeAt = (index: number) => setEntries((es) => es.filter((_, i) => i !== index)); // BUG 4: index in `shown`, used on `entries`

  const restart = () => {
    timers.current.forEach(clearInterval);
    timers.current = [];
    setEntries([]);
    setNotice(null);
    setLog([]);
    setSubmitted(null);
    setDialog(false);
    setDesc('Client visit, Innsbruck');
  };

  const busy = entries.some((e) => e.status === 'uploading');

  return (
    <div className="flex w-full max-w-[480px] min-w-0 flex-col gap-4">
      <BrowserFrame url="expenses.example.com">
        <div className="relative min-h-[26rem] p-4 sm:p-5" style={{ background: '#fff', color: '#1f2328', colorScheme: 'light' }}>
          <p className="text-[18px] font-bold">New expense claim</p>
          <label className="mt-3 block text-[12px] font-semibold" htmlFor="claim-desc">
            Description
          </label>
          <input id="claim-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1 h-9 w-full min-w-0 rounded-lg border border-[#d0d7de] px-2 text-[13px] focus:outline-2 focus:outline-[#2563eb]" />

          <p className="mt-4 text-[12px] font-semibold">Receipts</p>
          <p className="text-[11px] text-[#57606a]">PDF, DOCX, XLSX or CSV</p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setOver(true)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              const f = kit.find((x) => x.id === e.dataTransfer.getData('text/x-test-file'));
              if (f) add([f]);
            }}
            className={`mt-1.5 flex flex-col items-center gap-1 rounded-xl border-2 border-dashed px-3 py-4 text-center text-[13px] ${over ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#c9ced6]'}`}
          >
            <CloudUpload size={22} className="text-[#2563eb]" aria-hidden="true" />
            <p>
              Drop receipts here or{' '}
              {/* BUG 1: not a button, not focusable */}
              <span onClick={() => setDialog(true)} className="cursor-pointer font-semibold text-[#2563eb] underline">
                browse
              </span>
            </p>
          </div>

          {notice && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#ffebe9] px-2 py-1.5 text-[11px] text-[#cf222e]" role="alert">
              <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" /> <span className="min-w-0 break-words">{notice}</span>
            </p>
          )}

          <ul className="mt-3 space-y-1.5">
            {shown.map((e, index) => (
              <li key={e.uid} className={`rounded-lg border px-2 py-1.5 ${e.status === 'error' ? 'border-[#f5c2c7]' : 'border-[#e5e7eb]'}`}>
                <div className="flex items-center gap-2">
                  <FileIcon name={e.file.name} size={18} />
                  {/* BUG 6: no min-w-0 / truncate */}
                  <div className="flex-1">
                    <p className="text-[12px] font-medium whitespace-nowrap">{e.file.name}</p>
                    <p className={`flex items-center gap-1 text-[10px] ${e.status === 'error' ? 'text-[#cf222e]' : e.status === 'done' ? 'text-[#1a7f37]' : 'text-[#57606a]'}`}>
                      {e.status === 'done' && <CheckCircle2 size={10} aria-hidden="true" />}
                      {formatSize(e.file.size)} · {e.status === 'uploading' ? `Uploading ${Math.round(e.progress)}%` : e.status === 'done' ? 'Uploaded' : e.error}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeAt(index)} aria-label={`Remove ${e.file.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#57606a] hover:bg-black/5">
                    <X size={15} />
                  </button>
                </div>
                {e.status === 'uploading' && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                    <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${e.progress}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#57606a]">{entries.length} file{entries.length === 1 ? '' : 's'} attached</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (entries.length === 0) setNotice('Add at least one receipt.');
                else setSubmitted(entries.filter((e) => e.status === 'done').map((e) => e.file.name));
              }}
              className="rounded-lg bg-[#1f883d] px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f883d] disabled:opacity-40"
            >
              Submit claim
            </button>
          </div>
          {submitted && (
            <p className="mt-2 rounded-lg bg-[#dafbe1] px-2 py-1.5 text-[11px] text-[#1a7f37]" role="status">
              Claim submitted with {submitted.length} receipt{submitted.length === 1 ? '' : 's'}
              {submitted.length ? `: ${submitted.join(', ')}` : '.'}
            </p>
          )}

          {dialog && (
            <PickerDialog
              files={kit}
              onClose={() => setDialog(false)}
              onPick={(fs) => {
                setDialog(false);
                add(fs);
              }}
            />
          )}
        </div>
      </BrowserFrame>

      <TestKit files={kit} onAdd={(f) => add([f])} label="Files on your computer" />

      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device settings</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reload page
          </button>
        </div>
        <label className="mt-2 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm">
          Unstable network (drops connections)
          <input type="checkbox" checked={unstable} onChange={(e) => setUnstable(e.target.checked)} className="accent-[var(--brand)]" />
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Add a receipt to see upload requests…</li>}
          {log.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">POST</span>
              <span className="min-w-0 flex-1 truncate">/api/receipts · {r.name}</span>
              {r.result ? <span className={`shrink-0 ${r.ok ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{r.result}</span> : <span className="shrink-0 text-[#fbbf24]">pending…</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
