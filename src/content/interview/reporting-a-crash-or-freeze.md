---
question: What do you include when you report a crash or a freeze?
short: The exact build, device and OS, the steps and how often it happens, what the user sees (crash, freeze, ANR dialog or white screen), the time it happened, and the evidence, such as the relevant part of the log or stack trace, a link to the crash in the crash reporting tool, and a screen recording.
category: bugs
level: mid
lookingFor: Knowing the difference between a crash, a freeze/ANR and a blank screen, which evidence developers need, where to find it on mobile and web, and how to keep the report focused.
pitfalls:
  - Writing only "the app crashed".
  - Pasting a huge log with no hint where the error is.
  - Forgetting the build number and the exact time, which are needed to find the crash in logs.
  - Not checking whether the crash is already known in the crash reporting tool.
order: 7
---

**First, describe exactly what happened.** "Crash" means different things to different people:

- **Crash:** the app closes and you're back on the home screen.
- **Freeze:** the app stops responding. On Android, if the main thread is blocked for about 5 seconds, the system shows an "App isn't responding" (**ANR**) dialog. On iOS, the system can terminate an app that hangs for too long.
- **Blank or white screen:** the app or page is open but shows nothing. On the web this is often a JavaScript error.

**What goes into the report**

- **Title:** where and when. "Order history: app crashes when opening an order with 50+ items."
- **Environment:** app build and version, device model, OS version, environment (staging or production), account.
- **Steps and frequency:** "3 out of 3 tries" or "1 in 10".
- **Exact time** it happened, with time zone, so the developer can find it in logs.
- **Evidence:**
  - **Mobile:** the stack trace from `adb logcat` (look for `FATAL EXCEPTION`) or the crash report from the iPhone or Xcode, plus a link to the crash in **Crashlytics** or Sentry if the app uses one.
  - **Web:** the console error with its stack trace, and the failing request from the Network tab.
  - A **screen recording** showing the steps and the crash.
- **Only the relevant log lines in the description,** with the full log attached.

**Useful extras:** Does it happen on the previous build? On the other platform? After a fresh install? With another account? Each answer helps the developer narrow it down.

Crashes usually get **high severity**, since the user loses their work and can't continue.

Learn more: [adb Basics](/mobile/adb-basics)
