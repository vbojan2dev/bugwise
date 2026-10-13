import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Heart, Inbox, Pencil, User, Wifi } from 'lucide-react';
import { AndroidToast, IOSBanner, IOSHud, Snackbar, TimeBar, useCountdown, WebToast } from './Toasts';

/** Runs a countdown for one toast. ms = 0 means "stays until dismissed". */
function Timed({ ms, onEnd, pauseOnHover = false, children }: { ms: number; onEnd: () => void; pauseOnHover?: boolean; children: (left: number) => ReactNode }) {
  const [hold, setHold] = useState(false);
  const left = useCountdown(ms || 1, ms === 0 || (pauseOnHover && hold), onEnd);
  const h = pauseOnHover
    ? { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocus: () => setHold(true), onBlur: () => setHold(false) }
    : {};
  return <div {...h}>{children(ms === 0 ? 0 : left)}</div>;
}

function Card({ title, platform, note, timing, screen, bg = '#ffffff' }: { title: string; platform: string; note: string; timing: string; screen: ReactNode; bg?: string }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid place-items-center bg-[#e9ebf2] px-4 py-5">
        <div className="relative h-[270px] w-full max-w-[280px] overflow-hidden rounded-[22px] border border-black/10 text-[#111] shadow-sm" style={{ background: bg }}>
          {screen}
        </div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <p className="mt-2 inline-block rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">{timing}</p>
      </figcaption>
    </figure>
  );
}

function Trigger({ children, onClick, color = '#111' }: { children: ReactNode; onClick: () => void; color?: string }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2" style={{ background: color, outlineColor: color }}>
      {children}
    </button>
  );
}

