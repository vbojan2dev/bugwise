---
question: What is TestFlight, and how do testers get mobile test builds?
short: TestFlight is Apple's service for installing beta builds on iPhones. On Android, testers usually get builds through Google Play testing tracks, Firebase App Distribution or a direct APK.
category: mobile
level: junior
lookingFor: Familiarity with the common distribution channels, and the habit of always checking which build and environment you are testing.
pitfalls:
  - Not knowing how a build gets onto a test device.
  - Reporting bugs without the exact build number.
  - Testing an old build because the app didn't update automatically.
order: 11
---

Mobile apps can't simply be "deployed to a URL" like websites, so teams use beta distribution tools.

**iOS: TestFlight**

- Developers upload a build to App Store Connect; testers get it through the **TestFlight app**.
- **Internal testers** (team members) get builds right away; **external testers** need a quick Apple beta review first.
- Builds expire after 90 days. Testers can send feedback and screenshots from inside TestFlight, and crash reports are collected.

**Android**

- **Google Play testing tracks:** internal, closed and open testing. Builds come through the normal Play Store.
- **Firebase App Distribution:** testers get an email or use the App Tester app; works for iOS too.
- **Direct APK** installed with adb, common for quick dev builds.

**Good habits as a tester**

- Always note the **version and build number** (for example 4.2.0 (318)) and the **environment** (dev, staging, production) in bug reports.
- After a fix, confirm the new build actually contains it before retesting.
- Keep older builds available for upgrade testing.

Learn more: [TestFlight and Firebase App Distribution](/mobile/beta-distribution)
