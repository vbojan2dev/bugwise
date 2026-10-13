import { useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDot, RotateCcw, Shuffle, XCircle } from 'lucide-react';

/**
 * Triage board trainer: place 10 bug cards on a severity × priority matrix, compare with a model
 * answer (with reasoning and "where people disagree"), then re-rank a few cards when the context changes.
 */

const SEV = ['Critical', 'Major', 'Minor', 'Trivial'] as const;
const PRI = ['P1', 'P2', 'P3', 'P4'] as const;
const PRI_HINT = ['Fix now', 'This sprint / before release', 'Soon', 'Backlog'];

type Pos = { sev: number; pri: number };
type Card = { id: number; app: string; title: string; facts: string[]; model: Pos; why: string; debate: string };

const cards: Card[] = [
  {
    id: 1,
    app: 'Shopping app · Android',
    title: 'App crashes when tapping "Place order"',
    facts: ['Happens for every user on Android, 5/5', 'No workaround in the app', 'Release is live in production'],
    model: { sev: 0, pri: 0 },
    why: 'A crash in the money flow with no workaround: highest impact, and every hour costs orders. Classic Critical / P1, often a hotfix.',
    debate: 'Almost nobody disagrees. Some teams call this a Blocker, the level above Critical.',
  },
  {
    id: 2,
    app: 'Banking app · Android',
    title: 'Exporting transactions to CSV crashes the app on Android 9',
    facts: ['Android 9 is 2% of installs; CSV export is used by 0.3% of users', 'Export works on the website', 'Found in regression, not reported by customers'],
    model: { sev: 0, pri: 2 },
    why: 'A crash is a crash, so the impact is severe for the person who hits it. But very few people do, and the website is a workaround. Fix it soon, not tonight.',
    debate: 'Some teams downgrade crashes with an easy workaround to Major. Both are defensible if you explain it.',
  },
  {
    id: 3,
    app: 'Fitness website',
    title: 'Brand name misspelled "FitPluse" in the homepage banner',
    facts: ['Nothing is broken functionally', 'Public launch campaign goes live tomorrow morning', 'Visible to every visitor'],
    model: { sev: 3, pri: 0 },
    why: 'Technically trivial, but it is the first thing every new visitor sees on launch day. Embarrassing and cheap to fix: Trivial / P1.',
    debate: 'Some testers rate visible brand errors Minor instead of Trivial. The priority is the point here: high.',
  },
  {
    id: 4,
    app: 'Fitness app · iOS',
    title: 'Notifications icon in Settings is 3 px lower than the other icons',
    facts: ['Purely visual', 'Settings screen, rarely visited', 'All devices'],
    model: { sev: 3, pri: 3 },
    why: 'Cosmetic, low traffic, no effect on anything else. Log it, fix it when someone is in that code anyway.',
    debate: 'Teams with a strict design system may push it to P3. Nobody fixes it before real bugs.',
  },
  {
    id: 5,
    app: 'Shopping website',
    title: 'Sort "Price: low to high" puts sale items at the end',
    facts: ['Every search that uses this sort is affected', 'Users can use the "On sale" filter instead', 'Customers may miss cheaper products'],
    model: { sev: 1, pri: 1 },
    why: 'A main feature gives wrong results, so Major, but a workaround exists and nothing crashes. It hurts sales a little every day, so fix it this sprint.',
    debate: 'If sale items are rare, Minor / P3 is a reasonable call. If a big sale is coming, P1.',
  },
  {
    id: 6,
    app: 'Food delivery website',
    title: 'Changing the order number in the URL shows another customer\'s order, name and address',
    facts: ['Any signed-in user can do it', 'Exposes personal data (a security and privacy issue)', 'Production'],
    model: { sev: 0, pri: 0 },
    why: 'A data leak of personal information is critical regardless of how many users found it. Legal and trust impact: fix immediately.',
    debate: 'No real debate. Security bugs like this are often handled privately, not in a public tracker.',
  },
  {
    id: 7,
    app: 'Travel app · iOS',
    title: 'In dark mode, the "Cancel booking" button text is almost invisible',
    facts: ['Contrast ratio about 1.6:1 (WCAG asks 4.5:1 for text)', 'About 40% of users use dark mode', 'The button still works if you find it'],
    model: { sev: 1, pri: 1 },
    why: 'An important action is hard to find for a large group, and it is an accessibility failure. Not a crash, so Major, and worth fixing this sprint.',
    debate: 'Some teams rate accessibility failures on key actions Critical, especially where accessibility is a legal requirement.',
  },
  {
    id: 8,
    app: 'Fitness app · Android',
    title: 'Workout is lost if the app is closed in the second after tapping "Save"',
    facts: ['Data loss, the workout cannot be recovered', 'Needs exact timing; about 1 in 2,000 saves', 'Users usually wait for the "Saved" toast'],
    model: { sev: 0, pri: 1 },
    why: 'Data loss is one of the most severe outcomes, so Critical. It is rare and needs unusual timing, so P2 rather than an emergency.',
    debate: 'Some would say Major because it is so rare. Severity is about impact when it happens, though, and losing data is serious.',
  },
  {
    id: 9,
    app: 'Food delivery app · iPadOS',
    title: '"Reorder" button does nothing on iPad in landscape',
    facts: ['iPad is 1.5% of orders', 'Works in portrait; users can also add items by hand', 'iPhone is fine'],
    model: { sev: 1, pri: 2 },
    why: 'A feature is broken (Major), but for a small group and with two easy workarounds. Fix soon, not urgently.',
    debate: 'Minor is also defensible because of the workarounds.',
  },
  {
    id: 10,
    app: 'Shopping website',
    title: 'Footer link "Privacy policy" returns a 404 page',
    facts: ['Rest of the site works', 'Laws like the EU GDPR require easy access to privacy information', 'Legal team noticed it'],
    model: { sev: 2, pri: 1 },
    why: 'For a shopper it is a small problem (Minor), but it is a legal risk. Legal and compliance issues raise priority well above what the severity suggests.',
    debate: 'P1 is also fair if legal asks for it today. Severity Major would be a stretch.',
  },
];

