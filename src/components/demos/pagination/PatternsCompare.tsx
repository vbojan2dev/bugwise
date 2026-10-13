import { useEffect, useRef, useState, type UIEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { catalog } from './data';
import { Pagination } from './Pagination';

/*
 * The same 60-item list shown three ways: numbered pages, a "Load more" button and infinite scroll.
 * Lets learners feel the differences (footer reachability, sense of position, how much is on screen).
 */

type Mode = 'pages' | 'more' | 'infinite';
const TOTAL = 60;
const SIZE = 8;
const ALL = catalog(TOTAL);

const NOTES: Record<Mode, { title: string; good: string[]; bad: string[] }> = {
  pages: {
    title: 'Numbered pages',
    good: ['You always know where you are (page 3 of 8)', 'Page can live in the URL: share, refresh, Back', 'Footer is always reachable'],
    bad: ['Extra taps to see more', 'Small targets on phones if done badly'],
  },
  more: {
    title: '“Load more” button',
    good: ['User decides when to load', 'Footer still reachable', 'Feels natural on phones'],
    bad: ['Long lists get heavy', 'Back often loses the loaded items and position'],
  },
  infinite: {
    title: 'Infinite scroll',
    good: ['Effortless browsing of feeds', 'No extra taps'],
    bad: ['Footer (Help, Contact) is unreachable', 'No sense of position, hard to return to an item', 'Keyboard and screen reader users get lost'],
  },
};

export default function PatternsCompare() {
  const [mode, setMode] = useState<Mode>('pages');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(SIZE);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const switchMode = (m: Mode) => {
    clearTimeout(timer.current);
    loadingRef.current = false;
    setLoading(false);
    setMode(m);
    setPage(1);
    setCount(SIZE);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  const loadMore = () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      loadingRef.current = false;
      setLoading(false);
      setCount((c) => Math.min(TOTAL, c + SIZE));
    }, 700);
  };

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    if (mode !== 'infinite') return;
    const el = e.currentTarget;
    if (count < TOTAL && el.scrollTop + el.clientHeight > el.scrollHeight - 60) loadMore();
  };

  const goPage = (p: number) => {
    setPage(p);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  const items = mode === 'pages' ? ALL.slice((page - 1) * SIZE, page * SIZE) : ALL.slice(0, count);
  const note = NOTES[mode];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap gap-1 border-b border-line p-3" role="group" aria-label="Pattern">
        {(Object.keys(NOTES) as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-brand text-white' : 'bg-subtle text-muted hover:text-fg'}`}
          >
            {NOTES[m].title}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 items-center gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div className="mx-auto">
          <PhoneFrame width={250}>
            <div className="absolute inset-0 flex flex-col bg-[#f2f2f7] text-[#0e1120]" style={{ colorScheme: 'light' }}>
              <p className="shrink-0 px-4 pt-1 pb-2 text-[20px] font-bold">Tents & packs</p>
              <div ref={scroller} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-6">
                <ul className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white">
                  {items.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: `hsl(${p.hue} 55% 52%)` }}>
                        <p.icon size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                      <span className="text-[12px] text-black/55">{p.price}</span>
                    </li>
                  ))}
                </ul>
                {mode === 'pages' && (
                  <div className="mt-2">
                    <Pagination page={page} totalPages={Math.ceil(TOTAL / SIZE)} onChange={goPage} compact />
                  </div>
                )}
                {mode === 'more' && count < TOTAL && (
                  <button type="button" onClick={loadMore} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#2f6bff]">
                    {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
                    {loading ? 'Loading…' : `Load more (${count} of ${TOTAL})`}
                  </button>
                )}
                {mode === 'infinite' && count < TOTAL && (
                  <p className="flex items-center justify-center gap-2 py-4 text-[12px] text-black/50">
                    <LoaderCircle size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Loading more…' : 'Scroll for more'}
                  </p>
                )}
                {(mode !== 'infinite' || count >= TOTAL) && (
                  <footer className="mt-4 rounded-xl bg-white/70 p-3 text-center text-[11px] text-black/55">Help · Contact us · Returns · Imprint</footer>
                )}
              </div>
            </div>
          </PhoneFrame>
        </div>
        <div className="min-w-0 space-y-3 text-sm">
          <p className="font-semibold">{note.title}</p>
          <p className="text-muted">
            {mode === 'pages' && 'Scroll down and use Prev / Next. The footer is right below the pager.'}
            {mode === 'more' && 'Tap “Load more” a few times. The list grows, the footer stays reachable.'}
            {mode === 'infinite' && 'Scroll down and try to reach the footer with Help and Contact. It only appears after all 60 items have loaded.'}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ul className="min-w-0 space-y-1 rounded-xl bg-subtle p-3">
              {note.good.map((g) => (
                <li key={g} className="text-ok">
                  + <span className="text-fg">{g}</span>
                </li>
              ))}
            </ul>
            <ul className="min-w-0 space-y-1 rounded-xl bg-subtle p-3">
              {note.bad.map((b) => (
                <li key={b} className="text-danger">
                  − <span className="text-fg">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-faint">
            Items on screen: {items.length} of {TOTAL}
            {mode === 'pages' ? ` · page ${page} of ${Math.ceil(TOTAL / SIZE)}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