function Lines({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl bg-black/[0.04] p-2">
          <div className="size-7 rounded-lg bg-black/10" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-3/4 rounded bg-black/15" />
            <div className="h-2 w-1/2 rounded bg-black/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* 1. Android Toast */
function AndroidToastDemo() {
  const [id, setId] = useState(0);
  return (
    <div className="flex h-full flex-col bg-[#fef7ff] p-3">
      <p className="mb-2 text-[16px] font-medium">Share recipe</p>
      <Lines n={2} />
      <div className="mt-3">
        <Trigger color="#6750a4" onClick={() => setId((x) => x + 1)}>
          Copy link
        </Trigger>
      </div>
      <div role="status" className="absolute inset-x-0 bottom-10">
        {id > 0 && (
          <Timed key={id} ms={2000} onEnd={() => setId(0)}>
            {() => <AndroidToast text="Link copied" />}
          </Timed>
        )}
      </div>
    </div>
  );
}

/* 2. Material snackbar with Undo, FAB moves up */
const mails = ['Lisbon trip itinerary', 'Your order has shipped', 'Team lunch on Friday?', 'Invoice #1042', 'Weekly running summary'];
function SnackbarDemo() {
  const [list, setList] = useState(mails);
  const [snack, setSnack] = useState<{ id: number; item: string; index: number } | null>(null);
  const nextId = useRef(1);
  const archive = () => {
    if (!list.length) return;
    const [item, ...rest] = list;
    setList(rest);
    setSnack({ id: nextId.current++, item, index: 0 });
  };
  const undo = () => {
    if (!snack) return;
    const s = snack;
    setList((l) => [...l.slice(0, s.index), s.item, ...l.slice(s.index)]);
    setSnack(null);
  };
  return (
    <div className="flex h-full flex-col bg-[#fef7ff]">
      <div className="flex items-center justify-between p-3 pb-1">
        <p className="text-[16px] font-medium">Inbox</p>
        <button type="button" onClick={archive} disabled={!list.length} className="rounded-full bg-[#e8def8] px-3 py-1.5 text-[12px] font-medium text-[#1d192b] disabled:opacity-40">
          Archive top
        </button>
      </div>
      <ul className="min-h-0 flex-1 overflow-hidden px-2">
        {list.map((m) => (
          <li key={m} className="flex items-center gap-2 px-1 py-1.5 text-[13px]">
            <span className="size-6 shrink-0 rounded-full bg-[#eaddff]" />
            <span className="truncate">{m}</span>
          </li>
        ))}
        {!list.length && <li className="p-3 text-[12px] text-[#49454f]">All done!</li>}
      </ul>
      <div
        aria-hidden="true"
        className="absolute right-3 grid size-12 place-items-center rounded-2xl bg-[#eaddff] text-[#21005d] shadow-md transition-[bottom] duration-200"
        style={{ bottom: snack ? 124 : 64 }}
      >
        <Pencil size={18} />
      </div>
      <div className="absolute inset-x-2 bottom-[60px]" role="status">
        {snack && (
          <Timed key={snack.id} ms={6000} onEnd={() => setSnack(null)}>
            {() => <Snackbar text="Conversation archived" action="Undo" onAction={undo} />}
          </Timed>
        )}
      </div>
      <nav aria-hidden="true" className="flex h-14 shrink-0 items-center justify-around bg-[#f3edf7]">
        {[Inbox, Heart, User].map((I, i) => (
          <span key={i} className={`grid h-7 w-12 place-items-center rounded-full ${i === 0 ? 'bg-[#e8def8]' : ''}`}>
            <I size={16} />
          </span>
        ))}
      </nav>
    </div>
  );
}

/* 3. iOS HUD */
function HudDemo() {
  const [id, setId] = useState(0);
  return (
    <div className="flex h-full flex-col bg-white p-3">
      <div className="mx-auto mt-2 size-24 rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#845ef7]" aria-hidden="true" />
      <p className="mt-3 text-center text-[15px] font-semibold">Midnight Drive</p>
      <p className="text-center text-[12px] text-[#8e8e93]">Lumen · Album</p>
      <div className="mt-3 text-center">
        <Trigger color="#fa2d48" onClick={() => setId((x) => x + 1)}>
          Add to Library
        </Trigger>
      </div>
      <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {id > 0 && (
          <Timed key={id} ms={1600} onEnd={() => setId(0)}>
            {() => <IOSHud icon={<Check size={44} strokeWidth={2.5} />} text="Added to Library" />}
          </Timed>
        )}
      </div>
    </div>
  );
}

/* 4. iOS in-app banner */
function BannerDemo() {
  const [id, setId] = useState(0);
  const [viewed, setViewed] = useState(false);
  return (
    <div className="flex h-full flex-col bg-[#f2f2f7] p-3 pt-16">
      <div className="rounded-2xl bg-white p-3">
        <div className="h-20 rounded-xl bg-[#e5e5ea]" aria-hidden="true" />
        <p className="mt-2 text-[14px] font-semibold">Trail running shoes</p>
        <p className="text-[12px] text-[#8e8e93]">€119.00 · Size 42</p>
        <div className="mt-2">
          <Trigger
            color="#007aff"
            onClick={() => {
              setViewed(false);
              setId((x) => x + 1);
            }}
          >
            Add to bag
          </Trigger>
        </div>
      </div>
      {viewed && <p className="mt-2 text-center text-[12px] text-[#3c3c43]">→ Opened your bag</p>}
      <div role="status" className="absolute inset-x-0 top-2">
        {id > 0 && (
          <Timed key={id} ms={4000} onEnd={() => setId(0)} pauseOnHover>
            {() => (
              <div className="transition duration-300 starting:-translate-y-6 starting:opacity-0">
                <IOSBanner
                  title="Added to bag"
                  text="Trail running shoes, size 42"
                  action="View"
                  onAction={() => {
                    setViewed(true);
                    setId(0);
                  }}
                />
              </div>
            )}
          </Timed>
        )}
      </div>
    </div>
  );
}

/* 5. Web toast stack */
interface WT {
  id: number;
  kind: 'success' | 'error';
}
function WebStackDemo() {
  const [toasts, setToasts] = useState<WT[]>([]);
  const nextId = useRef(1);
  const add = (kind: WT['kind']) => setToasts((t) => [{ id: nextId.current++, kind }, ...t].slice(0, 3));
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-black/10 bg-[#f6f7fb] px-3" aria-hidden="true">
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} className="size-2 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="p-3">
        <p className="text-[15px] font-semibold">Settings</p>
        <div className="mt-3 flex flex-col items-start gap-2">
          <Trigger color="#079455" onClick={() => add('success')}>
            Save
          </Trigger>
          <Trigger color="#d92d20" onClick={() => add('error')}>
            Fail
          </Trigger>
        </div>
      </div>
      <div className="absolute top-9 right-2 left-[84px] space-y-2" aria-live="polite">
        {toasts.map((t) => (
          <Timed key={t.id} ms={t.kind === 'error' ? 0 : 5000} onEnd={() => remove(t.id)} pauseOnHover>
            {(left) =>
              t.kind === 'success' ? (
                <WebToast title="Settings saved" onClose={() => remove(t.id)}>
                  <TimeBar left={left} total={5000} color="#079455" />
                </WebToast>
              ) : (
                <div role="alert">
                  <WebToast kind="error" title="Couldn't save" text="Stays until you close it." onClose={() => remove(t.id)} />
                </div>
              )
            }
          </Timed>
        ))}
      </div>
    </div>
  );
}

/* 6. Two-line snackbar with close icon */
function LongSnackDemo() {
  const [state, setState] = useState<'idle' | 'error' | 'sending' | 'sent'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const retry = () => {
    setState('sending');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('sent'), 900);
  };
  return (
    <div className="flex h-full flex-col bg-[#fef7ff] p-3">
      <p className="text-[16px] font-medium">Chat with Ana</p>
      <div className="mt-3 ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-[#6750a4] px-3 py-2 text-[13px] text-white">See you at 7 at the climbing gym!</div>
      <p className="mt-1 text-right text-[11px] text-[#49454f]">
        {state === 'sent' ? 'Sent ✓' : state === 'sending' ? 'Sending…' : state === 'error' ? 'Not sent' : ''}
      </p>
      <div className="mt-2">
        <Trigger color="#6750a4" onClick={() => setState('error')}>
          <span className="flex items-center gap-1.5">
            <Wifi size={14} /> Send offline
          </span>
        </Trigger>
      </div>
      <div className="absolute inset-x-2 bottom-3" role="status">
        {state === 'error' && (
          <div className="relative overflow-hidden rounded-[4px] bg-[#322f35] py-2 pr-1 pl-4 text-[#f5eff7] shadow-lg">
            <div className="flex items-start gap-1">
              <span className="flex-1 pt-1.5 text-[14px] leading-snug">Couldn't send message. Check your connection and try again.</span>
              <button type="button" onClick={() => setState('idle')} aria-label="Dismiss" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d0bcff]">
                ✕
              </button>
            </div>
            <div className="flex justify-end pr-2">
              <button type="button" onClick={retry} className="h-9 rounded-full px-3 text-[14px] font-medium text-[#d0bcff] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d0bcff]">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Tap the buttons inside each screen. Watch how long each message stays, where it appears, and what you can do with it.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Toast"
          platform="Android"
          timing="2 s (short) or 3.5 s (long)"
          note="The system Toast: a small pill near the bottom with plain text. No buttons, can't be tapped or swiped away. Android 12+ shows the app icon."
          screen={<AndroidToastDemo />}
        />
        <Card
          title="Snackbar with action"
          platform="Android · Material 3"
          timing="4–10 s, longer with an action"
          note="One action (here Undo). Appears above the bottom navigation and pushes the floating button up. Only one at a time: a new one replaces the old one."
          screen={<SnackbarDemo />}
        />
        <Card
          title="HUD"
          platform="iOS"
          timing="About 1.5–2 s"
          note="iOS has no native toast API. Some Apple apps have used a centered square like this for quick confirmations; third-party apps copy it or build their own."
          screen={<HudDemo />}
        />
        <Card
          title="In-app banner"
          platform="iOS"
          timing="About 4 s"
          note="A custom banner that slides down from the top, styled like a notification. Can hold one action (View). Hover or focus pauses it here."
          screen={<BannerDemo />}
          bg="#f2f2f7"
        />
        <Card
          title="Toast stack"
          platform="Web"
          timing="5 s for success, errors stay"
          note="Web apps usually stack toasts in a corner. Limit the stack (here 3), pause the timer on hover or focus, and give every toast a close button."
          screen={<WebStackDemo />}
        />
        <Card
          title="Two-line snackbar with close"
          platform="Android · Web"
          timing="Stays until dismissed or Retry"
          note="Longer messages wrap to two lines and the action moves below the text. A snackbar that waits for the user needs a close icon."
          screen={<LongSnackDemo />}
        />
      </div>
    </div>
  );
}
