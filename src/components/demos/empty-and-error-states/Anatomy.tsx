import { CloudOff } from 'lucide-react';
import { TabBar, ink } from './States';

const parts = [
  { n: 1, name: 'Illustration or icon', text: 'Sets the tone at a glance (offline, nothing here yet, locked). Decorative, so screen readers skip it.' },
  { n: 2, name: 'Headline: what happened', text: 'Plain words, no codes: "We couldn\'t load your orders", not "Error 503".' },
  { n: 3, name: 'Body: why, and what next', text: 'One or two sentences. Says whose problem it is (yours or ours) and what the user can do. No blame, no jargon.' },
  { n: 4, name: 'Primary action', text: 'The one thing that fixes it: Retry, Browse restaurants, Clear filters. It must actually work.' },
  { n: 5, name: 'Secondary action (optional)', text: 'A way out when the main fix fails: Contact support, Go to Home, Switch account.' },
  { n: 6, name: 'Surrounding UI stays usable', text: 'The navigation and header still work, so the user is never trapped on the error.' },
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
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-4 py-6">
        <div
          role="img"
          aria-label="An Orders screen showing an error state: a cloud icon, the headline 'We couldn't load your orders', an explanation, a blue Try again button and a Contact support link, with the tab bar still visible, with numbered markers"
          className="relative mx-auto flex h-[340px] max-w-[16rem] flex-col overflow-hidden rounded-[24px] border border-black/10 text-black"
          style={{ background: ink.bg }}
        >
          <p className="px-4 pt-4 text-[20px] font-bold" aria-hidden="true">
            Orders
          </p>
          <div aria-hidden="true" className="flex flex-1 flex-col items-center justify-center px-5 text-center">
            <span className="relative grid size-14 place-items-center rounded-full bg-[#fdecec] text-[#c0262d]">
              <CloudOff size={26} strokeWidth={1.75} />
              <Marker n={1} className="-top-2 -right-4" />
            </span>
            <p className="relative mt-3 text-[15px] font-semibold">
              We couldn't load your orders
              <Marker n={2} className="-top-4 -right-3" />
            </p>
            <p className="relative mt-1 text-[11px] leading-snug" style={{ color: ink.secondary }}>
              This is a problem on our side. Your orders are safe. Please try again in a moment.
              <Marker n={3} className="top-0 -left-5" />
            </p>
            <span className="relative mt-3 rounded-full px-5 py-2 text-[12px] font-semibold text-white" style={{ background: ink.blue }}>
              Try again
              <Marker n={4} className="-top-1 -right-7" />
            </span>
            <span className="relative mt-1.5 py-1 text-[12px] font-medium" style={{ color: ink.blue }}>
              Contact support
              <Marker n={5} className="top-0 -right-7" />
            </span>
          </div>
          <div className="relative">
            <TabBar />
            <Marker n={6} className="-top-3 left-2" />
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
