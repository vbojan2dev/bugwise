import { useMemo, useState, type ReactNode } from 'react';
import { Ban, ChevronDown, ChevronRight, CircleX, Copy, Download, Info, Pencil, Search, Smartphone, SquareMousePointer, TriangleAlert, X } from 'lucide-react';
import { ApplicationPanel } from './ApplicationPanel';
import type { ConsoleEntry, Cookie, KV, NetEntry, ReqType } from './types';

/*
 * A realistic (but simplified) Chrome DevTools panel: Elements, Console, Network, Application.
 * Fully presentational: the page demo owns all data and passes callbacks.
 * Light DevTools theme with hard-coded colors, so it never depends on the site theme.
 */

export type DevTab = 'elements' | 'console' | 'network' | 'application';
export type Throttle = 'none' | 'fast4g' | 'slow4g' | '3g' | 'offline';

export const throttleLabels: Record<Throttle, string> = {
  none: 'No throttling',
  fast4g: 'Fast 4G',
  slow4g: 'Slow 4G',
  '3g': '3G',
  offline: 'Offline',
};

export interface CssRule {
  selector: string;
  props: [string, string][];
}

export interface ElNode {
  id: string;
  depth: number;
  tag: string;
  attrs?: [string, string][];
  /** Text content shown inline (leaf nodes). */
  text?: string;
  editable?: boolean;
  /** Shows "…" for children that are not expanded. */
  collapsed?: boolean;
  selfClosing?: boolean;
  styles: CssRule[];
  hoverRule?: CssRule;
  focusRule?: CssRule;
}

const C = {
  bg: '#ffffff',
  bar: '#f1f3f4',
  line: '#d7dae0',
  text: '#1f1f1f',
  sub: '#5f6368',
  faint: '#80868b',
  blue: '#1a73e8',
  sel: '#e8f0fe',
  red: '#c5221f',
  errBg: '#fdf2f2',
  errLine: '#f6d2cf',
  warnBg: '#fffbe6',
  warnLine: '#f5e3a3',
  warnText: '#7a5900',
};

interface Props {
  tab: DevTab;
  onTab: (t: DevTab) => void;
  height?: number;
  origin: string;
  // Device mode
  device: boolean;
  onToggleDevice: () => void;
  // Elements
  nodes: ElNode[];
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  picking: boolean;
  onTogglePick: () => void;
  forced: { hover: boolean; focus: boolean };
  onForce: (state: 'hover' | 'focus', on: boolean) => void;
  onEditText: (id: string, text: string) => void;
  // Console
  logs: ConsoleEntry[];
  onClearConsole: () => void;
  // Network
  requests: NetEntry[];
  onClearNetwork: () => void;
  preserveLog: boolean;
  onPreserveLog: (v: boolean) => void;
  disableCache: boolean;
  onDisableCache: (v: boolean) => void;
  throttle: Throttle;
  onThrottle: (t: Throttle) => void;
  // Application
  cookies: Cookie[];
  local: KV;
  session: KV;
  onDeleteCookie: (name: string) => void;
  onDeleteLocal: (key: string) => void;
  onDeleteSession: (key: string) => void;
  onClearSite: () => void;
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1a73e8]';

