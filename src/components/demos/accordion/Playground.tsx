import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link2, ListChecks, RotateCcw, Volume2 } from 'lucide-react';
import { AccordionItem, useScreenReader } from './Accordion';

/*
 * Accordion lab: a correct banking-app FAQ that the learner can configure.
 *  - Mode: single (opening one closes the others) vs multiple
 *  - Motion: animated vs instant (what users with "Reduce motion" should get)
 *  - Closed content: hidden (find-in-page can't see it) vs hidden="until-found" (Ctrl+F finds and opens it)
 *  - Scroll fix: off (in single mode, a long section above collapses and the header you tapped jumps away)
 *    vs on (the tapped header is kept at the same place on screen)
 * Plus a deep link that opens and scrolls to a section, "Expand all" derived from state,
 * a "screen reader would say" panel and an event log.
 */

type Mode = 'single' | 'multiple';

const QUESTIONS: { id: string; q: string; a: ReactNode }[] = [
  { id: 'freeze', q: 'How do I freeze my card?', a: 'Open Cards, tap your card and switch on Freeze. Payments are blocked straight away. Switch it off to use the card again.' },
  {
    id: 'abroad',
    q: 'What are the fees abroad?',
    a: (
      <>
        <p>Paying by card in another currency is free on all plans. Cash withdrawals:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Standard: 2 free per month, then 1.7%</li>
          <li>Plus: €400 per month free, then 1%</li>
          <li>Premium: unlimited free withdrawals</li>
        </ul>
        <p className="mt-2">On weekends we add 0.5% to the exchange rate for most currencies, because markets are closed. Some ATMs charge their own fee. Always choose to be charged in the local currency: if the ATM converts for you, the rate is usually much worse.</p>
        <p className="mt-2">Traveling for more than 3 months? Tell us in the app so we don't block your card for unusual activity.</p>
        <p className="mt-2">Fees are shown in the transaction details right after each payment.</p>
      </>
    ),
  },
  { id: 'new-card', q: 'How do I order a new card?', a: 'Go to Cards › Order a new card. Standard delivery is free and takes 3–5 working days.' },
  { id: 'cashback', q: 'How does cashback work?', a: 'You get 1% back at partner shops. Enter the partner code BLUEFIN at checkout to get 2% for your first month.' },
  {
    id: 'declined',
    q: 'Why was my payment declined?',
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Your card is frozen or expired</li>
        <li>Not enough money in the account</li>
        <li>You reached your daily spending limit</li>
        <li>The shop needs 3-D Secure and the approval timed out</li>
        <li>Online payments are switched off in card settings</li>
      </ul>
    ),
  },
  { id: 'limit', q: 'Can I set a spending limit?', a: 'Yes. Open Cards › Limits and set a daily or monthly amount.' },
  { id: 'close', q: 'How do I close my account?', a: 'Move your money out first, then go to Profile › Close account. It takes up to 5 working days.' },
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold text-faint">{label}</legend>
      <div className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-medium ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Playground() {
  const [mode, setMode] = useState<Mode>('single');
  const [motion, setMotion] = useState<'anim' | 'none'>('anim');
  const [hide, setHide] = useState<'hidden' | 'found'>('hidden');
  const [fix, setFix] = useState<'off' | 'on'>('off');
  const [open, setOpen] = useState<Set<number>>(() => new Set([1]));
  const [said, setSaid] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const headers = useRef<(HTMLButtonElement | null)[]>([]);
  const raf = useRef(0);
  const settle = useRef<number[]>([]);
  const pending = useRef<null | (() => void)>(null);

  useScreenReader(root, setSaid);
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      settle.current.forEach((t) => clearTimeout(t));
    },
    [],
  );
  // Correct right after React has updated the DOM (covers the instant / reduced-motion case).
  useLayoutEffect(() => {
    pending.current?.();
  }, [open]);

  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 5));

  /** Keep header `i` at `want` px from the top of the scroller while the layout settles. */
  const holdHeader = (i: number, want?: number) => {
    const sc = scroller.current;
    const h = headers.current[i];
    if (!sc || !h) return;
    const rel = () => h.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    const target = want ?? rel();
    const fixNow = () => {
      sc.scrollTop += rel() - target;
    };
    cancelAnimationFrame(raf.current);
    settle.current.forEach((t) => clearTimeout(t));
    pending.current = fixNow;
    // keep correcting while the height animation runs, then once more when it has finished
    const start = performance.now();
    const step = () => {
      fixNow();
      if (performance.now() - start < 400) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    settle.current = [
      window.setTimeout(fixNow, 300),
      window.setTimeout(() => {
        fixNow();
        pending.current = null;
      }, 450),
    ];
  };

  const setItem = (i: number, o: boolean, why = 'Tap') => {
    if (fix === 'on') holdHeader(i);
    setOpen((prev) => {
      const next = mode === 'single' ? new Set<number>() : new Set(prev);
      if (o) next.add(i);
      else next.delete(i);
      return next;
    });
    addLog(`${why} → ${o ? 'open' : 'close'} “${QUESTIONS[i].q}”`);
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    if (m === 'single') setOpen((prev) => new Set([...prev].slice(0, 1)));
  };

  const allOpen = open.size === QUESTIONS.length;
  const toggleAll = () => {
    setOpen(allOpen ? new Set() : new Set(QUESTIONS.map((_, i) => i)));
    addLog(allOpen ? 'Collapse all' : 'Expand all');
  };

  const deepLink = () => {
    const i = QUESTIONS.findIndex((q) => q.id === 'declined');
    setOpen((prev) => {
      const next = mode === 'single' ? new Set<number>() : new Set(prev);
      next.add(i);
      return next;
    });
    holdHeader(i, 8);
    headers.current[i]?.focus({ preventScroll: true });
    addLog('Link …/help#declined → open + scroll to it');
  };

  const reset = () => {
    cancelAnimationFrame(raf.current);
    settle.current.forEach((t) => clearTimeout(t));
    pending.current = null;
    setOpen(new Set([1]));
    setLog([]);
    setSaid('');
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  return (
    <div ref={root} className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:grid-cols-4">
        <Seg label="Mode" value={mode} onChange={changeMode} options={[{ v: 'single', l: 'Single' }, { v: 'multiple', l: 'Multiple' }]} />
        <Seg label="Motion" value={motion} onChange={setMotion} options={[{ v: 'anim', l: 'Animated' }, { v: 'none', l: 'Reduced' }]} />
        <Seg label="Closed content" value={hide} onChange={setHide} options={[{ v: 'hidden', l: 'Hidden' }, { v: 'found', l: 'Until-found' }]} />
        <Seg label="Scroll fix" value={fix} onChange={setFix} options={[{ v: 'off', l: 'Off' }, { v: 'on', l: 'On' }]} />
      </div>

      <div className="bg-[#e9ebf2] px-3 py-6 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto max-w-[380px] overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">
          <div className="flex items-center gap-2 border-b border-black/10 px-4 py-3">
            <p className="min-w-0 flex-1 truncate text-[17px] font-bold">Help · Cards</p>
            {mode === 'multiple' && (
              <button type="button" onClick={toggleAll} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#2f6bff] outline-none hover:bg-[#2f6bff]/10 focus-visible:ring-2 focus-visible:ring-[#2f6bff]">
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>
          <div ref={scroller} className="relative h-[340px] overflow-y-auto overscroll-contain">
            <p className="px-4 pt-3 pb-2 text-[13px] text-[#5a5f70]">Answers to the questions we hear most about cards.</p>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {QUESTIONS.map((item, i) => (
                <AccordionItem
                  key={`${item.id}-${hide}`}
                  title={item.q}
                  open={open.has(i)}
                  onOpenChange={(o) => setItem(i, o)}
                  animate={motion === 'anim'}
                  findable={hide === 'found'}
                  headerId={`lab-acc-${item.id}`}
                  headerRef={(el) => {
                    headers.current[i] = el;
                  }}
                  tone="compact"
                >
                  {item.a}
                </AccordionItem>
              ))}
            </div>
            <div className="m-4 rounded-xl bg-[#f2f4f8] p-4 text-[13px] text-[#3c4150]">
              <p className="font-semibold text-[#0e1120]">Still need help?</p>
              <p className="mt-1">Chat with us in the app, 24/7. Average reply time: 2 minutes.</p>
              <p className="mt-3 text-[12px] text-[#5a5f70]">Card issued by Example Bank. Fees as of October 2026.</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-[380px] flex-wrap gap-2">
          <button type="button" onClick={deepLink} className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-xs text-[#0e1120] shadow-sm hover:text-[#2f6bff]">
            <Link2 size={14} className="shrink-0" /> <span className="truncate">…/help#declined</span>
          </button>
          <button type="button" onClick={reset} className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#3c4150] shadow-sm hover:text-[#0e1120]">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <Volume2 size={14} /> Screen reader would say
          </p>
          <p className="mt-1 text-sm text-fg" aria-live="polite">
            {said ? `“${said}”` : 'Tab to a question or click one to hear it…'}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
            <ListChecks size={14} /> Event log
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {log.length === 0 && <li>Open and close questions, or use the link.</li>}
            {log.map((s, i) => (
              <li key={i} className={`truncate ${i === 0 ? 'text-fg' : ''}`}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
        Things to try: in <strong>Single</strong> mode with the scroll fix <strong>Off</strong>, scroll down through the long “fees abroad” answer and tap the next question: the header you tapped jumps out of view. Turn the fix <strong>On</strong> and repeat. Then switch <strong>Closed content</strong> to <strong>Until-found</strong>, close everything and press <kbd>Ctrl</kbd>+<kbd>F</kbd> / <kbd>Cmd</kbd>+<kbd>F</kbd> to search for <code>BLUEFIN</code> (works in browsers that support it, like Chrome and Edge).
      </p>
    </div>
  );
}
