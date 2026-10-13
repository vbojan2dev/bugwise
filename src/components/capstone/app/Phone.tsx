import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Plane, UtensilsCrossed, Wifi, X } from 'lucide-react';
import type { Net, Push } from './types';
import { hhmm } from './i18n';

export const SCREEN_W = 300;
export const SCREEN_H = 634;
const BEZEL = 10;

/** Phone shell that can rotate, scaled down to fit narrow containers. */
export function Phone({ landscape, children }: { landscape: boolean; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(10_000);
  const w = (landscape ? SCREEN_H : SCREEN_W) + BEZEL * 2;
  const h = (landscape ? SCREEN_W : SCREEN_H) + BEZEL * 2;
  useEffect(() => {
    const el = outerRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    setAvail(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1, avail / w);
  return (
    <div ref={outerRef} className="mx-auto" style={{ width: w * scale, height: h * scale }}>
      <div
        className="relative bg-[#0c0d12] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]"
        style={{ width: w, height: h, padding: BEZEL, borderRadius: 46, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: 37 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ time, net, landscape, light }: { time: number; net: Net; landscape: boolean; light?: boolean }) {
  if (landscape) return null;
  return (
    <div className="relative flex h-[30px] shrink-0 items-center justify-between px-7 pt-1 text-[12px] font-semibold" style={light ? { color: '#fff' } : undefined} aria-hidden="true">
      <span className="tabular-nums">{hhmm(time)}</span>
      <span className="absolute top-[7px] left-1/2 h-[22px] w-[80px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1">
        {net === 'offline' ? (
          <Plane size={12} />
        ) : (
          <>
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((x, i) => (
                <span key={x} className="w-[3px] rounded-[1px] bg-current" style={{ height: x, opacity: net === 'slow' && i > 0 ? 0.3 : 1 }} />
              ))}
            </span>
            {net === 'wifi' ? <Wifi size={12} /> : <span className="text-[10px]">E</span>}
          </>
        )}
        <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

/** In-app push banner shown at the top of the screen while the app is open. */
export function PushBanner({ push, onOpen, onClose }: { push: Push; onOpen: () => void; onClose: () => void }) {
  return (
    <div className="drop absolute inset-x-2 top-2 z-50 flex items-start gap-1 rounded-2xl bg-[#f5f5f7]/95 p-1 text-[#111] shadow-xl ring-1 ring-black/10">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl p-2 text-left">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#d33b20] text-white" aria-hidden="true">
          <UtensilsCrossed size={16} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] text-[#555]">FoodDash · now</span>
          <span className="block text-[13px] leading-tight font-semibold">{push.title}</span>
          <span className="block truncate text-[12px] text-[#333]">{push.body}</span>
        </span>
      </button>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="grid size-8 shrink-0 place-items-center rounded-full text-[#555]">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export function LockScreen({
  time,
  net,
  landscape,
  pushes,
  onOpenPush,
  onOpenApp,
  onClear,
  closed,
}: {
  time: number;
  net: Net;
  landscape: boolean;
  pushes: Push[];
  onOpenPush: (p: Push) => void;
  onOpenApp: () => void;
  onClear: () => void;
  closed: boolean;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col text-white" style={{ background: 'linear-gradient(160deg,#1e2a5a 0%,#5b3a8a 55%,#c0577a 100%)' }}>
      <StatusBar time={time} net={net} landscape={landscape} light />
      <div className={`min-h-0 flex-1 overflow-y-auto px-3 ${landscape ? 'pt-3' : 'pt-6'}`}>
        <p className="text-center text-[13px] font-medium opacity-85">Friday, October 16</p>
        <p className="text-center text-[56px] leading-none font-semibold tracking-tight tabular-nums">{hhmm(time)}</p>
        <p className="mt-1 text-center text-[11px] opacity-75">{closed ? 'FoodDash is closed' : 'FoodDash is running in the background'}</p>
        <div className="mt-4 space-y-2 pb-3">
          {pushes.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[12px] font-semibold opacity-90">
                <Bell size={12} aria-hidden="true" /> Notifications
              </span>
              <button type="button" onClick={onClear} className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                Clear
              </button>
            </div>
          )}
          {[...pushes].reverse().map((p) => (
            <button key={p.id} type="button" onClick={() => onOpenPush(p)} className="flex w-full items-start gap-2.5 rounded-2xl bg-white/85 p-2.5 text-left text-[#111] backdrop-blur">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#d33b20] text-white" aria-hidden="true">
                <UtensilsCrossed size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between text-[11px] text-[#555]">
                  <span>FoodDash</span>
                  <span>{hhmm(Math.floor(p.at))}</span>
                </span>
                <span className="block text-[13px] leading-tight font-semibold">{p.title}</span>
                <span className="block text-[12px] text-[#333]">{p.body}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 justify-center pt-1 pb-5">
        <button type="button" onClick={onOpenApp} className="flex flex-col items-center gap-1 text-[11px] font-medium">
          <span className="grid size-12 place-items-center rounded-[14px] bg-[#d33b20] shadow-lg" aria-hidden="true">
            <UtensilsCrossed size={24} />
          </span>
          Open FoodDash
        </button>
      </div>
    </div>
  );
}
