import { useState, type ReactNode } from 'react';
import { Combobox, MultiSelect, NativeSelect, Select } from './Dropdown';
import { IOSPopupButton, WheelPicker } from './IOS';
import { citiesByCountry, countries, toOptions } from './data';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: string; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col rounded-2xl border border-line bg-surface">
      <div className="grid min-h-48 place-items-center rounded-t-2xl px-5 py-7" style={{ background: bg }}>
        <div className="w-full max-w-[17.5rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

const sizes = toOptions(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const sortBy = toOptions(['Recommended', 'Price: low to high', 'Price: high to low', 'Newest', 'Best rated']);
const delivery = toOptions(['Standard', 'Express', 'Pickup point']);
const shoeSizes = toOptions(['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']);
const languages = toOptions(['English', 'Deutsch', 'Español', 'Français', 'Hrvatski', 'Italiano', 'Polski']);
const diets = toOptions(['Vegetarian', 'Vegan', 'Gluten-free', 'Lactose-free', 'Nut-free', 'Halal', 'Kosher']);

function Dependent() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const cities = country ? toOptions(citiesByCountry[country]) : [];
  return (
    <div className="space-y-3">
      <Select
        label="Country"
        placeholder="Select a country"
        options={toOptions(Object.keys(citiesByCountry))}
        value={country}
        onChange={(v) => {
          if (v !== country) setCity(''); // reset the dependent value
          setCountry(v);
        }}
      />
      <Select label="City" placeholder={country ? 'Select a city' : 'Choose a country first'} options={cities} value={city} onChange={setCity} disabled={!country} />
    </div>
  );
}

export default function VariantsGallery() {
  const [size, setSize] = useState('');
  const [sort, setSort] = useState('Recommended');
  const [del, setDel] = useState('Standard');
  const [shoe, setShoe] = useState('40');
  const [lang, setLang] = useState('English');
  const [country, setCountry] = useState('');
  const [diet, setDiet] = useState<string[]>(['Vegetarian']);

  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">All of these work: open them with the mouse, then try the keyboard (Tab, arrows, Enter, Esc, or type a letter).</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Native select" platform="Web" bg="#fff" note="A real <select>. The browser draws the list, so on phones you get the system picker for free. Hard to style, easy to trust.">
          <NativeSelect label="Size" placeholder="Choose a size" options={sizes} value={size} onChange={setSize} />
        </Demo>
        <Demo title="Custom dropdown" platform="Web" bg="#fff" note="Built from scratch to match the brand. Looks nicer, but keyboard support, screen readers and positioning are now the team's job.">
          <Select label="Sort by" options={sortBy} value={sort} onChange={setSort} />
        </Demo>
        <Demo title="Pop-up button menu" platform="iOS" note="Tap the blue value and a menu appears right there, with a checkmark on the current choice. Good for 3–7 options.">
          <IOSPopupButton label="Delivery" options={delivery} value={del} onChange={setDel} />
        </Demo>
        <Demo title="Wheel picker" platform="iOS" note="Scroll the wheel until your value sits in the band. Classic for dates, times and sizes. Test that the value actually saves when you stop.">
          <div className="rounded-[10px] bg-white px-2 py-1">
            <WheelPicker label="Shoe size (EU)" options={shoeSizes} value={shoe} onChange={setShoe} />
          </div>
          <p className="mt-2 text-center text-[13px] text-[rgba(60,60,67,.6)]">Shoe size (EU): {shoe}</p>
        </Demo>
        <Demo title="Exposed dropdown menu" platform="Android · Material 3" bg="#fef7ff" note="An outlined field with a floating label and a menu that opens underneath. The selected item gets a tinted background.">
          <Select variant="material" surface="#fef7ff" label="Language" options={languages} value={lang} onChange={setLang} />
        </Demo>
        <Demo title="Searchable combo box" platform="All" bg="#fff" note="Type to filter long lists. A good one ignores case and accents: try 'cote', 'sao tome' or 'turkiye'.">
          <Combobox label="Country" placeholder="Start typing…" options={countries} value={country} onChange={setCountry} />
        </Demo>
        <Demo title="Multi-select" platform="Web · Android" bg="#fff" note="Checkboxes inside a dropdown. The menu stays open while you pick. Test 0, 1, all, and how the field shows many choices.">
          <MultiSelect label="Dietary preferences" options={diets} value={diet} onChange={setDiet} placeholder="Any" />
        </Demo>
        <Demo title="Dependent dropdowns" platform="All" bg="#fff" note="The city list depends on the country. City stays disabled until a country is chosen, and resets when the country changes.">
          <Dependent />
        </Demo>
      </div>
    </div>
  );
}
