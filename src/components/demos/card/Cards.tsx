import type { LucideIcon } from 'lucide-react';
import { Backpack, Footprints, Heart, ImageOff, Mountain, Shirt, Star, Tent, Watch } from 'lucide-react';

/** Shared data and building blocks for the card demos. No external images: "photos" are gradients + an icon. */

export interface Product {
  id: number;
  name: string;
  /** Real catalogs mix short and very long names; some products keep their short name. */
  longName: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  icon: LucideIcon;
  /** Two colors for the fake photo gradient. */
  from: string;
  to: string;
  /** The photo's natural aspect ratio (width / height) when the layout doesn't force one. */
  natural: number;
  soldOut?: boolean;
}

export const products: Product[] = [
  { id: 1, name: 'Trail Rain Jacket', longName: 'Trailblazer Waterproof Insulated Rain Jacket with Detachable Hood, Taped Seams and Reflective Trim, Unisex', price: 89, oldPrice: 119, rating: 4.6, reviews: 182, icon: Shirt, from: '#7dd3fc', to: '#2563eb', natural: 1 },
  { id: 2, name: 'Summit Backpack 30 L', longName: 'Summit Backpack 30 L', price: 74.5, rating: 4.8, reviews: 96, icon: Backpack, from: '#fdba74', to: '#ea580c', natural: 0.8 },
  { id: 3, name: 'Ridge Hiking Boots', longName: 'Ridge Mid Gore-Tex Waterproof Hiking Boots for Rocky Trails and Muddy Paths, Wide Fit, Vibram Sole', price: 139, rating: 4.4, reviews: 311, icon: Footprints, from: '#bef264', to: '#4d7c0f', natural: 1.6, soldOut: true },
  { id: 4, name: 'Dome Tent 2P', longName: 'Basecamp Dome Tent for Two People, Three-Season, Easy Setup in 5 Minutes', price: 199, oldPrice: 249, rating: 4.7, reviews: 58, icon: Tent, from: '#c4b5fd', to: '#6d28d9', natural: 0.75 },
  { id: 5, name: 'Peak GPS Watch', longName: 'Peak GPS Watch', price: 249, rating: 4.5, reviews: 141, icon: Watch, from: '#fda4af', to: '#be123c', natural: 1 },
  { id: 6, name: 'Alpine Fleece', longName: 'Alpine Recycled Polartec Full-Zip Fleece Jacket, Midweight', price: 59.99, rating: 4.2, reviews: 77, icon: Mountain, from: '#99f6e4', to: '#0f766e', natural: 1.2 },
];

export const eur = (n: number) => `€${n.toFixed(2)}`;

/** A fake product photo. `ratio` forces an aspect ratio; `missing` shows a neutral placeholder (the correct fallback). */
export function ProductImage({ p, ratio, missing = false, dark = false, className = '' }: { p: Product; ratio?: number; missing?: boolean; dark?: boolean; className?: string }) {
  const r = ratio ?? p.natural;
  if (missing) {
    return (
      <div
        aria-hidden="true"
        className={`grid w-full place-items-center ${className}`}
        style={{ aspectRatio: String(r), background: dark ? '#2b2d36' : '#eceef3', color: dark ? '#6b7080' : '#a3a8b8' }}
      >
        <ImageOff size={26} strokeWidth={1.5} />
      </div>
    );
  }
  const I = p.icon;
  return (
    <div aria-hidden="true" className={`grid w-full place-items-center ${className}`} style={{ aspectRatio: String(r), background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
      <I size={34} strokeWidth={1.5} className="text-white/90 drop-shadow" />
    </div>
  );
}

export function Stars({ rating, reviews, color = '#6b7080' }: { rating: number; reviews: number; color?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px]" style={{ color }}>
      <Star size={11} className="fill-[#f5a524] text-[#f5a524]" aria-hidden="true" />
      <span>
        {rating.toFixed(1)} <span className="opacity-80">({reviews})</span>
      </span>
    </span>
  );
}

/** Price with an optional "was" price. The old price is always the higher one. */
export function Price({ p, dark = false }: { p: Product; dark?: boolean }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      <span className={`text-[14px] font-bold ${p.oldPrice ? 'text-[#c0262d]' : ''}`} style={p.oldPrice && dark ? { color: '#ff8a8f' } : undefined}>
        {eur(p.price)}
      </span>
      {p.oldPrice && (
        <>
          <span className="sr-only">, was</span>
          <s className="text-[11px] opacity-60">{eur(p.oldPrice)}</s>
        </>
      )}
    </span>
  );
}

