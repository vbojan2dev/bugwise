import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, ChevronsLeft, ChevronsRight, CircleHelp, FileText, Inbox, LayoutDashboard, Menu, Search, Send, Settings, ShoppingBag, Star, Trash2, Users, X } from 'lucide-react';
import { DrawerList, MD, ModalDrawer, type DrawerItem } from './Drawer';

function Card({ title, platform, note, chips, children, wide = false }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; wide?: boolean }) {
  return (
    <figure className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface ${wide ? 'md:col-span-2' : ''}`}>
      <div className="grid place-items-center px-4 py-5" style={{ background: '#e9ebf2', colorScheme: 'light' }}>
        <div className={`relative h-[330px] w-full overflow-hidden rounded-[22px] border border-black/10 shadow-sm ${wide ? 'max-w-[640px]' : 'max-w-[280px]'}`}>{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

const MAIL: DrawerItem[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 24 },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText, badge: 2 },
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'More' },
  { id: 'help', label: 'Help & feedback', icon: CircleHelp },
];

/* 1. Material modal navigation drawer */
function ModalDemo() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('inbox');
  const btn = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  const label = MAIL.find((m) => m.id === cur)?.label ?? 'Inbox';
  return (
    <div className="relative flex h-full flex-col" style={{ background: MD.surface, color: MD.onSurface }}>
      <div className="flex h-14 shrink-0 items-center gap-1 px-1" aria-hidden={open}>
        <button ref={btn} type="button" aria-label="Open navigation menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-12 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
          <Menu size={22} />
        </button>
        <p className="flex-1 text-[20px]">{label}</p>
        <Search size={20} className="mr-3" aria-hidden="true" />
      </div>
      <ul className="space-y-1 px-2" aria-hidden={open}>
        {['Anna · Flight to Lisbon', 'Shop · Your parcel is on its way', 'Mila · Lunch Friday?', 'Bank · Statement ready', 'Gym · New class times', 'Leo · Photos from Sunday'].map((m) => (
          <li key={m} className="truncate rounded-xl px-3 py-2.5 text-[13px]" style={{ background: '#f3edf7' }}>
            {m}
          </li>
        ))}
      </ul>
      <ModalDrawer open={open} onClose={close} label="Navigation menu">
        <DrawerList items={MAIL} current={cur} headline="Mail" onSelect={(id) => { setCur(id); close(); }} />
      </ModalDrawer>
    </div>
  );
}

/* 2. Web hamburger menu */
const SHOP = ['Home', 'New in', 'Women', 'Men', 'Sale', 'My orders', 'Help'];
function WebMenuDemo() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('Home');
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>('a')?.focus();
  }, [open]);
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  return (
    <div
      className="relative flex h-full flex-col bg-white text-[#0e1120]"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="flex h-7 shrink-0 items-center justify-center bg-[#f1f2f6] font-mono text-[10px] text-black/50">shop.example.com/{page === 'Home' ? '' : page.toLowerCase().replace(' ', '-')}</div>
      <header className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-2">
        <button
          ref={btn}
          type="button"
          aria-label={open ? 'Close menu' : 'Menu'}
          aria-expanded={open}
          aria-controls="gal-web-menu"
          onClick={() => (open ? close() : setOpen(true))}
          className="grid size-10 place-items-center rounded-lg outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#5b4bff]"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <span className="flex-1 font-bold tracking-tight">Threadline</span>
        <ShoppingBag size={19} className="mr-2" aria-hidden="true" />
      </header>
      <main className="space-y-2 p-3" aria-hidden={open}>
        <h3 className="text-[18px] font-bold">{page}</h3>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg" style={{ background: ['#e9d8c4', '#cfe1d6', '#d6dcef', '#f1d5d8'][i] }} />
          ))}
        </div>
      </main>
      {open && <div className="absolute inset-x-0 top-[76px] bottom-0 z-10 bg-black/30" onClick={close} aria-hidden="true" />}
      <nav
        id="gal-web-menu"
        ref={panel}
        aria-label="Main"
        className="absolute inset-x-0 top-[76px] z-10 border-b border-black/10 bg-white px-2 py-2 shadow-lg"
        hidden={!open}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return;
          const links = Array.from(panel.current?.querySelectorAll<HTMLElement>('a') ?? []);
          if (!e.shiftKey && document.activeElement === links[links.length - 1]) {
            e.preventDefault();
            btn.current?.focus();
          }
        }}
      >
        <ul>
          {SHOP.map((s) => (
            <li key={s}>
              <a
                href="#"
                aria-current={s === page ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(s);
                  close();
                }}
                className="block rounded-lg px-3 py-2 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#5b4bff]"
                style={{ background: s === page ? '#eef0ff' : undefined, color: s === page ? '#3d32c9' : undefined }}
              >
                {s}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/* 3. Standard (permanent) drawer on a tablet or desktop, collapsible to a rail */
const WORK: DrawerItem[] = [
  { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 3 },
  { id: 'cal', label: 'Calendar', icon: CalendarDays },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'docs', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Workspace' },
];
function StandardDemo() {
  const [cur, setCur] = useState('dash');
  const [rail, setRail] = useState(false);
  const item = WORK.find((w) => w.id === cur)!;
  return (
    <div className="flex h-full text-[#1d1b20]" style={{ background: MD.surface }}>
      <nav aria-label="Workspace" className="flex shrink-0 flex-col overflow-y-auto border-r py-2 transition-[width] duration-200" style={{ width: rail ? 64 : 'min(46%, 220px)', background: MD.drawer, borderColor: MD.outline }}>
        <button type="button" onClick={() => setRail((r) => !r)} aria-label={rail ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!rail} className="mx-3 mb-2 grid size-10 place-items-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#6750a4]">
          {rail ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
        {rail ? (
          <ul className="space-y-1 px-2">
            {WORK.map((w) => (
              <li key={w.id}>
                <button type="button" aria-label={w.label} aria-current={w.id === cur ? 'page' : undefined} onClick={() => setCur(w.id)} className="grid h-10 w-full place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]" style={{ background: w.id === cur ? MD.indicator : undefined }}>
                  <w.icon size={20} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="-mt-3">
            <DrawerList items={WORK} current={cur} onSelect={setCur} />
          </div>
        )}
      </nav>
      <div className="min-w-0 flex-1 p-4">
        <p className="flex items-center gap-2 text-[20px]">
          <item.icon size={20} style={{ color: MD.primary }} aria-hidden="true" /> {item.label}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl" style={{ background: '#f3edf7' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      <Card
        title="Modal navigation drawer"
        platform="Android"
        note="Tap ☰. The drawer slides over the page with a scrim. Close it by choosing a destination, tapping the scrim, swiping it left or pressing Esc. Focus returns to ☰."
        chips={['Scrim', 'Swipe to close', 'Focus moves in']}
      >
        <ModalDemo />
      </Card>
      <Card
        title="Hamburger menu"
        platform="Web"
        note="The button’s name and aria-expanded change with the state. Picking a page closes the menu. Try it with Tab, Enter and Esc."
        chips={['aria-expanded', 'aria-controls', 'Closes on navigation']}
      >
        <WebMenuDemo />
      </Card>
      <Card
        wide
        title="Standard (permanent) drawer"
        platform="Tablet · Desktop"
        note="On wide screens the drawer stays next to the content, with no scrim. Collapse it to a rail of icons to give the content more room."
        chips={['Always visible', 'No scrim', 'Collapses to a rail']}
      >
        <StandardDemo />
      </Card>
    </div>
  );
}
