import { Bug, FileText, ImageIcon, Paperclip, Video } from 'lucide-react';
import { BrowserFrame } from '../shared/BrowserFrame';

/**
 * A bug ticket rendered like a generic web bug tracker (light "screen" with fixed colors,
 * so it reads the same in the site's light and dark themes).
 */

export type Attachment = { name: string; kind: 'video' | 'image' | 'log'; note?: string };

export type BugReport = {
  id: string;
  title: string;
  status: string;
  severity: string;
  priority: string;
  reproducibility: string;
  component: string;
  labels: string[];
  reporter: string;
  assignee: string;
  environment: [string, string][];
  preconditions: string[];
  steps: string[];
  expected: string;
  actual: string;
  notes?: string[];
  attachments: Attachment[];
};

export const greatReport: BugReport = {
  id: 'SHOP-1423',
  title: 'Checkout: Pay button stays disabled after entering a valid card on iOS 18',
  status: 'New',
  severity: 'Major',
  priority: 'High',
  reproducibility: '5/5 attempts (always)',
  component: 'Checkout',
  labels: ['ios', 'payments', 'regression'],
  reporter: 'Mia Rossi (QA)',
  assignee: 'Unassigned',
  environment: [
    ['App version', 'ShopFast 4.12.0 (build 812)'],
    ['Device', 'iPhone 15'],
    ['OS', 'iOS 18.0.1'],
    ['Environment', 'Staging'],
    ['Network', 'Wi-Fi'],
    ['Account', 'mia.qa+1@shopfast.test'],
  ],
  preconditions: ['Signed in with a test account that has no saved cards', 'Cart contains 1 item ("Trail Running Shoes", $54.97)'],
  steps: [
    'Open the Cart tab and tap "Checkout"',
    'On the Payment screen, select "Credit or debit card"',
    'Enter card number 4242 4242 4242 4242, expiry 12/30, CVC 123',
    'Tap outside the fields to close the keyboard',
  ],
  expected: 'The "Pay $54.97" button becomes enabled (blue) and tapping it places the order.',
  actual:
    'The "Pay $54.97" button stays grey and cannot be tapped. No error is shown under any field. The user cannot pay by card.',
  notes: [
    'Does NOT happen on Android 15 (Pixel 8, same build 812).',
    'Does NOT happen in build 4.11.2 on the same iPhone, so this looks like a regression.',
    'Workaround: Apple Pay still works.',
  ],
  attachments: [
    { name: 'pay-button-disabled.mp4', kind: 'video', note: '0:21 screen recording' },
    { name: 'payment-screen.png', kind: 'image' },
    { name: 'iphone15-console.log', kind: 'log', note: 'Xcode console, 14:02–14:04' },
  ],
};

const pill = (text: string, bg: string, fg: string) => (
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: bg, color: fg }}>
    {text}
  </span>
);

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold tracking-wide text-[#6b7180] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#0e1120]">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="mb-1.5 text-xs font-bold tracking-wide text-[#3d4352] uppercase">{title}</h4>
      {children}
    </section>
  );
}

const attachIcon = { video: Video, image: ImageIcon, log: FileText };

export function BugReportCard({ report = greatReport, url }: { report?: BugReport; url?: string }) {
  const r = report;
  return (
    <div className="not-prose my-8">
      <BrowserFrame url={url ?? `tracker.shopfast.dev/browse/${r.id}`}>
        <article className="p-4 text-[#0e1120] sm:p-6" aria-label={`Bug report ${r.id}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5b6170]">
            <span className="grid size-5 place-items-center rounded bg-[#e5484d] text-white">
              <Bug size={12} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="font-mono font-semibold">{r.id}</span>
            {pill(r.status, '#e8eefc', '#2851c7')}
          </div>
          <h3 className="mt-2 text-lg leading-snug font-bold sm:text-xl">{r.title}</h3>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-[#e5e7ef] bg-[#f8f9fc] p-3 sm:grid-cols-4">
            <Meta label="Severity">{pill(r.severity, '#fdecdc', '#a14a06')}</Meta>
            <Meta label="Priority">{pill(r.priority, '#fde3e3', '#b42318')}</Meta>
            <Meta label="Reproducible">{r.reproducibility}</Meta>
            <Meta label="Component">{r.component}</Meta>
            <Meta label="Labels">
              <span className="flex flex-wrap gap-1">
                {r.labels.map((l) => (
                  <span key={l} className="rounded bg-[#eceef4] px-1.5 py-0.5 font-mono text-[11px] text-[#3d4352]">
                    {l}
                  </span>
                ))}
              </span>
            </Meta>
            <Meta label="Reporter">{r.reporter}</Meta>
            <Meta label="Assignee">{r.assignee}</Meta>
          </dl>

          <Section title="Environment">
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {r.environment.map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-[#6b7180]">{k}:</dt>
                  <dd className="min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Preconditions">
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {r.preconditions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Section>

          <Section title="Steps to reproduce">
            <ol className="list-decimal space-y-0.5 pl-5 text-sm">
              {r.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#bfe5cc] bg-[#effaf3] p-3">
              <h4 className="text-xs font-bold tracking-wide text-[#18794e] uppercase">Expected result</h4>
              <p className="mt-1 text-sm">{r.expected}</p>
            </div>
            <div className="rounded-xl border border-[#f6c9c9] bg-[#fdf1f1] p-3">
              <h4 className="text-xs font-bold tracking-wide text-[#b42318] uppercase">Actual result</h4>
              <p className="mt-1 text-sm">{r.actual}</p>
            </div>
          </div>

          {r.notes?.length ? (
            <Section title="Notes">
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {r.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Attachments">
            <ul className="flex flex-wrap gap-2">
              {r.attachments.map((a) => {
                const Icon = attachIcon[a.kind];
                return (
                  <li key={a.name} className="flex max-w-full items-center gap-2 rounded-lg border border-[#e5e7ef] bg-white px-2.5 py-1.5 text-xs">
                    <Icon size={14} className="shrink-0 text-[#5b6170]" aria-hidden="true" />
                    <span className="truncate font-medium">{a.name}</span>
                    {a.note ? <span className="hidden text-[#6b7180] sm:inline">· {a.note}</span> : null}
                  </li>
                );
              })}
              {r.attachments.length === 0 ? (
                <li className="flex items-center gap-2 text-xs text-[#6b7180]">
                  <Paperclip size={14} aria-hidden="true" /> No attachments
                </li>
              ) : null}
            </ul>
          </Section>
        </article>
      </BrowserFrame>
    </div>
  );
}

export default BugReportCard;
