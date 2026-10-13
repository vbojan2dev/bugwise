import { useState } from 'react';
import { TextField } from './TextField';
import { MobileKeyboard, type KeyboardKind } from './MobileKeyboard';

interface Kind {
  key: string;
  tab: string;
  label: string;
  placeholder: string;
  kb: KeyboardKind;
  html: string;
  ios: string;
  android: string;
  test: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'url';
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'url';
}

const kinds: Kind[] = [
  {
    key: 'email',
    tab: 'Email',
    label: 'Email',
    placeholder: 'name@example.com',
    kb: 'email',
    type: 'email',
    html: 'type="email" autocomplete="email"',
    ios: '.emailAddress, autocapitalization off',
    android: 'textEmailAddress',
    test: 'The @ and . keys are visible, the first letter is NOT capitalized, and autocorrect does not "fix" the address.',
  },
  {
    key: 'number',
    tab: 'Number',
    label: 'Quantity',
    placeholder: '1',
    kb: 'number',
    type: 'text',
    inputMode: 'numeric',
    html: 'inputmode="numeric" pattern="[0-9]*"',
    ios: '.numberPad',
    android: 'number',
    test: 'Only digits are offered. But a keyboard is just a hint: pasting "12abc" must still be rejected or cleaned.',
  },
  {
    key: 'decimal',
    tab: 'Amount',
    label: 'Amount (EUR)',
    placeholder: '0.00',
    kb: 'decimal',
    type: 'text',
    inputMode: 'decimal',
    html: 'inputmode="decimal"',
    ios: '.decimalPad',
    android: 'numberDecimal',
    test: 'In German or Croatian the key shows a comma (12,50). Check the app accepts the separator the keyboard gives.',
  },
  {
    key: 'phone',
    tab: 'Phone',
    label: 'Phone',
    placeholder: '+385 91 234 5678',
    kb: 'phone',
    type: 'tel',
    html: 'type="tel" autocomplete="tel"',
    ios: '.phonePad',
    android: 'phone',
    test: 'The "+" is reachable for international numbers. Spaces, dashes and brackets from a pasted number are accepted or cleaned.',
  },
  {
    key: 'password',
    tab: 'Password',
    label: 'Password',
    placeholder: 'At least 8 characters',
    kb: 'password',
    type: 'password',
    html: 'type="password" autocomplete="current-password"',
    ios: 'isSecureTextEntry + textContentType .password',
    android: 'textPassword',
    test: 'No word suggestions, no autocorrect, characters are masked, and the password manager key is offered.',
  },
  {
    key: 'url',
    tab: 'Website',
    label: 'Website',
    placeholder: 'https://',
    kb: 'url',
    type: 'url',
    html: 'type="url" autocomplete="url"',
    ios: '.URL',
    android: 'textUri',
    test: 'The / and .com keys are offered, there are no spaces, and the first letter is not capitalized.',
  },
];

export default function KeyboardTypes() {
  const [i, setI] = useState(0);
  const k = kinds[i];
  return (
    <div className="not-prose my-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="font-semibold">⌨️ One field, many keyboards</p>
        <p className="text-sm text-muted">On a phone, the input type decides which keyboard opens. Pick a field type and see what the user gets.</p>
      </div>
      <div role="group" aria-label="Field type" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {kinds.map((x, j) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={i === j}
            onClick={() => setI(j)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${i === j ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg'}`}
          >
            {x.tab}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-[#f2f2f7] p-4 sm:p-6">
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-[22px] border border-black/10 bg-[#f2f2f7] shadow-sm">
            <div className="px-4 pt-5 pb-6">
              <TextField key={k.key} variant="ios" label={k.label} placeholder={k.placeholder} type={k.type} inputMode={k.inputMode} forceFocus />
            </div>
            <MobileKeyboard kind={k.kb} />
          </div>
        </div>
        <div className="space-y-4 border-t border-line p-5 text-sm md:border-t-0 md:border-l">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">Web (HTML)</dt>
              <dd className="mt-1 font-mono text-[13px] break-words text-fg">{k.html}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">iOS keyboard type</dt>
              <dd className="mt-1 font-mono text-[13px] text-fg">{k.ios}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-faint uppercase">Android inputType</dt>
              <dd className="mt-1 font-mono text-[13px] text-fg">{k.android}</dd>
            </div>
          </dl>
          <div className="rounded-xl bg-brand-soft p-3">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">What to check</p>
            <p className="mt-1 leading-relaxed text-fg">{k.test}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
