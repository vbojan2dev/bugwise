import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Download, Eye, EyeOff, Lightbulb, Printer, Search, Trophy } from 'lucide-react';
import { BUGS, CATEGORY_LABEL, SCREEN_LABEL, updateCapstone, type BugCategory, type Screen, type Severity } from '@/lib/capstone';
import { href } from '@/lib/url';
import { PHASES } from './phases';
import { computeScore, level, WEIGHTS } from './score';
import { fmtDate, useCapstone } from './useCapstone';
import { inputCls } from './ui';

const CATS = Object.keys(CATEGORY_LABEL) as BugCategory[];
const SCREENS = Object.keys(SCREEN_LABEL) as Screen[];
const SEV_TONE: Record<Severity, string> = {
  critical: 'bg-danger-soft text-danger',
  major: 'bg-warn-soft text-warn',
  minor: 'bg-info-soft text-info',
  trivial: 'bg-subtle text-muted',
};
const pts = (n: number) => (n === 1 ? 'exact' : n === 0.5 ? 'one step off' : 'off');
const ptsTone = (n: number) => (n === 1 ? 'text-ok' : n === 0.5 ? 'text-warn' : 'text-danger');

function Bar({ value, max, tone = 'bg-brand' }: { value: number; max: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-subtle ring-1 ring-line" aria-hidden>
      <div className={['h-full rounded-full', tone].join(' ')} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

export default function Results() {
  const state = useCapstone();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (state && name === null) setName(state.learnerName ?? '');
  }, [state, name]);

  if (!state) return <div className="h-96 animate-pulse rounded-2xl bg-subtle" />;

  const sc = computeScore(state);
  const lv = level(sc.total);
  const revealed = state.artifacts.revealed === true;
  const reportDone = !!state.phases.report;

  const reveal = () => {
    if (revealed) {
      updateCapstone((s) => {
        s.artifacts.revealed = false;
      });
      return;
    }
    if (confirm(`Reveal all ${BUGS.length} bugs, including the ones you haven't found yet? Tip: try the hints first. You can hide the answers again, but you can't unsee them.`))
      updateCapstone((s) => {
        s.artifacts.revealed = true;
      });
  };

  const saveName = (v: string) => {
    setName(v);
    updateCapstone((s) => {
      s.learnerName = v.slice(0, 60);
    });
  };

  const certDate = fmtDate(state.phases.report ?? new Date().toISOString());
  const certName = (name ?? '').trim();
  const certId = `FD2-${hash(`${certName}|${state.startedAt ?? ''}`)}`;

  const print = () => {
    document.documentElement.classList.add('print-cert');
    const done = () => {
      document.documentElement.classList.remove('print-cert');
      removeEventListener('afterprint', done);
    };
    addEventListener('afterprint', done);
    window.print();
    // Some browsers return from print() before afterprint; clean up in any case.
    setTimeout(done, 1000);
  };

  const download = () => {
    const svg = certificateSvg({ name: certName, date: certDate, score: sc.total, found: sc.found.size, id: certId, level: lv.label });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `bugwise-capstone-certificate-${(certName || 'tester').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tester'}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="not-prose space-y-12">
      {/* Score */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]" aria-labelledby="score-h">
        <div className="card flex min-w-0 flex-col items-center justify-center p-6 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-fg">
            <Trophy size={24} aria-hidden />
          </span>
          <p id="score-h" className="mt-3 text-sm text-muted">
            Overall score
          </p>
          <p className="text-6xl font-bold tracking-tight tabular-nums">
            {sc.total}
            <span className="text-2xl text-faint">/100</span>
          </p>
          <p className="mt-2 font-semibold text-brand">{lv.label}</p>
          <p className="mt-1 text-sm text-muted">{lv.text}</p>
        </div>
        <div className="card min-w-0 space-y-4 p-6">
          <h3 className="font-semibold">How the score works</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span>
                <strong>Bugs found</strong> ({sc.found.size} of {BUGS.length}) × {WEIGHTS.bugs}
              </span>
              <span className="tabular-nums">{sc.parts.bugs.toFixed(1)} / {WEIGHTS.bugs}</span>
            </div>
            <Bar value={sc.parts.bugs} max={WEIGHTS.bugs} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span>
                <strong>Report accuracy</strong> ({Math.round(sc.accuracy * 100)}%) × {WEIGHTS.accuracy}
              </span>
              <span className="tabular-nums">{sc.parts.accuracy.toFixed(1)} / {WEIGHTS.accuracy}</span>
            </div>
            <Bar value={sc.parts.accuracy} max={WEIGHTS.accuracy} tone="bg-brand-2" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span>
                <strong>Phases completed</strong> ({sc.phasesDone} of {PHASES.length}) × {WEIGHTS.phases}
              </span>
              <span className="tabular-nums">{sc.parts.phases.toFixed(1)} / {WEIGHTS.phases}</span>
            </div>
            <Bar value={sc.parts.phases} max={WEIGHTS.phases} tone="bg-ok" />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            <strong>Bugs found</strong> counts reports that matched a real bug. <strong>Report accuracy</strong> is the average, over those reports, of your severity and priority
            compared with the team's: 1 point for exact, ½ for one step off, 0 otherwise. <strong>Phases</strong> rewards doing the whole job, not just the clicking.
            False positives and duplicates cost nothing, but they don't score either.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-h" className="space-y-4">
        <H2 id="cat-h">Bugs found by category</H2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATS.map((c) => {
            const all = BUGS.filter((b) => b.category === c);
            const f = all.filter((b) => sc.found.has(b.id)).length;
            const nm = sc.nearMiss.filter((b) => b.category === c).length;
            return (
              <li key={c} className="card min-w-0 space-y-2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{CATEGORY_LABEL[c]}</span>
                  <span className="text-sm tabular-nums">
                    <strong>{f}</strong>
                    <span className="text-faint"> / {all.length}</span>
                  </span>
                </div>
                <Bar value={f} max={all.length} tone={f === all.length ? 'bg-ok' : 'bg-brand'} />
                <p className="text-xs text-muted">{nm ? `${nm} triggered but not reported` : f === all.length ? 'All found' : ' '}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Matched */}
      <section aria-labelledby="matched-h" className="space-y-4">
        <H2 id="matched-h">Your reports that found a bug ({sc.matched.length})</H2>
        {sc.matched.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">
            No matched reports yet. Bugs count when you file a report in the app while on the screen where it happened.{' '}
            <a className="text-brand underline" href={href('/capstone/test')}>Go to the app</a>.
          </p>
        ) : (
          <ul className="space-y-3">
            {sc.matched.map(({ report: r, bug: b, sev, pri }) => (
              <li key={r.id} className="card min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-ok-soft px-2 py-0.5 font-semibold text-ok">Found</span>
                  <span className="text-faint">
                    {r.id} → {b.id} · {SCREEN_LABEL[b.screen]} · {CATEGORY_LABEL[b.category]}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{b.title}</p>
                <p className="text-sm break-words text-muted">Your title: "{r.title || '(untitled)'}"</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Rating label="Severity" given={r.severity} expected={b.severity} score={sev} />
                  <Rating label="Priority" given={r.priority} expected={b.priority} score={pri} />
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  <strong>Why {b.severity} / {b.priority}:</strong> <span className="text-muted">{b.rationale}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  <strong>Expected:</strong> <span className="text-muted">{b.expected}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Near misses */}
      {sc.nearMiss.length > 0 && (
        <section aria-labelledby="near-h" className="space-y-4">
          <H2 id="near-h">Near misses: triggered but not reported ({sc.nearMiss.length})</H2>
          <p className="max-w-3xl text-muted">
            You made these bugs happen in the app but didn't file a matching report, maybe because you didn't notice, or you reported it on a different screen. Go back,
            reproduce it, and report it from that screen.
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {sc.nearMiss.map((b) => (
              <li key={b.id} className="card min-w-0 border-warn/40 p-4">
                <p className="text-xs text-faint">
                  {SCREEN_LABEL[state.observedOn[b.id] ?? b.screen]} · {CATEGORY_LABEL[b.category]}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  <Search size={14} className="mr-1 inline text-warn" aria-hidden />
                  {revealed ? <strong>{b.title}. </strong> : null}
                  {b.hint}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unmatched */}
      <section aria-labelledby="unmatched-h" className="space-y-4">
        <H2 id="unmatched-h">Reports that didn't match a known bug ({sc.unmatched.length})</H2>
        {sc.unmatched.length === 0 ? (
          <p className="text-sm text-muted">None. Every report you filed matched a bug.</p>
        ) : (
          <>
            <p className="max-w-3xl text-muted">These didn't count, and that's not always a mistake. A report can be unmatched because it is:</p>
            <ul className="grid max-w-4xl grid-cols-1 gap-2 text-sm text-muted sm:grid-cols-3">
              <li className="rounded-xl bg-subtle p-3"><strong className="text-fg">A false positive:</strong> the app does what the brief says. Check the acceptance criteria.</li>
              <li className="rounded-xl bg-subtle p-3"><strong className="text-fg">A duplicate:</strong> the same bug reported twice. Only the first report counts.</li>
              <li className="rounded-xl bg-subtle p-3">
                <strong className="text-fg">A known issue or open question:</strong> the brief lists these. Good catch, but not a new bug. Or it happened on another screen than the one you picked.
              </li>
            </ul>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {sc.unmatched.map((r) => (
                <li key={r.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-mono text-xs text-faint">{r.id}</span>
                  <span className="min-w-0 flex-1 break-words">{r.title || '(untitled)'}</span>
                  <span className="text-xs text-muted">{SCREEN_LABEL[r.screen]}</span>
                  <span className={['rounded-md px-1.5 py-0.5 text-xs capitalize', SEV_TONE[r.severity]].join(' ')}>{r.severity}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Hints */}
      <section aria-labelledby="hints-h" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <H2 id="hints-h">{revealed ? `All ${BUGS.length} bugs` : `Still hidden: ${sc.notFound.length} bugs`}</H2>
          <button
            type="button"
            onClick={reveal}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium',
              revealed ? 'border-line hover:border-brand hover:text-brand' : 'border-danger/40 text-danger hover:bg-danger-soft',
            ].join(' ')}
          >
            {revealed ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />} {revealed ? 'Hide answers' : 'Reveal all answers'}
          </button>
        </div>
        {!revealed && sc.notFound.length > 0 && (
          <>
            <p className="max-w-3xl text-muted">Hints only, grouped by screen. Pick one, go back to the app and try it. Your score updates as soon as you file a matching report.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SCREENS.map((scr) => {
                const list = sc.notFound.filter((b) => b.screen === scr);
                if (!list.length) return null;
                return (
                  <div key={scr} className="card min-w-0 p-4">
                    <p className="font-semibold">
                      {SCREEN_LABEL[scr]} <span className="text-sm font-normal text-faint">({list.length})</span>
                    </p>
                    <ul className="mt-2 space-y-2">
                      {list.map((b) => (
                        <li key={b.id} className="flex items-start gap-2 text-sm leading-relaxed">
                          <Lightbulb size={15} className="mt-0.5 shrink-0 text-warn" aria-hidden />
                          <span>
                            <span className="text-xs text-faint">{CATEGORY_LABEL[b.category]}: </span>
                            {b.hint}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!revealed && sc.notFound.length === 0 && <p className="text-ok">You found every bug. Impressive!</p>}
        {revealed && (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-subtle text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Bug</th>
                  <th className="px-3 py-2 font-medium">Expected behavior</th>
                  <th className="px-3 py-2 font-medium">Rating and why</th>
                </tr>
              </thead>
              <tbody>
                {BUGS.map((b) => (
                  <tr key={b.id} className="border-t border-line align-top">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">
                        {sc.found.has(b.id) ? '✓ ' : ''}
                        {b.title}
                      </p>
                      <p className="text-xs text-faint">
                        {b.id} · {SCREEN_LABEL[b.screen]} · {CATEGORY_LABEL[b.category]}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{b.expected}</td>
                    <td className="px-3 py-2.5">
                      <span className={['rounded-md px-1.5 py-0.5 text-xs font-medium capitalize', SEV_TONE[b.severity]].join(' ')}>{b.severity}</span>{' '}
                      <span className="rounded-md bg-subtle px-1.5 py-0.5 text-xs font-medium">{b.priority}</span>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{b.rationale}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Certificate */}
      <section aria-labelledby="cert-h" className="space-y-4">
        <H2 id="cert-h">Your certificate</H2>
        {!reportDone ? (
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-sm text-muted">
              The certificate unlocks when you submit your test summary report (phase 5). A tester's job isn't done until the team has the recommendation.
            </p>
            <a href={href('/capstone/report')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg hover:opacity-90">
              Write the report <ArrowRight size={18} aria-hidden />
            </a>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 sm:w-80">
                <label htmlFor="cert-name" className="block text-sm font-semibold">
                  Name on the certificate
                </label>
                <input id="cert-name" value={name ?? ''} maxLength={60} onChange={(e) => saveName(e.target.value)} placeholder="Your name" autoComplete="name" className={inputCls + ' mt-1.5'} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={print} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-brand-fg hover:opacity-90">
                  <Printer size={17} aria-hidden /> Print or save as PDF
                </button>
                <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 font-medium hover:border-brand hover:text-brand">
                  <Download size={17} aria-hidden /> Download image
                </button>
              </div>
            </div>
            <div
              id="certificate"
              className="relative overflow-hidden rounded-2xl border-8 border-double p-6 text-center sm:p-12"
              style={{ background: '#ffffff', color: '#0e1120', borderColor: '#5b4bff', colorScheme: 'light' }}
            >
              <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 0% 0%, #eeecff 0, transparent 40%), radial-gradient(circle at 100% 100%, #e0f7f5 0, transparent 40%)' }} aria-hidden />
              <div className="relative">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: '#5b4bff' }}>
                  Certificate of completion
                </p>
                <p className="mt-4 text-sm sm:text-base" style={{ color: '#555b6e' }}>
                  This certifies that
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight break-words sm:text-5xl">{certName || 'Your name'}</p>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: '#555b6e' }}>
                  tested the FoodDash 2.0 release end to end: test plan, test cases, exploratory testing, bug reports and a release recommendation.
                </p>
                <p className="mt-6 text-lg font-semibold sm:text-xl">Bugwise Capstone · FoodDash 2.0 release</p>
                <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: '#5b4bff' }}>
                      {sc.total}
                    </p>
                    <p style={{ color: '#555b6e' }}>score / 100</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: '#5b4bff' }}>
                      {sc.found.size}
                    </p>
                    <p style={{ color: '#555b6e' }}>of {BUGS.length} bugs</p>
                  </div>
                  <div>
                    <p className="text-base font-bold sm:text-lg" style={{ color: '#5b4bff' }}>
                      {lv.label}
                    </p>
                    <p style={{ color: '#555b6e' }}>level</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t pt-4 text-left text-xs" style={{ borderColor: '#e5e7ef', color: '#555b6e' }}>
                  <span>
                    Date
                    <br />
                    <strong style={{ color: '#0e1120' }}>{certDate}</strong>
                  </span>
                  <span className="text-right">
                    Certificate ID
                    <br />
                    <strong className="font-mono" style={{ color: '#0e1120' }}>
                      {certId}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-faint">Tip: in the print dialog choose "Save as PDF" and landscape orientation. Only the certificate is printed.</p>
          </>
        )}
      </section>
    </div>
  );
}

function Rating({ label, given, expected, score }: { label: string; given: string; expected: string; score: number }) {
  return (
    <div className="rounded-xl bg-subtle p-3 text-sm">
      <p className="text-xs text-faint">{label}</p>
      <p className="mt-0.5">
        You: <strong className="capitalize">{given}</strong> · Team: <strong className="capitalize">{expected}</strong>
      </p>
      <p className={['text-xs font-medium', ptsTone(score)].join(' ')}>
        {pts(score)} ({score} pt)
      </p>
    </div>
  );
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function certificateSvg(o: { name: string; date: string; score: number; found: number; id: string; level: string }) {
  const f = "font-family=\"Inter, 'Segoe UI', Helvetica, Arial, sans-serif\"";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1130" viewBox="0 0 1600 1130">
<rect width="1600" height="1130" fill="#ffffff"/>
<circle cx="0" cy="0" r="520" fill="#eeecff"/><circle cx="1600" cy="1130" r="520" fill="#e0f7f5"/>
<rect x="40" y="40" width="1520" height="1050" rx="28" fill="none" stroke="#5b4bff" stroke-width="6"/>
<rect x="58" y="58" width="1484" height="1014" rx="18" fill="none" stroke="#5b4bff" stroke-width="2"/>
<g ${f} text-anchor="middle" fill="#0e1120">
<text x="800" y="200" font-size="30" font-weight="700" letter-spacing="8" fill="#5b4bff">CERTIFICATE OF COMPLETION</text>
<text x="800" y="290" font-size="32" fill="#555b6e">This certifies that</text>
<text x="800" y="400" font-size="88" font-weight="700">${esc(o.name || 'Bugwise tester')}</text>
<text x="800" y="490" font-size="30" fill="#555b6e">tested the FoodDash 2.0 release end to end: test plan, test cases,</text>
<text x="800" y="535" font-size="30" fill="#555b6e">exploratory testing, bug reports and a release recommendation.</text>
<text x="800" y="630" font-size="44" font-weight="600">Bugwise Capstone · FoodDash 2.0 release</text>
<text x="500" y="780" font-size="80" font-weight="700" fill="#5b4bff">${o.score}</text>
<text x="500" y="825" font-size="26" fill="#555b6e">score / 100</text>
<text x="800" y="780" font-size="80" font-weight="700" fill="#5b4bff">${o.found}</text>
<text x="800" y="825" font-size="26" fill="#555b6e">of ${BUGS.length} bugs found</text>
<text x="1100" y="770" font-size="40" font-weight="700" fill="#5b4bff">${esc(o.level)}</text>
<text x="1100" y="825" font-size="26" fill="#555b6e">level</text>
</g>
<line x1="140" y1="930" x2="1460" y2="930" stroke="#e5e7ef" stroke-width="2"/>
<g ${f} font-size="24" fill="#555b6e">
<text x="140" y="975">Date</text><text x="140" y="1015" font-weight="700" fill="#0e1120">${esc(o.date)}</text>
<text x="1460" y="975" text-anchor="end">Certificate ID</text><text x="1460" y="1015" text-anchor="end" font-weight="700" fill="#0e1120">${esc(o.id)}</text>
</g>
</svg>`;
}
