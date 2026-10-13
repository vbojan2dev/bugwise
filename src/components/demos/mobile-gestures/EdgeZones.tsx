import type { CSSProperties } from 'react';

/**
 * Static diagram: where the operating system "owns" the screen edges.
 * Gestures that start in these zones go to the OS (or the navigation stack), not to the app's own content.
 */

type Zone = { style: CSSProperties; color: string; n: number };

function Phone({ os, zones }: { os: 'ios' | 'android'; zones: Zone[] }) {
  return (
    <div className="relative mx-auto bg-[#0c0d12] p-[7px]" style={{ width: 150, borderRadius: os === 'ios' ? 30 : 22 }}>
      <div className="relative overflow-hidden bg-white" style={{ aspectRatio: '9 / 19', borderRadius: os === 'ios' ? 24 : 16 }}>
        {/* fake app content */}
        <div className="absolute inset-x-3 top-8 space-y-2">
          <div className="h-3 w-16 rounded bg-[#e5e5ea]" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 rounded-md bg-[#f2f2f7]" />
          ))}
        </div>
        {zones.map((z, i) => (
          <div key={i} className="absolute grid place-items-center" style={{ ...z.style, background: z.color + '33', boxShadow: `inset 0 0 0 1.5px ${z.color}` }}>
            <span className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: z.color }}>
              {z.n}
            </span>
          </div>
        ))}
        {os === 'ios' ? (
          <div className="absolute top-1.5 left-1/2 h-[13px] w-[44px] -translate-x-1/2 rounded-full bg-black" />
        ) : (
          <div className="absolute top-2 left-1/2 size-2 -translate-x-1/2 rounded-full bg-black" />
        )}
        <div className="absolute bottom-1 left-1/2 h-[3px] w-[52px] -translate-x-1/2 rounded-full bg-black/80" />
      </div>
    </div>
  );
}

const blue = '#007aff';
const green = '#34c759';
const orange = '#ff9500';
const purple = '#af52de';

export default function EdgeZones() {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <figure className="min-w-0 border-b border-line p-5 sm:border-r sm:border-b-0">
          <div className="rounded-2xl p-4" style={{ background: '#f2f2f7' }}>
            <Phone
              os="ios"
              zones={[
                { n: 1, color: blue, style: { left: 0, top: '12%', bottom: '8%', width: 14 } },
                { n: 2, color: green, style: { left: 0, top: 0, width: '45%', height: 20 } },
                { n: 3, color: orange, style: { right: 0, top: 0, width: '35%', height: 20 } },
                { n: 4, color: purple, style: { left: '20%', right: '20%', bottom: 0, height: 18 } },
              ]}
            />
          </div>
          <figcaption className="mt-4">
            <p className="font-semibold">iPhone (Face ID models)</p>
            <ol className="mt-2 space-y-1.5 text-sm text-muted">
              <li>
                <strong style={{ color: blue }}>1</strong> Swipe from the left edge: <strong className="text-fg">back</strong> to the previous screen (in apps that use the standard navigation)
              </li>
              <li>
                <strong style={{ color: green }}>2</strong> Swipe down from the top (left/middle): <strong className="text-fg">Notification Center</strong>
              </li>
              <li>
                <strong style={{ color: orange }}>3</strong> Swipe down from the top-right corner: <strong className="text-fg">Control Center</strong>
              </li>
              <li>
                <strong style={{ color: purple }}>4</strong> Swipe up from the bottom: <strong className="text-fg">Home</strong>; swipe up and hold: <strong className="text-fg">App Switcher</strong>; swipe sideways along the bottom: switch apps
              </li>
            </ol>
          </figcaption>
        </figure>
        <figure className="min-w-0 p-5">
          <div className="rounded-2xl p-4" style={{ background: '#f2f2f7' }}>
            <Phone
              os="android"
              zones={[
                { n: 1, color: blue, style: { left: 0, top: '12%', bottom: '8%', width: 14 } },
                { n: 1, color: blue, style: { right: 0, top: '12%', bottom: '8%', width: 14 } },
                { n: 2, color: green, style: { left: 0, right: 0, top: 0, height: 20 } },
                { n: 4, color: purple, style: { left: '20%', right: '20%', bottom: 0, height: 18 } },
              ]}
            />
          </div>
          <figcaption className="mt-4">
            <p className="font-semibold">Android (gesture navigation)</p>
            <ol className="mt-2 space-y-1.5 text-sm text-muted">
              <li>
                <strong style={{ color: blue }}>1</strong> Swipe in from the left <em>or</em> right edge: system <strong className="text-fg">Back</strong> (works in every app; Android 14+ can show a predictive back preview)
              </li>
              <li>
                <strong style={{ color: green }}>2</strong> Swipe down from the top: <strong className="text-fg">notification shade</strong>; swipe again: Quick Settings
              </li>
              <li>
                <strong style={{ color: purple }}>4</strong> Swipe up from the bottom: <strong className="text-fg">Home</strong>; swipe up and hold: <strong className="text-fg">Recents</strong>; swipe sideways along the bottom: switch apps
              </li>
              <li className="text-faint">Older phones or users who prefer it may use 3-button navigation (Back, Home, Recents) instead.</li>
            </ol>
          </figcaption>
        </figure>
      </div>
      <p className="border-t border-line bg-subtle px-5 py-3 text-sm text-muted">
        <strong className="text-fg">Why testers care:</strong> any app gesture that starts in these zones (a drawer that opens from the left edge, a carousel that touches the screen edge, a bottom sheet you drag up) competes with the system.
      </p>
    </div>
  );
}
