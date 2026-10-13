/** Badge building blocks for the Badge demos. Badges are decorative: the count must ALSO be in the parent's accessible name. */

export type BadgeStyle = 'ios' | 'material' | 'web';

/** "99+" style capping. max = 0 means no cap. */
export function formatCount(n: number, max: number) {
  return max > 0 && n > max ? `${max}+` : String(n);
}

const palette: Record<BadgeStyle, { bg: string; fg: string; darkBg: string; darkFg: string }> = {
  ios: { bg: '#ff3b30', fg: '#fff', darkBg: '#ff453a', darkFg: '#fff' },
  material: { bg: '#b3261e', fg: '#fff', darkBg: '#f2b8b5', darkFg: '#601410' },
  web: { bg: '#5b4bff', fg: '#fff', darkBg: '#8b7dff', darkFg: '#0a0b11' },
};

export function CountBadge({
  label,
  variant = 'ios',
  dark = false,
  scale = 1,
  className = '',
  ring,
}: {
  label: string;
  variant?: BadgeStyle;
  dark?: boolean;
  scale?: number;
  className?: string;
  /** Color of the separating ring (the surface behind the badge). */
  ring?: string;
}) {
  const p = palette[variant];
  const h = (variant === 'material' ? 16 : 18) * scale;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full font-semibold tabular-nums whitespace-nowrap ${className}`}
      style={{
        minWidth: h,
        height: h,
        padding: `0 ${5 * scale}px`,
        fontSize: (variant === 'material' ? 11 : 12) * scale,
        lineHeight: 1,
        background: dark ? p.darkBg : p.bg,
        color: dark ? p.darkFg : p.fg,
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
      }}
    >
      {label}
    </span>
  );
}

export function DotBadge({ variant = 'ios', dark = false, size = 8, className = '', ring, color }: { variant?: BadgeStyle; dark?: boolean; size?: number; className?: string; ring?: string; color?: string }) {
  const p = palette[variant];
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full ${className}`}
      style={{ width: size, height: size, background: color ?? (dark ? p.darkBg : p.bg), boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    />
  );
}

export type StatusKind = 'new' | 'sale' | 'soldout' | 'low' | 'transit';

const statusStyles: Record<StatusKind, { text: string; bg: string; fg: string }> = {
  new: { text: 'New', bg: '#dbeafe', fg: '#1e40af' },
  sale: { text: 'Sale −20%', bg: '#fee2e2', fg: '#991b1b' },
  soldout: { text: 'Sold out', bg: '#e5e7eb', fg: '#374151' },
  low: { text: 'Only 2 left', bg: '#fef3c7', fg: '#92400e' },
  transit: { text: 'In transit', bg: '#dcfce7', fg: '#166534' },
};

/** A status label: text first, color second. */
export function StatusPill({ kind, text, className = '' }: { kind: StatusKind; text?: string; className?: string }) {
  const s = statusStyles[kind];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`} style={{ background: s.bg, color: s.fg }}>
      {text ?? s.text}
    </span>
  );
}
