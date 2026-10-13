import type { ReactNode } from 'react';
import { House, Menu, Receipt, Search, ShoppingBag, User } from 'lucide-react';
import { MD } from './Drawer';

/* Static mockups for the Do / Don't comparison on the drawer page. */

function Shell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ colorScheme: 'light', background: MD.surface, color: MD.onSurface }} role="img" aria-label={label}>
      {children}
    </div>
  );
}

function Lines() {
  return (
    <div className="space-y-1.5 px-4 py-3">
      <div className="h-2 w-3/4 rounded bg-black/10" />
      <div className="h-2 w-1/2 rounded bg-black/10" />
      <div className="h-2 w-2/3 rounded bg-black/10" />
    </div>
  );
}

export function VisibleNav() {
  const items = [
    { l: 'Home', I: House, sel: true },
    { l: 'Search', I: Search },
    { l: 'Orders', I: Receipt },
    { l: 'Account', I: User },
  ];
  return (
    <Shell label="A shopping app with a menu button for extras at the top and a bottom bar with Home, Search, Orders and Account">
      <div className="flex h-11 items-center gap-2 px-3" aria-hidden="true">
        <Menu size={18} />
        <span className="flex-1 text-[15px]">Shop</span>
        <ShoppingBag size={17} />
      </div>
      <Lines />
      <div className="flex pt-2 pb-3" style={{ background: '#f3edf7' }} aria-hidden="true">
        {items.map((t) => (
          <span key={t.l} className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium" style={{ color: t.sel ? MD.onSurface : MD.variant }}>
            <span className="grid h-6 w-10 place-items-center rounded-full" style={{ background: t.sel ? MD.indicator : undefined }}>
              <t.I size={16} />
            </span>
            {t.l}
          </span>
        ))}
      </div>
    </Shell>
  );
}

export function HiddenNav() {
  return (
    <Shell label="The same shopping app with only a menu button: Search, Orders and Account are hidden inside it">
      <div className="flex h-11 items-center gap-2 px-3" aria-hidden="true">
        <Menu size={18} />
        <span className="flex-1 text-[15px]">Shop</span>
        <ShoppingBag size={17} />
      </div>
      <Lines />
      <div className="h-[52px]" />
    </Shell>
  );
}
