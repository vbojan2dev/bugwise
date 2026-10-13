import { useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Heart, House, Info, ListChecks, Package, Search, Star, User } from 'lucide-react';
import { IOSTabBar, M3Tabs, TabPanel, useTabKeys } from './Tabs';
import { Pager } from './Pager';

function Card({ title, platform, note, chips, children, bg = '#e9ebf2' }: { title: string; platform: string; note: string; chips: string[]; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid place-items-center px-4 py-5" style={{ background: bg, colorScheme: 'light' }}>
        <div className="relative h-[320px] w-full max-w-[280px] overflow-hidden rounded-[22px] border border-black/10 shadow-sm">{children}</div>
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

function Lines({ n = 6, label }: { n?: number; label: string }) {
  return (
    <div className="space-y-2 p-4">
      <p className="text-[14px] font-medium">{label}</p>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-2 rounded bg-black/10" style={{ width: `${60 + ((i * 17) % 40)}%` }} />
      ))}
    </div>
  );
}

/* 1. Material primary tabs with swipeable content */
function PrimaryDemo() {
  const [tab, setTab] = useState(0);
  const tabs = [{ label: 'Overview', icon: Info }, { label: 'Specs', icon: ListChecks }, { label: 'Reviews', icon: Star, badge: 12 }];
  const pages = [
    <Lines key="o" label="Trail runner 2, overview" n={7} />,
    <ul key="s" className="divide-y divide-black/5 px-4 text-[13px]">
      {['Weight · 280 g', 'Drop · 6 mm', 'Upper · Recycled mesh', 'Sole · Rubber lugs 4 mm', 'Fit · Regular', 'Waterproof · No'].map((r) => (
        <li key={r} className="py-2.5">
          {r}
        </li>
      ))}
    </ul>,
    <div key="r" className="space-y-2 p-4 text-[13px]">
      {['★★★★★ Great grip on wet rocks', '★★★★☆ Runs a bit small', '★★★★★ Light and comfy', '★★★☆☆ Laces too short'].map((r) => (
        <p key={r} className="rounded-xl bg-[#f3edf7] px-3 py-2">
          {r}
        </p>
      ))}
    </div>,
  ];
  return (
    <div className="flex h-full flex-col bg-[#fef7ff] text-[#1d1b20]">
      <div className="flex h-12 shrink-0 items-center gap-2 px-2">
        <ArrowLeft size={20} className="mx-1" aria-hidden="true" />
        <p className="flex-1 text-[17px]">Trail runner 2</p>
        <Heart size={20} className="mr-2" aria-hidden="true" />
      </div>
      <M3Tabs id="gal-primary" tabs={tabs} value={tab} onChange={setTab} />
      <Pager
        index={tab}
        onIndexChange={setTab}
        className="flex-1"
        pages={pages.map((p, i) => (
          <div key={i} id={`gal-primary-panel-${i}`} role="tabpanel" aria-labelledby={`gal-primary-tab-${i}`} className="h-full overflow-y-auto">
            {p}
          </div>
        ))}
      />
    </div>
  );
}

