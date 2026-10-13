---
question: Right after a release, your app gets a wave of 1-star reviews. What do you do in the first hour?
short: Confirm and size the problem using reviews, crash reports and analytics, try to reproduce it on the affected version and devices, raise an incident with clear facts, and help the team decide quickly whether to halt the rollout, flip a flag, or hotfix. The root cause analysis comes later.
category: process
level: senior
lookingFor: A calm, structured first response, fast use of real data (crash tools, store consoles, logs), narrowing down the affected users, clear communication, and knowing the levers available (halting a rollout, feature flags, server fixes, hotfix).
pitfalls:
  - Panicking or trying to fix it alone without telling anyone.
  - Spending the first hour writing a perfect bug report.
  - Assuming the reviews are about the new release without checking versions.
  - Forgetting to keep support and the people replying to reviews informed.
order: 11
---

My goal in the first hour is to turn "people are angry" into **facts the team can act on**.

**Minutes 0-15: confirm and size it**

- **Read the reviews:** what do they have in common? Crash on launch, can't log in, payment fails, a feature removed?
- **Check the version:** are the reviews from the new version? Store consoles show the app version for many reviews.
- **Check the data:** crash reporting (for example Crashlytics or Sentry), Android vitals in Google Play Console, App Store Connect crash data, backend error dashboards, and support tickets.
- **Find the pattern:** one platform, OS version, device, country, language, or user type such as users who upgraded vs fresh installs.

**Minutes 15-35: reproduce**

- Install the **exact production version** on a matching device. If it's an upgrade issue, install the previous version first, create data, then update.
- Capture evidence: video, logs, the failing request. Even a partial reproduction ("only after upgrade, only with a saved card") helps a lot.

**Minutes 15-45, in parallel: raise the alarm**

I don't wait until I've reproduced it. I post in the incident or release channel with what we know: "Since release 4.2, 1-star reviews mention login failures. Crashlytics shows a new crash on Android 12 at login, about 8% of sessions on that version. Reproducing now." Then I keep updating that one thread.

**Minutes 30-60: help choose the fastest safe fix**

- **Halt the staged rollout** or pause the phased release, so fewer users get the bad version.
- **Turn off a feature flag** or fix it on the **server**, if the problem allows that.
- **Hotfix** if needed, and I start preparing the test plan for it.
- Make sure **support** and whoever answers store reviews have a short, accurate message.

**Afterwards:** reply to reviews once the fix is out, verify that the crash rate drops, and run a blameless review of why we missed it.

Learn more: [adb Basics](/mobile/adb-basics)
