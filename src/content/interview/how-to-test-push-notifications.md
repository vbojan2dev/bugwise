---
question: How would you test push notifications?
short: Check that notifications arrive with the right content in every app state (foreground, background, killed), open the correct screen when tapped, respect permission and settings, and handle edge cases like logout or many notifications at once.
category: mobile
level: junior
lookingFor: Coverage of app states, tap behavior/deep links, permission handling, content checks and edge cases, plus knowing that real devices are usually needed.
pitfalls:
  - Only checking that "a notification appears".
  - Forgetting to test with the app killed or after logout.
  - Testing only on a simulator where push may not behave like on a real device.
order: 6
---

I start by asking how notifications are triggered (an action in the app, a backend event, a marketing tool) and how I can send one on the test environment.

**Delivery and content**

- Arrives on time, with the correct title, text, image and badge count.
- Long text is truncated nicely; special characters and emoji display correctly.
- The right user gets it, and only once.

**App states**

- App in **foreground** (in-app banner or silent update?), **background**, and **killed**.
- Device locked: lock screen preview respects privacy settings.

**Tapping the notification**

- Opens the right screen (deep link), even from a killed state.
- Works if the user is logged out: login first, then the target screen.

**Permissions and settings**

- iOS asks permission; Android 13+ asks too, older Android grants by default.
- If permission is denied, the app does not keep nagging, and in-app settings toggles actually stop notifications.

**Edge cases**

- No notifications after logout or for a deleted account.
- Many notifications at once are grouped sensibly.
- Do Not Disturb, low network, app reinstalled (new push token).

I test on **real devices** because simulators and emulators do not always match real push behavior.

Learn more: [Push Notifications](/features/push-notifications)
