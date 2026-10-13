---
question: How do you test interruptions in a mobile app?
short: Trigger real-life interruptions (calls, notifications, alarms, low battery, network loss, switching apps) during important moments and check that the app pauses, recovers and keeps the user's data.
category: mobile
level: junior
lookingFor: A list of realistic interruption types, the idea of interrupting at critical moments, and clear expected results (state kept, no crash, no duplicate actions).
pitfalls:
  - Only mentioning phone calls.
  - Interrupting on an idle screen instead of during a critical action.
  - Not saying what the expected behavior is after returning.
order: 4
---

An interruption is anything that takes the user's attention or the system's resources away from the app. Users get interrupted all the time, so the app must cope.

**What I use to interrupt:**

- Incoming phone or video call (from a second phone).
- SMS, push notifications from other apps, alarms and timers.
- Low battery warning, battery saver turning on.
- Losing Wi-Fi or switching to mobile data, airplane mode.
- Pressing Home, opening the app switcher, locking the screen.
- Plugging in headphones or a charger, Bluetooth connecting.

**When I interrupt:** at the risky moments, not on a static screen. For example: while a video is playing, during a file upload, on the payment confirmation screen, while filling in a long form, or in the middle of a game level.

**What I expect afterwards:**

- No crash and no frozen screen.
- Form data and scroll position are kept.
- Media pauses and can resume.
- Ongoing actions finish or fail clearly; a payment is never charged twice.
- Timers and sessions behave sensibly after a long interruption.

**Example bug:** a call arrives while the checkout spinner is showing; after the call, the user taps Pay again and gets two orders.

Learn more: [Interruptions (Calls, SMS, Alarms)](/mobile/interruptions)
