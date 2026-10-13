import { useId, useState, type ReactNode } from 'react';
import { Mail, Moon, Search, Sun } from 'lucide-react';
import { TextField } from './TextField';

type Surface = 'ios' | 'material' | 'web';
const surfaces = {
  ios: { light: '#f2f2f7', dark: '#000' },
  material: { light: '#fef7ff', dark: '#141218' },
  web: { light: '#ffffff', dark: '#09090b' },
};

function Demo({ title, platform, note, dark, surface, children }: { title: string; platform: string; note: string; dark: boolean; surface: Surface; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-44 place-items-center px-5 py-7" style={{ background: surfaces[surface][dark ? 'dark' : 'light'] }}>
        <div className="w-full max-w-[19rem]">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

/** iOS Settings-style inset grouped form: label on the left, value on the right. */
function IOSGroupedForm({ dark }: { dark: boolean }) {
  const id = useId();
  const rows = [
    { label: 'Name', placeholder: 'Required', ac: 'name' },
    { label: 'Street', placeholder: 'Street and number', ac: 'street-address' },
    { label: 'Postcode', placeholder: '10000', ac: 'postal-code', mode: 'numeric' as const },
  ];
  const fg = dark ? '#fff' : '#000';
  return (
    <div>
      <p className="mb-1.5 px-4 text-[13px] uppercase" style={{ color: dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)' }}>
        Delivery address
      </p>
      <div className="overflow-hidden rounded-[10px]" style={{ background: dark ? '#1c1c1e' : '#fff' }}>
        {rows.map((r, i) => (
          <div key={r.label} className="relative flex min-h-11 items-center gap-3 pl-4 focus-within:bg-[#007aff]/10">
            <label htmlFor={`${id}-${i}`} className="w-[76px] shrink-0 text-[16px]" style={{ color: fg }}>
              {r.label}
            </label>
            <input
              id={`${id}-${i}`}
              autoComplete={r.ac}
              inputMode={r.mode}
              placeholder={r.placeholder}
              className="h-11 w-0 min-w-0 flex-1 bg-transparent pr-4 text-[16px] outline-none placeholder:text-[var(--ph)] focus-visible:outline-none"
              style={{ color: fg, ['--ph' as string]: dark ? 'rgba(235,235,245,.3)' : 'rgba(60,60,67,.3)' }}
            />
            {i < rows.length - 1 && <span className="absolute right-0 bottom-0 left-4 h-px" style={{ background: dark ? 'rgba(84,84,88,.65)' : 'rgba(60,60,67,.18)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const ms = surfaces.material[dark ? 'dark' : 'light'];
  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Every field below is live: click, type, clear, and tab through them. Use the switch to compare light and dark.</p>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Grouped form" platform="iOS" surface="ios" dark={dark} note="Rows inside a rounded group, like Settings. The label sits on the left, so long labels and large text are the risk here.">
          <IOSGroupedForm dark={dark} />
        </Demo>
        <Demo title="Filled text field" platform="Android · Material 3" surface="material" dark={dark} note="Tinted box with an underline. The label floats up when you focus or type. Watch for labels overlapping autofilled text.">
          <TextField variant="filled" dark={dark} label="First name" helper="As shown on your ID" autoComplete="given-name" />
        </Demo>
        <Demo title="Outlined text field" platform="Android · Material 3" surface="material" dark={dark} note="The floating label cuts into the border. A leading icon hints at the content; the clear button appears once you type.">
          <TextField variant="outlined" dark={dark} surface={ms} label="Email" type="email" icon={Mail} clearable autoComplete="email" defaultValue="anna@example.com" />
        </Demo>
        <Demo title="Label above" platform="Web" surface="web" dark={dark} note="The most common web pattern. The label never moves, which makes it the easiest to read and to test.">
          <TextField variant="web" dark={dark} label="Email address" type="email" required placeholder="name@example.com" helper="We'll send your order updates here." autoComplete="email" />
        </Demo>
        <Demo title="Password with show/hide" platform="All" surface="web" dark={dark} note="The eye button reveals the password. Check it toggles both ways and that the value is never lost when you switch.">
          <TextField variant="web" dark={dark} label="Password" type="password" helper="At least 8 characters" defaultValue="Secret123!" autoComplete="new-password" />
        </Demo>
        <Demo title="Search field" platform="iOS" surface="ios" dark={dark} note="No visible label, so the placeholder and the icon do the job. Screen readers still need a name ('Search').">
          <TextField variant="ios" dark={dark} label="Search" hideLabel type="search" placeholder="Search recipes" icon={Search} clearable defaultValue="pasta" />
        </Demo>
        <Demo title="Multiline with counter" platform="Android · Material 3" surface="material" dark={dark} note="For longer text. The counter counts characters the way people see them. Go over the limit to see the error.">
          <TextField variant="outlined" dark={dark} surface={ms} label="Delivery instructions" multiline rows={3} maxChars={80} defaultValue="Ring twice, the bell is broken 🔔" />
        </Demo>
        <Demo title="Disabled and error states" platform="Web" surface="web" dark={dark} note="Disabled fields are dimmed and can't be focused. An error turns the border red and says how to fix the value.">
          <div className="space-y-4">
            <TextField variant="web" dark={dark} label="Country" defaultValue="Croatia" disabled helper="Can't be changed after ordering." />
            <TextField variant="web" dark={dark} label="Postcode" defaultValue="1000O" inputMode="numeric" error="A postcode has 5 digits, like 10000." />
          </div>
        </Demo>
      </div>
    </div>
  );
}
