import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Contrast, Droplet, Glasses, Keyboard, MousePointer2, Pipette, ScanEye, Volume2, ZoomIn } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { SignUpForm } from './SignUpForm';
import { ContrastPanel } from './ContrastChecker';
import { parseCssColor, rgbToHex, srTranscript, visionModes, type SrLine, type VisionMode } from './a11y-utils';

/*
 * "Experience it" lab: the GreenBasket sign-up page plus simulation tools
 * (keyboard only with focus path, blurred vision, color vision filters, zoom 200%,
 * screen reader transcript, contrast checker with a color picker).
 * Used twice: with the accessible form (lab) and with the broken form (bug hunt).
 */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function Chip({ on, onClick, icon: Icon, children }: { on: boolean; onClick: () => void; icon: typeof Keyboard; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        on ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-fg'
      }`}
    >
      <Icon size={14} aria-hidden="true" /> {children}
    </button>
  );
}

const sameLines = (a: SrLine[], b: SrLine[]) => a.length === b.length && a.every((l, i) => l.el === b[i].el && l.text === b[i].text);

export default function A11yWorkbench({ broken = false, compact = false }: { broken?: boolean; compact?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const [keyboard, setKeyboard] = useState(false);
  const [blur, setBlur] = useState(false);
  const [vision, setVision] = useState<VisionMode>('none');
  const [zoom, setZoom] = useState(false);
  const [tool, setTool] = useState<'sr' | 'contrast'>('sr');
  const [inspect, setInspect] = useState(false);
  const [fg, setFg] = useState('#5b6170');
  const [bg, setBg] = useState('#ffffff');
  const [picked, setPicked] = useState<string | null>(null);

  const [lines, setLines] = useState<SrLine[]>([]);
  const [srIndex, setSrIndex] = useState(0);
  const [path, setPath] = useState<Element[]>([]);
  const [marks, setMarks] = useState<{ x: number; y: number }[]>([]);
  const [srBox, setSrBox] = useState<Box | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [mouseNote, setMouseNote] = useState(false);
  const [version, setVersion] = useState(0);
  const [tick, setTick] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const raf = useRef(0);
  const noteTimer = useRef(0);

  const bump = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setVersion((v) => v + 1));
  }, []);

  // Watch the page for changes (validation errors, success message, typed values).
  useEffect(() => {
    const page = pageRef.current;
    const wrap = wrapRef.current;
    if (!page || !wrap) return;
    const mo = new MutationObserver(bump);
    mo.observe(page, { subtree: true, childList: true, attributes: true, characterData: true });
    page.addEventListener('input', bump);
    page.addEventListener('change', bump);
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(wrap);
    return () => {
      mo.disconnect();
      ro.disconnect();
      page.removeEventListener('input', bump);
      page.removeEventListener('change', bump);
      cancelAnimationFrame(raf.current);
      clearTimeout(noteTimer.current);
    };
  }, [bump]);

  // Rebuild the screen reader transcript from the real DOM.
  useEffect(() => {
    if (!pageRef.current) return;
    const next = srTranscript(pageRef.current);
    setLines((prev) => (sameLines(prev, next) ? prev : next));
  }, [version]);

  useEffect(() => {
    if (srIndex > lines.length - 1) setSrIndex(Math.max(0, lines.length - 1));
  }, [lines, srIndex]);

  // Positions of the focus path badges and the screen reader cursor.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const base = wrap.getBoundingClientRect();
    setMarks(
      path
        .filter((el) => el.isConnected)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left - base.left, y: r.top - base.top };
        }),
    );
    const cur = tool === 'sr' && !keyboard ? lines[srIndex]?.el : null;
    if (cur && cur.isConnected) {
      const r = cur.getBoundingClientRect();
      setSrBox({ x: r.left - base.left - 3, y: r.top - base.top - 3, w: r.width + 6, h: r.height + 6 });
    } else setSrBox(null);
  }, [path, lines, srIndex, tool, zoom, tick, version, keyboard]);

  // Keep the active transcript line visible inside the list (without scrolling the page).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[srIndex] as HTMLElement | undefined;
    if (!list || !item) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop - 4;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight + 4;
  }, [srIndex]);

  const toggleKeyboard = () => {
    const next = !keyboard;
    setKeyboard(next);
    setPath([]);
    setFocused(null);
    if (next) {
      setInspect(false);
      // Put focus just before the page, so the next Tab lands on its first control.
      setTimeout(() => pageRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const onFocusIn = (e: React.FocusEvent) => {
    const t = e.target as Element;
    if (t === pageRef.current) return;
    const idx = lines.findIndex((l) => l.el === t);
    if (idx >= 0) setSrIndex(idx);
    const line = lines[idx];
    setFocused(line ? line.text : t.tagName.toLowerCase());
    if (keyboard) setPath((p) => (p[p.length - 1] === t ? p : [...p, t].slice(-24)));
  };

  const onPickCapture = (e: React.MouseEvent) => {
    if (!inspect) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.target as HTMLElement;
    const color = parseCssColor(getComputedStyle(t).color);
    let el: HTMLElement | null = t;
    let back: [number, number, number] = [255, 255, 255];
    while (el && el !== pageRef.current?.parentElement) {
      const c = parseCssColor(getComputedStyle(el).backgroundColor);
      if (c && c.alpha > 0.5) {
        back = c.rgb;
        break;
      }
      el = el.parentElement;
    }
    if (color) setFg(rgbToHex(color.rgb));
    setBg(rgbToHex(back));
    const text = (t.textContent || t.getAttribute('aria-label') || t.tagName.toLowerCase()).trim().slice(0, 40);
    setPicked(text || t.tagName.toLowerCase());
    setInspect(false);
  };

  const mouseBlocked = (e: React.MouseEvent) => {
    e.preventDefault();
    setMouseNote(true);
    clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setMouseNote(false), 1800);
  };

  const v = visionModes.find((m) => m.id === vision)!;
  const filter = [v.matrix ? `url(#${uid}-${vision})` : '', blur ? 'blur(1.6px)' : ''].filter(Boolean).join(' ') || undefined;
  const cur = lines[srIndex];

  return (
    <div className={`not-prose w-full min-w-0 ${compact ? '' : 'my-8 overflow-hidden rounded-3xl border border-line bg-surface'}`}>
      {!compact && (
        <div className="border-b border-line px-5 py-4">
          <p className="font-semibold">🧑‍🦯 Experience it: accessibility lab</p>
          <p className="text-sm text-muted">Switch on a simulation, then try to sign up. Each toggle mirrors a real way people use the web, or a tool testers use.</p>
        </div>
      )}

      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        {visionModes
          .filter((m) => m.matrix)
          .map((m) => (
            <filter key={m.id} id={`${uid}-${m.id}`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={m.matrix} />
            </filter>
          ))}
      </svg>

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]'}>
        <div className={`min-w-0 space-y-3 ${compact ? '' : 'border-b border-line p-4 sm:p-5 lg:border-r lg:border-b-0'}`}>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Simulations">
            <Chip on={keyboard} onClick={toggleKeyboard} icon={Keyboard}>
              Keyboard only
            </Chip>
            <Chip on={blur} onClick={() => setBlur((b) => !b)} icon={Glasses}>
              Blurred vision
            </Chip>
            <Chip on={zoom} onClick={() => setZoom((z) => !z)} icon={ZoomIn}>
              Zoom 200%
            </Chip>
            <label className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-1 pl-2.5 text-xs font-semibold text-muted">
              <Droplet size={14} aria-hidden="true" />
              <span className="sr-only">Color vision</span>
              <select value={vision} onChange={(e) => setVision(e.target.value as VisionMode)} className="max-w-[11rem] min-w-0 rounded-full bg-transparent py-0.5 text-xs text-fg">
                {visionModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {keyboard && (
            <p className="flex items-start gap-2 rounded-xl bg-brand-soft px-3 py-2 text-xs text-fg">
              <Keyboard size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                Mouse is off. Press <kbd className="rounded border border-line bg-surface px-1 font-mono">Tab</kbd> to move forward,{' '}
                <kbd className="rounded border border-line bg-surface px-1 font-mono">Shift+Tab</kbd> back, <kbd className="rounded border border-line bg-surface px-1 font-mono">Space</kbd> or{' '}
                <kbd className="rounded border border-line bg-surface px-1 font-mono">Enter</kbd> to use a control. The numbers show your focus path.
              </span>
            </p>
          )}

          <BrowserFrame url="greenbasket.shop/signup">
            <div ref={wrapRef} className="relative overflow-hidden" style={{ background: '#fff' }}>
              <div
                ref={pageRef}
                tabIndex={-1}
                onFocus={onFocusIn}
                onClickCapture={onPickCapture}
                className="outline-none"
                style={{ filter, zoom: zoom ? 2 : undefined, cursor: inspect ? 'crosshair' : undefined } as React.CSSProperties}
              >
                <SignUpForm broken={broken} />
              </div>

              {/* Overlays */}
              <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
                {keyboard && marks.length > 1 && (
                  <polyline points={marks.map((m) => `${m.x + 2},${m.y + 2}`).join(' ')} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 4" opacity="0.7" />
                )}
                {srBox && <rect x={srBox.x} y={srBox.y} width={srBox.w} height={srBox.h} rx="7" fill="none" stroke="#111" strokeWidth="3" />}
              </svg>
              {keyboard &&
                marks.map((m, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="pointer-events-none absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[10px] font-bold text-white shadow"
                    style={{ left: m.x + 2, top: m.y + 2, background: i === marks.length - 1 ? '#7c3aed' : '#a78bfa' }}
                  >
                    {i + 1}
                  </span>
                ))}
              {keyboard && <div className="absolute inset-0" style={{ cursor: 'none' }} onMouseDown={mouseBlocked} onClick={(e) => e.preventDefault()} aria-hidden="true" />}
              {mouseNote && (
                <p className="pointer-events-none absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg">
                  <MousePointer2 size={13} aria-hidden="true" /> Mouse disabled: use the keyboard
                </p>
              )}
            </div>
          </BrowserFrame>

          {keyboard && (
            <p className="rounded-xl bg-subtle px-3 py-2 text-xs text-muted" aria-live="polite">
              <span className="font-semibold text-fg">Focus:</span> {focused ?? 'not in the page yet, press Tab'}
              {path.length > 0 && <span> · {path.length} stops so far</span>}
            </p>
          )}
        </div>

        {/* Tools */}
        <div className={`min-w-0 ${compact ? 'rounded-2xl border border-line bg-surface' : ''}`}>
          <div className="flex border-b border-line" role="tablist" aria-label="Testing tools">
            {(
              [
                ['sr', 'Screen reader', Volume2],
                ['contrast', 'Contrast', Contrast],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tool === k}
                onClick={() => setTool(k)}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold ${tool === k ? 'border-brand text-fg' : 'border-transparent text-muted hover:text-fg'}`}
              >
                <Icon size={14} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          {tool === 'sr' ? (
            <div className="space-y-2 p-3 sm:p-4" role="tabpanel">
              <p className="text-xs text-muted">What a screen reader announces, item by item. Use the arrows like swiping on a phone, or Tab through the page.</p>
              <div className="flex items-center gap-2 rounded-xl bg-[#111827] p-2 text-white">
                <button type="button" onClick={() => setSrIndex((i) => Math.max(0, i - 1))} aria-label="Previous item" className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20">
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <p className="min-w-0 flex-1 text-center text-[13px] leading-snug" aria-live="polite">
                  {cur ? `“${cur.text}”` : '…'}
                </p>
                <button
                  type="button"
                  onClick={() => setSrIndex((i) => Math.min(lines.length - 1, i + 1))}
                  aria-label="Next item"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
              <ol ref={listRef} className="relative max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-subtle p-1.5 font-mono text-[11.5px]">
                {lines.map((l, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSrIndex(i)}
                      className={`flex w-full items-start gap-2 rounded-md px-2 py-1 text-left ${i === srIndex ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'}`}
                    >
                      <span className="w-4 shrink-0 text-right text-faint">{i + 1}</span>
                      <span className="min-w-0 flex-1 break-words">{l.text}</span>
                      {l.focusable && <span className="shrink-0 rounded bg-brand-soft px-1 text-[9.5px] font-sans font-semibold text-brand">TAB</span>}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-faint">
                <span className="rounded bg-brand-soft px-1 font-semibold text-brand">TAB</span> = reachable with the Tab key.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3 sm:p-4" role="tabpanel">
              <button
                type="button"
                aria-pressed={inspect}
                disabled={keyboard}
                onClick={() => setInspect((i) => !i)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                  inspect ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-subtle text-fg hover:border-brand'
                }`}
              >
                {inspect ? <ScanEye size={14} aria-hidden="true" /> : <Pipette size={14} aria-hidden="true" />}
                {inspect ? 'Now click any text in the page…' : 'Pick colors from the page'}
              </button>
              <ContrastPanel
                fg={fg}
                bg={bg}
                setFg={(c) => {
                  setFg(c);
                  setPicked(null);
                }}
                setBg={(c) => {
                  setBg(c);
                  setPicked(null);
                }}
                note={picked ? <p className="truncate text-xs text-muted">Picked from: “{picked}”</p> : null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
