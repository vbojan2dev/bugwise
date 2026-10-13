/** A small approximation of what VoiceOver would announce for an element. */

const INTERACTIVE = 'button, a[href], input, textarea, select, [role="switch"], [role="radio"], [role="option"], [role="tab"], [tabindex]:not([tabindex="-1"])';

function textOf(el: Element): string {
  let out = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
    else if (n instanceof Element) {
      if (n.getAttribute('aria-hidden') === 'true' || n.tagName.toLowerCase() === 'svg') return;
      const label = n.getAttribute('aria-label');
      out += ' ' + (label ?? textOf(n)) + ' ';
    }
  });
  return out.replace(/\s+/g, ' ').trim();
}

export function accessibleName(el: Element): string {
  const by = el.getAttribute('aria-labelledby');
  if (by) {
    const s = by
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id))
      .filter(Boolean)
      .map((x) => textOf(x!))
      .join(' ');
    if (s) return s;
  }
  const label = el.getAttribute('aria-label');
  if (label) return label.trim();
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const l = el.labels?.[0];
    if (l) return textOf(l);
    return el.getAttribute('placeholder') ?? '';
  }
  const txt = textOf(el);
  if (txt) return txt;
  return el.getAttribute('title') ?? '';
}

export interface Announcement {
  text: string;
  target: Element;
}

export function announce(start: Element, root: Element): Announcement | null {
  const el = (start.closest(INTERACTIVE) as Element | null) ?? (start.closest('[data-fd-progress], h1, h2, p, li, dt, dd, label, span') as Element | null) ?? start;
  if (!root.contains(el)) return null;
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const name = accessibleName(el);
  const parts: string[] = [];
  if (name) parts.push(name);
  if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
    parts.push(el.type === 'radio' ? 'radio button' : 'checkbox', el.checked ? 'selected' : 'not selected');
  } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.type !== 'password' && el.value) parts.push(el.value);
    else if (el.type === 'password' && el.value) parts.push(`${el.value.length} characters`);
    parts.push(role === 'combobox' ? 'combo box' : el.type === 'search' ? 'search field' : el.type === 'password' ? 'secure text field' : 'text field');
  } else if (role === 'switch') {
    parts.push('switch', el.getAttribute('aria-checked') === 'true' ? 'on' : 'off');
  } else if (role === 'radio') {
    parts.push('radio button', el.getAttribute('aria-checked') === 'true' ? 'selected' : 'not selected');
  } else if (tag === 'button' || role === 'button' || role === 'option') {
    if (el.getAttribute('aria-pressed') === 'true') parts.push('selected');
    if (el.getAttribute('aria-current') === 'page') parts.push('selected', 'tab');
    else parts.push('button');
  } else if (tag === 'a') parts.push('link');
  else if (/^h[1-6]$/.test(tag)) parts.push('heading');
  if ((el as HTMLButtonElement).disabled) parts.push('dimmed');
  if (parts.length === 0) return null;
  return { text: parts.join(', '), target: el };
}
