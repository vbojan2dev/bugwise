import { Bell, Camera, Image, MapPin } from 'lucide-react';

/*
 * Mock iOS and Android (Material 3) runtime permission dialogs.
 * Rendered as an absolute overlay inside a phone screen (never position: fixed).
 * Wording follows recent iOS (17/18) and Android (13–15) system dialogs.
 */

export type DialogPerm = 'location' | 'camera' | 'photos' | 'notifications';
export type DialogOs = 'ios' | 'android';
export type Choice = 'allow' | 'once' | 'deny' | 'limited';

const IOS_BLUE = '#007aff';

interface Props {
  os: DialogOs;
  perm: DialogPerm;
  app?: string;
  precise: boolean;
  onPrecise: (v: boolean) => void;
  onAnswer: (c: Choice) => void;
  /** Usage text shown under the iOS title (the app's purpose string). */
  purpose?: string;
}

const defaultPurpose: Record<DialogPerm, string> = {
  location: 'We use your location to find your delivery address.',
  camera: 'Take photos of your food to add them to your reviews.',
  photos: 'Choose photos of your food for your reviews.',
  notifications: 'Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.',
};

export function SystemDialog({ os, perm, app = 'Snapbite', precise, onPrecise, onAnswer, purpose }: Props) {
  const id = `perm-dlg-${perm}`;
  if (os === 'ios') {
    const title =
      perm === 'location'
        ? `Allow “${app}” to use your location?`
        : perm === 'camera'
          ? `“${app}” Would Like to Access the Camera`
          : perm === 'photos'
            ? `“${app}” Would Like to Access Your Photos`
            : `“${app}” Would Like to Send You Notifications`;
    const msg = perm === 'notifications' ? defaultPurpose.notifications : (purpose ?? defaultPurpose[perm]);
    const stacked: [string, Choice][] | null =
      perm === 'location'
        ? [
            ['Allow Once', 'once'],
            ['Allow While Using App', 'allow'],
            ['Don’t Allow', 'deny'],
          ]
        : perm === 'photos'
          ? [
              ['Limit Access…', 'limited'],
              ['Allow Full Access', 'allow'],
              ['Don’t Allow', 'deny'],
            ]
          : null;
    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-black/30 px-6" style={{ colorScheme: 'light' }}>
        <div role="alertdialog" aria-labelledby={`${id}-t`} aria-describedby={`${id}-m`} className="w-full max-w-[250px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center text-black">
          <p id={`${id}-t`} className="px-4 pt-4 text-[14px] leading-snug font-semibold">
            {title}
          </p>
          <p id={`${id}-m`} className="px-4 pt-1 pb-3 text-[12px] leading-snug">
            {msg}
          </p>
          {perm === 'location' && (
            <div className="relative mx-4 mb-3 h-[74px] overflow-hidden rounded-lg bg-[#dfe8d8]">
              <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(90deg,#fff 2px,transparent 2px),linear-gradient(#fff 2px,transparent 2px)', backgroundSize: '26px 22px' }} />
              {precise ? (
                <MapPin size={22} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#007aff]" fill="#cfe3ff" />
              ) : (
                <span className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#007aff]/50 bg-[#007aff]/15" />
              )}
              <button
                type="button"
                onClick={() => onPrecise(!precise)}
                aria-pressed={precise}
                className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold"
                style={{ color: IOS_BLUE }}
              >
                <MapPin size={10} /> Precise: {precise ? 'On' : 'Off'}
              </button>
            </div>
          )}
          {stacked ? (
            <div className="border-t border-black/15 text-[15px]" style={{ color: IOS_BLUE }}>
              {stacked.map(([label, c], i) => (
                <button key={label} type="button" onClick={() => onAnswer(c)} className={`h-10 w-full ${i > 0 ? 'border-t border-black/15' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 border-t border-black/15 text-[15px]" style={{ color: IOS_BLUE }}>
              <button type="button" onClick={() => onAnswer('deny')} className="h-11 border-r border-black/15">
                Don’t Allow
              </button>
              <button type="button" onClick={() => onAnswer('allow')} className="h-11 font-semibold">
                Allow
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const Icon = perm === 'location' ? MapPin : perm === 'camera' ? Camera : perm === 'photos' ? Image : Bell;
  const title =
    perm === 'location'
      ? `Allow ${app} to access this device’s location?`
      : perm === 'camera'
        ? `Allow ${app} to take pictures and record video?`
        : perm === 'photos'
          ? `Allow ${app} to access photos and videos on this device?`
          : `Allow ${app} to send you notifications?`;
  const buttons: [string, Choice][] =
    perm === 'notifications'
      ? [
          ['Allow', 'allow'],
          ['Don’t allow', 'deny'],
        ]
      : perm === 'photos'
        ? [
            ['Select photos and videos', 'limited'],
            ['Allow all', 'allow'],
            ['Don’t allow', 'deny'],
          ]
        : [
            ['While using the app', 'allow'],
            ['Only this time', 'once'],
            ['Don’t allow', 'deny'],
          ];
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/35 px-4 pb-8" style={{ colorScheme: 'light' }}>
      <div role="alertdialog" aria-labelledby={`${id}-t`} className="w-full max-w-[260px] rounded-[26px] bg-[#ece6f0] px-4 pt-4 pb-3 text-[#1d1b20]">
        <Icon size={22} className="mx-auto text-[#4f378b]" />
        <p id={`${id}-t`} className="mt-2 text-center text-[15px] leading-snug">
          {title}
        </p>
        {perm === 'location' && (
          <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Location accuracy">
            {[true, false].map((p) => (
              <button
                key={String(p)}
                type="button"
                role="radio"
                aria-checked={precise === p}
                onClick={() => onPrecise(p)}
                className={`flex flex-col items-center rounded-2xl border-2 px-1 py-2 text-[11px] font-medium ${precise === p ? 'border-[#4f378b] bg-white' : 'border-transparent bg-white/50'}`}
              >
                <span className="relative grid size-9 place-items-center rounded-full bg-[#dfe8d8]">
                  {p ? <MapPin size={16} className="text-[#4f378b]" /> : <span className="size-7 rounded-full border-2 border-[#4f378b]/50 bg-[#4f378b]/15" />}
                </span>
                <span className="mt-1">{p ? 'Precise' : 'Approximate'}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-1.5">
          {buttons.map(([label, c]) => (
            <button key={label} type="button" onClick={() => onAnswer(c)} className="h-10 w-full rounded-full bg-[#f7f2fa] text-[13px] font-medium text-[#4f378b]">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
