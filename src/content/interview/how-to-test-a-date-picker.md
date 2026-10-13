---
question: How would you test a date picker?
short: Check valid and invalid dates, boundaries like min/max dates, leap years and month ends, typing vs picking, time zones and locale formats, ranges, and keyboard and screen reader access on each platform.
category: practical
level: mid
lookingFor: Strong boundary and edge-case thinking around dates (leap years, time zones, formats), plus UI, platform and accessibility checks.
pitfalls:
  - Only picking today's date.
  - Forgetting time zones and locale formats.
  - Ignoring that iOS, Android and web browsers show very different native pickers.
order: 6
---

I'd ask first: what is the date for (birthday, booking, deadline)? Are there min and max dates? Can the user type the date? Is a time included?

**Valid and invalid values**

- Today, past and future dates, according to the rules (no booking in the past, must be 18+).
- **Boundaries:** exactly the min and max date, one day before and after.
- **Calendar edge cases:** 29 February in leap and non-leap years, 31st of short months, 31 December to 1 January.
- Typed input: wrong formats, letters, partial dates, pasting.

**Ranges (check-in / check-out)**

- End before start is blocked; same-day ranges follow the rules.
- Changing the start date updates or validates the end date.

**Locale and time zone**

- Date format follows the locale (12/03 vs 03/12), first day of week (Sunday vs Monday).
- A date selected late at night isn't saved as the previous or next day on the server because of time zone conversion. Test with the device in a different time zone.
- Daylight saving changes, if time is involved.

**UI and platform**

- Native pickers differ: iOS wheels or calendar, Android calendar dialog, browser date inputs (Safari behaves differently).
- Clear and cancel work; selected date is shown correctly after reopening.
- Keyboard navigation, screen reader announces the date, large text.

Learn more: [Date & Time Picker](/components/date-picker)
