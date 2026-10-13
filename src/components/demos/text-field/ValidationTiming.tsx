import { useState } from 'react';
import { CheckCircle2, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { TextField } from './TextField';

type Strategy = 'typing' | 'blur' | 'submit';

const strategies: { key: Strategy; label: string; verdict: string; good: boolean }[] = [
  {
    key: 'typing',
    label: 'While typing',
    good: false,
    verdict: 'The error appears after the very first letter, before the user had a chance to finish. It feels like being told off mid-sentence. Fine for a password strength meter, annoying for an email.',
  },
  {
    key: 'blur',
    label: 'On blur',
    good: true,
    verdict: 'No error until you leave the field. After that, the field re-checks as you type, so the error disappears the moment the value is fixed. This "late to complain, quick to forgive" approach is the usual recommendation.',
  },
  {
    key: 'submit',
    label: 'On submit',
    good: true,
    verdict: 'Errors appear only after pressing Continue. Calm for short forms, but on a long form the user finds all the problems at the end. After the first submit, errors should update live.',
  },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const validate = (v: string) => (!v.trim() ? 'Enter your email address' : EMAIL.test(v.trim()) ? '' : 'Enter an email address like name@example.com');

export default function ValidationTiming() {
  const [strategy, setStrategy] = useState<Strategy>('blur');
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [flashes, setFlashes] = useState(0);
  const [done, setDone] = useState(false);

  const visible = (v: string, s: Strategy, t: boolean, sub: boolean) => {
    const e = validate(v);
    if (!e) return '';
    if (s === 'typing') return v.length > 0 || sub ? e : '';
    if (s === 'blur') return t || sub ? e : '';
    return sub ? e : '';
  };
  const error = visible(value, strategy, touched, submitted);

  const reset = (s: Strategy = strategy) => {
    setStrategy(s);
    setValue('');
    setTouched(false);
    setSubmitted(false);
    setFlashes(0);
    setDone(false);
  };

  const onChange = (v: string) => {
    const before = visible(value, strategy, touched, submitted);
    const after = visible(v, strategy, touched, submitted);
    if (focused && !before && after) setFlashes((n) => n + 1);
    setValue(v);
  };

  const s = strategies.find((x) => x.key === strategy)!;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">⏱️ When should the error appear?</p>
        <p className="text-sm text-muted">Pick a strategy, then type an address slowly, e.g. &quot;anna@test.com&quot;. Try leaving the field half-done, too.</p>
      </div>
      <div role="group" aria-label="Validation strategy" className="flex flex-wrap gap-1 border-b border-line px-3 py-2">
        {strategies.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={strategy === x.key}
            onClick={() => reset(x.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${strategy === x.key ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-[#f6f7fb] p-5 text-[#18181b] sm:p-7">
          <div className="mx-auto max-w-[300px] rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-lg font-bold">Sign in to FreshCart</p>
            <p className="mb-4 text-[13px] text-[#52525b]">We&apos;ll email you a one-time code.</p>
            {done ? (
              <div className="flex items-start gap-2 rounded-lg bg-[#ecfdf3] p-3 text-[14px] text-[#067647]" role="status">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>
                  Code sent to <strong className="break-all">{value.trim()}</strong>
                </span>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                  if (!validate(value)) setDone(true);
                }}
              >
                <TextField
                  key={strategy}
                  variant="web"
                  label="Email"
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChange={onChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    setTouched(true);
                  }}
                  error={error || undefined}
                />
                <button type="submit" className="mt-4 h-10 w-full rounded-lg bg-[#2563eb] text-[15px] font-semibold text-white hover:bg-[#1d4ed8]">
                  Continue
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="space-y-4 border-t border-line p-5 md:border-t-0 md:border-l">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-subtle p-3">
              <p className="text-2xl font-bold tabular-nums">{flashes}</p>
              <p className="text-xs text-muted">times an error popped up while typing</p>
            </div>
            <div className="rounded-xl bg-subtle p-3">
              <p className="text-2xl font-bold">{error ? '❌' : done ? '✅' : '—'}</p>
              <p className="text-xs text-muted">{error ? 'error showing now' : done ? 'submitted' : 'no error shown'}</p>
            </div>
          </div>
          <div className={`rounded-xl p-3 text-sm leading-relaxed ${s.good ? 'bg-ok-soft' : 'bg-warn-soft'}`}>
            <p className={`mb-1 flex items-center gap-1.5 font-semibold ${s.good ? 'text-ok' : 'text-warn'}`}>
              {s.good ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />} {s.label}
            </p>
            <p className="text-fg">{s.verdict}</p>
          </div>
          <button type="button" onClick={() => reset()} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <RotateCcw size={14} /> Start again
          </button>
        </div>
      </div>
    </div>
  );
}
