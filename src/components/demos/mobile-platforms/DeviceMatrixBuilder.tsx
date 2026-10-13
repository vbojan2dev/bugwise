import { useState } from 'react';
import { Apple, Smartphone, Tablet, CheckCircle2, AlertTriangle, Clock, Users, Sparkles, Eraser } from 'lucide-react';

/*
 * "Build your device matrix": pick test devices from example analytics and get coverage feedback.
 * Share numbers are made up for a fictional food-delivery app. Screen sizes are approximate logical sizes
 * (points on iOS, dp on Android).
 */

type Os = 'ios' | 'android';
type Kind = 'phone' | 'tablet' | 'foldable';

interface Device {
  id: string;
  name: string;
  os: Os;
  osVersion: number;
  skin: string;
  inches: string;
  w: number;
  h: number;
  ram: number;
  kind: Kind;
  share: number;
}

const devices: Device[] = [
  { id: 'a15', name: 'Samsung Galaxy A15', os: 'android', osVersion: 14, skin: 'One UI', inches: '6.5″', w: 384, h: 854, ram: 4, kind: 'phone', share: 11 },
  { id: 'ip16', name: 'iPhone 16', os: 'ios', osVersion: 26, skin: 'iOS', inches: '6.1″', w: 393, h: 852, ram: 8, kind: 'phone', share: 9 },
  { id: 's24', name: 'Samsung Galaxy S24', os: 'android', osVersion: 16, skin: 'One UI', inches: '6.2″', w: 384, h: 832, ram: 8, kind: 'phone', share: 8 },
  { id: 'ip13', name: 'iPhone 13', os: 'ios', osVersion: 18, skin: 'iOS', inches: '6.1″', w: 390, h: 844, ram: 4, kind: 'phone', share: 7 },
  { id: 'redmi', name: 'Xiaomi Redmi Note 13', os: 'android', osVersion: 14, skin: 'HyperOS', inches: '6.67″', w: 393, h: 873, ram: 6, kind: 'phone', share: 7 },
  { id: 'a12', name: 'Samsung Galaxy A12', os: 'android', osVersion: 11, skin: 'One UI', inches: '6.5″', w: 360, h: 800, ram: 3, kind: 'phone', share: 5 },
  { id: 'ip15pm', name: 'iPhone 15 Pro Max', os: 'ios', osVersion: 26, skin: 'iOS', inches: '6.7″', w: 430, h: 932, ram: 8, kind: 'phone', share: 5 },
  { id: 'pixel8', name: 'Google Pixel 8', os: 'android', osVersion: 16, skin: 'Pixel (stock)', inches: '6.2″', w: 412, h: 915, ram: 8, kind: 'phone', share: 4 },
  { id: 'se', name: 'iPhone SE (3rd gen)', os: 'ios', osVersion: 26, skin: 'iOS', inches: '4.7″', w: 375, h: 667, ram: 4, kind: 'phone', share: 4 },
  { id: 'moto', name: 'Moto E13', os: 'android', osVersion: 13, skin: 'Android Go', inches: '6.5″', w: 360, h: 800, ram: 2, kind: 'phone', share: 3 },
  { id: 'ipad', name: 'iPad (10th gen)', os: 'ios', osVersion: 26, skin: 'iPadOS', inches: '10.9″', w: 820, h: 1180, ram: 4, kind: 'tablet', share: 3 },
  { id: 'xr', name: 'iPhone XR', os: 'ios', osVersion: 17, skin: 'iOS', inches: '6.1″', w: 414, h: 896, ram: 3, kind: 'phone', share: 2 },
  { id: 'tab', name: 'Galaxy Tab A9', os: 'android', osVersion: 15, skin: 'One UI', inches: '8.7″', w: 600, h: 960, ram: 4, kind: 'tablet', share: 2 },
  { id: 'fold', name: 'Galaxy Z Fold6 (unfolded)', os: 'android', osVersion: 16, skin: 'One UI', inches: '7.6″', w: 673, h: 841, ram: 12, kind: 'foldable', share: 1 },
];

