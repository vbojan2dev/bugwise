/** Shared test data and helpers for the File Upload demos. */

/** What the bytes inside the file really are (what a server finds by "sniffing" the content). */
export type RealKind = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'zip' | 'png' | 'exe' | 'empty' | 'unknown';

export interface TestFile {
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  real: RealKind;
  /** Short tester note shown in the test kit. */
  note: string;
}

const KB = 1024;
const MB = 1024 * 1024;

export const testKit: TestFile[] = [
  { id: 'inv', name: 'Invoice_March.pdf', size: 240 * KB, real: 'pdf', note: 'Normal PDF' },
  { id: 'scan', name: 'SCAN_0042.PDF', size: 1.8 * MB, real: 'pdf', note: 'Uppercase extension' },
  { id: 'lease', name: 'Lease agreement (signed) final.docx', size: 860 * KB, real: 'docx', note: 'Spaces and brackets' },
  { id: 'csv', name: 'expenses-q3.csv', size: 12 * KB, real: 'csv', note: 'Small CSV' },
  { id: 'report', name: 'annual-report-2025.pdf', size: 7.6 * MB, real: 'pdf', note: 'Mid-size' },
  { id: 'zip', name: 'project-files.zip', size: 48 * MB, real: 'zip', note: 'Big archive' },
  {
    id: 'long',
    name: 'Mietvertrag_Wohnung_Kreuzberg_2026_endgültig_unterschrieben_v2.pdf',
    size: 3.1 * MB,
    real: 'pdf',
    note: 'Very long, unicode',
  },
  { id: 'exe', name: 'invoice.pdf.exe', size: 310 * KB, real: 'exe', note: 'Double extension' },
  { id: 'fake', name: 'holiday-photo.pdf', size: 2.4 * MB, real: 'png', note: 'A PNG renamed to .pdf' },
  { id: 'empty', name: 'notes.pdf', size: 0, real: 'empty', note: '0 bytes' },
  { id: 'dup', name: 'Invoice_March.pdf', size: 240 * KB, real: 'pdf', note: 'Same file again' },
];

export function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / KB))} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

/** The extension exactly as typed ("PDF" stays "PDF"). */
export function extensionOf(name: string) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1) : '';
}

/** MIME type a browser reports in File.type: derived from the extension, not from the content. */
export function browserMime(name: string) {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    zip: 'application/zip',
    png: 'image/png',
    exe: 'application/x-msdownload',
  };
  return map[extensionOf(name).toLowerCase()] ?? '';
}

/** Detect the real kind from the first bytes of a real File (used when learners pick their own files). */
export async function sniff(file: File): Promise<RealKind> {
  if (file.size === 0) return 'empty';
  try {
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const s = String.fromCharCode(...head);
    if (s.startsWith('%PDF')) return 'pdf';
    if (s.startsWith('PK')) {
      const ext = extensionOf(file.name).toLowerCase();
      return ext === 'docx' ? 'docx' : ext === 'xlsx' ? 'xlsx' : 'zip';
    }
    if (s.startsWith('MZ')) return 'exe';
    if (head[0] === 0x89 && s.slice(1, 4) === 'PNG') return 'png';
    if (/^[\x09\x0a\x0d\x20-\x7e]+$/.test(s) && extensionOf(file.name).toLowerCase() === 'csv') return 'csv';
  } catch {
    /* ignore */
  }
  return 'unknown';
}

/** Splits a file name so the end (with the extension) can stay visible while the middle truncates. */
export function splitName(name: string) {
  if (name.length <= 16) return [name, ''] as const;
  return [name.slice(0, -10), name.slice(-10)] as const;
}
