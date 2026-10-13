---
question: When would you choose an emulator or simulator, and when must you use a real device?
short: Use emulators and simulators for fast early checks, layouts and many screen sizes; switch to real devices for anything involving hardware, performance, push, biometrics, real networks or final sign-off.
category: mobile
level: junior
lookingFor: Clear decision rules with examples, rather than "real devices are always better" or "emulators are enough".
pitfalls:
  - Saying one option is always better.
  - Signing off a release that was only tested on simulators.
  - Not knowing the iOS Simulator does not emulate real hardware.
order: 9
---

I think of it as a question: **does this test depend on real hardware or real-world conditions?**

**I choose an emulator or simulator when:**

- A new feature has just landed and I want quick feedback on the flow.
- I need to check layouts on many screen sizes or OS versions quickly.
- I want to reproduce a bug on a specific OS version I don't have in the office.
- I need easy tools: screenshots, setting a fake GPS location, changing language, slow network profiles.

**I use a real device when testing:**

- **Camera, NFC, Bluetooth, sensors, biometrics** (Face ID, fingerprint).
- **Push notifications** and interruptions like real phone calls.
- **Performance, battery, heat and memory** on low-end devices.
- **Real networks:** switching Wi-Fi to 4G, weak signal in an elevator.
- **Manufacturer quirks**, like Samsung keyboards or aggressive battery savers.
- **Touch feel and gestures**, and the final **release sign-off**.

**Example:** I verify a new settings screen on three emulator sizes in ten minutes, then confirm the QR scanner and payment flow on a real iPhone and a low-end Samsung.

Learn more: [Simulators and Emulators](/mobile/simulators-and-emulators)
