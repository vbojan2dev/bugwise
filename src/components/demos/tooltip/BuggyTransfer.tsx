import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { CircleHelp, Info, QrCode, RotateCcw, Volume2 } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { useAnnouncer } from './Tooltip';

/*
 * A deliberately broken "Send money" page in a web bank. Bugs (don't spoil them!):
 *  1. The IBAN info tooltip only opens on mouse hover (pointerType === 'mouse'):
 *     nothing on keyboard focus, nothing on tap.
 *  2. The fee info tooltip is anchored to the icon's left edge and grows to the right,
 *     so near the right edge it is cut off by the page.
 *  3. The reference tooltip hides the moment the pointer leaves the icon, and sits 12 px away:
 *     you can't move the pointer onto it (not hoverable).
 *  4. The amount hint opens on focus, covers the Reference field below, and Esc does not close it
 *     (the first click on the covered field only closes the hint).
 *  5. The instant-transfer toggletip contains a link, but its "click outside closes" handler doesn't
 *     exclude the bubble: pressing the link closes the bubble before the click lands. The link also has
 *     tabIndex -1, so it can't be reached with Tab either.
 *  6. The QR scan icon button has a visual tooltip but no accessible name (no aria-label,
 *     tooltip not linked): a screen reader just says "button".
 */

function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((i) => clearTimeout(i)), []);
  return {
    later: (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      ids.current.push(id);
      return id;
    },
    clear: (id?: number) => clearTimeout(id),
  };
}

const bubble = 'rounded-md bg-[#1f2330] px-2.5 py-1.5 text-[12px] leading-4 font-normal text-white shadow-lg';

