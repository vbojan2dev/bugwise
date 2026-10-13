import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, MessageCircle, Phone, Bell, ShoppingBag, User, Volume2 } from 'lucide-react';
import { CountBadge, DotBadge, formatCount, type BadgeStyle } from './Badge';

function Control({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

const presets = [0, 1, 9, 42, 99, 100, 1000, 12345];

export default function Playground() {
  const [count, setCount] = useState(3);
  const [cap, setCap] = useState(99);
  const [hideZero, setHideZero] = useState(true);
  const [variant, setVariant] = useState<BadgeStyle>('ios');
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(360);
  const [dark, setDark] = useState(false);
  const [inName, setInName] = useState(true);
  const [problems, setProblems] = useState({ overflow: false, covers: false });
  const tabRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const visible = count > 0 || !hideZero;
  const label = formatCount(count, cap);

  useLayoutEffect(() => {
    const b = badgeRef.current?.getBoundingClientRect();
    const t = tabRef.current?.getBoundingClientRect();
    const i = iconRef.current?.getBoundingClientRect();
    let overflow = false;
    let covers = false;
    if (b && t && i && b.width > 0) {
      overflow = b.right > t.right + 1;
      const ow = Math.max(0, Math.min(b.right, i.right) - Math.max(b.left, i.left));
      const oh = Math.max(0, Math.min(b.bottom, i.bottom) - Math.max(b.top, i.top));
      covers = (ow * oh) / (i.width * i.height) > 0.3;
    }
    setProblems((p) => (p.overflow === overflow && p.covers === covers ? p : { overflow, covers }));
  });

  const surface = dark ? (variant === 'material' ? '#211f26' : '#1c1c1e') : variant === 'material' ? '#f3edf7' : '#f9f9f9';
  const activeColor = variant === 'ios' ? (dark ? '#0a84ff' : '#007aff') : variant === 'material' ? (dark ? '#d0bcff' : '#6750a4') : dark ? '#8b7dff' : '#5b4bff';
  const tabs = [
    { icon: MessageCircle, label: 'Chats' },
    { icon: Phone, label: 'Calls' },
    { icon: Bell, label: 'Updates', dot: true },
    { icon: ShoppingBag, label: 'Shop' },
    { icon: User, label: 'Profile' },
  ];
  const spoken = `${variant === 'material' ? 'TalkBack' : variant === 'ios' ? 'VoiceOver' : 'Screen reader'}: "Chats${inName && count > 0 ? `, ${count.toLocaleString('en-US')} unread` : ''}, tab, 1 of 5"`;

  const issues: string[] = [];
  if (problems.covers) issues.push('At this text size the badge covers a large part of the icon. The badge should stay at the corner of the icon at every text size.');
  if (count === 0 && !hideZero) issues.push('The badge shows "0". Zero means "nothing new": the badge should disappear.');
  if (problems.overflow) issues.push(`The badge "${label}" is wider than its tab and spills into the next one. Cap the number (99+).`);
  if (cap === 0 && count >= 1000) issues.push(`Showing "${label}" exactly doesn't help anyone. "99+" says the same and fits.`);
  if (!inName && count > 0) issues.push('The count is only drawn, not spoken. Screen reader users hear "Chats, tab" and miss the unread messages.');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">🧪 Badge stress test</p>
        <p className="text-sm text-muted">Feed the badge awkward numbers, shrink the screen and make the text huge. Watch the tab bar and what a screen reader would say.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-line p-5 lg:border-r lg:border-b-0">
          <Control label={`Unread count: ${count.toLocaleString('en-US')}`}>
            <div className="flex flex-wrap gap-1">
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                  className={`rounded-md border px-2 py-1 text-xs tabular-nums ${count === n ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted'}`}
                >
                  {n.toLocaleString('en-US')}
                </button>
              ))}
            </div>
          </Control>
          <Control label="Cap the number at" hint={count <= 9 ? 'Only matters above the cap: try 100 or 1,000.' : undefined}>
            <select value={cap} onChange={(e) => setCap(+e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm">
              <option value={0}>No cap (show the exact number)</option>
              <option value={9}>9+</option>
              <option value={99}>99+</option>
              <option value={999}>999+</option>
            </select>
          </Control>
          <Control label="Style">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1 text-xs font-medium">
              {(['ios', 'material', 'web'] as BadgeStyle[]).map((v) => (
                <button key={v} type="button" aria-pressed={variant === v} onClick={() => setVariant(v)} className={`rounded-md py-1.5 capitalize ${variant === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>
                  {v === 'ios' ? 'iOS' : v}
                </button>
              ))}
            </div>
          </Control>
          <Control label={`Screen width: ${width}px`}>
            <input type="range" min={260} max={430} step={10} value={width} onChange={(e) => setWidth(+e.target.value)} className="w-full accent-[var(--brand)]" aria-label="Screen width" />
          </Control>
          <Control label={`Text size: ${Math.round(scale * 100)}%`}>
            <input type="range" min={1} max={2.2} step={0.1} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" aria-label="Text size" />
          </Control>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-2 text-sm font-medium">
              <span>
                Hide at zero
                {count !== 0 && <span className="block text-[11px] font-normal text-muted">Set the count to 0 to see it.</span>}
              </span>
              <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm font-medium">
              Count in accessible name
              <input type="checkbox" checked={inName} onChange={(e) => setInName(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm font-medium">
              Dark mode
              <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            </label>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid flex-1 place-items-center overflow-x-auto p-6" style={{ background: dark ? '#000' : '#e9e9ee' }}>
            <div className="transition-[width] duration-200" style={{ width, maxWidth: '100%' }}>
              <div className="flex rounded-2xl pt-2.5 pb-2" style={{ background: surface, boxShadow: '0 0 0 1px rgba(127,127,127,.2)' }}>
                {tabs.map((t, i) => (
                  <button
                    key={t.label}
                    ref={i === 0 ? tabRef : undefined}
                    type="button"
                    aria-label={i === 0 && inName && count > 0 ? `Chats, ${count} unread` : t.label}
                    className="relative flex min-w-0 flex-1 flex-col items-center"
                    style={{ color: i === 0 ? activeColor : dark ? '#98989f' : '#8e8e93' }}
                  >
                    <span ref={i === 0 ? iconRef : undefined} className="relative">
                      <t.icon size={24} />
                      {i === 0 && visible && (
                        <span ref={badgeRef} className="absolute" style={{ top: -6 * scale, left: 14 }}>
                          <CountBadge label={label} variant={variant} dark={dark} scale={scale} ring={surface} />
                        </span>
                      )}
                      {t.dot && (
                        <span className="absolute" style={{ top: 0, right: -1 }}>
                          <DotBadge variant={variant} dark={dark} size={variant === 'material' ? 6 : 9} ring={surface} />
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 max-w-full truncate px-0.5 font-medium" style={{ fontSize: 10 * Math.min(scale, 1.6) }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-line bg-[#0e1120] px-4 py-3 font-mono text-[12px] text-white">
            <p className="flex items-start gap-2">
              <Volume2 size={14} className="mt-0.5 shrink-0 text-[#64d2ff]" aria-hidden="true" />
              <span>{spoken}</span>
            </p>
            <p className="mt-1 pl-6 text-[11px] text-white/50">
              Real count {count.toLocaleString('en-US')} · badge shows {visible ? `"${label}"` : 'nothing'}
            </p>
          </div>
          <div className="space-y-2 border-t border-line p-5">
            {issues.length ? (
              issues.map((t) => (
                <p key={t} className="flex items-start gap-2 text-sm text-fg">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> {t}
                </p>
              ))
            ) : (
              <p className="flex items-start gap-2 text-sm text-fg">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> Looks good. Now try 12,345 with no cap, 0 without hiding, a 260px screen or 200% text.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
