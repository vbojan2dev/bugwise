import { Bike, Clock, Heart, Star, Utensils } from 'lucide-react';

const parts = [
  { n: 1, name: 'Container', text: 'The surface that groups everything about one item. Its edge comes from a shadow (elevated), a fill color (filled) or a border (outlined).' },
  { n: 2, name: 'Media', text: 'A photo, illustration or map. Needs a fixed aspect ratio and a fallback when the image is missing or slow.' },
  { n: 3, name: 'Badge / overlay', text: 'Short status on top of the media: "-20%", "Sold out", "New", "Closed". Must stay readable on any photo.' },
  { n: 4, name: 'Title', text: 'The name of the item. Usually also the link to the detail page. Long titles wrap or truncate in a controlled way.' },
  { n: 5, name: 'Supporting text & metadata', text: 'Rating, cuisine, delivery time, price, author, date. Short facts that help users choose without opening the card.' },
  { n: 6, name: 'Actions (optional)', text: 'Secondary actions like Save or Add to cart. Separate, clearly sized targets that do not also open the card.' },
];

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute z-20 grid size-6 place-items-center rounded-full bg-[#5b4bff] text-xs font-bold text-white ring-4 ring-[#5b4bff]/25 ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1fr_1.1fr]">
      <div className="min-w-0 rounded-2xl bg-[#f2f2f7] px-4 py-8">
        <div
          role="img"
          aria-label="A restaurant card from a food delivery app: a photo with a 'Free delivery' badge and a heart button, the title 'Sakura Sushi Bar', a rating of 4.7, Japanese cuisine, 20 to 30 minutes delivery and a 1.99 euro fee, with numbered markers"
          className="relative mx-auto max-w-[16rem] rounded-2xl bg-white text-[#14161f] shadow-[0_2px_8px_rgba(16,18,35,.12)]"
        >
          <Marker n={1} className="-top-3 -left-3" />
          <div aria-hidden="true" className="relative overflow-hidden rounded-t-2xl">
            <div className="grid aspect-[16/9] place-items-center bg-[linear-gradient(135deg,#fda4af,#f97316)]">
              <Utensils size={34} strokeWidth={1.5} className="text-white/90" />
            </div>
            <span className="absolute top-2 left-2 rounded-md bg-[#0b7a43] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">Free delivery</span>
            <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90">
              <Heart size={15} />
            </span>
          </div>
          <Marker n={2} className="top-[104px] left-[62%]" />
          <Marker n={3} className="top-9 left-6" />
          <Marker n={6} className="top-10 -right-3" />
          <div aria-hidden="true" className="relative space-y-1 p-3">
            <p className="relative text-[14px] font-semibold">
              Sakura Sushi Bar
              <Marker n={4} className="-top-1 right-0" />
            </p>
            <p className="relative flex items-center gap-1 text-[11px] text-[#5b6070]">
              <Star size={11} className="fill-[#f5a524] text-[#f5a524]" /> 4.7 (1.2k) · Japanese · €€
              <Marker n={5} className="top-3 -right-1" />
            </p>
            <p className="flex items-center gap-2 text-[11px] text-[#5b6070]">
              <span className="flex items-center gap-1">
                <Clock size={11} /> 20–30 min
              </span>
              <span className="flex items-center gap-1">
                <Bike size={11} /> €1.99
              </span>
            </p>
          </div>
        </div>
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