export function BuggyTransfer() {
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [instant, setInstant] = useState(false);
  const [tip, setTip] = useState<null | 'qr' | 'iban' | 'fee' | 'ref'>(null);
  const [amountHint, setAmountHint] = useState(false);
  const [toggletip, setToggletip] = useState(false);
  const [sent, setSent] = useState('');
  const [said, setSaid] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const qrHide = useRef<number | undefined>(undefined);
  const ibanHide = useRef<number | undefined>(undefined);
  const qrBtn = useRef<HTMLButtonElement>(null);
  const { later, clear } = useTimers();

  useAnnouncer(root, setSaid);

  // Esc closes the hover/focus tooltips (the amount hint is separate state, see BUG 4).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!toggletip) return;
    // BUG 5: "click outside closes" only excludes the trigger, not the bubble itself
    const onDown = (e: globalThis.PointerEvent) => {
      const t = e.target as Element;
      if (!t.closest?.('[data-toggletip-trigger]')) setToggletip(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [toggletip]);

  const isMouse = (e: PointerEvent) => e.pointerType === 'mouse';
  const kbFocus = (el: Element) => {
    try {
      return el.matches(':focus-visible');
    } catch {
      return true;
    }
  };

  const fee = instant ? '€0.50' : '€0.00';
  const send = () => {
    const a = amount.trim() || '0';
    setSent(`Demo: €${a} would be sent to ${name.trim() || 'the recipient'}${instant ? ' instantly' : ''}.`);
  };
  const reset = () => {
    setName('');
    setIban('');
    setAmount('');
    setReference('');
    setInstant(false);
    setTip(null);
    setAmountHint(false);
    setToggletip(false);
    setSent('');
    setSaid('');
  };

  const label = 'mb-1 flex items-center gap-1 text-[13px] font-medium text-[#3c4150]';
  const input =
    'h-11 w-full min-w-0 rounded-lg border border-black/20 bg-white px-3 text-[15px] text-[#0e1120] outline-none placeholder:text-black/35 focus:border-[#2f6bff] focus:ring-2 focus:ring-[#2f6bff]/30';
  const iconBtn = 'grid size-7 place-items-center rounded-full text-[#5a5f70] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff]';

  return (
    <div ref={root} className="flex w-full max-w-[520px] flex-col gap-4">
      <BrowserFrame url="bank.example.com/transfer">
        <div className="bg-[#f4f6fa] px-4 pt-4 pb-6 text-[#0e1120]" style={{ colorScheme: 'light' }}>
          {/* Header with the QR icon button (BUG 6) */}
          <div className="flex items-center gap-2">
            <h3 className="m-0 min-w-0 flex-1 text-[20px] font-bold">Send money</h3>
            <span className="relative">
              <button
                ref={qrBtn}
                type="button"
                /* BUG 6: no aria-label, and the tooltip isn't linked with aria-labelledby */
                onPointerEnter={(e) => {
                  if (!isMouse(e)) return;
                  clear(qrHide.current);
                  setTip('qr');
                }}
                onPointerLeave={(e) => {
                  if (!isMouse(e)) return;
                  qrHide.current = later(() => setTip((t) => (t === 'qr' ? null : t)), 150);
                }}
                onFocus={(e) => kbFocus(e.currentTarget) && setTip('qr')}
                onBlur={() => setTip((t) => (t === 'qr' ? null : t))}
                className="grid size-10 place-items-center rounded-full bg-white text-[#0e1120] shadow-sm outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#2f6bff]"
              >
                <QrCode size={20} />
              </button>
              {tip === 'qr' && <span className={`absolute top-full right-0 z-40 mt-2 w-max ${bubble}`}>Scan QR code</span>}
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-[13px] shadow-sm">
            <span className="text-[#5a5f70]">From</span> <strong>Main account</strong>
            <span className="float-right font-semibold">€1,240.50</span>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="bt-name" className={label}>
                Recipient name
              </label>
              <input id="bt-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={input} placeholder="Anna Berg" />
            </div>

            {/* IBAN (BUG 1) */}
            <div className="relative">
              <div className={label}>
                <label htmlFor="bt-iban">IBAN</label>
                <button
                  type="button"
                  aria-label="About IBAN"
                  onPointerEnter={(e) => {
                    if (!isMouse(e)) return; // BUG 1: hover only
                    clear(ibanHide.current);
                    setTip('iban');
                  }}
                  onPointerLeave={(e) => {
                    if (!isMouse(e)) return;
                    ibanHide.current = later(() => setTip((t) => (t === 'iban' ? null : t)), 200);
                  }}
                  className={iconBtn}
                >
                  <Info size={15} aria-hidden="true" />
                </button>
              </div>
              {tip === 'iban' && (
                <span
                  onPointerEnter={() => clear(ibanHide.current)}
                  onPointerLeave={() => setTip((t) => (t === 'iban' ? null : t))}
                  className={`absolute bottom-full left-0 z-40 mb-1 max-w-[260px] ${bubble}`}
                >
                  Up to 34 letters and numbers. It starts with the country code, e.g. DE89 3704 0044 0532 0130 00.
                </span>
              )}
              <input id="bt-iban" value={iban} onChange={(e) => setIban(e.target.value)} autoComplete="off" className={`${input} font-mono`} placeholder="DE00 0000 0000 0000 0000 00" />
            </div>

            {/* Amount (BUG 4) */}
            <div className="relative">
              <label htmlFor="bt-amount" className={label}>
                Amount (€)
              </label>
              <input
                id="bt-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                onFocus={() => setAmountHint(true)}
                onBlur={() => setAmountHint(false)}
                /* BUG 4: no Escape handling */
                autoComplete="off"
                className={input}
                placeholder="0.00"
              />
              {amountHint && (
                <div className={`absolute top-full right-0 left-0 z-40 mt-2 ${bubble} px-3 py-2.5 text-[13px] leading-snug`}>
                  <span aria-hidden="true" className="absolute -top-1 left-6 size-2 rotate-45 bg-[#1f2330]" />
                  Daily limit: €2,000. Transfers over €1,000 to new recipients need approval in the app. Available today: €1,240.50.
                </div>
              )}
            </div>

            {/* Reference (BUG 3) */}
            <div className="relative">
              <div className={label}>
                <label htmlFor="bt-ref">Reference (optional)</label>
                <button
                  type="button"
                  aria-label="About reference"
                  aria-describedby="bt-ref-tip"
                  onPointerEnter={(e) => isMouse(e) && setTip('ref')}
                  onPointerLeave={(e) => isMouse(e) && setTip((t) => (t === 'ref' ? null : t))} /* BUG 3: no delay, no hover bridge */
                  onFocus={(e) => kbFocus(e.currentTarget) && setTip('ref')}
                  onBlur={() => setTip((t) => (t === 'ref' ? null : t))}
                  className={iconBtn}
                >
                  <Info size={15} aria-hidden="true" />
                </button>
              </div>
              <span id="bt-ref-tip" role="tooltip" hidden={tip !== 'ref'} className={`absolute bottom-full left-0 z-40 mb-3 max-w-[280px] ${bubble}`}>
                Shown on the recipient’s statement, max. 140 characters. Allowed: letters, numbers and / - ? : ( ) . , ’ +. Don’t enter passwords or card numbers.
              </span>
              <input id="bt-ref" value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" maxLength={140} className={input} placeholder="Rent October" />
            </div>
          </div>

          {/* Instant transfer (BUG 5) and fee (BUG 2) */}
          <div className="mt-5 rounded-xl bg-white p-3 shadow-sm">
            <div className="relative flex items-center gap-1">
              <span id="bt-instant-label" className="text-[14px] font-medium">
                Instant transfer
              </span>
              <button
                type="button"
                data-toggletip-trigger
                aria-label="About instant transfer"
                aria-expanded={toggletip}
                onClick={() => setToggletip((v) => !v)}
                className={iconBtn}
              >
                <CircleHelp size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={instant}
                aria-labelledby="bt-instant-label"
                onClick={() => setInstant((v) => !v)}
                className="relative ml-auto h-7 w-12 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2"
                style={{ background: instant ? '#2f6bff' : '#c7cad4' }}
              >
                <span className="absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left] duration-150" style={{ left: instant ? 22 : 2 }} />
              </button>
              {toggletip && (
                /* BUG 5: the link is not focusable, and pointerdown on it closes the bubble first */
                <div className={`absolute bottom-full left-0 z-40 mb-2 w-[230px] max-w-full ${bubble} px-3 py-2.5 text-[13px] leading-snug`}>
                  Arrives within 10 seconds, 24/7. Costs €0.50 per transfer.{' '}
                  <a href="#fees" tabIndex={-1} onClick={(e) => e.preventDefault()} className="font-semibold text-[#9db8ff] underline">
                    See all fees
                  </a>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center border-t border-black/10 pt-3 text-[14px]">
              <span className="flex-1 text-[#5a5f70]">Fee</span>
              <span className="font-semibold">{fee}</span>
              <span className="relative ml-1">
                <button
                  type="button"
                  aria-label="About fees"
                  aria-describedby="bt-fee-tip"
                  onPointerEnter={(e) => isMouse(e) && setTip('fee')}
                  onPointerLeave={(e) => isMouse(e) && setTip((t) => (t === 'fee' ? null : t))}
                  onFocus={(e) => kbFocus(e.currentTarget) && setTip('fee')}
                  onBlur={() => setTip((t) => (t === 'fee' ? null : t))}
                  onPointerUp={(e) => e.pointerType === 'touch' && setTip((t) => (t === 'fee' ? null : 'fee'))}
                  className={iconBtn}
                >
                  <Info size={15} aria-hidden="true" />
                </button>
                {/* BUG 2: anchored at the icon's left edge, grows to the right, no collision handling */}
                <span id="bt-fee-tip" role="tooltip" hidden={tip !== 'fee'} className={`absolute top-full left-0 z-40 mt-2 w-[220px] ${bubble}`}>
                  Standard SEPA transfers are free, without limit. Instant transfers cost €0.50 each.
                </span>
              </span>
            </div>
          </div>

          <button type="button" onClick={send} className="mt-5 h-12 w-full rounded-full bg-[#0e1120] text-[15px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2">
            Review transfer
          </button>
          {sent && (
            <p role="status" className="mt-3 rounded-lg bg-[#e6f6ec] px-3 py-2 text-[13px] text-[#17733a]">
              {sent}
            </p>
          )}
        </div>
      </BrowserFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Tester tools</p>
          <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reload page
          </button>
        </div>
        <div className="mt-2 rounded-lg bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader would say
          </p>
          <p className="mt-1 text-sm text-fg" aria-live="polite">
            {said ? `“${said}”` : 'Tab through the page to hear each control…'}
          </p>
        </div>
        <p className="mt-2 px-1 text-xs text-muted">Test with the mouse, then only the keyboard (Tab, Esc). On a phone, tap the info icons.</p>
      </div>
    </div>
  );
}
