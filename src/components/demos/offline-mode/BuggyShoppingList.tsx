import { useReducer, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Clock3, CloudOff, Plane, Plus, RefreshCw, RotateCcw, Trash, Wifi, X } from 'lucide-react';

/*
 * A deliberately broken shared shopping list, open on two phones (Mia and Leo).
 * Bugs (don't spoil them for learners!):
 *  1. The offline queue lives only in memory: restarting the app offline loses everything done offline.
 *  2. On reconnect the queue is flushed twice (two listeners, no idempotency key): offline adds become duplicates.
 *  3. Edits (rename, tick off) are sent with no version check and are not pushed to the other phone:
 *     the last write silently overwrites, and the other phone keeps showing stale data until it refreshes.
 *  4. The offline banner is shown when the connection drops but never hidden when it returns (only a restart clears it).
 *  5. Deleting a synced item offline is not queued: after reconnecting the item comes back.
 *  6. Items are ordered by the phone's own clock. Leo's phone is an hour behind, so his new items jump to the top.
 *
 * Working on purpose: cached list when restarting offline, "waiting to sync" badges and counter,
 * adds/deletes made online appear on the other phone, manual refresh, editing a not-yet-synced item.
 */

type Who = 'Mia' | 'Leo';
interface Item {
  id: string;
  seq: number;
  text: string;
  done: boolean;
  addedAt: number; // minutes since midnight, from the device clock
  by: Who;
  pending?: boolean;
}
type Op = { type: 'add'; tempId: string; text: string; done: boolean; addedAt: number; by: Who } | { type: 'patch'; id: string; text?: string; done?: boolean };
interface Device {
  name: Who;
  online: boolean;
  banner: boolean;
  items: Item[];
  queue: Op[];
  cache: Item[];
  clockOffset: number;
}
type Tone = 'info' | 'ok' | 'warn' | 'err';
interface World {
  server: Item[];
  nextId: number;
  nextTemp: number;
  tick: number;
  devices: Device[];
  log: { id: number; text: string; tone: Tone }[];
  logId: number;
}
type Action =
  | { type: 'add'; d: number; text: string }
  | { type: 'toggle'; d: number; id: string }
  | { type: 'rename'; d: number; id: string; text: string }
  | { type: 'delete'; d: number; id: string }
  | { type: 'network'; d: number; online: boolean }
  | { type: 'restart'; d: number }
  | { type: 'refresh'; d: number }
  | { type: 'reset' };

const START = 18 * 60 + 40;
const BLUE = '#007aff';

