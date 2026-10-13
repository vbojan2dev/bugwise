import type { ReactNode } from 'react';
import { IOSCompact, IOSInline, IOSWheels, MaterialDocked, MaterialModal, MaterialTime, WebNative, WebRange } from './Pickers';

function Demo({ title, platform, note, bg = '#f2f2f7', children }: { title: string; platform: string; note: string; bg?: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid flex-1 place-items-center px-3 py-6 sm:px-6" style={{ background: bg }}>
        <div className="w-full max-w-[20rem]">{children}</div>
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

export default function VariantsGallery() {
  return (
    <div className="not-prose my-8">
      <p className="mb-4 text-sm text-muted">
        Every picker below works. Tap, scroll the wheels, type into the fields, and try the keyboard (Tab, then arrow keys inside a calendar). The simulated "today" is Monday, October 12, 2026.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Inline calendar" platform="iOS" note="The calendar is always visible inside the screen. Today is shown in blue text; the selected day gets a tinted circle. Good when the date is the main task.">
          <IOSInline />
        </Demo>
        <Demo title="Compact (pill) picker" platform="iOS" note="A small grey pill in a form row. Tapping it opens a calendar or time wheels in a popover. Past dates are disabled here.">
          <IOSCompact />
        </Demo>
        <Demo title="Wheel picker" platform="iOS" note="Scrolling wheels for month, day and year. Choose February 2027: days 29–31 turn grey and the wheel snaps back to the last real day.">
          <IOSWheels />
        </Demo>
        <Demo title="Docked date picker" platform="Android · Material 3" bg="#fef7ff" note="A text field with a calendar that drops down below it. You can type (MM/DD/YYYY) or tap. Try typing 02/30/2027.">
          <MaterialDocked />
        </Demo>
        <Demo title="Modal date picker" platform="Android · Material 3" note="Opens as a dialog. The headline shows the choice; the pencil switches to typing. Nothing is saved until OK, and Cancel must throw the change away.">
          <MaterialModal />
        </Demo>
        <Demo title="Time picker (dial / input)" platform="Android · Material 3" note="Pick the hour on a clock face, then the minutes. The keyboard icon switches to two text fields, which is faster and more accessible.">
          <MaterialTime />
        </Demo>
        <Demo title="Native date & time inputs" platform="Web" note={`<input type="date"> uses the browser's own picker, so it looks different in Chrome, Safari and Firefox. The display follows the browser's language, but the value is always YYYY-MM-DD.`}>
          <WebNative />
        </Demo>
        <Demo title="Date range picker" platform="Web" note="Travel and hotel sites pick check-in and check-out in one calendar. Tapping a date before check-in makes it the new check-in. The night count is the difference in days.">
          <WebRange />
        </Demo>
      </div>
    </div>
  );
}
