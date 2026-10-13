import { Bike, ChevronDown } from 'lucide-react';

/*
 * Static anatomy: the same delivery notification as iOS shows it (banner) and as Android shows it (expanded,
 * Material 3 style), with numbered markers explained in a legend underneath.
 */

function Marker({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="inline-grid size-[18px] shrink-0 place-items-center rounded-full bg-[#4f46e5] text-[10px] font-bold text-white shadow ring-2 ring-white">
      {n}
    </span>
  );
}

function AppIcon({ size = 34, radius = 8 }: { size?: number; radius?: number }) {
  return (
    <span className="grid shrink-0 place-items-center text-white" style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(135deg,#fb923c,#ea580c)' }}>
      <Bike size={size * 0.55} />
    </span>
  );
}

const legend = [
  { n: 1, name: 'App icon and name', text: 'Shows who sent it. Android uses a small monochrome icon in the status bar too.' },
  { n: 2, name: 'Title', text: 'Short and specific. Gets cut off first on small screens and in other languages.' },
  { n: 3, name: 'Body', text: 'The details. Check placeholders are filled in and long text is truncated nicely.' },
  { n: 4, name: 'Image (rich media)', text: 'Optional picture. Must not block the notification if it fails to download.' },
  { n: 5, name: 'Actions', text: 'Buttons like "Track" or "Call driver". Each must do exactly what it says, even when the app is closed.' },
  { n: 6, name: 'Badge', text: 'The red count on the app icon. It should go down when the user reads the updates.' },
  { n: 7, name: 'Timestamp and grouping', text: 'Several messages from one order or chat should stack together, newest first.' },
  { n: 8, name: 'Channel (Android)', text: 'Every notification belongs to a channel such as "Order updates" with its own importance and sound.' },
];

export default function NotificationAnatomy() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* iOS */}
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">iOS banner</p>
          <div className="rounded-2xl p-3" style={{ background: 'linear-gradient(160deg,#5b6b9a,#2b3557)', colorScheme: 'light' }}>
            <div className="relative">
              <div className="rounded-[18px] bg-white/85 p-3 text-black shadow-lg backdrop-blur">
                <div className="flex items-start gap-2.5">
                  <AppIcon />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1 text-[13px] font-semibold">
                        <span className="truncate">On the way</span> <Marker n={2} />
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-black/50">
                        now <Marker n={7} />
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-start gap-1 text-[13px] leading-snug">
                      <span className="min-w-0">Marco picked up your Pasta Roma order. Arriving in 18 min.</span>
                      <Marker n={3} />
                    </p>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 pl-[44px] text-[11px] text-black/50">
                  <Marker n={1} /> QuickBite
                </div>
              </div>
              <div className="mx-3 h-2 rounded-b-[14px] bg-white/50" aria-hidden="true" />
              <div className="mx-6 h-1.5 rounded-b-[12px] bg-white/30" aria-hidden="true" />
            </div>
            <p className="mt-2 text-center text-[11px] text-white/80">Long-press to see the image and actions</p>
            <div className="mt-3 flex items-end justify-center gap-2">
              <div className="flex flex-col items-center">
                <span className="relative">
                  <AppIcon size={44} radius={11} />
                  <span className="absolute -top-1.5 -right-1.5 grid h-[20px] min-w-[20px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white">3</span>
                </span>
                <span className="mt-1 text-[10px] text-white">QuickBite</span>
              </div>
              <span className="mb-5">
                <Marker n={6} />
              </span>
            </div>
          </div>
        </div>

        {/* Android */}
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Android (expanded)</p>
          <div className="rounded-2xl bg-[#e9e7ef] p-3" style={{ colorScheme: 'light' }}>
            <div className="rounded-[22px] bg-[#fdfbff] p-3.5 text-[#1b1b1f] shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] text-[#46464f]">
                <span className="grid size-5 place-items-center rounded-full bg-[#ea580c] text-white">
                  <Bike size={11} />
                </span>
                <span className="font-medium">QuickBite</span>
                <span>· Order updates</span>
                <Marker n={8} />
                <span className="ml-auto flex items-center">
                  2m <ChevronDown size={14} />
                </span>
              </div>
              <p className="mt-2 text-[14px] font-semibold">On the way</p>
              <p className="text-[13px] leading-snug text-[#46464f]">Marco picked up your Pasta Roma order.</p>
              <div className="relative mt-2 h-20 overflow-hidden rounded-xl" style={{ background: 'linear-gradient(120deg,#fde68a,#fb923c 55%,#b45309)' }}>
                <span className="absolute top-2 left-2">
                  <Marker n={4} />
                </span>
                <span className="absolute right-3 bottom-2 text-[11px] font-semibold text-white/90">Marco, 1.2 km away</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#dfe0ff] px-3 py-1.5 text-[12px] font-medium text-[#1a1b6b]">Track order</span>
                <span className="rounded-full bg-[#dfe0ff] px-3 py-1.5 text-[12px] font-medium text-[#1a1b6b]">Call driver</span>
                <Marker n={5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {legend.map((l) => (
          <li key={l.n} className="flex min-w-0 items-start gap-2.5 text-[13px]">
            <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#4f46e5] text-[10px] font-bold text-white">{l.n}</span>
            <span className="min-w-0">
              <strong className="text-fg">{l.name}.</strong> <span className="text-muted">{l.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
