import { useState } from 'react';
import { Info } from 'lucide-react';
import { PhoneFrame } from '../shared/PhoneFrame';
import { SystemDialog } from './SystemDialog';
import type { Choice, DialogOs, DialogPerm } from './SystemDialog';

/*
 * Explorer: the real system permission dialogs on iOS and Android, and what each answer means
 * for the app (and for the tester).
 */

const PERMS: [DialogPerm, string][] = [
  ['location', 'Location'],
  ['camera', 'Camera'],
  ['photos', 'Photos'],
  ['notifications', 'Notifications'],
];

const NOTES: Record<DialogOs, Record<DialogPerm, Partial<Record<Choice, string>> & { intro: string }>> = {
  ios: {
    location: {
      intro: 'iOS asks once. The map lets the user switch Precise off, so the app only gets an approximate area.',
      once: 'Location works for this session only. When the app is no longer in use, the permission goes back to “ask”, and the app may show the dialog again next time.',
      allow: '“While Using App”: location works whenever the app is in use. “Always” (background location) can only be offered later, in a separate step.',
      deny: 'The dialog will never appear again for this app. Only the Settings app can change the answer, so the app must explain that and link there.',
    },
    camera: {
      intro: 'Camera, microphone and contacts use a simple two-button dialog, shown only once.',
      allow: 'The camera works now and on every later launch, until the user turns it off in Settings.',
      deny: 'Final: asking again does nothing. The app must show an explanation and an “Open Settings” button instead of a black camera view.',
    },
    photos: {
      intro: 'Apps that use the system photo picker need no permission at all. This dialog only appears when the app wants to read the library itself.',
      limited: '“Limit Access”: the user picks some photos, and the app sees only those. Test that the app shows the picked photos and offers a way to pick more.',
      allow: 'The app can read the whole photo library.',
      deny: 'The app sees no photos. The upload feature should still work through the system picker, or explain how to allow access.',
    },
    notifications: {
      intro: 'The notification dialog is also shown only once. See the Push notifications lesson for the details.',
      allow: 'Notifications can be shown. Users can still change their style or turn them off in Settings later.',
      deny: 'The app can’t ask again. In-app notification switches must show that notifications are off in the system.',
    },
  },
  android: {
    location: {
      intro: 'Android 12+ lets the user pick Precise or Approximate. Approximate is accurate to about 3 km, enough for a city, not for a street.',
      allow: '“While using the app”: foreground access. Background location (“Allow all the time”) must be granted separately, in Settings.',
      once: '“Only this time”: the permission is removed soon after the user leaves the app. The app must check again next time, not assume it still has access.',
      deny: 'The app may ask again once. After the second “Don’t allow”, Android stops showing the dialog (Android 11+): the request fails instantly and only Settings can help.',
    },
    camera: {
      intro: 'Camera and microphone also offer “Only this time” (Android 11+).',
      allow: 'The camera works while the app is in use.',
      once: 'Works now. Next launch the permission is gone and the app must ask again.',
      deny: 'The app may show its explanation and ask once more. After two denials, only Settings can change it.',
    },
    photos: {
      intro: 'Android 14+ adds partial access. Apps using the Android photo picker need no permission at all.',
      limited: '“Select photos and videos”: the app sees only the chosen items. It should offer a way to choose more later.',
      allow: 'The app can read all photos and videos.',
      deny: 'No access. Uploading should still work through the photo picker, or the app explains how to allow access.',
    },
    notifications: {
      intro: 'Since Android 13 notifications need this runtime permission. On Android 12 and older they are on by default.',
      allow: 'Notifications can be shown. Users can still mute single channels in Settings.',
      deny: 'The app may ask once more; after two denials the dialog stops appearing.',
    },
  },
};

const LABEL: Record<Choice, string> = { allow: 'Allow', once: 'Allow once', deny: 'Don’t allow', limited: 'Limited access' };

export default function PermissionDialogs() {
  const [os, setOs] = useState<DialogOs>('ios');
  const [perm, setPerm] = useState<DialogPerm>('location');
  const [precise, setPrecise] = useState(true);
  const [picked, setPicked] = useState<Choice | null>(null);
  const notes = NOTES[os][perm];

  const tab = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${active ? 'bg-brand text-brand-fg' : 'bg-subtle text-fg hover:bg-brand-soft'}`;

  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Platform" className="flex gap-1">
          {(['ios', 'android'] as DialogOs[]).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={os === o}
              className={tab(os === o)}
              onClick={() => {
                setOs(o);
                setPicked(null);
              }}
            >
              {o === 'ios' ? 'iOS 18' : 'Android 15'}
            </button>
          ))}
        </div>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <div role="group" aria-label="Permission" className="flex flex-wrap gap-1">
          {PERMS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              aria-pressed={perm === p}
              className={tab(perm === p)}
              onClick={() => {
                setPerm(p);
                setPicked(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="mx-auto">
          <PhoneFrame width={250} os={os}>
            <div className="relative h-full bg-[#f2f2f7] text-black" style={{ colorScheme: 'light' }}>
              <div className="space-y-2 px-4 pt-4">
                <p className="text-[18px] font-bold">Snapbite</p>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white" />
                ))}
              </div>
              {picked ? (
                <div className="absolute inset-x-3 bottom-8 rounded-2xl bg-white p-3 text-center text-[12px] shadow-lg">
                  You chose <strong>{LABEL[picked]}</strong>
                  {perm === 'location' && picked !== 'deny' && <span className="block text-[11px] text-black/60">{precise ? 'Precise location' : 'Approximate location'}</span>}
                  <button type="button" onClick={() => setPicked(null)} className="mt-2 block w-full rounded-lg bg-[#f2f2f7] py-1.5 text-[12px] font-semibold text-[#007aff]">
                    Show the dialog again
                  </button>
                </div>
              ) : (
                <SystemDialog key={`${os}-${perm}`} os={os} perm={perm} precise={precise} onPrecise={setPrecise} onAnswer={setPicked} />
              )}
            </div>
          </PhoneFrame>
        </div>

        <div className="min-w-0 space-y-2 text-sm">
          <p className="flex gap-2 rounded-xl bg-subtle p-3 leading-relaxed text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-brand" />
            <span>{notes.intro}</span>
          </p>
          <ul className="space-y-2" aria-live="polite">
            {(Object.keys(LABEL) as Choice[])
              .filter((c) => notes[c])
              .map((c) => (
                <li key={c} className={`rounded-xl border p-3 leading-relaxed transition-colors ${picked === c ? 'border-brand bg-brand-soft' : 'border-line'}`}>
                  <p className="font-semibold text-fg">{LABEL[c]}</p>
                  <p className="mt-0.5 text-muted">{notes[c]}</p>
                </li>
              ))}
          </ul>
          <p className="text-xs text-faint">Tap a button in the dialog to highlight what it means. Exact wording differs a little between OS versions and manufacturers.</p>
        </div>
      </div>
    </div>
  );
}
