import type { LucideIcon } from 'lucide-react';
import { CircleCheck, CloudOff, Lock, Receipt, SearchX, WifiOff } from 'lucide-react';
import { EmptyState, ink } from './States';

const types: {
  name: string;
  when: string;
  how: string;
  screen: string;
  icon: LucideIcon;
  tone: 'neutral' | 'error' | 'warn';
  title: string;
  body: string;
  primary?: string;
  secondary?: string;
}[] = [
  {
    name: 'First use',
    when: 'A brand-new user, nothing created yet.',
    how: 'Sign up with a fresh test account.',
    screen: 'Orders',
    icon: Receipt,
    tone: 'neutral',
    title: 'No orders yet',
    body: 'When you order food, you\'ll find your orders and receipts here.',
    primary: 'Browse restaurants',
  },
  {
    name: 'User cleared',
    when: 'The user finished or deleted everything.',
    how: 'Delete, archive or complete every item.',
    screen: 'Inbox',
    icon: CircleCheck,
    tone: 'neutral',
    title: 'All caught up',
    body: 'You\'ve read every message. New ones will appear here.',
  },
  {
    name: 'No results',
    when: 'A search or filter matches nothing.',
    how: 'Search for "zzqx" or combine filters that exclude everything.',
    screen: 'Search',
    icon: SearchX,
    tone: 'neutral',
    title: 'No results for "sushi vegan gluten-free"',
    body: 'Check the spelling or remove a filter.',
    primary: 'Clear filters',
  },
  {
    name: 'No permission',
    when: 'Data exists, but this user may not see it.',
    how: 'Log in with a lower role, or deny an OS permission.',
    screen: 'Team orders',
    icon: Lock,
    tone: 'warn',
    title: 'Only admins can see team orders',
    body: 'Ask an admin of Acme Ltd. to give you access.',
    primary: 'Request access',
  },
  {
    name: 'Offline',
    when: 'The device has no connection.',
    how: 'Airplane mode, Wi-Fi off, or a proxy that blocks requests.',
    screen: 'Orders',
    icon: WifiOff,
    tone: 'warn',
    title: 'You\'re offline',
    body: 'Check your connection. We\'ll reload as soon as you\'re back.',
    primary: 'Try again',
  },
  {
    name: 'Error',
    when: 'The server or the app failed.',
    how: 'Map local / breakpoint a 500, a timeout or broken JSON.',
    screen: 'Orders',
    icon: CloudOff,
    tone: 'error',
    title: 'We couldn\'t load your orders',
    body: 'This is on our side. Please try again in a moment.',
    primary: 'Try again',
    secondary: 'Contact support',
  },
];

export default function TypesGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {types.map((t) => (
        <figure key={t.name} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="px-3 pt-3 pb-3" style={{ background: '#e9ebf2' }}>
            <div className="overflow-hidden rounded-2xl border border-black/10 text-black" style={{ background: ink.bg, colorScheme: 'light' }}>
              <p className="px-3 pt-2.5 text-[13px] font-bold">{t.screen}</p>
              <EmptyState compact icon={t.icon} tone={t.tone} title={t.title} body={t.body} primary={t.primary} secondary={t.secondary} />
            </div>
          </div>
          <figcaption className="flex-1 border-t border-line p-4">
            <p className="font-semibold">{t.name}</p>
            <p className="mt-1 text-sm text-muted">{t.when}</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-brand">Create it: </span>
              <span className="text-muted">{t.how}</span>
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
