import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, RotateCw, Trash2, X, Volume2 } from 'lucide-react';
import { browserMime, extensionOf, formatSize, sniff, testKit, type TestFile } from './files';
import { FileIcon, FileName, PickerDialog, TestKit } from './parts';

/*
 * "Upload lab": a correct uploader whose rules you can change. Every settings change replays
 * the upload with the same files, so each toggle has a visible effect on the list.
 */

const MB = 1024 * 1024;
const TOTAL_MB = 60;
const allowedExt = ['pdf', 'docx', 'csv', 'zip'];
const allowedMime = allowedExt.map((e) => browserMime(`x.${e}`));
const allowedReal = ['pdf', 'docx', 'csv', 'zip'];

type Check = 'ext-case' | 'ext' | 'mime';
type Dupes = 'allow' | 'skip' | 'rename';
type Network = 'fast' | 'slow' | 'unstable';
type Status = 'rejected' | 'uploading' | 'processing' | 'done' | 'failed' | 'canceled';

interface Settings {
  check: Check;
  client: boolean;
  maxSize: number;
  maxFiles: number;
  dupes: Dupes;
  network: Network;
}

interface Picked {
  key: number;
  file: TestFile;
}

interface Item {
  key: number;
  file: TestFile;
  name: string;
  status: Status;
  progress: number;
  /** Progress added per 100 ms tick. */
  step: number;
  failAt: number | null;
  left: number;
  attempt: number;
  message?: string;
  retry?: boolean;
}

const speeds: Record<Network, number> = { fast: 6 * MB, slow: 0.6 * MB, unstable: 2 * MB };

function start(item: Omit<Item, 'status' | 'progress' | 'step' | 'failAt' | 'left'>, s: Settings): Item {
  const ms = Math.min(20000, Math.max(900, (item.file.size / speeds[s.network]) * 1000));
  return {
    ...item,
    status: 'uploading',
    progress: 0,
    step: 100 / (ms / 100),
    failAt: s.network === 'unstable' && item.key % 2 === 0 && item.attempt === 1 ? 45 + (item.key % 3) * 10 : null,
    left: 6,
    message: undefined,
    retry: false,
  };
}

function rename(name: string, n: number) {
  const ext = extensionOf(name);
  return ext ? `${name.slice(0, -(ext.length + 1))} (${n}).${ext}` : `${name} (${n})`;
}

function validate(p: Picked, before: Item[], s: Settings): Item {
  const f = p.file;
  const base = { key: p.key, file: f, name: f.name, attempt: 1 };
  const reject = (message: string): Item => ({ ...base, status: 'rejected', progress: 0, step: 0, failAt: null, left: 0, message });
  const active = before.filter((i) => i.status !== 'rejected' && i.status !== 'canceled');

  const same = active.filter((i) => i.file.name === f.name && i.file.size === f.size);
  if (same.length) {
    if (s.dupes === 'skip') return reject('Already in the list, so it was skipped.');
    if (s.dupes === 'rename') base.name = rename(f.name, same.length + 1);
  }
  if (s.client) {
    const ext = extensionOf(f.name);
    if (f.size === 0) return reject('This file is empty (0 bytes).');
    if (s.check === 'ext-case' && !allowedExt.includes(ext)) return reject(`".${ext || '?'}" files aren't accepted. Use PDF, DOCX, CSV or ZIP.`);
    if (s.check === 'ext' && !allowedExt.includes(ext.toLowerCase())) return reject(`".${ext || '?'}" files aren't accepted. Use PDF, DOCX, CSV or ZIP.`);
    if (s.check === 'mime' && !allowedMime.includes(browserMime(f.name))) return reject(`Type "${browserMime(f.name) || 'unknown'}" isn't accepted. Use PDF, DOCX, CSV or ZIP.`);
    if (f.size > s.maxSize * MB) return reject(`Larger than ${s.maxSize} MB (this file is ${formatSize(f.size)}).`);
    if (active.length >= s.maxFiles) return reject(`Only ${s.maxFiles} files allowed. Remove one to add another.`);
    const total = active.reduce((sum, i) => sum + i.file.size, 0);
    if (total + f.size > TOTAL_MB * MB) return reject(`This would go over ${TOTAL_MB} MB in total.`);
  }
  return start(base, s);
}

function serverCheck(f: TestFile, s: Settings): string | null {
  if (f.real === 'empty') return '400 · The file is empty.';
  if (f.real === 'exe') return '415 · The content is a Windows program, not a document.';
  if (f.real === 'png') return '415 · The content is a PNG image, not a PDF.';
  if (!allowedReal.includes(f.real)) return '415 · The content is not an allowed document type.';
  if (f.size > s.maxSize * MB) return `413 · Larger than ${s.maxSize} MB.`;
  return null;
}

