/*
 * A tiny, pure simulation of adb talking to one Android phone (a Pixel 8 running Android 15)
 * with a shopping app "ShopEasy" (com.shopeasy.app) installed. Used by AdbPlayground and CrashChallenge.
 * Output strings mirror real adb output as closely as is useful for learners.
 */

export type Level = 'V' | 'D' | 'I' | 'W' | 'E' | 'F';
export interface LogLine {
  id: number;
  time: string;
  pid: number;
  tid: number;
  level: Level;
  tag: string;
  msg: string;
  crash?: boolean;
  key?: string;
}
export type TermKind = 'cmd' | 'out' | 'err' | 'note' | 'log';
export interface TermLine {
  kind: TermKind;
  text: string;
  level?: Level;
  key?: string;
}
export type Screen = 'launcher' | 'home' | 'onboarding' | 'product' | 'results' | 'crash';

export interface Device {
  installed: boolean;
  loggedIn: boolean; // false after pm clear / fresh install
  running: boolean;
  pid: number;
  screen: Screen;
  productId: string;
  search: string;
  battery: number;
  realBattery: number;
  plugged: boolean;
  batteryOverride: boolean;
  fontScale: number;
  dark: boolean;
  paired: boolean;
  wireless: string | null; // serial of the Wi-Fi connection, e.g. 192.168.1.23:41235
  recording: boolean;
  recordedFile: string | null;
  screenshots: number;
  crashes: number;
  clock: number; // ms since 14:02:00.000, for log timestamps
  logs: LogLine[];
  nextLogId: number;
}

export const PKG = 'com.shopeasy.app';
export const USB_SERIAL = '38121FDJH00ABC';
export const IP = '192.168.1.23';
const SYS = 1532; // system_server

const levels: Level[] = ['V', 'D', 'I', 'W', 'E', 'F'];
const rank = (l: string) => (l === 'S' ? 99 : Math.max(0, levels.indexOf(l as Level)));

function stamp(ms: number) {
  const total = 2 * 60 * 1000 + ms; // starts at 14:02:00.000
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const mil = total % 1000;
  return `10-13 14:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(mil).padStart(3, '0')}`;
}

type NewLog = Omit<LogLine, 'id' | 'time'> & { gap?: number };
function addLogs(d: Device, entries: NewLog[]): Device {
  let clock = d.clock;
  let id = d.nextLogId;
  const added = entries.map((e) => {
    clock += e.gap ?? 7 + ((id * 37) % 90);
    const { gap: _gap, ...rest } = e;
    return { ...rest, id: id++, time: stamp(clock) };
  });
  return { ...d, clock: clock + 1200, nextLogId: id, logs: [...d.logs, ...added].slice(-160) };
}

export function formatLog(l: LogLine) {
  return `${l.time} ${String(l.pid).padStart(5)} ${String(l.tid).padStart(5)} ${l.level} ${l.tag}: ${l.msg}`;
}

export function initialDevice(): Device {
  const d: Device = {
    installed: true,
    loggedIn: true,
    running: true,
    pid: 4821,
    screen: 'home',
    productId: '',
    search: '',
    battery: 85,
    realBattery: 85,
    plugged: true, // USB cable = charging
    batteryOverride: false,
    fontScale: 1,
    dark: false,
    paired: false,
    wireless: null,
    recording: false,
    recordedFile: null,
    screenshots: 0,
    crashes: 0,
    clock: 0,
    logs: [],
    nextLogId: 1,
  };
  return addLogs(d, [
    { pid: SYS, tid: 1610, level: 'I', tag: 'ActivityManager', msg: `Start proc 4821:${PKG}/u0a215 for next-top-activity {${PKG}/${PKG}.MainActivity}` },
    { pid: 2207, tid: 2290, level: 'E', tag: 'GoogleApiManager', msg: 'Failed to get service from broker.' },
    { pid: 4821, tid: 4821, level: 'I', tag: 'ShopEasy', msg: 'MainActivity onCreate, user=ana.k (session restored)' },
    { pid: 4821, tid: 4874, level: 'D', tag: 'OkHttp', msg: '--> GET https://api.shopeasy.example.com/v2/home' },
    { pid: 3410, tid: 3455, level: 'W', tag: 'BluetoothAdapter', msg: 'getBluetoothService() called with no BluetoothManagerCallback' },
    { pid: 4821, tid: 4874, level: 'D', tag: 'OkHttp', msg: '<-- 200 OK https://api.shopeasy.example.com/v2/home (184ms)' },
    { pid: 2207, tid: 2311, level: 'E', tag: 'cr_VariationsUtils', msg: 'Failed reading seed file "/data/user/0/com.android.chrome/app_webview/variations_seed_new"' },
    { pid: SYS, tid: 1645, level: 'I', tag: 'ActivityTaskManager', msg: `Displayed ${PKG}/.MainActivity for user 0: +612ms` },
  ]);
}

