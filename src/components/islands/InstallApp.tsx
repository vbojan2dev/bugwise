import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

/** The browser's install prompt event (Chrome, Edge, Android). Not in the TS DOM types yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
declare global {
  interface Window {
    __bwInstallPrompt?: InstallPromptEvent | null;
  }
}

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * "Install app" for the PWA. Chrome/Edge/Android: uses the browser's install prompt.
 * iPhone/iPad: Safari has no prompt, so it shows the Share → Add to Home Screen steps.
 * Renders nothing when installing isn't possible or the app is already installed.
 */
export default function InstallApp({ variant = 'link' }: { variant?: 'link' | 'button' }) {
  const [mode, setMode] = useState<'none' | 'prompt' | 'ios' | 'installed'>('none');
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return setMode('installed');
    if (window.__bwInstallPrompt) setMode('prompt');
    else if (isIOS()) setMode('ios');
    const ready = () => setMode('prompt');
    const done = () => setMode('installed');
    addEventListener('bw-installable', ready);
    addEventListener('appinstalled', done);
    return () => {
      removeEventListener('bw-installable', ready);
      removeEventListener('appinstalled', done);
    };
  }, []);

  if (mode === 'none') return null;
  if (mode === 'installed') return variant === 'button' ? <p className="text-sm text-ok">Bugwise is installed on this device.</p> : null;

  const install = async () => {
    if (mode === 'ios') return setHelp((h) => !h);
    const e = window.__bwInstallPrompt;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    window.__bwInstallPrompt = null;
    if (outcome === 'accepted') setMode('installed');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        aria-expanded={mode === 'ios' ? help : undefined}
        className={
          variant === 'button'
            ? 'inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:opacity-90'
            : 'inline-flex items-center gap-1.5 text-muted hover:text-fg'
        }
      >
        <Download size={variant === 'button' ? 16 : 14} /> Install the app
      </button>
      {help && (
        <div role="dialog" aria-label="Install on iPhone or iPad" className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-2xl border border-line bg-surface p-4 text-sm shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">Install on iPhone or iPad</p>
            <button type="button" aria-label="Close" onClick={() => setHelp(false)} className="-m-1 grid size-7 place-items-center rounded-full text-muted hover:bg-subtle">
              <X size={15} />
            </button>
          </div>
          <ol className="mt-2 space-y-2 text-muted">
            <li className="flex gap-2">
              <span className="font-semibold text-fg">1.</span>
              <span>
                In Safari, tap <Share size={14} className="inline align-[-2px]" aria-label="Share" /> <strong className="text-fg">Share</strong>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-fg">2.</span>
              <span>
                Choose <SquarePlus size={14} className="inline align-[-2px]" aria-hidden="true" /> <strong className="text-fg">Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-fg">3.</span>
              <span>Open Bugwise from your Home Screen. Pages you visit also work offline.</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
