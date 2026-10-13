import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { AccordionItem } from './Accordion';

function Card({ title, platform, note, chips, children, bg = '#e9ebf2' }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-[300px] place-items-center px-4 py-5" style={{ background: bg, colorScheme: 'light' }}>
        <div className="w-full max-w-[300px]">{children}</div>
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

/* 1. Web FAQ, one section open at a time */
const FAQ = [
  { q: 'When will my order arrive?', a: 'Standard delivery takes 2–4 working days. You get a tracking link by email as soon as the parcel leaves our warehouse.' },
  { q: 'Can I change my address?', a: 'Yes, until the order is packed. Go to My orders, open the order and tap Change address.' },
  { q: 'How do I return an item?', a: 'You have 30 days. Start a return in My orders and print the free label, or show the QR code at a parcel shop.' },
];
function WebFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">
      <p className="px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-[#5a5f70] uppercase">Help · Orders</p>
      <div className="divide-y divide-black/10">
        {FAQ.map((f, i) => (
          <AccordionItem key={f.q} title={f.q} open={open === i} onOpenChange={(o) => setOpen(o ? i : null)} tone="compact">
            {f.a}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

/* 2. Native <details>/<summary> with a shared name = exclusive group */
function NativeDetails() {
  const group = { name: 'gal-shipping' };
  const rows = [
    { s: 'Shipping', d: 'Free over €50. Express (next day) €6.90.' },
    { s: 'Returns', d: '30 days, free label. Refund within 5 days of arrival.' },
    { s: 'Size & fit', d: 'Runs small. If you are between sizes, pick the larger one.' },
  ];
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3 text-[14px] text-[#0e1120] shadow-sm">
      <p className="mb-2 text-[15px] font-bold">Trail runner 2 · €129</p>
      {rows.map((r) => (
        <details key={r.s} {...group} className="border-t border-black/10 py-1 [&[open]>summary]:text-[#2f6bff]">
          <summary className="cursor-pointer rounded px-1 py-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff]">{r.s}</summary>
          <p className="px-1 pb-2 text-[13px] leading-relaxed text-[#3c4150]">{r.d}</p>
        </details>
      ))}
    </div>
  );
}

/* 3. iOS: disclosure group in an inset grouped list */
function IOSDisclosure() {
  const [items, setItems] = useState(true);
  const [addr, setAddr] = useState(false);
  const row = 'flex min-h-11 items-center gap-2 px-4 text-[15px]';
  return (
    <div className="rounded-[20px] bg-[#f2f2f7] p-3 text-black" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <p className="px-1 pb-2 text-[22px] font-bold">Order #4821</p>
      <p className="px-4 pb-1 text-[12px] text-[#6d6d72] uppercase">Details</p>
      <div className="overflow-hidden rounded-[10px] bg-white">
        <div className={`${row} border-b border-black/10`}>
          <span className="flex-1">Status</span>
          <span className="text-[#8a8a8e]">Delivered</span>
        </div>
        <button type="button" aria-expanded={items} onClick={() => setItems((v) => !v)} className={`${row} w-full text-left outline-none focus-visible:bg-black/5`}>
          <span className="flex-1">Items</span>
          <span className="text-[#8a8a8e]">3</span>
          <ChevronRight size={16} aria-hidden="true" className="text-[#007aff] transition-transform duration-200" style={{ transform: items ? 'rotate(90deg)' : 'none' }} />
        </button>
        {items && (
          <ul className="border-t border-black/10 pl-8 text-[14px]">
            {['Desk lamp · €39.90', 'LED bulb ×2 · €15.00', 'Gift wrap · €0.00'].map((x) => (
              <li key={x} className="flex min-h-10 items-center border-b border-black/10 pr-4 last:border-0">
                {x}
              </li>
            ))}
          </ul>
        )}
        <button type="button" aria-expanded={addr} onClick={() => setAddr((v) => !v)} className={`${row} w-full border-t border-black/10 text-left outline-none focus-visible:bg-black/5`}>
          <span className="flex-1">Delivery address</span>
          <ChevronRight size={16} aria-hidden="true" className="text-[#007aff] transition-transform duration-200" style={{ transform: addr ? 'rotate(90deg)' : 'none' }} />
        </button>
        {addr && <p className="border-t border-black/10 py-2.5 pr-4 pl-8 text-[14px]">Anna Berg, Lindenstraße 12, 10115 Berlin</p>}
      </div>
    </div>
  );
}

/* 4. Android: Material 3 style expandable card */
function M3Expandable() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] bg-[#fef7ff] p-3 text-[#1d1b20]" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <div className="rounded-[12px] bg-[#f3edf7]">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[72px] w-full items-center gap-3 rounded-[12px] px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#6750a4]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eaddff] text-[#21005d]">
            <Package size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px]">Order details</span>
            <span className="block text-[13px] text-[#49454f]">3 items · €54.90</span>
          </span>
          <span className="grid size-12 shrink-0 place-items-center" aria-hidden="true">
            <ChevronDown size={22} className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
          </span>
        </button>
        {open && (
          <ul className="px-4 pb-3 text-[14px]">
            {['Desk lamp', 'LED bulb ×2', 'Gift wrap'].map((x) => (
              <li key={x} className="border-t border-[#cac4d0] py-2.5">
                {x}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        title="FAQ accordion"
        platform="Web"
        note="One question open at a time: opening one closes the others. The whole row is a button inside a heading."
        chips={['Single open', 'aria-expanded', 'Heading + button']}
      >
        <WebFaq />
      </Card>
      <Card
        title="Native details / summary"
        platform="Web"
        note="Built into HTML: keyboard, state and screen reader support for free. A shared name attribute makes the group exclusive."
        chips={['<details>', 'name = exclusive', 'Find in page']}
      >
        <NativeDetails />
      </Card>
      <Card
        title="Disclosure group"
        platform="iOS"
        note="A row with a chevron that turns from right to down. Common in Settings-style lists and sidebars, usually multiple open."
        chips={['Chevron → down', 'Inset list', 'VoiceOver']}
      >
        <IOSDisclosure />
      </Card>
      <Card
        title="Expandable card"
        platform="Android"
        note="Material 3 has no dedicated accordion component. Apps build expandable list items or cards with an expand icon."
        chips={['Expand icon', '48 dp target', 'TalkBack']}
      >
        <M3Expandable />
      </Card>
    </div>
  );
}
