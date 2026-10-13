import { ImageIcon, ShoppingCart } from 'lucide-react';
import type { Opts, Sim } from './perf-sim';

/* The sample shop page, drawn as it looks at time `t` of the simulated load. */

const W = 240;
const H = 320;
const products = [
  { name: 'Linen shirt', price: '€29', hue: '#f4c27a' },
  { name: 'Straw hat', price: '€19', hue: '#9fd3c7' },
  { name: 'Sandals', price: '€39', hue: '#f2a7a0' },
  { name: 'Sunglasses', price: '€24', hue: '#b9b4f0' },
  { name: 'Beach towel', price: '€15', hue: '#8ec5f2' },
  { name: 'Tote bag', price: '€22', hue: '#d6c49a' },
];

export function ShopPreview({
  sim,
  opts,
  t,
  scale = 1,
  cart = 0,
  busy = false,
  onAdd,
}: {
  sim: Sim;
  opts: Opts;
  t: number;
  scale?: number;
  cart?: number;
  busy?: boolean;
  onAdd?: () => void;
}) {
  const painted = t >= sim.fcp;
  const heroShown = t >= sim.heroAt;
  const banner = t >= sim.bannerAt;
  const productsShown = t >= sim.productsAt;
  const shift = sim.shifts.find((s) => t >= s.t && t < s.t + 700);
  const interactive = onAdd && productsShown;

  return (
    <div style={{ width: W * scale, height: H * scale }} className="relative shrink-0 overflow-hidden rounded-lg border border-[#d7dae3] bg-white">
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="relative overflow-hidden font-sans text-[#14161f]">
        {!painted ? (
          <div className="grid h-full place-items-center text-[11px] text-[#a0a4b0]">{scale === 1 ? 'Blank screen: nothing painted yet' : ''}</div>
        ) : (
          <div className={shift ? 'outline-2 -outline-offset-2 outline-[#e5484d] outline-dashed' : ''} style={{ minHeight: H }}>
            <div className="flex items-center justify-between border-b border-[#eceef3] px-3 py-2">
              <span className="text-[13px] font-extrabold tracking-tight">
                Shop<span className="text-[#e8590c]">Co</span>
              </span>
              <span className="relative text-[#14161f]">
                <ShoppingCart size={16} aria-hidden="true" />
                {cart > 0 && <span className="absolute -top-1.5 -right-2 grid size-3.5 place-items-center rounded-full bg-[#e8590c] text-[8px] font-bold text-white">{cart}</span>}
              </span>
            </div>
            {banner ? (
              <div className="flex h-[26px] items-center justify-center bg-[#0f766e] text-[10px] font-semibold text-white">Free delivery over €30 · today only</div>
            ) : opts.reserve ? (
              <div className="h-[26px] bg-[#f1f3f7]" />
            ) : null}
            <div className="px-3 pt-2.5">
              {heroShown ? (
                <div className="relative h-[100px] overflow-hidden rounded-lg" style={{ background: 'linear-gradient(135deg,#ffd29d 0%,#ff9a76 45%,#6a8dff 100%)' }}>
                  <div className="absolute -right-4 -bottom-6 size-20 rounded-full bg-[#ffe9a8]/70" />
                  <p className="absolute top-3 left-3 text-[16px] leading-tight font-extrabold text-white drop-shadow">
                    Summer sale
                    <br />
                    up to −30%
                  </p>
                </div>
              ) : opts.reserve ? (
                <div className="grid h-[100px] place-items-center rounded-lg bg-[#eef0f4] text-[#b6bac6]">
                  <ImageIcon size={20} aria-hidden="true" />
                </div>
              ) : null}
              <p className="mt-2.5 text-[12px] font-bold">Bestsellers</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {productsShown
                  ? products.map((p, i) => {
                      const loadedAt = sim.productImgAt[i];
                      const loaded = loadedAt !== undefined && t >= loadedAt;
                      const lazySkipped = opts.lazy && i >= 2;
                      return (
                        <div key={p.name} className="rounded-md border border-[#eceef3] p-1.5">
                          {loaded ? (
                            <div className="h-[46px] rounded" style={{ background: `linear-gradient(160deg, ${p.hue}, #fff)` }} />
                          ) : opts.reserve || lazySkipped ? (
                            <div className="h-[46px] rounded bg-[#f1f3f7]" />
                          ) : null}
                          <p className="mt-1 truncate text-[10px] font-semibold">{p.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5b6170]">{p.price}</span>
                            {i === 0 &&
                              (onAdd ? (
                                <button
                                  type="button"
                                  disabled={!interactive || busy}
                                  onClick={onAdd}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white disabled:cursor-default"
                                  style={{ background: busy ? '#9a3412' : '#e8590c' }}
                                >
                                  {busy ? '…' : 'Add'}
                                </button>
                              ) : (
                                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: '#e8590c' }}>
                                  Add
                                </span>
                              ))}
                          </div>
                        </div>
                      );
                    })
                  : opts.reserve
                    ? [0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-md border border-[#eceef3] p-1.5">
                          <div className="h-[46px] rounded bg-[#f1f3f7]" />
                          <div className="mt-1.5 h-2 w-3/4 rounded bg-[#f1f3f7]" />
                          <div className="mt-1 h-2 w-1/3 rounded bg-[#f1f3f7]" />
                        </div>
                      ))
                    : null}
              </div>
            </div>
          </div>
        )}
        {shift && (
          <span className="absolute right-1.5 bottom-1.5 rounded-full bg-[#e5484d] px-2 py-0.5 text-[10px] font-bold text-white shadow">Layout shift +{shift.value.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}
