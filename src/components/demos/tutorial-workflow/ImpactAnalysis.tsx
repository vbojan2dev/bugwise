import { useState } from 'react';
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleMinus, GitCommitHorizontal, Target } from 'lucide-react';

/**
 * Impact analysis game: read a change description, pick the regression areas to test again.
 * Each area is "must" (directly touched), "should" (connected, worth a quick pass) or unrelated.
 * Feedback: missed musts (risk), extra unrelated picks (wasted time), plus a reason for every area.
 */

type AreaId = 'account' | 'address' | 'search' | 'cart' | 'payment' | 'promo' | 'tracking' | 'ratings' | 'language';

const areas: { id: AreaId; label: string }[] = [
  { id: 'account', label: 'Sign in and account' },
  { id: 'address', label: 'Delivery address' },
  { id: 'search', label: 'Restaurant list and search' },
  { id: 'cart', label: 'Menu and cart' },
  { id: 'payment', label: 'Checkout and payment' },
  { id: 'promo', label: 'Promo codes' },
  { id: 'tracking', label: 'Order tracking and push' },
  { id: 'ratings', label: 'Ratings and reviews' },
  { id: 'language', label: 'Languages and text layout' },
];

type Level = 'must' | 'should';

type Scenario = {
  id: string;
  title: string;
  change: string;
  impact: Partial<Record<AreaId, { level: Level; why: string }>>;
};

const scenarios: Scenario[] = [
  {
    id: 'sdk',
    title: 'Payment provider SDK updated',
    change: 'The developers upgraded the payment provider SDK from version 4 to version 5. No visible UI changes are planned.',
    impact: {
      payment: { level: 'must', why: 'The SDK runs every payment: saved cards, Apple Pay and Google Pay, declined cards, 3-D Secure. "No UI changes" does not mean no behavior changes.' },
      promo: { level: 'should', why: 'Discounted totals are what gets sent to the provider. Check one order with a promo code to confirm the charged amount is right.' },
      tracking: { level: 'should', why: 'The order is created only after the payment is confirmed. One paid order should still appear with status "Preparing".' },
    },
  },
  {
    id: 'strings',
    title: 'Translation strings changed',
    change: 'New German and French texts were added for the whole app, and some English button labels were shortened.',
    impact: {
      language: { level: 'must', why: 'Directly touched. Look for missing translations, untranslated keys like "checkout.pay_btn", and text truncated or overflowing in long German words.' },
      payment: { level: 'should', why: 'The most important buttons and legal text live in checkout. A truncated "Pay" button or a wrong price label costs real money, so give it a quick look in each language.' },
      tracking: { level: 'should', why: 'Push notifications and order statuses are translated strings too. Check one notification in German.' },
    },
  },
  {
    id: 'autocomplete',
    title: 'New address autocomplete',
    change: 'The address screen now suggests addresses while you type, using a new maps service.',
    impact: {
      address: { level: 'must', why: 'Directly touched: typing, picking a suggestion, no results, slow network, special characters like "Straße" or "Ćirila".' },
      search: { level: 'should', why: 'Which restaurants appear depends on the address. A slightly wrong address (or coordinates) can show the wrong delivery zone.' },
      payment: { level: 'should', why: 'The chosen address is sent with the order. Place one order and check the address in the confirmation.' },
      tracking: { level: 'should', why: 'The courier map uses the delivery address. Check the pin is in the right place.' },
    },
  },
  {
    id: 'pagination',
    title: 'Restaurant list now paginated',
    change: 'To speed up the Home screen, the restaurant list now loads 20 restaurants at a time as you scroll.',
    impact: {
      search: { level: 'must', why: 'Directly touched: first page, loading the next page, end of the list, duplicates or gaps between pages, search results, filters plus pagination.' },
      cart: { level: 'should', why: 'Open a restaurant from page 2 or 3 and add an item. A wrong restaurant ID from a later page would show up here.' },
    },
  },
];

