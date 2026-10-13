import { Check } from 'lucide-react';

/** iOS-style activity indicator: ticks appear one by one while pulling, then the whole wheel spins. */
export function IosSpinner({ progress = 1, spinning = false, done = false, size = 26 }: { progress?: number; spinning?: boolean; done?: boolean; size?: number }) {
  if (done) {
    return (
      <span className="grid place-items-center rounded-full bg-[#34c759] text-white" style={{ width: size * 0.8, height: size * 0.8 }} aria-hidden="true">
        <Check size={size * 0.5} strokeWidth={3} />
      </span>
    );
  }
  const ticks = 8;
  const shown = spinning ? ticks : Math.round(Math.max(0, Math.min(1, progress)) * ticks);
  return (
    <span
      className={`relative block ${spinning ? 'animate-spin' : ''}`}
      style={{ width: size, height: size, animationDuration: '0.8s', animationTimingFunction: 'steps(8)' }}
      aria-hidden="true"
    >
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 rounded-full bg-[#8e8e93]"
          style={{
            width: size * 0.1,
            height: size * 0.28,
            marginLeft: -size * 0.05,
            transformOrigin: `50% ${size / 2}px`,
            transform: `rotate(${i * 45}deg)`,
            opacity: i < shown ? (spinning ? 0.25 + (0.75 * (i + 1)) / ticks : 1) : 0,
          }}
        />
      ))}
    </span>
  );
}

/** Material 3-style indicator: a small disc with a growing arc; spins while refreshing. */
export function M3Indicator({ progress = 1, spinning = false, done = false, size = 40 }: { progress?: number; spinning?: boolean; done?: boolean; size?: number }) {
  const r = size * 0.24;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const arc = spinning ? 0.72 : p * 0.8;
  return (
    <span
      className="grid place-items-center rounded-full bg-[#fef7ff] shadow-[0_2px_6px_rgba(0,0,0,.25)]"
      style={{ width: size, height: size, opacity: spinning || done ? 1 : 0.4 + p * 0.6 }}
      aria-hidden="true"
    >
      {done ? (
        <Check size={size * 0.45} color="#6750a4" strokeWidth={3} />
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={spinning ? 'animate-spin' : ''} style={{ transform: spinning ? undefined : `rotate(${p * 270 - 90}deg)` }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6750a4" strokeWidth={size * 0.08} strokeLinecap="round" strokeDasharray={`${arc * c} ${c}`} />
        </svg>
      )}
    </span>
  );
}
