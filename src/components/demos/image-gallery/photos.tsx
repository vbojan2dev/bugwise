import {
  Armchair,
  Bath,
  BedDouble,
  Bike,
  Building2,
  CookingPot,
  LampDesk,
  Sun,
  Trees,
  Utensils,
  Video,
  Ship,
  type LucideIcon,
} from 'lucide-react';

/*
 * "Photos" of a rental flat, drawn as SVG (no external images). Each photo has its own real
 * aspect ratio (landscape, portrait, panorama), so the grid has to crop them and the viewer
 * has to show them whole. preserveAspectRatio works like CSS object-fit:
 *   'xMidYMid slice' = cover (cropped), 'xMidYMid meet' = contain (whole photo).
 * Every photo has a small detail near one edge (a picture on the wall, the river, a label)
 * that disappears in a square crop, and tiny text that you can only read when zoomed in.
 */

export type Category = 'rooms' | 'outside' | 'plan';

export interface Photo {
  id: string;
  /** Short name used in captions and logs. */
  title: string;
  caption: string;
  alt: string;
  w: number;
  h: number;
  wall: string;
  wall2: string;
  floor: string;
  icon: LucideIcon;
  /** Small detail near an edge, lost in square crops. */
  edge?: { icon: LucideIcon; side: 'left' | 'right' | 'top' };
  /** Tiny text that needs zoom to read. */
  fine: string;
  category: Category;
  /** Original upload size, as a camera would produce it. */
  fullMb: number;
  /** Duration if this item is a video. */
  video?: string;
  plan?: boolean;
}

export const PHOTOS: Photo[] = [
  { id: '01', title: 'Living room', caption: 'Living room with south-facing windows', alt: 'Bright living room with a grey sofa, a floor lamp and two tall windows', w: 1500, h: 1000, wall: '#fde68a', wall2: '#fcd34d', floor: '#b45309', icon: Armchair, edge: { icon: Sun, side: 'right' }, fine: 'Oak floor, renovated 2024', category: 'rooms', fullMb: 4.1 },
  { id: '02', title: 'Kitchen', caption: 'Open kitchen with gas hob and dishwasher', alt: 'Open kitchen with white cabinets, a gas hob and a dishwasher', w: 1500, h: 1000, wall: '#bae6fd', wall2: '#7dd3fc', floor: '#475569', icon: CookingPot, edge: { icon: Utensils, side: 'left' }, fine: 'Energy label A++', category: 'rooms', fullMb: 3.4 },
  { id: '03', title: 'Bedroom', caption: 'Main bedroom, fits a 180 cm bed', alt: 'Bedroom with a double bed, white linen and a wooden wardrobe', w: 1000, h: 1500, wall: '#ddd6fe', wall2: '#c4b5fd', floor: '#78716c', icon: BedDouble, edge: { icon: Sun, side: 'top' }, fine: 'Built-in wardrobe 2.4 m', category: 'rooms', fullMb: 3.7 },
  { id: '04', title: 'Study', caption: 'Small study or children’s room', alt: 'Small room with a desk, a lamp and a window over the courtyard', w: 1200, h: 1200, wall: '#bbf7d0', wall2: '#86efac', floor: '#a16207', icon: LampDesk, edge: { icon: Trees, side: 'right' }, fine: '9 m², window to courtyard', category: 'rooms', fullMb: 2.9 },
  { id: '05', title: 'Bathroom', caption: 'Bathroom with bathtub and window', alt: 'Tiled bathroom with a white bathtub and a small window', w: 1000, h: 1500, wall: '#a5f3fc', wall2: '#67e8f9', floor: '#0e7490', icon: Bath, edge: { icon: Sun, side: 'top' }, fine: 'Washing machine connection', category: 'rooms', fullMb: 3.0 },
  { id: '06', title: 'Dining corner', caption: 'Dining corner next to the kitchen', alt: 'Round dining table with four chairs next to the kitchen', w: 1600, h: 1200, wall: '#fecdd3', wall2: '#fda4af', floor: '#9a3412', icon: Utensils, edge: { icon: Armchair, side: 'left' }, fine: 'Seats 4, extendable to 6', category: 'rooms', fullMb: 3.3 },
  { id: '07', title: 'Video tour', caption: 'Video tour of the whole flat (0:42)', alt: 'Video tour of the flat, starting in the hallway', w: 1600, h: 900, wall: '#e2e8f0', wall2: '#cbd5e1', floor: '#334155', icon: Video, fine: 'Filmed March 2026', category: 'rooms', fullMb: 3.1, video: '0:42' },
  { id: '08', title: 'Balcony view', caption: 'Balcony with a view over the river', alt: 'Wide view from the balcony over trees and the river, with a boat on the right', w: 2100, h: 700, wall: '#bfdbfe', wall2: '#93c5fd', floor: '#166534', icon: Trees, edge: { icon: Ship, side: 'right' }, fine: 'Balcony 6 m², west', category: 'outside', fullMb: 4.6 },
  { id: '09', title: 'Building', caption: 'The building from the street', alt: 'Five-storey brick building with balconies, seen from the street', w: 1000, h: 1500, wall: '#fed7aa', wall2: '#fdba74', floor: '#57534e', icon: Building2, edge: { icon: Sun, side: 'top' }, fine: 'Lift, 3rd floor', category: 'outside', fullMb: 3.9 },
  { id: '10', title: 'Courtyard', caption: 'Shared courtyard with bike parking', alt: 'Green courtyard with trees and a covered bike rack', w: 1600, h: 1200, wall: '#d9f99d', wall2: '#bef264', floor: '#3f6212', icon: Bike, edge: { icon: Trees, side: 'left' }, fine: 'Bike room, 1 space included', category: 'outside', fullMb: 3.4 },
  { id: '11', title: 'Floor plan', caption: 'Floor plan, 64 m² in total', alt: 'Floor plan: living room 24 m², bedroom 14 m², study 9 m², kitchen 8 m², bathroom 5 m², hall 4 m²', w: 1600, h: 1200, wall: '#ffffff', wall2: '#f8fafc', floor: '#ffffff', icon: Building2, fine: 'Scale 1:100', category: 'plan', fullMb: 1.2, plan: true },
  { id: '12', title: 'Hallway', caption: 'Hallway with built-in storage', alt: 'Hallway with a mirror, coat hooks and built-in cupboards', w: 1000, h: 1500, wall: '#e9d5ff', wall2: '#d8b4fe', floor: '#7c2d12', icon: Armchair, edge: { icon: LampDesk, side: 'top' }, fine: 'Storage room in the basement', category: 'rooms', fullMb: 3.4 },
];

