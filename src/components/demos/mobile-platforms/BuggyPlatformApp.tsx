import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Ellipsis, EllipsisVertical, RotateCcw, Bell, Clock, Pizza, Camera, MessageCircle, Map as MapIcon, Settings } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * A deliberately broken food-delivery app shipped to both platforms. Bugs (don't spoil them!):
 *  1. Android: system Back on the order screen closes the app instead of going back (only the on-screen chevron works).
 *  2. Android: the delivery-time picker is an iOS-style wheel instead of a Material picker.
 *  3. Android: "More" opens an iOS-style action sheet with a Cancel button; tapping outside does not dismiss it.
 *  4. Android: the "Cancel order?" dialog ignores system Back.
 *  5. iOS: swiping back from the left edge does nothing on the order screen.
 *  6. iOS: after "Don't Allow" on the notification prompt, the "Order updates" switch still shows ON.
 * Everything else behaves correctly.
 */

type Platform = 'android' | 'ios';
type Screen = 'orders' | 'detail' | 'home';
type Overlay = null | 'picker' | 'sheet' | 'dialog' | 'notif';
type Perm = 'unknown' | 'granted' | 'denied';

const slots = ['18:30', '19:00', '19:30', '20:00', '20:30'];
const iosFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';
const androidFont = 'Roboto, "Noto Sans", "Segoe UI", system-ui, sans-serif';

export function BuggyPlatformApp() {
  const [platform, setPlatform] = useState<Platform>('android');
  const [screen, setScreen] = useState<Screen>('orders');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [slot, setSlot] = useState('19:30');
  const [draftSlot, setDraftSlot] = useState('19:30');
  const [notifOn, setNotifOn] = useState(false);
  const [perm, setPerm] = useState<Perm>('unknown');
  const [canceled, setCancelled] = useState(false);
  const [toast, setToast] = useState('');
  const [input, setInput] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const inputTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(inputTimer.current);
    },
    [],
  );

  const ios = platform === 'ios';
  const accent = ios ? '#007aff' : '#6750a4';

  const showToast = (t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };
  const flashInput = (t: string) => {
    setInput(t);
    window.clearTimeout(inputTimer.current);
    inputTimer.current = window.setTimeout(() => setInput(''), 1200);
  };

  const restart = (p: Platform = platform) => {
    window.clearTimeout(toastTimer.current);
    setPlatform(p);
    setScreen('orders');
    setOverlay(null);
    setSlot('19:30');
    setDraftSlot('19:30');
    setNotifOn(false);
    setPerm('unknown');
    setCancelled(false);
    setToast('');
  };

  /* ----- System navigation ----- */
  const systemBack = () => {
    flashInput('◁ Back pressed');
    if (overlay === 'dialog') return; // BUG 4: dialog ignores system Back
    if (overlay) {
      setOverlay(null);
      return;
    }
    if (screen === 'detail') {
      setScreen('home'); // BUG 1: should go back to the Orders list
      return;
    }
    if (screen === 'orders') setScreen('home'); // correct: Back on the root screen leaves the app
  };

  const edgeSwipe = () => {
    flashInput('⟶ Edge swipe performed');
    // BUG 5: the interactive pop gesture is disabled on the order screen, so nothing happens.
  };

  const openPicker = () => {
    setDraftSlot(slot);
    setOverlay('picker');
  };

  const toggleNotif = () => {
    if (notifOn) {
      setNotifOn(false);
      return;
    }
    if (perm === 'unknown') {
      setOverlay('notif');
      return;
    }
    if (perm === 'granted') {
      setNotifOn(true);
      return;
    }
    // denied
    if (ios) setNotifOn(true); // part of BUG 6: the switch flips on although iOS will never deliver notifications
    else showToast('Notifications are blocked. Turn them on in Settings › Apps › FoodNow.');
  };

  const answerNotif = (allow: boolean) => {
    setOverlay(null);
    setPerm(allow ? 'granted' : 'denied');
    if (allow) setNotifOn(true);
    else if (ios) setNotifOn(true); // BUG 6
    else {
      setNotifOn(false);
      showToast('Order updates are off. You can enable them in Settings.');
    }
  };

  /* ----- Colors ----- */
  const bg = ios ? '#f2f2f7' : '#fef7ff';
  const card = ios ? '#fff' : '#f3edf7';
  const sub = ios ? '#8e8e93' : '#49454f';
  const fg = ios ? '#000' : '#1d1b20';

  const renderSwitch = (on: boolean) =>
    ios ? (
      <span className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors" style={{ background: on ? '#34c759' : '#e9e9eb' }}>
        <span className="absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-all" style={{ left: on ? 20 : 2 }} />
      </span>
    ) : (
      <span className="relative h-[26px] w-[44px] shrink-0 rounded-full border-2 transition-colors" style={{ background: on ? '#6750a4' : '#e6e0e9', borderColor: on ? '#6750a4' : '#79747e' }}>
        <span className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all" style={on ? { left: 19, width: 19, height: 19, background: '#fff' } : { left: 4, width: 12, height: 12, background: '#79747e' }} />
      </span>
    );

  /* ----- Screens ----- */
  const ordersScreen = (
    <div className="absolute inset-0 flex flex-col" style={{ background: bg, color: fg }}>
      {ios ? <p className="px-4 pt-5 pb-2 text-[27px] font-bold tracking-tight">Orders</p> : <p className="flex h-14 shrink-0 items-center px-4 text-[20px]">Orders</p>}
      <div className="space-y-2 px-3.5">
        <button type="button" onClick={() => setScreen('detail')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left" style={{ background: card }}>
          <span className="grid size-9 place-items-center rounded-lg bg-[#fde68a] text-[#92400e]">
            <Pizza size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">Order #4821</span>
            <span className="block text-[12px]" style={{ color: sub }}>
              Pizza Place · {canceled ? 'Canceled' : `Arriving ${slot}`}
            </span>
          </span>
          <ChevronRight size={16} style={{ color: sub }} />
        </button>
        <div className="rounded-xl px-3 py-3 text-[12px]" style={{ background: card, color: sub }}>
          Order #4790 · Sushi Bar · Delivered yesterday
        </div>
      </div>
    </div>
  );

  const detailScreen = (
    <div className="absolute inset-0 flex flex-col" style={{ background: bg, color: fg }}>
      <div className="relative flex h-12 shrink-0 items-center px-1.5">
        {/* Android also uses an iOS-style chevron + text: part of the platform mix-up in BUG 1 */}
        <button type="button" onClick={() => setScreen('orders')} className="flex items-center text-[15px]" style={{ color: accent }}>
          <ChevronLeft size={24} strokeWidth={2.2} />
          <span className="-ml-0.5">Orders</span>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">Order #4821</span>
        <button type="button" aria-label="More options" onClick={() => setOverlay('sheet')} className="ml-auto grid size-10 place-items-center rounded-full" style={{ color: ios ? accent : '#49454f' }}>
          {ios ? <Ellipsis size={20} /> : <EllipsisVertical size={20} />}
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 pt-1 pb-8">
        <div className="rounded-xl px-3 py-2.5" style={{ background: card }}>
          <p className="text-[12px]" style={{ color: sub }}>
            Pizza Place
          </p>
          <p className="mt-1 text-[14px]">1 × Margherita, large</p>
          <p className="text-[14px]">2 × Garlic bread</p>
          <div className="mt-2 flex justify-between border-t pt-2 text-[14px] font-semibold" style={{ borderColor: ios ? '#e5e5ea' : '#cac4d0' }}>
            <span>Total</span>
            <span>€24.70</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl" style={{ background: card }}>
          <button type="button" disabled={canceled} onClick={openPicker} className="flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:opacity-50">
            <Clock size={17} style={{ color: accent }} />
            <span className="min-w-0 flex-1 text-[14px]">Delivery time</span>
            <span className="text-[13px]" style={{ color: sub }}>
              Today, {slot}
            </span>
            <ChevronRight size={15} style={{ color: sub }} />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={notifOn}
            onClick={toggleNotif}
            className="flex w-full items-center gap-3 border-t px-3 py-2.5 text-left"
            style={{ borderColor: ios ? '#e5e5ea' : '#e7e0ec' }}
          >
            <Bell size={17} style={{ color: accent }} />
            <span className="min-w-0 flex-1 text-[14px]">Order updates</span>
            {renderSwitch(notifOn)}
          </button>
        </div>
        {canceled ? (
          <p className="rounded-xl px-3 py-2.5 text-center text-[13px] font-medium text-[#b3261e]" style={{ background: card }}>
            Order canceled · refund in 3–5 days
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setOverlay('dialog')}
            className={`block w-full py-2.5 text-[14px] font-medium ${ios ? 'rounded-xl text-[#ff3b30]' : 'rounded-full border border-[#79747e] text-[#b3261e]'}`}
            style={ios ? { background: card } : undefined}
          >
            Cancel order
          </button>
        )}
      </div>
    </div>
  );

  const homeScreen = (
    <div className="absolute inset-0 flex flex-col items-center bg-[linear-gradient(160deg,#3b3363,#1e293b)] pt-10 text-white" style={{ fontFamily: androidFont }}>
      <p className="text-[38px] font-light">9:41</p>
      <p className="text-[12px] opacity-80">Tuesday, 13 October</p>
      <div className="mt-auto mb-16 grid grid-cols-4 gap-x-5 gap-y-3 text-[10px]">
        {[
          { icon: Camera, label: 'Camera', bg: '#475569', app: false },
          { icon: MessageCircle, label: 'Messages', bg: '#0ea5e9', app: false },
          { icon: MapIcon, label: 'Maps', bg: '#16a34a', app: false },
          { icon: Pizza, label: 'FoodNow', bg: '#f97316', app: true },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            aria-label={a.app ? 'Open FoodNow' : a.label}
            onClick={() => (a.app ? setScreen('orders') : undefined)}
            className="flex flex-col items-center gap-1"
          >
            <span className="grid size-11 place-items-center rounded-full" style={{ background: a.bg }}>
              <a.icon size={20} />
            </span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );

  /* ----- Overlays ----- */
  const wheel = (
    <div className="relative my-2 h-[150px] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-[#767680]/15" />
      <div className="absolute inset-x-0 top-1/2 transition-transform duration-200" style={{ transform: `translateY(${-16 - slots.indexOf(draftSlot) * 32}px)` }}>
        {slots.map((s) => {
          const d = Math.abs(slots.indexOf(s) - slots.indexOf(draftSlot));
          return (
            <button key={s} type="button" onClick={() => setDraftSlot(s)} className="block h-8 w-full text-center text-[19px] text-black tabular-nums" style={{ opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.2 }}>
              Today &nbsp; {s}
            </button>
          );
        })}
      </div>
    </div>
  );

  let overlayEl = null;
  if (overlay === 'picker') {
    // BUG 2: the same iOS wheel is used on Android.
    overlayEl = (
      <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/30" onClick={() => setOverlay(null)}>
        <div className="rounded-t-[14px] bg-[#f9f9f9] pb-6" style={{ fontFamily: iosFont }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-[#c6c6c8]/70 px-4 py-2.5 text-[15px] text-[#007aff]">
            <button type="button" onClick={() => setOverlay(null)}>
              Cancel
            </button>
            <span className="font-semibold text-black">Delivery time</span>
            <button
              type="button"
              className="font-semibold"
              onClick={() => {
                setSlot(draftSlot);
                setOverlay(null);
                showToast(`Delivery time changed to ${draftSlot}.`);
              }}
            >
              Done
            </button>
          </div>
          {wheel}
        </div>
      </div>
    );
  } else if (overlay === 'sheet') {
    // BUG 3 on Android: iOS action sheet, scrim tap ignored. On iOS a scrim tap correctly cancels.
    overlayEl = (
      <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/35 px-2 pb-6" onClick={() => (ios ? setOverlay(null) : undefined)}>
        <div className="space-y-2" style={{ fontFamily: iosFont }} onClick={(e) => e.stopPropagation()}>
          <div className="overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center">
            <p className="px-4 py-2.5 text-[12px] text-[#8e8e93]">Order #4821</p>
            {['Share Receipt', 'Get Help'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setOverlay(null);
                  showToast(a === 'Share Receipt' ? 'Opening the share sheet…' : 'Connecting you to support…');
                }}
                className="block w-full border-t border-[#3c3c43]/25 py-3 text-[16px] text-[#007aff]"
              >
                {a}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOverlay(null)} className="block w-full rounded-[14px] bg-white py-3 text-[16px] font-semibold text-[#007aff]">
            Cancel
          </button>
        </div>
      </div>
    );
  } else if (overlay === 'dialog') {
    const confirm = () => {
      setOverlay(null);
      setCancelled(true);
    };
    overlayEl = ios ? (
      <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4">
        <div role="alertdialog" aria-label="Cancel this order?" className="w-full max-w-[230px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[15px] font-semibold">Cancel this order?</p>
            <p className="mt-1 text-[12px] leading-snug">You’ll be refunded in 3–5 days.</p>
          </div>
          <div className="grid grid-cols-2 border-t border-[#3c3c43]/30 text-[15px]">
            <button type="button" onClick={() => setOverlay(null)} className="border-r border-[#3c3c43]/30 py-2.5 font-semibold text-[#007aff]">
              Keep Order
            </button>
            <button type="button" onClick={confirm} className="py-2.5 text-[#ff3b30]">
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4" onClick={() => setOverlay(null)}>
        <div role="alertdialog" aria-label="Cancel this order?" onClick={(e) => e.stopPropagation()} className="w-full max-w-[236px] rounded-[28px] bg-[#ece6f0] p-5 text-[#1d1b20]">
          <p className="text-[19px] leading-tight">Cancel this order?</p>
          <p className="mt-3 text-[13px] leading-snug text-[#49454f]">You’ll be refunded in 3–5 days.</p>
          <div className="mt-5 flex justify-end gap-1 text-[13px] font-medium text-[#6750a4]">
            <button type="button" onClick={() => setOverlay(null)} className="rounded-full px-3 py-2">
              Keep order
            </button>
            <button type="button" onClick={confirm} className="rounded-full px-3 py-2">
              Cancel order
            </button>
          </div>
        </div>
      </div>
    );
  } else if (overlay === 'notif') {
    overlayEl = ios ? (
      <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4">
        <div role="alertdialog" aria-label="FoodNow would like to send you notifications" className="w-full max-w-[240px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[14px] leading-snug font-semibold">“FoodNow” Would Like to Send You Notifications</p>
            <p className="mt-1 text-[11.5px] leading-snug">Notifications may include alerts, sounds and icon badges. These can be configured in Settings.</p>
          </div>
          <div className="grid grid-cols-2 border-t border-[#3c3c43]/30 text-[15px] text-[#007aff]">
            <button type="button" onClick={() => answerNotif(false)} className="border-r border-[#3c3c43]/30 py-2.5">
              Don’t Allow
            </button>
            <button type="button" onClick={() => answerNotif(true)} className="py-2.5 font-semibold">
              Allow
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4">
        <div role="alertdialog" aria-label="Allow FoodNow to send you notifications?" className="w-full max-w-[244px] rounded-[28px] bg-[#ece6f0] p-4 text-center text-[#1d1b20]">
          <Bell size={22} className="mx-auto text-[#6750a4]" />
          <p className="mt-2 text-[15px] leading-snug">
            Allow <strong className="font-semibold">FoodNow</strong> to send you notifications?
          </p>
          <div className="mt-4 space-y-1.5 text-[13px] font-medium text-[#21005d]">
            <button type="button" onClick={() => answerNotif(true)} className="block w-full rounded-full bg-[#e8def8] py-2">
              Allow
            </button>
            <button type="button" onClick={() => answerNotif(false)} className="block w-full rounded-full bg-[#e8def8] py-2">
              Don’t allow
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame os={platform} width={272}>
        <div className="absolute inset-0" style={{ fontFamily: ios ? iosFont : androidFont }}>
          {screen === 'orders' && ordersScreen}
          {screen === 'detail' && detailScreen}
          {screen === 'home' && homeScreen}
          {screen !== 'home' && overlayEl}
          {toast && screen !== 'home' && (
            <div
              role="status"
              className={`absolute inset-x-3 bottom-8 z-20 px-3 py-2.5 text-[12px] leading-snug ${ios ? 'rounded-xl bg-[#1c1c1e]/90 text-center text-white' : 'rounded-[4px] bg-[#322f35] text-[#f5eff7]'}`}
            >
              {toast}
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Device</p>
          <button type="button" onClick={() => restart()} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Restart app
          </button>
        </div>
        <div role="radiogroup" aria-label="Test device" className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1 text-sm font-medium">
          {(['android', 'ios'] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={platform === p}
              onClick={() => platform !== p && restart(p)}
              className={`rounded-lg py-1.5 ${platform === p ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {p === 'android' ? 'Pixel · Android' : 'iPhone · iOS'}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {ios ? (
            <button type="button" onClick={edgeSwipe} className="flex-1 rounded-lg bg-subtle px-3 py-2 text-sm font-medium text-fg hover:bg-[var(--color-line)]">
              ⟶ Swipe back from left edge
            </button>
          ) : (
            <button type="button" onClick={systemBack} className="flex-1 rounded-lg bg-subtle px-3 py-2 text-sm font-medium text-fg hover:bg-[var(--color-line)]">
              ◁ System Back
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-2 flex min-h-[1.25rem] items-center gap-1.5 text-xs text-muted">
          {input ? (
            input
          ) : (
            <>
              <Settings size={12} /> {ios ? 'iOS has no Back button: users swipe from the left edge.' : 'Gesture navigation: Back = swipe in from the screen edge.'}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