const sortItems = (items: Item[]) => [...items].sort((a, b) => a.addedAt - b.addedAt || a.seq - b.seq);
const clone = (items: Item[]) => items.map((i) => ({ ...i }));
const fmt = (m: number) => {
  const mm = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

function initialWorld(): World {
  const server: Item[] = [
    { id: '1', seq: 1, text: 'Bread', done: false, addedAt: 18 * 60 + 2, by: 'Mia' },
    { id: '2', seq: 2, text: 'Eggs', done: false, addedAt: 18 * 60 + 5, by: 'Mia' },
    { id: '3', seq: 3, text: 'Bananas', done: false, addedAt: 18 * 60 + 12, by: 'Mia' },
    { id: '4', seq: 4, text: 'Coffee beans', done: false, addedAt: 18 * 60 + 20, by: 'Mia' },
  ];
  const dev = (name: Who, clockOffset: number): Device => ({ name, online: true, banner: false, items: clone(server), queue: [], cache: clone(server), clockOffset });
  return { server, nextId: 5, nextTemp: 1, tick: 0, devices: [dev('Mia', 0), dev('Leo', -60)], log: [], logId: 1 };
}

function reduce(prev: World, a: Action): World {
  if (a.type === 'reset') return initialWorld();
  const w: World = structuredClone(prev);
  w.tick += 1;
  const dev = w.devices[a.d];
  const other = w.devices[1 - a.d];
  const who = dev.name;
  const log = (text: string, tone: Tone = 'info') => {
    w.log = [{ id: w.logId++, text, tone }, ...w.log].slice(0, 14);
  };
  const snapshot = () => sortItems(clone(w.server));
  const now = () => START + w.tick + dev.clockOffset;

  /** Applies a change to the server. BUG 3: no version check, the last write simply wins. */
  const serverPatch = (id: string, changes: { text?: string; done?: boolean }) => {
    const it = w.server.find((i) => i.id === id);
    const body = JSON.stringify(changes);
    if (!it) {
      log(`${who}: PATCH /items/${id} ${body} → 404`, 'err');
      return;
    }
    Object.assign(it, changes);
    log(`${who}: PATCH /items/${id} ${body} → 200`, 'ok');
    // BUG 3: no "item changed" message is sent to the other phone.
  };
  const serverAdd = (text: string, done: boolean, addedAt: number) => {
    const item: Item = { id: String(w.nextId), seq: w.nextId, text, done, addedAt, by: who };
    w.nextId += 1;
    w.server.push(item);
    log(`${who}: POST /items "${text}" addedAt ${fmt(addedAt)} → 201 (id ${item.id})`, 'ok');
    return item;
  };
  const broadcastAdd = (items: Item[]) => {
    if (!other.online || items.length === 0) return;
    other.items = sortItems([...other.items, ...clone(items)]);
    other.cache = clone(other.items);
    log(`→ ${other.name}'s phone: ${items.length} new item${items.length > 1 ? 's' : ''}`);
  };

  switch (a.type) {
    case 'add': {
      const text = a.text.trim();
      if (!text) return prev;
      const addedAt = now();
      if (dev.online) {
        const item = serverAdd(text, false, addedAt);
        dev.items = sortItems([...dev.items, { ...item }]);
        dev.cache = clone(dev.items);
        broadcastAdd([item]);
      } else {
        const tempId = `t${w.nextTemp++}`;
        dev.items = sortItems([...dev.items, { id: tempId, seq: 1000 + w.nextTemp, text, done: false, addedAt, by: who, pending: true }]);
        dev.queue.push({ type: 'add', tempId, text, done: false, addedAt, by: who });
        log(`${who} (offline): add "${text}" queued`);
      }
      return w;
    }
    case 'toggle':
    case 'rename': {
      const it = dev.items.find((i) => i.id === a.id);
      if (!it) return prev;
      const changes = a.type === 'toggle' ? { done: !it.done } : { text: a.text.trim() };
      if (a.type === 'rename' && (!changes.text || changes.text === it.text)) return prev;
      Object.assign(it, changes);
      if (dev.online) {
        serverPatch(a.id, changes);
        dev.cache = clone(dev.items);
      } else {
        it.pending = true;
        const addOp = dev.queue.find((o) => o.type === 'add' && o.tempId === a.id);
        if (addOp && addOp.type === 'add') Object.assign(addOp, changes);
        else dev.queue.push({ type: 'patch', id: a.id, ...changes });
        log(`${who} (offline): change to "${it.text}" queued`);
      }
      return w;
    }
    case 'delete': {
      const it = dev.items.find((i) => i.id === a.id);
      if (!it) return prev;
      dev.items = dev.items.filter((i) => i.id !== a.id);
      if (dev.online) {
        const existed = w.server.some((i) => i.id === a.id);
        w.server = w.server.filter((i) => i.id !== a.id);
        log(`${who}: DELETE /items/${a.id} → ${existed ? 204 : 404}`, existed ? 'ok' : 'err');
        dev.cache = clone(dev.items);
        if (other.online && other.items.some((i) => i.id === a.id)) {
          other.items = other.items.filter((i) => i.id !== a.id);
          other.cache = clone(other.items);
          log(`→ ${other.name}'s phone: "${it.text}" removed`);
        }
      } else if (a.id.startsWith('t')) {
        dev.queue = dev.queue.filter((o) => !(o.type === 'add' && o.tempId === a.id));
        log(`${who} (offline): "${it.text}" removed before it was synced`);
      } else {
        // BUG 5: the delete is applied locally but never added to the queue.
        log(`${who} (offline): "${it.text}" deleted`);
      }
      return w;
    }
    case 'network': {
      if (dev.online === a.online) return prev;
      dev.online = a.online;
      if (!a.online) {
        dev.banner = true;
        log(`${who}'s phone is offline`, 'warn');
        return w;
      }
      // BUG 4: nothing hides the banner when the connection returns.
      log(`${who}'s phone is back online`, 'info');
      const queue = dev.queue;
      const added: Item[] = [];
      if (queue.length > 0) {
        log(`${who}: syncing ${queue.length} queued change${queue.length > 1 ? 's' : ''}`);
        // BUG 2: both the "online" listener and the retry timer flush the same queue.
        for (let pass = 0; pass < 2; pass++) {
          for (const op of queue) {
            if (op.type === 'add') added.push(serverAdd(op.text, op.done, op.addedAt));
            else serverPatch(op.id, { ...(op.text !== undefined ? { text: op.text } : {}), ...(op.done !== undefined ? { done: op.done } : {}) });
          }
        }
      }
      dev.queue = [];
      dev.items = snapshot();
      dev.cache = snapshot();
      log(`${who}: GET /items → 200 (${w.server.length} items)`, 'ok');
      broadcastAdd(added);
      return w;
    }
    case 'restart': {
      // BUG 1: the queue was only in memory, so it is gone after a restart.
      dev.queue = [];
      dev.banner = !dev.online;
      if (dev.online) {
        dev.items = snapshot();
        dev.cache = snapshot();
        log(`${who}: app restarted · GET /items → 200`, 'ok');
      } else {
        dev.items = clone(dev.cache);
        log(`${who}: app restarted offline · showing saved list`);
      }
      return w;
    }
    case 'refresh': {
      if (!dev.online) {
        log(`${who}: refresh failed (no connection)`, 'warn');
        return w;
      }
      dev.items = snapshot();
      dev.cache = snapshot();
      log(`${who}: GET /items → 200 (${w.server.length} items)`, 'ok');
      return w;
    }
  }
  return prev;
}

function Row({ item, onToggle, onRename, onDelete }: { item: Item; onToggle: () => void; onRename: (t: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const save = (e?: FormEvent) => {
    e?.preventDefault();
    onRename(draft);
    setEditing(false);
  };
  return (
    <li className="flex min-w-0 items-center gap-1.5 py-1.5 pr-1 pl-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.text}
        onClick={onToggle}
        className="grid size-[19px] shrink-0 place-items-center rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff]"
        style={{ borderColor: item.done ? BLUE : 'rgba(60,60,67,.3)', background: item.done ? BLUE : 'transparent' }}
      >
        {item.done && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>
      {editing ? (
        <form onSubmit={save} className="flex min-w-0 flex-1 items-center gap-0.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false);
            }}
            aria-label="Item name"
            className="h-6 w-0 min-w-0 flex-1 rounded-md border border-[#007aff] bg-white px-1 text-[12px] text-black outline-none"
          />
          <button type="submit" aria-label="Save" className="grid size-6 shrink-0 place-items-center rounded-md text-[#007aff]">
            <Check size={14} />
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setDraft(item.text);
              setEditing(true);
            }}
            aria-label={`${item.text}, added by ${item.by} at ${fmt(item.addedAt)}${item.pending ? ', waiting to sync' : ''}. Tap to rename`}
            className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-[#007aff]"
          >
            <span className={`block truncate text-[13px] leading-tight ${item.done ? 'text-black/40 line-through' : 'text-black'}`}>{item.text}</span>
            <span className="flex items-center gap-1 text-[9.5px] text-black/45">
              {item.by} · {fmt(item.addedAt)}
              {item.pending && <Clock3 size={9} className="text-[#b25000]" aria-hidden="true" />}
            </span>
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${item.text}`} className="grid size-6 shrink-0 place-items-center rounded-md text-[#ff3b30] focus-visible:outline-2 focus-visible:outline-[#007aff]">
            <Trash size={13} />
          </button>
        </>
      )}
    </li>
  );
}

function Phone({ dev, time, dispatch, d }: { dev: Device; time: string; dispatch: (a: Action) => void; d: number }) {
  const [text, setText] = useState('');
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: 'add', d, text });
    setText('');
  };
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <p className="text-sm font-semibold text-fg">{dev.name}&rsquo;s phone</p>
      <div className="w-full max-w-[220px] rounded-[30px] bg-[#0c0d12] p-[6px] shadow-[0_18px_36px_-14px_rgba(16,18,35,.35)]" style={{ colorScheme: 'light' }}>
        <div className="relative flex h-[360px] flex-col overflow-hidden rounded-[25px] bg-[#f2f2f7] text-black">
          <div className="flex shrink-0 items-center justify-between px-5 pt-2 pb-0.5 text-[11px] font-semibold">
            <span>{time}</span>
            {dev.online ? <Wifi size={12} aria-label="Wi-Fi" /> : <Plane size={12} aria-label="Airplane mode" />}
          </div>
          <div className="flex shrink-0 items-start justify-between pt-1 pr-1.5 pl-3">
            <div className="min-w-0">
              <p className="text-[18px] leading-tight font-bold tracking-tight">Family list</p>
              <p className="text-[10px] text-black/50">{dev.queue.length > 0 ? `${dev.queue.length} change${dev.queue.length > 1 ? 's' : ''} waiting to sync` : 'Shared with 2 people'}</p>
            </div>
            <button type="button" onClick={() => dispatch({ type: 'refresh', d })} aria-label="Refresh" className="grid size-8 shrink-0 place-items-center rounded-full text-[#007aff] focus-visible:outline-2 focus-visible:outline-[#007aff]">
              <RefreshCw size={15} />
            </button>
          </div>
          {dev.banner && (
            <div role="status" className="mx-2 mt-1.5 flex shrink-0 items-start gap-1.5 rounded-lg bg-[#fff4e5] px-2 py-1.5 text-[10px] leading-snug text-[#7a3d00]">
              <CloudOff size={12} className="mt-px shrink-0" aria-hidden="true" />
              You&rsquo;re offline. Changes will sync when you&rsquo;re back online.
            </div>
          )}
          <ul className="relative mx-2 mt-1.5 min-h-0 flex-1 divide-y divide-black/[.06] overflow-y-auto rounded-xl bg-white">
            {dev.items.length === 0 && <li className="px-3 py-3 text-[12px] text-black/45">The list is empty.</li>}
            {dev.items.map((it) => (
              <Row
                key={it.id}
                item={it}
                onToggle={() => dispatch({ type: 'toggle', d, id: it.id })}
                onRename={(t) => dispatch({ type: 'rename', d, id: it.id, text: t })}
                onDelete={() => dispatch({ type: 'delete', d, id: it.id })}
              />
            ))}
          </ul>
          <form onSubmit={add} className="mx-2 mt-1.5 mb-4 flex shrink-0 items-center gap-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={`Add an item on ${dev.name}'s phone`}
              placeholder="Add an item"
              className="h-8 w-0 min-w-0 flex-1 rounded-lg border border-transparent bg-white px-2 text-[12px] text-black outline-none placeholder:text-black/35 focus:border-[#007aff]"
            />
            <button type="submit" aria-label="Add" className="grid size-8 shrink-0 place-items-center rounded-lg text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007aff]" style={{ background: BLUE }}>
              <Plus size={16} />
            </button>
          </form>
          <div className="absolute bottom-1.5 left-1/2 h-[4px] w-[80px] -translate-x-1/2 rounded-full bg-black/70" />
        </div>
      </div>
      <div className="flex w-full max-w-[220px] items-center justify-center gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={dev.online}
          aria-label={`${dev.name}'s phone online`}
          onClick={() => dispatch({ type: 'network', d, online: !dev.online })}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${dev.online ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}
        >
          {dev.online ? <Wifi size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
          {dev.online ? 'Online' : 'Offline'}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'restart', d })}
          className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"
        >
          <RotateCcw size={12} aria-hidden="true" /> Restart app
        </button>
      </div>
    </div>
  );
}

export function BuggyShoppingList() {
  const [world, dispatch] = useReducer(reduce, undefined, initialWorld);
  const toneCls: Record<Tone, string> = { info: 'text-muted', ok: 'text-ok', warn: 'text-warn', err: 'text-danger' };
  return (
    <div className="not-prose @container w-full space-y-4">
      <div className="grid grid-cols-1 gap-x-3 gap-y-5 @sm:grid-cols-2">
        {world.devices.map((dev, d) => (
          <Phone key={dev.name} dev={dev} d={d} dispatch={dispatch} time={fmt(START + world.tick + dev.clockOffset)} />
        ))}
      </div>
      <section className="rounded-xl border border-line bg-subtle p-3" aria-label="Sync log">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Sync log (server)</p>
          <button type="button" onClick={() => dispatch({ type: 'reset' })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand">
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
        <ol className="mt-1.5 space-y-0.5 font-mono text-[11px]" aria-live="polite">
          {world.log.length === 0 && <li className="text-faint">Nothing synced yet. Add, tick off, rename or delete items, and switch phones offline.</li>}
          {world.log.map((e) => (
            <li key={e.id} className={`break-all ${toneCls[e.tone]}`}>
              {e.text}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
