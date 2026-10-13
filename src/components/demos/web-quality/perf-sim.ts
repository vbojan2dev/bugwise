/* A tiny page-load simulator for the "page load lab".
 * Requests share the available bandwidth, scripts block rendering unless deferred,
 * the API call starts after app.js runs, product images start after the API answers.
 * Numbers are simplified, but the cause-and-effect is realistic. */

export type NetId = 'none' | 'fast4g' | 'slow4g' | '3g';
export const nets: Record<NetId, { label: string; mbps: number; rtt: number }> = {
  none: { label: 'No throttling', mbps: 40, rtt: 10 },
  fast4g: { label: 'Fast 4G', mbps: 9, rtt: 85 },
  slow4g: { label: 'Slow 4G', mbps: 1.6, rtt: 150 },
  '3g': { label: '3G', mbps: 0.4, rtt: 300 },
};
export const cpus = [
  { id: 1, label: 'No CPU throttling' },
  { id: 4, label: '4× slowdown' },
  { id: 6, label: '6× slowdown' },
] as const;

export interface Opts {
  compress: boolean;
  lazy: boolean;
  defer: boolean;
  reserve: boolean;
  cache: boolean;
  net: NetId;
  cpu: number;
}

export type ReqType = 'doc' | 'css' | 'js' | 'font' | 'img' | 'fetch';
export interface Req {
  name: string;
  type: ReqType;
  size: number;
  bytes: number;
  start: number;
  waitEnd: number;
  end: number;
  cached: boolean;
  blocking?: boolean;
}
export interface Shift {
  t: number;
  value: number;
  what: string;
}
export interface Sim {
  reqs: Req[];
  fcp: number;
  lcp: number;
  cls: number;
  inp: number;
  load: number;
  heroAt: number;
  bannerAt: number;
  productsAt: number;
  productImgAt: number[];
  shifts: Shift[];
  bytes: number;
}

export const KB = 1000;
export const sizes = {
  hero: (o: Opts) => (o.compress ? 110 * KB : 2500 * KB),
  product: (o: Opts) => (o.compress ? 45 * KB : 700 * KB),
  js: (o: Opts) => (o.defer ? 140 * KB : 480 * KB),
};

export function simulate(o: Opts): Sim {
  const { mbps, rtt } = nets[o.net];
  const bw = mbps * 125; // bytes per ms
  const cpu = o.cpu;
  const reqs: (Req & { rem: number; onDone?: (t: number) => void })[] = [];
  const timers: { t: number; fn: () => void }[] = [];
  const cacheable = (type: ReqType, name: string) => o.cache && type !== 'doc' && type !== 'fetch' && !name.includes('promo');

  const add = (name: string, type: ReqType, size: number, at: number, wait: number, onDone?: (t: number) => void, blocking?: boolean) => {
    const cached = cacheable(type, name);
    reqs.push({ name, type, size, bytes: cached ? 0 : size, start: at, waitEnd: at + (cached ? 2 : wait), end: -1, cached, rem: cached ? 0 : size, onDone, blocking });
  };

  let cssEnd = 0;
  let htmlEnd = 0;
  let execEnd = 0;
  let heroEnd = 0;
  let bannerAt = Infinity;
  let productsAt = Infinity;
  const productImgAt: number[] = [];

  add('shop.example.com', 'doc', 30 * KB, 0, 2 * rtt + 120, (t) => {
    htmlEnd = t;
    add('styles.css', 'css', 60 * KB, t, rtt, (e) => (cssEnd = e), true);
    add('app.js', 'js', sizes.js(o), t, rtt, (e) => {
      const execStart = o.defer ? Math.max(e, htmlEnd + 20) : e;
      execEnd = execStart + (o.defer ? 110 : 380) * cpu;
      timers.push({
        t: execEnd,
        fn: () => {
          add('api/products', 'fetch', 25 * KB, execEnd, rtt + 700, (a) => {
            productsAt = a + 30 * cpu;
            for (let i = 1; i <= 6; i++) {
              if (o.lazy && i > 2) continue;
              const idx = i;
              add(`product-${i}.jpg`, 'img', sizes.product(o), productsAt, rtt, (d) => (productImgAt[idx - 1] = d));
            }
          });
          add('promo.js (ads cdn)', 'js', 45 * KB, execEnd, 2 * rtt + 60, (p) => (bannerAt = p + 40 * cpu));
        },
      });
    }, !o.defer);
    add('inter.woff2', 'font', 40 * KB, t, rtt);
    add('logo.svg', 'img', 4 * KB, t, rtt);
    add('hero.jpg', 'img', sizes.hero(o), t, rtt, (e) => (heroEnd = e));
  });

  // Event loop: advance time to the next event, sharing bandwidth between active transfers.
  let t = 0;
  for (let guard = 0; guard < 2000; guard++) {
    const active = reqs.filter((r) => r.end < 0 && r.waitEnd <= t);
    const busy = active.filter((r) => r.rem > 0).length;
    const rate = busy ? bw / busy : bw;
    let next = Infinity;
    for (const r of reqs) if (r.end < 0 && r.waitEnd > t) next = Math.min(next, r.waitEnd);
    for (const r of active) next = Math.min(next, t + (r.rem > 0 ? r.rem / rate : 0));
    for (const tm of timers) next = Math.min(next, tm.t);
    if (next === Infinity) break;
    const dt = next - t;
    for (const r of active) r.rem = Math.max(0, r.rem - rate * dt);
    t = next;
    for (const r of active) {
      if (r.rem <= 0.5 && r.end < 0) {
        r.end = t;
        r.onDone?.(t);
      }
    }
    const due = timers.filter((tm) => tm.t <= t);
    for (const tm of due) {
      timers.splice(timers.indexOf(tm), 1);
      tm.fn();
    }
  }

  const fcp = (o.defer ? Math.max(cssEnd, htmlEnd) : Math.max(cssEnd, execEnd)) + 40 * cpu;
  const heroAt = Math.max(heroEnd + 15 * cpu, fcp);
  const shifts: Shift[] = [];
  if (!o.reserve) {
    if (heroEnd + 15 * cpu > fcp) shifts.push({ t: heroAt, value: 0.14, what: 'Hero image loaded without reserved space and pushed the text down' });
    if (bannerAt > fcp) shifts.push({ t: bannerAt, value: 0.1, what: 'Promo banner was inserted above the content' });
    const firstImg = productImgAt.filter(Boolean).sort((a, b) => a - b)[0];
    if (firstImg) shifts.push({ t: firstImg, value: 0.04, what: 'Product images without width/height made the cards grow' });
  }
  const cls = Math.round(shifts.reduce((s, x) => s + x.value, 0) * 100) / 100;
  const ends = reqs.map((r) => r.end);
  const load = Math.max(...ends, bannerAt, productsAt, heroAt);
  return {
    reqs: reqs.map(({ rem: _r, onDone: _d, ...r }) => r),
    fcp,
    lcp: heroAt,
    cls,
    inp: Math.round(cpu * (o.defer ? 45 : 170)),
    load,
    heroAt,
    bannerAt,
    productsAt,
    productImgAt,
    shifts: shifts.sort((a, b) => a.t - b.t),
    bytes: reqs.reduce((s, r) => s + r.bytes, 0),
  };
}

export const thresholds = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
  fcp: [1800, 3000],
} as const;

export type Rating = 'good' | 'ni' | 'poor';
export const rate = (k: keyof typeof thresholds, v: number): Rating => (v <= thresholds[k][0] ? 'good' : v <= thresholds[k][1] ? 'ni' : 'poor');

export const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s` : `${Math.round(ms)} ms`);
export const fmtBytes = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
