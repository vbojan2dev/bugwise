import { useEffect, useRef, useState } from 'react';
import { Check, Cookie as CookieIcon, Database, Eraser, HardDrive, Trash2 } from 'lucide-react';
import type { Cookie, KV } from './types';

/*
 * A Chrome-like "Application" panel: Local storage, Session storage and Cookies for one origin.
 * Presentational: the parent owns the data and decides what deleting means.
 * Rows that changed since the last render flash yellow for a moment, like real DevTools.
 */

export type StorageArea = 'local' | 'session' | 'cookies';

interface Props {
  origin: string;
  cookies: Cookie[];
  local: KV;
  session: KV;
  onDeleteCookie?: (name: string) => void;
  onDeleteLocal?: (key: string) => void;
  onDeleteSession?: (key: string) => void;
  onClearSite?: () => void;
  initialArea?: StorageArea;
  /** Height of the scrollable table area in px. */
  height?: number;
}

const C = {
  bg: '#ffffff',
  bar: '#f1f3f4',
  line: '#d7dae0',
  text: '#1f1f1f',
  sub: '#5f6368',
  blue: '#1a73e8',
  selRow: '#e8f0fe',
  flash: '#fff3c4',
};

const pretty = (v: string) => {
  try {
    const parsed = JSON.parse(v);
    if (typeof parsed === 'object' && parsed !== null) return JSON.stringify(parsed, null, 2);
  } catch {
    /* not JSON */
  }
  return v;
};

