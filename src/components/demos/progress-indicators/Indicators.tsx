/*
 * Platform-style progress indicators used by the Progress & Spinners demos.
 * All visuals are decorative (aria-hidden) unless a role is passed by the caller;
 * the demos put role="progressbar" and labels on the wrapping element.
 * Keyframes live in <ProgressKeyframes /> (render it once per demo). Under
 * prefers-reduced-motion the site CSS shortens animations to ~0, which freezes them.
 */

export function ProgressKeyframes() {
  return (
    <style>{`
@keyframes pi-spin { to { transform: rotate(360deg) } }
@keyframes pi-slide { 0% { left: -40%; width: 40% } 60% { left: 100%; width: 30% } 100% { left: 100%; width: 30% } }
@keyframes pi-slide2 { 0% { left: -20%; width: 20% } 40% { left: -20%; width: 20% } 100% { left: 100%; width: 60% } }
@keyframes pi-dash { 0% { stroke-dasharray: 1 200; stroke-dashoffset: 0 } 50% { stroke-dasharray: 90 200; stroke-dashoffset: -30 } 100% { stroke-dasharray: 90 200; stroke-dashoffset: -124 } }
`}</style>
  );
}

/** iOS UIActivityIndicatorView / SwiftUI ProgressView() look: 8 spokes, stepping rotation. */
export function IosSpinner({ size = 20, color = '#8e8e93', animating = true }: { size?: number; color?: string; animating?: boolean }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size, animation: animating ? 'pi-spin 0.8s steps(8) infinite' : undefined }}
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 rounded-full"
          style={{
            width: size * 0.1,
            height: size * 0.28,
            marginLeft: -size * 0.05,
            background: color,
            transformOrigin: `50% ${size / 2}px`,
            transform: `rotate(${i * 45}deg)`,
            opacity: 0.2 + (0.8 * (i + 1)) / 8,
          }}
        />
      ))}
    </span>
  );
}

/** iOS UIProgressView / SwiftUI ProgressView(value:): thin determinate bar. */
export function IosBar({ value, color = '#007aff', track = '#e5e5ea' }: { value: number; color?: string; track?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full" style={{ background: track }} aria-hidden="true">
      <span className="block h-full rounded-full" style={{ width: `${v * 100}%`, background: color, transition: 'width 150ms linear' }} />
    </span>
  );
}

/**
 * Material 3 linear progress indicator. Determinate: active indicator, a small gap,
 * the track, and a stop indicator dot at the end. Indeterminate when value is undefined.
 */
export function M3Linear({ value, color = '#6750a4', track = '#e8def8', still = false }: { value?: number; color?: string; track?: string; still?: boolean }) {
  if (value === undefined) {
    return (
      <span className="relative block h-1 w-full overflow-hidden rounded-full" style={{ background: track }} aria-hidden="true">
        <span className="absolute inset-y-0 rounded-full" style={{ background: color, left: still ? '30%' : undefined, width: still ? '40%' : undefined, animation: still ? undefined : 'pi-slide 1.8s cubic-bezier(.4,0,.2,1) infinite' }} />
        {!still && <span className="absolute inset-y-0 rounded-full" style={{ background: color, animation: 'pi-slide2 1.8s cubic-bezier(.4,0,.2,1) infinite' }} />}
      </span>
    );
  }
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="relative flex h-1 w-full items-center" aria-hidden="true">
      <span className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color, transition: 'width 150ms linear' }} />
      {v < 1 && <span className="ml-1 h-full min-w-0 flex-1 rounded-full" style={{ background: track }} />}
      {v < 1 && <span className="absolute right-0 size-1 rounded-full" style={{ background: color }} />}
    </span>
  );
}

/** Material 3 circular progress indicator. Indeterminate when value is undefined. */
export function M3Circular({ value, size = 40, color = '#6750a4', track = '#e8def8' }: { value?: number; size?: number; color?: string; track?: string }) {
  const stroke = 4;
  const r = 20 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  if (value === undefined) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ animation: 'pi-spin 1.4s linear infinite' }} aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" style={{ animation: 'pi-dash 1.4s ease-in-out infinite' }} />
      </svg>
    );
  }
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${v * c} ${c}`} style={{ transition: 'stroke-dasharray 150ms linear' }} />
    </svg>
  );
}

/** A simple web spinner (border ring), as many sites build by hand. */
export function WebSpinner({ size = 22, color = '#2563eb' }: { size?: number; color?: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, border: `3px solid ${color}33`, borderTopColor: color, animation: 'pi-spin 0.9s linear infinite' }}
      aria-hidden="true"
    />
  );
}