type Twist = { card: number; label: string; change: string; model: Pos; why: string };
const twists: Twist[] = [
  {
    card: 1,
    label: 'Only 0.1% of users',
    change: 'Further testing shows the "Place order" crash only happens on one rare tablet model running an Android beta. That is 0.1% of users. Everyone else can order.',
    model: { sev: 0, pri: 2 },
    why: 'Severity stays Critical: for that user the app still crashes in checkout. Priority drops because the reach is tiny and beta OS users expect some trouble. P2 is also fine; P1 would mean dropping other work for 0.1%.',
  },
  {
    card: 9,
    label: 'The launch is tomorrow',
    change: 'Marketing launches an iPad-only "Reorder in one tap" campaign tomorrow, with ads showing an iPad in landscape. iPad traffic is expected to go up 10×.',
    model: { sev: 1, pri: 0 },
    why: 'Same bug, same severity (Major). But the feature being advertised tomorrow is broken exactly where the ads show it. Priority jumps to P1.',
  },
  {
    card: 4,
    label: 'It affects payments',
    change: 'The same icon misalignment also appears on the payment screen. On small phones (iPhone SE) the icon now covers the "Pay" button, so taps hit the icon and nothing happens.',
    model: { sev: 0, pri: 0 },
    why: 'New facts about impact change the severity: users on small phones cannot pay at all, with no workaround. That is Critical, and money is involved, so P1.',
  },
  {
    card: 3,
    label: 'The launch is postponed',
    change: 'The public launch is moved back by three months. The homepage with the "FitPluse" typo is only visible on staging until then.',
    model: { sev: 3, pri: 2 },
    why: 'Severity was always Trivial. The urgency came only from the launch date, and that is gone. It still must be fixed before launch, so P3 (or P2) fits better than P4, where it could be forgotten.',
  },
];

