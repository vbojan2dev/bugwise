/** Static example for Do/Don't: a delivery card in dark mode with a hard-coded vs a semantic text color. */
export default function ColorExample({ variant }: { variant: 'bad' | 'good' }) {
  const bad = variant === 'bad';
  return (
    <div className="rounded-2xl bg-black p-3" style={{ colorScheme: 'dark' }}>
      <div className="rounded-xl bg-[#1c1c1e] p-3">
        <p className="text-[11px] font-semibold tracking-wide text-[#8e8e93] uppercase">Order #4821</p>
        <p className="mt-1 text-[15px] font-semibold" style={{ color: bad ? '#111111' : '#f5f5f7' }}>
          Your rider is 4 minutes away
        </p>
        <p className="mt-2 font-mono text-[11px] text-[#8e8e93]">{bad ? 'color: #111111  /* hard-coded */' : 'color: label  /* semantic */'}</p>
      </div>
    </div>
  );
}
