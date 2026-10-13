import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CheckCircle2, Heart, TriangleAlert } from 'lucide-react';
import { Price, ProductImage, Stars, products } from './Cards';

/**
 * "Who gets the tap?" — three ways to build the same product card.
 * The learner taps parts of the card and sees what the app does and what a screen reader announces.
 */

type Mode = 'nested' | 'many' | 'single';

const p = products[0];

const modes: { id: Mode; label: string; good: boolean; summary: string; stops: number; reader: string[] }[] = [
  {
    id: 'nested',
    label: 'Whole card is a link',
    good: false,
    summary:
      'The entire card is one big clickable element with the heart and Add to cart inside it. A tap on the heart also "bubbles up" to the card, so the product page opens too. In HTML, a button inside a link is even invalid.',
    stops: 3,
    reader: [
      `"${p.name}, 4.6 stars, 182 reviews, €89.00, €119.00, -25%, Add to cart, link"`,
      '"button" (the heart has no label)',
      '"Add to cart, button"',
    ],
  },
  {
    id: 'many',
    label: 'Every part is a link',
    good: false,
    summary:
      'The image, the title and a "View" link all go to the same page. Taps work, but keyboard and screen reader users meet the same destination three times, and the heart has no label.',
    stops: 5,
    reader: ['"IMG_4021.jpg, link"', `"${p.name}, link"`, '"View, link"', '"button"', '"Add to cart, button"'],
  },
  {
    id: 'single',
    label: 'One link per card',
    good: true,
    summary:
      'Only the title is a link, but its clickable area is stretched over the whole card. The heart and Add to cart are separate buttons layered on top, so they never open the product. The image is decorative.',
    stops: 3,
    reader: [`"${p.name}, link"`, `"Save ${p.name} to favorites, toggle button, not selected"`, '"Add to cart, button"'],
  },
];

function activate(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };
}

