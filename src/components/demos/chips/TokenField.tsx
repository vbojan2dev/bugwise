import { useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

/*
 * A correct "To:" recipients field built from input chips (tokens).
 * - Enter, comma or Tab (with text) turns the text into a chip; pasting "a@x.com, b@y.com" makes two chips.
 * - Duplicates are ignored case- and whitespace-insensitively, with a message.
 * - Invalid addresses become red chips with a warning icon (not color alone).
 * - Backspace in the empty field first focuses the last chip; a second Backspace removes it.
 * - Every chip has its own remove button named "Remove <address>".
 * - Every change is announced in a polite live region (shown as "Screen reader hears").
 */

const valid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const norm = (s: string) => s.trim().toLowerCase();

export default function TokenField() {
  const [tokens, setTokens] = useState<string[]>(['anna@example.com', 'ben@example.com']);
  const [text, setText] = useState('');
  const [said, setSaid] = useState('');
  const [hint, setHint] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const add = (raw: string) => {
    const parts = raw
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setTokens((prev) => {
      const next = [...prev];
      const dupes: string[] = [];
      for (const p of parts) {
        if (next.some((t) => norm(t) === norm(p))) dupes.push(p);
        else next.push(p);
      }
      const added = next.slice(prev.length);
      setHint(dupes.length ? `${dupes.join(', ')} is already in the list.` : '');
      setSaid(
        [added.length ? `Added ${added.join(', ')}${added.some((a) => !valid(a)) ? ', invalid email address' : ''}.` : '', dupes.length ? `${dupes.join(', ')} already added.` : '']
          .filter(Boolean)
          .join(' '),
      );
      return next;
    });
    setText('');
  };

  const remove = (i: number, refocus: 'input' | 'prev') => {
    setTokens((prev) => {
      const t = prev[i];
      if (t === undefined) return prev;
      setSaid(`Removed ${t}. ${prev.length - 1} recipients.`);
      return prev.filter((_, j) => j !== i);
    });
    setHint('');
    if (refocus === 'prev' && i > 0) setTimeout(() => chipRefs.current[i - 1]?.focus(), 0);
    else setTimeout(() => input.current?.focus(), 0);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">✉️ Input chips done right</p>
        <p className="text-sm text-muted">
          Add recipients with Enter or a comma, paste a list, try a duplicate like <code className="text-[13px]">ANNA@example.com </code>, then press Backspace in the empty field (twice).
        </p>
      </div>
      <div className="px-4 py-6 sm:px-8" style={{ background: '#fff', color: '#000', colorScheme: 'light' }}>
        <div className="mx-auto max-w-md">
          <p className="mb-2 text-[13px] font-semibold text-[#3c3c43]">New message</p>
          <div
            className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-[#c7c7cc] px-2 py-1.5 focus-within:border-[#007aff] focus-within:ring-2 focus-within:ring-[#007aff]/25"
            onClick={(e) => {
              if (e.target === e.currentTarget) input.current?.focus();
            }}
          >
            <span id="tf-to" className="pr-1 pl-1 text-[15px] text-[#8e8e93]">
              To:
            </span>
            <ul className="contents" aria-label="Recipients">
              {tokens.map((t, i) => {
                const bad = !valid(t);
                return (
                  <li key={t} className="flex max-w-full min-w-0">
                    <span
                      className="inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-full pr-0.5 pl-2.5 text-[14px]"
                      style={{ background: bad ? '#ffe5e3' : '#e5f0ff', color: bad ? '#b3261e' : '#0b57d0' }}
                    >
                      {bad && <AlertCircle size={13} aria-hidden="true" className="shrink-0" />}
                      <span className="min-w-0 truncate">{t}</span>
                      {bad && <span className="sr-only">, invalid email address</span>}
                      <button
                        ref={(el) => {
                          chipRefs.current[i] = el;
                        }}
                        type="button"
                        aria-label={`Remove ${t}`}
                        onClick={() => remove(i, 'input')}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' || e.key === 'Delete') {
                            e.preventDefault();
                            remove(i, 'prev');
                          }
                        }}
                        className="grid size-6 shrink-0 place-items-center rounded-full outline-none hover:bg-black/10 focus-visible:bg-[#007aff] focus-visible:text-white"
                      >
                        <X size={13} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <input
              ref={input}
              value={text}
              aria-labelledby="tf-to"
              aria-describedby="tf-hint"
              inputMode="email"
              autoComplete="off"
              onChange={(e) => {
                const v = e.target.value;
                if (/[,;]/.test(v)) add(v);
                else setText(v);
              }}
              onPaste={(e) => {
                const v = e.clipboardData.getData('text');
                if (/[,;\s]/.test(v.trim())) {
                  e.preventDefault();
                  add(text + v);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || (e.key === 'Tab' && text.trim())) && text.trim()) {
                  e.preventDefault();
                  add(text);
                } else if (e.key === 'Backspace' && text === '' && tokens.length) {
                  e.preventDefault();
                  chipRefs.current[tokens.length - 1]?.focus();
                  setSaid(`${tokens[tokens.length - 1]}. Press Backspace again to remove.`);
                }
              }}
              onBlur={() => text.trim() && add(text)}
              placeholder={tokens.length ? '' : 'Add recipients'}
              className="h-7 w-0 min-w-[8rem] flex-1 bg-transparent px-1 text-[15px] outline-none"
            />
          </div>
          <p id="tf-hint" className="mt-1.5 min-h-5 text-[12px] text-[#b3261e]">
            {hint}
          </p>
          <p className="text-[12px] text-[#8e8e93]">
            {tokens.length} recipient{tokens.length === 1 ? '' : 's'}
            {tokens.some((t) => !valid(t)) && ' · fix the red addresses before sending'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 border-t border-line p-5 text-sm sm:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Screen reader hears</p>
          <p aria-live="polite" className="text-[13px] break-words">
            {said || '…'}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle px-3 py-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Keys</p>
          <p className="text-[13px]">
            <kbd>Enter</kbd> / <kbd>,</kbd> add · <kbd>Backspace</kbd> in empty field: select last, again: remove · <kbd>Tab</kbd> reaches each ×
          </p>
        </div>
      </div>
    </div>
  );
}
