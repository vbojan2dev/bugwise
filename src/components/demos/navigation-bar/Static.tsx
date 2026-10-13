import { ArrowLeft, Bell, Compass, Gift, Heart, House, MessageCircle, MoreVertical, Receipt, Search, Share, ShoppingCart, User } from 'lucide-react';
import { M3, M3NavigationBar, type Dest } from './Bars';

/* Small static mockups for the Do / Don't comparisons on the navigation bar page. */

const GOOD: Dest[] = [
  { label: 'Home', icon: House },
  { label: 'Search', icon: Search },
  { label: 'Orders', icon: Receipt, badge: 1 },
  { label: 'Account', icon: User },
];

export function GoodBottomNav() {
  return (
    <div className="overflow-hidden rounded-xl text-[#1d1b20]" style={{ colorScheme: 'light', background: M3.surface }} role="img" aria-label="A navigation bar with four labeled destinations: Home (selected), Search, Orders with a badge, Account">
      <div className="h-10" />
      <div aria-hidden="true">
        <M3NavigationBar items={GOOD} value={0} />
      </div>
    </div>
  );
}

const CROWDED = [House, Compass, Search, Heart, ShoppingCart, MessageCircle, Bell, Gift];
export function CrowdedBottomNav() {
  return (
    <div className="overflow-hidden rounded-xl text-[#1d1b20]" style={{ colorScheme: 'light', background: M3.surface }} role="img" aria-label="A bottom bar with eight icons and no labels">
      <div className="h-10" />
      <div className="flex justify-around px-1 pt-3 pb-4" style={{ background: M3.container }} aria-hidden="true">
        {CROWDED.map((I, i) => (
          <I key={i} size={20} style={{ color: i === 0 ? M3.primary : M3.variant }} />
        ))}
      </div>
    </div>
  );
}

export function TitleBar({ broken = false }: { broken?: boolean }) {
  const title = 'Golden Dragon Noodle House & Dumplings';
  return (
    <div
      className="overflow-hidden rounded-xl text-[#1d1b20]"
      style={{ colorScheme: 'light', background: M3.surface }}
      role="img"
      aria-label={broken ? `A top app bar where the long title ${title} runs underneath the share and menu icons` : `A top app bar with the title ${title} truncated with an ellipsis before the share and menu icons`}
    >
      <div className="relative flex h-14 items-center px-1" aria-hidden="true">
        <span className="grid size-11 shrink-0 place-items-center">
          <ArrowLeft size={20} />
        </span>
        {broken ? (
          <>
            <span className="absolute left-12 text-[18px] whitespace-nowrap">{title}</span>
            <span className="flex-1" />
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[18px]">{title}</span>
        )}
        <span className="relative grid size-10 shrink-0 place-items-center">
          <Share size={19} />
        </span>
        <span className="relative grid size-10 shrink-0 place-items-center">
          <MoreVertical size={19} />
        </span>
      </div>
      <div className="space-y-1.5 px-4 pb-4">
        <div className="h-2 w-3/4 rounded bg-black/10" />
        <div className="h-2 w-1/2 rounded bg-black/10" />
      </div>
    </div>
  );
}

