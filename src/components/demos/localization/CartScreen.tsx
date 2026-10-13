import { CalendarClock, ChevronLeft, ChevronRight, Headphones, Heart, Minus, Play, Plus, Truck } from 'lucide-react';

/*
 * One shopping-cart screen used by the localization lab (correct settings) and by the
 * localization bug hunt (broken settings). All text arrives already translated and formatted.
 */

export interface CartScreenProps {
  dir: 'ltr' | 'rtl';
  lang: string;
  title: string;
  product: string;
  color: string;
  video: string;
  qtyLabel: string;
  qty: number;
  qtyText: string;
  itemsLine: string;
  deliveryLabel: string;
  deliveryValue: string;
  freeDelivery: string;
  orderLabel: string;
  totalLabel: string;
  total: string;
  cta: string;
  onMinus: () => void;
  onPlus: () => void;
  /** Which way the back chevron points. Correct: left in LTR, right in RTL. */
  backPointsRight: boolean;
  /** Media icons must never be mirrored. */
  playFlipped?: boolean;
  /** A fixed-width, single-line button (the classic text-expansion trap). */
  ctaFixedWidth?: boolean;
  /** Extra line height for scripts with tall marks. */
  roomyText?: boolean;
}

const BLUE = '#0a6cff';

export function CartScreen(p: CartScreenProps) {
  const Back = p.backPointsRight ? ChevronRight : ChevronLeft;
  const lh = p.roomyText ? 'leading-normal' : 'leading-snug';
  return (
    <div dir={p.dir} lang={p.lang} className="flex h-full flex-col bg-[#f2f2f7] text-[#111]" style={{ colorScheme: 'light' }}>
      <div className="flex items-center gap-1 px-2 pt-1 pb-2">
        <span role="button" tabIndex={0} aria-label="Back" className="grid size-9 shrink-0 place-items-center rounded-full text-[#0a6cff] focus-visible:outline-2 focus-visible:outline-[#0a6cff]">
          <Back size={22} />
        </span>
        <p className="min-w-0 flex-1 truncate text-[17px] font-semibold">{p.title}</p>
        <span className="size-9 shrink-0" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <div className="rounded-2xl bg-white p-2.5">
          <div className="flex gap-2.5">
            <div className="relative grid size-[68px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1f2937] to-[#4b5563] text-white">
              <Headphones size={28} className="opacity-80" />
              <span className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-full bg-white/90 text-[#111]" title={p.video} aria-label={p.video}>
                <Play size={12} fill="currentColor" style={p.playFlipped ? { transform: 'scaleX(-1)' } : undefined} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] font-semibold ${lh} break-words hyphens-auto`}>{p.product}</p>
              <p className="mt-0.5 truncate text-[12px] text-[#6b7280]">{p.color}</p>
              <div className="mt-1.5 flex items-center gap-1.5" role="group" aria-label={p.qtyLabel}>
                <button type="button" onClick={p.onMinus} disabled={p.qty <= 1} aria-label="−" className="grid size-7 place-items-center rounded-full bg-[#eef0f4] text-[#111] disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-[#0a6cff]">
                  <Minus size={14} />
                </button>
                <span className="min-w-6 text-center text-[14px] font-semibold tabular-nums">{p.qtyText}</span>
                <button type="button" onClick={p.onPlus} disabled={p.qty >= 30} aria-label="+" className="grid size-7 place-items-center rounded-full bg-[#eef0f4] text-[#111] disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-[#0a6cff]">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className={`mt-2.5 px-1 text-[13px] text-[#374151] ${lh}`}>{p.itemsLine}</p>

        <div className="mt-2 space-y-2 rounded-2xl bg-white p-2.5 text-[13px]">
          <div className="flex items-start gap-2">
            <CalendarClock size={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
            <div className="min-w-0">
              <p className="text-[11px] text-[#6b7280]">{p.deliveryLabel}</p>
              <p className={`font-medium ${lh}`}>{p.deliveryValue}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Truck size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
            <p className={`min-w-0 break-words ${lh} text-[#166534]`}>{p.freeDelivery}</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            <span>{p.orderLabel}</span>
            <bdi className="font-mono">#A-2048</bdi>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-black/10 bg-white px-3 pt-2 pb-6">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-[#6b7280]">{p.totalLabel}</span>
          <span className="text-[17px] font-bold tabular-nums">{p.total}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span role="button" tabIndex={0} aria-label="Save for later" className="grid size-10 shrink-0 place-items-center rounded-xl border border-black/10 text-[#111] focus-visible:outline-2 focus-visible:outline-[#0a6cff]">
            <Heart size={18} />
          </span>
          {p.ctaFixedWidth ? (
            <button type="button" className="ms-auto h-10 w-[150px] overflow-hidden rounded-xl px-3 text-[14px] font-semibold whitespace-nowrap text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a6cff]" style={{ background: BLUE }}>
              {p.cta}
            </button>
          ) : (
            <button type="button" className={`min-h-10 min-w-0 flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold ${lh} text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a6cff]`} style={{ background: BLUE }}>
              {p.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
