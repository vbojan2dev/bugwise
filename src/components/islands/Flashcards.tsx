import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle } from 'lucide-react';

interface Card {
  id: string;
  question: string;
  short: string;
  category: string;
}

export default function Flashcards({ cards }: { cards: Card[] }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[order[pos]];

  const go = (d: number) => {
    setFlipped(false);
    setPos((p) => (p + d + cards.length) % cards.length);
  };
  const shuffle = () => {
    setOrder((o) => [...o].sort(() => Math.random() - 0.5));
    setPos(0);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const progress = useMemo(() => ((pos + 1) / cards.length) * 100, [pos, cards.length]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <span>
          Card <strong className="text-fg">{pos + 1}</strong> of {cards.length}
        </span>
        <button type="button" onClick={shuffle} className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-subtle hover:text-fg">
          <Shuffle size={15} /> Shuffle
        </button>
      </div>
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-subtle">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group block w-full [perspective:1600px]"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <div
          className="relative h-72 w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          <div className="absolute inset-0 flex flex-col rounded-3xl border border-line bg-surface p-8 shadow-float [backface-visibility:hidden]">
            <span className="text-xs font-semibold tracking-wider text-brand uppercase">{card.category.replace('-', ' ')}</span>
            <p className="m-auto text-center text-xl leading-snug font-semibold text-balance sm:text-2xl">{card.question}</p>
            <span className="text-center text-xs text-faint">Tap to reveal the answer</span>
          </div>
          <div
            className="absolute inset-0 flex flex-col rounded-3xl border border-brand/30 p-8 shadow-float [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ background: 'linear-gradient(160deg, var(--brand-soft), var(--surface) 70%)' }}
          >
            <span className="text-xs font-semibold tracking-wider text-brand uppercase">Answer</span>
            <p className="m-auto text-center text-lg leading-relaxed text-pretty">{card.short}</p>
            <a
              href={`#${card.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-center text-xs font-medium text-brand hover:underline"
            >
              Read the full answer ↓
            </a>
          </div>
        </div>
      </button>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full border border-line hover:bg-subtle" aria-label="Previous card">
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg hover:opacity-90"
        >
          <RotateCcw size={15} /> Flip
        </button>
        <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full border border-line hover:bg-subtle" aria-label="Next card">
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-faint">Tip: use ← and → keys</p>
    </div>
  );
}
