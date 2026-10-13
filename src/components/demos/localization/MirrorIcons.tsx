import { ArrowLeft, Check, ChevronRight, Clock, Download, Pause, Play, Send, SkipForward, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* Static reference: which icons mirror in a right-to-left layout and which must stay as they are. */

interface Row {
  icon: LucideIcon;
  label: string;
  why: string;
}

const FLIP: Row[] = [
  { icon: ArrowLeft, label: 'Back arrow', why: 'Points to where you came from, which is now on the right.' },
  { icon: ChevronRight, label: 'List chevron', why: 'Points forward, into the next screen.' },
  { icon: Send, label: 'Send', why: 'Shows the message moving in the reading direction.' },
  { icon: Undo2, label: 'Undo / redo', why: 'They point backward and forward in time, which follows reading direction.' },
];

const KEEP: Row[] = [
  { icon: Play, label: 'Play, fast-forward', why: 'Media controls follow tape direction, the same worldwide.' },
  { icon: Check, label: 'Checkmark', why: 'A symbol, not a direction.' },
  { icon: Clock, label: 'Clock', why: 'Clock hands turn the same way everywhere.' },
  { icon: Download, label: 'Download, upload', why: 'Vertical arrows have no left or right.' },
];

function Mini({ rows, flip, title, tone }: { rows: Row[]; flip: boolean; title: string; tone: 'ok' | 'warn' }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-3">
      <p className={`mb-2 text-xs font-semibold tracking-wide uppercase ${tone === 'ok' ? 'text-ok' : 'text-warn'}`}>{title}</p>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-3">
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-subtle px-2 py-1 text-fg" aria-hidden="true">
              <span className="text-[9px] font-semibold text-faint">LTR</span>
              <r.icon size={18} />
              <span className="ms-1 text-[9px] font-semibold text-faint">RTL</span>
              <r.icon size={18} style={flip ? { transform: 'scaleX(-1)' } : undefined} />
            </span>
            <span className="min-w-0 text-sm">
              <span className="font-medium text-fg">{r.label}</span>
              <span className="block text-xs text-muted">{r.why}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MirrorIcons() {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-3 md:grid-cols-2">
      <Mini rows={FLIP} flip title="Mirror in RTL" tone="ok" />
      <Mini rows={KEEP} flip={false} title="Never mirror" tone="warn" />
      <p className="flex items-center gap-1.5 text-xs text-muted md:col-span-2">
        <Pause size={12} /> <SkipForward size={12} /> Also never mirrored: logos, brand marks, photos, and text inside images (those need translated versions instead).
      </p>
    </div>
  );
}
