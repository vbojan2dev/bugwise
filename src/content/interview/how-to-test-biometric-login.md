---
question: How would you test login with biometrics (Face ID or fingerprint) in a mobile app?
short: Test enrolling and using biometrics, failed and canceled scans, the fallback to passcode or password, changes to enrolled biometrics in device settings, permission and lockout, and that it is truly optional and secure.
category: practical
level: mid
lookingFor: Coverage of setup, success, failure, fallback, device settings changes and security, plus knowing that real devices are needed for most of it.
pitfalls:
  - Only testing a successful scan.
  - Forgetting the fallback when biometrics fail or are unavailable.
  - Not testing what happens when a new fingerprint or face is added on the device.
order: 7
---

I'd ask: how does the user enable biometric login? What is the fallback? What happens after several failures?

**Setup**

- Offered after a normal login; can be enabled and disabled in app settings.
- iOS asks for Face ID permission (with a clear reason); declining is handled.
- Device without biometrics enrolled: option hidden or explains what to do.

**Using it**

- Successful scan logs in quickly to the right account.
- **Failed scan** (wrong finger, covered face): retry allowed.
- **Too many failures:** the system locks biometrics and asks for device passcode, or the app falls back to its own password.
- **Cancel** the prompt: user can log in with password instead.

**Changes on the device**

- New fingerprint or face added in system settings: the app should require the password again before trusting biometrics (a security expectation).
- Biometrics turned off in settings, permission revoked, device passcode removed.

**Security and session**

- Logout, password change on another device, or account blocked: biometrics no longer log in.
- No sensitive data visible in the app switcher before authentication.

**Platform**

- Face ID vs Touch ID on iPhones; fingerprint, face unlock and "weak vs strong" biometrics on Android.
- Real devices needed; simulators can only fake a match or no-match.

Learn more: [Biometric Login](/features/biometric-login)
