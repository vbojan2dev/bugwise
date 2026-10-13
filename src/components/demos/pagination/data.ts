import { Backpack, Coffee, Flashlight, Footprints, GlassWater, Mountain, Shirt, Snowflake, Sun, Tent, type LucideIcon } from 'lucide-react';

/** Deterministic outdoor-shop catalog used by the pagination demos. Index 0..311 gives 312 unique names. */
const ADJ = ['Alpine', 'Breeze', 'Cedar', 'Dune', 'Ember', 'Fjord', 'Glacier', 'Harbor', 'Indigo', 'Juniper', 'Kestrel', 'Lagoon', 'Maple', 'Nova', 'Onyx', 'Pine', 'Quartz', 'Ridge', 'Sierra', 'Tundra', 'Umber', 'Vista', 'Willow', 'Xenon', 'Yarrow', 'Zephyr'];
const NOUN: { name: string; icon: LucideIcon }[] = [
  { name: 'Backpack', icon: Backpack },
  { name: 'Rain jacket', icon: Shirt },
  { name: 'Bottle', icon: GlassWater },
  { name: 'Trail shoes', icon: Footprints },
  { name: 'Head torch', icon: Flashlight },
  { name: 'Tent', icon: Tent },
  { name: 'Fleece', icon: Shirt },
  { name: 'Sun hat', icon: Sun },
  { name: 'Poles', icon: Mountain },
  { name: 'Mug', icon: Coffee },
  { name: 'Gloves', icon: Snowflake },
  { name: 'Day pack', icon: Backpack },
];

export interface Product {
  id: number;
  name: string;
  price: string;
  hue: number;
  icon: LucideIcon;
}

export function product(i: number): Product {
  const noun = NOUN[Math.floor(i / ADJ.length) % NOUN.length];
  return {
    id: 1000 + i,
    name: `${ADJ[i % ADJ.length]} ${noun.name}`,
    price: `€${(9 + ((i * 37) % 180) + 0.99).toFixed(2)}`,
    hue: (i * 47) % 360,
    icon: noun.icon,
  };
}

export function catalog(n: number): Product[] {
  return Array.from({ length: n }, (_, i) => product(i));
}

export type PageItem = number | 'gap';

/**
 * The page numbers to show: first, last, the current page and its neighbors, with "…" for gaps.
 * A gap that would hide exactly one page shows that page instead.
 */
export function pageItems(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 0) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) set.add(p);
  if (current <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => set.add(p));
  const sorted = [...set].sort((a, b) => a - b);
  const out: PageItem[] = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (p - prev === 2) out.push(prev + 1);
      else if (p - prev > 2) out.push('gap');
    }
    out.push(p);
  });
  return out;
}