/* ---------------- App behavior helpers ---------------- */

export function launch(d: Device, activity = '.MainActivity'): Device {
  if (!d.installed) return d;
  let next = d;
  if (!next.running) {
    const pid = next.pid + 37;
    next = addLogs({ ...next, running: true, pid }, [
      { pid: SYS, tid: 1610, level: 'I', tag: 'ActivityManager', msg: `Start proc ${pid}:${PKG}/u0a215 for next-top-activity {${PKG}/${PKG}${activity}}` },
      { pid, tid: pid, level: 'I', tag: 'ShopEasy', msg: next.loggedIn ? 'MainActivity onCreate, user=ana.k (session restored)' : 'MainActivity onCreate, no session -> onboarding' },
    ]);
  }
  return { ...next, screen: next.loggedIn ? 'home' : 'onboarding' };
}

function kill(d: Device, screen: Screen = 'launcher'): Device {
  return { ...d, running: false, screen: d.screen === 'crash' ? 'crash' : screen };
}

function crashBlock(pid: number, raw: string): NewLog[] {
  const L = (msg: string, key?: string): NewLog => ({ pid, tid: pid, level: 'E', tag: 'AndroidRuntime', msg, crash: true, key, gap: 0 });
  return [
    { ...L('FATAL EXCEPTION: main', 'fatal'), gap: 4 },
    L(`Process: ${PKG}, PID: ${pid}`, 'process'),
    L(`java.lang.RuntimeException: Unable to start activity ComponentInfo{${PKG}/${PKG}.product.ProductActivity}: java.lang.NumberFormatException: For input string: "${raw}"`, 'wrapper'),
    L('\tat android.app.ActivityThread.performLaunchActivity(ActivityThread.java:4206)', 'fw1'),
    L('\tat android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:4393)', 'fw2'),
    L('\tat android.os.Handler.dispatchMessage(Handler.java:107)', 'fw3'),
    L('\tat android.os.Looper.loop(Looper.java:317)', 'fw4'),
    L('\tat android.app.ActivityThread.main(ActivityThread.java:8705)', 'fw5'),
    L(`Caused by: java.lang.NumberFormatException: For input string: "${raw}"`, 'causedby'),
    L('\tat java.lang.Integer.parseInt(Integer.java:747)', 'parseint1'),
    L('\tat java.lang.Integer.parseInt(Integer.java:865)', 'parseint2'),
    L(`\tat ${PKG}.product.DeepLinkParser.productId(DeepLinkParser.kt:27)`, 'cause'),
    L(`\tat ${PKG}.product.ProductActivity.onCreate(ProductActivity.kt:58)`, 'caller'),
    L('\tat android.app.Activity.performCreate(Activity.java:8972)', 'fw6'),
    L('\t... 11 more', 'more'),
    { pid, tid: pid, level: 'I', tag: 'Process', msg: `Sending signal. PID: ${pid} SIG: 9`, gap: 3 },
    { pid: SYS, tid: 1645, level: 'W', tag: 'ActivityTaskManager', msg: `  Force finishing activity ${PKG}/.product.ProductActivity` },
  ];
}