function advance(i: Item, s: Settings): Item {
  if (i.status === 'uploading') {
    const progress = Math.min(100, i.progress + i.step);
    if (i.failAt !== null && progress >= i.failAt) {
      return { ...i, status: 'failed', progress: i.failAt, message: `Connection lost at ${i.failAt}%. Your file is still here.`, retry: true };
    }
    return progress >= 100 ? { ...i, progress: 100, status: 'processing' } : { ...i, progress };
  }
  if (i.status === 'processing') {
    if (i.left > 1) return { ...i, left: i.left - 1 };
    const err = serverCheck(i.file, s);
    return err
      ? { ...i, status: 'failed', message: `Uploaded ${formatSize(i.file.size)}, then the server rejected it: ${err}`, retry: false }
      : { ...i, status: 'done' };
  }
  return i;
}

const initialFiles = ['inv', 'scan', 'report', 'fake', 'long', 'dup'].map((id, n) => ({ key: n + 1, file: testKit.find((f) => f.id === id)! }));

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-faint uppercase">{label}</span>
      {children}
    </label>
  );
}

const selectCls = 'h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm';

export default function Playground() {
  const [check, setCheck] = useState<Check>('ext');
  const [client, setClient] = useState(true);
  const [maxSize, setMaxSize] = useState(10);
  const [maxFiles, setMaxFiles] = useState(10);
  const [dupes, setDupes] = useState<Dupes>('skip');
  const [network, setNetwork] = useState<Network>('fast');
  const [showRules, setShowRules] = useState(true);
  const settings = useMemo<Settings>(() => ({ check, client, maxSize, maxFiles, dupes, network }), [check, client, maxSize, maxFiles, dupes, network]);
  const sRef = useRef(settings);
  sRef.current = settings;

  const [picked, setPicked] = useState<Picked[]>(initialFiles);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const nextKey = useRef(initialFiles.length + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [dialog, setDialog] = useState(false);
  const [over, setOver] = useState(false);
  const realInput = useRef<HTMLInputElement>(null);
  const browseBtn = useRef<HTMLButtonElement>(null);
  const replaying = useRef(false);
  const prevStatus = useRef(new Map<number, Status>());

  const say = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4));

  // Replay all files whenever a rule changes.
  useEffect(() => {
    replaying.current = true;
    const out: Item[] = [];
    for (const p of pickedRef.current) out.push(validate(p, out, settings));
    setItems(out);
    setLog([`Rules changed: ${out.length} files added again.`]);
  }, [settings]);

  // Simulated upload clock.
  const busy = items.some((i) => i.status === 'uploading' || i.status === 'processing');
  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(() => setItems((prev) => prev.map((i) => advance(i, sRef.current))), 100);
    return () => clearInterval(t);
  }, [busy]);

  // What a screen reader would hear (aria-live announcements).
  useEffect(() => {
    const prev = prevStatus.current;
    const next = new Map<number, Status>();
    const msgs: string[] = [];
    for (const i of items) {
      next.set(i.key, i.status);
      if (replaying.current || prev.get(i.key) === i.status) continue;
      if (i.status === 'uploading') msgs.push(`${i.name} added. Uploading.`);
      if (i.status === 'rejected') msgs.push(`${i.name} not added. ${i.message}`);
      if (i.status === 'done') msgs.push(`${i.name} uploaded.`);
      if (i.status === 'failed') msgs.push(`${i.name} failed. ${i.retry ? 'Retry available.' : ''}`);
      if (i.status === 'canceled') msgs.push(`Upload of ${i.name} canceled.`);
    }
    replaying.current = false;
    prevStatus.current = next;
    if (msgs.length) setLog((l) => [...msgs.reverse(), ...l].slice(0, 4));
  }, [items]);

  const add = (files: TestFile[]) => {
    const ps = files.map((file) => ({ key: nextKey.current++, file }));
    setPicked((p) => [...p, ...ps]);
    setItems((prev) => {
      const out = [...prev];
      for (const p of ps) out.push(validate(p, out, sRef.current));
      return out;
    });
  };

  const addReal = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = await Promise.all(
      [...list].map(async (f, n) => ({ id: `real-${Date.now()}-${n}`, name: f.name, size: f.size, real: await sniff(f), note: 'Your file' }) as TestFile),
    );
    add(files);
  };

  const remove = (key: number) => {
    const it = items.find((i) => i.key === key);
    setPicked((p) => p.filter((x) => x.key !== key));
    setItems((prev) => prev.filter((i) => i.key !== key));
    if (it) say(`${it.name} removed.`);
  };
  const cancel = (key: number) => setItems((prev) => prev.map((i) => (i.key === key && (i.status === 'uploading' || i.status === 'processing') ? { ...i, status: 'canceled', message: 'Upload canceled.', retry: true } : i)));
  const retry = (key: number) => setItems((prev) => prev.map((i) => (i.key === key ? start({ key: i.key, file: i.file, name: i.name, attempt: i.attempt + 1 }, sRef.current) : i)));
  const clear = () => {
    setPicked([]);
    setItems([]);
    say('All files removed.');
  };

  const counted = items.filter((i) => i.status !== 'rejected' && i.status !== 'canceled');
  const done = items.filter((i) => i.status === 'done').length;
  const failed = items.filter((i) => i.status === 'failed').length;
  const totalBytes = counted.reduce((s, i) => s + i.file.size, 0);

  const issues: string[] = [];
  if (check === 'ext-case') issues.push('Exact-case check: SCAN_0042.PDF is rejected although it is a perfectly valid PDF. Extensions are not case-sensitive for users.');
  if (check === 'mime') issues.push('File.type comes from the extension too, so holiday-photo.pdf (really a PNG) still passes. Only the server can look inside the file.');
  if (!client) issues.push('No client checks: bad and oversized files upload completely before the server rejects them. That costs time and data, but the server still protects itself.');
  if (!showRules) issues.push('Rules hidden: users learn the limits only from error messages, after they picked a file.');
  if (dupes === 'allow') issues.push('Duplicates allowed: Invoice_March.pdf is uploaded twice and would be counted twice in the claim.');
  if (network === 'unstable') issues.push('Unstable network: failed files keep their place in the list and offer Retry. Nothing silently disappears.');
  if (maxFiles === 3) issues.push('With a 3-file limit, extra files are rejected with a message that says what to do.');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Upload lab</p>
        <p className="text-sm text-muted">A correct uploader for an expense claim. Change the rules and the network: the same files are uploaded again, so you can compare the results.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label="Check file type by">
            <select value={check} onChange={(e) => setCheck(e.target.value as Check)} className={selectCls}>
              <option value="ext">Extension, any case</option>
              <option value="ext-case">Extension, exact case</option>
              <option value="mime">MIME type (File.type)</option>
            </select>
          </Control>
          <Control label="Max size per file">
            <select value={maxSize} onChange={(e) => setMaxSize(+e.target.value)} className={selectCls}>
              {[5, 10, 50].map((n) => (
                <option key={n} value={n}>
                  {n} MB
                </option>
              ))}
            </select>
          </Control>
          <Control label="Max number of files">
            <select value={maxFiles} onChange={(e) => setMaxFiles(+e.target.value)} className={selectCls}>
              {[3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n} files
                </option>
              ))}
            </select>
          </Control>
          <Control label="Same file twice">
            <select value={dupes} onChange={(e) => setDupes(e.target.value as Dupes)} className={selectCls}>
              <option value="skip">Skip with a message</option>
              <option value="rename">Keep both, rename "(2)"</option>
              <option value="allow">Allow silently</option>
            </select>
          </Control>
          <Control label="Network">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
              {(
                [
                  ['fast', 'Fast 4G'],
                  ['slow', 'Slow 4G'],
                  ['unstable', 'Unstable'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={network === v} onClick={() => setNetwork(v)} className={`rounded-md py-1.5 ${network === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
          </Control>
          <label className="flex items-center justify-between gap-2 text-sm font-medium">
            Client-side checks
            <input type="checkbox" checked={client} onChange={(e) => setClient(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm font-medium">
            Show rules up front
            <input type="checkbox" checked={showRules} onChange={(e) => setShowRules(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          </label>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="relative p-4 sm:p-6" style={{ background: '#f6f7fb', color: '#1f2328', colorScheme: 'light' }}>
            <p className="text-[15px] font-semibold">Receipts and documents</p>
            {showRules && <p className="mt-0.5 text-[12px] text-[#57606a]">PDF, DOCX, CSV or ZIP · up to {maxSize} MB each · max {maxFiles} files, {TOTAL_MB} MB in total</p>}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDragEnter={() => setOver(true)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const id = e.dataTransfer.getData('text/x-test-file');
                const f = testKit.find((x) => x.id === id);
                if (f) add([f]);
                else void addReal(e.dataTransfer.files);
              }}
              className={`mt-3 flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${over ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#c9ced6] bg-white'}`}
            >
              <CloudUpload size={26} className="text-[#2563eb]" aria-hidden="true" />
              <p className="text-[13px]">Drag files here, or</p>
              <button
                ref={browseBtn}
                type="button"
                onClick={() => setDialog(true)}
                className="rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                Browse files
              </button>
            </div>
            <input
              ref={realInput}
              type="file"
              multiple
              accept=".pdf,.docx,.csv,.zip"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                void addReal(e.target.files);
                e.target.value = '';
              }}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#57606a]">
              <span>
                {done} of {counted.length} uploaded{failed ? ` · ${failed} failed` : ''} · {formatSize(totalBytes)} of {TOTAL_MB} MB
              </span>
              {items.length > 0 && (
                <button type="button" onClick={clear} className="font-medium text-[#2563eb] hover:underline">
                  Remove all
                </button>
              )}
            </div>

            <ul className="mt-2 space-y-2" aria-label="Selected files">
              {items.map((i) => (
                <FileRow key={i.key} item={i} onRemove={() => remove(i.key)} onCancel={() => cancel(i.key)} onRetry={() => retry(i.key)} />
              ))}
              {items.length === 0 && <li className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-4 text-center text-[12px] text-[#57606a]">No files yet.</li>}
            </ul>

            {dialog && (
              <PickerDialog
                files={testKit}
                accept="PDF, DOCX, CSV, ZIP"
                onClose={() => {
                  setDialog(false);
                  browseBtn.current?.focus();
                }}
                onPick={(fs) => {
                  setDialog(false);
                  add(fs);
                  browseBtn.current?.focus();
                }}
                onReal={() => {
                  setDialog(false);
                  realInput.current?.click();
                }}
              />
            )}
          </div>

          <div className="border-t border-line bg-[#0e1120] px-4 py-3 font-mono text-[11px] text-[#c9cde0]">
            <p className="mb-1 flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
              <Volume2 size={13} aria-hidden="true" /> Screen reader hears (aria-live)
            </p>
            <ul role="log" aria-live="polite" className="min-h-[4.5rem] space-y-0.5">
              {log.map((m, n) => (
                <li key={`${n}-${m}`} className={n === 0 ? 'text-white' : 'text-white/45'}>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t} className="flex items-start gap-2 text-sm text-fg">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> {t}
                </p>
              ))
            ) : (
              <p className="flex items-start gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> The client catches the duplicate, the server catches the renamed PNG. Now try exact-case checking, turning client checks off, or an unstable network.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line p-4">
        <TestKit files={testKit} onAdd={(f) => add([f])} />
      </div>
    </div>
  );
}

function FileRow({ item: i, onRemove, onCancel, onRetry }: { item: Item; onRemove: () => void; onCancel: () => void; onRetry: () => void }) {
  const busy = i.status === 'uploading' || i.status === 'processing';
  const statusText: Record<Status, string> = {
    uploading: `Uploading… ${Math.round(i.progress)}%`,
    processing: 'Processing…',
    done: 'Uploaded',
    failed: 'Failed',
    rejected: 'Not added',
    canceled: 'Canceled',
  };
  const color = i.status === 'done' ? '#1a7f37' : i.status === 'failed' || i.status === 'rejected' ? '#cf222e' : '#57606a';
  const bad = i.status === 'failed' || i.status === 'rejected';
  return (
    <li className={`rounded-xl border bg-white px-3 py-2 ${bad ? 'border-[#f5c2c7]' : 'border-[#e5e7eb]'}`}>
      <div className="flex items-center gap-2">
        <FileIcon name={i.name} />
        <div className="min-w-0 flex-1">
          <FileName name={i.name} className="text-[13px] font-medium" />
          <p className="flex items-center gap-1 text-[11px]" style={{ color }}>
            {i.status === 'done' && <CheckCircle2 size={12} aria-hidden="true" />}
            {bad && <AlertTriangle size={12} aria-hidden="true" />}
            {formatSize(i.file.size)} · {statusText[i.status]}
          </p>
        </div>
        {i.retry && !busy && (
          <button type="button" onClick={onRetry} aria-label={`Retry ${i.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#2563eb] hover:bg-[#eff6ff]">
            <RotateCw size={16} />
          </button>
        )}
        {busy ? (
          <button type="button" onClick={onCancel} aria-label={`Cancel upload of ${i.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#57606a] hover:bg-black/5">
            <X size={16} />
          </button>
        ) : (
          <button type="button" onClick={onRemove} aria-label={`Remove ${i.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#57606a] hover:bg-black/5">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {busy && (
        <div
          role="progressbar"
          aria-label={`Uploading ${i.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(i.progress)}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e5e7eb]"
        >
          <div className={`h-full rounded-full ${i.status === 'processing' ? 'animate-pulse bg-[#8b5cf6]' : 'bg-[#2563eb]'}`} style={{ width: `${i.progress}%` }} />
        </div>
      )}
      {i.message && bad && <p className="mt-1 text-[11px] leading-snug text-[#cf222e]">{i.message}</p>}
      {i.status === 'canceled' && <p className="mt-1 text-[11px] text-[#57606a]">Upload canceled. Retry or remove it.</p>}
    </li>
  );
}
