/*
 * Shared, hand-written locale data for the localization demos.
 * Everything is hard-coded (no Intl calls) so server and browser render exactly the same text.
 */

export type LocaleId = 'en' | 'de' | 'sr-Latn' | 'sr-Cyrl' | 'ar' | 'en-XA' | 'ar-XB';
export type RealLocale = 'en' | 'de' | 'sr-Latn' | 'sr-Cyrl' | 'ar';
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface LocaleInfo {
  id: LocaleId;
  chip: string;
  name: string;
  lang: string;
  dir: 'ltr' | 'rtl';
  script: string;
}

export const LOCALES: LocaleInfo[] = [
  { id: 'en', chip: 'EN', name: 'English (US)', lang: 'en-US', dir: 'ltr', script: 'Latin' },
  { id: 'de', chip: 'DE', name: 'Deutsch', lang: 'de-DE', dir: 'ltr', script: 'Latin' },
  { id: 'sr-Latn', chip: 'SR', name: 'Srpski (latinica)', lang: 'sr-Latn-RS', dir: 'ltr', script: 'Latin' },
  { id: 'sr-Cyrl', chip: 'СР', name: 'Српски (ћирилица)', lang: 'sr-Cyrl-RS', dir: 'ltr', script: 'Cyrillic' },
  { id: 'ar', chip: 'AR', name: 'العربية', lang: 'ar-AE', dir: 'rtl', script: 'Arabic' },
  { id: 'en-XA', chip: 'en-XA', name: 'Pseudo: accented', lang: 'en-XA', dir: 'ltr', script: 'Latin (accented)' },
  { id: 'ar-XB', chip: 'ar-XB', name: 'Pseudo: right-to-left', lang: 'ar-XB', dir: 'rtl', script: 'Latin (RTL)' },
];

export const localeInfo = (id: LocaleId) => LOCALES.find((l) => l.id === id)!;

// ---------- Plural rules (CLDR, integers only) ----------
export function pluralCategory(locale: RealLocale, n: number): PluralCategory {
  if (locale === 'en' || locale === 'de') return n === 1 ? 'one' : 'other';
  if (locale === 'sr-Latn' || locale === 'sr-Cyrl') {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'one';
    if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'few';
    return 'other';
  }
  // Arabic
  const m100 = n % 100;
  if (n === 0) return 'zero';
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  if (m100 >= 3 && m100 <= 10) return 'few';
  if (m100 >= 11 && m100 <= 99) return 'many';
  return 'other';
}

export const PLURAL_FORMS: Record<RealLocale, PluralCategory[]> = {
  en: ['one', 'other'],
  de: ['one', 'other'],
  'sr-Latn': ['one', 'few', 'other'],
  'sr-Cyrl': ['one', 'few', 'other'],
  ar: ['zero', 'one', 'two', 'few', 'many', 'other'],
};

/** "{n} items in your cart" in every plural form. {n} is replaced with the formatted number. */
export const ITEMS: Record<RealLocale, Partial<Record<PluralCategory, string>>> = {
  en: { one: '{n} item in your cart', other: '{n} items in your cart' },
  de: { one: '{n} Artikel im Warenkorb', other: '{n} Artikel im Warenkorb' },
  'sr-Latn': { one: '{n} artikal u korpi', few: '{n} artikla u korpi', other: '{n} artikala u korpi' },
  'sr-Cyrl': { one: '{n} артикал у корпи', few: '{n} артикла у корпи', other: '{n} артикала у корпи' },
  ar: {
    zero: 'لا توجد منتجات في سلتك',
    one: 'منتج واحد في سلتك',
    two: 'منتجان في سلتك',
    few: '{n} منتجات في سلتك',
    many: '{n} منتجًا في سلتك',
    other: '{n} منتج في سلتك',
  },
};

// ---------- UI strings ----------
export interface Strings {
  title: string;
  product: string;
  color: string;
  video: string;
  delivery: string;
  freeDelivery: string;
  total: string;
  order: string;
  cta: string;
  qty: string;
}