export function ApplicationPanel({ origin, cookies, local, session, onDeleteCookie, onDeleteLocal, onDeleteSession, onClearSite, initialArea = 'cookies', height = 200 }: Props) {
  const [area, setArea] = useState<StorageArea>(initialArea);
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<string[]>([]);
  const prev = useRef<Map<string, string> | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // Detect changed rows and flash them.
  useEffect(() => {
    const now = new Map<string, string>();
    cookies.forEach((c) => now.set(`cookies:${c.name}`, JSON.stringify(c)));
    local.forEach(([k, v]) => now.set(`local:${k}`, v));
    session.forEach(([k, v]) => now.set(`session:${k}`, v));
    const before = prev.current;
    prev.current = now;
    if (!before) return;
    const changed: string[] = [];
    now.forEach((v, k) => {
      if (before.get(k) !== v) changed.push(k);
    });
    if (changed.length === 0) return;
    setFlash(changed);
    clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash([]), 1400);
  }, [cookies, local, session]);

  const areas: { id: StorageArea; label: string; icon: typeof Database; count: number }[] = [
    { id: 'local', label: 'Local storage', icon: Database, count: local.length },
    { id: 'session', label: 'Session storage', icon: HardDrive, count: session.length },
    { id: 'cookies', label: 'Cookies', icon: CookieIcon, count: cookies.length },
  ];

  const kv = area === 'local' ? local : session;
  const selCookie = area === 'cookies' ? cookies.find((c) => c.name === selected) : undefined;
  const selKV = area !== 'cookies' ? kv.find(([k]) => k === selected) : undefined;

  const del = (key: string) => {
    if (area === 'cookies') onDeleteCookie?.(key);
    else if (area === 'local') onDeleteLocal?.(key);
    else onDeleteSession?.(key);
    setSelected((s) => (s === key ? null : s));
  };

  const th = 'border-b px-2 py-1 text-left font-medium whitespace-nowrap';
  const td = 'border-b px-2 py-1 align-top';

  return (
    <div className="@container flex min-w-0 flex-col text-[12px]" style={{ background: C.bg, color: C.text }}>
      <div className="flex flex-wrap items-center gap-2 border-b px-2 py-1.5" style={{ background: C.bar, borderColor: C.line }}>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px]" style={{ color: C.sub }}>
          https://{origin}
        </span>
        {onClearSite && (
          <button
            type="button"
            onClick={() => {
              onClearSite();
              setSelected(null);
            }}
            className="flex items-center gap-1 rounded border bg-white px-2 py-0.5 text-[11px] hover:bg-[#f8f9fa] focus-visible:outline-2 focus-visible:outline-[#1a73e8]"
            style={{ borderColor: C.line }}
          >
            <Eraser size={12} /> Clear site data
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-col @md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b p-1.5 @md:w-40 @md:flex-col @md:border-r @md:border-b-0" style={{ borderColor: C.line }} aria-label="Storage">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={area === a.id}
              onClick={() => {
                setArea(a.id);
                setSelected(null);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-left whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1a73e8]"
              style={{ background: area === a.id ? C.selRow : 'transparent', color: area === a.id ? C.blue : C.text }}
            >
              <a.icon size={13} />
              <span className="flex-1">{a.label}</span>
              <span className="rounded-full px-1.5 text-[10px] tabular-nums" style={{ background: '#e8eaed', color: C.sub }}>
                {a.count}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-w-0 overflow-auto" style={{ height }}>
            {area === 'cookies' ? (
              cookies.length === 0 ? (
                <p className="p-4 text-center" style={{ color: C.sub }}>
                  No cookies for this site.
                </p>
              ) : (
                <table className="w-full min-w-[620px] border-collapse font-mono text-[11px]">
                  <thead style={{ background: C.bar, color: C.sub }}>
                    <tr style={{ borderColor: C.line }}>
                      {['Name', 'Value', 'Domain', 'Path', 'Expires / Max-Age', 'HttpOnly', 'Secure', 'SameSite', ''].map((h) => (
                        <th key={h} className={th} style={{ borderColor: C.line }}>
                          {h || <span className="sr-only">Actions</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cookies.map((c) => {
                      const isSel = selected === c.name;
                      const isFlash = flash.includes(`cookies:${c.name}`);
                      return (
                        <tr
                          key={c.name}
                          onClick={() => setSelected(c.name)}
                          className="cursor-pointer transition-colors"
                          style={{ background: isFlash ? C.flash : isSel ? C.selRow : undefined }}
                        >
                          <td className={td} style={{ borderColor: C.line }}>
                            <button type="button" className="text-left font-semibold focus-visible:outline-2 focus-visible:outline-[#1a73e8]" onClick={() => setSelected(c.name)}>
                              {c.name}
                            </button>
                          </td>
                          <td className={`${td} max-w-[140px] truncate`} style={{ borderColor: C.line }}>
                            {c.value}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {c.domain}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {c.path}
                          </td>
                          <td className={`${td} whitespace-nowrap`} style={{ borderColor: C.line }}>
                            {c.expires}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {c.httpOnly ? <Check size={13} aria-label="Yes" /> : <span className="sr-only">No</span>}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {c.secure ? <Check size={13} aria-label="Yes" /> : <span className="sr-only">No</span>}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {c.sameSite}
                          </td>
                          <td className={td} style={{ borderColor: C.line }}>
                            {onDeleteCookie && (
                              <button
                                type="button"
                                aria-label={`Delete cookie ${c.name}`}
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  del(c.name);
                                }}
                                className="rounded p-0.5 hover:bg-[#fce8e6] hover:text-[#c5221f] focus-visible:outline-2 focus-visible:outline-[#1a73e8]"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : kv.length === 0 ? (
              <p className="p-4 text-center" style={{ color: C.sub }}>
                {area === 'local' ? 'Local storage is empty.' : 'Session storage is empty.'}
              </p>
            ) : (
              <table className="w-full table-fixed border-collapse font-mono text-[11px]">
                <thead style={{ background: C.bar, color: C.sub }}>
                  <tr>
                    <th className={`${th} w-[38%]`} style={{ borderColor: C.line }}>
                      Key
                    </th>
                    <th className={th} style={{ borderColor: C.line }}>
                      Value
                    </th>
                    <th className={`${th} w-8`} style={{ borderColor: C.line }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kv.map(([k, v]) => {
                    const isSel = selected === k;
                    const isFlash = flash.includes(`${area}:${k}`);
                    return (
                      <tr key={k} onClick={() => setSelected(k)} className="cursor-pointer transition-colors" style={{ background: isFlash ? C.flash : isSel ? C.selRow : undefined }}>
                        <td className={`${td} truncate`} style={{ borderColor: C.line }}>
                          <button type="button" className="max-w-full truncate text-left font-semibold focus-visible:outline-2 focus-visible:outline-[#1a73e8]" onClick={() => setSelected(k)}>
                            {k}
                          </button>
                        </td>
                        <td className={`${td} truncate`} style={{ borderColor: C.line }}>
                          {v}
                        </td>
                        <td className={td} style={{ borderColor: C.line }}>
                          <button
                            type="button"
                            aria-label={`Delete ${k}`}
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              del(k);
                            }}
                            className="rounded p-0.5 hover:bg-[#fce8e6] hover:text-[#c5221f] focus-visible:outline-2 focus-visible:outline-[#1a73e8]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="min-h-[64px] border-t px-2 py-1.5 font-mono text-[11px]" style={{ borderColor: C.line, background: '#fafafa' }}>
            {selCookie ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                <dt style={{ color: C.sub }}>Name</dt>
                <dd className="font-semibold break-all">{selCookie.name}</dd>
                <dt style={{ color: C.sub }}>Value</dt>
                <dd className="break-all">{selCookie.value}</dd>
                <dt style={{ color: C.sub }}>Domain / Path</dt>
                <dd className="break-all">
                  {selCookie.domain} {selCookie.path}
                </dd>
                <dt style={{ color: C.sub }}>Expires</dt>
                <dd>{selCookie.expires}</dd>
                <dt style={{ color: C.sub }}>Flags</dt>
                <dd>
                  HttpOnly: {selCookie.httpOnly ? 'yes' : 'no'} · Secure: {selCookie.secure ? 'yes' : 'no'} · SameSite: {selCookie.sameSite || '(not set)'}
                </dd>
              </dl>
            ) : selKV ? (
              <pre className="max-h-28 overflow-auto break-all whitespace-pre-wrap">{pretty(selKV[1])}</pre>
            ) : (
              <p style={{ color: C.sub }}>Select a row to see its full value.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
