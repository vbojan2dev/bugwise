/** Static diagram: what each part of "2.4.1 (318)" means. Renders on its own light surface. */
const parts = [
  { text: '2', name: 'Major', note: 'Big, possibly breaking change (redesign, new database)', color: '#c2410c', bg: '#ffedd5' },
  { text: '4', name: 'Minor', note: 'New features, still compatible', color: '#047857', bg: '#d1fae5' },
  { text: '1', name: 'Patch', note: 'Bug fixes only', color: '#1d4ed8', bg: '#dbeafe' },
];

export default function VersionAnatomy() {
  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-[#f2f2f7] p-4 text-black sm:p-6">
      <div className="flex flex-wrap items-end justify-center gap-1 font-mono text-[34px] leading-none font-bold sm:text-[44px]" aria-label="Version 2.4.1, build 318">
        {parts.map((p, i) => (
          <span key={p.name} className="flex items-end">
            <span className="rounded-lg px-2 py-1" style={{ color: p.color, background: p.bg }}>
              {p.text}
            </span>
            {i < parts.length - 1 && <span className="px-0.5 text-black/40">.</span>}
          </span>
        ))}
        <span className="ml-2 rounded-lg px-2 py-1 text-[26px] sm:text-[32px]" style={{ color: '#6d28d9', background: '#ede9fe' }}>
          (318)
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
        {parts.map((p) => (
          <div key={p.name} className="min-w-0 rounded-xl bg-white p-3">
            <dt className="font-semibold" style={{ color: p.color }}>
              {p.name} version
            </dt>
            <dd className="text-black/70">{p.note}</dd>
          </div>
        ))}
        <div className="min-w-0 rounded-xl bg-white p-3">
          <dt className="font-semibold" style={{ color: '#6d28d9' }}>
            Build number
          </dt>
          <dd className="text-black/70">Goes up with every build the team makes, even when the version stays the same</dd>
        </div>
      </dl>
      <p className="mt-3 text-center text-[12px] text-black/60 [overflow-wrap:anywhere]">
        iOS: <code>CFBundleShortVersionString</code> (version) + <code>CFBundleVersion</code> (build) · Android: <code>versionName</code> + <code>versionCode</code>
      </p>
    </div>
  );
}
