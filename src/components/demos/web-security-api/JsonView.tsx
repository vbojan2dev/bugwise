import type { ReactNode } from 'react';

/** Pretty JSON with simple syntax colors (on a dark code surface). */
export function JsonView({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? '';
  const out: ReactNode[] = [];
  const re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(
        <span key={k++} style={{ color: m[2] ? '#93c5fd' : '#86efac' }}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[3]) {
      out.push(
        <span key={k++} style={{ color: '#f9a8d4' }}>
          {m[0]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} style={{ color: '#fcd34d' }}>
          {m[0]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <pre className="m-0 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap text-[#e2e5f0]">{out}</pre>;
}