export const STRINGS: Record<RealLocale, Strings> = {
  en: {
    title: 'Cart',
    product: 'Noise-canceling headphones',
    color: 'Midnight black',
    video: 'Watch video',
    delivery: 'Delivery',
    freeDelivery: 'Free delivery on this order',
    total: 'Total',
    order: 'Order',
    cta: 'Place order',
    qty: 'Quantity',
  },
  de: {
    title: 'Warenkorb',
    product: 'Kopfhörer mit Geräuschunterdrückung',
    color: 'Mitternachtsschwarz',
    video: 'Video ansehen',
    delivery: 'Lieferung',
    freeDelivery: 'Kostenlose Lieferung für diese Bestellung',
    total: 'Gesamtsumme',
    order: 'Bestellung',
    cta: 'Zahlungspflichtig bestellen',
    qty: 'Menge',
  },
  'sr-Latn': {
    title: 'Korpa',
    product: 'Slušalice sa poništavanjem buke',
    color: 'Ponoćno crna',
    video: 'Pogledaj video',
    delivery: 'Dostava',
    freeDelivery: 'Besplatna dostava za ovu porudžbinu',
    total: 'Ukupno',
    order: 'Porudžbina',
    cta: 'Naruči',
    qty: 'Količina',
  },
  'sr-Cyrl': {
    title: 'Корпа',
    product: 'Слушалице са поништавањем буке',
    color: 'Поноћно црна',
    video: 'Погледај видео',
    delivery: 'Достава',
    freeDelivery: 'Бесплатна достава за ову поруџбину',
    total: 'Укупно',
    order: 'Поруџбина',
    cta: 'Наручи',
    qty: 'Количина',
  },
  ar: {
    title: 'السلة',
    product: 'سماعات بخاصية إلغاء الضوضاء',
    color: 'أسود ليلي',
    video: 'شاهد الفيديو',
    delivery: 'التوصيل',
    freeDelivery: 'توصيل مجاني لهذا الطلب',
    total: 'الإجمالي',
    order: 'الطلب',
    cta: 'اطلب الآن',
    qty: 'الكمية',
  },
};

// ---------- Numbers and money ----------
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

export function groupNumber(value: number, group: string, decimal: string, fraction = 2) {
  const [int, frac] = Math.abs(value).toFixed(fraction).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return (value < 0 ? '-' : '') + grouped + (frac ? decimal + frac : '');
}

export const UNIT_PRICE: Record<RealLocale, number> = { en: 129.9, de: 119.9, 'sr-Latn': 13990, 'sr-Cyrl': 13990, ar: 479 };

/** Correct, locale-aware number formatting. */
export function formatInt(locale: RealLocale, n: number) {
  return locale === 'ar' ? toArabicDigits(String(n)) : String(n);
}

/** Correct, locale-aware price formatting. */
export function formatMoney(locale: RealLocale, value: number) {
  switch (locale) {
    case 'en':
      return '$' + groupNumber(value, ',', '.');
    case 'de':
      return groupNumber(value, '.', ',') + ' €';
    case 'sr-Latn':
    case 'sr-Cyrl':
      return groupNumber(value, '.', ',') + ' RSD';
    case 'ar':
      return toArabicDigits(groupNumber(value, '٬', '٫')) + ' د.إ.‏';
  }
}

// ---------- Dates ----------
/** The delivery slot used in every demo: Friday 16 October 2026, 14:30. */
export function formatDelivery(locale: RealLocale) {
  switch (locale) {
    case 'en':
      return 'Fri, Oct 16 · 2:30 PM';
    case 'de':
      return 'Fr., 16. Okt. · 14:30';
    case 'sr-Latn':
      return 'pet, 16. okt. · 14:30';
    case 'sr-Cyrl':
      return 'пет, 16. окт. · 14:30';
    case 'ar':
      return 'الجمعة، ١٦ أكتوبر · ٢:٣٠ م';
  }
}

// ---------- Pseudo-localization ----------
const ACCENTS: Record<string, string> = {
  a: 'å', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ',
  n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', G: 'Ĝ', H: 'Ĥ', I: 'Î', L: 'Ļ', N: 'Ñ', O: 'Ö', P: 'Þ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', Y: 'Ý', Z: 'Ž',
};
const PAD = 'one two three four five six seven eight nine ten eleven twelve'.split(' ');

/** Android-style en-XA: accented letters, about 40% longer, wrapped in brackets. Numbers and placeholders stay. */
export function pseudoAccent(s: string) {
  const accented = s.replace(/[A-Za-z]/g, (ch) => ACCENTS[ch] ?? ch);
  const want = Math.ceil(s.length * 0.4);
  const pad: string[] = [];
  let len = 0;
  for (let i = 0; len < want; i++) {
    const w = PAD[i % PAD.length];
    pad.push(w);
    len += w.length + 1;
  }
  return `[${accented} ${pad.join(' ')}]`;
}

/** Android-style ar-XB: the English text, forced right-to-left (shown reversed). */
export function pseudoBidi(s: string) {
  return '‮' + s + '‬';
}
