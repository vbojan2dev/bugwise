import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { ArrowDownAZ, CalendarClock, Image as ImageIcon, RotateCcw, Star, Tag, TrendingUp } from 'lucide-react';
import { BottomSheet, IOSActionSheet, IOSAlert, Layer, M3Dialog, M3Field, M3FullScreen, WebButton, WebModal } from './Dialogs';

type Kind = 'ios' | 'android' | 'web';
type Close = (how: string) => void;

const esc: Record<Kind, string> = { ios: 'Esc (keyboard)', android: 'Back / Esc', web: 'Esc' };

/** Fake app content behind the overlay. */
function MockApp({ kind, onOpen, trigger, label }: { kind: Kind; onOpen: () => void; trigger: React.RefObject<HTMLButtonElement | null>; label: string }) {
  const theme = {
    ios: { bg: '#f2f2f7', card: '#fff', accent: '#007aff', title: 'Albums' },
    android: { bg: '#fef7ff', card: '#f3edf7', accent: '#6750a4', title: 'Settings' },
    web: { bg: '#ffffff', card: '#f4f5f8', accent: '#2f6bff', title: 'Your cart' },
  }[kind];
  return (
    <div className="flex h-full flex-col text-[#111]" style={{ background: theme.bg }}>
      {kind === 'web' && (
        <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-black/10 bg-[#f6f7fb] px-3">
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} className="size-2 rounded-full" style={{ background: c }} />
          ))}
          <span className="mx-auto h-3.5 w-28 rounded bg-white ring-1 ring-black/10" />
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-hidden p-3">
        <p className="text-[17px] font-bold">{theme.title}</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-xl p-2" style={{ background: theme.card }}>
            <div className="grid size-8 place-items-center rounded-lg bg-black/10">
              <ImageIcon size={14} className="opacity-50" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2 w-3/4 rounded bg-black/15" />
              <div className="h-2 w-1/2 rounded bg-black/10" />
            </div>
          </div>
        ))}
        <button
          ref={trigger}
          type="button"
          onClick={onOpen}
          className="mt-1 w-full rounded-full py-2 text-[14px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: theme.accent, outlineColor: theme.accent }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  platform,
  note,
  closes,
  kind,
  trigger,
  placement = 'center',
  dismissOnScrim = true,
  scrim,
  children,
}: {
  title: string;
  platform: string;
  note: string;
  closes: string[];
  kind: Kind;
  trigger: string;
  placement?: 'center' | 'bottom' | 'full';
  dismissOnScrim?: boolean;
  scrim?: string;
  children: (close: Close) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('');
  const btn = useRef<HTMLButtonElement>(null);
  const close: Close = (how) => {
    setOpen(false);
    setLast(how);
  };
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid place-items-center bg-[#e9ebf2] px-4 py-5">
        <div className="relative h-[300px] w-full max-w-[280px] overflow-hidden rounded-[22px] border border-black/10 shadow-sm">
          <div className="h-full" inert={open}>
            <MockApp kind={kind} onOpen={() => setOpen(true)} trigger={btn} label={trigger} />
          </div>
          <Layer open={open} onClose={(r) => close(r === 'esc' ? esc[kind] : 'Tap outside')} placement={placement} dismissOnScrim={dismissOnScrim} scrim={scrim} returnTo={btn}>
            {children(close)}
          </Layer>
        </div>
        <p className="mt-2 h-4 text-[11px] text-[#5a5f70]" aria-live="polite">
          {last && <>Closed with: <strong>{last}</strong></>}
        </p>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {closes.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

/** Bottom sheet that can be dragged down by its handle to close. */
function SwipeSheet({ close }: { close: Close }) {
  const [dy, setDy] = useState(0);
  const start = useRef<number | null>(null);
  const down = (e: PointerEvent) => {
    start.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (start.current !== null) setDy(Math.max(0, e.clientY - start.current));
  };
  const up = () => {
    if (dy > 60) close('Swipe down');
    start.current = null;
    setDy(0);
  };
  const options = [
    { icon: Star, label: 'Recommended' },
    { icon: TrendingUp, label: 'Most popular' },
    { icon: Tag, label: 'Price: low to high' },
    { icon: ArrowDownAZ, label: 'Name A–Z' },
  ];
  return (
    <div style={{ transform: `translateY(${dy}px)`, transition: start.current === null ? 'transform .2s' : 'none' }}>
      <BottomSheet
        id="gal-sheet"
        title="Sort by"
        handle={
          <div className="flex cursor-grab touch-none justify-center pt-3 pb-2" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <span className="h-1 w-8 rounded-full bg-[#79747e]/60" />
          </div>
        }
      >
        <ul>
          {options.map((o, i) => (
            <li key={o.label}>
              <button
                type="button"
                onClick={() => close(`Picked "${o.label}"`)}
                data-autofocus={i === 0 || undefined}
                className="flex h-12 w-full items-center gap-4 px-6 text-left text-[15px] hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#6750a4]"
              >
                <o.icon size={18} className="text-[#49454f]" /> {o.label}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}

function FullScreenForm({ close }: { close: Close }) {
  const [name, setName] = useState('Team lunch');
  return (
    <M3FullScreen id="gal-full" title="New event" onClose={() => close('X button')} onSave={() => close('Save')}>
      <M3Field label="Title" value={name} onChange={setName} autoFocus />
      <M3Field label="Date" value="Fri, 14 Nov" />
      <M3Field label="Time" value="12:30 – 13:30" />
      <p className="mt-4 flex items-center gap-2 text-[13px] text-[#49454f]">
        <CalendarClock size={16} /> Reminder 10 min before
      </p>
    </M3FullScreen>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every demo works. Open each one and try every way out: the buttons, tapping outside, <kbd>Esc</kbd>, and (on the sheet) dragging the handle down.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Alert"
          platform="iOS"
          kind="ios"
          trigger="Delete album"
          dismissOnScrim={false}
          scrim="rgba(0,0,0,.25)"
          closes={['Buttons', 'Esc (hardware keyboard)']}
          note="Small, centered, max two side-by-side buttons. Tapping outside does nothing: the user must choose. Destructive actions are red, Cancel is bold."
        >
          {(close) => (
            <IOSAlert
              id="gal-alert"
              title="Delete “Lisbon 2025”?"
              message="The album will be removed, but the photos stay in your library."
              actions={[
                { label: 'Cancel', style: 'cancel', onClick: () => close('Cancel'), autoFocus: true },
                { label: 'Delete', style: 'destructive', onClick: () => close('Delete') },
              ]}
            />
          )}
        </Card>
        <Card
          title="Action sheet"
          platform="iOS"
          kind="ios"
          trigger="Remove photos"
          placement="bottom"
          scrim="rgba(0,0,0,.25)"
          closes={['Cancel', 'Tap outside', 'Pick an option']}
          note="Slides up from the bottom with a list of choices and a separate Cancel. On iPad it becomes a popover next to the button."
        >
          {(close) => (
            <IOSActionSheet
              id="gal-as"
              message="These photos will be deleted from all your devices."
              actions={[{ label: 'Delete 3 Photos', style: 'destructive', onClick: () => close('Delete 3 Photos') }]}
              cancel={{ label: 'Cancel', onClick: () => close('Cancel') }}
            />
          )}
        </Card>
        <Card
          title="Basic dialog"
          platform="Android · Material 3"
          kind="android"
          trigger="Reset settings"
          closes={['Buttons', 'Tap outside', 'Back']}
          note="Rounded 28dp surface, text buttons on the right: dismissive first, confirming last. The system Back gesture closes it."
        >
          {(close) => (
            <M3Dialog
              id="gal-m3"
              icon={<RotateCcw size={24} />}
              title="Reset settings?"
              body="This will reset your app preferences to their defaults. Your account and saved items won't change."
              actions={[
                { label: 'Cancel', onClick: () => close('Cancel'), autoFocus: true },
                { label: 'Reset', onClick: () => close('Reset') },
              ]}
            />
          )}
        </Card>
        <Card
          title="Full-screen dialog"
          platform="Android · Material 3"
          kind="android"
          trigger="New event"
          placement="full"
          closes={['X button', 'Save', 'Back']}
          note="For longer tasks on phones (forms, multiple fields). X closes, Save confirms. Closing with unsaved input should ask before throwing it away."
        >
          {(close) => <FullScreenForm close={close} />}
        </Card>
        <Card
          title="Modal dialog"
          platform="Web"
          kind="web"
          trigger="Remove item"
          closes={['Buttons', 'X', 'Click outside', 'Esc']}
          note="Usually a white card with an X, a backdrop and footer buttons. Built by hand far too often, so focus and Esc handling are frequent bugs."
        >
          {(close) => (
            <WebModal
              id="gal-web"
              title="Remove from cart?"
              width={250}
              onClose={() => close('X button')}
              footer={
                <>
                  <WebButton onClick={() => close('Cancel')} autoFocus>
                    Cancel
                  </WebButton>
                  <WebButton kind="danger" onClick={() => close('Remove')}>
                    Remove
                  </WebButton>
                </>
              }
            >
              “Trail running shoes, size 42” will be removed from your cart.
            </WebModal>
          )}
        </Card>
        <Card
          title="Modal bottom sheet"
          platform="Android · iOS · Web"
          kind="android"
          trigger="Sort results"
          placement="bottom"
          closes={['Drag down', 'Tap outside', 'Back / Esc', 'Pick an option']}
          note="Easy to reach with one thumb. iOS has sheets too (with detents, medium and large). Test the swipe-down gesture and what happens to typed data."
        >
          {(close) => <SwipeSheet close={close} />}
        </Card>
      </div>
    </div>
  );
}
