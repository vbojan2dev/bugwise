import { useState } from 'react';
import { User } from 'lucide-react';
import { levelLabels, type LevelId } from './levels';

/**
 * Explorable test pyramid: click a level to see who does it, an "apply coupon" example,
 * typical tools, speed, cost and how many tests a team usually has there.
 */

type Info = {
  width: string;
  tone: string;
  who: string;
  finds: string;
  example: string;
  tools: string;
  speed: number; // 1 = slow, 4 = very fast
  cost: number; // 1 = cheap, 4 = expensive (to write, run and maintain)
  amount: string;
  manual: string;
};

const info: Record<LevelId, Info> = {
  acceptance: {
    width: '40%',
    tone: 'bg-danger-soft border-danger/40',
    who: 'Product owner, business users, clients, real users (alpha/beta), operations team',
    finds: 'The product works but does not solve the real need; confusing flows; business rules that were misunderstood.',
    example: 'The marketing team tries the coupon campaign on a pre-release build and confirms the discounts match their promotion.',
    tools: 'UAT scripts or checklists, TestFlight and Google Play testing tracks for beta builds, feedback forms',
    speed: 1,
    cost: 4,
    amount: 'A handful of key scenarios',
    manual: 'Testers prepare UAT scenarios and data, support the business users and help triage what they report.',
  },
  system: {
    width: '60%',
    tone: 'bg-warn-soft border-warn/40',
    who: 'Mostly the test team (manual testers and automation engineers)',
    finds: 'Broken end-to-end flows, device and browser differences, UI and usability problems, performance and security issues.',
    example: 'On the staging build, add items to the cart, apply SAVE10, check the total, pay with a test card and check the receipt.',
    tools: 'Test cases in a test management tool, real devices and emulators, Appium, Espresso, XCUITest, Playwright, Cypress',
    speed: 2,
    cost: 3,
    amount: 'Dozens to hundreds',
    manual: 'This is home turf: most manual test cases and exploratory sessions happen here.',
  },
  integration: {
    width: '80%',
    tone: 'bg-info-soft border-info/30',
    who: 'Developers and testers (often QA engineers who test APIs)',
    finds: 'Data lost or changed between parts, wrong API responses, mismatched field names, timeouts, duplicated records.',
    example: 'Call the cart API with SAVE10 and check the response has the new total, then check the coupon service marked the code as used.',
    tools: 'Postman, REST Assured, contract tests (for example Pact), mock servers',
    speed: 3,
    cost: 2,
    amount: 'Hundreds',
    manual: 'Manual testers increasingly test APIs with Postman and read network logs, so this level is worth learning.',
  },
  unit: {
    width: '100%',
    tone: 'bg-ok-soft border-ok/40',
    who: 'Developers, while writing the code',
    finds: 'Logic mistakes in one small piece: wrong math, off-by-one errors, unhandled empty values.',
    example: 'calculateDiscount(40.00, "SAVE10") returns 4.00, and an expired code returns 0.',
    tools: 'JUnit (Android/Java), XCTest (iOS), Jest or Vitest (web), pytest (Python)',
    speed: 4,
    cost: 1,
    amount: 'Thousands',
    manual: 'You will not usually write them, but knowing what they cover tells you where to focus your own testing.',
  },
};

const top: LevelId[] = ['acceptance', 'system', 'integration', 'unit'];

function Meter({ value, label, low, high }: { value: number; label: string; low: string; high: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-wide text-faint uppercase">{label}</p>
      <div className="mt-1 flex gap-1" role="img" aria-label={`${label}: ${value} of 4 (${value >= 3 ? high : low})`}>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-2 flex-1 rounded-full ${n <= value ? 'bg-brand' : 'bg-subtle'}`} />
        ))}
      </div>
      <p className="mt-0.5 flex justify-between text-[11px] text-faint">
        <span>{low}</span>
        <span>{high}</span>
      </p>
    </div>
  );
}

export default function TestPyramid() {
  const [sel, setSel] = useState<LevelId>('unit');
  const d = info[sel];

  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold text-fg">The test pyramid</p>
        <p className="text-sm text-muted">Click a level. Lots of small, fast tests at the bottom; few big, slow ones at the top.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5" role="group" aria-label="Test levels">
          {top.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setSel(l)}
              aria-pressed={sel === l}
              style={{ width: info[l].width }}
              className={`min-w-0 rounded-lg border px-2 py-3 text-sm font-semibold text-fg transition-shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none ${info[l].tone} ${
                sel === l ? 'shadow-[0_0_0_2px_var(--brand)]' : 'hover:shadow-[0_0_0_1px_var(--line-strong)]'
              }`}
            >
              {levelLabels[l]}
            </button>
          ))}
          <div className="mt-2 flex w-full justify-between text-[11px] text-faint">
            <span>&#8593; slower, costlier, fewer</span>
            <span>&#8595; faster, cheaper, more</span>
          </div>
        </div>

        <div className="min-w-0 space-y-3 rounded-2xl border border-line bg-subtle p-4 text-sm text-fg" aria-live="polite">
          <p className="text-base font-semibold">{levelLabels[sel]} testing</p>
          <p>
            <strong className="font-semibold">Who: </strong>
            {d.who}
          </p>
          <p>
            <strong className="font-semibold">Finds: </strong>
            {d.finds}
          </p>
          <p>
            <strong className="font-semibold">Coupon example: </strong>
            {d.example}
          </p>
          <p>
            <strong className="font-semibold">Typical tools: </strong>
            {d.tools}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Meter value={d.speed} label="Speed" low="slow" high="fast" />
            <Meter value={d.cost} label="Cost per test" low="cheap" high="expensive" />
          </div>
          <p>
            <strong className="font-semibold">How many: </strong>
            {d.amount}
          </p>
          <p className="flex gap-2 rounded-xl bg-surface p-3">
            <User size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              <strong className="font-semibold">For a manual tester: </strong>
              {d.manual}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