function openDeepLink(d: Device, uri: string): { dev: Device; out: TermLine[] } {
  const m = uri.match(/^(?:shopeasy:\/\/product\/|https:\/\/shopeasy\.example\.com\/product\/)([^/?#\s]+)/);
  const intent = `Intent { act=android.intent.action.VIEW dat=${uri.replace(/^(\w+:\/\/[^/]+).*/, '$1/...')} }`;
  if (!d.installed || (!m && !uri.startsWith('https://'))) {
    return {
      dev: d,
      out: [
        { kind: 'out', text: `Starting: ${intent}` },
        { kind: 'err', text: `Error: Activity not started, unable to resolve Intent { act=android.intent.action.VIEW dat=${uri} flg=0x10000000 }` },
      ],
    };
  }
  if (!m) {
    return { dev: d, out: [{ kind: 'out', text: `Starting: ${intent}` }, { kind: 'note', text: '# Opened in Chrome: no app claims this link. (Not part of this demo.)' }] };
  }
  const raw = decodeURIComponent(m[1]);
  let dev = addLogs(d, [{ pid: SYS, tid: 1610, level: 'I', tag: 'ActivityTaskManager', msg: `START u0 {act=android.intent.action.VIEW dat=${uri} flg=0x10000000 cmp=${PKG}/.product.ProductActivity} from uid 2000` }]);
  if (!dev.running) {
    const pid = dev.pid + 37;
    dev = addLogs({ ...dev, running: true, pid }, [
      { pid: SYS, tid: 1610, level: 'I', tag: 'ActivityManager', msg: `Start proc ${pid}:${PKG}/u0a215 for next-top-activity {${PKG}/${PKG}.product.ProductActivity}` },
    ]);
  }
  dev = addLogs(dev, [{ pid: dev.pid, tid: dev.pid, level: 'D', tag: 'ShopEasy', msg: `DeepLinkRouter: route=product rawId="${raw}"` }]);
  const out: TermLine[] = [{ kind: 'out', text: `Starting: ${intent}` }];
  if (!/^\d+$/.test(raw)) {
    dev = addLogs(dev, crashBlock(dev.pid, raw));
    dev = { ...dev, running: false, screen: 'crash', crashes: dev.crashes + 1 };
    return { dev, out };
  }
  dev = addLogs(dev, [{ pid: dev.pid, tid: dev.pid, level: 'I', tag: 'ShopEasy', msg: `ProductActivity: loaded product ${raw}` }]);
  return { dev: { ...dev, screen: 'product', productId: raw }, out };
}

export function openProduct(d: Device, id: string): Device {
  const dev = addLogs(d, [{ pid: d.pid, tid: d.pid, level: 'I', tag: 'ShopEasy', msg: `ProductActivity: loaded product ${id}` }]);
  return { ...dev, screen: 'product', productId: id };
}

/* ---------------- Tokenizing ---------------- */

interface Parsed {
  segments: string[][];
  redirect: string | null;
}
function tokenize(input: string): Parsed {
  const segments: string[][] = [[]];
  let redirect: string | null = null;
  let cur = '';
  let quote: string | null = null;
  let has = false;
  let redirNext = false;
  const push = () => {
    if (!has) return;
    if (redirNext) {
      redirect = cur;
      redirNext = false;
    } else segments[segments.length - 1].push(cur);
    cur = '';
    has = false;
  };
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === ' ' || ch === '\t') push();
    else if (ch === '|') {
      push();
      segments.push([]);
    } else if (ch === '>') {
      push();
      redirNext = true;
    } else {
      cur += ch;
      has = true;
    }
  }
  push();
  return { segments, redirect };
}

/* ---------------- grep ---------------- */

function grep(lines: TermLine[], args: string[]): TermLine[] | string {
  let ignore = false;
  let after = 0;
  let pattern: string | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-i') ignore = true;
    else if (a === '-E') continue;
    else if (a === '-A') after = Number(args[++i]) || 0;
    else if (/^-A\d+$/.test(a)) after = Number(a.slice(2));
    else if (/^-i?A\d+$|^-Ai$/.test(a)) {
      ignore = true;
      after = Number(a.replace(/\D/g, '')) || 0;
    } else if (pattern === null) pattern = a;
  }
  if (pattern === null) return 'usage: grep [-i] [-A num] pattern';
  let re: RegExp;
  try {
    re = new RegExp(pattern, ignore ? 'i' : '');
  } catch {
    re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignore ? 'i' : '');
  }
  const out: TermLine[] = [];
  let remaining = 0;
  lines.forEach((l) => {
    if (re.test(l.text)) {
      out.push(l);
      remaining = after;
    } else if (remaining > 0) {
      out.push(l);
      remaining--;
    }
  });
  return out;
}

/* ---------------- logcat ---------------- */

