/** Static mock of a password reset email, in a good or a bad version (used inside <Do>/<Dont>). */
export default function ResetEmail({ variant }: { variant: 'good' | 'bad' }) {
  const bad = variant === 'bad';
  const mark = (on: boolean, text: string) => (on ? <mark className="rounded bg-[#fee2e2] px-0.5 text-[#991b1b]">{text}</mark> : text);
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl bg-white text-left text-black shadow-sm" style={{ colorScheme: 'light' }}>
      <div className="border-b border-black/10 bg-[#f7f7f9] px-3 py-2 text-[12px]">
        <p className="font-semibold">FreshCart</p>
        <p className="truncate text-[#3c3c43]/70">{bad ? 'Your password' : 'Reset your FreshCart password'}</p>
      </div>
      <div className="space-y-2 px-3 py-3 text-[12.5px] leading-snug">
        <p>{bad ? mark(true, 'Hi {{first_name}},') : 'Hi Anna,'}</p>
        {bad ? (
          <p>
            You asked for your password. It is: {mark(true, 'Secret123!')} You can change it here:
          </p>
        ) : (
          <p>Tap the button to choose a new password. The link expires in 30 minutes and works once.</p>
        )}
        <span className="inline-block rounded-lg bg-[#15803d] px-3 py-1.5 text-[12px] font-semibold text-white">Reset password</span>
        <p className="break-all text-[11px] text-[#2563eb]">{bad ? mark(true, 'http://test-env.freshcart.local/reset?email=anna@test.com') : 'https://freshcart.com/reset?t=8f2a…'}</p>
        {!bad && <p className="text-[11px] text-[#3c3c43]/70">Didn't ask for this? Ignore this email. Your password won't change.</p>}
      </div>
    </div>
  );
}
