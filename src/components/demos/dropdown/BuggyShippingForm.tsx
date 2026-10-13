import { useState } from 'react';
import { ChevronDown, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';
import { Combobox, Select, type Opt } from './Dropdown';

/*
 * A deliberately broken checkout form. Bugs (don't spoil them for learners!):
 *  1. City is not reset when the country changes, so "Srbija + Zagreb" can be ordered.
 *  2. Country search is case- and accent-sensitive ("hrv" or "Cesk" find nothing).
 *  3. The delivery-slot menu is clipped by its card (overflow: hidden), so the last slots can't be clicked.
 *  4. The city dropdown is a plain <div>: it can't be reached with Tab or used with the keyboard.
 *  5. The city dropdown doesn't close when you click outside it.
 *  6. City lists are not sorted and contain duplicates ("Split" twice).
 */

const countries: Opt[] = ['Bosna i Hercegovina', 'Crna Gora', 'Česká republika', 'Hrvatska', 'Magyarország', 'Österreich', 'Polska', 'Slovenija', 'Srbija'].map((c) => ({ value: c, label: c }));

// BUG 6: unsorted, with duplicates, straight from the warehouse database
const cities: Record<string, string[]> = {
  'Bosna i Hercegovina': ['Sarajevo', 'Tuzla', 'Banja Luka', 'Mostar', 'Bihać', 'Mostar'],
  'Crna Gora': ['Podgorica', 'Kotor', 'Budva', 'Nikšić', 'Bar'],
  'Česká republika': ['Praha', 'Ostrava', 'Brno', 'Plzeň', 'České Budějovice', 'Olomouc', 'Brno'],
  Hrvatska: ['Zagreb', 'Split', 'Osijek', 'Rijeka', 'Split', 'Zadar', 'Šibenik', 'Dubrovnik', 'Pula'],
  Magyarország: ['Budapest', 'Szeged', 'Debrecen', 'Pécs', 'Győr'],
  Österreich: ['Wien', 'Linz', 'Graz', 'Salzburg', 'Innsbruck', 'Graz'],
  Polska: ['Warszawa', 'Łódź', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań'],
  Slovenija: ['Ljubljana', 'Maribor', 'Koper', 'Celje', 'Kranj', 'Novo Mesto'],
  Srbija: ['Beograd', 'Niš', 'Novi Sad', 'Subotica', 'Kragujevac', 'Novi Sad'],
};

const slots: Opt[] = ['Tomorrow, 08:00–12:00', 'Tomorrow, 12:00–16:00', 'Tomorrow, 16:00–20:00', 'Saturday, 09:00–13:00', 'Saturday, 13:00–17:00'].map((s) => ({ value: s, label: s }));

const inputCls = 'h-10 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-[14px] text-[#18181b] outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_#2563eb33]';

export function BuggyShippingForm() {
  const [name, setName] = useState('Anna Kovač');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [street, setStreet] = useState('Ilica 42');
  const [slot, setSlot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string | null>(null);

  const placeOrder = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your name';
    if (!country) e.country = 'Choose a country';
    if (!city) e.city = 'Choose a city';
    if (!street.trim()) e.street = 'Enter your street and number';
    if (!slot) e.slot = 'Choose a delivery slot';
    setErrors(e);
    if (Object.keys(e).length) return;
    setOrder(JSON.stringify({ name: name.trim(), street: street.trim(), city, country, slot }, null, 2));
  };

  const restart = () => {
    setName('Anna Kovač');
    setCountry('');
    setCity('');
    setCityOpen(false);
    setStreet('Ilica 42');
    setSlot('');
    setErrors({});
    setOrder(null);
  };

  const clearErr = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));
  const cityList = country ? cities[country] : [];

  return (
    <div className="flex w-full max-w-[380px] min-w-0 flex-col items-center gap-4">
      <BrowserFrame url="shop.example.com">
        <div className="bg-[#f6f7fb] px-3 py-4 text-[#18181b] sm:px-4">
          {order ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#ecfdf3] text-[#067647]">
                <PackageCheck size={24} />
              </span>
              <p className="mt-3 text-lg font-bold">Order placed!</p>
              <p className="mt-1 text-[14px] text-[#52525b]">
                Shipping to {street}, {city}, {country}
              </p>
              <button type="button" onClick={restart} className="mt-5 rounded-lg border border-[#d0d5dd] px-4 py-2 text-[14px] font-medium">
                Back to shop
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[18px] font-bold">Checkout</p>
              <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-[13px] font-semibold tracking-wide text-[#71717a] uppercase">Shipping address</p>
                <div>
                  <label htmlFor="bsf-name" className="mb-1.5 block text-sm font-medium">
                    Full name
                  </label>
                  <input
                    id="bsf-name"
                    className={inputCls}
                    value={name}
                    autoComplete="name"
                    onChange={(e) => {
                      setName(e.target.value);
                      clearErr('name');
                    }}
                  />
                  {errors.name && <p className="mt-1 text-[12px] text-[#dc2626]">{errors.name}</p>}
                </div>
                <Combobox
                  label="Country"
                  placeholder="Search country…"
                  options={countries}
                  value={country}
                  onChange={(v) => {
                    setCountry(v); // BUG 1: city is not reset
                    clearErr('country');
                  }}
                  filter={(label, q) => label.includes(q.trim()) /* BUG 2 */}
                  error={errors.country || undefined}
                  maxVisible={5}
                />
                {/* BUG 4 + 5: a <div> dropdown with no keyboard support and no outside-click handling */}
                <div className="relative">
                  <p className="mb-1.5 text-sm font-medium">City</p>
                  <div
                    onClick={() => setCityOpen((o) => !o)}
                    className="flex h-10 cursor-pointer items-center rounded-lg border bg-white px-3 text-[14px] select-none"
                    style={{ borderColor: errors.city ? '#dc2626' : cityOpen ? '#2563eb' : '#d0d5dd', boxShadow: cityOpen ? '0 0 0 3px #2563eb33' : undefined }}
                  >
                    <span className="flex-1 truncate" style={{ color: city ? '#18181b' : '#a1a1aa' }}>
                      {city || 'Select a city'}
                    </span>
                    <ChevronDown size={18} className="text-[#52525b]" style={{ transform: cityOpen ? 'rotate(180deg)' : undefined }} />
                  </div>
                  {errors.city && <p className="mt-1 text-[12px] text-[#dc2626]">{errors.city}</p>}
                  {cityOpen && (
                    <div className="absolute inset-x-0 top-[66px] z-30 max-h-44 overflow-y-auto rounded-[10px] bg-white py-1 text-[14px] shadow-[0_12px_32px_-8px_rgba(16,24,40,.25),0_0_0_1px_rgba(16,24,40,.08)]">
                      {cityList.length === 0 && <div className="px-3 py-2 text-[#71717a]">Choose a country first</div>}
                      {cityList.map((c, i) => (
                        <div
                          key={`${c}-${i}`}
                          onClick={() => {
                            setCity(c);
                            setCityOpen(false);
                            clearErr('city');
                          }}
                          className={`mx-1 cursor-pointer rounded-md px-3 py-2 hover:bg-[#eff6ff] ${c === city ? 'font-semibold' : ''}`}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="bsf-street" className="mb-1.5 block text-sm font-medium">
                    Street and number
                  </label>
                  <input
                    id="bsf-street"
                    className={inputCls}
                    value={street}
                    autoComplete="street-address"
                    onChange={(e) => {
                      setStreet(e.target.value);
                      clearErr('street');
                    }}
                  />
                  {errors.street && <p className="mt-1 text-[12px] text-[#dc2626]">{errors.street}</p>}
                </div>
              </div>

              {/* BUG 3: overflow-hidden (for the rounded header stripe) clips the slot menu */}
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2.5 text-[13px] font-semibold text-white">
                  <Truck size={16} /> Free delivery over €50
                </div>
                <div className="space-y-3 p-4">
                  <Select label="Delivery slot" placeholder="Choose a slot" options={slots} value={slot} onChange={(v) => { setSlot(v); clearErr('slot'); }} flip={false} error={errors.slot || undefined} />
                  <button type="button" onClick={placeOrder} className="h-10 w-full rounded-lg bg-[#2563eb] text-[15px] font-semibold text-white hover:bg-[#1d4ed8]">
                    Place order · €64.90
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </BrowserFrame>

      <div className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-3 py-2.5">
        <p className="text-xs text-muted">Try the mouse and the keyboard (Tab, arrows, Enter, Esc).</p>
        <button type="button" onClick={restart} className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
        <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network log</p>
        <div className="min-h-[4.5rem] px-3 py-2">
          {order ? (
            <>
              <p>
                <span className="text-[#7dd3fc]">POST</span> /api/orders <span className="text-[#34d399]">201</span>
              </p>
              <pre className="mt-1 break-all whitespace-pre-wrap text-[#e2e8f0]">{order}</pre>
            </>
          ) : (
            <p className="text-white/35">Place the order to see the request body…</p>
          )}
        </div>
      </div>
    </div>
  );
}
