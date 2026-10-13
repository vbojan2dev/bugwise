import { Clock, Gauge, PackageX } from 'lucide-react';

/** Static visual: latency vs bandwidth vs packet loss, explained with a delivery-van analogy. */

const items = [
  {
    icon: Clock,
    name: 'Latency',
    unit: 'milliseconds (ms)',
    analogy: 'How long one trip to the warehouse and back takes.',
    feel: 'Every tap waits a moment before anything happens. Apps that make many small requests feel sluggish.',
    lanes: [{ w: 18, delay: true }],
  },
  {
    icon: Gauge,
    name: 'Bandwidth',
    unit: 'Mbps / kbps',
    analogy: 'How much the van can carry per trip.',
    feel: 'Small requests are fine, but images, videos and big downloads crawl.',
    lanes: [{ w: 30 }, { w: 30 }, { w: 30 }],
  },
  {
    icon: PackageX,
    name: 'Packet loss',
    unit: '% of packets lost',
    analogy: 'Some parcels fall off the van and have to be sent again.',
    feel: 'Random stalls, requests that hang and then fail, video that freezes even though "signal looks fine".',
    lanes: [{ w: 22 }, { w: 22, lost: true }, { w: 22 }],
  },
];

export default function NetworkTerms() {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      {items.map((it) => (
        <div key={it.name} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <it.icon size={18} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-fg">{it.name}</p>
              <p className="text-xs text-faint">{it.unit}</p>
            </div>
          </div>
          <div className="mt-3 flex h-7 items-center gap-1.5 rounded-lg bg-subtle px-2" aria-hidden>
            {it.name === 'Latency' ? (
              <>
                <span className="h-3 flex-1 rounded-full border border-dashed border-line-strong" />
                <span className="h-3 w-6 rounded bg-brand" />
              </>
            ) : (
              it.lanes.map((l, i) => <span key={i} className={`h-3 rounded ${'lost' in l && l.lost ? 'border border-dashed border-danger bg-danger-soft' : 'bg-brand'}`} style={{ width: `${l.w}%` }} />)
            )}
          </div>
          <p className="mt-3 text-sm text-fg">{it.analogy}</p>
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-fg">What users feel:</span> {it.feel}
          </p>
        </div>
      ))}
    </div>
  );
}
