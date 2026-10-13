import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronLeft, Clock, Home, Layers, MapPin, Package, Play, RotateCcw, ShoppingBag, Skull, Smartphone, Trash2 } from 'lucide-react';
import { Phone } from './Phone';

/*
 * Lifecycle state machine visualizer: press actions, watch the app move between states,
 * see what the phone shows, which callbacks fire and what the app must preserve.
 */

type NodeId = 'notRunning' | 'inactive' | 'active' | 'background' | 'suspended' | 'terminated';
type View = 'homescreen' | 'switcher' | 'otherApp' | 'splash' | 'app';
type Screen = 'home' | 'checkout' | 'order';
type Platform = 'ios' | 'android';
type ActionId = 'open' | 'home' | 'switch' | 'wait' | 'oskill' | 'swipe' | 'reopen' | 'notify';

const labels: Record<NodeId, Record<Platform, string>> = {
  notRunning: { ios: 'Not running', android: 'Not running' },
  inactive: { ios: 'Inactive', android: 'Paused' },
  active: { ios: 'Active', android: 'Resumed' },
  background: { ios: 'Background', android: 'Stopped' },
  suspended: { ios: 'Suspended', android: 'Cached' },
  terminated: { ios: 'Terminated', android: 'Process killed' },
};

const box: Record<NodeId, { x: number; y: number }> = {
  notRunning: { x: 8, y: 34 },
  inactive: { x: 142, y: 34 },
  active: { x: 272, y: 34 },
  background: { x: 142, y: 158 },
  suspended: { x: 272, y: 158 },
  terminated: { x: 8, y: 158 },
};
const W = 100;
const H = 42;

const edges: { id: string; d: string }[] = [
  { id: 'notRunning>inactive', d: 'M108 55 L140 55' },
  { id: 'inactive>active', d: 'M242 48 L270 48' },
  { id: 'active>inactive', d: 'M272 64 L244 64' },
  { id: 'inactive>background', d: 'M178 76 L178 156' },
  { id: 'background>inactive', d: 'M206 158 L206 78' },
  { id: 'background>suspended', d: 'M242 172 L270 172' },
  { id: 'suspended>background', d: 'M272 188 L244 188' },
  { id: 'suspended>terminated', d: 'M322 200 C 300 248, 90 248, 60 202' },
  { id: 'terminated>inactive', d: 'M92 158 L150 78' },
];

const memory: Record<NodeId, { ram: string; code: string }> = {
  notRunning: { ram: 'No', code: 'No' },
  inactive: { ram: 'Yes', code: 'Yes, but no touches' },
  active: { ram: 'Yes', code: 'Yes, full speed' },
  background: { ram: 'Yes', code: 'A few seconds (or a background task)' },
  suspended: { ram: 'Yes', code: 'No, frozen' },
  terminated: { ram: 'No', code: 'No' },
};

interface Explain {
  title: string;
  body: string;
  should: string[];
  test: string;
  callbacks: Record<Platform, string>;
}

const intro: Explain = {
  title: 'Start here',
  body: 'ShopCo is not running yet. Press Open to launch it, then try the other actions. The diagram shows the lifecycle state, the phone shows what the user sees.',
  should: ['Each step lists what the app must do or preserve at that moment.'],
  test: 'Follow the path a real user takes: open, browse, leave, come back later.',
  callbacks: { ios: 'None yet', android: 'None yet' },
};

interface Step {
  node: NodeId;
  edge?: string;
  view?: View;
}