/* 2. Material secondary tabs inside a section */
function SecondaryDemo() {
  const [tab, setTab] = useState(0);
  const tabs = [{ label: 'Ingredients' }, { label: 'Steps' }, { label: 'Nutrition' }];
  const content = [
    ['400 g spaghetti', '2 eggs + 2 yolks', '150 g guanciale', '60 g pecorino', 'Black pepper'],
    ['Boil the pasta', 'Crisp the guanciale', 'Whisk eggs and cheese', 'Toss off the heat', 'Serve at once'],
    ['Energy · 640 kcal', 'Protein · 28 g', 'Carbs · 74 g', 'Fat · 24 g', 'Salt · 2.1 g'],
  ];
  return (
    <div className="flex h-full flex-col bg-[#fef7ff] text-[#1d1b20]">
      <div className="h-24 shrink-0 bg-gradient-to-br from-[#ffd8b5] to-[#f2a65a]" aria-hidden="true" />
      <div className="px-4 pt-3 pb-1">
        <p className="text-[18px] font-medium">Spaghetti carbonara</p>
        <p className="text-[12px] text-[#49454f]">25 min · 4 servings</p>
      </div>
      <M3Tabs id="gal-secondary" tabs={tabs} value={tab} onChange={setTab} variant="secondary" />
      {content.map((items, i) => (
        <TabPanel key={i} id="gal-secondary" index={i} active={i === tab} className="min-h-0 flex-1 overflow-y-auto">
          <ul className="space-y-2 p-4 text-[13px]">
            {items.map((it, k) => (
              <li key={it} className="flex gap-2">
                <span className="text-[#6750a4]">{i === 1 ? `${k + 1}.` : '•'}</span>
                {it}
              </li>
            ))}
          </ul>
        </TabPanel>
      ))}
    </div>
  );
}

