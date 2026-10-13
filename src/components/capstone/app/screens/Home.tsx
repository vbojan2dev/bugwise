import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Beef, CakeSlice, ChevronDown, Fish, Flame, MapPin, Pizza, Salad, Sandwich, Search, Soup, Star, WifiOff, X } from 'lucide-react';
import { CUISINES, RESTAURANTS, USER, type Cuisine, type Restaurant } from '../data';
import { CUISINE_LABEL, clockOf, hhmm } from '../i18n';
import { feeIn } from '../pricing';
import { useApp } from '../context';
import { Spinner } from '../ui';

export interface HomeFilters {
  q: string;
  open: boolean;
  top: boolean;
  fast: boolean;
  cuisine: Cuisine | null;
}
export const emptyFilters: HomeFilters = { q: '', open: false, top: false, fast: false, cuisine: null };

export const CUISINE_ICON: Record<Cuisine, typeof Pizza> = {
  pizza: Pizza,
  balkan: Beef,
  asian: Fish,
  american: Sandwich,
  mexican: Flame,
  indian: Soup,
  healthy: Salad,
  desserts: CakeSlice,
};

export const isOpenAt = (r: Restaurant, minutes: number) => minutes >= r.hours[0] && minutes < r.hours[1];
const lower = (s: string) => s.toLowerCase();
const fold = (s: string) => s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();

