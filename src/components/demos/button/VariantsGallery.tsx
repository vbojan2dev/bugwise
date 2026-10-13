import { useState, type ReactNode } from 'react';
import { Heart, Moon, Pencil, Plus, Search, Share2, ShoppingBag, Sun, Trash2, X } from 'lucide-react';
import { Button, type Platform } from './Button';

function Demo({ title, platform, note, dark, children }: { title: string; platform: string; note: string; dark: boolean; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-36 place-items-center px-5 py-7" style={{ background: dark ? '#000' : '#f2f2f7' }}>
        <div className="flex w-full max-w-[19rem] flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
      <figcaption className="border-t border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{title}</p>
          <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">{platform}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

const platformNames: Record<Platform, string> = { ios: 'iOS', material: 'Android', web: 'Web' };
const emphasisNames: Record<Platform, { filled: string; tonal: string; outlined: string; text: string }> = {
  ios: { filled: 'Filled', tonal: 'Tinted', outlined: 'Outline (custom)', text: 'Plain' },
  material: { filled: 'Filled', tonal: 'Filled tonal', outlined: 'Outlined', text: 'Text' },
  web: { filled: 'Primary', tonal: 'Soft', outlined: 'Secondary', text: 'Link-style' },
};

function Fab({ dark, extended }: { dark: boolean; extended?: boolean }) {
  const bg = dark ? '#4f378b' : '#eaddff';
  const fg = dark ? '#eaddff' : '#21005d';
  return (
    <button
      type="button"
      aria-label={extended ? undefined : 'New order'}
      className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl font-medium shadow-[0_3px_6px_rgba(0,0,0,.25)] focus-visible:outline-3 focus-visible:outline-offset-2"
      style={{ background: bg, color: fg, width: extended ? undefined : 56, padding: extended ? '0 20px 0 16px' : 0, outlineColor: dark ? '#ccc2dc' : '#625b71' }}
    >
      <span aria-hidden="true" className="absolute inset-0 bg-current opacity-0 group-hover:opacity-[.08] group-active:opacity-[.12]" />
      <Plus size={24} aria-hidden="true" className="relative" />
      {extended && <span className="relative text-[15px]">New order</span>}
    </button>
  );
}

function StickyCta({ platform, dark }: { platform: Platform; dark: boolean }) {
  const fg = dark ? '#fff' : '#000';
  const sub = dark ? 'rgba(235,235,245,.6)' : 'rgba(60,60,67,.6)';
  return (
    <div className="w-full overflow-hidden rounded-2xl border" style={{ background: dark ? '#1c1c1e' : '#fff', borderColor: dark ? '#38383a' : '#e5e5ea', color: fg }}>
      <div className="space-y-1.5 px-3 pt-3 pb-2">
        <div className="h-16 rounded-lg" style={{ background: dark ? '#2c2c2e' : '#f2f2f7' }} />
        <p className="text-[13px] font-semibold">Trail running shoes</p>
        <p className="text-[11px]" style={{ color: sub }}>
          Size 42 · Ocean blue
        </p>
      </div>
      <div className="flex items-center gap-3 border-t px-3 py-2.5" style={{ borderColor: dark ? '#38383a' : '#e5e5ea' }}>
        <div className="min-w-0">
          <p className="text-[10px]" style={{ color: sub }}>
            Total
          </p>
          <p className="text-[14px] font-bold">€89.90</p>
        </div>
        <Button platform={platform} dark={dark} label="Add to basket" icon={ShoppingBag} size="md" fullWidth className="flex-1" style={{ minWidth: 0 }} />
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  const [dark, setDark] = useState(false);
  const [platform, setPlatform] = useState<Platform>('ios');
  const [liked, setLiked] = useState(false);
  const names = emphasisNames[platform];
  const p = { platform, dark };

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Platform" className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1 text-sm font-medium">
          {(['ios', 'material', 'web'] as Platform[]).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={platform === v}
              onClick={() => setPlatform(v)}
              className={`rounded-md px-3 py-1.5 ${platform === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {platformNames[v]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">Pick a platform, then hover, press and Tab through the buttons. They all respond.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title={`Primary · ${names.filled}`} platform="High emphasis" dark={dark} note="The single most important action on the screen: Pay, Place order, Continue. Usually one per screen.">
          <Button {...p} emphasis="filled" label="Place order" />
        </Demo>
        <Demo title={`Secondary · ${names.tonal}`} platform="Medium emphasis" dark={dark} note="Important, but not the main path: Save for later, Add another item. Softer fill, same shape.">
          <Button {...p} emphasis="tonal" label="Save for later" />
        </Demo>
        <Demo title={`Secondary · ${names.outlined}`} platform="Medium emphasis" dark={dark} note="Outline only. Common on the web for Cancel or Back next to a primary button.">
          <Button {...p} emphasis="outlined" label="Cancel" />
        </Demo>
        <Demo title={`Tertiary · ${names.text}`} platform="Low emphasis" dark={dark} note="Text only: Skip, Learn more, Forgot password? It still needs a full-size touch target, even without a visible shape.">
          <Button {...p} emphasis="text" label="Skip for now" />
        </Demo>
        <Demo title="Destructive" platform="All" dark={dark} note="Red for actions that delete or can't be undone. It should almost always lead to a confirmation or an Undo.">
          <Button {...p} emphasis="destructive" label="Delete account" icon={Trash2} />
          <Button {...p} emphasis="text" label="Remove" style={{ color: dark ? '#ff6b6b' : '#d70015' }} />
        </Demo>
        <Demo title="Icon buttons" platform="All" dark={dark} note="Save space in toolbars. Each one needs an accessible name, or a screen reader just says 'button'.">
          <Button {...p} emphasis="text" iconOnly icon={Search} a11y="Search" />
          <Button {...p} emphasis="tonal" iconOnly icon={Share2} a11y="Share" />
          <Button {...p} emphasis="outlined" iconOnly icon={Pencil} a11y="Edit" />
          <button
            type="button"
            aria-pressed={liked}
            aria-label="Add to favorites"
            onClick={() => setLiked((l) => !l)}
            className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: liked ? '#ff2d55' : dark ? '#8e8e93' : '#6b6b70', outlineColor: '#007aff' }}
          >
            <Heart size={22} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </Demo>
        <Demo title="Sizes" platform={platformNames[platform]} dark={dark} note="Small, medium and large. Small buttons still need a 44 pt / 48 dp touch target around them.">
          <Button {...p} size="sm" label="Small" />
          <Button {...p} size="md" label="Medium" />
          <Button {...p} size="lg" label="Large" />
        </Demo>
        <Demo title="Floating action button (FAB)" platform="Android · Material 3" dark={dark} note="Floats above content for the screen's main action, like New order or Compose. iOS has no FAB; it uses a toolbar button instead.">
          <Fab dark={dark} />
          <Fab dark={dark} extended />
        </Demo>
        <Demo title="Sticky / floating CTA" platform="All" dark={dark} note="A call-to-action pinned to the bottom of the screen. Check it never hides content, the keyboard, or the home indicator.">
          <StickyCta platform={platform} dark={dark} />
        </Demo>
        <Demo title="Button pair" platform={platformNames[platform]} dark={dark} note="Primary + secondary side by side. Check the order follows the platform (web dialogs often put the primary on the right).">
          <Button {...p} emphasis="outlined" label="Cancel" icon={X} />
          <Button {...p} emphasis="filled" label="Save changes" />
        </Demo>
      </div>
    </div>
  );
}