const dist = (a: Pos, b: Pos) => Math.abs(a.sev - b.sev) + Math.abs(a.pri - b.pri);
const verdict = (d: number) => (d === 0 ? 'match' : d === 1 ? 'close' : 'far');

function cellTint(sev: number, pri: number) {
  const s = sev + pri;
  if (s <= 1) return 'bg-danger-soft';
  if (s <= 3) return 'bg-warn-soft';
  if (s <= 4) return 'bg-subtle';
  return 'bg-ok-soft';
}

type Mark = { id: string; label: string; cls: string };

function Matrix({ marks, onPick, label, disabled }: { marks: (sev: number, pri: number) => Mark[]; onPick?: (p: Pos) => void; label: string; disabled?: boolean }) {
  return (
    <div className="min-w-0" role="group" aria-label={label}>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(4, minmax(0, 1fr))' }}>
        <div className="flex items-end justify-end pr-1 pb-1 text-[10px] font-semibold tracking-wide text-faint uppercase">
          <span className="hidden sm:inline">Sev ↓ / Prio →</span>
        </div>
        {PRI.map((p, i) => (
          <div key={p} className="px-0.5 pb-1 text-center">
            <p className="text-xs font-bold text-fg">{p}</p>
            <p className="hidden text-[10px] leading-tight text-muted sm:block">{PRI_HINT[i]}</p>
          </div>
        ))}
        {SEV.map((sv, si) => (
          <div key={sv} className="contents">
            <div className="flex items-center justify-end pr-1 text-xs font-semibold text-fg">{sv}</div>
            {PRI.map((p, pi) => {
              const m = marks(si, pi);
              return (
                <button
                  key={p}
                  type="button"
                  disabled={disabled || !onPick}
                  onClick={() => onPick?.({ sev: si, pri: pi })}
                  aria-label={`Severity ${sv}, priority ${p}${m.length ? `. Contains: ${m.map((x) => x.label).join(', ')}` : ''}`}
                  className={`flex min-h-14 min-w-0 flex-wrap content-start items-start gap-1 rounded-lg border border-line p-1 transition-shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${cellTint(si, pi)} ${
                    onPick && !disabled ? 'cursor-pointer hover:shadow-[0_0_0_2px_var(--brand)]' : 'cursor-default'
                  }`}
                >
                  {m.map((x) => (
                    <span key={x.id} className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${x.cls}`} aria-hidden="true">
                      {x.label}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const name = (p: Pos) => `${SEV[p.sev]} / ${PRI[p.pri]}`;

function Verdict({ d }: { d: number }) {
  const v = verdict(d);
  if (v === 'match')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
        <CheckCircle2 size={14} aria-hidden="true" /> Same as model
      </span>
    );
  if (v === 'close')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn">
        <CircleDot size={14} aria-hidden="true" /> One step off, defensible
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
      <XCircle size={14} aria-hidden="true" /> Quite different
    </span>
  );
}

type Phase = 'rate' | 'review' | 'twist' | 'end';

export default function TriageBoard() {
  const [phase, setPhase] = useState<Phase>('rate');
  const [placed, setPlaced] = useState<Record<number, Pos>>({});
  const [active, setActive] = useState(1);
  const [twistIdx, setTwistIdx] = useState(0);
  const [twistAns, setTwistAns] = useState<Record<number, Pos>>({});

  const count = Object.keys(placed).length;
  const card = cards.find((c) => c.id === active)!;

  const place = (p: Pos) => {
    setPlaced((prev) => {
      const next = { ...prev, [active]: p };
      const after = cards.find((c) => c.id > active && !next[c.id]) ?? cards.find((c) => !next[c.id]);
      if (after) setActive(after.id);
      return next;
    });
  };

  const reset = () => {
    setPhase('rate');
    setPlaced({});
    setActive(1);
    setTwistIdx(0);
    setTwistAns({});
  };

  const scores = cards.map((c) => (placed[c.id] ? dist(placed[c.id], c.model) : 9));
  const matches = scores.filter((d) => d === 0).length;
  const close = scores.filter((d) => d === 1).length;

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-fg">Triage board</p>
        <p className="text-sm text-muted">
          {phase === 'rate' && 'Pick a bug card, then click the cell that matches its severity (row) and priority (column).'}
          {phase === 'review' && 'Compare your board with a model answer. Click a card to see the reasoning.'}
          {phase === 'twist' && 'The context changes. Where does the card go now?'}
          {phase === 'end' && 'Done. Severity follows impact; priority follows context.'}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-fg hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <RotateCcw size={14} aria-hidden="true" /> Start over
      </button>
    </div>
  );

  const cardPicker = (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bug cards">
      {cards.map((c) => {
        const d = placed[c.id] ? dist(placed[c.id], c.model) : null;
        const tone =
          phase === 'rate'
            ? placed[c.id]
              ? 'bg-brand-soft text-brand border-brand/30'
              : 'bg-surface text-fg border-line'
            : d === 0
              ? 'bg-ok-soft text-ok border-ok/40'
              : d === 1
                ? 'bg-warn-soft text-warn border-warn/40'
                : 'bg-danger-soft text-danger border-danger/40';
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            aria-pressed={active === c.id}
            aria-label={`Card ${c.id}: ${c.title}${placed[c.id] ? `, placed at ${name(placed[c.id])}` : ', not placed yet'}`}
            className={`size-9 rounded-lg border text-sm font-bold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tone} ${
              active === c.id ? 'shadow-[0_0_0_2px_var(--brand)]' : ''
            }`}
          >
            {c.id}
          </button>
        );
      })}
    </div>
  );

  const cardView = (c: Card) => (
    <div className="rounded-2xl border border-line bg-subtle p-4">
      <p className="text-xs font-semibold text-muted">
        #{c.id} · {c.app}
      </p>
      <p className="mt-1 font-semibold text-fg">{c.title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg">
        {c.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );

  if (phase === 'rate' || phase === 'review') {
    const review = phase === 'review';
    const marks = (si: number, pi: number): Mark[] => {
      if (!review) {
        return cards
          .filter((c) => placed[c.id]?.sev === si && placed[c.id]?.pri === pi)
          .map((c) => ({ id: `c${c.id}`, label: String(c.id), cls: c.id === active ? 'bg-brand text-brand-fg' : 'bg-surface text-fg border border-line' }));
      }
      const out: Mark[] = [];
      const you = placed[active];
      if (you && you.sev === si && you.pri === pi) out.push({ id: 'you', label: 'You', cls: 'bg-brand text-brand-fg' });
      if (card.model.sev === si && card.model.pri === pi) out.push({ id: 'model', label: 'Model', cls: 'bg-ok text-white' });
      return out;
    };
    return (
      <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
            {cardPicker}
            {cardView(card)}
            {review ? (
              <div className="space-y-2 text-sm text-fg" aria-live="polite">
                <p>
                  <strong>You:</strong> {placed[card.id] ? name(placed[card.id]) : 'not placed'} · <strong>Model:</strong> {name(card.model)}
                </p>
                <Verdict d={placed[card.id] ? dist(placed[card.id], card.model) : 9} />
                <p>{card.why}</p>
                <p className="rounded-xl border border-line bg-surface p-3 text-muted">
                  <strong className="text-fg">Where people disagree:</strong> {card.debate}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted" aria-live="polite">
                Placed {count} of {cards.length}.{' '}
                {placed[card.id] ? `Card ${card.id} is at ${name(placed[card.id])}. Click another cell to move it.` : `Where does card ${card.id} go?`}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-4 p-4 sm:p-5">
            <Matrix marks={marks} onPick={review ? undefined : place} label="Severity and priority matrix" />
            {review ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-subtle p-4">
                <p className="text-sm text-fg">
                  <strong>{matches}</strong> exact, <strong>{close}</strong> one step off, <strong>{cards.length - matches - close}</strong> further away.{' '}
                  <span className="text-muted">One step off is usually a reasonable discussion, not a mistake.</span>
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('twist')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Shuffle size={14} aria-hidden="true" /> Next: what changed?
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={count < cards.length}
                onClick={() => setPhase('review')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              >
                Check my board <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'twist') {
    const tw = twists[twistIdx];
    const base = cards.find((c) => c.id === tw.card)!;
    const ans = twistAns[twistIdx];
    const marks = (si: number, pi: number): Mark[] => {
      const out: Mark[] = [];
      if (base.model.sev === si && base.model.pri === pi) out.push({ id: 'before', label: 'Before', cls: 'bg-surface text-muted border border-line' });
      if (ans && ans.sev === si && ans.pri === pi) out.push({ id: 'you', label: 'You', cls: 'bg-brand text-brand-fg' });
      if (ans && tw.model.sev === si && tw.model.pri === pi) out.push({ id: 'model', label: 'Model', cls: 'bg-ok text-white' });
      return out;
    };
    return (
      <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-4 border-b border-line p-5 lg:border-r lg:border-b-0">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">
              Twist {twistIdx + 1} of {twists.length}: {tw.label}
            </p>
            {cardView(base)}
            <p className="text-sm text-muted">Model answer before the change: {name(base.model)}</p>
            <div className="rounded-2xl border border-warn/40 bg-warn-soft p-4 text-sm text-fg">
              <strong>What changed: </strong>
              {tw.change}
            </div>
            <div aria-live="polite" className="space-y-2 text-sm text-fg">
              {ans ? (
                <>
                  <p>
                    <strong>You:</strong> {name(ans)} · <strong>Model:</strong> {name(tw.model)}
                  </p>
                  <Verdict d={dist(ans, tw.model)} />
                  <p>{tw.why}</p>
                </>
              ) : (
                <p className="text-muted">Click the cell where this card belongs now.</p>
              )}
            </div>
          </div>
          <div className="min-w-0 space-y-4 p-4 sm:p-5">
            <Matrix marks={marks} onPick={ans ? undefined : (p) => setTwistAns((prev) => (prev[twistIdx] ? prev : { ...prev, [twistIdx]: p }))} label="Re-rank the card" />
            {ans ? (
              <button
                type="button"
                onClick={() => {
                  if (twistIdx < twists.length - 1) setTwistIdx((i) => Math.min(i + 1, twists.length - 1));
                  else setPhase('end');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {twistIdx < twists.length - 1 ? 'Next twist' : 'Finish'} <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const twistMatches = twists.filter((t, i) => twistAns[i] && dist(twistAns[i], t.model) <= 1).length;
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      {header}
      <div className="space-y-4 p-5 text-sm text-fg">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={18} className="text-ok" aria-hidden="true" /> Board: {matches + close} of {cards.length} exact or one step off. Twists: {twistMatches} of {twists.length}.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-line bg-subtle p-4">
            <p className="font-semibold">What the twists showed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Reach (0.1% of users) and dates (launch tomorrow, launch postponed) moved the <strong>priority</strong> only.</li>
              <li>New facts about <strong>impact</strong> (users cannot pay) moved the severity, and the priority followed.</li>
            </ul>
          </div>
          <div className="min-w-0 rounded-2xl border border-line bg-subtle p-4">
            <p className="font-semibold">In a real triage</p>
            <p className="mt-2">
              There is rarely one correct cell. What matters is that you can explain your rating with facts: who is affected, how badly, how often, and whether there is a workaround.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
