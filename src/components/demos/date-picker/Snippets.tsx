/**
 * Small static mockups used inside <Do>/<Dont> blocks. No interactivity, no Intl (identical on server and client).
 */
import { CalendarDays, ChevronLeft, ChevronRight, PlaneTakeoff } from 'lucide-react';

const card = 'rounded-xl bg-white p-3 text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,.06)]';
const fieldCls = 'mt-1 h-10 rounded-lg border border-[#d1d5db] bg-white px-3 text-[14px] leading-10 text-[#111827]';

export function BirthDateFields() {
  return (
    <div className={card}>
      <p className="text-[13px] font-semibold">Date of birth</p>
      <p className="text-[11px] text-[#6b7280]">For example: 27 3 1991</p>
      <div className="mt-1 flex gap-2">
        {[
          ['Day', '27', 'w-14'],
          ['Month', '3', 'w-14'],
          ['Year', '1991', 'w-20'],
        ].map(([l, v, w]) => (
          <div key={l} className={w}>
            <p className="text-[11px] font-medium text-[#374151]">{l}</p>
            <div className={fieldCls}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BirthDateCalendar() {
  return (
    <div className={card}>
      <p className="text-[13px] font-semibold">Date of birth</p>
      <div className="mt-2 flex items-center justify-between text-[13px] font-semibold">
        <span>October 2026</span>
        <span className="flex gap-2 text-[#2563eb]">
          <ChevronLeft size={16} />
          <ChevronRight size={16} />
        </span>
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-[11px] text-[#9ca3af]">
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} className={i === 11 ? 'rounded-full bg-[#2563eb] text-white' : ''}>
            {i + 1}
          </span>
        ))}
      </div>
      <p className="mt-2 rounded-md bg-[#fef3c7] px-2 py-1 text-[11px] text-[#92400e]">Born in 1991? That's 427 taps on ‹</p>
    </div>
  );
}

export function TypedWithFormat() {
  return (
    <div className={card}>
      <p className="text-[13px] font-semibold">Expiry date</p>
      <p className="text-[11px] text-[#6b7280]">Format: MM/YY, as printed on your card</p>
      <div className={`${fieldCls} w-28`}>09/28</div>
    </div>
  );
}

export function AmbiguousDate() {
  return (
    <div className={card}>
      <p className="text-[13px] font-semibold">Delivery date</p>
      <div className={`${fieldCls} flex w-40 items-center justify-between`}>
        03/04/2027 <CalendarDays size={16} className="text-[#6b7280]" />
      </div>
      <p className="mt-1 text-[11px] text-[#6b7280]">March 4th? Or 3 April?</p>
    </div>
  );
}

export function RangeTogether() {
  return (
    <div className={card}>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Check-in', 'Fri, Oct 23'],
          ['Check-out', 'Mon, Oct 26'],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-[#d1d5db] px-2.5 py-1.5">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase">{l}</p>
            <p className="text-[13px] font-medium">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-0.5 text-center text-[11px]">
        {[22, 23, 24, 25, 26, 27].map((d) => (
          <span
            key={d}
            className={`flex-1 py-1 ${d === 23 || d === 26 ? 'rounded-md bg-[#2563eb] font-semibold text-white' : d > 23 && d < 26 ? 'bg-[#dbeafe]' : 'text-[#6b7280]'}`}
          >
            {d}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[12px] font-semibold">3 nights · €360</p>
    </div>
  );
}

export function RangeSeparate() {
  return (
    <div className={card}>
      <p className="text-[11px] font-medium text-[#374151]">Check-in</p>
      <div className={fieldCls}>10/26/2026</div>
      <p className="mt-2 text-[11px] font-medium text-[#374151]">Check-out</p>
      <div className={`${fieldCls} border-[#dc2626]`}>10/23/2026</div>
      <p className="mt-1 text-[11px] text-[#6b7280]">Two unrelated pickers. Nothing stops check-out before check-in.</p>
    </div>
  );
}

export function TimeWithZone() {
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-[13px] font-semibold">
        <PlaneTakeoff size={16} className="text-[#2563eb]" /> BEG → JFK
      </div>
      <p className="mt-1 text-[20px] font-semibold tabular-nums">
        07:40 <span className="text-[12px] font-medium text-[#6b7280]">Belgrade time</span>
      </p>
      <p className="text-[12px] text-[#6b7280]">Arrives 11:05 New York time, same day</p>
    </div>
  );
}

export function TimeWithoutZone() {
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-[13px] font-semibold">
        <PlaneTakeoff size={16} className="text-[#2563eb]" /> BEG → JFK
      </div>
      <p className="mt-1 text-[20px] font-semibold tabular-nums">01:40</p>
      <p className="text-[12px] text-[#6b7280]">Converted to the phone's time zone, without saying so</p>
    </div>
  );
}
