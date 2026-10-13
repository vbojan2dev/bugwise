import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import type { Line } from './useAdbSession';
import type { Level } from './adbEngine';

const levelColor: Record<Level, string> = { V: '#8b93b0', D: '#7dd3fc', I: '#a7e3b9', W: '#fbbf24', E: '#ff8f8f', F: '#ff6b6b' };

export interface TerminalHandle {
  fill: (cmd: string) => void;
}

interface Props {
  lines: Line[];
  onRun: (cmd: string) => void;
  title?: string;
  height?: number;
  /** When set, log lines that carry a key become clickable. */
  onPick?: (key: string) => void;
  picked?: string | null;
  pickedTone?: 'ok' | 'warn' | 'bad';
  placeholder?: string;
}

export const Terminal = forwardRef<TerminalHandle, Props>(function Terminal(
  { lines, onRun, title = 'Terminal — zsh', height = 300, onPick, picked, pickedTone, placeholder = 'Type an adb command and press Enter' },
  ref,
) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    fill: (cmd: string) => {
      setValue(cmd);
      setHIndex(null);
      input.current?.focus({ preventScroll: true });
    },
  }));

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const submit = () => {
    const cmd = value.trim();
    if (!cmd) return;
    onRun(cmd);
    setHistory((h) => (h[h.length - 1] === cmd ? h : [...h, cmd]).slice(-50));
    setHIndex(null);
    setValue('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i);
      setValue(history[i]);
    } else if (e.key === 'ArrowDown' && hIndex !== null) {
      e.preventDefault();
      const i = hIndex + 1;
      if (i >= history.length) {
        setHIndex(null);
        setValue('');
      } else {
        setHIndex(i);
        setValue(history[i]);
      }
    }
  };

  const toneCls = pickedTone === 'ok' ? 'bg-[#16a34a]/30 ring-1 ring-[#4ade80]' : pickedTone === 'warn' ? 'bg-[#ca8a04]/30 ring-1 ring-[#facc15]' : 'bg-[#dc2626]/30 ring-1 ring-[#f87171]';

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#262b40] bg-[#0e1120] text-[11.5px] leading-[1.55] text-[#c9cde0]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-sans text-[11px] font-medium text-white/50">{title}</span>
      </div>
      <div
        ref={scroller}
        className="overflow-y-auto overscroll-contain px-3 py-2 font-mono"
        style={{ height }}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        onClick={(e) => {
          if (!onPick && (e.target as HTMLElement).tagName !== 'BUTTON' && !window.getSelection()?.toString()) input.current?.focus({ preventScroll: true });
        }}
      >
        {lines.map((l) => {
          if (l.kind === 'cmd')
            return (
              <div key={l.id} className="mt-1 break-all whitespace-pre-wrap text-white first:mt-0">
                <span className="text-[#4ade80]">~ $ </span>
                {l.text}
              </div>
            );
          const color = l.kind === 'err' ? '#ff8f8f' : l.kind === 'note' ? '#8b93b0' : l.kind === 'log' && l.level ? levelColor[l.level] : undefined;
          const clickable = !!onPick && !!l.key;
          const cls = `block w-full break-all whitespace-pre-wrap text-left ${l.kind === 'note' ? 'italic' : ''}`;
          if (clickable)
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onPick!(l.key!)}
                className={`${cls} -mx-1 rounded px-1 hover:bg-white/10 focus-visible:outline-1 focus-visible:outline-white ${picked === l.key ? toneCls : ''}`}
                style={{ color }}
              >
                {l.text}
              </button>
            );
          return (
            <div key={l.id} className={cls} style={{ color }}>
              {l.text || ' '}
            </div>
          );
        })}
      </div>
      <form
        className="flex items-center gap-2 border-t border-white/10 px-3 py-2 font-mono focus-within:bg-white/[0.06]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span className="shrink-0 text-[#4ade80]">~ $</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label="Command"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-0 min-w-0 flex-1 bg-transparent text-[16px] text-white sm:text-[12px] placeholder:text-white/30 focus:outline-none"
        />
        <button type="submit" className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 font-sans text-[11px] font-medium text-white hover:bg-white/20 focus-visible:outline-1 focus-visible:outline-white">
          <CornerDownLeft size={12} aria-hidden /> Run
        </button>
      </form>
    </div>
  );
});
