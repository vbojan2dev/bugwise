import { useState } from 'react';
import { Camera, MapPin, RotateCw, ShieldCheck } from 'lucide-react';
import { Rotated, Scene } from './Scenes';
import type { SceneId } from './Scenes';

/*
 * EXIF inspector: shows that a phone photo stores its pixels as the sensor saw them plus an
 * Orientation tag, and that the file carries GPS coordinates. The learner toggles whether the
 * viewer applies the tag and whether metadata is stripped before upload.
 */

interface Sample {
  id: string;
  label: string;
  scene: SceneId;
  w: number; // upright display size in the demo (px)
  h: number;
  orientation: 1 | 3 | 6;
  stored: string; // pixel size as stored
  shown: string; // pixel size when displayed upright
}

const SAMPLES: Sample[] = [
  { id: 'land', label: 'Landscape', scene: 'beach', w: 128, h: 96, orientation: 1, stored: '4032 × 3024', shown: '4032 × 3024' },
  { id: 'port', label: 'Portrait', scene: 'portrait', w: 84, h: 112, orientation: 6, stored: '4032 × 3024', shown: '3024 × 4032' },
  { id: 'flip', label: 'Upside down', scene: 'sofa', w: 128, h: 96, orientation: 3, stored: '4032 × 3024', shown: '4032 × 3024' },
];

const ORIENT_TEXT: Record<1 | 3 | 6, string> = {
  1: '1 (normal)',
  3: '3 (rotate 180°)',
  6: '6 (rotate 90° clockwise)',
};
// Stored pixels relative to the upright scene.
const RAW_DEG: Record<1 | 3 | 6, number> = { 1: 0, 3: 180, 6: -90 };

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-left text-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span className="min-w-0">{label}</span>
      <span className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${on ? 'bg-ok' : 'bg-line-strong'}`}>
        <span className="absolute top-[2px] left-[2px] size-[14px] rounded-full bg-white shadow transition-transform" style={{ transform: on ? 'translateX(12px)' : 'none' }} />
      </span>
    </button>
  );
}

function Tag({ k, v, warn, gone }: { k: string; v: string; warn?: boolean; gone?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-xs">
      <span className="text-muted">{k}</span>
      <span className={`min-w-0 text-right font-mono ${gone ? 'text-faint line-through' : warn ? 'font-semibold text-danger' : 'text-fg'}`}>{v}</span>
    </div>
  );
}

export default function ExifInspector() {
  const [sid, setSid] = useState('port');
  const [respect, setRespect] = useState(false);
  const [strip, setStrip] = useState(false);
  const s = SAMPLES.find((x) => x.id === sid) ?? SAMPLES[1];
  const raw = RAW_DEG[s.orientation];

  const frame = (deg: number) => (
    <div className="grid h-[136px] place-items-center rounded-xl bg-[#e5e7eb] p-2" style={{ colorScheme: 'light' }}>
      <Rotated deg={deg} w={s.w} h={s.h}>
        <div className="size-full overflow-hidden rounded-md shadow-sm">
          <Scene id={s.scene} slice />
        </div>
      </Rotated>
    </div>
  );

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <span className="text-xs font-semibold tracking-wide text-faint uppercase">Photo taken</span>
        <div role="radiogroup" aria-label="Sample photo" className="flex flex-wrap gap-1.5">
          {SAMPLES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={sid === x.id}
              onClick={() => setSid(x.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-brand ${sid === x.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-fg'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg">
            <Camera size={13} /> 1. Pixels stored in the file
          </p>
          {frame(raw)}
          <div className="mt-2 divide-y divide-line">
            <Tag k="Pixel size" v={s.stored} />
            <Tag k="Orientation" v={ORIENT_TEXT[s.orientation]} />
            <Tag k="Camera" v="iPhone 15" />
            <Tag k="GPS" v="45.8150 N, 15.9819 E" warn />
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg">
            <RotateCw size={13} /> 2. What the app shows
          </p>
          {frame(respect ? 0 : raw)}
          <div className="mt-2">
            <Switch on={respect} onToggle={() => setRespect((v) => !v)} label="App applies the Orientation tag" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted" aria-live="polite">
            {s.orientation === 1
              ? 'Orientation 1 means "already upright", so this photo looks right either way. That is why testers who only use landscape photos miss the bug.'
              : respect
                ? `Upright: the app rotated the pixels as the tag says. Displayed size: ${s.shown}.`
                : 'The app ignored the tag and drew the raw pixels. This is the classic "my photo uploaded sideways" bug.'}
          </p>
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg">
            <ShieldCheck size={13} /> 3. What the server keeps
          </p>
          <Switch on={strip} onToggle={() => setStrip((v) => !v)} label="Rotate pixels, then strip metadata" />
          <div className="mt-2 divide-y divide-line rounded-xl border border-line px-3 py-1">
            <Tag k="Pixel size" v={strip ? s.shown : s.stored} />
            <Tag k="Orientation" v={strip ? 'removed (pixels upright)' : ORIENT_TEXT[s.orientation]} gone={false} />
            <Tag k="Camera" v={strip ? 'removed' : 'iPhone 15'} gone={strip} />
            <Tag k="GPS" v={strip ? 'removed' : '45.8150 N, 15.9819 E'} warn={!strip} gone={strip} />
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            {strip ? 'Anyone who downloads the photo learns nothing about where it was taken.' : 'Anyone who downloads this photo can see where it was taken, often the seller\'s home.'}
          </p>
        </div>
      </div>
    </div>
  );
}
