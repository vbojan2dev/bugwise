import { Gift, Mountain, Sun, Tent, Truck, type LucideIcon } from 'lucide-react';

/*
 * Banner "images" drawn as SVG (no external images). The viewBox is 1600×900 (16:9), and
 * preserveAspectRatio behaves exactly like CSS object-fit / object-position:
 *   'xMidYMid slice' = cover (center), 'xMinYMid slice' = cover anchored left, 'xMidYMid meet' = contain.
 * The headline is "baked into" the image, like many real marketing banners.
 */

export interface Promo {
  title: string;
  sub: string;
  from: string;
  to: string;
  icon: LucideIcon;
}

export const PROMOS: Promo[] = [
  { title: 'Summer sale', sub: 'Up to 40% off sandals', from: '#f97316', to: '#e11d48', icon: Sun },
  { title: 'New: Trail 2', sub: 'Lighter. Grippier.', from: '#0ea5e9', to: '#4338ca', icon: Mountain },
  { title: 'Free delivery', sub: 'On orders over €50', from: '#10b981', to: '#0f766e', icon: Truck },
  { title: 'Camping week', sub: 'Tents from €89', from: '#a16207', to: '#3f6212', icon: Tent },
  { title: 'Gift cards', sub: 'The easy present', from: '#c026d3', to: '#6d28d9', icon: Gift },
];

export function SlideArt({ promo, fit = 'xMidYMid slice', blur = 0, id }: { promo: Promo; fit?: string; blur?: number; id: string }) {
  const Icon = promo.icon;
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio={fit} className="block h-full w-full" style={{ filter: blur ? `blur(${blur}px)` : undefined }} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={promo.from} />
          <stop offset="1" stopColor={promo.to} />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#g-${id})`} />
      <circle cx="1180" cy="450" r="330" fill="white" opacity="0.16" />
      <circle cx="1420" cy="140" r="90" fill="white" opacity="0.12" />
      <Icon x={950} y={220} size={460} color="white" strokeWidth={1.4} />
      <text x="110" y="380" fill="white" fontSize="120" fontWeight="800" fontFamily="system-ui, sans-serif">
        {promo.title}
      </text>
      <text x="114" y="480" fill="white" opacity="0.9" fontSize="62" fontFamily="system-ui, sans-serif">
        {promo.sub}
      </text>
      <rect x="114" y="560" width="330" height="96" rx="48" fill="white" />
      <text x="279" y="623" fill={promo.to} fontSize="46" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
        Shop now
      </text>
    </svg>
  );
}
