import type React from 'react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  EllipsisVertical,
  Flag,
  Home,
  LifeBuoy,
  MapPin,
  Receipt,
  Search,
  Share2,
  Trash2,
  User,
  Check,
  Lightbulb,
  ListChecks,
} from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';

/*
 * "Same screen, two platforms" explorer. The same food-delivery order screen is rendered
 * the iOS way and the Android (Material 3) way. Numbered hotspots explain each difference.
 */

type Platform = 'ios' | 'android';
type SceneId = 'nav' | 'alert' | 'permission' | 'sheet';

interface Spot {
  title: string;
  ios: string;
  android: string;
  test: string[];
}

const scenes: { id: SceneId; label: string; spots: Spot[] }[] = [
  {
    id: 'nav',
    label: 'Navigation',
    spots: [
      {
        title: 'Going back',
        ios: 'A chevron with the previous screen’s title in the navigation bar, plus a swipe from the left edge of the screen. There is no system Back button.',
        android: 'An arrow in the top app bar, plus the system Back: a swipe from the left or right edge (gesture navigation) or the ◁ button (3-button navigation). Android 14+ can show a predictive back preview of where you’ll land.',
        test: [
          'Android: press system Back on every screen, including with the keyboard, a dialog or a sheet open.',
          'iOS: swipe back from the left edge on every pushed screen. Start a swipe, then cancel it halfway.',
          'Back never loses typed data without asking, and never exits the app from a deep screen.',
        ],
      },
      {
        title: 'Title and system font',
        ios: 'Title centered in the navigation bar (or a large, left-aligned title on top-level screens). System font: SF Pro.',
        android: 'Title left-aligned in the top app bar (a centered variant exists). Material’s default font is Roboto, but Samsung, Xiaomi and others ship their own system fonts.',
        test: [
          'Long titles truncate with an ellipsis and don’t collide with the back or menu buttons.',
          'Check the layout with the largest text size on both platforms (Dynamic Type / Font size).',
        ],
      },
      {
        title: 'Switch',
        ios: 'Green pill switch (UISwitch / SwiftUI Toggle). Gives a light haptic tap on iPhone.',
        android: 'Material 3 switch: the thumb grows when on and can show a check icon. Color follows the app theme.',
        test: [
          'The tap target is big enough: 44×44 pt on iOS, 48×48 dp on Android.',
          'VoiceOver says “Switch button, on”; TalkBack says “On, switch”.',
          'The setting really changes, and survives an app restart.',
        ],
      },
      {
        title: 'Tab bar vs navigation bar',
        ios: 'Tab bar: icons with labels, active tab tinted. Tapping the active tab again pops to its root screen or scrolls to the top.',
        android: 'Material 3 navigation bar: the active destination gets a pill-shaped indicator. System Back from another tab usually returns to the start tab, then leaves the app.',
        test: [
          'Re-tap the active tab: does it scroll to top or go to the tab’s first screen?',
          'Each tab keeps its own state (scroll position, opened screen) when you switch away and back.',
          'Android: press Back from a non-start tab and check where you land.',
        ],
      },
    ],
  },
  {
    id: 'alert',
    label: 'Alert vs dialog',
    spots: [
      {
        title: 'Shape and layout',
        ios: 'Alert: small, centered, title and message centered. Two buttons sit side by side; three or more are stacked. The safe choice is bold, destructive ones are red.',
        android: 'Material 3 dialog: larger rounded corners, left-aligned title and text, text buttons aligned to the bottom right.',
        test: [
          'Long translations and large text: buttons stack instead of being clipped.',
          'A destructive action is clearly marked and is not the default/bold choice.',
        ],
      },
      {
        title: 'How it can be dismissed',
        ios: 'An alert cannot be dismissed by tapping outside it. The user must pick a button.',
        android: 'By default, tapping the dimmed area (scrim) or pressing system Back dismisses the dialog, which should count as “cancel”.',
        test: [
          'Android: press Back and tap outside. The dialog closes and nothing is deleted or confirmed.',
          'iOS: tapping outside does nothing, and every path out of the alert is a button.',
        ],
      },
      {
        title: 'Button order and wording',
        ios: 'Cancel-type action usually on the left, the action on the right.',
        android: 'Confirming action on the far right, dismissive action to its left.',
        test: [
          'Buttons use clear verbs (“Cancel order” / “Keep order”), not just “OK” and “Cancel”.',
          'An app that uses the same custom dialog on both platforms still feels natural on each.',
        ],
      },
    ],
  },
  {
    id: 'permission',
    label: 'Permission prompt',
    spots: [
      {
        title: 'The choices',
        ios: '“Allow Once”, “Allow While Using App”, “Don’t Allow”. iOS shows the system prompt only once per permission. After “Don’t Allow”, only the Settings app can turn it back on.',
        android: '“While using the app”, “Only this time”, “Don’t allow”. If the user denies the same permission twice, Android stops showing the dialog (it acts like “Don’t ask again”).',
        test: [
          'Test every choice, including denying. The feature must degrade gracefully, not crash or loop.',
          'After a permanent denial, the app explains how to enable it in Settings and offers a shortcut.',
          'One-time access really expires: reopen the app later and check it asks again.',
        ],
      },
      {
        title: 'Who writes the text',
        ios: 'The message under the title is the app’s own “purpose string”. Apple requires it and App Review checks it.',
        android: 'The system dialog has no custom message, so good apps show their own explanation (a rationale screen) before or after asking.',
        test: [
          'The explanation is clear, honest, translated, and matches what the feature actually does.',
          'The app asks at the moment the feature is needed, not all permissions on first launch.',
        ],
      },
      {
        title: 'Precise vs approximate',
        ios: 'A “Precise” toggle on the map lets the user share only an approximate location.',
        android: 'Android 12+ lets the user choose “Precise” or “Approximate” in the same dialog.',
        test: [
          'With approximate location, address search and delivery tracking still work sensibly.',
          'Revoke or downgrade the permission in Settings while the app is in the background, then return.',
        ],
      },
    ],
  },
  {
    id: 'sheet',
    label: 'Action sheet vs bottom sheet',
    spots: [
      {
        title: 'Container',
        ios: 'Action sheet: a stack of plain text actions near the bottom, with destructive actions in red. On iPad it appears as a popover next to the button.',
        android: 'Modal bottom sheet: a surface with a drag handle and list items with icons, sliding up from the bottom edge.',
        test: [
          'The right pattern is used on each platform (no iOS action sheet inside an Android app).',
          'iPad / tablets: the sheet appears in a sensible place and size.',
        ],
      },
      {
        title: 'Sharing',
        ios: '“Share” should open the iOS share sheet with AirDrop, Messages and app extensions.',
        android: '“Share” should open the Android Sharesheet with direct share targets and apps.',
        test: [
          'Share to a few apps, cancel the share, and share while offline.',
          'The shared content (link, receipt, text) is correct and opens the right screen when tapped.',
        ],
      },
      {
        title: 'Dismissing',
        ios: 'A separate Cancel button at the bottom. On iPhone, tapping outside also cancels.',
        android: 'No Cancel button: swipe the sheet down, tap the scrim, or press system Back.',
        test: [
          'Android: Back closes the sheet first, and a second Back goes back a screen.',
          'Dismissing never triggers one of the actions by accident.',
        ],
      },
    ],
  },
];

const iosFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';
const androidFont = 'Roboto, "Noto Sans", "Segoe UI", system-ui, sans-serif';

// Rendered as a <span role="button"> because hotspots sit inside other buttons in the mock UI,
// and a <button> inside a <button> is invalid HTML (it breaks hydration).
function Hotspot({ n, active, onPick, label, className = '' }: { n: number; active: boolean; onPick: (n: number) => void; label: string; className?: string }) {
  const pick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onPick(n);
  };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') pick(e);
      }}
      aria-label={`Difference ${n}: ${label}`}
      aria-pressed={active}
      className={`absolute z-20 grid size-[22px] cursor-pointer place-items-center rounded-full text-[11px] font-bold shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-1 ${
        active ? 'scale-110 bg-[#f97316] text-white ring-2 ring-white' : 'bg-[#fbbf24] text-[#3b2a00]'
      } ${className}`}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {n}
    </span>
  );
}

function IosSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label="Contactless delivery" onClick={onToggle} className="relative h-[28px] w-[46px] shrink-0 rounded-full transition-colors" style={{ background: on ? '#34c759' : '#e9e9eb' }}>
      <span className="absolute top-[2px] size-[24px] rounded-full bg-white shadow transition-all" style={{ left: on ? 20 : 2 }} />
    </button>
  );
}

