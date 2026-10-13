import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useOutside, type Opt } from './Dropdown';

/** iOS pop-up button inside a grouped list row: tap the value to open a menu with a checkmark. */
export function IOSPopupButton({ label, options, value, onChange }: { label: string; options: Opt[]; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const sel = options.findIndex((o) => o.value === value);
  useOutside(wrap, open, () => setOpen(false));

  useEffect(() => {
    if (open) items.current[Math.max(sel, 0)]?.focus();
  }, [open, sel]);

  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  const onMenuKey = (e: KeyboardEvent, i: number) => {
    const n = options.length;
    if (e.key === 'ArrowDown') items.current[(i + 1) % n]?.focus();
    else if (e.key === 'ArrowUp') items.current[(i - 1 + n) % n]?.focus();
    else if (e.key === 'Escape' || e.key === 'Tab') close();
    else return;
    e.preventDefault();
  };

  return (
    <div ref={wrap} className="relative">
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] bg-white pr-2 pl-4 text-[16px] text-black">
        <span id={`${id}-l`}>{label}</span>
        <button
          ref={btn}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-labelledby={`${id}-l ${id}-v`}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-[#007aff] focus-visible:outline-2 focus-visible:outline-[#007aff]"
        >
          <span id={`${id}-v`}>{options[sel]?.label}</span>
          <ChevronsUpDown size={15} aria-hidden />
        </button>
      </div>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-full right-1 z-30 mt-1 w-56 origin-top-right overflow-hidden rounded-[13px] text-[16px] text-black shadow-[0_10px_40px_rgba(0,0,0,.22)] backdrop-blur-xl"
          style={{ background: 'rgba(250,250,252,.94)', animation: 'tfpop .16s ease-out' }}
        >
          <style>{'@keyframes tfpop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}'}</style>
          {options.map((o, i) => (
            <button
              key={o.value}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={i === sel}
              onClick={() => {
                onChange(o.value);
                close();
              }}
              onKeyDown={(e) => onMenuKey(e, i)}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left outline-none focus-visible:bg-black/[.08] hover:bg-black/[.05]"
              style={{ borderTop: i ? '0.5px solid rgba(60,60,67,.2)' : undefined }}
            >
              <span className="w-4 shrink-0">{i === sel && <Check size={16} strokeWidth={2.5} />}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ROW = 34;

/** iOS wheel picker. Scroll (or use arrow keys) to change the value in the center band. */
export function WheelPicker({ label, options, value, onChange }: { label: string; options: Opt[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const [pos, setPos] = useState(idx);
  const settle = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ROW;
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const go = (i: number) => {
    const j = Math.min(options.length - 1, Math.max(0, i));
    ref.current?.scrollTo({ top: j * ROW, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)));
    setPos((p) => (p === i ? p : i));
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      if (options[i].value !== value) onChange(options[i].value);
    }, 120);
  };

  return (
    <div className="relative select-none" style={{ height: ROW * 5 }}>
      <div className="pointer-events-none absolute inset-x-2 rounded-lg" style={{ top: ROW * 2, height: ROW, background: 'rgba(118,118,128,.12)' }} />
      <div
        ref={ref}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={options.length - 1}
        aria-valuenow={pos}
        aria-valuetext={options[pos]?.label}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') go(pos + 1);
          else if (e.key === 'ArrowUp') go(pos - 1);
          else if (e.key === 'Home') go(0);
          else if (e.key === 'End') go(options.length - 1);
          else return;
          e.preventDefault();
        }}
        className="h-full snap-y snap-mandatory overflow-y-scroll rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[#007aff]/50 [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)' }}
      >
        <div style={{ height: ROW * 2 }} />
        {options.map((o, i) => {
          const d = Math.abs(i - pos);
          return (
            <div
              key={o.value}
              onClick={() => go(i)}
              className="grid snap-center place-items-center text-black"
              style={{ height: ROW, fontSize: d === 0 ? 21 : 19, opacity: d === 0 ? 1 : d === 1 ? 0.55 : 0.3, transform: `perspective(300px) rotateX(${(i - pos) * -14}deg)` }}
            >
              {o.label}
            </div>
          );
        })}
        <div style={{ height: ROW * 2 }} />
      </div>
    </div>
  );
}
