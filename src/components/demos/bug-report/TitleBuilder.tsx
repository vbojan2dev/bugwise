import { useId, useState } from 'react';
import { CircleAlert, CircleCheck, Sparkles } from 'lucide-react';

/** Title builder: assemble Where + What + When into a bug title and get instant feedback. */

const VAGUE = /\b(broken|doesn'?t work|does not work|not working|issue|problem|weird|wrong|bug|glitch)\b/i;
const SHOUT = /!!|\b(ASAP|URGENT|BROKEN|FIX|NOW|HELP)\b/;

const examples = [
  { label: 'Food delivery', where: 'Order tracking', what: 'Courier map freezes', when: 'after switching from Wi-Fi to mobile data' },
  { label: 'Banking', where: 'Transfers', what: 'Amount field accepts more than 2 decimal places', when: 'when the device language is German' },
  { label: 'Travel', where: 'Hotel search', what: 'Check-out date resets to today', when: 'after rotating the phone to landscape' },
  { label: 'A bad one', where: '', what: 'Map is broken!!', when: 'sometimes' },
];

function Field({ label, hint, value, onChange, placeholder }: { label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-faint uppercase">
        {label}
      </label>
      <p id={`${id}-hint`} className="mb-1.5 text-xs text-muted">
        {hint}
      </p>
      <input
        id={id}
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-faint focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
      />
    </div>
  );
}

export default function TitleBuilder() {
  const [where, setWhere] = useState('Checkout');
  const [what, setWhat] = useState('Pay button stays disabled');
  const [when, setWhen] = useState('after entering a valid card on iOS 18');

  const w = where.trim();
  const x = what.trim();
  const t = when.trim();
  const title = [w ? `${w}:` : '', x, t].filter(Boolean).join(' ');

  const checks = [
    { ok: !!w, text: w ? 'Says where (screen or feature)' : 'Add where it happens: the screen or feature' },
    { ok: !!x && !VAGUE.test(x), text: !x ? 'Add what goes wrong' : VAGUE.test(x) ? 'Describe what you see instead of "broken" or "doesn\'t work"' : 'Says what goes wrong, specifically' },
    {
      ok: !!t && !/^(sometimes|randomly|always)$/i.test(t),
      text: !t ? 'Add when it happens: the trigger or condition' : /^(sometimes|randomly|always)$/i.test(t) ? '"Sometimes" is not a condition. What triggers it?' : 'Says when it happens',
    },
    { ok: !SHOUT.test(title), text: SHOUT.test(title) ? 'No capitals or "!!", the facts are enough' : 'Calm, factual tone' },
    { ok: title.length > 0 && title.length <= 100, text: title.length > 100 ? `${title.length} characters. Keep it under about 100 so it fits in lists` : `${title.length} characters, fits in a ticket list` },
  ];
  const score = checks.filter((c) => c.ok).length;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <Sparkles size={17} className="text-brand" aria-hidden="true" /> Title builder
        </p>
        <p className="text-sm text-muted">Fill in the three parts. Try an example, then write your own.</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Load an example">
          {examples.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => {
                setWhere(e.where);
                setWhat(e.what);
                setWhen(e.when);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="1. Where" hint="Screen or feature" value={where} onChange={setWhere} placeholder="Checkout" />
          <Field label="2. What" hint="What you see go wrong" value={what} onChange={setWhat} placeholder="Pay button stays disabled" />
          <Field label="3. When" hint="Trigger, condition, platform" value={when} onChange={setWhen} placeholder="after entering a valid card on iOS 18" />
        </div>

        <div className="rounded-2xl border border-line bg-subtle p-4">
          <p className="text-xs font-semibold tracking-wide text-faint uppercase">Your title</p>
          <p className="mt-1 text-base font-semibold break-words text-fg" aria-live="polite">
            {title || <span className="font-normal text-faint italic">Start typing…</span>}
          </p>
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2" aria-label={`Title checks: ${score} of ${checks.length} passed`}>
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-sm text-fg">
              {c.ok ? (
                <CircleCheck size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Pass" />
              ) : (
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-label="Needs work" />
              )}
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
