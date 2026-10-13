import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, CloudOff, Lock, Receipt, SearchX, TriangleAlert, WifiOff, XCircle } from 'lucide-react';
import { EmptyState, MiniScreen, OrderList, SkeletonList, ink, orders } from './States';

/** One Orders screen, seven states, a bad and a good version of each. */

type StateId = 'loading' | 'data' | 'first' | 'filtered' | 'offline' | 'error' | 'permission';

const states: { id: StateId; label: string; how: string; bad: string[]; good: string[] }[] = [
  {
    id: 'loading',
    label: 'Loading',
    how: 'Throttle the network (Slow 3G) or add a delay with a proxy breakpoint.',
    bad: ['A blank screen: is it loading or broken?', 'Nothing tells the user to wait'],
    good: ['Skeleton rows with the same shape as the real list', 'Header and tabs stay usable', 'Screen reader hears "Loading orders"'],
  },
  {
    id: 'data',
    label: 'Data',
    how: 'The normal case: an account with a few orders.',
    bad: ['The list loaded, but the empty message is still shown under it', 'Two states on screen at once'],
    good: ['Only the list is shown', 'Exactly one state at a time: loading, data, empty or error'],
  },
  {
    id: 'first',
    label: 'Empty: first use',
    how: 'Sign up with a fresh account that has never ordered.',
    bad: ['"No data" is technical and cold', 'No explanation and no next step', 'Looks like an error'],
    good: ['Says what will appear here', 'One clear action: Browse restaurants', 'Friendly, not alarming'],
  },
  {
    id: 'filtered',
    label: 'Empty: filtered',
    how: 'Pick a filter that matches nothing (here: Canceled).',
    bad: ['Says "No orders yet", but the user HAS orders', 'Suggests placing a first order', 'No way to clear the filter'],
    good: ['Names the filter: "No canceled orders"', 'One tap to show all orders again', 'Filter chips stay visible'],
  },
  {
    id: 'offline',
    label: 'Offline',
    how: 'Turn on airplane mode, or block the host in a proxy tool.',
    bad: ['Raw system error code', 'Blames nobody, helps nobody', 'Cached orders thrown away'],
    good: ['Plain "You\'re offline" with a fix', 'Keeps showing the last known orders', 'Retry, and reloads by itself when back online'],
  },
  {
    id: 'error',
    label: 'Server error',
    how: 'Map local the API to a 500 response, or use a proxy breakpoint.',
    bad: ['Shows a stack trace and a 500 code', '"Something went wrong" with no Retry', 'Dead end: the user can only kill the app'],
    good: ['Says what failed and that it\'s not the user\'s fault', 'Retry that really retries (once)', 'A second way out: Contact support'],
  },
  {
    id: 'permission',
    label: 'No permission',
    how: 'Log in as a team member without the admin role (403 from the API).',
    bad: ['Pretends there are no orders: "No orders yet"', 'The user thinks data was lost', 'No hint how to get access'],
    good: ['Explains it\'s about access, not missing data', 'Says who can help (an admin)', 'Action: Request access'],
  },
];