export function Badge({ children, tone }: { children: string; tone: 'sale' | 'soldout' }) {
  return (
    <span
      className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
      style={tone === 'sale' ? { background: '#c0262d', color: '#fff' } : { background: '#1f2230', color: '#fff' }}
    >
      {children}
    </span>
  );
}

export function salePercent(p: Product) {
  return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}

/**
 * A correct product card using the "one link per card" pattern:
 * the title is the only link, stretched over the whole card with a pseudo-element.
 * The favorite and Add to cart buttons sit above it (relative z-10), so they never open the product.
 */
export function ProductCard({
  p,
  dark = false,
  fav = false,
  onOpen,
  onFav,
  onAdd,
  missingImage = false,
  ratio = 1,
  clamp = true,
  long = false,
  stretch = true,
}: {
  p: Product;
  dark?: boolean;
  fav?: boolean;
  onOpen?: () => void;
  onFav?: () => void;
  onAdd?: () => void;
  missingImage?: boolean;
  ratio?: number;
  clamp?: boolean;
  long?: boolean;
  stretch?: boolean;
}) {
  const name = long ? p.longName : p.name;
  return (
    <article
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl ${stretch ? 'h-full' : ''}`}
      style={{ background: dark ? '#1c1d24' : '#fff', color: dark ? '#eceef6' : '#14161f', boxShadow: dark ? 'inset 0 0 0 1px #2c2f3b' : '0 1px 3px rgba(16,18,35,.12)' }}
    >
      <div className="relative">
        <ProductImage p={p} ratio={ratio} missing={missingImage} dark={dark} />
        {p.soldOut ? <Badge tone="soldout">Sold out</Badge> : p.oldPrice ? <Badge tone="sale">{`-${salePercent(p)}%`}</Badge> : null}
        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          aria-label={`Save ${p.name} to favorites`}
          className="absolute top-1.5 right-1.5 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-[#14161f] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]"
        >
          <Heart size={16} className={fav ? 'fill-[#e11d48] text-[#e11d48]' : ''} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h4 className="text-[13px] leading-snug font-semibold" title={clamp ? name : undefined}>
          <button
            type="button"
            onClick={onOpen}
            className="block w-full text-left after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[#2563eb]"
          >
            {/* The clamp must sit on the element that holds the text: a button is an atomic inline box, so clamping its parent does nothing. */}
            <span className={clamp ? 'line-clamp-2' : undefined}>{name}</span>
          </button>
        </h4>
        <Stars rating={p.rating} reviews={p.reviews} color={dark ? '#9aa0b4' : '#6b7080'} />
        <div className="mt-auto pt-1">
          <Price p={p} dark={dark} />
          <button
            type="button"
            onClick={onAdd}
            disabled={p.soldOut}
            className="relative z-10 mt-2 h-9 w-full rounded-full text-[12px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed"
            style={
              p.soldOut
                ? { background: dark ? '#2b2d36' : '#eceef3', color: dark ? '#7d8396' : '#8a8fa0' }
                : { background: dark ? '#eceef6' : '#14161f', color: dark ? '#14161f' : '#fff' }
            }
          >
            {p.soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

/** Skeleton placeholder with the same shape as ProductCard. */
export function ProductSkeleton({ dark = false, ratio = 1 }: { dark?: boolean; ratio?: number }) {
  const bar = dark ? '#2b2d36' : '#e6e8ee';
  return (
    <div aria-hidden="true" className="flex h-full min-w-0 animate-pulse flex-col overflow-hidden rounded-2xl" style={{ background: dark ? '#1c1d24' : '#fff', boxShadow: dark ? 'inset 0 0 0 1px #2c2f3b' : '0 1px 3px rgba(16,18,35,.12)' }}>
      <div style={{ aspectRatio: String(ratio), background: bar }} />
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="h-3 w-11/12 rounded" style={{ background: bar }} />
        <div className="h-3 w-2/3 rounded" style={{ background: bar }} />
        <div className="h-2.5 w-1/3 rounded" style={{ background: bar }} />
        <div className="mt-auto h-9 w-full rounded-full" style={{ background: bar }} />
      </div>
    </div>
  );
}
