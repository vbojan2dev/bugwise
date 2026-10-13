import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, ShoppingBag, X } from 'lucide-react';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

function Card({ title, platform, note, chips, children }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-[200px] place-items-center px-3 py-5" style={{ background: '#e9ebf2', colorScheme: 'light' }}>
        <div className="w-full max-w-[300px] min-w-0 rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {c}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function Url({ children }: { children: ReactNode }) {
  return <p className="truncate border-b border-black/10 bg-[#f6f7fb] px-3 py-1.5 font-mono text-[10px] text-black/45">{children}</p>;
}

function Lines() {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="h-2 w-4/5 rounded bg-black/10" />
      <div className="h-2 w-3/5 rounded bg-black/10" />
    </div>
  );
}

const trail: Crumb[] = [
  { label: 'Home', path: '/' },
  { label: 'Camping', path: '/c/camping' },
  { label: 'Tents', path: '/c/camping/tents' },
  { label: 'Backpacking tents', path: '/c/camping/tents/backpacking' },
  { label: 'Trailhead UltraLight 2-Person Tent', path: '/p/trailhead-2p' },
];

function Clicked({ path }: { path: string | null }) {
  return <p className="mt-2 h-4 truncate font-mono text-[10px] text-[#1d4ed8]">{path ? `→ opens ${path}` : ''}</p>;
}

function Location() {
  const [to, setTo] = useState<string | null>(null);
  return (
    <>
      <Url>shop.example.com/c/camping/tents</Url>
      <div className="p-3">
        <Breadcrumbs items={trail.slice(0, 3)} onNavigate={(c) => setTo(c.path)} />
        <p className="mt-2 text-[16px] font-bold">Tents</p>
        <Lines />
        <Clicked path={to} />
      </div>
    </>
  );
}

function PathBased() {
  return (
    <>
      <Url>shop.example.com/p/storm-lantern</Url>
      <div className="p-3">
        <nav aria-label="Breadcrumb" className="text-[12px]">
          <ol className="flex flex-wrap items-center">
            {['Home', 'Search: “lantern”', 'Compare (3)'].map((l) => (
              <li key={l} className="flex items-center">
                <a href="#path" onClick={(e) => e.preventDefault()} className="text-[#1d4ed8] hover:underline">
                  {l}
                </a>
                <ChevronRight size={13} className="mx-0.5 text-black/35" aria-hidden="true" />
              </li>
            ))}
            <li>
              <span aria-current="page" className="font-semibold text-black/80">
                Storm Lantern
              </span>
            </li>
          </ol>
        </nav>
        <p className="mt-2 text-[16px] font-bold">Storm Lantern</p>
        <Lines />
      </div>
    </>
  );
}

function Attribute() {
  const [filters, setFilters] = useState(['2-person', 'Under $200']);
  return (
    <>
      <Url>shop.example.com/c/tents?people=2&amp;max=200</Url>
      <div className="p-3">
        <nav aria-label="Breadcrumb" className="text-[12px]">
          <ol className="flex flex-wrap items-center gap-y-1">
            <li className="flex items-center">
              <a href="#tents" onClick={(e) => e.preventDefault()} className="text-[#1d4ed8] hover:underline">
                Tents
              </a>
            </li>
            {filters.map((f) => (
              <li key={f} className="flex items-center">
                <ChevronRight size={13} className="mx-0.5 text-black/35" aria-hidden="true" />
                <span className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.06] py-0.5 pr-0.5 pl-2 font-medium">
                  {f}
                  <button
                    type="button"
                    aria-label={`Remove filter ${f}`}
                    onClick={() => setFilters((fs) => fs.filter((x) => x !== f))}
                    className="grid size-5 place-items-center rounded-full hover:bg-black/10"
                  >
                    <X size={11} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-2 text-[13px] text-black/55">{filters.length === 2 ? '7 tents' : filters.length === 1 ? '18 tents' : '42 tents'}</p>
        {filters.length < 2 && (
          <button type="button" onClick={() => setFilters(['2-person', 'Under $200'])} className="mt-1 text-[11px] font-medium text-[#1d4ed8] underline">
            Reset filters
          </button>
        )}
        <Lines />
      </div>
    </>
  );
}

function Collapsed() {
  const [to, setTo] = useState<string | null>(null);
  return (
    <>
      <Url>shop.example.com/p/trailhead-2p</Url>
      <div className="min-h-[150px] p-3">
        <Breadcrumbs items={trail} mode="collapse" onNavigate={(c) => setTo(c.path)} />
        <Clicked path={to} />
        <Lines />
      </div>
    </>
  );
}

function BackLink() {
  const [to, setTo] = useState<string | null>(null);
  return (
    <>
      <Url>shop.example.com/p/trailhead-2p</Url>
      <div className="p-3">
        <Breadcrumbs items={trail} mode="parent" onNavigate={(c) => setTo(c.path)} />
        <p className="mt-2 text-[15px] leading-snug font-bold">Trailhead UltraLight 2-Person Tent</p>
        <Clicked path={to} />
        <Lines />
      </div>
    </>
  );
}

function NativeApp() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#f2f2f7]">
      <div className="flex items-center justify-between bg-white/90 px-2 py-2 text-[#007aff]">
        <span className="flex items-center text-[14px]">
          <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />
          Tents
        </span>
        <span className="flex gap-3 pr-1">
          <Search size={17} aria-hidden="true" />
          <ShoppingBag size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="p-3">
        <p className="text-[18px] leading-tight font-bold text-black">Trailhead 2P Tent</p>
        <p className="text-[12px] text-black/50">$189 · 2-person</p>
        <div className="mt-2 h-16 rounded-lg bg-[#2f6b4f]/80" />
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        title="Location-based"
        platform="Web"
        note="Shows where the page lives in the site's hierarchy, no matter how the user got there. The most common and most useful type."
        chips={['Default choice', 'Matches the URL']}
      >
        <Location />
      </Card>
      <Card
        title="Path-based (history)"
        platform="Web"
        note="Shows the pages the user visited. It repeats what the browser's Back button already does and changes every visit, so most guidelines advise against it."
        chips={['Rare', 'Unstable']}
      >
        <PathBased />
      </Card>
      <Card
        title="Attribute-based"
        platform="Web"
        note="Shows the filters that narrowed a list. Often built like chips you can remove. Try removing a filter."
        chips={['Shops', 'Filters']}
      >
        <Attribute />
      </Card>
      <Card
        title="Collapsed on small screens"
        platform="Mobile web"
        note="Keeps the first level and the last two, and hides the middle behind a … button. Tap it: every hidden level must still be reachable."
        chips={['Responsive', 'Menu']}
      >
        <Collapsed />
      </Card>
      <Card
        title="Back to parent"
        platform="Mobile web"
        note="On narrow screens many shops show only the parent level as a ‹ link. Short and easy to tap, but it hides how deep the page is."
        chips={['Compact', 'One level']}
      >
        <BackLink />
      </Card>
      <Card
        title="Native apps: no breadcrumb"
        platform="iOS / Android"
        note="Apps use the back button in the navigation bar (and the system Back gesture on Android) instead. Breadcrumbs are a web pattern."
        chips={['Navigation bar', 'Back button']}
      >
        <NativeApp />
      </Card>
    </div>
  );
}
