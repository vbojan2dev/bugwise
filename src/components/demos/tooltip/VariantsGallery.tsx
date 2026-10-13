import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, ArrowLeft, Heart, Info, MailOpen, Share2, Sparkles, SquarePen, Trash2, X } from 'lucide-react';
import { Tooltip } from './Tooltip';

function Card({ title, platform, note, chips, children, bg = '#e9ebf2' }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div data-tooltip-boundary className="grid min-h-[230px] place-items-center px-4 py-5" style={{ background: bg, colorScheme: 'light' }}>
        <div className="w-full max-w-[300px]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

/* 1. Web tooltips on icon buttons (hover + focus + Esc) */
function WebToolbar() {
  const tools = [
    { label: 'Archive', key: 'E', icon: Archive },
    { label: 'Delete', key: '#', icon: Trash2 },
    { label: 'Mark as unread', key: 'U', icon: MailOpen },
  ];
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3 text-[#3c4150] shadow-sm">
      <div className="flex items-center gap-1 pt-10">
        {tools.map((t) => (
          <Tooltip key={t.label} text={`${t.label} (${t.key})`}>
            {(p) => (
              <button
                type="button"
                aria-label={t.label}
                aria-keyshortcuts={t.key}
                {...p}
                className="grid size-10 place-items-center rounded-lg outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
              >
                <t.icon size={18} aria-hidden="true" />
              </button>
            )}
          </Tooltip>
        ))}
        <span className="ml-2 h-2 flex-1 rounded bg-black/10" />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-[#0e1120]">Your order has shipped</p>
      <p className="text-[12px] text-[#5a5f70]">Nordic Home · 09:14</p>
    </div>
  );
}

/* 2. Material 3 plain tooltip on a top app bar (long-press on touch, hover with a mouse) */
function M3AppBar() {
  return (
    <div className="overflow-visible rounded-[16px] bg-[#fef7ff] pb-16 text-[#1d1b20]" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <div className="flex h-14 items-center gap-1 px-1">
        <span className="grid size-12 place-items-center" aria-hidden="true">
          <ArrowLeft size={22} />
        </span>
        <p className="min-w-0 flex-1 truncate text-[18px]">Trail runner 2</p>
        {[
          { l: 'Add to wishlist', i: Heart },
          { l: 'Share', i: Share2 },
        ].map((b) => (
          <Tooltip key={b.l} text={b.l} skin="m3" placement="bottom" showDelay={500}>
            {(p) => (
              <button type="button" aria-label={b.l} {...p} className="grid size-12 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
                <b.i size={22} aria-hidden="true" />
              </button>
            )}
          </Tooltip>
        ))}
      </div>
      <div className="mx-4 h-20 rounded-xl bg-[#eaddff]" />
    </div>
  );
}

/* 3. Toggletip / info popover: click to open, may contain a link, Esc closes and returns focus */
function Toggletip() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);
  return (
    <div className="relative rounded-xl border border-black/10 bg-white p-4 text-[#0e1120] shadow-sm">
      <div className="flex items-center gap-1.5">
        <p className="text-[14px] font-semibold">Instant transfer</p>
        <button
          ref={btn}
          type="button"
          aria-label="About instant transfer"
          aria-expanded={open}
          aria-controls="gal-toggletip"
          onClick={() => setOpen((v) => !v)}
          className="grid size-8 place-items-center rounded-full text-[#2f6bff] outline-none hover:bg-[#2f6bff]/10 focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
        >
          <Info size={16} aria-hidden="true" />
        </button>
        <span className="ml-auto text-[13px] text-[#5a5f70]">+€0.50</span>
      </div>
      <p className="text-[12px] text-[#5a5f70]">Money arrives in seconds</p>
      <div ref={box} id="gal-toggletip" hidden={!open} className="absolute top-14 right-3 left-3 z-30 rounded-lg border border-black/10 bg-white p-3 text-[13px] leading-snug shadow-xl">
        <p>Instant transfers arrive within 10 seconds, 24/7, up to €100,000.</p>
        <a href="#fees" onClick={(e) => e.preventDefault()} className="mt-1 inline-block font-medium text-[#2f6bff] underline">
          See all fees
        </a>
      </div>
    </div>
  );
}

/* 4. iOS tip / onboarding coachmark */
function IOSTip() {
  const [shown, setShown] = useState(true);
  return (
    <div className="relative rounded-[20px] bg-[#f2f2f7] p-3 text-black" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <div className="flex items-center justify-between px-1">
        <p className="text-[20px] font-bold">Notes</p>
        <span className="grid size-11 place-items-center text-[#007aff]" aria-hidden="true">
          <SquarePen size={22} />
        </span>
      </div>
      {shown ? (
        <div role="dialog" aria-label="Tip" className="relative mt-1 ml-auto w-[88%] rounded-[14px] bg-white p-3 pr-9 shadow-lg">
          <span aria-hidden="true" className="absolute -top-1.5 right-4 size-3 rotate-45 bg-white" />
          <div className="flex gap-2">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-[#007aff]" aria-hidden="true" />
            <div>
              <p className="text-[14px] font-semibold">Start a new note</p>
              <p className="text-[13px] text-[#3c3c43]">Tap here to write something new. Your notes sync across devices.</p>
            </div>
          </div>
          <button type="button" aria-label="Close tip" onClick={() => setShown(false)} className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-[#8a8a8e] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#007aff]">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="mt-6 w-full rounded-[10px] bg-white py-2.5 text-[14px] text-[#007aff]">
          Show the tip again
        </button>
      )}
      <div className="mt-3 space-y-2 rounded-[10px] bg-white p-3">
        <div className="h-2 w-2/3 rounded bg-black/10" />
        <div className="h-2 w-1/2 rounded bg-black/10" />
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        title="Tooltip on icon buttons"
        platform="Web"
        note="Hover with a mouse (short delay) or Tab with the keyboard (instant). Esc hides it. The button has its own name; the tooltip only shows it."
        chips={['Hover + focus', 'Esc', 'Shortcut hint']}
      >
        <WebToolbar />
      </Card>
      <Card
        title="Plain tooltip"
        platform="Android"
        note="Material 3 plain tooltips appear on long-press (or mouse hover) and name icon-only buttons. They disappear by themselves after release."
        chips={['Long-press', 'Inverse surface', 'No arrow']}
      >
        <M3AppBar />
      </Card>
      <Card
        title="Toggletip (info popover)"
        platform="Web"
        note="Opens on click or tap, stays until closed, and may hold a link. Strictly speaking it is a small popover, not a tooltip."
        chips={['Click / tap', 'aria-expanded', 'Esc returns focus']}
      >
        <Toggletip />
      </Card>
      <Card
        title="Tip / coachmark"
        platform="iOS"
        note="Onboarding tips (like Apple's TipKit popover tips) point at a feature once. They need a clear close button and must not come back after dismissal."
        chips={['Onboarding', 'Close button', 'Show once']}
      >
        <IOSTip />
      </Card>
    </div>
  );
}
