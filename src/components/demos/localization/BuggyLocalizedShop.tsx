import { useState } from 'react';
import { Languages } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { CartScreen } from './CartScreen';
import { ITEMS, LOCALES, STRINGS, UNIT_PRICE, formatInt, formatMoney, groupNumber, localeInfo, type RealLocale } from './locales';

/*
 * A deliberately broken localized cart (ShopNest) for the localization bug hunt. Bugs (don't spoil them!):
 *  1. The checkout button has a fixed width and no wrapping: the German "Zahlungspflichtig bestellen" is cut off.
 *  2. Plurals use the English rule (n === 1 ? one : other) for every language:
 *     Serbian 2 → "2 artikala" (should be "2 artikla"), 21 → "21 artikala" (should be "21 artikal").
 *  3. Arabic: the layout mirrors correctly, but the back chevron is hard-coded to point left
 *     and the play icon on the product video is mirrored (it should never flip).
 *  4. The delivery date is glued together from translated pieces in US order with a 12-hour clock:
 *     German "Freitag, Oktober 16 · 2:30 PM" instead of "Freitag, 16. Oktober · 14:30".
 *  5. Serbian (Cyrillic) is missing one translation and shows the raw key "cart.free_delivery_note".
 *  6. Serbian prices use US separators: "27,980.00 RSD" instead of "27.980,00 RSD".
 *
 * Working on purpose: English is fully correct, German and Arabic prices are formatted correctly,
 * the Arabic layout direction is mirrored, the product name wraps, Latin Serbian has every string.
 */

const LANGS = LOCALES.filter((l) => !l.id.includes('X')) as { id: RealLocale; chip: string; name: string; lang: string; dir: 'ltr' | 'rtl' }[];

const WEEKDAY: Record<RealLocale, string> = { en: 'Friday', de: 'Freitag', 'sr-Latn': 'petak', 'sr-Cyrl': 'петак', ar: 'الجمعة' };
const MONTH: Record<RealLocale, string> = { en: 'October', de: 'Oktober', 'sr-Latn': 'oktobar', 'sr-Cyrl': 'октобар', ar: 'أكتوبر' };

// BUG 4: built by concatenation in US order, 12-hour clock for everyone.
const buggyDelivery = (l: RealLocale) => WEEKDAY[l] + ', ' + MONTH[l] + ' ' + 16 + ' · ' + '2:30 PM';

// BUG 6: the money helper only knows en, de and ar; everything else falls back to US formatting.
function buggyMoney(l: RealLocale, v: number) {
  if (l === 'sr-Latn' || l === 'sr-Cyrl') return groupNumber(v, ',', '.') + ' RSD';
  return formatMoney(l, v);
}

// BUG 2: English plural logic for every language.
function buggyItems(l: RealLocale, n: number) {
  const forms = ITEMS[l];
  const form = n === 1 ? forms.one! : forms.other!;
  return form.replace('{n}', formatInt(l, n));
}

export function BuggyLocalizedShop() {
  const [lang, setLang] = useState<RealLocale>('en');
  const [qty, setQty] = useState(1);
  const info = localeInfo(lang);
  const s = STRINGS[lang];

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={280}>
        <CartScreen
          key={lang}
          dir={info.dir}
          lang={info.lang}
          title={s.title}
          product={s.product}
          color={s.color}
          video={s.video}
          qtyLabel={s.qty}
          qty={qty}
          qtyText={formatInt(lang, qty)}
          itemsLine={buggyItems(lang, qty)}
          deliveryLabel={s.delivery}
          deliveryValue={buggyDelivery(lang)}
          freeDelivery={lang === 'sr-Cyrl' ? 'cart.free_delivery_note' : s.freeDelivery}
          orderLabel={s.order}
          totalLabel={s.total}
          total={buggyMoney(lang, UNIT_PRICE[lang] * qty)}
          cta={s.cta}
          onMinus={() => setQty((q) => Math.max(1, q - 1))}
          onPlus={() => setQty((q) => Math.min(30, q + 1))}
          backPointsRight={false}
          playFlipped={info.dir === 'rtl'}
          ctaFixedWidth
          roomyText={lang === 'ar'}
        />
      </PhoneFrame>

      <div className="w-full space-y-2 rounded-2xl border border-line bg-surface p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
          <Languages size={13} /> Settings › App language
        </p>
        <div role="radiogroup" aria-label="App language" className="grid grid-cols-1 gap-1 min-[360px]:grid-cols-2">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`min-w-0 truncate rounded-lg border px-2.5 py-1.5 text-start text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${lang === l.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
            >
              <span dir="auto">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the localization spec</p>
        <ul className="mt-1 list-disc space-y-1 ps-4">
          <li>Dates, times and prices follow the language's conventions (German and Serbian: day before month, 24-hour clock, <strong className="text-fg">1.234,56</strong>).</li>
          <li>
            Serbian item counts: <strong className="text-fg">1 artikal · 2–4 artikla · 5–20 artikala · 21 artikal · 22 artikla</strong>.
          </li>
          <li>Arabic is right-to-left: the screen is mirrored, direction icons flip, media icons never do.</li>
          <li>No text may be cut off or left untranslated in any language.</li>
        </ul>
      </div>
    </div>
  );
}
