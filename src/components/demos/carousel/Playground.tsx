import { useCallback, useEffect, useState } from 'react';
import { ImageOff, Volume2 } from 'lucide-react';
import { Carousel } from './Carousel';
import { PROMOS, SlideArt } from './SlideArt';

/*
 * Carousel lab: a correct carousel with switches for autoplay, looping, reduced motion,
 * lazy loading, responsive image sizes and a touch-target overlay. Shows a network log and
 * what a screen reader would say.
 */

const N = PROMOS.length;

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 text-sm">
      <span className="truncate">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--brand)]" />
    </label>
  );
}

export default function Playground() {
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [lazy, setLazy] = useState(true);
  const [srcset, setSrcset] = useState(true);
  const [targets, setTargets] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [loaded, setLoaded] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const sizeKb = useCallback((i: number) => (srcset ? 120 + i * 14 : 2300 + i * 80), [srcset]);

  // "Page load": changing the setup reloads the page (clears the log).
  const reload = (set: (v: boolean) => void) => (v: boolean) => {
    set(v);
    setIndex(0);
    setLoaded([]);
    setLog([]);
  };

  useEffect(() => {
    const need = lazy ? [index, loop ? (index + 1) % N : index + 1, loop ? (index - 1 + N) % N : index - 1].filter((i) => i >= 0 && i < N) : Array.from({ length: N }, (_, i) => i);
    const add = need.filter((i) => !loaded.includes(i));
    if (add.length === 0) return;
    setLoaded((prev) => [...prev, ...add.filter((i) => !prev.includes(i))]);
    setLog((l) => [...l, ...add.map((i) => `GET hero-${i + 1}.jpg${srcset ? '?w=800' : ' (2400 px)'} · ${sizeKb(i) >= 1000 ? `${(sizeKb(i) / 1000).toFixed(1)} MB` : `${sizeKb(i)} KB`}`)]);
  }, [index, lazy, loop, srcset, sizeKb, loaded]);

  const totalKb = loaded.reduce((s, i) => s + sizeKb(i), 0);
  const onStatus = useCallback((s: string) => setStatus(s), []);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-2 border-b border-line p-4 sm:grid-cols-3">
        <Toggle label="Autoplay" checked={autoplay} onChange={reload(setAutoplay)} />
        <Toggle label="Loop" checked={loop} onChange={reload(setLoop)} />
        <Toggle label="Reduced motion" checked={reduce} onChange={setReduce} />
        <Toggle label="Lazy-load images" checked={lazy} onChange={reload(setLazy)} />
        <Toggle label="Sized images (srcset)" checked={srcset} onChange={reload(setSrcset)} />
        <Toggle label="Show touch targets" checked={targets} onChange={setTargets} />
      </div>

      <div className="bg-[#e9ebf2] px-3 py-6 sm:px-6" style={{ colorScheme: 'light' }}>
        <div className="mx-auto max-w-[420px] rounded-2xl bg-white p-3 text-[#0e1120] shadow-sm">
          <Carousel
            key={`${loop}-${autoplay}-${lazy}-${srcset}`}
            label="Featured offers"
            count={N}
            loop={loop}
            autoplay={autoplay}
            interval={4000}
            reducedMotion={reduce}
            showTargets={targets}
            slideName={(i) => PROMOS[i].title}
            onIndexChange={setIndex}
            onStatus={onStatus}
            renderSlide={(i) =>
              loaded.includes(i) ? (
                <SlideArt promo={PROMOS[i]} id={`lab-${i}`} />
              ) : (
                <div className="grid h-full place-items-center bg-[#e5e7eb] text-black/40">
                  <ImageOff size={28} />
                </div>
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-line p-4 md:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <div className="rounded-xl bg-subtle p-3">
            <p className="text-xs font-semibold text-faint">Autoplay</p>
            <p className="mt-1 text-sm text-fg">{status}</p>
          </div>
          <div className="rounded-xl bg-subtle p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-faint">
              <Volume2 size={14} /> Screen reader on the slide
            </p>
            <p className="mt-1 text-sm text-fg">
              “{PROMOS[index].title}, slide, {index + 1} of {N}”
            </p>
            <p className="mt-1 text-xs text-muted">While autoplay runs, slide changes are not announced (aria-live off). Paused, they are.</p>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="flex justify-between gap-2 border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">
            <span>Network · images</span>
            <span className="normal-case">
              {loaded.length} req · {totalKb >= 1000 ? `${(totalKb / 1000).toFixed(1)} MB` : `${totalKb} KB`}
            </span>
          </p>
          <ul className="max-h-[9rem] min-h-[5rem] space-y-1 overflow-y-auto px-3 py-2">
            {log.map((e, i) => (
              <li key={i} className="truncate">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
