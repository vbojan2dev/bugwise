import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';

/*
 * Shared, correct accordion primitives for the Accordion page.
 * - AccordionItem: one web accordion section. The whole header is a <button> inside a heading,
 *   with aria-expanded and aria-controls. The panel is a region labeled by the header.
 *   Closed panels are hidden from everyone (visibility: hidden after the collapse animation),
 *   or, with `findable`, use hidden="until-found" so the browser's find-in-page can open them.
 * - useScreenReader: reads the focused element's role, name and state from the real DOM,
 *   to show "what a screen reader would say" next to a demo.
 */

export interface AccordionItemProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Heading level of the header (2–6). */
  level?: 2 | 3 | 4 | 5 | 6;
  /** Animate the height change (the site's reduced-motion CSS shortens it to ~0). */
  animate?: boolean;
  /** Use hidden="until-found" for the closed panel, so Ctrl+F / Cmd+F can find and open it. */
  findable?: boolean;
  /** id for the header button (used for deep links / scrolling). */
  headerId?: string;
  headerRef?: (el: HTMLButtonElement | null) => void;
  /** Visual skin. */
  tone?: 'web' | 'compact';
}

export function AccordionItem({
  title,
  subtitle,
  open,
  onOpenChange,
  children,
  level = 3,
  animate = true,
  findable = false,
  headerId,
  headerRef,
  tone = 'web',
}: AccordionItemProps) {
  const uid = useId().replace(/[:«»]/g, '');
  const btnId = headerId ?? `acc-h-${uid}`;
  const panelId = `${btnId}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(onOpenChange);
  openRef.current = onOpenChange;

  // hidden="until-found": set it via the DOM so we don't depend on framework support for the value.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !findable) return;
    if (open) el.removeAttribute('hidden');
    else el.setAttribute('hidden', 'until-found');
  }, [findable, open]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || !findable) return;
    const onMatch = () => openRef.current(true);
    el.addEventListener('beforematch', onMatch);
    return () => el.removeEventListener('beforematch', onMatch);
  }, [findable]);

  const H = `h${level}` as 'h3';
  const pad = tone === 'compact' ? 'px-3 py-2.5 text-[14px]' : 'px-4 py-3.5 text-[15px]';

  const body = <div className={tone === 'compact' ? 'px-3 pb-3 text-[13px] leading-relaxed text-[#3c4150]' : 'px-4 pb-4 text-[14px] leading-relaxed text-[#3c4150]'}>{children}</div>;

  return (
    <div>
      <H className="m-0">
        <button
          ref={headerRef}
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className={`flex min-h-12 w-full items-center gap-3 text-left font-semibold outline-none hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-inset ${pad}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block">{title}</span>
            {subtitle && <span className="mt-0.5 block text-[12px] font-normal text-[#5a5f70]">{subtitle}</span>}
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="shrink-0 text-[#5a5f70]"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: animate ? 'transform .25s ease' : 'none' }}
          />
        </button>
      </H>
      {findable ? (
        <div ref={panelRef} id={panelId} role="region" aria-labelledby={btnId}>
          {body}
        </div>
      ) : (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-labelledby={btnId}
          className="grid"
          style={{
            gridTemplateRows: open ? '1fr' : '0fr',
            visibility: open ? 'visible' : 'hidden',
            transition: animate ? 'grid-template-rows .25s ease, visibility .25s' : 'none',
          }}
        >
          <div className="min-h-0 overflow-hidden">{body}</div>
        </div>
      )}
    </div>
  );
}

/** Builds a simple screen-reader style announcement for an element, from its real DOM attributes. */
export function describe(el: Element | null): string {
  if (!el) return '';
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role') ?? (tag === 'button' ? 'button' : tag === 'a' ? 'link' : tag === 'summary' ? 'button' : tag === 'input' ? 'text field' : '');
  if (!role) return '';
  const label = el.getAttribute('aria-label');
  const name = (label ?? (el.textContent ?? '')).replace(/\s+/g, ' ').trim();
  const parts = [name || '(no name)', role];
  const exp = el.getAttribute('aria-expanded');
  if (exp === 'true') parts.push('expanded');
  if (exp === 'false') parts.push('collapsed');
  if (tag === 'summary') parts.push((el.parentElement as HTMLDetailsElement | null)?.open ? 'expanded' : 'collapsed');
  const h = el.closest('h1,h2,h3,h4,h5,h6');
  if (h) parts.push(`heading level ${h.tagName[1]}`);
  return parts.join(', ');
}

/** Tracks what a screen reader would announce for the focused / clicked control inside `root`. */
export function useScreenReader(root: RefObject<HTMLElement | null>, onSay: (s: string) => void) {
  const say = useRef(onSay);
  say.current = onSay;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let t: number | undefined;
    const read = (target: EventTarget | null) => {
      const c = target instanceof Element ? target.closest('button,a,summary,input,[role="button"]') : null;
      if (!c || !el.contains(c)) return;
      window.clearTimeout(t);
      // read after React has re-rendered, so state changes are included
      t = window.setTimeout(() => {
        const s = describe(c);
        if (s) say.current(s);
      }, 30);
    };
    const onFocus = (e: FocusEvent) => read(e.target);
    const onClick = (e: MouseEvent) => read(e.target);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') read(e.target);
    };
    el.addEventListener('focusin', onFocus);
    el.addEventListener('click', onClick);
    el.addEventListener('keyup', onKey);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener('focusin', onFocus);
      el.removeEventListener('click', onClick);
      el.removeEventListener('keyup', onKey);
    };
  }, [root]);
}
