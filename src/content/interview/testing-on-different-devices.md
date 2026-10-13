---
question: How do you decide which devices to test on, and when do you use emulators, simulators or real devices?
short: Choose devices based on real user analytics and risk, use emulators and simulators for fast early checks, and use real devices for hardware, performance and final verification.
category: mobile
level: mid
lookingFor: A data-driven device matrix, an honest comparison of emulators/simulators vs real devices, and awareness of fragmentation and cloud device farms.
pitfalls:
  - Saying you only test on your own phone.
  - Claiming emulators are just as good as real devices for everything.
  - Trying to test on every possible device instead of prioritizing.
order: 2
---

You cannot test on every device, so you build a **device matrix** based on data and risk.

**Choosing devices:**

- Use **analytics** to see the top devices, OS versions and screen sizes your users actually have.
- Cover the **extremes:** smallest and largest screens, oldest supported OS, newest OS (and betas), a low-end Android with little memory.
- Include key **manufacturers** (Samsung, Pixel, Xiaomi...) because of Android **fragmentation**.
- Add tablets if the app supports them.

**Emulators, simulators and real devices:**

| | Emulator / Simulator | Real device |
| --- | --- | --- |
| Cost and speed | Free, fast to switch models | Costly, need maintenance |
| Good for | Layouts, flows, early checks, many screen sizes | Performance, camera, GPS, biometrics, push, battery, real networks |
| Limitations | Not real performance or sensors, no manufacturer quirks | Limited number available |

The Android Emulator imitates hardware and OS; the iOS Simulator only imitates the software, so it is even less like a real iPhone.

**A practical approach:** develop and do early checks on emulators and simulators, run the main tests on a set of real devices in the office, and use a **cloud device farm** (such as BrowserStack or Firebase Test Lab) for wider coverage. Always confirm release-critical flows, like payments and login, on real devices.

Learn more: [Device Fragmentation](/mobile/device-fragmentation)
