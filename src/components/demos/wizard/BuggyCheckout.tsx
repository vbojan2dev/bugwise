import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, RotateCw, ShoppingBag, Sparkles } from 'lucide-react';
import { ContactForm, EMPTY, FORM_KEYS, METHOD_LABEL, PaymentForm, ReviewPanel, SAMPLE, STEPS, ShippingForm, StepIndicator, money, total, validate, type Data, type Errors, type FormKey } from './checkout';

/*
 * A deliberately broken 4-step checkout (web). Bugs (don't spoil them!):
 *  1. The in-app Back button clears the data of the step you go back to.
 *  2. The URL is always /checkout, so the browser Back button leaves the whole wizard (back to the cart),
 *     and Forward starts the checkout again from scratch.
 *  3. The step indicator highlights the FURTHEST step reached instead of the current one:
 *     after going back from Payment, it says "Step 3 of 4: Payment" while showing the Shipping form.
 *  4. Every step in the indicator is clickable, even ones you haven't reached. You can jump to Payment and Review
 *     without completing Shipping, and even place an order with no address.
 *  5. Editing a step from Review clears every later step and continues through them instead of returning to Review.
 *  6. Nothing is saved as a draft: Reload on any step restarts at step 1 with empty fields.
 */

interface Placed {
  data: Data;
}