export default function ImpactAnalysis() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, AreaId[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const s = scenarios[index];
  const mine = picks[s.id] ?? [];
  const shown = !!revealed[s.id];

  function toggle(id: AreaId) {
    setPicks((prev) => {
      const cur = prev[s.id] ?? [];
      return { ...prev, [s.id]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  }

  const musts = areas.filter((a) => s.impact[a.id]?.level === 'must');
  const missedMust = musts.filter((a) => !mine.includes(a.id));
  const extra = mine.filter((id) => !s.impact[id]);
  const shouldHit = mine.filter((id) => s.impact[id]?.level === 'should').length;
  const shouldTotal = areas.filter((a) => s.impact[a.id]?.level === 'should').length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Target size={17} className="text-brand" aria-hidden="true" /> Impact analysis: what did this change touch?
        </p>
        <p className="text-sm text-muted">Read the change, pick the regression areas you would test again, then check your answer.</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous change"
            className="rounded-full border border-line p-1.5 text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-30"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <p className="text-xs font-semibold tracking-wide text-faint uppercase" aria-live="polite">
            Change {index + 1} of {scenarios.length}
          </p>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(scenarios.length - 1, i + 1))}
            disabled={index === scenarios.length - 1}
            aria-label="Next change"
            className="rounded-full border border-line p-1.5 text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-30"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-subtle p-4">
          <p className="flex items-center gap-2 font-semibold text-fg">
            <GitCommitHorizontal size={16} className="shrink-0 text-brand" aria-hidden="true" /> {s.title}
          </p>
          <p className="mt-1 text-sm text-muted">{s.change}</p>
        </div>

        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Regression areas">
          {areas.map((a) => {
            const on = mine.includes(a.id);
            const imp = s.impact[a.id];
            let tone = on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-subtle';
            if (shown) {
              if (imp?.level === 'must') tone = on ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft';
              else if (imp?.level === 'should') tone = on ? 'border-ok bg-ok-soft' : 'border-warn bg-warn-soft';
              else tone = on ? 'border-warn bg-warn-soft' : 'border-line bg-surface';
            }
            return (
              <li key={a.id} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(a.id)}
                  className={`flex h-full w-full flex-col items-start rounded-xl border px-3 py-2 text-left text-sm text-fg transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tone}`}
                >
                  <span className="flex w-full items-center gap-2 font-medium">
                    <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${on ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'}`}>
                      {on ? '✓' : ''}
                    </span>
                    <span className="min-w-0 break-words">{a.label}</span>
                  </span>
                  {shown && (
                    <span className="mt-1 block text-xs text-muted">
                      <strong className="text-fg">{imp ? (imp.level === 'must' ? 'Must test again. ' : 'Worth a quick pass. ') : 'Not touched. '}</strong>
                      {imp ? imp.why : 'Nothing in this change reaches this area. The smoke suite on the new build still covers the basics.'}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRevealed((prev) => ({ ...prev, [s.id]: true }))}
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Check my picks
          </button>
          {shown && (
            <button
              type="button"
              onClick={() => {
                setRevealed((prev) => ({ ...prev, [s.id]: false }));
                setPicks((prev) => ({ ...prev, [s.id]: [] }));
              }}
              className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              Try again
            </button>
          )}
        </div>

        {shown && (
          <div className="space-y-1.5 rounded-xl border border-line bg-subtle p-3 text-sm text-fg" role="status">
            <p className="flex items-start gap-2">
              {missedMust.length === 0 ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" /> : <CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />}
              {missedMust.length === 0
                ? 'You caught every directly affected area.'
                : `You missed: ${missedMust.map((m) => m.label).join(', ')}. That is the part most likely to break, so this is a real risk.`}
            </p>
            <p className="flex items-start gap-2">
              <CircleCheck size={16} className={`mt-0.5 shrink-0 ${shouldHit === shouldTotal ? 'text-ok' : 'text-faint'}`} aria-hidden="true" />
              Connected areas picked: {shouldHit} of {shouldTotal}. These get a short pass, not the full suite.
            </p>
            {extra.length > 0 && (
              <p className="flex items-start gap-2">
                <CircleMinus size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                {extra.length} pick(s) this change does not touch. Not wrong, but that time could go to deeper testing of the risky area.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
