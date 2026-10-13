import { useState, type ReactNode } from 'react';
import { List, Map, Bookmark, LayoutGrid, Rows3, Moon, Sun, Bold, Italic, Underline } from 'lucide-react';
import { SegmentedControl, type SegOption, type Variant } from './SegmentedControl';

function Demo({
  title,
  platform,
  note,
  dark,
  children,
}: {
  title: string;
  platform: string;
  note: string;
  dark: boolean;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-36 place-items-center px-6 py-8" style={{ background: dark ? '#000' : '#f2f2f7' }}>
        <div className="w-full max-w-[19rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

function Single({ options, variant, dark, initial = 0, size }: { options: SegOption[]; variant: Variant; dark: boolean; initial?: number; size?: 'sm' | 'md' | 'lg' }) {
  const [v, setV] = useState(initial);
  return <SegmentedControl options={options} value={v} onChange={(x) => setV(x as number)} variant={variant} dark={dark} size={size} />;
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [multi, setMulti] = useState<number[]>([0, 2]);

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Tap the controls, they all work. Use the switch to compare light and dark appearance.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Classic text" platform="iOS" dark={dark} note="The standard iOS look: a grey track with a white thumb that slides to the selected segment.">
          <Single variant="ios" dark={dark} options={[{ label: 'Day' }, { label: 'Week' }, { label: 'Month' }, { label: 'Year' }]} initial={1} />
        </Demo>
        <Demo title="Segmented button" platform="Android · Material 3" dark={dark} note="Outlined pill. The selected segment gets a tinted background and a checkmark.">
          <Single variant="material" dark={dark} options={[{ label: 'Walk' }, { label: 'Transit' }, { label: 'Drive' }]} />
        </Demo>
        <Demo title="Button group" platform="Web" dark={dark} note="Common on websites and dashboards. Often built by hand, so it's where bugs hide.">
          <Single variant="web" dark={dark} options={[{ label: 'Monthly' }, { label: 'Yearly' }]} initial={1} />
        </Demo>
        <Demo title="Icons only" platform="iOS · Web" dark={dark} note="Saves space, but icons need an accessible name or screen readers say just 'button'.">
          <div className="mx-auto w-40">
            <Single
              variant="ios"
              dark={dark}
              options={[
                { icon: LayoutGrid, a11y: 'Grid view' },
                { icon: Rows3, a11y: 'List view' },
              ]}
            />
          </div>
        </Demo>
        <Demo title="Icon + text" platform="iOS" dark={dark} note="Icons help scanning. Check they stay aligned with the label at every text size.">
          <Single
            variant="ios"
            dark={dark}
            options={[
              { label: 'List', icon: List },
              { label: 'Map', icon: Map },
              { label: 'Saved', icon: Bookmark },
            ]}
          />
        </Demo>
        <Demo title="With counters" platform="iOS · Web" dark={dark} note="Badges show how many items each view holds. Test 0, 1, 99 and 1000+.">
          <Single variant="ios" dark={dark} options={[{ label: 'All', badge: 24 }, { label: 'Unread', badge: 3 }, { label: 'Flagged', badge: 0 }]} />
        </Demo>
        <Demo
          title="Multi-select"
          platform="Android · Material 3"
          dark={dark}
          note="Material allows choosing several segments at once. iOS segmented controls never do this."
        >
          <SegmentedControl
            variant="material"
            dark={dark}
            multiple
            value={multi}
            onChange={(v) => setMulti(v as number[])}
            ariaLabel="Text style"
            options={[
              { icon: Bold, a11y: 'Bold' },
              { icon: Italic, a11y: 'Italic' },
              { icon: Underline, a11y: 'Underline' },
            ]}
          />
        </Demo>
        <Demo title="With a disabled segment" platform="All" dark={dark} note="A segment can be unavailable. It must look disabled and must not react to taps or keys.">
          <Single variant="ios" dark={dark} options={[{ label: 'Standard' }, { label: 'Express' }, { label: 'Same day', disabled: true }]} />
        </Demo>
      </div>
    </div>
  );
}