export default function TapTargets() {
  const [mode, setMode] = useState<Mode>('nested');
  const [fav, setFav] = useState(false);
  const [events, setEvents] = useState<{ id: number; text: string; bad?: boolean }[]>([]);
  const nextId = useRef(1);
  const pending = useRef<string[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const m = modes.find((x) => x.id === mode)!;

  /** Collects everything that happens during one tap, then shows it as a single log row. */
  const record = (text: string) => {
    pending.current.push(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const all = pending.current;
      pending.current = [];
      const id = nextId.current++;
      setEvents((l) => [{ id, text: all.join(' + '), bad: all.length > 1 }, ...l].slice(0, 4));
    }, 30);
  };

  const toggleFav = () => {
    setFav((f) => !f);
    record('♥ favorite toggled');
  };
  const open = () => record('→ product page opened');
  const add = () => record('+ added to cart');

  const switchMode = (id: Mode) => {
    setMode(id);
    setEvents([]);
    setFav(false);
  };

  const shell = 'relative w-[190px] overflow-hidden rounded-2xl bg-white text-[#14161f] shadow-[0_1px_3px_rgba(16,18,35,.15)]';
  const heartCls = 'absolute top-1.5 right-1.5 z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm';
  const heartIcon = <Heart size={16} className={fav ? 'fill-[#e11d48] text-[#e11d48]' : ''} />;
  const addCls = 'mt-2 grid h-9 w-full place-items-center rounded-full bg-[#14161f] text-[12px] font-semibold text-white';
  const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]';

  let card: ReactNode;
  if (mode === 'nested') {
    card = (
      <div role="link" tabIndex={0} onClick={open} onKeyDown={activate(open)} className={`${shell} cursor-pointer ${focus}`}>
        <div className="relative">
          <ProductImage p={p} ratio={1} />
          <span className="absolute top-2 left-2 rounded-md bg-[#c0262d] px-1.5 py-0.5 text-[10px] font-bold text-white">-25%</span>
          <span role="button" tabIndex={0} onClick={toggleFav} onKeyDown={activate(toggleFav)} className={`${heartCls} cursor-pointer ${focus}`}>
            {heartIcon}
          </span>
        </div>
        <div className="space-y-1 p-2.5">
          <p className="text-[13px] font-semibold">{p.name}</p>
          <Stars rating={p.rating} reviews={p.reviews} />
          <Price p={p} />
          <span role="button" tabIndex={0} onClick={add} onKeyDown={activate(add)} className={`${addCls} cursor-pointer ${focus}`}>
            Add to cart
          </span>
        </div>
      </div>
    );
  } else if (mode === 'many') {
    card = (
      <div className={shell}>
        <div className="relative">
          <button type="button" onClick={open} className={`block w-full ${focus} focus-visible:-outline-offset-2`}>
            <ProductImage p={p} ratio={1} />
          </button>
          <span className="absolute top-2 left-2 rounded-md bg-[#c0262d] px-1.5 py-0.5 text-[10px] font-bold text-white">-25%</span>
          <button type="button" onClick={toggleFav} className={`${heartCls} ${focus}`}>
            {heartIcon}
          </button>
        </div>
        <div className="space-y-1 p-2.5">
          <button type="button" onClick={open} className={`block text-left text-[13px] font-semibold underline-offset-2 hover:underline ${focus}`}>
            {p.name}
          </button>
          <Stars rating={p.rating} reviews={p.reviews} />
          <div className="flex items-center justify-between gap-2">
            <Price p={p} />
            <button type="button" onClick={open} className={`text-[12px] font-semibold text-[#1a56db] ${focus}`}>
              View
            </button>
          </div>
          <button type="button" onClick={add} className={`${addCls} ${focus}`}>
            Add to cart
          </button>
        </div>
      </div>
    );
  } else {
    card = (
      <article className={shell}>
        <div className="relative">
          <ProductImage p={p} ratio={1} />
          <span className="absolute top-2 left-2 rounded-md bg-[#c0262d] px-1.5 py-0.5 text-[10px] font-bold text-white">-25%</span>
          <button type="button" onClick={toggleFav} aria-pressed={fav} aria-label={`Save ${p.name} to favorites`} className={`${heartCls} ${focus}`}>
            {heartIcon}
          </button>
        </div>
        <div className="space-y-1 p-2.5">
          <h4 className="text-[13px] font-semibold">
            <button
              type="button"
              onClick={open}
              className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[#2563eb]"
            >
              {p.name}
            </button>
          </h4>
          <Stars rating={p.rating} reviews={p.reviews} />
          <Price p={p} />
          <button type="button" onClick={add} className={`relative z-10 ${addCls} ${focus}`}>
            Add to cart
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div role="radiogroup" aria-label="Card implementation" className="flex flex-wrap gap-2 border-b border-line p-3">
        {modes.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={mode === x.id}
            onClick={() => switchMode(x.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${mode === x.id ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted hover:text-fg'}`}
          >
            {x.good ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />} {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-[auto_1fr]">
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className="grid w-full place-items-center rounded-2xl bg-[#f2f2f7] p-5" style={{ colorScheme: 'light' }}>
            {card}
          </div>
          <p className="text-center text-xs text-faint">Tap the heart, the photo, the title and Add to cart. Try Tab too.</p>
        </div>
        <div className="min-w-0 space-y-4">
          <p className="flex gap-2 text-sm leading-relaxed">
            <span className={`mt-0.5 shrink-0 ${m.good ? 'text-ok' : 'text-danger'}`}>{m.good ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}</span>
            <span>{m.summary}</span>
          </p>
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">What happened on tap</p>
            <ul aria-live="polite" className="min-h-[5.5rem] space-y-1 rounded-xl bg-subtle p-3 font-mono text-[12px]">
              {events.length === 0 && <li className="text-faint">Nothing yet…</li>}
              {events.map((e) => (
                <li key={e.id} className={e.bad ? 'text-danger' : 'text-fg'}>
                  {e.text}
                  {e.bad && <span className="font-sans"> ← two actions from one tap!</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              Screen reader, swiping through the card · {m.stops} stops
            </p>
            <ol className="space-y-1 rounded-xl bg-[#0e1120] p-3 font-mono text-[12px] text-[#c9cde0]">
              {m.reader.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-white/35">{i + 1}.</span>
                  <span className="min-w-0 break-words">{r}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
