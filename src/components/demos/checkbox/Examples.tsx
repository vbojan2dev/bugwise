import type { ReactNode } from 'react';
import { CheckBox } from './Checkbox';

/* Static pictures for the Do / Don't blocks. No behavior, so they can render without hydration. */

const text = '#1d1b20';
const sub = '#49454f';

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[19rem] rounded-xl bg-white px-3 py-2 text-[14px]" style={{ color: text, colorScheme: 'light' }}>
      {children}
    </div>
  );
}

/** Hit area: whole row vs only the tiny box. The dashed outline shows what reacts to a tap. */
export function HitArea({ good = false }: { good?: boolean }) {
  return (
    <Card>
      <div className={`relative flex items-center gap-2 rounded-lg px-1 py-2 ${good ? 'outline-2 outline-[#16a34a] outline-dashed' : ''}`}>
        <span className={`grid place-items-center ${good ? '' : 'rounded-[3px] outline-2 outline-offset-1 outline-[#dc2626] outline-dashed'}`}>
          <CheckBox state={false} size={good ? 18 : 14} />
        </span>
        <span>I agree to the Terms of Service</span>
      </div>
      <p className="mt-1 text-[11px]" style={{ color: sub }}>
        {good ? 'Tap target: the whole row (box + label).' : 'Tap target: a 14 px box. The text does nothing.'}
      </p>
    </Card>
  );
}

/** Sign-up consent: marketing unchecked by default vs pre-checked. */
export function ConsentForm({ prechecked = false }: { prechecked?: boolean }) {
  return (
    <Card>
      <div className="flex items-start gap-2 py-1.5">
        <span className="pt-[1px]">
          <CheckBox state={false} />
        </span>
        <span className="min-w-0 leading-snug">
          I agree to the <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span> <span style={{ color: '#b3261e' }}>*</span>
        </span>
      </div>
      <div className="flex items-start gap-2 py-1.5">
        <span className="pt-[1px]">
          <CheckBox state={prechecked} />
        </span>
        <span className="min-w-0 leading-snug">Send me deals and partner offers by email</span>
      </div>
      <div className="mt-2 rounded-full bg-[#6750a4] py-2 text-center text-[13px] font-medium text-white">Create account</div>
    </Card>
  );
}

/** Long label: box aligned to the first line with a hanging indent vs box centered and text wrapping under it. */
export function LongLabel({ good = false }: { good?: boolean }) {
  const label = 'I confirm that I am over 18 and that the passenger names match the passports exactly';
  if (good) {
    return (
      <Card>
        <div className="flex items-start gap-2 py-1.5">
          <span className="pt-[1px]">
            <CheckBox state={true} />
          </span>
          <span className="min-w-0 leading-snug">{label}</span>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <p className="py-1.5 leading-snug">
        <span className="mr-2 inline-block align-middle">
          <CheckBox state={true} />
        </span>
        {label}
      </p>
    </Card>
  );
}

/** Checkbox vs switch inside a form that needs a Save button. */
export function NotificationForm({ asSwitch = false }: { asSwitch?: boolean }) {
  const rows = [
    { l: 'Booking confirmations', on: true },
    { l: 'Price drop alerts', on: false },
  ];
  return (
    <Card>
      <p className="pb-1 text-[12px] font-medium" style={{ color: '#6750a4' }}>
        Email me about
      </p>
      {rows.map((r) => (
        <div key={r.l} className={`flex items-center gap-2 py-1.5 ${asSwitch ? 'justify-between' : ''}`}>
          {!asSwitch && <CheckBox state={r.on} />}
          <span className="min-w-0">{r.l}</span>
          {asSwitch && (
            <span className="relative h-[22px] w-[38px] shrink-0 rounded-full" style={{ background: r.on ? '#6750a4' : '#e7e0ec', border: r.on ? 'none' : '2px solid #79747e' }}>
              <span className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: r.on ? 19 : 4, width: r.on ? 16 : 10, height: r.on ? 16 : 10, background: r.on ? '#fff' : '#79747e' }} />
            </span>
          )}
        </div>
      ))}
      <div className="mt-2 rounded-full bg-[#6750a4] py-2 text-center text-[13px] font-medium text-white">Save preferences</div>
    </Card>
  );
}
