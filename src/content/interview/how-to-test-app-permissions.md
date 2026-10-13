---
question: How do you test app permissions like camera, location or contacts?
short: Test every answer the user can give (allow, allow once, deny, deny permanently), changing the permission later in Settings, and that the app explains why it needs it and still works without it.
category: mobile
level: junior
lookingFor: Knowledge of the permission states on iOS and Android, testing the "denied" paths, revoking in Settings, and checking the app asks at the right moment with a clear reason.
pitfalls:
  - Only testing the "Allow" path.
  - Forgetting that permissions can be changed later in system Settings while the app is running.
  - Not resetting permissions between test runs, so the system dialog never appears again.
order: 7
---

Permissions are a classic source of crashes and dead ends, because the user can say no.

**What I check:**

1. **Timing and reason:** the app asks when the feature is used (tapping "Scan QR"), not on first launch for everything. A short explanation says why.
2. **Every answer:**
   - **Allow** / **Allow while using the app**.
   - **Allow once** (iOS and Android 11+): works now, asks again next time.
   - **Precise vs approximate location.**
   - **Deny:** the app keeps working and shows a helpful message.
   - **Deny permanently** (iOS after the first deny, Android after two denies): the app offers a button to open Settings instead of a dead button.
3. **Change it later:** grant or revoke in system Settings while the app is in the background, then return. No crash, the feature updates.
4. **Limited access:** iOS "Selected photos" only.
5. **Upgrades:** permissions survive an app update.

**Resetting between tests:** reinstall the app, or use Settings > Apps > Permissions. On Android, `adb shell pm reset-permissions` or `pm revoke` is fast.

**Example bug:** after denying camera access, the Scan button shows a black screen forever instead of explaining what to do.

Learn more: [App Permissions](/features/app-permissions)