export default function LifecycleVisualizer() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [node, setNode] = useState<NodeId>('notRunning');
  const [edge, setEdge] = useState<string | null>(null);
  const [view, setView] = useState<View>('homescreen');
  const [screen, setScreen] = useState<Screen>('home');
  const [away, setAway] = useState(0);
  const [killedBy, setKilledBy] = useState<'os' | 'user' | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [explain, setExplain] = useState<Explain>(intro);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const run = (steps: Step[], done?: () => void) => {
    setBusy(true);
    steps.forEach((st, i) =>
      later(() => {
        setNode(st.node);
        setEdge(st.edge ?? null);
        if (st.view) setView(st.view);
      }, i * 650),
    );
    later(() => {
      setBusy(false);
      done?.();
    }, steps.length * 650);
  };

  const record = (text: string, e: Explain) => {
    seq.current += 1;
    const id = seq.current;
    setHistory((h) => [{ id, text }, ...h].slice(0, 8));
    setExplain(e);
  };

  const flashRefresh = () => {
    setRefreshed(true);
    later(() => setRefreshed(false), 2200);
  };

  const coldStart = (target: Screen, from: NodeId) => {
    run(
      [
        { node: from, view: 'splash' },
        { node: 'inactive', edge: from === 'terminated' ? 'terminated>inactive' : 'notRunning>inactive', view: 'splash' },
        { node: 'active', edge: 'inactive>active', view: 'app' },
      ],
      () => {
        setKilledBy(null);
        setAway(0);
      },
    );
    setScreen(target);
  };

  const warmResume = (target: Screen | null) => {
    const steps: Step[] = [];
    if (node === 'suspended') steps.push({ node: 'background', edge: 'suspended>background' });
    steps.push({ node: 'inactive', edge: 'background>inactive', view: 'app' });
    steps.push({ node: 'active', edge: 'inactive>active', view: 'app' });
    const wasAway = away;
    run(steps, () => {
      if (wasAway >= 10) flashRefresh();
      setAway(0);
    });
    if (target) setScreen(target);
  };

  const leave = (via: 'home' | 'switch') => {
    run(
      via === 'home'
        ? [
            { node: 'inactive', edge: 'active>inactive', view: 'homescreen' },
            { node: 'background', edge: 'inactive>background', view: 'homescreen' },
            { node: 'suspended', edge: 'background>suspended', view: 'homescreen' },
          ]
        : [
            { node: 'inactive', edge: 'active>inactive', view: 'switcher' },
            { node: 'inactive', edge: 'active>inactive', view: 'switcher' },
            { node: 'background', edge: 'inactive>background', view: 'otherApp' },
            { node: 'suspended', edge: 'background>suspended', view: 'otherApp' },
          ],
    );
  };

  const screenName = screen === 'checkout' ? 'Checkout' : screen === 'order' ? 'Order details' : 'Home';

  const doAction = (a: ActionId) => {
    if (busy) return;
    switch (a) {
      case 'open':
        coldStart('home', node);
        record('Open → cold start', {
          title: 'Cold start',
          body: 'The app was not in memory, so the OS starts a brand-new process, shows the launch screen, and moves the app through Inactive to Active.',
          should: ['Show the first screen quickly (cold start time is something you can measure)', 'Load fresh data from the server', 'Restore anything the user saved last time (cart, settings, login)'],
          test: 'Time the cold start on an older, low-memory device, not just your new phone.',
          callbacks: {
            ios: 'application(_:didFinishLaunchingWithOptions:) → scene(_:willConnectTo:) → sceneDidBecomeActive',
            android: 'Application.onCreate() → onCreate(savedInstanceState = null) → onStart() → onResume()',
          },
        });
        break;
      case 'home':
        leave('home');
        record('Home → background → suspended', {
          title: 'Went to the Home screen',
          body: 'Active → Inactive → Background. A few seconds later the OS suspends the app: it stays in memory but runs no code at all.',
          should: [
            `Save the current screen (${screenName}) and any typed text right now. It may never get another chance.`,
            'Pause video, games and timers that depend on the screen',
            'Hide sensitive data before the app switcher snapshot is taken',
            'Hand long uploads or downloads to a system background task',
          ],
          test: 'Type into a form, go Home, come back after 5 seconds, 5 minutes and 1 hour.',
          callbacks: {
            ios: 'sceneWillResignActive → sceneDidEnterBackground (then silently suspended)',
            android: 'onPause() → onStop() → onSaveInstanceState() (then the process is cached)',
          },
        });
        break;
      case 'switch':
        leave('switch');
        record('Switch app → background', {
          title: 'Switched to another app',
          body: 'Opening the app switcher makes the app Inactive: it is still visible, as a card, but gets no touches. Picking Maps sends it to the Background, and soon it is suspended.',
          should: ['Everything from "Home" applies', 'The switcher card is a snapshot of the last screen. Banking and health apps blur it or show their logo instead.'],
          test: 'Open the app switcher on screens with personal data (balance, card number, messages) and look at the card.',
          callbacks: {
            ios: 'sceneWillResignActive (switcher open) → sceneDidEnterBackground (other app picked)',
            android: 'onPause() → onStop() → onSaveInstanceState()',
          },
        });
        break;
      case 'wait': {
        const total = away + 10;
        setAway(total);
        if (node === 'background') {
          setNode('suspended');
          setEdge('background>suspended');
        } else setEdge(null);
        record(`Wait 10 min (away ${total} min)`, {
          title: `${total} minutes later…`,
          body:
            node === 'terminated'
              ? 'The app is not running, so nothing happens on the phone. But on the server, prices, stock and sessions keep changing.'
              : `The app is suspended: still in memory, but frozen. Whatever is on its screen is now ${total} minutes old. The longer it stays in the background, the more likely the OS kills it to free memory.`,
          should: ['On return, refresh data that goes stale: prices, stock, balances, chat messages', 'Check that the login session is still valid. If it expired, say so right away.', 'System-managed background transfers keep going while the app is frozen'],
          test: 'Leave the app in the background overnight, then open it. Is everything fresh? Are you still logged in, or told to log in again?',
          callbacks: { ios: 'None (suspended apps get no callbacks)', android: 'None (cached processes get no callbacks)' },
        });
        break;
      }
      case 'oskill':
        setNode('terminated');
        setEdge('suspended>terminated');
        setKilledBy('os');
        if (view === 'switcher') setView('homescreen');
        record('OS kills app (low memory)', {
          title: 'The OS killed the app',
          body: 'Another app needed memory (or an aggressive battery optimizer on some Android phones stepped in). The app was suspended, so it got no warning at all.',
          should: [
            'Nothing it can do now. That is exactly why it must save state when going to the background.',
            `Next launch should bring the user back to ${screenName}, with the typed delivery note`,
            'The app switcher card is still there, so the user thinks the app is still "open"',
          ],
          test: 'Android: enable Developer options › Don\'t keep activities, or run adb shell am kill <package> while the app is in the background.',
          callbacks: { ios: 'None (applicationWillTerminate is not called for suspended apps)', android: 'None (onDestroy() is not called when the process is killed)' },
        });
        break;
      case 'swipe':
        setNode('terminated');
        setEdge('suspended>terminated');
        setKilledBy('user');
        setView('homescreen');
        record('Swiped away by the user', {
          title: 'User swiped the app away',
          body: 'The user force-quit the app from the app switcher. The process is gone and the saved screen state is thrown away too.',
          should: ['Next launch starts fresh on the Home screen. That is expected here.', 'Data saved on the server or disk (cart, orders, settings) must still be there', 'iOS: a force-quit app does not receive silent background pushes until it is opened again'],
          test: 'Fill the cart, swipe the app away, reopen. Cart still there? Still logged in?',
          callbacks: { ios: 'Usually none (the app was suspended)', android: 'Usually none (onDestroy() is not guaranteed)' },
        });
        break;
      case 'reopen':
        if (node === 'terminated') {
          const target: Screen = killedBy === 'os' ? screen : 'home';
          coldStart(target, node);
          record(killedBy === 'os' ? 'Reopen → cold start + restore' : 'Reopen → fresh cold start', {
            title: killedBy === 'os' ? 'Cold start with state restoration' : 'Fresh cold start',
            body:
              killedBy === 'os'
                ? 'New process, but the OS kept the saved state. The user should not notice the app was ever killed.'
                : 'New process with no saved screen state, because the user force-quit the app.',
            should:
              killedBy === 'os'
                ? [`Land back on ${screenName}, not the home screen`, 'Restore typed text (delivery note) and scroll position', 'Reload fresh data from the server', 'Check the session is still valid']
                : ['Open the home screen', 'Cart and login are still there (saved on the server or disk)'],
            test: killedBy === 'os' ? 'Compare: what you see after a warm resume vs after an OS kill should look the same to the user.' : 'Check nothing half-finished is left in a broken state (e.g. a payment "in progress" forever).',
            callbacks: {
              ios: killedBy === 'os' ? 'didFinishLaunching → scene(_:willConnectTo:) with restoration activity → sceneDidBecomeActive' : 'didFinishLaunching → scene(_:willConnectTo:) → sceneDidBecomeActive',
              android: killedBy === 'os' ? 'Application.onCreate() → onCreate(savedInstanceState ≠ null) → onStart() → onResume()' : 'Application.onCreate() → onCreate(savedInstanceState = null) → onStart() → onResume()',
            },
          });
        } else {
          warmResume(null);
          record(away >= 10 ? `Reopen → warm resume after ${away} min` : 'Reopen → warm resume', {
            title: 'Warm resume',
            body: 'The app was still in memory, so it comes back almost instantly, exactly where the user left it.',
            should: [`Same screen (${screenName}), same typed text, same scroll position`, away >= 10 ? `It was away ${away} min: refresh stale data and re-check the session` : 'Short absence: no need to reload everything', 'Resume what was paused only if it makes sense (do not auto-play loud video)'],
            test: 'Return after different gaps: 5 seconds, 10 minutes, a few hours. The longer the gap, the more you should see refreshed.',
            callbacks: { ios: 'sceneWillEnterForeground → sceneDidBecomeActive', android: 'onRestart() → onStart() → onResume()' },
          });
        }
        break;
      case 'notify': {
        const cb = {
          ios: 'userNotificationCenter(_:didReceive:withCompletionHandler:) with the order ID',
          android: 'Notification\'s PendingIntent → onNewIntent() (running) or onCreate() (killed) with the order ID in the extras',
        };
        if (node === 'active') {
          setBusy(true);
          setBanner(true);
          later(() => {
            setBanner(false);
            setScreen('order');
            setBusy(false);
          }, 900);
          record('Tap notification (app open)', {
            title: 'Notification while the app is open',
            body: 'The app is already in the foreground. It can show its own in-app banner; tapping it navigates to the order.',
            should: ['Open Order #4521, not just bring the app forward', 'Back returns to where the user was', 'Do not lose a half-typed form when navigating'],
            test: 'Trigger the same push in all three states: foreground, background, killed.',
            callbacks: cb,
          });
        } else if (node === 'notRunning' || node === 'terminated') {
          const from = node;
          setBusy(true);
          setBanner(true);
          later(() => {
            setBanner(false);
            coldStart('order', from);
          }, 900);
          record('Tap notification (app killed)', {
            title: 'Notification opens a killed app',
            body: 'There is no process yet, so tapping the notification cold-starts the app with the notification payload attached.',
            should: ['Go straight to Order #4521. Opening the home screen instead is a classic bug.', 'Back should lead somewhere sensible (the app home), not close the app', 'If login is needed first, continue to the order after login'],
            test: 'Kill the app (or reboot), send the push, tap it. This path is the one most often broken.',
            callbacks: cb,
          });
        } else {
          setBusy(true);
          setBanner(true);
          later(() => {
            setBanner(false);
            warmResume('order');
          }, 900);
          record('Tap notification (app in background)', {
            title: 'Notification resumes the app',
            body: 'The app is still in memory: it resumes and must navigate to the order from whatever screen it was on.',
            should: ['Open Order #4521 directly', 'Refresh the order status (it may have changed)', 'Keep the previous screen in the back stack'],
            test: 'Leave the app on a different screen (e.g. Checkout), background it, tap the push.',
            callbacks: cb,
          });
        }
        break;
      }
    }
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setNode('notRunning');
    setEdge(null);
    setView('homescreen');
    setScreen('home');
    setAway(0);
    setKilledBy(null);
    setBusy(false);
    setBanner(false);
    setRefreshed(false);
    setExplain(intro);
    setHistory([]);
  };

  const inMemory = node === 'background' || node === 'suspended';
  const can: Record<ActionId, boolean> = {
    open: node === 'notRunning',
    home: node === 'active',
    switch: node === 'active',
    wait: inMemory || node === 'terminated',
    oskill: inMemory,
    swipe: inMemory,
    reopen: inMemory || node === 'terminated',
    notify: node !== 'inactive',
  };
  const actions: { id: ActionId; label: string; icon: ReactNode }[] = [
    { id: 'open', label: 'Open', icon: <Play size={14} /> },
    { id: 'home', label: 'Home', icon: <Home size={14} /> },
    { id: 'switch', label: 'Switch app', icon: <Layers size={14} /> },
    { id: 'wait', label: 'Wait 10 min', icon: <Clock size={14} /> },
    { id: 'oskill', label: 'OS kills app', icon: <Skull size={14} /> },
    { id: 'swipe', label: 'Swipe away', icon: <Trash2 size={14} /> },
    { id: 'reopen', label: 'Reopen', icon: <RotateCcw size={14} /> },
    { id: 'notify', label: 'Tap notification', icon: <Bell size={14} /> },
  ];

  /* ---------- what should be preserved ---------- */
  const keep = (() => {
    const mem = 'Kept in memory';
    if (node === 'notRunning') return null;
    if (node === 'terminated')
      return killedBy === 'os'
        ? [
            ['Current screen', `${screenName}: restore on launch`],
            ['Delivery note draft', 'Restore from saved state'],
            ['Cart (3 items)', 'Reload from server'],
            ['Login session', 'Re-check on launch'],
          ]
        : [
            ['Current screen', 'Fresh start (expected)'],
            ['Delivery note draft', 'Discarded (OK after force-quit)'],
            ['Cart (3 items)', 'Reload from server'],
            ['Login session', 'Still logged in'],
          ];
    return [
      ['Current screen', `${screenName}: ${mem.toLowerCase()}`],
      ['Delivery note draft', mem],
      ['Cart (3 items)', mem],
      ['Login session', away >= 10 ? 'May have expired: check on return' : 'Valid'],
    ];
  })();

  /* ---------- phone contents ---------- */
  const appUi = (snapshot = false) => (
    <div className="flex h-full flex-col bg-[#f2f2f7] px-3 pt-2 text-black">
      {screen === 'home' && (
        <>
          <p className="text-[18px] font-bold tracking-tight">ShopCo</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['#ffd6a5', '#caffbf', '#9bf6ff', '#ffc6ff'].map((c, i) => (
              <div key={c} className="rounded-lg bg-white p-1.5">
                <div className="h-12 rounded-md" style={{ background: c }} />
                <p className="mt-1 text-[10px] font-medium">{['Sneakers', 'Backpack', 'Bottle', 'Hoodie'][i]}</p>
                <p className="text-[10px] text-[#3c3c4399]">€{[59, 34, 12, 45][i]}.99</p>
              </div>
            ))}
          </div>
          {!snapshot && (
            <button type="button" onClick={() => setScreen('checkout')} disabled={busy || node !== 'active'} className="mt-3 h-9 rounded-lg bg-[#5b4bff] text-[12px] font-semibold text-white">
              Cart (3) · Checkout
            </button>
          )}
        </>
      )}
      {screen === 'checkout' && (
        <>
          {!snapshot && (
            <button type="button" onClick={() => setScreen('home')} disabled={busy || node !== 'active'} className="-ml-1 flex items-center text-[12px] text-[#007aff]">
              <ChevronLeft size={16} /> Shop
            </button>
          )}
          <p className="mt-1 text-[18px] font-bold tracking-tight">Checkout</p>
          <div className="mt-2 rounded-lg bg-white p-2 text-[11px]">
            <p className="font-semibold">3 items · €84.97</p>
            <p className="text-[#3c3c4399]">Sneakers, Bottle, Socks</p>
          </div>
          <div className="mt-2 rounded-lg bg-white p-2 text-[11px]">
            <p className="text-[#3c3c4399]">Delivery note</p>
            <p>Leave at the door, please|</p>
          </div>
          <div className="mt-auto mb-6 h-9 rounded-lg bg-[#5b4bff] text-center text-[12px] leading-9 font-semibold text-white">Pay €84.97</div>
        </>
      )}
      {screen === 'order' && (
        <>
          {!snapshot && (
            <button type="button" onClick={() => setScreen('home')} disabled={busy || node !== 'active'} className="-ml-1 flex items-center text-[12px] text-[#007aff]">
              <ChevronLeft size={16} /> Orders
            </button>
          )}
          <p className="mt-1 text-[18px] font-bold tracking-tight">Order #4521</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2 text-[11px]">
            <Package size={16} className="text-[#34c759]" />
            <span>
              <span className="block font-semibold">Shipped</span>
              <span className="text-[#3c3c4399]">Arrives Thursday</span>
            </span>
          </div>
        </>
      )}
      {refreshed && !snapshot && <p className="mx-auto mt-2 rounded-full bg-black/75 px-2.5 py-1 text-[10px] text-white">Prices and stock updated</p>}
    </div>
  );

  const phoneUi = (() => {
    if (view === 'splash')
      return (
        <div className="grid h-full place-items-center bg-[#5b4bff] text-white">
          <ShoppingBag size={40} />
        </div>
      );
    if (view === 'app') return appUi();
    if (view === 'switcher')
      return (
        <div className="flex h-full items-center gap-2 overflow-hidden bg-[#1c1c1e]/90 px-3">
          <div className="h-[70%] w-[62%] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20">
            <div style={{ width: '161%', height: '161%', transform: 'scale(0.62)', transformOrigin: 'top left' }}>{appUi(true)}</div>
          </div>
          <div className="h-[70%] w-[62%] shrink-0 rounded-xl bg-[#e8f0e0]" />
        </div>
      );
    if (view === 'otherApp')
      return (
        <div className="relative h-full bg-[#e8f0e0]">
          <div className="absolute top-1/3 left-1/4 h-1 w-1/2 rotate-12 bg-white" />
          <div className="absolute top-1/2 left-1/3 h-1/3 w-1 bg-white" />
          <MapPin size={26} className="absolute top-[42%] left-[46%] text-[#ff3b30]" fill="currentColor" />
          <p className="absolute top-2 left-3 text-[16px] font-bold text-black">Maps</p>
        </div>
      );
    // Home screen
    return (
      <div className="h-full bg-gradient-to-b from-[#6a85b6] to-[#bac8e0] px-4 pt-4">
        <div className="grid grid-cols-4 gap-3">
          {['#34c759', '#ff9500', '#007aff', '#5b4bff', '#ff2d55', '#af52de', '#ffcc00', '#8e8e93'].map((c, i) => (
            <div key={c} className="flex flex-col items-center gap-0.5">
              <div className="grid aspect-square w-full place-items-center rounded-[22%] text-white" style={{ background: c }}>
                {i === 3 ? <ShoppingBag size={18} /> : null}
              </div>
              <span className="text-[8px] text-white">{['Messages', 'Photos', 'Mail', 'ShopCo', 'Music', 'Podcasts', 'Notes', 'Settings'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  const darkStatus = view === 'splash' || view === 'switcher' || view === 'homescreen';

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-semibold">Lifecycle state machine</p>
          <p className="text-sm text-muted">Press an action and watch the ShopCo app move between states.</p>
        </div>
        <div className="flex rounded-lg bg-subtle p-0.5 ring-1 ring-line" role="group" aria-label="Platform">
          {(['ios', 'android'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={platform === p}
              onClick={() => setPlatform(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${platform === p ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {p === 'ios' ? 'iOS' : 'Android'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-4 border-b border-line p-4 sm:p-6 lg:border-r lg:border-b-0">
          <svg viewBox="0 0 380 250" className="w-full" role="img" aria-label={`Lifecycle diagram. Current state: ${labels[node][platform]}`}>
            <defs>
              <marker id="lc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" style={{ fill: 'var(--line-strong)' }} />
              </marker>
              <marker id="lc-arrow-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" style={{ fill: 'var(--brand)' }} />
              </marker>
            </defs>
            <rect x="132" y="8" width="246" height="84" rx="14" style={{ fill: 'var(--subtle)', stroke: 'var(--line)' }} strokeDasharray="4 4" />
            <text x="142" y="24" fontSize="10" fontWeight="600" style={{ fill: 'var(--faint)' }}>
              FOREGROUND (visible)
            </text>
            <text x="236" y="146" fontSize="10" fontWeight="600" style={{ fill: 'var(--faint)' }}>
              IN MEMORY, NOT VISIBLE
            </text>
            <text x="8" y="122" fontSize="10" fontWeight="600" style={{ fill: 'var(--faint)' }}>
              NOT IN MEMORY
            </text>
            {edges.map((e) => {
              const on = e.id === edge;
              return <path key={e.id} d={e.d} fill="none" strokeWidth={on ? 2.5 : 1.5} markerEnd={`url(#${on ? 'lc-arrow-on' : 'lc-arrow'})`} style={{ stroke: on ? 'var(--brand)' : 'var(--line-strong)' }} />;
            })}
            {(Object.keys(box) as NodeId[]).map((id) => {
              const on = id === node;
              return (
                <g key={id}>
                  <rect x={box[id].x} y={box[id].y} width={W} height={H} rx="10" strokeWidth={on ? 2 : 1} style={{ fill: on ? 'var(--brand)' : 'var(--surface)', stroke: on ? 'var(--brand)' : 'var(--line-strong)', transition: 'fill .3s' }} />
                  <text x={box[id].x + W / 2} y={box[id].y + H / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="600" style={{ fill: on ? 'var(--brand-fg)' : 'var(--fg)' }}>
                    {labels[id][platform]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => doAction(a.id)}
                disabled={busy || !can[a.id]}
                className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface"
              >
                <span className="shrink-0 text-brand">{a.icon}</span>
                <span className="min-w-0 leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              Away from the app: <strong className="text-fg">{away} min</strong>
            </span>
            <button type="button" onClick={reset} className="flex items-center gap-1 font-medium hover:text-fg">
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-subtle p-4" aria-live="polite">
            <p className="font-semibold">{explain.title}</p>
            <p className="mt-1 text-sm text-muted">{explain.body}</p>
            <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">The app should</p>
            <ul className="mt-1 space-y-1 text-sm">
              {explain.should.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="min-w-0">{x}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Test idea</p>
            <p className="mt-1 text-sm">{explain.test}</p>
            <p className="mt-3 text-xs font-semibold tracking-wide text-faint uppercase">Callbacks the developer sees ({platform === 'ios' ? 'iOS' : 'Android'})</p>
            <p className="mt-1 font-mono text-[11px] break-words text-muted">{explain.callbacks[platform]}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-4 bg-subtle p-4 sm:p-6 lg:w-[280px]">
          <Phone width={210} darkStatus={darkStatus} screenBg={view === 'app' ? '#f2f2f7' : '#000'}>
            {phoneUi}
            {banner && (
              <div className="absolute inset-x-2 top-1 z-40 flex items-start gap-2 rounded-2xl bg-[#f6f6f8]/95 p-2 text-black shadow-lg ring-1 ring-black/5" role="status">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#5b4bff] text-white">
                  <ShoppingBag size={13} />
                </span>
                <span className="min-w-0 flex-1 text-[10px] leading-snug">
                  <span className="block font-semibold">ShopCo</span>
                  Your order #4521 has shipped
                </span>
              </div>
            )}
          </Phone>
          <dl className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-2xl border border-line bg-surface p-3 text-xs">
            <dt className="text-faint">State</dt>
            <dd className="font-semibold text-fg">{labels[node][platform]}</dd>
            <dt className="text-faint">In memory</dt>
            <dd className="text-fg">{memory[node].ram}</dd>
            <dt className="text-faint">Runs code</dt>
            <dd className="text-fg">{memory[node].code}</dd>
          </dl>
          {keep && (
            <div className="w-full rounded-2xl border border-line bg-surface p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
                <Smartphone size={12} /> What must survive
              </p>
              <ul className="space-y-1.5 text-xs">
                {keep.map(([k, v]) => (
                  <li key={k}>
                    <span className="block font-medium text-fg">{k}</span>
                    <span className="text-muted">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.length > 0 && (
            <ol className="w-full space-y-1 text-xs text-muted">
              {history.map((h, i) => (
                <li key={h.id} className={i === 0 ? 'font-medium text-fg' : ''}>
                  {h.text}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