export function Home({
  filters,
  setFilters,
  loaded,
  setLoaded,
  onOpen,
}: {
  filters: HomeFilters;
  setFilters: (fn: (f: HomeFilters) => HomeFilters) => void;
  loaded: boolean;
  setLoaded: (v: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const { t, lang, api, net, now, money, cur, seen, active, landscape } = useApp();
  const [loading, setLoading] = useState(!loaded);
  const [failed, setFailed] = useState(false);
  const minutes = clockOf(now);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api('GET', '/api/restaurants?near=10435', { ms: 600 })
      .then(() => {
        setLoaded(true);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setFailed(true);
      });
  }, [api, setLoaded]);

  useEffect(() => {
    if (!loaded) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log server-side search requests (debounced), like the real app does.
  useEffect(() => {
    const q = filters.q.trim();
    if (!q || !loaded) return;
    const id = window.setTimeout(() => {
      api('GET', `/api/search?q=${encodeURIComponent(q)}`, { ms: 300 }).catch(() => {});
    }, 450);
    return () => clearTimeout(id);
  }, [filters.q, loaded, api]);

  const qn = filters.q.trim();
  const matchWith = (norm: (s: string) => string) => (r: Restaurant) => {
    if (!qn) return true;
    const q = norm(qn);
    return norm(r.name).includes(q) || norm(CUISINE_LABEL[r.cuisine][lang]).includes(q) || r.dishes.some((d) => norm(d.name).includes(q));
  };
  // BUG B03: search only lowercases; it doesn't ignore accents (cevapi ≠ Ćevapi).
  const searched = RESTAURANTS.filter(matchWith(lower));
  const base = searched
    .filter((r) => !filters.top || r.rating >= 4.6)
    .filter((r) => !filters.fast || r.eta[1] <= 30)
    .filter((r) => !filters.cuisine || r.cuisine === filters.cuisine);
  const shown = (filters.open ? base.filter((r) => isOpenAt(r, minutes)) : base).slice().sort((a, b) => Number(isOpenAt(b, minutes)) - Number(isOpenAt(a, minutes)));
  // BUG B04: the count is taken before the "Open now" filter is applied.
  const count = base.length;
  const foldedCount = useMemo(() => (qn ? RESTAURANTS.filter(matchWith(fold)).length : 0), [qn, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = loaded && !loading;
  useEffect(() => {
    if (!active || !ready) return;
    if (count !== shown.length) seen('B04', 'home');
  }, [active, ready, count, shown.length, seen]);
  useEffect(() => {
    if (!active || !ready || !qn) return;
    if (foldedCount > searched.length) seen('B03', 'home');
  }, [active, ready, qn, foldedCount, searched.length, seen]);

  // BUG B05 detection: a long name runs into the rating badge on a visible card.
  const listRef = useRef<HTMLDivElement>(null);
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list || !active) return;
    const view = list.getBoundingClientRect();
    list.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
      const name = card.querySelector<HTMLElement>('[data-name]');
      const badge = card.querySelector<HTMLElement>('[data-rating]');
      if (!name || !badge) return;
      const c = card.getBoundingClientRect();
      const visible = c.bottom > view.top + 20 && c.top < view.bottom - 20;
      if (visible && name.getBoundingClientRect().right > badge.getBoundingClientRect().left + 2) seen('B05', 'home');
    });
  }, [active, seen]);
  useLayoutEffect(() => {
    if (ready) measure();
  });
  const rafRef = useRef(0);
  const onScroll = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(measure);
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const chip = (on: boolean, label: string, toggle: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={toggle}
      className="t13 shrink-0 rounded-full border px-3 py-1.5 font-medium whitespace-nowrap"
      style={on ? { background: 'var(--fg)', color: 'var(--bg)', borderColor: 'var(--fg)' } : { background: 'var(--sf)', borderColor: 'var(--line)' }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 bg-(--sf) px-4 pt-2 pb-2">
        <p className="t12 flex items-center gap-1 text-(--sub)">
          <MapPin size={13} aria-hidden="true" /> {t('deliverTo')}
        </p>
        <p className="t15 flex items-center gap-1 font-semibold">
          <span className="truncate">{USER.home.split(',')[0]}</span> <ChevronDown size={15} aria-hidden="true" />
        </p>
        <div className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-(--sf2) px-3">
          <Search size={16} aria-hidden="true" className="shrink-0 text-(--sub)" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder={t('searchPh')}
            aria-label={t('searchLabel')}
            className="t15 h-full w-0 min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--sub) [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.q && (
            <button type="button" onClick={() => setFilters((f) => ({ ...f, q: '' }))} aria-label={t('clearSearch')} className="grid size-7 place-items-center rounded-full text-(--sub)">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div role="group" aria-label={t('filters')} className="noscroll flex shrink-0 gap-2 overflow-x-auto border-b border-(--line) bg-(--sf) px-4 pb-2.5">
        {chip(filters.open, t('openNow'), () => setFilters((f) => ({ ...f, open: !f.open })))}
        {chip(filters.top, t('topRated'), () => setFilters((f) => ({ ...f, top: !f.top })))}
        {chip(filters.fast, t('fast'), () => setFilters((f) => ({ ...f, fast: !f.fast })))}
        {CUISINES.map((c) => chip(filters.cuisine === c, CUISINE_LABEL[c][lang], () => setFilters((f) => ({ ...f, cuisine: f.cuisine === c ? null : c }))))}
      </div>
      {net === 'offline' && ready && (
        <p role="status" className="t12 flex shrink-0 items-center gap-1.5 bg-(--warnsoft) px-4 py-1.5 text-(--warn)">
          <WifiOff size={13} aria-hidden="true" /> {t('offlineBanner')}
        </p>
      )}
      <div ref={listRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        {!ready ? (
          failed ? (
            <div className="px-4 pt-16 text-center">
              <WifiOff size={28} aria-hidden="true" className="mx-auto text-(--sub)" />
              <p className="t15 mt-2 font-semibold">{t('loadError')}</p>
              <p className="t13 text-(--sub)">{t('errOffline')}</p>
              <button type="button" onClick={load} className="t14 mt-3 rounded-full bg-(--brand) px-4 py-2 font-semibold text-white">
                {t('retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-3" aria-busy="true" aria-label={t('loading')}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="pulse h-[150px] rounded-2xl bg-(--sf2)" />
              ))}
            </div>
          )
        ) : (
          <>
            <p className="t13 mb-2 px-1 font-medium text-(--sub)" aria-live="polite">
              {count === 1 ? t('count1') : t('count', { n: count })}
            </p>
            {shown.length === 0 ? (
              <div className="px-4 pt-10 text-center">
                <p className="t15 font-semibold">{t('noResults')}</p>
                <p className="t13 text-(--sub)">{t('noResultsSub')}</p>
                <button type="button" onClick={() => setFilters(() => emptyFilters)} className="t14 mt-3 rounded-full border border-(--line) bg-(--sf) px-4 py-2 font-semibold">
                  {t('clearFilters')}
                </button>
              </div>
            ) : (
              <ul className={`grid gap-3 ${landscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {shown.map((r) => {
                  const open = isOpenAt(r, minutes);
                  const Icon = CUISINE_ICON[r.cuisine];
                  const dish = qn ? r.dishes.find((d) => lower(d.name).includes(lower(qn))) : undefined;
                  return (
                    <li key={r.id} data-card className="min-w-0">
                      <button type="button" onClick={() => onOpen(r.id)} className="block w-full overflow-hidden rounded-2xl bg-(--sf) text-left shadow-[0_1px_2px_rgba(0,0,0,.08)]">
                        <span
                          className="relative grid h-[78px] place-items-center"
                          style={{ background: `linear-gradient(135deg, hsl(${r.hue} 75% 62%), hsl(${r.hue + 25} 70% 45%))`, filter: open ? undefined : 'saturate(.35)' }}
                        >
                          <Icon size={34} aria-hidden="true" className="text-white/90" />
                          {!open && (
                            <span className="t12 absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 font-semibold text-white">
                              {t('closed')} · {t('opensAt', { t: hhmm(r.hours[0]) })}
                            </span>
                          )}
                        </span>
                        <span className="relative block px-3 pt-2 pb-2.5">
                          {/* BUG B05: nowrap name without truncation; the rating badge is absolutely positioned on top of the same line. */}
                          <span data-name className="t15 relative z-10 inline-block font-semibold whitespace-nowrap">
                            {r.name}
                          </span>
                          <span data-rating className="t12 absolute top-2 right-3 flex items-center gap-0.5 rounded-md bg-(--sf2) px-1.5 py-0.5 font-semibold" aria-label={t('rating', { r: r.rating })}>
                            <Star size={12} aria-hidden="true" className="fill-current text-(--star)" />
                            {r.rating.toFixed(1)}
                          </span>
                          <span className="t12 mt-0.5 block truncate text-(--sub)">
                            {CUISINE_LABEL[r.cuisine][lang]} · {t('minutes', { a: r.eta[0], b: r.eta[1] })} · {money(feeIn(cur))} {t('delivery')}
                          </span>
                          {dish && <span className="t12 mt-0.5 block truncate text-(--brandfg)">{t('matches', { d: dish.name })}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {loading && loaded && (
          <span className="absolute top-2 right-3">
            <Spinner size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