const MIN = { ios: 17, android: 11 };
const NEWEST = { ios: 26, android: 16 };
const MINUTES_PER_DEVICE = 35;
const BUDGET_HOURS = 6;
const suggested = ['a15', 'ip16', 'redmi', 'a12', 'se', 'moto', 'xr', 'pixel8', 'fold'];

export default function DeviceMatrixBuilder() {
  const [picked, setPicked] = useState<string[]>(['ip16', 's24']);
  const sel = devices.filter((d) => picked.includes(d.id));

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const share = sel.reduce((n, d) => n + d.share, 0);
  const iosSel = sel.filter((d) => d.os === 'ios');
  const andSel = sel.filter((d) => d.os === 'android');
  const minOf = (l: Device[]) => (l.length ? Math.min(...l.map((d) => d.osVersion)) : null);
  const maxOf = (l: Device[]) => (l.length ? Math.max(...l.map((d) => d.osVersion)) : null);
  const minutes = sel.length * MINUTES_PER_DEVICE;
  const hours = minutes / 60;

  const checks = [
    { ok: iosSel.length > 0 && andSel.length > 0, label: 'Both platforms', tip: 'Pick at least one iPhone and one Android device.' },
    { ok: minOf(iosSel) === MIN.ios && minOf(andSel) === MIN.android, label: `Oldest supported OS (iOS ${MIN.ios}, Android ${MIN.android})`, tip: 'Old OS versions are where crashes and missing APIs hide. Add the iPhone XR and the Galaxy A12.' },
    { ok: maxOf(iosSel) === NEWEST.ios && maxOf(andSel) === NEWEST.android, label: `Newest OS (iOS ${NEWEST.ios}, Android ${NEWEST.android})`, tip: 'New OS releases change permissions, notifications and back behavior. Cover the latest on both.' },
    { ok: sel.some((d) => d.w <= 375 || d.h <= 700), label: 'A small screen', tip: 'Small or short screens (iPhone SE, 360 dp Androids) are where buttons get cut off.' },
    { ok: sel.some((d) => d.ram <= 3), label: 'A low-end device (≤ 3 GB RAM)', tip: 'Cheap phones expose slow screens, memory crashes and the app being killed in the background.' },
    { ok: sel.some((d) => d.kind !== 'phone'), label: 'A tablet or foldable', tip: 'Large and changing screens break stretched images and fixed layouts.' },
    { ok: sel.some((d) => d.skin === 'One UI') && sel.some((d) => d.skin === 'HyperOS' || d.skin === 'Pixel (stock)'), label: 'More than one Android manufacturer', tip: 'Samsung, Xiaomi and Google phones behave differently (battery savers, fonts, permissions).' },
    { ok: share >= 45, label: 'At least 45% of users on these exact models', tip: 'Start from your analytics: the most popular models give the most value per device.' },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const overBudget = hours > BUDGET_HOURS;

  const maxH = 1180;
  const previewScale = 84 / maxH;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-[14rem] flex-1">
          <p className="font-semibold">🧩 Build your device matrix</p>
          <p className="text-sm text-muted">
            You test a food-delivery app. Analytics show these models (example data). Pick the devices for your regression run and watch the feedback.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPicked(suggested)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg hover:bg-subtle">
            <Sparkles size={13} /> Suggest a matrix
          </button>
          <button type="button" onClick={() => setPicked([])} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-fg">
            <Eraser size={13} /> Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-line p-4 lg:border-r lg:border-b-0">
          <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_4.5rem_4rem_3.5rem] gap-2 px-3 text-[11px] font-semibold tracking-wide text-faint uppercase sm:grid">
            <span>Device</span>
            <span>Screen</span>
            <span>RAM</span>
            <span className="text-right">Users</span>
          </div>
          <ul className="space-y-1.5">
            {devices.map((d) => {
              const on = picked.includes(d.id);
              const Icon = d.kind === 'phone' ? (d.os === 'ios' ? Apple : Smartphone) : Tablet;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(d.id)}
                    className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_4.5rem_4rem_3.5rem] ${
                      on ? 'border-brand bg-brand-soft' : 'border-line hover:bg-subtle'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-md border text-[11px] ${on ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong'}`}>{on ? '✓' : ''}</span>
                      <Icon size={15} className="shrink-0 text-muted" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">{d.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {d.os === 'ios' ? (d.skin === 'iPadOS' ? 'iPadOS' : 'iOS') : 'Android'} {d.osVersion}
                          {d.os === 'android' && ` · ${d.skin}`}
                          <span className="sm:hidden">
                            {' '}
                            · {d.inches} · {d.ram} GB
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="hidden text-xs text-muted sm:block">
                      {d.inches}
                      <span className="block text-[10px] text-faint">
                        {d.w}×{d.h}
                      </span>
                    </span>
                    <span className={`hidden text-xs sm:block ${d.ram <= 3 ? 'font-semibold text-warn' : 'text-muted'}`}>{d.ram} GB</span>
                    <span className="text-right text-sm font-semibold text-fg tabular-nums">{d.share}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-1 text-xs text-faint">Screen sizes are approximate logical sizes (pt on iOS, dp on Android). The remaining 29% of users are spread over hundreds of other models.</p>
        </div>

        <div className="min-w-0 p-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-subtle p-3">
              <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
                <Users size={12} /> Users
              </p>
              <p className="mt-1 text-xl font-bold text-fg tabular-nums">{share}%</p>
            </div>
            <div className="rounded-xl bg-subtle p-3">
              <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">Devices</p>
              <p className="mt-1 text-xl font-bold text-fg tabular-nums">{sel.length}</p>
            </div>
            <div className={`rounded-xl p-3 ${overBudget ? 'bg-danger-soft' : 'bg-subtle'}`}>
              <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
                <Clock size={12} /> Time
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${overBudget ? 'text-danger' : 'text-fg'}`}>{hours.toFixed(1)} h</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            One regression pass takes about {MINUTES_PER_DEVICE} min per device. Your team has {BUDGET_HOURS} h per release.
            {overBudget && <strong className="text-danger"> Over budget: drop near-duplicates (similar screen, same OS and maker).</strong>}
          </p>

          <div className="mt-4 rounded-xl border border-line p-3">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">OS range</p>
            <p className="mt-1 text-sm text-fg">
              iOS: {iosSel.length ? `${minOf(iosSel)} – ${maxOf(iosSel)}` : '—'} <span className="text-faint">(supported {MIN.ios}–{NEWEST.ios})</span>
            </p>
            <p className="text-sm text-fg">
              Android: {andSel.length ? `${minOf(andSel)} – ${maxOf(andSel)}` : '—'} <span className="text-faint">(supported {MIN.android}–{NEWEST.android})</span>
            </p>
          </div>

          <div className="mt-4">
            <p className="flex items-center justify-between text-xs font-semibold tracking-wide text-faint uppercase">
              Coverage checks <span className="font-mono text-fg">{passed}/{checks.length}</span>
            </p>
            <ul className="mt-2 space-y-2">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2 text-sm">
                  {c.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />}
                  <span className="min-w-0">
                    <span className="text-fg">{c.label}</span>
                    {!c.ok && <span className="block text-xs text-muted">{c.tip}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-line p-3">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Screen sizes, to scale</p>
            {sel.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Pick devices to compare their screens.</p>
            ) : (
              <div className="mt-2 flex flex-wrap items-end gap-2.5">
                {[...sel]
                  .sort((a, b) => a.w * a.h - b.w * b.h)
                  .map((d) => (
                    <div key={d.id} className="flex flex-col items-center gap-1" title={`${d.name}: ${d.w}×${d.h}`}>
                      <div
                        className="rounded-[4px] border-2 border-fg/70 bg-subtle"
                        style={{ width: Math.round(d.w * previewScale), height: Math.round(d.h * previewScale) }}
                        aria-hidden="true"
                      />
                      <span className="max-w-[4.5rem] truncate text-[10px] text-muted">{d.name.replace('Samsung ', '').replace(' (unfolded)', '')}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
