---
question: What kinds of bugs happen when a mobile app goes to the background and comes back?
short: Lost state, stale data, crashes after the OS kills the app, expired sessions and broken audio or timers. You test them by backgrounding the app for short and long periods and under memory pressure.
category: mobile
level: mid
lookingFor: Understanding that the OS can suspend or kill a backgrounded app, knowledge of typical bugs, and practical ways to reproduce them (long background, "Don't keep activities", low memory).
pitfalls:
  - Only pressing Home for two seconds and coming back.
  - Not knowing that the OS may kill the app process to free memory.
  - Ignoring what happens to data and sessions after a long time away.
order: 5
---

When the user leaves the app, it moves through lifecycle states: **active, background, suspended**, and sometimes **killed** by the OS to free memory. When the user returns, the app must restore itself correctly. Many bugs hide here.

**Typical bugs:**

- **Lost state:** the half-filled form is empty, the user is thrown back to the Home screen.
- **Crash on return** after the OS killed the process (the app tries to use data that no longer exists).
- **Stale data:** the inbox still shows old messages, prices are outdated.
- **Session problems:** the token expired in the background, and the next tap fails silently instead of asking to log in again.
- **Audio, timers, location:** music stops, a countdown jumps, location tracking stops or drains battery.

**How I test it:**

1. Background for a few seconds, then for 10+ minutes and overnight.
2. Open several heavy apps (camera, games) to create memory pressure.
3. On Android, enable **Developer options > Don't keep activities** to force the worst case.
4. Change things while away: rotate, switch language, dark mode, revoke a permission, log out on another device.
5. Return via the app icon, the app switcher, and a notification.

Learn more: [Background and Foreground](/mobile/background-and-foreground)
