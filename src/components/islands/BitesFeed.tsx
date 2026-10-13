import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flame, Lightbulb, MessagesSquare, RotateCcw, Sparkles, Zap } from 'lucide-react';
import {
  buildPools,
  cardsDueCount,
  grade,
  loadState,
  nextBatch,
  poolWeights,
  streak,
  today,
  type BiteCard,
  type BitePage,
  type BitesCatalog,
  type BitesState,
  type Mode,
} from '@/lib/bites';
import { load as loadProgress } from '@/lib/progress';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const href = (p: string) => base + p;

type Slide =
  | { kind: 'card'; key: string; card: BiteCard }
  | { kind: 'intro'; key: string }
  | { kind: 'end'; key: string }
  | { kind: 'locked'; key: string };

const MODES: { id: Mode; label: string }[] = [
  { id: 'mix', label: 'Mix' },
  { id: 'mine', label: 'My lessons' },
  { id: 'terms', label: 'Terms' },
  { id: 'interview', label: 'Interview' },
];

const TYPE_LABEL: Record<BiteCard['body']['type'], string> = {
  quiz: 'Quick quiz',
  truefalse: 'True or false?',
  thisorthat: 'This or that?',
  spotbug: 'Spot the bug',
  flip: 'Flashcard',
  tip: 'Pro tip',
  term: 'Glossary',
  interview: 'Interview question',
  teaser: 'Coming up next',
};

// ---------- Small building blocks ----------

