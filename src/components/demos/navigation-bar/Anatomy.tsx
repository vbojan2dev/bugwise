import { ChevronLeft, Heart, House, Receipt, Search, Share, User } from 'lucide-react';
import { IOS_BAR, IOS_BLUE, IOS_SEP } from './Bars';

const parts = [
  { n: 1, name: 'Top safe area', text: 'Space for the status bar, notch or Dynamic Island. Nothing tappable belongs here.' },
  { n: 2, name: 'Back button', text: 'Goes one screen back. On iOS it shows the previous screen’s title, so it must name the right screen.' },
  { n: 3, name: 'Title', text: 'Names the current screen. Long names must truncate or wrap, never run into the buttons.' },
  { n: 4, name: 'Actions', text: 'One to three icon buttons (Android moves extras into a ⋮ overflow menu). Each needs a 44 pt / 48 dp target and a name.' },
  { n: 5, name: 'Destination', text: 'One main area of the app: icon plus a short label. Three to five of them.' },
  { n: 6, name: 'Selected state', text: 'Shows where you are: tint on iOS, a pill-shaped indicator on Android.' },
  { n: 7, name: 'Badge', text: 'A count or dot for new things. Must update when they are seen.' },
  { n: 8, name: 'Bottom safe area', text: 'Room for the home indicator or gesture bar. Labels must sit above it.' },
];

function Marker({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`absolute z-20 grid size-5 place-items-center rounded-full bg-[#5b4bff] text-[11px] font-bold text-white ring-[3px] ring-[#5b4bff]/25 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-4 py-8 sm:px-6" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="An iPhone screen. At the top: a navigation bar with a back button labeled Pizza Roma, the title Margherita, and heart and share buttons. At the bottom: a tab bar with Home, Search, Orders with a badge of 2, and Account, above the home indicator."
          className="relative mx-auto flex h-[330px] max-w-[17rem] flex-col overflow-hidden rounded-[28px] border-[5px] border-[#0c0d12] bg-[#f2f2f7] text-black"
        >
          {/* status bar / top safe area */}
          <div className="relative flex h-7 shrink-0 items-center justify-between px-5 text-[10px] font-semibold" style={{ background: IOS_BAR }}>
            <span>9:41</span>
            <span className="absolute top-1.5 left-1/2 h-[14px] w-[56px] -translate-x-1/2 rounded-full bg-black" />
            <span>100%</span>
            <Marker n={1} className="top-1 left-[30%]" />
          </div>
          {/* nav bar */}
          <div className="flex h-10 shrink-0 items-center border-b px-1.5" style={{ background: IOS_BAR, borderColor: IOS_SEP }}>
            <span className="relative flex items-center text-[13px]" style={{ color: IOS_BLUE }}>
              <ChevronLeft size={20} strokeWidth={2.4} />
              Pizza Roma
              <Marker n={2} className="-bottom-4 left-3" />
            </span>
            <span className="relative min-w-0 flex-1 truncate text-center text-[13px] font-semibold">
              Margherita
              <Marker n={3} className="-bottom-4 left-1/2 -translate-x-1/2" />
            </span>
            <span className="relative flex gap-2 pr-1" style={{ color: IOS_BLUE }}>
              <Heart size={17} />
              <Share size={17} />
              <Marker n={4} className="-bottom-5 left-2" />
            </span>
          </div>
          {/* content */}
          <div className="min-h-0 flex-1 space-y-2 p-3 pt-6">
            <div className="h-20 rounded-xl bg-[#e5d3c0]" />
            <div className="h-2.5 w-2/3 rounded bg-black/15" />
            <div className="h-2 w-full rounded bg-black/10" />
            <div className="h-2 w-5/6 rounded bg-black/10" />
          </div>
          {/* tab bar */}
          <div className="relative flex shrink-0 border-t pt-1 pb-5" style={{ background: IOS_BAR, borderColor: IOS_SEP }}>
            {[
              { l: 'Home', I: House, sel: true },
              { l: 'Search', I: Search },
              { l: 'Orders', I: Receipt, badge: 2 },
              { l: 'Account', I: User },
            ].map((t, i) => (
              <span key={t.l} className="relative flex flex-1 flex-col items-center text-[9px] font-medium" style={{ color: t.sel ? IOS_BLUE : '#8a8a8e' }}>
                <span className="relative">
                  <t.I size={18} strokeWidth={t.sel ? 2.3 : 1.8} />
                  {t.badge && <span className="absolute -top-1 left-3 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#ff3b30] px-0.5 text-[8px] text-white">{t.badge}</span>}
                </span>
                {t.l}
                {i === 0 && <Marker n={6} className="-top-5 left-1" />}
                {i === 1 && <Marker n={5} className="-top-5 left-1/2 -translate-x-1/2" />}
                {i === 2 && <Marker n={7} className="-top-5 right-1" />}
              </span>
            ))}
            <span className="absolute bottom-1.5 left-1/2 h-[3px] w-[80px] -translate-x-1/2 rounded-full bg-black" />
            <Marker n={8} className="right-3 bottom-0.5" />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">iOS: navigation bar on top, tab bar at the bottom</p>
      </div>
      <ol className="min-w-0 space-y-3">
        {parts.map((p) => (
          <li key={p.n} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{p.n}</span>
            <div className="min-w-0">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