/* 3. Scrollable tabs */
function ScrollableDemo() {
  const cats = ['Popular', 'Pizza', 'Sushi', 'Burgers', 'Vegan', 'Desserts', 'Drinks', 'Breakfast'];
  const [tab, setTab] = useState(0);
  return (
    <div className="flex h-full flex-col bg-[#fef7ff] text-[#1d1b20]">
      <div className="flex h-12 shrink-0 items-center px-4 text-[17px]">Pizza Roma · Menu</div>
      <M3Tabs id="gal-scroll" tabs={cats.map((label) => ({ label }))} value={tab} onChange={setTab} scrollable />
      {cats.map((c, i) => (
        <TabPanel key={c} id="gal-scroll" index={i} active={i === tab} className="min-h-0 flex-1 overflow-y-auto">
          <ul className="divide-y divide-black/5 px-4 text-[13px]">
            {[1, 2, 3, 4, 5].map((k) => (
              <li key={k} className="flex justify-between py-3">
                <span>
                  {c} item {k}
                </span>
                <span className="text-[#49454f]">€{(6 + k * 1.5).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </TabPanel>
      ))}
    </div>
  );
}

/* 4. iOS bottom tab bar: each tab keeps its own scroll; re-tapping the active tab scrolls to top. */
function IOSDemo() {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState('');
  const scrollers = useRef<(HTMLDivElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const items = [
    { label: 'Home', icon: House },
    { label: 'Search', icon: Search },
    { label: 'Orders', icon: Package, badge: 2 },
    { label: 'Account', icon: User },
  ];
  const select = (i: number) => {
    if (i === tab) {
      scrollers.current[i]?.scrollTo({ top: 0, behavior: 'smooth' });
      setToast('Tapped the active tab: back to top');
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(''), 1600);
    }
    setTab(i);
  };
  return (
    <div className="flex h-full flex-col bg-[#f2f2f7] text-black">
      <div className="relative min-h-0 flex-1">
        {items.map((it, i) => (
          <div
            key={it.label}
            ref={(el) => {
              scrollers.current[i] = el;
            }}
            role="tabpanel"
            aria-label={it.label}
            hidden={i !== tab}
            className="absolute inset-0 overflow-y-auto"
          >
            <p className="px-4 pt-4 pb-2 text-[26px] font-bold">{it.label}</p>
            <ul className="mx-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white text-[14px]">
              {Array.from({ length: 14 }, (_, k) => (
                <li key={k} className="px-3 py-2.5">
                  {it.label} row {k + 1}
                </li>
              ))}
            </ul>
            <div className="h-4" />
          </div>
        ))}
        {toast && <p className="absolute inset-x-6 bottom-2 rounded-full bg-black/75 px-3 py-1.5 text-center text-[11px] text-white">{toast}</p>}
      </div>
      <IOSTabBar id="gal-ios" items={items} value={tab} onChange={select} />
    </div>
  );
}

/* 5. Web tabs: ARIA tablist with automatic activation */
function WebDemo() {
  const tabs = ['Description', 'Shipping', 'Reviews'];
  const [tab, setTab] = useState(0);
  const { refs, onKeyDown } = useTabKeys({ count: tabs.length, value: tab, onChange: setTab });
  const text = [
    'Hand-thrown stoneware mug, 350 ml. Dishwasher and microwave safe.',
    'Free delivery over €40. Ships in 2–3 working days. Free returns within 30 days.',
    '4.7 out of 5 from 86 reviews. “Lovely glaze, keeps coffee hot.”',
  ];
  return (
    <div className="flex h-full flex-col bg-white text-[#0e1120]">
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-black/10 bg-[#f6f7fb] px-3" aria-hidden="true">
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} className="size-2 rounded-full" style={{ background: c }} />
        ))}
        <span className="mx-auto truncate rounded bg-white px-2 font-mono text-[9px] text-black/50 ring-1 ring-black/10">shop.example.com</span>
      </div>
      <div className="p-3">
        <p className="text-[16px] font-bold">Speckled mug</p>
        <p className="text-[13px] text-black/60">€24.00</p>
      </div>
      <div role="tablist" aria-label="Product information" className="flex gap-1 border-b border-black/15 px-3">
        {tabs.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`gal-web-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === tab}
            aria-controls={`gal-web-panel-${i}`}
            tabIndex={i === tab ? 0 : -1}
            onClick={() => setTab(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px rounded-t-md border px-2.5 py-1.5 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] ${
              i === tab ? 'border-black/15 border-b-white bg-white text-[#0e1120]' : 'border-transparent text-black/55 hover:text-black'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <TabPanel key={t} id="gal-web" index={i} active={i === tab} className="m-1 p-2 text-[13px] leading-relaxed">
          {text[i]}
        </TabPanel>
      ))}
      <p className="mt-auto border-t border-black/10 p-2 text-[10px] text-black/50">Try it: Tab to the tabs, then ← → Home End</p>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Every demo works. Tap the tabs, swipe the Android product page sideways, scroll a list and switch away and back, and try the web one with your keyboard.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          title="Primary tabs"
          platform="Android"
          note="Material 3 primary tabs sit right under the top app bar and switch between the main sections of one screen. The content can be swiped sideways, and the indicator follows."
          chips={['Tap', 'Swipe content', 'Badge', 'Icon + label']}
        >
          <PrimaryDemo />
        </Card>
        <Card
          title="Secondary tabs"
          platform="Android"
          note="Secondary tabs split one area of content further down the page. The indicator spans the whole tab and the labels stay neutral in color."
          chips={['Inside a section', 'Full-width indicator']}
        >
          <SecondaryDemo />
        </Card>
        <Card
          title="Scrollable tabs"
          platform="Android / web"
          note="When there are too many tabs for the width, the row scrolls sideways. The selected tab should slide into view, and a cut-off tab at the edge hints that there is more."
          chips={['Many tabs', 'Selected tab scrolls into view']}
        >
          <ScrollableDemo />
        </Card>
        <Card
          title="Tab bar (bottom)"
          platform="iOS"
          note="On iPhone, the main app sections live in a bottom tab bar. Each tab keeps its own scroll position and navigation. Tapping the active tab again scrolls to the top."
          chips={['Keeps state per tab', 'Badge', 'Tap again = top']}
        >
          <IOSDemo />
        </Card>
        <Card
          title="Tabs on the web"
          platform="Web"
          note="An ARIA tablist: role tab and tabpanel, aria-selected on the active tab, one Tab stop for the whole row, and arrow keys to move between tabs (automatic activation)."
          chips={['Arrow keys', 'Home / End', 'role="tab"']}
        >
          <WebDemo />
        </Card>
      </div>
    </div>
  );
}