function logcat(d: Device, args: string[], rawInput: string): { dev: Device; out: TermLine[] } {
  let star: string = 'V';
  const tags: Record<string, string> = {};
  let crashOnly = false;
  let pid: number | null = null;
  let streaming = true;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-c') return { dev: { ...d, logs: [] }, out: [] };
    if (a === '-d') streaming = false;
    else if (a === '-b') crashOnly = args[++i] === 'crash';
    else if (a === '-v') i++;
    else if (a.startsWith('--pid')) {
      const v = a.includes('=') ? a.split('=')[1] : args[++i];
      if (!v)
        return {
          dev: d,
          out: [
            { kind: 'err', text: 'logcat: --pid requires a process ID' },
            { kind: 'note', text: '# pidof printed nothing: the app is not running (after a crash its process is gone). Use \'*:E\', -b crash or | grep instead.' },
          ],
        };
      pid = Number(v);
    } else if (a === '-s') star = 'S';
    else if (a.includes(':')) {
      const [t, l] = a.split(':');
      if (t === '*') star = l.toUpperCase();
      else tags[t] = l.toUpperCase();
    } else if (!a.startsWith('-')) tags[a] = 'V';
  }
  const lines = d.logs.filter((l) => {
    if (crashOnly && !l.crash) return false;
    if (pid !== null && l.pid !== pid) return false;
    const min = tags[l.tag] ?? star;
    return rank(l.level) >= rank(min);
  });
  const out: TermLine[] = [];
  if (!crashOnly) out.push({ kind: 'log', text: '--------- beginning of main' });
  else if (lines.length) out.push({ kind: 'log', text: '--------- beginning of crash' });
  lines.forEach((l) => out.push({ kind: 'log', text: formatLog(l), level: l.level, key: l.key }));
  if (/(^|\s)\*:[A-Za-z]/.test(rawInput)) out.unshift({ kind: 'note', text: "# Tip: in zsh, quote the filter ('*:E'), or the shell treats * as a file pattern." });
  if (streaming) out.push({ kind: 'note', text: '# (Real logcat keeps streaming until you press Ctrl+C. This demo prints the buffer and stops.)' });
  return { dev: d, out };
}

/* ---------------- adb shell ---------------- */

const KEYS: Record<string, string> = { KEYCODE_HOME: 'home', '3': 'home', KEYCODE_BACK: 'back', '4': 'back', KEYCODE_ENTER: 'enter', '66': 'enter' };

