import { useState, type ReactNode } from 'react';
import { Bell, Home, Inbox, MessageCircle, Moon, Phone, Search, Settings, ShoppingBag, Sun, User, Truck, Mail } from 'lucide-react';
import { CountBadge, DotBadge, StatusPill, formatCount } from './Badge';

function Demo({ title, platform, note, dark, children }: { title: string; platform: string; note: string; dark: boolean; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-36 place-items-center px-4 py-7" style={{ background: dark ? '#000' : '#f2f2f7', color: dark ? '#fff' : '#000', colorScheme: dark ? 'dark' : 'light' }}>
        <div className="w-full max-w-[19rem] min-w-0">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

function IOSTabBar({ dark }: { dark: boolean }) {
  const [sel, setSel] = useState(0);
  const [unread, setUnread] = useState(3);
  const tabs = [
    { icon: MessageCircle, label: 'Chats', count: unread },
    { icon: Phone, label: 'Calls', count: 0 },
    { icon: Bell, label: 'Updates', count: 128 },
    { icon: Settings, label: 'Settings', count: 0 },
  ];
  const surface = dark ? '#1c1c1e' : '#f9f9f9';
  return (
    <div>
      <div role="tablist" aria-label="Main" className="flex rounded-2xl px-1 pt-2 pb-1.5" style={{ background: surface, boxShadow: '0 0 0 1px rgba(0,0,0,.06)' }}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={sel === i}
            aria-label={t.count ? `${t.label}, ${t.count} unread` : t.label}
            onClick={() => {
              setSel(i);
              if (i === 0) setUnread(0);
            }}
            className="flex min-w-0 flex-1 flex-col items-center"
            style={{ color: sel === i ? (dark ? '#0a84ff' : '#007aff') : '#8e8e93' }}
          >
            <span className="relative">
              <t.icon size={24} />
              {t.count > 0 && (
                <span className="absolute -top-1.5 left-3.5">
                  <CountBadge label={formatCount(t.count, 99)} dark={dark} ring={surface} />
                </span>
              )}
            </span>
            <span className="mt-0.5 text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setUnread(3)} className="mt-2 text-[11px] underline opacity-70">
        Reset the unread count
      </button>
    </div>
  );
}

function MaterialNav({ dark }: { dark: boolean }) {
  const [sel, setSel] = useState(1);
  const items = [
    { icon: Home, label: 'Home', badge: 'dot' as const },
    { icon: Inbox, label: 'Inbox', badge: 1200 },
    { icon: Search, label: 'Search', badge: null },
    { icon: User, label: 'Profile', badge: 7 },
  ];
  const bg = dark ? '#211f26' : '#f3edf7';
  return (
    <div role="tablist" aria-label="Main" className="flex rounded-2xl py-2.5" style={{ background: bg, color: dark ? '#e6e0e9' : '#49454f' }}>
      {items.map((it, i) => (
        <button
          key={it.label}
          role="tab"
          aria-selected={sel === i}
          aria-label={it.badge === 'dot' ? `${it.label}, new content` : typeof it.badge === 'number' ? `${it.label}, ${it.badge > 999 ? 'more than 999' : it.badge} new` : it.label}
          onClick={() => setSel(i)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <span className="relative grid h-8 w-14 place-items-center rounded-full" style={{ background: sel === i ? (dark ? '#4a4458' : '#e8def8') : 'transparent' }}>
            <it.icon size={22} />
            {it.badge === 'dot' && (
              <span className="absolute top-1 right-[18px]">
                <DotBadge variant="material" dark={dark} size={6} />
              </span>
            )}
            {typeof it.badge === 'number' && (
              <span className="absolute -top-1 left-[33px]">
                <CountBadge label={formatCount(it.badge, 999)} variant="material" dark={dark} />
              </span>
            )}
          </span>
          <span className={`text-[11px] ${sel === i ? 'font-bold' : 'font-medium'}`}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function WebHeader({ dark }: { dark: boolean }) {
  const [cart, setCart] = useState(2);
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: dark ? '#13151f' : '#fff', boxShadow: '0 0 0 1px rgba(127,127,127,.25)' }}>
      <div className="flex items-center gap-3">
        <span className="flex-1 text-[14px] font-bold">shop.example</span>
        <button type="button" aria-label="Notifications, new" className="relative grid size-9 place-items-center rounded-lg">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2">
            <DotBadge variant="web" dark={dark} size={8} ring={dark ? '#13151f' : '#fff'} />
          </span>
        </button>
        <button type="button" aria-label={`Cart, ${cart} ${cart === 1 ? 'item' : 'items'}`} onClick={() => setCart((c) => (c >= 12 ? 0 : c + 1))} className="relative grid size-9 place-items-center rounded-lg">
          <ShoppingBag size={20} />
          {cart > 0 && (
            <span className="absolute top-0 right-0">
              <CountBadge label={formatCount(cart, 9)} variant="web" dark={dark} ring={dark ? '#13151f' : '#fff'} />
            </span>
          )}
        </button>
      </div>
      <p className="mt-1 text-[10px] opacity-60">Tap the bag to add items (caps at 9+, hides at 0).</p>
    </div>
  );
}

function Avatars({ dark }: { dark: boolean }) {
  const ring = dark ? '#000' : '#f2f2f7';
  const people = [
    { i: 'AN', c: '#ffd8a8', s: 'Online', dot: '#34c759' },
    { i: 'MK', c: '#c7d2fe', s: 'Away', dot: '#ff9f0a' },
    { i: 'JS', c: '#bbf7d0', s: 'Offline', dot: null },
  ];
  return (
    <ul className="flex justify-around">
      {people.map((p) => (
        <li key={p.i} className="flex flex-col items-center gap-1">
          <span className="relative grid size-12 place-items-center rounded-full text-[15px] font-semibold text-[#1f2937]" style={{ background: p.c }}>
            {p.i}
            {p.dot && (
              <span className="absolute right-0 bottom-0">
                <DotBadge size={13} color={p.dot} ring={ring} />
              </span>
            )}
          </span>
          <span className="text-[11px] opacity-75">{p.s}</span>
        </li>
      ))}
    </ul>
  );
}

function Pills({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-2">
      {(
        [
          ['Trail runner 2', 'sale'],
          ['City sneaker', 'new'],
          ['Rain jacket', 'soldout'],
          ['Wool socks', 'low'],
        ] as const
      ).map(([name, kind]) => (
        <div key={name} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: dark ? '#1c1c1e' : '#fff' }}>
          <span className="min-w-0 truncate text-[13px] font-medium">{name}</span>
          <StatusPill kind={kind} />
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]" style={{ background: dark ? '#1c1c1e' : '#fff' }}>
        <Truck size={16} aria-hidden="true" />
        <span className="flex-1">Order #4821</span>
        <StatusPill kind="transit" />
      </div>
    </div>
  );
}

function AppIcons() {
  return (
    <div className="flex items-start justify-around">
      <div className="flex flex-col items-center gap-1">
        <span className="relative grid size-14 place-items-center rounded-[14px] bg-gradient-to-b from-[#5ef08a] to-[#26c14f] text-white">
          <MessageCircle size={30} className="fill-white" />
          <span className="absolute -top-1.5 -right-1.5">
            <CountBadge label="12" />
          </span>
        </span>
        <span className="text-[11px]">iOS</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="relative grid size-14 place-items-center rounded-full bg-[#1a73e8] text-white">
          <Mail size={28} />
          <span className="absolute top-0.5 right-0.5 size-3 rounded-full bg-[#1e8e3e] ring-2 ring-[#f2f2f7]" aria-hidden="true" />
        </span>
        <span className="text-[11px]">Android dot</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="relative grid size-14 place-items-center rounded-[14px] bg-gradient-to-b from-[#ff9a62] to-[#ff5e3a] text-white">
          <ShoppingBag size={28} />
        </span>
        <span className="text-[11px]">No badge</span>
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Several of these react to taps. Use the switch to compare light and dark.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Tab bar badge" platform="iOS" dark={dark} note="Red pill with a white number on the top-right of the icon. Tap Chats: the badge disappears when the messages are read.">
          <IOSTabBar dark={dark} />
        </Demo>
        <Demo title="Small and large badges" platform="Android · Material 3" dark={dark} note="A 6 dp dot for “something new”, a 16 dp badge for numbers. Material caps at four characters: 999+.">
          <MaterialNav dark={dark} />
        </Demo>
        <Demo title="Header icons" platform="Web" dark={dark} note="Cart count and a notification dot. Each icon button needs a name that includes the count.">
          <WebHeader dark={dark} />
        </Demo>
        <Demo title="Presence on avatars" platform="iOS · Android · Web" dark={dark} note="Green, orange, nothing. Without the text below, colorblind and screen reader users can't tell who's online.">
          <Avatars dark={dark} />
        </Demo>
        <Demo title="Status labels (pills)" platform="iOS · Android · Web" dark={dark} note="Words, not numbers: Sale, New, Sold out. The word carries the meaning; the color is a bonus.">
          <Pills dark={dark} />
        </Demo>
        <Demo title="App icon badges" platform="iOS · Android" dark={dark} note="Set by the OS from the app's notifications. iOS shows a number (if the user allows badges); Android launchers usually show a dot.">
          <AppIcons />
        </Demo>
      </div>
    </div>
  );
}
