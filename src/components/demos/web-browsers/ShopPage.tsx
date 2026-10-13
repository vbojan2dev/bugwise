import { useState } from 'react';
import { Backpack, ChevronDown, Compass, Flashlight, Menu, Mountain, Search, ShoppingBag, Tent, X, Footprints, Flame, type LucideIcon } from 'lucide-react';

/*
 * Sample outdoor shop page that lays itself out from a viewport width passed in as a prop
 * (not from media queries), so it can live inside a resizable mock viewport.
 *
 * With `buggy` it contains six responsive bugs (used in the bug hunt):
 *  1. At exactly 768px neither the desktop nav nor the hamburger is shown (`> 768` vs `< 768`).
 *  2. The tent comparison table has a fixed min-width, so phones get horizontal page scroll.
 *  3. The "Categories" menu opens on hover only, so it can't be opened on touch devices.
 *  4. Between 900 and 999px the hero text has a fixed width and overlaps the image.
 *  5. On small screens a tall sticky promo banner + sticky header push the CTA below the fold.
 *  6. At 1280px+ product images get a fixed height with no aspect ratio, so they are stretched.
 */

const categories = ['Tents', 'Backpacks', 'Footwear', 'Lighting', 'Camp kitchen', 'Navigation'];
const products: { name: string; price: string; icon: LucideIcon; bg: string; fg: string }[] = [
  { name: 'Ridge 2P Tent', price: '$249', icon: Tent, bg: '#e0f2e9', fg: '#166534' },
  { name: 'Summit 35L Pack', price: '$139', icon: Backpack, bg: '#fde8d7', fg: '#9a3412' },
  { name: 'Trail Runner GTX', price: '$165', icon: Footprints, bg: '#e0e7ff', fg: '#3730a3' },
  { name: 'Lumen 400 Headlamp', price: '$45', icon: Flashlight, bg: '#fef3c7', fg: '#92400e' },
  { name: 'Ember Stove', price: '$79', icon: Flame, bg: '#fee2e2', fg: '#991b1b' },
  { name: 'Baseplate Compass', price: '$29', icon: Compass, bg: '#e0f2fe', fg: '#075985' },
  { name: 'Alpine Day Pack', price: '$89', icon: Backpack, bg: '#ede9fe', fg: '#5b21b6' },
  { name: 'Dome 3P Tent', price: '$319', icon: Tent, bg: '#dcfce7', fg: '#14532d' },
];
const tents = [
  ['Ridge 2P', '2', '1.6 kg', '3-season', '$249'],
  ['Dome 3P', '3', '2.4 kg', '3-season', '$319'],
  ['Storm 2P', '2', '2.9 kg', '4-season', '$449'],
  ['Ultra 1P', '1', '0.9 kg', '3-season', '$289'],
];

function HeroArt() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="290" cy="105" r="38" fill="#fff7ed" opacity=".9" />
      <polygon points="0,300 110,120 190,230 260,150 400,300" fill="#7c2d12" opacity=".75" />
      <polygon points="0,300 70,200 150,300" fill="#431407" opacity=".8" />
      <polygon points="180,300 300,180 400,260 400,300" fill="#431407" opacity=".9" />
      <polygon points="200,300 240,250 280,300" fill="#14532d" />
    </svg>
  );
}

