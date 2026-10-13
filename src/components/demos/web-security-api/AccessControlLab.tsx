import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Lock, Package, RotateCcw, Shield, ShieldAlert, ShieldCheck, User, Info, Loader2, Send } from 'lucide-react';
import { JsonView } from './JsonView';

/*
 * Access-control lab: a simulated test environment with two test users and two versions of the
 * same shop, a secure one and a vulnerable one. Nothing is sent anywhere; every "server" answer
 * is computed in this file.
 */

type Mode = 'secure' | 'vulnerable';
type UserId = 'anna' | 'ben';

const USERS: Record<UserId, { name: string; email: string }> = {
  anna: { name: 'Anna Novak', email: 'anna@test.com' },
  ben: { name: 'Ben Okafor', email: 'ben@test.com' },
};
const ORDERS: Record<number, { owner: UserId; item: string; total: string; address: string; date: string }> = {
  1041: { owner: 'anna', item: 'Running shoes', total: '€89.00', address: '21 Baker St, Zagreb', date: '2 Oct' },
  1042: { owner: 'anna', item: 'Water bottle', total: '€12.50', address: '21 Baker St, Zagreb', date: '9 Oct' },
  1043: { owner: 'ben', item: 'Yoga mat', total: '€34.00', address: '7 Elm Rd, Split', date: '5 Oct' },
  1044: { owner: 'ben', item: 'Fitness tracker', total: '€129.00', address: '7 Elm Rd, Split', date: '11 Oct' },
};
const ordersOf = (u: UserId) => Object.entries(ORDERS).filter(([, o]) => o.owner === u).map(([id]) => Number(id));

type Verdict = { kind: 'ok' | 'vuln' | 'info'; title: string; text: string };
interface ReqResult {
  status: number;
  body: unknown;
  verdict: Verdict;
}

const ACCENT = '#0d7a5f';

function VerdictBox({ v }: { v: Verdict }) {
  const styles = {
    ok: { cls: 'border-ok/40 bg-ok-soft', icon: <ShieldCheck size={18} className="text-ok" /> },
    vuln: { cls: 'border-danger/40 bg-danger-soft', icon: <ShieldAlert size={18} className="text-danger" /> },
    info: { cls: 'border-line bg-subtle', icon: <Info size={18} className="text-muted" /> },
  }[v.kind];
  return (
    <div className={`flex gap-2.5 rounded-xl border p-3 ${styles.cls}`} role="status">
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-fg">{v.title}</p>
        <p className="mt-0.5 text-muted">{v.text}</p>
      </div>
    </div>
  );
}

