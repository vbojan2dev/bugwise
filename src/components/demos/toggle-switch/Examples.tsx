import { Check } from 'lucide-react';
import { Switch, type SwitchPlatform } from './Switch';

/* Small static illustrations for the Do / Don't comparisons. */

export function SwitchRows({ rows, platform = 'ios' }: { rows: { label: string; sub?: string; on: boolean }[]; platform?: SwitchPlatform }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white text-black">
      {rows.map((r, i) => (
        <div key={r.label} className="flex min-h-11 items-center gap-3 px-4 py-2" style={{ borderTop: i ? '0.5px solid rgba(60,60,67,.18)' : undefined }}>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">{r.label}</span>
            {r.sub && <span className="block text-[12px] text-black/55">{r.sub}</span>}
          </span>
          <Switch platform={platform} checked={r.on} decorative />
        </div>
      ))}
    </div>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-[5px] border-2" style={{ borderColor: checked ? '#2563eb' : '#9ca3af', background: checked ? '#2563eb' : '#fff' }}>
      {checked && <Check size={13} strokeWidth={3.5} color="#fff" />}
    </span>
  );
}

/** A form that only takes effect after Submit. */
export function SignupForm({ useSwitch = false }: { useSwitch?: boolean }) {
  return (
    <div className="space-y-3 rounded-xl bg-white p-4 text-[14px] text-[#111827]">
      <div className="h-9 rounded-lg border border-[#d1d5db] px-3 py-2 text-[13px] text-[#6b7280]">anna@example.com</div>
      <div className="flex items-center gap-2.5">
        {useSwitch ? <Switch platform="web" checked decorative /> : <Box checked />}
        <span>I agree to the Terms of Service</span>
      </div>
      <div className="flex items-center gap-2.5">
        {useSwitch ? <Switch platform="web" checked={false} decorative /> : <Box checked={false} />}
        <span>Send me the newsletter</span>
      </div>
      <div className="grid h-10 place-items-center rounded-lg bg-[#2563eb] font-semibold text-white">Create account</div>
    </div>
  );
}

/** Two non-on/off options: Metric vs Imperial. */
export function Units({ asSwitch = false }: { asSwitch?: boolean }) {
  if (asSwitch) {
    return <SwitchRows rows={[{ label: 'Metric units', on: false }]} />;
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-black">
      <span className="flex-1 text-[15px]">Units</span>
      <span className="flex rounded-[9px] p-[2px] text-[13px] font-medium" style={{ background: 'rgba(118,118,128,.12)' }}>
        <span className="rounded-[7px] bg-white px-3 py-1 font-semibold shadow-[0_3px_8px_rgba(0,0,0,.12)]">km</span>
        <span className="px-3 py-1">miles</span>
      </span>
    </div>
  );
}