function shell(d: Device, a: string[]): { dev: Device; out: TermLine[] } {
  const ok = (dev: Device, ...text: string[]) => ({ dev, out: text.map((t) => ({ kind: 'out' as const, text: t })) });
  const err = (text: string) => ({ dev: d, out: [{ kind: 'err' as const, text }] });
  const [c, ...r] = a;
  if (!c) return { dev: d, out: [{ kind: 'note', text: '# Interactive shells are not available in this demo. Run one command at a time, e.g. adb shell pm clear com.shopeasy.app' }] };

  if (c === 'pm') {
    if (r[0] === 'clear') {
      if (r[1] !== PKG || !d.installed) return ok(d, 'Failed');
      const dev = addLogs(d, [{ pid: SYS, tid: 1610, level: 'I', tag: 'ActivityManager', msg: `Force stopping ${PKG} appid=10215 user=0: clear data` }]);
      return ok({ ...kill(dev), loggedIn: false, search: '' }, 'Success');
    }
    if (r[0] === 'list' && r[1] === 'packages') {
      const pk = ['com.android.chrome', 'com.google.android.apps.maps', 'com.google.android.gm', ...(d.installed ? [PKG] : []), 'com.android.settings'];
      const f = r[2];
      return ok(d, ...pk.filter((p) => !f || p.includes(f)).map((p) => `package:${p}`));
    }
    if (r[0] === 'path') return d.installed && r[1] === PKG ? ok(d, `package:/data/app/~~kX3v9Q==/${PKG}-b7Rw2A==/base.apk`) : { dev: d, out: [] };
    return err(`Unknown command: ${r[0] ?? ''}`);
  }

  if (c === 'am') {
    if (r[0] === 'force-stop') {
      if (r[1] !== PKG || !d.running) return { dev: d, out: [] };
      return { dev: kill(d), out: [] };
    }
    if (r[0] === 'start' || r[0] === 'start-activity') {
      let action = '';
      let data = '';
      let comp = '';
      for (let i = 1; i < r.length; i++) {
        if (r[i] === '-a') action = r[++i] ?? '';
        else if (r[i] === '-d') data = r[++i] ?? '';
        else if (r[i] === '-n') comp = r[++i] ?? '';
        else if (r[i] === '-W' || r[i] === '-S') continue;
        else if (r[i] === '-p') i++;
      }
      if (data) {
        if (action && action !== 'android.intent.action.VIEW') return err(`Error: Activity not started, unable to resolve Intent { act=${action} dat=${data} flg=0x10000000 }`);
        return openDeepLink(d, data);
      }
      if (comp) {
        if (!d.installed || !comp.startsWith(PKG + '/')) return { dev: d, out: [{ kind: 'out', text: `Starting: Intent { cmp=${comp} }` }, { kind: 'err', text: `Error type 3\nError: Activity class {${comp}} does not exist.` }] };
        return { dev: launch(d), out: [{ kind: 'out', text: `Starting: Intent { cmp=${comp} }` }] };
      }
      return err('Error: no intent given. Use -a, -d or -n.');
    }
    return err(`Error: unknown command '${r[0] ?? ''}'`);
  }

  if (c === 'monkey') {
    if (r.includes(PKG) && d.installed) return ok(launch(d), `  bash arg: -p`, `  bash arg: ${PKG}`, 'Events injected: 1', '## Network stats: elapsed time=21ms (0ms mobile, 0ms wifi, 21ms not connected)');
    return ok(d, '** No activities found to run, monkey aborted.');
  }

  if (c === 'pidof') {
    const p = r.filter((x) => x !== '-s')[0];
    return p === PKG && d.running ? ok(d, String(d.pid)) : { dev: d, out: [] };
  }

  if (c === 'input') {
    if (r[0] === 'text') {
      const text = (r.slice(1).join(' ') || '').replace(/%s/g, ' ');
      if (d.screen === 'home' || d.screen === 'results') return { dev: { ...d, screen: 'home', search: d.search + text }, out: [] };
      return { dev: d, out: [{ kind: 'note', text: '# Text was typed, but no text field is focused on the current screen.' }] };
    }
    if (r[0] === 'keyevent') {
      const k = KEYS[r[1] ?? ''];
      if (!k) return { dev: d, out: r[1] ? [] : [{ kind: 'err', text: 'Error: Unknown keycode' }] };
      if (k === 'home') return { dev: { ...d, screen: 'launcher' }, out: [] };
      if (k === 'enter') {
        if (d.screen === 'home' && d.search) {
          const dev = addLogs(d, [{ pid: d.pid, tid: 4874, level: 'D', tag: 'OkHttp', msg: `--> GET https://api.shopeasy.example.com/v2/search?q=${encodeURIComponent(d.search)}` }]);
          return { dev: { ...dev, screen: 'results' }, out: [] };
        }
        return { dev: d, out: [] };
      }
      // back
      const back: Partial<Record<Screen, Screen>> = { product: 'home', results: 'home', home: 'launcher', onboarding: 'launcher', crash: 'launcher' };
      const to = back[d.screen] ?? d.screen;
      if (to === 'home' && !d.running) return { dev: { ...d, screen: 'launcher' }, out: [] };
      return { dev: { ...d, screen: to }, out: [] };
    }
    if (r[0] === 'tap' || r[0] === 'swipe') return { dev: d, out: [{ kind: 'note', text: '# Taps and swipes work on real devices, but the coordinates depend on the screen. Not simulated here.' }] };
    return err('Usage: input [<source>] <command> [<arg>...]  (text, keyevent, tap, swipe)');
  }

  if (c === 'dumpsys') {
    if (r[0] === 'battery') {
      if (!r[1]) {
        return ok(
          d,
          'Current Battery Service state:',
          ...(d.batteryOverride ? ["  (UPDATES STOPPED -- use 'reset' to restart)"] : []),
          '  AC powered: false',
          `  USB powered: ${d.plugged}`,
          '  Wireless powered: false',
          `  status: ${d.plugged ? 2 : 3}`,
          '  health: 2',
          '  present: true',
          `  level: ${d.battery}`,
          '  scale: 100',
          '  voltage: 4120',
          '  temperature: 284',
          '  technology: Li-ion',
        );
      }
      if (r[1] === 'set' && r[2] === 'level') {
        const n = Number(r[3]);
        if (!Number.isInteger(n) || n < 0 || n > 100) return err('Bad value: level must be 0-100');
        let dev: Device = { ...d, battery: n, batteryOverride: true };
        if (n <= 15 && !dev.plugged && dev.running) dev = addLogs(dev, [{ pid: dev.pid, tid: dev.pid, level: 'W', tag: 'ShopEasy', msg: `Battery low (${n}%), pausing image prefetch` }]);
        return { dev, out: [] };
      }
      if (r[1] === 'set' && (r[2] === 'usb' || r[2] === 'ac')) return { dev: { ...d, plugged: r[3] === '1', batteryOverride: true }, out: [] };
      if (r[1] === 'unplug') {
        let dev: Device = { ...d, plugged: false, batteryOverride: true };
        if (dev.battery <= 15 && dev.running) dev = addLogs(dev, [{ pid: dev.pid, tid: dev.pid, level: 'W', tag: 'ShopEasy', msg: `Battery low (${dev.battery}%), pausing image prefetch` }]);
        return { dev, out: [] };
      }
      if (r[1] === 'reset') return { dev: { ...d, plugged: true, battery: d.realBattery, batteryOverride: false }, out: [] };
      return err(`Unknown option: ${r.slice(1).join(' ')}`);
    }
    if (r[0] === 'package' && r[1] === PKG && d.installed) {
      return ok(d, 'Packages:', `  Package [${PKG}] (8f2c1d0):`, '    userId=10215', '    versionCode=241 minSdk=26 targetSdk=35', '    versionName=2.4.1', '    flags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]', '    firstInstallTime=2026-10-01 09:14:52', '    lastUpdateTime=2026-10-12 16:40:03');
    }
    return { dev: d, out: [{ kind: 'note', text: '# dumpsys prints a lot. In this demo, try: dumpsys battery, or dumpsys package com.shopeasy.app | grep versionName' }] };
  }

  if (c === 'settings') {
    if (r[0] === 'put' && r[1] === 'system' && r[2] === 'font_scale') {
      const n = Number(r[3]);
      if (!(n > 0)) return err('Error: invalid float value');
      const dev = addLogs({ ...d, fontScale: Math.min(2, Math.max(0.85, n)) }, [{ pid: SYS, tid: 1645, level: 'I', tag: 'ActivityTaskManager', msg: `Config changes=40000000 {fontScale=${n}}` }]);
      return { dev, out: [] };
    }
    if (r[0] === 'get' && r[1] === 'system' && r[2] === 'font_scale') return ok(d, String(d.fontScale));
    if (r[0] === 'put' || r[0] === 'get') return { dev: d, out: [{ kind: 'note', text: '# In this demo only "system font_scale" is wired up.' }] };
    return err('usage:  settings [--user <USER_ID> | current] get namespace key');
  }

  if (c === 'cmd' && r[0] === 'uimode' && r[1] === 'night') {
    const v = r[2];
    if (v === 'yes' || v === 'no') return ok({ ...d, dark: v === 'yes' }, `Night mode: ${v}`);
    if (!v) return ok(d, `Night mode: ${d.dark ? 'yes' : 'no'}`);
    return ok(d, `Night mode: ${v}`);
  }

  if (c === 'getprop') {
    const props: Record<string, string> = { 'ro.product.model': 'Pixel 8', 'ro.product.manufacturer': 'Google', 'ro.build.version.release': '15', 'ro.build.version.sdk': '35' };
    if (!r[0]) return { dev: d, out: [{ kind: 'note', text: '# getprop alone prints hundreds of properties. Try ro.product.model or ro.build.version.release' }] };
    return props[r[0]] ? ok(d, props[r[0]]) : { dev: d, out: [{ kind: 'out', text: '' }] };
  }

  if (c === 'screenrecord') {
    const file = r.find((x) => x.startsWith('/'));
    if (!file) return err('Must specify output file (e.g. /sdcard/bug.mp4)');
    return { dev: { ...d, recording: true, recordedFile: file }, out: [{ kind: 'note', text: '# Recording… On a real device press Ctrl+C to stop (max 3 minutes). This demo stops after 4 seconds.' }] };
  }

  if (c === 'screencap') return { dev: d, out: [{ kind: 'note', text: '# Tip: use adb exec-out screencap -p > screen.png to save straight to your computer.' }] };

  return err(`/system/bin/sh: ${c}: inaccessible or not found`);
}