function M3Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Contactless delivery"
      onClick={onToggle}
      className="relative h-[28px] w-[46px] shrink-0 rounded-full border-2 transition-colors"
      style={{ background: on ? '#6750a4' : '#e6e0e9', borderColor: on ? '#6750a4' : '#79747e' }}
    >
      <span
        className="absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full transition-all"
        style={on ? { left: 19, width: 21, height: 21, background: '#fff', color: '#21005d' } : { left: 4, width: 13, height: 13, background: '#79747e' }}
      >
        {on && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

const tabs = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: Receipt, label: 'Orders' },
  { icon: User, label: 'Account' },
];

export default function PlatformExplorer() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [scene, setScene] = useState<SceneId>('nav');
  const [spot, setSpot] = useState(1);
  const [screen, setScreen] = useState<'list' | 'detail'>('detail');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [contactless, setContactless] = useState(true);
  const [note, setNote] = useState('');
  const noteTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const say = (t: string) => {
    setNote(t);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(''), 3500);
  };

  const pickScene = (id: SceneId) => {
    setScene(id);
    setSpot(1);
    setScreen('detail');
    setOverlayOpen(id !== 'nav');
    setNote('');
  };

  const pickPlatform = (p: Platform) => {
    setPlatform(p);
    setNote('');
  };

  const current = scenes.find((s) => s.id === scene)!;
  const sp = current.spots[spot - 1];
  const ios = platform === 'ios';
  const font = ios ? iosFont : androidFont;

  const closeOverlay = (msg?: string) => {
    setOverlayOpen(false);
    if (msg) say(msg);
  };

  const systemBack = () => {
    if (overlayOpen) {
      if (scene === 'permission') closeOverlay('System Back dismissed the prompt. The app gets a “denied” result and may ask again later.');
      else closeOverlay(`System Back closed the ${scene === 'alert' ? 'dialog' : 'bottom sheet'}, just like Cancel. Press Back again to leave the screen.`);
      return;
    }
    if (screen === 'detail') {
      setScreen('list');
      say('System Back returned to the Orders screen.');
    } else say('System Back on a top-level screen would leave the app (Android shows the home screen).');
  };

  const edgeSwipe = () => {
    if (overlayOpen) {
      say('Nothing happens: an alert, prompt or action sheet must be answered first.');
      return;
    }
    if (screen === 'detail') {
      setScreen('list');
      say('The edge swipe slid the screen away and revealed the Orders list.');
    } else say('Nothing happens: this is the first screen of the tab, so there is nowhere to go back to.');
  };

  const P = (n: number, className: string) => <Hotspot n={n} active={spot === n} onPick={setSpot} label={current.spots[n - 1]?.title ?? ''} className={className} />;
  const showNavSpots = scene === 'nav' && screen === 'detail';

  /* ---------- Base screens ---------- */
  const iosDetail = (
    <div className="absolute inset-0 flex flex-col bg-[#f2f2f7] text-black">
      <div className="relative flex h-11 shrink-0 items-center px-1.5">
        <button type="button" onClick={() => { setScreen('list'); }} className="relative flex items-center text-[15px] text-[#007aff]">
          <ChevronLeft size={24} strokeWidth={2.2} />
          <span className="-ml-0.5">Orders</span>
          {showNavSpots && P(1, '-top-3 -left-1')}
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">
          Order #4821
        </span>
        {showNavSpots && P(2, 'top-0 left-[66%]')}
        <span className="ml-auto grid size-8 place-items-center text-[#007aff]">
          <Ellipsis size={20} />
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-3.5 pt-2">
        <div className="rounded-[10px] bg-white px-3 py-2.5">
          <p className="text-[12px] text-[#8e8e93]">Pizza Place · Arriving 19:40</p>
          <p className="mt-1 text-[14px]">1 × Margherita, large</p>
          <p className="text-[14px]">2 × Garlic bread</p>
          <div className="mt-2 flex justify-between border-t border-[#c6c6c8]/60 pt-2 text-[14px] font-semibold">
            <span>Total</span>
            <span>€24.70</span>
          </div>
        </div>
        <div className="relative rounded-[10px] bg-white">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[14px]">Contactless delivery</span>
            <IosSwitch on={contactless} onToggle={() => setContactless((v) => !v)} />
          </div>
          {showNavSpots && P(3, '-top-2 right-14')}
          <div className="ml-3 border-t border-[#c6c6c8]/60 py-2.5 pr-3 text-[14px] text-[#ff3b30]">Cancel Order</div>
        </div>
      </div>
      <div className="relative grid shrink-0 grid-cols-4 border-t border-[#c6c6c8]/70 bg-[#f9f9f9]/95 pt-1.5 pb-6">
        {tabs.map((t) => (
          <span key={t.label} className="flex flex-col items-center gap-0.5 text-[10px] font-medium" style={{ color: t.label === 'Orders' ? '#007aff' : '#8e8e93' }}>
            <t.icon size={21} />
            {t.label}
          </span>
        ))}
        {showNavSpots && P(4, '-top-3 left-3')}
      </div>
    </div>
  );

  const androidDetail = (
    <div className="absolute inset-0 flex flex-col bg-[#fef7ff] text-[#1d1b20]">
      <div className="relative flex h-14 shrink-0 items-center gap-1 px-1">
        <button type="button" aria-label="Navigate up" onClick={() => setScreen('list')} className="relative grid size-11 place-items-center rounded-full text-[#49454f]">
          <ArrowLeft size={22} />
          {showNavSpots && P(1, '-top-1 left-7')}
        </button>
        <span className="relative text-[19px]">
          Order #4821
          {showNavSpots && P(2, '-top-3 -right-6')}
        </span>
        <span className="ml-auto grid size-11 place-items-center text-[#49454f]">
          <EllipsisVertical size={20} />
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-3 pt-1">
        <div className="rounded-[12px] bg-[#f3edf7] px-4 py-3">
          <p className="text-[12px] text-[#49454f]">Pizza Place · Arriving 19:40</p>
          <p className="mt-1 text-[14px]">1 × Margherita, large</p>
          <p className="text-[14px]">2 × Garlic bread</p>
          <div className="mt-2 flex justify-between border-t border-[#cac4d0] pt-2 text-[14px] font-medium">
            <span>Total</span>
            <span>€24.70</span>
          </div>
        </div>
        <div className="relative flex items-center justify-between px-1 py-1">
          <span className="text-[14px]">Contactless delivery</span>
          <M3Switch on={contactless} onToggle={() => setContactless((v) => !v)} />
          {showNavSpots && P(3, '-top-2 right-14')}
        </div>
        <div className="rounded-full border border-[#79747e] py-2 text-center text-[14px] font-medium text-[#6750a4]">Cancel order</div>
      </div>
      <div className="relative grid shrink-0 grid-cols-4 bg-[#f3edf7] pt-2.5 pb-6">
        {tabs.map((t) => {
          const on = t.label === 'Orders';
          return (
            <span key={t.label} className="flex flex-col items-center gap-1 text-[11px] font-medium" style={{ color: on ? '#1d1b20' : '#49454f' }}>
              <span className="grid h-7 w-12 place-items-center rounded-full" style={{ background: on ? '#e8def8' : 'transparent' }}>
                <t.icon size={19} />
              </span>
              {t.label}
            </span>
          );
        })}
        {showNavSpots && P(4, '-top-3 left-3')}
      </div>
    </div>
  );

  const list = (
    <div className="absolute inset-0 flex flex-col" style={{ background: ios ? '#f2f2f7' : '#fef7ff', color: ios ? '#000' : '#1d1b20' }}>
      {ios ? <p className="px-4 pt-6 pb-2 text-[28px] font-bold tracking-tight">Orders</p> : <p className="flex h-14 items-center px-4 text-[20px]">Orders</p>}
      <div className="px-3.5">
        <button
          type="button"
          onClick={() => setScreen('detail')}
          className={`flex w-full items-center gap-3 px-3 py-3 text-left ${ios ? 'rounded-[10px] bg-white' : 'rounded-[12px] bg-[#f3edf7]'}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">Order #4821</span>
            <span className="block text-[12px]" style={{ color: ios ? '#8e8e93' : '#49454f' }}>
              Pizza Place · on its way
            </span>
          </span>
          <ChevronRight size={16} style={{ color: ios ? '#c7c7cc' : '#49454f' }} />
        </button>
        <p className="mt-3 text-center text-[11px]" style={{ color: ios ? '#8e8e93' : '#49454f' }}>
          Tap the order to open it again.
        </p>
      </div>
    </div>
  );

  /* ---------- Overlays ---------- */
  let overlay: ReactNode = null;
  if (overlayOpen && screen === 'detail') {
    if (scene === 'alert') {
      overlay = ios ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4" onClick={() => say('Tapping outside an iOS alert does nothing. Pick a button.')}>
          {P(2, 'top-3 left-3')}
          <div role="alertdialog" aria-label="Cancel this order?" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[230px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black backdrop-blur">
            {P(1, '-top-2 -left-2')}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[15px] font-semibold">Cancel this order?</p>
              <p className="mt-1 text-[12px] leading-snug">Pizza Place has started preparing it. You’ll be refunded in 3–5 days.</p>
            </div>
            <div className="relative grid grid-cols-2 border-t border-[#3c3c43]/30 text-[15px]">
              <button type="button" onClick={() => closeOverlay('Order kept.')} className="border-r border-[#3c3c43]/30 py-2.5 font-semibold text-[#007aff]">
                Keep Order
              </button>
              <button type="button" onClick={() => closeOverlay('Order canceled (demo).')} className="py-2.5 text-[#ff3b30]">
                Cancel Order
              </button>
              {P(3, '-bottom-2 -right-2')}
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4" onClick={() => closeOverlay('Tapping the scrim dismissed the dialog (treated as Cancel).')}>
          {P(2, 'top-3 left-3')}
          <div role="alertdialog" aria-label="Cancel this order?" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[240px] rounded-[28px] bg-[#ece6f0] p-5 text-[#1d1b20]">
            {P(1, '-top-2 -left-2')}
            <p className="text-[19px] leading-tight">Cancel this order?</p>
            <p className="mt-3 text-[13px] leading-snug text-[#49454f]">Pizza Place has started preparing it. You’ll be refunded in 3–5 days.</p>
            <div className="relative mt-5 flex justify-end gap-1 text-[13px] font-medium text-[#6750a4]">
              <button type="button" onClick={() => closeOverlay('Order kept.')} className="rounded-full px-3 py-2">
                Keep order
              </button>
              <button type="button" onClick={() => closeOverlay('Order canceled (demo).')} className="rounded-full px-3 py-2">
                Cancel order
              </button>
              {P(3, '-bottom-3 -right-3')}
            </div>
          </div>
        </div>
      );
    } else if (scene === 'permission') {
      overlay = ios ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4">
          <div role="alertdialog" aria-label="Allow FoodNow to use your location?" className="relative w-full max-w-[240px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black backdrop-blur">
            <div className="relative px-4 pt-4 pb-3">
              <p className="text-[14px] leading-snug font-semibold">Allow “FoodNow” to use your location?</p>
              <p className="mt-1 text-[11.5px] leading-snug">We use your location to show restaurants that deliver to you and to fill in your address.</p>
              {P(2, 'top-12 -left-2')}
              <div className="relative mt-2.5 h-[70px] overflow-hidden rounded-lg bg-[linear-gradient(135deg,#dbeafe,#dcfce7)]">
                <MapPin size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#007aff]" />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#007aff]">Precise: On</span>
                {P(3, 'right-1 bottom-1')}
              </div>
            </div>
            <div className="relative text-[14.5px] text-[#007aff]">
              {[
                ['Allow Once', 'Allow Once: access lasts for this session only. The app can show the prompt again next time.'],
                ['Allow While Using App', 'Allowed while the app is in use. From now on, changes happen in the Settings app.'],
                ['Don’t Allow', 'Denied. iOS will not show this prompt again; the app must point the user to Settings.'],
              ].map(([b, msg]) => (
                <button key={b} type="button" onClick={() => closeOverlay(msg)} className="block w-full border-t border-[#3c3c43]/30 py-2.5">
                  {b}
                </button>
              ))}
              {P(1, 'top-1 -left-2')}
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 px-4">
          <div role="alertdialog" aria-label="Allow FoodNow to access this device’s location?" className="relative w-full max-w-[250px] rounded-[28px] bg-[#ece6f0] p-4 text-center text-[#1d1b20]">
            <MapPin size={22} className="mx-auto text-[#6750a4]" />
            <p className="relative mt-2 text-[15px] leading-snug">
              Allow <strong className="font-semibold">FoodNow</strong> to access this device’s location?
              {P(2, '-top-6 -left-2')}
            </p>
            <div className="relative mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <span className="flex flex-col items-center gap-1">
                <span className="size-12 rounded-full bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] ring-2 ring-[#6750a4]" />
                Precise
              </span>
              <span className="flex flex-col items-center gap-1 text-[#49454f]">
                <span className="size-12 rounded-full bg-[radial-gradient(circle,#c7d2fe,#e0e7ff)]" />
                Approximate
              </span>
              {P(3, '-top-1 right-0')}
            </div>
            <div className="relative mt-3 space-y-1.5 text-[13px] font-medium text-[#21005d]">
              {[
                ['While using the app', 'Allowed while the app is in use. The user can change it later in Settings.'],
                ['Only this time', 'One-time access: Android revokes it soon after the user leaves the app, so the app must ask again.'],
                ['Don’t allow', 'Denied. The app may ask once more; after a second denial Android stops showing this dialog.'],
              ].map(([b, msg]) => (
                <button key={b} type="button" onClick={() => closeOverlay(msg)} className="block w-full rounded-full bg-[#e8def8] py-2">
                  {b}
                </button>
              ))}
              {P(1, '-top-2 -left-2')}
            </div>
          </div>
        </div>
      );
    } else if (scene === 'sheet') {
      overlay = ios ? (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/35 px-2 pb-6" onClick={() => closeOverlay('Tapping outside canceled the action sheet.')}>
          <div onClick={(e) => e.stopPropagation()} className="relative space-y-2">
            {P(1, '-top-3 left-2')}
            <div role="menu" aria-label="Order actions" className="overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center backdrop-blur">
              <p className="px-4 py-2.5 text-[12px] text-[#8e8e93]">Order #4821</p>
              <button type="button" role="menuitem" onClick={() => closeOverlay('This would open the iOS share sheet.')} className="relative block w-full border-t border-[#3c3c43]/25 py-3 text-[17px] text-[#007aff]">
                Share Receipt
                {P(2, 'top-2 right-3')}
              </button>
              <button type="button" role="menuitem" onClick={() => closeOverlay('Opening help (demo).')} className="block w-full border-t border-[#3c3c43]/25 py-3 text-[17px] text-[#007aff]">
                Get Help
              </button>
              <button type="button" role="menuitem" onClick={() => closeOverlay('Removed from history (demo).')} className="block w-full border-t border-[#3c3c43]/25 py-3 text-[17px] text-[#ff3b30]">
                Delete from History
              </button>
            </div>
            <button type="button" onClick={() => closeOverlay('Canceled.')} className="relative block w-full rounded-[14px] bg-white py-3 text-[17px] font-semibold text-[#007aff]">
              Cancel
              {P(3, 'top-2 right-3')}
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/35" onClick={() => closeOverlay('Tapping the scrim closed the bottom sheet.')}>
          <div role="menu" aria-label="Order actions" onClick={(e) => e.stopPropagation()} className="relative rounded-t-[28px] bg-[#f7f2fa] pb-7 text-[#1d1b20]">
            {P(1, '-top-3 left-4')}
            <div className="relative mx-auto mt-3 mb-2 h-1 w-8 rounded-full bg-[#79747e]">{P(3, '-top-2 left-10')}</div>
            {[
              { icon: Share2, label: 'Share receipt', msg: 'This would open the Android Sharesheet.' },
              { icon: LifeBuoy, label: 'Get help', msg: 'Opening help (demo).' },
              { icon: Flag, label: 'Report a problem', msg: 'Opening the report form (demo).' },
              { icon: Trash2, label: 'Delete from history', msg: 'Removed from history (demo).' },
            ].map((it, i) => (
              <button key={it.label} type="button" role="menuitem" onClick={() => closeOverlay(it.msg)} className="relative flex w-full items-center gap-4 px-6 py-3 text-left text-[14px]">
                <it.icon size={19} className="text-[#49454f]" />
                {it.label}
                {i === 0 && P(2, 'top-2 right-6')}
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">📱 Same screen, two platforms</p>
        <p className="text-sm text-muted">Switch between iOS and Android, pick a situation, and tap the numbered hotspots to see what differs and what to test.</p>
      </div>

      <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center">
        <div role="radiogroup" aria-label="Platform" className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1 text-sm font-medium sm:w-56">
          {(['ios', 'android'] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={platform === p}
              onClick={() => pickPlatform(p)}
              className={`rounded-lg py-1.5 ${platform === p ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {p === 'ios' ? 'iOS' : 'Android'}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Situation" className="flex flex-wrap gap-1.5">
          {scenes.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={scene === s.id}
              onClick={() => pickScene(s.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${scene === s.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-center gap-3 border-b border-line bg-subtle p-5 lg:border-r lg:border-b-0">
          <PhoneFrame os={platform} width={262}>
            <div className="absolute inset-0" style={{ fontFamily: font }}>
              {screen === 'detail' ? (ios ? iosDetail : androidDetail) : list}
              {overlay}
            </div>
          </PhoneFrame>
          <div className="flex w-full max-w-[282px] flex-wrap items-center justify-center gap-2">
            {ios ? (
              <button type="button" onClick={edgeSwipe} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-subtle">
                ⟶ Swipe from left edge
              </button>
            ) : (
              <button type="button" onClick={systemBack} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-subtle">
                ◁ System Back
              </button>
            )}
            {scene !== 'nav' && !overlayOpen && (
              <button
                type="button"
                onClick={() => {
                  setScreen('detail');
                  setOverlayOpen(true);
                }}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-subtle"
              >
                Show {scene === 'alert' ? (ios ? 'alert' : 'dialog') : scene === 'permission' ? 'prompt' : 'sheet'} again
              </button>
            )}
          </div>
          <p aria-live="polite" className="min-h-[2.5rem] max-w-[282px] text-center text-xs text-muted">
            {note}
          </p>
        </div>

        <div className="min-w-0 p-5">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Differences">
            {current.spots.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={spot === i + 1}
                onClick={() => setSpot(i + 1)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${spot === i + 1 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
              >
                <span className="grid size-4 place-items-center rounded-full bg-[#fbbf24] text-[10px] font-bold text-[#3b2a00]">{i + 1}</span>
                {s.title}
              </button>
            ))}
          </div>

          {sp && (
            <div className="mt-4" role="tabpanel">
              <p className="text-lg font-semibold text-fg">{sp.title}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['ios', 'android'] as Platform[]).map((p) => (
                  <div key={p} className={`min-w-0 rounded-xl border p-3 ${platform === p ? 'border-brand bg-brand-soft' : 'border-line bg-subtle'}`}>
                    <p className="text-xs font-semibold tracking-wide text-faint uppercase">{p === 'ios' ? 'iOS' : 'Android'}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg">{p === 'ios' ? sp.ios : sp.android}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-line p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
                  <ListChecks size={14} /> What to test
                </p>
                <ul className="mt-2 space-y-1.5">
                  {sp.test.map((t) => (
                    <li key={t} className="flex gap-2 text-sm leading-relaxed text-fg">
                      <Check size={15} className="mt-0.5 shrink-0 text-ok" />
                      <span className="min-w-0">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
            <Lightbulb size={14} className="mt-0.5 shrink-0 text-warn" />
            {ios ? 'Try the edge swipe while a prompt is open, then switch to Android and press System Back in the same spot.' : 'Press System Back while a dialog or sheet is open, then again on the order screen. Compare with the iOS edge swipe.'}
          </p>
        </div>
      </div>
    </div>
  );
}
