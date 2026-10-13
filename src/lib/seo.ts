import { site } from '@/data/site';
import { href } from '@/lib/url';

/** Absolute URL for structured data (search engines need full URLs). */
export const abs = (path: string, siteUrl: URL | undefined) => new URL(href(path), siteUrl).toString();

/**
 * Search results show about 155-160 characters of the description. Keep whole sentences that fit;
 * if even the first sentence is too long, cut it at a word boundary.
 */
export function metaDescription(text: string, max = 160) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim().length >= 70) return out.trim();
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\-–—]$/, '') + '…';
}

export const publisher = (siteUrl: URL | undefined) => ({
  '@type': 'Organization',
  name: site.name,
  url: abs('/', siteUrl),
  logo: abs('/apple-touch-icon.png', siteUrl),
});

/** BreadcrumbList from [name, path] pairs, starting after Home. */
export function breadcrumbs(items: [string, string][], siteUrl: URL | undefined) {
  const all: [string, string][] = [['Home', '/'], ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path, siteUrl) })),
  };
}
