import { useState, type FormEvent } from 'react';
import { Check, Minus, Plane, RotateCcw } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/*
 * A deliberately broken sign-up flow for a travel site. Bugs (don't spoil them for learners!):
 *  1. The Terms label is a plain <span>, not a <label>: clicking the text does nothing, only the tiny box works.
 *  2. Marketing consent ("Send me travel deals…") is pre-checked.
 *  3. Topic checkboxes are custom <div role="checkbox"> elements: Tab reaches them, but Space does nothing.
 *  4. "Select all" keeps its own flag: after selecting all and unchecking one, it stays checked and the count
 *     still says "5 selected". It never shows the mixed state.
 *  5. Required Terms error is only a red outline around the box: no text, nothing announced.
 *  6. Going Back from step 2 resets the checkboxes on step 1 (Terms unchecked, marketing re-checked).
 */

const TOPICS = ['Flight deals', 'Hotel offers', 'Car rental', 'City breaks', 'Beach holidays'];

function Box({ on }: { on: boolean | 'mixed' }) {
  return (
    <span aria-hidden="true" className={`grid size-[18px] shrink-0 place-items-center rounded-[4px] border-2 ${on ? 'border-[#0f766e] bg-[#0f766e]' : 'border-[#6b7280] bg-white'}`}>
      {on === true && <Check size={13} strokeWidth={3.5} color="#fff" />}
      {on === 'mixed' && <Minus size={13} strokeWidth={3.5} color="#fff" />}
    </span>
  );
}

export function BuggySignUp() {
  const [step, setStep] = useState<'account' | 'topics' | 'done'>('account');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [marketing, setMarketing] = useState(true); // BUG 2
  const [topics, setTopics] = useState<boolean[]>(TOPICS.map(() => false));
  const [allFlag, setAllFlag] = useState(false); // BUG 4

  const selected = topics.filter(Boolean).length;
  const shownCount = allFlag ? TOPICS.length : selected; // BUG 4

  const submitAccount = (e: FormEvent) => {
    e.preventDefault();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setEmailError(okEmail ? '' : 'Enter a valid email address, like name@example.com');
    setTermsError(!terms); // BUG 5: visual only
    if (okEmail && terms) setStep('topics');
  };

  const back = () => {
    // BUG 6: step 1 is rebuilt from its defaults.
    setTerms(false);
    setMarketing(true);
    setTermsError(false);
    setStep('account');
  };

  const toggleAll = () => {
    const next = !allFlag;
    setAllFlag(next);
    setTopics(TOPICS.map(() => next));
  };
  const toggleTopic = (i: number) => setTopics((arr) => arr.map((v, j) => (j === i ? !v : v))); // BUG 4: allFlag not updated

  const restart = () => {
    setStep('account');
    setEmail('');
    setEmailError('');
    setTerms(false);
    setTermsError(false);
    setMarketing(true);
    setTopics(TOPICS.map(() => false));
    setAllFlag(false);
  };

  const teal = '#0f766e';

  return (
    <div className="flex w-full max-w-[460px] min-w-0 flex-col gap-4">
      <BrowserFrame url="trips.example.com/join">
        <div className="min-h-[430px] bg-white px-4 py-4 text-[14px] text-[#111827] sm:px-6" style={{ colorScheme: 'light' }}>
          <div className="mb-4 flex items-center gap-2 font-bold" style={{ color: teal }}>
            <Plane size={18} aria-hidden="true" /> Tripsy
            <span className="ml-auto text-[11px] font-medium text-[#6b7280]">{step === 'done' ? 'Done' : `Step ${step === 'account' ? 1 : 2} of 2`}</span>
          </div>

          {step === 'account' && (
            <form onSubmit={submitAccount} noValidate className="space-y-4">
              <h3 className="text-[18px] font-bold">Create your account</h3>
              <div>
                <label htmlFor="bs-email" className="mb-1 block text-[13px] font-medium">
                  Email
                </label>
                <input
                  id="bs-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'bs-email-err' : undefined}
                  className={`w-full min-w-0 rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${emailError ? 'border-[#dc2626]' : 'border-[#d1d5db]'}`}
                  placeholder="name@example.com"
                />
                {emailError && (
                  <p id="bs-email-err" role="alert" className="mt-1 text-[12px] text-[#dc2626]">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    id="bs-terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      if (e.target.checked) setTermsError(false);
                    }}
                    className={`mt-[2px] size-3.5 shrink-0 accent-[#0f766e] ${termsError ? 'outline-2 outline-offset-1 outline-[#dc2626]' : ''}`}
                  />
                  {/* BUG 1: a span, not a label */}
                  <span className="leading-snug">I agree to the Terms of Service and Privacy Policy</span>
                </div>
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-[2px] size-3.5 shrink-0 accent-[#0f766e]" />
                  <span className="leading-snug">Send me travel deals and partner offers by email</span>
                </label>
              </div>

              <button type="submit" className="w-full rounded-lg py-2.5 font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:outline-none" style={{ background: teal }}>
                Continue
              </button>
            </form>
          )}

          {step === 'topics' && (
            <div className="space-y-3">
              <h3 className="text-[18px] font-bold">What are you into?</h3>
              <p className="text-[13px] text-[#4b5563]">We'll tailor your deals. Pick as many as you like.</p>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb]">
                <div
                  role="checkbox"
                  aria-checked={allFlag}
                  tabIndex={0}
                  onClick={toggleAll}
                  className="flex cursor-pointer items-center gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-inset"
                >
                  <Box on={allFlag} />
                  <span className="min-w-0 flex-1">Select all</span>
                  <span className="text-[12px] font-medium text-[#6b7280]">{shownCount} selected</span>
                </div>
                {TOPICS.map((t, i) => (
                  <div
                    key={t}
                    role="checkbox"
                    aria-checked={topics[i]}
                    tabIndex={0}
                    onClick={() => toggleTopic(i)}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-inset"
                  >
                    <Box on={topics[i]} />
                    <span className="min-w-0 flex-1">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={back} className="flex-1 rounded-lg border border-[#d1d5db] py-2.5 font-semibold focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:outline-none">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('done')}
                  className="flex-1 rounded-lg py-2.5 font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:outline-none"
                  style={{ background: teal }}
                >
                  Finish
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              <h3 className="text-[18px] font-bold">Welcome aboard!</h3>
              <dl className="space-y-2 rounded-xl bg-[#f0fdfa] p-3 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#4b5563]">Email</dt>
                  <dd className="min-w-0 truncate font-medium">{email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#4b5563]">Marketing emails</dt>
                  <dd className="font-medium">{marketing ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-[#4b5563]">Interests</dt>
                  <dd className="min-w-0 text-right font-medium">{selected ? TOPICS.filter((_, i) => topics[i]).join(', ') : 'None'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </BrowserFrame>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
        <p className="text-xs text-muted">Use the mouse and the keyboard (Tab, Space).</p>
        <button type="button" onClick={restart} className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Start over
        </button>
      </div>
    </div>
  );
}
