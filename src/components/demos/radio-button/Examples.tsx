import type { ReactNode } from 'react';
import { RadioDot } from './Radio';

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

function Row({ on, label, detail, price }: { on: boolean; label: string; detail?: string; price?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="pt-[1px]">
        <RadioDot selected={on} size={18} />
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        {label}
        {detail && (
          <span className="block text-[12px]" style={{ color: sub }}>
            {detail}
          </span>
        )}
      </span>
      {price && <span className="shrink-0 font-medium">{price}</span>}
    </div>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <p className="pb-0.5 text-[12px] font-medium" style={{ color: '#6750a4' }}>
      {children}
    </p>
  );
}

/** Default selection: the safe, free option vs a paid extra. */
export function DefaultChoice({ bad = false }: { bad?: boolean }) {
  if (bad) {
    return (
      <Card>
        <Legend>Travel insurance</Legend>
        <Row on label="Yes, protect my trip" price="€24.00" />
        <Row on={false} label="No, I'll take the risk" />
      </Card>
    );
  }
  return (
    <Card>
      <Legend>Delivery</Legend>
      <Row on label="Standard" detail="Arrives Tue–Thu" price="Free" />
      <Row on={false} label="Express" detail="Arrives tomorrow" price="€6.99" />
    </Card>
  );
}

/** A few visible options vs a long list squeezed into radios. */
export function OptionCount({ bad = false }: { bad?: boolean }) {
  if (bad) {
    const countries = ['Austria', 'Belgium', 'Croatia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Ireland', '… 17 more'];
    return (
      <Card>
        <Legend>Country</Legend>
        <div className="grid grid-cols-2 gap-x-2">
          {countries.map((c, i) => (
            <div key={c} className="flex items-center gap-1.5 py-0.5 text-[12px]">
              {i < 10 ? <RadioDot selected={false} size={12} /> : <span className="w-3" />}
              <span className="min-w-0 truncate">{c}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <Legend>Size</Legend>
      <Row on={false} label="Small" detail="250 ml" />
      <Row on label="Medium" detail="350 ml" />
      <Row on={false} label="Large" detail="450 ml" />
    </Card>
  );
}

/** A single yes/no: checkbox vs a lone radio that can never be unselected. */
export function SingleChoice({ radio = false }: { radio?: boolean }) {
  return (
    <Card>
      <div className="flex items-start gap-2.5 py-1.5">
        <span className="pt-[1px]">
          {radio ? (
            <RadioDot selected size={18} />
          ) : (
            <span className="grid size-[18px] place-items-center rounded-[2px] bg-[#6750a4]" aria-hidden="true">
              <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 6.2 5 8.5l4.5-5" />
              </svg>
            </span>
          )}
        </span>
        <span className="min-w-0 leading-snug">Email me my receipt</span>
      </div>
      <p className="text-[11px]" style={{ color: sub }}>
        {radio ? 'Selected… and now there is no way to unselect it.' : 'Tap again to untick it.'}
      </p>
    </Card>
  );
}
