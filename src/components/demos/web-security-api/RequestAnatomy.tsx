import type { ReactNode } from 'react';

/** Static diagram: the parts of an HTTP request and response. No state, renders without a client directive. */

function Part({ color, label, children }: { color: string; label: string; children: string }) {
  return (
    <span className="inline-flex flex-col items-start">
      <span className="rounded px-1 font-mono text-[12.5px] font-semibold" style={{ color, background: `${color}22` }}>
        {children}
      </span>
      <span className="mt-0.5 font-sans text-[10px] font-semibold tracking-wide uppercase" style={{ color }}>
        {label}
      </span>
    </span>
  );
}

function Block({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">{title}</p>
        <p className="text-[11px] text-white/40">{note}</p>
      </div>
      <div className="mt-1 rounded-lg bg-white/[0.04] p-2.5 font-mono text-[12px] leading-relaxed break-all text-[#d6d9e8]">{children}</div>
    </div>
  );
}

export default function RequestAnatomy() {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="min-w-0 rounded-2xl border border-line bg-[#0e1120] p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <span className="rounded bg-[#5b4bff] px-1.5 py-0.5 text-[11px]">1</span> The request (you → server)
        </p>
        <div className="space-y-3">
          <Block title="Request line" note="what and where">
            <div className="flex flex-wrap items-start gap-x-1.5 gap-y-2">
              <Part color="#4ade80" label="Method">
                POST
              </Part>
              <Part color="#93c5fd" label="Base URL">
                https://api.shop.test/v1
              </Part>
              <Part color="#fcd34d" label="Path">
                /cart/items
              </Part>
              <Part color="#f9a8d4" label="Query">
                ?source=app
              </Part>
            </div>
          </Block>
          <Block title="Headers" note="extra info, e.g. who you are">
            <span className="text-[#93c5fd]">Authorization</span>: Bearer test-anna-123
            <br />
            <span className="text-[#93c5fd]">Content-Type</span>: application/json
          </Block>
          <Block title="Body" note="the data you send (JSON)">
            {'{ '}
            <span className="text-[#93c5fd]">"productId"</span>: <span className="text-[#fcd34d]">1</span>, <span className="text-[#93c5fd]">"quantity"</span>: <span className="text-[#fcd34d]">2</span>
            {' }'}
          </Block>
        </div>
      </div>
      <div className="min-w-0 rounded-2xl border border-line bg-[#0e1120] p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <span className="rounded bg-[#0f9f5a] px-1.5 py-0.5 text-[11px]">2</span> The response (server → you)
        </p>
        <div className="space-y-3">
          <Block title="Status" note="did it work?">
            <span className="rounded bg-[#0f9f5a] px-1.5 py-0.5 font-bold text-white">201 Created</span>
            <span className="ml-2 text-white/50">· 143 ms</span>
          </Block>
          <Block title="Headers" note="info about the response">
            <span className="text-[#93c5fd]">Content-Type</span>: application/json
            <br />
            <span className="text-[#93c5fd]">Location</span>: /v1/cart/items/1
          </Block>
          <Block title="Body" note="the data you get back">
            {'{ '}
            <span className="text-[#93c5fd]">"items"</span>: [ {'{ '}
            <span className="text-[#93c5fd]">"productId"</span>: <span className="text-[#fcd34d]">1</span>, <span className="text-[#93c5fd]">"quantity"</span>: <span className="text-[#fcd34d]">2</span>
            {' }'} ], <span className="text-[#93c5fd]">"total"</span>: <span className="text-[#fcd34d]">39.98</span>
            {' }'}
          </Block>
        </div>
      </div>
    </div>
  );
}
