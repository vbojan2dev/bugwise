import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, ChevronLeft, FileText, Image as ImageIcon, Plus, RotateCcw, Signal, Wifi, WifiOff, X } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { Scene } from './Scenes';
import type { SceneId } from './Scenes';

/*
 * A deliberately broken photo upload for a second-hand marketplace (Swapsy). Bugs (don't spoil them!):
 *  1. HEIC photos (the iPhone default) are rejected by the server (415) and the app shows a generic
 *     "Something went wrong" error. The spec says HEIC is accepted.
 *  2. The app ignores the EXIF Orientation tag: the portrait photo is shown sideways
 *     (the system photo picker shows it upright).
 *  3. No client-side size check and no limit shown: the 12.4 MB file uploads completely, then fails
 *     with "Upload failed. Please try again." The 10 MB limit is never mentioned; retrying fails again.
 *  4. No way to cancel an upload, and after 100% the bar sits full for seconds with no "Processing" state.
 *  5. Going offline during an upload silently removes the photo: no message, no retry.
 *  6. Location (GPS) metadata is not stripped: the stored file info still shows coordinates.
 *
 * Working on purpose: PNG transparency is kept, the .exe renamed to .jpg is rejected with a clear
 * message (the server checks the file content), non-image files are greyed out in Files, the
 * 5-photo limit is enforced, removing a photo works.
 */

type Net = 'wifi' | 'slow' | 'offline';
interface Pic {
  id: SceneId;
  name: string;
  mime: string;
  size: number; // MB
  dims: string;
  camera?: string;
  gps?: string;
  rotated?: boolean; // EXIF orientation 6
  heic?: boolean;
  fake?: boolean; // not really an image
}
interface Item {
  key: number;
  pic: Pic;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  until?: number;
  error?: string;
  logId?: number;
}
interface LogEntry {
  id: number;
  text: string;
  status?: number | 'fail';
  note?: string;
}

const PHOTOS: Pic[] = [
  { id: 'beach', name: 'IMG_2041.HEIC', mime: 'image/heic', size: 2.1, dims: '4032 × 3024', camera: 'iPhone 15', gps: '43.5081 N, 16.4402 E', heic: true },
  { id: 'portrait', name: 'IMG_2087.JPG', mime: 'image/jpeg', size: 3.4, dims: '4032 × 3024', camera: 'iPhone 15', gps: '45.8150 N, 15.9819 E', rotated: true },
  { id: 'mountains', name: 'DSC_0912.JPG', mime: 'image/jpeg', size: 12.4, dims: '6000 × 4000', camera: 'Nikon Z6' },
  { id: 'logo', name: 'shop-logo.png', mime: 'image/png', size: 0.4, dims: '1024 × 1024' },
  { id: 'sofa', name: 'PXL_0315.jpg', mime: 'image/jpeg', size: 2.8, dims: '4000 × 3000', camera: 'Pixel 8', gps: '45.8150 N, 15.9819 E' },
];
const INVOICE: Pic = { id: 'invoice', name: 'invoice.jpg', mime: 'image/jpeg', size: 0.9, dims: '?', fake: true };
const MAX_PHOTOS = 5;
const SPEED: Record<Net, number> = { wifi: 4, slow: 0.45, offline: 0 }; // MB per second
const TICK = 100;
const PROCESSING_MS = 2600;
const BRAND = '#0f766e';
const sub = 'rgba(60,60,67,.6)';

function Thumb({ pic }: { pic: Pic }) {
  // BUG 2: rotated (EXIF orientation 6) photos are drawn from the raw pixels.
  return (
    <div className="size-full" style={pic.rotated ? { transform: 'rotate(-90deg)' } : undefined}>
      <Scene id={pic.id} slice label={pic.name} />
    </div>
  );
}

