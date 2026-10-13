import { ArrowBigUp, Delete, Globe, KeyRound, Smile } from 'lucide-react';

export type KeyboardKind = 'default' | 'email' | 'url' | 'number' | 'decimal' | 'phone' | 'password';

const sub: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ' };

/** A static, iOS-style software keyboard. Purely visual: it shows WHICH keyboard a field opens. */
export function MobileKeyboard({ kind, compact = false, dark = false, capsHint = false }: { kind: KeyboardKind; compact?: boolean; dark?: boolean; capsHint?: boolean }) {
  const h = compact ? 26 : 38;
  const fs = compact ? 12 : 17;
  const bg = dark ? '#2b2b2d' : '#d1d3d9';
  const key = dark ? '#6b6b6e' : '#fff';
  const fn = dark ? '#464648' : '#abb0bc';
  const fg = dark ? '#fff' : '#000';
  const K = ({ children, w = 1, f = false, grow = false }: { children: React.ReactNode; w?: number; f?: boolean; grow?: boolean }) => (
    <span
      className={`grid place-items-center rounded-[5px] ${grow ? 'flex-1' : ''}`}
      style={{ height: h, flex: grow ? undefined : `${w} 1 0`, background: f ? fn : key, color: fg, fontSize: fs, boxShadow: '0 1px 0 rgba(0,0,0,.3)', minWidth: 0 }}
    >
      {children}
    </span>
  );
  const gap = compact ? 4 : 6;
  const row = (keys: string[], pad = 0) => (
    <div className="flex" style={{ gap, paddingInline: pad }}>
      {keys.map((k) => (
        <K key={k}>{capsHint ? k.toUpperCase() : k}</K>
      ))}
    </div>
  );

  if (kind === 'number' || kind === 'decimal' || kind === 'phone') {
    const bottomLeft = kind === 'phone' ? '+ * #' : kind === 'decimal' ? '.' : '';
    return (
      <div aria-hidden className="select-none" style={{ background: bg, padding: gap, paddingBottom: gap * 2.5 }}>
        <div className="grid grid-cols-3" style={{ gap }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <span key={d} className="flex flex-col items-center justify-center rounded-[5px]" style={{ height: h + (compact ? 2 : 8), background: key, color: fg, boxShadow: '0 1px 0 rgba(0,0,0,.3)' }}>
              <span style={{ fontSize: fs + 4, lineHeight: 1 }}>{d}</span>
              {kind !== 'decimal' && <span style={{ fontSize: compact ? 6 : 9, letterSpacing: 1.5, fontWeight: 600, opacity: sub[d] ? 1 : 0 }}>{sub[d] ?? '-'}</span>}
            </span>
          ))}
          <span className="grid place-items-center" style={{ height: h + (compact ? 2 : 8), color: fg, fontSize: fs + (kind === 'decimal' ? 6 : 0) }}>
            {bottomLeft}
          </span>
          <span className="grid place-items-center rounded-[5px]" style={{ height: h + (compact ? 2 : 8), background: key, color: fg, fontSize: fs + 4, boxShadow: '0 1px 0 rgba(0,0,0,.3)' }}>
            0
          </span>
          <span className="grid place-items-center" style={{ height: h + (compact ? 2 : 8), color: fg }}>
            <Delete size={compact ? 16 : 22} />
          </span>
        </div>
      </div>
    );
  }

  const bottom =
    kind === 'email' ? (
      <>
        <K f w={1.4}>123</K>
        <K w={4}>space</K>
        <K w={1}>@</K>
        <K w={1}>.</K>
        <K f w={1.8}>return</K>
      </>
    ) : kind === 'url' ? (
      <>
        <K f w={1.4}>123</K>
        <K w={1}>/</K>
        <K w={1.6}>.com</K>
        <K w={1}>.</K>
        <K f w={1.8}>go</K>
      </>
    ) : (
      <>
        <K f w={1.4}>123</K>
        <K f w={1.1}>{kind === 'password' ? <Globe size={compact ? 12 : 18} /> : <Smile size={compact ? 12 : 18} />}</K>
        <K w={5}>space</K>
        <K f w={1.8}>return</K>
      </>
    );

  return (
    <div aria-hidden className="select-none" style={{ background: bg, padding: gap, paddingBottom: gap * 2.5 }}>
      <div className="mb-1 flex items-center justify-around" style={{ height: compact ? 20 : 30, color: fg, fontSize: compact ? 11 : 15 }}>
        {kind === 'password' ? (
          <span className="flex items-center gap-1.5 opacity-80">
            <KeyRound size={compact ? 11 : 15} /> Passwords
          </span>
        ) : kind === 'email' ? (
          <>
            <span>@gmail.com</span>
            <span className="opacity-30">|</span>
            <span>@icloud.com</span>
          </>
        ) : (
          <>
            <span>&quot;the&quot;</span>
            <span className="opacity-30">|</span>
            <span>I</span>
            <span className="opacity-30">|</span>
            <span>and</span>
          </>
        )}
      </div>
      <div className="flex flex-col" style={{ gap: gap * 1.6 }}>
        {row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'])}
        {row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], compact ? 10 : 16)}
        <div className="flex" style={{ gap }}>
          <K f w={1.4}>
            <ArrowBigUp size={compact ? 13 : 20} fill={capsHint ? 'currentColor' : 'none'} />
          </K>
          {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((k) => (
            <K key={k}>{capsHint ? k.toUpperCase() : k}</K>
          ))}
          <K f w={1.4}>
            <Delete size={compact ? 13 : 20} />
          </K>
        </div>
        <div className="flex" style={{ gap }}>
          {bottom}
        </div>
      </div>
    </div>
  );
}
