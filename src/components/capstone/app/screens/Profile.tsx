import { useEffect, useState } from 'react';
import { Globe, House, LogOut, Mail, Phone } from 'lucide-react';
import { SPEC } from '@/lib/capstone';
import { USER } from '../data';
import { LANG_NAMES } from '../i18n';
import { useApp } from '../context';
import { Sheet, Spinner, Switch, TopBar } from '../ui';
import type { Lang, Settings } from '../types';

export function Profile({ onLogout, toast }: { onLogout: () => void; toast: (s: string) => void }) {
  const { t, lang, setLang, settings, setSettings, api, loggedIn, active, seen } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<keyof Settings | null>(null);

  // BUG B19: this screen is still reachable (via Back) after logout and shows personal data.
  useEffect(() => {
    if (active && !loggedIn) seen('B19', 'profile');
  }, [active, loggedIn, seen]);

  const toggle = (key: keyof Settings, value: boolean) => {
    const prev = settings;
    setSettings({ ...settings, [key]: value });
    setSaving(key);
    api('PUT', '/api/me/settings', { ms: 400 })
      .then(() => {
        setSaving(null);
        toast(t('saved'));
      })
      .catch(() => {
        setSaving(null);
        setSettings(prev);
        toast(t('offlineAction'));
      });
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    api('PUT', '/api/me/settings', { ms: 400 }).catch(() => {});
  };

  const logout = () => {
    setBusy(true);
    api('POST', '/api/auth/logout', { ms: 400, server: () => ({ status: 204 }) })
      .catch(() => {})
      .then(() => {
        setBusy(false);
        setConfirm(false);
        onLogout();
      });
  };

  const info = (Icon: typeof Mail, label: string, value: string) => (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon size={17} aria-hidden="true" className="shrink-0 text-(--sub)" />
      <div className="min-w-0">
        <p className="t12 text-(--sub)">{label}</p>
        <p className="t14 [overflow-wrap:anywhere]">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col">
      <TopBar title={t('profile')} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="flex items-center gap-3 bg-(--sf) px-4 py-4">
          <span aria-hidden="true" className="t18 grid size-12 shrink-0 place-items-center rounded-full bg-(--brandsoft) font-bold text-(--brandfg)">
            MN
          </span>
          <div className="min-w-0">
            <p className="t17 font-semibold">{USER.name}</p>
            <p className="t13 truncate text-(--sub)">{USER.email}</p>
          </div>
        </div>
        <h2 className="t12 px-4 pt-4 pb-1.5 font-semibold tracking-wide text-(--sub) uppercase">{t('personal')}</h2>
        <div className="divide-y divide-(--line) bg-(--sf)">
          {info(Mail, t('email'), USER.email)}
          {info(Phone, t('phone'), USER.phone)}
          {info(House, t('homeAddress'), USER.home)}
        </div>
        <h2 className="t12 px-4 pt-4 pb-1.5 font-semibold tracking-wide text-(--sub) uppercase" id="fd-lang">
          {t('language')}
        </h2>
        <div role="radiogroup" aria-labelledby="fd-lang" className="divide-y divide-(--line) bg-(--sf)">
          {(['en', 'de', 'sr'] as Lang[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => changeLang(l)} className="t15 flex w-full items-center gap-3 px-4 py-3 text-left">
              <Globe size={17} aria-hidden="true" className="text-(--sub)" />
              <span className="flex-1">{LANG_NAMES[l]}</span>
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2" style={{ borderColor: lang === l ? 'var(--brandfg)' : 'var(--line)' }}>
                {lang === l && <span className="size-2.5 rounded-full bg-(--brandfg)" />}
              </span>
            </button>
          ))}
        </div>
        <h2 className="t12 px-4 pt-4 pb-1.5 font-semibold tracking-wide text-(--sub) uppercase">{t('notifications')}</h2>
        <div className="divide-y divide-(--line) bg-(--sf)">
          <Switch checked={settings.orderUpdates} disabled={saving === 'orderUpdates'} onChange={(v) => toggle('orderUpdates', v)} label={t('orderUpdates')} sub={t('orderUpdatesSub')} />
          <Switch checked={settings.promotions} disabled={saving === 'promotions'} onChange={(v) => toggle('promotions', v)} label={t('promotions')} sub={t('promotionsSub')} />
        </div>
        <div className="mt-4 bg-(--sf)">
          <button type="button" onClick={() => setConfirm(true)} className="t15 flex w-full items-center gap-3 px-4 py-3 font-semibold text-(--danger)">
            <LogOut size={17} aria-hidden="true" /> {t('logout')}
          </button>
        </div>
        <p className="t12 mt-4 text-center text-(--sub)">FoodDash · {t('version', { v: SPEC.version, b: SPEC.build })}</p>
      </div>
      {confirm && (
        <Sheet title={t('logoutConfirm')} onClose={() => setConfirm(false)}>
          <p className="t14 text-(--sub)">{t('logoutBody')}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setConfirm(false)} className="t15 h-11 flex-1 rounded-xl bg-(--sf2) font-semibold">
              {t('cancel')}
            </button>
            <button type="button" onClick={logout} disabled={busy} className="t15 flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-(--brand) font-semibold text-white">
              {busy && <Spinner size={14} />}
              {t('logout')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