function CheckoutScreen({ onPlaced, fillTick, log }: { onPlaced: (p: Placed) => void; fillTick: number; log: (s: string) => void }) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [data, setData] = useState<Data>(EMPTY);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const [errors, setErrors] = useState<Errors>({});
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const lastTick = useRef(fillTick);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (fillTick === lastTick.current) return;
    lastTick.current = fillTick;
    if (step > 2) return;
    const k = FORM_KEYS[step];
    setData((d) => ({ ...d, [k]: SAMPLE[k] }));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillTick]);

  const setPart = <K extends FormKey>(k: K) => (c: Partial<Data[K]>) => setData((d) => ({ ...d, [k]: { ...d[k], ...c } }));

  const next = () => {
    if (step > 2) return;
    const k = FORM_KEYS[step];
    const e = validate(k, data);
    setErrors(e);
    if (Object.keys(e).length) return;
    setDone((d) => d.map((v, i) => (i === step ? true : v)));
    if (editing) {
      // BUG 5: "start over from the edited step": later steps are wiped, and the user walks through them again
      setData((d) => {
        const copy = { ...d };
        FORM_KEYS.forEach((fk, i) => {
          if (i > step) copy[fk] = { ...EMPTY[fk] } as never;
        });
        return copy;
      });
      setDone((d) => d.map((v, i) => (i > step ? false : v)));
      setEditing(false);
    }
    setStep(step + 1);
    setMaxReached((m) => Math.max(m, step + 1));
  };

  const back = () => {
    if (step === 0) return;
    const prev = FORM_KEYS[step - 1];
    // BUG 1: the previous step is "reset" when going back
    setData((d) => ({ ...d, [prev]: { ...EMPTY[prev] } }));
    setDone((d) => d.map((v, i) => (i === step - 1 ? false : v)));
    setErrors({});
    setEditing(false);
    setStep(step - 1);
  };

  const jump = (i: number) => {
    // BUG 4: no check that the steps before i are complete
    setErrors({});
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
  };

  const place = () => {
    // BUG 4 (consequence): nothing re-validates the earlier steps
    setPlacing(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      log(`POST /api/orders {email:"${data.contact.email}", zip:"${data.shipping.zip}", payment:"${data.payment.method}"} → 201 Created`);
      onPlaced({ data });
    }, 600);
  };

  // BUG 3: the indicator and the step title use maxReached instead of step
  const shown = maxReached;

  return (
    <>
      <p className="border-b border-black/10 bg-[#fafafa] px-4 py-1.5 text-[12px] font-medium text-black/60">
        Checkout · Step {shown + 1} of 4: {STEPS[shown].label}
      </p>
      <StepIndicator current={shown} done={done} canSelect={() => true} onSelect={jump} />
      <div className="p-4">
        {step === 0 && <ContactForm d={data} set={setPart('contact')} errors={errors} />}
        {step === 1 && <ShippingForm d={data} set={setPart('shipping')} errors={errors} />}
        {step === 2 && <PaymentForm d={data} set={setPart('payment')} errors={errors} />}
        {step === 3 && (
          <ReviewPanel
            d={data}
            onEdit={(k) => {
              setEditing(true);
              setErrors({});
              setStep(FORM_KEYS.indexOf(k));
            }}
          />
        )}
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
              Continue to {STEPS[step + 1].label.toLowerCase()}
            </button>
          ) : (
            <button type="button" onClick={place} disabled={placing} className="h-10 rounded-lg bg-[#15803d] px-4 text-[13px] font-semibold text-white disabled:opacity-40">
              {placing ? 'Placing order…' : `Place order · ${money(total(data))}`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function BuggyCheckout() {
  const [hist, setHist] = useState<{ entries: string[]; i: number }>({ entries: ['/cart', '/checkout'], i: 1 });
  const [reloads, setReloads] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [fillTick, setFillTick] = useState(0);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const url = hist.entries[hist.i];
  const addLog = (s: string) => setLog((l) => [s, ...l].slice(0, 6));

  const push = (u: string) => {
    setHist((h) => {
      const entries = [...h.entries.slice(0, h.i + 1), u];
      return { entries, i: entries.length - 1 };
    });
    addLog(`GET ${u} → 200 OK`);
  };
  const move = (d: -1 | 1) => {
    const ni = hist.i + d;
    if (ni < 0 || ni >= hist.entries.length) return;
    setHist((h) => ({ ...h, i: ni }));
    addLog(`GET ${hist.entries[ni]} → 200 OK`);
  };
  const reload = () => {
    setReloads((r) => r + 1);
    addLog(`GET ${url} → 200 OK`);
  };
  const restart = () => {
    setHist({ entries: ['/cart', '/checkout'], i: 1 });
    setReloads((r) => r + 1);
    setLog([]);
    setPlaced(null);
  };

  const iconBtn = 'grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30';

  let content;
  if (url === '/cart') {
    content = (
      <div className="p-4">
        <p className="text-[17px] font-bold">Your cart</p>
        <ul className="mt-2 space-y-1 text-[13px] text-black/70">
          <li>Trail running socks (2 pairs) · $24.50</li>
          <li>Insulated water bottle, 750 ml · $40.00</li>
        </ul>
        <button type="button" onClick={() => push('/checkout')} className="mt-4 flex h-11 items-center gap-2 rounded-lg bg-[#4338ca] px-5 text-[14px] font-semibold text-white">
          <ShoppingBag size={16} /> Checkout · {money(64.5)}
        </button>
      </div>
    );
  } else if (url === '/order/confirmed' && placed) {
    const d = placed.data;
    const noAddress = !d.shipping.street || !d.shipping.city || !d.shipping.zip;
    content = (
      <div className="p-6 text-center">
        <CircleCheck size={40} className="mx-auto text-[#15803d]" />
        <p className="mt-2 text-[17px] font-bold">Thanks! Order #BW-31877 placed</p>
        <p className="text-[13px] text-black/60">{money(total(d))}</p>
        <div className="mx-auto mt-3 max-w-[18rem] rounded-lg bg-black/[0.04] p-3 text-left text-[12px]">
          <p>
            <span className="text-black/50">Ship to: </span>
            <span className={noAddress ? 'font-semibold text-[#b42318]' : ''}>{noAddress ? '— (no address)' : `${d.shipping.street}, ${d.shipping.zip} ${d.shipping.city}`}</span>
          </p>
          <p>
            <span className="text-black/50">Receipt to: </span>
            {d.contact.email || '—'}
          </p>
          <p>
            <span className="text-black/50">Payment: </span>
            {METHOD_LABEL[d.payment.method]}
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <CheckoutScreen
        key={`${hist.i}-${reloads}`}
        fillTick={fillTick}
        log={addLog}
        onPlaced={(p) => {
          setPlaced(p);
          push('/order/confirmed');
        }}
      />
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line-strong bg-white text-[#0e1120] shadow-[0_24px_48px_-16px_rgba(16,18,35,.25)]" style={{ colorScheme: 'light' }}>
        <div className="flex items-center gap-1 border-b border-[#e5e7ef] bg-[#f6f7fb] px-2 py-1.5">
          <button type="button" onClick={() => move(-1)} disabled={hist.i === 0} aria-label="Back" className={iconBtn}>
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => move(1)} disabled={hist.i >= hist.entries.length - 1} aria-label="Forward" className={iconBtn}>
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={reload} aria-label="Reload" className={iconBtn}>
            <RotateCw size={15} />
          </button>
          <p className="min-w-0 flex-1 truncate rounded-md border border-[#e5e7ef] bg-white px-2 py-1 font-mono text-[11px]">shop.example.com{url}</p>
        </div>
        <div className="mx-auto min-h-[440px] max-w-[560px]">{content}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-w-0 space-y-3 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Tester tools</p>
            <button type="button" onClick={restart} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
              <RotateCw size={12} /> Restart
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFillTick((t) => t + 1)}
            disabled={url !== '/checkout'}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles size={13} /> Fill this step with test data
          </button>
          <details className="rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
            <summary className="cursor-pointer font-semibold text-fg">Acceptance criteria (from the ticket)</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Steps are completed in order. Only completed steps can be opened from the indicator.</li>
              <li>The indicator always shows the step on screen.</li>
              <li>Back (in the app or the browser) goes to the previous step and keeps what the user entered.</li>
              <li>Edit on Review opens that step, and saving returns to Review with everything else kept.</li>
              <li>The checkout is saved as a draft: a refresh returns to the same step with the data.</li>
            </ul>
          </details>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#0e1120] font-mono text-[11px] text-[#c9cde0]">
          <p className="border-b border-white/10 px-3 py-2 font-sans text-xs font-semibold tracking-wide text-white/50 uppercase">Network</p>
          <ul className="min-h-[5rem] space-y-1 px-3 py-2">
            {log.length === 0 && <li className="text-white/35">Requests appear here…</li>}
            {log.map((e, i) => (
              <li key={i} className="break-all">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