export function DevToolsPanel(p: Props) {
  const height = p.height ?? 300;
  const errors = p.logs.filter((l) => l.level === 'error').length;
  const warnings = p.logs.filter((l) => l.level === 'warn').length;
  const tabs: { id: DevTab; label: string }[] = [
    { id: 'elements', label: 'Elements' },
    { id: 'console', label: 'Console' },
    { id: 'network', label: 'Network' },
    { id: 'application', label: 'Application' },
  ];

  return (
    <div className="@container flex min-w-0 flex-col overflow-hidden text-[12px]" style={{ background: C.bg, color: C.text }}>
      <div className="flex min-w-0 items-stretch border-b" style={{ background: C.bar, borderColor: C.line }}>
        <button
          type="button"
          title="Select an element in the page to inspect it"
          aria-label="Select an element in the page to inspect it"
          aria-pressed={p.picking}
          onClick={p.onTogglePick}
          className={`grid w-8 shrink-0 place-items-center ${focusRing}`}
          style={{ color: p.picking ? C.blue : C.sub }}
        >
          <SquareMousePointer size={15} />
        </button>
        <button
          type="button"
          title="Toggle device toolbar"
          aria-label="Toggle device toolbar"
          aria-pressed={p.device}
          onClick={p.onToggleDevice}
          className={`grid w-8 shrink-0 place-items-center border-r ${focusRing}`}
          style={{ color: p.device ? C.blue : C.sub, borderColor: C.line }}
        >
          <Smartphone size={15} />
        </button>
        <div role="tablist" aria-label="DevTools panels" className="flex min-w-0 flex-1 overflow-x-auto">
          {tabs.map((t) => {
            const active = p.tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => p.onTab(t.id)}
                className={`relative flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap ${focusRing}`}
                style={{ color: active ? C.text : C.sub, background: active ? '#fff' : 'transparent' }}
              >
                {t.label}
                {t.id === 'console' && errors > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full px-1 text-[10px] font-semibold text-white tabular-nums" style={{ background: C.red }} aria-label={`${errors} errors`}>
                    <CircleX size={10} /> {errors}
                  </span>
                )}
                {t.id === 'console' && warnings > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full px-1 text-[10px] font-semibold tabular-nums" style={{ background: '#fbbc04', color: '#3c2c00' }} aria-label={`${warnings} warnings`}>
                    <TriangleAlert size={10} /> {warnings}
                  </span>
                )}
                {active && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: C.blue }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height }} className="flex min-h-0 min-w-0 flex-col">
        {p.tab === 'elements' && <ElementsPane {...p} />}
        {p.tab === 'console' && <ConsolePane logs={p.logs} onClear={p.onClearConsole} />}
        {p.tab === 'network' && <NetworkPane {...p} />}
        {p.tab === 'application' && (
          <div className="min-h-0 flex-1 overflow-auto">
            <ApplicationPanel
              origin={p.origin}
              cookies={p.cookies}
              local={p.local}
              session={p.session}
              onDeleteCookie={p.onDeleteCookie}
              onDeleteLocal={p.onDeleteLocal}
              onDeleteSession={p.onDeleteSession}
              onClearSite={p.onClearSite}
              height={height - 110}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Elements ───────────────────────── */

function Tag({ node }: { node: ElNode }) {
  return (
    <>
      <span style={{ color: '#881280' }}>&lt;{node.tag}</span>
      {node.attrs?.map(([k, v]) => (
        <span key={k}>
          {' '}
          <span style={{ color: '#994500' }}>{k}</span>
          {v !== '' && (
            <>
              =<span style={{ color: '#1a1aa6' }}>"{v}"</span>
            </>
          )}
        </span>
      ))}
      <span style={{ color: '#881280' }}>{node.selfClosing ? ' /' : ''}&gt;</span>
    </>
  );
}

function ElementsPane(p: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showHov, setShowHov] = useState(false);
  const sel = p.nodes.find((n) => n.id === p.selectedNode);

  const startEdit = (n: ElNode) => {
    if (!n.editable) return;
    p.onSelectNode(n.id);
    setEditing(n.id);
    setDraft(n.text ?? '');
  };
  const commit = () => {
    if (editing) p.onEditText(editing, draft);
    setEditing(null);
  };

  const rules: CssRule[] = sel
    ? [
        ...(sel.focusRule && p.forced.focus ? [sel.focusRule] : []),
        ...(sel.hoverRule && p.forced.hover ? [sel.hoverRule] : []),
        ...sel.styles,
      ]
    : [];
  const canForce = !!(sel?.hoverRule || sel?.focusRule);

  return (
    <div className="flex min-h-0 flex-1 flex-col @lg:flex-row">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto py-1 font-mono text-[11px] leading-[18px]">
        {p.picking && (
          <p className="mx-2 mb-1 rounded px-2 py-1 font-sans text-[11px]" style={{ background: C.sel, color: C.blue }}>
            Inspect mode: click an element in the page above.
          </p>
        )}
        <ul aria-label="DOM tree">
          {p.nodes.map((n) => {
            const isSel = n.id === p.selectedNode;
            return (
              <li
                key={n.id}
                className="group flex min-w-0 items-start pr-2"
                style={{ paddingLeft: 8 + n.depth * 12, background: isSel ? '#cfe8fc' : undefined }}
              >
                <button
                  type="button"
                  className={`min-w-0 flex-1 text-left break-all ${focusRing}`}
                  aria-current={isSel ? 'true' : undefined}
                  onClick={() => p.onSelectNode(n.id)}
                  onDoubleClick={() => startEdit(n)}
                >
                  <Tag node={n} />
                  {n.text !== undefined && editing !== n.id && <span>{n.text}</span>}
                  {n.collapsed && <span style={{ color: C.faint }}>…</span>}
                  {(n.text !== undefined || n.collapsed) && editing !== n.id && <span style={{ color: '#881280' }}>&lt;/{n.tag}&gt;</span>}
                  {isSel && editing !== n.id && <span style={{ color: C.faint }}> == $0</span>}
                </button>
                {editing === n.id && (
                  <input
                    autoFocus
                    aria-label={`Edit text of ${n.tag}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    className="w-0 min-w-0 flex-[2] border px-1 outline-none"
                    style={{ borderColor: C.blue }}
                  />
                )}
                {n.editable && isSel && editing !== n.id && (
                  <button type="button" title="Edit text" aria-label={`Edit text of ${n.tag}`} onClick={() => startEdit(n)} className={`ml-1 shrink-0 rounded p-0.5 ${focusRing}`} style={{ color: C.blue }}>
                    <Pencil size={11} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 px-2 font-sans text-[11px]" style={{ color: C.faint }}>
          Tip: double-click a text node (or use the pencil) to edit it live.
        </p>
      </div>
      <div className="flex max-h-[45%] min-h-0 min-w-0 flex-col border-t @lg:max-h-none @lg:w-[46%] @lg:border-t-0 @lg:border-l" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-2 border-b px-2 py-1" style={{ background: C.bar, borderColor: C.line }}>
          <span className="font-medium">Styles</span>
          <span className="flex-1" />
          <button
            type="button"
            aria-expanded={showHov}
            onClick={() => setShowHov((v) => !v)}
            className={`rounded px-1.5 font-mono text-[11px] ${focusRing}`}
            style={{ background: showHov ? C.sel : 'transparent', color: showHov ? C.blue : C.sub }}
            title="Toggle element state"
          >
            :hov
          </button>
        </div>
        {showHov && (
          <div className="border-b px-2 py-1.5" style={{ borderColor: C.line }}>
            <p className="mb-1 text-[11px]" style={{ color: C.sub }}>
              Force element state
            </p>
            {canForce ? (
              <div className="flex gap-3 font-mono text-[11px]">
                {(['hover', 'focus'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-1">
                    <input type="checkbox" checked={p.forced[s]} onChange={(e) => p.onForce(s, e.target.checked)} />:{s}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[11px]" style={{ color: C.faint }}>
                Select a button node (e.g. <code>button.btn-add</code>) to force :hover or :focus.
              </p>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] leading-[17px]">
          {!sel ? (
            <p className="font-sans" style={{ color: C.faint }}>
              Select a node to see its CSS.
            </p>
          ) : (
            <>
              <div className="mb-2">
                <span>element.style</span> {'{'}
                <br />
                {'}'}
              </div>
              {rules.map((r, i) => (
                <div key={r.selector + i} className="mb-2 border-b pb-1.5" style={{ borderColor: '#eee' }}>
                  <span style={{ color: '#881280' }}>{r.selector}</span> {'{'}
                  {r.props.map(([k, v]) => (
                    <div key={k} className="pl-3">
                      <span style={{ color: '#c80000' }}>{k}</span>: <span>{v}</span>;
                    </div>
                  ))}
                  {'}'}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Console ───────────────────────── */

function ConsolePane({ logs, onClear }: { logs: ConsoleEntry[]; onClear: () => void }) {
  const [level, setLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number[]>([]);

  const shown = logs.filter((l) => {
    if (level === 'error' && l.level !== 'error') return false;
    if (level === 'warn' && l.level !== 'warn') return false;
    if (level === 'info' && !(l.level === 'info' || l.level === 'log')) return false;
    return !query || l.text.toLowerCase().includes(query.toLowerCase());
  });

  // Group identical consecutive messages, like Chrome does.
  const grouped: { entry: ConsoleEntry; count: number }[] = [];
  shown.forEach((e) => {
    const last = grouped[grouped.length - 1];
    if (last && last.entry.text === e.text && last.entry.level === e.level && !e.stack) last.count++;
    else grouped.push({ entry: e, count: 1 });
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b px-1.5 py-1" style={{ background: C.bar, borderColor: C.line }}>
        <button type="button" onClick={onClear} title="Clear console" aria-label="Clear console" className={`rounded p-1 ${focusRing}`} style={{ color: C.sub }}>
          <Ban size={13} />
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-1 rounded border bg-white px-1.5" style={{ borderColor: C.line }}>
          <Search size={12} style={{ color: C.faint }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" aria-label="Filter console messages" className="w-0 min-w-0 flex-1 py-0.5 outline-none" />
        </label>
        <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} aria-label="Log levels" className={`rounded border bg-white px-1 py-0.5 ${focusRing}`} style={{ borderColor: C.line }}>
          <option value="all">All levels</option>
          <option value="error">Errors</option>
          <option value="warn">Warnings</option>
          <option value="info">Info</option>
        </select>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto font-mono text-[11px]" aria-live="polite">
        {grouped.length === 0 && (
          <li className="p-3 font-sans" style={{ color: C.faint }}>
            {logs.length === 0 ? 'Console was cleared. Interact with the page to see messages.' : 'No messages match the filter.'}
          </li>
        )}
        {grouped.map(({ entry: e, count }) => {
          const isErr = e.level === 'error';
          const isWarn = e.level === 'warn';
          const expanded = open.includes(e.id);
          const Icon = isErr ? CircleX : isWarn ? TriangleAlert : e.level === 'info' ? Info : null;
          return (
            <li
              key={e.id}
              className="border-b px-2 py-1"
              style={{ background: isErr ? C.errBg : isWarn ? C.warnBg : undefined, borderColor: isErr ? C.errLine : isWarn ? C.warnLine : '#f0f0f0', color: isErr ? C.red : isWarn ? C.warnText : C.text }}
            >
              <div className="flex min-w-0 items-start gap-1.5">
                {e.stack ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Hide stack trace' : 'Show stack trace'}
                    onClick={() => setOpen((o) => (o.includes(e.id) ? o.filter((x) => x !== e.id) : [...o, e.id]))}
                    className={`mt-[1px] shrink-0 ${focusRing}`}
                  >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                {Icon ? <Icon size={12} className="mt-[2px] shrink-0" /> : <span className="w-3 shrink-0" />}
                {count > 1 && (
                  <span className="shrink-0 rounded-full px-1.5 text-[10px] text-white" style={{ background: C.faint }}>
                    {count}
                  </span>
                )}
                <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">{e.text}</span>
                {e.source && (
                  <span className="shrink-0 underline" style={{ color: C.faint }}>
                    {e.source}
                  </span>
                )}
              </div>
              {expanded && e.stack && (
                <div className="mt-0.5 pl-9">
                  {e.stack.map((s, i) => (
                    <div key={i} className="break-all">
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        <li className="flex items-center gap-1.5 px-2 py-1" style={{ color: C.blue }} aria-hidden="true">
          <ChevronRight size={12} />
          <span className="h-3 w-px animate-pulse" style={{ background: C.blue }} />
        </li>
      </ul>
    </div>
  );
}

/* ───────────────────────── Network ───────────────────────── */

const typeFilters: { id: 'all' | ReqType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fetch', label: 'Fetch/XHR' },
  { id: 'doc', label: 'Doc' },
  { id: 'css', label: 'CSS' },
  { id: 'js', label: 'JS' },
  { id: 'img', label: 'Img' },
];

const typeNames: Record<ReqType, string> = { doc: 'document', fetch: 'fetch', css: 'stylesheet', js: 'script', img: 'webp' };

export const reqName = (url: string) => {
  const [path, query] = url.split('?');
  const last = path.split('/').filter(Boolean).pop() ?? path;
  return query ? `${last}?${query}` : last || '/';
};

const statusLabel = (r: NetEntry) => (r.status === null ? '(pending)' : r.status === 0 ? `(${r.statusText ?? 'failed'})` : String(r.status));
const isBad = (r: NetEntry) => r.status !== null && (r.status === 0 || r.status >= 400);
const fmtTime = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`);

function NetworkPane(p: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | ReqType>('all');
  const [selId, setSelId] = useState<number | null>(null);
  const [har, setHar] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusMatch = q.match(/^status-code:(\d{1,3})$/);
    const methodMatch = q.match(/^method:([a-z]+)$/);
    return p.requests.filter((r) => {
      if (type !== 'all' && r.type !== type) return false;
      if (!q) return true;
      if (statusMatch) return String(r.status ?? '').startsWith(statusMatch[1]);
      if (methodMatch) return r.method.toLowerCase() === methodMatch[1];
      return r.url.toLowerCase().includes(q);
    });
  }, [p.requests, query, type]);

  const sel = p.requests.find((r) => r.id === selId) ?? null;
  const transferred = p.requests.reduce((sum, r) => {
    const m = r.size.match(/([\d.]+)\s*kB/);
    return sum + (m && !r.fromCache ? parseFloat(m[1]) : 0);
  }, 0);
  const finish = p.requests.reduce((max, r) => Math.max(max, r.time), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-1.5 py-1" style={{ background: C.bar, borderColor: C.line }}>
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: '#d93025' }} title="Recording network log" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            p.onClearNetwork();
            setSelId(null);
          }}
          title="Clear network log"
          aria-label="Clear network log"
          className={`rounded p-0.5 ${focusRing}`}
          style={{ color: C.sub }}
        >
          <Ban size={13} />
        </button>
        <label className="flex min-w-[110px] flex-1 items-center gap-1 rounded border bg-white px-1.5" style={{ borderColor: C.line }}>
          <Search size={12} style={{ color: C.faint }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter, e.g. status-code:500" aria-label="Filter requests" className="w-0 min-w-0 flex-1 py-0.5 outline-none" />
        </label>
        <label className="flex items-center gap-1 whitespace-nowrap">
          <input type="checkbox" checked={p.preserveLog} onChange={(e) => p.onPreserveLog(e.target.checked)} /> Preserve log
        </label>
        <label className="flex items-center gap-1 whitespace-nowrap">
          <input type="checkbox" checked={p.disableCache} onChange={(e) => p.onDisableCache(e.target.checked)} /> Disable cache
        </label>
        <select value={p.throttle} onChange={(e) => p.onThrottle(e.target.value as Throttle)} aria-label="Network throttling" className={`rounded border bg-white px-1 py-0.5 ${focusRing}`} style={{ borderColor: C.line, color: p.throttle !== 'none' ? '#b06000' : C.text }}>
          {(Object.keys(throttleLabels) as Throttle[]).map((t) => (
            <option key={t} value={t}>
              {throttleLabels[t]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setHar((v) => !v)} title="Export HAR" aria-label="Export HAR" className={`rounded p-0.5 ${focusRing}`} style={{ color: C.sub }}>
          <Download size={13} />
        </button>
      </div>
      <div className="flex gap-0.5 overflow-x-auto border-b px-1.5 py-1" style={{ borderColor: C.line }} role="group" aria-label="Filter by request type">
        {typeFilters.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={type === t.id}
            onClick={() => setType(t.id)}
            className={`shrink-0 rounded px-2 py-0.5 whitespace-nowrap ${focusRing}`}
            style={{ background: type === t.id ? '#d3e3fd' : 'transparent', color: type === t.id ? '#0b57d0' : C.text }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {har && (
        <p className="flex items-start gap-2 border-b px-2 py-1 text-[11px]" style={{ background: C.sel, borderColor: C.line, color: '#174ea6' }}>
          <span className="flex-1">
            In real DevTools this downloads <code>freshcart.example.har</code> with every request below. Attach it to your bug report. HAR files can contain cookies and tokens, so share them carefully.
          </span>
          <button type="button" aria-label="Close" onClick={() => setHar(false)} className={focusRing}>
            <X size={12} />
          </button>
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        <div className={`min-h-0 min-w-0 overflow-auto ${sel ? 'hidden @xl:block @xl:w-[34%] @xl:border-r' : 'w-full'}`} style={{ borderColor: C.line }}>
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0" style={{ background: C.bar, color: C.sub }}>
              <tr>
                <th className="border-b px-2 py-1 text-left font-medium" style={{ borderColor: C.line }}>
                  Name
                </th>
                {!sel && (
                  <>
                    <th className="border-b px-2 py-1 text-left font-medium" style={{ borderColor: C.line }}>
                      Status
                    </th>
                    <th className="hidden border-b px-2 py-1 text-left font-medium @lg:table-cell" style={{ borderColor: C.line }}>
                      Type
                    </th>
                    <th className="hidden border-b px-2 py-1 text-left font-medium @md:table-cell" style={{ borderColor: C.line }}>
                      Size
                    </th>
                    <th className="border-b px-2 py-1 text-right font-medium" style={{ borderColor: C.line }}>
                      Time
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const bad = isBad(r);
                const active = r.id === selId;
                return (
                  <tr key={r.id} onClick={() => setSelId(r.id)} className="cursor-pointer hover:bg-[#f1f3f4]" style={{ background: active ? C.sel : undefined, color: bad ? C.red : undefined }}>
                    <td className="max-w-0 border-b px-2 py-[3px]" style={{ borderColor: '#eee', width: sel ? undefined : '48%' }}>
                      <button type="button" onClick={() => setSelId(r.id)} className={`block w-full truncate text-left ${focusRing}`} title={r.url}>
                        {reqName(r.url)}
                      </button>
                    </td>
                    {!sel && (
                      <>
                        <td className="border-b px-2 whitespace-nowrap" style={{ borderColor: '#eee', color: r.status === null ? C.faint : undefined }}>
                          {statusLabel(r)}
                        </td>
                        <td className="hidden border-b px-2 @lg:table-cell" style={{ borderColor: '#eee', color: bad ? undefined : C.sub }}>
                          {typeNames[r.type]}
                        </td>
                        <td className="hidden border-b px-2 whitespace-nowrap @md:table-cell" style={{ borderColor: '#eee', color: bad ? undefined : r.fromCache ? C.faint : undefined }}>
                          {r.status === null ? '' : r.size}
                        </td>
                        <td className="border-b px-2 text-right whitespace-nowrap tabular-nums" style={{ borderColor: '#eee', color: r.status === null ? C.faint : r.time >= 3000 ? '#b06000' : undefined }}>
                          {r.status === null ? 'Pending' : fmtTime(r.time)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {p.requests.length === 0 && (
            <p className="p-3 text-center" style={{ color: C.faint }}>
              Recording network activity… Reload the page or interact with it.
            </p>
          )}
        </div>
        {sel && <RequestDetails r={sel} origin={p.origin} onClose={() => setSelId(null)} />}
      </div>
      <div className="truncate border-t px-2 py-0.5 text-[11px]" style={{ background: C.bar, borderColor: C.line, color: C.sub }}>
        {shown.length} / {p.requests.length} requests · {transferred.toFixed(1)} kB transferred · Finish: {fmtTime(finish)}
      </div>
    </div>
  );
}

type DetailTab = 'headers' | 'payload' | 'response' | 'timing';

const bodyText = (b: unknown) => (typeof b === 'string' ? b : JSON.stringify(b, null, 2));

export const curlFor = (r: NetEntry, origin: string) => {
  const parts = [`curl 'https://${origin}${r.url}'`];
  if (r.method !== 'GET') parts.push(`  -X ${r.method}`);
  (r.requestHeaders ?? []).forEach(([k, v]) => parts.push(`  -H '${k}: ${v}'`));
  if (r.requestBody !== undefined) parts.push(`  --data-raw '${JSON.stringify(r.requestBody)}'`);
  return parts.join(' \\\n');
};

function RequestDetails({ r, origin, onClose }: { r: NetEntry; origin: string; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('headers');
  const [curl, setCurl] = useState(false);
  const tabs: DetailTab[] = ['headers', ...(r.requestBody !== undefined ? (['payload'] as const) : []), 'response', 'timing'];
  const active = tabs.includes(tab) ? tab : 'headers';
  const statusColor = r.status === null ? C.faint : isBad(r) ? '#d93025' : r.status >= 300 ? '#f29900' : '#1e8e3e';

  const copy = () => {
    setCurl(true);
    try {
      void navigator.clipboard?.writeText(curlFor(r, origin)).catch(() => {});
    } catch {
      /* clipboard not available, the text is shown anyway */
    }
  };

  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="grid grid-cols-1 gap-x-3 py-[1px] @md:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="font-medium" style={{ color: C.sub }}>
        {k}
      </dt>
      <dd className="min-w-0 break-all">{v}</dd>
    </div>
  );

  const ttfb = Math.round(r.time * 0.78);
  const download = Math.max(1, Math.round(r.time * 0.17));
  const queue = Math.max(0, Math.round(r.time - ttfb - download));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-stretch border-b" style={{ background: C.bar, borderColor: C.line }}>
        <button type="button" onClick={onClose} aria-label="Close request details" className={`grid w-7 shrink-0 place-items-center ${focusRing}`} style={{ color: C.sub }}>
          <X size={13} />
        </button>
        <div role="tablist" aria-label="Request details" className="flex min-w-0 flex-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active === t}
              onClick={() => setTab(t)}
              className={`relative shrink-0 px-2 py-1 capitalize ${focusRing}`}
              style={{ color: active === t ? C.text : C.sub, background: active === t ? '#fff' : undefined }}
            >
              {t}
              {active === t && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: C.blue }} />}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className={`flex shrink-0 items-center gap-1 px-2 text-[11px] ${focusRing}`} style={{ color: C.blue }} title="Copy as cURL (bash)">
          <Copy size={12} /> <span className="hidden @sm:inline">Copy as cURL</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] leading-[17px]">
        {curl && (
          <div className="mb-2 rounded border p-1.5" style={{ borderColor: C.line, background: '#f8f9fa' }}>
            <div className="mb-1 flex items-center justify-between font-sans" style={{ color: C.sub }}>
              <span>Copied as cURL (bash). Paste it into a terminal or your bug report:</span>
              <button type="button" aria-label="Hide cURL" onClick={() => setCurl(false)} className={focusRing}>
                <X size={11} />
              </button>
            </div>
            <pre className="break-all whitespace-pre-wrap">{curlFor(r, origin)}</pre>
          </div>
        )}
        {active === 'headers' && (
          <dl className="space-y-2">
            <div>
              <p className="mb-0.5 font-sans font-semibold">General</p>
              <Row k="Request URL" v={`https://${origin}${r.url}`} />
              <Row k="Request Method" v={r.method} />
              <Row
                k="Status Code"
                v={
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: statusColor }} />
                    {r.status === null ? 'Pending' : r.status === 0 ? `(${r.statusText ?? 'failed'})` : `${r.status} ${r.statusText ?? ''}`}
                    {r.fromCache && ' (from disk cache)'}
                  </span>
                }
              />
              <Row k="Remote Address" v="203.0.113.24:443" />
              <Row k="Initiator" v={r.initiator ?? 'Other'} />
            </div>
            {r.responseHeaders && r.status !== null && r.status !== 0 && (
              <div>
                <p className="mb-0.5 font-sans font-semibold">Response Headers</p>
                {r.responseHeaders.map(([k, v]) => (
                  <Row key={k} k={k} v={v} />
                ))}
              </div>
            )}
            {r.requestHeaders && (
              <div>
                <p className="mb-0.5 font-sans font-semibold">Request Headers</p>
                {r.requestHeaders.map(([k, v]) => (
                  <Row key={k} k={k} v={v} />
                ))}
              </div>
            )}
          </dl>
        )}
        {active === 'payload' && (
          <>
            <p className="mb-1 font-sans font-semibold">Request Payload</p>
            <pre className="break-all whitespace-pre-wrap">{bodyText(r.requestBody)}</pre>
          </>
        )}
        {active === 'response' &&
          (r.status === null ? (
            <p style={{ color: C.faint }}>Waiting for the server…</p>
          ) : r.responseBody === undefined ? (
            <p className="font-sans" style={{ color: C.faint }}>
              {r.status === 0 ? 'Failed to load response data: no response from the server.' : 'This request has no response data available (image).'}
            </p>
          ) : (
            <pre className="break-all whitespace-pre-wrap">{bodyText(r.responseBody)}</pre>
          ))}
        {active === 'timing' && (
          <div className="space-y-1.5 font-sans">
            {r.status === null ? (
              <p style={{ color: C.faint }}>Still waiting for the response…</p>
            ) : (
              <>
                {[
                  ['Queueing & connection', queue, '#9aa0a6'],
                  ['Waiting for server response', ttfb, '#1e8e3e'],
                  ['Content download', download, '#1a73e8'],
                ].map(([label, ms, color]) => (
                  <div key={label as string} className="grid grid-cols-[minmax(0,1fr)_60px] items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate" style={{ color: C.sub }}>
                        {label}
                      </p>
                      <div className="h-2 rounded-sm" style={{ width: `${Math.max(2, ((ms as number) / Math.max(1, r.time)) * 100)}%`, background: color as string }} />
                    </div>
                    <span className="text-right font-mono tabular-nums">{fmtTime(ms as number)}</span>
                  </div>
                ))}
                <p className="border-t pt-1 font-mono" style={{ borderColor: C.line }}>
                  Total: {fmtTime(r.time)}
                </p>
                {r.time >= 3000 && (
                  <p className="rounded px-2 py-1" style={{ background: C.warnBg, color: C.warnText }}>
                    Most of this time is spent waiting for the server (TTFB). That points to a slow backend, not a slow network.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
