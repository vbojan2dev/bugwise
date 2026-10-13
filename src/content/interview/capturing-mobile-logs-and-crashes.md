---
question: How do you capture logs and crash evidence on Android and iOS?
short: On Android, use adb logcat and the crash stack trace; on iOS, use the Console app or Xcode device logs and the crash reports in Settings. Always add a screen recording and the build number.
category: mobile
level: mid
lookingFor: Practical, tool-specific knowledge for both platforms, and an understanding of which evidence helps developers fix a crash fast.
pitfalls:
  - Reporting "the app crashed" with no steps, build number or logs.
  - Not knowing any way to get logs from a device.
  - Attaching a huge unfiltered log without pointing to the relevant part.
order: 13
---

Good evidence turns "it crashed" into a bug a developer can fix in minutes.

**Android**

- Connect the device and run `adb logcat`. Clear it first (`adb logcat -c`), reproduce, then save the output.
- Look for `FATAL EXCEPTION` and the stack trace below it; that is what the developer needs.
- `adb shell screenrecord` or the built-in screen recorder for video; `adb bugreport` for a full report.
- Android Studio's Logcat window lets you filter by app.

**iOS**

- Connect the iPhone to a Mac and open the **Console** app (or Xcode > Devices and Simulators) to stream logs and view crash logs.
- On the device: **Settings > Privacy & Security > Analytics & Improvements > Analytics Data** holds crash files you can share.
- TestFlight crash feedback is also sent to the team.
- Screen recording from Control Center.

**Both**

- Crash reporting tools like **Firebase Crashlytics** or Sentry: I find the crash there and link it in the ticket.
- Always include the **build number, device, OS version, exact time** of the crash and steps.
- Paste only the relevant part of the log, and attach the full file.

Learn more: [adb Basics](/mobile/adb-basics)
