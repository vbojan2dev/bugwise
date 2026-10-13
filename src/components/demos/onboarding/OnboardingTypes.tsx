import { Dumbbell, Hand, Lightbulb, ListChecks, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

/*
 * Static gallery: five common kinds of onboarding, each drawn as a tiny phone screen on its own light surface.
 */

const P = '#7c3aed';

function Mini({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex aspect-[9/16] w-full max-w-[132px] flex-col overflow-hidden rounded-[18px] border-[5px] border-[#0c0d12] bg-white p-2 text-black" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  );
}

const bar = (w: string, c = 'rgba(60,60,67,.18)') => <span className="block h-1.5 rounded-full" style={{ width: w, background: c }} />;

const types = [
  {
    name: 'Welcome carousel',
    text: 'A few swipeable slides about the benefits. Easy to build, easy to skip.',
    screen: (
      <>
        <span className="mt-1 self-end text-[8px] font-semibold" style={{ color: P }}>
          Skip
        </span>
        <span className="mx-auto mt-3 grid size-12 place-items-center rounded-full bg-[#ede9fe]" style={{ color: P }}>
          <Dumbbell size={22} />
        </span>
        <span className="mt-3 space-y-1">
          {bar('80%', '#111')}
          {bar('95%')}
          {bar('70%')}
        </span>
        <span className="mt-auto mb-1 flex justify-center gap-1">
          <span className="h-1.5 w-3 rounded-full" style={{ background: P }} />
          <span className="size-1.5 rounded-full bg-black/20" />
          <span className="size-1.5 rounded-full bg-black/20" />
        </span>
        <span className="h-4 rounded-md" style={{ background: P }} />
      </>
    ),
  },
  {
    name: 'Interactive tutorial',
    text: 'The user learns by doing: "Swipe left to delete this sample task."',
    screen: (
      <>
        <span className="mt-2 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex items-center gap-1 rounded-md bg-[#f2f2f7] p-1.5" style={i === 1 ? { transform: 'translateX(-14px)', background: '#fee2e2' } : undefined}>
              {bar('70%')}
            </span>
          ))}
        </span>
        <span className="absolute top-[52px] right-3 text-[#111]">
          <Hand size={18} />
        </span>
        <span className="mt-auto rounded-md bg-[#111] p-1.5 text-[8px] leading-tight text-white">Swipe left to delete</span>
      </>
    ),
  },
  {
    name: 'Contextual tips',
    text: 'Small hints that appear the first time you reach a feature (coach marks, tooltips).',
    screen: (
      <>
        <span className="mt-1 space-y-1">
          {bar('60%', '#111')}
          {bar('90%')}
          {bar('85%')}
        </span>
        <span className="absolute inset-0 bg-black/45" />
        <span className="absolute right-2 bottom-8 grid size-8 place-items-center rounded-full text-white ring-4 ring-white/70" style={{ background: P }}>
          <Plus size={16} />
        </span>
        <span className="absolute right-2 bottom-[72px] left-2 rounded-md bg-white p-1.5 text-[8px] leading-tight">
          <Lightbulb size={9} className="mr-0.5 inline text-[#d97706]" /> Tap + to log your first workout
        </span>
      </>
    ),
  },
  {
    name: 'Empty-state onboarding',
    text: 'An empty screen that teaches: "No workouts yet. Log your first one."',
    screen: (
      <>
        <span className="mt-1">{bar('55%', '#111')}</span>
        <span className="my-auto flex flex-col items-center gap-1.5 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-[#f2f2f7] text-black/40">
            <Dumbbell size={18} />
          </span>
          <span className="text-[8px] leading-tight text-black/60">No workouts yet</span>
          <span className="rounded-md px-2 py-1 text-[8px] font-semibold text-white" style={{ background: P }}>
            Log your first one
          </span>
        </span>
      </>
    ),
  },
  {
    name: 'Setup wizard',
    text: 'A few required steps (account, goal, preferences) with progress and Back.',
    screen: (
      <>
        <span className="mt-1 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < 2 ? P : 'rgba(60,60,67,.18)' }} />
          ))}
        </span>
        <span className="mt-1.5 text-[7px] font-semibold" style={{ color: P }}>
          STEP 2 OF 3
        </span>
        <span className="mt-1.5 space-y-1">
          {['Beginner', 'Intermediate', 'Advanced'].map((l, i) => (
            <span key={l} className="flex items-center justify-between rounded-md bg-[#f2f2f7] px-1.5 py-1 text-[8px]" style={i === 0 ? { boxShadow: `inset 0 0 0 1.5px ${P}` } : undefined}>
              {l}
              {i === 0 && <ListChecks size={9} style={{ color: P }} />}
            </span>
          ))}
        </span>
        <span className="mt-auto h-4 rounded-md" style={{ background: P }} />
      </>
    ),
  },
];

export default function OnboardingTypes() {
  return (
    <figure className="not-prose my-8 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {types.map((t) => (
          <li key={t.name} className="min-w-0">
            <Mini>{t.screen}</Mini>
            <p className="mt-2 text-center text-[13px] font-semibold text-fg">{t.name}</p>
            <p className="mt-0.5 text-center text-[12px] leading-snug text-muted">{t.text}</p>
          </li>
        ))}
      </ul>
      <figcaption className="mt-4 text-center text-xs text-muted">Most apps combine two or three of these. Each one needs its own tests.</figcaption>
    </figure>
  );
}
