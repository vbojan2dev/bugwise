import { ChevronDown } from 'lucide-react';

/*
 * Static (non-interactive) accordion pictures for the Do / Don't comparisons.
 * They are drawn with aria-hidden content plus a text alternative, because they are illustrations.
 */

export interface StaticSection {
  title: string;
  sub?: string;
  open?: boolean;
  body?: string;
  nested?: StaticSection[];
  highlight?: boolean;
}

function Section({ s, depth = 0 }: { s: StaticSection; depth?: number }) {
  return (
    <div className={depth ? 'border-t border-black/10' : ''}>
      <div className="flex min-h-11 items-center gap-2 py-2" style={{ paddingLeft: 12 + depth * 14, paddingRight: 12 }}>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13px] font-semibold ${s.highlight ? 'text-[#b3261e]' : ''}`}>{s.title}</p>
          {s.sub && <p className="truncate text-[11px] text-[#5a5f70]">{s.sub}</p>}
        </div>
        <ChevronDown size={16} className="shrink-0 text-[#5a5f70]" style={{ transform: s.open ? 'rotate(180deg)' : 'none' }} />
      </div>
      {s.open && s.body && (
        <p className="pb-3 text-[12px] leading-snug text-[#3c4150]" style={{ paddingLeft: 12 + depth * 14, paddingRight: 12 }}>
          {s.body}
        </p>
      )}
      {s.open && s.nested && (
        <div className="bg-black/[0.02]">
          {s.nested.map((n) => (
            <Section key={n.title} s={n} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StaticAccordion({ sections, label, heading }: { sections: StaticSection[]; label: string; heading?: string }) {
  return (
    <div role="img" aria-label={label} className="overflow-hidden rounded-xl bg-white text-[#0e1120] shadow-sm" style={{ colorScheme: 'light' }}>
      <div aria-hidden="true">
        {heading && <p className="px-3 pt-3 pb-1 text-[14px] font-bold">{heading}</p>}
        <div className="divide-y divide-black/10">
          {sections.map((s) => (
            <Section key={s.title} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
