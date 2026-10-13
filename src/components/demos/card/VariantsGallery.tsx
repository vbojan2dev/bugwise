import { useState, type ReactNode } from 'react';
import { Bike, Clock, Heart, Moon, Mountain, Newspaper, Star, Sun, Utensils } from 'lucide-react';
import { ProductCard, products } from './Cards';

/** Material 3 color roles (light / dark) used by the three Material card types. */
const m3 = {
  light: { surface: '#fef7ff', low: '#f7f2fa', highest: '#e6e0e9', outline: '#cac4d0', on: '#1d1b20', onVar: '#49454f', primary: '#6750a4' },
  dark: { surface: '#141218', low: '#1d1b20', highest: '#36343b', outline: '#49454f', on: '#e6e0e9', onVar: '#cac4d0', primary: '#d0bcff' },
};

function Figure({ title, platform, note, risk, screen, bg }: { title: string; platform: string; note: string; risk: string; screen: ReactNode; bg: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-[220px] place-items-center px-4 py-5" style={{ background: bg }}>
        <div className="w-full max-w-[250px]">{screen}</div>
      </div>
      <figcaption className="flex-1 border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-semibold text-danger">Test for: </span>
          <span className="text-muted">{risk}</span>
        </p>
      </figcaption>
    </figure>
  );
}

function M3Card({ kind, dark }: { kind: 'elevated' | 'filled' | 'outlined'; dark: boolean }) {
  const c = dark ? m3.dark : m3.light;
  const style =
    kind === 'elevated'
      ? { background: c.low, boxShadow: dark ? '0 1px 2px rgba(0,0,0,.6), 0 1px 3px 1px rgba(0,0,0,.3)' : '0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15)' }
      : kind === 'filled'
        ? { background: c.highest }
        : { background: c.surface, border: `1px solid ${c.outline}` };
  return (
    <div className="rounded-xl p-4" style={{ ...style, color: c.on }}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-medium" style={{ background: dark ? '#4f378b' : '#eaddff', color: dark ? '#eaddff' : '#21005d' }}>
          R
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">Morning run</p>
          <p className="truncate text-[12px]" style={{ color: c.onVar }}>
            Today · 6.2 km · 31:40
          </p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-snug" style={{ color: c.onVar }}>
        Your fastest 5 km this month. Keep the streak going!
      </p>
      <div className="mt-3 flex justify-end gap-2 text-[13px] font-medium">
        <span className="rounded-full px-3 py-2" style={{ color: c.primary }}>
          Share
        </span>
        <span className="rounded-full px-4 py-2" style={{ background: c.primary, color: dark ? '#381e72' : '#fff' }}>
          View
        </span>
      </div>
    </div>
  );
}

function IOSCard({ dark }: { dark: boolean }) {
  return (
    <div className="overflow-hidden rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,.12)]" style={{ background: dark ? '#1c1c1e' : '#fff', color: dark ? '#fff' : '#000' }}>
      <div className="relative grid aspect-[4/3] place-items-end bg-[linear-gradient(160deg,#0ea5e9,#1e3a8a)] p-3 text-white">
        <Mountain size={44} strokeWidth={1.2} className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70" aria-hidden="true" />
        <div className="relative w-full">
          <p className="text-[10px] font-semibold tracking-wide uppercase opacity-80">Weekend guide</p>
          <p className="text-[18px] leading-tight font-bold">5 easy hikes near Zürich</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 text-[12px]" style={{ color: dark ? '#98989f' : '#6c6c70' }}>
        <span>Trails · 4 min read</span>
        <span className="font-semibold" style={{ color: dark ? '#0a84ff' : '#007aff' }}>
          Read
        </span>
      </div>
    </div>
  );
}

function RestaurantCard({ dark, closed = false }: { dark: boolean; closed?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: dark ? '#1c1d24' : '#fff', color: dark ? '#eceef6' : '#14161f', boxShadow: dark ? 'inset 0 0 0 1px #2c2f3b' : '0 1px 3px rgba(16,18,35,.12)' }}>
      <div className="relative grid aspect-[16/9] place-items-center bg-[linear-gradient(135deg,#fde68a,#d97706)]">
        <Utensils size={30} strokeWidth={1.5} className={`text-white/90 ${closed ? 'opacity-40' : ''}`} aria-hidden="true" />
        {closed && (
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-[13px] font-semibold text-white">Closed · Opens 17:00</span>
        )}
        <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-[#14161f]">
          <Heart size={14} aria-hidden="true" />
        </span>
      </div>
      <div className="space-y-0.5 p-3">
        <p className="text-[14px] font-semibold">Napoli Pizza Corner</p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: dark ? '#9aa0b4' : '#5b6070' }}>
          <Star size={11} className="fill-[#f5a524] text-[#f5a524]" aria-hidden="true" /> 4.5 (860) · Pizza · €
        </p>
        <p className="flex items-center gap-2 text-[11px]" style={{ color: dark ? '#9aa0b4' : '#5b6070' }}>
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden="true" /> 25–35 min
          </span>
          <span className="flex items-center gap-1">
            <Bike size={11} aria-hidden="true" /> €2.49
          </span>
        </p>
      </div>
    </div>
  );
}

