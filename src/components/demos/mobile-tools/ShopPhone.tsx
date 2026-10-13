import { ShoppingCart, Search, ArrowLeft, Star, Info, X, BatteryLow, Phone, MessageSquare, Globe, Camera, Settings, Play, ShoppingBag } from 'lucide-react';
import { AndroidFrame } from './AndroidFrame';
import type { Device } from './adbEngine';

const products: Record<string, { name: string; price: string; color: string }> = {
  '42': { name: 'Trail Runner X', price: '€89.00', color: '#f97316' },
  '7': { name: 'Steel Water Bottle', price: '€15.00', color: '#0ea5e9' },
  '19': { name: 'Yoga Mat Pro', price: '€39.00', color: '#a855f7' },
  '23': { name: 'Running Socks (3)', price: '€12.00', color: '#22c55e' },
};

/** The mock Pixel 8 with the ShopEasy app, rendered from the simulated adb device state. */
export function ShopPhone({
  dev,
  flash = false,
  onLaunch,
  onCloseCrash,
  onOpenProduct,
  onBack,
  width = 220,
}: {
  dev: Device;
  flash?: boolean;
  onLaunch?: () => void;
  onCloseCrash?: () => void;
  onOpenProduct?: (id: string) => void;
  onBack?: () => void;
  width?: number;
}) {
  const s = dev.fontScale;
  const fs = (px: number) => ({ fontSize: px * s });
  const dark = dev.dark;
  const fg = dark ? '#e3e2e9' : '#1a1b20';
  const sub = dark ? '#c4c6d0' : '#5d5e67';
  const card = dark ? '#1e2026' : '#f1f0f7';
  const brand = '#6d4aff';
  const lowBattery = dev.battery <= 15 && !dev.plugged;
  const p = products[dev.productId] ?? { name: `Product #${dev.productId}`, price: '€—', color: '#64748b' };

  const launcher = (
    <div className="absolute inset-0 flex flex-col justify-between px-4 pt-6 pb-8" style={{ background: dark ? 'linear-gradient(160deg,#1b1640,#0b1d2e)' : 'linear-gradient(160deg,#c7d2fe,#fbcfe8)' }}>
      <div className="text-center text-white drop-shadow">
        <p className="text-[34px] leading-none font-light">14:02</p>
        <p className="mt-1 text-[11px]">Tue, Oct 13</p>
      </div>
      <div className="grid grid-cols-4 gap-y-3 text-center text-[9px] text-white">
        {[
          { n: 'Phone', I: Phone, c: '#16a34a' },
          { n: 'Messages', I: MessageSquare, c: '#2563eb' },
          { n: 'Chrome', I: Globe, c: '#ea580c' },
          { n: 'Camera', I: Camera, c: '#475569' },
          { n: 'Settings', I: Settings, c: '#64748b' },
          { n: 'Play Store', I: Play, c: '#0f766e' },
        ].map(({ n, I, c }) => (
          <span key={n} className="flex flex-col items-center gap-1">
            <span className="grid size-9 place-items-center rounded-full" style={{ background: c }}>
              <I size={16} aria-hidden />
            </span>
            <span className="drop-shadow">{n}</span>
          </span>
        ))}
        {dev.installed && (
          <button type="button" onClick={onLaunch} className="flex flex-col items-center gap-1 rounded-lg focus-visible:outline-2 focus-visible:outline-white" aria-label="Open ShopEasy">
            <span className="grid size-9 place-items-center rounded-full" style={{ background: brand }}>
              <ShoppingBag size={16} aria-hidden />
            </span>
            <span className="drop-shadow">ShopEasy</span>
          </button>
        )}
      </div>
    </div>
  );

  let content;
  switch (dev.screen) {
    case 'launcher':
    case 'crash':
      content = launcher;
      break;
    case 'onboarding':
      content = (
        <div className="flex h-full flex-col items-center justify-center px-5 text-center">
          <span className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: brand }}>
            <ShoppingBag size={28} aria-hidden />
          </span>
          <p className="mt-4 font-bold" style={fs(18)}>
            Welcome to ShopEasy
          </p>
          <p className="mt-1" style={{ ...fs(11), color: sub }}>
            Everything for your active life, delivered tomorrow.
          </p>
          <span className="mt-5 w-full rounded-full py-2 font-semibold text-white" style={{ ...fs(12), background: brand }}>
            Log in
          </span>
          <span className="mt-2 w-full rounded-full border py-2 font-semibold" style={{ ...fs(12), borderColor: sub }}>
            Create account
          </span>
        </div>
      );
      break;
    case 'product':
      content = (
        <div className="flex h-full flex-col px-3.5 pt-1">
          <button type="button" onClick={onBack} aria-label="Back" className="-ml-1 w-fit rounded-full p-1 focus-visible:outline-2 focus-visible:outline-current">
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div className="mt-1 grid h-28 place-items-center rounded-2xl" style={{ background: `${p.color}22` }}>
            <span className="size-16 rounded-full" style={{ background: p.color }} />
          </div>
          <p className="mt-3 font-bold" style={fs(16)}>
            {p.name}
          </p>
          <p className="flex items-center gap-1" style={{ ...fs(11), color: sub }}>
            <Star size={11} fill="currentColor" className="text-[#f59e0b]" aria-hidden /> 4.7 · 312 reviews
          </p>
          <p className="mt-2 font-bold" style={fs(18)}>
            {p.price}
          </p>
          <span className="mt-auto mb-8 block rounded-full py-2 text-center font-semibold text-white" style={{ ...fs(12), background: brand }}>
            Add to cart
          </span>
        </div>
      );
      break;
    case 'results':
      content = (
        <div className="flex h-full flex-col px-3.5 pt-1">
          <button type="button" onClick={onBack} aria-label="Back" className="-ml-1 w-fit rounded-full p-1 focus-visible:outline-2 focus-visible:outline-current">
            <ArrowLeft size={18} aria-hidden />
          </button>
          <p className="mt-1 font-bold break-words" style={fs(14)}>
            Results for “{dev.search}”
          </p>
          <ul className="mt-2 space-y-2">
            {['42', '23', '7'].map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onOpenProduct?.(id)} className="flex w-full items-center gap-2 rounded-xl p-2 text-left" style={{ background: card }}>
                  <span className="size-8 shrink-0 rounded-lg" style={{ background: products[id].color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" style={fs(11)}>
                      {products[id].name}
                    </span>
                    <span className="block" style={{ ...fs(10), color: sub }}>
                      {products[id].price}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
      break;
    default:
      content = (
        <div className="flex h-full flex-col px-3.5 pt-1">
          <div className="flex items-center justify-between">
            <p className="font-bold" style={fs(16)}>
              Hi, Ana
            </p>
            <span className="relative">
              <ShoppingCart size={18} aria-label="Cart, 2 items" />
              <span className="absolute -top-1.5 -right-1.5 grid size-3.5 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: brand }}>
                2
              </span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ ...fs(11), background: card, color: dev.search ? fg : sub }}>
            <Search size={12} className="shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{dev.search || 'Search products'}</span>
            {dev.search && <span className="h-3 w-px animate-pulse" style={{ background: fg }} />}
          </div>
          <p className="mt-3 mb-1.5 font-semibold" style={fs(12)}>
            Popular this week
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['42', '7', '19', '23'].map((id) => (
              <button key={id} type="button" onClick={() => onOpenProduct?.(id)} className="min-w-0 rounded-xl p-2 text-left" style={{ background: card }}>
                <span className="block h-12 rounded-lg" style={{ background: `${products[id].color}33` }} />
                <span className="mt-1 block truncate font-semibold" style={fs(10)}>
                  {products[id].name}
                </span>
                <span className="block" style={{ ...fs(10), color: sub }}>
                  {products[id].price}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
  }

  return (
    <AndroidFrame dark={dark} battery={dev.battery} charging={dev.plugged} recording={dev.recording} width={width} label="Pixel 8 connected over USB">
      <div className="relative h-full" style={{ color: fg }}>
        {content}
        {lowBattery && (
          <div className="absolute inset-x-2 top-1 z-20 rounded-2xl p-2 shadow-lg" style={{ background: dark ? '#2b2d35' : '#fff', color: fg }} role="status">
            <p className="flex items-center gap-1 text-[9px]" style={{ color: sub }}>
              <BatteryLow size={11} className="text-[#e5484d]" aria-hidden /> System UI · now
            </p>
            <p className="text-[11px] font-semibold">Battery low · {dev.battery}% left</p>
          </div>
        )}
        {dev.screen === 'crash' && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/45 px-4">
            <div className="w-full rounded-3xl p-4" style={{ background: dark ? '#2b2d35' : '#fff', color: fg }} role="alertdialog" aria-label="ShopEasy keeps stopping">
              <p className="text-[14px] font-semibold">ShopEasy keeps stopping</p>
              <p className="mt-3 flex items-center gap-3 text-[12px]">
                <Info size={15} aria-hidden /> App info
              </p>
              <button type="button" onClick={onCloseCrash} className="mt-3 flex items-center gap-3 rounded text-[12px] focus-visible:outline-2 focus-visible:outline-current">
                <X size={15} aria-hidden /> Close app
              </button>
            </div>
          </div>
        )}
        {flash && <div className="absolute inset-0 z-40 bg-white/80" />}
      </div>
    </AndroidFrame>
  );
}
