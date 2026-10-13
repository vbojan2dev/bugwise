import { AlertCircle } from 'lucide-react';

const RED = '#c81e1e';

function Box({ value, error }: { value: string; error?: boolean }) {
  return (
    <div className="mt-1 flex h-9 items-center rounded-lg border bg-white px-3 text-[13px]" style={{ borderColor: error ? RED : '#d0d5dd', boxShadow: error ? `inset 0 0 0 1px ${RED}` : undefined }}>
      {value}
    </div>
  );
}

/** Static example: the same failed form shown with bad and with good error handling. */
export default function ErrorExample({ variant }: { variant: 'bad' | 'good' }) {
  const good = variant === 'good';
  return (
    <div className="mx-auto w-full max-w-[18rem] rounded-xl bg-[#f2f2f7] p-3 text-[#18181b]" style={{ colorScheme: 'light' }}>
      {good ? (
        <div className="rounded-lg border-2 bg-white px-3 py-2" style={{ borderColor: RED }}>
          <p className="text-[13px] font-bold">There are 2 problems</p>
          <ul className="mt-1 space-y-0.5 text-[12px] font-medium underline underline-offset-2" style={{ color: RED }}>
            <li>Enter a date of birth like 27 3 1995</li>
            <li>Enter a full postcode, like SW1A 1AA</li>
          </ul>
        </div>
      ) : (
        <div className="rounded-lg bg-[#3a3a3c] px-3 py-2 text-[12px] text-white">Invalid input (422)</div>
      )}
      <div className="mt-3 space-y-2.5">
        <div>
          <p className="text-[12px] font-semibold">Date of birth</p>
          <Box value="31 2 1995" error />
          {good && (
            <p className="mt-1 flex items-start gap-1 text-[11px] font-medium" style={{ color: RED }}>
              <AlertCircle size={12} className="mt-px shrink-0" /> Enter a date of birth like 27 3 1995 (February has no 31st)
            </p>
          )}
        </div>
        <div>
          <p className="text-[12px] font-semibold">Postcode</p>
          <Box value={good ? 'SW1A' : ''} error />
          {good && (
            <p className="mt-1 flex items-start gap-1 text-[11px] font-medium" style={{ color: RED }}>
              <AlertCircle size={12} className="mt-px shrink-0" /> Enter a full postcode, like SW1A 1AA
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