function Shell({ page, type, children, footer }: { page?: BitePage; type: BiteCard['body']['type']; children: ReactNode; footer?: ReactNode }) {
  const accent = page?.accent ?? (type === 'interview' ? '#f97316' : '#64748b');
  return (
    <article
      className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-float"
      style={{ ['--accent' as string]: accent }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-25" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${accent}, transparent 70%)` }} />
      <header className="relative flex items-center gap-2 px-5 pt-5 text-xs font-semibold">
        <span className="rounded-full px-2.5 py-1 text-white" style={{ background: `color-mix(in oklab, ${accent} 62%, black)` }}>
          {TYPE_LABEL[type]}
        </span>
        {page && <span className="truncate text-muted">{page.sectionTitle}</span>}
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4 pb-5">{children}</div>
      {footer && <footer className="relative border-t border-line px-5 py-3">{footer}</footer>}
    </article>
  );
}

function SourceLink({ page, label = 'Open lesson' }: { page?: BitePage; label?: string }) {
  if (!page) return null;
  return (
    <a href={href(page.href)} className="flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <BookOpen size={14} className="shrink-0" />
      <span className="truncate">{page.title}</span>
      <span className="ml-auto flex shrink-0 items-center gap-0.5 font-medium text-brand">
        {label} <ChevronRight size={14} />
      </span>
    </a>
  );
}

function Explain({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <div className={`mt-4 rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${ok === undefined ? 'bg-subtle' : ok ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
      {ok !== undefined && <p className={`mb-1 font-semibold ${ok ? 'text-ok' : 'text-danger'}`}>{ok ? 'Correct!' : 'Not quite.'}</p>}
      <p className="text-fg/90">{children}</p>
    </div>
  );
}

function SelfGrade({ onGrade, graded }: { onGrade: (knew: boolean) => void; graded: boolean | null }) {
  if (graded !== null)
    return <p className="mt-4 text-center text-sm text-muted">{graded ? '✓ Saved. You’ll see it again later.' : '↻ You’ll see it again soon.'}</p>;
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onGrade(false)} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line font-medium hover:bg-subtle">
        <RotateCcw size={16} /> Again
      </button>
      <button type="button" onClick={() => onGrade(true)} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ok font-medium text-white hover:opacity-90">
        <Check size={17} strokeWidth={3} /> Got it
      </button>
    </div>
  );
}

function NextHint({ onNext }: { onNext: () => void }) {
  return (
    <button type="button" onClick={onNext} className="mx-auto mt-3 flex items-center gap-1 text-sm font-medium text-brand">
      Next <ArrowDown size={15} />
    </button>
  );
}

// ---------- Card renderers ----------

function CardView({ card, page, onGrade, onNext }: { card: BiteCard; page?: BitePage; onGrade: (knew: boolean) => void; onNext: () => void }) {
  const b = card.body;
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | boolean | 'left' | 'right' | null>(null);
  const [graded, setGraded] = useState<boolean | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);

  const gradeOnce = (knew: boolean) => {
    if (graded !== null) return;
    setGraded(knew);
    onGrade(knew);
  };
  const footer = <SourceLink page={page} />;

  if (b.type === 'teaser') {
    return (
      <Shell page={page} type="teaser" footer={null}>
        <p className="text-sm font-semibold text-muted">Next on your path</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight">{page?.title}</h3>
        <p className="mt-3 text-lg leading-relaxed text-fg/90">{b.teaser}</p>
        {b.minutes && <p className="mt-3 text-sm text-faint">About {b.minutes} min in the quick version</p>}
        <a href={page ? href(page.href) : '#'} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-fg font-medium text-bg">
          Start this lesson <ArrowRight size={17} />
        </a>
        <NextHint onNext={onNext} />
      </Shell>
    );
  }

  if (b.type === 'flip' || b.type === 'term' || b.type === 'interview') {
    const front = b.type === 'flip' ? b.front : b.type === 'term' ? b.term : b.question;
    const back = b.type === 'flip' ? b.back : b.short;
    const link =
      b.type === 'term' ? (
        <a href={href(`/glossary/${b.termId}`)} className="flex items-center gap-1 text-sm font-medium text-brand">
          Open in glossary <ChevronRight size={14} />
        </a>
      ) : b.type === 'interview' ? (
        <a href={href(`/interview/${b.questionId}`)} className="flex items-center gap-1 text-sm font-medium text-brand">
          Full model answer <ChevronRight size={14} />
        </a>
      ) : (
        footer
      );
    return (
      <Shell page={page} type={b.type} footer={link}>
        <button type="button" onClick={() => setRevealed(true)} className="flex min-h-[9rem] flex-col justify-center text-left" disabled={revealed}>
          {b.type === 'term' && <p className="mb-1 text-sm font-semibold text-muted">What does this mean?</p>}
          <p className={`font-bold tracking-tight text-balance ${b.type === 'term' ? 'text-3xl' : 'text-2xl leading-snug'}`}>{front}</p>
          {!revealed && <p className="mt-4 text-sm text-faint">Think of your answer, then tap to reveal</p>}
        </button>
        {revealed && (
          <>
            <div className="mt-2 rounded-2xl bg-subtle px-4 py-3">
              <p className="text-lg leading-relaxed">{back}</p>
              {b.type === 'term' && b.example && <p className="mt-2 text-sm leading-relaxed text-muted">In practice: {b.example}</p>}
            </div>
            <p className="mt-4 text-center text-sm text-muted">Did you know it?</p>
            <SelfGrade onGrade={gradeOnce} graded={graded} />
            {graded !== null && <NextHint onNext={onNext} />}
          </>
        )}
      </Shell>
    );
  }

  if (b.type === 'tip') {
    return (
      <Shell page={page} type="tip" footer={footer}>
        <Lightbulb size={28} className="text-warn" />
        <h3 className="mt-3 text-2xl font-bold tracking-tight">{b.title}</h3>
        <p className="mt-3 text-lg leading-relaxed text-fg/90">{b.text}</p>
        {graded === null ? (
          <button type="button" onClick={() => gradeOnce(true)} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-fg font-medium text-bg">
            <Check size={17} strokeWidth={3} /> Noted
          </button>
        ) : (
          <NextHint onNext={onNext} />
        )}
      </Shell>
    );
  }

  if (b.type === 'quiz') {
    return (
      <Shell page={page} type="quiz" footer={footer}>
        <p className="text-xl leading-snug font-bold tracking-tight">{b.q}</p>
        <div className="mt-4 grid gap-2">
          {b.options.map((o, i) => {
            const state = picked === null ? 'idle' : i === b.answer ? 'right' : i === picked ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(i);
                  gradeOnce(i === b.answer);
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  state === 'idle'
                    ? 'border-line hover:border-[var(--accent)]'
                    : state === 'right'
                      ? 'border-ok bg-ok-soft'
                      : state === 'wrong'
                        ? 'border-danger bg-danger-soft'
                        : 'border-line text-faint'
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <Explain ok={picked === b.answer}>{b.explain}</Explain>
            <NextHint onNext={onNext} />
          </>
        )}
      </Shell>
    );
  }

  if (b.type === 'truefalse') {
    return (
      <Shell page={page} type="truefalse" footer={footer}>
        <p className="flex min-h-[7rem] items-center text-2xl leading-snug font-bold tracking-tight text-balance">“{b.statement}”</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const chosen = picked === v;
            const right = picked !== null && v === b.answer;
            return (
              <button
                key={String(v)}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(v);
                  gradeOnce(v === b.answer);
                }}
                className={`h-14 rounded-2xl border text-lg font-semibold transition-colors ${
                  picked === null ? 'border-line hover:border-[var(--accent)]' : right ? 'border-ok bg-ok-soft text-ok' : chosen ? 'border-danger bg-danger-soft text-danger' : 'border-line text-faint'
                }`}
              >
                {v ? 'True' : 'False'}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <Explain ok={picked === b.answer}>{b.explain}</Explain>
            <NextHint onNext={onNext} />
          </>
        )}
      </Shell>
    );
  }

  if (b.type === 'thisorthat') {
    const choose = (side: 'left' | 'right') => {
      if (picked !== null) return;
      setPicked(side);
      gradeOnce(side === b.answer);
    };
    return (
      <Shell page={page} type="thisorthat" footer={footer}>
        <div
          className="select-none [touch-action:pan-y]"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
          onPointerMove={(e) => {
            if (!swipe.current || picked !== null) return;
            const dx = e.clientX - swipe.current.x;
            if (Math.abs(dx) > Math.abs(e.clientY - swipe.current.y)) setDrag(Math.max(-120, Math.min(120, dx)));
          }}
          onPointerUp={() => {
            if (Math.abs(drag) > 70) choose(drag < 0 ? 'left' : 'right');
            swipe.current = null;
            setDrag(0);
          }}
          onPointerCancel={() => {
            swipe.current = null;
            setDrag(0);
          }}
        >
          <div
            className="rounded-2xl border border-line bg-subtle p-5 transition-transform"
            style={{ transform: `translateX(${drag}px) rotate(${drag / 20}deg)`, transitionDuration: drag ? '0ms' : '200ms' }}
          >
            <p className="text-xl leading-snug font-bold tracking-tight text-balance">{b.prompt}</p>
          </div>
          <p className="mt-3 text-center text-xs text-faint">Swipe left or right, or tap a side</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['left', 'right'] as const).map((side) => {
            const right = picked !== null && side === b.answer;
            const chosen = picked === side;
            return (
              <button
                key={side}
                type="button"
                disabled={picked !== null}
                onClick={() => choose(side)}
                className={`flex min-h-14 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center font-semibold transition-colors ${
                  picked === null
                    ? `border-line hover:border-[var(--accent)] ${drag < -30 && side === 'left' ? 'border-[var(--accent)]' : ''} ${drag > 30 && side === 'right' ? 'border-[var(--accent)]' : ''}`
                    : right
                      ? 'border-ok bg-ok-soft text-ok'
                      : chosen
                        ? 'border-danger bg-danger-soft text-danger'
                        : 'border-line text-faint'
                }`}
              >
                {side === 'left' && <ArrowLeft size={16} className="shrink-0" />}
                {side === 'left' ? b.left : b.right}
                {side === 'right' && <ArrowRight size={16} className="shrink-0" />}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <Explain ok={picked === b.answer}>{b.explain}</Explain>
            <NextHint onNext={onNext} />
          </>
        )}
      </Shell>
    );
  }

  // spotbug
  return (
    <Shell page={page} type="spotbug" footer={footer}>
      <p className="text-xl font-bold tracking-tight">{b.question}</p>
      <div className="mx-auto mt-4 w-full max-w-[17rem] rounded-[26px] bg-[#0c0d12] p-2 shadow-soft" style={{ colorScheme: 'light' }}>
        <div className="space-y-1.5 rounded-[20px] bg-white px-4 py-4 text-[0.92rem] text-[#0e1120]">
          {b.screen.map((line, i) => (
            <p key={i} className="rounded-lg bg-[#f2f2f7] px-3 py-2 font-medium">
              {line}
            </p>
          ))}
        </div>
      </div>
      {!revealed ? (
        <button type="button" onClick={() => setRevealed(true)} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-fg font-medium text-bg">
          Reveal the bug
        </button>
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-danger-soft px-4 py-3">
            <p className="font-semibold text-danger">🐞 {b.bug}</p>
            <p className="mt-1 leading-relaxed text-fg/90">{b.explain}</p>
          </div>
          <p className="mt-4 text-center text-sm text-muted">Did you spot it?</p>
          <SelfGrade onGrade={gradeOnce} graded={graded} />
          {graded !== null && <NextHint onNext={onNext} />}
        </>
      )}
    </Shell>
  );
}

// ---------- Feed ----------

export default function BitesFeed() {
  const [catalog, setCatalog] = useState<BitesCatalog | null>(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<Mode>('mix');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [state, setState] = useState<BitesState>({ cards: {}, days: {} });
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const shown = useRef(new Set<string>());
  const exhausted = useRef(false);
  const uid = useRef(0);

  const pagesByKey = useMemo(() => new Map((catalog?.pages ?? []).map((p) => [p.key, p])), [catalog]);
  const completedCount = useMemo(() => (catalog ? catalog.pages.filter((p) => loadProgress().completed[p.key]).length : 0), [catalog, state]);

  useEffect(() => {
    setState(loadState());
    fetch(href('/bites.json'))
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setError(true));
  }, []);

  const makeBatch = useCallback(
    (m: Mode, lastPage?: string | null): Slide[] => {
      if (!catalog) return [];
      const pools = buildPools(catalog, m);
      const done = catalog.pages.filter((p) => loadProgress().completed[p.key]).length;
      const batch = nextBatch(pools, poolWeights(done, m), loadState(), shown.current, 12, lastPage);
      batch.forEach((c) => shown.current.add(c.id));
      if (!batch.length) exhausted.current = true;
      return batch.map((card) => ({ kind: 'card' as const, key: `${card.id}~${uid.current++}`, card }));
    },
    [catalog],
  );

  // (Re)start the feed when the catalog arrives or the mode changes.
  useEffect(() => {
    if (!catalog) return;
    shown.current = new Set();
    exhausted.current = false;
    const done = catalog.pages.filter((p) => loadProgress().completed[p.key]).length;
    const first: Slide[] = mode === 'mine' && done === 0 ? [{ kind: 'locked', key: 'locked' }] : [{ kind: 'intro', key: `intro-${mode}` }, ...makeBatch(mode)];
    setSlides(first);
    setIndex(0);
    scroller.current?.scrollTo({ top: 0 });
  }, [catalog, mode, makeBatch]);

  // Load more when close to the end.
  useEffect(() => {
    if (!catalog || !slides.length || slides[0].kind === 'locked') return;
    if (index < slides.length - 4) return;
    if (exhausted.current) {
      if (slides[slides.length - 1].kind !== 'end') setSlides((s) => [...s, { kind: 'end', key: `end-${uid.current++}` }]);
      return;
    }
    const last = [...slides].reverse().find((s) => s.kind === 'card') as Extract<Slide, { kind: 'card' }> | undefined;
    const more = makeBatch(mode, last?.card.page);
    setSlides((s) => (more.length ? [...s, ...more] : [...s, { kind: 'end', key: `end-${uid.current++}` }]));
  }, [index, slides, catalog, mode, makeBatch]);

  const go = useCallback((delta: number) => {
    const el = scroller.current;
    if (el) el.scrollBy({ top: delta * el.clientHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollTop / el.clientHeight));
  };

  const onGrade = (slideIndex: number, card: BiteCard, knew: boolean) => {
    setState((s) => grade(s, card.id, knew));
    // "Again": show it once more a few cards later in this session.
    if (!knew) {
      setSlides((s) => {
        const copy = [...s];
        copy.splice(Math.min(slideIndex + 5, copy.length), 0, { kind: 'card', key: `${card.id}~again${uid.current++}`, card });
        return copy;
      });
    }
  };

  const todayCount = state.days[today()] ?? 0;
  const days = streak(state);
  const due = catalog ? cardsDueCount(catalog, state) : 0;
  const totalPages = catalog?.pages.length ?? 0;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Top bar */}
      <div className="border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Feed mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors ${mode === m.id ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-warn" title={`${days}-day streak · ${todayCount} cards today`}>
            <Flame size={16} /> {todayCount}
          </span>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
        aria-label="Bites feed"
      >
        {!catalog && (
          <div className="grid h-full place-items-center text-muted">{error ? 'Could not load the cards. Please reload the page.' : 'Loading cards…'}</div>
        )}
        {slides.map((s, i) => (
          <section key={s.key} className="flex h-full snap-start snap-always items-center justify-center px-4 py-5" aria-roledescription="slide">
            {s.kind === 'card' && (
              <CardView card={s.card} page={s.card.page ? pagesByKey.get(s.card.page) : undefined} onGrade={(knew) => onGrade(i, s.card, knew)} onNext={() => go(1)} />
            )}
            {s.kind === 'intro' && (
              <article className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 text-center shadow-float">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
                  <Zap size={26} />
                </span>
                <h2 className="mt-5 text-3xl font-bold tracking-tight">Bugwise Bites</h2>
                <p className="mt-3 leading-relaxed text-muted">Short cards, about 10 seconds each. Scroll down to start.</p>
                {completedCount === 0 ? (
                  <div className="mt-5 rounded-2xl bg-subtle p-4 text-left text-sm leading-relaxed">
                    <p className="font-semibold text-fg">You’re just getting started 👋</p>
                    <p className="mt-1 text-muted">Here’s a taste of the basics and what’s coming on your path. Finish lessons to unlock review cards made from them.</p>
                    <p className="mt-3 font-medium text-fg">0 of {totalPages} pages completed</p>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-subtle p-3">
                      <p className="text-2xl font-bold">{days}</p>
                      <p className="text-xs text-muted">day streak</p>
                    </div>
                    <div className="rounded-2xl bg-subtle p-3">
                      <p className="text-2xl font-bold">{due}</p>
                      <p className="text-xs text-muted">to review</p>
                    </div>
                    <div className="rounded-2xl bg-subtle p-3">
                      <p className="text-2xl font-bold">{completedCount}</p>
                      <p className="text-xs text-muted">pages done</p>
                    </div>
                  </div>
                )}
                <button type="button" onClick={() => go(1)} className="mt-6 inline-flex animate-bounce items-center gap-1 text-sm font-medium text-brand">
                  Scroll to start <ArrowDown size={15} />
                </button>
              </article>
            )}
            {s.kind === 'locked' && (
              <article className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 text-center shadow-float">
                <Sparkles size={30} className="mx-auto text-brand" />
                <h2 className="mt-4 text-2xl font-bold tracking-tight">Your review cards live here</h2>
                <p className="mt-3 leading-relaxed text-muted">
                  Every lesson you mark as complete (or pass its quiz) adds its cards to this feed. You haven’t completed one yet.
                </p>
                <a href={href('/fundamentals/what-is-software-testing')} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-fg font-medium text-bg">
                  Start the first lesson <ArrowRight size={17} />
                </a>
                <button type="button" onClick={() => setMode('mix')} className="mt-3 text-sm font-medium text-brand">
                  Or try the Mix feed
                </button>
              </article>
            )}
            {s.kind === 'end' && (
              <article className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 text-center shadow-float">
                <p className="text-4xl">🎉</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">You’re all caught up</h2>
                <p className="mt-3 leading-relaxed text-muted">
                  You answered {todayCount} {todayCount === 1 ? 'card' : 'cards'} today. Come back tomorrow for cards that are due, or finish another lesson to unlock more.
                </p>
                <div className="mt-6 grid gap-2">
                  {MODES.filter((m) => m.id !== mode).map((m) => (
                    <button key={m.id} type="button" onClick={() => setMode(m.id)} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line font-medium hover:bg-subtle">
                      {m.id === 'interview' ? <MessagesSquare size={16} /> : <Zap size={16} />} Switch to {m.label}
                    </button>
                  ))}
                </div>
              </article>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