function Notes({ items, good }: { items: string[]; good: boolean }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className={`mt-0.5 shrink-0 ${good ? 'text-ok' : 'text-danger'}`}>{good ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</span>
          <span className="min-w-0 text-muted">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function StateExplorer() {
  const [state, setState] = useState<StateId>('first');
  const [retrying, setRetrying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const s = states.find((x) => x.id === state)!;

  const pick = (id: StateId) => {
    window.clearTimeout(timer.current);
    setRetrying(false);
    setState(id);
  };

  /** Good version: Retry shows progress, then recovers to the data state. */
  const retry = () => {
    setRetrying(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setRetrying(false);
      setState('loading');
      timer.current = window.setTimeout(() => setState('data'), 1200);
    }, 900);
  };

  const filter = state === 'filtered' ? 'Canceled' : 'All';

  let bad: ReactNode;
  let good: ReactNode;
  switch (state) {
    case 'loading':
      bad = <div className="h-full" />;
      good = (
        <>
          <span className="sr-only" role="status">
            Loading orders
          </span>
          <SkeletonList />
        </>
      );
      break;
    case 'data':
      bad = (
        <>
          <OrderList list={orders} />
          <p className="mt-4 text-center text-[12px]" style={{ color: ink.tertiary }}>
            You have no orders yet.
          </p>
        </>
      );
      good = <OrderList list={orders} />;
      break;
    case 'first':
      bad = (
        <p className="pt-24 text-center text-[13px]" style={{ color: ink.tertiary }}>
          No data
        </p>
      );
      good = <EmptyState icon={Receipt} title="No orders yet" body="When you order food, you'll find your orders and receipts here." primary="Browse restaurants" />;
      break;
    case 'filtered':
      bad = <EmptyState icon={Receipt} title="No orders yet" body="Hungry? Place your first order now!" primary="Browse restaurants" />;
      good = <EmptyState icon={SearchX} title="No canceled orders" body="None of your orders were canceled. Nice!" primary="Show all orders" onPrimary={() => pick('data')} />;
      break;
    case 'offline':
      bad = (
        <div className="px-4 pt-20 text-center">
          <p className="text-[14px] font-semibold">Error</p>
          <p className="mt-1 font-mono text-[11px] break-words" style={{ color: ink.secondary }}>
            NSURLErrorDomain Code=-1009
          </p>
        </div>
      );
      good = (
        <>
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-[#fff4e0] px-3 py-2 text-[11px] text-[#7a3e00]" role="status">
            <WifiOff size={14} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">You're offline. Showing orders from 10:42.</span>
            <button type="button" onClick={retry} disabled={retrying} className="shrink-0 font-semibold text-[#b45309] underline disabled:opacity-60">
              {retrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
          <OrderList list={orders} dim />
        </>
      );
      break;
    case 'error':
      bad = (
        <div className="px-3 pt-6">
          <p className="text-center text-[14px] font-semibold">Something went wrong</p>
          <pre className="mt-3 overflow-hidden rounded-lg bg-white p-2 font-mono text-[9px] leading-tight break-all whitespace-pre-wrap" style={{ color: '#c0262d' }}>
            {'500 Internal Server Error\nTypeError: Cannot read properties of undefined (reading \'map\')\n  at OrdersList (OrdersList.tsx:42)\n  at renderWithHooks (react-dom.js:1612)'}
          </pre>
        </div>
      );
      good = (
        <EmptyState
          icon={CloudOff}
          tone="error"
          title="We couldn't load your orders"
          body="This is a problem on our side, not yours. Please try again in a moment."
          primary="Try again"
          onPrimary={retry}
          primaryBusy={retrying}
          secondary="Contact support"
        />
      );
      break;
    case 'permission':
      bad = <EmptyState icon={Receipt} title="No orders yet" body="Hungry? Place your first order now!" primary="Browse restaurants" />;
      good = (
        <EmptyState icon={Lock} tone="warn" title="Only admins can see team orders" body="You're signed in to Acme Ltd. as a member. Ask an admin to give you access." primary="Request access" secondary="Switch to personal account" />
      );
      break;
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line p-3">
        <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-faint uppercase">Screen state</p>
        <div role="radiogroup" aria-label="Screen state" className="flex flex-wrap gap-1.5">
          {states.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={state === x.id}
              onClick={() => pick(x.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${state === x.id ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted hover:text-fg'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-sm text-muted">
          <span className="font-semibold text-fg">How testers create it: </span>
          {s.how}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 sm:p-6">
        <div className="min-w-0">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-danger">
            <TriangleAlert size={15} /> Bad
          </p>
          <MiniScreen filter={filter} label={`Bad version: ${s.label}`}>
            {bad}
          </MiniScreen>
          <Notes items={s.bad} good={false} />
        </div>
        <div className="min-w-0">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-ok">
            <CheckCircle2 size={15} /> Good
          </p>
          <MiniScreen filter={filter} label={`Good version: ${s.label}`}>
            {good}
          </MiniScreen>
          <Notes items={s.good} good />
        </div>
      </div>
    </div>
  );
}
