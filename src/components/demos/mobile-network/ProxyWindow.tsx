import { useState } from 'react';
import { Ban, CirclePause, FileDown, Gauge, Repeat, Trash2 } from 'lucide-react';
import { describeStatus, type FakeProxy, type ProxyRow } from './useFakeProxy';

/** A generic fake proxy window (in the spirit of Charles / Proxyman) on its own dark surface. */

export interface Preset {
  label: string;
  /** Returns the new [status, bodyText]. */
  apply: (status: number, text: string) => [number, string];
}
interface Props {
  proxy: FakeProxy;
  mapLocalLabel: string;
  responsePresets?: (row: ProxyRow) => Preset[];
  requestPresets?: (row: ProxyRow) => Preset[];
  emptyHint?: string;
}

const pretty = (v: unknown) => (v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2));
const methodColor: Record<string, string> = { GET: '#7dd3fc', POST: '#c4b5fd', PUT: '#fcd34d', DELETE: '#fca5a5' };

function statusColor(r: ProxyRow) {
  if (r.state === 'aborted') return '#f87171';
  if (!r.status || r.state !== 'done') return '#fbbf24';
  return r.status >= 400 ? '#f87171' : '#34d399';
}

function ToolButton({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: typeof Gauge; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-medium focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none ${
        on ? 'border-[#60a5fa] bg-[#1d3a66] text-white' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
      }`}
    >
      <Icon size={13} aria-hidden /> {label}
    </button>
  );
}

function BreakpointEditor({ row, proxy, presets, next }: { row: ProxyRow; proxy: FakeProxy; presets: Preset[]; next: () => void }) {
  const isReq = row.state === 'paused-request';
  const [status, setStatus] = useState(String(row.status ?? 200));
  const [text, setText] = useState(pretty(isReq ? row.reqBody : row.resBody));
  const [err, setErr] = useState('');

  const execute = () => {
    let body: unknown = text;
    try {
      body = text.trim() === '' ? '' : JSON.parse(text);
    } catch {
      body = text; // send it as-is: broken JSON is a valid test too
    }
    if (isReq) {
      proxy.resume(row.id, { body });
      next();
      return;
    }
    const s = Number(status);
    if (!Number.isInteger(s) || s < 100 || s > 599) {
      setErr('Status must be a number between 100 and 599.');
      return;
    }
    proxy.resume(row.id, { status: s, body });
    next();
  };

  return (
    <div className="space-y-2 p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#fbbf24]">
        <CirclePause size={14} /> Breakpoint hit: editing the {isReq ? 'request before it reaches the server' : 'response before it reaches the app'}
      </p>
      {!isReq && (
        <label className="flex items-center gap-2 text-[11.5px] text-white/70">
          Status code
          <input
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setErr('');
            }}
            inputMode="numeric"
            className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 font-mono text-[12px] text-white focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none"
          />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-[11px] text-white/50">{isReq ? 'Request body (JSON)' : 'Response body (JSON)'}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={8}
          className="block w-full resize-y rounded border border-white/15 bg-black/30 p-2 font-mono text-[11px] leading-snug text-[#e5e7eb] focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none"
        />
      </label>
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-white/40">Quick edits:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const [s, t] = p.apply(Number(status) || 200, text);
                setStatus(String(s));
                setText(t);
                setErr('');
              }}
              className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] text-white/80 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {err && <p className="text-[11px] text-[#f87171]">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={execute} className="rounded-md bg-[#2563eb] px-3 py-1.5 text-[12px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1b1d24] focus-visible:outline-none">
          Execute
        </button>
        <button type="button" onClick={() => {
            proxy.resume(row.id, null);
            next();
          }} className="flex items-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-[12px] text-white/80 focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none">
          <Ban size={12} /> Abort
        </button>
      </div>
    </div>
  );
}

export function ProxyWindow({ proxy, mapLocalLabel, responsePresets, requestPresets, emptyHint = 'Use the app on the phone to see its traffic here.' }: Props) {
  const { rows, selected, setSelected, tools, setTools } = proxy;
  const [tab, setTab] = useState<'headers' | 'body'>('body');
  const row = rows.find((r) => r.id === selected) ?? null;
  const paused = rows.filter((r) => r.state === 'paused-request' || r.state === 'paused-response');

  const toggleBreakpoint = () => {
    if (tools.breakpoint) {
      // Turning breakpoints off lets paused traffic continue unchanged.
      paused.forEach((r) => proxy.resume(r.id, r.state === 'paused-request' ? { body: r.reqBody } : { status: r.status ?? 200, body: r.resBody }));
    }
    setTools({ breakpoint: !tools.breakpoint });
  };

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-black/40 bg-[#1b1d24] text-[#e5e7eb] shadow-[0_24px_48px_-16px_rgba(16,18,35,.35)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#24262f] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-center text-[11.5px] font-medium text-white/60">Proxy · recording on 192.168.1.20:8888</span>
        <span className="size-2 animate-pulse rounded-full bg-[#ef4444]" aria-label="Recording" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <ToolButton on={tools.breakpoint} onClick={toggleBreakpoint} icon={CirclePause} label="Breakpoint" />
        <ToolButton on={tools.mapLocal} onClick={() => setTools({ mapLocal: !tools.mapLocal })} icon={FileDown} label="Map Local" />
        <ToolButton on={tools.throttle} onClick={() => setTools({ throttle: !tools.throttle })} icon={Gauge} label="Throttle" />
        <button
          type="button"
          onClick={proxy.clear}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>
      {(tools.breakpoint || tools.mapLocal || tools.throttle) && (
        <div className="space-y-1 border-b border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/60">
          {tools.breakpoint && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-white/80">Breakpoint on API calls:</span>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={tools.bpRequest} onChange={(e) => setTools({ bpRequest: e.target.checked })} className="accent-[#60a5fa]" /> Requests (with a body)
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={tools.bpResponse} onChange={(e) => setTools({ bpResponse: e.target.checked })} className="accent-[#60a5fa]" /> Responses
              </label>
            </div>
          )}
          {tools.mapLocal && (
            <p>
              <span className="text-white/80">Map Local:</span> <span className="font-mono">{mapLocalLabel}</span>
            </p>
          )}
          {tools.throttle && (
            <p>
              <span className="text-white/80">Throttle:</span> 3G preset · ~750 kbps · 300 ms latency
            </p>
          )}
        </div>
      )}

      {/* Request list */}
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_2.6rem_3.2rem] gap-2 border-b border-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white/40 uppercase">
        <span>Method</span>
        <span>Host / path</span>
        <span>Status</span>
        <span className="text-right">Time</span>
      </div>
      <ul className="max-h-52 overflow-y-auto" aria-label="Requests">
        {rows.length === 0 && <li className="px-3 py-4 text-center text-[11.5px] text-white/35">{emptyHint}</li>}
        {rows.map((r) => {
          const isPaused = r.state === 'paused-request' || r.state === 'paused-response';
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r.id)}
                aria-current={selected === r.id ? 'true' : undefined}
                className={`grid w-full grid-cols-[3rem_minmax(0,1fr)_2.6rem_3.2rem] items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] focus-visible:bg-white/10 focus-visible:outline-none ${
                  selected === r.id ? 'bg-[#1d3a66]' : isPaused ? 'bg-[#3a2f12]' : 'hover:bg-white/5'
                }`}
              >
                <span style={{ color: methodColor[r.method] ?? '#e5e7eb' }}>{r.method}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] text-white/40">{r.host}</span>
                  <span className="block truncate">{r.path}</span>
                  {r.tags.length > 0 && (
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <span key={t} className="rounded bg-white/10 px-1 font-sans text-[9.5px] text-white/70">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span style={{ color: statusColor(r) }}>{isPaused ? '⏸' : r.state === 'aborted' ? '✕' : r.state === 'pending' ? '…' : r.status}</span>
                <span className="text-right text-white/50">{r.ms !== undefined ? `${r.ms} ms` : ''}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Detail */}
      <div className="border-t border-white/10">
        {!row ? (
          <p className="px-3 py-4 text-center text-[11.5px] text-white/35">{paused.length ? 'A request is paused. Select the highlighted row.' : 'Select a request to see its details.'}</p>
        ) : row.state === 'paused-request' || row.state === 'paused-response' ? (
          <BreakpointEditor
            key={`${row.id}-${row.state}`}
            row={row}
            proxy={proxy}
            next={() => {
              // Jump to the next paused request, like a real proxy opening the next breakpoint.
              const other = paused.find((r) => r.id !== row.id);
              if (other) setSelected(other.id);
            }}
            presets={(row.state === 'paused-request' ? requestPresets?.(row) : responsePresets?.(row)) ?? []}
          />
        ) : (
          <>
            <div className="flex items-center gap-1 border-b border-white/10 px-2 pt-1.5" role="tablist" aria-label="Request details">
              {(['headers', 'body'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-2.5 py-1.5 text-[11.5px] font-medium capitalize focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none ${
                    tab === t ? 'border-[#60a5fa] text-white' : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  {t === 'body' ? 'Body (JSON)' : 'Headers'}
                </button>
              ))}
              {row.state === 'done' && (
                <button
                  type="button"
                  onClick={() => void proxy.send(row.method, row.host, row.path, row.reqBody)}
                  className="ml-auto mb-1 flex items-center gap-1 rounded px-2 py-1 text-[11px] text-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:outline-none"
                  title="Send this exact request again from the proxy"
                >
                  <Repeat size={12} /> Repeat
                </button>
              )}
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto p-3 font-mono text-[11px] leading-snug" role="tabpanel">
              <p className="break-all text-white/80">
                <span style={{ color: methodColor[row.method] }}>{row.method}</span> https://{row.host}
                {row.path}
                {row.state === 'aborted' ? <span className="text-[#f87171]"> · aborted</span> : row.status ? <span style={{ color: statusColor(row) }}> · {describeStatus(row.status)}</span> : null}
              </p>
              {tab === 'headers' ? (
                <>
                  <div>
                    <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-white/40 uppercase">Request headers</p>
                    {Object.entries(row.reqHeaders).map(([k, v]) => (
                      <p key={k} className="break-all">
                        <span className="text-[#93c5fd]">{k}:</span> {v}
                      </p>
                    ))}
                  </div>
                  {row.resHeaders && (
                    <div>
                      <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-white/40 uppercase">Response headers</p>
                      {Object.entries(row.resHeaders).map(([k, v]) => (
                        <p key={k} className="break-all">
                          <span className="text-[#93c5fd]">{k}:</span> {v}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {row.reqBody !== undefined && (
                    <div>
                      <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-white/40 uppercase">Request body</p>
                      <pre className="break-all whitespace-pre-wrap text-[#e5e7eb]">{pretty(row.reqBody)}</pre>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-white/40 uppercase">Response body</p>
                    {row.state !== 'done' ? (
                      <p className="text-white/40">{row.state === 'aborted' ? 'No response (aborted).' : 'Waiting for response…'}</p>
                    ) : row.resBody === '' || row.resBody === undefined ? (
                      <p className="text-white/40">(empty)</p>
                    ) : (
                      <pre className="break-all whitespace-pre-wrap text-[#e5e7eb]">{pretty(row.resBody)}</pre>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
