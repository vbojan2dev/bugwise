import { Eye } from 'lucide-react';

/** Static mini login form showing a safe (generic) or unsafe (revealing) error message. */
export default function LoginErrorExample({ email, message }: { email: string; message: string }) {
  return (
    <div className="mx-auto w-full max-w-[260px] space-y-2 rounded-2xl bg-white p-3 text-black shadow-sm">
      <div className="flex h-9 items-center rounded-lg bg-[#f2f2f7] px-3 text-[13px]">{email}</div>
      <div className="flex h-9 items-center justify-between rounded-lg bg-[#f2f2f7] px-3 text-[13px] tracking-widest">
        ••••••••
        <Eye size={15} className="text-[#3c3c43]/50" aria-hidden="true" />
      </div>
      <p className="rounded-lg bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">{message}</p>
      <div className="grid h-9 place-items-center rounded-lg bg-[#15803d] text-[13px] font-semibold text-white">Log in</div>
    </div>
  );
}
