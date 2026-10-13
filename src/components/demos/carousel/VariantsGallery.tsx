import { useRef, type ReactNode } from 'react';
import { Backpack, ChevronLeft, ChevronRight, Coffee, Heart, Pizza, Salad, Soup, Star } from 'lucide-react';
import { Carousel } from './Carousel';
import { PROMOS, SlideArt } from './SlideArt';

function Card({ title, platform, note, chips, children }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-[300px] place-items-center bg-[#e9ebf2] px-3 py-5" style={{ colorScheme: 'light' }}>
        <div className="w-full max-w-[300px] min-w-0 overflow-hidden rounded-[22px] border border-black/10 bg-white text-[#0e1120] shadow-sm">{children}</div>
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

const SHOTS = [
  { label: 'Front', bg: '#e0f2fe', fg: '#0369a1' },
  { label: 'Side', bg: '#dcfce7', fg: '#15803d' },
  { label: 'Back', bg: '#fef3c7', fg: '#b45309' },
  { label: 'Detail: zip', bg: '#fce7f3', fg: '#be185d' },
  { label: 'On a hike', bg: '#ede9fe', fg: '#6d28d9' },
];

function HeroDemo() {
  return (
    <div className="p-3">
      <p className="mb-2 text-[15px] font-bold">ShopNow</p>
      <Carousel label="Featured offers" count={PROMOS.length} loop autoplay interval={4000} slideName={(i) => PROMOS[i].title} renderSlide={(i) => <SlideArt promo={PROMOS[i]} id={`gal-hero-${i}`} />} />
    </div>
  );
}

function GalleryDemo() {
  return (
    <div className="p-3">
      <Carousel
        label="Product photos"
        count={SHOTS.length}
        arrows={false}
        counter
        aspect="1 / 1"
        dotColor="#0e1120"
        slideName={(i) => SHOTS[i].label}
        renderSlide={(i) => (
          <div className="grid h-full place-items-center" style={{ background: SHOTS[i].bg, color: SHOTS[i].fg }}>
            <div className="flex flex-col items-center gap-2">
              <Backpack size={96} strokeWidth={1.3} style={{ transform: i === 1 ? 'scaleX(-1) rotate(-8deg)' : i === 3 ? 'scale(1.4)' : undefined }} />
              <span className="text-[12px] font-medium">{SHOTS[i].label}</span>
            </div>
          </div>
        )}
      />
      <p className="mt-1 text-[15px] font-semibold">Ridge Day pack 22 L</p>
      <p className="text-[13px] text-black/60">€79.00</p>
    </div>
  );
}

const DISHES = [
  { name: 'Pizza Roma', meta: '25 min · €1.99', icon: Pizza, bg: '#fee2e2', fg: '#b91c1c' },
  { name: 'Green Bowl', meta: '15 min · Free', icon: Salad, bg: '#dcfce7', fg: '#15803d' },
  { name: 'Pho House', meta: '30 min · €2.49', icon: Soup, bg: '#fef3c7', fg: '#b45309' },
  { name: 'Café Mila', meta: '10 min · Free', icon: Coffee, bg: '#e0e7ff', fg: '#4338ca' },
];

function RowDemo() {
  const row = useRef<HTMLUListElement>(null);
  const by = (d: number) => row.current?.scrollBy({ left: d * (row.current.clientWidth * 0.7), behavior: 'smooth' });
  return (
    <div className="py-3">
      <div className="flex items-center justify-between px-3">
        <p className="text-[15px] font-bold">Popular near you</p>
        <span className="flex gap-1">
          <button type="button" onClick={() => by(-1)} aria-label="Scroll left" className="grid size-8 place-items-center rounded-full border border-black/15 hover:bg-black/5">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => by(1)} aria-label="Scroll right" className="grid size-8 place-items-center rounded-full border border-black/15 hover:bg-black/5">
            <ChevronRight size={16} />
          </button>
        </span>
      </div>
      <ul ref={row} aria-label="Popular restaurants" className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-3 px-3 pb-2" style={{ scrollbarWidth: 'none' }}>
        {DISHES.map((d) => (
          <li key={d.name} className="w-[68%] shrink-0 snap-start">
            <a href="#popular" onClick={(e) => e.preventDefault()} className="block overflow-hidden rounded-xl border border-black/10">
              <span className="relative grid h-24 place-items-center" style={{ background: d.bg, color: d.fg }}>
                <d.icon size={40} strokeWidth={1.5} />
                <Heart size={16} className="absolute top-2 right-2 text-black/50" />
              </span>
              <span className="block px-2 pt-1.5 text-[13px] font-semibold">{d.name}</span>
              <span className="flex items-center gap-1 px-2 pb-2 text-[11px] text-black/55">
                <Star size={11} className="fill-current" /> 4.{(d.name.length % 4) + 5} · {d.meta}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card
        title="Hero carousel"
        platform="Web · App"
        note="Rotating promo banners at the top of a home page. Autoplays, so it needs a Pause button and must stop on hover and focus. Slides loop."
        chips={['Autoplay', 'Pause button', 'Loop', 'Arrows + dots']}
      >
        <HeroDemo />
      </Card>
      <Card
        title="Product image gallery"
        platform="iOS · Android"
        note="Swipe through photos of one product. No autoplay, no loop: it has a clear start and end. A counter (2 / 5) and page dots show the position."
        chips={['Swipe', 'Counter', 'No loop', 'Square images']}
      >
        <GalleryDemo />
      </Card>
      <Card
        title="Content row"
        platform="Material 3 · Web"
        note="A horizontally scrolling row of cards. The next card peeks in to show there is more. Mouse users need arrow buttons; touch users just swipe."
        chips={['Scroll snap', 'Peek', 'Arrows for mouse', 'Real links']}
      >
        <RowDemo />
      </Card>
    </div>
  );
}
