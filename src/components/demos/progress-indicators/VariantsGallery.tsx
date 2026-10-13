import { useEffect, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { ProgressKeyframes, IosSpinner, IosBar, M3Linear, M3Circular, WebSpinner } from './Indicators';
import { href } from '@/lib/url';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: ReactNode; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-36 place-items-center px-5 py-7" style={{ background: bg, colorScheme: 'light' }}>
        <div className="w-full max-w-[17rem] text-black">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

export default function VariantsGallery() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setT((x) => (x + 1) % 80), 100);
    return () => clearInterval(id);
  }, [playing]);

  // 0..1 over 6.5 s, then hold full for 1.5 s
  const v = Math.min(1, t / 65);
  const pct = Math.round(v * 100);
  const photos = Math.round(v * 8);

  return (
    <div className="not-prose my-8">
      <ProgressKeyframes />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted">The determinate indicators replay a fake 6-second upload. Pause it to compare them at the same value.</p>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Activity indicator" platform="iOS" note={<><code>UIActivityIndicatorView</code> or SwiftUI <code>ProgressView()</code>. Indeterminate only. Medium and large sizes; it hides itself when stopped by default.</>}>
          <div className="flex items-center justify-center gap-8">
            <IosSpinner size={20} />
            <IosSpinner size={36} />
            <span className="flex flex-col items-center gap-2 text-[13px] text-[#3c3c4399]">
              <IosSpinner size={20} />
              Loading
            </span>
          </div>
        </Demo>
        <Demo title="Progress view" platform="iOS" note={<><code>UIProgressView</code> or SwiftUI <code>ProgressView(value:)</code>. A thin determinate bar, often under a label like a file name.</>}>
          <div className="rounded-xl bg-white p-3">
            <div className="flex items-baseline justify-between gap-2 text-[14px]">
              <span className="min-w-0 truncate">Holiday-video.mov</span>
              <span className="shrink-0 text-[12px] text-[#3c3c4399]">{pct}%</span>
            </div>
            <div className="mt-2">
              <IosBar value={v} />
            </div>
          </div>
        </Demo>
        <Demo title="Linear progress indicator" platform="Android · Material 3" bg="#fef7ff" note={<>Determinate (top) shows the gap and the stop dot; indeterminate (bottom) loops. Compose <code>LinearProgressIndicator</code>.</>}>
          <div className="space-y-5 text-[#1d1b20]">
            <div>
              <p className="mb-2 text-[13px]">
                Uploading {photos} of 8 photos
              </p>
              <M3Linear value={v} />
            </div>
            <div>
              <p className="mb-2 text-[13px]">Syncing contacts…</p>
              <M3Linear />
            </div>
          </div>
        </Demo>
        <Demo title="Circular progress indicator" platform="Android · Material 3" bg="#fef7ff" note={<>Determinate ring (left) and indeterminate (right). Good for small spaces: a card, a button, a download icon.</>}>
          <div className="flex items-center justify-center gap-10 text-[#1d1b20]">
            <span className="relative grid place-items-center">
              <M3Circular value={v} size={52} />
              <span className="absolute text-[11px] font-medium">{pct}%</span>
            </span>
            <M3Circular size={52} />
          </div>
        </Demo>
        <Demo title="Native <progress>" platform="Web" bg="#ffffff" note={<>The browser draws it, so it looks different in Chrome, Safari and Firefox. Without a <code>value</code> it is indeterminate. It already has the progressbar role.</>}>
          <div className="space-y-4 text-[13px] text-[#0e1120]" style={{ accentColor: '#2563eb' }}>
            <label className="block">
              <span className="mb-1 block">Uploading invoice.pdf</span>
              <progress value={pct} max={100} className="w-full">
                {pct}%
              </progress>
            </label>
            <label className="block">
              <span className="mb-1 block">Checking address…</span>
              <progress className="w-full" />
            </label>
          </div>
        </Demo>
        <Demo title='Custom role="progressbar"' platform="Web" bg="#ffffff" note={<>A styled <code>div</code> needs <code>role</code>, <code>aria-valuenow/min/max</code>, a label and ideally <code>aria-valuetext</code> (“5 of 8 photos”).</>}>
          <div className="text-[13px] text-[#0e1120]">
            <p id="pi-g-label" className="mb-1.5 flex justify-between gap-2">
              <span>Importing photos</span>
              <span className="text-[#5a5f70]">{photos} of 8</span>
            </p>
            <div
              role="progressbar"
              aria-labelledby="pi-g-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${photos} of 8 photos`}
              className="h-2.5 overflow-hidden rounded-full bg-[#dbe1ee]"
            >
              <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${pct}%`, transition: 'width 150ms linear' }} />
            </div>
          </div>
        </Demo>
        <Demo title="Inside a button" platform="All" bg="#ffffff" note={<>A small spinner replaces the label while an action runs. Its rules (block repeat taps, always end) are on the <a className="text-brand underline" href={href('/components/button')}>Button</a> page.</>}>
          <div className="flex justify-center">
            <span className="flex h-11 w-44 items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-[15px] font-semibold text-white">
              <WebSpinner size={18} color="#ffffff" /> Paying…
            </span>
          </div>
        </Demo>
        <Demo title="Skeleton instead of a spinner" platform="All" bg="#ffffff" note={<>For loading a whole list or screen, a skeleton in the content’s layout often feels faster. See <a className="text-brand underline" href={href('/components/empty-and-error-states')}>Empty &amp; error states</a>.</>}>
          <div className="space-y-2.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="size-8 shrink-0 rounded-full bg-[#e5e7ef]" />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-2 w-3/4 rounded bg-[#e5e7ef]" />
                  <span className="block h-2 w-1/2 rounded bg-[#eef0f5]" />
                </span>
              </div>
            ))}
          </div>
        </Demo>
      </div>
    </div>
  );
}
