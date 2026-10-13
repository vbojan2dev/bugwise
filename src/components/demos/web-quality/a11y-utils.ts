/* Shared helpers for the accessibility demos: contrast math, a tiny accessible-name
 * calculator and a "screen reader transcript" built from the real DOM of the demo page. */

// ---------- Contrast ----------

export function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2 contrast ratio between two colors (1 to 21). */
export function contrastRatio(a: [number, number, number], b: [number, number, number]) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Parses "rgb(1, 2, 3)" / "rgba(1, 2, 3, 0.5)" as returned by getComputedStyle. */
export function parseCssColor(c: string): { rgb: [number, number, number]; alpha: number } | null {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { rgb: [parts[0], parts[1], parts[2]], alpha: parts.length > 3 ? parts[3] : 1 };
}

// ---------- Color vision simulation (approximate matrices, same idea as DevTools) ----------

export const visionModes = [
  { id: 'none', label: 'Normal vision', matrix: '' },
  { id: 'protanopia', label: 'Protanopia (no red)', matrix: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0' },
  { id: 'deuteranopia', label: 'Deuteranopia (no green)', matrix: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0' },
  { id: 'tritanopia', label: 'Tritanopia (no blue)', matrix: '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0' },
  { id: 'achromatopsia', label: 'Achromatopsia (no color)', matrix: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0' },
] as const;
export type VisionMode = (typeof visionModes)[number]['id'];

// ---------- Accessible name + screen reader transcript ----------

const isHidden = (el: Element) => {
  if (el.getAttribute('aria-hidden') === 'true' || (el as HTMLElement).hidden) return true;
  const s = getComputedStyle(el);
  return s.display === 'none' || s.visibility === 'hidden';
};

/** Visible text of an element, skipping aria-hidden parts (like decorative icons). */
function textOf(el: Element): string {
  let out = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
    else if (n.nodeType === Node.ELEMENT_NODE && !isHidden(n as Element)) {
      const e = n as Element;
      out += e.tagName === 'IMG' ? (e.getAttribute('alt') ?? '') : textOf(e);
    }
  });
  return out.replace(/\s+/g, ' ').trim();
}

function byIds(root: Element, ids: string | null) {
  if (!ids) return '';
  const doc = root.ownerDocument;
  return ids
    .split(/\s+/)
    .map((id) => doc.getElementById(id))
    .filter((e): e is HTMLElement => !!e && !isHidden(e))
    .map((e) => textOf(e))
    .join(' ')
    .trim();
}

/** A simplified version of the browser's accessible name calculation. */
export function accessibleName(el: Element): string {
  const lb = byIds(el, el.getAttribute('aria-labelledby'));
  if (lb) return lb;
  const al = el.getAttribute('aria-label')?.trim();
  if (al) return al;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    const id = el.getAttribute('id');
    const forLabel = id ? el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const wrap = el.closest('label');
    const t = (forLabel && textOf(forLabel)) || (wrap && textOf(wrap));
    if (t) return t;
    return el.getAttribute('title')?.trim() || el.getAttribute('placeholder')?.trim() || '';
  }
  if (tag === 'IMG') return el.getAttribute('alt') ?? '';
  return textOf(el) || el.getAttribute('title')?.trim() || '';
}

export interface SrLine {
  el: Element;
  text: string;
  focusable: boolean;
  /** true when the announcement is clearly missing information */
  warn?: boolean;
}

const controlSel = 'input, button, a[href], select, textarea, [role="button"], [role="checkbox"], [role="img"], img, h1, h2, h3, h4, h5, h6, [role="alert"], [role="status"]';

function describe(el: Element): SrLine | null {
  const tag = el.tagName;
  const role = el.getAttribute('role');
  const name = accessibleName(el);
  const desc = byIds(el, el.getAttribute('aria-describedby'));
  const invalid = el.getAttribute('aria-invalid') === 'true';
  const required = (el as HTMLInputElement).required || el.getAttribute('aria-required') === 'true';
  const focusable = (el as HTMLElement).tabIndex >= 0 && !(el as HTMLButtonElement).disabled;
  const extra = (parts: string[]) => parts.filter(Boolean).join(', ');

  if (/^H[1-6]$/.test(tag)) return { el, text: `${name}, heading level ${tag[1]}`, focusable: false };
  if (role === 'alert' || role === 'status') {
    const t = textOf(el);
    return t ? { el, text: `Alert: ${t}`, focusable: false } : null;
  }
  if (tag === 'IMG' || role === 'img') {
    if (tag === 'IMG' && el.getAttribute('alt') === '') return null; // decorative, skipped
    if (!name) {
      const file = el.getAttribute('data-file');
      return { el, text: file ? `${file}, image` : 'image', focusable: false, warn: true };
    }
    return { el, text: `${name}, image`, focusable: false };
  }
  if (tag === 'INPUT' && ((el as HTMLInputElement).type === 'checkbox' || role === 'checkbox')) {
    const c = (el as HTMLInputElement).checked;
    return { el, text: extra([name, 'checkbox', c ? 'checked' : 'not checked', required ? 'required' : '', desc]), focusable, warn: !name };
  }
  if (role === 'checkbox') {
    const c = el.getAttribute('aria-checked') === 'true';
    return { el, text: extra([name, 'checkbox', c ? 'checked' : 'not checked', desc]), focusable, warn: !name };
  }
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const i = el as HTMLInputElement;
    const kind = i.type === 'password' ? 'secure text field' : 'edit text';
    const value = i.type === 'password' ? (i.value ? `${i.value.length} characters` : '') : i.value;
    return {
      el,
      text: extra([name, kind, value || (name ? '' : 'blank'), required ? 'required' : '', invalid ? 'invalid data' : '', desc]),
      focusable,
      warn: !name,
    };
  }
  if (tag === 'BUTTON' || role === 'button') {
    const pressed = el.getAttribute('aria-pressed');
    const kind = pressed ? `toggle button, ${pressed === 'true' ? 'pressed' : 'not pressed'}` : 'button';
    return { el, text: extra([name, kind, desc]), focusable, warn: !name };
  }
  if (tag === 'A') return { el, text: `${name || 'link'}${name ? ', link' : ''}`, focusable, warn: !name };
  return null;
}

/** Walks the page in DOM order and returns what a screen reader would read, line by line. */
export function srTranscript(root: Element): SrLine[] {
  const lines: SrLine[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.replace(/\s+/g, ' ').trim();
      if (t && node.parentElement) lines.push({ el: node.parentElement, text: t, focusable: false });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (isHidden(el) || el.hasAttribute('data-sr-skip')) return;
    if (el.matches(controlSel)) {
      const d = describe(el);
      if (d) lines.push(d);
      return;
    }
    // Labels are read together with their control, so only visit the controls inside.
    if (el.tagName === 'LABEL' && (el.getAttribute('for') || el.querySelector(controlSel))) {
      el.querySelectorAll(controlSel).forEach((c) => visit(c));
      return;
    }
    // Leaf text blocks are read as one line.
    const inline = ['B', 'STRONG', 'EM', 'SPAN', 'KBD'];
    if ([...el.children].every((c) => isHidden(c) || (inline.includes(c.tagName) && !c.matches(controlSel) && !c.querySelector(controlSel)))) {
      const t = textOf(el);
      if (t) lines.push({ el, text: t, focusable: false });
      return;
    }
    el.childNodes.forEach(visit);
  };
  root.childNodes.forEach(visit);
  return lines;
}