/* ---------------- Main entry ---------------- */

const NEEDS_DEVICE = new Set(['install', 'uninstall', 'shell', 'logcat', 'exec-out', 'pull', 'push', 'reverse', 'tcpip', 'reboot']);

export function serials(d: Device) {
  return [USB_SERIAL, ...(d.wireless ? [d.wireless] : [])];
}

export function runCommand(dev: Device, input: string): { dev: Device; out: TermLine[] } {
  const pidSub = input.replace(/\$\(\s*adb\s+(?:-s\s+\S+\s+)?shell\s+pidof\s+(?:-s\s+)?(\S+)\s*\)/g, (_m, p) => (p === PKG && dev.running ? String(dev.pid) : ''));
  const { segments, redirect } = tokenize(pidSub);
  const first = segments[0];
  if (!first.length) return { dev, out: [] };

  if (first[0] !== 'adb') {
    if (first[0] === 'help') return { dev, out: [{ kind: 'note', text: '# Every command starts with adb. Try: adb devices, or click a command in the cheat sheet.' }] };
    return { dev, out: [{ kind: 'err', text: `zsh: command not found: ${first[0]}` }] };
  }

  let args = first.slice(1);
  let target: string | null = null;
  while (args[0] === '-s' || args[0] === '-d' || args[0] === '-e') {
    if (args[0] === '-s') {
      target = args[1] ?? '';
      args = args.slice(2);
    } else if (args[0] === '-d') {
      target = USB_SERIAL;
      args = args.slice(1);
    } else return { dev, out: [{ kind: 'err', text: 'adb: no emulators found' }] };
  }
  const [cmd, ...rest] = args;
  if (!cmd || cmd === 'help' || cmd === '--help') {
    return {
      dev,
      out: [
        { kind: 'out', text: 'Android Debug Bridge version 1.0.41' },
        { kind: 'out', text: 'global options: -s SERIAL  use device with given serial' },
        { kind: 'out', text: 'general commands: devices [-l], help, version' },
        { kind: 'out', text: 'app installation: install [-r] [-d] [-g] PACKAGE, uninstall [-k] PACKAGE' },
        { kind: 'out', text: 'shell: shell [COMMAND...], exec-out COMMAND' },
        { kind: 'out', text: 'file transfer: push LOCAL REMOTE, pull REMOTE [LOCAL]' },
        { kind: 'out', text: 'networking: connect HOST[:PORT], pair HOST[:PORT] [CODE], reverse REMOTE LOCAL' },
      ],
    };
  }

  if (NEEDS_DEVICE.has(cmd)) {
    if (target !== null && !serials(dev).includes(target)) return { dev, out: [{ kind: 'err', text: `adb: device '${target}' not found` }] };
    if (target === null && serials(dev).length > 1) return { dev, out: [{ kind: 'err', text: 'adb: more than one device/emulator' }, { kind: 'note', text: `# Pick one with -s, e.g. adb -s ${USB_SERIAL} ${cmd} …` }] };
  }

  let result: { dev: Device; out: TermLine[] };
  const o = (d: Device, ...t: string[]) => ({ dev: d, out: t.map((text) => ({ kind: 'out' as const, text })) });
  const e = (text: string) => ({ dev, out: [{ kind: 'err' as const, text }] });

  switch (cmd) {
    case 'version':
      result = o(dev, 'Android Debug Bridge version 1.0.41', 'Version 36.0.0-13206524', 'Installed as /Users/you/Library/Android/sdk/platform-tools/adb', 'Running on Darwin 25.1.0 (arm64)');
      break;
    case 'devices': {
      const long = rest.includes('-l');
      const usb = `${USB_SERIAL}\tdevice${long ? ' usb:1-1 product:shiba model:Pixel_8 device:shiba transport_id:1' : ''}`;
      const wifi = dev.wireless ? [`${dev.wireless}\tdevice${long ? ' product:shiba model:Pixel_8 device:shiba transport_id:2' : ''}`] : [];
      result = o(dev, 'List of devices attached', usb, ...wifi, '');
      break;
    }
    case 'install': {
      const file = rest.find((x) => !x.startsWith('-'));
      const bad = rest.find((x) => x.startsWith('-') && !['-r', '-d', '-g', '-t'].includes(x));
      if (bad) result = e(`adb: unknown install option: ${bad}`);
      else if (!file) result = e('adb: need APK file on command line');
      else if (file !== 'shopeasy.apk') result = e(`adb: failed to stat ${file}: No such file or directory`);
      else {
        let d2 = addLogs(dev, [{ pid: SYS, tid: 1702, level: 'I', tag: 'PackageManager', msg: `Update package ${PKG} code path from staging; ${dev.installed ? 'replacing existing install' : 'new install'}` }]);
        if (d2.running || d2.screen !== 'launcher') d2 = { ...d2, running: false, screen: 'launcher' };
        d2 = { ...d2, installed: true, loggedIn: dev.installed ? dev.loggedIn : false };
        result = o(d2, 'Performing Streamed Install', 'Success');
      }
      break;
    }
    case 'uninstall': {
      const pkg = rest.find((x) => !x.startsWith('-'));
      if (pkg !== PKG || !dev.installed) result = o(dev, 'Failure [DELETE_FAILED_INTERNAL_ERROR]');
      else {
        const keep = rest.includes('-k');
        result = o({ ...dev, installed: false, running: false, screen: 'launcher', loggedIn: keep ? dev.loggedIn : false, search: '' }, 'Success');
      }
      break;
    }
    case 'shell':
      result = shell(dev, rest);
      break;
    case 'logcat':
      result = logcat(dev, rest, pidSub);
      break;
    case 'exec-out':
      if (rest[0] === 'screencap') {
        if (redirect) {
          return { dev: { ...dev, screenshots: dev.screenshots + 1 }, out: [{ kind: 'note', text: `# Saved ${redirect} (1080 × 2400 PNG) on your computer.` }] };
        }
        result = { dev, out: [{ kind: 'out', text: '�PNG␀␚␀IHDR␀␀␸…' }, { kind: 'note', text: '# That is raw image data. Redirect it into a file: adb exec-out screencap -p > screen.png' }] };
      } else result = shell(dev, rest);
      break;
    case 'pull': {
      const remote = rest[0];
      if (remote && remote === dev.recordedFile && !dev.recording) result = o(dev, `${remote}: 1 file pulled, 0 skipped. 31.2 MB/s (4882117 bytes in 0.149s)`);
      else if (remote && remote === dev.recordedFile) result = e(`adb: error: ${remote} is still being recorded`);
      else result = e(`adb: error: failed to stat remote object '${remote ?? ''}': No such file or directory`);
      break;
    }
    case 'pair': {
      const host = rest[0] ?? '';
      if (!/^\d+\.\d+\.\d+\.\d+:\d+$/.test(host)) result = e('adb: usage: adb pair HOST[:PORT] [PAIRING CODE]');
      else if (!host.startsWith(IP + ':')) result = e(`Failed: Unable to start pairing client.`);
      else result = o({ ...dev, paired: true }, `Enter pairing code: ${rest[1] ?? '482913'}`, `Successfully paired to ${host} [guid=adb-${USB_SERIAL}-Xk2pQe]`);
      break;
    }
    case 'connect': {
      const host = rest[0] ?? '';
      if (!host) result = e('adb: usage: adb connect HOST[:PORT]');
      else if (!dev.paired || !host.startsWith(IP + ':')) result = o(dev, `failed to connect to '${host}': Connection refused`);
      else if (dev.wireless === host) result = o(dev, `already connected to ${host}`);
      else result = o({ ...dev, wireless: host }, `connected to ${host}`);
      break;
    }
    case 'disconnect':
      result = o({ ...dev, wireless: null }, dev.wireless ? (rest[0] ? `disconnected ${rest[0]}` : 'disconnected everything') : 'disconnected everything');
      break;
    case 'tcpip':
      result = o(dev, `restarting in TCP mode port: ${rest[0] ?? '5555'}`);
      break;
    case 'reverse':
      if (rest[0] === '--list') result = o(dev);
      else if (rest[0] === '--remove-all') result = o(dev);
      else if (rest.length === 2 && rest.every((x) => /^tcp:\d+$/.test(x)))
        result = { dev, out: [{ kind: 'note', text: `# Now localhost:${rest[0].slice(4)} on the phone reaches localhost:${rest[1].slice(4)} on your computer.` }] };
      else result = e('adb: usage: adb reverse REMOTE LOCAL (e.g. tcp:8080 tcp:8080)');
      break;
    case 'kill-server':
      result = o(dev);
      break;
    case 'start-server':
      result = o(dev, '* daemon not running; starting now at tcp:5037', '* daemon started successfully');
      break;
    case 'reboot':
      result = o({ ...initialDevice(), installed: dev.installed, loggedIn: dev.loggedIn, running: false, screen: 'launcher', fontScale: dev.fontScale, dark: dev.dark, paired: dev.paired });
      break;
    default:
      result = e(`adb: unknown command ${cmd}`);
  }

  // Pipes (grep only) and redirects.
  let out = result.out;
  for (const seg of segments.slice(1)) {
    if (seg[0] !== 'grep') return { dev: result.dev, out: [{ kind: 'err', text: `zsh: command not found: ${seg[0] ?? ''}` }] };
    // stderr is not piped, so errors stay visible.
    const g = grep(
      out.filter((l) => l.kind !== 'note' && l.kind !== 'err'),
      seg.slice(1),
    );
    if (typeof g === 'string') return { dev: result.dev, out: [{ kind: 'err', text: g }] };
    out = [...out.filter((l) => l.kind === 'err'), ...g];
  }
  if (redirect) {
    const n = out.filter((l) => l.kind !== 'note').length;
    return { dev: result.dev, out: [{ kind: 'note', text: `# Saved ${n} line${n === 1 ? '' : 's'} to ${redirect} on your computer.` }] };
  }
  return { dev: result.dev, out };
}
