import { useId, useState } from 'react';
import { Select, type Opt } from './Dropdown';
import { toOptions } from './data';

/** Native radio buttons: every option visible, one tap to choose. */
export function RadioExample({ label, options, initial = 0 }: { label: string; options: string[]; initial?: number }) {
  const id = useId();
  const [v, setV] = useState(options[initial]);
  return (
    <fieldset className="text-[#18181b]">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-[#e4e4e7] bg-white px-3 text-[15px] has-[:checked]:border-[#2563eb] has-[:checked]:bg-[#eff6ff]">
            <input type="radio" name={id} checked={v === o} onChange={() => setV(o)} className="size-4 accent-[#2563eb]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A dropdown frozen in a given state, for Do/Don't comparisons. */
export function SelectExample({ label, options, value = '', placeholder, open = false, error, helper }: { label: string; options: string[]; value?: string; placeholder?: string; open?: boolean; error?: string; helper?: string }) {
  const [v, setV] = useState(value);
  const opts: Opt[] = toOptions(options);
  return <Select label={label} options={opts} value={v} onChange={setV} placeholder={placeholder} staticOpen={open} error={error} helper={helper} maxVisible={5} />;
}
