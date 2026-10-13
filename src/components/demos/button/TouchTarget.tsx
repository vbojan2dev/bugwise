import { X } from 'lucide-react';

/** Static illustration of a close button's visible icon vs its real tap area. */
export default function TouchTarget({ good = true }: { good?: boolean }) {
  const size = good ? 44 : 18;
  return (
    <div className="flex items-center gap-4 text-black">
      <div className="relative grid size-16 shrink-0 place-items-center">
        <span
          className="absolute grid place-items-center rounded-lg border-2 border-dashed"
          style={{ width: size, height: size, borderColor: good ? '#34c759' : '#ff3b30', background: good ? 'rgba(52,199,89,.1)' : 'rgba(255,59,48,.1)' }}
        />
        <span className="relative grid size-7 place-items-center rounded-full bg-[#787880]/15">
          <X size={16} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </div>
      <p className="text-[13px] leading-snug text-black/70">
        {good ? 'Tap area: 44×44 pt. The icon is small, the target is not.' : 'Tap area: 18×18 px. Only the icon itself reacts.'}
      </p>
    </div>
  );
}
