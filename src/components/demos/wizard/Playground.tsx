import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, RotateCw, ShoppingBag, Sparkles, Volume2 } from 'lucide-react';
import { ContactForm, EMPTY, FORM_KEYS, PaymentForm, ReviewPanel, SAMPLE, STEPS, ShippingForm, StepIndicator, money, total, validate, type Data, type Errors, type FormKey } from './checkout';

/*
 * Wizard lab: a CORRECT checkout wizard.
 *  - every step has its own URL (/checkout/shipping), so browser Back/Forward move between steps
 *  - the draft is saved on every change, so Reload returns to the same step with the data
 *  - in-app Back keeps the data; validation runs per step on Continue
 *  - Edit from Review returns to Review ("Save and return to review") and keeps later steps
 *  - server-side errors on Place order send the user to the step that needs fixing
 *  - every step change is announced: "Step 2 of 4: Shipping"
 */

type Url = '/cart' | '/checkout/contact' | '/checkout/shipping' | '/checkout/payment' | '/checkout/review' | '/order/confirmed';
const stepUrl = (i: number) => `/checkout/${STEPS[i].key}` as Url;
const stepOf = (u: Url) => STEPS.findIndex((s) => u === `/checkout/${s.key}`);

type ServerResult = 'ok' | 'zip' | 'declined';

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold text-faint">{label}</legend>
      <div className="flex rounded-lg bg-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-medium ${value === o.v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Playground() {
  const [mode, setMode] = useState<'linear' | 'free'>('linear');
  const [layout, setLayout] = useState<'desktop' | 'phone'>('desktop');
  const [server, setServer] = useState<ServerResult>('ok');

  const [hist, setHist] = useState<{ entries: Url[]; i: number }>({ entries: ['/cart', '/checkout/contact'], i: 1 });
  const [data, setData] = useState<Data>(EMPTY);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const [errors, setErrors] = useState<Errors>({});
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [fromReview, setFromReview] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [reloads, setReloads] = useState(0);
  const [said, setSaid] = useState<string[]>(['Step 1 of 4: Contact']);
  const heading = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const url = hist.entries[hist.i];
  const step = stepOf(url);
  const say = (s: string) => setSaid((l) => [s, ...l].slice(0, 5));
  const firstOpen = done.findIndex((d, i) => i < 3 && !d);
  const reachable = (i: number) => mode === 'free' || i <= (firstOpen === -1 ? 3 : firstOpen);

  const announceStep = (i: number, extra = '') => {
    say(`Step ${i + 1} of 4: ${STEPS[i].label}${extra}`);
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  };

  const push = (u: Url) => {
    setHist((h) => {
      const entries = [...h.entries.slice(0, h.i + 1), u];
      return { entries, i: entries.length - 1 };
    });
  };
  const goStep = (i: number, extra = '') => {
    push(stepUrl(i));
    setErrors({});
    announceStep(i, extra);
  };
  const browser = (d: -1 | 1) => {
    const ni = hist.i + d;
    if (ni < 0 || ni >= hist.entries.length) return;
    const target = hist.entries[ni];
    setHist((h) => ({ ...h, i: ni }));
    setErrors({});
    setNotice(null);
    const s = stepOf(target);
    if (s >= 0) announceStep(s);
  };
  const reload = () => {
    setReloads((r) => r + 1);
    setErrors({});
    setNotice(step >= 0 ? 'Draft restored: you are back where you left off.' : null);
    if (step >= 0) announceStep(step);
  };

  const setPart = <K extends FormKey>(k: K) => (c: Partial<Data[K]>) => setData((d) => ({ ...d, [k]: { ...d[k], ...c } }));

  const fill = () => {
    if (step < 0 || step > 2) return;
    const k = FORM_KEYS[step];
    setData((d) => ({ ...d, [k]: SAMPLE[k] }));
    setErrors({});
  };

  const next = () => {
    if (step < 0 || step > 2) return;
    const k = FORM_KEYS[step];
    const e = validate(k, data);
    if (Object.keys(e).length) {
      setErrors(e);
      say(`${Object.keys(e).length} error${Object.keys(e).length > 1 ? 's' : ''}: ${Object.values(e)[0]}`);
      return;
    }
    setDone((d) => d.map((v, i) => (i === step ? true : v)));
    if (errorStep === step) setErrorStep(null);
    setNotice(null);
    if (fromReview) {
      setFromReview(false);
      goStep(3);
    } else goStep(step + 1);
  };

  const back = () => {
    if (step <= 0) return;
    setFromReview(false);
    // Use the browser history when the previous entry is the previous step, so Back and browser Back agree
    if (hist.entries[hist.i - 1] === stepUrl(step - 1)) browser(-1);
    else goStep(step - 1);
  };

  const missing = FORM_KEYS.filter((k) => Object.keys(validate(k, data)).length > 0);

  const place = () => {
    if (missing.length) return;
    setPlacing(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPlacing(false);
      if (server === 'zip') {
        setErrorStep(1);
        setDone((d) => d.map((v, i) => (i === 1 ? false : v)));
        setFromReview(true);
        goStep(1, '. 1 error.');
        setErrors({ zip: `We can't deliver to ${data.shipping.zip}. Check the ZIP code or use another address.` });
        return;
      }
      if (server === 'declined') {
        setErrorStep(2);
        setDone((d) => d.map((v, i) => (i === 2 ? false : v)));
        setFromReview(true);
        goStep(2, '. 1 error.');
        setErrors({ method: 'Your card was declined. Nothing was charged. Choose another payment method.' });
        return;
      }
      setHist({ entries: ['/order/confirmed'], i: 0 });
      say('Order placed. Confirmation number BW-20417.');
    }, 700);
  };

  const restart = () => {
    clearTimeout(timer.current);
    setPlacing(false);
    setHist({ entries: ['/cart', '/checkout/contact'], i: 1 });
    setData(EMPTY);
    setDone([false, false, false, false]);
    setErrors({});
    setErrorStep(null);
    setFromReview(false);
    setNotice(null);
    setSaid(['Step 1 of 4: Contact']);
  };

  const onEdit = (k: FormKey) => {
    setFromReview(true);
    goStep(FORM_KEYS.indexOf(k));
  };

  const iconBtn = 'grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30';
  const phone = layout === 'phone';

  let content;
  if (url === '/cart') {
    content = (
      <div className="p-4">
        <p className="text-[17px] font-bold">Your cart</p>
        <p className="mt-1 text-[13px] text-black/60">2 items · {money(64.5)}</p>
        <button type="button" onClick={() => goStep(Math.max(0, firstOpen === -1 ? 3 : firstOpen))} className="mt-4 flex h-11 items-center gap-2 rounded-lg bg-[#4338ca] px-5 text-[14px] font-semibold text-white">
          <ShoppingBag size={16} /> {done.some(Boolean) || data.contact.email ? 'Continue checkout' : 'Checkout'}
        </button>
        {(done.some(Boolean) || data.contact.email) && <p className="mt-2 text-[12px] text-black/55">Your checkout draft is saved.</p>}
      </div>
    );
  } else if (url === '/order/confirmed') {
    content = (
      <div className="p-6 text-center">
        <CircleCheck size={40} className="mx-auto text-[#15803d]" />
        <p className="mt-2 text-[17px] font-bold">Order placed</p>
        <p className="text-[13px] text-black/60">
          #BW-20417 · {money(total(data))} · to {data.shipping.city}
        </p>
        <button type="button" onClick={restart} className="mt-4 rounded-lg bg-black/[0.06] px-4 py-2 text-[13px] font-semibold hover:bg-black/10">
          Start over
        </button>
      </div>
    );
  } else {
    content = (
      <>
        <StepIndicator current={step} done={done} canSelect={reachable} onSelect={(i) => goStep(i)} compact={phone} errorStep={errorStep} />
        <div key={reloads} className="p-4">
          {notice && <p className="mb-3 rounded-lg bg-[#eef2ff] px-3 py-2 text-[12px] text-[#3730a3]">{notice}</p>}
          <div ref={heading} tabIndex={-1} className="outline-none">
            {step === 0 && <ContactForm d={data} set={setPart('contact')} errors={errors} />}
            {step === 1 && <ShippingForm d={data} set={setPart('shipping')} errors={errors} />}
            {step === 2 && <PaymentForm d={data} set={setPart('payment')} errors={errors} />}
            {step === 3 && <ReviewPanel d={data} onEdit={onEdit} missing={missing} />}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            {step > 0 ? (
              <button type="button" onClick={back} className="flex h-10 items-center gap-1 rounded-lg px-3 text-[13px] font-semibold text-[#4338ca] hover:bg-[#4338ca]/10">
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button type="button" onClick={next} className="h-10 rounded-lg bg-[#4338ca] px-4 text-[13px] font-semibold text-white hover:bg-[#3730a3]">
                {fromReview ? 'Save and return to review' : `Continue to ${STEPS[step + 1].label.toLowerCase()}`}
              </button>
            ) : (
              <button type="button" onClick={place} disabled={missing.length > 0 || placing} className="h-10 rounded-lg bg-[#15803d] px-4 text-[13px] font-semibold text-white disabled:opacity-40">
                {placing ? 'Placing order…' : `Place order · ${money(total(data))}`}
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-3">
        <Seg label="Navigation" value={mode} onChange={setMode} options={[{ v: 'linear', l: 'Linear' }, { v: 'free', l: 'Non-linear' }]} />
        <Seg label="Layout" value={layout} onChange={setLayout} options={[{ v: 'desktop', l: 'Desktop' }, { v: 'phone', l: 'Phone' }]} />
        <Seg label="Server answer on Place order" value={server} onChange={setServer} options={[{ v: 'ok', l: 'OK' }, { v: 'zip', l: 'Bad ZIP' }, { v: 'declined', l: 'Declined' }]} />
      </div>
      <p className="border-b border-line px-4 py-2 text-xs text-muted">
        {mode === 'linear'
          ? 'Linear: steps you haven’t reached are locked in the indicator. Completed steps can be revisited.'
          : 'Non-linear: every step in the indicator is clickable. Review flags what is still missing and Place order waits for it.'}{' '}
        {server !== 'ok' && 'The server answer applies when you press Place order on the Review step.'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0 bg-[#e9ebf2] px-3 py-5 sm:px-6" style={{ colorScheme: 'light' }}>
          <div className="mx-auto overflow-hidden rounded-xl border border-black/10 bg-white text-[#0e1120] shadow-sm" style={{ maxWidth: phone ? 340 : 560 }}>
            <div className="flex items-center gap-1 border-b border-black/10 bg-[#f6f7fb] px-2 py-1.5">
              <button type="button" onClick={() => browser(-1)} disabled={hist.i === 0} aria-label="Browser back" className={iconBtn}>
                <ArrowLeft size={16} />
              </button>
              <button type="button" onClick={() => browser(1)} disabled={hist.i >= hist.entries.length - 1} aria-label="Browser forward" className={iconBtn}>
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={reload} aria-label="Reload" className={iconBtn}>
                <RotateCw size={15} />
              </button>
              <p className="min-w-0 flex-1 truncate rounded-md border border-black/10 bg-white px-2 py-1 font-mono text-[11px]">shop.example.com{url}</p>
            </div>
            <div className="min-h-[400px]">{content}</div>
          </div>
        </div>

        <div className="min-w-0 space-y-3 border-t border-line p-4 lg:border-t-0 lg:border-l">
          <button type="button" onClick={fill} disabled={step < 0 || step > 2} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand hover:opacity-90 disabled:opacity-40">
            <Sparkles size={13} /> Fill this step with test data
          </button>
          <button type="button" onClick={restart} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-subtle px-3 py-2 text-xs font-semibold text-muted hover:text-fg">
            <RotateCw size={12} /> Restart
          </button>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
              <Volume2 size={13} /> Screen reader hears
            </p>
            <ol className="mt-2 space-y-1 text-[12px]">
              {said.map((l, i) => (
                <li key={`${i}-${l}`} className={`rounded-md px-2 py-1 ${i === 0 ? 'bg-brand-soft text-fg' : 'bg-subtle text-muted'}`}>
                  {l}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