export const FULL_TOTAL_MB = PHOTOS.reduce((s, p) => s + p.fullMb, 0);

/** Thumbnail size in KB at ~300 px wide, roughly proportional to the original. */
export const thumbKb = (p: Photo) => Math.round(14 + p.fullMb * 3);
/** Viewer size in KB at ~1200 px wide. */
export const viewerKb = (p: Photo) => Math.round(240 + p.fullMb * 55);

export const formatKb = (kb: number) => (kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${Math.round(kb)} KB`);

function FloorPlan({ w, h }: { w: number; h: number }) {
  const s = { fill: 'none', stroke: '#1f2937', strokeWidth: 10 };
  const t = { fill: '#1f2937', fontSize: 46, fontFamily: 'system-ui, sans-serif', fontWeight: 600 } as const;
  const small = { fill: '#64748b', fontSize: 30, fontFamily: 'system-ui, sans-serif' } as const;
  return (
    <g>
      <rect width={w} height={h} fill="#ffffff" />
      <rect x="120" y="110" width="1360" height="980" {...s} />
      <line x1="760" y1="110" x2="760" y2="640" {...s} />
      <line x1="120" y1="640" x2="1480" y2="640" {...s} />
      <line x1="1100" y1="110" x2="1100" y2="640" {...s} />
      <line x1="560" y1="640" x2="560" y2="1090" {...s} />
      <line x1="1000" y1="640" x2="1000" y2="1090" {...s} />
      <text x="300" y="380" {...t}>Living</text>
      <text x="300" y="430" {...small}>24 m²</text>
      <text x="840" y="380" {...t}>Bedroom</text>
      <text x="840" y="430" {...small}>14 m²</text>
      <text x="1160" y="380" {...t}>Study</text>
      <text x="1160" y="430" {...small}>9 m²</text>
      <text x="240" y="870" {...t}>Kitchen</text>
      <text x="240" y="920" {...small}>8 m²</text>
      <text x="680" y="870" {...t}>Bath</text>
      <text x="680" y="920" {...small}>5 m²</text>
      <text x="1110" y="870" {...t}>Hall</text>
      <text x="1110" y="920" {...small}>4 m²</text>
      <rect x="250" y="104" width="300" height="14" fill="#38bdf8" />
      <rect x="1180" y="104" width="200" height="14" fill="#38bdf8" />
    </g>
  );
}

/** One "photo". `fit`: 'cover' crops like object-fit: cover, 'contain' shows the whole image. */
export function PhotoArt({ photo, fit = 'cover', blur = 0, className = 'block h-full w-full' }: { photo: Photo; fit?: 'cover' | 'contain'; blur?: number; className?: string }) {
  const { w, h } = photo;
  const Icon = photo.icon;
  const size = Math.min(w, h) * 0.5;
  const floorY = h * 0.72;
  const gid = `ph-${photo.id}`;
  const Edge = photo.edge?.icon;
  const es = Math.min(w, h) * 0.22;
  const edgePos =
    photo.edge?.side === 'left' ? { x: w * 0.03, y: floorY - es * 1.05 } : photo.edge?.side === 'right' ? { x: w - es - w * 0.03, y: floorY - es * 1.05 } : { x: w / 2 - es / 2, y: h * 0.03 };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
      className={className}
      style={{ filter: blur ? `blur(${blur}px)` : undefined }}
      aria-hidden="true"
    >
      {photo.plan ? (
        <FloorPlan w={w} h={h} />
      ) : (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={photo.wall} />
              <stop offset="1" stopColor={photo.wall2} />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${gid})`} />
          <rect y={floorY} width={w} height={h - floorY} fill={photo.floor} opacity="0.85" />
          <rect x={w * 0.1} y={h * 0.12} width={w * 0.16} height={h * 0.34} rx={8} fill="white" opacity="0.45" />
          <Icon x={w / 2 - size / 2} y={floorY - size * 0.92} size={size} color="#1f2937" strokeWidth={1.3} />
          {Edge && <Edge x={edgePos.x} y={edgePos.y} size={es} color="#7c2d12" strokeWidth={1.6} />}
          <text x={w - 24} y={h - 24} textAnchor="end" fill="white" opacity="0.9" fontSize={Math.max(14, Math.min(w, h) * 0.022)} fontFamily="system-ui, sans-serif">
            {photo.fine}
          </text>
        </>
      )}
    </svg>
  );
}
