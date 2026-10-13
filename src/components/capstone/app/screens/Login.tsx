import { useState } from 'react';
import { Eye, EyeOff, UtensilsCrossed } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { useApp } from '../context';
import { Spinner } from '../ui';

export function Login({ onSuccess, toast }: { onSuccess: () => void; toast: (s: string) => void }) {
  const { t, api, seen, net } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) return setError(t('errEmpty'));
    if (!/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/.test(email)) return setError(t('errEmailFormat'));
    setError(null);
    setBusy(true);
    let kind: 'ok' | 'nouser' | 'badpw' = 'ok';
    api('POST', '/api/auth/login', {
      ms: 800,
      server: () => {
        // BUG B02: exact, case-sensitive comparison without trimming.
        if (email !== SPEC.testAccount.email) kind = 'nouser';
        else if (password !== SPEC.testAccount.password) kind = 'badpw';
        return kind === 'ok' ? { status: 200 } : { status: kind === 'nouser' ? 404 : 401 };
      },
    })
      .then(() => {
        setBusy(false);
        if (kind === 'ok') return onSuccess();
        // BUG B01: different messages reveal whether the account exists.
        setError(kind === 'nouser' ? t('errNoAccount') : t('errWrongPw'));
        seen('B01', 'login');
        if (kind === 'nouser' && email.trim().toLowerCase() === SPEC.testAccount.email) seen('B02', 'login');
      })
      .catch(() => {
        setBusy(false);
        setError(t('errOffline'));
      });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-(--sf) px-6 pt-8 pb-6">
      <div className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-(--brand) text-white" aria-hidden="true">
          <UtensilsCrossed size={22} />
        </span>
        <span className="t20 font-extrabold tracking-tight">FoodDash</span>
      </div>
      <h1 className="t26 mt-7 font-bold tracking-tight">{t('welcome')}</h1>
      <p className="t14 mt-1 text-(--sub)">{t('loginSub')}</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-3">
        <div>
          <label htmlFor="fd-email" className="t13 mb-1 block font-medium">
            {t('email')}
          </label>
          <input
            id="fd-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="t15 h-11 w-full rounded-xl border border-(--line) bg-(--bg) px-3 outline-none focus:border-(--brandfg)"
            aria-invalid={!!error}
            aria-describedby={error ? 'fd-login-err' : undefined}
          />
        </div>
        <div>
          <label htmlFor="fd-pw" className="t13 mb-1 block font-medium">
            {t('password')}
          </label>
          <div className="flex h-11 items-center rounded-xl border border-(--line) bg-(--bg) focus-within:border-(--brandfg)">
            <input
              id="fd-pw"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="t15 h-full w-0 min-w-0 flex-1 bg-transparent px-3 outline-none"
              aria-invalid={!!error}
              aria-describedby={error ? 'fd-login-err' : undefined}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t('hidePw') : t('showPw')} aria-pressed={show} className="grid size-11 place-items-center text-(--sub)">
              {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div aria-live="assertive">
          {error && (
            <p id="fd-login-err" role="alert" className="t13 rounded-lg bg-(--brandsoft) px-3 py-2 text-(--danger)">
              {error}
            </p>
          )}
        </div>
        <button type="submit" disabled={busy} aria-busy={busy} className="t16 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--brand) font-semibold text-white disabled:opacity-70">
          {busy && <Spinner />}
          {busy ? t('loggingIn') : t('login')}
        </button>
      </form>
      <button type="button" onClick={() => toast(t('forgotSent'))} className="t14 mt-3 self-center py-2 font-medium text-(--brandfg)">
        {t('forgot')}
      </button>
      <div className="mt-auto pt-6 text-center">
        <p className="t13 text-(--sub)">{t('noAccount')}</p>
        <button type="button" onClick={() => toast(t('signUpSoon'))} className="t14 py-2 font-semibold text-(--brandfg)">
          {t('signUp')}
        </button>
        {net === 'offline' && <p className="t12 text-(--warn)">{t('errOffline')}</p>}
      </div>
    </div>
  );
}
