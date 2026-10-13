import type { ReactNode } from 'react';

/** Simple vector "photos" used by the image upload demos. Each scene is drawn upright. */
export type SceneId = 'beach' | 'portrait' | 'mountains' | 'logo' | 'sofa' | 'invoice';

/** Aspect ratio (width / height) of each upright scene. */
export const sceneAspect: Record<SceneId, number> = { beach: 4 / 3, portrait: 3 / 4, mountains: 3 / 2, logo: 1, sofa: 4 / 3, invoice: 3 / 4 };

export function Scene({ id, slice = false, label }: { id: SceneId; slice?: boolean; label?: string }) {
  const par = slice ? 'xMidYMid slice' : 'xMidYMid meet';
  const common = { width: '100%', height: '100%', preserveAspectRatio: par, role: label ? 'img' : undefined, 'aria-label': label, 'aria-hidden': label ? undefined : true } as const;
  switch (id) {
    case 'beach':
      return (
        <svg viewBox="0 0 120 90" {...common}>
          <rect width="120" height="56" fill="#7cc4f4" />
          <circle cx="92" cy="22" r="10" fill="#ffd166" />
          <rect y="50" width="120" height="16" fill="#1f7fbf" />
          <path d="M0 52 Q30 48 60 52 T120 52 V58 H0Z" fill="#3fa1dd" />
          <rect y="64" width="120" height="26" fill="#f2d39b" />
          <path d="M18 64 l3-18 l3 18" fill="#8b5a2b" />
          <path d="M21 46 q-10 0 -14 6 q8-4 14-6 q-4-8 -12-8 q8 2 12 8 q2-10 12-10 q-8 4 -12 10 q10-2 14 4 q-8-4 -14-4" fill="#2f9e44" />
        </svg>
      );
    case 'portrait':
      return (
        <svg viewBox="0 0 90 120" {...common}>
          <rect width="90" height="120" fill="#e9d8c4" />
          <rect x="62" y="0" width="28" height="120" fill="#d9c3a9" />
          <path d="M70 120 V86 q-6-10 0-22 q6 10 0 22" fill="#3d8b40" />
          <ellipse cx="45" cy="48" rx="15" ry="17" fill="#c68b59" />
          <path d="M30 44 q0-22 15-22 q15 0 15 22 q-4-12-15-12 q-11 0-15 12" fill="#3b2a20" />
          <path d="M14 120 q2-40 31-40 q29 0 31 40Z" fill="#e4572e" />
          <circle cx="40" cy="48" r="1.6" fill="#2b1d14" />
          <circle cx="50" cy="48" r="1.6" fill="#2b1d14" />
          <path d="M40 56 q5 4 10 0" stroke="#2b1d14" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'mountains':
      return (
        <svg viewBox="0 0 120 80" {...common}>
          <rect width="120" height="80" fill="#b9d7ee" />
          <path d="M0 62 L30 26 L48 46 L70 16 L100 52 L120 36 V80 H0Z" fill="#5c6f84" />
          <path d="M63 25 L70 16 L77 25 L73 23 L70 27 L66 23Z" fill="#fff" />
          <path d="M24 33 L30 26 L36 33 L32 31 L30 34Z" fill="#fff" />
          <path d="M0 66 Q40 56 70 64 T120 60 V80 H0Z" fill="#4c8c4a" />
        </svg>
      );
    case 'logo':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M50 10 L61 38 L91 39 L67 57 L76 87 L50 70 L24 87 L33 57 L9 39 L39 38Z" fill="#7c3aed" />
          <circle cx="50" cy="52" r="10" fill="#fbbf24" />
        </svg>
      );
    case 'sofa':
      return (
        <svg viewBox="0 0 120 90" {...common}>
          <rect width="120" height="90" fill="#eef1f4" />
          <rect y="70" width="120" height="20" fill="#c9a77c" />
          <rect x="70" y="14" width="26" height="20" rx="1" fill="#fff" stroke="#9aa5b1" strokeWidth="2" />
          <rect x="20" y="40" width="80" height="22" rx="6" fill="#2a9d8f" />
          <rect x="14" y="48" width="14" height="22" rx="5" fill="#21867a" />
          <rect x="92" y="48" width="14" height="22" rx="5" fill="#21867a" />
          <rect x="26" y="56" width="68" height="14" rx="4" fill="#33b3a3" />
          <rect x="22" y="70" width="4" height="6" fill="#5b4636" />
          <rect x="94" y="70" width="4" height="6" fill="#5b4636" />
        </svg>
      );
    case 'invoice':
      return (
        <svg viewBox="0 0 90 120" {...common}>
          <rect width="90" height="120" fill="#f1f5f9" />
          <path d="M24 18 H56 L68 30 V102 H24Z" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
          <path d="M56 18 V30 H68" fill="none" stroke="#94a3b8" strokeWidth="2" />
          {[44, 54, 64, 74].map((y) => (
            <rect key={y} x="32" y={y} width="28" height="3" rx="1.5" fill="#cbd5e1" />
          ))}
        </svg>
      );
  }
}

/** Renders children rotated by `deg` inside a box that swaps width and height for 90° turns. */
export function Rotated({ deg, w, h, children }: { deg: number; w: number; h: number; children: ReactNode }) {
  const swap = Math.abs(deg) % 180 === 90;
  return (
    <div className="relative shrink-0" style={{ width: swap ? h : w, height: swap ? w : h }}>
      <div className="absolute top-1/2 left-1/2" style={{ width: w, height: h, transform: `translate(-50%, -50%) rotate(${deg}deg)` }}>
        {children}
      </div>
    </div>
  );
}