function ErrorPage({ code, title, text }: { code: number; title: string; text: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[34px] font-bold text-[#c4c8d6]">{code}</p>
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-[260px] text-[13px] text-[#5c6178]">{text}</p>
    </div>
  );
}

export default function AccessControlLab() {
  const [mode, setMode] = useState<Mode>('secure');
  const [user, setUser] = useState<UserId>('anna');
  const [path, setPath] = useState('/account');
  const [input, setInput] = useState('/account');
  const [elevated, setElevated] = useState(false);
  const [name, setName] = useState(USERS.anna.name);
  const [addAdmin, setAddAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [reqResult, setReqResult] = useState<ReqResult | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const restart = (m: Mode, u: UserId) => {
    window.clearTimeout(timer.current);
    setMode(m);
    setUser(u);
    setPath('/account');
    setInput('/account');
    setElevated(false);
    setName(USERS[u].name);
    setAddAdmin(false);
    setSending(false);
    setReqResult(null);
  };

  const go = (raw: string) => {
    let p = raw.trim().replace(/^https?:\/\//, '').replace(/^shop\.test/, '');
    if (!p.startsWith('/')) p = `/${p}`;
    p = p.replace(/\/+$/, '') || '/';
    setPath(p);
    setInput(p);
  };

  const isAdmin = mode === 'vulnerable' && elevated;
  const me = USERS[user];

  // ---- "Server": decide what the page shows
  let page: ReactNode;
  let verdict: Verdict;
  const orderMatch = /^\/orders\/(\d+)$/.exec(path);
  if (path === '/account' || path === '/') {
    verdict = {
      kind: 'info',
      title: `Logged in as ${me.name} (customer)`,
      text: `Your orders are ${ordersOf(user).join(' and ')}. Now try an order number that is not yours, or open /admin.`,
    };
    page = (
      <div>
        <p className="text-[18px] font-bold">Hi, {me.name.split(' ')[0]}</p>
        <p className="text-[12px] text-[#5c6178]">{me.email}</p>
        <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">Your orders</p>
        <div className="space-y-1.5">
          {ordersOf(user).map((id) => (
            <button key={id} type="button" onClick={() => go(`/orders/${id}`)} className="flex w-full items-center gap-2 rounded-lg border border-[#e5e7ef] px-3 py-2 text-left text-[13px] hover:bg-[#f6f7fb]">
              <Package size={15} style={{ color: ACCENT }} />
              <span className="min-w-0 flex-1">
                Order #{id} · {ORDERS[id].item}
              </span>
              <ArrowRight size={14} className="text-[#8a8fa3]" />
            </button>
          ))}
        </div>
      </div>
    );
  } else if (orderMatch) {
    const id = Number(orderMatch[1]);
    const o = ORDERS[id];
    const showOrder = o && (o.owner === user || mode === 'vulnerable');
    if (!o) {
      verdict = { kind: 'info', title: 'This order does not exist', text: 'A 404 here is correct. Try an order number that exists but belongs to the other test user (1041–1044).' };
      page = <ErrorPage code={404} title="Order not found" text="We couldn't find that order." />;
    } else if (!showOrder) {
      verdict = {
        kind: 'ok',
        title: 'Secure: the server checked who owns the order',
        text: `Order #${id} belongs to ${USERS[o.owner].name}, so ${me.name.split(' ')[0]} gets “not found”. A 403 would also be fine. A 404 even hides that the order exists.`,
      };
      page = <ErrorPage code={404} title="Order not found" text="We couldn't find that order." />;
    } else {
      verdict =
        o.owner === user
          ? { kind: 'info', title: 'Your own order', text: 'Seeing your own order is expected. Change the number in the URL bar to one that belongs to the other user.' }
          : {
              kind: 'vuln',
              title: 'Vulnerability: broken access control (IDOR)',
              text: `${me.name.split(' ')[0]} can read ${USERS[o.owner].name}'s order, including the home address, just by changing a number in the URL. Report it privately as high or critical severity.`,
            };
      page = (
        <div>
          <p className="text-[11px] text-[#5c6178]">Order #{id} · {o.date}</p>
          <p className="text-[18px] font-bold">{o.item}</p>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            {[
              ['Customer', USERS[o.owner].name],
              ['Email', USERS[o.owner].email],
              ['Ship to', o.address],
              ['Total', o.total],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-[#f0f1f5] pb-1.5">
                <dt className="text-[#5c6178]">{k}</dt>
                <dd className={`min-w-0 text-right font-medium ${o.owner !== user ? 'text-[#b91c1c]' : ''}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }
  } else if (path === '/admin') {
    if (mode === 'secure') {
      verdict = {
        kind: 'ok',
        title: 'Secure: 403 Forbidden',
        text: 'The Admin link is hidden AND the server refuses the page for a customer. Hiding the button alone would not be enough.',
      };
      page = <ErrorPage code={403} title="Access denied" text="You don't have permission to view this page." />;
    } else {
      verdict = elevated
        ? { kind: 'vuln', title: 'Vulnerability: you made yourself an admin', text: 'Because the server accepted "isAdmin": true from the client, this customer account now has full admin access.' }
        : {
            kind: 'vuln',
            title: 'Vulnerability: admin page open to a customer',
            text: 'The Admin link is hidden in the menu, but the server never checks the role. Anyone who guesses /admin gets in.',
          };
      page = (
        <div>
          <p className="flex items-center gap-1.5 text-[18px] font-bold">
            <Shield size={18} style={{ color: ACCENT }} /> Admin panel
          </p>
          <p className="mt-3 mb-1.5 text-[11px] font-semibold tracking-wide text-[#5c6178] uppercase">All customers</p>
          <ul className="space-y-1.5 text-[13px]">
            {[...Object.values(USERS), { name: 'Carla Ruiz', email: 'carla@test.com' }].map((u) => (
              <li key={u.email} className="flex items-center gap-2 rounded-lg border border-[#e5e7ef] px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">
                  {u.name} · <span className="text-[#5c6178]">{u.email}</span>
                </span>
                <span className="rounded bg-[#fee2e2] px-1.5 text-[11px] font-semibold text-[#b91c1c]">Delete</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  } else {
    verdict = { kind: 'info', title: 'Page not found', text: 'Try /account, /orders/1043 or /admin.' };
    page = <ErrorPage code={404} title="Page not found" text="Check the address and try again." />;
  }

  // ---- "Server": profile update request
  const sendRequest = () => {
    if (sending) return;
    setSending(true);
    setReqResult(null);
    const n = name.trim();
    const withAdmin = addAdmin;
    const m = mode;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSending(false);
      if (!n) {
        setReqResult({ status: 400, body: { error: 'name is required' }, verdict: { kind: 'info', title: 'Validation works', text: 'An empty name is rejected with 400. Type a name and add the hidden field.' } });
        return;
      }
      if (m === 'vulnerable' && withAdmin) {
        setElevated(true);
        setReqResult({
          status: 200,
          body: { name: n, email: USERS[user].email, isAdmin: true },
          verdict: {
            kind: 'vuln',
            title: 'Vulnerability: privilege escalation',
            text: 'The server copied every field from the request into the user record, including isAdmin. Look at the menu: an Admin link appeared.',
          },
        });
        return;
      }
      setReqResult({
        status: 200,
        body: { name: n, email: USERS[user].email, isAdmin: false },
        verdict: withAdmin
          ? { kind: 'ok', title: 'Secure: the extra field was ignored', text: 'The name changed, but isAdmin stayed false. Rejecting the request with 400 or 403 would also be fine.' }
          : { kind: 'info', title: 'Normal profile update', text: 'This is what the app itself sends. Now tick “Add hidden field” and send again.' },
      });
    }, 500);
  };

  const otherOrder = user === 'anna' ? 1043 : 1041;
  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${active ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'}`;

  return (
    <div className="not-prose my-8 rounded-3xl border border-line bg-subtle p-3 sm:p-5">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-faint uppercase">App version</p>
          <div role="radiogroup" aria-label="App version" className="inline-flex rounded-xl bg-bg p-1 ring-1 ring-line">
            {(['secure', 'vulnerable'] as Mode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => restart(m, user)} className={pill(mode === m)}>
                {m === 'secure' ? 'Secure app' : 'Vulnerable app'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-faint uppercase">Logged in as (test user)</p>
          <div role="radiogroup" aria-label="Test user" className="inline-flex rounded-xl bg-bg p-1 ring-1 ring-line">
            {(['anna', 'ben'] as UserId[]).map((u) => (
              <button key={u} type="button" role="radio" aria-checked={user === u} onClick={() => restart(mode, u)} className={pill(user === u)}>
                {USERS[u].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => restart(mode, user)} className="ml-auto flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Try:</span>
        <button type="button" onClick={() => go(`/orders/${otherOrder}`)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium hover:border-brand hover:text-brand">
          1 · Another user’s order
        </button>
        <button type="button" onClick={() => go('/admin')} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium hover:border-brand hover:text-brand">
          2 · Open /admin
        </button>
        <a href="#profile-request" className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium hover:border-brand hover:text-brand">
          3 · Add isAdmin to a request
        </a>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Fake browser */}
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-line-strong bg-white text-[#0e1120] shadow-sm">
            <form
              className="flex items-center gap-2 border-b border-[#e5e7ef] bg-[#f6f7fb] px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                go(input);
              }}
            >
              <Lock size={13} className="shrink-0 text-[#5c6178]" />
              <span className="shrink-0 font-mono text-[12px] text-[#5c6178]">shop.test</span>
              <input
                aria-label="Address bar path"
                spellCheck={false}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-0 min-w-0 flex-1 rounded-md border border-[#d9dce6] bg-white px-2 py-1 font-mono text-[12px] outline-none focus:border-[#5b4bff] focus:ring-2 focus:ring-[#5b4bff]/25"
              />
              <button type="submit" className="shrink-0 rounded-md bg-[#0e1120] px-2.5 py-1 text-[12px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4bff]">
                Go
              </button>
            </form>
            <div className="flex items-center gap-3 border-b border-[#f0f1f5] px-4 py-2 text-[12.5px]">
              <span className="font-bold" style={{ color: ACCENT }}>
                FitShop
              </span>
              <button type="button" onClick={() => go('/account')} className="text-[#3d4257] hover:underline">
                My account
              </button>
              {isAdmin && (
                <button type="button" onClick={() => go('/admin')} className="font-semibold text-[#b91c1c] hover:underline">
                  Admin
                </button>
              )}
              <span className="ml-auto flex items-center gap-1 text-[#5c6178]">
                <User size={13} /> {me.name.split(' ')[0]}
                {isAdmin && <span className="rounded bg-[#fee2e2] px-1 text-[10px] font-bold text-[#b91c1c]">ADMIN</span>}
              </span>
            </div>
            <div className="min-h-[230px] px-4 py-4">{page}</div>
          </div>
          <VerdictBox v={verdict} />
        </div>

        {/* Request editor */}
        <div id="profile-request" className="min-w-0 scroll-mt-24 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-line bg-[#0e1120] text-[#d6d9e8]">
            <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold tracking-wide text-white/55 uppercase">Edit a request (like a proxy tool would)</p>
            <div className="space-y-2.5 p-3">
              <p className="font-mono text-[12px]">
                <span className="font-bold text-[#c4b5fd]">PATCH</span> /api/profile
              </p>
              <label className="flex items-center gap-2 text-[12px]">
                <span className="w-[42px] shrink-0 font-mono text-white/55">name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-0 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-[12px] text-white outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/20 px-2 py-1.5 text-[12px]">
                <input type="checkbox" checked={addAdmin} onChange={(e) => setAddAdmin(e.target.checked)} className="size-3.5 accent-[#a5b4fc]" />
                Add hidden field <code className="font-mono text-[#fcd34d]">"isAdmin": true</code>
              </label>
              <div className="rounded-lg bg-white/[0.04] p-2.5">
                <JsonView value={addAdmin ? { name, isAdmin: true } : { name }} />
              </div>
              <button
                type="button"
                onClick={sendRequest}
                disabled={sending}
                className="flex items-center gap-1.5 rounded-md bg-[#5b4bff] px-3 py-1.5 text-[12.5px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5b4fc] disabled:opacity-60"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send request
              </button>
            </div>
            <div className="border-t border-white/10 p-3">
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-white/55 uppercase">Response</p>
              {!reqResult && !sending && <p className="text-[12px] text-white/40">Not sent yet.</p>}
              {sending && <p className="text-[12px] text-white/50">Waiting for the server…</p>}
              {reqResult && (
                <>
                  <p className="mb-1.5 font-mono text-[12px]">
                    <span className={`rounded px-1.5 py-0.5 font-bold text-white ${reqResult.status < 300 ? 'bg-[#0f7a43]' : 'bg-[#b45309]'}`}>{reqResult.status === 200 ? '200 OK' : '400 Bad Request'}</span>
                  </p>
                  <JsonView value={reqResult.body} />
                </>
              )}
            </div>
          </div>
          {reqResult && <VerdictBox v={reqResult.verdict} />}
        </div>
      </div>
      <p className="mt-4 text-xs text-faint">Simulated test environment with fake test users. No real requests are sent.</p>
    </div>
  );
}
