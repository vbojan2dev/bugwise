import { useState } from 'react';
import { Languages } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { CartScreen } from './CartScreen';
import {
  ITEMS,
  LOCALES,
  PLURAL_FORMS,
  STRINGS,
  UNIT_PRICE,
  formatDelivery,
  formatInt,
  formatMoney,
  localeInfo,
  pluralCategory,
  pseudoAccent,
  pseudoBidi,
  type LocaleId,
  type RealLocale,
  type Strings,
} from './locales';

/*
 * Localization lab: one cart screen, correctly localized into English, German, Serbian (Latin and
 * Cyrillic), Arabic (RTL) and two Android-style pseudo-locales. The learner changes the language,
 * the quantity (to hit different plural forms) and the phone width, and sees what a tester should check.
 */

const QUICK = [1, 2, 5, 11, 21, 22];

function screenProps(locale: LocaleId, qty: number) {
  const pseudo = locale === 'en-XA' || locale === 'ar-XB';
  const base: RealLocale = pseudo ? 'en' : (locale as RealLocale);
  const tr = locale === 'en-XA' ? pseudoAccent : locale === 'ar-XB' ? pseudoBidi : (s: string) => s;
  const s: Strings = STRINGS[base];
  const cat = pluralCategory(base, qty);
  const forms = ITEMS[base];
  const items = (forms[cat] ?? forms.other!).replace('{n}', formatInt(base, qty));
  return {
    base,
    cat,
    strings: s,
    itemsLine: tr(items),
    t: tr,
    total: formatMoney(base, UNIT_PRICE[base] * qty),
    delivery: formatDelivery(base),
  };
}

export default function LocalizationLab() {
  const [locale, setLocale] = useState<LocaleId>('de');
  const [qty, setQty] = useState(2);
  const [small, setSmall] = useState(false);

  const info = localeInfo(locale);
  const r = screenProps(locale, qty);
  const s = r.strings;
  const ctaShown = r.t(s.cta);
  const enLen = STRINGS.en.cta.length;
  const growth = Math.round((ctaShown.replace(/[‮‬]/g, '').length / enLen - 1) * 100);
  const pseudo = locale === 'en-XA' || locale === 'ar-XB';

  const facts: { k: string; v: string }[] = [
    { k: 'Direction', v: info.dir === 'rtl' ? 'Right-to-left: the whole layout is mirrored' : 'Left-to-right' },
    { k: 'Script', v: info.script },
    {
      k: 'Plural form',
      v: pseudo
        ? `"${r.cat}" (pseudo-locales use the English rules)`
        : `"${r.cat}" for ${qty}. This language has ${PLURAL_FORMS[r.base].length} forms: ${PLURAL_FORMS[r.base].join(', ')}`,
    },
    { k: 'Price', v: r.total },
    { k: 'Date and time', v: r.delivery },
    { k: 'Button text vs English', v: growth === 0 ? 'Same length' : `${growth > 0 ? '+' : ''}${growth}% characters` },
  ];

  return (
    <div className="not-prose my-6 grid grid-cols-1 items-start gap-5 rounded-2xl border border-line bg-surface p-3 sm:p-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex min-w-0 justify-center">
        <PhoneFrame width={small ? 236 : 280}>
          <CartScreen
            key={locale}
            dir={info.dir}
            lang={info.lang}
            title={r.t(s.title)}
            product={r.t(s.product)}
            color={r.t(s.color)}
            video={s.video}
            qtyLabel={s.qty}
            qty={qty}
            qtyText={formatInt(r.base, qty)}
            itemsLine={r.itemsLine}
            deliveryLabel={r.t(s.delivery)}
            deliveryValue={r.delivery}
            freeDelivery={r.t(s.freeDelivery)}
            orderLabel={r.t(s.order)}
            totalLabel={r.t(s.total)}
            total={r.total}
            cta={ctaShown}
            onMinus={() => setQty((q) => Math.max(1, q - 1))}
            onPlus={() => setQty((q) => Math.min(30, q + 1))}
            backPointsRight={info.dir === 'rtl'}
            roomyText={locale === 'ar'}
          />
        </PhoneFrame>
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
            <Languages size={13} /> App language
          </p>
          <div role="radiogroup" aria-label="App language" className="flex flex-wrap gap-1.5">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={locale === l.id}
                onClick={() => setLocale(l.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${locale === l.id ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-fg'}`}
              >
                {l.id.includes('X') && <span className="font-semibold">{l.chip} </span>}
                <span dir="auto">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Quantity (try different plural forms)</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQty(n)}
                aria-pressed={qty === n}
                className={`min-w-10 rounded-lg border px-2.5 py-1.5 text-xs font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${qty === n ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
          <input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} className="size-4 accent-brand" />
          Small phone (narrower screen)
        </label>

        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line text-sm">
          {facts.map((f) => (
            <div key={f.k} className="grid grid-cols-1 gap-0.5 px-3 py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-xs font-semibold text-muted sm:text-sm">{f.k}</dt>
              <dd className="min-w-0 break-words text-fg" dir="auto">
                {f.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-xs leading-relaxed text-muted">
          {locale === 'ar' && 'Notice what flipped (layout, back arrow, stepper order) and what did not (the play icon, the order number, the price digits stay in reading order).'}
          {locale === 'de' && 'German is long: the product name wraps to more lines and the button text is more than twice as long as in English. The layout grows instead of cutting text.'}
          {(locale === 'sr-Latn' || locale === 'sr-Cyrl') && 'Serbian has three plural forms: try 1, 2, 5, 21 and 22. Dots group thousands and the comma marks decimals. Both scripts must be complete, never mixed.'}
          {locale === 'en' && 'This is the source language. Switch languages and compare: every other version must still fit, read naturally and use local formats.'}
          {locale === 'en-XA' && 'Every translated string is accented, padded about 40% and wrapped in [brackets]. Text without accents is hard-coded; a missing ] means the text is cut off.'}
          {locale === 'ar-XB' && 'The layout is mirrored like Arabic, but the words are still English, only drawn right-to-left, so you can recognize each string. Prices, dates and the order number are not resource strings, so they are unchanged.'}
        </p>
      </div>
    </div>
  );
}