export function BuggyUploadApp() {
  const itemsRef = useRef<Item[]>([]);
  const [items, setItemsState] = useState<Item[]>([]);
  const netRef = useRef<Net>('wifi');
  const [net, setNetState] = useState<Net>('wifi');
  const [sheet, setSheet] = useState<null | 'picker' | number>(null); // number = item key for the info sheet
  const [pickTab, setPickTab] = useState<'photos' | 'files'>('photos');
  const [selected, setSelected] = useState<SceneId[]>([]);
  const [toast, setToast] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextKey = useRef(1);
  const nextLog = useRef(1);
  const toastTimer = useRef<number | undefined>(undefined);

  const commit = (next: Item[]) => {
    itemsRef.current = next;
    setItemsState(next);
  };
  const addLog = (text: string) => {
    const id = nextLog.current++;
    setLog((l) => [{ id, text }, ...l].slice(0, 8));
    return id;
  };
  const finishLog = (id: number | undefined, status: LogEntry['status'], note: string) => {
    if (id === undefined) return;
    setLog((l) => l.map((e) => (e.id === id ? { ...e, status, note } : e)));
  };
  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  };

  useEffect(() => {
    const iv = window.setInterval(() => {
      const cur = itemsRef.current;
      if (!cur.some((i) => i.status === 'uploading' || i.status === 'processing')) return;
      const now = Date.now();
      const speed = SPEED[netRef.current];
      const next: Item[] = [];
      for (const it of cur) {
        if (it.status === 'uploading') {
          if (netRef.current === 'offline') {
            // BUG 5: the failed upload is dropped from the list without telling the user.
            finishLog(it.logId, 'fail', 'connection lost');
            continue;
          }
          const progress = Math.min(100, it.progress + ((speed * TICK) / 1000 / it.pic.size) * 100);
          if (progress >= 100) next.push({ ...it, progress: 100, status: 'processing', until: now + PROCESSING_MS });
          else next.push({ ...it, progress });
        } else if (it.status === 'processing' && it.until !== undefined && now >= it.until) {
          if (it.pic.fake) {
            finishLog(it.logId, 422, 'content is not an image (EXE header)');
            next.push({ ...it, status: 'error', error: `"${it.pic.name}" isn't a real image. Choose a JPEG, PNG, HEIC or WebP photo.` });
          } else if (it.pic.heic) {
            finishLog(it.logId, 415, 'Unsupported Media Type: image/heic');
            // BUG 1: generic message although HEIC should be supported.
            next.push({ ...it, status: 'error', error: 'Something went wrong. Please try again.' });
          } else if (it.pic.size > 10) {
            finishLog(it.logId, 413, 'Payload Too Large (max 10 MB)');
            // BUG 3: the limit is not mentioned.
            next.push({ ...it, status: 'error', error: 'Upload failed. Please try again.' });
          } else {
            finishLog(it.logId, 201, 'stored');
            next.push({ ...it, status: 'done' });
          }
        } else next.push(it);
      }
      commit(next);
    }, TICK);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNet = (n: Net) => {
    netRef.current = n;
    setNetState(n);
  };

  const startUpload = (pic: Pic, key = nextKey.current++): Item => {
    const logId = addLog(`POST /api/listings/draft/photos  ${pic.name} (${pic.size} MB)`);
    return { key, pic, status: 'uploading', progress: 0, logId };
  };

  const togglePick = (id: SceneId) => {
    setSelected((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= MAX_PHOTOS - itemsRef.current.length) {
        flash(`You can add up to ${MAX_PHOTOS} photos.`);
        return sel;
      }
      return [...sel, id];
    });
  };
  const addSelected = () => {
    const pics = selected.map((id) => (id === 'invoice' ? INVOICE : PHOTOS.find((p) => p.id === id)!)).filter(Boolean);
    commit([...itemsRef.current, ...pics.map((p) => startUpload(p))]);
    setSelected([]);
    setSheet(null);
  };
  const openPicker = () => {
    if (itemsRef.current.length >= MAX_PHOTOS) {
      flash(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setSelected([]);
    setPickTab('photos');
    setSheet('picker');
  };
  const removeItem = (key: number) => {
    commit(itemsRef.current.filter((i) => i.key !== key));
    setSheet(null);
  };
  const retry = (key: number) => {
    commit(itemsRef.current.map((i) => (i.key === key ? startUpload(i.pic, i.key) : i)));
    setSheet(null);
  };
  const restart = () => {
    commit([]);
    setSheet(null);
    setSelected([]);
    setLog([]);
    setToast('');
  };

  const errors = items.filter((i) => i.status === 'error');
  const info = typeof sheet === 'number' ? items.find((i) => i.key === sheet) : undefined;
  const uploadingCount = items.filter((i) => i.status === 'uploading' || i.status === 'processing').length;

  const screen = (
    <div className="h-full overflow-y-auto bg-[#f2f2f7] px-4 pt-1 pb-10">
      <div className="flex items-center justify-between">
        <span className="-ml-1.5 flex items-center text-[15px]" style={{ color: BRAND }}>
          <ChevronLeft size={22} /> Cancel
        </span>
        <span className="text-[15px] font-semibold">New listing</span>
        <span className="text-[15px] font-semibold" style={{ color: uploadingCount ? sub : BRAND }}>
          Next
        </span>
      </div>
      <p className="mt-4 mb-1.5 px-1 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
        Photos · {items.length}/{MAX_PHOTOS}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => {
          const clickable = it.status === 'done' || it.status === 'error';
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => clickable && setSheet(it.key)}
              aria-label={`${it.pic.name}, ${it.status === 'done' ? 'uploaded' : it.status === 'error' ? 'failed' : `uploading ${Math.round(it.progress)}%`}`}
              className="relative aspect-square overflow-hidden rounded-xl bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
            >
              <Thumb pic={it.pic} />
              {(it.status === 'uploading' || it.status === 'processing') && (
                <span className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-black/25">
                  <span className="block h-full rounded-full bg-white" style={{ width: `${it.progress}%` }} />
                </span>
              )}
              {it.status === 'error' && (
                <span className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                  <AlertCircle size={22} />
                </span>
              )}
              {it.status === 'done' && (
                <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full text-white" style={{ background: BRAND }}>
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
        {items.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={openPicker}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
            style={{ borderColor: 'rgba(15,118,110,.45)', color: BRAND }}
          >
            <Plus size={20} /> Add photos
          </button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-[12px]" style={{ color: sub }}>
        Add up to {MAX_PHOTOS} photos. The first one is the cover.
      </p>
      {errors.length > 0 && (
        <div role="alert" className="mt-2 space-y-1">
          {errors.map((e) => (
            <p key={e.key} className="flex items-start gap-1.5 rounded-lg bg-[#fdecea] px-2.5 py-1.5 text-[12px] text-[#b3261e]">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <strong className="font-semibold">{e.pic.name}:</strong> {e.error}
              </span>
            </p>
          ))}
        </div>
      )}
      <p className="mt-4 mb-1.5 px-1 text-[12px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
        Details
      </p>
      <div className="divide-y divide-black/[.06] overflow-hidden rounded-xl bg-white text-[14px]">
        <div className="flex h-11 items-center px-3">
          <span className="flex-1">Title</span>
          <span style={{ color: sub }}>Teal 3-seat sofa</span>
        </div>
        <div className="flex h-11 items-center px-3">
          <span className="flex-1">Price</span>
          <span style={{ color: sub }}>€180</span>
        </div>
      </div>
    </div>
  );

  const picker = (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/35">
      <div role="dialog" aria-modal="true" aria-label="Choose photos" className="flex max-h-[88%] flex-col rounded-t-2xl bg-white pb-6">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button type="button" onClick={() => setSheet(null)} className="text-[15px]" style={{ color: BRAND }}>
            Cancel
          </button>
          <span className="text-[15px] font-semibold">{selected.length ? `${selected.length} selected` : 'Choose photos'}</span>
          <button type="button" onClick={addSelected} disabled={!selected.length} className="text-[15px] font-semibold disabled:opacity-35" style={{ color: BRAND }}>
            Add
          </button>
        </div>
        <div className="mx-4 mb-2 flex rounded-lg bg-[#767680]/[.12] p-0.5" role="tablist" aria-label="Source">
          {(['photos', 'files'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={pickTab === t}
              onClick={() => setPickTab(t)}
              className={`flex-1 rounded-md py-1 text-[13px] font-medium capitalize ${pickTab === t ? 'bg-white shadow-sm' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="min-h-0 overflow-y-auto px-4">
          {pickTab === 'photos' ? (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {PHOTOS.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePick(p.id)}
                      aria-pressed={on}
                      aria-label={`${p.name}, ${p.size} MB`}
                      className="min-w-0 text-left focus-visible:outline-2 focus-visible:outline-[#0f766e]"
                    >
                      <span className="relative block aspect-square overflow-hidden rounded-md bg-[#e5e5ea]">
                        {/* The system picker respects EXIF orientation, so everything is upright here. */}
                        <Scene id={p.id} slice />
                        <span
                          className={`absolute right-1 bottom-1 grid size-5 place-items-center rounded-full border-2 border-white ${on ? '' : 'bg-black/20'}`}
                          style={on ? { background: '#007aff' } : undefined}
                        >
                          {on && <Check size={11} strokeWidth={3} className="text-white" />}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[9.5px] leading-tight text-black">{p.name}</span>
                      <span className="block text-[9.5px] leading-tight" style={{ color: sub }}>
                        {p.size} MB
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => flash('The camera is not available in this demo.')}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#f2f2f7] text-[14px] font-medium"
                style={{ color: BRAND }}
              >
                <Camera size={16} /> Take photo
              </button>
            </>
          ) : (
            <div className="divide-y divide-black/[.06] text-[13px]">
              <button type="button" onClick={() => togglePick('invoice')} aria-pressed={selected.includes('invoice')} className="flex w-full items-center gap-3 py-2.5 text-left">
                <ImageIcon size={20} style={{ color: BRAND }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">invoice.jpg</span>
                  <span className="block text-[11px]" style={{ color: sub }}>
                    0.9 MB · Downloads
                  </span>
                </span>
                {selected.includes('invoice') && <Check size={16} style={{ color: '#007aff' }} />}
              </button>
              <div className="flex items-center gap-3 py-2.5 opacity-40" aria-disabled="true">
                <FileText size={20} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">sofa-receipt.pdf</span>
                  <span className="block text-[11px]">0.2 MB · Not an image</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const infoSheet = info && (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/35">
      <div role="dialog" aria-modal="true" aria-label="Photo details" className="rounded-t-2xl bg-white px-4 pt-3 pb-7">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">{info.status === 'error' ? 'Upload failed' : 'Photo details'}</span>
          <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="grid size-7 place-items-center rounded-full bg-[#767680]/[.12]">
            <X size={14} />
          </button>
        </div>
        <div className="mt-3 flex gap-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/10">
            <Thumb pic={info.pic} />
          </div>
          <div className="min-w-0 flex-1 text-[12px]">
            {info.status === 'done' ? (
              <>
                <p className="mb-1 text-[11px] font-semibold tracking-wide uppercase" style={{ color: sub }}>
                  Stored on server
                </p>
                {[
                  ['File', info.pic.name],
                  ['Type', info.pic.mime],
                  ['Size', `${info.pic.size} MB`],
                  ['Pixels', info.pic.dims],
                  ...(info.pic.camera ? [['Camera', info.pic.camera]] : []),
                  // BUG 6: GPS metadata is kept.
                  ...(info.pic.gps ? [['Location', info.pic.gps]] : []),
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between gap-2 py-0.5">
                    <span style={{ color: sub }}>{k}</span>
                    <span className="min-w-0 text-right font-medium break-words">{v}</span>
                  </p>
                ))}
              </>
            ) : (
              <p className="text-[#b3261e]">{info.error}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {info.status === 'error' && (
            <button type="button" onClick={() => retry(info.key)} className="h-10 flex-1 rounded-xl text-[14px] font-semibold text-white" style={{ background: BRAND }}>
              Try again
            </button>
          )}
          <button type="button" onClick={() => removeItem(info.key)} className="h-10 flex-1 rounded-xl bg-[#f2f2f7] text-[14px] font-semibold text-[#d70015]">
            Remove photo
          </button>
        </div>
      </div>
    </div>
  );

  const statusColor = (s?: LogEntry['status']) => (s === undefined ? '#fbbf24' : s === 'fail' ? '#f87171' : s < 300 ? '#34d399' : '#f87171');
  const netOptions: { v: Net; label: string; icon: typeof Wifi }[] = [
    { v: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { v: 'slow', label: 'Slow 3G', icon: Signal },
    { v: 'offline', label: 'Offline', icon: WifiOff },
  ];

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <PhoneFrame width={290}>
        <div className="relative h-full text-black" style={{ colorScheme: 'light' }}>
          {screen}
          {sheet === 'picker' && picker}
          {infoSheet}
          {toast && (
            <div role="status" className="absolute inset-x-4 bottom-6 z-30 rounded-xl bg-black/85 px-3 py-2 text-center text-[12px] text-white">
              {toast}
            </div>
          )}
          {net === 'offline' && (
            <div className="absolute inset-x-0 top-0 z-10 bg-[#3a3a3c] py-0.5 text-center text-[10px] font-medium text-white" aria-hidden="true">
              No internet connection
            </div>
          )}
        </div>
      </PhoneFrame>

      <div className="w-full rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Network</p>
          <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
        <div role="radiogroup" aria-label="Network" className="mt-2 flex rounded-lg bg-subtle p-0.5">
          {netOptions.map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={net === o.v}
              onClick={() => setNet(o.v)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand ${net === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              <o.icon size={13} /> {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full rounded-2xl border border-line bg-brand-soft p-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold tracking-wide text-brand uppercase">From the spec</p>
        <p className="mt-1">
          Accepted: <strong className="text-fg">JPEG, PNG, HEIC, WebP</strong> · max <strong className="text-fg">10 MB</strong> per photo · up to 5 photos. Uploads can be canceled. Location data must be removed before photos are stored.
        </p>
        <p className="mt-1.5">Tap an uploaded photo to see what the server stored. Use <strong className="text-fg">Slow 3G</strong> to watch uploads closely.</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <ul className="min-h-[5.5rem] space-y-1.5 px-3 py-2">
          {log.length === 0 && <li className="text-white/35">Add photos to see requests…</li>}
          {log.map((e) => (
            <li key={e.id} className="leading-snug">
              <span className="break-all">{e.text}</span>
              <span className="block" style={{ color: statusColor(e.status) }}>
                {e.status === undefined ? '  sending…' : e.status === 'fail' ? `  failed · ${e.note}` : `  ${e.status} · ${e.note}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
