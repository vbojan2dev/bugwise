import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

const parts = [
  { n: 1, name: 'Loaded items', text: 'Everything fetched so far. Each request adds one more page (often 10–30 items).' },
  { n: 2, name: 'Viewport', text: 'What the user sees right now. Everything else is above or below it.' },
  { n: 3, name: 'Prefetch distance', text: 'How early the next page starts loading, e.g. one screen before the end, so people rarely wait.' },
  { n: 4, name: 'Sentinel', text: 'An invisible marker after the last item. When it comes close to the viewport, the next page is requested.' },
  { n: 5, name: 'Loading row', text: 'A small spinner at the bottom while the next page loads. Must disappear on success, error and at the end.' },
  { n: 6, name: 'Error row', text: '“Couldn’t load more. Retry” right where the next items would be, without losing the loaded ones.' },
  { n: 7, name: 'End of list', text: '“You’ve seen all 120 results.” Stops the spinner and makes the footer reachable.' },
];

function M({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="relative block">
      {children}
      <span className="absolute top-1/2 -right-3 z-10 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-[#5b4bff] text-[10px] font-bold text-white ring-[3px] ring-[#5b4bff]/20" aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

const Row = ({ w }: { w: string }) => (
  <span className="flex items-center gap-2 border-b border-[#e5e5ea] px-3 py-2">
    <span className="size-6 shrink-0 rounded-md bg-[#d9dce6]" />
    <span className="h-1.5 rounded bg-[#c7cad6]" style={{ width: w }} />
  </span>
);

export default function Anatomy() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 items-center gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 md:grid-cols-[1fr_1fr]">
      <div className="min-w-0 rounded-2xl bg-[#e9ebf2] px-6 py-6 sm:px-10" style={{ colorScheme: 'light' }}>
        <div
          role="img"
          aria-label="A long list. Loaded rows at the top, a highlighted viewport box around the rows the user sees, a shaded prefetch zone below it, a dashed sentinel line after the last row, then a loading row with a spinner. Below, separately, an error row with Retry and an end-of-list message."
          className="mx-auto max-w-[15rem] text-[#0e1120]"
        >
          <M n={1}>
            <span className="block overflow-hidden rounded-t-xl bg-white opacity-60">
              <Row w="60%" />
              <Row w="45%" />
            </span>
          </M>
          <M n={2}>
            <span className="relative block bg-white outline-[3px] outline-[#2f6bff] outline-solid">
              <Row w="70%" />
              <Row w="50%" />
              <Row w="62%" />
              <span className="absolute -top-2.5 left-2 rounded bg-[#2f6bff] px-1 text-[9px] font-semibold text-white">on screen</span>
            </span>
          </M>
          <M n={3}>
            <span className="block bg-[repeating-linear-gradient(135deg,#fff,#fff_6px,#eef1ff_6px,#eef1ff_12px)]">
              <Row w="55%" />
              <Row w="40%" />
            </span>
          </M>
          <M n={4}>
            <span className="block h-0 border-t-2 border-dashed border-[#d92d20]" />
          </M>
          <M n={5}>
            <span className="flex items-center justify-center gap-2 rounded-b-xl bg-white py-2.5 text-[11px] text-[#5a5f70]">
              <span className="size-3.5 rounded-full border-2 border-[#c7cad6] border-t-[#5a5f70]" /> Loading more…
            </span>
          </M>
          <div className="mt-5 space-y-2">
            <M n={6}>
              <span className="flex items-center gap-2 rounded-xl bg-[#fdecea] px-3 py-2 text-[11px] text-[#8c1d18]">
                <span className="min-w-0 flex-1">Couldn’t load more.</span>
                <span className="flex items-center gap-1 font-semibold">
                  <RefreshCw size={11} /> Retry
                </span>
              </span>
            </M>
            <M n={7}>
              <span className="block rounded-xl bg-white py-2 text-center text-[11px] text-[#5a5f70]">You’ve seen all 120 results</span>
            </M>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#5a5f70]">One list, three possible bottoms: loading, error or the end</p>
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
