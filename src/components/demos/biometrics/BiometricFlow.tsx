import type { ReactNode } from 'react';
import { ArrowDown, ArrowRight, Cpu, KeyRound, ScanFace, Server, Smartphone } from 'lucide-react';

/*
 * Static diagram: where biometric data lives and what actually travels to the server.
 * The face/fingerprint stays in secure hardware; a successful match only releases a key or token.
 */

function Box({ icon, title, text, tone = 'plain' }: { icon: ReactNode; title: string; text: string; tone?: 'plain' | 'secure' }) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${tone === 'secure' ? 'border-ok/40 bg-ok-soft' : 'border-line bg-surface'}`}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
        {icon} {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
    </div>
  );
}

export default function BiometricFlow() {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,14rem)] md:items-center">
      <div className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
          <Smartphone size={13} /> On the phone
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Box icon={<ScanFace size={15} />} title="1. App asks the OS" text="“Please confirm it's you.” The OS shows its own Face ID, Touch ID or BiometricPrompt sheet. The app never gets the camera image or the fingerprint." />
          <div className="flex justify-center text-faint">
            <ArrowDown size={16} />
          </div>
          <Box
            icon={<Cpu size={15} />}
            title="2. Secure hardware compares"
            text="The Secure Enclave (iPhone) or a trusted environment (Android) compares the scan with the stored template. The answer is only “match” or “no match”."
            tone="secure"
          />
          <div className="flex justify-center text-faint">
            <ArrowDown size={16} />
          </div>
          <Box
            icon={<KeyRound size={15} />}
            title="3. A secret is released"
            text="On a match, the Keychain (iOS) or Keystore (Android) unlocks a token or key the app saved when the user turned biometrics on."
            tone="secure"
          />
        </div>
      </div>
      <div className="flex justify-center text-faint">
        <ArrowRight size={20} className="hidden md:block" />
        <ArrowDown size={20} className="md:hidden" />
      </div>
      <div className="min-w-0 rounded-2xl border border-line bg-subtle p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
          <Server size={13} /> On the server
        </p>
        <Box icon={<Server size={15} />} title="4. Server checks the token" text="It receives the same kind of token as after a password login. It never sees a face or a fingerprint, and can't tell which finger was used." />
      </div>
    </div>
  );
}
