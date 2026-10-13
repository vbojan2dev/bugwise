import { useState } from 'react';
import { AppWindow, ArrowRight, CircleAlert, CircleCheck, Globe, Link2, Store, TriangleAlert } from 'lucide-react';

/*
 * "What happens when you tap?" explorer: pick a link type, whether the app is installed and where the
 * link was tapped, and see the path the phone takes. Teaching demo, no bugs.
 */

type LinkType = 'scheme' | 'universal' | 'deferred';
type Where = 'messages' | 'inapp';
type Tone = 'ok' | 'warn' | 'bad';

interface Step {
  icon: typeof Globe;
  text: string;
}
interface Outcome {
  steps: Step[];
  result: string;
  tone: Tone;
  tester: string;
}

const linkTypes: { id: LinkType; label: string; url: string }[] = [
  { id: 'scheme', label: 'Custom scheme', url: 'shop://product/42' },
  { id: 'universal', label: 'Universal / App Link', url: 'https://shop.example/product/42' },
  { id: 'deferred', label: 'Deferred deep link', url: 'https://shop.example/go/spring' },
];

function outcome(type: LinkType, installed: boolean, where: Where): Outcome {
  if (type === 'scheme') {
    if (!installed)
      return {
        steps: [
          { icon: Link2, text: 'The phone looks for an app that registered "shop://".' },
          { icon: CircleAlert, text: 'No app claims it, and a custom scheme has no web page to fall back to.' },
        ],
        result: 'Nothing happens, or an error like "Safari cannot open the page because the address is invalid".',
        tone: 'bad',
        tester: 'Never send custom-scheme links to people who might not have the app (emails, SMS, ads). Use https links there.',
      };
    if (where === 'inapp')
      return {
        steps: [
          { icon: Link2, text: 'The in-app browser of the social app receives "shop://product/42".' },
          { icon: TriangleAlert, text: 'Some in-app browsers block other apps’ schemes, others show an "Open in Shop?" prompt.' },
        ],
        result: 'Unpredictable: it may open the app, ask first, or do nothing. Behavior differs per social app and version.',
        tone: 'warn',
        tester: 'Test the links your marketing team actually posts, inside the actual apps (Instagram, Facebook, TikTok, LinkedIn).',
      };
    return {
      steps: [
        { icon: Link2, text: 'The phone finds the app that registered "shop://".' },
        { icon: AppWindow, text: 'The app opens and reads "product/42" from the link.' },
      ],
      result: 'Product 42 opens in the app. Safari may ask "Open in Shop?" first.',
      tone: 'ok',
      tester: 'Any app can register the same scheme, so it is not proof that the link really belongs to you. Fine for push notifications and internal links.',
    };
  }
  if (type === 'universal') {
    if (!installed)
      return {
        steps: [
          { icon: Globe, text: 'No installed app claims shop.example, so the browser opens the link.' },
          { icon: Globe, text: 'The website shows product 42, ideally with a "Get the app" banner.' },
        ],
        result: 'The web page opens. This is the web fallback, and it is correct.',
        tone: 'ok',
        tester: 'Check that the web page exists for every link the app supports. A 404 here means lost customers.',
      };
    if (where === 'inapp')
      return {
        steps: [
          { icon: Globe, text: 'The social app opens the link in its own built-in browser.' },
          { icon: TriangleAlert, text: 'The phone never gets a chance to hand the link to your app.' },
        ],
        result: 'The website opens inside Instagram (or similar), even though your app is installed.',
        tone: 'warn',
        tester: 'Expected platform behavior, not your app’s bug. The web page should offer a clear "Open in app" button.',
      };
    return {
      steps: [
        { icon: CircleCheck, text: 'At install time, the phone downloaded the verification file from shop.example and confirmed the app may open its links.' },
        { icon: AppWindow, text: 'The phone opens the app directly, no browser in between.' },
      ],
      result: 'Product 42 opens in the app.',
      tone: 'ok',
      tester: 'If the verification file is missing, wrong, or not on every domain (www!), the link silently opens the website instead.',
    };
  }
  if (!installed)
    return {
      steps: [
        { icon: Globe, text: 'The link goes through a link service that remembers "this person wanted /go/spring".' },
        { icon: Store, text: 'The user is sent to the App Store or Google Play and installs the app.' },
        { icon: AppWindow, text: 'On first launch, the app asks the link service (or Android’s Install Referrer) what the original link was.' },
      ],
      result: 'After install (and maybe a short onboarding), the spring offer opens. Exactly once.',
      tone: 'ok',
      tester: 'Test the full install path on a clean device: the offer must open after install, and must not open again on the next launch.',
    };
  return {
    steps: [
      { icon: CircleCheck, text: 'The app is already installed, so this is just a normal Universal Link / App Link.' },
      { icon: AppWindow, text: 'The app opens and resolves /go/spring to the right screen.' },
    ],
    result: 'The spring offer opens in the app.',
    tone: where === 'inapp' ? 'warn' : 'ok',
    tester: where === 'inapp' ? 'Inside an in-app browser, the web page opens first, just like any https link. It needs an "Open in app" button.' : 'Short campaign links like /go/spring must keep working for as long as the campaign material is out there.',
  };
}

const toneStyle: Record<Tone, string> = {
  ok: 'border-ok/40 bg-ok-soft text-ok',
  warn: 'border-warn/40 bg-warn-soft text-warn',
  bad: 'border-danger/40 bg-danger-soft text-danger',
};
const toneLabel: Record<Tone, string> = { ok: 'Works', warn: 'Watch out', bad: 'Broken experience' };

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              value === o.id ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-fg hover:bg-subtle'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function DeepLinkExplorer() {
  const [type, setType] = useState<LinkType>('universal');
  const [installed, setInstalled] = useState<'yes' | 'no'>('yes');
  const [where, setWhere] = useState<Where>('messages');
  const o = outcome(type, installed === 'yes', where);
  const url = linkTypes.find((l) => l.id === type)!.url;

  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Choice label="Link type" value={type} options={linkTypes} onChange={setType} />
        <Choice
          label="App on the phone"
          value={installed}
          options={[
            { id: 'yes', label: 'Installed' },
            { id: 'no', label: 'Not installed' },
          ]}
          onChange={setInstalled}
        />
        <Choice
          label="Tapped in"
          value={where}
          options={[
            { id: 'messages', label: 'Messages / Mail' },
            { id: 'inapp', label: 'Instagram (in-app browser)' },
          ]}
          onChange={setWhere}
        />
      </div>

      <p className="mt-4 truncate rounded-lg bg-subtle px-3 py-2 font-mono text-sm text-fg">{url}</p>

      <ol className="mt-3 space-y-2" aria-live="polite">
        {o.steps.map((s, i) => (
          <li key={i} className="flex min-w-0 items-start gap-2.5 text-sm text-fg">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-subtle text-muted">
              <s.icon size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0 pt-1">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className={`mt-3 flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${toneStyle[o.tone]}`}>
        <ArrowRight size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="min-w-0">
          <strong>{toneLabel[o.tone]}:</strong> <span className="text-fg">{o.result}</span>
        </p>
      </div>
      <p className="mt-2 text-sm text-muted">
        <strong className="text-fg">Tester&rsquo;s note:</strong> {o.tester}
      </p>
    </div>
  );
}
