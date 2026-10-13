---
question: What do you check when testing app installation and upgrades?
short: Fresh install, upgrade from older versions with real user data, uninstall and reinstall, and edge cases like low storage or interrupted downloads. Upgrades are where data loss bugs hide.
category: mobile
level: mid
lookingFor: Understanding that upgrade testing from previous production versions matters more than fresh installs, with concrete checks for data migration, sessions and settings.
pitfalls:
  - Only testing fresh installs of the new build.
  - Upgrading from an empty app with no data, which hides migration bugs.
  - Skipping versions (users often jump from a version several releases old).
order: 8
---

Most users don't install the app fresh; they **update** it. So upgrade testing is critical.

**Fresh install**

- Installs from the store or test channel, opens without crashing.
- Onboarding, permission prompts and default settings are correct.
- Works on the oldest supported OS version.

**Upgrade (the important part)**

1. Install the **current production version**.
2. Use it like a real user: log in, create data, change settings, save drafts, download offline content.
3. Upgrade to the new build without uninstalling.
4. Check: still logged in (or asked nicely to log in), data and settings kept, database migration worked, no crash on first launch.
5. Repeat from an **older version** (for example two or three releases back), because users skip updates.

**Uninstall and reinstall**

- Local data is gone, but server data comes back after login.
- On iOS, Keychain data can survive uninstall; check the app doesn't log in as the old user unexpectedly.

**Edge cases**

- Low storage, download interrupted, forced update screen when the version is too old.

On Android, `adb install -r` upgrades a build in place, which makes this quick.

Learn more: [Install, Update and Uninstall](/mobile/install-update-uninstall)
