import { Bell, MessageCircle, Phone, Settings } from 'lucide-react';
import { CountBadge, StatusPill } from './Badge';

/* Small static examples for the Do / Don't blocks, each on its own light surface. */

function Bar({ calls, updates }: { calls: string | null; updates: string | null }) {
  const tabs = [
    { icon: MessageCircle, label: 'Chats', b: null as string | null },
    { icon: Phone, label: 'Calls', b: calls },
    { icon: Bell, label: 'Updates', b: updates },
    { icon: Settings, label: 'Settings', b: null },
  ];
  return (
    <div className="mx-auto flex w-full max-w-[16rem] overflow-hidden rounded-2xl bg-[#f9f9f9] pt-2 pb-1.5 text-[#8e8e93] shadow-sm" style={{ colorScheme: 'light' }} aria-hidden="true">
      {tabs.map((t, i) => (
        <span key={t.label} className="flex min-w-0 flex-1 flex-col items-center" style={{ color: i === 1 ? '#007aff' : undefined }}>
          <span className="relative">
            <t.icon size={22} />
            {t.b && (
              <span className="absolute -top-1.5 left-3">
                <CountBadge label={t.b} ring="#f9f9f9" />
              </span>
            )}
          </span>
          <span className="mt-0.5 text-[10px] font-medium">{t.label}</span>
        </span>
      ))}
    </div>
  );
}

export function ZeroExample({ good = false }: { good?: boolean }) {
  return <Bar calls={good ? null : '0'} updates={null} />;
}

export function CapExample({ good = false }: { good?: boolean }) {
  return <Bar calls={null} updates={good ? '99+' : '1284'} />;
}

export function StatusExample({ good = false }: { good?: boolean }) {
  const items = [
    { name: 'Trail runner 2', price: '€79.20', kind: 'sale' as const, dot: '#e0453a' },
    { name: 'City sneaker', price: '€89.00', kind: 'new' as const, dot: '#23853a' },
  ];
  return (
    <div className="space-y-1.5" style={{ colorScheme: 'light' }}>
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] text-black shadow-sm">
          {!good && <span className="size-2.5 shrink-0 rounded-full" style={{ background: it.dot }} aria-hidden="true" />}
          <span className="min-w-0 flex-1 truncate font-medium">{it.name}</span>
          <span className="text-[12px] text-[#3c3c43]">{it.price}</span>
          {good && <StatusPill kind={it.kind} />}
        </div>
      ))}
    </div>
  );
}
