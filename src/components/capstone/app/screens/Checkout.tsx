import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, Clock, CreditCard, House, MapPin } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { ADDRESSES, USER, restaurantById } from '../data';
import { clockOf, hhmm } from '../i18n';
import { totals } from '../pricing';
import { useApp } from '../context';
import { Sheet, Spinner, TopBar } from '../ui';

export interface CheckoutDraft {
  address: string;
  picked: boolean;
  slot: number | null;
  payment: 'card';
  note: string;
}
export const emptyDraft: CheckoutDraft = { address: '', picked: false, slot: null, payment: 'card', note: '' };
export const isDirty = (d: CheckoutDraft) => d.address !== '' || d.slot !== null || d.payment !== 'card' || d.note !== '';

/** BUG B11: slots start 70 minutes before "now", so past slots are offered. */
export function slotsFor(nowMin: number) {
  const out: number[] = [];
  const start = Math.floor((nowMin - 70) / SPEC.slotMinutes) * SPEC.slotMinutes;
  for (let s = start; s <= 22 * 60 + 30; s += SPEC.slotMinutes) out.push(s);
  return out;
}

export function Checkout({
  draft,
  setDraft,
  placing,
  error,
  onPlace,
  onBack,
}: {
  draft: CheckoutDraft;
  setDraft: (fn: (d: CheckoutDraft) => CheckoutDraft) => void;
  placing: boolean;
  error: string | null;
  onPlace: () => void;
  onBack: () => void;
}) {
  const { t, lang, api, now, money, cur, cart, seen, active } = useApp();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [addrError, setAddrError] = useState(false);
  const r = restaurantById(cart.restaurantId);
  const tot = totals(cart, cur);
  const nowMin = clockOf(now);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Address autocomplete (debounced request).
  useEffect(() => {
    const q = draft.address.trim();
    if (draft.picked || q.length < 3) {
      setSuggestions([]);
      return;
    }
    let alive = true;
    const id = window.setTimeout(() => {
      api('GET', `/api/addresses/autocomplete?q=${encodeURIComponent(q)}`, { ms: 350 })
        .then(() => {
          if (!alive) return;
          const f = (s: string) => s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
          setSuggestions(ADDRESSES.filter((a) => f(a).includes(f(q))).slice(0, 5));
          setListOpen(true);
        })
        .catch(() => alive && setSuggestions([]));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [draft.address, draft.picked, api]);

  // B20: the German button label doesn't fit.
  useLayoutEffect(() => {
    const b = btnRef.current;
    if (b && active && lang === 'de' && b.scrollWidth > b.clientWidth + 1) seen('B20', 'checkout');
  });

  const openSlots = () => {
    setSheet(true);
    if (slotsFor(nowMin).some((s) => s + SPEC.slotMinutes <= nowMin)) seen('B11', 'checkout');
  };

  const place = () => {
    if (!draft.address.trim()) {
      setAddrError(true);
      return;
    }
    setAddrError(false);
    onPlace();
  };

  const showList = listOpen && suggestions.length > 0 && !draft.picked;
  const slotLabel = draft.slot == null ? t('asap') : `${t('today')}, ${hhmm(draft.slot)}–${hhmm(draft.slot + SPEC.slotMinutes)}`;


  return (
    <div className="relative flex h-full flex-col">
      <TopBar title={t('checkout')} onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <section className="mt-3 bg-(--sf) px-4 py-3">
          <label htmlFor="fd-addr" className="t13 mb-1.5 flex items-center gap-1.5 font-semibold">
            <MapPin size={14} aria-hidden="true" /> {t('address')}
          </label>
          <div className="relative">
            <input
              id="fd-addr"
              role="combobox"
              aria-expanded={showList}
              aria-controls="fd-addr-list"
              aria-autocomplete="list"
              aria-invalid={addrError}
              aria-describedby={addrError ? 'fd-addr-err' : undefined}
              autoComplete="off"
              value={draft.address}
              placeholder={t('addressPh')}
              onBlur={() => window.setTimeout(() => setListOpen(false), 150)}
              onKeyDown={(e) => e.key === 'Escape' && setListOpen(false)}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d) => ({ ...d, address: v, picked: false }));
              }}
              className="t15 h-11 w-full rounded-lg border bg-(--bg) px-3 outline-none focus:border-(--brandfg)"
              style={{ borderColor: addrError ? 'var(--danger)' : 'var(--line)' }}
            />
            {showList && (
              <ul id="fd-addr-list" role="listbox" aria-label={t('suggestions')} className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-(--line) bg-(--sf) shadow-lg">
                {suggestions.map((a) => (
                  <li key={a} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setDraft((d) => ({ ...d, address: a, picked: true }));
                        setSuggestions([]);
                        setAddrError(false);
                      }}
                      className="t14 flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-(--sf2)"
                    >
                      <MapPin size={14} aria-hidden="true" className="shrink-0 text-(--sub)" /> <span className="min-w-0">{a}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {addrError && (
            <p id="fd-addr-err" className="t13 mt-1 text-(--danger)">
              {t('errAddress')}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setDraft((d) => ({ ...d, address: USER.home, picked: true }));
              setAddrError(false);
            }}
            className="t13 mt-2 flex items-center gap-1.5 py-1 font-medium text-(--brandfg)"
          >
            <House size={14} aria-hidden="true" /> {t('useHome')}
          </button>
        </section>

        <section className="mt-3 bg-(--sf)">
          <button type="button" onClick={openSlots} className="flex w-full items-center gap-3 px-4 py-3 text-left">
            <Clock size={18} aria-hidden="true" className="shrink-0 text-(--sub)" />
            <span className="min-w-0 flex-1">
              <span className="t13 block font-semibold">{t('time')}</span>
              <span className="t14 block text-(--sub)">{slotLabel}</span>
            </span>
            <span className="t13 font-medium text-(--brandfg)">{t('change')}</span>
            <ChevronRight size={16} aria-hidden="true" className="text-(--sub)" />
          </button>
        </section>

        <section className="mt-3 flex items-center gap-3 bg-(--sf) px-4 py-3">
          <CreditCard size={18} aria-hidden="true" className="shrink-0 text-(--sub)" />
          <div className="min-w-0">
            <h2 className="t13 font-semibold">{t('payment')}</h2>
            <p className="t14">{t('card')}</p>
            <p className="t12 text-(--sub)">{t('paymentNote')}</p>
          </div>
        </section>

        <section className="mt-3 bg-(--sf) px-4 py-3">
          <label htmlFor="fd-note" className="t13 mb-1.5 block font-semibold">
            {t('note')}
          </label>
          <textarea
            id="fd-note"
            rows={2}
            value={draft.note}
            placeholder={t('notePh')}
            onChange={(e) => {
              const v = e.target.value;
              setDraft((d) => ({ ...d, note: v }));
            }}
            className="t14 w-full resize-none rounded-lg border border-(--line) bg-(--bg) px-3 py-2 outline-none focus:border-(--brandfg)"
          />
        </section>

        <section className="mt-3 bg-(--sf) px-4 py-3">
          <h2 className="t13 mb-1.5 font-semibold">{t('summary')}</h2>
          <p className="t13 mb-1.5 text-(--sub) [overflow-wrap:anywhere]">{r?.name}</p>
          <dl className="t14 space-y-1">
            <div className="flex justify-between gap-3">
              <dt className="text-(--sub)">{t('subtotal')}</dt>
              <dd className="tabular-nums">{money(tot.subtotal)}</dd>
            </div>
            {tot.discount > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-(--sub)">{t('discount', { c: cart.coupons.join(' + ') })}</dt>
                <dd className="text-(--ok) tabular-nums">−{money(tot.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-(--sub)">{t('deliveryFee')}</dt>
              <dd className="tabular-nums">{tot.free ? t('free') : money(tot.fee)}</dd>
            </div>
            <div className="t16 flex justify-between gap-3 border-t border-(--line) pt-1.5 font-bold">
              <dt>{t('total')}</dt>
              <dd className="tabular-nums">{money(tot.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
      <div className="shrink-0 border-t border-(--line) bg-(--sf) px-3 pt-2 pb-3">
        {error && (
          <p role="alert" className="t13 mb-2 rounded-lg bg-(--brandsoft) px-3 py-2 text-(--danger)">
            {error}
          </p>
        )}
        {/* BUG B12: stays enabled while the request runs. BUG B20: fixed height, no wrapping, clipped. */}
        <button
          ref={btnRef}
          type="button"
          onClick={place}
          aria-busy={placing}
          className="t16 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-(--brand) px-4 font-semibold whitespace-nowrap text-white"
        >
          {placing && <Spinner />}
          <span>{placing ? t('placing') : t('placeOrder')}</span>
        </button>
      </div>

      {sheet && (
        <Sheet title={t('chooseTime')} onClose={() => setSheet(false)}>
          <ul role="radiogroup" aria-label={t('time')} className="space-y-1.5">
            {[null, ...slotsFor(nowMin)].map((s) => {
              const on = draft.slot === s;
              const label = s == null ? t('asap') : `${t('today')}, ${hhmm(s)}–${hhmm(s + SPEC.slotMinutes)}`;
              return (
                <li key={String(s)}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setDraft((d) => ({ ...d, slot: s }));
                      setSheet(false);
                    }}
                    className="t15 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left"
                    style={{ borderColor: on ? 'var(--brandfg)' : 'var(--line)', background: on ? 'var(--brandsoft)' : 'transparent' }}
                  >
                    <span>
                      {label}
                      {s == null && r && <span className="t12 block text-(--sub)">{t('asapSub', { a: r.eta[0], b: r.eta[1] })}</span>}
                    </span>
                    <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2" style={{ borderColor: on ? 'var(--brandfg)' : 'var(--line)' }}>
                      {on && <span className="size-2.5 rounded-full bg-(--brandfg)" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}