function ArticleCard({ dark }: { dark: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl p-3" style={{ background: dark ? '#1c1d24' : '#fff', color: dark ? '#eceef6' : '#14161f', border: `1px solid ${dark ? '#2c2f3b' : '#e3e5ec'}` }}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold" style={{ color: dark ? '#8ab4ff' : '#1a56db' }}>
          Tech Daily
        </p>
        <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug font-semibold">Why your phone battery drains faster in the cold, and what actually helps</p>
        <p className="mt-1 text-[11px]" style={{ color: dark ? '#9aa0b4' : '#6b7080' }}>
          2 h ago · 6 min read
        </p>
      </div>
      <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#a5b4fc,#4338ca)]">
        <Newspaper size={22} className="text-white/90" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [fav, setFav] = useState(false);
  const [msg, setMsg] = useState('');
  const m3bg = dark ? m3.dark.surface : m3.light.surface;
  const neutralBg = dark ? '#0b0c10' : '#f2f2f7';

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Switch the demo screens to dark mode and see which card edges survive.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          aria-pressed={dark}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-subtle"
        >
          {dark ? <Moon size={14} /> : <Sun size={14} />} Demo screens: {dark ? 'Dark' : 'Light'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Figure
          title="Elevated card"
          platform="Material 3"
          note="A low shadow lifts the card off the background. In dark mode Material uses a lighter surface instead, because shadows barely show on black."
          risk="the edge disappearing in dark mode, shadows clipped by a scroll container."
          bg={m3bg}
          screen={<M3Card kind="elevated" dark={dark} />}
        />
        <Figure
          title="Filled card"
          platform="Material 3"
          note="A tinted background and no shadow. Calm and compact, good for grouped content like settings or summaries."
          risk="enough contrast between card, background and the text on it."
          bg={m3bg}
          screen={<M3Card kind="filled" dark={dark} />}
        />
        <Figure
          title="Outlined card"
          platform="Material 3"
          note="A thin border, no shadow. Easy to scan in lists and grids where many cards sit side by side."
          risk="a 1 px border that vanishes on some screens or in dark mode."
          bg={m3bg}
          screen={<M3Card kind="outlined" dark={dark} />}
        />
        <Figure
          title="Large media card"
          platform="iOS"
          note="iOS has no single &quot;card&quot; control. Apps build them, often like the App Store's Today tab: big image, text on top, rounded corners."
          risk="text over a photo staying readable, Dynamic Type pushing text out of the image."
          bg={neutralBg}
          screen={<IOSCard dark={dark} />}
        />
        <Figure
          title="Product card"
          platform="Web & apps"
          note="Image, name, rating, price, badges and actions. The most bug-prone card of all, because so much data meets in a small box."
          risk="the heart opening the product, sale prices, Sold out, long names."
          bg={neutralBg}
          screen={
            <div className="mx-auto w-[170px]">
              <ProductCard p={products[0]} dark={dark} fav={fav} onFav={() => setFav((f) => !f)} onOpen={() => setMsg('Opened the product page')} onAdd={() => setMsg('Added to cart')} />
              <p role="status" className="mt-2 h-4 text-center text-[11px]" style={{ color: dark ? '#9aa0b4' : '#5b6070' }}>
                {msg}
              </p>
            </div>
          }
        />
        <Figure
          title="Restaurant card"
          platform="Food delivery"
          note="A wide 16:9 photo with rating, cuisine, delivery time and fee. Status like &quot;Closed&quot; or &quot;Free delivery&quot; sits on the image."
          risk="closed restaurants still orderable, fees and times matching the detail page."
          bg={neutralBg}
          screen={
            <div className="space-y-3">
              <RestaurantCard dark={dark} />
              <RestaurantCard dark={dark} closed />
            </div>
          }
        />
        <Figure
          title="Article card"
          platform="News & content"
          note="Horizontal: text on the left, a small thumbnail on the right. Headlines are clamped to two or three lines."
          risk="headline truncation, wrong or missing thumbnails, stale &quot;2 h ago&quot; times."
          bg={neutralBg}
          screen={
            <div className="space-y-2">
              <ArticleCard dark={dark} />
              <ArticleCard dark={dark} />
            </div>
          }
        />
      </div>
    </div>
  );
}
