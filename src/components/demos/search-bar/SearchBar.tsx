import { useRef, type ChangeEvent, type FocusEvent, type ReactNode, type RefObject } from 'react';
import { CircleX, Mic, Search } from 'lucide-react';

/** Lowercase, trim and strip accents: "  Crème " → "creme". */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export interface IOSSearchFieldProps {
  value: string;
  onChange: (value: string, e?: ChangeEvent<HTMLInputElement>) => void;
  /** Called by the keyboard's Search key (Enter). Omit to make Enter do nothing. */
  onSubmit?: (value: string) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  /** Shows the Cancel button when true. */
  active?: boolean;
  onCancel?: () => void;
  /** Custom behavior for the clear (×) button; default clears the text and keeps focus. */
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  mic?: boolean;
  dark?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Extra button after the field (e.g. filter). */
  trailing?: ReactNode;
}

/** iOS-style search bar (UISearchBar / .searchable): grey rounded field, clear button, Cancel when active. */
export function IOSSearchField({
  value,
  onChange,
  onSubmit,
  onFocus,
  active = false,
  onCancel,
  onClear,
  placeholder = 'Search',
  label,
  mic = false,
  dark = false,
  inputRef,
  trailing,
}: IOSSearchFieldProps) {
  const ownRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? ownRef;
  const grey = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="flex items-center gap-2"
    >
      <div
        className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-2 focus-within:ring-2 focus-within:ring-[#007aff]/40"
        style={{ background: dark ? 'rgba(118,118,128,.24)' : 'rgba(118,118,128,.12)' }}
      >
        <Search size={16} strokeWidth={2.4} style={{ color: grey }} className="shrink-0" aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label={label ?? placeholder}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value, e)}
          onFocus={onFocus}
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-[16px] outline-none [&::-webkit-search-cancel-button]:hidden"
          style={{ color: dark ? '#fff' : '#000', caretColor: '#007aff' }}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear text"
            onClick={() => {
              if (onClear) onClear();
              else onChange('');
              ref.current?.focus();
            }}
            className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50"
          >
            <CircleX size={17} fill={dark ? '#8e8e93' : '#a3a3a8'} color={dark ? '#1c1c1e' : '#fff'} strokeWidth={2.2} />
          </button>
        ) : mic ? (
          <button type="button" aria-label="Dictate" className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50">
            <Mic size={17} style={{ color: grey }} />
          </button>
        ) : null}
      </div>
      {trailing}
      {active && (
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 animate-[ios-cancel-in_.25s_ease-out] rounded text-[16px] text-[#007aff] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
