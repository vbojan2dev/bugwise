import { BellRing, Dumbbell } from 'lucide-react';

/*
 * Static mock for Do/Don't: asking for notification permission on the very first screen ("cold")
 * vs. a short in-app explanation first ("primed"), shown in context after the user picked workout days.
 */

const P = '#7c3aed';

export default function PermissionPrimer({ variant }: { variant: 'cold' | 'primed' }) {
  return (
    <div className="relative mx-auto flex h-[300px] w-full max-w-[230px] flex-col overflow-hidden rounded-[22px] border border-black/10 bg-white text-black" style={{ colorScheme: 'light' }}>
      {variant === 'cold' ? (
        <>
          <div className="flex flex-1 flex-col items-center px-4 pt-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-[#ede9fe]" style={{ color: P }}>
              <Dumbbell size={30} />
            </span>
            <p className="mt-3 text-[15px] font-bold">Welcome to Pulse</p>
            <p className="mt-1 text-[11px] text-black/55">Track every workout</p>
          </div>
          <div className="absolute inset-0 grid place-items-center bg-black/35 px-5">
            <div className="w-full overflow-hidden rounded-[13px] bg-[#f2f2f7] text-center">
              <p className="px-3 pt-3 text-[12px] leading-snug font-semibold">“Pulse” Would Like to Send You Notifications</p>
              <p className="px-3 pt-1 pb-2.5 text-[10px] leading-snug">Notifications may include alerts, sounds, and icon badges.</p>
              <div className="grid grid-cols-2 border-t border-black/15 text-[12px] text-[#007aff]">
                <span className="border-r border-black/15 py-2">Don’t Allow</span>
                <span className="py-2 font-semibold">Allow</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col px-4 pt-7 pb-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ede9fe]" style={{ color: P }}>
            <BellRing size={24} />
          </span>
          <p className="mt-3 text-[16px] leading-tight font-bold">Stay on track</p>
          <p className="mt-1.5 text-[11px] leading-snug text-black/60">We'll remind you on Mon, Wed and Fri at 7:00. No ads, nothing else. You can change this any time.</p>
          <span className="mt-auto flex h-9 items-center justify-center rounded-xl text-[12px] font-semibold text-white" style={{ background: P }}>
            Turn on reminders
          </span>
          <span className="mt-1.5 text-center text-[12px] font-semibold" style={{ color: P }}>
            Not now
          </span>
        </div>
      )}
    </div>
  );
}