export function ShopPage({ vw, buggy = false, touch = false }: { vw: number; buggy?: boolean; touch?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [cart, setCart] = useState(0);

  const sm = vw >= 640;
  const md = vw >= 768;
  const lg = vw >= 1024;
  const xl = vw >= 1280;

  const showNav = buggy ? vw > 768 : md; // BUG 1
  const showBurger = vw < 768;
  const tallBanner = buggy && !sm; // BUG 5
  const overlapHero = buggy && vw >= 900 && vw < 1000; // BUG 4
  const stretched = buggy && xl; // BUG 6
  const cols = lg ? 4 : md ? 3 : 2;
  const pad = lg ? 32 : 16;

  const header = (
    <header className="relative border-b border-[#e5e7eb] bg-white" style={{ paddingInline: pad }}>
      <div className="flex h-14 items-center gap-4">
        <span className="flex shrink-0 items-center gap-1.5 text-[17px] font-extrabold tracking-tight text-[#14532d]">
          <Mountain size={20} aria-hidden="true" /> Trailhead
        </span>
        {showNav && (
          <nav aria-label="Main" className="flex items-center gap-5 text-[14px] font-medium text-[#374151]">
            <a href="#shop" onClick={(e) => e.preventDefault()} className="hover:text-[#14532d]">
              Shop
            </a>
            {buggy ? (
              // BUG 3: hover-only menu, no click/tap handler, not focusable
              <span
                className="relative flex cursor-default items-center gap-0.5"
                onMouseEnter={() => !touch && setCatOpen(true)}
                onMouseLeave={() => !touch && setCatOpen(false)}
              >
                Categories <ChevronDown size={14} aria-hidden="true" />
                {catOpen && <CategoryMenu />}
              </span>
            ) : (
              <span className="relative">
                <button
                  type="button"
                  aria-expanded={catOpen}
                  onClick={() => setCatOpen((o) => !o)}
                  className="flex items-center gap-0.5 rounded hover:text-[#14532d] focus-visible:outline-2 focus-visible:outline-[#14532d]"
                >
                  Categories <ChevronDown size={14} aria-hidden="true" />
                </button>
                {catOpen && <CategoryMenu />}
              </span>
            )}
            <a href="#sale" onClick={(e) => e.preventDefault()} className="text-[#b91c1c]">
              Sale
            </a>
            <a href="#help" onClick={(e) => e.preventDefault()} className="hover:text-[#14532d]">
              Help
            </a>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {lg && (
            <span className="flex h-9 w-56 items-center gap-2 rounded-full bg-[#f3f4f6] px-3 text-[13px] text-[#6b7280]">
              <Search size={15} aria-hidden="true" /> Search gear…
            </span>
          )}
          <span className="relative grid size-10 place-items-center text-[#111827]" aria-label={`Cart, ${cart} items`} role="img">
            <ShoppingBag size={20} aria-hidden="true" />
            {cart > 0 && <span className="absolute top-1 right-0.5 grid size-4 place-items-center rounded-full bg-[#ea580c] text-[10px] font-bold text-white">{cart}</span>}
          </span>
          {showBurger && (
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-lg text-[#111827] hover:bg-[#f3f4f6]"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
      {showBurger && menuOpen && (
        <nav aria-label="Main" className="absolute inset-x-0 top-full z-30 border-b border-[#e5e7eb] bg-white px-4 py-2 shadow-lg">
          {['Shop', 'Sale', 'Help'].map((l) => (
            <a key={l} href={`#${l}`} onClick={(e) => e.preventDefault()} className="block border-b border-[#f3f4f6] py-3 text-[15px] font-medium">
              {l}
            </a>
          ))}
          <p className="pt-3 pb-1 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">Categories</p>
          <div className="grid grid-cols-2 gap-x-3">
            {categories.map((c) => (
              <a key={c} href={`#${c}`} onClick={(e) => e.preventDefault()} className="py-2 text-[14px] text-[#374151]">
                {c}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );

  return (
    <div className="min-h-full bg-white text-[#111827]" style={{ fontSize: 15 }}>
      {tallBanner ? (
        <div className="sticky top-0 z-20">
          <div className="bg-[#fbbf24] px-4 py-3 text-[13px] leading-snug text-[#451a03]">
            <p className="font-bold">🍂 Autumn Sale is ON!</p>
            <p className="mt-1">Up to 40% off tents and backpacks. Free shipping on orders over $75. Members get an extra 10% off: sign up today and use code TRAIL40 at checkout.</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-[#451a03] px-3 py-1.5 text-[12px] font-semibold text-white">Get the app</span>
              <span className="text-[12px]">Ends in 2d 14h</span>
            </div>
            <p className="mt-2 text-[12px]">Download the Trailhead app for exclusive deals and early access to new gear.</p>
          </div>
          {header}
        </div>
      ) : (
        <>
          <p className="bg-[#14532d] px-4 py-1.5 text-center text-[12px] text-white">Autumn Sale: up to 40% off · Free shipping over $75</p>
          <div className="sticky top-0 z-20">{header}</div>
        </>
      )}

      {/* Hero */}
      <section style={{ paddingInline: pad }} className="py-4">
        {!md ? (
          <div>
            <div className="h-[240px] overflow-hidden rounded-2xl">
              <HeroArt />
            </div>
            <HeroText size={sm ? 28 : 24} />
          </div>
        ) : overlapHero ? (
          <div className="relative h-[300px]">
            <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-2xl">
              <HeroArt />
            </div>
            <div className="relative z-10 w-[600px] pt-6">
              <HeroText size={44} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <div className="min-w-0 flex-1">
              <HeroText size={lg ? 40 : 32} />
            </div>
            <div className="w-[45%] shrink-0 overflow-hidden rounded-2xl" style={{ aspectRatio: '4 / 3' }}>
              <HeroArt />
            </div>
          </div>
        )}
      </section>

      {/* Products */}
      <section style={{ paddingInline: pad }} className="py-4" id="shop">
        <h2 className="mb-3 text-[19px] font-bold">Bestsellers</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {products.slice(0, lg ? 8 : 6).map((p) => (
            <div key={p.name} className="min-w-0 rounded-xl border border-[#e5e7eb] p-2">
              <div
                className={`overflow-hidden rounded-lg ${stretched ? 'h-[120px] p-2' : 'grid place-items-center'}`}
                style={{ background: p.bg, color: p.fg, aspectRatio: stretched ? undefined : '1 / 1' }}
              >
                {stretched ? (
                  <p.icon preserveAspectRatio="none" strokeWidth={1.4} className="block h-full w-full" aria-hidden="true" />
                ) : (
                  <p.icon strokeWidth={1.4} className="h-1/2 w-1/2" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 truncate text-[13px] font-semibold">{p.name}</p>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="text-[14px] font-bold">{p.price}</span>
                <button type="button" onClick={() => setCart((c) => c + 1)} className="rounded-md bg-[#14532d] px-2.5 py-1 text-[12px] font-semibold text-white">
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ paddingInline: pad }} className="py-4">
        <h2 className="mb-3 text-[19px] font-bold">Compare tents</h2>
        {buggy || sm ? (
          <table className={`w-full border-collapse text-left text-[13px] ${buggy ? 'min-w-[600px]' : ''}`}>
            <thead>
              <tr className="border-b-2 border-[#e5e7eb] text-[12px] text-[#6b7280]">
                {['Model', 'Sleeps', 'Weight', 'Season', 'Price'].map((h) => (
                  <th key={h} className="py-2 pr-3 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tents.map((r) => (
                <tr key={r[0]} className="border-b border-[#f3f4f6]">
                  {r.map((c, i) => (
                    <td key={i} className={`py-2 pr-3 whitespace-nowrap ${i === 0 || i === 4 ? 'font-semibold' : ''}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="space-y-2">
            {tents.map((r) => (
              <div key={r[0]} className="rounded-xl border border-[#e5e7eb] p-3 text-[13px]">
                <p className="flex justify-between font-semibold">
                  <span>{r[0]}</span>
                  <span>{r[4]}</span>
                </p>
                <p className="mt-0.5 text-[#6b7280]">
                  Sleeps {r[1]} · {r[2]} · {r[3]}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-4 bg-[#f9fafb] py-6 text-[13px] text-[#4b5563]" style={{ paddingInline: pad }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: md ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)' }}>
          <div>
            <p className="font-semibold text-[#111827]">Trailhead</p>
            <p>Gear for every trail since 2009.</p>
          </div>
          <div>
            <p className="font-semibold text-[#111827]">Help</p>
            <p>Shipping · Returns · Size guide</p>
          </div>
          <div>
            <p className="font-semibold text-[#111827]">Stores</p>
            <p>Find a store near you</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CategoryMenu() {
  return (
    <div className="absolute top-full left-0 z-30 w-48 pt-2">
      <ul className="rounded-xl border border-[#e5e7eb] bg-white p-1.5 text-[14px] shadow-xl">
        {categories.map((c) => (
          <li key={c}>
            <a href={`#${c}`} onClick={(e) => e.preventDefault()} className="block rounded-lg px-3 py-2 text-[#374151] hover:bg-[#f3f4f6]">
              {c}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroText({ size }: { size: number }) {
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold tracking-wide text-[#ea580c] uppercase">Autumn collection</p>
      <h2 className="mt-1 leading-tight font-extrabold tracking-tight" style={{ fontSize: size }}>
        Sleep under a sky full of stars
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#4b5563]">Lightweight tents and packs for your next weekend in the mountains. Up to 40% off this week.</p>
      <button type="button" className="mt-4 rounded-xl bg-[#ea580c] px-5 py-3 text-[15px] font-semibold text-white" data-cta>
        Shop the sale
      </button>
    </div>
  );
}
