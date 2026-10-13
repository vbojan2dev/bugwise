import { useState, type ReactNode } from 'react';
import { Camera, Check, Clock, FileText, Folder, Image as ImageIcon, Menu, MoreVertical, Paperclip, Search, Send, Users, X } from 'lucide-react';
import { FileIcon, FileName } from './parts';

function Demo({ title, platform, note, children, bg = '#f2f2f7' }: { title: string; platform: string; note: string; children: ReactNode; bg?: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-h-44 place-items-center px-4 py-6" style={{ background: bg, color: '#1f2328', colorScheme: 'light' }}>
        <div className="w-full max-w-[19rem] min-w-0">{children}</div>
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

function NativeInput() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="rounded-xl bg-white p-3 text-[13px] shadow-sm">
      <label htmlFor="fu-native" className="mb-1.5 block font-semibold">
        Attach invoices (PDF)
      </label>
      <input
        id="fu-native"
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={(e) => setNames([...(e.target.files ?? [])].map((f) => `${f.name} · ${Math.max(1, Math.round(f.size / 1024))} KB`))}
        className="block w-full min-w-0 text-[12px] file:mr-2 file:rounded-md file:border file:border-[#d0d7de] file:bg-[#f6f8fa] file:px-2 file:py-1"
      />
      {names.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-[#57606a]">
          {names.map((n) => (
            <li key={n} className="truncate">
              {n}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-[10px] text-[#57606a]">Try it: the dialog filters to PDFs, but "All files" is one click away.</p>
    </div>
  );
}

function SingleField() {
  const [file, setFile] = useState(false);
  return (
    <div className="rounded-xl bg-white p-3 text-[13px] shadow-sm">
      <p className="font-semibold">CV / Résumé</p>
      <p className="text-[11px] text-[#57606a]">PDF or DOCX, max 5 MB</p>
      {file ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d0d7de] px-2 py-1.5">
          <FileIcon name="cv.pdf" size={18} />
          <FileName name="Ana_Novak_CV_2026_Product_Designer.pdf" className="flex-1 text-[12px]" />
          <button type="button" onClick={() => setFile(false)} className="shrink-0 text-[12px] font-medium text-[#2563eb]">
            Replace
          </button>
          <button type="button" onClick={() => setFile(false)} aria-label="Remove Ana_Novak_CV_2026_Product_Designer.pdf" className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-black/5">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setFile(true)} className="mt-2 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-[12px] font-medium">
          Upload file
        </button>
      )}
    </div>
  );
}

function ChatAttach() {
  const [att, setAtt] = useState<string[]>(['Boarding pass.pdf']);
  const more = ['Itinerary_Lisbon_Oct.pdf', 'Visa application form final.docx', 'Hotel.pdf'];
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="space-y-1 px-3 pt-3">
        <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#007aff] px-3 py-1.5 text-[12px] text-white">Here are the documents for the trip</p>
      </div>
      {att.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-2">
          {att.map((a, i) => (
            <span key={`${a}-${i}`} className="flex max-w-[9rem] shrink-0 items-center gap-1 rounded-lg bg-[#f2f2f7] py-1 pr-1 pl-2 text-[11px]">
              <FileIcon name={a} size={13} />
              <span className="min-w-0 truncate">{a}</span>
              <button type="button" aria-label={`Remove ${a}`} onClick={() => setAtt((l) => l.filter((_, j) => j !== i))} className="grid size-6 shrink-0 place-items-center rounded-full">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          aria-label="Attach a file"
          onClick={() => setAtt((l) => (l.length >= 4 ? l : [...l, more[(l.length + 2) % more.length]]))}
          className="grid size-9 shrink-0 place-items-center rounded-full text-[#007aff] hover:bg-black/5"
        >
          <Paperclip size={18} />
        </button>
        <span className="min-w-0 flex-1 rounded-full border border-[#d1d1d6] px-3 py-1.5 text-[12px] text-[#8e8e93]">Message</span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#007aff] text-white" aria-hidden="true">
          <Send size={14} />
        </span>
      </div>
    </div>
  );
}

const iosDocs = ['Tax return 2025.pdf', 'Payslip_Sept.pdf', 'Budget.xlsx', 'Contract.docx', 'Scan 14 Oct.pdf', 'Notes.csv'];

function IOSPicker() {
  const [sel, setSel] = useState<number[]>([1]);
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f2f2f7] text-black shadow-sm">
      <div className="flex items-center justify-between px-3 pt-2.5 text-[13px]">
        <span className="text-[#007aff]">Cancel</span>
        <span className="font-semibold">Recents</span>
        <span className={sel.length ? 'font-semibold text-[#007aff]' : 'text-[#c7c7cc]'}>Open</span>
      </div>
      <div className="mx-3 mt-2 flex items-center gap-1 rounded-lg bg-[#e3e3e8] px-2 py-1 text-[12px] text-[#8e8e93]">
        <Search size={12} /> Search
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 py-3">
        {iosDocs.map((d, i) => {
          const on = sel.includes(i);
          return (
            <button key={d} type="button" aria-pressed={on} onClick={() => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))} className="flex min-w-0 flex-col items-center gap-1">
              <span className="relative grid h-12 w-10 place-items-center rounded-md bg-white shadow-sm">
                <FileIcon name={d} size={18} />
                {on && (
                  <span className="absolute -right-1.5 -bottom-1.5 grid size-4 place-items-center rounded-full bg-[#007aff] text-white ring-2 ring-[#f2f2f7]">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="line-clamp-2 w-full text-center text-[9px] leading-tight">{d}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-around border-t border-black/10 bg-white/80 py-1.5 text-[9px] text-[#8e8e93]">
        <span className="flex flex-col items-center text-[#007aff]">
          <Clock size={15} /> Recents
        </span>
        <span className="flex flex-col items-center">
          <Users size={15} /> Shared
        </span>
        <span className="flex flex-col items-center">
          <Folder size={15} /> Browse
        </span>
      </div>
    </div>
  );
}

const androidDocs = [
  { n: 'Boarding_pass_LH1234.pdf', m: '182 kB · Oct 14' },
  { n: 'Rental agreement.docx', m: '1.1 MB · Oct 2' },
  { n: 'statement_2026_09.csv', m: '24 kB · Sep 30' },
  { n: 'Photos backup.zip', m: '310 MB · Sep 12' },
];

function AndroidPicker() {
  const [sel, setSel] = useState<number[]>([]);
  return (
    <div className="overflow-hidden rounded-2xl bg-[#fef7ff] text-[#1d1b20] shadow-sm">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {sel.length ? (
          <button type="button" aria-label="Clear selection" onClick={() => setSel([])} className="-m-1 grid size-7 place-items-center rounded-full">
            <X size={18} />
          </button>
        ) : (
          <Menu size={18} />
        )}
        <span className="flex-1 text-[15px]">{sel.length ? `${sel.length} selected` : 'Recent'}</span>
        {sel.length ? <span className="text-[13px] font-medium text-[#6750a4]">Select</span> : <Search size={17} />}
        <MoreVertical size={17} />
      </div>
      <div className="flex gap-1.5 px-3 pb-2">
        {['Images', 'Documents', 'Audio'].map((c) => (
          <span key={c} className={`rounded-lg border px-2 py-0.5 text-[10px] ${c === 'Documents' ? 'border-transparent bg-[#e8def8]' : 'border-[#79747e]'}`}>
            {c}
          </span>
        ))}
      </div>
      <ul className="bg-white">
        {androidDocs.map((d, i) => {
          const on = sel.includes(i);
          return (
            <li key={d.n}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
                className={`flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left ${on ? 'bg-[#e8def8]' : ''}`}
              >
                {on ? (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#6750a4] text-white">
                    <Check size={13} />
                  </span>
                ) : (
                  <FileIcon name={d.n} size={22} />
                )}
                <span className="min-w-0 flex-1">
                  <FileName name={d.n} className="text-[12px]" />
                  <span className="block text-[10px] text-[#49454f]">{d.m}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SafariMenu() {
  return (
    <div className="relative rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[12px] font-semibold">Upload your ID document</p>
      <span className="mt-1.5 inline-block rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-[12px]">Choose File</span>
      <div className="mt-2 ml-auto w-48 overflow-hidden rounded-xl bg-[#f2f2f7]/95 text-[12px] shadow-xl ring-1 ring-black/5">
        {[
          ['Photo Library', ImageIcon],
          ['Take Photo or Video', Camera],
          ['Choose File', FileText],
        ].map(([l, Icon]) => {
          const I = Icon as typeof Camera;
          return (
            <div key={l as string} className="flex items-center justify-between border-b border-black/10 px-3 py-2 last:border-0">
              {l as string} <I size={14} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">Most of these respond to taps. The first one is a real browser file input: try it with files from your own device.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo title="Native file input" platform="Web" note="<input type=&quot;file&quot;> with accept and multiple. Looks different in every browser, but keyboard and screen reader support come for free.">
          <NativeInput />
        </Demo>
        <Demo title="Single file field" platform="Web · Forms" note="One file only, for a CV or an ID. After picking, the file shows with Replace and Remove instead of the button.">
          <SingleField />
        </Demo>
        <Demo title="Attachment in a composer" platform="iOS · Android · Web" note="A paperclip in chat or email. Attachments appear as removable chips. Icon-only, so it needs an accessible name.">
          <ChatAttach />
        </Demo>
        <Demo title="Mobile browser file input" platform="iOS Safari" note="On phones the same <input type=&quot;file&quot;> opens a menu: photos, camera or files. The accept list changes which options appear.">
          <SafariMenu />
        </Demo>
        <Demo title="Document picker (Files)" platform="iOS" note="The system picker for documents. Apps get only the files the user picks, so no permission prompt is needed. Tap files to select them.">
          <IOSPicker />
        </Demo>
        <Demo title="Document picker (Storage Access Framework)" platform="Android" note="The system 'Open from' picker. Also covers Google Drive and other providers. Tap files to select several.">
          <AndroidPicker />
        </Demo>
      </div>
    </div>
  );
}

